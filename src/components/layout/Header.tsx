import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import '../../styles/components/header.css';

export default function Header() {
  const { t, i18n } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('es') ? 'en' : 'es';
    i18n.changeLanguage(newLang);
  };

  return (
    <header className={`header ${scrolled ? 'scrolled glass' : ''}`}>
      {/* Top contact bar */}
      <div className="header-top">
        <div className="container">
          <div className="contact-info">
            <span><i className="bi bi-telephone-fill"></i> 084 208513</span>
            <span><i className="bi bi-envelope-fill"></i> inversioneskintu@gmail.com</span>
          </div>
          <div className="social-links">
            <a href="#" target="_blank" rel="noreferrer"><i className="bi bi-facebook"></i></a>
            <a href="#" target="_blank" rel="noreferrer"><i className="bi bi-instagram"></i></a>
            <a href="#" target="_blank" rel="noreferrer"><i className="bi bi-whatsapp"></i> +51 997 040 003</a>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="header-main">
        <div className="container">
          <Link to="/" className="brand">
            <div className="brand-logo"><i className="bi bi-leaf"></i></div>
            <div className="brand-text">
              <span className="brand-name">K'INTU</span>
              <span className="brand-slogan">{t('hero.subtitle', 'Seguridad y confort')}</span>
            </div>
          </Link>

          <button 
            className="mobile-toggle" 
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? '✕' : '☰'}
          </button>

          <nav className={`nav-menu ${menuOpen ? 'active' : ''}`}>
            <Link to="/" onClick={() => setMenuOpen(false)}>{t('nav.home', 'Inicio')}</Link>
            <Link to="/terminos" onClick={() => setMenuOpen(false)}>{t('nav.terms', 'Términos y Condiciones')}</Link>
            
            <button className="lang-toggle" onClick={toggleLanguage}>
              {i18n.language.startsWith('es') ? 'EN' : 'ES'}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
