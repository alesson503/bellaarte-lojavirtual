const express = require('express');
const rateLimit = require('express-rate-limit');
const { pool } = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

const criarLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });

// POST /api/pedidos — público (cliente finalizando compra), mas com limite
// de tentativas por IP pra não virar porta de spam no seu painel.
router.post('/', criarLimiter, async (req, res) => {
  try {
    const { nome, telefone, entrega, itens, total, clienteId } = req.body || {};
    if (!nome?.trim() || !telefone?.trim()) {
      return res.status(400).json({ error: 'Nome e telefone são obrigatórios.' });
    }
    if (!Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({ error: 'O pedido precisa ter pelo menos um item.' });
    }
    if (itens.length > 100) return res.status(400).json({ error: 'Pedido com muitos itens.' });

    const { rows } = await pool.query(
      `INSERT INTO pedidos (cliente_id, nome, telefone, entrega, itens, total)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [clienteId || null, String(nome).trim(), String(telefone).trim(), entrega || 'Retirar na Bella Arte', JSON.stringify(itens), Number(total) || 0]
    );
    res.status(201).json({ pedido: rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao registrar pedido.' });
  }
});

// Listar e mudar status — só admin.
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM pedidos ORDER BY criado_em DESC');
  res.json({ pedidos: rows });
});

router.put('/:id/status', authMiddleware, adminOnly, async (req, res) => {
  const { status } = req.body || {};
  if (!status?.trim()) return res.status(400).json({ error: 'Status é obrigatório.' });
  const { rows } = await pool.query(
    'UPDATE pedidos SET status = $2 WHERE id = $1 RETURNING *',
    [req.params.id, String(status).trim()]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Pedido não encontrado.' });
  res.json({ pedido: rows[0] });
});

router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM pedidos WHERE id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Pedido não encontrado.' });
  res.status(204).end();
});

module.exports = router;
