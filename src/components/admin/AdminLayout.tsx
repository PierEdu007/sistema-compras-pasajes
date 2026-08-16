import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, NavLink } from 'react-router-dom';
import { FaTachometerAlt, FaBus, FaFileInvoiceDollar, FaCalculator, FaSignOutAlt, FaBell } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { notifyNewSale } from '../../utils/notificationHelper';
import { AdminSaleNotificationBanner, type SaleNotificationData } from './AdminSaleNotificationBanner';
import '../../styles/components/admin.css';

const AdminLayout: React.FC = () => {
  const { user, role, loading, logout } = useAuth();
  const [activeNotification, setActiveNotification] = useState<SaleNotificationData | null>(null);

  useEffect(() => {
    // Suscripción Global a Nuevas Ventas en Supabase
    const channel = supabase
      .channel('admin-layout-global-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ventas' },
        (payload) => {
          const newVenta = payload.new as any;
          if (newVenta) {
            const saleData: SaleNotificationData = {
              id: newVenta.id,
              nombres: newVenta.nombres || 'Pasajero',
              apellidos: newVenta.apellidos || '',
              numero_asiento: newVenta.numero_asiento || 0,
              monto_pagado: Number(newVenta.monto_pagado || 0),
              nro_operacion: newVenta.nro_operacion,
              culqi_charge_id: newVenta.culqi_charge_id,
              tipo_documento: newVenta.tipo_documento,
              nro_documento: newVenta.nro_documento,
              created_at: newVenta.created_at
            };

            setActiveNotification(saleData);
            notifyNewSale(saleData);

            // Avisar a vistas abiertas (Ventas / Dashboard) que recarguen datos
            window.dispatchEvent(new CustomEvent('new-sale-event', { detail: saleData }));
          }
        }
      )
      .subscribe();

    // Escuchar pruebas de notificación locales
    const handleTestNotification = (e: any) => {
      if (e.detail) {
        setActiveNotification(e.detail);
        notifyNewSale(e.detail);
      }
    };
    window.addEventListener('test-sale-notification', handleTestNotification);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('test-sale-notification', handleTestNotification);
    };
  }, []);

  const handleTestAlert = () => {
    const mockSale: SaleNotificationData = {
      nombres: 'JUAN CARLOS',
      apellidos: 'QUISPE PÉREZ',
      numero_asiento: 4,
      monto_pagado: 50.00,
      nro_operacion: 'YAPE-948214',
      tipo_documento: 'DNI',
      nro_documento: '45892147'
    };
    setActiveNotification(mockSale);
    notifyNewSale(mockSale);
  };

  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>Cargando panel...</div>;
  }

  if (!user) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="admin-layout">
      {/* Banner Flotante Visual de Nueva Venta */}
      <AdminSaleNotificationBanner
        sale={activeNotification}
        onClose={() => setActiveNotification(null)}
      />

      <aside className="admin-sidebar">
        <div className="admin-sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Admin Panel</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={handleTestAlert}
              title="Probar sonido y alerta visual de ventas"
              style={{
                background: 'rgba(245, 158, 11, 0.2)',
                border: '1px solid #f59e0b',
                color: '#f59e0b',
                borderRadius: '6px',
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 700
              }}
            >
              <FaBell /> Probar
            </button>
            <button 
              onClick={() => logout()} 
              title="Cerrar Sesión Rápidamente" 
              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center' }}
            >
              <FaSignOutAlt />
            </button>
          </div>
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

          {(role === 'ADMIN' || role === 'CONTADOR') && (
            <>
              <NavLink 
                to="/admin/ventas" 
                className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
              >
                <FaFileInvoiceDollar /> Ventas
              </NavLink>
              <NavLink 
                to="/admin/contabilidad" 
                className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
              >
                <FaCalculator /> Contabilidad
              </NavLink>
            </>
          )}
        </nav>
        <div className="admin-sidebar-footer">
          <button onClick={() => logout()} className="admin-logout-btn">
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
