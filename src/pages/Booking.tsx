import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import SeatMap from '../components/booking/SeatMap';
import type { VehicleLayout, SeatStatus } from '../components/booking/SeatMap';
import PassengerForm from '../components/booking/PassengerForm';
import type { PassengerData } from '../components/booking/PassengerForm';
import Timer from '../components/booking/Timer';
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
  const [seatStatuses, setSeatStatuses] = useState<Record<number, SeatStatus>>({});
  
  // Estado de la reserva
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [_bloqueoId, setBloqueoId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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

        // Fetch asientos estado actual (simulado o via Supabase function)
        // En un entorno real llamaríamos a la función:
        /*
        const { data: asientos } = await supabase.rpc('obtener_asientos_disponibles', { p_viaje_id: viajeId });
        // Mapear al estado
        */
        
        // Simulación inicial de asientos ocupados (2 y 5)
        setSeatStatuses({
          2: 'PAGADO',
          5: 'BLOQUEADO'
        });

      } catch (err) {
        console.error('Error fetching trip details:', err);
        // Cargar dummy data para propósitos de demostración en UI
        loadDummyData();
      } finally {
        setLoading(false);
      }
    };

    fetchViajeDetails();
  }, [viajeId, navigate]);

  const loadDummyData = () => {
    // Dummy Data para Renault Master
    const dummyLayout: VehicleLayout = {
      filas: [
        { fila: 1, asientos: [{ n: 1, pos: 'izq' }, { n: 2, pos: 'der' }] },
        { fila: 2, asientos: [{ n: 3, pos: 'izq' }, { n: 4, pos: 'cen' }, { n: 5, pos: 'der' }] },
        { fila: 3, asientos: [{ n: 6, pos: 'izq' }, { n: 7, pos: 'cen' }, { n: 8, pos: 'der' }] },
        { fila: 4, asientos: [{ n: 9, pos: 'izq' }, { n: 10, pos: 'cen' }, { n: 11, pos: 'der' }] },
        { fila: 5, asientos: [{ n: 12, pos: 'izq' }, { n: 13, pos: 'cen-izq' }, { n: 14, pos: 'cen-der' }, { n: 15, pos: 'der' }] }
      ]
    };

    setViaje({
      id: viajeId || 'dummy',
      hora_viaje: '08:00:00',
      precio_base: 45.00,
      fecha_viaje: '2026-07-06',
      vehiculos: {
        nombre_display: 'Renault Master',
        layout_json: dummyLayout
      },
      rutas: {
        origen: 'CUSCO',
        destino: 'QUILLABAMBA'
      }
    });

    setSeatStatuses({
      2: 'PAGADO',
      5: 'BLOQUEADO',
      8: 'PAGADO'
    });
  };

  const handleSelectSeat = async (seatNumber: number) => {
    // 1. Simular llamada a Edge Function para bloquear el asiento
    setIsProcessing(true);
    try {
      // Mock del API request
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network
      
      // Si todo sale bien:
      setSelectedSeat(seatNumber);
      
      // Expiración en 6 minutos
      const expiraDate = new Date();
      expiraDate.setMinutes(expiraDate.getMinutes() + 6);
      
      setExpiresAt(expiraDate.toISOString());
      setBloqueoId(`mock-bloqueo-${Date.now()}`);
      
    } catch (err) {
      alert('Error al bloquear el asiento. Por favor intenta de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTimerExpire = () => {
    // Cuando expira el tiempo
    setSelectedSeat(null);
    setBloqueoId(null);
    setExpiresAt(null);
    alert('Tu reserva temporal ha expirado.');
  };

  const handlePassengerSubmit = async (_passengerData: PassengerData) => {
    // 2. Simular flujo de pago Culqi y creación de venta
    setIsProcessing(true);
    try {
      // Mock Culqi / Edge Function /procesar-pago
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Redirigir a confirmación
      const mockVentaId = `venta-${Date.now()}`;
      navigate(`/confirmacion/${mockVentaId}`);
      
    } catch (err) {
      alert('Error al procesar el pago. Intenta nuevamente.');
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
            <span>{viaje.rutas.origen} ➔ {viaje.rutas.destino}</span>
            <span>|</span>
            <span>📅 {viaje.fecha_viaje}</span>
            <span>|</span>
            <span>⏰ {viaje.hora_viaje.substring(0, 5)}</span>
            <span>|</span>
            <span>🚌 {viaje.vehiculos.nombre_display}</span>
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
                <div className="empty-icon">💺</div>
                <h3>Aún no has seleccionado un asiento</h3>
                <p>Por favor, haz clic en un asiento disponible del mapa de la izquierda para comenzar tu reserva.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
