import '../../styles/components/whatsapp-button.css';

export default function WhatsAppButton() {
  return (
    <a 
      href="https://wa.me/51997040003" 
      target="_blank" 
      rel="noreferrer" 
      className="whatsapp-btn"
      aria-label="Contactar por WhatsApp"
      title="¿Necesitas ayuda? Escríbenos"
    >
      <div className="whatsapp-icon">💬</div>
      <div className="whatsapp-tooltip">¡Hola! ¿En qué te podemos ayudar?</div>
    </a>
  );
}
