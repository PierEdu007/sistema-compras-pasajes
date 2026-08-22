-- ============================================================
-- MIGRATION 004: Security Hardening — RLS & Constraints
-- Inversiones Tunky Chasky S.R.L.
-- Fecha: Agosto 2026
-- ============================================================

-- ============================================================
-- 1. RESTRINGIR PERMISOS EN TABLA "ventas"
-- ============================================================

-- Eliminar política de UPDATE público (cualquier anónimo podía modificar ventas)
DROP POLICY IF EXISTS "ventas_update_public" ON ventas;

-- Nueva política: solo usuarios autenticados pueden actualizar ventas
CREATE POLICY "ventas_update_authenticated_only" ON ventas
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Nota: Mantenemos "ventas_insert_public" porque el flujo de compra
-- inserta ventas desde el endpoint serverless (registrar-venta.js)
-- que usa service_role_key cuando está disponible.

-- Nota: Mantenemos "ventas_lectura_public" (SELECT) porque el flujo
-- de confirmación necesita leer la venta recién creada por su ID.
-- El riesgo se mitiga porque los datos expuestos (nombre, asiento, monto)
-- no son sensibles y no incluyen contraseñas ni tokens.

-- ============================================================
-- 2. CONSTRAINT UNIQUE EN nro_operacion (Anti-Reutilización Yape)
-- ============================================================

-- Prevenir que un mismo código de operación de Yape se use para múltiples ventas.
-- Se usa un índice parcial porque nro_operacion puede ser NULL (ventas por tarjeta).
CREATE UNIQUE INDEX IF NOT EXISTS idx_ventas_nro_operacion_unico
  ON ventas(nro_operacion)
  WHERE nro_operacion IS NOT NULL
    AND nro_operacion != ''
    AND nro_operacion NOT LIKE 'YAPE-%';
-- Nota: Se excluyen los IDs autogenerados tipo "YAPE-1724..." que son timestamps.

-- ============================================================
-- 3. RESTRINGIR DELETE EN asientos_bloqueos (Solo Autenticados)
-- ============================================================

-- Eliminar política de DELETE público en bloqueos
DROP POLICY IF EXISTS "bloqueos_delete_public" ON asientos_bloqueos;

-- Nueva política: DELETE solo por usuarios autenticados o service_role
CREATE POLICY "bloqueos_delete_authenticated_only" ON asientos_bloqueos
  FOR DELETE USING (auth.role() = 'authenticated');

-- Nota: El INSERT público de bloqueos se mantiene porque el flujo de
-- selección de asientos necesita crear bloqueos temporales (6 min).
-- El endpoint serverless registrar-venta.js usa service_role para DELETE.
