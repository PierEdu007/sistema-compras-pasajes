-- Migración 003: Habilitar Realtime e Inserción para Ventas
-- INVERSIONES TUNKY CHASKY S.R.L.

-- 1. Permitir inserción y lectura de ventas tanto anónima como autenticada
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ventas_insert_public" ON ventas;
CREATE POLICY "ventas_insert_public" ON ventas 
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "ventas_lectura_public" ON ventas;
CREATE POLICY "ventas_lectura_public" ON ventas 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "ventas_update_public" ON ventas;
CREATE POLICY "ventas_update_public" ON ventas 
  FOR UPDATE USING (true);

-- 2. Habilitar inserción y lectura de bloqueos para evitar fallos de RLS
ALTER TABLE asientos_bloqueos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bloqueos_insert_public" ON asientos_bloqueos;
CREATE POLICY "bloqueos_insert_public" ON asientos_bloqueos 
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "bloqueos_delete_public" ON asientos_bloqueos;
CREATE POLICY "bloqueos_delete_public" ON asientos_bloqueos 
  FOR DELETE USING (true);

-- 3. Habilitar Realtime para la tabla ventas (para que la app y la web reciban alertas en vivo)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'ventas'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE ventas;
  END IF;
END $$;
