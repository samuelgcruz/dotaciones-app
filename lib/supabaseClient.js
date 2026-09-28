// lib/supabaseClient.js
// Cliente único de Supabase, reutilizado tanto en componentes de servidor
// (Server Components / Route Handlers) como en componentes de cliente.
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan las variables de entorno NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY. Revisa tu archivo .env.local'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);