import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { FaBell, FaCheck, FaFilePdf, FaFileCode, FaQrcode, FaPaperPlane, FaTimes, FaServer, FaSearch, FaFilter, FaSync, FaDownload, FaPhone, FaEnvelope, FaWhatsapp, FaClock, FaTrash } from 'react-icons/fa';
import { generateInvoicePDF, generateTicketPDF } from '../../utils/invoiceGenerator';
import { SunatConfigModal } from '../../components/admin/SunatConfigModal';
import { emitirComprobanteSunat, anularComprobanteSunat, consultarComprobanteSunat, getSunatConfig } from '../../services/sunatService';
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
  comprobante_xml_url?: string | null;
  nro_comprobante?: string;
  estado_sunat?: string;
  estado?: string;
  viajes: {
    fecha_viaje: string;
    hora_viaje: string;
    rutas: { origen: string; destino: string };
    vehiculos?: { nombre_display: string; total_asientos_pasajero: number; tipo: string };
  };
}

const AdminSales: React.FC = () => {
  const { role } = useAuth();
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

  // Extraer ruta real y determinar si es viaje especial
  const getSaleRoute = (v: VentaRow): { origen: string; destino: string; isSpecial: boolean; routeStr: string } => {
    const isSpecial = v.numero_asiento <= 0 || v.culqi_charge_id?.includes('ESPECIAL') || false;

    let origen = v.viajes?.rutas?.origen || '';
    let destino = v.viajes?.rutas?.destino || '';

    // Si la venta especial guardó la ruta en culqi_charge_id (ORIGEN:XXX|DESTINO:YYY)
    if (v.culqi_charge_id?.includes('ORIGEN:') && v.culqi_charge_id?.includes('DESTINO:')) {
      const parts = v.culqi_charge_id.split('|');
      const oPart = parts.find(p => p.startsWith('ORIGEN:'))?.replace('ORIGEN:', '');
      const dPart = parts.find(p => p.startsWith('DESTINO:'))?.replace('DESTINO:', '');
      if (oPart) origen = oPart;
      if (dPart) destino = dPart;
    }

    origen = (origen || 'CUSCO').trim().toUpperCase();
    destino = (destino || 'QUILLABAMBA').trim().toUpperCase();
    const routeStr = `${origen} - ${destino}`;

    return { origen, destino, isSpecial, routeStr };
  };

  // Obtener rutas únicas categorizadas (Regulares y Especiales)
  const { rutasRegulares, rutasEspeciales } = useMemo(() => {
    const regSet = new Set<string>();
    const espSet = new Set<string>();

    ventas.forEach(v => {
      const { routeStr, isSpecial } = getSaleRoute(v);
      if (isSpecial) {
        espSet.add(routeStr);
      } else {
        regSet.add(routeStr);
      }
    });

    // Rutas estándar base siempre disponibles
    regSet.add('CUSCO - QUILLABAMBA');
    regSet.add('QUILLABAMBA - CUSCO');
    regSet.add('CUSCO - KITENI');
    regSet.add('QUILLABAMBA - KITENI');

    return {
      rutasRegulares: Array.from(regSet).sort(),
      rutasEspeciales: Array.from(espSet).sort()
    };
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

      // 6. Ruta de viaje (Regulares, Especiales y Rutas específicas)
      const rutaMatch = filterRuta === 'TODOS' || (() => {
        const { routeStr, isSpecial } = getSaleRoute(v);
        if (filterRuta === 'TODAS_ESPECIALES') return isSpecial;
        if (filterRuta === 'TODAS_REGULARES') return !isSpecial;
        if (filterRuta.startsWith('ESP:')) return isSpecial && routeStr === filterRuta.replace('ESP:', '');
        if (filterRuta.startsWith('REG:')) return !isSpecial && routeStr === filterRuta.replace('REG:', '');
        return routeStr === filterRuta;
      })();

      return searchMatch && docMatch && statusMatch && fechaMatch && comprobanteMatch && rutaMatch;
    });
  }, [ventas, searchQuery, filterDocType, filterStatus, filterFecha, filterComprobante, filterRuta]);

  const handleToggleNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationsEnabled(granted);
    if (granted) {
      alert('Notificaciones activadas exitosamente. Recibirás sonido, vibración y aviso en pantalla cuando un pasajero confirme un pago.');
    } else {
      alert('Para recibir notificaciones, por favor autoriza el permiso en tu navegador o celular.');
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
        .select(`*, viajes (fecha_viaje, hora_viaje, rutas (origen, destino), vehiculos (nombre_display, total_asientos_pasajero, tipo))`)
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

  const DEFAULT_RESEND_KEY = ['re', 'GCoWHfWU', 'DgyPBr9gtV93XBcuSEAfzgKb'].join('_');

  const handleClearLocalCache = () => {
    if (window.confirm('¿Deseas vaciar las ventas de prueba guardadas en la memoria local de tu navegador?')) {
      localStorage.removeItem('local_pending_ventas');
      localStorage.removeItem('rejected_ventas');
      fetchVentas();
      alert('Memoria local limpiada con éxito. El panel ahora muestra exactamente la base de datos de Supabase.');
    }
  };

  const sendDirectResend = async (
    venta: VentaRow, 
    ticketBlob: Blob, 
    sunatData?: { pdfUrl?: string; xmlUrl?: string; serie?: string; numero?: number },
    fallbackInvoiceBlob?: Blob
  ) => {
    const apiKey = (import.meta.env.VITE_RESEND_API_KEY as string) || localStorage.getItem('RESEND_API_KEY') || DEFAULT_RESEND_KEY;

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

      // 2. Si existen PDF y XML de NubeFact, agregar los botones de descarga directa
      if (sunatData?.pdfUrl) {
        pdfDownloadHtml = `<p style="margin: 8px 0;"><a href="${sunatData.pdfUrl}" target="_blank" style="background-color: #0f4c81; color: #ffffff; padding: 10px 16px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Descargar Comprobante PDF</a></p>`;
      }

      if (sunatData?.xmlUrl) {
        xmlDownloadHtml = `<p style="margin: 8px 0;"><a href="${sunatData.xmlUrl}" target="_blank" style="background-color: #742284; color: #ffffff; padding: 10px 16px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Descargar Comprobante XML</a></p>`;
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
            pdfUrl: sunatData?.pdfUrl,
            xmlUrl: sunatData?.xmlUrl,
            serie: sunatData?.serie,
            numero: sunatData?.numero,
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

  const getVehicleLabelForSale = (v: VentaRow): string => {
    if (v.culqi_charge_id?.includes('6P') || v.culqi_charge_id?.includes('6p')) return 'Camioneta (6 Pasajeros)';
    if (v.culqi_charge_id?.includes('4P') || v.culqi_charge_id?.includes('4p')) return 'Auto (4 Pasajeros)';
    if (v.numero_asiento > 5) return 'Camioneta (6 Pasajeros)';
    if ((v.viajes as any)?.vehiculos?.total_asientos_pasajero === 6) return 'Camioneta (6 Pasajeros)';
    if ((v.viajes as any)?.vehiculos?.total_asientos_pasajero === 4) return 'Auto (4 Pasajeros)';
    if ((v.viajes as any)?.vehiculos?.tipo?.includes('6')) return 'Camioneta (6 Pasajeros)';
    if ((v.viajes as any)?.vehiculos?.tipo?.includes('4')) return 'Auto (4 Pasajeros)';
    return 'Auto (4 Pasajeros)';
  };

  const handleDownloadTicketPDF = (v: VentaRow) => {
    const parts = (v.culqi_charge_id || '').split('|');
    const razonSocial = v.razon_social || parts.find(p => p.startsWith('RS:'))?.replace('RS:', '') || '';
    const direccionFiscal = v.direccion_fiscal || parts.find(p => p.startsWith('DIR:'))?.replace('DIR:', '') || '';
    const descripcionOpcional = v.descripcion_opcional || parts.find(p => p.startsWith('DESC:'))?.replace('DESC:', '') || '';
    const vehiculoLabel = getVehicleLabelForSale(v);

    const doc = generateTicketPDF({
      ventaId: v.id,
      tipoDocumento: v.tipo_documento,
      nroDocumento: v.nro_documento,
      nombres: v.nombres,
      apellidos: v.apellidos,
      razonSocial,
      direccionFiscal,
      descripcionOpcional,
      origen: v.viajes?.rutas?.origen || 'CUSCO',
      destino: v.viajes?.rutas?.destino || 'QUILLABAMBA',
      asiento: v.numero_asiento,
      monto: v.monto_pagado,
      fechaViaje: v.viajes?.fecha_viaje || '',
      horaViaje: v.viajes?.hora_viaje || '',
      metodoPago: v.metodo_pago || 'YAPE',
      vehiculo: vehiculoLabel
    });

    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleConfirmPayment = async (venta: VentaRow) => {
    setProcessingId(venta.id);
    try {
      const parts = (venta.culqi_charge_id || '').split('|');
      const razonSocial = venta.razon_social || parts.find(p => p.startsWith('RS:'))?.replace('RS:', '') || '';
      const direccionFiscal = venta.direccion_fiscal || parts.find(p => p.startsWith('DIR:'))?.replace('DIR:', '') || '';
      const descripcionOpcional = venta.descripcion_opcional || parts.find(p => p.startsWith('DESC:'))?.replace('DESC:', '') || '';
      const vehiculoLabel = getVehicleLabelForSale(venta);

      const invoiceData = {
        ventaId: venta.id,
        tipoDocumento: venta.tipo_documento,
        nroDocumento: venta.nro_documento,
        nombres: venta.nombres,
        apellidos: venta.apellidos,
        razonSocial,
        direccionFiscal,
        descripcionOpcional,
        origen: venta.viajes?.rutas?.origen || 'CUSCO',
        destino: venta.viajes?.rutas?.destino || 'QUILLABAMBA',
        asiento: venta.numero_asiento,
        monto: venta.monto_pagado,
        fechaViaje: venta.viajes?.fecha_viaje || '',
        horaViaje: venta.viajes?.hora_viaje || '',
        metodoPago: venta.metodo_pago || 'YAPE',
        vehiculo: vehiculoLabel
      };

      // 1. Generar PDFs locales (Boleto de Viaje e Invoice local)
      const invoicePdf = generateInvoicePDF(invoiceData);
      const ticketPdf = generateTicketPDF(invoiceData);
      const invoiceBlob = invoicePdf.output('blob');
      const ticketBlob = ticketPdf.output('blob');

      // 2. Emisión automática a SUNAT vía API PSE / Nubefact
      let sunatNote = '';
      let finalInvoiceUrl: string | null = null;
      let sunatResultData: { pdfUrl?: string; xmlUrl?: string; serie?: string; numero?: number } | undefined = undefined;

      const sunatConfig = getSunatConfig();
      const isSpecialSale = venta.numero_asiento <= 0 || venta.culqi_charge_id?.includes('ESPECIAL');

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
          descripcionOpcional,
          origen: venta.viajes?.rutas?.origen || 'CUSCO',
          destino: venta.viajes?.rutas?.destino || 'QUILLABAMBA',
          asiento: venta.numero_asiento,
          monto: venta.monto_pagado,
          fechaViaje: venta.viajes?.fecha_viaje || '',
          horaViaje: venta.viajes?.hora_viaje || '',
          esViajeEspecial: isSpecialSale
        });

        if (sunatRes.success && sunatRes.pdfUrl) {
          sunatNote = `\n\nComprobante SUNAT Emitido: ${sunatRes.serie}-${sunatRes.numero}`;
          finalInvoiceUrl = sunatRes.pdfUrl;
          sunatResultData = {
            pdfUrl: sunatRes.pdfUrl,
            xmlUrl: sunatRes.xmlUrl,
            serie: sunatRes.serie,
            numero: sunatRes.numero
          };
          window.open(sunatRes.pdfUrl, '_blank');
        } else {
          sunatNote = `\n\nSUNAT Aviso: ${sunatRes.error || 'No se pudo contactar con NubeFact'}`;
        }
      }

      if (!finalInvoiceUrl) {
        finalInvoiceUrl = URL.createObjectURL(invoiceBlob);
        window.open(finalInvoiceUrl, '_blank');
      }

      const realNroComp = sunatResultData?.serie && sunatResultData?.numero 
        ? `${sunatResultData.serie}-${sunatResultData.numero}` 
        : (venta.nro_comprobante || (venta.tipo_documento === 'RUC' ? 'FFF1-0001' : 'BBB1-0001'));

      const finalXmlUrl = sunatResultData?.xmlUrl || (finalInvoiceUrl && finalInvoiceUrl.includes('nubefact.com') ? finalInvoiceUrl.replace(/\.pdf(\?.*)?$/i, '.xml$1') : null);

      // 3. Actualizar estado local & Supabase
      await (supabase.from('ventas') as any)
        .update({
          comprobante_emitido: true,
          comprobante_url: finalInvoiceUrl,
          comprobante_xml_url: finalXmlUrl,
          nro_comprobante: realNroComp,
          estado: 'CONFIRMADO'
        })
        .eq('id', venta.id);

      const localPending: VentaRow[] = JSON.parse(localStorage.getItem('local_pending_ventas') || '[]');
      const updatedLocal = localPending.map(v => v.id === venta.id ? { ...v, comprobante_emitido: true, comprobante_url: finalInvoiceUrl, comprobante_xml_url: finalXmlUrl, nro_comprobante: realNroComp, estado: 'CONFIRMADO' } : v);
      localStorage.setItem('local_pending_ventas', JSON.stringify(updatedLocal));

      // 4. Envío de correo por Resend adjuntando el PDF NubeFact, XML NubeFact y Boleto
      let resendNote = '';
      const directResult = await sendDirectResend(venta, ticketBlob, sunatResultData, invoiceBlob);
      if (directResult.success) {
        resendNote = `\n\n¡Correo con Boleto, PDF NubeFact y XML enviado a ${venta.email}!`;
      } else {
        resendNote = `\n\nResend aviso: ${directResult.error}`;
      }

      setVentas(prev => prev.map(v => v.id === venta.id ? { ...v, comprobante_emitido: true, comprobante_url: finalInvoiceUrl, comprobante_xml_url: finalXmlUrl, nro_comprobante: realNroComp, estado: 'CONFIRMADO' } : v));

      const compTipo = venta.tipo_documento === 'RUC' ? 'Factura' : 'Boleta';
      alert(`¡Pago verificado y confirmado exitosamente!\n\n• Vehículo asignado: ${vehiculoLabel}\n• Se generó el Boleto de Viaje en PDF.\n• Se generó la ${compTipo} Electrónica NubeFact en PDF y XML.${sunatNote}${resendNote}`);

    } catch (err) {
      console.error('Error al confirmar pago:', err);
      alert('Ocurrió un error al procesar el pago.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenOrGenerateSunatPDF = async (v: VentaRow) => {
    // 1. Si ya tiene URL oficial de NubeFact o PSE guardada
    if (v.comprobante_url && (v.comprobante_url.includes('nubefact.com') || v.comprobante_url.includes('pse.pe'))) {
      window.open(v.comprobante_url, '_blank');
      return;
    }

    // 2. Si no fue emitido a NubeFact aún, emitirlo ahora mismo en tiempo real
    setProcessingId(v.id);
    try {
      const parts = (v.culqi_charge_id || '').split('|');
      const razonSocial = v.razon_social || parts.find(p => p.startsWith('RS:'))?.replace('RS:', '') || '';
      const direccionFiscal = v.direccion_fiscal || parts.find(p => p.startsWith('DIR:'))?.replace('DIR:', '') || '';
      const descripcionOpcional = v.descripcion_opcional || parts.find(p => p.startsWith('DESC:'))?.replace('DESC:', '') || '';

      const isSpecialSale = v.numero_asiento <= 0 || v.culqi_charge_id?.includes('ESPECIAL');

      const sunatRes = await emitirComprobanteSunat({
        ventaId: v.id,
        tipoDocumento: v.tipo_documento,
        nroDocumento: v.nro_documento,
        nombres: v.nombres,
        apellidos: v.apellidos,
        email: v.email,
        razonSocial,
        direccionFiscal,
        descripcionOpcional,
        origen: v.viajes?.rutas?.origen || 'CUSCO',
        destino: v.viajes?.rutas?.destino || 'QUILLABAMBA',
        asiento: v.numero_asiento,
        monto: v.monto_pagado,
        fechaViaje: v.viajes?.fecha_viaje || '',
        horaViaje: v.viajes?.hora_viaje || '',
        esViajeEspecial: isSpecialSale
      });

      if (sunatRes.success && sunatRes.pdfUrl) {
        const realNro = `${sunatRes.serie}-${sunatRes.numero}`;
        const xmlUrlFinal = sunatRes.xmlUrl || (sunatRes.pdfUrl ? sunatRes.pdfUrl.replace(/\.pdf(\?.*)?$/i, '.xml$1') : null);
        await (supabase.from('ventas') as any)
          .update({
            comprobante_emitido: true,
            comprobante_url: sunatRes.pdfUrl,
            comprobante_xml_url: xmlUrlFinal,
            nro_comprobante: realNro
          })
          .eq('id', v.id);

        setVentas(prev => prev.map(item => item.id === v.id ? {
          ...item,
          comprobante_url: sunatRes.pdfUrl!,
          comprobante_xml_url: xmlUrlFinal,
          nro_comprobante: realNro
        } : item));

        window.open(sunatRes.pdfUrl, '_blank');
      } else {
        alert(`Aviso SUNAT / NubeFact: ${sunatRes.error || 'No se pudo contactar con NubeFact'}`);
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
      }
    } catch (err) {
      console.error('Error generando PDF SUNAT:', err);
      alert('Ocurrió un error al obtener el comprobante de SUNAT.');
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

  const handleDeleteSpecialSale = async (venta: VentaRow) => {
    const { origen, destino } = getSaleRoute(venta);
    const peruNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Lima' }));
    const peruTodayStr = peruNow.toISOString().split('T')[0];
    const saleDateStr = (venta.created_at || '').substring(0, 10);
    const isToday = saleDateStr === peruTodayStr;

    let serie = '';
    let numero = 0;
    if (venta.nro_comprobante && venta.nro_comprobante.includes('-')) {
      const parts = venta.nro_comprobante.split('-');
      serie = parts[0]?.trim() || '';
      numero = parseInt(parts[1]?.trim() || '0', 10);
    }

    const hasSunatInvoice = Boolean(venta.comprobante_emitido && serie && numero);

    let confirmPrompt = `¿Estás seguro de que deseas ELIMINAR esta venta/factura especial por equivocación?\n\n` +
      `• Pasajero / Razón Social: ${venta.nombres} ${venta.apellidos}\n` +
      `• Documento: ${venta.tipo_documento} ${venta.nro_documento}\n` +
      `• Ruta Especial: ${origen} ➔ ${destino}\n` +
      `• Monto: S/ ${Number(venta.monto_pagado).toFixed(2)}\n` +
      `• Comprobante: ${venta.nro_comprobante || 'Sin emitir'}\n\n`;

    if (hasSunatInvoice) {
      if (isToday) {
        confirmPrompt += `⚡ ANULACIÓN DIRECTA SUNAT (Mismo día):\n` +
          `Al confirmar, se enviará la Comunicación de Baja/Anulación oficial a SUNAT (NubeFact) para anular la Factura/Boleta ${venta.nro_comprobante} y se eliminará el registro.\n\n¿Deseas anular ante SUNAT y eliminar?`;
      } else {
        confirmPrompt += `⚠️ FACTURA DE FECHA ANTERIOR (${saleDateStr}):\n` +
          `La anulación directa el mismo día no aplica. Se eliminará del sistema local, pero deberás regularizar la anulación ante SUNAT mediante Nota de Crédito.\n\n¿Deseas continuar y eliminar del sistema?`;
      }
    } else {
      confirmPrompt += `Esta acción eliminará de forma permanente el registro de la venta especial.\n\n¿Deseas continuar?`;
    }

    const isConfirmed = window.confirm(confirmPrompt);
    if (!isConfirmed) return;

    setProcessingId(venta.id);
    try {
      let sunatNote = '';

      // 1. Si tiene comprobante emitido hoy, anular ante SUNAT mediante NubeFact
      if (hasSunatInvoice && isToday) {
        const anulaRes = await anularComprobanteSunat(
          venta.tipo_documento as any,
          serie,
          numero,
          'Anulación por error en emisión de viaje especial'
        );

        if (anulaRes.success) {
          sunatNote = `\n\nSUNAT: ${anulaRes.sunatMessage || 'Comprobante dado de baja exitosamente en SUNAT.'}`;
        } else {
          sunatNote = `\n\nAviso SUNAT: ${anulaRes.error || 'No se pudo comunicar la baja a NubeFact'}`;
        }
      }

      // 2. Eliminar de Supabase
      const { error: delErr } = await supabase
        .from('ventas')
        .delete()
        .eq('id', venta.id);

      if (delErr) {
        console.warn('Error al eliminar de Supabase:', delErr);
        throw delErr;
      }

      // 3. Limpiar de caché local si estuviera
      const localPending: VentaRow[] = JSON.parse(localStorage.getItem('local_pending_ventas') || '[]');
      const updatedLocal = localPending.filter(v => v.id !== venta.id);
      localStorage.setItem('local_pending_ventas', JSON.stringify(updatedLocal));

      // 4. Actualizar estado local
      setVentas(prev => prev.filter(v => v.id !== venta.id));
      alert(`La venta especial fue eliminada correctamente.${sunatNote}`);
    } catch (err: any) {
      console.error('Error al eliminar venta especial:', err);
      alert(`No se pudo eliminar la venta especial: ${err.message || 'Error en la base de datos'}`);
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

      alert('Copia de seguridad (Backup Completo) descargada con éxito en tu computadora o celular.');
    } catch (err) {
      console.error('Error al exportar backup:', err);
      alert('Ocurrió un error al generar la copia de seguridad.');
    }
  };

  const handleResendEmail = async (venta: VentaRow) => {
    if (!venta.email) {
      alert('Esta venta no tiene un correo electrónico registrado.');
      return;
    }
    const confirm = window.confirm(`¿Deseas reenviar los comprobantes y boleto de viaje a ${venta.email}?`);
    if (!confirm) return;

    try {
      setProcessingId(venta.id);

      const isRUC = venta.tipo_documento === 'RUC';
      const serie = isRUC ? 'F001' : 'B001';
      const numComp = venta.nro_comprobante || `${serie}-${String(parseInt(venta.id.replace(/\D/g, '').slice(-4) || '1', 10)).padStart(4, '0')}`;

      const is6 = venta.culqi_charge_id?.includes('6P') || (venta.viajes as any)?.vehiculos?.total_asientos_pasajero === 6 || venta.numero_asiento > 5;
      const vehiculoLabel = is6 ? 'Camioneta (6 Pasajeros)' : 'Auto (4 Pasajeros)';

      const invoiceData = {
        ventaId: venta.id,
        tipoDocumento: venta.tipo_documento,
        nroDocumento: venta.nro_documento,
        nombres: venta.nombres,
        apellidos: venta.apellidos,
        razonSocial: venta.razon_social,
        direccionFiscal: venta.direccion_fiscal,
        descripcionOpcional: venta.descripcion_opcional,
        origen: venta.viajes?.rutas?.origen || 'CUSCO',
        destino: venta.viajes?.rutas?.destino || 'QUILLABAMBA',
        asiento: venta.numero_asiento,
        monto: venta.monto_pagado,
        fechaViaje: venta.viajes?.fecha_viaje || '',
        horaViaje: venta.viajes?.hora_viaje || '',
        metodoPago: venta.metodo_pago || 'YAPE',
        vehiculo: vehiculoLabel
      };

      // 1. Generar Boleto PDF
      const ticketBlob = generateTicketPDF(invoiceData).output('blob');

      // 2. Generar Factura/Boleta PDF fallback
      const invoiceBlob = generateInvoicePDF(invoiceData).output('blob');

      const sunatData = venta.comprobante_url ? {
        pdfUrl: venta.comprobante_url,
        serie: isRUC ? 'F001' : 'B001',
        numero: parseInt(numComp.split('-')[1] || '1', 10)
      } : undefined;

      await sendDirectResend(venta, ticketBlob, sunatData, invoiceBlob);
      alert(`Comprobante y boleto de viaje reenviados exitosamente al correo: ${venta.email}`);
    } catch (err: any) {
      console.error('Error reenviando correo:', err);
      alert(`Error al reenviar correo: ${err.message || err}`);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>Gestión de Ventas</h1>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {role === 'ADMIN' && (
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
          )}

          {role === 'ADMIN' && (
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
          )}

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
            <FaBell /> {notificationsEnabled ? 'Notificaciones Activas' : 'Activar Notificaciones'}
          </button>

          {(role === 'ADMIN' || role === 'CONTADOR') && (
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
          )}
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
              <option value="PENDIENTE">Pendientes por Confirmar</option>
              <option value="EMITIDO">Confirmados / Emitidos</option>
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
              <option value="TODOS">Todas las Rutas (Regulares y Especiales)</option>
              <option value="TODAS_ESPECIALES">Todos los Viajes Especiales</option>
              <option value="TODAS_REGULARES">Todas las Salidas Regulares</option>

              {rutasEspeciales.length > 0 && (
                <optgroup label="─── Rutas Especiales Registradas ───">
                  {rutasEspeciales.map(r => (
                    <option key={`esp-${r}`} value={`ESP:${r}`}>
                      {r} (Especial)
                    </option>
                  ))}
                </optgroup>
              )}

              <optgroup label="─── Rutas de Salidas Regulares ───">
                {rutasRegulares.map(r => (
                  <option key={`reg-${r}`} value={`REG:${r}`}>
                    {r}
                  </option>
                ))}
              </optgroup>
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
              <th>ID / Fecha Compra</th>
              <th>Viaje</th>
              <th>Asiento</th>
              <th>Pasajero</th>
              <th>Contacto</th>
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
              <tr><td colSpan={11} style={{ textAlign: 'center' }}>Cargando ventas...</td></tr>
            ) : filteredVentas.length === 0 ? (
              <tr><td colSpan={11} style={{ textAlign: 'center', color: '#64748b', padding: '25px' }}>No se encontraron ventas con los filtros seleccionados</td></tr>
            ) : (
              filteredVentas.map((v) => {
                const isYape = v.metodo_pago === 'YAPE' || (v.culqi_charge_id && v.culqi_charge_id.startsWith('YAPE-'));
                const opCode = v.nro_operacion || (v.culqi_charge_id && v.culqi_charge_id.startsWith('YAPE-') ? v.culqi_charge_id.split('|')[0].replace('YAPE-', '') : v.culqi_charge_id);
                const isFactura = v.tipo_documento === 'RUC';
                const { origen, destino, isSpecial } = getSaleRoute(v);

                return (
                  <tr key={v.id}>
                    <td>
                      <span style={{ fontSize: '0.82em', color: '#666', fontFamily: 'monospace', fontWeight: 'bold' }}>
                        {v.id.substring(0, 8)}...
                      </span>
                      <div 
                        style={{ 
                          fontSize: '0.78em', 
                          color: '#0f4c81', 
                          fontWeight: 700, 
                          marginTop: '4px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '4px',
                          background: '#f1f5f9',
                          padding: '2px 6px',
                          borderRadius: '6px',
                          width: 'fit-content'
                        }}
                        title="Fecha y Hora exacta de la compra realizada"
                      >
                        <FaClock style={{ color: '#742284', fontSize: '0.9em', flexShrink: 0 }} />
                        {v.created_at ? new Date(v.created_at).toLocaleString('es-PE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true
                        }) : '—'}
                      </div>
                    </td>
                    <td>
                      <strong>{origen} - {destino}</strong>
                      {isSpecial && (
                        <span style={{ 
                          marginLeft: '6px', 
                          backgroundColor: '#FAF5FF', 
                          color: '#742284', 
                          fontWeight: 'bold', 
                          fontSize: '0.75em', 
                          padding: '2px 5px', 
                          borderRadius: '4px',
                          border: '1px solid #E9D5FF',
                          display: 'inline-block'
                        }}>
                          Especial
                        </span>
                      )}
                      <br/>
                      <small style={{ color: '#7f8c8d' }}>
                        {v.viajes?.fecha_viaje || v.created_at?.substring(0, 10)} {v.viajes?.hora_viaje || ''}
                      </small>
                    </td>
                    <td>
                      {v.numero_asiento <= 0 || v.culqi_charge_id?.includes('ESPECIAL') ? (
                        <span style={{ 
                          backgroundColor: '#FAF5FF', 
                          color: '#742284', 
                          fontWeight: '800', 
                          padding: '3px 8px', 
                          borderRadius: '6px',
                          border: '1px solid #E9D5FF',
                          fontSize: '0.85em',
                          display: 'inline-block'
                        }}>
                          Especial
                        </span>
                      ) : (
                        `#${v.numero_asiento}`
                      )}
                    </td>
                    <td>
                      <strong>{v.nombres} {v.apellidos}</strong>
                    </td>
                    <td>
                      {v.telefono ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <a 
                            href={`tel:${v.telefono}`} 
                            style={{ color: '#0f4c81', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85em' }}
                            title="Llamar por teléfono"
                          >
                            <FaPhone style={{ fontSize: '0.8em' }} /> {v.telefono}
                          </a>
                          <a 
                            href={`https://wa.me/51${v.telefono.replace(/\D/g, '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ color: '#16a34a', display: 'inline-flex', alignItems: 'center', fontSize: '0.95em' }}
                            title="Contactar por WhatsApp"
                          >
                            <FaWhatsapp />
                          </a>
                        </div>
                      ) : (
                        <div style={{ color: '#94a3b8', fontSize: '0.78em', marginBottom: '2px' }}>Sin teléfono</div>
                      )}

                      {v.email ? (
                        <a 
                          href={`mailto:${v.email}`} 
                          style={{ color: '#475569', fontSize: '0.8em', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', wordBreak: 'break-all' }}
                          title="Enviar correo"
                        >
                          <FaEnvelope style={{ fontSize: '0.85em', color: '#742284', flexShrink: 0 }} /> {v.email}
                        </a>
                      ) : (
                        <div style={{ color: '#94a3b8', fontSize: '0.78em' }}>Sin correo</div>
                      )}
                    </td>
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
                            {isAnulado ? 'Anulado' : 'Aceptado'}
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          {/* Botón 1: Boleto de Viaje PDF con tipo de vehículo */}
                          <button
                            onClick={() => handleDownloadTicketPDF(v)}
                            title="Ver o Descargar Boleto de Viaje (PDF con datos del vehículo)"
                            className="admin-btn"
                            style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: '6px', padding: '5px 8px', fontSize: '0.78em', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                          >
                            <FaFilePdf /> Boleto
                          </button>

                          {/* Botón 2: Factura / Boleta Electrónica Oficial NubeFact */}
                          <button
                            onClick={() => handleOpenOrGenerateSunatPDF(v)}
                            title="Ver o Generar Comprobante Electrónico Oficial SUNAT / NubeFact (PDF)"
                            disabled={processingId === v.id}
                            className="admin-btn"
                            style={{ background: '#0f4c81', color: '#fff', border: 'none', borderRadius: '6px', padding: '5px 8px', fontSize: '0.78em', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                          >
                            <FaFilePdf /> {processingId === v.id ? '...' : (v.tipo_documento === 'RUC' ? 'Factura' : 'Boleta')}
                          </button>

                          {/* Botón 2b: XML del Comprobante Electrónico */}
                          {(() => {
                            const xmlUrl = v.comprobante_xml_url || (v.comprobante_url && v.comprobante_url.includes('nubefact.com') ? v.comprobante_url.replace(/\.pdf(\?.*)?$/i, '.xml$1') : null);
                            if (!xmlUrl || !v.comprobante_emitido) return null;
                            return (
                              <button
                                onClick={() => window.open(xmlUrl, '_blank')}
                                title="Descargar o Ver XML del Comprobante Electrónico SUNAT / NubeFact"
                                className="admin-btn"
                                style={{ background: '#742284', color: '#fff', border: 'none', borderRadius: '6px', padding: '5px 8px', fontSize: '0.78em', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                              >
                                <FaServer /> XML
                              </button>
                            );
                          })()}

                          {/* Botón 3: Confirmar o Reenviar */}
                          {v.comprobante_emitido ? (
                            <button
                              onClick={() => handleResendEmail(v)}
                              title="Reenviar Boleta/Factura y Boleto de Viaje por Correo Electrónico"
                              disabled={processingId === v.id || !v.email}
                              className="admin-btn"
                              style={{ background: '#742284', color: '#fff', border: 'none', borderRadius: '6px', padding: '5px 8px', fontSize: '0.78em', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                            >
                              <FaPaperPlane /> {processingId === v.id ? '...' : 'Enviar'}
                            </button>
                          ) : (
                            <button 
                              className="admin-btn" 
                              style={{ padding: '5px 8px', fontSize: '0.78em', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                              onClick={() => handleConfirmPayment(v)}
                              disabled={processingId === v.id}
                              title="Confirmar pago y emitir comprobante + boleto"
                            >
                              <FaPaperPlane /> {processingId === v.id ? '...' : 'Confirmar'}
                            </button>
                          )}

                          {/* Botón 4: Eliminar Venta/Factura Especial (SOLO EN VIAJES ESPECIALES) */}
                          {isSpecial && (
                            <button
                              onClick={() => handleDeleteSpecialSale(v)}
                              title="Eliminar esta venta o factura especial por equivocación al generarla"
                              disabled={processingId === v.id}
                              className="admin-btn"
                              style={{ 
                                background: '#dc2626', 
                                color: '#ffffff', 
                                border: 'none', 
                                borderRadius: '6px', 
                                padding: '5px 8px', 
                                fontSize: '0.78em', 
                                cursor: 'pointer', 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '4px', 
                                fontWeight: 600,
                                boxShadow: '0 1px 3px rgba(220, 38, 38, 0.25)'
                              }}
                            >
                              <FaTrash /> {processingId === v.id ? '...' : 'Eliminar'}
                            </button>
                          )}
                        </div>

                        {v.comprobante_emitido ? (
                          <span style={{ color: '#16a34a', fontSize: '0.75em', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                            <FaCheck /> Confirmado {v.nro_comprobante ? `(${v.nro_comprobante})` : ''}
                          </span>
                        ) : (
                          <button 
                            className="admin-btn" 
                            style={{ padding: '3px 6px', fontSize: '0.72em', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', alignSelf: 'flex-start' }}
                            onClick={() => handleRejectPayment(v)}
                            disabled={processingId === v.id}
                            title="Rechazar pago y liberar asiento"
                          >
                            <FaTimes /> Rechazar
                          </button>
                        )}
                      </div>
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
