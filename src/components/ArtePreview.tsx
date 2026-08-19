import { useState } from 'react';
import { fileToDataUrl } from '../lib/fileToDataUrl';

export interface Arte { nome: string; tipo: string; dataUrl: string }

const BLEED_MM = 2;
const SAFE_MM = 3;

export function ehImagem(arte: Arte | null): boolean {
  return !!arte?.tipo.startsWith('image/');
}

// Só o controle de upload (dropzone + arquivo-sem-prévia) — fica junto dos
// outros campos do formulário. A prévia visual em si (ArteGuides/ArteLegend)
// mora no quadro de destaque do configurador, não aqui embaixo.
export function ArteUpload({ arte, onArteChange }: { arte: Arte | null; onArteChange: (arte: Arte | null) => void }) {
  const [erro, setErro] = useState('');
  const [arrastando, setArrastando] = useState(false);

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
        <input type="file" accept="image/*,.pdf,.cdr,.psd,.svg" onChange={e => handleFile(e.target.files?.[0] ?? null)} />
      </label>
      {erro && <p className="adm-error" style={{ marginTop: 8 }}>{erro}</p>}

      {arte && !ehImagem(arte) && (
        <div className="filecard" style={{ marginTop: 10 }}>
          <span className="ic">📄</span>
          <div style={{ flex: 1 }}>
            <b>{arte.nome}</b>
            <span>Anexado ao pedido — esse formato não dá pra pré-visualizar aqui</span>
          </div>
          <button className="adm-link-btn" style={{ margin: 0, color: 'var(--blush-deep)' }} onClick={() => onArteChange(null)}>Remover</button>
        </div>
      )}
      {arte && ehImagem(arte) && (
        <button className="adm-link-btn" style={{ margin: '8px 0 0' }} onClick={() => onArteChange(null)}>Remover arte</button>
      )}
    </div>
  );
}

// Só as linhas de corte/margem de segurança, posicionadas por cima de
// qualquer caixa que já tenha position:relative + overflow:hidden — usado
// tanto no art-box do Adesivo quanto dentro do flip-card do Cartão.
export function ArteGuides({ formato, larguraMm, alturaMm }: { formato: 'circulo' | 'quadrado' | 'retangulo'; larguraMm: number; alturaMm: number }) {
  const displayW = larguraMm + BLEED_MM * 2;
  const displayH = alturaMm + BLEED_MM * 2;
  const corteX = (BLEED_MM / displayW) * 100, corteY = (BLEED_MM / displayH) * 100;
  const segX = ((BLEED_MM + SAFE_MM) / displayW) * 100, segY = ((BLEED_MM + SAFE_MM) / displayH) * 100;
  const arredondado = formato === 'circulo';
  return (
    <>
      <div className={`guide corte ${arredondado ? 'circulo' : ''}`} style={{ inset: `${corteY}% ${corteX}%` }} />
      <div className={`guide seguranca ${arredondado ? 'circulo' : ''}`} style={{ inset: `${segY}% ${segX}%` }} />
    </>
  );
}

export function ArteLegend() {
  return (
    <div className="legend">
      <span className="chip corte"><span className="dot" />linha de corte (sangria de {BLEED_MM}mm pra fora daqui)</span>
      <span className="chip seguranca"><span className="dot" />margem de segurança — texto/logo fica dentro</span>
    </div>
  );
}
