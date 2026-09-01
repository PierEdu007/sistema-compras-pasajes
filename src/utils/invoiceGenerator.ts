import { jsPDF } from 'jspdf';

export interface InvoiceData {
  ventaId: string;
  tipoDocumento: 'DNI' | 'RUC' | 'CE' | 'PASAPORTE';
  nroDocumento: string;
  nombres: string;
  apellidos: string;
  razonSocial?: string;
  direccionFiscal?: string;
  descripcionOpcional?: string;
  origen: string;
  destino: string;
  asiento: number;
  monto: number;
  fechaViaje: string;
  horaViaje: string;
  metodoPago?: string;
  vehiculo?: string;
}

// Convert numbers to Spanish words
function numberToWordsPE(num: number): string {
  const entero = Math.floor(num);
  const centavos = Math.round((num - entero) * 100);
  const centavosStr = String(centavos).padStart(2, '0');

  const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE', 'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const decenas = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const cientos = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  let texto = '';

  if (entero === 0) texto = 'CERO';
  else if (entero === 100) texto = 'CIEN';
  else if (entero < 20) texto = unidades[entero];
  else if (entero < 100) {
    const d = Math.floor(entero / 10);
    const u = entero % 10;
    texto = decenas[d] + (u > 0 ? ' Y ' + unidades[u] : '');
  } else if (entero < 1000) {
    const c = Math.floor(entero / 100);
    const rest = entero % 100;
    texto = cientos[c] + (rest > 0 ? ' ' + numberToWordsPE(rest).replace(/ Y SOL/g, '') : '');
  } else {
    texto = String(entero);
  }

  return `${texto} CON ${centavosStr}/100 SOLES`;
}

// Genera la Boleta o Factura Electrónica en PDF (Modelo Tunky Chasky)
export function generateInvoicePDF(data: InvoiceData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 220]
  });

  const isFactura = data.tipoDocumento === 'RUC';
  const comprobanteTipo = isFactura ? 'Factura Electrónica' : 'Boleta Electrónica';
  const serie = isFactura ? 'F001' : 'B001';
  const correlativo = String(Math.abs(data.ventaId.split('-')[1] ? parseInt(data.ventaId.split('-')[1]) % 100000 : Math.floor(Math.random() * 90000 + 10000))).padStart(8, '0');
  const numeroComprobante = `${serie}-${correlativo}`;

  const today = new Date();
  const fechaEmision = today.toISOString().split('T')[0];
  const horaEmision = today.toTimeString().split(' ')[0];

  let y = 10;

  // Header Banner Text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(116, 34, 132); // Purple primary
  doc.text("INVERSIONES TUNKY CHASKY S.R.L.", 40, y, { align: 'center' });
  y += 4;
  doc.setFontSize(7);
  doc.setTextColor(60, 60, 60);
  doc.text("SOCIEDAD COMERCIAL DE RESPONSABILIDAD LIMITADA", 40, y, { align: 'center' });
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text("RUC 20608425676", 40, y, { align: 'center' });
  y += 3.5;
  doc.text("Av. 25 De Julio S/N, Santa Ana, La Convención, Cusco", 40, y, { align: 'center' });
  y += 3.5;
  doc.text("Central telefónica: -927670020 | tunkychasky@gmail.com", 40, y, { align: 'center' });
  y += 5;

  // Separator line
  doc.setDrawColor(200, 200, 200);
  doc.line(5, y, 75, y);
  y += 4;

  // Document Title Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(comprobanteTipo, 40, y, { align: 'center' });
  y += 4.5;
  doc.setFontSize(10);
  doc.text(numeroComprobante, 40, y, { align: 'center' });
  y += 5;

  doc.line(5, y, 75, y);
  y += 4;

  // Invoice Meta Info
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text("F. Emisión:", 5, y);
  doc.setFont('helvetica', 'normal');
  doc.text(fechaEmision, 24, y);

  doc.setFont('helvetica', 'bold');
  doc.text("H. Emisión:", 45, y);
  doc.setFont('helvetica', 'normal');
  doc.text(horaEmision, 60, y);
  y += 4;

  const clienteNombre = isFactura 
    ? (data.razonSocial || `${data.nombres} ${data.apellidos}`)
    : `${data.nombres} ${data.apellidos}`;

  doc.setFont('helvetica', 'bold');
  doc.text("Cliente:", 5, y);
  doc.setFont('helvetica', 'normal');
  const clienteLines = doc.splitTextToSize(clienteNombre.toUpperCase(), 50);
  doc.text(clienteLines, 24, y);
  y += (clienteLines.length * 3.5);

  doc.setFont('helvetica', 'bold');
  doc.text(`${data.tipoDocumento}:`, 5, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.nroDocumento, 24, y);
  y += 4;

  if (isFactura && data.direccionFiscal) {
    doc.setFont('helvetica', 'bold');
    doc.text("Dirección:", 5, y);
    doc.setFont('helvetica', 'normal');
    const dirLines = doc.splitTextToSize(data.direccionFiscal, 50);
    doc.text(dirLines, 24, y);
    y += (dirLines.length * 3.5);
  }

  doc.line(5, y, 75, y);
  y += 4;

  // Items Table Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.text("Cant", 5, y);
  doc.text("Unid", 12, y);
  doc.text("Descripción", 22, y);
  doc.text("P.U.", 58, y);
  doc.text("Total", 70, y);
  y += 3;
  doc.line(5, y, 75, y);
  y += 3.5;

  // Item Row
  doc.setFont('helvetica', 'normal');
  doc.text("1", 6, y);
  doc.text("UND", 12, y);

  const isSpecial = data.asiento === 0 || (data as any).esViajeEspecial;
  const itemDesc = data.descripcionOpcional && data.descripcionOpcional.trim().length > 0
    ? data.descripcionOpcional.trim()
    : (isSpecial
        ? `SERVICIO DE TRANSPORTE ${data.origen} ${data.destino}`
        : `SERVICIO DE TRANSPORTE ${data.origen} - ${data.destino} PASAJERO: ${data.nombres} ${data.apellidos} ${data.tipoDocumento}.${data.nroDocumento} ASIENTO #${data.asiento}`);
  const descLines = doc.splitTextToSize(itemDesc.toUpperCase(), 34);
  doc.text(descLines, 22, y);

  doc.text(data.monto.toFixed(2), 58, y);
  doc.text(data.monto.toFixed(2), 70, y);

  y += Math.max(descLines.length * 3.5, 6);

  doc.line(5, y, 75, y);
  y += 4;

  // Totals
  doc.setFont('helvetica', 'bold');
  doc.text("Op. Exoneradas: S/", 45, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.monto.toFixed(2), 70, y, { align: 'right' });
  y += 3.5;

  doc.setFont('helvetica', 'bold');
  doc.text("IGV: S/", 45, y);
  doc.setFont('helvetica', 'normal');
  doc.text("0.00", 70, y, { align: 'right' });
  y += 3.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text("Total a pagar: S/", 45, y);
  doc.text(data.monto.toFixed(2), 70, y, { align: 'right' });
  y += 5;

  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  const wordsText = `Son: ${numberToWordsPE(data.monto)}`;
  const wordsLines = doc.splitTextToSize(wordsText, 70);
  doc.text(wordsLines, 5, y);
  y += (wordsLines.length * 3.5) + 2;

  // Footer Hash & QR info
  doc.line(5, y, 75, y);
  y += 3.5;

  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'bold');
  doc.text("Código hash:", 5, y);
  doc.setFont('helvetica', 'normal');
  doc.text("FyajBHiINOSRJP0BJHDTVVvKM2c=", 22, y);
  y += 3.5;

  doc.setFont('helvetica', 'bold');
  doc.text("Condición de Pago:", 5, y);
  doc.setFont('helvetica', 'normal');
  doc.text("Contado", 26, y);
  y += 3.5;

  doc.setFont('helvetica', 'bold');
  doc.text("Pagos:", 5, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.metodoPago || 'Yape'} - S/ ${data.monto.toFixed(2)}`, 16, y);
  y += 5;

  doc.setFontSize(5);
  doc.setTextColor(100, 100, 100);
  const footerLines = doc.splitTextToSize(`Representación impresa de la ${comprobanteTipo.toUpperCase()} que puede ser consultada en la web corporativa.`, 70);
  doc.text(footerLines, 40, y, { align: 'center' });

  return doc;
}

// Genera el Boleto de Viaje del Pasajero en PDF
export function generateTicketPDF(data: InvoiceData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 180]
  });

  let y = 10;

  // Header Banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(116, 34, 132);
  doc.text("BOLETO DE VIAJE", 40, y, { align: 'center' });
  y += 4.5;

  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  doc.text("INVERSIONES TUNKY CHASKY S.R.L.", 40, y, { align: 'center' });
  y += 3.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(`Ticket N° #${data.ventaId.substring(0, 8).toUpperCase()}`, 40, y, { align: 'center' });
  y += 5;

  doc.setDrawColor(200, 200, 200);
  doc.line(5, y, 75, y);
  y += 4;

  // Ticket Body
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text("PASAJERO:", 5, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.nombres} ${data.apellidos}`.toUpperCase(), 24, y);
  y += 4;

  doc.setFont('helvetica', 'bold');
  doc.text("DOCUMENTO:", 5, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.tipoDocumento}: ${data.nroDocumento}`, 24, y);
  y += 4;

  doc.setFont('helvetica', 'bold');
  doc.text("ORIGEN - DESTINO:", 5, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.origen} ➔ ${data.destino}`, 28, y);
  y += 4;

  const vehiculoLabel = data.vehiculo || (data.asiento > 5 ? 'Camioneta (6 Pasajeros)' : 'Auto (4 Pasajeros)');
  doc.setFont('helvetica', 'bold');
  doc.text("TIPO DE VEHÍCULO:", 5, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 76, 129);
  doc.text(vehiculoLabel.toUpperCase(), 30, y);
  y += 4;

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text("ASIENTO SELECCIONADO:", 5, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(116, 34, 132);
  doc.text(`# ${data.asiento}`, 42, y);
  y += 4;

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text("FECHA DE VIAJE:", 5, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.fechaViaje} - ${data.horaViaje.substring(0, 5)}`, 28, y);
  y += 4;

  doc.setFont('helvetica', 'bold');
  doc.text("MONTO PAGADO:", 5, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`S/ ${data.monto.toFixed(2)} (${data.metodoPago || 'YAPE'})`, 28, y);
  y += 5;

  doc.line(5, y, 75, y);
  y += 4;

  // Conditions
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text("CONDICIONES DEL SERVICIO:", 5, y);
  y += 3;
  const condText = "• Presentarse 30 minutos antes del embarque con su DNI físico.\n• Equipaje permitido: 25kg por pasajero.\n• No se admiten cambios ni devoluciones 1 hora antes del viaje.";
  const condLines = doc.splitTextToSize(condText, 70);
  doc.text(condLines, 5, y);

  return doc;
}
