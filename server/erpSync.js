// Sincronização com o ERP — busca os produtos uma vez e atualiza duas
// coisas com o mesmo resultado:
//  1) os produtos "simples" (preço fixo, sem calculadora própria)
//  2) a tabela de preço do configurador de Adesivo (por nome esperado)
//
// Adesivo (UV/Vinil), Cartão de Visita, Banner e Placa PS/Panfletos já têm
// configurador dedicado na loja — não entram na lista de "simples".
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
  const todosDoErp = erpData.produtos || [];

  // 1) Produtos simples
  const simples = todosDoErp.filter(p => !ehConfiguravel(p));
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
  if (vistosErpIds.length) {
    await pool.query(
      `UPDATE produtos SET ativo = false, atualizado_em = now()
       WHERE origem = 'erp' AND erp_id IS NOT NULL AND NOT (erp_id = ANY($1::text[]))`,
      [vistosErpIds]
    );
  }

  // 2) Preço do configurador de Adesivo — casa por nome exato.
  const { rows: combos } = await pool.query('SELECT material, acabamento, erp_nome_esperado FROM adesivo_precos');
  for (const combo of combos) {
    const achado = todosDoErp.find(p => p.nome.trim().toLowerCase() === combo.erp_nome_esperado.trim().toLowerCase());
    if (achado) {
      await pool.query(
        `UPDATE adesivo_precos SET preco = $3, sincronizado = true, atualizado_em = now()
         WHERE material = $1 AND acabamento = $2`,
        [combo.material, combo.acabamento, Number(achado.preco)]
      );
    } else {
      await pool.query(
        `UPDATE adesivo_precos SET sincronizado = false, atualizado_em = now()
         WHERE material = $1 AND acabamento = $2`,
        [combo.material, combo.acabamento]
      );
    }
  }

  return { ok: true, total: simples.length };
}

// Nomes de produtos "Adesivo" no ERP que não bateram com nenhuma combinação
// esperada — úteis como sugestão quando um nome esperado não é encontrado.
function nomesAdesivoNaoUsados(todosDoErp, nomesEsperados) {
  const esperadosLower = new Set(nomesEsperados.map(n => n.trim().toLowerCase()));
  return todosDoErp
    .filter(p => p.categoria === 'Adesivo' && p.unidade_venda === 'm2')
    .map(p => p.nome)
    .filter(nome => !esperadosLower.has(nome.trim().toLowerCase()));
}

module.exports = { syncProdutosFromErp, nomesAdesivoNaoUsados };
