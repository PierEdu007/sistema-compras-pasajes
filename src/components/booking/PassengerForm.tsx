import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCreditCard, FaFileInvoice } from 'react-icons/fa';

export interface PassengerData {
  tipo_documento: 'DNI' | 'RUC' | 'CE' | 'PASAPORTE';
  nro_documento: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  razon_social?: string;
  direccion_fiscal?: string;
  descripcion_opcional?: string;
}

interface PassengerFormProps {
  onSubmit: (data: PassengerData) => void;
  disabled?: boolean;
}

export default function PassengerForm({ onSubmit, disabled = false }: PassengerFormProps) {
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState<PassengerData>({
    tipo_documento: 'DNI',
    nro_documento: '',
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    razon_social: '',
    direccion_fiscal: '',
    descripcion_opcional: ''
  });

  const [errorMsg, setErrorMsg] = useState('');

  const isRuc = formData.tipo_documento === 'RUC';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const doc = formData.nro_documento.trim();

    if (formData.tipo_documento === 'DNI') {
      if (!/^[0-9]{8}$/.test(doc)) {
        setErrorMsg('El DNI debe contener exactamente 8 dígitos numéricos.');
        return;
      }
    } else if (formData.tipo_documento === 'RUC') {
      if (!/^(10|20)[0-9]{9}$/.test(doc)) {
        setErrorMsg('El RUC debe tener 11 dígitos numéricos y comenzar con 10 o 20.');
        return;
      }
      if (!formData.razon_social?.trim()) {
        setErrorMsg('Por favor ingresa la Razón Social de la empresa.');
        return;
      }
      if (!formData.direccion_fiscal?.trim()) {
        setErrorMsg('Por favor ingresa la Dirección Fiscal de la empresa.');
        return;
      }
    } else {
      if (doc.length < 6 || doc.length > 15) {
        setErrorMsg('El número de documento debe tener entre 6 y 15 caracteres.');
        return;
      }
    }

    setErrorMsg('');
    onSubmit(formData);
  };

  return (
    <form className="passenger-form-wrapper" onSubmit={handleSubmit}>
      <div className="passenger-form">
        {/* Badge Informativo de Comprobante */}
        <div style={{
          gridColumn: '1 / -1',
          background: isRuc ? '#e0f2fe' : '#f0fdf4',
          border: `1px solid ${isRuc ? '#bae6fd' : '#bbf7d0'}`,
          color: isRuc ? '#0369a1' : '#15803d',
          padding: '0.6rem 1rem',
          borderRadius: '10px',
          fontSize: '0.85rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '0.5rem'
        }}>
          <FaFileInvoice />
          <span>
            Tipo de Comprobante: <strong>{isRuc ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA'}</strong>
          </span>
        </div>

        <div className="form-group">
          <label className="form-label">{t('booking.docType', 'Tipo Documento')}</label>
          <select 
            name="tipo_documento" 
            className="form-control" 
            value={formData.tipo_documento}
            onChange={handleChange}
            disabled={disabled}
            required
          >
            <option value="DNI">DNI (Boleta)</option>
            <option value="RUC">RUC (Factura)</option>
            <option value="CE">Carnet de Extranjería (Boleta)</option>
            <option value="PASAPORTE">Pasaporte (Boleta)</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">
            {isRuc ? 'N° RUC' : t('booking.docNumber', 'N° Documento')} <span style={{color: 'red'}}>*</span>
          </label>
          <input 
            type="text" 
            name="nro_documento" 
            className="form-control" 
            value={formData.nro_documento}
            onChange={(e) => {
              const val = isRuc || formData.tipo_documento === 'DNI' 
                ? e.target.value.replace(/\D/g, '') 
                : e.target.value;
              setFormData(prev => ({ ...prev, nro_documento: val }));
            }}
            disabled={disabled}
            required
            maxLength={isRuc ? 11 : formData.tipo_documento === 'DNI' ? 8 : 15}
            placeholder={isRuc ? 'Ej: 20608425676' : 'Ej: 75622278'}
          />
        </div>

        {isRuc && (
          <>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">
                Razón Social / Nombre de la Empresa <span style={{color: 'red'}}>*</span>
              </label>
              <input 
                type="text" 
                name="razon_social" 
                className="form-control" 
                value={formData.razon_social || ''}
                onChange={handleChange}
                disabled={disabled}
                required={isRuc}
                placeholder="Ej: CORPORACION BJR IMPORT SUR S.A.C."
              />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">
                Dirección Fiscal <span style={{color: 'red'}}>*</span>
              </label>
              <input 
                type="text" 
                name="direccion_fiscal" 
                className="form-control" 
                value={formData.direccion_fiscal || ''}
                onChange={handleChange}
                disabled={disabled}
                required={isRuc}
                placeholder="Ej: Cal. Enrique Barron Nro. 1024, Lima"
              />
            </div>
          </>
        )}

        <div className="form-group">
          <label className="form-label">{t('booking.firstName', 'Nombres')}</label>
          <input 
            type="text" 
            name="nombres" 
            className="form-control" 
            value={formData.nombres}
            onChange={handleChange}
            disabled={disabled}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t('booking.lastName', 'Apellidos')}</label>
          <input 
            type="text" 
            name="apellidos" 
            className="form-control" 
            value={formData.apellidos}
            onChange={handleChange}
            disabled={disabled}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t('booking.email', 'Correo Electrónico')}</label>
          <input 
            type="email" 
            name="email" 
            className="form-control" 
            value={formData.email}
            onChange={handleChange}
            disabled={disabled}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t('booking.phone', 'Celular (WhatsApp)')}</label>
          <input 
            type="tel" 
            name="telefono" 
            className="form-control" 
            value={formData.telefono}
            onChange={handleChange}
            disabled={disabled}
            required
          />
        </div>

        {/* Campo Opcional de Descripción para Boleta/Factura */}
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">
            Descripción Opcional <small style={{ color: '#64748b' }}>(Aparecerá en la Boleta o Factura)</small>
          </label>
          <textarea
            name="descripcion_opcional"
            className="form-control"
            rows={2}
            value={formData.descripcion_opcional || ''}
            onChange={handleChange}
            disabled={disabled}
            placeholder="Ej: Servicio de traslado de personal / Nota de equipaje adicional..."
          />
        </div>
      </div>

      {errorMsg && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '0.6rem 1rem',
          borderRadius: '8px',
          fontSize: '0.85rem',
          marginTop: '0.75rem'
        }}>
          {errorMsg}
        </div>
      )}

      <div className="form-actions" style={{ marginTop: '1rem' }}>
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={disabled}
        >
          {t('booking.pay', 'Continuar al Pago')} <FaCreditCard />
        </button>
      </div>
    </form>
  );
}
