import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaArrowRight, FaCalendarAlt, FaMap } from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import TripCard from '../components/trips/TripCard';
import '../styles/components/Trips.css';

// Interfaz extendida para el join
interface ViajeWithDetails {
  id: string;
  hora_viaje: string;
  precio_base: number;
  vehiculos: {
    nombre_display: string;
    total_asientos_pasajero: number;
  };
  // Nota: En una app real, los asientos libres se calcularían con una consulta más compleja
  // o una vista de Supabase que reste los bloqueados/pagados.
}

export default function Trips() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const origenParam = searchParams.get('origen');
  const destinoParam = searchParams.get('destino');
  const fechaParam = searchParams.get('fecha');

  const [loading, setLoading] = useState(true);
  const [viajes, setViajes] = useState<ViajeWithDetails[]>([]);

  useEffect(() => {
    // Si faltan parámetros, redirigir a inicio
    if (!origenParam || !destinoParam || !fechaParam) {
      navigate('/');
      return;
    }

    const fetchViajes = async () => {
      setLoading(true);
      try {
        // 1. Buscar el ID de la ruta
        const { data: rutaData } = await supabase
          .from('rutas')
          .select('id')
          .eq('origen', origenParam)
          .eq('destino', destinoParam)
          .single();

        if (rutaData) {
          // 2. Buscar viajes para esa ruta y fecha
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

          // Si es hoy, no mostrar viajes de horas pasadas
          const today = new Date();
          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          
          if (fechaParam === todayStr) {
            const currentHour = String(today.getHours()).padStart(2, '0');
            const currentMinute = String(today.getMinutes()).padStart(2, '0');
            query = query.gte('hora_viaje', `${currentHour}:${currentMinute}:00`);
          }

          const { data: viajesData } = await query.order('hora_viaje', { ascending: true });

          if (viajesData && viajesData.length > 0) {
            setViajes(viajesData as unknown as ViajeWithDetails[]);
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
    };

    fetchViajes();
  }, [origenParam, destinoParam, fechaParam, navigate]);



  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr + 'T12:00:00'); // Evitar problemas de timezone
      return new Intl.DateTimeFormat('es-PE', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }).format(date);
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="page-trips fade-in">
      
      {/* Resumen de búsqueda superior */}
      <div className="search-summary-header">
        <div className="container">
          <div className="search-summary-content">
            <div>
              <div className="route-info">
                <span>{origenParam}</span>
                <span className="route-arrow"><FaArrowRight /></span>
                <span>{destinoParam}</span>
              </div>
              <div className="date-info">
                <FaCalendarAlt /> {fechaParam ? formatDate(fechaParam) : ''}
              </div>
            </div>
            
            <button className="btn-change-search" onClick={() => navigate('/')}>
              {t('search.change', 'Cambiar búsqueda')}
            </button>
          </div>
        </div>
      </div>

      <div className="container">
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
                vehiculo_nombre={viaje.vehiculos.nombre_display}
                total_asientos={viaje.vehiculos.total_asientos_pasajero}
                // Mostrar 100% disponibles hasta que se implemente el conteo real
                asientos_libres={viaje.vehiculos.total_asientos_pasajero}
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
