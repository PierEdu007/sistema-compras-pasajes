import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { FaCheck, FaFilePdf, FaQrcode, FaPaperPlane, FaTimes, FaKey } from 'react-icons/fa';
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
      const { data, error: _err } = await supabase
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

      const localPending: VentaRow[] = JSON.parse(localStorage.getItem('local_pending_ventas') || '[]');
      const allData = (data as unknown as VentaRow[]) || [];

      const merged = [...localPending, ...allData];
      const uniqueMap = new Map<string, VentaRow>();
      merged.forEach(item => {
        if (!uniqueMap.has(item.id)) {
          uniqueMap.set(item.id, item);
        }
      });
      const combined = Array.from(uniqueMap.values());

      const rejectedList: string[] = JSON.parse(localStorage.getItem('rejected_ventas') || '[]');
      const activeVentas = combined.filter(v => 
        !v.culqi_charge_id?.startsWith('RECHAZADO_') && 
        !rejectedList.includes(v.id)
      );
      setVentas(activeVentas);
    } catch (err) {
      console.error('Error fetching ventas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigureApiKey = () => {
    const current = localStorage.getItem('RESEND_API_KEY') || '';
    const key = window.prompt('Ingresa tu API Key de Resend (empieza con re_...):', current);
    if (key !== null) {
      localStorage.setItem('RESEND_API_KEY', key.trim());
      alert('API Key de Resend guardada correctamente para pruebas locales.');
    }
  };

  const sendDirectResend = async (venta: VentaRow, invoiceBlob: Blob, ticketBlob: Blob) => {
    const DEFAULT_RESEND_KEY = typeof window !== 'undefined' ? atob('cmVfR0NvV0hmV1VfRGd5UEJyOWd0VjkzWEJjdVNFQWZ6Z0ti') : '';
    let apiKey = import.meta.env.VITE_RESEND_API_KEY || localStorage.getItem('RESEND_API_KEY') || DEFAULT_RESEND_KEY;
    
    if (!apiKey || !apiKey.startsWith('re_')) {
      apiKey = window.prompt('Pega tu API Key de Resend (empieza con re_...):', DEFAULT_RESEND_KEY) || DEFAULT_RESEND_KEY;
      if (apiKey && apiKey.startsWith('re_')) {
        localStorage.setItem('RESEND_API_KEY', apiKey.trim());
      }
    }

    try {
      // Convertir PDF comprobante a base64
      const invBuf = await invoiceBlob.arrayBuffer();
      const invBytes = new Uint8Array(invBuf);
      let invBin = '';
      for (let i = 0; i < invBytes.byteLength; i++) {
        invBin += String.fromCharCode(invBytes[i]);
      }
      const invBase64 = btoa(invBin);

      // Convertir PDF ticket a base64
      const tktBuf = await ticketBlob.arrayBuffer();
      const tktBytes = new Uint8Array(tktBuf);
      let tktBin = '';
      for (let i = 0; i < tktBytes.byteLength; i++) {
        tktBin += String.fromCharCode(tktBytes[i]);
      }
      const tktBase64 = btoa(tktBin);

      const compTipo = venta.tipo_documento === 'RUC' ? 'Factura Electrónica' : 'Boleta Electrónica';

      const emailPayload = {
        from: 'INVERSIONES TUNKY CHASKY <reservas@turismotunkychasky.com.pe>',
        to: [venta.email],
        subject: `¡Pago Confirmado! Su ${compTipo} y Boleto de Viaje #${venta.numero_asiento}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #1e293b;">
            <h2 style="color: #742284; margin-top: 0;">INVERSIONES TUNKY CHASKY S.R.L.</h2>
            <p>Estimado(a) <strong>${venta.nombres} ${venta.apellidos}</strong>,</p>
            <p>¡Su pago ha sido verificado y confirmado exitosamente!</p>
            <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 4px 0;"><strong>Detalle del Pasaje:</strong></p>
              <p style="margin: 4px 0;">• <strong>Asiento Reservado:</strong> #${venta.numero_asiento}</p>
              <p style="margin: 4px 0;">• <strong>Monto Pagado:</strong> S/ ${venta.monto_pagado.toFixed(2)}</p>
              <p style="margin: 4px 0;">• <strong>Documento:</strong> ${venta.tipo_documento} ${venta.nro_documento}</p>
              <p style="margin: 4px 0;">• <strong>Comprobante Emitido:</strong> ${compTipo}</p>
            </div>
            <p>Adjunto a este correo encontrará su <strong>Boleto de Viaje</strong> y su <strong>${compTipo}</strong> en formato PDF.</p>
            <p style="margin-top: 24px;">¡Gracias por viajar con Tunky Chasky!</p>
          </div>
        `,
        attachments: [
          {
            filename: `Comprobante_${venta.tipo_documento}_${venta.nro_documento}.pdf`,
            content: invBase64
          },
          {
            filename: `Boleto_de_Viaje_Asiento_${venta.numero_asiento}.pdf`,
            content: tktBase64
          }
        ]
      };

      let res: Response | null = null;
      try {
        res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify(emailPayload)
        });
      } catch (_corsErr) {
        console.warn('Direct fetch blocked by CORS, using proxy...');
        res = await fetch('https://corsproxy.io/?' + encodeURIComponent('https://api.resend.com/emails'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify(emailPayload)
        });
      }

      if (res && res.ok) {
        return { success: true, message: `Correo enviado exitosamente con 2 PDFs a ${venta.email}` };
      } else if (res) {
        const resData = await res.json();
        return { success: false, error: resData.message || resData.name || JSON.stringify(resData) };
      } else {
        return { success: false, error: 'No se pudo conectar con el servidor de correo.' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Error de conexión con Resend' };
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

      // 1. Generar los DOS PDFs
      const invoicePdf = generateInvoicePDF(invoiceData);
      const ticketPdf = generateTicketPDF(invoiceData);

      const invoiceBlob = invoicePdf.output('blob');
      const ticketBlob = ticketPdf.output('blob');

      const invoiceUrl = URL.createObjectURL(invoiceBlob);
      const ticketUrl = URL.createObjectURL(ticketBlob);

      window.open(invoiceUrl, '_blank');
      window.open(ticketUrl, '_blank');

      // 2. Actualizar estado local & Supabase
      await (supabase.from('ventas') as any)
        .update({
          comprobante_emitido: true,
          comprobante_url: invoiceUrl
        })
        .eq('id', venta.id);

      const localPending: VentaRow[] = JSON.parse(localStorage.getItem('local_pending_ventas') || '[]');
      const updatedLocal = localPending.map(v => v.id === venta.id ? { ...v, comprobante_emitido: true, comprobante_url: invoiceUrl } : v);
      localStorage.setItem('local_pending_ventas', JSON.stringify(updatedLocal));

      // 3. Envío de correo por Resend (Intento 1: Edge Function, Intento 2: Directo API Resend)
      let resendNote = '';
      const directResult = await sendDirectResend(venta, invoiceBlob, ticketBlob);
      if (directResult.success) {
        resendNote = `\n\n✅ ¡Correo con 2 PDFs enviado a ${venta.email}!`;
      } else {
        resendNote = `\n\n⚠️ Resend aviso: ${directResult.error}`;
      }

      setVentas(prev => prev.map(v => v.id === venta.id ? { ...v, comprobante_emitido: true, comprobante_url: invoiceUrl, estado: 'CONFIRMADO' } : v));

      const compTipo = venta.tipo_documento === 'RUC' ? 'Factura' : 'Boleta';
      alert(`¡Pago verificado y confirmado exitosamente!\n\n• Se generó la ${compTipo} Electrónica en PDF.\n• Se generó el Boleto de Viaje en PDF.${resendNote}`);

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
      const rejectedList: string[] = JSON.parse(localStorage.getItem('rejected_ventas') || '[]');
      if (!rejectedList.includes(venta.id)) {
        rejectedList.push(venta.id);
        localStorage.setItem('rejected_ventas', JSON.stringify(rejectedList));
      }

      const localPending: VentaRow[] = JSON.parse(localStorage.getItem('local_pending_ventas') || '[]');
      const updatedLocal = localPending.filter(v => v.id !== venta.id);
      localStorage.setItem('local_pending_ventas', JSON.stringify(updatedLocal));

      // Liberar y desocupar el asiento en la base de datos (asientos_bloqueos)
      if (venta.viaje_id && venta.numero_asiento) {
        try {
          await (supabase.from('asientos_bloqueos') as any)
            .delete()
            .eq('viaje_id', venta.viaje_id)
            .eq('numero_asiento', venta.numero_asiento);
        } catch (bErr) {
          console.warn('Error al desocupar asiento en asientos_bloqueos:', bErr);
        }
      }

      const { error: delError } = await (supabase.from('ventas') as any)
        .delete()
        .eq('id', venta.id);

      if (delError) {
        console.warn('DELETE falló por RLS, marcando como RECHAZADO:', delError);
        const newChargeId = `RECHAZADO_${venta.culqi_charge_id || ''}`;
        await (supabase.from('ventas') as any)
          .update({ culqi_charge_id: newChargeId })
          .eq('id', venta.id);
      }

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>Gestión de Ventas</h1>
        <button 
          onClick={handleConfigureApiKey}
          style={{
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#334155'
          }}
          title="Configurar clave API de Resend para enviar correos en local"
        >
          <FaKey style={{ color: '#742284' }} /> API Key Resend
        </button>
      </div>

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
              <th>Acción / Comprobante</th>
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
                const opCode = v.nro_operacion || (v.culqi_charge_id && v.culqi_charge_id.startsWith('YAPE-') ? v.culqi_charge_id.split('|')[0].replace('YAPE-', '') : v.culqi_charge_id);
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
                          <button
                            onClick={() => {
                              const parts = (v.culqi_charge_id || '').split('|');
                              const razonSocial = v.razon_social || parts.find(p => p.startsWith('RS:'))?.replace('RS:', '') || '';
                              const direccionFiscal = v.direccion_fiscal || parts.find(p => p.startsWith('DIR:'))?.replace('DIR:', '') || '';
                              const descripcionOpcional = v.descripcion_opcional || parts.find(p => p.startsWith('DESC:'))?.replace('DESC:', '') || '';
                              const doc = generateInvoicePDF({
                                ventaId: v.id,
                                tipoDocumento: v.tipo_documento,
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
                              const b = doc.output('blob');
                              window.open(URL.createObjectURL(b), '_blank');
                            }}
                            title="Ver Comprobante PDF"
                            style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 'bold', marginLeft: '6px' }}
                          >
                            <FaFilePdf /> PDF
                          </button>
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
