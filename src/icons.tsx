import type { Categoria } from './data';

// Ícones por categoria — mesmo estilo (stroke fino) usado no resto da loja.
// Nenhuma foto real de produto ainda: ver memória "Loja Virtual" sobre isso.
export function CategoryIcon({ categoria }: { categoria: Categoria | string }) {
  switch (categoria) {
    case 'Adesivo':
      return (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="8" />
          <path d="M17 7l3-3M17 7l3 1-1 3" />
        </svg>
      );
    case 'Banner':
      return (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="3" width="16" height="14" rx="1.5" />
          <path d="M9 21h6M12 17v4" />
        </svg>
      );
    case 'Caneca':
      return (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3h8l1 4H7l1-4z" />
          <path d="M6 7h12l-1 13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 7z" />
        </svg>
      );
    case 'Cartão de Visita':
      return (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="7" width="18" height="11" rx="2" />
          <path d="M3 10h18" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="16" height="16" rx="2.5" />
          <path d="M4 9h16M9 4v16" />
        </svg>
      );
  }
}

export function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

export function WhatsAppIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.28-1.39a9.9 9.9 0 0 0 4.76 1.21h.01c5.46 0 9.9-4.45 9.9-9.91S17.5 2 12.04 2zm0 18.13c-1.51 0-2.99-.41-4.29-1.18l-.31-.18-3.13.82.84-3.05-.2-.32a8.14 8.14 0 0 1-1.25-4.31c0-4.5 3.66-8.16 8.17-8.16 2.18 0 4.23.85 5.77 2.39a8.11 8.11 0 0 1 2.39 5.78c0 4.5-3.67 8.21-8.99 8.21z" />
    </svg>
  );
}

export function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}>
      <path d="M12 3l2.5 5.5L20 11l-5.5 2.5L12 19l-2.5-5.5L4 11l5.5-2.5L12 3z" />
    </svg>
  );
}
