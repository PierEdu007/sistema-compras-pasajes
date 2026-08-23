/**
 * Servicio de Integración con Facturación Electrónica SUNAT (PSE / Nubefact / Facturador Pro)
 * INVERSIONES TUNKY CHASKY S.R.L. - RUC 20613271701
 */

export interface SunatConfig {
  enabled: boolean;
  apiUrl: string;
  apiToken: string;
  serieBoleta: string; // ej: B001
  serieFactura: string; // ej: F001
  tipoIgv: number; // 8 = Exonerado, 1 = Gravado 18%
}

export interface SunatVentaData {
  ventaId: string;
  tipoDocumento: 'DNI' | 'RUC' | 'CE' | 'PASAPORTE';
  nroDocumento: string;
  nombres: string;
  apellidos: string;
  email?: string;
  razonSocial?: string;
  direccionFiscal?: string;
  descripcionOpcional?: string;
  dniPasajero?: string;
  origen: string;
  destino: string;
  asiento: number;
  monto: number;
  fechaViaje: string;
  horaViaje: string;
}

export interface SunatResponse {
  success: boolean;
  serie?: string;
  numero?: number;
  pdfUrl?: string;
  xmlUrl?: string;
  cdrUrl?: string;
  qrCode?: string;
  sunatMessage?: string;
  error?: string;
}

const DEFAULT_CONFIG_KEY = 'sunat_pse_config';

// Cargar configuración guardada de Nubefact / PSE
export function getSunatConfig(): SunatConfig {
  const envApiUrl = (import.meta.env.VITE_NUBEFACT_API_URL as string) || '';
  const envApiToken = (import.meta.env.VITE_NUBEFACT_API_TOKEN as string) || '';

  const saved = localStorage.getItem(DEFAULT_CONFIG_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return {
          enabled: parsed.enabled ?? true,
          apiUrl: parsed.apiUrl || envApiUrl,
          apiToken: parsed.apiToken || envApiToken,
          serieBoleta: parsed.serieBoleta || 'BBB1',
          serieFactura: parsed.serieFactura || 'FFF1',
          tipoIgv: parsed.tipoIgv ?? 8
        };
      }
    } catch (_e) {
      // Fallback
    }
  }
  return {
    enabled: true, // Habilitado por defecto para usar variables de entorno en el servidor
    apiUrl: envApiUrl,
    apiToken: envApiToken,
    serieBoleta: 'BBB1',
    serieFactura: 'FFF1',
    tipoIgv: 8 // Exonerado por ley de transporte terrestre de pasajeros (IGV 0%)
  };
}

// Guardar configuración de Nubefact / PSE
export function saveSunatConfig(config: SunatConfig): void {
  localStorage.setItem(DEFAULT_CONFIG_KEY, JSON.stringify(config));
}

/**
 * Emitir Comprobante Electrónico (Boleta o Factura) directamente a SUNAT mediante API PSE
 */
export async function emitirComprobanteSunat(data: SunatVentaData, customConfig?: SunatConfig): Promise<SunatResponse> {
  const config = customConfig || getSunatConfig();

  if (config.enabled === false) {
    return {
      success: false,
      error: 'La facturación automática a SUNAT está deshabilitada en la configuración.'
    };
  }

  const isFactura = data.tipoDocumento === 'RUC';
  const tipoComprobante = isFactura ? 1 : 2; // 1 = Factura, 2 = Boleta
  const serie = isFactura ? (config.serieFactura || 'FFF1') : (config.serieBoleta || 'BBB1');

  // Mapeo de Tipo de Documento según código SUNAT:
  // 1 = DNI, 6 = RUC, 4 = CE, 7 = PASAPORTE
  let docTipoSunat = 1;
  if (data.tipoDocumento === 'RUC') docTipoSunat = 6;
  else if (data.tipoDocumento === 'CE') docTipoSunat = 4;
  else if (data.tipoDocumento === 'PASAPORTE') docTipoSunat = 7;

  const clienteNombre = isFactura && data.razonSocial 
    ? data.razonSocial 
    : `${data.nombres} ${data.apellidos}`.trim();

  // Usar ventaId como base pero con sufijo único para evitar colisiones en reintentos
  const codigoUnico = data.ventaId
    ? `${data.ventaId.slice(0, 8)}-${serie}-${Date.now()}`
    : `VENTA-${serie}-${Date.now()}`;

  const nowPeru = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date()); // YYYY-MM-DD
  const [yyyy, mm, dd] = nowPeru.split('-');
  const fechaEmisionNubeFact = `${dd}-${mm}-${yyyy}`;

  const payload = {
    operacion: 'generar_comprobante',
    tipo_de_comprobante: tipoComprobante,
    serie: serie,
    codigo_unico: codigoUnico,
    sunat_transaction: 1, // Venta Interna
    cliente_tipo_de_documento: docTipoSunat,
    cliente_numero_de_documento: data.nroDocumento,
    cliente_denominacion: clienteNombre,
    cliente_direccion: data.direccionFiscal || 'CUSCO',
    cliente_email: data.email || 'reservas@turismotunkychasky.com.pe',
    fecha_de_emision: fechaEmisionNubeFact,
    moneda: 1, // Soles (PEN)
    porcentaje_de_igv: config.tipoIgv === 1 ? 18.00 : 0.00,
    total_igv: 0.00,
    total_gravada: config.tipoIgv === 1 ? (data.monto / 1.18).toFixed(2) : 0.00,
    total_exonerada: config.tipoIgv === 8 ? data.monto.toFixed(2) : 0.00,
    total_inafecta: 0.00,
    total: data.monto.toFixed(2),
    enviar_auto_al_cliente: false, // Tunky Chasky envía el correo vía Resend con PDF adjunto
    items: [
      {
        unidad_de_medida: 'ZZ', // Servicio
        codigo: `PAS-${data.asiento}`,
        descripcion: `SERVICIO DE TRANSPORTE ${data.origen} - ${data.destino} PASAJERO: ${data.nombres} ${data.apellidos} ${data.tipoDocumento}.${data.nroDocumento} ASIENTO #${data.asiento}${data.descripcionOpcional ? ' - ' + data.descripcionOpcional : (data.dniPasajero ? ' - DNI ' + data.dniPasajero : '')}`.toUpperCase(),
        cantidad: 1,
        valor_unitario: config.tipoIgv === 1 ? (data.monto / 1.18).toFixed(2) : data.monto.toFixed(2),
        precio_unitario: data.monto.toFixed(2),
        subtotal: data.monto.toFixed(2),
        tipo_de_igv: config.tipoIgv,
        igv: config.tipoIgv === 1 ? (data.monto - (data.monto / 1.18)).toFixed(2) : 0.00,
        total: data.monto.toFixed(2)
      }
    ]
  };

  try {
    let result: any;
    let ok = false;

    // 1. Intentar enviar vía Proxy en dev/prod (Evita CORS en navegador)
    try {
      const proxyRes = await fetch('/api/emitir-comprobante', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiUrl: config.apiUrl,
          apiToken: config.apiToken,
          payload
        })
      });

      result = await proxyRes.json();
      ok = proxyRes.ok;
    } catch (_pErr) {
      console.warn('Proxy local/serverless falló, intentando fetch directo:', _pErr);
      // Fallback: Fetch directo a NubeFact
      try {
        const directRes = await fetch(config.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiToken}`
          },
          body: JSON.stringify(payload)
        });
        result = await directRes.json();
        ok = directRes.ok;
      } catch (dErr: any) {
        console.error('Fetch directo a NubeFact falló por CORS:', dErr);
        return {
          success: false,
          error: 'Servicio de Facturación Electrónica no disponible temporalmente en este entorno (CORS / Red).'
        };
      }
    }

    if (!ok || result.errors || result.error) {
      const errMsg = typeof result.errors === 'string' 
        ? result.errors 
        : (result.message || result.error || (result.errors ? JSON.stringify(result.errors) : ''));
      
      // Auto-reintento con serie alternativa si la serie configurada no está autorizada en NubeFact
      if (result.codigo === 21 || errMsg.toLowerCase().includes('serie') || errMsg.toLowerCase().includes('autorizada')) {
        const altSerie = isFactura 
          ? (serie === 'FFF1' ? 'F001' : 'FFF1')
          : (serie === 'BBB1' ? 'B001' : 'BBB1');
        console.warn(`NubeFact: reintentando emisión con serie alternativa ${altSerie}...`);
        try {
          const retryPayload = { ...payload, serie: altSerie };
          const retryRes = await fetch('/api/emitir-comprobante', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              apiUrl: config.apiUrl,
              apiToken: config.apiToken,
              payload: retryPayload
            })
          });
          if (retryRes.ok) {
            const retryResult = await retryRes.json();
            if (!retryResult.errors && retryResult.enlace_del_pdf) {
              return {
                success: true,
                serie: retryResult.serie,
                numero: retryResult.numero,
                pdfUrl: retryResult.enlace_del_pdf,
                xmlUrl: retryResult.enlace_del_xml,
                cdrUrl: retryResult.enlace_del_cdr,
                qrCode: retryResult.cadena_para_codigo_qr,
                sunatMessage: retryResult.sunat_description || 'Comprobante emitido correctamente'
              };
            }
          }
        } catch (_rErr) {
          console.warn('Error en reintento de serie alternativa:', _rErr);
        }
      }

      // Código 4 = "Código único ya está en uso" — el comprobante ya fue emitido antes.
      // Recuperar el comprobante existente consultándolo por codigo_unico.
      if (result.codigo === 4 || errMsg.toLowerCase().includes('único') || errMsg.toLowerCase().includes('ya est')) {
        console.warn('NubeFact: código único en uso, consultando comprobante existente...');
        try {
          const consultaRes = await fetch('/api/emitir-comprobante', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              apiUrl: config.apiUrl,
              apiToken: config.apiToken,
              payload: {
                operacion: 'consultar_comprobante',
                tipo_de_comprobante: tipoComprobante,
                serie: serie,
                codigo_unico: codigoUnico
              }
            })
          });
          if (consultaRes.ok) {
            const consulta = await consultaRes.json();
            if (consulta.enlace_del_pdf) {
              return {
                success: true,
                serie: consulta.serie,
                numero: consulta.numero,
                pdfUrl: consulta.enlace_del_pdf,
                xmlUrl: consulta.enlace_del_xml,
                cdrUrl: consulta.enlace_del_cdr,
                qrCode: consulta.cadena_para_codigo_qr,
                sunatMessage: 'Comprobante recuperado de NubeFact'
              };
            }
          }
        } catch (_cErr) {
          console.warn('Error consultando comprobante existente:', _cErr);
        }
      }
      return {
        success: false,
        error: errMsg || 'Error en la respuesta del proveedor SUNAT / NubeFact'
      };
    }

    return {
      success: true,
      serie: result.serie,
      numero: result.numero,
      pdfUrl: result.enlace_del_pdf,
      xmlUrl: result.enlace_del_xml,
      cdrUrl: result.enlace_del_cdr,
      qrCode: result.cadena_para_codigo_qr,
      sunatMessage: result.sunat_description || 'Comprobante emitido correctamente'
    };
  } catch (err: any) {
    console.error('Error enviando comprobante a API SUNAT:', err);
    return {
      success: false,
      error: err.message || 'Error de conexión con la API de facturación SUNAT'
    };
  }
}

/**
 * Anular Comprobante Electrónico (Comunicación de Baja ante SUNAT)
 */
export async function anularComprobanteSunat(
  tipoComprobante: 'BOLETA' | 'FACTURA',
  serie: string,
  numero: number,
  motivo: string,
  customConfig?: SunatConfig
): Promise<SunatResponse> {
  const config = customConfig || getSunatConfig();

  if (!config.enabled || !config.apiUrl || !config.apiToken) {
    return {
      success: false,
      error: 'Facturación SUNAT no configurada.'
    };
  }

  const payload = {
    operacion: 'generar_anulacion',
    tipo_de_comprobante: tipoComprobante === 'FACTURA' ? 1 : 2,
    serie: serie,
    numero: numero,
    motivo: motivo || 'Cancelación de viaje a solicitud del pasajero'
  };

  try {
    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiToken}`
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok || result.errors) {
      return {
        success: false,
        error: result.errors || result.message || 'Error al anular en SUNAT'
      };
    }

    return {
      success: true,
      pdfUrl: result.enlace_del_pdf,
      xmlUrl: result.enlace_del_xml,
      cdrUrl: result.enlace_del_cdr,
      sunatMessage: result.sunat_description || 'Comprobante Anulado Correctamente ante SUNAT'
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Error de comunicación al anular con SUNAT'
    };
  }
}
