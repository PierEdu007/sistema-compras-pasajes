import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface TimerProps {
  expiresAt: string;
  onExpire: () => void;
}

export default function Timer({ expiresAt, onExpire }: TimerProps) {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const expirationDate = new Date(expiresAt).getTime();
      const now = new Date().getTime();
      const difference = expirationDate - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft(0);
        onExpire();
      } else {
        setTimeLeft(Math.floor(difference / 1000));
      }
    };

    calculateTimeLeft();
    
    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000);
    
    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  if (isExpired) {
    return (
      <div className="timer-box timer-expired">
        <span>⚠️ {t('booking.seatExpired', 'El tiempo de reserva ha expirado. Por favor, selecciona tu asiento nuevamente.')}</span>
      </div>
    );
  }

  // Format MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="timer-box">
      <span>⏱️ {t('booking.timer', 'Tiempo para completar la compra')}:</span>
      <strong style={{ fontSize: '1.25em' }}>{formattedTime}</strong>
    </div>
  );
}
