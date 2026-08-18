const express = require('express');
const { pool } = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/promocoes/ativa — público, usado pela loja inteira (vitrine e
// todos os configuradores) pra saber se tem promoção geral valendo agora.
router.get('/ativa', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nome, percentual, data_inicio, data_fim FROM promocoes
       WHERE ativo = true AND now() BETWEEN data_inicio AND data_fim
       ORDER BY percentual DESC LIMIT 1`
    );
    res.json({ promocao: rows[0] || null });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao buscar promoção ativa.' });
  }
});

router.use(authMiddleware, adminOnly);

router.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM promocoes ORDER BY data_inicio DESC');
  res.json({ promocoes: rows });
});

router.post('/', async (req, res) => {
  try {
    const { nome, percentual, data_inicio, data_fim } = req.body || {};
    if (!nome?.trim()) return res.status(400).json({ error: 'Nome é obrigatório.' });
    const pct = Number(percentual);
    if (!(pct > 0 && pct <= 100)) return res.status(400).json({ error: 'Percentual precisa ser entre 0 e 100.' });
    if (!data_inicio || !data_fim) return res.status(400).json({ error: 'Datas de início e fim são obrigatórias.' });
    if (new Date(data_fim) <= new Date(data_inicio)) return res.status(400).json({ error: 'A data de fim precisa ser depois da data de início.' });
    const { rows } = await pool.query(
      `INSERT INTO promocoes (nome, percentual, data_inicio, data_fim) VALUES ($1, $2, $3, $4) RETURNING *`,
      [String(nome).trim(), pct, data_inicio, data_fim]
    );
    res.status(201).json({ promocao: rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao criar promoção.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { nome, percentual, data_inicio, data_fim, ativo } = req.body || {};
    const { rows } = await pool.query(
      `UPDATE promocoes SET
         nome = COALESCE($2, nome),
         percentual = COALESCE($3, percentual),
         data_inicio = COALESCE($4, data_inicio),
         data_fim = COALESCE($5, data_fim),
         ativo = COALESCE($6, ativo)
       WHERE id = $1 RETURNING *`,
      [req.params.id, nome ?? null, percentual != null ? Number(percentual) : null, data_inicio ?? null, data_fim ?? null, ativo ?? null]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Promoção não encontrada.' });
    res.json({ promocao: rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao atualizar promoção.' });
  }
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM promocoes WHERE id = $1', [req.params.id]);
  res.status(204).end();
});

module.exports = router;
