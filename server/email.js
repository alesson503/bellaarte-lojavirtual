// Envio de e-mail via Resend (API HTTP simples, sem precisar instalar o SDK
// deles). Chave em RESEND_API_KEY (variável de ambiente no Railway) — sem
// ela, só loga no console e segue em frente (nunca derruba a requisição
// que chamou isso).
async function enviarEmail({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) {
    console.error(`RESEND_API_KEY não configurada — e-mail pra ${to} não foi enviado.`);
    return { enviado: false };
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      // Sem domínio próprio verificado no Resend ainda — remetente genérico
      // deles, mas o nome "Bella Arte" aparece normal pro cliente.
      body: JSON.stringify({ from: 'Bella Arte <onboarding@resend.dev>', to, subject, html }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error('Resend recusou o envio:', res.status, data);
      return { enviado: false };
    }
    return { enviado: true };
  } catch (e) {
    console.error('Falha ao chamar o Resend:', e.message);
    return { enviado: false };
  }
}

module.exports = { enviarEmail };
