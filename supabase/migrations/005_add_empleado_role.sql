-- ============================================================
-- MIGRATION 005: Agregar Rol EMPLEADO / VENDEDOR
-- Inversiones Tunky Chasky S.R.L.
-- ============================================================

-- 1. Actualizar el CHECK constraint de la tabla user_roles
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_rol_check;

ALTER TABLE user_roles ADD CONSTRAINT user_roles_rol_check 
  CHECK (rol IN ('ADMIN', 'CONTADOR', 'EMPLEADO', 'VENDEDOR'));

-- 2. Asegurar que las políticas RLS permitan a cualquier usuario autenticado 
-- consultar su propio rol
DROP POLICY IF EXISTS "user_roles_read_own" ON user_roles;
CREATE POLICY "user_roles_read_own" ON user_roles
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'authenticated');

-- 3. Documentación de Roles:
-- • ADMIN: Acceso total (Dashboard, Ventas, Viajes, Contabilidad, Configuración SUNAT)
-- • EMPLEADO / VENDEDOR: Acceso a Ventas en Agencia, Confirmación de Pagos y Gestión de Viajes/Rutas
-- • CONTADOR: Acceso a Ventas y Reportes Contables
