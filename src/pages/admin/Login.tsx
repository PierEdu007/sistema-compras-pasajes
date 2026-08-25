import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaInfoCircle } from 'react-icons/fa';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/components/admin.css';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [infoMsg] = useState<string | null>(() => {
    const msg = sessionStorage.getItem('admin_session_expired_msg');
    if (msg) {
      sessionStorage.removeItem('admin_session_expired_msg');
      return msg;
    }
    return null;
  });
  const [failedAttempts, setFailedAttempts] = useState<number>(() => {
    return parseInt(sessionStorage.getItem('admin_login_fails') || '0', 10);
  });
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    // El apartado de login administrativo siempre debe ser en modo claro
    const prevTheme = document.documentElement.getAttribute('data-theme') || 'light';
    document.documentElement.setAttribute('data-theme', 'light');
    return () => {
      // Restaurar tema previo al salir si existía
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
      } else if (prevTheme) {
        document.documentElement.setAttribute('data-theme', prevTheme);
      }
    };
  }, []);

  useEffect(() => {
    if (user && !loading) {
      sessionStorage.removeItem('admin_login_fails');
      sessionStorage.removeItem('admin_session_expired_msg');
      if (role === 'EMPLEADO' || role === 'VENDEDOR') {
        navigate('/admin/ventas', { replace: true });
      } else {
        navigate('/admin/dashboard', { replace: true });
      }
    }
  }, [user, role, loading, navigate]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (signInError) {
        throw signInError;
      }
      
      sessionStorage.removeItem('admin_login_fails');
      // onAuthStateChange inside useAuth will handle the redirect
    } catch (err: any) {
      const newFails = failedAttempts + 1;
      setFailedAttempts(newFails);
      sessionStorage.setItem('admin_login_fails', String(newFails));

      if (newFails >= 5) {
        setLockoutSeconds(60);
        setError('Demasiados intentos fallidos. Acceso bloqueado por seguridad durante 60 segundos.');
      } else {
        setError(err.message || 'Credenciales incorrectas');
      }
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>Cargando...</div>;
  }

  return (
    <div className="admin-login-container">
      <div className="admin-login-box">
        <h2 className="admin-login-title">Ingreso Administrativo</h2>
        
        {infoMsg && (
          <div style={{ backgroundColor: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', padding: '10px 14px', borderRadius: '8px', marginBottom: '15px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaInfoCircle /> {infoMsg}
          </div>
        )}
        {error && <div className="admin-error-msg">{error}</div>}
        
        <form onSubmit={handleLogin}>
          <div className="admin-form-group">
            <label>Email</label>
            <input 
              type="email" 
              className="admin-form-control" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="admin-form-group">
            <label>Contraseña</label>
            <input 
              type="password" 
              className="admin-form-control" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            className="admin-btn admin-btn-primary" 
            style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
            disabled={isSubmitting || lockoutSeconds > 0}
          >
            {lockoutSeconds > 0 
              ? `Bloqueado por seguridad (${lockoutSeconds}s)` 
              : (isSubmitting ? 'Ingresando...' : 'Iniciar Sesión')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
