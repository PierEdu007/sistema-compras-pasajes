import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FaBus } from 'react-icons/fa';
import camioneta6pImg from '../../assets/vehicles/camioneta-6p.png';
import auto4pImg from '../../assets/vehicles/auto-4p.png';

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

  // Seleccionar imagen del vehículo: Camioneta blanca/plateada (6p) o Auto rojo (4p)
  const is6p = total_asientos === 6 || vehiculo_nombre.toLowerCase().includes('6') || vehiculo_nombre.toLowerCase().includes('camioneta');
  const vehicleImage = is6p ? camioneta6pImg : auto4pImg;
  const vehicleAlt = is6p ? 'Camioneta (6 Pasajeros)' : 'Auto (4 Pasajeros)';

  return (
    <div className={`trip-card fade-in ${isFull ? 'sold-out' : ''}`}>
      <div className="trip-time-col">
        <span className="trip-time">{formattedTime}</span>
        <span className="trip-meridian">{parseInt(formattedTime.split(':')[0]) >= 12 ? 'PM' : 'AM'}</span>
      </div>

      <div className="trip-info-col">
        <div className="trip-vehicle-preview">
          <img 
            src={vehicleImage} 
            alt={vehicleAlt} 
            className="trip-vehicle-img"
            loading="lazy"
          />
          <div className="trip-vehicle-details">
            <h4 className="trip-vehicle"><FaBus /> {vehiculo_nombre}</h4>
            <div className="trip-seats-badge">
              {isFull ? (
                <span className="badge badge-danger">{t('search.soldOut', 'Sold Out')}</span>
              ) : (
                <span className={`badge ${isAlmostFull ? 'badge-warning' : 'badge-success'}`}>
                  {t('search.seatsAvailable', { count: asientos_libres, defaultValue: '{{count}} asientos libres' })} 
                  <span className="seat-total"> / {total_asientos}</span>
                </span>
              )}
            </div>
          </div>
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
