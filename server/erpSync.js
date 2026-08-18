// Sincronização de produtos do ERP — só os "simples" (preço fixo, sem
// calculadora própria). Adesivo (UV/Vinil), Cartão de Visita, Banner
// e Placa PS/Panfletos já têm configurador dedicado na loja com preço
// vindo de tabela própria — não duplica esses aqui.
const { pool } = require('./db');

function ehConfiguravel(p) {
  if (p.categoria === 'Cartao de Visita') return true;
  if (p.categoria === 'Banner') return true; // Wind Banner (MULTI) e Banner/Lona (MEDIDA)
  if (/^Adesivo (UV|Vinil)/i.test(p.nome)) return true; // configurador "Monte seu Adesivo"
  if (/^Placa PS/i.test(p.nome)) return true; // configurador MULTI
  if (/^Panfletos/i.test(p.nome)) return true; // configurador MULTI
  return false;
}

async function syncProdutosFromErp() {
  if (!process.env.ERP_API_URL || !process.env.ERP_API_SECRET) {
    return { ok: false, error: 'Integração com o ERP ainda não foi configurada.' };
  }
  const erpRes = await fetch(`${process.env.ERP_API_URL}/api/produtos-site`, {
    headers: { 'x-loja-secret': process.env.ERP_API_SECRET },
  });
  const erpData = await erpRes.json().catch(() => ({}));
  if (!erpRes.ok) throw new Error(erpData.error || 'O ERP recusou a busca de produtos.');

  const simples = (erpData.produtos || []).filter(p => !ehConfiguravel(p));
  const vistosErpIds = [];

  for (const p of simples) {
    vistosErpIds.push(p.erp_id ?? p.id);
    await pool.query(
      `INSERT INTO produtos (nome, categoria, preco, unidade, ativo, origem, erp_id)
       VALUES ($1, $2, $3, $4, true, 'erp', $5)
       ON CONFLICT (erp_id) DO UPDATE SET
         nome = EXCLUDED.nome, categoria = EXCLUDED.categoria, preco = EXCLUDED.preco,
         unidade = EXCLUDED.unidade, ativo = true, atualizado_em = now()`,
      [p.nome, p.categoria, Number(p.preco), p.unidade_venda === 'm2' ? 'm²' : null, p.id]
    );
  }

  // Produto que sumiu do ERP (ou virou "não simples") fica inativo — não
  // apaga, só some da vitrine, caso volte a aparecer o histórico continua.
  if (vistosErpIds.length) {
    await pool.query(
      `UPDATE produtos SET ativo = false, atualizado_em = now()
       WHERE origem = 'erp' AND erp_id IS NOT NULL AND NOT (erp_id = ANY($1::text[]))`,
      [vistosErpIds]
    );
  }

  return { ok: true, total: simples.length };
}

module.exports = { syncProdutosFromErp };
