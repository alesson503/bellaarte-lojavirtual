// Lê um arquivo de imagem, redimensiona (mantendo proporção) e devolve como
// data URL — assim uma foto de 5MB do celular não estoura o localStorage
// (que tem só uns 5-10MB por site).
export function imageToDataUrl(file: File, maxSize: number, format: 'image/png' | 'image/jpeg', quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Esse arquivo não parece ser uma imagem válida.'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Seu navegador não suporta processar imagem aqui.')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL(format, quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
