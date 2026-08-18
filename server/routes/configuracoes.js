const express = require('express');
const { pool } = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/configuracoes — público, a loja usa pra montar os links de WhatsApp etc.
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT chave, valor FROM configuracoes');
    const config = Object.fromEntries(rows.map(r => [r.chave, r.valor]));
    res.json({ config });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao buscar configurações.' });
  }
});

// PUT /api/configuracoes/:chave — só admin.
router.put('/:chave', authMiddleware, adminOnly, async (req, res) => {
  const { valor } = req.body || {};
  if (typeof valor !== 'string' || !valor.trim()) return res.status(400).json({ error: 'Valor é obrigatório.' });
  await pool.query(
    `INSERT INTO configuracoes (chave, valor) VALUES ($1, $2)
     ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor`,
    [req.params.chave, valor.trim()]
  );
  res.json({ ok: true });
});

module.exports = router;
