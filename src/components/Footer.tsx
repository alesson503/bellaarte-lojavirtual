import { useNavigate } from 'react-router-dom';

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="site">
      <div className="shell foot-row">
        <span>🎨 Bella Arte — Gráfica &amp; Personalizados, São Paulo/SP</span>
        <nav className="foot-links">
          <a onClick={() => navigate('/', { state: { page: 'como' } })}>Como funciona</a>
          <a onClick={() => navigate('/', { state: { page: 'contato' } })}>Contato</a>
        </nav>
      </div>
    </footer>
  );
}
