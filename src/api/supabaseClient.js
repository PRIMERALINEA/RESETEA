// src/api/supabaseClient.js
// ─────────────────────────────────────────────────────────────────────────────
// Cliente Supabase con configuración de seguridad máxima para Resetea
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('[Resetea] Variables de entorno de Supabase no configuradas.')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Almacenamiento en localStorage con prefijo para evitar colisiones
    storageKey: 'resetea_auth_v1',
    // Renovación automática de tokens
    autoRefreshToken: true,
    // Persistir sesión entre recargas
    persistSession: true,
    // Detectar sesión desde URL (magic links, OAuth)
    detectSessionInUrl: true,
    // Sin flujo PKCE implícito — usar explícito
    flowType: 'pkce',
  },
  global: {
    headers: {
      'X-Client-Info': 'resetea-web/1.0',
    },
  },
  // Reintentos automáticos en fallos de red
  db: {
    schema: 'public',
  },
  realtime: {
    // Solo habilitar realtime si se necesita explícitamente
    params: { eventsPerSecond: 2 },
  },
})

// ── Sanitización de inputs ────────────────────────────────────────────────────
// Usar siempre esta función antes de insertar texto libre en Supabase
export function sanitize(str) {
  if (typeof str !== 'string') return str
  return str
    .trim()
    .slice(0, 5000) // límite máximo de caracteres
    .replace(/[<>]/g, '') // eliminar < > para prevenir XSS básico
}

// ── Helper seguro para obtener user_id ────────────────────────────────────────
// NUNCA usar auth.uid() directamente en inserts desde el cliente
// Siempre resolver user_id desde la sesión autenticada
export async function getAuthenticatedUserId() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('No autenticado')
  return user.id
}

// ── Rate limiting del lado cliente ───────────────────────────────────────────
// Previene abuso de llamadas a la API desde el frontend
const callLog = {}
export function rateLimit(key, maxCalls = 10, windowMs = 60000) {
  const now = Date.now()
  if (!callLog[key]) callLog[key] = []
  callLog[key] = callLog[key].filter(t => now - t < windowMs)
  if (callLog[key].length >= maxCalls) {
    throw new Error('Demasiadas peticiones. Espera un momento.')
  }
  callLog[key].push(now)
}

// ── Log de errores (sin datos sensibles) ─────────────────────────────────────
export function logError(context, error) {
  if (import.meta.env.DEV) {
    console.error(`[Resetea:${context}]`, error?.message || error)
  }
  // En producción no se loguea nada sensible al cliente
}
