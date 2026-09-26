import { useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { WhatsAppIcon } from '../icons';
import { useWhatsapp } from '../context/WhatsappContext';
import { whatsappLink } from '../config';

export default function Footer() {
  const navigate = useNavigate();
  const whatsapp = useWhatsapp();

  return (
    <footer className="bg-ink text-cream-100">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row">
        <div className="flex items-center gap-2">
          <Logo size={36} />
          <span className="font-display text-lg font-bold text-cream-50">Bella Arte</span>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-5 text-sm font-semibold text-cream-200">
          <a className="cursor-pointer hover:text-white" onClick={() => navigate('/', { state: { page: 'como' } })}>Como funciona</a>
          <a className="cursor-pointer hover:text-white" onClick={() => navigate('/', { state: { page: 'sobre' } })}>Sobre Nós</a>
          <a className="cursor-pointer hover:text-white" onClick={() => navigate('/', { state: { page: 'contato' } })}>Contato</a>
        </nav>

        <div className="flex items-center gap-3">
          <p className="text-sm text-cream-200">© {new Date().getFullYear()} Bella Arte · Feito com 💗</p>
          <a
            href={whatsappLink(whatsapp, 'Olá! Vim do site da Bella Arte.')}
            target="_blank" rel="noopener noreferrer"
            className="rounded-full bg-rose px-5 py-2 text-sm font-bold text-white transition hover:brightness-95"
          >
            <span className="inline-flex items-center gap-1.5"><WhatsAppIcon /> WhatsApp</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
