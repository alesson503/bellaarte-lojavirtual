import { useEffect, useState } from 'react';
import type { SimpleProduct } from '../data';
import { fmt } from '../data';
import { CategoryIcon, WhatsAppIcon } from '../icons';
import { whatsappLink } from '../config';

// Janela de detalhes de um produto simples (Caneca, Cavalete, etc.) — abre
// ao clicar no card, em vez de adicionar direto ao pedido. Se o produto tiver
// cores cadastradas, o cliente escolhe uma antes de poder adicionar.
export default function ProductDetailModal({
  produto,
  onClose,
  onAdd,
  whatsapp,
}: {
  produto: SimpleProduct | null;
  onClose: () => void;
  onAdd: (nome: string, preco: number, quantidade?: number, observacao?: string) => void;
  whatsapp: string;
}) {
  const [corSelecionada, setCorSelecionada] = useState<string | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [observacao, setObservacao] = useState('');

  // Toda vez que um produto novo é aberto, volta tudo pro estado inicial —
  // já pré-seleciona a primeira cor (se tiver), o cliente ainda pode trocar.
  useEffect(() => {
    setCorSelecionada(produto?.cores?.[0] ?? null);
    setQuantidade(1);
    setObservacao('');
  }, [produto]);

  const open = produto != null;
  const nomeComCor = produto?.cores?.length && corSelecionada ? `${produto.nome} (${corSelecionada})` : produto?.nome ?? '';
  const mensagemWhats = produto
    ? `Olá! Quero pedir: ${nomeComCor}${quantidade > 1 ? ` — ${quantidade} un` : ''} — ${fmt(produto.preco * quantidade)}${observacao ? `\nObs: ${observacao}` : ''}`
    : '';

  function adicionar() {
    if (!produto) return;
    onAdd(nomeComCor, produto.preco, quantidade, observacao);
    onClose();
  }

  return (
    <div className={`modal-overlay ${open ? 'open' : ''}`} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      {produto && (
        <div className="modal-box">
          <button className="modal-close" onClick={onClose}>✕</button>

          <div className="detail-thumb">
            <span className="cat-tag">{produto.categoria}</span>
            {produto.descontoPercentual ? <span className="badge-multi">-{produto.descontoPercentual}%</span> : null}
            {produto.imagem ? (
              <img src={produto.imagem} alt={produto.nome} className="prod-thumb-img" />
            ) : (
              <CategoryIcon categoria={produto.categoria} />
            )}
          </div>

          <h2 className="serif">{produto.nome}</h2>
          {produto.descricao && <p className="modal-sub" style={{ marginBottom: produto.especificacoes?.length ? 8 : 16 }}>{produto.descricao}</p>}

          {produto.especificacoes?.length ? (
            <ul className="detail-specs">
              {produto.especificacoes.map((e, i) => (
                <li key={i}><b>{e.chave}:</b> {e.valor}</li>
              ))}
            </ul>
          ) : null}

          {produto.cores?.length ? (
            <div className="field-group">
              <label>Cor</label>
              <div className="swatch-row">
                {produto.cores.map(cor => (
                  <button
                    key={cor}
                    className={`swatch ${corSelecionada === cor ? 'on' : ''}`}
                    onClick={() => setCorSelecionada(cor)}
                  >
                    {cor}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="field-group">
            <label>Quantidade</label>
            <div className="qty-stepper">
              <button type="button" onClick={() => setQuantidade(q => Math.max(1, q - 1))}>−</button>
              <span>{quantidade}</span>
              <button type="button" onClick={() => setQuantidade(q => q + 1)}>+</button>
            </div>
          </div>

          <div className="field-group">
            <label>Observação (opcional)</label>
            <textarea
              rows={2} value={observacao} onChange={e => setObservacao(e.target.value)}
              placeholder="Ex.: essa unidade é com a foto da Maria — se pedir mais de uma arte diferente, adicione cada uma separada com sua observação"
            />
          </div>

          <div className="price-row" style={{ marginTop: 4 }}>
            <div>
              {quantidade > 1 && <div className="from">{fmt(produto.preco)} cada</div>}
              <div className="p" style={{ fontSize: 24 }}>
                {produto.precoOriginal != null && produto.precoOriginal > produto.preco && (
                  <span className="old-price">{fmt(produto.precoOriginal * quantidade)}</span>
                )}
                {fmt(produto.preco * quantidade)}
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button className="add-btn btn-flex" onClick={adicionar}>Adicionar ao pedido</button>
            <a
              className="btn-outline-full btn-flex" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}
              href={whatsappLink(whatsapp, mensagemWhats)}
              target="_blank" rel="noopener noreferrer"
            >
              <WhatsAppIcon /> Comprar pelo WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
