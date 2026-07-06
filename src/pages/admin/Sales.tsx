import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { FaUpload, FaCheck, FaFilePdf } from 'react-icons/fa';
import '../../styles/components/admin.css';

interface VentaRow {
  id: string;
  viaje_id: string;
  numero_asiento: number;
  tipo_documento: string;
  nro_documento: string;
  nombres: string;
  apellidos: string;
  monto_pagado: number;
  comprobante_emitido: boolean;
  comprobante_url: string | null;
  viajes: {
    fecha_viaje: string;
    hora_viaje: string;
    rutas: { origen: string; destino: string };
  };
}

const AdminSales: React.FC = () => {
  const [ventas, setVentas] = useState<VentaRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVentas();
  }, []);

  const fetchVentas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ventas')
        .select(`
          id,
          viaje_id,
          numero_asiento,
          tipo_documento,
          nro_documento,
          nombres,
          apellidos,
          monto_pagado,
          comprobante_emitido,
          comprobante_url,
          viajes (
            fecha_viaje,
            hora_viaje,
            rutas (origen, destino)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVentas(data as any || []);
    } catch (err) {
      console.error('Error fetching ventas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    // En un sistema real esto abriría un diálogo para subir archivo
    alert('Esta función simula la subida de un comprobante (XML/PDF).');
  };

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>Gestión de Ventas</h1>

      <div className="admin-card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID Venta</th>
              <th>Viaje</th>
              <th>Asiento</th>
              <th>Pasajero</th>
              <th>Documento</th>
              <th>Monto (S/)</th>
              <th>Comprobante</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center' }}>Cargando ventas...</td></tr>
            ) : ventas.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center' }}>No hay ventas registradas</td></tr>
            ) : (
              ventas.map((v) => (
                <tr key={v.id}>
                  <td style={{ fontSize: '0.85em', color: '#666' }}>{v.id.substring(0, 8)}...</td>
                  <td>
                    {v.viajes?.rutas?.origen} - {v.viajes?.rutas?.destino}<br/>
                    <small style={{ color: '#7f8c8d' }}>{v.viajes?.fecha_viaje} {v.viajes?.hora_viaje}</small>
                  </td>
                  <td>#{v.numero_asiento}</td>
                  <td>{v.nombres} {v.apellidos}</td>
                  <td>{v.tipo_documento}: {v.nro_documento}</td>
                  <td>{v.monto_pagado}</td>
                  <td>
                    {v.comprobante_emitido ? (
                      <span style={{ color: '#2ecc71', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <FaCheck /> Emitido
                        {v.comprobante_url && (
                          <a href={v.comprobante_url} target="_blank" rel="noreferrer" title="Ver Comprobante" style={{ marginLeft: '10px', color: '#e74c3c' }}>
                            <FaFilePdf />
                          </a>
                        )}
                      </span>
                    ) : (
                      <button 
                        className="admin-btn admin-btn-primary" 
                        style={{ padding: '4px 8px', fontSize: '0.85em' }}
                        onClick={handleUploadClick}
                      >
                        <FaUpload /> Subir
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminSales;
