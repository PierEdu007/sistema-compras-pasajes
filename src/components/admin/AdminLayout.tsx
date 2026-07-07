import React from 'react';
import { Navigate, Outlet, NavLink } from 'react-router-dom';
import { FaTachometerAlt, FaBus, FaFileInvoiceDollar, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/components/admin.css';

const AdminLayout: React.FC = () => {
  const { user, role, loading, logout } = useAuth();

  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>Cargando panel...</div>;
  }

  if (!user) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          Admin Panel
        </div>
        <nav className="admin-sidebar-nav">
          <NavLink 
            to="/admin/dashboard" 
            end
            className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
          >
            <FaTachometerAlt /> Dashboard
          </NavLink>

          {role === 'ADMIN' && (
            <NavLink 
              to="/admin/viajes" 
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <FaBus /> Viajes
            </NavLink>
          )}

          {role === 'CONTADOR' && (
            <NavLink 
              to="/admin/ventas" 
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <FaFileInvoiceDollar /> Ventas
            </NavLink>
          )}
        </nav>
        <div className="admin-sidebar-footer">
          <button onClick={logout} className="admin-logout-btn">
            <FaSignOutAlt /> Cerrar Sesión
          </button>
        </div>
      </aside>
      
      <main className="admin-main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
