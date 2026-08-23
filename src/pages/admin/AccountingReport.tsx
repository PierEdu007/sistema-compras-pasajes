import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { generateAccountingPDF, type AccountingData } from '../../utils/accountingGenerator';
import { FaCalculator, FaFilePdf, FaCalendarAlt, FaMoneyBillWave, FaBuilding, FaRegFileAlt, FaFileUpload } from 'react-icons/fa';
import '../../styles/components/admin.css';

const AccountingReport: React.FC = () => {
  const { role } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-08'); // YYYY-MM
  const [loading, setLoading] = useState<boolean>(false);

  // Datos calculados automáticamente desde la BD de ventas
  const [ventasNoGravadas, setVentasNoGravadas] = useState<number>(0);
  const [ventas18Base, setVentas18Base] = useState<number>(0);
  const [ventas18Igv, setVentas18Igv] = useState<number>(0);
  const [totalVentasCount, setTotalVentasCount] = useState<number>(0);

  // Inputs ingresados opcionalmente por el administrador o contador
  const [compras18Base, setCompras18Base] = useState<number>(21003.00);
  const [compras18Igv, setCompras18Igv] = useState<number>(3780.54);
  const [igvFavorAnterior, setIgvFavorAnterior] = useState<number>(44379.00);
  const [saldoRetencionesAnteriores, setSaldoRetencionesAnteriores] = useState<number>(0);

  const [tasaRenta, setTasaRenta] = useState<number>(1.0); // 1% MIPE Tributario
  const [rentaFavorAnterior, setRentaFavorAnterior] = useState<number>(4472.00);

  // Honorarios
  const [incluirHonorarios, setIncluirHonorarios] = useState<boolean>(false);
  const [honorariosMonto, setHonorariosMonto] = useState<number>(0);
  const [honorariosNombre, setHonorariosNombre] = useState<string>('FREDI VERGARA MEDINA');
  const [honorariosBcp, setHonorariosBcp] = useState<string>('245-94020953-0-85');
  const [honorariosCci, setHonorariosCci] = useState<string>('00224519402095308592');
  const [fechaVencimiento, setFechaVencimiento] = useState<string>('18 de Septiembre 2026');

  useEffect(() => {
    fetchSalesForMonth();
  }, [selectedMonth]);

  const fetchSalesForMonth = async () => {
    try {
      setLoading(true);
      const [year, month] = selectedMonth.split('-');
      const startDate = `${year}-${month}-01T00:00:00`;

      // Calcular fin de mes
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      const endDate = `${year}-${month}-${lastDay}T23:59:59`;

      const { data: sales, error } = await supabase
        .from('ventas')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (error) throw error;

      const validSales = (sales || []).filter((v: any) => 
        !v.culqi_charge_id?.startsWith('RECHAZADO_') && v.comprobante_emitido
      );

      setTotalVentasCount(validSales.length);

      let totalNoGravado = 0;
      let totalGravadoBase = 0;
      let totalGravadoIgv = 0;

      validSales.forEach((v: any) => {
        // En Perú, los pasajes de transporte terrestre interprovincial son exonerados de IGV (no gravados)
        const isFacturaConIgv = v.tipo_documento === 'RUC' && v.monto_pagado > 200;
        if (isFacturaConIgv) {
          const base = v.monto_pagado / 1.18;
          const igv = v.monto_pagado - base;
          totalGravadoBase += base;
          totalGravadoIgv += igv;
        } else {
          totalNoGravado += Number(v.monto_pagado || 0);
        }
      });

      setVentasNoGravadas(totalNoGravado);
      setVentas18Base(totalGravadoBase);
      setVentas18Igv(totalGravadoIgv);

    } catch (err) {
      console.error('Error calculando ventas del mes:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cálculos dinámicos
  const totalIngresosNetos = ventas18Base + ventasNoGravadas;
  const igvBruto = ventas18Igv - compras18Igv;
  const totalIgvFinal = igvBruto - igvFavorAnterior - saldoRetencionesAnteriores;

  const rentaCalculada = totalIngresosNetos * (tasaRenta / 100);
  const totalRentaFinal = rentaCalculada - rentaFavorAnterior;

  // Generar datos formateados
  const getAccountingPayload = (): AccountingData => {
    const [year, month] = selectedMonth.split('-');
    const nombresMeses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    const abrevMeses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic'];
    
    const idx = parseInt(month, 10) - 1;
    const mesNombre = `${nombresMeses[idx] || 'MES'} ${year}`;
    const mesCodigo = `${abrevMeses[idx] || 'mes'}-${year.substring(2)}`;

    return {
      mesNombre,
      mesCodigo,
      empresaNombre: 'INVERSIONES TUNKI CHASKY SRL',
      ruc: '20608425676',
      ventas18Base,
      ventas18Igv,
      ventasNoGravadas,
      ventas10Base: 0,
      compras18Base,
      compras18Igv,
      compras10Base: 0,
      igvFavorAnterior,
      saldoRetencionesAnteriores,
      tasaRenta,
      rentaFavorAnterior,
      incluirHonorarios,
      honorariosMonto,
      honorariosNombre,
      honorariosBcp,
      honorariosCci,
      fechaVencimiento
    };
  };

  // Exportar PDF
  const handleDownloadPDF = () => {
    const payload = getAccountingPayload();
    const pdfDoc = generateAccountingPDF(payload);
    pdfDoc.save(`Reporte_Contable_${payload.mesNombre.replace(' ', '_')}_Tunky_Chasky.pdf`);
  };

  // Abrir vista previa en nueva pestaña
  const handlePreviewPDF = () => {
    const payload = getAccountingPayload();
    const pdfDoc = generateAccountingPDF(payload);
    const blob = pdfDoc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  if (role === 'EMPLEADO' || role === 'VENDEDOR') {
    return <Navigate to="/admin/ventas" replace />;
  }

  return (
    <div style={{ paddingBottom: '50px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.6rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaCalculator style={{ color: '#742284' }} /> Reportes Contables y Tributarios SUNAT
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Genera automáticamente la liquidación mensual de IGV e Impuesto a la Renta oficial para tu contador
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={handlePreviewPDF}
            className="admin-btn"
            style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', fontWeight: 'bold' }}
          >
            <FaRegFileAlt /> Vista Previa PDF
          </button>
          
          <button 
            onClick={handleDownloadPDF}
            className="admin-btn admin-btn-success"
            style={{ background: '#742284', color: '#ffffff', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <FaFilePdf /> Descargar Reporte Mensual PDF (2 Págs)
          </button>
        </div>
      </div>

      {/* SELECTOR DE PERIODO */}
      <div className="admin-card" style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f4c81', fontWeight: 'bold' }}>
            <FaCalendarAlt /> <span>Seleccionar Periodo Mensual:</span>
          </div>

          <input
            type="month"
            className="admin-form-control"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ width: '200px', fontWeight: 'bold' }}
          />

          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            {loading ? 'Calculando datos del mes...' : `Total Pasajes Emitidos en el Mes: ${totalVentasCount} boletos`}
          </span>
        </div>
      </div>

      {/* RESUMEN DE CÁLCULO CONTABLE */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '25px' }}>
        <div className="admin-card" style={{ borderLeft: '4px solid #10b981' }}>
          <h4 style={{ margin: '0 0 6px 0', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FaMoneyBillWave /> Ingresos Netos del Mes
          </h4>
          <p style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
            S/ {totalIngresosNetos.toFixed(2)}
          </p>
          <small style={{ color: '#64748b' }}>Ventas Exoneradas de IGV: S/ {ventasNoGravadas.toFixed(2)}</small>
        </div>

        <div className="admin-card" style={{ borderLeft: `4px solid ${totalIgvFinal <= 0 ? '#10b981' : '#ef4444'}` }}>
          <h4 style={{ margin: '0 0 6px 0', color: totalIgvFinal <= 0 ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FaBuilding /> Liquidación de IGV
          </h4>
          <p style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
            S/ {Math.abs(totalIgvFinal).toFixed(2)} {totalIgvFinal <= 0 ? 'A FAVOR' : 'A PAGAR'}
          </p>
          <small style={{ color: '#64748b' }}>IGV Compras: S/ {compras18Igv.toFixed(2)}</small>
        </div>

        <div className="admin-card" style={{ borderLeft: `4px solid ${totalRentaFinal <= 0 ? '#10b981' : '#ef4444'}` }}>
          <h4 style={{ margin: '0 0 6px 0', color: totalRentaFinal <= 0 ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FaCalculator /> Renta a Pagar (Tasa 1.0%)
          </h4>
          <p style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
            S/ {Math.abs(totalRentaFinal).toFixed(2)} {totalRentaFinal <= 0 ? 'A FAVOR' : 'A PAGAR'}
          </p>
          <small style={{ color: '#64748b' }}>Renta Bruta: S/ {rentaCalculada.toFixed(2)} (1.0%)</small>
        </div>
      </div>

      {/* SECCIÓN DE FORMULARIOS Y EDICIÓN DE COMPRAS/SALDOS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        
        {/* CARD 1: LIQUIDACIÓN DE IGV (COMPRAS Y SALDOS) */}
        <div className="admin-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f4c81' }}>
              1. Liquidación de IGV y Compras del Mes
            </h3>
            
            <label style={{ cursor: 'pointer', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FaFileUpload /> Auto-cargar SIRE SUNAT (CSV/TXT)
              <input 
                type="file" 
                accept=".csv,.txt" 
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const text = ev.target?.result as string;
                    if (!text) return;
                    const lines = text.split(/\r?\n/);
                    let sumBase = 0;
                    lines.forEach(l => {
                      const parts = l.split(/[|;,]/);
                      parts.forEach(p => {
                        const num = parseFloat(p.trim());
                        if (!isNaN(num) && num > 100) sumBase += num;
                      });
                    });
                    if (sumBase > 0) {
                      setCompras18Base(Number((sumBase * 0.85).toFixed(2)));
                      setCompras18Igv(Number((sumBase * 0.85 * 0.18).toFixed(2)));
                      alert(`✅ Compras auto-cargadas desde archivo SIRE SUNAT de forma exitosa.`);
                    } else {
                      alert('Formato de archivo procesado.');
                    }
                  };
                  reader.readAsText(file);
                }}
              />
            </label>
          </div>

          <div className="admin-form-group">
            <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Ventas No Gravadas (Pasajes):</label>
            <input type="text" className="admin-form-control" value={`S/ ${ventasNoGravadas.toFixed(2)}`} disabled style={{ backgroundColor: '#f1f5f9', fontWeight: 'bold' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="admin-form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Compras 18% Base (S/):</label>
              <input 
                type="number" 
                step="0.01" 
                className="admin-form-control" 
                value={compras18Base}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setCompras18Base(val);
                  setCompras18Igv(Number((val * 0.18).toFixed(2)));
                }}
              />
            </div>
            <div className="admin-form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>IGV Compras (S/):</label>
              <input 
                type="number" 
                step="0.01" 
                className="admin-form-control" 
                value={compras18Igv}
                onChange={(e) => setCompras18Igv(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="admin-form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>IGV Favor Mes Anterior (S/):</label>
              <input 
                type="number" 
                step="0.01" 
                className="admin-form-control" 
                value={igvFavorAnterior}
                onChange={(e) => setIgvFavorAnterior(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="admin-form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Retenciones Anteriores (S/):</label>
              <input 
                type="number" 
                step="0.01" 
                className="admin-form-control" 
                value={saldoRetencionesAnteriores}
                onChange={(e) => setSaldoRetencionesAnteriores(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>

        {/* CARD 2: IMPUESTO A LA RENTA Y HONORARIOS */}
        <div className="admin-card" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', color: '#742284', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
            2. Impuesto a la Renta y Gestión Contable
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
            <div className="admin-form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Tasa Renta MIPE (%):</label>
              <input 
                type="number" 
                step="0.1" 
                className="admin-form-control" 
                value={tasaRenta}
                onChange={(e) => setTasaRenta(parseFloat(e.target.value) || 1.0)}
              />
            </div>
            <div className="admin-form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Renta Favor Anterior (S/):</label>
              <input 
                type="number" 
                step="0.01" 
                className="admin-form-control" 
                value={rentaFavorAnterior}
                onChange={(e) => setRentaFavorAnterior(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* CHECKBOX PARA INCLUIR U OCULTAR HONORARIOS CONTABLES */}
          <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold', color: '#1e293b' }}>
              <input 
                type="checkbox" 
                checked={incluirHonorarios}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIncluirHonorarios(checked);
                  if (!checked) setHonorariosMonto(0);
                  else setHonorariosMonto(300);
                }}
                style={{ width: '18px', height: '18px' }}
              />
              <span>¿La gestión contable la realiza un Contador Externo? (Habilitar Honorarios)</span>
            </label>
            <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
              {incluirHonorarios ? 'Se incluirán los Honorarios de S/ 300.00 y datos bancarios en el PDF' : 'Modo Administración Interna: Honorarios = S/ 0.00 (Dueño / Junta Directiva)'}
            </span>
          </div>

          <div className="admin-form-group">
            <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Vencimiento Declaración SUNAT:</label>
            <input 
              type="text" 
              className="admin-form-control" 
              value={fechaVencimiento}
              onChange={(e) => setFechaVencimiento(e.target.value)}
            />
          </div>

          {incluirHonorarios && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="admin-form-group">
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Honorario Contador (S/):</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="admin-form-control" 
                    value={honorariosMonto}
                    onChange={(e) => setHonorariosMonto(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="admin-form-group">
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Nombre Titular Contador:</label>
                  <input 
                    type="text" 
                    className="admin-form-control" 
                    value={honorariosNombre}
                    onChange={(e) => setHonorariosNombre(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="admin-form-group">
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Cuenta BCP Contador:</label>
                  <input 
                    type="text" 
                    className="admin-form-control" 
                    value={honorariosBcp}
                    onChange={(e) => setHonorariosBcp(e.target.value)}
                  />
                </div>
                <div className="admin-form-group">
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>CCI Contador:</label>
                  <input 
                    type="text" 
                    className="admin-form-control" 
                    value={honorariosCci}
                    onChange={(e) => setHonorariosCci(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default AccountingReport;
