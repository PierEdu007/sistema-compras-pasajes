import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';

// Carga inmediata de la página principal para máxima velocidad inicial
import Home from './pages/Home';

// Carga diferida (lazy) de páginas públicas secundarias
const Trips = lazy(() => import('./pages/Trips'));
const Booking = lazy(() => import('./pages/Booking'));
const Confirmation = lazy(() => import('./pages/Confirmation'));
const Terms = lazy(() => import('./pages/Terms'));
const ClaimsBook = lazy(() => import('./pages/ClaimsBook'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Carga diferida (lazy) del módulo de administración
const AdminLogin = lazy(() => import('./pages/admin/Login'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminTrips = lazy(() => import('./pages/admin/TripsManager'));
const AdminSales = lazy(() => import('./pages/admin/Sales'));
const AdminAccounting = lazy(() => import('./pages/admin/AccountingReport'));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));

const RouteLoading = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', color: '#00AEEF' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        display: 'inline-block',
        width: '36px',
        height: '36px',
        border: '3px solid rgba(0, 174, 239, 0.2)',
        borderTopColor: '#00AEEF',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <p style={{ marginTop: '12px', fontSize: '0.9rem', color: '#64748b' }}>Cargando...</p>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/viajes" element={<Trips />} />
            <Route path="/compra/:viajeId" element={<Booking />} />
            <Route path="/confirmacion/:ventaId" element={<Confirmation />} />
            <Route path="/terminos" element={<Terms />} />
            <Route path="/libro-de-reclamaciones" element={<ClaimsBook />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="/admin" element={<AdminLogin />} />
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/viajes" element={<AdminTrips />} />
            <Route path="/admin/ventas" element={<AdminSales />} />
            <Route path="/admin/contabilidad" element={<AdminAccounting />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;

