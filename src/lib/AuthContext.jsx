// src/lib/AuthContext.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Contexto de autenticación seguro para Resetea
// Incluye: validación de dominio, gestión de sesión, protección contra
// sesiones fantasma, logout limpio y detección de tokens expirados
// ─────────────────────────────────────────────────────────────────────────────

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, logError } from '@/api/supabaseClient'

const DOMINIO_PERMITIDO = '@svalero.com'
const SESSION_TIMEOUT_MS = 8 * 60 * 60 * 1000 // 8 horas

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [sessionAge, setSessionAge] = useState(null)

  // ── Validar que el email pertenece al dominio permitido ──────────────────
  const emailValido = useCallback((email) => {
    if (!email || typeof email !== 'string') return false
    return email.toLowerCase().endsWith(DOMINIO_PERMITIDO)
  }, [])

  // ── Logout completo y limpio ─────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      // Limpiar todos los datos de sesión locales
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('resetea_') || key.startsWith('sb-')) {
          localStorage.removeItem(key)
        }
      })
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('resetea_') || key.startsWith('sb-')) {
          sessionStorage.removeItem(key)
        }
      })
      await supabase.auth.signOut({ scope: 'local' })
    } catch (e) {
      logError('logout', e)
    } finally {
      setUser(null)
      setSessionAge(null)
    }
  }, [])

  // ── Verificar si la sesión ha expirado por tiempo ────────────────────────
  const checkSessionTimeout = useCallback((session) => {
    if (!session?.user?.created_at) return
    const loginTime = new Date(session.user.last_sign_in_at || session.user.created_at).getTime()
    const ahora = Date.now()
    if (ahora - loginTime > SESSION_TIMEOUT_MS) {
      logError('session', 'Sesión expirada por tiempo')
      logout()
      return false
    }
    setSessionAge(ahora - loginTime)
    return true
  }, [logout])

  // ── Procesar sesión entrante con validaciones ────────────────────────────
  const procesarSesion = useCallback((session) => {
    if (!session?.user) {
      setUser(null)
      return
    }
    // Validar dominio del email
    if (!emailValido(session.user.email)) {
      logError('auth', 'Dominio de email no permitido')
      logout()
      return
    }
    // Verificar timeout de sesión
    if (!checkSessionTimeout(session)) return

    setUser(session.user)
  }, [emailValido, logout, checkSessionTimeout])

  // ── Inicialización y escucha de cambios ──────────────────────────────────
  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (!mounted) return
        if (error) {
          logError('getSession', error)
          setUser(null)
        } else {
          procesarSesion(session)
        }
      } catch (e) {
        logError('init', e)
        setUser(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    init()

    // Escuchar cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return

      // Eventos de seguridad relevantes
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        setUser(null)
        setSessionAge(null)
        return
      }
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
        procesarSesion(session)
        return
      }
      if (event === 'PASSWORD_RECOVERY') {
        // No hacer nada automáticamente en recuperación
        return
      }

      procesarSesion(session)
    })

    // Verificar timeout periódicamente (cada 30 min)
    const intervalId = setInterval(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) checkSessionTimeout(session)
      })
    }, 30 * 60 * 1000)

    // Detectar inactividad (si el usuario lleva >8h sin usar la app)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session) {
            setUser(null)
          } else {
            checkSessionTimeout(session)
          }
        })
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      mounted = false
      subscription.unsubscribe()
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [procesarSesion, checkSessionTimeout])

  const value = {
    user,
    loading,
    logout,
    emailValido,
    sessionAge,
    isAuthenticated: !!user,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
