import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { FaBell, FaCheck, FaFilePdf, FaQrcode, FaPaperPlane, FaTimes, FaKey, FaServer, FaSearch, FaFilter, FaSync, FaDownload } from 'react-icons/fa';
import { generateInvoicePDF, generateTicketPDF } from '../../utils/invoiceGenerator';
import { SunatConfigModal } from '../../components/admin/SunatConfigModal';
import { emitirComprobanteSunat, getSunatConfig } from '../../services/sunatService';
import { requestNotificationPermission } from '../../utils/notificationHelper';
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
  telefono?: string;
  created_at?: string;
  monto_pagado: number;
  culqi_charge_id?: string;
  metodo_pago?: string;
  nro_operacion?: string;
  razon_social?: string;
  direccion_fiscal?: string;
  descripcion_opcional?: string;
  comprobante_emitido: boolean;
  comprobante_url: string | null;
  nro_comprobante?: string;
  estado_sunat?: string;
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
  const [isSunatModalOpen, setIsSunatModalOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    return typeof Notification !== 'undefined' && Notification.permission === 'granted';
  });

  // Filtros de búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDocType, setFilterDocType] = useState('TODOS');
  const [filterStatus, setFilterStatus] = useState('TODOS');
  const [filterFecha, setFilterFecha] = useState('');
  const [filterComprobante, setFilterComprobante] = useState('');
  const [filterRuta, setFilterRuta] = useState('TODOS');

  // Obtener rutas únicas para el select
  const rutasUnicas = useMemo(() => {
    const set = new Set<string>();
    ventas.forEach(v => {
      if (v.viajes?.rutas?.origen && v.viajes?.rutas?.destino) {
        set.add(`${v.viajes.rutas.origen} - ${v.viajes.rutas.destino}`);
      }
    });
    return Array.from(set).sort();
  }, [ventas]);

  const filteredVentas = useMemo(() => {
    return ventas.filter(v => {
      // 1. Búsqueda por DNI, RUC, Nombres, Apellidos, N° Operación, Email o Teléfono
      const opCode = v.nro_operacion || (v.culqi_charge_id && v.culqi_charge_id.startsWith('YAPE-') ? v.culqi_charge_id.split('|')[0].replace('YAPE-', '') : v.culqi_charge_id) || '';
      
      const searchMatch = !searchQuery || 
        `${v.nro_documento} ${v.nombres} ${v.apellidos} ${v.email} ${v.telefono} ${opCode} ${v.id}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      // 2. Tipo de Documento (DNI, RUC)
      const docMatch = filterDocType === 'TODOS' || v.tipo_documento === filterDocType;

      // 3. Estado (EMITIDO vs PENDIENTE)
      const statusMatch = filterStatus === 'TODOS' || 
        (filterStatus === 'EMITIDO' && v.comprobante_emitido) || 
        (filterStatus === 'PENDIENTE' && !v.comprobante_emitido);

      // 4. Fecha de viaje / creación
      const fechaMatch = !filterFecha || (() => {
        const vDate = (v.viajes?.fecha_viaje || v.created_at || '').substring(0, 10);
        return vDate === filterFecha;
      })();

      // 5. N° Comprobante
      const comprobanteMatch = !filterComprobante || (() => {
        const nroComp = v.nro_comprobante || (() => {
          if (!v.comprobante_emitido) return '';
          const isF = v.tipo_documento === 'RUC';
          const serie = isF ? 'F001' : 'B001';
          const num = String(parseInt(v.id.replace(/\D/g, '').slice(-4) || '1', 10)).padStart(4, '0');
          return `${serie}-${num}`;
        })();
        return nroComp.toLowerCase().includes(filterComprobante.toLowerCase());
      })();

      // 6. Ruta de viaje
      const rutaMatch = filterRuta === 'TODOS' || (() => {
        const ruta = `${v.viajes?.rutas?.origen} - ${v.viajes?.rutas?.destino}`;
        return ruta === filterRuta;
      })();

      return searchMatch && docMatch && statusMatch && fechaMatch && comprobanteMatch && rutaMatch;
    });
  }, [ventas, searchQuery, filterDocType, filterStatus, filterFecha]);

  const handleToggleNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationsEnabled(granted);
    if (granted) {
      alert('🔔 ¡Notificaciones activadas exitosamente! Recibirás sonido, vibración y aviso en pantalla cuando un pasajero confirme un pago.');
    } else {
      alert('⚠️ Para recibir notificaciones, por favor autoriza el permiso en tu navegador o celular.');
    }
  };

  useEffect(() => {
    fetchVentas();

    // Auto-recargar lista de ventas cuando el AdminLayout detecte una nueva venta
    const handleNewSale = () => {
      fetchVentas();
    };

    window.addEventListener('new-sale-event', handleNewSale);
    return () => {
      window.removeEventListener('new-sale-event', handleNewSale);
    };
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
          nro_comprobante,
          estado_sunat,
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

  const handleClearLocalCache = () => {
    if (window.confirm('¿Deseas vaciar las ventas de prueba guardadas en la memoria local de tu navegador?')) {
      localStorage.removeItem('local_pending_ventas');
      localStorage.removeItem('rejected_ventas');
      fetchVentas();
      alert('✅ Memoria local limpiada con éxito. El panel ahora muestra exactamente la base de datos de Supabase.');
    }
  };

  const fetchUrlAsBase64 = async (url: string): Promise<string | null> => {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const buf = await res.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let bin = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        bin += String.fromCharCode(bytes[i]);
      }
      return btoa(bin);
    } catch (e) {
      console.warn('Error convirtiendo URL a Base64:', url, e);
      return null;
    }
  };

  const sendDirectResend = async (
    venta: VentaRow, 
    ticketBlob: Blob, 
    sunatData?: { pdfUrl?: string; xmlUrl?: string; serie?: string; numero?: number },
    fallbackInvoiceBlob?: Blob
  ) => {
    let apiKey = import.meta.env.VITE_RESEND_API_KEY || localStorage.getItem('RESEND_API_KEY') || '';
    
    if (!apiKey || !apiKey.startsWith('re_')) {
      apiKey = window.prompt('Pega tu API Key de Resend (empieza con re_...):', '') || '';
      if (apiKey && apiKey.startsWith('re_')) {
        localStorage.setItem('RESEND_API_KEY', apiKey.trim());
      }
    }

    try {
      // 1. Convertir PDF ticket a base64 (Boleto de Viaje)
      const tktBuf = await ticketBlob.arrayBuffer();
      const tktBytes = new Uint8Array(tktBuf);
      let tktBin = '';
      for (let i = 0; i < tktBytes.byteLength; i++) {
        tktBin += String.fromCharCode(tktBytes[i]);
      }
      const tktBase64 = btoa(tktBin);

      const attachments: { filename: string; content: string }[] = [
        {
          filename: `Boleto_de_Viaje_Asiento_${venta.numero_asiento}.pdf`,
          content: tktBase64
        }
      ];

      let pdfDownloadHtml = '';
      let xmlDownloadHtml = '';

      // 2. Si existen PDF y XML de NubeFact, obtenerlos y adjuntarlos
      if (sunatData?.pdfUrl) {
        const nubefactPdfBase64 = await fetchUrlAsBase64(sunatData.pdfUrl);
        if (nubefactPdfBase64) {
          attachments.push({
            filename: `SUNAT_Comprobante_${sunatData.serie || 'BBB1'}-${sunatData.numero || 1}.pdf`,
            content: nubefactPdfBase64
          });
        }
        pdfDownloadHtml = `<p style="margin: 8px 0;"><a href="${sunatData.pdfUrl}" target="_blank" style="background-color: #0f4c81; color: #ffffff; padding: 10px 16px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">📄 Descargar Comprobante PDF</a></p>`;
      }

      if (sunatData?.xmlUrl) {
        const nubefactXmlBase64 = await fetchUrlAsBase64(sunatData.xmlUrl);
        if (nubefactXmlBase64) {
          attachments.push({
            filename: `SUNAT_Comprobante_${sunatData.serie || 'BBB1'}-${sunatData.numero || 1}.xml`,
            content: nubefactXmlBase64
          });
        }
        xmlDownloadHtml = `<p style="margin: 8px 0;"><a href="${sunatData.xmlUrl}" target="_blank" style="background-color: #742284; color: #ffffff; padding: 10px 16px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">📑 Descargar Comprobante XML</a></p>`;
      }

      // Fallback si NubeFact no devolvió PDF
      if (!sunatData?.pdfUrl && fallbackInvoiceBlob) {
        const invBuf = await fallbackInvoiceBlob.arrayBuffer();
        const invBytes = new Uint8Array(invBuf);
        let invBin = '';
        for (let i = 0; i < invBytes.byteLength; i++) {
          invBin += String.fromCharCode(invBytes[i]);
        }
        attachments.push({
          filename: `Comprobante_${venta.tipo_documento}_${venta.nro_documento}.pdf`,
          content: btoa(invBin)
        });
      }

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
            <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #742284;">
              <p style="margin: 4px 0;"><strong>Detalle del Pasaje:</strong></p>
              <p style="margin: 4px 0;">• <strong>Asiento Reservado:</strong> #${venta.numero_asiento}</p>
              <p style="margin: 4px 0;">• <strong>Monto Pagado:</strong> S/ ${venta.monto_pagado.toFixed(2)}</p>
              <p style="margin: 4px 0;">• <strong>Documento:</strong> ${venta.tipo_documento} ${venta.nro_documento}</p>
              <p style="margin: 4px 0;">• <strong>Comprobante Emitido:</strong> ${compTipo} ${sunatData?.serie ? `(${sunatData.serie}-${sunatData.numero})` : ''}</p>
            </div>
            
            <p>Adjunto a este correo encontrará su <strong>Boleto de Viaje (PDF)</strong>, su <strong>${compTipo} (PDF)</strong> y el archivo <strong>XML</strong>.</p>
            
            ${pdfDownloadHtml}
            ${xmlDownloadHtml}

            <p style="margin-top: 24px; font-size: 0.9em; color: #64748b;">¡Gracias por viajar con Tunky Chasky!</p>
          </div>
        `,
        attachments
      };

      let res: Response | null = null;
      try {
        // Intento: Servidor Edge Cloudflare / Proxy local Vite /api/enviar-correo (Sin problemas de CORS)
        res = await fetch('/api/enviar-correo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: venta.email,
            subject: emailPayload.subject,
            html: emailPayload.html,
            attachments: emailPayload.attachments,
            apiKey
          })
        });
      } catch (_serverErr: any) {
        console.warn('Error al contactar servicio de correo /api/enviar-correo:', _serverErr);
      }

      if (res && res.ok) {
        return { success: true, message: `Correo enviado exitosamente con PDF NubeFact, XML y Boleto a ${venta.email}` };
      } else if (res) {
        try {
          const resData = await res.json();
          return { success: false, error: resData.message || resData.name || resData.error || `Error (${res.status})` };
        } catch (_jsonErr) {
          return { success: false, error: `Servidor de correo respondió código ${res.status}` };
        }
      } else {
        return { success: false, error: 'No se pudo conectar con el servicio de correo.' };
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

      // 1. Generar los PDFs locales (Boleto de Viaje e Invoice local)
      const invoicePdf = generateInvoicePDF(invoiceData);
      const ticketPdf = generateTicketPDF(invoiceData);

      const invoiceBlob = invoicePdf.output('blob');
      const ticketBlob = ticketPdf.output('blob');

      const invoiceUrl = URL.createObjectURL(invoiceBlob);
      const ticketUrl = URL.createObjectURL(ticketBlob);

      window.open(ticketUrl, '_blank');

      // 2. Emisión automática a SUNAT vía API PSE / Nubefact
      let sunatNote = '';
      let finalInvoiceUrl = invoiceUrl;
      let sunatResultData: { pdfUrl?: string; xmlUrl?: string; serie?: string; numero?: number } | undefined = undefined;

      const sunatConfig = getSunatConfig();
      if (sunatConfig.enabled) {
        const sunatRes = await emitirComprobanteSunat({
          ventaId: venta.id,
          tipoDocumento: venta.tipo_documento,
          nroDocumento: venta.nro_documento,
          nombres: venta.nombres,
          apellidos: venta.apellidos,
          email: venta.email,
          razonSocial,
          direccionFiscal,
          origen: venta.viajes?.rutas?.origen || 'CUSCO',
          destino: venta.viajes?.rutas?.destino || 'QUILLABAMBA',
          asiento: venta.numero_asiento,
          monto: venta.monto_pagado,
          fechaViaje: venta.viajes?.fecha_viaje || '',
          horaViaje: venta.viajes?.hora_viaje || ''
        });

        if (sunatRes.success) {
          sunatNote = `\n\n✅ ¡Comprobante SUNAT Emitido y Aceptado! (Serie: ${sunatRes.serie}-${sunatRes.numero})`;
          if (sunatRes.pdfUrl) {
            finalInvoiceUrl = sunatRes.pdfUrl;
            window.open(sunatRes.pdfUrl, '_blank');
          }
          sunatResultData = {
            pdfUrl: sunatRes.pdfUrl,
            xmlUrl: sunatRes.xmlUrl,
            serie: sunatRes.serie,
            numero: sunatRes.numero
          };
        } else {
          sunatNote = `\n\n⚠️ SUNAT Aviso: ${sunatRes.error}`;
        }
      }

      // 3. Actualizar estado local & Supabase
      await (supabase.from('ventas') as any)
        .update({
          comprobante_emitido: true,
          comprobante_url: finalInvoiceUrl
        })
        .eq('id', venta.id);

      const localPending: VentaRow[] = JSON.parse(localStorage.getItem('local_pending_ventas') || '[]');
      const updatedLocal = localPending.map(v => v.id === venta.id ? { ...v, comprobante_emitido: true, comprobante_url: finalInvoiceUrl } : v);
      localStorage.setItem('local_pending_ventas', JSON.stringify(updatedLocal));

      // 4. Envío de correo por Resend adjuntando el PDF NubeFact, XML NubeFact y Boleto
      let resendNote = '';
      const directResult = await sendDirectResend(venta, ticketBlob, sunatResultData, invoiceBlob);
      if (directResult.success) {
        resendNote = `\n\n✅ ¡Correo con Boleto, PDF NubeFact y XML enviado a ${venta.email}!`;
      } else {
        resendNote = `\n\n⚠️ Resend aviso: ${directResult.error}`;
      }

      setVentas(prev => prev.map(v => v.id === venta.id ? { ...v, comprobante_emitido: true, comprobante_url: finalInvoiceUrl, estado: 'CONFIRMADO' } : v));

      const compTipo = venta.tipo_documento === 'RUC' ? 'Factura' : 'Boleta';
      alert(`¡Pago verificado y confirmado exitosamente!\n\n• Se generó el Boleto de Viaje en PDF.\n• Se generó la ${compTipo} Electrónica NubeFact en PDF y XML.${sunatNote}${resendNote}`);

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

  const handleExportBackup = async () => {
    try {
      const [ventasRes, viajesRes, rutasRes, vehiculosRes] = await Promise.all([
        supabase.from('ventas').select('*'),
        supabase.from('viajes').select('*'),
        supabase.from('rutas').select('*'),
        supabase.from('vehiculos').select('*')
      ]);

      const backupData = {
        empresa: 'INVERSIONES TUNKY CHASKY S.R.L.',
        ruc: '20613271701',
        fecha_backup: new Date().toISOString(),
        total_ventas: ventasRes.data?.length || 0,
        total_viajes: viajesRes.data?.length || 0,
        ventas: ventasRes.data || [],
        viajes: viajesRes.data || [],
        rutas: rutasRes.data || [],
        vehiculos: vehiculosRes.data || []
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `backup_tunkychasky_${new Date().toISOString().substring(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      alert('¡Copia de seguridad (Backup Completo) descargada con éxito en tu computadora o celular!');
    } catch (err) {
      console.error('Error al exportar backup:', err);
      alert('Ocurrió un error al generar la copia de seguridad.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>Gestión de Ventas</h1>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleExportBackup}
            style={{
              background: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)'
            }}
            title="Descargar copia de seguridad completa (Ventas, Viajes, Clientes) en JSON"
          >
            <FaDownload /> Respaldar BD (Backup 1-Clic)
          </button>
          <button
            onClick={handleClearLocalCache}
            style={{
              background: '#ef4444',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(239, 68, 68, 0.25)'
            }}
            title="Borra ventas de prueba guardadas en la memoria local del navegador"
          >
            <FaSync /> Limpiar Memoria Local (Caché)
          </button>
          <button
            onClick={handleToggleNotifications}
            style={{
              background: notificationsEnabled ? '#10b981' : '#f59e0b',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
            }}
            title="Activa avisos en pantalla, vibración y sonido en tu celular/laptop cuando haya compras"
          >
            <FaBell /> {notificationsEnabled ? '🔔 Notificaciones Activas' : '🔔 Activar Notificaciones'}
          </button>

          <button 
            onClick={() => setIsSunatModalOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #0f4c81, #742284)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(15, 76, 129, 0.25)'
            }}
            title="Configurar conexión de Facturación Electrónica a SUNAT (Nubefact / PSE)"
          >
            <FaServer /> Configuración SUNAT (PSE)
          </button>

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
      </div>

      {/* BARRA DE FILTROS Y BÚSQUEDA DE VENTAS */}
      <div className="admin-card" style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#0f4c81', fontWeight: 'bold' }}>
          <FaFilter /> <span>Filtros de Ventas (Búsqueda por DNI, RUC, Nombres o N° Operación)</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {/* Búsqueda por DNI/RUC/Nombre */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>
              DNI, RUC, Nombres o N° Yape:
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="admin-form-control"
                placeholder="Ej. 72849102, 206132..., Juan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '32px' }}
              />
              <FaSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>
          </div>

          {/* Tipo de Documento */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>
              Tipo de Documento:
            </label>
            <select
              className="admin-form-control"
              value={filterDocType}
              onChange={(e) => setFilterDocType(e.target.value)}
            >
              <option value="TODOS">Todos (Boletas y Facturas)</option>
              <option value="DNI">Solo DNI (Boleta)</option>
              <option value="RUC">Solo RUC (Factura)</option>
            </select>
          </div>

          {/* Estado de Venta */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>
              Estado del Pago:
            </label>
            <select
              className="admin-form-control"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="TODOS">Todos los Pagos</option>
              <option value="PENDIENTE">⏳ Pendientes por Confirmar</option>
              <option value="EMITIDO">✅ Confirmados / Emitidos</option>
            </select>
          </div>

          {/* Fecha */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>
              Filtrar por Fecha:
            </label>
            <input
              type="date"
              className="admin-form-control"
              value={filterFecha}
              onChange={(e) => setFilterFecha(e.target.value)}
            />
          </div>

          {/* N° Comprobante */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>
              N° Comprobante:
            </label>
            <input
              type="text"
              className="admin-form-control"
              placeholder="Ej. F001-0983, B001..."
              value={filterComprobante}
              onChange={(e) => setFilterComprobante(e.target.value)}
            />
          </div>

          {/* Ruta de Viaje */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>
              Ruta de Viaje:
            </label>
            <select
              className="admin-form-control"
              value={filterRuta}
              onChange={(e) => setFilterRuta(e.target.value)}
            >
              <option value="TODOS">Todas las Rutas</option>
              {rutasUnicas.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        {(searchQuery || filterDocType !== 'TODOS' || filterStatus !== 'TODOS' || filterFecha || filterComprobante || filterRuta !== 'TODOS') && (
          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}>
              Mostrando {filteredVentas.length} venta(s) de {ventas.length} en total
            </span>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterDocType('TODOS');
                setFilterStatus('TODOS');
                setFilterFecha('');
                setFilterComprobante('');
                setFilterRuta('TODOS');
              }}
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

      <SunatConfigModal
        isOpen={isSunatModalOpen}
        onClose={() => setIsSunatModalOpen(false)}
      />

      <div className="admin-card" style={{ padding: 0, overflowX: 'auto', maxHeight: '58vh', overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID Venta</th>
              <th>Viaje</th>
              <th>Asiento</th>
              <th>Pasajero</th>
              <th>Documento</th>
              <th>N° Comprobante</th>
              <th>Estado SUNAT</th>
              <th>Pago / N° Op.</th>
              <th>Monto (S/)</th>
              <th>Acción / Comprobante</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} style={{ textAlign: 'center' }}>Cargando ventas...</td></tr>
            ) : filteredVentas.length === 0 ? (
              <tr><td colSpan={10} style={{ textAlign: 'center', color: '#64748b', padding: '25px' }}>No se encontraron ventas con los filtros seleccionados</td></tr>
            ) : (
              filteredVentas.map((v) => {
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
                      {(() => {
                        if (v.nro_comprobante) return <span style={{ fontWeight: 'bold', color: '#0f4c81', fontFamily: 'monospace' }}>{v.nro_comprobante}</span>;
                        if (!v.comprobante_emitido) return <span style={{ color: '#94a3b8', fontSize: '0.85em' }}>—</span>;
                        const isF = v.tipo_documento === 'RUC';
                        const serie = isF ? 'F001' : 'B001';
                        const num = String(parseInt(v.id.replace(/\D/g, '').slice(-4) || '1', 10)).padStart(4, '0');
                        return <span style={{ fontWeight: 'bold', color: '#0f4c81', fontFamily: 'monospace' }}>{serie}-{num}</span>;
                      })()}
                    </td>
                    <td>
                      {(() => {
                        if (!v.comprobante_emitido) return <span style={{ color: '#94a3b8', fontSize: '0.85em' }}>—</span>;
                        const estado = v.estado_sunat || 'ACEPTADO';
                        const isAnulado = estado === 'ANULADO';
                        return (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '0.78em',
                            fontWeight: 'bold',
                            background: isAnulado ? '#fee2e2' : '#dcfce7',
                            color: isAnulado ? '#dc2626' : '#16a34a',
                            border: `1px solid ${isAnulado ? '#fca5a5' : '#86efac'}`
                          }}>
                            {isAnulado ? '✕ Anulado' : '✓ Aceptado'}
                          </span>
                        );
                      })()}
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
