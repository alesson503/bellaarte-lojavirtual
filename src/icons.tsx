import type { Categoria } from './data';

// Ícones por categoria — mesmo estilo (stroke fino) usado no resto da loja.
// Nenhuma foto real de produto ainda: ver memória "Loja Virtual" sobre isso.
export function CategoryIcon({ categoria }: { categoria: Categoria | string }) {
  switch (categoria) {
    case 'Adesivo':
      return (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7Z" />
          <path d="M14 3v6a1 1 0 0 0 1 1h6" />
        </svg>
      );
    case 'Banner':
      return (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 5h16v9a2 2 0 0 1-2 2H8l-4 4z" />
        </svg>
      );
    case 'Caneca':
      return (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h13v9a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Z" />
          <path d="M17 7h2a2.5 2.5 0 0 1 0 5h-2" />
        </svg>
      );
    case 'Cartão de Visita':
      return (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m4 6 8 7 8-7" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9V4h12v5" />
          <rect x="4" y="9" width="16" height="7" rx="1.5" />
          <rect x="7" y="16" width="10" height="5" />
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

export function WhatsAppIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.28-1.39a9.9 9.9 0 0 0 4.76 1.21h.01c5.46 0 9.9-4.45 9.9-9.91S17.5 2 12.04 2zm0 18.13c-1.51 0-2.99-.41-4.29-1.18l-.31-.18-3.13.82.84-3.05-.2-.32a8.14 8.14 0 0 1-1.25-4.31c0-4.5 3.66-8.16 8.17-8.16 2.18 0 4.23.85 5.77 2.39a8.11 8.11 0 0 1 2.39 5.78c0 4.5-3.67 8.21-8.99 8.21z" />
    </svg>
  );
}

export function UserIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
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
