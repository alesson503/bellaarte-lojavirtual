const express = require('express');
const { pool } = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { syncProdutosFromErp, nomesAdesivoNaoUsados } = require('../erpSync');

const router = express.Router();

// Normaliza a lista de cores vinda do admin: cada uma vira {nome, foto},
// descarta lixo (nome vazio) e evita salvar campos extras não previstos.
function sanitizarCores(cores) {
  if (!Array.isArray(cores)) return [];
  return cores
    .map(c => ({ nome: String(c?.nome ?? '').trim(), foto: typeof c?.foto === 'string' && c.foto ? c.foto : null }))
    .filter(c => c.nome);
}

// GET /api/produtos — público, qualquer visitante da loja pode ver.
// "preco" já vem com desconto aplicado (o maior entre o desconto do produto
// e a promoção geral ativa); "preco_original" é o valor cheio, pra riscar.
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, nome, categoria, preco, unidade, ativo, origem, imagem_url, desconto_percentual, descricao, cores, especificacoes FROM produtos WHERE ativo = true ORDER BY categoria, nome'
    );
    const { rows: promoRows } = await pool.query(
      `SELECT COALESCE(MAX(percentual), 0) AS percentual FROM promocoes
       WHERE ativo = true AND now() BETWEEN data_inicio AND data_fim`
    );
    const promoGeral = Number(promoRows[0]?.percentual || 0);
    const produtos = rows.map(p => {
      const desconto = Math.max(Number(p.desconto_percentual || 0), promoGeral);
      const precoFinal = desconto > 0 ? Math.round(p.preco * (1 - desconto / 100) * 100) / 100 : p.preco;
      return { ...p, preco_original: p.preco, preco: precoFinal, desconto_percentual: desconto };
    });
    res.json({ produtos, promocao_geral: promoGeral });
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
    const { nome, categoria, preco, unidade, descricao, cores, especificacoes } = req.body || {};
    if (!nome?.trim()) return res.status(400).json({ error: 'Nome é obrigatório.' });
    if (preco == null || Number(preco) < 0) return res.status(400).json({ error: 'Preço inválido.' });
    const { rows } = await pool.query(
      `INSERT INTO produtos (nome, categoria, preco, unidade, descricao, cores, especificacoes) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb) RETURNING *`,
      [String(nome).trim(), categoria || 'Outros', Number(preco), unidade || null, descricao?.trim() || null,
       JSON.stringify(sanitizarCores(cores)), JSON.stringify(Array.isArray(especificacoes) ? especificacoes : [])]
    );
    res.status(201).json({ produto: rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao criar produto.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { nome, categoria, preco, unidade, ativo, desconto_percentual, descricao, cores, especificacoes } = req.body || {};
    if (desconto_percentual != null && !(Number(desconto_percentual) >= 0 && Number(desconto_percentual) <= 100)) {
      return res.status(400).json({ error: 'Desconto precisa ser entre 0 e 100.' });
    }
    const { rows } = await pool.query(
      `UPDATE produtos SET
         nome = COALESCE($2, nome),
         categoria = COALESCE($3, categoria),
         preco = COALESCE($4, preco),
         unidade = COALESCE($5, unidade),
         ativo = COALESCE($6, ativo),
         desconto_percentual = CASE WHEN $7::text IS NULL THEN desconto_percentual ELSE NULLIF($7, '')::numeric END,
         descricao = COALESCE($8, descricao),
         cores = COALESCE($9::jsonb, cores),
         especificacoes = COALESCE($10::jsonb, especificacoes),
         atualizado_em = now()
       WHERE id = $1 RETURNING *`,
      [req.params.id, nome ?? null, categoria ?? null, preco ?? null, unidade ?? null, ativo ?? null,
       desconto_percentual === undefined ? null : String(desconto_percentual),
       descricao ?? null, Array.isArray(cores) ? JSON.stringify(sanitizarCores(cores)) : null,
       Array.isArray(especificacoes) ? JSON.stringify(especificacoes) : null]
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

// PUT /api/produtos/:id/imagem — upload manual (marca imagem_origem='manual',
// a sincronização automática nunca mais sobrescreve essa foto).
router.put('/:id/imagem', async (req, res) => {
  const { imagem } = req.body || {};
  if (!imagem?.trim()) return res.status(400).json({ error: 'Imagem é obrigatória.' });
  const { rows } = await pool.query(
    `UPDATE produtos SET imagem_url = $2, imagem_origem = 'manual', atualizado_em = now()
     WHERE id = $1 RETURNING id, imagem_url, imagem_origem`,
    [req.params.id, imagem]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Produto não encontrado.' });
  res.json({ produto: rows[0] });
});

// DELETE /api/produtos/:id/imagem — remove a foto manual e volta a deixar a
// sincronização usar a foto do ERP (se existir) na próxima vez.
router.delete('/:id/imagem', async (req, res) => {
  const { rows } = await pool.query(
    `UPDATE produtos SET imagem_url = NULL, imagem_origem = 'nenhuma', atualizado_em = now()
     WHERE id = $1 RETURNING id, imagem_url, imagem_origem`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Produto não encontrado.' });
  res.json({ produto: rows[0] });
});

module.exports = router;
