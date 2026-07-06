import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/components/admin.css';

const AdminDashboard: React.FC = () => {
  const { user, role } = useAuth();

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>Dashboard</h1>
      
      <div className="admin-card">
        <h3>Bienvenido/a</h3>
        <p>Has ingresado como: <strong>{user?.email}</strong></p>
        <p>Rol en el sistema: <strong>{role || 'SIN ROL DEFINIDO'}</strong></p>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginTop: '30px' }}>
        <div className="admin-card" style={{ flex: 1, textAlign: 'center' }}>
          <h4>Ventas Hoy</h4>
          <h2 style={{ color: '#2ecc71', marginTop: '10px' }}>S/ 0.00</h2>
        </div>
        <div className="admin-card" style={{ flex: 1, textAlign: 'center' }}>
          <h4>Viajes Activos</h4>
          <h2 style={{ color: '#3498db', marginTop: '10px' }}>0</h2>
        </div>
        <div className="admin-card" style={{ flex: 1, textAlign: 'center' }}>
          <h4>Boletos Emitidos</h4>
          <h2 style={{ color: '#e67e22', marginTop: '10px' }}>0</h2>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
