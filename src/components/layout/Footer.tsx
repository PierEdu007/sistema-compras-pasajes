import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FaCreditCard, FaMobileAlt, FaMapMarkerAlt, FaPhoneAlt, FaFacebook, FaInstagram, FaWhatsapp, FaEnvelope } from 'react-icons/fa';
import '../../styles/components/footer.css';

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          
          <div className="footer-col">
            <div className="footer-brand">
              <h3>Tunki Chasky S.R.L.</h3>
            </div>
            <p className="footer-desc">
              {t('about.description', 'Líderes en transporte terrestre interurbano y logística de encomiendas en la región Cusco.')}
            </p>
            <div className="payment-methods">
              <span><FaCreditCard /> Visa</span>
              <span><FaCreditCard /> Mastercard</span>
              <span><FaMobileAlt /> Yape</span>
            </div>
          </div>

          <div className="footer-col">
            <h4>{t('footer.officeCusco', 'Oficina en Cusco')}</h4>
            <ul className="footer-contact">
              <li><FaMapMarkerAlt /> Av. Antonio Lorena 318, Santiago, Cusco</li>
              <li><FaPhoneAlt /> +51 997 475 405</li>
              <li><FaEnvelope /> reservas@tunkichasky.com</li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>{t('footer.followUs', 'Síguenos')}</h4>
            <div className="footer-social">
              <a href="#" target="_blank" rel="noreferrer"><FaFacebook /> Facebook</a>
              <a href="#" target="_blank" rel="noreferrer"><FaInstagram /> Instagram</a>
              <a href="https://wa.me/51997475405" target="_blank" rel="noreferrer"><FaWhatsapp /> WhatsApp</a>
            </div>
            <div className="footer-links">
              <Link to="/terminos">{t('nav.terms', 'Términos y Condiciones')}</Link>
              <Link to="/admin">{t('admin.login', 'Acceso Administrativo')}</Link>
            </div>
          </div>

        </div>
      </div>
      
      <div className="footer-bottom">
        <div className="container">
          <p>© {year} Inversiones Tunki Chasky S.R.L. {t('footer.rights', 'Diseñado para la excelencia.')}</p>
        </div>
      </div>
    </footer>
  );
}
