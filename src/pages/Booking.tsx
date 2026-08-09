import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaArrowRight, FaCalendarAlt, FaClock, FaBus, FaCheckSquare } from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import SeatMap from '../components/booking/SeatMap';
import type { VehicleLayout, SeatStatus } from '../components/booking/SeatMap';
import PassengerForm from '../components/booking/PassengerForm';
import type { PassengerData } from '../components/booking/PassengerForm';
import Timer from '../components/booking/Timer';
import YapePaymentModal from '../components/booking/YapePaymentModal';
import type { YapePaymentData } from '../components/booking/YapePaymentModal';
import '../styles/components/Booking.css';

// Interfaz extendida para el viaje
interface ViajeBooking {
  id: string;
  hora_viaje: string;
  precio_base: number;
  fecha_viaje: string;
  vehiculos: {
    nombre_display: string;
    layout_json: VehicleLayout;
  };
  rutas: {
    origen: string;
    destino: string;
  };
}

export default function Booking() {
  const { viajeId } = useParams<{ viajeId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [viaje, setViaje] = useState<ViajeBooking | null>(null);
  const [seatStatuses] = useState<Record<number, SeatStatus>>({});
  
  // Estado de la reserva
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [_bloqueoId, setBloqueoId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Estado para modal Yape
  const [isYapeModalOpen, setIsYapeModalOpen] = useState(false);
  const [pendingPassengerData, setPendingPassengerData] = useState<PassengerData | null>(null);

  useEffect(() => {
    if (!viajeId) {
      navigate('/viajes');
      return;
    }

    const fetchViajeDetails = async () => {
      try {
        const { data, error } = await supabase
          .from('viajes')
          .select(`
            id,
            hora_viaje,
            precio_base,
            fecha_viaje,
            vehiculos (
              nombre_display,
              layout_json
            ),
            rutas (
              origen,
              destino
            )
          `)
          .eq('id', viajeId)
          .single();

        if (error || !data) {
          throw new Error('Viaje no encontrado');
        }

        setViaje(data as unknown as ViajeBooking);
      } catch (err) {
        console.error('Error fetching trip details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchViajeDetails();
  }, [viajeId, navigate]);

  const handleSelectSeat = async (seatNumber: number) => {
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      setSelectedSeat(seatNumber);
      
      const expiraDate = new Date();
      expiraDate.setMinutes(expiraDate.getMinutes() + 10);
      
      setExpiresAt(expiraDate.toISOString());
      setBloqueoId(`bloqueo-${Date.now()}`);
    } catch (err) {
      alert('Error al seleccionar el asiento. Por favor intenta de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTimerExpire = () => {
    setSelectedSeat(null);
    setBloqueoId(null);
    setExpiresAt(null);
    setIsYapeModalOpen(false);
    alert('Tu reserva temporal ha expirado.');
  };

  const handlePassengerSubmit = (passengerData: PassengerData) => {
    if (!viaje || selectedSeat === null) return;
    setPendingPassengerData(passengerData);
    setIsYapeModalOpen(true);
  };

  const handleYapeConfirm = async (yapeData: YapePaymentData) => {
    if (!viaje || selectedSeat === null || !pendingPassengerData) return;

    setIsProcessing(true);
    try {
      let chargeId = `YAPE-${yapeData.nro_operacion}`;
      if (pendingPassengerData.razon_social) {
        chargeId += `|RS:${pendingPassengerData.razon_social}`;
      }
      if (pendingPassengerData.direccion_fiscal) {
        chargeId += `|DIR:${pendingPassengerData.direccion_fiscal}`;
      }
      if (pendingPassengerData.descripcion_opcional) {
        chargeId += `|DESC:${pendingPassengerData.descripcion_opcional}`;
      }

      const basePayload: any = {
        viaje_id: viaje.id,
        numero_asiento: selectedSeat,
        tipo_documento: pendingPassengerData.tipo_documento,
        nro_documento: pendingPassengerData.nro_documento,
        nombres: pendingPassengerData.nombres,
        apellidos: pendingPassengerData.apellidos,
        email: pendingPassengerData.email,
        telefono: pendingPassengerData.telefono,
        monto_pagado: viaje.precio_base,
        culqi_charge_id: chargeId,
      };

      const fullPayload = {
        ...basePayload,
        razon_social: pendingPassengerData.razon_social,
        direccion_fiscal: pendingPassengerData.direccion_fiscal,
        descripcion_opcional: pendingPassengerData.descripcion_opcional,
      };

      let ventaId = `venta-${Date.now()}`;
      let { data: insertedData, error: insertError } = await supabase
        .from('ventas')
        .insert(fullPayload)
        .select('id')
        .single();

      if (insertError) {
        console.warn('Reintentando inserción con payload compatible:', insertError);
        const retryRes = await supabase
          .from('ventas')
          .insert(basePayload)
          .select('id')
          .single();

        insertedData = retryRes.data;
        insertError = retryRes.error;
      }

      if (!insertError && insertedData) {
        ventaId = (insertedData as { id: string }).id;
      } else if (insertError) {
        console.error('Error final al insertar venta:', insertError);
      }

      setIsYapeModalOpen(false);
      navigate(`/confirmacion/${ventaId}`, {
        state: {
          nro_operacion: yapeData.nro_operacion,
          metodo_pago: 'YAPE',
          monto_pagado: viaje.precio_base,
          pasajero: `${pendingPassengerData.nombres} ${pendingPassengerData.apellidos}`,
          tipo_documento: pendingPassengerData.tipo_documento,
          nro_documento: pendingPassengerData.nro_documento,
          razon_social: pendingPassengerData.razon_social,
          direccion_fiscal: pendingPassengerData.direccion_fiscal,
          descripcion_opcional: pendingPassengerData.descripcion_opcional,
          origen: viaje.rutas.origen,
          destino: viaje.rutas.destino,
          asiento: selectedSeat,
          fecha_viaje: viaje.fecha_viaje,
          hora_viaje: viaje.hora_viaje,
          bus: viaje.vehiculos.nombre_display
        }
      });
    } catch (err) {
      console.error('Error al procesar pago por Yape:', err);
      alert('Ocurrió un error al procesar tu solicitud. Intenta nuevamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="page-booking text-center py-5">
        <h3 style={{color: 'var(--color-primary)'}}>{t('common.loading', 'Cargando información del viaje...')}</h3>
      </div>
    );
  }

  if (!viaje) return null;

  return (
    <div className="page-booking fade-in">
      <div className="booking-header">
        <div className="container">
          <h1>{t('booking.title', 'Completa tu Reserva')}</h1>
          <div className="booking-trip-details">
            <span>{viaje.rutas.origen} <FaArrowRight /> {viaje.rutas.destino}</span>
            <span>|</span>
            <span><FaCalendarAlt /> {viaje.fecha_viaje}</span>
            <span>|</span>
            <span><FaClock /> {viaje.hora_viaje.substring(0, 5)}</span>
            <span>|</span>
            <span><FaBus /> {viaje.vehiculos.nombre_display}</span>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="booking-layout">
          {/* Lado Izquierdo: Mapa de Asientos */}
          <div className="booking-sidebar">
            <SeatMap 
              layout={viaje.vehiculos.layout_json}
              seatStatuses={seatStatuses}
              selectedSeat={selectedSeat}
              onSelectSeat={handleSelectSeat}
              disabled={isProcessing || selectedSeat !== null}
            />
          </div>

          {/* Lado Derecho: Formulario y Timer */}
          <div className="booking-main">
            {selectedSeat ? (
              <div className="booking-form-container slide-up">
                <div className="booking-step">
                  <h3 className="step-title">1. {t('booking.timer', 'Tiempo Restante')}</h3>
                  {expiresAt && (
                    <Timer expiresAt={expiresAt} onExpire={handleTimerExpire} />
                  )}
                  
                  <div style={{ backgroundColor: 'var(--color-surface)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    <strong>Asiento Seleccionado:</strong> #{selectedSeat} <br/>
                    <strong>Total a Pagar:</strong> S/ {viaje.precio_base.toFixed(2)}
                  </div>
                </div>

                <div className="booking-step">
                  <h3 className="step-title">2. {t('booking.passengerData', 'Datos del Pasajero')}</h3>
                  <PassengerForm 
                    onSubmit={handlePassengerSubmit} 
                    disabled={isProcessing}
                  />
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon"><FaCheckSquare /></div>
                <h3>Aún no has seleccionado un asiento</h3>
                <p>Por favor, haz clic en un asiento disponible del mapa de la izquierda para comenzar tu reserva.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Pago por Yape */}
      {selectedSeat && (
        <YapePaymentModal 
          isOpen={isYapeModalOpen}
          onClose={() => setIsYapeModalOpen(false)}
          onConfirm={handleYapeConfirm}
          monto={viaje.precio_base}
          asiento={selectedSeat}
          origen={viaje.rutas.origen}
          destino={viaje.rutas.destino}
          disabled={isProcessing}
        />
      )}
    </div>
  );
}
