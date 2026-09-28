// Peças compartilhadas entre os dois jeitos de mandar um pedido pro ERP:
// o botão "Enviar pro ERP" do painel admin daqui (routes/pedidos.js) e o
// painel "Loja Virtual" dentro do ERP, que puxa o pedido (routes/erp.js).
const { pool } = require('./db');

// O ERP não precisa (e não deveria) receber o arquivo de arte em base64 —
// só um aviso em texto de que tem arte anexada (o arquivo em si fica só
// aqui na loja, pra não sobrecarregar o ERP à toa).
function itensSemArte(itens) {
  return (itens || []).map(item => {
    if (!item?.arte?.frente && !item?.arte?.verso) return item;
    const { arte, ...resto } = item;
    const nomes = [arte.frente && `frente: ${arte.frente.nome}`, arte.verso && `verso: ${arte.verso.nome}`].filter(Boolean).join(', ');
    const notaArte = `Arte anexada (${nomes}) — baixar no painel da loja`;
    return { ...resto, observacao: [resto.observacao, notaArte].filter(Boolean).join(' | ') };
  });
}

// Marca o pedido como enviado ANTES de criar a venda no ERP — em uma query
// só, então se os dois painéis clicarem juntos, só um consegue (o outro
// recebe null e avisa "já foi enviado"). Se a venda der errado, `liberar`
// desfaz a marca.
async function reservar(id) {
  const { rows } = await pool.query(
    'UPDATE pedidos SET enviado_erp = true WHERE id = $1 AND enviado_erp = false RETURNING *',
    [id]
  );
  return rows[0] || null;
}

async function liberar(id) {
  await pool.query('UPDATE pedidos SET enviado_erp = false WHERE id = $1 AND erp_numero IS NULL', [id]);
}

async function concluir(id, erpNumero) {
  const { rows } = await pool.query(
    'UPDATE pedidos SET enviado_erp = true, erp_numero = $2 WHERE id = $1 RETURNING *',
    [id, erpNumero || null]
  );
  return rows[0] || null;
}

// Avisa o ERP que entrou pedido novo (ele manda a notificação pra quem tem
// a permissão "Loja Virtual"). Não trava nem derruba o pedido do cliente
// se o ERP estiver fora do ar — o pedido continua salvo aqui do mesmo jeito.
function avisarErpPedidoNovo(pedido) {
  if (!process.env.ERP_API_URL || !process.env.ERP_API_SECRET) return;
  fetch(`${process.env.ERP_API_URL}/api/pedidos-site/notificar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-loja-secret': process.env.ERP_API_SECRET },
    body: JSON.stringify({ id: pedido.id, nome: pedido.nome, total: Number(pedido.total) || 0 }),
    signal: AbortSignal.timeout(8000),
  }).catch(err => console.error('Aviso de pedido novo pro ERP falhou:', err.message));
}

module.exports = { itensSemArte, reservar, liberar, concluir, avisarErpPedidoNovo };
