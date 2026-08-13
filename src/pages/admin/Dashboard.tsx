import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { 
  FaMoneyBillWave, 
  FaBus, 
  FaFileInvoiceDollar, 
  FaQrcode, 
  FaCheckCircle, 
  FaFilePdf, 
  FaClock, 
  FaUserTag, 
  FaBuilding, 
  FaChartLine, 
  FaChair, 
  FaRoute 
} from 'react-icons/fa';
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

interface FrequentClient {
  nro_documento: string;
  nombres: string;
  apellidos: string;
  tipo_documento: string;
  total_compras: number;
  monto_acumulado: number;
}

interface FrequentCompany {
  ruc: string;
  razon_social: string;
  total_facturas: number;
  monto_acumulado: number;
}

interface PeakDayData {
  dayName: string;
  count: number;
  percentage: number;
}

interface PeakHourData {
  hourLabel: string;
  count: number;
  percentage: number;
}

const AdminDashboard: React.FC = () => {
  const { user, role } = useAuth();

  const [loading, setLoading] = useState(true);
  const [totalVentasHoy, setTotalVentasHoy] = useState(0);
  const [viajesActivosCount, setViajesActivosCount] = useState(0);
  const [boletosEmitidosCount, setBoletosEmitidosCount] = useState(0);
  const [pendientesCount, setPendientesCount] = useState(0);
  const [confirmedVentas, setConfirmedVentas] = useState<DashboardVenta[]>([]);

  // Inteligencia de Negocios
  const [frequentClients, setFrequentClients] = useState<FrequentClient[]>([]);
  const [frequentCompanies, setFrequentCompanies] = useState<FrequentCompany[]>([]);
  const [topSeatNumber, setTopSeatNumber] = useState<string>('-');
  const [topRouteName, setTopRouteName] = useState<string>('-');
  const [avgTicketPrice, setAvgTicketPrice] = useState<number>(0);
  const [peakDays, setPeakDays] = useState<PeakDayData[]>([]);
  const [peakHours, setPeakHours] = useState<PeakHourData[]>([]);

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
      const { data: salesData, error: _salesErr } = await supabase
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

      const localPending: DashboardVenta[] = JSON.parse(localStorage.getItem('local_pending_ventas') || '[]');
      const allData = (salesData as unknown as DashboardVenta[]) || [];

      const merged = [...localPending, ...allData];
      const uniqueMap = new Map<string, DashboardVenta>();
      merged.forEach(item => {
        if (!uniqueMap.has(item.id)) {
          uniqueMap.set(item.id, item);
        }
      });
      const combined = Array.from(uniqueMap.values());

      const rejectedList: string[] = JSON.parse(localStorage.getItem('rejected_ventas') || '[]');
      const validSales = combined.filter(v => 
        !v.culqi_charge_id?.startsWith('RECHAZADO_') && 
        !rejectedList.includes(v.id)
      );

      // Ventas confirmadas vs pendientes
      const confirmed = validSales.filter(v => v.comprobante_emitido);
      const pending = validSales.filter(v => !v.comprobante_emitido);

      setConfirmedVentas(confirmed);
      setBoletosEmitidosCount(confirmed.length);
      setPendientesCount(pending.length);

      // Sumar monto total acumulado de confirmadas
      const totalSum = confirmed.reduce((acc, current) => acc + (current.monto_pagado || 0), 0);
      setTotalVentasHoy(totalSum);

      if (confirmed.length > 0) {
        setAvgTicketPrice(totalSum / confirmed.length);
      }

      // --- CÁLCULO DE CLIENTES MÁS FRECUENTES ---
      const clientMap = new Map<string, FrequentClient>();
      const companyMap = new Map<string, FrequentCompany>();
      const seatCounts: Record<number, number> = {};
      const routeCounts: Record<string, number> = {};

      validSales.forEach(v => {
        // Clientes frecuentes
        const clientKey = `${v.tipo_documento}_${v.nro_documento}`;
        const existingClient = clientMap.get(clientKey);
        if (existingClient) {
          existingClient.total_compras += 1;
          existingClient.monto_acumulado += Number(v.monto_pagado || 0);
        } else {
          clientMap.set(clientKey, {
            nro_documento: v.nro_documento,
            nombres: v.nombres,
            apellidos: v.apellidos,
            tipo_documento: v.tipo_documento,
            total_compras: 1,
            monto_acumulado: Number(v.monto_pagado || 0)
          });
        }

        // Empresas frecuentes (Facturas)
        const parts = (v.culqi_charge_id || '').split('|');
        const razonSocial = parts.find(p => p.startsWith('RS:'))?.replace('RS:', '') || '';
        
        if (v.tipo_documento === 'RUC' || razonSocial) {
          const compKey = v.nro_documento || razonSocial;
          const existingComp = companyMap.get(compKey);
          if (existingComp) {
            existingComp.total_facturas += 1;
            existingComp.monto_acumulado += Number(v.monto_pagado || 0);
          } else {
            companyMap.set(compKey, {
              ruc: v.nro_documento,
              razon_social: razonSocial || `${v.nombres} ${v.apellidos}`,
              total_facturas: 1,
              monto_acumulado: Number(v.monto_pagado || 0)
            });
          }
        }

        // Conteo de asientos preferidos
        if (v.numero_asiento) {
          seatCounts[v.numero_asiento] = (seatCounts[v.numero_asiento] || 0) + 1;
        }

        // Conteo de rutas más vendidas
        const routeName = v.viajes?.rutas ? `${v.viajes.rutas.origen} ➔ ${v.viajes.rutas.destino}` : 'CUSCO ➔ QUILLABAMBA';
        routeCounts[routeName] = (routeCounts[routeName] || 0) + 1;
      });

      // --- CÁLCULO DE DÍAS Y HORARIOS CON MÁS COMPRAS ---
      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const dayCounts: Record<string, number> = {
        'Lunes': 0, 'Martes': 0, 'Miércoles': 0, 'Jueves': 0, 'Viernes': 0, 'Sábado': 0, 'Domingo': 0
      };
      const hourCounts: Record<string, number> = {};

      const totalSalesEvaluated = validSales.length;

      validSales.forEach(v => {
        // Día de la semana (según fecha de creación o fecha de viaje)
        const dateString = v.created_at || (v.viajes?.fecha_viaje ? `${v.viajes.fecha_viaje}T12:00:00` : '');
        const dateObj = new Date(dateString);
        if (!isNaN(dateObj.getTime())) {
          const dayName = dayNames[dateObj.getDay()];
          dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
        }

        // Hora más concurrida de salida/reserva
        let hourLabel = '08:00 AM - 12:00 PM';
        if (v.viajes?.hora_viaje) {
          const hStr = v.viajes.hora_viaje.substring(0, 5);
          const hNum = parseInt(hStr.split(':')[0], 10);
          if (!isNaN(hNum)) {
            if (hNum >= 4 && hNum < 8) hourLabel = '04:00 AM - 08:00 AM (Madrugada / Mañana Temprano)';
            else if (hNum >= 8 && hNum < 12) hourLabel = '08:00 AM - 12:00 PM (Mañana)';
            else if (hNum >= 12 && hNum < 16) hourLabel = '12:00 PM - 04:00 PM (Mediodía / Tarde)';
            else if (hNum >= 16 && hNum < 20) hourLabel = '04:00 PM - 08:00 PM (Tarde / Noche)';
            else hourLabel = '08:00 PM - 04:00 AM (Noche / Madrugada)';
          } else {
            hourLabel = `${hStr} HRS`;
          }
        }
        hourCounts[hourLabel] = (hourCounts[hourLabel] || 0) + 1;
      });

      const sortedDays = Object.entries(dayCounts)
        .map(([dayName, count]) => ({
          dayName,
          count,
          percentage: totalSalesEvaluated > 0 ? Math.round((count / totalSalesEvaluated) * 100) : 0
        }))
        .sort((a, b) => b.count - a.count);
      setPeakDays(sortedDays);

      const sortedHours = Object.entries(hourCounts)
        .map(([hourLabel, count]) => ({
          hourLabel,
          count,
          percentage: totalSalesEvaluated > 0 ? Math.round((count / totalSalesEvaluated) * 100) : 0
        }))
        .sort((a, b) => b.count - a.count);
      setPeakHours(sortedHours);

      // Ordenar Clientes Frecuentes por cantidad de compras
      const sortedClients = Array.from(clientMap.values())
        .sort((a, b) => b.total_compras - a.total_compras)
        .slice(0, 5);
      setFrequentClients(sortedClients);

      // Ordenar Empresas Frecuentes
      const sortedCompanies = Array.from(companyMap.values())
        .sort((a, b) => b.total_facturas - a.total_facturas)
        .slice(0, 5);
      setFrequentCompanies(sortedCompanies);

      // Determinar Asiento más solicitado
      let maxSeat = '-';
      let maxSeatCount = 0;
      Object.entries(seatCounts).forEach(([seat, count]) => {
        if (count > maxSeatCount) {
          maxSeatCount = count;
          maxSeat = `Asiento #${seat} (${seat === '2' ? 'Copiloto' : 'Pasajero'})`;
        }
      });
      setTopSeatNumber(maxSeat);

      // Determinar Ruta más demandada
      let maxRoute = 'CUSCO ➔ QUILLABAMBA';
      let maxRouteCount = 0;
      Object.entries(routeCounts).forEach(([route, count]) => {
        if (count > maxRouteCount) {
          maxRouteCount = count;
          maxRoute = route;
        }
      });
      setTopRouteName(maxRoute);

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
      <h1 style={{ marginBottom: '20px' }}>Dashboard de Administración</h1>

      {/* Tarjeta de Bienvenida */}
      <div className="admin-card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, #0f4c81, #742284)', color: '#fff' }}>
        <h3 style={{ margin: 0, color: '#fff', fontSize: '1.4rem' }}>Inversiones Tunky Chasky S.R.L.</h3>
        <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>Bienvenido, <strong>{user?.email}</strong> | Rol: <span style={{ background: '#facc15', color: '#0f4c81', fontWeight: 'bold', padding: '2px 8px', borderRadius: '8px' }}>{role || 'ADMIN'}</span></p>
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

      {/* SECCIÓN DE INTELIGENCIA DE NEGOCIO Y DATOS IMPORTANTES DE LA EMPRESA */}
      <h2 style={{ fontSize: '1.25rem', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <FaChartLine style={{ color: '#0f4c81' }} /> Indicadores Clave de Empresa
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="admin-card" style={{ borderLeft: '4px solid #0f4c81' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#0f4c81', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FaRoute /> Ruta Más Solicitada
          </h4>
          <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>{topRouteName}</p>
        </div>

        <div className="admin-card" style={{ borderLeft: '4px solid #742284' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#742284', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FaChair /> Asiento Más Preferido
          </h4>
          <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>{topSeatNumber}</p>
        </div>

        <div className="admin-card" style={{ borderLeft: '4px solid #10b981' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FaMoneyBillWave /> Ticket Promedio
          </h4>
          <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
            S/ {avgTicketPrice > 0 ? avgTicketPrice.toFixed(2) : '50.00'} por pasaje
          </p>
        </div>
      </div>

      {/* SECCIÓN DE DÍAS Y HORARIOS CON MÁS VENTAS (ANALYTICS INTELIGENTE) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        
        {/* Días con Más Compras */}
        <div className="admin-card" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', color: '#0f4c81', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaClock /> Días con Mayor Demanda de Pasajes
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {peakDays.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>No hay datos suficientes de ventas aún.</p>
            ) : (
              peakDays.slice(0, 5).map((d, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 'bold', color: '#334155' }}>
                    <span>{idx + 1}. {d.dayName}</span>
                    <span style={{ color: '#0f4c81' }}>{d.count} pasajes ({d.percentage}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.max(d.percentage, 5)}%`,
                      height: '100%',
                      background: idx === 0 ? 'linear-gradient(90deg, #0f4c81, #38bdf8)' : '#94a3b8',
                      borderRadius: '4px',
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Horarios Pico de Viaje y Compra */}
        <div className="admin-card" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', color: '#742284', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaChartLine /> Horarios de Mayor Afluencia (Horas Pico)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {peakHours.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>No hay datos suficientes de horarios aún.</p>
            ) : (
              peakHours.slice(0, 5).map((h, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 'bold', color: '#334155' }}>
                    <span>{idx + 1}. {h.hourLabel}</span>
                    <span style={{ color: '#742284' }}>{h.count} reservas ({h.percentage}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.max(h.percentage, 5)}%`,
                      height: '100%',
                      background: idx === 0 ? 'linear-gradient(90deg, #742284, #c084fc)' : '#cbd5e1',
                      borderRadius: '4px',
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* SECCIÓN DE CLIENTES MÁS FRECUENTES Y EMPRESAS FRECUENTES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        
        {/* Tabla: Clientes Más Frecuentes */}
        <div className="admin-card" style={{ padding: '15px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', color: '#0f4c81', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaUserTag /> Clientes Más Frecuentes (Pasajeros)
          </h3>
          <table className="admin-table" style={{ fontSize: '0.85rem' }}>
            <thead>
              <tr>
                <th>Pasajero</th>
                <th>DNI / Doc</th>
                <th>Viajes</th>
                <th>Invertido</th>
              </tr>
            </thead>
            <tbody>
              {frequentClients.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: '#64748b' }}>No hay registros de clientes aún.</td></tr>
              ) : (
                frequentClients.map((client, idx) => (
                  <tr key={idx}>
                    <td><strong>{client.nombres} {client.apellidos}</strong></td>
                    <td>{client.nro_documento}</td>
                    <td><span className="badge badge-primary" style={{ background: '#0f4c81', color: '#fff', padding: '2px 8px', borderRadius: '10px' }}>{client.total_compras} viajes</span></td>
                    <td><strong style={{ color: '#10b981' }}>S/ {client.monto_acumulado.toFixed(2)}</strong></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Tabla: Empresas Más Frecuentes */}
        <div className="admin-card" style={{ padding: '15px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', color: '#742284', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaBuilding /> Empresas Más Frecuentes (RUC)
          </h3>
          <table className="admin-table" style={{ fontSize: '0.85rem' }}>
            <thead>
              <tr>
                <th>Razón Social / Empresa</th>
                <th>RUC</th>
                <th>Facturas</th>
                <th>Total Facturado</th>
              </tr>
            </thead>
            <tbody>
              {frequentCompanies.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: '#64748b' }}>No hay facturas registradas a empresas aún.</td></tr>
              ) : (
                frequentCompanies.map((comp, idx) => (
                  <tr key={idx}>
                    <td><strong>{comp.razon_social}</strong></td>
                    <td>{comp.ruc || '-'}</td>
                    <td><span className="badge badge-primary" style={{ background: '#742284', color: '#fff', padding: '2px 8px', borderRadius: '10px' }}>{comp.total_facturas} facturas</span></td>
                    <td><strong style={{ color: '#10b981' }}>S/ {comp.monto_acumulado.toFixed(2)}</strong></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Sección de Ventas Confirmadas */}
      <h2 style={{ fontSize: '1.25rem', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <FaCheckCircle style={{ color: '#10b981' }} /> Ventas Confirmadas Recientes
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
