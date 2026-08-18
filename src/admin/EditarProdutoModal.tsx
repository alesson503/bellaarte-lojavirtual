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
  const [coresValor, setCoresValor] = useState('');
  const [especificacoesValor, setEspecificacoesValor] = useState('');
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImagemUrl(produto?.imagem_url ?? null);
    setDescontoValor(produto && produto.desconto_percentual > 0 ? String(produto.desconto_percentual) : '');
    setDescricaoValor(produto?.descricao || '');
    setCoresValor((produto?.cores || []).join(', '));
    setEspecificacoesValor((produto?.especificacoes || []).map(e => `${e.chave}: ${e.valor}`).join('\n'));
    setErro('');
  }, [produto]);

  const open = produto != null;

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
      const cores = coresValor.split(',').map(c => c.trim()).filter(Boolean);
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
        cores,
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
    <div className={`modal-overlay ${open ? 'open' : ''}`} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      {produto && (
        <div className="modal-box">
          <button className="modal-close" onClick={onClose}>✕</button>
          <h2 className="serif">{produto.nome}</h2>
          <p className="modal-sub">
            {produto.categoria} · {fmt(produto.preco_original)}{produto.unidade && ` /${produto.unidade}`}
            {produto.origem === 'erp' && ' · nome, categoria e preço vêm do seu sistema (edite lá)'}
          </p>

          <div className="field-group">
            <label>Foto</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {imagemUrl ? (
                <img src={imagemUrl} alt={produto.nome} style={{ width: 68, height: 68, borderRadius: 10, objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 68, height: 68, borderRadius: 10, background: 'var(--paper)', border: '1px dashed var(--line)' }} />
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                {enviandoFoto ? (
                  <span style={{ fontSize: 12.5, color: 'var(--graphite-faint)' }}>Enviando…</span>
                ) : (
                  <>
                    <button className="adm-link-btn" style={{ margin: 0 }} onClick={() => fileInputRef.current?.click()}>
                      {imagemUrl ? 'Trocar foto' : 'Subir foto'}
                    </button>
                    {imagemUrl && (
                      <button className="adm-link-btn" style={{ margin: 0, color: 'var(--blush-deep)' }} onClick={tirarFoto}>
                        Remover foto
                      </button>
                    )}
                  </>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => onArquivoEscolhido(e.target.files?.[0] ?? null)} />
            </div>
          </div>

          <div className="field-group">
            <label>Desconto (%)</label>
            <input value={descontoValor} onChange={e => setDescontoValor(e.target.value)} placeholder="Ex.: 10 — deixe em branco pra não ter desconto" />
          </div>

          <div className="field-group">
            <label>Descrição</label>
            <textarea rows={3} value={descricaoValor} onChange={e => setDescricaoValor(e.target.value)}
              placeholder="O que o cliente vê no modal de detalhes do produto" />
          </div>

          <div className="field-group">
            <label>Cores disponíveis</label>
            <input value={coresValor} onChange={e => setCoresValor(e.target.value)} placeholder="Ex.: Branca, Rosa, Azul (deixe em branco se não tiver cor)" />
          </div>

          <div className="field-group">
            <label>Especificações (uma por linha, "Chave: Valor")</label>
            <textarea rows={4} value={especificacoesValor} onChange={e => setEspecificacoesValor(e.target.value)}
              placeholder={'Formato: 9,7x8,5cm\nMaterial: Porcelana\nProdução: 2 dias úteis'} />
          </div>

          {erro && <p className="adm-error">{erro}</p>}

          <div className="modal-actions">
            <button className="btn-outline-full btn-flex" onClick={onClose}>Cancelar</button>
            <button className="btn-primary btn-flex" disabled={salvando} onClick={salvar}>
              {salvando ? 'Salvando…' : 'Salvar produto'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
