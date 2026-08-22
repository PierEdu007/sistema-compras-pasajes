import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { FaCopy, FaCheckCircle, FaQrcode, FaLock, FaTimes } from 'react-icons/fa';
import {
  PATTERNS,
  containsDangerousCode,
  sanitizeOperationCode,
  filterLivePhoneInput,
  sanitizePhone
} from '../../utils/security';
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
  const { t } = useTranslation();
  const [nroOperacion, setNroOperacion] = useState('');
  const [telefonoYape, setTelefonoYape] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const YAPE_NUMBER = '997 475 405';
  const YAPE_TITULAR = "Inversiones Tunky Chasky S.R.L.";

  if (!isOpen) return null;

  const handleCopyNumber = () => {
    navigator.clipboard.writeText('997475405');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (containsDangerousCode(nroOperacion) || containsDangerousCode(telefonoYape)) {
      setError(t('validation.invalidCharacters', 'Se detectaron caracteres especiales o códigos no permitidos por motivos de seguridad.'));
      return;
    }

    const cleanOp = sanitizeOperationCode(nroOperacion);
    if (!cleanOp || cleanOp.length < 6) {
      setError(t('yape.opError', 'Por favor ingresa un código de operación válido de al menos 6 dígitos.'));
      return;
    }

    if (telefonoYape.trim() && !PATTERNS.PHONE.test(sanitizePhone(telefonoYape))) {
      setError(t('validation.phoneLength', 'El teléfono debe contener 9 dígitos válidos comenzando con 9.'));
      return;
    }

    setError('');
    onConfirm({
      nro_operacion: cleanOp,
      telefono_yape: sanitizePhone(telefonoYape)
    });
  };

  return createPortal(
    <div className="yape-modal-overlay">
      <div className="yape-modal-content fade-in slide-up">
        <button className="yape-modal-close" onClick={onClose} disabled={disabled} type="button">
          <FaTimes />
        </button>

        <div className="yape-modal-header">
          <div className="yape-badge-logo">
            <span className="yape-logo-text">yape</span>
          </div>
          <h2>{t('yape.payTitle', 'Pagar con Yape')}</h2>
          <p className="yape-modal-subtitle">{t('yape.subtitle', 'Escanea el código QR o yapea directo para confirmar tu pasaje')}</p>
        </div>

        <div className="yape-modal-body">
          {/* Summary Box */}
          <div className="yape-summary-card">
            <div className="summary-item">
              <span className="label">{t('yape.route', 'Ruta')}:</span>
              <span className="val">{origen} ➔ {destino}</span>
            </div>
            <div className="summary-item">
              <span className="label">{t('yape.seat', 'Asiento')}:</span>
              <span className="val">#{asiento}</span>
            </div>
            <div className="summary-item total">
              <span className="label">{t('yape.amountToYape', 'Monto a Yapear')}:</span>
              <span className="amount">S/ {monto.toFixed(2)}</span>
            </div>
          </div>

          <div className="yape-qr-section">
            <div className="yape-qr-box">
              {/* Real Scannable Yape QR Code Image */}
              <div className="qr-image-wrapper">
                <img 
                  src="/yape-qr.png" 
                  alt="Código QR Yape" 
                  style={{ width: '180px', height: '180px', borderRadius: '12px', objectFit: 'contain', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                />
              </div>
              <div className="yape-qr-caption">
                <FaQrcode /> {t('yape.scanFromApp', 'Escanea desde tu app Yape')}
              </div>
            </div>

            <div className="yape-phone-info">
              <div className="info-label">{t('yape.orTransferTo', 'O yapea al número:')}</div>
              <div className="phone-number-row">
                <span className="phone-number">{YAPE_NUMBER}</span>
                <button
                  type="button"
                  className={`btn-copy ${copied ? 'copied' : ''}`}
                  onClick={handleCopyNumber}
                  title="Copiar número"
                >
                  {copied ? <FaCheckCircle /> : <FaCopy />}
                  {copied ? t('yape.copied', '¡Copiado!') : t('yape.copy', 'Copiar')}
                </button>
              </div>
              <div className="titular-info">{t('yape.holder', 'Titular')}: <strong>{YAPE_TITULAR}</strong></div>
            </div>
          </div>

          {/* Verification Form */}
          <form className="yape-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="nro_operacion">
                {t('yape.opCode', 'Código de Operación Yape')} <span className="required">*</span>
              </label>
              <input
                id="nro_operacion"
                type="text"
                className="form-control"
                placeholder="Ej: 123456 (ver en tu comprobante Yape)"
                value={nroOperacion}
                onChange={(e) => setNroOperacion(e.target.value.replace(/\D/g, '').slice(0, 10))}
                maxLength={10}
                required
                disabled={disabled}
              />
              <small className="help-text">{t('yape.opCodeHelp', 'Ingresa los 6 dígitos que figuran como N° de Operación en Yape.')}</small>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="telefono_yape">
                {t('yape.phoneLabel', 'Número de Celular desde el que Yapeaste')} <span className="yape-optional-hint">({t('yape.phoneOptional', 'Opcional')})</span>
              </label>
              <input
                id="telefono_yape"
                type="tel"
                className="form-control"
                placeholder="Dejar en blanco si es el mismo celular del pasajero"
                value={telefonoYape}
                onChange={(e) => setTelefonoYape(filterLivePhoneInput(e.target.value))}
                maxLength={15}
                disabled={disabled}
              />
              <small className="help-text">
                {t('yape.phoneHelp', 'Si no ingresas un número, se usará automáticamente el teléfono del pasajero registrado anteriormente.')}
              </small>
            </div>

            {error && <div className="yape-error-alert">{error}</div>}

            <div className="yape-actions">
              <button
                type="submit"
                className="btn btn-yape-submit"
                disabled={disabled || !nroOperacion}
              >
                {disabled ? (
                  <span>{t('yape.processing', 'Procesando pago...')}</span>
                ) : (
                  <span><FaLock /> {t('yape.confirmSubmit', 'Confirmar y Enviar Pago')}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
