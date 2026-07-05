/* ============================================================
   Database types for Supabase — Inversiones K'intu
   ============================================================ */

// ── Row types ────────────────────────────────────────────────

export interface Ruta {
  id: string;
  origen: string;
  destino: string;
  duracion_estimada: string | null;
  activa: boolean;
  created_at: string;
}

export interface VehiculoLayoutAsiento {
  n: number;
  pos: string;
}

export interface VehiculoLayoutFila {
  fila: number;
  asientos: VehiculoLayoutAsiento[];
  nota?: string;
}

export interface VehiculoLayout {
  filas: VehiculoLayoutFila[];
}

export interface Vehiculo {
  id: string;
  tipo: string;
  nombre_display: string;
  total_asientos_pasajero: number;
  layout_json: VehiculoLayout;
  activo: boolean;
}

export type EstadoViaje = 'ACTIVO' | 'COMPLETADO' | 'CANCELADO';

export interface Viaje {
  id: string;
  ruta_id: string;
  vehiculo_id: string;
  fecha_viaje: string;
  hora_viaje: string;
  precio_base: number;
  estado: EstadoViaje;
  created_at: string;
}

export type EstadoAsiento = 'BLOQUEADO' | 'PAGADO';

export interface AsientoBloqueo {
  id: string;
  viaje_id: string;
  numero_asiento: number;
  estado: EstadoAsiento;
  expira_at: string;
  sesion_token: string;
  created_at: string;
}

export type TipoDocumento = 'DNI' | 'RUC' | 'CE' | 'PASAPORTE';

export interface Venta {
  id: string;
  viaje_id: string;
  numero_asiento: number;
  tipo_documento: TipoDocumento;
  nro_documento: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  monto_pagado: number;
  culqi_charge_id: string;
  comprobante_emitido: boolean;
  comprobante_url: string | null;
  created_at: string;
}

export type Rol = 'ADMIN' | 'CONTADOR';

export interface UserRole {
  id: string;
  user_id: string;
  rol: Rol;
  created_at: string;
}

// ── Supabase Database generic type ──────────────────────────

/** Helper to build Table definitions for Supabase client generics. */
interface TableDefinition<T> {
  Row: T;
  Insert: Partial<T>;
  Update: Partial<T>;
}

export interface Database {
  public: {
    Tables: {
      rutas: TableDefinition<Ruta>;
      vehiculos: TableDefinition<Vehiculo>;
      viajes: TableDefinition<Viaje>;
      asiento_bloqueos: TableDefinition<AsientoBloqueo>;
      ventas: TableDefinition<Venta>;
      user_roles: TableDefinition<UserRole>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      estado_viaje: EstadoViaje;
      estado_asiento: EstadoAsiento;
      tipo_documento: TipoDocumento;
      rol: Rol;
    };
  };
}
