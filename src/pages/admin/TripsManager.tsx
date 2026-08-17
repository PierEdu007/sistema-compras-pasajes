import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { FaPlus, FaTimes, FaSearch, FaFilter, FaEdit, FaTrashAlt, FaCalendarAlt, FaBus, FaSave, FaSync } from 'react-icons/fa';
import '../../styles/components/admin.css';

// Interface para las filas de viajes
interface ViajeRow {
  id: string;
  ruta_id: string;
  vehiculo_id: string;
  fecha_viaje: string;
  hora_viaje: string;
  precio_base: number;
  estado: string;
  rutas: { id: string; origen: string; destino: string };
  vehiculos: { id: string; nombre_display: string };
}

const AdminTrips: React.FC = () => {
  const [viajes, setViajes] = useState<ViajeRow[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingViaje, setEditingViaje] = useState<ViajeRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Opciones para formularios
  const [rutas, setRutas] = useState<{ id: string; origen: string; destino: string }[]>([]);
  const [vehiculos, setVehiculos] = useState<{ id: string; nombre_display: string }[]>([]);

  // Estados de Filtro
  const [filterRuta, setFilterRuta] = useState('TODAS');
  const [filterFecha, setFilterFecha] = useState('');
  const [filterEstado, setFilterEstado] = useState('TODOS');
  const [searchQuery, setSearchQuery] = useState('');

  // Formulario Crear
  const [createFormData, setCreateFormData] = useState({
    ruta_id: '',
    vehiculo_id: '',
    fecha_viaje: '',
    hora_viaje: '',
    precio_base: '50'
  });

  // Formulario Editar
  const [editFormData, setEditFormData] = useState({
    ruta_id: '',
    vehiculo_id: '',
    fecha_viaje: '',
    hora_viaje: '',
    precio_base: '50',
    estado: 'ACTIVO'
  });

  useEffect(() => {
    cleanupOldTrips().then(() => {
      fetchViajes();
      fetchOptions();
    });
  }, []);

  // Eliminar viajes con más de 2 días de antigüedad (solo viajes, no ventas)
  const cleanupOldTrips = async () => {
    try {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const cutoffDate = twoDaysAgo.toISOString().substring(0, 10);

      const { error } = await supabase
        .from('viajes')
        .delete()
        .lt('fecha_viaje', cutoffDate);

      if (error) {
        console.warn('No se pudieron eliminar viajes antiguos (posible restricción RLS):', error.message);
      }
    } catch (err) {
      console.warn('Error en limpieza de viajes antiguos:', err);
    }
  };

  const fetchViajes = async () => {
    try {
      setLoading(true);
      
      // Obtener fecha de hace 2 días para incluir viajes recientes pasados
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const twoDaysAgoStr = twoDaysAgo.toISOString().substring(0, 10);

      const { data, error } = await supabase
        .from('viajes')
        .select(`
          id,
          ruta_id,
          vehiculo_id,
          fecha_viaje,
          hora_viaje,
          precio_base,
          estado,
          rutas (id, origen, destino),
          vehiculos (id, nombre_display)
        `)
        .gte('fecha_viaje', twoDaysAgoStr)
        .order('fecha_viaje', { ascending: true })
        .order('hora_viaje', { ascending: true })
        .limit(5000);

      if (error) throw error;
      setViajes((data as any) || []);
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
      
      if (rutasRes.data && (rutasRes.data as any[]).length > 0) {
        const rawRutas = rutasRes.data as any[];
        setRutas(rawRutas);
        setCreateFormData(prev => ({ ...prev, ruta_id: rawRutas[0].id }));
      }

      if (vehiculosRes.data && (vehiculosRes.data as any[]).length > 0) {
        const rawList = vehiculosRes.data as any[];
        const v4 = rawList.find(v => v.nombre_display?.includes('4') || v.tipo === 'CAMIONETA_4') || rawList[0];
        const v6 = rawList.find(v => v.nombre_display?.includes('6') || v.tipo === 'CAMIONETA_6') || rawList[1] || rawList[0];

        const cleanList = [
          { id: v4.id, nombre_display: 'Auto (4 Pasajeros)' },
          { id: v6.id, nombre_display: 'Auto (6 Pasajeros)' },
          { id: 'BOTH', nombre_display: '✨ Ambos Vehículos (Crear Auto 4p y Auto 6p)' }
        ];

        setVehiculos(cleanList);
        setCreateFormData(prev => ({ ...prev, vehiculo_id: 'BOTH' }));
      }
    } catch (err) {
      console.error('Error fetching options:', err);
    }
  };

  // --- FILTRADO DINÁMICO DE VIAJES ---
  const filteredViajes = useMemo(() => {
    return viajes.filter(v => {
      // 1. Filtro por búsqueda global (Origen, Destino, Modelo o ID)
      const searchMatch = !searchQuery || 
        `${v.rutas?.origen} ${v.rutas?.destino} ${v.vehiculos?.nombre_display} ${v.id}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      // 2. Filtro por Ruta específica
      const rutaMatch = filterRuta === 'TODAS' || v.ruta_id === filterRuta || 
        `${v.rutas?.origen} - ${v.rutas?.destino}` === filterRuta;

      // 3. Filtro por Fecha (Normalización YYYY-MM-DD)
      const fechaMatch = !filterFecha || (() => {
        if (!v.fecha_viaje) return false;
        const vDateStr = v.fecha_viaje.trim().substring(0, 10);
        const filterDateStr = filterFecha.trim().substring(0, 10);
        return vDateStr === filterDateStr;
      })();

      // 4. Filtro por Estado
      const estadoMatch = filterEstado === 'TODOS' || v.estado === filterEstado;

      return searchMatch && rutaMatch && fechaMatch && estadoMatch;
    });
  }, [viajes, searchQuery, filterRuta, filterFecha, filterEstado]);

  const handleSetToday = () => {
    const today = new Date().toISOString().substring(0, 10);
    setFilterFecha(today);
  };

  const handleSetTomorrow = () => {
    const tom = new Date(Date.now() + 86400000).toISOString().substring(0, 10);
    setFilterFecha(tom);
  };

  // Limpiar Filtros
  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterRuta('TODAS');
    setFilterFecha('');
    setFilterEstado('TODOS');
  };

  // --- CREAR NUEVO VIAJE ---
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const v4 = vehiculos.find(v => v.nombre_display.includes('4') && v.id !== 'BOTH');
      const v6 = vehiculos.find(v => v.nombre_display.includes('6') && v.id !== 'BOTH');

      const inserts: any[] = [];

      if (createFormData.vehiculo_id === 'BOTH') {
        if (v4) {
          inserts.push({
            ruta_id: createFormData.ruta_id,
            vehiculo_id: v4.id,
            fecha_viaje: createFormData.fecha_viaje,
            hora_viaje: createFormData.hora_viaje,
            precio_base: parseFloat(createFormData.precio_base)
          });
        }
        if (v6) {
          inserts.push({
            ruta_id: createFormData.ruta_id,
            vehiculo_id: v6.id,
            fecha_viaje: createFormData.fecha_viaje,
            hora_viaje: createFormData.hora_viaje,
            precio_base: parseFloat(createFormData.precio_base)
          });
        }
      } else {
        inserts.push({
          ruta_id: createFormData.ruta_id,
          vehiculo_id: createFormData.vehiculo_id,
          fecha_viaje: createFormData.fecha_viaje,
          hora_viaje: createFormData.hora_viaje,
          precio_base: parseFloat(createFormData.precio_base)
        });
      }

      const { error } = await (supabase.from('viajes') as any).insert(inserts);
      
      if (error) throw error;
      
      setShowCreateModal(false);
      setCreateFormData(prev => ({ ...prev, fecha_viaje: '', hora_viaje: '', precio_base: '50' }));
      fetchViajes();
      alert(inserts.length > 1 ? '¡Se crearon ambos viajes (Auto 4p y Auto 6p) exitosamente!' : '¡Viaje creado exitosamente!');
    } catch (err) {
      console.error('Error creating viaje:', err);
      alert('Error al crear el viaje. Verifique los datos.');
    }
  };

  // --- ABRIR MODAL EDICIÓN ---
  const handleStartEdit = (v: ViajeRow) => {
    setEditingViaje(v);
    setEditFormData({
      ruta_id: v.ruta_id || (v.rutas?.id || ''),
      vehiculo_id: v.vehiculo_id || (v.vehiculos?.id || ''),
      fecha_viaje: v.fecha_viaje || '',
      hora_viaje: v.hora_viaje ? v.hora_viaje.substring(0, 5) : '',
      precio_base: v.precio_base ? String(v.precio_base) : '50',
      estado: v.estado || 'ACTIVO'
    });
    setShowEditModal(true);
  };

  // --- GUARDAR EDICIÓN DE VIAJE ---
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingViaje) return;

    try {
      const { error } = await (supabase.from('viajes') as any)
        .update({
          ruta_id: editFormData.ruta_id,
          vehiculo_id: editFormData.vehiculo_id,
          fecha_viaje: editFormData.fecha_viaje,
          hora_viaje: editFormData.hora_viaje,
          precio_base: parseFloat(editFormData.precio_base),
          estado: editFormData.estado
        })
        .eq('id', editingViaje.id);

      if (error) throw error;

      setShowEditModal(false);
      setEditingViaje(null);
      fetchViajes();
      alert('¡Viaje actualizado correctamente!');
    } catch (err: any) {
      console.error('Error al editar viaje:', err);
      alert(`Error al actualizar el viaje: ${err.message || 'Verifique la conexión.'}`);
    }
  };

  // --- BORRAR / ELIMINAR VIAJE ---
  const handleDeleteViaje = async (v: ViajeRow) => {
    const confirmMsg = `¿Estás seguro de eliminar el viaje ${v.rutas?.origen || 'Origen'} ➔ ${v.rutas?.destino || 'Destino'} del ${v.fecha_viaje} a las ${v.hora_viaje}?\n\nEsta acción no se puede deshacer.`;
    
    if (!window.confirm(confirmMsg)) return;

    setDeletingId(v.id);
    try {
      // 1. Eliminar bloqueos asociados al viaje
      try {
        await (supabase.from('asientos_bloqueos') as any)
          .delete()
          .eq('viaje_id', v.id);
      } catch (_bErr) {}

      // 2. Eliminar el registro de viajes
      const { error } = await (supabase.from('viajes') as any)
        .delete()
        .eq('id', v.id);

      if (error) {
        // Fallback: si existen ventas asociadas, cambiar el estado a CANCELADO
        console.warn('DELETE falló por restricción FK, marcando como CANCELADO:', error);
        await (supabase.from('viajes') as any)
          .update({ estado: 'CANCELADO' })
          .eq('id', v.id);
        
        alert('El viaje tiene ventas registradas. Se ha cambiado su estado a CANCELADO.');
      } else {
        alert('¡Viaje eliminado exitosamente de la base de datos!');
      }

      fetchViajes();
    } catch (err: any) {
      console.error('Error al eliminar viaje:', err);
      alert('Ocurrió un error al intentar eliminar el viaje.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.6rem', color: '#1e293b' }}>Gestión de Viajes y Frecuencias</h1>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Filtra, administra, edita o crea salidas programadas para la flota
          </p>
        </div>
        
        <button className="admin-btn admin-btn-primary" onClick={() => setShowCreateModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FaPlus /> Crear Nuevo Viaje
        </button>
      </div>

      {/* BARRA DE FILTROS DE BÚSQUEDA */}
      <div className="admin-card" style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#0f4c81', fontWeight: 'bold' }}>
          <FaFilter /> <span>Filtros de Búsqueda y Navegación</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {/* Búsqueda por texto */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>
              Buscar por Origen, Destino o Vehículo:
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="admin-form-control"
                placeholder="Ej. Quillabamba, Cusco..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '32px' }}
              />
              <FaSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>
          </div>

          {/* Filtro por Ruta */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>
              Filtrar por Ruta:
            </label>
            <select
              className="admin-form-control"
              value={filterRuta}
              onChange={(e) => setFilterRuta(e.target.value)}
            >
              <option value="TODAS">Todas las Rutas</option>
              {rutas.map(r => (
                <option key={r.id} value={r.id}>{r.origen} ➔ {r.destino}</option>
              ))}
            </select>
          </div>

          {/* Filtro por Fecha con Botones Rápidos HOY / MAÑANA */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>
                Filtrar por Fecha:
              </label>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  onClick={handleSetToday}
                  style={{
                    padding: '2px 6px',
                    fontSize: '0.7rem',
                    borderRadius: '4px',
                    border: '1px solid #0f4c81',
                    background: filterFecha === new Date().toISOString().substring(0, 10) ? '#0f4c81' : '#f0f9ff',
                    color: filterFecha === new Date().toISOString().substring(0, 10) ? '#fff' : '#0f4c81',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  HOY
                </button>
                <button
                  type="button"
                  onClick={handleSetTomorrow}
                  style={{
                    padding: '2px 6px',
                    fontSize: '0.7rem',
                    borderRadius: '4px',
                    border: '1px solid #742284',
                    background: filterFecha === new Date(Date.now() + 86400000).toISOString().substring(0, 10) ? '#742284' : '#faf5ff',
                    color: filterFecha === new Date(Date.now() + 86400000).toISOString().substring(0, 10) ? '#fff' : '#742284',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  MAÑANA
                </button>
              </div>
            </div>
            <input
              type="date"
              className="admin-form-control"
              value={filterFecha}
              onChange={(e) => setFilterFecha(e.target.value)}
            />
          </div>

          {/* Filtro por Estado */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>
              Estado del Viaje:
            </label>
            <select
              className="admin-form-control"
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
            >
              <option value="TODOS">Todos los Estados</option>
              <option value="ACTIVO">ACTIVO</option>
              <option value="FINALIZADO">FINALIZADO</option>
              <option value="CANCELADO">CANCELADO</option>
            </select>
          </div>
        </div>

        {/* Botón limpiar filtros si hay algún filtro aplicado */}
        {(searchQuery || filterRuta !== 'TODAS' || filterFecha || filterEstado !== 'TODOS') && (
          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}>
              Mostrando {filteredViajes.length} viaje(s) de {viajes.length} en total
            </span>
            <button
              onClick={handleClearFilters}
              style={{
                background: 'none',
                border: 'none',
                color: '#ef4444',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <FaSync /> Limpiar Filtros
            </button>
          </div>
        )}
      </div>

      {/* TABLA DE VIAJES EN UN CONTENEDOR CON SU PROPIA BARRA DE DESPLAZAMIENTO (BOX CONTAINER) */}
      <div 
        className="admin-card" 
        style={{ 
          padding: 0, 
          overflowX: 'auto', 
          maxHeight: '56vh', 
          overflowY: 'auto', 
          border: '1px solid #cbd5e1', 
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
        }}
      >
        <table className="admin-table">
          <thead>
            <tr>
              <th>Ruta</th>
              <th>Vehículo / Flota</th>
              <th>Fecha Viaje</th>
              <th>Hora Salida</th>
              <th>Precio (S/)</th>
              <th>Estado</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>Cargando programación de viajes...</td></tr>
            ) : filteredViajes.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>
                  No se encontraron viajes que coincidan con los filtros aplicados.
                </td>
              </tr>
            ) : (
              filteredViajes.map((v) => {
                const is6Seats = v.vehiculos?.nombre_display?.includes('6') || v.vehiculos?.nombre_display?.includes('Ertiga') || (v.id.charCodeAt(v.id.length - 1) % 2 === 0);

                return (
                  <tr key={v.id}>
                    <td>
                      <strong style={{ color: '#0f4c81' }}>{v.rutas?.origen} ➔ {v.rutas?.destino}</strong>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#334155', fontWeight: 'bold' }}>
                        <FaBus style={{ color: '#742284' }} />
                        {is6Seats ? 'Auto (6 Pasajeros)' : 'Auto (4 Pasajeros)'}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <FaCalendarAlt style={{ color: '#64748b' }} /> {v.fecha_viaje}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: '#0f4c81' }}>{v.hora_viaje ? v.hora_viaje.substring(0, 5) : '-'}</strong>
                    </td>
                    <td>
                      <strong style={{ color: '#10b981' }}>S/ {Number(v.precio_base).toFixed(2)}</strong>
                    </td>
                    <td>
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        backgroundColor: v.estado === 'ACTIVO' ? '#dcfce7' : v.estado === 'CANCELADO' ? '#fee2e2' : '#f1f5f9',
                        color: v.estado === 'ACTIVO' ? '#15803d' : v.estado === 'CANCELADO' ? '#b91c1c' : '#475569'
                      }}>
                        {v.estado}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        {/* Botón Editar */}
                        <button
                          onClick={() => handleStartEdit(v)}
                          title="Editar Viaje"
                          style={{
                            background: '#e0f2fe',
                            color: '#0284c7',
                            border: '1px solid #bae6fd',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: 'bold',
                            fontSize: '0.8rem'
                          }}
                        >
                          <FaEdit /> Editar
                        </button>

                        {/* Botón Borrar */}
                        <button
                          onClick={() => handleDeleteViaje(v)}
                          disabled={deletingId === v.id}
                          title="Eliminar Viaje"
                          style={{
                            background: '#fee2e2',
                            color: '#b91c1c',
                            border: '1px solid #fca5a5',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: 'bold',
                            fontSize: '0.8rem',
                            opacity: deletingId === v.id ? 0.5 : 1
                          }}
                        >
                          <FaTrashAlt /> {deletingId === v.id ? '...' : 'Borrar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: CREAR NUEVO VIAJE */}
      {showCreateModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f4c81' }}>Crear Nuevo Viaje Programado</h2>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }} onClick={() => setShowCreateModal(false)}>
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={handleCreateSubmit}>
              <div className="admin-form-group">
                <label style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Ruta de Salida:</label>
                <select 
                  className="admin-form-control" 
                  value={createFormData.ruta_id}
                  onChange={(e) => setCreateFormData({...createFormData, ruta_id: e.target.value})}
                  required
                >
                  {rutas.map(r => (
                    <option key={r.id} value={r.id}>{r.origen} ➔ {r.destino}</option>
                  ))}
                </select>
              </div>

              <div className="admin-form-group">
                <label style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Tipo de Vehículo / Capacidad:</label>
                <select 
                  className="admin-form-control" 
                  value={createFormData.vehiculo_id}
                  onChange={(e) => setCreateFormData({...createFormData, vehiculo_id: e.target.value})}
                  required
                >
                  {vehiculos.map(v => (
                    <option key={v.id} value={v.id}>{v.nombre_display}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="admin-form-group">
                  <label style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Fecha de Salida:</label>
                  <input 
                    type="date" 
                    className="admin-form-control" 
                    value={createFormData.fecha_viaje}
                    onChange={(e) => setCreateFormData({...createFormData, fecha_viaje: e.target.value})}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Hora de Salida:</label>
                  <input 
                    type="time" 
                    className="admin-form-control" 
                    value={createFormData.hora_viaje}
                    onChange={(e) => setCreateFormData({...createFormData, hora_viaje: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Precio Base por Pasaje (S/):</label>
                <input 
                  type="number" 
                  step="0.50" 
                  className="admin-form-control" 
                  value={createFormData.precio_base}
                  onChange={(e) => setCreateFormData({...createFormData, precio_base: e.target.value})}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="admin-btn" style={{ background: '#eee' }} onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="admin-btn admin-btn-success" style={{ background: '#0f4c81' }}>
                  Guardar Viaje
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR VIAJE EXISTENTE */}
      {showEditModal && editingViaje && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#742284', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaEdit /> Editar Viaje Programado
              </h2>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }} onClick={() => setShowEditModal(false)}>
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit}>
              <div className="admin-form-group">
                <label style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Ruta:</label>
                <select 
                  className="admin-form-control" 
                  value={editFormData.ruta_id}
                  onChange={(e) => setEditFormData({...editFormData, ruta_id: e.target.value})}
                  required
                >
                  {rutas.map(r => (
                    <option key={r.id} value={r.id}>{r.origen} ➔ {r.destino}</option>
                  ))}
                </select>
              </div>

              <div className="admin-form-group">
                <label style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Vehículo / Capacidad:</label>
                <select 
                  className="admin-form-control" 
                  value={editFormData.vehiculo_id}
                  onChange={(e) => setEditFormData({...editFormData, vehiculo_id: e.target.value})}
                  required
                >
                  {vehiculos.map(v => (
                    <option key={v.id} value={v.id}>{v.nombre_display}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="admin-form-group">
                  <label style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Fecha de Salida:</label>
                  <input 
                    type="date" 
                    className="admin-form-control" 
                    value={editFormData.fecha_viaje}
                    onChange={(e) => setEditFormData({...editFormData, fecha_viaje: e.target.value})}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Hora de Salida:</label>
                  <input 
                    type="time" 
                    className="admin-form-control" 
                    value={editFormData.hora_viaje}
                    onChange={(e) => setEditFormData({...editFormData, hora_viaje: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="admin-form-group">
                  <label style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Precio Base (S/):</label>
                  <input 
                    type="number" 
                    step="0.50" 
                    className="admin-form-control" 
                    value={editFormData.precio_base}
                    onChange={(e) => setEditFormData({...editFormData, precio_base: e.target.value})}
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Estado del Viaje:</label>
                  <select 
                    className="admin-form-control" 
                    value={editFormData.estado}
                    onChange={(e) => setEditFormData({...editFormData, estado: e.target.value})}
                    required
                  >
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="FINALIZADO">FINALIZADO</option>
                    <option value="CANCELADO">CANCELADO</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="admin-btn" style={{ background: '#eee' }} onClick={() => setShowEditModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="admin-btn admin-btn-success" style={{ background: '#742284', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FaSave /> Guardar Cambios
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
