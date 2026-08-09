import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { FaMoneyBillWave, FaBus, FaFileInvoiceDollar, FaQrcode, FaCheckCircle, FaFilePdf, FaClock } from 'react-icons/fa';
import { generateInvoicePDF } from '../../utils/invoiceGenerator';
import '../../styles/components/admin.css';

interface DashboardVenta {
  id: string;
  viaje_id: string;
  numero_asiento: number;
  tipo_documento: string;
  nro_documento: string;
  nombres: string;
  apellidos: string;
  monto_pagado: number;
  culqi_charge_id?: string;
  metodo_pago?: string;
  nro_operacion?: string;
  comprobante_emitido: boolean;
  comprobante_url: string | null;
  created_at: string;
  viajes?: {
    fecha_viaje: string;
    hora_viaje: string;
    rutas?: { origen: string; destino: string };
  };
}

const AdminDashboard: React.FC = () => {
  const { user, role } = useAuth();

  const [loading, setLoading] = useState(true);
  const [totalVentasHoy, setTotalVentasHoy] = useState(0);
  const [viajesActivosCount, setViajesActivosCount] = useState(0);
  const [boletosEmitidosCount, setBoletosEmitidosCount] = useState(0);
  const [pendientesCount, setPendientesCount] = useState(0);
  const [confirmedVentas, setConfirmedVentas] = useState<DashboardVenta[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Viajes Activos
      const { count: viajesCount } = await supabase
        .from('viajes')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'ACTIVO');

      setViajesActivosCount(viajesCount || 0);

      // 2. Fetch Ventas
      const { data: salesData, error: salesErr } = await supabase
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
          culqi_charge_id,
          comprobante_emitido,
          comprobante_url,
          created_at,
          viajes (
            fecha_viaje,
            hora_viaje,
            rutas (origen, destino)
          )
        `)
        .order('created_at', { ascending: false });

      if (!salesErr && salesData) {
        const rejectedList: string[] = JSON.parse(localStorage.getItem('rejected_ventas') || '[]');
        const allSales = (salesData as unknown as DashboardVenta[]).filter(v => 
          !v.culqi_charge_id?.startsWith('RECHAZADO_') && 
          !rejectedList.includes(v.id)
        );

        // Ventas confirmadas (comprobante_emitido === true)
        const confirmed = allSales.filter(v => v.comprobante_emitido);
        const pending = allSales.filter(v => !v.comprobante_emitido);

        setConfirmedVentas(confirmed);
        setBoletosEmitidosCount(confirmed.length);
        setPendientesCount(pending.length);

        // Sumar monto total acumulado de confirmadas
        const totalSum = confirmed.reduce((acc, current) => acc + (current.monto_pagado || 0), 0);
        setTotalVentasHoy(totalSum);
      }
    } catch (err) {
      console.error('Error cargando métricas del dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPDF = (v: DashboardVenta) => {
    const parts = (v.culqi_charge_id || '').split('|');
    const razonSocial = parts.find(p => p.startsWith('RS:'))?.replace('RS:', '') || '';
    const direccionFiscal = parts.find(p => p.startsWith('DIR:'))?.replace('DIR:', '') || '';
    const descripcionOpcional = parts.find(p => p.startsWith('DESC:'))?.replace('DESC:', '') || '';

    const invoicePdf = generateInvoicePDF({
      ventaId: v.id,
      tipoDocumento: (v.tipo_documento as any) || 'DNI',
      nroDocumento: v.nro_documento,
      nombres: v.nombres,
      apellidos: v.apellidos,
      razonSocial,
      direccionFiscal,
      descripcionOpcional,
      origen: v.viajes?.rutas?.origen || 'Origen',
      destino: v.viajes?.rutas?.destino || 'Destino',
      asiento: v.numero_asiento,
      monto: v.monto_pagado,
      fechaViaje: v.viajes?.fecha_viaje || '',
      horaViaje: v.viajes?.hora_viaje || '',
      metodoPago: v.metodo_pago || 'YAPE'
    });

    const pdfBlob = invoicePdf.output('blob');
    const freshUrl = URL.createObjectURL(pdfBlob);
    window.open(freshUrl, '_blank');
  };

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>Dashboard</h1>

      {/* Tarjeta de Bienvenida */}
      <div className="admin-card" style={{ marginBottom: '20px' }}>
        <h3>Bienvenido/a al Sistema de Ventas</h3>
        <p>Has ingresado como: <strong>{user?.email}</strong></p>
        <p>Rol de usuario: <span className="badge badge-primary" style={{ background: '#742284', color: '#fff', padding: '2px 8px', borderRadius: '8px' }}>{role || 'ADMIN'}</span></p>
      </div>

      {/* Tarjetas de Métricas Estadísticas */}
      <div className="dashboard-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        <div className="admin-card" style={{ textAlign: 'center', borderTop: '4px solid #10b981' }}>
          <div style={{ fontSize: '1.5rem', color: '#10b981', marginBottom: '5px' }}><FaMoneyBillWave /></div>
          <h4 style={{ color: '#64748b', fontSize: '0.85rem' }}>Recaudación Confirmada</h4>
          <h2 style={{ color: '#10b981', marginTop: '5px', fontSize: '1.6rem' }}>S/ {totalVentasHoy.toFixed(2)}</h2>
        </div>

        <div className="admin-card" style={{ textAlign: 'center', borderTop: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '1.5rem', color: '#3b82f6', marginBottom: '5px' }}><FaBus /></div>
          <h4 style={{ color: '#64748b', fontSize: '0.85rem' }}>Viajes Activos</h4>
          <h2 style={{ color: '#3b82f6', marginTop: '5px', fontSize: '1.6rem' }}>{viajesActivosCount}</h2>
        </div>

        <div className="admin-card" style={{ textAlign: 'center', borderTop: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '1.5rem', color: '#f59e0b', marginBottom: '5px' }}><FaFileInvoiceDollar /></div>
          <h4 style={{ color: '#64748b', fontSize: '0.85rem' }}>Boletos Emitidos</h4>
          <h2 style={{ color: '#f59e0b', marginTop: '5px', fontSize: '1.6rem' }}>{boletosEmitidosCount}</h2>
        </div>

        <div className="admin-card" style={{ textAlign: 'center', borderTop: '4px solid #a855f7' }}>
          <div style={{ fontSize: '1.5rem', color: '#a855f7', marginBottom: '5px' }}><FaClock /></div>
          <h4 style={{ color: '#64748b', fontSize: '0.85rem' }}>Por Confirmar (Yape)</h4>
          <h2 style={{ color: '#a855f7', marginTop: '5px', fontSize: '1.6rem' }}>{pendientesCount}</h2>
        </div>
      </div>

      {/* Sección de Ventas Confirmadas */}
      <h2 style={{ fontSize: '1.25rem', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <FaCheckCircle style={{ color: '#10b981' }} /> Ventas Confirmadas
      </h2>

      <div className="admin-card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID Venta</th>
              <th>Viaje / Ruta</th>
              <th>Asiento</th>
              <th>Pasajero</th>
              <th>Documento</th>
              <th>Pago</th>
              <th>Monto</th>
              <th>Comprobante</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center' }}>Cargando ventas confirmadas...</td></tr>
            ) : confirmedVentas.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>No hay ventas confirmadas aún. Confirma los pagos pendientes en el menú de Ventas.</td></tr>
            ) : (
              confirmedVentas.map((v) => {
                const isYape = v.metodo_pago === 'YAPE' || (v.culqi_charge_id && v.culqi_charge_id.startsWith('YAPE-'));
                const opCode = v.nro_operacion || (v.culqi_charge_id && v.culqi_charge_id.startsWith('YAPE-') ? v.culqi_charge_id.split('|')[0].replace('YAPE-', '') : v.culqi_charge_id);
                const isFactura = v.tipo_documento === 'RUC';

                return (
                  <tr key={v.id}>
                    <td style={{ fontSize: '0.85em', color: '#64748b' }}>{v.id.substring(0, 8)}...</td>
                    <td>
                      {v.viajes?.rutas?.origen} ➔ {v.viajes?.rutas?.destino}<br/>
                      <small style={{ color: '#94a3b8' }}>{v.viajes?.fecha_viaje} {v.viajes?.hora_viaje?.substring(0, 5)}</small>
                    </td>
                    <td><span style={{ fontWeight: 'bold', color: '#742284' }}>#{v.numero_asiento}</span></td>
                    <td>{v.nombres} {v.apellidos}</td>
                    <td>
                      <strong>{v.tipo_documento}</strong>: {v.nro_documento}
                      <span style={{ display: 'block', fontSize: '0.75em', color: isFactura ? '#0284c7' : '#16a34a' }}>
                        ({isFactura ? 'Factura' : 'Boleta'})
                      </span>
                    </td>
                    <td>
                      {isYape ? (
                        <span style={{ 
                          background: '#742284', 
                          color: '#00d2b8', 
                          padding: '2px 8px', 
                          borderRadius: '12px', 
                          fontSize: '0.75em',
                          fontWeight: 'bold',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <FaQrcode /> YAPE: {opCode}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.85em', color: '#64748b' }}>Tarjeta</span>
                      )}
                    </td>
                    <td><strong style={{ color: '#10b981' }}>S/ {v.monto_pagado.toFixed(2)}</strong></td>
                    <td>
                      <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem' }}>
                        <FaCheckCircle /> Emitido
                        <button
                          onClick={() => handleOpenPDF(v)}
                          title="Ver Comprobante PDF"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontWeight: 'bold',
                            marginLeft: '6px'
                          }}
                        >
                          <FaFilePdf /> PDF
                        </button>
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
