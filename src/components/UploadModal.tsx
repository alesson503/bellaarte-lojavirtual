import { useState } from 'react';

export default function UploadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'idle' | 'ok' | 'erro'>('idle');

  function handleClose() {
    setStatus('idle');
    onClose();
  }

  function send() {
    setStatus(file ? 'ok' : 'erro');
  }

  return (
    <div className={`modal-overlay ${open ? 'open' : ''}`} onClick={e => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="modal-box">
        <button className="modal-close" onClick={handleClose}>✕</button>
        <h2 className="serif">Enviar minha arte</h2>
        <p className="modal-sub">Já tem o arquivo pronto? Envie aqui e deixe uma observação pra gente.</p>
        <label className="upload-drop">
          <span style={{ fontSize: 26 }}>📎</span>
          <b>{file ? file.name : 'Clique pra escolher o arquivo'}</b>
          <small>PDF, PNG, JPG, CDR, PSD ou SVG</small>
          <input
            type="file" hidden accept=".pdf,.png,.jpg,.jpeg,.cdr,.psd,.svg"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <div className="field-group" style={{ marginTop: 16 }}>
          <label>Observações</label>
          <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ex.: quero o corte seguindo o contorno do logo..." />
        </div>
        <button className="btn-primary" style={{ width: '100%' }} onClick={send}>Enviar arquivo</button>
        <div className="upload-status">
          {status === 'ok' && file && `✓ ${file.name} selecionado. Na versão integrada, esse arquivo é anexado ao pedido de verdade.`}
          {status === 'erro' && 'Escolhe um arquivo primeiro.'}
        </div>
      </div>
    </div>
  );
}
