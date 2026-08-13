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
  const [seatStatuses, setSeatStatuses] = useState<Record<number, SeatStatus>>({});
  
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

        const rawViaje = data as unknown as ViajeBooking;

        // Normalizar vehículo a Camioneta (4 Pasajeros) o (6 Pasajeros) sin placas
        const is6Seats = rawViaje.vehiculos?.nombre_display?.includes('6') || 
                         rawViaje.vehiculos?.nombre_display?.includes('Ertiga') ||
                         (viajeId ? viajeId.charCodeAt(viajeId.length - 1) % 2 === 0 : false);

        const layout4: VehicleLayout = {
          filas: [
            { fila: 1, asientos: [{ n: 1, pos: 'izq' }, { n: 2, pos: 'der' }], nota: 'Conductor + Copiloto' },
            { fila: 2, asientos: [{ n: 3, pos: 'izq' }, { n: 4, pos: 'cen' }, { n: 5, pos: 'der' }], nota: 'Segunda Fila' }
          ]
        };

        const layout6: VehicleLayout = {
          filas: [
            { fila: 1, asientos: [{ n: 1, pos: 'izq' }, { n: 2, pos: 'der' }], nota: 'Conductor + Copiloto' },
            { fila: 2, asientos: [{ n: 3, pos: 'izq' }, { n: 4, pos: 'cen' }, { n: 5, pos: 'der' }], nota: 'Segunda Fila' },
            { fila: 3, asientos: [{ n: 6, pos: 'izq' }, { n: 7, pos: 'der' }], nota: 'Tercera Fila' }
          ]
        };

        rawViaje.vehiculos = {
          nombre_display: is6Seats ? 'Camioneta (6 Pasajeros)' : 'Camioneta (4 Pasajeros)',
          layout_json: is6Seats ? layout6 : layout4
        };

        setViaje(rawViaje);
      } catch (err) {
        console.error('Error fetching trip details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchViajeDetails();
  }, [viajeId, navigate]);

  // Cargar estado de asientos y suscribirse a cambios en tiempo real
  const fetchSeatStatuses = async (vId: string) => {
    try {
      const [{ data: ventasData }, { data: bloqueosData }] = await Promise.all([
        supabase.from('ventas').select('id, numero_asiento, culqi_charge_id').eq('viaje_id', vId),
        supabase.from('asientos_bloqueos').select('numero_asiento, estado, expira_at').eq('viaje_id', vId)
      ]);

      const rejectedList: string[] = JSON.parse(localStorage.getItem('rejected_ventas') || '[]');
      const statuses: Record<number, SeatStatus> = {};

      if (ventasData) {
        for (const v of (ventasData as any[])) {
          if (!v.culqi_charge_id?.startsWith('RECHAZADO_') && !rejectedList.includes(v.id)) {
            statuses[v.numero_asiento] = 'PAGADO';
          }
        }
      }

      if (bloqueosData) {
        const now = new Date();
        for (const b of (bloqueosData as any[])) {
          if (b.estado === 'PAGADO') {
            statuses[b.numero_asiento] = 'PAGADO';
          } else if (b.estado === 'BLOQUEADO') {
            const expDate = new Date(b.expira_at);
            if (expDate > now) {
              statuses[b.numero_asiento] = 'BLOQUEADO';
            }
          }
        }
      }

      setSeatStatuses(statuses);
    } catch (err) {
      console.error('Error fetching seat statuses:', err);
    }
  };

  useEffect(() => {
    if (!viajeId) return;

    fetchSeatStatuses(viajeId);

    const channel = supabase
      .channel(`viaje-seats-${viajeId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'asientos_bloqueos', filter: `viaje_id=eq.${viajeId}` },
        () => fetchSeatStatuses(viajeId)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ventas', filter: `viaje_id=eq.${viajeId}` },
        () => fetchSeatStatuses(viajeId)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [viajeId]);

  const handleSelectSeat = async (seatNumber: number) => {
    if (seatNumber === 1 || !viajeId) return;
    setIsProcessing(true);
    try {
      let sessionToken = sessionStorage.getItem('booking_session_token');
      if (!sessionToken) {
        sessionToken = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        sessionStorage.setItem('booking_session_token', sessionToken);
      }

      // Si ya tenía un asiento seleccionado anteriormente, liberarlo primero en la DB
      if (selectedSeat && selectedSeat !== seatNumber) {
        try {
          await (supabase.from('asientos_bloqueos') as any)
            .delete()
            .eq('viaje_id', viajeId)
            .eq('numero_asiento', selectedSeat)
            .eq('sesion_token', sessionToken);
        } catch (_e) {}
      }

      const expiraDate = new Date();
      expiraDate.setMinutes(expiraDate.getMinutes() + 10);
      const expiraIso = expiraDate.toISOString();

      // 1. Ejecutar RPC en Postgres para bloquear el asiento
      const { error } = await (supabase as any).rpc('bloquear_asiento', {
        p_viaje_id: viajeId,
        p_numero_asiento: seatNumber,
        p_sesion_token: sessionToken,
        p_minutos: 10
      });

      if (error && error.message?.includes('ASIENTO_NO_DISPONIBLE')) {
        alert(`El asiento #${seatNumber} ya ha sido reservado u ocupado por otro usuario.`);
        fetchSeatStatuses(viajeId);
        return;
      }

      // 2. Inserción directa en asientos_bloqueos para visibilidad inmediata
      try {
        await (supabase.from('asientos_bloqueos') as any).upsert({
          viaje_id: viajeId,
          numero_asiento: seatNumber,
          estado: 'BLOQUEADO',
          expira_at: expiraIso,
          sesion_token: sessionToken
        }, { onConflict: 'viaje_id,numero_asiento' });
      } catch (_e) {}

      // 3. Activar el contador y selección
      setSelectedSeat(seatNumber);
      setExpiresAt(expiraIso);
      setBloqueoId(`bloqueo-${Date.now()}`);

      // Actualizar estado local
      setSeatStatuses(prev => {
        const updated = { ...prev };
        if (selectedSeat) delete updated[selectedSeat];
        updated[seatNumber] = 'BLOQUEADO';
        return updated;
      });
    } catch (err) {
      console.error('Error al bloquear asiento:', err);
      alert('Error al seleccionar el asiento. Por favor intenta de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTimerExpire = async () => {
    if (viajeId && selectedSeat) {
      const sessionToken = sessionStorage.getItem('booking_session_token');
      try {
        await (supabase.from('asientos_bloqueos') as any)
          .delete()
          .eq('viaje_id', viajeId)
          .eq('numero_asiento', selectedSeat)
          .eq('sesion_token', sessionToken);
      } catch (_e) {}
    }
    setSelectedSeat(null);
    setBloqueoId(null);
    setExpiresAt(null);
    setIsYapeModalOpen(false);
    alert('Tu reserva temporal ha expirado. El asiento ha sido liberado.');
    if (viajeId) fetchSeatStatuses(viajeId);
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

      const fullPayload = {
        viaje_id: viaje.id,
        numero_asiento: selectedSeat,
        tipo_documento: pendingPassengerData.tipo_documento,
        nro_documento: pendingPassengerData.nro_documento,
        nombres: pendingPassengerData.nombres,
        apellidos: pendingPassengerData.apellidos,
        email: pendingPassengerData.email,
        telefono: pendingPassengerData.telefono || '997475405',
        monto_pagado: viaje.precio_base,
        culqi_charge_id: chargeId,
      };

      let ventaId = `venta-${Date.now()}`;
      
      try {
        const apiRes = await fetch('/api/registrar-venta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fullPayload)
        });

        if (apiRes.ok) {
          const apiData = await apiRes.json();
          if (apiData.success && apiData.venta?.id) {
            ventaId = apiData.venta.id;
          } else {
            throw new Error(apiData.error || 'API serverless devolvió respuesta sin venta ID');
          }
        } else {
          const errBody = await apiRes.text();
          throw new Error(`API serverless respondió status ${apiRes.status}: ${errBody}`);
        }
      } catch (_apiErr) {
        console.warn('Fallback a inserción directa Supabase:', _apiErr);
        const { data: insertedData } = await (supabase
          .from('ventas') as any)
          .insert(fullPayload)
          .select('id')
          .single();

        if (insertedData) {
          ventaId = (insertedData as { id: string }).id;
        }

        try {
          await (supabase.from('asientos_bloqueos') as any)
            .delete()
            .eq('viaje_id', viaje.id)
            .eq('numero_asiento', selectedSeat);

          await (supabase.from('asientos_bloqueos') as any).insert({
            viaje_id: viaje.id,
            numero_asiento: selectedSeat,
            estado: 'PAGADO',
            expira_at: '2099-12-31T23:59:59Z',
            sesion_token: 'PAGADO'
          });
        } catch (_e) {}
      }

      setSeatStatuses(prev => ({ ...prev, [selectedSeat]: 'PAGADO' }));

      // Guardar respaldo local de la venta para visibilidad inmediata en /admin/ventas
      const newVentaRecord = {
        id: ventaId,
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
        metodo_pago: 'YAPE',
        nro_operacion: yapeData.nro_operacion,
        razon_social: pendingPassengerData.razon_social,
        direccion_fiscal: pendingPassengerData.direccion_fiscal,
        descripcion_opcional: pendingPassengerData.descripcion_opcional,
        comprobante_emitido: false,
        comprobante_url: null,
        created_at: new Date().toISOString(),
        viajes: {
          fecha_viaje: viaje.fecha_viaje,
          hora_viaje: viaje.hora_viaje,
          rutas: {
            origen: viaje.rutas.origen,
            destino: viaje.rutas.destino
          }
        }
      };

      const localVentas = JSON.parse(localStorage.getItem('local_pending_ventas') || '[]');
      localVentas.unshift(newVentaRecord);
      localStorage.setItem('local_pending_ventas', JSON.stringify(localVentas));

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
