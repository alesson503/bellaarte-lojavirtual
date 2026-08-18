const express = require('express');
const { pool } = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { syncProdutosFromErp, nomesAdesivoNaoUsados } = require('../erpSync');

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

// GET /api/produtos/adesivo-precos — público, usado pelo configurador de
// Adesivo. Sempre devolve os 6 preços (o último bom conhecido, mesmo que a
// última sincronização não tenha achado o produto no ERP).
router.get('/adesivo-precos', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT material, acabamento, preco FROM adesivo_precos');
    const precos = {};
    for (const r of rows) {
      precos[r.material] ??= {};
      precos[r.material][r.acabamento] = r.preco;
    }
    res.json({ precos });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao buscar preços do Adesivo.' });
  }
});

// A partir daqui, só admin (cadastro/edição de produto é coisa de loja, não de cliente).
router.use(authMiddleware, adminOnly);

// GET /api/produtos/adesivo-status — pro painel admin: mostra os 6 preços
// com data da última sincronização, e sugestões de nome quando algum não
// bateu com o ERP na última tentativa.
router.get('/adesivo-status', async (req, res) => {
  try {
    const { rows: combos } = await pool.query(
      'SELECT material, acabamento, preco, erp_nome_esperado, sincronizado, atualizado_em FROM adesivo_precos ORDER BY material, acabamento'
    );

    let sugestoes = [];
    const algumDessincronizado = combos.some(c => !c.sincronizado);
    if (algumDessincronizado && process.env.ERP_API_URL && process.env.ERP_API_SECRET) {
      const erpRes = await fetch(`${process.env.ERP_API_URL}/api/produtos-site`, {
        headers: { 'x-loja-secret': process.env.ERP_API_SECRET },
      });
      const erpData = await erpRes.json().catch(() => ({}));
      if (erpRes.ok) {
        sugestoes = nomesAdesivoNaoUsados(erpData.produtos || [], combos.map(c => c.erp_nome_esperado));
      }
    }

    res.json({ combos, sugestoes });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao buscar status do Adesivo.' });
  }
});

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

// PUT /api/produtos/adesivo-precos/:material/:acabamento — corrige o nome
// esperado (ex: produto foi renomeado no ERP) e já tenta sincronizar de novo.
router.put('/adesivo-precos/:material/:acabamento', async (req, res) => {
  const { erp_nome_esperado } = req.body || {};
  if (!erp_nome_esperado?.trim()) return res.status(400).json({ error: 'Nome esperado é obrigatório.' });
  const { rowCount } = await pool.query(
    'UPDATE adesivo_precos SET erp_nome_esperado = $3, sincronizado = false WHERE material = $1 AND acabamento = $2',
    [req.params.material, req.params.acabamento, erp_nome_esperado.trim()]
  );
  if (!rowCount) return res.status(404).json({ error: 'Combinação não encontrada.' });
  try {
    await syncProdutosFromErp();
  } catch (e) {
    console.error('Erro ao ressincronizar após corrigir nome:', e);
  }
  const { rows } = await pool.query(
    'SELECT material, acabamento, preco, erp_nome_esperado, sincronizado, atualizado_em FROM adesivo_precos WHERE material = $1 AND acabamento = $2',
    [req.params.material, req.params.acabamento]
  );
  res.json({ combo: rows[0] });
});

// Dispara a sincronização na hora (a mesma que roda sozinha a cada 30min).
router.post('/sincronizar', async (req, res) => {
  try {
    const resultado = await syncProdutosFromErp();
    if (!resultado.ok) return res.status(503).json({ error: resultado.error });
    res.json(resultado);
  } catch (e) {
    console.error('Erro ao sincronizar produtos:', e);
    res.status(502).json({ error: e instanceof Error ? e.message : 'Não foi possível sincronizar agora.' });
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
