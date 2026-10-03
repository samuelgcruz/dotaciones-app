// lib/supabaseAdmin.js
//
// Cliente de Supabase SOLO PARA EL SERVIDOR (rutas /app/api/**, Server Actions).
// Usa la clave service_role, que se salta RLS. Por eso:
//   - NUNCA lo importes desde un componente con 'use client'.
//   - NUNCA le pongas el prefijo NEXT_PUBLIC_ a la variable de la clave.
//
// Variables de entorno necesarias (.env.local y también en Vercel):
//   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY=eyJ...   (Supabase → Project Settings → API → service_role)
//
// Se crea de forma perezosa (dentro de una función) para que el build no falle
// si las variables aún no están disponibles al momento de compilar.

import { createClient } from '@supabase/supabase-js';

let cliente = null;

export function getSupabaseAdmin() {
  if (cliente) return cliente;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno.'
    );
  }

  cliente = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return cliente;
}
