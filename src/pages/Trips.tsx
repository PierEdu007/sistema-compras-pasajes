import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaArrowRight, FaCalendarAlt, FaMap, FaInfoCircle } from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import ScheduleCard from '../components/trips/ScheduleCard';
import VehicleSelectModal from '../components/trips/VehicleSelectModal';
import type { ScheduleWithVehicles } from '../components/trips/VehicleSelectModal';
import '../styles/components/Trips.css';

const headerBannerStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #0f4c81 0%, #742284 100%)',
  color: '#ffffff',
  padding: '24px 28px',
  borderRadius: '16px',
  margin: '20px 0 32px 0',
  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '16px'
};

const routeTitleStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  fontSize: '1.75rem',
  fontWeight: 800,
  fontFamily: 'var(--font-heading)',
  color: '#ffffff',
  letterSpacing: '0.5px'
};

const dateBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  backgroundColor: '#0f172a',
  color: '#facc15',
  padding: '8px 16px',
  borderRadius: '20px',
  fontSize: '1rem',
  fontWeight: 'bold',
  marginTop: '12px',
  textTransform: 'capitalize',
  border: '2px solid #facc15',
  boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
};

const changeBtnStyle: React.CSSProperties = {
  border: '2px solid rgba(255, 255, 255, 0.6)',
  background: 'rgba(255, 255, 255, 0.15)',
  color: '#ffffff',
  padding: '10px 20px',
  borderRadius: '10px',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: '0.95rem',
  transition: 'all 0.2s ease'
};

export default function Trips() {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const origenParam = searchParams.get('origen') || '';
  const destinoParam = searchParams.get('destino') || '';
  const fechaParam = searchParams.get('fecha') || '';

  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<ScheduleWithVehicles[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleWithVehicles | null>(null);

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

  const fetchViajes = useCallback(async () => {
    if (!origenParam || !destinoParam || !fechaParam) {
      navigate('/');
      return;
    }

    setLoading(true);
    try {
      const cleanOrigen = origenParam.trim().toUpperCase();
      const cleanDestino = destinoParam.trim().toUpperCase();
      const cleanFecha = fechaParam.trim().substring(0, 10);

      const { data: rawRutaData } = await supabase
        .from('rutas')
        .select('id, origen, destino')
        .ilike('origen', cleanOrigen)
        .ilike('destino', cleanDestino)
        .eq('activa', true)
        .maybeSingle();

      const rutaData = rawRutaData as { id: string; origen: string; destino: string } | null;

      if (rutaData) {
        const { data: viajesData } = await supabase
          .from('viajes')
          .select(`
            id,
            hora_viaje,
            precio_base,
            vehiculos (
              nombre_display,
              total_asientos_pasajero
            )
          `)
          .eq('ruta_id', rutaData.id)
          .eq('fecha_viaje', cleanFecha)
          .eq('estado', 'ACTIVO')
          .order('hora_viaje', { ascending: true });

        if (viajesData && viajesData.length > 0) {
          const viajeIds = (viajesData as any[]).map(v => v.id);

          const { data: bloqueosData } = await supabase
            .from('asientos_bloqueos')
            .select('viaje_id, numero_asiento, estado, expira_at')
            .in('viaje_id', viajeIds);

          const now = new Date();
          const fechaFormateada = formatDate(cleanFecha);

          // Agrupar por hora de salida para tener 1 tarjeta por horario
          const horasMap = new Map<string, any[]>();
          for (const v of (viajesData as any[])) {
            const h = (v.hora_viaje || '').substring(0, 5);
            if (!horasMap.has(h)) {
              horasMap.set(h, []);
            }
            horasMap.get(h)!.push(v);
          }

          const calculatedSchedules: ScheduleWithVehicles[] = [];

          for (const [_hKey, tripsInHour] of horasMap.entries()) {
            const explicit4 = tripsInHour.find(v => v.vehiculos?.nombre_display?.includes('4') || v.vehiculos?.total_asientos_pasajero === 4);
            const explicit6 = tripsInHour.find(v => v.vehiculos?.nombre_display?.includes('6') || v.vehiculos?.total_asientos_pasajero === 6);
            const baseTrip = tripsInHour[0];

            // 1. Calcular ocupados para 4p (solo si existe salida 4P real)
            let v4Libres = 0;
            let v4Id = '';
            let v4Precio = 50;

            if (explicit4) {
              v4Id = explicit4.id;
              v4Precio = explicit4.precio_base || 50;
              const v4Ocupados = (bloqueosData || []).filter((b: any) => {
                if (b.viaje_id !== explicit4.id) return false;
                if (b.estado === 'PAGADO') return b.numero_asiento >= 2 && b.numero_asiento <= 5;
                if (b.estado === 'BLOQUEADO') {
                  const expDate = new Date(b.expira_at);
                  return expDate > now && b.numero_asiento >= 2 && b.numero_asiento <= 5;
                }
                return false;
              }).length;
              v4Libres = Math.max(0, 4 - v4Ocupados);
            }

            // 2. Calcular ocupados para 6p (solo si existe salida 6P real)
            let v6Libres = 0;
            let v6Id = '';
            let v6Precio = 50;

            if (explicit6) {
              v6Id = explicit6.id;
              v6Precio = explicit6.precio_base || 50;
              const v6Ocupados = (bloqueosData || []).filter((b: any) => {
                if (b.viaje_id !== explicit6.id) return false;
                if (b.estado === 'PAGADO') return b.numero_asiento >= 2 && b.numero_asiento <= 7;
                if (b.estado === 'BLOQUEADO') {
                  const expDate = new Date(b.expira_at);
                  return expDate > now && b.numero_asiento >= 2 && b.numero_asiento <= 7;
                }
                return false;
              }).length;
              v6Libres = Math.max(0, 6 - v6Ocupados);
            } else if (!explicit4 && baseTrip) {
              // Si no tiene nombre explícito, usar baseTrip para el que corresponda
              const totalA = baseTrip.vehiculos?.total_asientos_pasajero || 4;
              if (totalA === 4) {
                v4Id = baseTrip.id;
                v4Precio = baseTrip.precio_base || 50;
                v4Libres = 4;
              } else {
                v6Id = baseTrip.id;
                v6Precio = baseTrip.precio_base || 50;
                v6Libres = 6;
              }
            }

            calculatedSchedules.push({
              hora_viaje: baseTrip.hora_viaje,
              origen: rutaData.origen,
              destino: rutaData.destino,
              fechaFormateada,
              opcion4p: {
                id: v4Id,
                total_asientos: 4,
                asientos_libres: v4Libres,
                precio: v4Precio,
                isFull: !explicit4 || v4Libres === 0
              },
              opcion6p: {
                id: v6Id,
                total_asientos: 6,
                asientos_libres: v6Libres,
                precio: v6Precio,
                isFull: !explicit6 || v6Libres === 0
              }
            });
          }

          // Ordenar por hora cronológica
          calculatedSchedules.sort((a, b) => a.hora_viaje.localeCompare(b.hora_viaje));
          setSchedules(calculatedSchedules);
        } else {
          setSchedules([]);
        }
      } else {
        setSchedules([]);
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, [origenParam, destinoParam, fechaParam, navigate]);

  useEffect(() => {
    fetchViajes();

    const channel = supabase
      .channel('trips-realtime-seats')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'asientos_bloqueos' },
        () => fetchViajes()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchViajes]);

  return (
    <div className="trips-page">
      <div className="container">
        {/* Banner superior de ruta y fecha */}
        <div style={headerBannerStyle}>
          <div>
            <div style={routeTitleStyle}>
              <span>{origenParam}</span>
              <span style={{ color: '#facc15', fontSize: '1.4rem', display: 'flex', alignItems: 'center' }}><FaArrowRight /></span>
              <span>{destinoParam}</span>
            </div>

            <div style={dateBadgeStyle}>
              <FaCalendarAlt style={{ color: '#facc15' }} />
              <span>{fechaParam ? formatDate(fechaParam) : ''}</span>
            </div>
          </div>

          <button 
            onClick={() => navigate('/')}
            style={changeBtnStyle}
          >
            {t('search.change', 'Cambiar búsqueda')}
          </button>
        </div>

        {/* Lista compacta de Horarios (1 sola tarjeta por hora) */}
        {loading ? (
          <div className="text-center py-5">
            <h3 style={{color: 'var(--color-primary)'}}>{t('common.loading', 'Cargando salidas disponibles...')}</h3>
          </div>
        ) : schedules.length > 0 ? (
          <div className="trips-list">
            <div className="schedules-header-info">
              <span className="schedules-count">
                <strong>{schedules.length}</strong> salidas programadas para esta fecha
              </span>
              <span className="schedules-hint" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <FaInfoCircle style={{ color: '#0f4c81' }} /> Elige tu horario y selecciona el tipo de auto en el siguiente paso
              </span>
            </div>

            {schedules.map((schedule) => (
              <ScheduleCard 
                key={schedule.hora_viaje}
                schedule={schedule}
                onSelectSchedule={(sched) => setSelectedSchedule(sched)}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state slide-up">
            <div className="empty-icon"><FaMap /></div>
            <h3>{t('search.noResults', 'No encontramos salidas para esta fecha')}</h3>
            <p>{t('search.tryAnotherDate', 'Intenta buscar en una fecha diferente o para otra ruta.')}</p>
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              {t('common.back', 'Volver al inicio')}
            </button>
          </div>
        )}
      </div>

      {/* Modal interactivo de Selección de Vehículo (Paso 2) */}
      <VehicleSelectModal 
        schedule={selectedSchedule}
        onClose={() => setSelectedSchedule(null)}
      />
    </div>
  );
}
