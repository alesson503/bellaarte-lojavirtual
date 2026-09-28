// Rotas que o ERP chama pra montar o painel "Loja Virtual" lá dentro —
// listar pedidos, baixar a arte, puxar (reservar → concluir) e apagar.
// Protegidas pela mesma senha compartilhada da integração (ERP_API_SECRET,
// que é o mesmo valor do LOJA_API_SECRET lá no ERP). Nenhum cliente da
// loja chega aqui.
const express = require('express');
const { pool } = require('../db');
const { itensSemArte, reservar, liberar, concluir } = require('../pedidosErp');

const router = express.Router();

// Express 4 não pega erro de função async sozinho — sem isso a requisição
// ficaria pendurada em vez de cair no tratador de erro do server.js.
const wrap = fn => (req, res, next) => fn(req, res, next).catch(next);

router.use((req, res, next) => {
  const configured = process.env.ERP_API_SECRET;
  if (!configured) return res.status(404).end();
  if (req.headers['x-loja-secret'] !== configured) return res.status(401).json({ error: 'Não autorizado.' });
  next();
});

// Lista sem o arquivo da arte (pode ter MBs) — só o nome de cada uma.
function resumo(p) {
  return {
    id: p.id, nome: p.nome, telefone: p.telefone, entrega: p.entrega,
    total: Number(p.total) || 0, criado_em: p.criado_em,
    enviado_erp: p.enviado_erp, erp_numero: p.erp_numero,
    itens: (p.itens || []).map(i => ({
      nome: i.nome, preco: Number(i.preco) || 0, quantidade: Number(i.quantidade) || 1,
      observacao: i.observacao || null,
      // Foto do produto que o cliente escolheu (link ou imagem embutida até
      // ~300KB, pra lista não pesar).
      imagem: typeof i.imagem === 'string' && (/^https?:\/\//.test(i.imagem) || (/^data:image\//.test(i.imagem) && i.imagem.length < 300000)) ? i.imagem : null,
      arte: i.arte ? { frente: i.arte.frente?.nome || null, verso: i.arte.verso?.nome || null } : null,
    })),
  };
}

// GET /api/erp/pedidos?status=pendentes|puxados
router.get('/pedidos', wrap(async (req, res) => {
  const puxados = req.query.status === 'puxados';
  const { rows } = await pool.query(
    `SELECT * FROM pedidos WHERE enviado_erp = $1 ORDER BY criado_em DESC LIMIT ${puxados ? 100 : 500}`,
    [puxados]
  );
  res.json({ pedidos: rows.map(resumo) });
}));

// GET /api/erp/pedidos/:id/arte/:item/:lado — o arquivo da arte (data URL)
router.get('/pedidos/:id/arte/:item/:lado', wrap(async (req, res) => {
  const { rows: [p] } = await pool.query('SELECT itens FROM pedidos WHERE id = $1', [req.params.id]);
  const arte = p?.itens?.[Number(req.params.item)]?.arte?.[req.params.lado];
  if (!arte?.dataUrl) return res.status(404).json({ error: 'Arte não encontrada.' });
  res.json({ nome: arte.nome, tipo: arte.tipo, dataUrl: arte.dataUrl });
}));

// POST /api/erp/pedidos/:id/reservar — marca como enviado antes do ERP
// criar a venda; devolve o pedido já no formato que o ERP usa.
router.post('/pedidos/:id/reservar', wrap(async (req, res) => {
  const pedido = await reservar(req.params.id);
  if (!pedido) {
    const { rows: [p] } = await pool.query('SELECT erp_numero FROM pedidos WHERE id = $1', [req.params.id]);
    if (!p) return res.status(404).json({ error: 'Pedido não encontrado.' });
    return res.status(409).json({ error: `Esse pedido já foi enviado pro ERP${p.erp_numero ? ` (venda ${p.erp_numero})` : ''}.` });
  }
  res.json({ pedido: { ...resumo(pedido), itens: itensSemArte(pedido.itens) } });
}));

router.post('/pedidos/:id/liberar', wrap(async (req, res) => {
  await liberar(req.params.id);
  res.json({ ok: true });
}));

router.post('/pedidos/:id/concluir', wrap(async (req, res) => {
  const pedido = await concluir(req.params.id, req.body?.erp_numero);
  if (!pedido) return res.status(404).json({ error: 'Pedido não encontrado.' });
  res.json({ pedido: resumo(pedido) });
}));

// DELETE /api/erp/pedidos/:id — tira o pedido da loja. Se ele já virou
// venda, a venda (e os afazeres) continuam no ERP; só some daqui.
router.delete('/pedidos/:id', wrap(async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM pedidos WHERE id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Pedido não encontrado.' });
  res.status(204).end();
}));

module.exports = router;
