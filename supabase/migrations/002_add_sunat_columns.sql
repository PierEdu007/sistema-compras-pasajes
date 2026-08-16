-- Migración 002: Agregar columnas para comprobante SUNAT / NubeFact y datos adicionales
-- INVERSIONES TUNKY CHASKY S.R.L.

-- 1. Número de comprobante oficial (ej: BBB1-000003, FFF1-000001)
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS nro_comprobante TEXT;

-- 2. Estado SUNAT del comprobante (PENDIENTE, ACEPTADO, RECHAZADO)
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS estado_sunat TEXT DEFAULT 'PENDIENTE';

-- 3. Método de pago (YAPE, EFECTIVO, TARJETA, etc.)
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS metodo_pago TEXT DEFAULT 'YAPE';

-- 4. Estado general de la venta (PENDIENTE, CONFIRMADO, RECHAZADO)
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'PENDIENTE';

-- 5. Razón Social para facturas RUC
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS razon_social TEXT;

-- 6. Dirección fiscal para facturas RUC
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS direccion_fiscal TEXT;

-- 7. Descripción opcional adicional
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS descripcion_opcional TEXT;

-- Actualizar registros existentes: si comprobante_emitido = true, estado = CONFIRMADO
UPDATE ventas SET estado = 'CONFIRMADO' WHERE comprobante_emitido = TRUE;
UPDATE ventas SET estado = 'PENDIENTE' WHERE comprobante_emitido = FALSE;

-- Índice para búsqueda por nro_comprobante
CREATE INDEX IF NOT EXISTS idx_ventas_nro_comprobante ON ventas(nro_comprobante) WHERE nro_comprobante IS NOT NULL;
