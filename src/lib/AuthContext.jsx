// src/lib/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, logError } from '@/api/supabaseClient'

const DOMINIO_PERMITIDO = '@svalero.com'
const SESSION_TIMEOUT_MS = 8 * 60 * 60 * 1000

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]             = useState(null)
  const [rol, setRol]               = useState(null)
  const [loading, setLoading]       = useState(true)
  const [sessionAge, setSessionAge] = useState(null)

  const emailValido = useCallback((email) => {
    if (!email || typeof email !== 'string') return false
    return email.toLowerCase().endsWith(DOMINIO_PERMITIDO)
  }, [])

  // ── Leer rol desde Supabase ──────────────────────────────────────────────
  const cargarRol = useCallback(async (userId) => {
    try {
      const { data: docente } = await supabase
        .from('perfiles_docentes')
        .select('rol')
        .eq('user_id', userId)
        .maybeSingle()           // ← maybeSingle no lanza error si no hay fila
      if (docente) { setRol('docente'); return }

      const { data: alumno } = await supabase
        .from('perfiles_alumnos')
        .select('rol')
        .eq('user_id', userId)
        .maybeSingle()
      if (alumno) { setRol(alumno.rol || 'alumno'); return }

      setRol('alumno')
    } catch (e) {
      logError('cargarRol', e)
      setRol('alumno')
    }
  }, [])

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

  const checkSessionTimeout = useCallback((session) => {
    if (!session?.user?.created_at) return true
    const loginTime = new Date(session.user.last_sign_in_at || session.user.created_at).getTime()
    const ahora = Date.now()
    if (ahora - loginTime > SESSION_TIMEOUT_MS) {
      logout(); return false
    }
    setSessionAge(ahora - loginTime)
    return true
  }, [logout])

  // ── Procesar sesión — siempre resuelve ───────────────────────────────────
  const procesarSesion = useCallback(async (session) => {
    try {
      if (!session?.user) { setUser(null); setRol(null); return }
      if (!emailValido(session.user.email)) { logout(); return }
      if (!checkSessionTimeout(session)) return
      setUser(session.user)
      await cargarRol(session.user.id)
    } catch (e) {
      logError('procesarSesion', e)
      setUser(null)
      setRol(null)
    }
  }, [emailValido, logout, checkSessionTimeout, cargarRol])

  // ── Inicialización ───────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (!mounted) return
        if (error) { logError('getSession', error); setUser(null); setRol(null) }
        else await procesarSesion(session)
      } catch (e) {
        logError('init', e)
        setUser(null); setRol(null)
      } finally {
        if (mounted) setLoading(false)  // ← SIEMPRE se ejecuta
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        setUser(null); setRol(null); setSessionAge(null)
        setLoading(false)
        return
      }
      if (event === 'PASSWORD_RECOVERY') return
      // Para SIGNED_IN y TOKEN_REFRESHED usamos Promise para no bloquear
      procesarSesion(session).finally(() => {
        if (mounted) setLoading(false)
      })
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
    rol,
    loading,
    logout,
    emailValido,
    sessionAge,
    isAuthenticated: !!user,
    isDocente: rol === 'docente',
    isAlumno: rol === 'alumno' || rol === null,
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
