import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaPrint, FaHome, FaQrcode, FaClock } from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import '../styles/components/Confirmation.css';

interface VentaDetails {
  id: string;
  numero_asiento: number;
  nombres: string;
  apellidos: string;
  tipo_documento: string;
  nro_documento: string;
  monto_pagado: number;
  culqi_charge_id: string;
  created_at: string;
  viajes?: {
    fecha_viaje: string;
    hora_viaje: string;
    vehiculos?: { nombre_display: string };
    rutas?: { origen: string; destino: string };
  };
}

interface LocationState {
  nro_operacion?: string;
  metodo_pago?: string;
  monto_pagado?: number;
  pasajero?: string;
  tipo_documento?: string;
  nro_documento?: string;
  origen?: string;
  destino?: string;
  asiento?: number;
  fecha_viaje?: string;
  hora_viaje?: string;
  bus?: string;
}

function Confirmation() {
  const { t } = useTranslation();
  const { ventaId } = useParams<{ ventaId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const stateData = (location.state as LocationState) || {};
  const [venta, setVenta] = useState<VentaDetails | null>(null);
  const [_loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ventaId) return;

    const fetchVenta = async () => {
      try {
        const { data, error } = await supabase
          .from('ventas')
          .select(`
            id,
            numero_asiento,
            nombres,
            apellidos,
            tipo_documento,
            nro_documento,
            monto_pagado,
            culqi_charge_id,
            created_at,
            viajes (
              fecha_viaje,
              hora_viaje,
              vehiculos (nombre_display),
              rutas (origen, destino)
            )
          `)
          .eq('id', ventaId)
          .single();

        if (!error && data) {
          setVenta(data as unknown as VentaDetails);
        }
      } catch (err) {
        console.error('Error fetching venta:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVenta();
  }, [ventaId]);

  // Fallbacks usando stateData si no se encuentra en DB aún
  const pasajeroNombre = venta ? `${venta.nombres} ${venta.apellidos}` : stateData.pasajero || 'Pasajero Registrado';
  const docInfo = venta ? `${venta.tipo_documento}: ${venta.nro_documento}` : `${stateData.tipo_documento || 'DNI'}: ${stateData.nro_documento || '--------'}`;
  const rutaInfo = venta?.viajes?.rutas ? `${venta.viajes.rutas.origen} ➔ ${venta.viajes.rutas.destino}` : (stateData.origen && stateData.destino ? `${stateData.origen} ➔ ${stateData.destino}` : 'Ruta Seleccionada');
  const asientoNum = venta ? venta.numero_asiento : stateData.asiento || 1;
  const fechaHoraInfo = venta?.viajes ? `${venta.viajes.fecha_viaje} - ${venta.viajes.hora_viaje.substring(0, 5)}` : (stateData.fecha_viaje ? `${stateData.fecha_viaje} - ${stateData.hora_viaje?.substring(0, 5)}` : 'Fecha Programada');
  const busInfo = venta?.viajes?.vehiculos?.nombre_display || stateData.bus || 'Bus Estándar';
  const montoTotal = venta ? venta.monto_pagado : (stateData.monto_pagado || 0);

  const nroOperacion = stateData.nro_operacion || (venta?.culqi_charge_id?.startsWith('YAPE-') ? venta.culqi_charge_id.replace('YAPE-', '') : null);

  return (
    <div className="page-confirmation container py-5 fade-in">
      <div className="confirmation-card">
        <div className="confirmation-header text-center">
          <div className="success-icon-wrapper">
            <FaCheckCircle className="success-icon" />
          </div>
          <h1>¡Reserva Registrada Exitosamente!</h1>
          <p className="confirmation-subtitle">
            {t('confirmation.subtitle', 'Tu pasaje ha sido reservado. Conserva este comprobante.')}
          </p>

          <div className="verification-status-banner">
            <FaClock /> <strong>Estado del Pago:</strong> Registrado (En verificación con Yape N° {nroOperacion || '------'})
          </div>
        </div>

        <div className="ticket-details-box">
          <div className="ticket-header">
            <span>BOLETO DE VIAJE</span>
            <span className="code"># {ventaId?.substring(0, 12).toUpperCase()}</span>
          </div>

          <div className="ticket-body">
            <div className="ticket-row">
              <div className="ticket-col">
                <small>PASAJERO</small>
                <strong>{pasajeroNombre}</strong>
              </div>
              <div className="ticket-col text-right">
                <small>DOCUMENTO</small>
                <strong>{docInfo}</strong>
              </div>
            </div>

            <div className="ticket-row">
              <div className="ticket-col">
                <small>RUTA</small>
                <strong>{rutaInfo}</strong>
              </div>
              <div className="ticket-col text-right">
                <small>ASIENTO</small>
                <strong className="seat-badge">#{asientoNum}</strong>
              </div>
            </div>

            <div className="ticket-row">
              <div className="ticket-col">
                <small>FECHA Y HORA</small>
                <strong>{fechaHoraInfo}</strong>
              </div>
              <div className="ticket-col text-right">
                <small>BUS</small>
                <strong>{busInfo}</strong>
              </div>
            </div>

            <div className="ticket-divider"></div>

            <div className="ticket-payment-info">
              <div className="payment-method-badge">
                <span className="yape-mini-tag"><FaQrcode /> YAPE</span>
                {nroOperacion && (
                  <span className="op-number">N° Op: <strong>{nroOperacion}</strong></span>
                )}
              </div>
              <div className="total-paid">
                <small>TOTAL</small>
                <span>S/ {montoTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="confirmation-actions">
          <button className="btn btn-secondary" onClick={() => window.print()}>
            <FaPrint /> Imprimir Boleto
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            <FaHome /> Volver al Inicio
          </button>
        </div>
      </div>
    </div>
  );
}

export default Confirmation;
