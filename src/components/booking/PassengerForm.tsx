import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCreditCard } from 'react-icons/fa';

export interface PassengerData {
  tipo_documento: 'DNI' | 'RUC' | 'CE' | 'PASAPORTE';
  nro_documento: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
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
    telefono: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form className="passenger-form-wrapper" onSubmit={handleSubmit}>
      <div className="passenger-form">
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
            <option value="DNI">DNI</option>
            <option value="RUC">RUC</option>
            <option value="CE">Carnet de Extranjería</option>
            <option value="PASAPORTE">Pasaporte</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">{t('booking.docNumber', 'N° Documento')}</label>
          <input 
            type="text" 
            name="nro_documento" 
            className="form-control" 
            value={formData.nro_documento}
            onChange={handleChange}
            disabled={disabled}
            required
            pattern={formData.tipo_documento === 'DNI' ? '[0-9]{8}' : '.*'}
            title={formData.tipo_documento === 'DNI' ? 'DNI debe tener 8 dígitos' : ''}
          />
        </div>

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
      </div>

      <div className="form-actions">
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
