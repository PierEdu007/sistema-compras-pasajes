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

    if (!userRole || (userRole.rol !== 'ADMIN' && userRole.rol !== 'CONTADOR')) {
      return new Response(
        JSON.stringify({ error: 'Permisos insuficientes para emitir comprobantes' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const formData = await req.formData()
    const ventaId = formData.get('venta_id') as string
    const pdfFile = formData.get('comprobante') as File

    if (!ventaId || !pdfFile) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos: venta_id, comprobante (PDF)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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

    // 2. Upload PDF to Supabase Storage
    const fileName = `comprobantes/${ventaId}_${Date.now()}.pdf`
    const { error: uploadError } = await supabase.storage
      .from('documentos')
      .upload(fileName, pdfFile, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      console.error('Error uploading PDF:', uploadError)
    }

    const { data: { publicUrl } } = supabase.storage
      .from('documentos')
      .getPublicUrl(fileName)

    // 3. Update sale record
    await supabase
      .from('ventas')
      .update({
        comprobante_emitido: true,
        comprobante_url: publicUrl,
      })
      .eq('id', ventaId)

    // 4. Send email via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (resendApiKey) {
      const arrayBuffer = await pdfFile.arrayBuffer()
      const base64Content = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      )

      const compTipo = venta.tipo_documento === 'RUC' ? 'Factura Electrónica' : 'Boleta Electrónica'

      const emailResponse = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'INVERSIONES TUNKY CHASKY <reservas@turismotunkychasky.com.pe>',
          to: [venta.email],
          subject: `¡Pago Confirmado! Su ${compTipo} y Boleto de Viaje #${venta.numero_asiento}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #1e293b;">
              <h2 style="color: #742284; margin-top: 0;">INVERSIONES TUNKY CHASKY S.R.L.</h2>
              <p>Estimado(a) <strong>${venta.nombres} ${venta.apellidos}</strong>,</p>
              <p>¡Su pago ha sido verificado y confirmado exitosamente!</p>
              <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 4px 0;"><strong>Detalle del Pasaje:</strong></p>
                <p style="margin: 4px 0;">• <strong>Asiento Reservado:</strong> #${venta.numero_asiento}</p>
                <p style="margin: 4px 0;">• <strong>Monto Pagado:</strong> S/ ${venta.monto_pagado.toFixed(2)}</p>
                <p style="margin: 4px 0;">• <strong>Documento:</strong> ${venta.tipo_documento} ${venta.nro_documento}</p>
                <p style="margin: 4px 0;">• <strong>Comprobante Emitido:</strong> ${compTipo}</p>
              </div>
              <p>Adjunto a este correo electrónico encontrará su <strong>Boleto de Viaje</strong> y su <strong>${compTipo}</strong> en formato PDF.</p>
              <p style="margin-top: 24px;">¡Gracias por viajar con Tunky Chasky!</p>
              <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 20px 0;"/>
              <p style="color: #64748b; font-size: 12px; text-align: center;">Este es un mensaje automático del Sistema de Compras de Pasajes.</p>
            </div>
          `,
          attachments: [
            {
              filename: `${compTipo.replace(' ', '_')}_${venta.nro_documento}.pdf`,
              content: base64Content,
            },
          ],
        }),
      })

      if (!emailResponse.ok) {
        console.error('Resend error:', await emailResponse.text())
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Comprobante emitido y correo enviado exitosamente',
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
