import { useRef, useState } from 'react';
import { fileToDataUrl } from '../lib/fileToDataUrl';

export interface Arte { nome: string; tipo: string; dataUrl: string }

const BLEED_MM = 2;
const SAFE_MM = 3;

// Upload da arte do cliente + prévia com guia de sangria/margem de segurança
// — usado no Adesivo (círculo/quadrado) e no Cartão de Visita (retângulo).
// A arte só fica na tela (nada é enviado pro servidor) até o pedido ser
// finalizado — igual o resto do carrinho.
export default function ArtePreview({
  formato, larguraMm, alturaMm, arte, onArteChange,
}: {
  formato: 'circulo' | 'quadrado' | 'retangulo';
  larguraMm: number;
  alturaMm: number;
  arte: Arte | null;
  onArteChange: (arte: Arte | null) => void;
}) {
  const [erro, setErro] = useState('');
  const [arrastando, setArrastando] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | null) {
    if (!file) return;
    setErro('');
    try {
      const dataUrl = await fileToDataUrl(file);
      onArteChange({ nome: file.name, tipo: file.type || 'arquivo', dataUrl });
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível processar esse arquivo.');
    }
  }

  const ehImagem = arte?.tipo.startsWith('image/');
  const displayW = larguraMm + BLEED_MM * 2;
  const displayH = alturaMm + BLEED_MM * 2;
  const corteX = (BLEED_MM / displayW) * 100, corteY = (BLEED_MM / displayH) * 100;
  const segX = ((BLEED_MM + SAFE_MM) / displayW) * 100, segY = ((BLEED_MM + SAFE_MM) / displayH) * 100;
  const arredondado = formato === 'circulo';

  return (
    <div>
      <label className="field-label">Sua arte (opcional)</label>
      <label
        className="dropzone"
        onDragOver={e => { e.preventDefault(); setArrastando(true); }}
        onDragLeave={() => setArrastando(false)}
        onDrop={e => { e.preventDefault(); setArrastando(false); handleFile(e.dataTransfer.files?.[0] ?? null); }}
        style={arrastando ? { borderColor: 'var(--violet)' } : undefined}
      >
        📎 {arte ? 'Trocar arquivo' : 'Clique pra escolher a arte (ou arraste aqui)'}
        <small>PNG, JPG, SVG mostram prévia — PDF, CDR, PSD ficam anexados sem prévia visual</small>
        <input ref={fileInputRef} type="file" accept="image/*,.pdf,.cdr,.psd,.svg"
          onChange={e => handleFile(e.target.files?.[0] ?? null)} />
      </label>
      {erro && <p className="adm-error" style={{ marginTop: 8 }}>{erro}</p>}

      {arte && !ehImagem && (
        <div className="filecard" style={{ marginTop: 10 }}>
          <span className="ic">📄</span>
          <div style={{ flex: 1 }}>
            <b>{arte.nome}</b>
            <span>Anexado ao pedido — esse formato não dá pra pré-visualizar aqui</span>
          </div>
          <button className="adm-link-btn" style={{ margin: 0, color: 'var(--blush-deep)' }} onClick={() => onArteChange(null)}>Remover</button>
        </div>
      )}

      {arte && ehImagem && (
        <>
          <div className="preview-stage">
            <div className={`art-box ${arredondado ? 'circulo' : ''}`} style={{ width: formato === 'retangulo' ? 220 : 180, aspectRatio: `${larguraMm} / ${alturaMm}` }}>
              <img src={arte.dataUrl} alt="Prévia da sua arte" />
              <div className={`guide corte ${arredondado ? 'circulo' : ''}`} style={{ inset: `${corteY}% ${corteX}%` }} />
              <div className={`guide seguranca ${arredondado ? 'circulo' : ''}`} style={{ inset: `${segY}% ${segX}%` }} />
            </div>
          </div>
          <div className="legend">
            <span className="chip corte"><span className="dot" />linha de corte (sangria de {BLEED_MM}mm pra fora daqui)</span>
            <span className="chip seguranca"><span className="dot" />margem de segurança — texto/logo fica dentro</span>
          </div>
          <button className="adm-link-btn" style={{ margin: '4px 0 0', color: 'var(--blush-deep)' }} onClick={() => onArteChange(null)}>Remover arte</button>
        </>
      )}
    </div>
  );
}
