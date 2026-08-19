// Lê um arquivo (arte do cliente: imagem, PDF, CDR, PSD...) como data URL,
// SEM recomprimir — diferente de imageToDataUrl.ts (que é só pra fotos de
// produto/preview). Aqui o arquivo final de impressão precisa chegar intacto.
export const MAX_ARTE_BYTES = 10 * 1024 * 1024; // 10MB

export function fileToDataUrl(file: File): Promise<string> {
  if (file.size > MAX_ARTE_BYTES) {
    return Promise.reject(new Error('Esse arquivo passou de 10MB — tenta um arquivo menor ou nos manda pelo WhatsApp.'));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Não foi possível ler esse arquivo.'));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}
