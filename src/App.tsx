import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Trips from './pages/Trips';
import Booking from './pages/Booking';
import Confirmation from './pages/Confirmation';
import Terms from './pages/Terms';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminTrips from './pages/admin/TripsManager';
import AdminSales from './pages/admin/Sales';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/viajes" element={<Trips />} />
          <Route path="/compra/:viajeId" element={<Booking />} />
          <Route path="/confirmacion/:ventaId" element={<Confirmation />} />
          <Route path="/terminos" element={<Terms />} />
        </Route>
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/viajes" element={<AdminTrips />} />
        <Route path="/admin/ventas" element={<AdminSales />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
