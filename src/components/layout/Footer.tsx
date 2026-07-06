import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
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
              <span className="logo-icon"><i className="bi bi-leaf"></i></span>
              <h3>Inversiones K'intu</h3>
            </div>
            <p className="footer-desc">
              {t('about.description', 'Empresa 100% Cusqueña brindando un servicio de transporte Formal, Seguro, Confiable y Puntual.')}
            </p>
            <div className="payment-methods">
              <span><i className="bi bi-credit-card"></i> Visa</span>
              <span><i className="bi bi-credit-card"></i> Mastercard</span>
              <span><i className="bi bi-phone"></i> Yape</span>
            </div>
          </div>

          <div className="footer-col">
            <h4>{t('footer.officeCusco', 'Oficina en Cusco')}</h4>
            <ul className="footer-contact">
              <li><i className="bi bi-geo-alt-fill"></i> Calle Sacristanniyoc con Tres Marias Nro 131-A, Santiago</li>
              <li><i className="bi bi-telephone-fill"></i> 084 208513</li>
              <li><i className="bi bi-phone"></i> 997 040 003</li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>{t('footer.officeQuillabamba', 'Oficina en Quillabamba')}</h4>
            <ul className="footer-contact">
              <li><i className="bi bi-geo-alt-fill"></i> Jr. de la Confraternidad S/N, Santa Ana</li>
              <li><i className="bi bi-telephone-fill"></i> 084 212400</li>
              <li><i className="bi bi-phone"></i> 968 573 314</li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>{t('footer.followUs', 'Síguenos')}</h4>
            <div className="footer-social">
              <a href="#" target="_blank" rel="noreferrer"><i className="bi bi-facebook"></i> Facebook</a>
              <a href="#" target="_blank" rel="noreferrer"><i className="bi bi-instagram"></i> Instagram</a>
              <a href="#" target="_blank" rel="noreferrer"><i className="bi bi-whatsapp"></i> WhatsApp</a>
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
          <p>© {year} Inversiones K'intu S.R.L. {t('footer.rights', 'Todos los derechos reservados.')}</p>
        </div>
      </div>
    </footer>
  );
}
