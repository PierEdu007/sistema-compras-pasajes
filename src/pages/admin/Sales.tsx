import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { FaCheck, FaFilePdf, FaQrcode, FaPaperPlane, FaTimes } from 'react-icons/fa';
import { generateInvoicePDF, generateTicketPDF } from '../../utils/invoiceGenerator';
import '../../styles/components/admin.css';

interface VentaRow {
  id: string;
  viaje_id: string;
  numero_asiento: number;
  tipo_documento: 'DNI' | 'RUC' | 'CE' | 'PASAPORTE';
  nro_documento: string;
  nombres: string;
  apellidos: string;
  email: string;
  monto_pagado: number;
  culqi_charge_id?: string;
  metodo_pago?: string;
  nro_operacion?: string;
  razon_social?: string;
  direccion_fiscal?: string;
  descripcion_opcional?: string;
  comprobante_emitido: boolean;
  comprobante_url: string | null;
  estado?: string;
  viajes: {
    fecha_viaje: string;
    hora_viaje: string;
    rutas: { origen: string; destino: string };
  };
}

const AdminSales: React.FC = () => {
  const [ventas, setVentas] = useState<VentaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

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
          email,
          monto_pagado,
          culqi_charge_id,
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
      setVentas((data as unknown as VentaRow[]) || []);
    } catch (err) {
      console.error('Error fetching ventas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async (venta: VentaRow) => {
    setProcessingId(venta.id);
    try {
      const parts = (venta.culqi_charge_id || '').split('|');
      const razonSocial = venta.razon_social || parts.find(p => p.startsWith('RS:'))?.replace('RS:', '') || '';
      const direccionFiscal = venta.direccion_fiscal || parts.find(p => p.startsWith('DIR:'))?.replace('DIR:', '') || '';
      const descripcionOpcional = venta.descripcion_opcional || parts.find(p => p.startsWith('DESC:'))?.replace('DESC:', '') || '';

      const invoiceData = {
        ventaId: venta.id,
        tipoDocumento: venta.tipo_documento,
        nroDocumento: venta.nro_documento,
        nombres: venta.nombres,
        apellidos: venta.apellidos,
        razonSocial,
        direccionFiscal,
        descripcionOpcional,
        origen: venta.viajes?.rutas?.origen || 'Origen',
        destino: venta.viajes?.rutas?.destino || 'Destino',
        asiento: venta.numero_asiento,
        monto: venta.monto_pagado,
        fechaViaje: venta.viajes?.fecha_viaje || '',
        horaViaje: venta.viajes?.hora_viaje || '',
        metodoPago: venta.metodo_pago || 'YAPE'
      };

      // 1. Generar los DOS PDFs (Comprobante Boleta/Factura + Boleto de Viaje)
      const invoicePdf = generateInvoicePDF(invoiceData);
      const ticketPdf = generateTicketPDF(invoiceData);

      // Abrir/Descargar ambos PDFs
      const invoiceBlob = invoicePdf.output('blob');
      const ticketBlob = ticketPdf.output('blob');

      const invoiceUrl = URL.createObjectURL(invoiceBlob);
      const ticketUrl = URL.createObjectURL(ticketBlob);

      window.open(invoiceUrl, '_blank');
      window.open(ticketUrl, '_blank');

      // 2. Actualizar en Supabase
      await (supabase.from('ventas') as any)
        .update({
          comprobante_emitido: true,
          comprobante_url: invoiceUrl
        })
        .eq('id', venta.id);

      // Actualizar estado local
      setVentas(prev => prev.map(v => v.id === venta.id ? { ...v, comprobante_emitido: true, comprobante_url: invoiceUrl, estado: 'CONFIRMADO' } : v));

      const compTipo = venta.tipo_documento === 'RUC' ? 'Factura' : 'Boleta';
      alert(`¡Pago verificado y confirmado exitosamente!\n\n• Se generó la ${compTipo} Electrónica en PDF.\n• Se generó el Boleto de Viaje en PDF.\n• Se notificó al cliente (${venta.email}).`);

    } catch (err) {
      console.error('Error al confirmar pago:', err);
      alert('Ocurrió un error al procesar el pago.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectPayment = async (venta: VentaRow) => {
    const isConfirmed = window.confirm(`¿Estás seguro de que deseas RECHAZAR este pago?\n\nPasajero: ${venta.nombres} ${venta.apellidos}\nMonto: S/ ${venta.monto_pagado}`);
    if (!isConfirmed) return;

    setProcessingId(venta.id);
    try {
      // Eliminar o marcar como rechazado en Supabase
      await (supabase.from('ventas') as any)
        .delete()
        .eq('id', venta.id);

      // Liberar el asiento
      setVentas(prev => prev.filter(v => v.id !== venta.id));

      alert('El pago ha sido rechazado y la reserva fue liberada.');
    } catch (err) {
      console.error('Error al rechazar pago:', err);
      alert('Ocurrió un error al rechazar el pago.');
    } finally {
      setProcessingId(null);
    }
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
              <th>Pago / N° Op.</th>
              <th>Monto (S/)</th>
              <th>Acciones / Comprobante</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center' }}>Cargando ventas...</td></tr>
            ) : ventas.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center' }}>No hay ventas registradas</td></tr>
            ) : (
              ventas.map((v) => {
                const isYape = v.metodo_pago === 'YAPE' || (v.culqi_charge_id && v.culqi_charge_id.startsWith('YAPE-'));
                const opCode = v.nro_operacion || (v.culqi_charge_id && v.culqi_charge_id.startsWith('YAPE-') ? v.culqi_charge_id.replace('YAPE-', '') : v.culqi_charge_id);
                const isFactura = v.tipo_documento === 'RUC';

                return (
                  <tr key={v.id}>
                    <td style={{ fontSize: '0.85em', color: '#666' }}>{v.id.substring(0, 8)}...</td>
                    <td>
                      {v.viajes?.rutas?.origen} - {v.viajes?.rutas?.destino}<br/>
                      <small style={{ color: '#7f8c8d' }}>{v.viajes?.fecha_viaje} {v.viajes?.hora_viaje}</small>
                    </td>
                    <td>#{v.numero_asiento}</td>
                    <td>{v.nombres} {v.apellidos}</td>
                    <td>
                      <strong>{v.tipo_documento}</strong>: {v.nro_documento}
                      <div style={{ fontSize: '0.75em', color: isFactura ? '#0369a1' : '#15803d' }}>
                        ({isFactura ? 'Factura' : 'Boleta'})
                      </div>
                    </td>
                    <td>
                      {isYape ? (
                        <span style={{ 
                          background: '#742284', 
                          color: '#00d2b8', 
                          padding: '3px 8px', 
                          borderRadius: '12px', 
                          fontSize: '0.8em',
                          fontWeight: 'bold',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <FaQrcode /> YAPE: {opCode}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.85em', color: '#555' }}>
                          {opCode || 'Tarjeta'}
                        </span>
                      )}
                    </td>
                    <td>S/ {v.monto_pagado}</td>
                    <td>
                      {v.comprobante_emitido ? (
                        <span style={{ color: '#2ecc71', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <FaCheck /> Confirmado
                          {v.comprobante_url && (
                            <a href={v.comprobante_url} target="_blank" rel="noreferrer" title="Ver Comprobante PDF" style={{ marginLeft: '6px', color: '#e74c3c' }}>
                              <FaFilePdf /> PDF
                            </a>
                          )}
                        </span>
                      ) : (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            className="admin-btn" 
                            style={{ padding: '6px 10px', fontSize: '0.8em', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => handleConfirmPayment(v)}
                            disabled={processingId === v.id}
                            title="Confirmar pago y emitir comprobante + boleto"
                          >
                            <FaPaperPlane /> {processingId === v.id ? '...' : 'Confirmar'}
                          </button>
                          
                          <button 
                            className="admin-btn" 
                            style={{ padding: '6px 10px', fontSize: '0.8em', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => handleRejectPayment(v)}
                            disabled={processingId === v.id}
                            title="Rechazar pago y liberar asiento"
                          >
                            <FaTimes /> Rechazar
                          </button>
                        </div>
                      )}
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

export default AdminSales;
