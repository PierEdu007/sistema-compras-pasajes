import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaArrowRight, FaCalendarAlt, FaClock, FaCheckSquare, FaLock } from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import SeatMap from '../components/booking/SeatMap';
import type { VehicleLayout, SeatStatus } from '../components/booking/SeatMap';
import PassengerForm from '../components/booking/PassengerForm';
import type { PassengerData } from '../components/booking/PassengerForm';
import Timer from '../components/booking/Timer';
import YapePaymentModal from '../components/booking/YapePaymentModal';
import type { YapePaymentData } from '../components/booking/YapePaymentModal';
import {
  containsDangerousCode,
  sanitizeName,
  sanitizeDocNumber,
  sanitizePhone,
  sanitizeEmail,
  sanitizeCompanyName,
  sanitizeAddress,
  sanitizeNotes,
  sanitizeOperationCode
} from '../utils/security';
import camioneta6pImg from '../assets/vehicles/camioneta-6p.png';
import auto4pImg from '../assets/vehicles/auto-4p.png';
import '../styles/components/Booking.css';

// Interfaz extendida para el viaje
interface ViajeBooking {
  id: string;
  ruta_id?: string;
  vehiculo_id?: string;
  hora_viaje: string;
  precio_base: number;
  fecha_viaje: string;
  vehiculos: {
    id?: string;
    tipo?: string;
    nombre_display: string;
    total_asientos_pasajero?: number;
    layout_json: VehicleLayout;
  };
  rutas: {
    id?: string;
    origen: string;
    destino: string;
  };
}

export default function Booking() {
  const { viajeId } = useParams<{ viajeId: string }>();
  const [searchParams] = useSearchParams();
  const tipoParam = searchParams.get('tipo'); // '4p' o '6p'
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

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
            ruta_id,
            vehiculo_id,
            hora_viaje,
            precio_base,
            fecha_viaje,
            vehiculos (
              id,
              tipo,
              nombre_display,
              total_asientos_pasajero,
              layout_json
            ),
            rutas (
              id,
              origen,
              destino
            )
          `)
          .eq('id', viajeId)
          .single();

        if (error || !data) {
          throw new Error('Viaje no encontrado');
        }

        let rawViaje = data as unknown as ViajeBooking;

        // Determinar si se solicita 4p o 6p
        const wants6p = tipoParam === '6p' ? true :
                        tipoParam === '4p' ? false :
                        (rawViaje.vehiculos?.total_asientos_pasajero === 6 || 
                         rawViaje.vehiculos?.nombre_display?.includes('6') || 
                         rawViaje.vehiculos?.tipo?.includes('6'));

        const currentIs6p = rawViaje.vehiculos?.total_asientos_pasajero === 6 || 
                            rawViaje.vehiculos?.nombre_display?.includes('6') || 
                            rawViaje.vehiculos?.tipo?.includes('6');

        // Si el tipo solicitado difiere del viaje cargado, buscar o crear el viaje hermano dedicado
        if (wants6p !== currentIs6p) {
          const { data: siblingTrips } = await supabase
            .from('viajes')
            .select(`
              id,
              ruta_id,
              vehiculo_id,
              hora_viaje,
              precio_base,
              fecha_viaje,
              vehiculos (
                id,
                tipo,
                nombre_display,
                total_asientos_pasajero,
                layout_json
              ),
              rutas (
                id,
                origen,
                destino
              )
            `)
            .eq('ruta_id', rawViaje.ruta_id || (rawViaje.rutas?.id || ''))
            .eq('fecha_viaje', rawViaje.fecha_viaje)
            .eq('hora_viaje', rawViaje.hora_viaje)
            .eq('estado', 'ACTIVO');

          const foundSibling = (siblingTrips as any[])?.find(st => 
            wants6p 
              ? (st.vehiculos?.total_asientos_pasajero === 6 || st.vehiculos?.nombre_display?.includes('6') || st.vehiculos?.tipo?.includes('6'))
              : (st.vehiculos?.total_asientos_pasajero === 4 || st.vehiculos?.nombre_display?.includes('4') || st.vehiculos?.tipo?.includes('4'))
          );

          if (foundSibling) {
            rawViaje = foundSibling as unknown as ViajeBooking;
          } else {
            // Si no existe el viaje para este vehículo, obtener el ID del vehículo y crearlo
            const { data: vehList } = await supabase
              .from('vehiculos')
              .select('*')
              .eq('activo', true);

            const targetVeh = (vehList as any[])?.find(v => 
              wants6p 
                ? (v.total_asientos_pasajero === 6 || v.tipo?.includes('6') || v.nombre_display?.includes('6'))
                : (v.total_asientos_pasajero === 4 || v.tipo?.includes('4') || v.nombre_display?.includes('4'))
            );

            if (targetVeh) {
              const { data: newTrip } = await (supabase.from('viajes') as any)
                .insert({
                  ruta_id: rawViaje.ruta_id || (rawViaje.rutas?.id || ''),
                  vehiculo_id: targetVeh.id,
                  fecha_viaje: rawViaje.fecha_viaje,
                  hora_viaje: rawViaje.hora_viaje,
                  precio_base: rawViaje.precio_base || 50,
                  estado: 'ACTIVO'
                })
                .select(`
                  id,
                  ruta_id,
                  vehiculo_id,
                  hora_viaje,
                  precio_base,
                  fecha_viaje,
                  vehiculos (
                    id,
                    tipo,
                    nombre_display,
                    total_asientos_pasajero,
                    layout_json
                  ),
                  rutas (
                    id,
                    origen,
                    destino
                  )
                `)
                .single();

              if (newTrip) {
                rawViaje = newTrip as unknown as ViajeBooking;
              }
            }
          }
        }

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
          id: rawViaje.vehiculos?.id,
          tipo: wants6p ? 'CAMIONETA_6' : 'CAMIONETA_4',
          nombre_display: wants6p ? 'Auto (6 Pasajeros)' : 'Auto (4 Pasajeros)',
          total_asientos_pasajero: wants6p ? 6 : 4,
          layout_json: wants6p ? layout6 : layout4
        };

        setViaje(rawViaje);
        fetchSeatStatuses(rawViaje.id);
      } catch (err) {
        console.error('Error fetching trip details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchViajeDetails();
  }, [viajeId, tipoParam, navigate]);

  // Cargar estado de asientos y suscribirse a cambios en tiempo real
  const fetchSeatStatuses = async (vId: string) => {
    try {
      const is6 = tipoParam === '6p' || viaje?.vehiculos?.total_asientos_pasajero === 6;
      const activeVehicleType = is6 ? '6P' : '4P';

      const [{ data: ventasData }, { data: bloqueosData }] = await Promise.all([
        supabase.from('ventas').select('id, numero_asiento, culqi_charge_id').eq('viaje_id', vId),
        supabase.from('asientos_bloqueos').select('numero_asiento, estado, expira_at, sesion_token').eq('viaje_id', vId)
      ]);

      const rejectedList: string[] = JSON.parse(localStorage.getItem('rejected_ventas') || '[]');
      const statuses: Record<number, SeatStatus> = {};

      const bloqueosList = (bloqueosData as any[]) || [];

      // 1. Procesar bloqueos
      if (bloqueosList.length > 0) {
        const now = new Date();
        for (const b of bloqueosList) {
          if (b.sesion_token?.includes('6P') && activeVehicleType === '4P') continue;
          if (b.sesion_token?.includes('4P') && activeVehicleType === '6P') continue;

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

      // 2. Procesar ventas
      if (ventasData) {
        for (const v of (ventasData as any[])) {
          if (!v.culqi_charge_id?.startsWith('RECHAZADO_') && !rejectedList.includes(v.id)) {
            // Aislamiento por tag en culqi_charge_id
            if (v.culqi_charge_id?.includes('TIPO:6P') && activeVehicleType === '4P') continue;
            if (v.culqi_charge_id?.includes('TIPO:4P') && activeVehicleType === '6P') continue;

            // Si el asiento tiene un bloqueo explícito perteneciente al otro vehículo, omitir
            const matchingBloqueo = bloqueosList.find(b => b.numero_asiento === v.numero_asiento);
            if (matchingBloqueo?.sesion_token?.includes('6P') && activeVehicleType === '4P') continue;
            if (matchingBloqueo?.sesion_token?.includes('4P') && activeVehicleType === '6P') continue;

            statuses[v.numero_asiento] = 'PAGADO';
          }
        }
      }

      setSeatStatuses(statuses);
    } catch (err) {
      console.error('Error fetching seat statuses:', err);
    }
  };

  useEffect(() => {
    const activeId = viaje?.id || viajeId;
    if (!activeId) return;

    fetchSeatStatuses(activeId);

    const channel = supabase
      .channel(`viaje-seats-${activeId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'asientos_bloqueos', filter: `viaje_id=eq.${activeId}` },
        () => fetchSeatStatuses(activeId)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ventas', filter: `viaje_id=eq.${activeId}` },
        () => fetchSeatStatuses(activeId)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [viaje?.id, viajeId, tipoParam]);

  const handleSelectSeat = async (seatNumber: number) => {
    const activeId = viaje?.id || viajeId;
    if (seatNumber === 1 || !activeId) return;
    setIsProcessing(true);
    try {
      const is6 = tipoParam === '6p' || viaje?.vehiculos?.total_asientos_pasajero === 6;
      const activeVehicleType = is6 ? '6P' : '4P';

      let rawSessionToken = sessionStorage.getItem('booking_session_token');
      if (!rawSessionToken) {
        rawSessionToken = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        sessionStorage.setItem('booking_session_token', rawSessionToken);
      }
      const sessionToken = `${activeVehicleType}|${rawSessionToken}`;

      // Si ya tenía un asiento seleccionado anteriormente, liberarlo primero en la DB
      if (selectedSeat && selectedSeat !== seatNumber) {
        try {
          await (supabase.from('asientos_bloqueos') as any)
            .delete()
            .eq('viaje_id', activeId)
            .eq('numero_asiento', selectedSeat)
            .eq('sesion_token', sessionToken);
        } catch (_e) {}
      }

      const expiraDate = new Date();
      expiraDate.setMinutes(expiraDate.getMinutes() + 10);
      const expiraIso = expiraDate.toISOString();

      // 1. Ejecutar RPC en Postgres para bloquear el asiento
      const { error } = await (supabase as any).rpc('bloquear_asiento', {
        p_viaje_id: activeId,
        p_numero_asiento: seatNumber,
        p_sesion_token: sessionToken,
        p_minutos: 10
      });

      if (error && error.message?.includes('ASIENTO_NO_DISPONIBLE')) {
        alert(t('booking.alertSeatTaken', 'El asiento #{{seat}} ya ha sido reservado u ocupado por otro usuario.', { seat: seatNumber }));
        fetchSeatStatuses(activeId);
        return;
      }

      // 2. Inserción directa en asientos_bloqueos para visibilidad inmediata
      try {
        await (supabase.from('asientos_bloqueos') as any).upsert({
          viaje_id: activeId,
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
      alert(t('booking.alertSeatError', 'Error al seleccionar el asiento. Por favor intenta de nuevo.'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTimerExpire = async () => {
    const activeId = viaje?.id || viajeId;
    if (activeId && selectedSeat) {
      const is6 = tipoParam === '6p' || viaje?.vehiculos?.total_asientos_pasajero === 6;
      const activeVehicleType = is6 ? '6P' : '4P';
      const rawSessionToken = sessionStorage.getItem('booking_session_token');
      const sessionToken = `${activeVehicleType}|${rawSessionToken}`;
      try {
        await (supabase.from('asientos_bloqueos') as any)
          .delete()
          .eq('viaje_id', activeId)
          .eq('numero_asiento', selectedSeat)
          .eq('sesion_token', sessionToken);
      } catch (_e) {}
    }
    setSelectedSeat(null);
    setBloqueoId(null);
    setExpiresAt(null);
    setIsYapeModalOpen(false);
    alert(t('booking.alertExpired', 'Tu reserva temporal ha expirado. El asiento ha sido liberado.'));
    if (activeId) fetchSeatStatuses(activeId);
  };

  const handlePassengerSubmit = (passengerData: PassengerData) => {
    if (!viaje || selectedSeat === null) return;
    if (
      containsDangerousCode(passengerData.nombres) ||
      containsDangerousCode(passengerData.apellidos) ||
      containsDangerousCode(passengerData.nro_documento) ||
      containsDangerousCode(passengerData.email) ||
      containsDangerousCode(passengerData.telefono)
    ) {
      alert(t('validation.invalidCharacters', 'Se detectaron caracteres especiales o códigos no permitidos por motivos de seguridad.'));
      return;
    }
    setPendingPassengerData(passengerData);
    setIsYapeModalOpen(true);
  };

  const handleYapeConfirm = async (yapeData: YapePaymentData) => {
    if (!viaje || selectedSeat === null || !pendingPassengerData) return;

    setIsProcessing(true);
    try {
      // 1. Sanitizar todos los datos para evitar inyecciones
      const cleanOp = sanitizeOperationCode(yapeData.nro_operacion);
      const cleanTelYape = yapeData.telefono_yape ? sanitizePhone(yapeData.telefono_yape) : '';
      const cleanNombres = sanitizeName(pendingPassengerData.nombres);
      const cleanApellidos = sanitizeName(pendingPassengerData.apellidos);
      const cleanDoc = sanitizeDocNumber(pendingPassengerData.nro_documento, pendingPassengerData.tipo_documento);
      const cleanEmail = sanitizeEmail(pendingPassengerData.email);
      const cleanTelPass = sanitizePhone(pendingPassengerData.telefono);
      const cleanRS = pendingPassengerData.razon_social ? sanitizeCompanyName(pendingPassengerData.razon_social) : '';
      const cleanDir = pendingPassengerData.direccion_fiscal ? sanitizeAddress(pendingPassengerData.direccion_fiscal) : '';
      const cleanDesc = pendingPassengerData.descripcion_opcional ? sanitizeNotes(pendingPassengerData.descripcion_opcional) : '';

      const is6 = tipoParam === '6p' || viaje.vehiculos?.total_asientos_pasajero === 6;
      const activeVehicleType = is6 ? '6P' : '4P';

      const finalTelefono = (cleanTelYape && cleanTelYape.length >= 6)
        ? cleanTelYape
        : (cleanTelPass && cleanTelPass !== ''
            ? cleanTelPass
            : '927670019');

      let chargeId = `YAPE-${cleanOp}|TIPO:${activeVehicleType}`;
      if (cleanRS) {
        chargeId += `|RS:${cleanRS}`;
      }
      if (cleanDir) {
        chargeId += `|DIR:${cleanDir}`;
      }
      if (cleanDesc) {
        chargeId += `|DESC:${cleanDesc}`;
      }

      const fullPayload = {
        viaje_id: viaje.id,
        numero_asiento: selectedSeat,
        tipo_documento: pendingPassengerData.tipo_documento,
        nro_documento: cleanDoc,
        nombres: cleanNombres,
        apellidos: cleanApellidos,
        email: cleanEmail,
        telefono: finalTelefono,
        monto_pagado: viaje.precio_base,
        culqi_charge_id: chargeId,
        metodo_pago: 'YAPE',
        nro_operacion: cleanOp,
        razon_social: cleanRS || null,
        direccion_fiscal: cleanDir || null,
        descripcion_opcional: cleanDesc || null,
        comprobante_emitido: false,
        estado: 'PENDIENTE',
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
            sesion_token: `PAGADO_${activeVehicleType}`
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
      alert(t('booking.alertPaymentError', 'Ocurrió un error al procesar tu solicitud. Intenta nuevamente.'));
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

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr + 'T12:00:00');
      return new Intl.DateTimeFormat(i18n.language === 'en' ? 'en-US' : 'es-PE', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }).format(date);
    } catch (_e) {
      return dateStr;
    }
  };

  return (
    <div className="page-booking fade-in">
      <div className="booking-header">
        <div className="container">
          <h1>{t('booking.title', 'Completa tu Reserva')}</h1>
          <div className="booking-trip-details">
            <span>{viaje.rutas.origen} <FaArrowRight /> {viaje.rutas.destino}</span>
            <span>|</span>
            <span><FaCalendarAlt /> {formatDate(viaje.fecha_viaje)}</span>
            <span>|</span>
            <span><FaClock /> {viaje.hora_viaje.substring(0, 5)}</span>
            <span>|</span>
            <span>{t('booking.directService', 'Servicio Directo')}</span>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="booking-layout">
          {/* Lado Izquierdo: Mapa de Asientos */}
          <div className="booking-sidebar">
            <div style={{ textAlign: 'center', marginBottom: '14px' }}>
              <img 
                src={(viaje.vehiculos.nombre_display.includes('4') || viaje.vehiculos.layout_json?.filas?.reduce((acc: number, f: any) => acc + (f.asientos?.length || 0), 0) === 4) ? auto4pImg : camioneta6pImg} 
                alt={viaje.vehiculos.nombre_display} 
                style={{ maxWidth: '140px', height: 'auto', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' }} 
              />
            </div>
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
                  <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '10px 14px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', marginBottom: '14px' }}>
                    <FaLock style={{ fontSize: '1.1rem', flexShrink: 0, color: '#10b981' }} />
                    <div>
                      <strong>{t('booking.seatLockedExclusively', 'Asiento #{{seat}} bloqueado exclusivamente para ti.', { seat: selectedSeat })}</strong>
                      <div style={{ fontSize: '0.8rem', color: '#047857' }}>{t('booking.seatLockedNote', 'Nadie más puede seleccionarlo mientras completas tu compra.')}</div>
                    </div>
                  </div>

                  <h3 className="step-title">1. {t('booking.timer', 'Tiempo Restante')}</h3>
                  {expiresAt && (
                    <Timer expiresAt={expiresAt} onExpire={handleTimerExpire} />
                  )}
                  
                  <div style={{ backgroundColor: 'var(--color-surface)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    <strong>{t('booking.selectedSeat', 'Asiento Seleccionado')}:</strong> #{selectedSeat} <br/>
                    <strong>{t('booking.totalToPay', 'Total a Pagar')}:</strong> S/ {viaje.precio_base.toFixed(2)}
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
                <h3>{t('booking.noSeatTitle', 'Aún no has seleccionado un asiento')}</h3>
                <p>{t('booking.noSeatDesc', 'Por favor, haz clic en un asiento disponible del mapa de la izquierda para comenzar tu reserva.')}</p>
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
