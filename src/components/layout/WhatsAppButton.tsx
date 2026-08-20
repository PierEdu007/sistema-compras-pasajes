import { useTranslation } from 'react-i18next';
import { FaWhatsapp } from 'react-icons/fa';
import '../../styles/components/whatsapp-button.css';

export default function WhatsAppButton() {
  const { t } = useTranslation();

  return (
    <a
      href="https://wa.me/51927670019?text=Hola,%20solicito%20información%20sobre%20sus%20servicios."
      className="whatsapp-btn"
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('common.whatsappChat', 'Chat por WhatsApp')}
    >
      <div className="whatsapp-icon">
        <FaWhatsapp />
      </div>
      <span className="whatsapp-tooltip">{t('common.chatWithUs', 'Chat con nosotros')}</span>
    </a>
  );
}
