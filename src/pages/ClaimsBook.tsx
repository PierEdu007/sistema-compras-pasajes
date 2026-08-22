import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaBook, FaCheckCircle, FaExclamationCircle, FaUser, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaFileAlt } from 'react-icons/fa';
import '../styles/components/ClaimsBook.css';

export default function ClaimsBook() {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  const [claimCode, setClaimCode] = useState('');
  
  const [formData, setFormData] = useState({
    tipoDoc: 'DNI',
    nroDoc: '',
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    domicilio: '',
    tipoBien: 'SERVICIO',
    montoReclamado: '',
    descripcionBien: '',
    tipoReclamo: 'RECLAMO', // RECLAMO o QUEJA
    detalle: '',
    pedido: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = `LR-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    setClaimCode(code);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="claims-page">
      <div className="claims-header">
        <div className="claims-header-icon">
          <FaBook />
        </div>
        <h1 className="claims-main-title">
          {t('claims.title', 'Libro de Reclamaciones Virtual')}
        </h1>
        <p className="claims-subtitle">
          {t('claims.subtitle', 'Conforme a lo establecido en el Código de Protección y Defensa del Consumidor (Ley N° 29571)')}
        </p>
        <div className="claims-company-badge">
          <strong>Razón Social:</strong> INVERSIONES TUNKI CHASKY S.R.L. | <strong>RUC:</strong> 20608425676
        </div>
      </div>

      {submitted ? (
        <div className="claims-success-box">
          <div className="claims-success-icon">
            <FaCheckCircle />
          </div>
          <h2 className="claims-success-title">
            {t('claims.successTitle', '¡Hoja de Reclamación Registrada con Éxito!')}
          </h2>
          <p className="claims-success-code-text">
            {t('claims.yourCodeIs', 'Tu código de registro es:')} <strong className="claims-code-highlight">{claimCode}</strong>
          </p>
          <p className="claims-success-notice">
            {t('claims.indecopiNotice', 'Hemos recibido tu registro. Conforme a la normativa de INDECOPI, la empresa dará respuesta a tu solicitud en un plazo máximo de quince (15) días hábiles al correo electrónico proporcionado.')}
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="btn btn-primary"
            style={{ padding: '10px 24px', borderRadius: '8px', fontWeight: 'bold' }}
          >
            {t('claims.backHome', 'Volver al Inicio')}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="claims-form-box">
          
          {/* SECCIÓN 1: IDENTIFICACIÓN DEL CONSUMIDOR */}
          <h3 className="claims-section-title">
            <FaUser /> {t('claims.sec1Title', '1. Identificación del Consumidor Reclamante')}
          </h3>

          <div className="claims-grid-2">
            <div className="claims-form-group">
              <label className="claims-label">{t('claims.docType', 'Tipo Documento:')}</label>
              <select 
                className="claims-select" 
                value={formData.tipoDoc}
                onChange={(e) => setFormData({ ...formData, tipoDoc: e.target.value })}
              >
                <option value="DNI">DNI</option>
                <option value="CE">{t('booking.ceOption', 'Carnet de Extranjería')}</option>
                <option value="PASAPORTE">{t('booking.passportOption', 'Pasaporte')}</option>
                <option value="RUC">RUC</option>
              </select>
            </div>

            <div className="claims-form-group">
              <label className="claims-label">{t('claims.docNumber', 'N° Documento:')}</label>
              <input 
                type="text" 
                className="claims-input" 
                required
                value={formData.nroDoc}
                onChange={(e) => setFormData({ ...formData, nroDoc: e.target.value })}
                placeholder="Ej. 72849182"
              />
            </div>
          </div>

          <div className="claims-grid-2">
            <div className="claims-form-group">
              <label className="claims-label">{t('claims.firstName', 'Nombres:')}</label>
              <input 
                type="text" 
                className="claims-input" 
                required
                value={formData.nombres}
                onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                placeholder="Nombres completos"
              />
            </div>

            <div className="claims-form-group">
              <label className="claims-label">{t('claims.lastName', 'Apellidos:')}</label>
              <input 
                type="text" 
                className="claims-input" 
                required
                value={formData.apellidos}
                onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                placeholder="Apellidos completos"
              />
            </div>
          </div>

          <div className="claims-grid-2">
            <div className="claims-form-group">
              <label className="claims-label">
                <FaEnvelope /> {t('claims.email', 'Correo Electrónico:')}
              </label>
              <input 
                type="email" 
                className="claims-input" 
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div className="claims-form-group">
              <label className="claims-label">
                <FaPhoneAlt /> {t('claims.phone', 'Teléfono / Celular:')}
              </label>
              <input 
                type="tel" 
                className="claims-input" 
                required
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="997475405"
              />
            </div>
          </div>

          <div className="claims-form-group">
            <label className="claims-label">
              <FaMapMarkerAlt /> {t('claims.address', 'Domicilio:')}
            </label>
            <input 
              type="text" 
              className="claims-input" 
              required
              value={formData.domicilio}
              onChange={(e) => setFormData({ ...formData, domicilio: e.target.value })}
              placeholder={t('claims.addressPlaceholder', 'Dirección, Ciudad y Departamento')}
            />
          </div>

          {/* SECCIÓN 2: IDENTIFICACIÓN DEL SERVICIO / BIEN */}
          <h3 className="claims-section-title">
            <FaFileAlt /> {t('claims.sec2Title', '2. Identificación del Servicio Contratado')}
          </h3>

          <div className="claims-grid-2">
            <div className="claims-form-group">
              <label className="claims-label">{t('claims.assetType', 'Tipo de Bien:')}</label>
              <select 
                className="claims-select" 
                value={formData.tipoBien}
                onChange={(e) => setFormData({ ...formData, tipoBien: e.target.value })}
              >
                <option value="SERVICIO">{t('claims.serviceOption', 'Servicio de Transporte de Pasajeros')}</option>
                <option value="ENCOMIENDA">{t('claims.parcelOption', 'Servicio de Encomiendas y Giros')}</option>
              </select>
            </div>

            <div className="claims-form-group">
              <label className="claims-label">{t('claims.amountClaimed', 'Monto Reclamado (S/):')}</label>
              <input 
                type="number" 
                step="0.01" 
                className="claims-input" 
                value={formData.montoReclamado}
                onChange={(e) => setFormData({ ...formData, montoReclamado: e.target.value })}
                placeholder="Ej. 50.00"
              />
            </div>
          </div>

          <div className="claims-form-group">
            <label className="claims-label">{t('claims.serviceDesc', 'Descripción del Servicio (Boleto / Fecha / Ruta):')}</label>
            <input 
              type="text" 
              className="claims-input" 
              required
              value={formData.descripcionBien}
              onChange={(e) => setFormData({ ...formData, descripcionBien: e.target.value })}
              placeholder={t('claims.serviceDescPlaceholder', 'Ej. Boleto Cusco - Hidroeléctrica del 15/08/2026')}
            />
          </div>

          {/* SECCIÓN 3: DETALLE DE LA RECLAMACIÓN */}
          <h3 className="claims-section-title">
            <FaExclamationCircle /> {t('claims.sec3Title', '3. Detalle de la Reclamación')}
          </h3>

          <div className="claims-form-group">
            <label className="claims-label">{t('claims.claimType', 'Tipo de Registro:')}</label>
            <div className="claims-radios-container">
              <label className={`claims-radio-card ${formData.tipoReclamo === 'RECLAMO' ? 'active' : ''}`}>
                <input 
                  type="radio" 
                  name="tipoReclamo" 
                  value="RECLAMO" 
                  checked={formData.tipoReclamo === 'RECLAMO'}
                  onChange={() => setFormData({ ...formData, tipoReclamo: 'RECLAMO' })}
                />
                <div className="claims-radio-content">
                  <span className="claims-radio-name">{t('claims.claimRadio', 'Reclamo')}</span>
                  <span className="claims-radio-desc">{t('claims.claimRadioDesc', 'Disconformidad con el servicio')}</span>
                </div>
              </label>

              <label className={`claims-radio-card ${formData.tipoReclamo === 'QUEJA' ? 'active' : ''}`}>
                <input 
                  type="radio" 
                  name="tipoReclamo" 
                  value="QUEJA" 
                  checked={formData.tipoReclamo === 'QUEJA'}
                  onChange={() => setFormData({ ...formData, tipoReclamo: 'QUEJA' })}
                />
                <div className="claims-radio-content">
                  <span className="claims-radio-name">{t('claims.complaintRadio', 'Queja')}</span>
                  <span className="claims-radio-desc">{t('claims.complaintRadioDesc', 'Malestar respecto a la atención')}</span>
                </div>
              </label>
            </div>
          </div>

          <div className="claims-form-group">
            <label className="claims-label">{t('claims.factsDetail', 'Detalle de los hechos:')}</label>
            <textarea 
              rows={4} 
              className="claims-textarea" 
              required
              value={formData.detalle}
              onChange={(e) => setFormData({ ...formData, detalle: e.target.value })}
              placeholder={t('claims.factsPlaceholder', 'Explica detalladamente lo sucedido...')}
            />
          </div>

          <div className="claims-form-group">
            <label className="claims-label">{t('claims.concreteRequest', 'Pedido concreto del consumidor:')}</label>
            <textarea 
              rows={3} 
              className="claims-textarea" 
              required
              value={formData.pedido}
              onChange={(e) => setFormData({ ...formData, pedido: e.target.value })}
              placeholder={t('claims.requestPlaceholder', '¿Qué solución o respuesta solicitas de la empresa?')}
            />
          </div>

          <button 
            type="submit" 
            className="claims-submit-btn"
          >
            <FaBook /> {t('claims.submitBtn', 'Enviar Hoja de Reclamación')}
          </button>
        </form>
      )}
    </div>
  );
}
