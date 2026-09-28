const express = require('express');
const { pool } = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// POST /api/erros — público (dispara sozinho quando a tela quebra, antes de
// qualquer login existir na hora). Sem dado de cliente, só o erro técnico.
router.post('/', async (req, res) => {
  try {
    const { mensagem, pilha, url } = req.body || {};
    if (typeof mensagem !== 'string' || !mensagem.trim()) return res.status(400).json({ error: 'mensagem é obrigatória.' });
    await pool.query(
      'INSERT INTO erros_frontend (mensagem, pilha, url, user_agent) VALUES ($1, $2, $3, $4)',
      [
        mensagem.slice(0, 2000),
        typeof pilha === 'string' ? pilha.slice(0, 8000) : null,
        typeof url === 'string' ? url.slice(0, 500) : null,
        (req.headers['user-agent'] || '').slice(0, 500),
      ],
    );
    res.status(204).end();
  } catch (e) {
    // Nunca deixa o registro do erro virar outro erro pro usuário ver.
    console.error('Falha ao registrar erro do front-end:', e);
    res.status(204).end();
  }
});

// GET /api/erros — admin, últimos 50 (mais recente primeiro).
router.get('/', authMiddleware, adminOnly, async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM erros_frontend ORDER BY criado_em DESC LIMIT 50');
    res.json({ erros: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao buscar o histórico de erros.' });
  }
});

module.exports = router;
