import { FaWhatsapp } from 'react-icons/fa';
import '../../styles/components/whatsapp.css';

export default function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/51997475405?text=Hola,%20solicito%20información%20sobre%20sus%20servicios."
      className="whatsapp-float"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat por WhatsApp"
    >
      <FaWhatsapp />
    </a>
  );
}
