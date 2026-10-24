// src/pages/Convivencia.jsx
// Bandeja de avisos de acoso escolar para el equipo receptor del centro
// (dirección, jefatura de estudios, orientación...).
// Acceso: cuenta docente + estar dado de alta en receptores_convivencia + segundo factor (TOTP).
// La seguridad real está en la base de datos (RLS exige aal2); esta pantalla solo la hace usable.
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldAlert, ShieldCheck, ArrowLeft, AlertTriangle, UserCheck, UserX, CheckCircle, Smartphone } from 'lucide-react'
import { supabase, logError } from '@/api/supabaseClient'

const TIPO = { victima: 'Le ocurre al propio alumno/a', testigo: 'Lo ha presenciado (testigo)' }
const ESTADO = {
  pendiente:  { t: 'Sin asumir',  c: '#b91c1c', bg: '#fef2f2' },
  en_gestion: { t: 'En gestión',  c: '#b45309', bg: '#fffbeb' },
  cerrado:    { t: 'Cerrado',     c: '#15803d', bg: '#f0fdf4' },
}
const CARGO = { director: 'Dirección', orientacion: 'Orientación', jefe_estudios: 'Jefatura de estudios', otro: 'Equipo de convivencia' }
const fecha = (iso) => new Date(iso).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })

const inputCls = 'w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100'
const btnPrimary = { background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }

export default function Convivencia() {
  const navigate = useNavigate()
  const [fase, setFase]       = useState('cargando') // cargando | sin_acceso | enrolar | verificar | bandeja
  const [error, setError]     = useState('')
  const [factorId, setFactorId] = useState(null)
  const [qr, setQr]           = useState(null)
  const [secreto, setSecreto] = useState('')
  const [codigo, setCodigo]   = useState('')
  const [trabajando, setTrabajando] = useState(false)

  const [miId, setMiId]       = useState(null)
  const [lista, setLista]     = useState([])
  const [cargandoLista, setCargandoLista] = useState(false)
  const [detalle, setDetalle] = useState(null)
  const [aviso, setAviso]     = useState('')
  const timer = useRef(null)

  // ── Acceso y segundo factor ──────────────────────────────────────────────
  const iniciar = useCallback(async () => {
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setMiId(user?.id || null)

      const { data: esReceptor, error: e1 } = await supabase.rpc('es_receptor_convivencia', { p_centro: null })
      if (e1 || esReceptor !== true) { setFase('sin_acceso'); return }

      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (aal?.currentLevel === 'aal2') { setFase('bandeja'); return }

      const { data: factores, error: e2 } = await supabase.auth.mfa.listFactors()
      if (e2) throw e2
      const verificados = factores?.totp || []
      if (verificados.length > 0) {
        setFactorId(verificados[0].id)
        setFase('verificar')
        return
      }

      // Sin factor verificado: limpiar intentos de alta a medias y empezar uno nuevo.
      const a_medias = (factores?.all || []).filter(f => f.factor_type === 'totp' && f.status !== 'verified')
      for (const f of a_medias) { await supabase.auth.mfa.unenroll({ factorId: f.id }) }
      const { data: alta, error: e3 } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Resetea convivencia' })
      if (e3) throw e3
      setFactorId(alta.id)
      setQr(alta.totp.qr_code)
      setSecreto(alta.totp.secret)
      setFase('enrolar')
    } catch (e) {
      logError('convivencia iniciar', e)
      setError('No se ha podido comprobar tu acceso. Recarga la página; si persiste, avisa al administrador.')
      setFase('sin_acceso')
    }
  }, [])

  // Evita doble alta de factor MFA (React StrictMode ejecuta los efectos dos veces en desarrollo)
  const arrancado = useRef(false)
  useEffect(() => {
    if (arrancado.current) return
    arrancado.current = true
    iniciar()
  }, [iniciar])

  const verificarCodigo = async () => {
    setError('')
    if (!/^\d{6}$/.test(codigo.trim())) { setError('Introduce los 6 dígitos de tu aplicación autenticadora.'); return }
    setTrabajando(true)
    try {
      const { error: err } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: codigo.trim() })
      if (err) { setError('Código incorrecto o caducado. Prueba con el siguiente código.'); return }
      setCodigo('')
      setQr(null); setSecreto('')
      setFase('bandeja')
    } catch (e) {
      logError('mfa verify', e)
      setError('No se ha podido verificar. Inténtalo de nuevo.')
    } finally {
      setTrabajando(false)
    }
  }

  // ── Bandeja ─────────────────────────────────────────────────────────────
  const cargarLista = useCallback(async () => {
    setCargandoLista(true)
    const { data, error: err } = await supabase
      .from('reportes_acoso')
      .select('id, tipo, urgente, estado, responsable_id, responsable_cargo, curso, grupo, created_at')
      .order('created_at', { ascending: false })
      .limit(200)
    if (err) { logError('cargar lista', err); setAviso('No se ha podido cargar la lista. Si acabas de verificar el segundo factor, recarga la página.') }
    else setLista(data || [])
    setCargandoLista(false)
  }, [])

  useEffect(() => {
    if (fase !== 'bandeja') return
    cargarLista()
    timer.current = setInterval(cargarLista, 60000) // refresco cada minuto
    return () => clearInterval(timer.current)
  }, [fase, cargarLista])

  const abrir = async (id) => {
    setAviso('')
    const { data, error: err } = await supabase.from('reportes_acoso').select('*').eq('id', id).maybeSingle()
    if (err || !data) { setAviso('No se puede abrir este aviso (puede que te hayas apartado de él).'); cargarLista(); return }
    await supabase.rpc('convivencia_registrar_acceso', { p_reporte: id })
    setDetalle(data)
  }

  const cerrarDetalle = () => { setDetalle(null); cargarLista() }

  const asumir = async () => {
    setTrabajando(true); setAviso('')
    const { data, error: err } = await supabase.rpc('convivencia_asumir', { p_reporte: detalle.id })
    setTrabajando(false)
    if (err) { setAviso('No se ha podido registrar. Inténtalo de nuevo.'); return }
    if (data === false) setAviso('Otra persona del equipo ya se ha hecho cargo de este aviso.')
    await abrir(detalle.id)
  }

  const abstenerse = async () => {
    if (!window.confirm('Si te abstienes dejarás de ver este aviso (por ejemplo, por conflicto de interés). ¿Continuar?')) return
    setTrabajando(true); setAviso('')
    const { error: err } = await supabase.rpc('convivencia_abstenerse', { p_reporte: detalle.id })
    setTrabajando(false)
    if (err) { setAviso('No se ha podido registrar tu abstención. Inténtalo de nuevo.'); return }
    setDetalle(null); cargarLista()
    setAviso('Te has apartado de ese aviso. El resto del equipo sigue viéndolo.')
  }

  const cerrarCaso = async () => {
    if (!window.confirm('¿Marcar este aviso como cerrado?')) return
    setTrabajando(true); setAviso('')
    const { data, error: err } = await supabase.rpc('convivencia_cerrar', { p_reporte: detalle.id })
    setTrabajando(false)
    if (err || data !== true) { setAviso('No se ha podido cerrar. Solo puede hacerlo quien se ha hecho cargo.'); return }
    await abrir(detalle.id)
  }

  // ── Pantallas ───────────────────────────────────────────────────────────
  const Cabecera = ({ children }) => (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: '#fef2f2' }}>
        <ShieldAlert className="w-6 h-6" style={{ color: '#dc2626' }} />
      </div>
      <div>
        <h1 className="font-black text-xl" style={{ color: '#0d3d3d' }}>Convivencia</h1>
        <p className="text-xs text-slate-500">{children}</p>
      </div>
    </div>
  )

  if (fase === 'cargando') return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
    </div>
  )

  if (fase === 'sin_acceso') return (
    <div className="max-w-md mx-auto px-4 py-8">
      <Cabecera>Avisos de acoso escolar</Cabecera>
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-3">
        <p className="text-sm text-slate-600">Tu cuenta no tiene acceso a esta sección. Si deberías tenerlo, pide al administrador de Resetea que te dé de alta como receptor/a de avisos de tu centro.</p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button onClick={() => navigate('/docentes')} className="text-sm font-bold" style={{ color: '#0f6b6b' }}>Volver al panel</button>
      </div>
    </div>
  )

  if (fase === 'enrolar' || fase === 'verificar') return (
    <div className="max-w-md mx-auto px-4 py-8">
      <Cabecera>Verificación en dos pasos obligatoria</Cabecera>
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-4">
        {fase === 'enrolar' ? (
          <>
            <div className="flex gap-2 items-start">
              <Smartphone className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#0f6b6b' }} />
              <p className="text-sm text-slate-600">
                Estos avisos contienen datos de menores. Para verlos necesitas una aplicación autenticadora
                (Google Authenticator, Microsoft Authenticator, Authy…). Escanea este código con ella:
              </p>
            </div>
            {qr && <img src={qr} alt="Código QR para la aplicación autenticadora" className="mx-auto w-48 h-48" />}
            {secreto && (
              <p className="text-xs text-slate-500 text-center break-all">
                ¿No puedes escanear? Introduce esta clave a mano:<br /><b className="select-all">{secreto}</b>
              </p>
            )}
            <p className="text-xs text-slate-500">
              Consejo: añade el mismo código en un segundo dispositivo ahora mismo, por si pierdes o cambias el móvil.
            </p>
          </>
        ) : (
          <p className="text-sm text-slate-600">Introduce el código de 6 dígitos de tu aplicación autenticadora para acceder a los avisos.</p>
        )}
        <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={codigo}
          onChange={e => setCodigo(e.target.value.replace(/\D/g, ''))}
          onKeyDown={e => e.key === 'Enter' && verificarCodigo()}
          placeholder="000000" className={inputCls + ' text-center tracking-widest text-lg'} />
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
        <button onClick={verificarCodigo} disabled={trabajando || codigo.length !== 6}
          className="w-full py-3 rounded-xl text-white font-bold disabled:opacity-50" style={btnPrimary}>
          {trabajando ? 'Verificando…' : fase === 'enrolar' ? 'Activar y entrar' : 'Entrar'}
        </button>
      </div>
    </div>
  )

  // ── Detalle de un aviso ─────────────────────────────────────────────────
  if (detalle) {
    const est = ESTADO[detalle.estado] || ESTADO.pendiente
    const soyResponsable = detalle.responsable_id && detalle.responsable_id === miId
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <button onClick={cerrarDetalle} className="flex items-center gap-1 text-sm font-bold" style={{ color: '#0f6b6b' }}>
          <ArrowLeft className="w-4 h-4" /> Volver a la bandeja
        </button>

        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ color: est.c, background: est.bg }}>{est.t}</span>
            {detalle.urgente && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1" style={{ color: '#b91c1c', background: '#fef2f2' }}>
                <AlertTriangle className="w-3 h-3" /> Marcado como urgente
              </span>
            )}
            <span className="text-xs text-slate-400 ml-auto">{fecha(detalle.created_at)}</span>
          </div>

          <div className="text-sm space-y-1">
            <p><b>Alumno/a:</b> {detalle.email_alumno || '—'}</p>
            <p><b>Curso y grupo:</b> {detalle.curso || '—'}{detalle.grupo ? ` · ${detalle.grupo}` : ''}</p>
            <p><b>Situación:</b> {TIPO[detalle.tipo] || detalle.tipo}</p>
            {detalle.lugar && <p><b>Dónde:</b> {detalle.lugar}</p>}
            {detalle.cuando && <p><b>Cuándo:</b> {detalle.cuando}</p>}
            {detalle.implicados && <p><b>Implicados:</b> {detalle.implicados}</p>}
          </div>

          <div>
            <p className="text-xs font-bold text-slate-500 mb-1">Relato</p>
            <p className="text-sm text-slate-800 whitespace-pre-wrap rounded-2xl p-3" style={{ background: '#f8fafc' }}>{detalle.descripcion}</p>
          </div>

          {detalle.responsable_cargo && (
            <p className="text-sm" style={{ color: '#b45309' }}>
              <UserCheck className="inline w-4 h-4 mr-1" />
              Se ha hecho cargo: <b>{CARGO[detalle.responsable_cargo] || detalle.responsable_cargo}</b>
              {detalle.fecha_asuncion ? ` · ${fecha(detalle.fecha_asuncion)}` : ''}
              {soyResponsable ? ' (tú)' : ''}
            </p>
          )}

          {aviso && <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-4 py-3">{aviso}</div>}

          <div className="flex flex-col sm:flex-row gap-2">
            {!detalle.responsable_id && detalle.estado === 'pendiente' && (
              <button onClick={asumir} disabled={trabajando}
                className="flex-1 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2" style={btnPrimary}>
                <UserCheck className="w-4 h-4" /> Me hago cargo
              </button>
            )}
            {soyResponsable && detalle.estado === 'en_gestion' && (
              <button onClick={cerrarCaso} disabled={trabajando}
                className="flex-1 py-3 rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>
                <CheckCircle className="w-4 h-4" /> Marcar como cerrado
              </button>
            )}
            {detalle.estado !== 'cerrado' && (
              <button onClick={abstenerse} disabled={trabajando}
                className="flex-1 py-3 rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: 'white', color: '#64748b', border: '1px solid #e2e8f0' }}>
                <UserX className="w-4 h-4" /> Me abstengo (conflicto de interés)
              </button>
            )}
          </div>

          <p className="text-xs text-slate-400">
            Este registro no sustituye al protocolo oficial de actuación del centro: iníciala allí
            (por ejemplo en Convive) según la normativa que corresponda. Tu acceso a este aviso queda registrado.
          </p>
        </div>
      </div>
    )
  }

  // ── Lista ───────────────────────────────────────────────────────────────
  const sinAsumir = lista.filter(r => r.estado === 'pendiente' && !r.responsable_id).length
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <Cabecera>Avisos de acoso escolar de tu centro</Cabecera>

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <ShieldCheck className="w-4 h-4" style={{ color: '#0f6b6b' }} /> Sesión verificada en dos pasos
      </div>

      {sinAsumir > 0 && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4 flex items-center gap-3" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
          <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: '#dc2626' }} />
          <p className="text-sm font-bold" style={{ color: '#991b1b' }}>
            {sinAsumir === 1 ? 'Hay 1 aviso sin asumir' : `Hay ${sinAsumir} avisos sin asumir`}
          </p>
        </motion.div>
      )}

      {aviso && <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-4 py-3">{aviso}</div>}

      {cargandoLista && lista.length === 0 ? (
        <p className="text-sm text-slate-400">Cargando…</p>
      ) : lista.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">No hay avisos.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {lista.map(r => {
            const est = ESTADO[r.estado] || ESTADO.pendiente
            return (
              <button key={r.id} onClick={() => abrir(r.id)}
                className="w-full text-left bg-white rounded-2xl p-4 shadow-sm border flex items-center gap-3"
                style={{ borderColor: r.urgente && r.estado !== 'cerrado' ? '#fca5a5' : '#f1f5f9' }}>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm">
                    {r.tipo === 'victima' ? 'Aviso del propio alumno/a' : 'Aviso de un testigo'}
                    {r.urgente && <span className="ml-2 text-xs font-bold" style={{ color: '#dc2626' }}>URGENTE</span>}
                  </p>
                  <p className="text-xs text-slate-400">
                    {fecha(r.created_at)}{r.curso ? ` · ${r.curso}` : ''}{r.grupo ? ` ${r.grupo}` : ''}
                    {r.responsable_cargo ? ` · ${CARGO[r.responsable_cargo] || r.responsable_cargo}` : ''}
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0" style={{ color: est.c, background: est.bg }}>{est.t}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
