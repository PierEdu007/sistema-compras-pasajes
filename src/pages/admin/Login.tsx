import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/components/admin.css';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user && !loading) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        throw signInError;
      }
      
      // onAuthStateChange inside useAuth will handle the redirect
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
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
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
