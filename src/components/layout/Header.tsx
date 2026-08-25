import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { FaPhoneAlt, FaEnvelope, FaFacebook, FaInstagram, FaWhatsapp, FaSun, FaMoon, FaBars, FaTimes } from 'react-icons/fa';
import { useTheme } from '../../hooks/useTheme';
import '../../styles/components/header.css';

// Import the Tunki Chasky logo
import logoImg from '../../assets/logo.png';

export default function Header() {
  const { t, i18n } = useTranslation();
  const { isDark, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();

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

  const handleNavClick = (hash: string) => {
    setMenuOpen(false);
    if (pathname !== '/') {
      navigate('/' + hash);
    } else {
      const element = document.querySelector(hash);
      if (element) {
        // Offset for the fixed header
        const headerOffset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
  
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }
  };

  // Check if there is a hash in the URL on mount and scroll to it
  useEffect(() => {
    if (pathname === '/' && window.location.hash) {
      setTimeout(() => {
        const element = document.querySelector(window.location.hash);
        if (element) {
          const headerOffset = 80;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
      }, 100);
    }
  }, [pathname]);

  return (
    <header className={`header ${scrolled ? 'scrolled glass' : ''}`}>
      {/* Top contact bar */}
      <div className="header-top">
        <div className="container">
          <div className="contact-info">
            <span><FaPhoneAlt /> +51 927 670 019 | Fijo: (084) 500393</span>
            <span><FaEnvelope /> tunkychaskyoficial@gmail.com</span>
          </div>
          <div className="social-links">
            <a href="#" target="_blank" rel="noreferrer"><FaFacebook /></a>
            <a href="https://www.instagram.com/tunkychasky01?igsh=MWdtMnZ3Nml3dzlrcQ==" target="_blank" rel="noreferrer"><FaInstagram /></a>
            <a href="https://wa.me/51927670019" target="_blank" rel="noreferrer"><FaWhatsapp /> +51 927 670 019</a>
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
            aria-label="Menu"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>

          <nav className={`nav-menu ${menuOpen ? 'active' : ''}`}>
            <Link to="/" onClick={() => { setMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>{t('nav.home', 'Inicio')}</Link>
            <button className="nav-link-btn" onClick={() => handleNavClick('#rutas')}>{t('nav.rutas', 'Rutas')}</button>
            <button className="nav-link-btn" onClick={() => handleNavClick('#guia-viaje')}>{t('nav.faq', 'Preguntas / Guía')}</button>
            <button className="nav-link-btn" onClick={() => handleNavClick('#ubicanos')}>{t('nav.ubicanos', 'Ubícanos')}</button>
            <Link to="/terminos" onClick={() => setMenuOpen(false)}>{t('nav.terms', 'Términos y Condiciones')}</Link>
            
            <div className="nav-actions">
              <button 
                className="theme-toggle-btn"
                onClick={toggleTheme}
                title={isDark ? (i18n.language.startsWith('es') ? 'Cambiar a modo claro' : 'Switch to light mode') : (i18n.language.startsWith('es') ? 'Cambiar a modo oscuro' : 'Switch to dark mode')}
                aria-label={isDark ? 'Modo claro' : 'Modo oscuro'}
              >
                {isDark ? <FaSun className="theme-icon sun-icon" /> : <FaMoon className="theme-icon moon-icon" />}
              </button>

              <button className="lang-toggle" onClick={toggleLanguage}>
                {i18n.language.startsWith('es') ? 'EN' : 'ES'}
              </button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}

