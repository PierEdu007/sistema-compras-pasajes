import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RESEND_API_URL = 'https://api.resend.com/emails'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify the request is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify user is authenticated and has CONTADOR role
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: userRole } = await supabase
      .from('user_roles')
      .select('rol')
      .eq('user_id', user.id)
      .single()

    if (!userRole || userRole.rol !== 'CONTADOR') {
      return new Response(
        JSON.stringify({ error: 'Solo el contador puede emitir comprobantes' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse multipart form data
    const formData = await req.formData()
    const ventaId = formData.get('venta_id') as string
    const pdfFile = formData.get('comprobante') as File

    if (!ventaId || !pdfFile) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos: venta_id, comprobante (PDF)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Get the sale record
    const { data: venta, error: ventaError } = await supabase
      .from('ventas')
      .select('*')
      .eq('id', ventaId)
      .single()

    if (ventaError || !venta) {
      return new Response(
        JSON.stringify({ error: 'Venta no encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (venta.comprobante_emitido) {
      return new Response(
        JSON.stringify({ error: 'El comprobante ya fue emitido para esta venta' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Upload PDF to Supabase Storage
    const fileName = `comprobantes/${ventaId}_${Date.now()}.pdf`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documentos')
      .upload(fileName, pdfFile, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading PDF:', uploadError)
      throw new Error('Error al subir el comprobante')
    }

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('documentos')
      .getPublicUrl(fileName)

    // 3. Update sale record
    const { error: updateError } = await supabase
      .from('ventas')
      .update({
        comprobante_emitido: true,
        comprobante_url: publicUrl,
      })
      .eq('id', ventaId)

    if (updateError) {
      console.error('Error updating venta:', updateError)
      throw new Error('Error al actualizar el registro de venta')
    }

    // 4. Send email with PDF attachment via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (resendApiKey) {
      // Convert file to base64 for email attachment
      const arrayBuffer = await pdfFile.arrayBuffer()
      const base64Content = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      )

      const emailResponse = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'K\'intu Pasajes <noreply@kintu.pe>',
          to: [venta.email],
          subject: `Comprobante de pago — Pasaje #${venta.numero_asiento}`,
          html: `
            <h2>Inversiones K'intu S.R.L.</h2>
            <p>Estimado(a) <strong>${venta.nombres} ${venta.apellidos}</strong>,</p>
            <p>Adjuntamos su comprobante de pago por el pasaje adquirido.</p>
            <p><strong>Asiento:</strong> #${venta.numero_asiento}<br/>
            <strong>Monto:</strong> S/ ${venta.monto_pagado}<br/>
            <strong>Documento:</strong> ${venta.tipo_documento} ${venta.nro_documento}</p>
            <p>¡Gracias por viajar con K'intu!</p>
            <hr/>
            <p style="color: #666; font-size: 12px;">Este es un correo automático, no responda a este mensaje.</p>
          `,
          attachments: [
            {
              filename: `comprobante_${venta.nro_documento}.pdf`,
              content: base64Content,
            },
          ],
        }),
      })

      if (!emailResponse.ok) {
        console.error('Error sending email:', await emailResponse.text())
        // Don't fail the whole operation if email fails
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Comprobante emitido y enviado exitosamente',
        comprobante_url: publicUrl,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Error en emitir-comprobante:', err)
    return new Response(
      JSON.stringify({ error: err.message || 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
