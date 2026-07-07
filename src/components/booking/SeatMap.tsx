import { useTranslation } from 'react-i18next';
import { FaCar } from 'react-icons/fa';

export type SeatStatus = 'DISPONIBLE' | 'BLOQUEADO' | 'PAGADO';

export interface Seat {
  n: number;
  pos: string; // 'izq', 'der', 'cen', 'cen-izq', 'cen-der'
}

export interface Row {
  fila: number;
  asientos: Seat[];
  nota?: string;
}

export interface VehicleLayout {
  filas: Row[];
}

interface SeatMapProps {
  layout: VehicleLayout;
  seatStatuses: Record<number, SeatStatus>;
  selectedSeat: number | null;
  onSelectSeat: (seatNumber: number) => void;
  disabled?: boolean;
}

export default function SeatMap({ 
  layout, 
  seatStatuses, 
  selectedSeat, 
  onSelectSeat,
  disabled = false
}: SeatMapProps) {
  const { t } = useTranslation();

  const handleSeatClick = (seatNumber: number, status: SeatStatus) => {
    if (disabled || status === 'PAGADO' || status === 'BLOQUEADO') return;
    onSelectSeat(seatNumber);
  };

  const getSeatClass = (seatNumber: number) => {
    if (seatNumber === 1) return 'seat-occupied';
    if (selectedSeat === seatNumber) return 'seat-selected';
    const status = seatStatuses[seatNumber] || 'DISPONIBLE';
    if (status === 'PAGADO') return 'seat-occupied';
    if (status === 'BLOQUEADO') return 'seat-blocked';
    return 'seat-available';
  };

  return (
    <div className="seat-map-container glass">
      <h3 className="seat-map-title">{t('booking.selectSeat', 'Selecciona tu asiento')}</h3>
      
      <div className="seat-map-legend">
        <div className="legend-item">
          <div className="seat-demo seat-available"></div>
          <span>{t('booking.available', 'Disponible')}</span>
        </div>
        <div className="legend-item">
          <div className="seat-demo seat-occupied"></div>
          <span>{t('booking.occupied', 'Ocupado')}</span>
        </div>
        <div className="legend-item">
          <div className="seat-demo seat-blocked"></div>
          <span>{t('booking.blocked', 'En proceso')}</span>
        </div>
        <div className="legend-item">
          <div className="seat-demo seat-selected"></div>
          <span>{t('booking.yourSelection', 'Tu selección')}</span>
        </div>
      </div>

      <div className="vehicle-layout">
        {/* Driver Section */}
        <div className="driver-section">
          <div className="driver-seat" title="Conductor"><FaCar /></div>
        </div>

        {/* Rows */}
        <div className="rows-container">
          {layout.filas.map((row) => (
            <div key={`row-${row.fila}`} className="seat-row">
              {/* Posibles posiciones: izq, cen-izq, cen, cen-der, der */}
              {/* Para estandarizar el layout, usamos CSS Grid en base al vehículo */}
              {row.asientos.map((seat) => (
                <button
                  key={`seat-${seat.n}`}
                  className={`seat-btn pos-${seat.pos} ${getSeatClass(seat.n)}`}
                  onClick={() => handleSeatClick(seat.n, seatStatuses[seat.n] || 'DISPONIBLE')}
                  disabled={disabled || seat.n === 1 || seatStatuses[seat.n] === 'PAGADO' || seatStatuses[seat.n] === 'BLOQUEADO'}
                  aria-label={`Asiento ${seat.n}`}
                >
                  <span className="seat-number">{seat.n}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
