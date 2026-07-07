import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Rol } from '../types/database';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Rol | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const initialize = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        const currentUser = session?.user || null;
        setUser(currentUser);
        
        if (currentUser) {
          await fetchRole(currentUser);
        } else {
          setRole(null);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error getting session:', err);
        setLoading(false);
      }
    };

    initialize();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user || null;
        setUser(currentUser);
        
        if (currentUser) {
          await fetchRole(currentUser);
        } else {
          setRole(null);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchRole = async (currentUser: User) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_roles')
        .select('rol')
        .eq('user_id', currentUser.id)
        .single();
      
      if (error) {
        // Fallback for the main admin if no role is defined in the database
        if (currentUser.email === 'admin@tunky.com') {
          setRole('ADMIN' as Rol);
        } else {
          console.error('Error fetching user role:', error);
          setRole(null);
        }
      } else {
        // Casting since we expect data.rol to match the Rol type
        setRole((data as any).rol as Rol);
      }
    } catch (err) {
      console.error('Error in fetchRole:', err);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return { user, role, loading, logout };
}
