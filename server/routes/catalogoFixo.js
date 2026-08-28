const express = require('express');
const { pool } = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/catalogo-fixo/imagens — público, a loja usa pra montar Panfletos/
// Wind Banner/Placa PS/Banner-Lona com foto (se o admin tiver subido uma;
// se não tiver, o site mostra o ícone da categoria, igual sempre foi).
router.get('/imagens', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT produto_id, imagem_url FROM catalogo_fixo_imagens');
    res.json({ imagens: Object.fromEntries(rows.map(r => [r.produto_id, r.imagem_url])) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao buscar imagens do catálogo fixo.' });
  }
});

// A partir daqui, só admin.
router.use(authMiddleware, adminOnly);

// PUT /api/catalogo-fixo/:produtoId/imagem
router.put('/:produtoId/imagem', async (req, res) => {
  const { imagem } = req.body || {};
  if (!imagem?.trim()) return res.status(400).json({ error: 'Imagem é obrigatória.' });
  await pool.query(
    `INSERT INTO catalogo_fixo_imagens (produto_id, imagem_url, atualizado_em) VALUES ($1, $2, now())
     ON CONFLICT (produto_id) DO UPDATE SET imagem_url = EXCLUDED.imagem_url, atualizado_em = now()`,
    [req.params.produtoId, imagem]
  );
  res.json({ ok: true });
});

// DELETE /api/catalogo-fixo/:produtoId/imagem
router.delete('/:produtoId/imagem', async (req, res) => {
  await pool.query('DELETE FROM catalogo_fixo_imagens WHERE produto_id = $1', [req.params.produtoId]);
  res.status(204).end();
});

module.exports = router;
