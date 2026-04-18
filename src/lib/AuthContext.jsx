// src/lib/AuthContext.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Contexto de autenticación seguro para Resetea
// Incluye: validación de dominio, gestión de sesión, rol alumno/docente,
// protección contra sesiones fantasma, logout limpio y detección de tokens expirados
// ─────────────────────────────────────────────────────────────────────────────

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, logError } from '@/api/supabaseClient'

const DOMINIO_PERMITIDO = '@svalero.com'
const SESSION_TIMEOUT_MS = 8 * 60 * 60 * 1000 // 8 horas

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]             = useState(null)
  const [rol, setRol]               = useState(null)   // 'alumno' | 'docente' | null
  const [loading, setLoading]       = useState(true)
  const [sessionAge, setSessionAge] = useState(null)

  // ── Validar dominio ──────────────────────────────────────────────────────
  const emailValido = useCallback((email) => {
    if (!email || typeof email !== 'string') return false
    return email.toLowerCase().endsWith(DOMINIO_PERMITIDO)
  }, [])

  // ── Leer rol desde Supabase ──────────────────────────────────────────────
  const cargarRol = useCallback(async (userId) => {
    try {
      // Primero miramos perfiles_docentes
      const { data: docente } = await supabase
        .from('perfiles_docentes')
        .select('rol')
        .eq('user_id', userId)
        .single()
      if (docente) { setRol('docente'); return }

      // Si no, miramos perfiles_alumnos
      const { data: alumno } = await supabase
        .from('perfiles_alumnos')
        .select('rol')
        .eq('user_id', userId)
        .single()
      if (alumno) { setRol(alumno.rol || 'alumno'); return }

      // Sin perfil → rol por defecto
      setRol('alumno')
    } catch (e) {
      logError('cargarRol', e)
      setRol('alumno')
    }
  }, [])

  // ── Logout completo ──────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('resetea_') || key.startsWith('sb-')) localStorage.removeItem(key)
      })
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('resetea_') || key.startsWith('sb-')) sessionStorage.removeItem(key)
      })
      await supabase.auth.signOut({ scope: 'local' })
    } catch (e) {
      logError('logout', e)
    } finally {
      setUser(null)
      setRol(null)
      setSessionAge(null)
    }
  }, [])

  // ── Verificar timeout ────────────────────────────────────────────────────
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

  // ── Procesar sesión ──────────────────────────────────────────────────────
  const procesarSesion = useCallback(async (session) => {
    if (!session?.user) { setUser(null); setRol(null); return }
    if (!emailValido(session.user.email)) {
      logError('auth', 'Dominio de email no permitido')
      logout(); return
    }
    if (!checkSessionTimeout(session)) return
    setUser(session.user)
    await cargarRol(session.user.id)
  }, [emailValido, logout, checkSessionTimeout, cargarRol])

  // ── Inicialización ───────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (!mounted) return
        if (error) { logError('getSession', error); setUser(null) }
        else await procesarSesion(session)
      } catch (e) {
        logError('init', e); setUser(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        setUser(null); setRol(null); setSessionAge(null); return
      }
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
        await procesarSesion(session); return
      }
      if (event === 'PASSWORD_RECOVERY') return
      await procesarSesion(session)
    })

    const intervalId = setInterval(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) checkSessionTimeout(session)
      })
    }, 30 * 60 * 1000)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session) setUser(null)
          else checkSessionTimeout(session)
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
    rol,           // 'alumno' | 'docente' | null
    loading,
    logout,
    emailValido,
    sessionAge,
    isAuthenticated: !!user,
    isDocente: rol === 'docente',
    isAlumno: rol === 'alumno',
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
