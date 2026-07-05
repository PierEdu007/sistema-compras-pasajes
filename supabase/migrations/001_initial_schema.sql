-- ============================================================
-- MIGRATION 001: Schema Inicial — Sistema de Pasajes
-- Inversiones K'intu | Cusco - Quillabamba
-- ============================================================

-- ============================================================
-- 1. TABLAS
-- ============================================================

-- Catálogo de rutas
CREATE TABLE rutas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origen TEXT NOT NULL,
  destino TEXT NOT NULL,
  duracion_estimada INTERVAL,
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_rutas_unicas ON rutas(origen, destino);

-- Catálogo de vehículos
CREATE TABLE vehiculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL UNIQUE,
  nombre_display TEXT NOT NULL,
  total_asientos_pasajero INTEGER NOT NULL,
  layout_json JSONB NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Viajes programados
CREATE TABLE viajes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ruta_id UUID NOT NULL REFERENCES rutas(id) ON DELETE RESTRICT,
  vehiculo_id UUID NOT NULL REFERENCES vehiculos(id) ON DELETE RESTRICT,
  fecha_viaje DATE NOT NULL,
  hora_viaje TIME NOT NULL,
  precio_base NUMERIC(10,2) NOT NULL,
  estado TEXT NOT NULL DEFAULT 'ACTIVO' 
    CHECK (estado IN ('ACTIVO', 'COMPLETADO', 'CANCELADO')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para búsqueda rápida de viajes por ruta y fecha
CREATE INDEX idx_viajes_busqueda ON viajes(ruta_id, fecha_viaje, estado);
-- Un vehículo no puede estar en dos viajes activos al mismo momento
CREATE UNIQUE INDEX idx_viaje_vehiculo_unico 
  ON viajes(vehiculo_id, fecha_viaje, hora_viaje) 
  WHERE estado = 'ACTIVO';

-- Bloqueo temporal de asientos (6 minutos de tolerancia)
CREATE TABLE asientos_bloqueos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viaje_id UUID NOT NULL REFERENCES viajes(id) ON DELETE CASCADE,
  numero_asiento INTEGER NOT NULL,
  estado TEXT NOT NULL DEFAULT 'BLOQUEADO'
    CHECK (estado IN ('BLOQUEADO', 'PAGADO')),
  expira_at TIMESTAMPTZ NOT NULL,
  sesion_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Solo puede haber UN bloqueo activo (no expirado) por asiento+viaje
CREATE UNIQUE INDEX idx_bloqueo_activo_unico 
  ON asientos_bloqueos(viaje_id, numero_asiento) 
  WHERE estado = 'BLOQUEADO' AND expira_at > NOW();

-- Asientos pagados también deben ser únicos por viaje
CREATE UNIQUE INDEX idx_asiento_pagado_unico 
  ON asientos_bloqueos(viaje_id, numero_asiento) 
  WHERE estado = 'PAGADO';

-- Índice para limpiar bloqueos expirados eficientemente
CREATE INDEX idx_bloqueos_expiracion ON asientos_bloqueos(expira_at) 
  WHERE estado = 'BLOQUEADO';

-- Ventas confirmadas
CREATE TABLE ventas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viaje_id UUID NOT NULL REFERENCES viajes(id) ON DELETE RESTRICT,
  numero_asiento INTEGER NOT NULL,
  tipo_documento TEXT NOT NULL 
    CHECK (tipo_documento IN ('DNI', 'RUC', 'CE', 'PASAPORTE')),
  nro_documento TEXT NOT NULL,
  nombres TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT NOT NULL,
  monto_pagado NUMERIC(10,2) NOT NULL,
  culqi_charge_id TEXT NOT NULL UNIQUE,
  comprobante_emitido BOOLEAN NOT NULL DEFAULT FALSE,
  comprobante_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Un asiento no puede venderse dos veces para el mismo viaje
CREATE UNIQUE INDEX idx_venta_asiento_unico ON ventas(viaje_id, numero_asiento);
-- Índice para el contador: ventas pendientes de comprobante
CREATE INDEX idx_ventas_pendientes ON ventas(comprobante_emitido) 
  WHERE comprobante_emitido = FALSE;

-- Roles de usuario (ADMIN vs CONTADOR)
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  rol TEXT NOT NULL CHECK (rol IN ('ADMIN', 'CONTADOR')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Rutas: lectura pública de rutas activas
ALTER TABLE rutas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rutas_lectura_publica" ON rutas 
  FOR SELECT USING (activa = TRUE);
CREATE POLICY "rutas_admin_full" ON rutas 
  FOR ALL USING (auth.role() = 'authenticated');

-- Vehículos: lectura pública de vehículos activos
ALTER TABLE vehiculos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vehiculos_lectura_publica" ON vehiculos 
  FOR SELECT USING (activo = TRUE);
CREATE POLICY "vehiculos_admin_full" ON vehiculos 
  FOR ALL USING (auth.role() = 'authenticated');

-- Viajes: lectura pública de viajes activos futuros
ALTER TABLE viajes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "viajes_lectura_publica" ON viajes 
  FOR SELECT USING (estado = 'ACTIVO' AND fecha_viaje >= CURRENT_DATE);
CREATE POLICY "viajes_admin_full" ON viajes 
  FOR ALL USING (auth.role() = 'authenticated');

-- Bloqueos: lectura pública (para el mapa de asientos en tiempo real)
ALTER TABLE asientos_bloqueos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bloqueos_lectura_publica" ON asientos_bloqueos 
  FOR SELECT USING (
    (estado = 'PAGADO') OR 
    (estado = 'BLOQUEADO' AND expira_at > NOW())
  );
-- Las inserciones/updates se hacen vía Edge Functions (service_role key)

-- Ventas: solo usuarios autenticados
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ventas_lectura_auth" ON ventas 
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "ventas_update_auth" ON ventas 
  FOR UPDATE USING (auth.role() = 'authenticated');
-- Las inserciones se hacen vía Edge Functions (service_role key)

-- User roles: solo el propio usuario puede leer su rol
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roles_lectura_propia" ON user_roles 
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- 3. REALTIME
-- ============================================================

-- Habilitar realtime para la tabla de bloqueos (mapa de asientos en vivo)
ALTER PUBLICATION supabase_realtime ADD TABLE asientos_bloqueos;

-- ============================================================
-- 4. FUNCIONES AUXILIARES
-- ============================================================

-- Función para obtener asientos disponibles de un viaje
CREATE OR REPLACE FUNCTION obtener_asientos_disponibles(p_viaje_id UUID)
RETURNS TABLE(numero_asiento INTEGER, estado TEXT) 
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_total_asientos INTEGER;
BEGIN
  -- Obtener total de asientos del vehículo asignado al viaje
  SELECT v.total_asientos_pasajero INTO v_total_asientos
  FROM viajes vj
  JOIN vehiculos v ON v.id = vj.vehiculo_id
  WHERE vj.id = p_viaje_id;

  -- Devolver cada asiento con su estado
  RETURN QUERY
  SELECT 
    s.n AS numero_asiento,
    COALESCE(
      CASE 
        WHEN ab.estado = 'PAGADO' THEN 'PAGADO'
        WHEN ab.estado = 'BLOQUEADO' AND ab.expira_at > NOW() THEN 'BLOQUEADO'
        ELSE NULL
      END,
      'DISPONIBLE'
    ) AS estado
  FROM generate_series(1, v_total_asientos) AS s(n)
  LEFT JOIN asientos_bloqueos ab 
    ON ab.viaje_id = p_viaje_id 
    AND ab.numero_asiento = s.n
    AND (
      ab.estado = 'PAGADO' 
      OR (ab.estado = 'BLOQUEADO' AND ab.expira_at > NOW())
    );
END;
$$;

-- Función para bloquear un asiento (llamada desde Edge Functions)
CREATE OR REPLACE FUNCTION bloquear_asiento(
  p_viaje_id UUID,
  p_numero_asiento INTEGER,
  p_sesion_token TEXT,
  p_minutos INTEGER DEFAULT 6
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_bloqueo_id UUID;
BEGIN
  -- Primero liberar cualquier bloqueo previo de esta sesión
  DELETE FROM asientos_bloqueos 
  WHERE sesion_token = p_sesion_token 
    AND estado = 'BLOQUEADO';

  -- Intentar insertar el nuevo bloqueo
  INSERT INTO asientos_bloqueos (viaje_id, numero_asiento, estado, expira_at, sesion_token)
  VALUES (
    p_viaje_id, 
    p_numero_asiento, 
    'BLOQUEADO', 
    NOW() + (p_minutos || ' minutes')::INTERVAL, 
    p_sesion_token
  )
  RETURNING id INTO v_bloqueo_id;

  RETURN v_bloqueo_id;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'ASIENTO_NO_DISPONIBLE: El asiento % ya está ocupado o bloqueado', p_numero_asiento;
END;
$$;

-- ============================================================
-- 5. SEED DATA
-- ============================================================

-- Rutas
INSERT INTO rutas (origen, destino, duracion_estimada) VALUES
  ('CUSCO', 'QUILLABAMBA', '6 hours'),
  ('QUILLABAMBA', 'CUSCO', '6 hours'),
  ('QUILLABAMBA', 'KITENI', '3 hours'),
  ('KITENI', 'QUILLABAMBA', '3 hours');

-- Vehículos
INSERT INTO vehiculos (tipo, nombre_display, total_asientos_pasajero, layout_json) VALUES
  (
    'RENAULT_MASTER', 
    'Renault Master', 
    15, 
    '{
      "filas": [
        {"fila": 1, "asientos": [{"n": 1, "pos": "izq"}, {"n": 2, "pos": "der"}], "nota": "Fila frontal (conductor excluido)"},
        {"fila": 2, "asientos": [{"n": 3, "pos": "izq"}, {"n": 4, "pos": "cen"}, {"n": 5, "pos": "der"}]},
        {"fila": 3, "asientos": [{"n": 6, "pos": "izq"}, {"n": 7, "pos": "cen"}, {"n": 8, "pos": "der"}]},
        {"fila": 4, "asientos": [{"n": 9, "pos": "izq"}, {"n": 10, "pos": "cen"}, {"n": 11, "pos": "der"}]},
        {"fila": 5, "asientos": [{"n": 12, "pos": "izq"}, {"n": 13, "pos": "cen-izq"}, {"n": 14, "pos": "cen-der"}, {"n": 15, "pos": "der"}]}
      ]
    }'::JSONB
  ),
  (
    'SUZUKI_ERTIGA', 
    'Suzuki Ertiga', 
    8, 
    '{
      "filas": [
        {"fila": 1, "asientos": [{"n": 1, "pos": "izq"}, {"n": 2, "pos": "der"}], "nota": "Fila frontal (conductor excluido)"},
        {"fila": 2, "asientos": [{"n": 3, "pos": "izq"}, {"n": 4, "pos": "cen"}, {"n": 5, "pos": "der"}]},
        {"fila": 3, "asientos": [{"n": 6, "pos": "izq"}, {"n": 7, "pos": "cen"}, {"n": 8, "pos": "der"}]}
      ]
    }'::JSONB
  );

-- Viajes de ejemplo (para la semana actual)
-- Se insertan al crear el proyecto de Supabase desde el panel admin
