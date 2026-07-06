import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { FaPlus, FaTimes } from 'react-icons/fa';
import '../../styles/components/admin.css';

// Tipos básicos para la vista
interface ViajeRow {
  id: string;
  fecha_viaje: string;
  hora_viaje: string;
  precio_base: number;
  estado: string;
  rutas: { origen: string; destino: string };
  vehiculos: { nombre_display: string };
}

const AdminTrips: React.FC = () => {
  const [viajes, setViajes] = useState<ViajeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Para el formulario
  const [rutas, setRutas] = useState<{ id: string; origen: string; destino: string }[]>([]);
  const [vehiculos, setVehiculos] = useState<{ id: string; nombre_display: string }[]>([]);
  
  const [formData, setFormData] = useState({
    ruta_id: '',
    vehiculo_id: '',
    fecha_viaje: '',
    hora_viaje: '',
    precio_base: ''
  });

  useEffect(() => {
    fetchViajes();
    fetchOptions();
  }, []);

  const fetchViajes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('viajes')
        .select(`
          id,
          fecha_viaje,
          hora_viaje,
          precio_base,
          estado,
          rutas (origen, destino),
          vehiculos (nombre_display)
        `)
        .order('fecha_viaje', { ascending: false });

      if (error) throw error;
      setViajes(data as any || []);
    } catch (err) {
      console.error('Error fetching viajes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [rutasRes, vehiculosRes] = await Promise.all([
        supabase.from('rutas').select('id, origen, destino').eq('activa', true),
        supabase.from('vehiculos').select('id, nombre_display').eq('activo', true)
      ]);
      
      if (rutasRes.data) setRutas(rutasRes.data as any[]);
      if (vehiculosRes.data) setVehiculos(vehiculosRes.data as any[]);
      
      if (rutasRes.data && (rutasRes.data as any[]).length > 0) {
        setFormData(prev => ({ ...prev, ruta_id: (rutasRes.data as any[])[0].id }));
      }
      if (vehiculosRes.data && (vehiculosRes.data as any[]).length > 0) {
        setFormData(prev => ({ ...prev, vehiculo_id: (vehiculosRes.data as any[])[0].id }));
      }
    } catch (err) {
      console.error('Error fetching options:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('viajes').insert([
        {
          ruta_id: formData.ruta_id,
          vehiculo_id: formData.vehiculo_id,
          fecha_viaje: formData.fecha_viaje,
          hora_viaje: formData.hora_viaje,
          precio_base: parseFloat(formData.precio_base)
        } as any
      ] as any);
      
      if (error) throw error;
      
      setShowModal(false);
      setFormData({ ...formData, fecha_viaje: '', hora_viaje: '', precio_base: '' });
      fetchViajes();
    } catch (err) {
      console.error('Error creating viaje:', err);
      alert('Error al crear el viaje. Verifique los datos.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Gestión de Viajes</h1>
        <button className="admin-btn admin-btn-primary" onClick={() => setShowModal(true)}>
          <FaPlus /> Crear Viaje
        </button>
      </div>

      <div className="admin-card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Ruta</th>
              <th>Vehículo</th>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Precio (S/)</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center' }}>Cargando viajes...</td></tr>
            ) : viajes.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center' }}>No hay viajes registrados</td></tr>
            ) : (
              viajes.map((v) => (
                <tr key={v.id}>
                  <td>{v.rutas?.origen} - {v.rutas?.destino}</td>
                  <td>{v.vehiculos?.nombre_display}</td>
                  <td>{v.fecha_viaje}</td>
                  <td>{v.hora_viaje}</td>
                  <td>{v.precio_base}</td>
                  <td>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                      backgroundColor: v.estado === 'ACTIVO' ? '#d4edda' : v.estado === 'CANCELADO' ? '#f8d7da' : '#e2e3e5',
                      color: v.estado === 'ACTIVO' ? '#155724' : v.estado === 'CANCELADO' ? '#721c24' : '#383d41'
                    }}>
                      {v.estado}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Crear Nuevo Viaje</h2>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }} onClick={() => setShowModal(false)}>
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="admin-form-group">
                <label>Ruta</label>
                <select 
                  className="admin-form-control" 
                  value={formData.ruta_id}
                  onChange={(e) => setFormData({...formData, ruta_id: e.target.value})}
                  required
                >
                  {rutas.map(r => (
                    <option key={r.id} value={r.id}>{r.origen} - {r.destino}</option>
                  ))}
                </select>
              </div>

              <div className="admin-form-group">
                <label>Vehículo</label>
                <select 
                  className="admin-form-control" 
                  value={formData.vehiculo_id}
                  onChange={(e) => setFormData({...formData, vehiculo_id: e.target.value})}
                  required
                >
                  {vehiculos.map(v => (
                    <option key={v.id} value={v.id}>{v.nombre_display}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <div className="admin-form-group" style={{ flex: 1 }}>
                  <label>Fecha</label>
                  <input 
                    type="date" 
                    className="admin-form-control" 
                    value={formData.fecha_viaje}
                    onChange={(e) => setFormData({...formData, fecha_viaje: e.target.value})}
                    required
                  />
                </div>
                <div className="admin-form-group" style={{ flex: 1 }}>
                  <label>Hora</label>
                  <input 
                    type="time" 
                    className="admin-form-control" 
                    value={formData.hora_viaje}
                    onChange={(e) => setFormData({...formData, hora_viaje: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label>Precio Base (S/)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  className="admin-form-control" 
                  value={formData.precio_base}
                  onChange={(e) => setFormData({...formData, precio_base: e.target.value})}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="admin-btn" style={{ background: '#eee' }} onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="admin-btn admin-btn-success">
                  Guardar Viaje
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTrips;
