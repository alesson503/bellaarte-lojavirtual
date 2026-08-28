import { WhatsAppIcon } from '../icons';
import { useWhatsapp } from '../context/WhatsappContext';
import { whatsappLink } from '../config';

export default function WhatsFloat() {
  const whatsapp = useWhatsapp();
  return (
    <a className="whats-float" href={whatsappLink(whatsapp, 'Olá! Vim do site da Bella Arte.')}
      target="_blank" rel="noopener noreferrer" title="Falar no WhatsApp">
      <WhatsAppIcon size={28} />
    </a>
  );
}
