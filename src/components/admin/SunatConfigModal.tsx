import React, { useState, useEffect } from 'react';
import { FaServer, FaCheckCircle, FaTimesCircle, FaSave, FaTimes, FaExternalLinkAlt } from 'react-icons/fa';
import { getSunatConfig, saveSunatConfig, type SunatConfig } from '../../services/sunatService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.75)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  padding: '20px'
};

const modalBoxStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  maxWidth: '550px',
  width: '100%',
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
  overflow: 'hidden',
  border: '1px solid #e2e8f0'
};

const modalHeaderStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #0f4c81, #742284)',
  color: '#ffffff',
  padding: '18px 24px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const infoBoxStyle: React.CSSProperties = {
  marginBottom: '20px',
  padding: '12px 16px',
  backgroundColor: '#f0f9ff',
  borderRadius: '10px',
  border: '1px solid #bae6fd'
};

const toggleBoxStyle: React.CSSProperties = {
  marginBottom: '20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px',
  background: '#f8fafc',
  borderRadius: '10px'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '8px',
  border: '1px solid #cbd5e1',
  fontSize: '0.9rem',
  boxSizing: 'border-box'
};

const smallInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #cbd5e1',
  boxSizing: 'border-box'
};

const testButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  borderRadius: '8px',
  border: '1px solid #0f4c81',
  backgroundColor: '#f0f9ff',
  color: '#0f4c81',
  fontWeight: 'bold',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  fontSize: '0.85rem',
  marginBottom: '10px'
};

const modalFooterStyle: React.CSSProperties = {
  padding: '16px 24px',
  borderTop: '1px solid #e2e8f0',
  backgroundColor: '#f8fafc',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

export const SunatConfigModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<SunatConfig>(getSunatConfig());
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfig(getSunatConfig());
      setTestResult(null);
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveSunatConfig(config);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleTestConnection = async () => {
    if (!config.apiUrl || !config.apiToken) {
      setTestResult({
        success: false,
        message: 'Por favor ingresa la Ruta de la API y el Token de autorización de Nubefact / PSE.'
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiToken}`
        },
        body: JSON.stringify({ test: true })
      });

      if (res.status === 401 || res.status === 403) {
        setTestResult({
          success: false,
          message: 'Error de Autenticación: El Token ingresado no es válido o ha expirado.'
        });
      } else {
        setTestResult({
          success: true,
          message: '¡Conexión establecida correctamente con el servidor del Proveedor SUNAT!'
        });
      }
    } catch (_err) {
      setTestResult({
        success: false,
        message: 'Error de red al conectar con el API Endpoint. Verifica la URL.'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={modalBoxStyle}>
        {/* Header */}
        <div style={modalHeaderStyle}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
            <FaServer /> Configuración Facturación SUNAT (PSE / Nubefact)
          </h3>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}
          >
            <FaTimes />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', maxHeight: '75vh', overflowY: 'auto' }}>
          
          <div style={infoBoxStyle}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#0369a1' }}>
              <strong>Empresa:</strong> INVERSIONES TUNKY CHASKY S.R.L.<br />
              <strong>RUC:</strong> 20613271701<br />
              Ingresa las credenciales API de tu cuenta en Nubefact (o tu proveedor PSE) para enviar comprobantes automáticamente a SUNAT.
            </p>
          </div>

          {/* Toggle Activar */}
          <div style={toggleBoxStyle}>
            <label style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '0.95rem' }}>
              Habilitar Envío Automático a SUNAT:
            </label>
            <input 
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
          </div>

          {/* API URL */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '6px', color: '#475569' }}>
              Ruta del API Endpoint (Ruta Nubefact/PSE):
            </label>
            <input 
              type="text"
              placeholder="https://api.nubefact.com/api/v1/..."
              value={config.apiUrl}
              onChange={(e) => setConfig({ ...config, apiUrl: e.target.value })}
              style={inputStyle}
            />
          </div>

          {/* API Token */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '6px', color: '#475569' }}>
              Token de Autorización (Secret Key / Bearer):
            </label>
            <input 
              type="password"
              placeholder="Ej: e4f89d3a71b20c..."
              value={config.apiToken}
              onChange={(e) => setConfig({ ...config, apiToken: e.target.value })}
              style={inputStyle}
            />
          </div>

          {/* Series */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '6px', color: '#475569' }}>
                Serie Boletas:
              </label>
              <input 
                type="text"
                value={config.serieBoleta}
                onChange={(e) => setConfig({ ...config, serieBoleta: e.target.value.toUpperCase() })}
                style={smallInputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '6px', color: '#475569' }}>
                Serie Facturas:
              </label>
              <input 
                type="text"
                value={config.serieFactura}
                onChange={(e) => setConfig({ ...config, serieFactura: e.target.value.toUpperCase() })}
                style={smallInputStyle}
              />
            </div>
          </div>

          {/* Tipo de IGV */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '6px', color: '#475569' }}>
              Tipo de IGV para Pasajes Terrestres:
            </label>
            <select
              value={config.tipoIgv}
              onChange={(e) => setConfig({ ...config, tipoIgv: Number(e.target.value) })}
              style={inputStyle}
            >
              <option value={8}>8 - Exonerado (Transporte Nacional de Pasajeros Ley 27037 / 27265)</option>
              <option value={1}>1 - Gravado (18% IGV Incluido)</option>
            </select>
          </div>

          {/* Resultado de prueba */}
          {testResult && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '15px',
              backgroundColor: testResult.success ? '#dcfce7' : '#fee2e2',
              color: testResult.success ? '#15803d' : '#b91c1c',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {testResult.success ? <FaCheckCircle /> : <FaTimesCircle />}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Botón Probar Conexión */}
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            style={testButtonStyle}
          >
            <FaExternalLinkAlt /> {testing ? 'Probando conexión...' : 'Probar Conexión con Nubefact / PSE'}
          </button>

        </div>

        {/* Footer */}
        <div style={modalFooterStyle}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#fff',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Cancelar
          </button>

          <button
            onClick={handleSave}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: savedSuccess ? '#10b981' : '#0f4c81',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {savedSuccess ? <FaCheckCircle /> : <FaSave />}
            {savedSuccess ? '¡Guardado!' : 'Guardar Configuración'}
          </button>
        </div>
      </div>
    </div>
  );
};
