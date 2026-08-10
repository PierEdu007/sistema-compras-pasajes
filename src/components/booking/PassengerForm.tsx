import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCreditCard, FaFileInvoice, FaSpinner, FaSearch, FaCheck } from 'react-icons/fa';

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
  const [loadingLookup, setLoadingLookup] = useState(false);
  const [lookupSuccessMsg, setLookupSuccessMsg] = useState('');

  const isRuc = formData.tipo_documento === 'RUC';
  const isDni = formData.tipo_documento === 'DNI';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg('');
  };

  // Función para consultar SUNAT (RUC) o RENIEC (DNI) via proxy local (sin CORS)
  const fetchDocumentoData = async (doc: string, tipo: string) => {
    const cleanDoc = doc.trim();

    if (tipo === 'RUC') {
      if (!/^(10|20)[0-9]{9}$/.test(cleanDoc)) {
        setErrorMsg('El RUC debe contener exactamente 11 dígitos numéricos y comenzar con 10 o 20.');
        return;
      }

      setLoadingLookup(true);
      setLookupSuccessMsg('');
      setErrorMsg('');

      try {
        const res = await fetch(`/api/ruc?numero=${cleanDoc}`);
        if (res.ok) {
          const data = await res.json();
          const razonSocial = data.nombre || data.razonSocial || data.razon_social || '';
          const direccion = data.direccion || data.direccionFiscal || data.direccion_fiscal || 'CUSCO, PERU';

          if (razonSocial) {
            setFormData(prev => ({
              ...prev,
              razon_social: razonSocial,
              direccion_fiscal: direccion
            }));
            setLookupSuccessMsg(`✅ SUNAT: Razón Social obtenida (${razonSocial})`);
          } else {
            setErrorMsg('RUC no encontrado en SUNAT. Por favor ingresa los datos manualmente.');
          }
        } else if (res.status === 404) {
          setLookupSuccessMsg('ℹ️ Este RUC no se encontró en la base gratuita. Por favor ingresa la Razón Social manualmente.');
        } else {
          setLookupSuccessMsg('ℹ️ No se pudo consultar este RUC automáticamente. Ingresa los datos manualmente.');
        }
      } catch (err: any) {
        console.error('Error al consultar RUC:', err);
        setErrorMsg('Error de conexión al consultar SUNAT. Por favor ingresa la Razón Social manualmente.');
      } finally {
        setLoadingLookup(false);
      }
    } else if (tipo === 'DNI') {
      if (!/^[0-9]{8}$/.test(cleanDoc)) {
        setErrorMsg('El DNI debe contener exactamente 8 dígitos numéricos.');
        return;
      }

      setLoadingLookup(true);
      setLookupSuccessMsg('');
      setErrorMsg('');

      try {
        const res = await fetch(`/api/dni?numero=${cleanDoc}`);
        if (res.ok) {
          const data = await res.json();
          let nombres = data.nombres || '';
          let apellidos = `${data.apellidoPaterno || ''} ${data.apellidoMaterno || ''}`.trim();

          if (!nombres && data.nombre) {
            const parts = data.nombre.trim().split(/\s+/);
            if (parts.length >= 3) {
              apellidos = `${parts[0]} ${parts[1]}`;
              nombres = parts.slice(2).join(' ');
            } else {
              nombres = data.nombre;
            }
          }

          if (nombres || apellidos) {
            setFormData(prev => ({
              ...prev,
              nombres: nombres,
              apellidos: apellidos
            }));
            setLookupSuccessMsg(`✅ RENIEC: Nombres y Apellidos identificados (${nombres} ${apellidos})`);
          } else {
            setLookupSuccessMsg('ℹ️ DNI válido pero sin datos disponibles en la consulta gratuita. Ingresa tus datos manualmente.');
          }
        } else if (res.status === 404) {
          setLookupSuccessMsg('ℹ️ Este DNI no se encontró en la base gratuita. Por favor ingresa tus nombres y apellidos manualmente.');
        } else {
          setLookupSuccessMsg('ℹ️ No se pudo consultar este DNI automáticamente. Por favor ingresa tus datos manualmente.');
        }
      } catch (err: any) {
        console.error('Error al consultar DNI:', err);
        setErrorMsg('Error de conexión al consultar RENIEC. Por favor ingresa tus datos manualmente.');
      } finally {
        setLoadingLookup(false);
      }
    }
  };

  const handleDocumentNumberChange = (val: string) => {
    const cleanVal = isRuc || isDni ? val.replace(/\D/g, '') : val;
    setFormData(prev => ({ ...prev, nro_documento: cleanVal }));
    setLookupSuccessMsg('');

    if ((isRuc && cleanVal.length === 11) || (isDni && cleanVal.length === 8)) {
      fetchDocumentoData(cleanVal, formData.tipo_documento);
    }
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
    <form onSubmit={handleSubmit} className="card-custom fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <FaCreditCard style={{ color: 'var(--color-accent)', fontSize: '1.2rem' }} />
        <h3 style={{ margin: 0, color: 'var(--color-primary)' }}>{t('booking.passengerTitle', 'Datos del Pasajero')}</h3>
      </div>

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
            Tipo de Comprobante a Emitir: <strong>{isRuc ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA'}</strong>
          </span>
        </div>

        <div className="form-group">
          <label className="form-label">{t('booking.docType', 'Tipo Documento')}</label>
          <select 
            name="tipo_documento" 
            className="form-control" 
            value={formData.tipo_documento}
            onChange={(e) => {
              handleChange(e);
              setLookupSuccessMsg('');
            }}
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
          <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{isRuc ? 'N° RUC' : t('booking.docNumber', 'N° Documento')} <span style={{color: 'red'}}>*</span></span>
            {loadingLookup && (
              <span style={{ fontSize: '0.75rem', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FaSpinner className="spin" /> Consultando {isRuc ? 'SUNAT' : 'RENIEC'}...
              </span>
            )}
          </label>
          
          <div style={{ display: 'flex', gap: '6px' }}>
            <input 
              type="text" 
              name="nro_documento" 
              className="form-control" 
              value={formData.nro_documento}
              onChange={(e) => handleDocumentNumberChange(e.target.value)}
              disabled={disabled}
              required
              maxLength={isRuc ? 11 : isDni ? 8 : 15}
              placeholder={isRuc ? 'Ej: 20608425676' : 'Ej: 75622278'}
            />

            {(isRuc || isDni) && (
              <button
                type="button"
                onClick={() => fetchDocumentoData(formData.nro_documento, formData.tipo_documento)}
                disabled={disabled || loadingLookup || !formData.nro_documento}
                style={{
                  background: 'var(--color-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0 12px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
                title={`Buscar datos en ${isRuc ? 'SUNAT' : 'RENIEC'}`}
              >
                {loadingLookup ? <FaSpinner className="spin" /> : <FaSearch />}
                <span>Buscar</span>
              </button>
            )}
          </div>
        </div>

        {lookupSuccessMsg && (
          <div style={{
            gridColumn: '1 / -1',
            background: '#f0fdf4',
            border: '1px solid #86efac',
            color: '#166534',
            padding: '0.5rem 0.8rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <FaCheck /> {lookupSuccessMsg}
          </div>
        )}

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
          <label className="form-label">{t('booking.firstName', 'Nombres')} <span style={{color: 'red'}}>*</span></label>
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
          <label className="form-label">{t('booking.lastName', 'Apellidos')} <span style={{color: 'red'}}>*</span></label>
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
          <label className="form-label">{t('booking.email', 'Correo Electrónico')} <span style={{color: 'red'}}>*</span></label>
          <input 
            type="email" 
            name="email" 
            className="form-control" 
            value={formData.email}
            onChange={handleChange}
            disabled={disabled}
            required
            placeholder="ejemplo@correo.com"
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t('booking.phone', 'Teléfono / Celular')} <span style={{color: 'red'}}>*</span></label>
          <input 
            type="tel" 
            name="telefono" 
            className="form-control" 
            value={formData.telefono}
            onChange={handleChange}
            disabled={disabled}
            required
            placeholder="987654321"
          />
        </div>

        {/* Descripción Opcional para la Boleta / Factura */}
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">
            Descripción Opcional <small style={{ color: '#64748b' }}>(Aparecerá impresa en su {isRuc ? 'Factura' : 'Boleta'})</small>
          </label>
          <textarea
            name="descripcion_opcional"
            className="form-control"
            rows={2}
            value={formData.descripcion_opcional || ''}
            onChange={handleChange}
            disabled={disabled}
            placeholder="Ej: Pasaje ida y vuelta servicio ejecutivo Tunky Chasky"
          />
        </div>
      </div>

      {errorMsg && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          backgroundColor: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: '8px',
          color: '#991b1b',
          fontSize: '0.9rem',
          fontWeight: '500'
        }}>
          {errorMsg}
        </div>
      )}

      <button 
        type="submit" 
        className="btn btn-accent" 
        style={{ width: '100%', marginTop: '1.5rem', padding: '0.85rem' }}
        disabled={disabled || loadingLookup}
      >
        {t('booking.continuePayment', 'Continuar al Pago')}
      </button>
    </form>
  );
}
