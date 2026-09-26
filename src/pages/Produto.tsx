import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fmt, type Produto as ProdutoType } from '../data';
import { useProdutos } from '../hooks/useProdutos';
import { useCart } from '../context/CartContext';
import { useWhatsapp } from '../context/WhatsappContext';
import { usePromocao } from '../context/PromocaoContext';
import { WhatsAppIcon } from '../icons';
import { whatsappLink } from '../config';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';

// Emoji de apoio quando o produto não tem foto — mesmo mapa do ProductCard.
function emojiDaCategoria(categoria: string) {
  const c = categoria.toLowerCase();
  if (c.includes('caneca')) return '☕';
  if (c.includes('cart')) return '💌';
  if (c.includes('banner')) return '🚩';
  if (c.includes('adesivo')) return '✨';
  return '🎁';
}

// Página de verdade pro que era o card de produto expandido. Cobre os três
// tipos que têm uma "ficha" própria — simples, multi (opções em botão, tipo
// quantidade/cor/acabamento — inclui Cartão de Visita e Adesivo UV/Vinil,
// que usam esse mesmo layout) e medida (largura×altura livre). Visual:
// `produto/[nome]/page.tsx` do protótipo `loja-virtual` (galeria em
// polaroid, caixa de descrição, "Você também pode gostar").
export default function Produto() {
  const { id = '' } = useParams();
  const nome = decodeURIComponent(id);
  const navigate = useNavigate();
  const { catalogo } = useProdutos();
  const { addToCart } = useCart();
  const whatsapp = useWhatsapp();
  const { fator, percentual } = usePromocao();

  const produto = (catalogo.find(p => p.nome === nome) ?? null) as ProdutoType | null;

  const [corSelecionada, setCorSelecionada] = useState<string | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [observacao, setObservacao] = useState('');
  const [selMulti, setSelMulti] = useState<Record<string, string>>({});
  const [larg, setLarg] = useState(1);
  const [alt, setAlt] = useState(1);

  // Reseta a seleção sempre que o produto (parâmetro da rota) muda.
  useEffect(() => {
    setCorSelecionada(produto?.tipo === 'simples' ? produto.cores?.[0]?.nome ?? null : null);
    setQuantidade(1);
    setObservacao('');
    setSelMulti(produto?.tipo === 'multi' ? Object.fromEntries(produto.dims.map(d => [d.key, d.options[0]])) : {});
    setLarg(1);
    setAlt(1);
    window.scrollTo(0, 0);
  }, [nome]);

  const relacionados = useMemo(
    () => (produto ? catalogo.filter(p => p.categoria === produto.categoria && p.nome !== produto.nome).slice(0, 4) : []),
    [catalogo, produto],
  );

  if (!produto) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header page={null} onGoPage={(_next, scrollToId) => navigate('/', { state: scrollToId ? { scrollTo: scrollToId } : undefined })} onOpenCart={() => navigate('/carrinho')} />
        <div className="mx-auto max-w-2xl flex-1 px-4 py-16 text-center">
          <p className="mb-4 text-ink-muted">Produto não encontrado neste catálogo.</p>
          <button className="font-semibold text-rose" onClick={() => navigate('/produtos')}>← Voltar pro catálogo</button>
        </div>
        <Footer />
      </div>
    );
  }

  // ── preço + nome-pro-pedido, um por tipo ──
  const corObj = produto.tipo === 'simples' ? produto.cores?.find(c => c.nome === corSelecionada) ?? null : null;

  // `selMulti` só é preenchido pelo useEffect (depois do primeiro render) —
  // até lá ele chega vazio aqui embaixo. Sem esse fallback, produto.preco()
  // recebe chave undefined pra algum dim e quebra a página (branco na hora).
  const selMultiAtual = produto.tipo === 'multi'
    ? Object.fromEntries(produto.dims.map(d => [d.key, selMulti[d.key] ?? d.options[0]]))
    : selMulti;

  // Alguns produtos "multi" (Wind Banner, Cartão Duplo) trocam de foto
  // conforme a combinação escolhida — cada combinação é um produto próprio
  // no admin, com sua própria foto.
  const fotoExibida = corObj?.foto
    || (produto.tipo === 'multi' ? produto.fotoPorCombo?.(selMultiAtual) : undefined)
    || produto.imagem;

  const m2 = Math.max(0.1, larg) * Math.max(0.1, alt);
  // Pra produto "multi" vendido por m² (Adesivo UV/Vinil), `preco()` devolve
  // a taxa por m² — o valor final é essa taxa vezes a área escolhida.
  const precoMultiCheio = produto.tipo === 'multi' ? produto.preco(selMultiAtual) : null;
  const precoMultiFinal = produto.tipo === 'multi' && precoMultiCheio != null
    ? (produto.porM2 ? precoMultiCheio * m2 : precoMultiCheio)
    : null;
  // Produto por metro linear (ex.: DTF Têxtil) só pede o comprimento —
  // `larg` faz esse papel, e a "área" vira os metros.
  const linear = produto.tipo === 'medida' && !!produto.linear;
  const medidaQtd = linear ? Math.max(0.1, larg) : m2;
  const unidadeMedida = linear ? 'm' : 'm²';
  const precoMedidaCheio = produto.tipo === 'medida' ? medidaQtd * produto.precoM2 : null;

  const preco =
    produto.tipo === 'simples' ? produto.preco :
    produto.tipo === 'multi' ? (precoMultiFinal != null ? precoMultiFinal * fator : null) :
    precoMedidaCheio! * fator;

  const nomeParaPedido =
    produto.tipo === 'simples' ? (produto.cores?.length && corSelecionada ? `${produto.nome} (${corSelecionada})` : produto.nome) :
    produto.tipo === 'multi' ? `${produto.nome} (${produto.dims.map(d => selMultiAtual[d.key]).join(' · ')}${produto.porM2 ? ` · ${larg.toFixed(2).replace('.', ',')}m × ${alt.toFixed(2).replace('.', ',')}m` : ''})` :
    linear ? `${produto.nome} (${medidaQtd.toFixed(2).replace('.', ',')}m)` :
    `${produto.nome} (${larg.toFixed(2).replace('.', ',')}m × ${alt.toFixed(2).replace('.', ',')}m = ${m2.toFixed(2).replace('.', ',')}m²)`;

  const qtdPedido = produto.tipo === 'simples' ? quantidade : 1;
  const erp = {
    erpId: produto.tipo === 'simples' || produto.tipo === 'medida' ? produto.erpId : produto.erpIdPorCombo?.(selMultiAtual),
    m2: produto.tipo === 'medida' ? medidaQtd : produto.tipo === 'multi' && produto.porM2 ? m2 : undefined,
  };
  const podeAdicionar = preco != null;
  const mensagemWhats = podeAdicionar
    ? `Olá! Quero pedir: ${nomeParaPedido}${qtdPedido > 1 ? ` — ${qtdPedido} un` : ''} — ${fmt(preco! * qtdPedido)}${observacao ? `\nObs: ${observacao}` : ''}`
    : `Olá! Quero pedir: ${nomeParaPedido}`;

  function adicionar() {
    if (preco == null) return;
    addToCart(nomeParaPedido, preco, qtdPedido, produto!.tipo === 'simples' ? observacao : undefined, undefined, fotoExibida, erp);
    navigate('/produtos');
  }

  function comprarAgora() {
    if (preco == null) return;
    addToCart(nomeParaPedido, preco, qtdPedido, produto!.tipo === 'simples' ? observacao : undefined, undefined, fotoExibida, erp);
    navigate('/carrinho', { state: { openCheckout: true } });
  }

  const temDesconto = produto.tipo === 'simples' && !!produto.descontoPercentual && (produto.precoOriginal ?? 0) > produto.preco;

  return (
    <div className="flex min-h-screen flex-col">
      <Header page={null} onGoPage={(_next, scrollToId) => navigate('/', { state: scrollToId ? { scrollTo: scrollToId } : undefined })} onOpenCart={() => navigate('/carrinho')} />
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 pb-0 pt-8 md:pt-12">
        <nav className="mb-6 text-sm text-ink-muted">
          <span className="cursor-pointer hover:text-rose" onClick={() => navigate('/')}>Início</span>{' '}
          / <span className="cursor-pointer hover:text-rose" onClick={() => navigate('/produtos')}>Produtos</span>{' '}
          / <span className="text-ink">{produto.nome}</span>
        </nav>

        <div className="grid gap-8 md:grid-cols-2">
          {/* galeria em polaroid, com a fita durex por cima */}
          <div>
            <div className="relative -rotate-1 rounded-md bg-white p-3 pb-8 shadow-lg transition hover:rotate-0">
              <span
                aria-hidden
                className="pointer-events-none absolute -top-3.5 left-1/2 z-20 h-9 w-40 -translate-x-1/2 shadow-sm"
                style={{ rotate: '-4deg', clipPath: 'polygon(0% 15%, 8% 2%, 20% 8%, 50% 3%, 80% 7%, 92% 2%, 100% 12%, 96% 40%, 100% 60%, 95% 85%, 88% 98%, 60% 92%, 30% 98%, 10% 93%, 3% 70%, 0% 45%, 4% 28%)', background: 'linear-gradient(120deg, rgba(227,92,158,0.60), rgba(255,255,255,0.30) 45%, rgba(227,92,158,0.66))' }}
              />
              <div className="relative aspect-square overflow-hidden rounded-sm bg-cream-100">
                {fotoExibida ? (
                  <img src={fotoExibida} alt={corObj ? `${produto.nome} — ${corObj.nome}` : produto.nome} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-linear-to-br from-rose-50 to-cream-100 text-7xl">
                    {emojiDaCategoria(produto.categoria)}
                  </div>
                )}
                {temDesconto && (
                  <span className="absolute left-3 top-3 rounded-full bg-rose px-3 py-1 text-sm font-bold text-white">-{produto.tipo === 'simples' ? produto.descontoPercentual : 0}%</span>
                )}
              </div>
            </div>
          </div>

          {/* infos */}
          <div className="flex flex-col">
            <span className="text-sm font-semibold uppercase tracking-wide text-ink-muted">{produto.categoria}</span>
            <h1 className="mt-2 font-display text-3xl font-extrabold text-ink md:text-4xl">{produto.nome}</h1>

            {produto.tipo === 'simples' && produto.especificacoes?.length ? (
              <ul className="mt-4 space-y-1">
                {produto.especificacoes.map((e, i) => (
                  <li key={i} className="text-sm text-ink-soft"><span className="mr-1 text-rose">›</span><strong>{e.chave}:</strong> {e.valor}</li>
                ))}
              </ul>
            ) : null}

            {produto.tipo === 'multi' ? (
              <>
                <p className="mt-3 text-sm text-ink-muted">
                  a partir de <span className="font-display text-lg font-extrabold text-ink">{fmt((precoMultiCheio ?? 0) * fator)}</span>{produto.porM2 && ' / m²'}
                </p>
                <div className="mt-6">
                  {produto.dims.map(d => (
                    <div key={d.key} className="mb-5">
                      <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-muted">{d.label}</p>
                      <div className="flex flex-wrap gap-2">
                        {d.options.map(op => (
                          <button
                            key={op}
                            onClick={() => setSelMulti(prev => ({ ...prev, [d.key]: op }))}
                            className={`rounded-2xl border px-5 py-2.5 font-semibold transition ${selMultiAtual[d.key] === op ? 'border-rose bg-rose-50 text-rose' : 'border-cream-200 bg-white text-ink-soft hover:border-rose-light'}`}
                          >
                            {op}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  {produto.porM2 && (
                    <>
                      <div className="mb-5 grid max-w-xs grid-cols-2 gap-3">
                        <label className="text-sm font-semibold text-ink-soft">Largura (m)
                          <input type="number" min={0.1} step={0.1} value={larg} onChange={e => setLarg(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                            className="mt-1 w-full rounded-xl border border-cream-200 px-3 py-2 text-ink outline-none focus:border-rose" />
                        </label>
                        <label className="text-sm font-semibold text-ink-soft">Altura (m)
                          <input type="number" min={0.1} step={0.1} value={alt} onChange={e => setAlt(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                            className="mt-1 w-full rounded-xl border border-cream-200 px-3 py-2 text-ink outline-none focus:border-rose" />
                        </label>
                      </div>
                      <p className="mb-5 text-sm text-ink-muted">{larg.toFixed(2).replace('.', ',')} × {alt.toFixed(2).replace('.', ',')} m = {m2.toFixed(2).replace('.', ',')} m²</p>
                    </>
                  )}

                  <div className="border-t border-cream-200 pt-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Valor</p>
                    <p className="font-display text-3xl font-extrabold text-ink">
                      {percentual > 0 && precoMultiFinal != null && <span className="mr-2 text-lg font-semibold text-faint line-through">{fmt(precoMultiFinal)}</span>}
                      {preco != null ? fmt(preco) : '—'}
                    </p>
                  </div>
                </div>
              </>
            ) : produto.tipo === 'medida' ? (
              <>
                <p className="mt-3 text-sm text-ink-muted">a partir de <span className="font-display text-lg font-extrabold text-ink">{fmt(produto.precoM2 * fator)}</span> / {unidadeMedida}</p>
                <div className="mt-6">
                  <p className="text-sm text-ink-muted">Preço por {linear ? 'metro' : 'm²'}: <span className="font-semibold text-ink">{fmt(produto.precoM2)}</span></p>
                  {linear ? (
                    <div className="mt-4 max-w-[10rem]">
                      <label className="text-sm font-semibold text-ink-soft">Comprimento (m)
                        <input type="number" min={0.1} step={0.1} value={larg} onChange={e => setLarg(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                          className="mt-1 w-full rounded-xl border border-cream-200 px-3 py-2 text-ink outline-none focus:border-rose" />
                      </label>
                    </div>
                  ) : (<>
                  <div className="mt-4 grid max-w-xs grid-cols-2 gap-3">
                    <label className="text-sm font-semibold text-ink-soft">Largura (m)
                      <input type="number" min={0.1} step={0.1} value={larg} onChange={e => setLarg(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                        className="mt-1 w-full rounded-xl border border-cream-200 px-3 py-2 text-ink outline-none focus:border-rose" />
                    </label>
                    <label className="text-sm font-semibold text-ink-soft">Altura (m)
                      <input type="number" min={0.1} step={0.1} value={alt} onChange={e => setAlt(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                        className="mt-1 w-full rounded-xl border border-cream-200 px-3 py-2 text-ink outline-none focus:border-rose" />
                    </label>
                  </div>
                  <p className="mt-3 text-sm text-ink-muted">{larg.toFixed(2).replace('.', ',')} × {alt.toFixed(2).replace('.', ',')} m = {m2.toFixed(2).replace('.', ',')} m²</p>
                  </>)}
                  <div className="mt-5 border-t border-cream-200 pt-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Valor</p>
                    <p className="font-display text-3xl font-extrabold text-ink">
                      {percentual > 0 && <span className="mr-2 text-lg font-semibold text-faint line-through">{fmt(precoMedidaCheio!)}</span>}
                      {fmt(preco!)}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-4 flex items-end gap-3">
                <span className="font-display text-3xl font-extrabold text-ink">{fmt(produto.preco * quantidade)}</span>
                {temDesconto && <span className="pb-1 text-lg text-ink-muted line-through">{fmt(produto.precoOriginal! * quantidade)}</span>}
              </div>
            )}

            <div className="mt-6 rounded-2xl bg-cream-100 p-5 text-ink-soft">
              {produto.tipo === 'simples' && produto.descricao ? (
                <p className="whitespace-pre-line">{produto.descricao}</p>
              ) : (
                <p className="text-ink-muted">Produto personalizado feito com muito carinho. 💗 Fale com a gente pra combinar as artes, cores e detalhes do seu jeitinho!</p>
              )}
            </div>

            {produto.tipo === 'simples' && (
              <div className="mt-6">
                {produto.cores?.length ? (
                  <div className="mb-5">
                    <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-muted">Cor</p>
                    <div className="flex flex-wrap gap-2">
                      {produto.cores.map(cor => (
                        <button
                          key={cor.nome}
                          onClick={() => setCorSelecionada(cor.nome)}
                          className={`flex items-center gap-2 rounded-2xl border px-5 py-2.5 font-semibold transition ${corSelecionada === cor.nome ? 'border-rose bg-rose-50 text-rose' : 'border-cream-200 bg-white text-ink-soft hover:border-rose-light'}`}
                        >
                          {cor.foto && <img src={cor.foto} alt="" className="h-4 w-4 rounded-full object-cover" />}
                          {cor.nome}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="mb-5">
                  <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-muted">Quantidade</p>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setQuantidade(q => Math.max(1, q - 1))} className="grid h-8 w-8 place-items-center rounded-full bg-cream-200 font-bold text-ink">−</button>
                    <span className="w-6 text-center font-semibold">{quantidade}</span>
                    <button type="button" onClick={() => setQuantidade(q => q + 1)} className="grid h-8 w-8 place-items-center rounded-full bg-cream-200 font-bold text-ink">+</button>
                  </div>
                </div>

                <label className="mb-5 block">
                  <span className="mb-2 block text-sm font-semibold uppercase tracking-wide text-ink-muted">Observação (opcional)</span>
                  <textarea
                    rows={2} value={observacao} onChange={e => setObservacao(e.target.value)}
                    placeholder="Ex.: essa unidade é com a foto da Maria — se pedir mais de uma arte diferente, adicione cada uma separada com sua observação"
                    className="w-full rounded-2xl border border-cream-200 px-4 py-3 text-sm outline-none focus:border-rose"
                  />
                </label>
              </div>
            )}

            <div className="mt-2 space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  onClick={adicionar} disabled={!podeAdicionar}
                  className="rounded-2xl bg-ink px-6 py-3.5 font-bold text-cream-50 transition hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Adicionar ao pedido
                </button>
                <button
                  onClick={comprarAgora} disabled={!podeAdicionar}
                  style={{ background: 'var(--amber)' }}
                  className="rounded-2xl px-6 py-3.5 font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ⚡ Comprar agora
                </button>
              </div>
              <a
                href={whatsappLink(whatsapp, mensagemWhats)} target="_blank" rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose px-6 py-3.5 font-bold text-rose transition hover:bg-rose-50"
              >
                <WhatsAppIcon /> Comprar pelo WhatsApp
              </a>
            </div>
          </div>
        </div>

        {relacionados.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-6 font-display text-2xl font-extrabold text-ink">Você também pode gostar</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:gap-6">
              {relacionados.map((p, i) => (
                <ProductCard
                  key={('id' in p ? p.id : p.nome) + i}
                  produto={p}
                  index={i}
                  onOpenDetalhe={p2 => navigate(`/produto/${encodeURIComponent(p2.nome)}`)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
      <Footer />
    </div>
  );
}
