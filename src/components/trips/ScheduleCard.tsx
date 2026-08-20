import { useTranslation } from 'react-i18next';
import { FaBus } from 'react-icons/fa';
import auto4pImg from '../../assets/vehicles/auto-4p.png';
import camioneta6pImg from '../../assets/vehicles/camioneta-6p.png';
import type { ScheduleWithVehicles } from './VehicleSelectModal';

interface ScheduleCardProps {
  schedule: ScheduleWithVehicles;
  onSelectSchedule: (schedule: ScheduleWithVehicles) => void;
}

export default function ScheduleCard({ schedule, onSelectSchedule }: ScheduleCardProps) {
  const { t } = useTranslation();

  const formattedTime = schedule.hora_viaje.substring(0, 5);
  const hourNum = parseInt(formattedTime.split(':')[0], 10);
  const meridian = hourNum >= 12 ? 'PM' : 'AM';

  const isFull = schedule.opcion4p.isFull && schedule.opcion6p.isFull;
  const minPrice = Math.min(schedule.opcion4p.precio, schedule.opcion6p.precio);

  return (
    <div className={`trip-card schedule-card fade-in ${isFull ? 'sold-out' : ''}`}>
      {/* Columna de Hora */}
      <div className="trip-time-col">
        <span className="trip-time">{formattedTime}</span>
        <span className="trip-meridian">{meridian}</span>
      </div>

      {/* Columna de Información del Horario */}
      <div className="trip-info-col schedule-info-col">
        <div className="schedule-header-row">
          <h4 className="schedule-title">
            <FaBus style={{ color: '#0f4c81', marginRight: '6px' }} />
            {t('trips.scheduledDeparture', 'Salida Programada')}
          </h4>
          <span className="schedule-units-tag">{t('trips.twoVehiclesAvailable', '2 tipos de vehículo disponibles')}</span>
        </div>

        {/* Mini vistas de los 2 vehículos disponibles */}
        <div className="schedule-vehicles-preview">
          <div className="mini-vehicle-badge">
            <img src={auto4pImg} alt="Auto 4p" className="mini-vehicle-thumb" />
            <div className="mini-vehicle-info">
              <span className="mini-v-name">{t('trips.car4p', 'Auto 4 Pasajeros')}</span>
              <span className={`mini-v-seats ${schedule.opcion4p.isFull ? 'seats-sold' : ''}`}>
                {schedule.opcion4p.isFull ? t('search.soldOut', 'Agotado') : t('trips.seatsCount', '{{count}} asientos', { count: schedule.opcion4p.asientos_libres })}
              </span>
            </div>
          </div>

          <div className="mini-vehicle-divider"></div>

          <div className="mini-vehicle-badge">
            <img src={camioneta6pImg} alt="Auto 6p" className="mini-vehicle-thumb" />
            <div className="mini-vehicle-info">
              <span className="mini-v-name">{t('trips.car6p', 'Auto 6 Pasajeros')}</span>
              <span className={`mini-v-seats ${schedule.opcion6p.isFull ? 'seats-sold' : ''}`}>
                {schedule.opcion6p.isFull ? t('search.soldOut', 'Agotado') : t('trips.seatsCount', '{{count}} asientos', { count: schedule.opcion6p.asientos_libres })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Columna de Precio y Acción */}
      <div className="trip-action-col schedule-action-col">
        <div className="trip-price">
          <span className="currency">S/</span>
          <span className="amount">{minPrice.toFixed(2)}</span>
        </div>
        <button 
          className="btn btn-primary schedule-select-btn"
          onClick={() => onSelectSchedule(schedule)}
          disabled={isFull}
        >
          {isFull ? t('search.soldOut', 'Agotado') : t('search.selectTrip', 'Seleccionar')}
        </button>
      </div>
    </div>
  );
}
