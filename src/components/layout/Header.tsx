import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { FaPhoneAlt, FaEnvelope, FaFacebook, FaInstagram, FaWhatsapp, FaLeaf } from 'react-icons/fa';
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
            <span><FaPhoneAlt /> 084 208513</span>
            <span><FaEnvelope /> inversioneskintu@gmail.com</span>
          </div>
          <div className="social-links">
            <a href="#" target="_blank" rel="noreferrer"><FaFacebook /></a>
            <a href="#" target="_blank" rel="noreferrer"><FaInstagram /></a>
            <a href="#" target="_blank" rel="noreferrer"><FaWhatsapp /> +51 997 040 003</a>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="header-main">
        <div className="container">
          <Link to="/" className="brand">
            <div className="brand-logo"><FaLeaf /></div>
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
