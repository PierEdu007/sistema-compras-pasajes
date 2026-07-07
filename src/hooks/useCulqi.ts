import { useEffect, useCallback, useRef } from 'react';

// Declaration for global Culqi object
declare global {
  interface Window {
    Culqi: any;
    culqi: () => void;
  }
}

interface CulqiOptions {
  title: string;
  currency: string;
  amount: number;
}

export function useCulqi(publicKey: string) {
  const tokenPromiseRef = useRef<{ resolve: (token: string) => void; reject: (err: any) => void } | null>(null);

  useEffect(() => {
    // Initialize Culqi
    if (window.Culqi) {
      window.Culqi.publicKey = publicKey;
    } else {
      console.error('Culqi library is not loaded in the window object.');
    }

    // Register global callback
    window.culqi = () => {
      if (window.Culqi.token) {
        const token = window.Culqi.token.id;
        if (tokenPromiseRef.current) {
          tokenPromiseRef.current.resolve(token);
        }
      } else if (window.Culqi.error) {
        if (tokenPromiseRef.current) {
          tokenPromiseRef.current.reject(window.Culqi.error);
        }
      }
      
      // Cleanup token so subsequent payments don't reuse it
      window.Culqi.token = null;
      window.Culqi.error = null;
      tokenPromiseRef.current = null;
    };
    
    return () => {
      // Prevent memory leaks
      tokenPromiseRef.current = null;
    };
  }, [publicKey]);

  const openCulqi = useCallback(async (options: CulqiOptions): Promise<string> => {
    if (!window.Culqi) {
      throw new Error('Culqi NO está cargado.');
    }

    window.Culqi.settings({
      title: options.title,
      currency: options.currency,
      amount: Math.round(options.amount * 100), // Convert to cents
    });

    window.Culqi.options({
      lang: 'es',
      modal: true,
      installments: false,
      style: {
        logo: 'https://cdn.iconscout.com/icon/free/png-256/bus-front-1-456073.png',
        theme: '#2D6A4F'
      }
    });

    window.Culqi.open();

    return new Promise<string>((resolve, reject) => {
      tokenPromiseRef.current = { resolve, reject };
    });
  }, []);

  return { openCulqi };
}
