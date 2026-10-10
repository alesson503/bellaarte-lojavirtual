const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { pool } = require('../db');
const { signToken, authMiddleware, adminOnly, adminAntigoLigado, MSG_ADMIN_DESLIGADO } = require('../middleware/auth');
const { enviarEmail } = require('../email');

const router = express.Router();

// Só 20 tentativas a cada 15 min por IP — evita força bruta de senha.
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
// Pedir e-mail de recuperação é mais sensível a spam (manda e-mail de
// verdade) — limite mais apertado.
const esqueciSenhaLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false });

function publicUser(row) {
  return { id: row.id, nome: row.nome, email: row.email, role: row.role };
}

router.post('/register', loginLimiter, async (req, res) => {
  try {
    const { nome, email, senha } = req.body || {};
    if (!nome?.trim() || !email?.trim() || !senha) {
      return res.status(400).json({ error: 'Preencha nome, e-mail e senha.' });
    }
    if (String(nome).length > 120 || String(email).length > 160) {
      return res.status(400).json({ error: 'Nome ou e-mail muito longo.' });
    }
    if (String(senha).length < 6) {
      return res.status(400).json({ error: 'A senha precisa ter pelo menos 6 caracteres.' });
    }
    const emailNorm = String(email).trim().toLowerCase();
    const hash = await bcrypt.hash(senha, 10);
    const { rows } = await pool.query(
      `INSERT INTO clientes (nome, email, senha_hash) VALUES ($1, $2, $3)
       RETURNING id, nome, email, role`,
      [String(nome).trim(), emailNorm, hash]
    );
    const user = rows[0];
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Já existe uma conta com esse e-mail.' });
    console.error(e);
    res.status(500).json({ error: 'Erro ao criar conta.' });
  }
});

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, senha } = req.body || {};
    if (!email || !senha) return res.status(400).json({ error: 'Preencha e-mail e senha.' });
    const emailNorm = String(email).trim().toLowerCase();
    const { rows } = await pool.query('SELECT * FROM clientes WHERE email = $1', [emailNorm]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    const ok = await bcrypt.compare(senha, user.senha_hash);
    if (!ok) return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    // Painel admin antigo desligado pelo ERP: conta de admin não entra mais
    // aqui (cliente da loja continua entrando normal).
    if (user.role === 'admin' && !(await adminAntigoLigado())) return res.status(403).json({ error: MSG_ADMIN_DESLIGADO });
    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao entrar.' });
  }
});

// POST /api/auth/esqueci-senha — sempre responde "ok" (mesma mensagem, mesmo
// se o e-mail não existir) pra ninguém conseguir descobrir por tentativa
// quais e-mails têm conta. Token de verdade só vai no e-mail, nunca na
// resposta da API.
router.post('/esqueci-senha', esqueciSenhaLimiter, async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email?.trim()) return res.status(400).json({ error: 'Preencha o e-mail.' });
    const emailNorm = String(email).trim().toLowerCase();

    const { rows } = await pool.query('SELECT id, nome FROM clientes WHERE email = $1', [emailNorm]);
    const user = rows[0];
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      await pool.query(
        `UPDATE clientes SET reset_token_hash = $2, reset_token_expira = now() + interval '1 hour' WHERE id = $1`,
        [user.id, tokenHash]
      );
      const base = process.env.FRONTEND_URL?.split(',')[0]?.trim() || 'https://bellaarte-lojavirtual.vercel.app';
      const link = `${base}/redefinir-senha?token=${token}`;
      await enviarEmail({
        to: emailNorm,
        subject: 'Recuperar sua senha — Bella Arte',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #A63368;">Bella Arte</h2>
            <p>Oi, ${user.nome.split(' ')[0]}! Recebemos um pedido pra trocar a senha da sua conta.</p>
            <p><a href="${link}" style="display: inline-block; background: #A63368; color: #fff; padding: 12px 24px; border-radius: 99px; text-decoration: none; font-weight: bold;">Criar nova senha</a></p>
            <p style="color: #888; font-size: 13px;">Esse link vale por 1 hora. Se não foi você quem pediu, pode ignorar esse e-mail — sua senha continua a mesma.</p>
          </div>`,
      });
    }
    res.json({ ok: true, mensagem: 'Se esse e-mail tiver uma conta, mandamos um link de recuperação.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao pedir recuperação de senha.' });
  }
});

// POST /api/auth/redefinir-senha — troca a senha usando o token do e-mail
// (não precisa estar logado, é exatamente pra quem esqueceu a senha).
router.post('/redefinir-senha', loginLimiter, async (req, res) => {
  try {
    const { token, senhaNova } = req.body || {};
    if (!token?.trim()) return res.status(400).json({ error: 'Link inválido.' });
    if (String(senhaNova || '').length < 6) return res.status(400).json({ error: 'A nova senha precisa ter pelo menos 6 caracteres.' });

    const tokenHash = crypto.createHash('sha256').update(String(token)).digest('hex');
    const { rows } = await pool.query(
      `SELECT id FROM clientes WHERE reset_token_hash = $1 AND reset_token_expira > now()`,
      [tokenHash]
    );
    const user = rows[0];
    if (!user) return res.status(400).json({ error: 'Esse link expirou ou já foi usado. Peça a recuperação de novo.' });

    const hash = await bcrypt.hash(senhaNova, 10);
    await pool.query(
      `UPDATE clientes SET senha_hash = $2, reset_token_hash = NULL, reset_token_expira = NULL WHERE id = $1`,
      [user.id, hash]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao trocar a senha.' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  const { rows } = await pool.query('SELECT id, nome, email, role FROM clientes WHERE id = $1', [req.user.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Conta não encontrada.' });
  res.json({ user: publicUser(rows[0]) });
});

// Troca a própria senha (qualquer conta logada, cliente ou admin) — pede a
// senha atual pra confirmar que é o dono mesmo da conta.
router.put('/senha', authMiddleware, loginLimiter, async (req, res) => {
  try {
    const { senhaAtual, senhaNova } = req.body || {};
    if (!senhaAtual || !senhaNova) return res.status(400).json({ error: 'Preencha a senha atual e a nova senha.' });
    if (String(senhaNova).length < 6) return res.status(400).json({ error: 'A nova senha precisa ter pelo menos 6 caracteres.' });

    const { rows } = await pool.query('SELECT senha_hash FROM clientes WHERE id = $1', [req.user.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Conta não encontrada.' });

    const ok = await bcrypt.compare(senhaAtual, rows[0].senha_hash);
    if (!ok) return res.status(401).json({ error: 'Senha atual incorreta.' });

    const hash = await bcrypt.hash(senhaNova, 10);
    await pool.query('UPDATE clientes SET senha_hash = $2 WHERE id = $1', [req.user.id, hash]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao trocar a senha.' });
  }
});

// Lista de clientes cadastrados — só admin, usado no dashboard.
router.get('/clientes', authMiddleware, adminOnly, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, nome, email, criado_em FROM clientes WHERE role = 'cliente' ORDER BY criado_em DESC`
  );
  res.json({ clientes: rows });
});

// Só apaga conta com role='cliente' — nunca deixa apagar uma conta admin por
// essa rota, mesmo que o id seja de admin.
router.delete('/clientes/:id', authMiddleware, adminOnly, async (req, res) => {
  const { rowCount } = await pool.query(`DELETE FROM clientes WHERE id = $1 AND role = 'cliente'`, [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Cliente não encontrado.' });
  res.status(204).end();
});

module.exports = router;
