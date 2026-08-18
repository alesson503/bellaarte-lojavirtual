const express = require('express');
const { pool } = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/produtos — público, qualquer visitante da loja pode ver.
// Por padrão só devolve os ativos; passa ?todos=1 (autenticado admin) pra ver tudo.
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, nome, categoria, preco, unidade, ativo FROM produtos WHERE ativo = true ORDER BY categoria, nome'
    );
    res.json({ produtos: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao buscar produtos.' });
  }
});

// A partir daqui, só admin (cadastro/edição de produto é coisa de loja, não de cliente).
router.use(authMiddleware, adminOnly);

router.get('/todos', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM produtos ORDER BY categoria, nome');
  res.json({ produtos: rows });
});

// Busca os produtos direto do ERP (prévia pro admin conferir — ainda não
// alimenta a vitrine da loja, só essa tela).
router.get('/erp', async (req, res) => {
  if (!process.env.ERP_API_URL || !process.env.ERP_API_SECRET) {
    return res.status(503).json({ error: 'Integração com o ERP ainda não foi configurada.' });
  }
  try {
    const erpRes = await fetch(`${process.env.ERP_API_URL}/api/produtos-site`, {
      headers: { 'x-loja-secret': process.env.ERP_API_SECRET },
    });
    const erpData = await erpRes.json().catch(() => ({}));
    if (!erpRes.ok) throw new Error(erpData.error || 'O ERP recusou o pedido.');
    const produtos = (erpData.produtos || []).map(p => ({ ...p, preco: Number(p.preco) }));
    res.json({ produtos });
  } catch (e) {
    console.error('Erro ao buscar produtos do ERP:', e);
    res.status(502).json({ error: e instanceof Error ? e.message : 'Não foi possível falar com o ERP agora.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nome, categoria, preco, unidade } = req.body || {};
    if (!nome?.trim()) return res.status(400).json({ error: 'Nome é obrigatório.' });
    if (preco == null || Number(preco) < 0) return res.status(400).json({ error: 'Preço inválido.' });
    const { rows } = await pool.query(
      `INSERT INTO produtos (nome, categoria, preco, unidade) VALUES ($1, $2, $3, $4) RETURNING *`,
      [String(nome).trim(), categoria || 'Outros', Number(preco), unidade || null]
    );
    res.status(201).json({ produto: rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao criar produto.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { nome, categoria, preco, unidade, ativo } = req.body || {};
    const { rows } = await pool.query(
      `UPDATE produtos SET
         nome = COALESCE($2, nome),
         categoria = COALESCE($3, categoria),
         preco = COALESCE($4, preco),
         unidade = COALESCE($5, unidade),
         ativo = COALESCE($6, ativo),
         atualizado_em = now()
       WHERE id = $1 RETURNING *`,
      [req.params.id, nome ?? null, categoria ?? null, preco ?? null, unidade ?? null, ativo ?? null]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Produto não encontrado.' });
    res.json({ produto: rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao atualizar produto.' });
  }
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM produtos WHERE id = $1', [req.params.id]);
  res.status(204).end();
});

module.exports = router;
