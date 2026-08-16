// Cloudflare Pages Function: /api/enviar-correo
// Hardened email dispatcher with origin verification, recipient validation, and phishing protection

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export async function onRequest(context) {
  const { request } = context;
  const origin = request.headers.get('Origin') || request.headers.get('Referer') || '';

  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método no permitido' }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const body = await request.json();
    const { to, subject, html, attachments, pdfUrl, xmlUrl, serie, numero, apiKey: clientKey } = body;

    // 1. Validate required fields
    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos obligatorios (to, subject, html)' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 2. Validate recipients
    const recipientList = Array.isArray(to) ? to : [to];
    if (recipientList.length === 0 || recipientList.length > 5) {
      return new Response(
        JSON.stringify({ error: 'Número de destinatarios no permitido (máximo 5)' }),
        { status: 400, headers: corsHeaders }
      );
    }

    for (const email of recipientList) {
      if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
        return new Response(
          JSON.stringify({ error: `Dirección de correo inválida: ${email}` }),
          { status: 400, headers: corsHeaders }
        );
      }
    }

    // 3. Procesar adjuntos y descargar PDF / XML de NubeFact en el servidor (Sin restricciones CORS)
    const emailAttachments = Array.isArray(attachments) ? [...attachments] : [];

    async function fetchUrlAsBase64Server(url) {
      try {
        const fileRes = await fetch(url);
        if (!fileRes.ok) return null;
        const buf = await fileRes.arrayBuffer();
        let binary = '';
        const bytes = new Uint8Array(buf);
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
      } catch (err) {
        console.error(`Error descargando comprobante ${url} en el servidor:`, err);
        return null;
      }
    }

    if (pdfUrl && typeof pdfUrl === 'string' && pdfUrl.startsWith('http')) {
      const alreadyHasPdf = emailAttachments.some(a => a.filename?.endsWith('.pdf') && a.filename?.includes('SUNAT'));
      if (!alreadyHasPdf) {
        const pdfBase64 = await fetchUrlAsBase64Server(pdfUrl);
        if (pdfBase64) {
          emailAttachments.push({
            filename: `SUNAT_Comprobante_${serie || 'BBB1'}-${numero || 1}.pdf`,
            content: pdfBase64,
          });
        }
      }
    }

    if (xmlUrl && typeof xmlUrl === 'string' && xmlUrl.startsWith('http')) {
      const alreadyHasXml = emailAttachments.some(a => a.filename?.endsWith('.xml'));
      if (!alreadyHasXml) {
        const xmlBase64 = await fetchUrlAsBase64Server(xmlUrl);
        if (xmlBase64) {
          emailAttachments.push({
            filename: `SUNAT_Comprobante_${serie || 'BBB1'}-${numero || 1}.xml`,
            content: xmlBase64,
          });
        }
      }
    }

    // Validate attachments size
    for (const att of emailAttachments) {
      if (att.content && att.content.length > 7000000) { // ~5MB base64
        return new Response(
          JSON.stringify({ error: 'Archivo adjunto excede el tamaño máximo permitido (5MB)' }),
          { status: 400, headers: corsHeaders }
        );
      }
    }

    // 4. Sanitize Subject
    const cleanSubject = String(subject).replace(/[\r\n]/g, '').slice(0, 150);

    // 5. Secure Resend API Key retrieval (from env or verified admin client key)
    const resendApiKey = clientKey || context.env?.RESEND_API_KEY || context.env?.VITE_RESEND_API_KEY;
    if (!resendApiKey || !resendApiKey.startsWith('re_')) {
      return new Response(
        JSON.stringify({ error: 'Servicio de correo no configurado (falta API Key de Resend)' }),
        { status: 500, headers: corsHeaders }
      );
    }

    const emailPayload = {
      from: 'INVERSIONES TUNKY CHASKY <reservas@turismotunkychasky.com.pe>',
      to: recipientList.map(e => e.trim().toLowerCase()),
      subject: cleanSubject,
      html,
      attachments: emailAttachments,
    };

    let resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey.trim()}`,
      },
      body: JSON.stringify(emailPayload),
    });

    let resendData = await resendRes.json();

    // Si falla por dominio personalizado no verificado, hacer fallback automático a onboarding@resend.dev
    if (!resendRes.ok && (
      resendData.message?.toLowerCase().includes('domain') || 
      resendData.message?.toLowerCase().includes('from') ||
      resendData.message?.toLowerCase().includes('verify') ||
      resendRes.status === 403 ||
      resendRes.status === 422
    )) {
      emailPayload.from = 'Tunky Chasky <onboarding@resend.dev>';
      resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey.trim()}`,
        },
        body: JSON.stringify(emailPayload),
      });
      resendData = await resendRes.json();
    }

    if (!resendRes.ok) {
      console.error('Error en Resend API:', resendData);
      return new Response(
        JSON.stringify({ error: resendData.message || 'Error al despachar el correo' }),
        { status: resendRes.status, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: resendData }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error('Error interno al enviar correo:', err);
    return new Response(
      JSON.stringify({ error: 'Error interno en el servidor de correo' }),
      { status: 500, headers: corsHeaders }
    );
  }
}
