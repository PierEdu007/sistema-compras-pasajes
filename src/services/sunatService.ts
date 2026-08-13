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
  const saved = localStorage.getItem(DEFAULT_CONFIG_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (_e) {
      // Fallback
    }
  }
  return {
    enabled: true,
    apiUrl: 'https://api.nubefact.com/api/v1/ad363ac5-880b-4f3f-be7a-247d2908a9d6',
    apiToken: '3c4fcc1af04b48b4b3fe291e485c1fa061857d24cc8143ce9d73f312b4836cbc',
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

  if (!config.enabled || !config.apiUrl || !config.apiToken) {
    return {
      success: false,
      error: 'La facturación automática a SUNAT no está habilitada o faltan las credenciales API de Nubefact/PSE.'
    };
  }

  const isFactura = data.tipoDocumento === 'RUC';
  const tipoComprobante = isFactura ? 1 : 2; // 1 = Factura, 2 = Boleta
  const serie = isFactura ? (config.serieFactura || 'F001') : (config.serieBoleta || 'B001');

  // Mapeo de Tipo de Documento según código SUNAT:
  // 1 = DNI, 6 = RUC, 4 = CE, 7 = PASAPORTE
  let docTipoSunat = 1;
  if (data.tipoDocumento === 'RUC') docTipoSunat = 6;
  else if (data.tipoDocumento === 'CE') docTipoSunat = 4;
  else if (data.tipoDocumento === 'PASAPORTE') docTipoSunat = 7;

  const clienteNombre = isFactura && data.razonSocial 
    ? data.razonSocial 
    : `${data.nombres} ${data.apellidos}`.trim();

  const payload = {
    operacion: 'generar_comprobante',
    tipo_de_comprobante: tipoComprobante,
    serie: serie,
    codigo_unico: data.ventaId || `VENTA-${Date.now()}`,
    sunat_transaction: 1, // Venta Interna
    cliente_tipo_de_documento: docTipoSunat,
    cliente_numero_de_documento: data.nroDocumento,
    cliente_denominacion: clienteNombre,
    cliente_direccion: data.direccionFiscal || 'CUSCO',
    cliente_email: data.email || 'reservas@turismotunkychasky.com.pe',
    fecha_de_emision: new Date().toISOString().split('T')[0],
    moneda: 1, // Soles (PEN)
    porcentaje_de_igv: config.tipoIgv === 1 ? 18.00 : 0.00,
    total_igv: 0.00,
    total_gravada: config.tipoIgv === 1 ? (data.monto / 1.18).toFixed(2) : 0.00,
    total_exonerada: config.tipoIgv === 8 ? data.monto.toFixed(2) : 0.00,
    total_inafecta: 0.00,
    total: data.monto.toFixed(2),
    enviar_auto_al_cliente: true,
    items: [
      {
        unidad_de_medida: 'ZZ', // Servicio
        codigo: `PAS-${data.asiento}`,
        descripcion: `Pasaje Terrestre ${data.origen} -> ${data.destino} (Asiento #${data.asiento} - ${data.fechaViaje} ${data.horaViaje})`,
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

    // 1. Intentar primero enviar vía Serverless Proxy en Cloudflare (CORS-Free)
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
      if (proxyRes.ok) {
        result = await proxyRes.json();
        ok = true;
      }
    } catch (_pErr) {
      console.warn('Proxy serverless no disponible, haciendo fetch directo:', _pErr);
    }

    // 2. Fallback: Fetch directo a NubeFact
    if (!ok) {
      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiToken}`
        },
        body: JSON.stringify(payload)
      });
      result = await response.json();
      ok = response.ok;
    }

    if (!ok || result.errors) {
      return {
        success: false,
        error: typeof result.errors === 'string' ? result.errors : (result.message || 'Error en la respuesta del proveedor SUNAT')
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
      sunatMessage: result.sunat_description || 'Comprobante emitido y aceptado por SUNAT'
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
