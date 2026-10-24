// src/components/OrientadorAcceso.jsx
// Acceso al Panel Orientador: cuenta de Resetea + verificación en dos pasos (TOTP).
// La seguridad real está en la base de datos (las funciones exigen sesión aal2 y orientador dado de alta);
// esta pantalla solo la hace usable.
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Smartphone } from 'lucide-react'
import { supabase, logError } from '@/api/supabaseClient'

const inputCls = 'w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-center tracking-widest text-lg focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100'

// Marco de la pantalla. Va FUERA del componente principal: si se define dentro, React lo vuelve a crear
// en cada pulsacion de tecla y el campo del codigo pierde el cursor.
function Marco({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0d3d3d 0%, #1d4ed8 100%)' }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">Panel Orientador</h1>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-xl space-y-4">{children}</div>
      </motion.div>
    </div>
  )
}

export default function OrientadorAcceso({ onAcceso }) {
  const navigate = useNavigate()
  const [fase, setFase] = useState('cargando') // cargando | sin_acceso | enrolar | verificar
  const [error, setError] = useState('')
  const [factorId, setFactorId] = useState(null)
  const [qr, setQr] = useState(null)
  const [secreto, setSecreto] = useState('')
  const [codigo, setCodigo] = useState('')
  const [trabajando, setTrabajando] = useState(false)

  const entrar = useCallback(async () => {
    const { data, error: err } = await supabase.rpc('orientador_perfil').maybeSingle()
    if (err || !data) { setFase('sin_acceso'); return }
    onAcceso(data)
  }, [onAcceso])

  const iniciar = useCallback(async () => {
    setError('')
    try {
      const { data: esOri, error: e1 } = await supabase.rpc('es_orientador_cuenta')
      if (e1 || esOri !== true) { setFase('sin_acceso'); return }

      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (aal?.currentLevel === 'aal2') { await entrar(); return }

      const { data: factores, error: e2 } = await supabase.auth.mfa.listFactors()
      if (e2) throw e2
      const verificados = factores?.totp || []
      if (verificados.length > 0) { setFactorId(verificados[0].id); setFase('verificar'); return }

      const aMedias = (factores?.all || []).filter(f => f.factor_type === 'totp' && f.status !== 'verified')
      for (const f of aMedias) { await supabase.auth.mfa.unenroll({ factorId: f.id }) }
      const { data: alta, error: e3 } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Resetea orientador' })
      if (e3) throw e3
      setFactorId(alta.id); setQr(alta.totp.qr_code); setSecreto(alta.totp.secret)
      setFase('enrolar')
    } catch (e) {
      logError('orientador acceso', e)
      setError('No se ha podido comprobar tu acceso. Recarga la página; si persiste, avisa al administrador.')
      setFase('sin_acceso')
    }
  }, [entrar])

  // Evita doble alta de factor en desarrollo (React StrictMode ejecuta los efectos dos veces)
  const arrancado = useRef(false)
  useEffect(() => {
    if (arrancado.current) return
    arrancado.current = true
    iniciar()
  }, [iniciar])

  const verificar = async () => {
    setError('')
    if (!/^\d{6}$/.test(codigo.trim())) { setError('Introduce los 6 dígitos de tu aplicación autenticadora.'); return }
    setTrabajando(true)
    try {
      const { error: err } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: codigo.trim() })
      if (err) { setError('Código incorrecto o caducado. Prueba con el siguiente código.'); return }
      setCodigo(''); setQr(null); setSecreto('')
      await entrar()
    } catch (e) {
      logError('orientador mfa', e)
      setError('No se ha podido verificar. Inténtalo de nuevo.')
    } finally {
      setTrabajando(false)
    }
  }

  if (fase === 'cargando') return (
    <Marco><div className="flex justify-center py-6"><div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" /></div></Marco>
  )

  if (fase === 'sin_acceso') return (
    <Marco>
      <p className="text-sm text-slate-600">Tu cuenta no tiene acceso al Panel Orientador. Si deberías tenerlo, pide al administrador de Resetea que vincule tu cuenta como orientador/a de tu centro.</p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button onClick={() => navigate('/docentes')} className="text-sm font-bold" style={{ color: '#0f6b6b' }}>Volver al panel</button>
    </Marco>
  )

  return (
    <Marco>
      {fase === 'enrolar' ? (
        <>
          <div className="flex gap-2 items-start">
            <Smartphone className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#0f6b6b' }} />
            <p className="text-sm text-slate-600">
              Este panel muestra datos de bienestar de menores. Para entrar necesitas una aplicación autenticadora
              (Google Authenticator, Microsoft Authenticator, Authy…). Escanea este código con ella:
            </p>
          </div>
          {qr && <img src={qr} alt="Código QR para la aplicación autenticadora" className="mx-auto w-48 h-48" />}
          {secreto && (
            <p className="text-xs text-slate-500 text-center break-all">
              ¿No puedes escanear? Introduce esta clave a mano:<br /><b className="select-all">{secreto}</b>
            </p>
          )}
          <p className="text-xs text-slate-500">Consejo: añade el mismo código en un segundo dispositivo ahora, por si pierdes o cambias el móvil.</p>
        </>
      ) : (
        <p className="text-sm text-slate-600">Introduce el código de 6 dígitos de tu aplicación autenticadora.</p>
      )}
      <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={codigo}
        onChange={e => setCodigo(e.target.value.replace(/\D/g, ''))}
        onKeyDown={e => e.key === 'Enter' && verificar()}
        placeholder="000000" className={inputCls} />
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
      <button onClick={verificar} disabled={trabajando || codigo.length !== 6}
        className="w-full py-3 rounded-xl text-white font-bold disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>
        {trabajando ? 'Verificando…' : fase === 'enrolar' ? 'Activar y entrar' : 'Entrar'}
      </button>
    </Marco>
  )
}
