import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaBus, FaWhatsapp, FaExclamationTriangle } from 'react-icons/fa';
import { SEO } from '../components/common/SEO';
import '../styles/components/NotFound.css';

const NotFound: React.FC = () => {
  return (
    <div className="not-found-page">
      <SEO
        title="404 - Página no encontrada"
        description="La página que buscas no existe o ha sido movida. Regresa al inicio para consultar horarios y comprar pasajes de Cusco a Quillabamba en Tunky Chasky."
        noIndex={true}
      />

      <div className="not-found-card">
        <div className="not-found-badge">
          <FaExclamationTriangle /> ERROR 404
        </div>

        <div className="not-found-number">404</div>

        <h1 className="not-found-title">¡Ups! Ruta no encontrada</h1>

        <p className="not-found-description">
          Parece que la página a la que intentas acceder no existe, ha cambiado de dirección o fue escrita de forma incorrecta. No te preocupes, puedes volver al camino principal:
        </p>

        <div className="not-found-actions">
          <Link to="/" className="not-found-btn-primary">
            <FaHome /> Ir al Inicio
          </Link>

          <Link to="/viajes" className="not-found-btn-secondary">
            <FaBus /> Ver Salidas Disponibles
          </Link>

          <a
            href="https://wa.me/51997475405?text=Hola%20Tunky%20Chasky,%20necesito%20ayuda%20para%20encontrar%20un%20pasaje"
            target="_blank"
            rel="noopener noreferrer"
            className="not-found-btn-whatsapp"
          >
            <FaWhatsapp /> Contactar por WhatsApp
          </a>
        </div>

        <div className="not-found-footer-links">
          <Link to="/terminos" className="not-found-footer-link">
            Términos y Condiciones
          </Link>
          <Link to="/libro-de-reclamaciones" className="not-found-footer-link">
            Libro de Reclamaciones
          </Link>
          <Link to="/admin" className="not-found-footer-link">
            Acceso Administrativo
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
