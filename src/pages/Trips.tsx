import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaArrowRight, FaCalendarAlt, FaMap } from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import TripCard from '../components/trips/TripCard';
import '../styles/components/Trips.css';

interface ViajeCalculado {
  id: string;
  hora_viaje: string;
  precio_base: number;
  vehiculo_nombre: string;
  total_asientos: number;
  asientos_libres: number;
}

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

  const origenParam = searchParams.get('origen');
  const destinoParam = searchParams.get('destino');
  const fechaParam = searchParams.get('fecha');

  const [loading, setLoading] = useState(true);
  const [viajes, setViajes] = useState<ViajeCalculado[]>([]);

  const fetchViajes = useCallback(async () => {
    if (!origenParam || !destinoParam || !fechaParam) {
      navigate('/');
      return;
    }

    setLoading(true);
    try {
      const { data: rutaData } = await supabase
        .from('rutas')
        .select('id')
        .eq('origen', origenParam)
        .eq('destino', destinoParam)
        .single();

      if (rutaData) {
        let query = supabase
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
          .eq('ruta_id', (rutaData as { id: string }).id)
          .eq('fecha_viaje', fechaParam)
          .eq('estado', 'ACTIVO');

        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        if (fechaParam === todayStr) {
          const currentHour = String(today.getHours()).padStart(2, '0');
          const currentMinute = String(today.getMinutes()).padStart(2, '0');
          query = query.gte('hora_viaje', `${currentHour}:${currentMinute}:00`);
        }

        const { data: viajesData } = await query.order('hora_viaje', { ascending: true });

        if (viajesData && viajesData.length > 0) {
          const viajeIds = (viajesData as any[]).map(v => v.id);

          const { data: bloqueosData } = await supabase
            .from('asientos_bloqueos')
            .select('viaje_id, numero_asiento, estado, expira_at')
            .in('viaje_id', viajeIds);

          const now = new Date();

          const listaCalculada: ViajeCalculado[] = (viajesData as any[]).map((v: any) => {
            const rawNombre = v.vehiculos?.nombre_display || '';
            const rawTotal = v.vehiculos?.total_asientos_pasajero || 4;

            const is6Seats = rawNombre.includes('6') || 
                             rawNombre.includes('Ertiga') || 
                             rawTotal === 6 || 
                             (v.id ? v.id.charCodeAt(v.id.length - 1) % 2 === 0 : false);

            const totalAsientos = is6Seats ? 6 : 4;
            const vehiculoNombre = is6Seats ? t('vehicle.van6', 'Van (6 Passengers)') : t('vehicle.van4', 'Van (4 Passengers)');

            const ocupadosCount = (bloqueosData || []).filter((b: any) => {
              if (b.viaje_id !== v.id) return false;
              if (b.estado === 'PAGADO') return true;
              if (b.estado === 'BLOQUEADO') {
                const expDate = new Date(b.expira_at);
                return expDate > now;
              }
              return false;
            }).length;

            const asientosLibres = Math.max(0, totalAsientos - ocupadosCount);

            return {
              id: v.id,
              hora_viaje: v.hora_viaje,
              precio_base: v.precio_base,
              vehiculo_nombre: vehiculoNombre,
              total_asientos: totalAsientos,
              asientos_libres: asientosLibres,
            };
          });

          setViajes(listaCalculada);
        } else {
          setViajes([]);
        }
      } else {
        setViajes([]);
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
      setViajes([]);
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
    <div className="trips-page">
      <div className="container">
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

        {loading ? (
          <div className="text-center py-5">
            <h3 style={{color: 'var(--color-primary)'}}>{t('common.loading', 'Cargando viajes...')}</h3>
          </div>
        ) : viajes.length > 0 ? (
          <div className="trips-list">
            {viajes.map((viaje) => (
              <TripCard 
                key={viaje.id}
                id={viaje.id}
                hora_viaje={viaje.hora_viaje}
                precio_base={viaje.precio_base}
                vehiculo_nombre={viaje.vehiculo_nombre}
                total_asientos={viaje.total_asientos}
                asientos_libres={viaje.asientos_libres}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state slide-up">
            <div className="empty-icon"><FaMap /></div>
            <h3>{t('search.noResults', 'No encontramos viajes para esta fecha')}</h3>
            <p>{t('search.tryAnotherDate', 'Intenta buscar en una fecha diferente o para otra ruta.')}</p>
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              {t('common.back', 'Volver al inicio')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
