import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FaTimes, FaCheckCircle, FaClock, FaArrowRight, FaCar, FaUsers } from 'react-icons/fa';
import auto4pImg from '../../assets/vehicles/auto-4p.png';
import camioneta6pImg from '../../assets/vehicles/camioneta-6p.png';

export interface VehicleOptionData {
  id: string;
  total_asientos: number;
  asientos_libres: number;
  precio: number;
  isFull: boolean;
}

export interface ScheduleWithVehicles {
  hora_viaje: string;
  origen: string;
  destino: string;
  fechaFormateada: string;
  opcion4p: VehicleOptionData;
  opcion6p: VehicleOptionData;
}

interface VehicleSelectModalProps {
  schedule: ScheduleWithVehicles | null;
  onClose: () => void;
}

export default function VehicleSelectModal({ schedule, onClose }: VehicleSelectModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!schedule) return null;

  const formattedTime = schedule.hora_viaje.substring(0, 5);
  const hourNum = parseInt(formattedTime.split(':')[0], 10);
  const meridian = hourNum >= 12 ? 'PM' : 'AM';

  const handleSelectVehicle = (optionId: string, tipo: '4p' | '6p', isFull: boolean) => {
    if (isFull) return;
    const url = optionId.includes('?') ? `/compra/${optionId}` : `/compra/${optionId}?tipo=${tipo}`;
    navigate(url);
  };

  return (
    <div 
      className="modal-overlay vehicle-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="vehicle-modal-content fade-in slide-up">
        {/* Header del Modal */}
        <div className="vehicle-modal-header">
          <div>
            <div className="vehicle-modal-badge">
              <FaClock /> {formattedTime} {meridian} · {schedule.origen} <FaArrowRight style={{ fontSize: '0.8rem' }} /> {schedule.destino}
            </div>
            <h3 className="vehicle-modal-title">
              {t('booking.chooseVehicle', 'Elige tu tipo de vehículo')}
            </h3>
            <p className="vehicle-modal-subtitle">
              {schedule.fechaFormateada} — Selecciona la unidad en la que deseas viajar:
            </p>
          </div>

          <button 
            className="vehicle-modal-close" 
            onClick={onClose} 
            aria-label="Cerrar"
            title="Cerrar"
          >
            <FaTimes />
          </button>
        </div>

        {/* Opciones de Vehículo */}
        <div className="vehicle-options-grid">
          {/* Tarjeta Auto 4 Pasajeros */}
          <div className={`vehicle-option-card ${schedule.opcion4p.isFull ? 'sold-out' : ''}`}>
            <div className="vehicle-option-badge badge-4p">
              <FaCar style={{ marginRight: '5px' }} /> {t('trips.passengers4', '4 Pasajeros')}
            </div>
            <div className="vehicle-option-img-wrap">
              <img 
                src={auto4pImg} 
                alt={t('vehicle.van4', 'Auto (4 Pasajeros)')} 
                className="vehicle-option-img" 
              />
            </div>
            <div className="vehicle-option-info">
              <h4>{t('vehicle.van4', 'Auto (4 Pasajeros)')}</h4>
              <p className="vehicle-option-desc">
                {t('trips.desc4p', 'Auto compacto y rápido. 1 copiloto + fila trasera de 3 asientos.')}
              </p>
              
              <div className="vehicle-option-seats">
                {schedule.opcion4p.isFull ? (
                  <span className="badge badge-danger">{t('search.soldOut', 'Agotado')}</span>
                ) : (
                  <span className={`badge ${schedule.opcion4p.asientos_libres <= 2 ? 'badge-warning' : 'badge-success'}`}>
                    <FaCheckCircle style={{ marginRight: '4px' }} />
                    {t('trips.seatsAvailableOf', '{{count}} asientos disponibles / {{total}}', { count: schedule.opcion4p.asientos_libres, total: 4 })}
                  </span>
                )}
              </div>

              <div className="vehicle-option-footer">
                <div className="vehicle-option-price">
                  <span className="cur">S/</span>
                  <span className="num">{schedule.opcion4p.precio.toFixed(2)}</span>
                </div>
                <button
                  className="btn btn-primary vehicle-select-btn"
                  onClick={() => handleSelectVehicle(schedule.opcion4p.id, '4p', schedule.opcion4p.isFull)}
                  disabled={schedule.opcion4p.isFull}
                >
                  {schedule.opcion4p.isFull ? t('search.soldOut', 'Agotado') : t('trips.choose4p', 'Elegir Auto 4p')}
                </button>
              </div>
            </div>
          </div>

          {/* Tarjeta Auto 6 Pasajeros */}
          <div className={`vehicle-option-card ${schedule.opcion6p.isFull ? 'sold-out' : ''}`}>
            <div className="vehicle-option-badge badge-6p">
              <FaUsers style={{ marginRight: '5px' }} /> {t('trips.passengers6', '6 Pasajeros')}
            </div>
            <div className="vehicle-option-img-wrap">
              <img 
                src={camioneta6pImg} 
                alt={t('vehicle.van6', 'Auto (6 Pasajeros)')} 
                className="vehicle-option-img" 
              />
            </div>
            <div className="vehicle-option-info">
              <h4>{t('vehicle.van6', 'Auto (6 Pasajeros)')}</h4>
              <p className="vehicle-option-desc">
                {t('trips.desc6p', 'Minivan amplia y confortable. 3 filas de asientos con mayor espacio.')}
              </p>
              
              <div className="vehicle-option-seats">
                {schedule.opcion6p.isFull ? (
                  <span className="badge badge-danger">{t('search.soldOut', 'Agotado')}</span>
                ) : (
                  <span className={`badge ${schedule.opcion6p.asientos_libres <= 2 ? 'badge-warning' : 'badge-success'}`}>
                    <FaCheckCircle style={{ marginRight: '4px' }} />
                    {t('trips.seatsAvailableOf', '{{count}} asientos disponibles / {{total}}', { count: schedule.opcion6p.asientos_libres, total: 6 })}
                  </span>
                )}
              </div>

              <div className="vehicle-option-footer">
                <div className="vehicle-option-price">
                  <span className="cur">S/</span>
                  <span className="num">{schedule.opcion6p.precio.toFixed(2)}</span>
                </div>
                <button
                  className="btn btn-primary vehicle-select-btn btn-6p"
                  onClick={() => handleSelectVehicle(schedule.opcion6p.id, '6p', schedule.opcion6p.isFull)}
                  disabled={schedule.opcion6p.isFull}
                >
                  {schedule.opcion6p.isFull ? t('search.soldOut', 'Agotado') : t('trips.choose6p', 'Elegir Auto 6p')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer del Modal */}
        <div className="vehicle-modal-actions">
          <button className="btn btn-text" onClick={onClose} style={{ color: '#64748b' }}>
            {t('trips.backToSchedules', '← Volver a la lista de horarios')}
          </button>
        </div>
      </div>
    </div>
  );
}
