import type { Produto } from '../data';
import { fmt } from '../data';
import { usePromocao } from '../context/PromocaoContext';

// Emoji de apoio quando o produto não tem foto — mesma ideia do protótipo
// `loja-virtual` (imagem-produto.tsx), adaptado pras categorias reais daqui.
function emojiDaCategoria(categoria: string) {
  const c = categoria.toLowerCase();
  if (c.includes('caneca')) return '☕';
  if (c.includes('cart')) return '💌';
  if (c.includes('banner')) return '🚩';
  if (c.includes('adesivo')) return '✨';
  return '🎁';
}

// Inclinações alternadas (efeito mural de polaroids) e fitas durex com
// pontas rasgadas diferentes — cada card usa uma, pelo índice na grade.
const ROTACOES = ['-rotate-2', 'rotate-2', '-rotate-1', 'rotate-1'];
const FITAS = [
  { clip: 'polygon(0% 15%, 8% 2%, 20% 8%, 50% 3%, 80% 7%, 92% 2%, 100% 12%, 96% 40%, 100% 60%, 95% 85%, 88% 98%, 60% 92%, 30% 98%, 10% 93%, 3% 70%, 0% 45%, 4% 28%)', rot: -5 },
  { clip: 'polygon(2% 10%, 14% 0%, 35% 6%, 55% 1%, 78% 8%, 100% 4%, 97% 35%, 100% 68%, 93% 96%, 72% 90%, 45% 97%, 22% 91%, 6% 98%, 0% 72%, 5% 40%, 0% 18%)', rot: 4 },
  { clip: 'polygon(0% 8%, 12% 4%, 40% 0%, 65% 6%, 90% 1%, 100% 18%, 95% 50%, 100% 82%, 85% 100%, 55% 93%, 25% 100%, 8% 94%, 2% 64%, 0% 34%)', rot: -3 },
  { clip: 'polygon(3% 6%, 25% 2%, 50% 8%, 75% 2%, 98% 6%, 100% 40%, 96% 72%, 100% 94%, 78% 98%, 50% 92%, 28% 99%, 5% 95%, 0% 62%, 4% 30%)', rot: 6 },
];

// Menor preço entre todas as combinações de opções — só pra mostrar "a
// partir de" no card do catálogo (a escolha de verdade acontece na página
// de detalhe). Produto com poucas dimensões/opções, então força-bruta é ok.
function precoMinimoMulti(produto: Extract<Produto, { tipo: 'multi' }>): number | null {
  let combos: Record<string, string>[] = [{}];
  for (const d of produto.dims) {
    combos = combos.flatMap(c => d.options.map(op => ({ ...c, [d.key]: op })));
  }
  const precos = combos.map(c => produto.preco(c)).filter((p): p is number => p != null);
  return precos.length ? Math.min(...precos) : null;
}

export default function ProductCard({
  produto,
  index = 0,
  onOpenDetalhe,
}: {
  produto: Produto;
  index?: number;
  onOpenDetalhe: (produto: Produto) => void;
}) {
  const { fator, percentual } = usePromocao();
  const rot = ROTACOES[index % ROTACOES.length];
  const fita = FITAS[index % FITAS.length];

  const botaoDurex = 'flex w-full items-center justify-center gap-1.5 -rotate-1 rounded-[4px] bg-rose/35 px-4 py-1.5 font-hand text-lg font-bold text-rose shadow-sm ring-1 ring-white/50 transition hover:bg-rose/50';

  const tapa = (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute -top-3 left-1/2 z-20 h-8 w-32 -translate-x-1/2 shadow-sm"
        style={{ rotate: `${fita.rot}deg`, clipPath: fita.clip, background: 'linear-gradient(120deg, rgba(227,92,158,0.60), rgba(255,255,255,0.30) 45%, rgba(227,92,158,0.66))' }}
      />
      <span aria-hidden className="pointer-events-none absolute left-2 top-1 z-30 text-xl text-rose">♡</span>
    </>
  );

  // multi, medida e simples viram todos o mesmo card — foto + nome + "a
  // partir de" + botão que abre a página de detalhe (é lá que a
  // quantidade/cor/tamanho/medida são escolhidas).
  let precoExibido: number | null;
  let unidade: string | undefined;
  let precoOriginalExibido: number | undefined;
  if (produto.tipo === 'multi') {
    const minCheio = precoMinimoMulti(produto);
    precoExibido = minCheio != null ? minCheio * fator : null;
    unidade = produto.unidade;
  } else if (produto.tipo === 'medida') {
    precoExibido = produto.precoM2 * fator;
    unidade = 'm²';
  } else {
    precoExibido = produto.preco;
    unidade = produto.unidade;
    precoOriginalExibido = produto.precoOriginal;
  }
  const precisaEscolher = produto.tipo !== 'simples';
  const temDesconto = produto.tipo === 'simples' ? !!produto.descontoPercentual : percentual > 0;

  return (
    <article className={`group relative flex flex-col rounded-md bg-white p-2.5 pb-3 shadow-md transition hover:-translate-y-1 hover:rotate-0 hover:shadow-xl ${rot}`}>
      {tapa}
      <button className="relative block aspect-square w-full overflow-hidden rounded-sm bg-cream-100" onClick={() => onOpenDetalhe(produto)}>
        {produto.imagem ? (
          <img src={produto.imagem} alt={produto.nome} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-linear-to-br from-rose-50 to-cream-100 text-6xl">
            <span>{emojiDaCategoria(produto.categoria)}</span>
          </div>
        )}
        {temDesconto && (
          <span className="absolute left-2 top-2 rounded-full bg-rose px-2.5 py-1 text-xs font-bold text-white">
            -{produto.tipo === 'simples' ? produto.descontoPercentual : percentual}%
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col px-1 pt-2 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-muted">{produto.categoria}</p>
        <button onClick={() => onOpenDetalhe(produto)}>
          <h3 className="mt-0.5 font-display text-sm font-bold leading-tight text-ink hover:text-rose">{produto.nome}</h3>
        </button>

        <div className="mt-1 leading-tight">
          {precisaEscolher ? (
            <span className="block text-[10px] text-ink-muted">a partir de</span>
          ) : (
            precoOriginalExibido != null && precoOriginalExibido > (precoExibido ?? 0) && (
              <span className="block text-[10px] text-ink-muted line-through">{fmt(precoOriginalExibido)}</span>
            )
          )}
          {precoExibido == null ? (
            <span className="font-display text-sm font-bold text-ink-muted">combinação indisponível</span>
          ) : (
            <span className="font-display text-base font-extrabold text-ink">
              {fmt(precoExibido)}{unidade && <span className="text-[10px] font-semibold text-ink-muted"> /{unidade}</span>}
            </span>
          )}
        </div>

        <div className="mt-3 flex justify-center">
          <button className={botaoDurex} style={{ fontFamily: 'var(--font-caveat)' }} onClick={() => onOpenDetalhe(produto)}>
            🛒 {precisaEscolher ? 'Escolher' : 'Ver detalhe'}
          </button>
        </div>
      </div>
    </article>
  );
}
