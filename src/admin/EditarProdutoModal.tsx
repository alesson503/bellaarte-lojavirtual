import { useEffect, useRef, useState } from 'react';
import { uploadImagemProduto, removerImagemProduto, atualizarProdutoLoja, type LojaProduto } from '../services/productsService';
import { imageToDataUrl } from '../lib/imageToDataUrl';
import { fmt } from '../data';

// Painel único pra editar tudo de um produto da loja (foto, desconto,
// descrição, cores, especificações) — em vez de campos espalhados e
// espremidos numa linha de tabela.
export default function EditarProdutoModal({
  produto,
  onClose,
  onChanged,
}: {
  produto: LojaProduto | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [imagemUrl, setImagemUrl] = useState<string | null>(null);
  const [descontoValor, setDescontoValor] = useState('');
  const [descricaoValor, setDescricaoValor] = useState('');
  const [cores, setCores] = useState<{ nome: string; foto: string | null }[]>([]);
  const [especificacoesValor, setEspecificacoesValor] = useState('');
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [enviandoFotoCor, setEnviandoFotoCor] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const corFileInputRef = useRef<HTMLInputElement>(null);
  const corAlvoIndexRef = useRef<number | null>(null);

  useEffect(() => {
    setImagemUrl(produto?.imagem_url ?? null);
    setDescontoValor(produto && produto.desconto_percentual > 0 ? String(produto.desconto_percentual) : '');
    setDescricaoValor(produto?.descricao || '');
    setCores((produto?.cores || []).map(c => ({ nome: c.nome, foto: c.foto })));
    setEspecificacoesValor((produto?.especificacoes || []).map(e => `${e.chave}: ${e.valor}`).join('\n'));
    setErro('');
  }, [produto]);

  if (!produto) return null;

  function addCor() {
    setCores(prev => [...prev, { nome: '', foto: null }]);
  }
  function renomearCor(i: number, nome: string) {
    setCores(prev => prev.map((c, idx) => (idx === i ? { ...c, nome } : c)));
  }
  function removerCor(i: number) {
    setCores(prev => prev.filter((_, idx) => idx !== i));
  }
  function pedirFotoCor(i: number) {
    corAlvoIndexRef.current = i;
    corFileInputRef.current?.click();
  }
  async function onFotoCorEscolhida(file: File | null) {
    const i = corAlvoIndexRef.current;
    if (!file || i == null) return;
    setEnviandoFotoCor(i);
    try {
      const dataUrl = await imageToDataUrl(file, 500, 'image/jpeg', 0.85);
      setCores(prev => prev.map((c, idx) => (idx === i ? { ...c, foto: dataUrl } : c)));
    } catch {
      alert('Não foi possível processar essa imagem.');
    } finally {
      setEnviandoFotoCor(null);
    }
  }
  function removerFotoCor(i: number) {
    setCores(prev => prev.map((c, idx) => (idx === i ? { ...c, foto: null } : c)));
  }

  async function onArquivoEscolhido(file: File | null) {
    if (!file || !produto) return;
    setEnviandoFoto(true);
    try {
      const dataUrl = await imageToDataUrl(file, 600, 'image/jpeg', 0.85);
      await uploadImagemProduto(produto.id, dataUrl);
      setImagemUrl(dataUrl);
      onChanged();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Não foi possível enviar essa imagem.');
    } finally {
      setEnviandoFoto(false);
    }
  }

  async function tirarFoto() {
    if (!produto) return;
    setEnviandoFoto(true);
    try {
      await removerImagemProduto(produto.id);
      setImagemUrl(null);
      onChanged();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Não foi possível remover a foto.');
    } finally {
      setEnviandoFoto(false);
    }
  }

  async function salvar() {
    if (!produto) return;
    setErro('');
    setSalvando(true);
    try {
      const coresValidas = cores.map(c => ({ nome: c.nome.trim(), foto: c.foto })).filter(c => c.nome);
      const especificacoes = especificacoesValor.split('\n')
        .map(linha => {
          const i = linha.indexOf(':');
          if (i < 0) return null;
          const chave = linha.slice(0, i).trim();
          const valor = linha.slice(i + 1).trim();
          return chave && valor ? { chave, valor } : null;
        })
        .filter((e): e is { chave: string; valor: string } => e != null);
      await atualizarProdutoLoja(produto.id, {
        desconto_percentual: descontoValor.trim() === '' ? null : Number(descontoValor),
        descricao: descricaoValor.trim(),
        cores: coresValidas,
        especificacoes,
      });
      onChanged();
      onClose();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar o produto.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-ink/45 p-5 backdrop-blur-[2px]" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="max-h-[88vh] w-full max-w-xl overflow-auto rounded-3xl bg-white p-7">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold text-ink">{produto.nome}</h2>
            <p className="mt-1 text-sm text-ink-muted">
              {produto.categoria} · {fmt(produto.preco_original)}{produto.unidade && ` /${produto.unidade}`}
              {produto.origem === 'erp' && ' · nome, categoria e preço vêm do seu sistema (edite lá)'}
            </p>
          </div>
          <button className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-muted hover:bg-cream-100 hover:text-ink" onClick={onClose}>✕</button>
        </div>

        <div className="mb-5 rounded-2xl border border-cream-200 p-4">
          <p className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-muted">Foto</p>
          <div className="flex items-center gap-4">
            {imagemUrl ? (
              <img src={imagemUrl} alt={produto.nome} className="h-17 w-17 rounded-xl object-cover" />
            ) : (
              <div className="h-17 w-17 rounded-xl border border-dashed border-cream-200 bg-cream-50" />
            )}
            <div className="flex gap-3">
              {enviandoFoto ? (
                <span className="text-sm text-ink-muted">Enviando…</span>
              ) : (
                <>
                  <button className="font-semibold text-rose hover:underline" onClick={() => fileInputRef.current?.click()}>
                    {imagemUrl ? 'Trocar foto' : 'Subir foto'}
                  </button>
                  {imagemUrl && (
                    <button className="font-semibold text-ink-muted hover:text-rose hover:underline" onClick={tirarFoto}>
                      Remover foto
                    </button>
                  )}
                </>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={e => onArquivoEscolhido(e.target.files?.[0] ?? null)} />
          </div>
        </div>

        <div className="mb-5 rounded-2xl border border-cream-200 p-4">
          <p className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-muted">Informações</p>
          <label className="mb-3 block">
            <span className="mb-1.5 block text-sm font-semibold text-ink-soft">Desconto (%)</span>
            <input
              value={descontoValor} onChange={e => setDescontoValor(e.target.value)}
              placeholder="Ex.: 10 — deixe em branco pra não ter desconto"
              className="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm outline-none focus:border-rose"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink-soft">Descrição</span>
            <textarea
              rows={3} value={descricaoValor} onChange={e => setDescricaoValor(e.target.value)}
              placeholder="O que o cliente vê na página do produto"
              className="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm outline-none focus:border-rose"
            />
          </label>
        </div>

        <div className="mb-5 rounded-2xl border border-cream-200 p-4">
          <p className="mb-1 text-sm font-bold uppercase tracking-wide text-ink-muted">Cores disponíveis</p>
          <p className="mb-3 text-sm text-ink-muted">Cada cor pode ter sua própria foto — se não subir uma, o cliente vê a foto principal do produto.</p>
          <div className="flex flex-col gap-2">
            {cores.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                {c.foto ? (
                  <img src={c.foto} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="h-9 w-9 shrink-0 rounded-lg border border-dashed border-cream-200 bg-cream-50" />
                )}
                <input
                  value={c.nome} onChange={e => renomearCor(i, e.target.value)} placeholder="Nome da cor"
                  className="h-9 flex-1 rounded-lg border border-cream-200 px-2.5 text-sm outline-none focus:border-rose"
                />
                {enviandoFotoCor === i ? (
                  <span className="text-xs text-ink-muted">...</span>
                ) : (
                  <>
                    <button className="whitespace-nowrap text-sm font-semibold text-rose hover:underline" onClick={() => pedirFotoCor(i)}>
                      {c.foto ? 'Trocar foto' : 'Foto'}
                    </button>
                    {c.foto && (
                      <button className="whitespace-nowrap text-sm font-semibold text-ink-muted hover:text-rose hover:underline" onClick={() => removerFotoCor(i)}>
                        Remover foto
                      </button>
                    )}
                  </>
                )}
                <button className="text-ink-muted hover:text-rose" onClick={() => removerCor(i)}>✕</button>
              </div>
            ))}
          </div>
          <button className="mt-2.5 text-sm font-semibold text-rose hover:underline" onClick={addCor}>+ Adicionar cor</button>
          <input ref={corFileInputRef} type="file" accept="image/*" className="hidden"
            onChange={e => onFotoCorEscolhida(e.target.files?.[0] ?? null)} />
        </div>

        <div className="mb-5 rounded-2xl border border-cream-200 p-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold uppercase tracking-wide text-ink-muted">Especificações (uma por linha, "Chave: Valor")</span>
            <textarea
              rows={4} value={especificacoesValor} onChange={e => setEspecificacoesValor(e.target.value)}
              placeholder={'Formato: 9,7x8,5cm\nMaterial: Porcelana\nProdução: 2 dias úteis'}
              className="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm outline-none focus:border-rose"
            />
          </label>
        </div>

        {erro && <p className="mb-4 text-sm font-semibold text-rose">{erro}</p>}

        <div className="flex gap-3">
          <button className="flex-1 rounded-2xl border border-cream-200 px-6 py-3 font-bold text-ink transition hover:border-rose hover:text-rose" onClick={onClose}>
            Cancelar
          </button>
          <button className="flex-1 rounded-2xl bg-rose px-6 py-3 font-bold text-white transition hover:brightness-95 disabled:opacity-50" disabled={salvando} onClick={salvar}>
            {salvando ? 'Salvando…' : 'Salvar produto'}
          </button>
        </div>
      </div>
    </div>
  );
}
