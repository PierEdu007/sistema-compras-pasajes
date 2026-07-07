import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { FaPhoneAlt, FaEnvelope, FaFacebook, FaInstagram, FaWhatsapp } from 'react-icons/fa';
import '../../styles/components/header.css';

// Import the Tunki Chasky logo
import logoImg from '../../assets/logo.png';

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
            <span><FaPhoneAlt /> +51 997 475 405</span>
            <span><FaEnvelope /> reservas@tunkichasky.com</span>
          </div>
          <div className="social-links">
            <a href="#" target="_blank" rel="noreferrer"><FaFacebook /></a>
            <a href="#" target="_blank" rel="noreferrer"><FaInstagram /></a>
            <a href="https://wa.me/51997475405" target="_blank" rel="noreferrer"><FaWhatsapp /> +51 997 475 405</a>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="header-main">
        <div className="container">
          <Link to="/" className="brand">
            <img src={logoImg} alt="Logo Tunki Chasky" className="brand-logo-img" />
            <div className="brand-text">
              <span className="brand-name">TUNKI CHASKY</span>
              <span className="brand-slogan">{t('hero.subtitle', 'Seguridad · Rapidez · Confort')}</span>
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
            <a href="#rutas" onClick={() => setMenuOpen(false)}>{t('nav.rutas', 'Rutas')}</a>
            <a href="#servicios" onClick={() => setMenuOpen(false)}>{t('nav.servicios', 'Servicios')}</a>
            <a href="#ubicanos" onClick={() => setMenuOpen(false)}>{t('nav.ubicanos', 'Ubícanos')}</a>
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
