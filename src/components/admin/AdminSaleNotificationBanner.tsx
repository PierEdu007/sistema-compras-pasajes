import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBell, FaTimes, FaArrowRight, FaVolumeUp } from 'react-icons/fa';
import { playNotificationSound } from '../../utils/notificationHelper';

export interface SaleNotificationData {
  id?: string;
  nombres: string;
  apellidos: string;
  numero_asiento: number;
  monto_pagado: number;
  nro_operacion?: string;
  culqi_charge_id?: string;
  tipo_documento?: string;
  nro_documento?: string;
  created_at?: string;
}

interface Props {
  sale: SaleNotificationData | null;
  onClose: () => void;
}

export const AdminSaleNotificationBanner: React.FC<Props> = ({ sale, onClose }) => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (sale) {
      setVisible(true);
      // Auto-ocultar después de 20 segundos
      const timer = setTimeout(() => {
        setVisible(false);
        onClose();
      }, 20000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [sale, onClose]);

  if (!sale || !visible) return null;

  const opCode = sale.nro_operacion || (sale.culqi_charge_id && sale.culqi_charge_id.startsWith('YAPE-') ? sale.culqi_charge_id.split('|')[0].replace('YAPE-', '') : sale.culqi_charge_id) || '';

  const handleGoToSales = () => {
    setVisible(false);
    onClose();
    navigate('/admin/ventas');
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: 99999,
        maxWidth: '420px',
        width: 'calc(100% - 48px)',
        background: 'linear-gradient(135deg, #0f4c81 0%, #742284 100%)',
        color: '#ffffff',
        borderRadius: '16px',
        padding: '18px 20px',
        boxShadow: '0 12px 35px rgba(116, 34, 132, 0.45), 0 4px 15px rgba(0,0,0,0.3)',
        border: '2px solid rgba(255, 255, 255, 0.25)',
        animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        fontFamily: 'var(--font-sans, system-ui, sans-serif)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              background: '#f59e0b',
              color: '#ffffff',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              boxShadow: '0 0 15px rgba(245, 158, 11, 0.6)',
              animation: 'pulse 1.5s infinite'
            }}
          >
            <FaBell />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#fef08a', fontWeight: 800 }}>
              ¡NUEVO PAGO REGISTRADO!
            </span>
            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>
              {sale.nombres} {sale.apellidos}
            </h4>
          </div>
        </div>
        <button
          onClick={() => { setVisible(false); onClose(); }}
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            color: '#ffffff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Cerrar aviso"
        >
          <FaTimes />
        </button>
      </div>

      <div
        style={{
          background: 'rgba(0, 0, 0, 0.25)',
          borderRadius: '10px',
          padding: '10px 14px',
          fontSize: '0.88rem',
          margin: '10px 0',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px'
        }}
      >
        <div>
          <span style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>Asiento:</span>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: '#38bdf8' }}>#{sale.numero_asiento}</div>
        </div>
        <div>
          <span style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>Monto:</span>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: '#4ade80' }}>S/ {Number(sale.monto_pagado || 0).toFixed(2)}</div>
        </div>
        {opCode && (
          <div style={{ gridColumn: '1 / -1', marginTop: '2px' }}>
            <span style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>N° Operación / Yape:</span>
            <div style={{ fontWeight: 700, color: '#fef08a' }}>{opCode}</div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button
          onClick={handleGoToSales}
          style={{
            flex: 1,
            background: '#ffffff',
            color: '#742284',
            border: 'none',
            borderRadius: '8px',
            padding: '9px 14px',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
          }}
        >
          Ver y Confirmar <FaArrowRight />
        </button>
        <button
          onClick={() => playNotificationSound()}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            color: '#ffffff',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '8px',
            padding: '9px 12px',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
          title="Repetir sonido de alerta"
        >
          <FaVolumeUp />
        </button>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};
