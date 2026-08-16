import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaBook, FaCheckCircle, FaExclamationCircle, FaUser, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaFileAlt } from 'react-icons/fa';
import '../styles/components/Booking.css';

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
    <div className="container py-5" style={{ maxWidth: '850px', minHeight: '80vh' }}>
      <div className="text-center mb-4">
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '60px', height: '60px', borderRadius: '50%', background: '#eff6ff', color: '#0f4c81', fontSize: '1.8rem', marginBottom: '15px' }}>
          <FaBook />
        </div>
        <h1 style={{ fontSize: '1.8rem', color: '#0f4c81', fontWeight: 'bold', margin: '0 0 8px 0' }}>
          {t('claims.title', 'Libro de Reclamaciones Virtual')}
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
          Conforme a lo establecido en el Código de Protección y Defensa del Consumidor (Ley N° 29571)
        </p>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px 16px', borderRadius: '8px', display: 'inline-block', marginTop: '12px', fontSize: '0.85rem', color: '#334155' }}>
          <strong>Razón Social:</strong> INVERSIONES TUNKI CHASKY S.R.L. | <strong>RUC:</strong> 20608425676
        </div>
      </div>

      {submitted ? (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '30px', textAlign: 'center' }}>
          <div style={{ color: '#16a34a', fontSize: '3rem', marginBottom: '15px' }}>
            <FaCheckCircle />
          </div>
          <h2 style={{ color: '#166534', fontSize: '1.4rem', margin: '0 0 10px 0' }}>
            ¡Hoja de Reclamación Registrada con Éxito!
          </h2>
          <p style={{ color: '#374151', fontSize: '1rem', marginBottom: '15px' }}>
            Tu código de registro es: <strong style={{ color: '#0f4c81', fontSize: '1.2rem' }}>{claimCode}</strong>
          </p>
          <p style={{ color: '#6b7280', fontSize: '0.88rem', maxWidth: '600px', margin: '0 auto 20px auto', lineHeight: 1.5 }}>
            Hemos recibido tu registro. Conforme a la normativa de INDECOPI, la empresa dará respuesta a tu solicitud en un plazo máximo de quince (15) días hábiles al correo electrónico proporcionado.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="btn btn-primary"
            style={{ padding: '10px 24px', borderRadius: '8px', fontWeight: 'bold' }}
          >
            Volver al Inicio
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          
          {/* SECCIÓN 1: IDENTIFICACIÓN DEL CONSUMIDOR */}
          <h3 style={{ fontSize: '1.1rem', color: '#0f4c81', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaUser /> 1. Identificación del Consumidor Reclamante
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '15px' }}>
            <div className="form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Tipo Documento:</label>
              <select 
                className="form-control" 
                value={formData.tipoDoc}
                onChange={(e) => setFormData({ ...formData, tipoDoc: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              >
                <option value="DNI">DNI</option>
                <option value="CE">Carnet de Extranjería</option>
                <option value="PASAPORTE">Pasaporte</option>
                <option value="RUC">RUC</option>
              </select>
            </div>

            <div className="form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>N° Documento:</label>
              <input 
                type="text" 
                className="form-control" 
                required
                value={formData.nroDoc}
                onChange={(e) => setFormData({ ...formData, nroDoc: e.target.value })}
                placeholder="Ej. 72849182"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '15px' }}>
            <div className="form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Nombres:</label>
              <input 
                type="text" 
                className="form-control" 
                required
                value={formData.nombres}
                onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                placeholder="Nombres completos"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div className="form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Apellidos:</label>
              <input 
                type="text" 
                className="form-control" 
                required
                value={formData.apellidos}
                onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                placeholder="Apellidos completos"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '15px' }}>
            <div className="form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                <FaEnvelope style={{ marginRight: '4px' }} /> Correo Electrónico:
              </label>
              <input 
                type="email" 
                className="form-control" 
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="correo@ejemplo.com"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div className="form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                <FaPhoneAlt style={{ marginRight: '4px' }} /> Teléfono / Celular:
              </label>
              <input 
                type="tel" 
                className="form-control" 
                required
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="927670019"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '25px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
              <FaMapMarkerAlt style={{ marginRight: '4px' }} /> Domicilio:
            </label>
            <input 
              type="text" 
              className="form-control" 
              required
              value={formData.domicilio}
              onChange={(e) => setFormData({ ...formData, domicilio: e.target.value })}
              placeholder="Dirección, Ciudad y Departamento"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>

          {/* SECCIÓN 2: IDENTIFICACIÓN DEL SERVICIO / BIEN */}
          <h3 style={{ fontSize: '1.1rem', color: '#0f4c81', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaFileAlt /> 2. Identificación del Servicio Contratado
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '15px' }}>
            <div className="form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Tipo de Bien:</label>
              <select 
                className="form-control" 
                value={formData.tipoBien}
                onChange={(e) => setFormData({ ...formData, tipoBien: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              >
                <option value="SERVICIO">Servicio de Transporte de Pasajeros</option>
                <option value="ENCOMIENDA">Servicio de Encomiendas y Giros</option>
              </select>
            </div>

            <div className="form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Monto Reclamado (S/):</label>
              <input 
                type="number" 
                step="0.01" 
                className="form-control" 
                value={formData.montoReclamado}
                onChange={(e) => setFormData({ ...formData, montoReclamado: e.target.value })}
                placeholder="Ej. 50.00"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '25px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Descripción del Servicio (Boleto / Fecha / Ruta):</label>
            <input 
              type="text" 
              className="form-control" 
              required
              value={formData.descripcionBien}
              onChange={(e) => setFormData({ ...formData, descripcionBien: e.target.value })}
              placeholder="Ej. Boleto Cusco - Hidroeléctrica del 15/08/2026"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>

          {/* SECCIÓN 3: DETALLE DE LA RECLAMACIÓN */}
          <h3 style={{ fontSize: '1.1rem', color: '#0f4c81', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaExclamationCircle /> 3. Detalle de la Reclamación
          </h3>

          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Tipo:</label>
            <div style={{ display: 'flex', gap: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input 
                  type="radio" 
                  name="tipoReclamo" 
                  value="RECLAMO" 
                  checked={formData.tipoReclamo === 'RECLAMO'}
                  onChange={() => setFormData({ ...formData, tipoReclamo: 'RECLAMO' })}
                />
                <strong>Reclamo:</strong> Disconformidad con el servicio
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input 
                  type="radio" 
                  name="tipoReclamo" 
                  value="QUEJA" 
                  checked={formData.tipoReclamo === 'QUEJA'}
                  onChange={() => setFormData({ ...formData, tipoReclamo: 'QUEJA' })}
                />
                <strong>Queja:</strong> Malestar respecto a la atención
              </label>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Detalle de los hechos:</label>
            <textarea 
              rows={4} 
              className="form-control" 
              required
              value={formData.detalle}
              onChange={(e) => setFormData({ ...formData, detalle: e.target.value })}
              placeholder="Explica detalladamente lo sucedido..."
              style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', resize: 'vertical' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '25px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Pedido concreto del consumidor:</label>
            <textarea 
              rows={2} 
              className="form-control" 
              required
              value={formData.pedido}
              onChange={(e) => setFormData({ ...formData, pedido: e.target.value })}
              placeholder="¿Qué solución o respuesta solicitas de la empresa?"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', resize: 'vertical' }}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <FaBook /> Enviar Hoja de Reclamación
          </button>
        </form>
      )}
    </div>
  );
}
