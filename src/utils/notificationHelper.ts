/**
 * Helper para Notificaciones en Tiempo Real (Sonido + Alerta Visual + Push)
 * INVERSIONES TUNKY CHASKY S.R.L.
 */

let globalAudioCtx: AudioContext | null = null;

// Inicializa y desbloquea el AudioContext con cualquier interacción previa del usuario
export function initAudioContext() {
  try {
    if (!globalAudioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        globalAudioCtx = new AudioContextClass();
      }
    }
    if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
      globalAudioCtx.resume();
    }
  } catch (_e) {
    // Ignorar si el navegador aún no permite interacción
  }
}

// Desbloquear audio automáticamente con el primer clic en la ventana
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    initAudioContext();
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };
  window.addEventListener('click', unlockAudio);
  window.addEventListener('keydown', unlockAudio);
}

// Sonido Sintetizado con Web Audio API: Timbre claro y fuerte de caja / campanilla
export function playNotificationSound() {
  try {
    initAudioContext();
    const ctx = globalAudioCtx || new (window.AudioContext || (window as any).webkitAudioContext)();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Secuencia de 3 notas armoniosas (C5 -> E5 -> G5 -> C6)
    const notes = [
      { freq: 523.25, time: 0.00, dur: 0.18 }, // Do5
      { freq: 659.25, time: 0.12, dur: 0.18 }, // Mi5
      { freq: 783.99, time: 0.24, dur: 0.22 }, // Sol5
      { freq: 1046.50, time: 0.38, dur: 0.50 } // Do6 (campanada final)
    ];

    notes.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + time);

      // Envolvente de volumen tipo campanilla (ataque rápido y decaimiento suave)
      gain.gain.setValueAtTime(0.001, now + time);
      gain.gain.exponentialRampToValueAtTime(0.45, now + time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + dur);
    });

    // Segunda repetición suave a los 0.8s para garantizar que el admin lo escuche
    setTimeout(() => {
      try {
        if (!ctx) return;
        const t2 = ctx.currentTime;
        const oscEcho = ctx.createOscillator();
        const gainEcho = ctx.createGain();

        oscEcho.type = 'sine';
        oscEcho.frequency.setValueAtTime(1046.50, t2);
        gainEcho.gain.setValueAtTime(0.25, t2);
        gainEcho.gain.exponentialRampToValueAtTime(0.001, t2 + 0.4);

        oscEcho.connect(gainEcho);
        gainEcho.connect(ctx.destination);

        oscEcho.start(t2);
        oscEcho.stop(t2 + 0.4);
      } catch (_err) {}
    }, 700);

  } catch (err) {
    console.warn('No se pudo reproducir sonido de notificación:', err);
  }
}

// Solicitar permiso de notificaciones del sistema
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    alert('Tu navegador no soporta notificaciones de escritorio/móvil.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (_e) {
    return false;
  }
}

// Enviar notificación Push del Sistema
export function notifyNewSale(venta: {
  nombres: string;
  apellidos: string;
  numero_asiento: number;
  monto_pagado: number;
  metodo_pago?: string;
  nro_operacion?: string;
}) {
  // 1. Sonido
  playNotificationSound();

  // 2. Vibración (en dispositivos móviles)
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate([200, 100, 200, 100, 300]);
    } catch (_e) {}
  }

  // 3. Notificación Push del Sistema (Escritorio / Windows / Android)
  if ('Notification' in window && Notification.permission === 'granted') {
    const title = '🔔 ¡NUEVA VENTA POR CONFIRMAR!';
    const body = `Pasajero: ${venta.nombres} ${venta.apellidos}\nAsiento: #${venta.numero_asiento} | Monto: S/ ${Number(venta.monto_pagado || 0).toFixed(2)}`;

    try {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.png',
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
