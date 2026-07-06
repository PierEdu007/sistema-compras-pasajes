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
            .eq('ruta_id', (rutaData as { id: string }).id)
            .eq('fecha_viaje', fechaParam)
            .eq('estado', 'ACTIVO')
            .order('hora_viaje', { ascending: true });

          if (viajesData && viajesData.length > 0) {
            setViajes(viajesData as unknown as ViajeWithDetails[]);
          } else {
            // FALLBACK TEMPORAL PARA DEMOSTRACIÓN UI (Si la BD está vacía)
            // Se puede quitar en producción
            loadFallbackData();
          }
        } else {
          loadFallbackData();
        }
      } catch (error) {
        console.error('Error fetching trips:', error);
        loadFallbackData();
      } finally {
        setLoading(false);
      }
    };

    fetchViajes();
  }, [origenParam, destinoParam, fechaParam, navigate]);

  const loadFallbackData = () => {
    // Datos de prueba (Dummy data) para visualizar la interfaz
    setViajes([
      {
        id: 'dummy-1',
        hora_viaje: '08:00:00',
        precio_base: 45.00,
        vehiculos: { nombre_display: 'Renault Master', total_asientos_pasajero: 15 }
      },
      {
        id: 'dummy-2',
        hora_viaje: '12:30:00',
        precio_base: 45.00,
        vehiculos: { nombre_display: 'Suzuki Ertiga', total_asientos_pasajero: 8 }
      },
      {
        id: 'dummy-3',
        hora_viaje: '18:00:00',
        precio_base: 55.00, // Precio de noche / diferente
        vehiculos: { nombre_display: 'Renault Master', total_asientos_pasajero: 15 }
      }
    ]);
  };

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
            {viajes.map((viaje, idx) => (
              <TripCard 
                key={viaje.id}
                id={viaje.id}
                hora_viaje={viaje.hora_viaje}
                precio_base={viaje.precio_base}
                vehiculo_nombre={viaje.vehiculos.nombre_display}
                total_asientos={viaje.vehiculos.total_asientos_pasajero}
                // Simulación de asientos libres basada en el índice para demostración visual
                asientos_libres={idx === 1 ? 0 : idx === 2 ? 2 : viaje.vehiculos.total_asientos_pasajero - 5}
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
