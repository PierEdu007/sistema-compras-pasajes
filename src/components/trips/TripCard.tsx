import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FaBus } from 'react-icons/fa';

interface TripCardProps {
  id: string;
  hora_viaje: string;
  precio_base: number;
  vehiculo_nombre: string;
  asientos_libres: number;
  total_asientos: number;
}

export default function TripCard({ 
  id, 
  hora_viaje, 
  precio_base, 
  vehiculo_nombre, 
  asientos_libres,
  total_asientos
}: TripCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Formatear hora (de '14:30:00' a '14:30')
  const formattedTime = hora_viaje.substring(0, 5);
  
  // Determinar estado de asientos para aplicar clases CSS
  const isFull = asientos_libres === 0;
  const isAlmostFull = asientos_libres > 0 && asientos_libres <= 3;

  return (
    <div className={`trip-card fade-in ${isFull ? 'sold-out' : ''}`}>
      <div className="trip-time-col">
        <span className="trip-time">{formattedTime}</span>
        <span className="trip-meridian">{parseInt(formattedTime.split(':')[0]) >= 12 ? 'PM' : 'AM'}</span>
      </div>

      <div className="trip-info-col">
        <h4 className="trip-vehicle"><FaBus /> {vehiculo_nombre}</h4>
        <div className="trip-seats-badge">
          {isFull ? (
            <span className="badge badge-danger">Agotado</span>
          ) : (
            <span className={`badge ${isAlmostFull ? 'badge-warning' : 'badge-success'}`}>
              {t('search.seatsAvailable', { count: asientos_libres, defaultValue: '{{count}} asientos libres' })} 
              <span className="seat-total"> / {total_asientos}</span>
            </span>
          )}
        </div>
      </div>

      <div className="trip-action-col">
        <div className="trip-price">
          <span className="currency">S/</span>
          <span className="amount">{precio_base.toFixed(2)}</span>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => navigate(`/compra/${id}`)}
          disabled={isFull}
        >
          {t('search.selectTrip', 'Seleccionar')}
        </button>
      </div>
    </div>
  );
}
