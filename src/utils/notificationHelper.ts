/**
 * Helper para Notificaciones en Tiempo Real (Celular + Laptop) para Administradores
 * INVERSIONES TUNKY CHASKY S.R.L.
 */

// Sonido Sintetizado con Web Audio API (No requiere cargar archivos mp3 externos)
export function playNotificationSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, now + 0.15);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.35); // D6

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.15);
    osc1.stop(now + 0.35);
    osc2.stop(now + 0.5);
  } catch (_e) {
    // Audio no soportado o bloqueado por interacción previa
  }
}

// Solicitar permiso de notificaciones en el navegador / celular
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    alert('Tu navegador no soporta notificaciones de escritorio/móvil.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

// Enviar notificación del sistema (Celular / Laptop)
export function notifyNewSale(venta: {
  nombres: string;
  apellidos: string;
  numero_asiento: number;
  monto_pagado: number;
  metodo_pago?: string;
  nro_operacion?: string;
}) {
  // 1. Sonido de Alerta
  playNotificationSound();

  // 2. Vibración en Celular
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate([200, 100, 200, 100, 300]);
    } catch (_e) {}
  }

  // 3. Notificación Push del Sistema (Pantalla / Barra de estado)
  if ('Notification' in window && Notification.permission === 'granted') {
    const title = '🔔 ¡NUEVA VENTA POR CONFIRMAR!';
    const body = `Pasajero: ${venta.nombres} ${venta.apellidos}\nAsiento: #${venta.numero_asiento} | Monto: S/ ${venta.monto_pagado.toFixed(2)}`;

    try {
      const notification = new Notification(title, {
        body,
        icon: '/logo.png',
        tag: `sale-${Date.now()}`,
        requireInteraction: true
      });

      notification.onclick = () => {
        window.focus();
      };
    } catch (_err) {
      console.warn('Error al lanzar notificación del navegador:', _err);
    }
  }
}
