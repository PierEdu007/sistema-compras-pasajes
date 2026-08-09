import React, { useState } from 'react';
import { FaCopy, FaCheckCircle, FaQrcode, FaLock, FaTimes } from 'react-icons/fa';
import '../../styles/components/YapeModal.css';

export interface YapePaymentData {
  nro_operacion: string;
  telefono_yape: string;
}

interface YapePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: YapePaymentData) => void;
  monto: number;
  asiento: number;
  origen: string;
  destino: string;
  disabled?: boolean;
}

export default function YapePaymentModal({
  isOpen,
  onClose,
  onConfirm,
  monto,
  asiento,
  origen,
  destino,
  disabled = false
}: YapePaymentModalProps) {
  const [nroOperacion, setNroOperacion] = useState('');
  const [telefonoYape, setTelefonoYape] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const YAPE_NUMBER = '987 654 321';
  const YAPE_TITULAR = "Inversiones K'intu S.A.C.";

  if (!isOpen) return null;

  const handleCopyNumber = () => {
    navigator.clipboard.writeText('987654321');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOp = nroOperacion.trim();

    if (!cleanOp || cleanOp.length < 6) {
      setError('Por favor ingresa un código de operación válido de al menos 6 dígitos.');
      return;
    }

    setError('');
    onConfirm({
      nro_operacion: cleanOp,
      telefono_yape: telefonoYape.trim()
    });
  };

  return (
    <div className="yape-modal-overlay">
      <div className="yape-modal-content fade-in slide-up">
        <button className="yape-modal-close" onClick={onClose} disabled={disabled} type="button">
          <FaTimes />
        </button>

        <div className="yape-modal-header">
          <div className="yape-badge-logo">
            <span className="yape-logo-text">yape</span>
          </div>
          <h2>Pagar con Yape</h2>
          <p className="yape-modal-subtitle">Escanea el código QR o yapea directo para confirmar tu pasaje</p>
        </div>

        <div className="yape-modal-body">
          {/* Summary Box */}
          <div className="yape-summary-card">
            <div className="summary-item">
              <span className="label">Ruta:</span>
              <span className="val">{origen} ➔ {destino}</span>
            </div>
            <div className="summary-item">
              <span className="label">Asiento:</span>
              <span className="val">#{asiento}</span>
            </div>
            <div className="summary-item total">
              <span className="label">Monto a Yapear:</span>
              <span className="amount">S/ {monto.toFixed(2)}</span>
            </div>
          </div>

          <div className="yape-qr-section">
            <div className="yape-qr-box">
              {/* Custom SVG QR simulation with Yape Styling */}
              <div className="qr-image-wrapper">
                <svg viewBox="0 0 200 200" width="160" height="160" xmlns="http://www.w3.org/2000/svg">
                  <rect width="200" height="200" fill="#ffffff" rx="12" />
                  {/* Position detection patterns */}
                  <rect x="15" y="15" width="45" height="45" fill="#742284" rx="4" />
                  <rect x="22" y="22" width="31" height="31" fill="#ffffff" rx="2" />
                  <rect x="29" y="29" width="17" height="17" fill="#742284" rx="1" />

                  <rect x="140" y="15" width="45" height="45" fill="#742284" rx="4" />
                  <rect x="147" y="22" width="31" height="31" fill="#ffffff" rx="2" />
                  <rect x="154" y="29" width="17" height="17" fill="#742284" rx="1" />

                  <rect x="15" y="140" width="45" height="45" fill="#742284" rx="4" />
                  <rect x="22" y="147" width="31" height="31" fill="#ffffff" rx="2" />
                  <rect x="29" y="154" width="17" height="17" fill="#742284" rx="1" />

                  {/* QR code simulated data blocks */}
                  <rect x="70" y="20" width="15" height="15" fill="#00d2b8" />
                  <rect x="95" y="20" width="10" height="25" fill="#742284" />
                  <rect x="115" y="35" width="15" height="10" fill="#742284" />
                  
                  <rect x="20" y="70" width="25" height="10" fill="#742284" />
                  <rect x="55" y="70" width="20" height="20" fill="#00d2b8" />
                  <rect x="85" y="65" width="30" height="30" fill="#742284" rx="4" />
                  <text x="100" y="85" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">YAPE</text>

                  <rect x="125" y="70" width="25" height="15" fill="#742284" />
                  <rect x="160" y="70" width="20" height="20" fill="#00d2b8" />

                  <rect x="20" y="95" width="15" height="25" fill="#00d2b8" />
                  <rect x="45" y="100" width="30" height="10" fill="#742284" />
                  <rect x="130" y="95" width="15" height="25" fill="#742284" />
                  <rect x="155" y="100" width="25" height="15" fill="#00d2b8" />

                  <rect x="70" y="140" width="20" height="20" fill="#742284" />
                  <rect x="100" y="145" width="25" height="15" fill="#00d2b8" />
                  <rect x="135" y="140" width="20" height="40" fill="#742284" />
                  <rect x="70" y="170" width="30" height="15" fill="#00d2b8" />
                  <rect x="110" y="170" width="15" height="15" fill="#742284" />
                </svg>
              </div>
              <div className="yape-qr-caption">
                <FaQrcode /> Escanea desde tu app Yape
              </div>
            </div>

            <div className="yape-phone-info">
              <div className="info-label">O yapea al número:</div>
              <div className="phone-number-row">
                <span className="phone-number">{YAPE_NUMBER}</span>
                <button
                  type="button"
                  className={`btn-copy ${copied ? 'copied' : ''}`}
                  onClick={handleCopyNumber}
                  title="Copiar número"
                >
                  {copied ? <FaCheckCircle /> : <FaCopy />}
                  {copied ? '¡Copiado!' : 'Copiar'}
                </button>
              </div>
              <div className="titular-info">Titular: <strong>{YAPE_TITULAR}</strong></div>
            </div>
          </div>

          {/* Verification Form */}
          <form className="yape-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="nro_operacion">
                Código de Operación Yape <span className="required">*</span>
              </label>
              <input
                id="nro_operacion"
                type="text"
                className="form-control"
                placeholder="Ej: 123456 (ver en tu comprobante Yape)"
                value={nroOperacion}
                onChange={(e) => setNroOperacion(e.target.value.replace(/\D/g, ''))}
                maxLength={10}
                required
                disabled={disabled}
              />
              <small className="help-text">Ingresa los 6 dígitos que figuran como N° de Operación en Yape.</small>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="telefono_yape">
                Número de Celular desde el que Yapeaste <small>(Opcional)</small>
              </label>
              <input
                id="telefono_yape"
                type="tel"
                className="form-control"
                placeholder="Ej: 987654321"
                value={telefonoYape}
                onChange={(e) => setTelefonoYape(e.target.value)}
                disabled={disabled}
              />
            </div>

            {error && <div className="yape-error-alert">{error}</div>}

            <div className="yape-actions">
              <button
                type="submit"
                className="btn btn-yape-submit"
                disabled={disabled || !nroOperacion}
              >
                {disabled ? (
                  <span>Procesando pago...</span>
                ) : (
                  <span><FaLock /> Confirmar y Enviar Pago</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
