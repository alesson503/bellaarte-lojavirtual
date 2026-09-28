// Sincronização com o ERP — busca os produtos uma vez e atualiza duas
// coisas com o mesmo resultado:
//  1) todos os produtos ativos do ERP (a loja inteira vem daqui)
//  2) a tabela de preço do Adesivo (por nome esperado) — só pro painel
//     admin conferir; o configurador usa os produtos do item 1.
const { pool } = require('./db');

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

  // 1) Todos os produtos ativos do ERP (foto do ERP só entra se ninguém
  // subiu uma manual aqui na loja antes — ver imagem_origem). Os que têm
  // variações (Panfletos, Cartão de Visita, Placa PS…) são agrupados no
  // front (src/hooks/useProdutos.ts), não aqui.
  const simples = todosDoErp;
  const vistosErpIds = [];
  for (const p of simples) {
    vistosErpIds.push(p.erp_id ?? p.id);
    await pool.query(
      `INSERT INTO produtos (nome, categoria, preco, unidade, ativo, origem, erp_id, imagem_url, imagem_origem, erp_grupo, erp_opcao, erp_especificacoes, erp_descricao)
       VALUES ($1, $2, $3, $4, true, 'erp', $5, $6, CASE WHEN $6::text IS NOT NULL THEN 'erp' ELSE 'nenhuma' END, $7, $8, $9::jsonb, $10)
       ON CONFLICT (erp_id) DO UPDATE SET
         nome = EXCLUDED.nome, categoria = EXCLUDED.categoria, preco = EXCLUDED.preco,
         unidade = EXCLUDED.unidade, fora_do_erp = false, atualizado_em = now(),
         erp_grupo = EXCLUDED.erp_grupo, erp_opcao = EXCLUDED.erp_opcao, erp_especificacoes = EXCLUDED.erp_especificacoes,
         erp_descricao = EXCLUDED.erp_descricao,
         imagem_url = CASE WHEN produtos.imagem_origem = 'manual' THEN produtos.imagem_url ELSE EXCLUDED.imagem_url END,
         imagem_origem = CASE
           WHEN produtos.imagem_origem = 'manual' THEN 'manual'
           WHEN EXCLUDED.imagem_url IS NOT NULL THEN 'erp'
           ELSE 'nenhuma'
         END`,
      [p.nome, p.categoria, Number(p.preco), p.unidade_venda === 'm2' ? 'm²' : p.unidade_venda === 'ml' ? 'm' : null, p.id, p.foto_url || null,
       p.loja_grupo || null, p.loja_opcao || null, JSON.stringify(Array.isArray(p.loja_especificacoes) ? p.loja_especificacoes : []),
       p.loja_descricao || null]
    );
  }
  if (vistosErpIds.length) {
    await pool.query(
      // Saiu do ERP: some da loja, mas sem mexer no "Visível na loja" que o
      // admin escolheu (se voltar pro ERP, volta do jeito que estava).
      `UPDATE produtos SET fora_do_erp = true, atualizado_em = now()
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
