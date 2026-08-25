import { jsPDF } from 'jspdf';

export interface AccountingData {
  mesNombre: string; // ej. "JULIO 2026"
  mesCodigo: string; // ej. "jul-26"
  empresaNombre: string; // "INVERSIONES TUNKI CHASKY SRL"
  ruc: string; // "20608425676" o "20613271701"
  
  // Ventas del mes (calculado automáticamente)
  ventas18Base: number;
  ventas18Igv: number;
  ventasNoGravadas: number; // Pasajes interprovinciales
  ventas10Base: number;

  // Compras del mes (ingresado por el contador/admin)
  compras18Base: number;
  compras18Igv: number;
  compras10Base: number;

  // Saldos anteriores
  igvFavorAnterior: number;
  saldoRetencionesAnteriores: number;

  // Impuesto a la Renta
  tasaRenta: number; // ej. 1.0%
  rentaFavorAnterior: number;

  // Honorarios
  incluirHonorarios?: boolean;
  honorariosMonto: number;
  honorariosNombre: string;
  honorariosBcp: string;
  honorariosCci: string;
  fechaVencimiento: string;
}

export function generateAccountingPDF(data: AccountingData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const darkTextColor = '#1f2937';

  // --- PÁGINA 1 ---

  // Membrete Superior
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(217, 119, 6); // Naranja Proinnova
  doc.text('proinnova', 15, 20);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Asesoría Empresarial & Facturación Electrónica', 15, 25);

  // Línea divisoria naranja
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.8);
  doc.line(15, 28, 195, 28);

  // Título del Reporte
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 58, 138); // Azul
  doc.text(`REPORTE CONTABLE ${data.mesNombre.toUpperCase()}`, 105, 38, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(darkTextColor);
  doc.text(data.empresaNombre.toUpperCase(), 105, 45, { align: 'center' });

  doc.setFontSize(11);
  doc.text(`R.U.C: ${data.ruc}`, 105, 51, { align: 'center' });

  // Párrafo introductorio
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(
    'Reciba un cordial saludo a nombre de nuestro equipo de trabajo, así mismo, tener en cuenta la siguiente información importante:',
    15,
    60
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('REPORTE DE PAGOS A REALIZAR EN EL PRESENTE MES', 15, 67);
  doc.setFont('helvetica', 'normal');
  doc.text('a) Los pagos de contabilidad del presente mes, con la información obtenida son:', 15, 73);

  // Cálculos de Resumen
  const igvVentas = data.ventas18Igv;
  const igvCompras = data.compras18Igv;
  const igvBruto = igvVentas - igvCompras;
  const igvFinal = igvBruto - data.igvFavorAnterior - data.saldoRetencionesAnteriores;

  const totalIngresos = data.ventas18Base + data.ventasNoGravadas + data.ventas10Base;
  const rentaCalculada = totalIngresos * (data.tasaRenta / 100);
  const rentaFinal = rentaCalculada - data.rentaFavorAnterior;

  // Resumen Renta e IGV
  doc.setFontSize(9.5);
  doc.text('Impuesto a la renta a pagar del periodo es:', 30, 82);
  doc.setTextColor(rentaFinal <= 0 ? 220 : 0, rentaFinal <= 0 ? 38 : 0, 38);
  doc.setFont('helvetica', 'bold');
  doc.text(`S/ ${Math.abs(rentaFinal).toLocaleString('es-PE', { minimumFractionDigits: 2 })} ${rentaFinal <= 0 ? 'A FAVOR' : 'A PAGAR'}`, 175, 82, { align: 'right' });

  doc.setTextColor(darkTextColor);
  doc.setFont('helvetica', 'normal');
  doc.text('Impuesto general a las ventas a favor es:', 30, 88);
  doc.setTextColor(igvFinal <= 0 ? 220 : 0, igvFinal <= 0 ? 38 : 0, 38);
  doc.setFont('helvetica', 'bold');
  doc.text(`S/ ${Math.abs(igvFinal).toLocaleString('es-PE', { minimumFractionDigits: 2 })} ${igvFinal <= 0 ? 'A FAVOR' : 'A PAGAR'}`, 175, 88, { align: 'right' });

  doc.setTextColor(darkTextColor);

  // TABLA 1: LIQUIDACIÓN DE IGV
  const totalVentas = data.ventas18Base + data.ventas18Igv + data.ventasNoGravadas;
  const totalCompras = data.compras18Base + data.compras18Igv;

  const docAny = doc as any;

  if (typeof docAny.autoTable === 'function') {
    docAny.autoTable({
      startY: 96,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 9
      },
      styles: { fontSize: 8.5, cellPadding: 2, textColor: [31, 41, 55] },
      head: [['CONCEPTOS', 'BASE IMP.', 'IGV', 'TOTAL']],
      body: [
        ['VENTAS 18%', `S/ ${data.ventas18Base.toFixed(2)}`, `S/ ${data.ventas18Igv.toFixed(2)}`, `S/ ${totalVentas.toFixed(2)}`],
        ['no gravadas', `S/ ${data.ventasNoGravadas.toFixed(2)}`, '', ''],
        ['10%', 'S/ -', 'S/ -', ''],
        ['COMPRAS 18%', `S/ ${data.compras18Base.toFixed(2)}`, `S/ ${data.compras18Igv.toFixed(2)}`, `S/ ${totalCompras.toFixed(2)}`],
        ['10%', 'S/ -', 'S/ -', ''],
        [{ content: 'IGV A FAVOR / A PAGAR', styles: { fontStyle: 'bold' } }, '', `S/ ${igvBruto.toFixed(2)}`, ''],
        ['IGV A FAVOR DEL PERIODO ANTERIOR', '', `S/ -${data.igvFavorAnterior.toFixed(2)}`, ''],
        ['SALDO A FAVOR DE RETENCIONES ANTERIORES', '', `S/ ${data.saldoRetencionesAnteriores.toFixed(2)}`, ''],
        [
          { content: 'TOTAL DE IGV A FAVOR / A PAGAR', styles: { fontStyle: 'bold', textColor: [30, 58, 138] } },
          '',
          { content: `S/ ${Math.abs(igvFinal).toFixed(2)} ${igvFinal <= 0 ? 'A FAVOR' : ''}`, styles: { fontStyle: 'bold', textColor: [30, 58, 138] } },
          ''
        ]
      ]
    });
  }

  // TABLA 2: IMPUESTO A LA RENTA
  const finalY1 = docAny.lastAutoTable ? docAny.lastAutoTable.finalY : 160;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 58, 138);
  doc.text('IMPUESTO A LA RENTA', 105, finalY1 + 10, { align: 'center' });

  if (typeof docAny.autoTable === 'function') {
    docAny.autoTable({
      startY: finalY1 + 14,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 9
      },
      styles: { fontSize: 8.5, cellPadding: 2, textColor: [31, 41, 55] },
      head: [['CONCEPTOS', 'IMPORTE']],
      body: [
        ['INGRESOS NETOS', `S/ ${totalIngresos.toFixed(2)}`],
        [`RENTA ${data.tasaRenta.toFixed(1)}%`, `S/ ${rentaCalculada.toFixed(2)}`],
        ['SALDO FAVOR DEL PERIODO ANTERIOR', `S/ ${data.rentaFavorAnterior.toFixed(2)}`],
        [
          { content: 'TOTAL DE RENTA A PAGAR', styles: { fontStyle: 'bold', textColor: [30, 58, 138] } },
          { content: `S/ ${rentaFinal.toFixed(2)}`, styles: { fontStyle: 'bold', textColor: [30, 58, 138] } }
        ]
      ]
    });
  }

  // Pie de Página 1
  const page1Y = 270;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('WhatsApp: +51 927 670 019 | Email: tunkychaskyoficial@gmail.com', 15, page1Y);
  doc.text('Direccion: Av. Antonio Lorena 318, Santiago, Cusco', 15, page1Y + 5);

  // Decorative Bottom Accent Bar
  doc.setFillColor(30, 58, 138);
  doc.rect(15, page1Y + 9, 100, 4, 'F');
  doc.setFillColor(217, 119, 6);
  doc.rect(115, page1Y + 9, 80, 4, 'F');


  // --- PÁGINA 2 ---
  doc.addPage();

  // Membrete Página 2
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(217, 119, 6);
  doc.text('proinnova', 15, 20);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Asesoría Empresarial & Facturación Electrónica', 15, 25);

  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.8);
  doc.line(15, 28, 195, 28);

  // TABLA 3: HONORARIOS CONTABLES O GESTIÓN INTERNA
  const esHonorarioInterno = data.incluirHonorarios === false || data.honorariosMonto === 0;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(esHonorarioInterno ? 30 : 220, esHonorarioInterno ? 58 : 38, esHonorarioInterno ? 138 : 38);
  doc.text(
    esHonorarioInterno ? 'DECLARACIÓN Y GESTIÓN CONTABLE INTERNA' : 'HONORARIOS CONTABLES Y DECLARACIÓN',
    105,
    42,
    { align: 'center' }
  );

  if (typeof docAny.autoTable === 'function') {
    docAny.autoTable({
      startY: 48,
      theme: 'grid',
      headStyles: {
        fillColor: esHonorarioInterno ? [30, 58, 138] : [220, 38, 38],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 9
      },
      styles: { fontSize: 9, cellPadding: 3, textColor: [31, 41, 55] },
      head: [['DECLARACION', 'IMPORTE']],
      body: [
        [data.mesCodigo, esHonorarioInterno ? 'S/ 0.00 (Gestión Interna)' : `S/ ${data.honorariosMonto.toFixed(2)}`],
        ['GASTOS ADMINISTRATIVOS', 'S/ -'],
        [
          { content: 'TOTAL A PAGAR', styles: { fontStyle: 'bold' } },
          { content: esHonorarioInterno ? 'S/ 0.00' : `S/ ${data.honorariosMonto.toFixed(2)}`, styles: { fontStyle: 'bold' } }
        ]
      ]
    });
  }

  const finalY2 = docAny.lastAutoTable ? docAny.lastAutoTable.finalY : 80;

  // Cuentas de Abono (Solo si hay honorarios de contador externo)
  if (!esHonorarioInterno) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text(`CUENTA BCP: ${data.honorariosBcp}`, 105, finalY2 + 15, { align: 'center' });
    doc.text(`CCI: ${data.honorariosCci}`, 105, finalY2 + 22, { align: 'center' });
    doc.text(`TITULAR: ${data.honorariosNombre.toUpperCase()}`, 105, finalY2 + 29, { align: 'center' });
  }

  // Fecha Vencimiento y Nota
  doc.setFontSize(11);
  doc.setTextColor(30, 58, 138);
  doc.text(`FECHA DE VENCIMIENTO SUNAT: ${data.fechaVencimiento}`, 105, finalY2 + 42, { align: 'center' });

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkTextColor);
  doc.text('Estos montos son calculados a la fecha de vencimiento.', 105, finalY2 + 52, { align: 'center' });
  doc.text('Hacemos de su conocimiento dicha situación para evitar responsabilidades de nuestra parte.', 105, finalY2 + 58, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('¡MUCHAS GRACIAS!', 105, finalY2 + 70, { align: 'center' });

  // Pie de Página 2
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('WhatsApp: +51 927 670 019 | Email: tunkychaskyoficial@gmail.com', 15, page1Y);
  doc.text('Direccion: Av. Antonio Lorena 318, Santiago, Cusco', 15, page1Y + 5);

  doc.setFillColor(30, 58, 138);
  doc.rect(15, page1Y + 9, 100, 4, 'F');
  doc.setFillColor(217, 119, 6);
  doc.rect(115, page1Y + 9, 80, 4, 'F');

  return doc;
}
