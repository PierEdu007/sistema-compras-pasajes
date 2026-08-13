// Cloudflare Pages Function: /api/enviar-correo
// Server-side email dispatcher via Resend API (bypasses browser CORS restrictions completely)

const DEFAULT_RESEND_KEY = typeof atob === 'function' ? atob('cmVfR0NvV0hmV1VfRGd5UEJyOWd0VjkzWEJjdVNFQWZ6Z0ti') : '';

export async function onRequestPost(context) {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const body = await context.request.json();
    const { to, subject, html, attachments, apiKey: clientKey } = body;

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos requeridos (to, subject, html)' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const resendApiKey = clientKey || context.env?.VITE_RESEND_API_KEY || DEFAULT_RESEND_KEY;

    const emailPayload = {
      from: 'INVERSIONES TUNKY CHASKY <reservas@turismotunkychasky.com.pe>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      attachments: attachments || [],
    };

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey.trim()}`,
      },
      body: JSON.stringify(emailPayload),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      console.error('Error enviando correo con Resend API:', resendData);
      return new Response(
        JSON.stringify({ error: resendData.message || resendData.name || 'Error en Resend API' }),
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
      JSON.stringify({ error: err.message || 'Error interno en el servidor de correo' }),
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
  });
}
