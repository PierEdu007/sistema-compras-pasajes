import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FaCreditCard, FaMobileAlt, FaMapMarkerAlt, FaPhoneAlt, FaFacebook, FaInstagram, FaWhatsapp, FaEnvelope, FaLock, FaBook, FaShieldAlt } from 'react-icons/fa';
import '../../styles/components/footer.css';

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          
          <div className="footer-col">
            <div className="footer-brand">
              <h3>Tunki Chasky S.R.L.</h3>
            </div>
            <p className="footer-desc">
              {t('about.description', 'Líderes en transporte terrestre interurbano y logística de encomiendas en la región Cusco.')}
            </p>
            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)', marginBottom: '12px' }}>
              <strong>RUC:</strong> 20608425676 | Empresa Formal
            </div>
            <div className="payment-methods" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              <span style={{ background: 'rgba(255,255,255,0.12)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <FaCreditCard /> Visa / Mastercard
              </span>
              <span style={{ background: 'rgba(255,255,255,0.12)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <FaMobileAlt /> Yape / Plin
              </span>
              <span style={{ background: 'rgba(16,185,129,0.2)', color: '#34d399', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}>
                <FaLock /> SSL Seguro
              </span>
            </div>
          </div>

          <div className="footer-col">
            <h4>{t('footer.officeCusco', 'Oficina en Cusco')}</h4>
            <ul className="footer-contact">
              <li><FaMapMarkerAlt /> Av. Antonio Lorena 318, Santiago, Cusco</li>
              <li><FaPhoneAlt /> +51 927 670 019 | Fijo: (084) 500393</li>
              <li><FaEnvelope /> tunkychaskyoficial@gmail.com</li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>{t('footer.followUs', 'Síguenos')}</h4>
            <div className="footer-social">
              <a href="#" target="_blank" rel="noreferrer"><FaFacebook /> Facebook</a>
              <a href="https://www.instagram.com/tunkychasky01?igsh=MWdtMnZ3Nml3dzlrcQ==" target="_blank" rel="noreferrer"><FaInstagram /> Instagram</a>
              <a href="https://wa.me/51927670019" target="_blank" rel="noreferrer"><FaWhatsapp /> WhatsApp</a>
            </div>
          </div>

          <div className="footer-col">
            <h4>Atención y Legal</h4>
            <div className="footer-links" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
              <Link to="/terminos" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FaShieldAlt /> {t('nav.terms', 'Términos y Condiciones')}
              </Link>
              <Link to="/libro-de-reclamaciones" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.08)', padding: '6px 12px', borderRadius: '6px', width: 'fit-content', color: '#fef08a' }}>
                <FaBook /> Libro de Reclamaciones
              </Link>
              <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.7 }}>
                {t('admin.login', 'Acceso Administrativo')}
              </Link>
            </div>
          </div>

        </div>
      </div>
      
      <div className="footer-bottom">
        <div className="container">
          <p>
            © {year} Inversiones Tunki Chasky S.R.L. |{' '}
            <a href="https://wa.me/51983878473" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 'bold' }}>
              Hecho por PAMCo
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
