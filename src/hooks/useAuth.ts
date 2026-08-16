import { useEffect, useState, useCallback, useRef } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Rol } from '../types/database';

// Configuration: Session Timeouts
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes of no activity
const MAX_SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours maximum session lifetime

const STORAGE_KEYS = {
  SESSION_START: 'admin_session_start_time',
  LAST_ACTIVITY: 'admin_last_activity_time',
  EXPIRED_MSG: 'admin_session_expired_msg',
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Rol | null>(null);
  const [loading, setLoading] = useState(true);
  const lastThrottleRef = useRef<number>(0);

  const clearSessionStorage = () => {
    localStorage.removeItem(STORAGE_KEYS.SESSION_START);
    localStorage.removeItem(STORAGE_KEYS.LAST_ACTIVITY);
  };

  const updateActivity = useCallback(() => {
    const now = Date.now();
    // Throttle activity updates to at most once every 10 seconds
    if (now - lastThrottleRef.current > 10000) {
      lastThrottleRef.current = now;
      localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, String(now));
    }
  }, []);

  const logout = useCallback(async (reason?: string) => {
    try {
      if (reason) {
        sessionStorage.setItem(STORAGE_KEYS.EXPIRED_MSG, reason);
      }
      clearSessionStorage();
      await supabase.auth.signOut();
      setUser(null);
      setRole(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }, []);

  const checkSessionValidity = useCallback((): boolean => {
    const sessionStart = parseInt(localStorage.getItem(STORAGE_KEYS.SESSION_START) || '0', 10);
    const lastActivity = parseInt(localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY) || '0', 10);
    const now = Date.now();

    if (!sessionStart || !lastActivity) {
      return true; // New or uninitialized session
    }

    // 1. Check inactivity timeout (30 minutes)
    if (now - lastActivity > INACTIVITY_TIMEOUT_MS) {
      logout('Tu sesión se cerró automáticamente tras 30 minutos de inactividad.');
      return false;
    }

    // 2. Check maximum session duration (2 hours)
    if (now - sessionStart > MAX_SESSION_DURATION_MS) {
      logout('Tu sesión ha alcanzado el tiempo límite máximo de seguridad (2 horas). Inicia sesión nuevamente.');
      return false;
    }

    return true;
  }, [logout]);

  const fetchRole = useCallback(async (currentUser: User) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_roles')
        .select('rol')
        .eq('user_id', currentUser.id)
        .maybeSingle(); // maybeSingle() devuelve null si no existe (no lanza 406)
      
      if (error) {
        console.error('Error fetching user role:', error);
        // Fallback: si hay algún error de BD, verificar si es el admin conocido
        if (
          currentUser.email === 'admin@tunky.com' ||
          currentUser.email === 'admin@turismotunkychasky.com.pe' ||
          currentUser.email?.includes('admin')
        ) {
          setRole('ADMIN' as Rol);
        } else {
          setRole(null);
        }
      } else if (data) {
        setRole((data as any).rol as Rol);
      } else {
        // No se encontró fila en user_roles — asignar ADMIN si el email lo indica
        if (
          currentUser.email === 'admin@tunky.com' ||
          currentUser.email === 'admin@turismotunkychasky.com.pe' ||
          currentUser.email?.includes('admin')
        ) {
          setRole('ADMIN' as Rol);
        } else {
          setRole(null);
        }
      }
    } catch (err) {
      console.error('Error in fetchRole:', err);
      setRole(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 1. Initial Session Load
    const initialize = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        const currentUser = session?.user || null;

        if (currentUser) {
          // Verify if session had expired while browser/tab was closed
          const isValid = checkSessionValidity();
          if (isValid) {
            const now = Date.now();
            if (!localStorage.getItem(STORAGE_KEYS.SESSION_START)) {
              localStorage.setItem(STORAGE_KEYS.SESSION_START, String(now));
            }
            localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, String(now));
            setUser(currentUser);
            await fetchRole(currentUser);
          } else {
            setLoading(false);
          }
        } else {
          clearSessionStorage();
          setUser(null);
          setRole(null);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error getting session:', err);
        setLoading(false);
      }
    };

    initialize();

    // 2. Auth State Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user || null;

        if (event === 'SIGNED_IN' && currentUser) {
          const now = Date.now();
          localStorage.setItem(STORAGE_KEYS.SESSION_START, String(now));
          localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, String(now));
          setUser(currentUser);
          await fetchRole(currentUser);
        } else if (event === 'SIGNED_OUT' || !currentUser) {
          clearSessionStorage();
          setUser(null);
          setRole(null);
          setLoading(false);
        } else if (currentUser) {
          setUser(currentUser);
          await fetchRole(currentUser);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [checkSessionValidity, fetchRole]);

  // 3. User Activity Listeners & Background Inactivity Check
  useEffect(() => {
    if (!user) return;

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    const handleUserActivity = () => updateActivity();

    events.forEach((ev) => window.addEventListener(ev, handleUserActivity, { passive: true }));

    // Periodic check every 15 seconds
    const interval = setInterval(() => {
      checkSessionValidity();
    }, 15000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleUserActivity));
      clearInterval(interval);
    };
  }, [user, updateActivity, checkSessionValidity]);

  return { user, role, loading, logout };
}
