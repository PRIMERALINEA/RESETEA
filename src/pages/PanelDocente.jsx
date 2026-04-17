import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/api/supabaseClient'
import {
  Eye, EyeOff, LogOut,
  Heart, Wind,
  CheckCircle, ChevronRight, ChevronDown,
  BarChart2, Activity
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────
// DATOS: TEST BURNOUT (versión breve validada, 9 ítems)
// ─────────────────────────────────────────────────────────────
const BURNOUT_ITEMS = [
  { id: 'b1', dim: 'cansancio', texto: 'Me siento emocionalmente agotado/a por mi trabajo' },
  { id: 'b2', dim: 'cansancio', texto: 'Me siento "quemado/a" al final de la jornada escolar' },
  { id: 'b3', dim: 'cansancio', texto: 'Trabajar todo el día con personas me supone un esfuerzo importante' },
  { id: 'b4', dim: 'despersonalizacion', texto: 'Me he vuelto más insensible hacia el alumnado desde que ejerzo esta profesión' },
  { id: 'b5', dim: 'despersonalizacion', texto: 'Me preocupa que este trabajo me esté endureciendo emocionalmente' },
  { id: 'b6', dim: 'despersonalizacion', texto: 'Tengo la sensación de que algunos alumnos/as me culpan de sus problemas' },
  { id: 'b7', dim: 'realizacion', texto: 'Puedo entender fácilmente lo que sienten mis alumnos/as' },
  { id: 'b8', dim: 'realizacion', texto: 'Me enfrento de forma eficaz a los problemas de mis alumnos/as' },
  { id: 'b9', dim: 'realizacion', texto: 'Siento que estoy influyendo positivamente en la vida de mis alumnos/as con mi trabajo' },
]

const BURNOUT_OPCIONES = [
  { valor: 0, label: 'Nunca' },
  { valor: 1, label: 'Alguna vez' },
  { valor: 2, label: 'A veces' },
  { valor: 3, label: 'Bastante' },
  { valor: 4, label: 'Con frecuencia' },
  { valor: 5, label: 'Casi siempre' },
  { valor: 6, label: 'Siempre' },
]

function calcularBurnout(respuestas) {
  const canRaw = ['b1','b2','b3'].reduce((s,k) => s + (respuestas[k] ?? 0), 0)
  const desRaw = ['b4','b5','b6'].reduce((s,k) => s + (respuestas[k] ?? 0), 0)
  const reaRaw = ['b7','b8','b9'].reduce((s,k) => s + (respuestas[k] ?? 0), 0)
  // Realizacion: invertida para burnout (baja realizacion = alto burnout)
  const reaInv = 18 - reaRaw
  const total = canRaw + desRaw + reaInv
  let nivel, color, bg, desc
  if (total <= 15) {
    nivel = 'Bajo'; color = '#16a34a'; bg = '#dcfce7'
    desc = 'Tu nivel de desgaste es bajo. Mantén las estrategias de autocuidado que ya tienes.'
  } else if (total <= 30) {
    nivel = 'Moderado'; color = '#ca8a04'; bg = '#fef9c3'
    desc = 'Hay señales de desgaste que conviene atender. Revisa las estrategias de la sección de recursos.'
  } else {
    nivel = 'Elevado'; color = '#dc2626'; bg = '#fee2e2'
    desc = 'El nivel de agotamiento es alto. Te recomendamos consultar con un profesional y priorizar el descanso activo.'
  }
  return { canRaw, desRaw, reaRaw, total, nivel, color, bg, desc }
}

// ─────────────────────────────────────────────────────────────
// DATOS: CHECK-IN EMOCIONAL
// ─────────────────────────────────────────────────────────────
const ESTADOS = [
  { id: 'excelente', emoji: '☀️', label: 'Excelente', valor: 5, color: '#f59e0b' },
  { id: 'bien',      emoji: '🌤️', label: 'Bien',      valor: 4, color: '#10b981' },
  { id: 'regular',   emoji: '⛅', label: 'Regular',   valor: 3, color: '#6b7280' },
  { id: 'cansado',   emoji: '🌧️', label: 'Cansado/a', valor: 2, color: '#6366f1' },
  { id: 'mal',       emoji: '⛈️', label: 'Mal',       valor: 1, color: '#ef4444' },
]

// ─────────────────────────────────────────────────────────────
// DATOS: RESPIRACIONES
// ─────────────────────────────────────────────────────────────
const RESPIRACIONES = [
  {
    id: 'cuadrada',
    nombre: '4-4-4-4 Cuadrada',
    emoji: '🔲',
    color: '#0891b2',
    desc: 'Ideal para antes de entrar en clase o en momentos de tensión aguda.',
    fases: [
      { label: 'Inspira', dur: 4, color: '#0891b2' },
      { label: 'Retén', dur: 4, color: '#7c3aed' },
      { label: 'Espira', dur: 4, color: '#0f6b6b' },
      { label: 'Retén', dur: 4, color: '#be185d' },
    ]
  },
  {
    id: 'fisiologica',
    nombre: '4-2-6 Desactivación',
    emoji: '🌊',
    color: '#0f6b6b',
    desc: 'Para bajar la activación después de una situación difícil en el aula.',
    fases: [
      { label: 'Inspira', dur: 4, color: '#0891b2' },
      { label: 'Retén', dur: 2, color: '#7c3aed' },
      { label: 'Espira lento', dur: 6, color: '#0f6b6b' },
    ]
  },
  {
    id: 'emergencia',
    nombre: '5-5 Pausa activa',
    emoji: '⚡',
    color: '#b45309',
    desc: 'Versión ultrarrápida para el pasillo entre clases. 1 minuto.',
    fases: [
      { label: 'Inspira', dur: 5, color: '#0891b2' },
      { label: 'Espira', dur: 5, color: '#0f6b6b' },
    ]
  },
]

// ─────────────────────────────────────────────────────────────
// DATOS: RECURSOS (estrategias de aula)
// ─────────────────────────────────────────────────────────────
const RECURSOS = [
  {
    id: 'r1', emoji: '🧊', titulo: 'Cuando el aula está fuera de control',
    color: '#dc2626', bg: '#fee2e2', border: '#fca5a5',
    estrategias: [
      { t: 'Pausa de 60 segundos', d: 'Para, baja la voz (no la subas), di "vamos a hacer una pausa". El silencio tuyo es más poderoso que el volumen.' },
      { t: 'La regla del 1%', d: 'No necesitas calmar al 100% del aula. Conecta con el 1-2 alumnos clave que pueden "arrastrar" al grupo hacia la calma.' },
      { t: 'Reducción de estímulos', d: 'Apaga la luz un instante, cierra la puerta, baja las persianas. El cambio sensorial interrumpe el patrón de activación.' },
    ]
  },
  {
    id: 'r2', emoji: '💬', titulo: 'Alumno en crisis emocional',
    color: '#7c3aed', bg: '#ede9fe', border: '#c4b5fd',
    estrategias: [
      { t: 'Primero regular, luego hablar', d: 'No intentes resolver nada hasta que el alumno esté regulado. "Vamos a respirar juntos un momento" antes que cualquier pregunta.' },
      { t: 'Sal del aula con él', d: 'Si es posible, acompáñale al pasillo. El cambio de espacio reduce la vergüenza social y baja la activación.' },
      { t: 'Cuándo derivar', d: 'Si hay llanto intenso, disociación, agresividad o menciones a hacerse daño: llama al orientador inmediatamente, no intentes gestionar solo.' },
    ]
  },
  {
    id: 'r3', emoji: '🔥', titulo: 'Cuando tú estás a punto de explotar',
    color: '#ea580c', bg: '#ffedd5', border: '#fdba74',
    estrategias: [
      { t: 'La clave del "10 segundos"', d: 'Antes de responder a lo que te saca de quicio, cuenta mentalmente hasta 10. No es magia, es biología: necesitas ese tiempo para que el córtex frene la amígdala.' },
      { t: 'Sal físicamente si puedes', d: '"Voy a salir 30 segundos al pasillo a por agua." Es completamente válido y modelas regulación emocional ante el grupo.' },
      { t: 'No personalices', d: 'El alumno que te desafía no está atacando a Patricia, está gestionando su propio malestar de la peor manera disponible. No tiene que ver contigo.' },
    ]
  },
  {
    id: 'r4', emoji: '🛡️', titulo: 'Límites y desconexión del trabajo',
    color: '#0891b2', bg: '#cffafe', border: '#67e8f9',
    estrategias: [
      { t: 'Ritual de cierre del día', d: 'Crea un gesto físico que marque el final de la jornada laboral: cambiar de ropa, un paseo de 10 min, una frase ("ya he hecho lo que podía hoy").' },
      { t: 'No al trabajo fuera de horario', d: 'Responder mensajes de familias a las 22h no es profesionalidad, es falta de límite. Decide tu horario de respuesta y comunícalo.' },
      { t: 'Reconoce lo que sí has hecho', d: 'Al final del día anota UNA cosa que hayas hecho bien. No lo que no has podido. Esto recalibra el sesgo negativo del cerebro docente.' },
    ]
  },
]

// ─────────────────────────────────────────────────────────────
// COMPONENTE: LOGIN
// ─────────────────────────────────────────────────────────────
function LoginDocente({ onAcceso }) {
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCode, setShowCode] = useState(false)

  const verificar = async () => {
    if (!codigo.trim()) return
    setLoading(true); setError('')
    try {
      const { data, error: err } = await supabase
        .from('docentes')
        .select('*')
        .eq('codigo', codigo.trim().toUpperCase())
        .eq('activo', true)
        .single()
      if (err || !data) {
        setError('Código incorrecto. Contacta con el administrador del centro.')
      } else {
        onAcceso(data)
      }
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0f6b6b 100%)' }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(255,255,255,0.15)' }}>
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">Espacio Docente</h1>
          <p className="text-teal-200 text-sm mt-1">Resetea · Tu bienestar también importa</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-6 space-y-4">
          <p className="font-bold text-slate-700 text-sm">Introduce tu código de acceso</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div className="relative">
            <input
              type={showCode ? 'text' : 'password'}
              value={codigo}
              onChange={e => setCodigo(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && verificar()}
              placeholder="CÓDIGO DE ACCESO"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono tracking-widest focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 pr-12"
            />
            <button onClick={() => setShowCode(!showCode)}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
              {showCode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <button onClick={verificar} disabled={loading || !codigo}
            className="w-full py-3 rounded-xl text-white font-bold disabled:opacity-50 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #1e3a5f, #0f6b6b)' }}>
            {loading ? 'Verificando...' : 'Acceder a mi espacio'}
          </button>

          <p className="text-xs text-slate-400 text-center leading-relaxed">
            ¿No tienes código? Contacta con el orientador o administrador del centro.<br />
            <span className="text-teal-600 font-medium">Tus datos son anónimos y privados.</span>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// COMPONENTE: RESPIRACIÓN GUIADA
// ─────────────────────────────────────────────────────────────
function EjercicioRespiracion({ ejercicio, onVolver }) {
  const [activo, setActivo] = useState(false)
  const [faseIdx, setFaseIdx] = useState(0)
  const [seg, setSeg] = useState(ejercicio.fases[0].dur)
  const [ciclos, setCiclos] = useState(0)
  const CICLOS_TOTAL = 4

  useEffect(() => {
    if (!activo) return
    if (seg > 0) {
      const t = setTimeout(() => setSeg(s => s - 1), 1000)
      return () => clearTimeout(t)
    } else {
      const siguienteFase = (faseIdx + 1) % ejercicio.fases.length
      if (siguienteFase === 0) {
        const nuevosCiclos = ciclos + 1
        if (nuevosCiclos >= CICLOS_TOTAL) {
          setActivo(false); setCiclos(0); setFaseIdx(0)
          setSeg(ejercicio.fases[0].dur)
          return
        }
        setCiclos(nuevosCiclos)
      }
      setFaseIdx(siguienteFase)
      setSeg(ejercicio.fases[siguienteFase].dur)
    }
  }, [activo, seg, faseIdx, ciclos])

  const fase = ejercicio.fases[faseIdx]
  const total = ejercicio.fases[faseIdx].dur
  const pct = activo ? ((total - seg) / total) * 100 : 0

  return (
    <div className="flex flex-col items-center py-8 px-4">
      <button onClick={onVolver} className="self-start flex items-center gap-1 text-slate-400 text-sm mb-6 hover:text-slate-600">
        ← Volver
      </button>

      <h2 className="font-black text-slate-800 text-xl mb-1">{ejercicio.nombre}</h2>
      <p className="text-slate-500 text-sm text-center mb-8 max-w-xs">{ejercicio.desc}</p>

      {/* Círculo animado */}
      <div className="relative w-48 h-48 flex items-center justify-center mb-8">
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 192 192">
          <circle cx="96" cy="96" r="84" fill="none" stroke="#e2e8f0" strokeWidth="8" />
          <motion.circle
            cx="96" cy="96" r="84" fill="none"
            stroke={activo ? fase.color : '#94a3b8'}
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 84}`}
            animate={{ strokeDashoffset: `${2 * Math.PI * 84 * (1 - pct / 100)}` }}
            transition={{ duration: 0.5 }}
          />
        </svg>
        <div className="text-center z-10">
          {activo ? (
            <>
              <p className="text-4xl font-black text-slate-800">{seg}</p>
              <p className="text-sm font-bold mt-1" style={{ color: fase.color }}>{fase.label}</p>
            </>
          ) : (
            <Wind className="w-12 h-12 text-slate-300" />
          )}
        </div>
      </div>

      {activo && (
        <p className="text-xs text-slate-400 mb-6">Ciclo {ciclos + 1} de {CICLOS_TOTAL}</p>
      )}

      <button
        onClick={() => { setActivo(a => !a); if (activo) { setFaseIdx(0); setSeg(ejercicio.fases[0].dur); setCiclos(0) } }}
        className="w-full max-w-xs py-4 rounded-2xl text-white font-bold text-sm"
        style={{ background: activo ? '#64748b' : `linear-gradient(135deg, ${ejercicio.color}, ${ejercicio.color}cc)` }}>
        {activo ? 'Pausar' : 'Comenzar'}
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// COMPONENTE: PANEL PRINCIPAL
// ─────────────────────────────────────────────────────────────
function PanelDocenteDashboard({ docente, onSalir }) {
  const [tab, setTab] = useState('checkin')
  const [loading, setLoading] = useState(false)

  // CHECK-IN
  const [estadoHoy, setEstadoHoy] = useState(null)
  const [checkinGuardado, setCheckinGuardado] = useState(false)
  const [historialCheckin, setHistorialCheckin] = useState([])

  // BURNOUT
  const [burnoutResp, setBurnoutResp] = useState({})
  const [burnoutResultado, setBurnoutResultado] = useState(null)
  const [burnoutGuardado, setBurnoutGuardado] = useState(false)
  const [historialBurnout, setHistorialBurnout] = useState([])

  // RESPIRACIÓN
  const [respSeleccionada, setRespSeleccionada] = useState(null)

  // RECURSOS
  const [recursoAbierto, setRecursoAbierto] = useState(null)

  // EVOLUCIÓN
  const [evolucion, setEvolucion] = useState({ checkins: [], burnouts: [] })

  const hoy = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      // Cargar check-in de hoy
      const { data: ci } = await supabase
        .from('docente_checkins')
        .select('*')
        .eq('docente_codigo', docente.codigo)
        .eq('fecha', hoy)
        .single()
      if (ci) { setEstadoHoy(ci.estado); setCheckinGuardado(true) }

      // Historial check-ins (últimas 4 semanas)
      const hace28 = new Date(Date.now() - 28 * 86400000).toISOString().slice(0, 10)
      const { data: cis } = await supabase
        .from('docente_checkins')
        .select('fecha, estado, valor')
        .eq('docente_codigo', docente.codigo)
        .gte('fecha', hace28)
        .order('fecha', { ascending: false })
      if (cis) setHistorialCheckin(cis)

      // Historial burnout (últimos 3)
      const { data: bs } = await supabase
        .from('docente_burnout')
        .select('*')
        .eq('docente_codigo', docente.codigo)
        .order('created_at', { ascending: false })
        .limit(3)
      if (bs) setHistorialBurnout(bs)

      // Evolución para gráfica
      if (cis && bs) setEvolucion({ checkins: cis.reverse(), burnouts: bs.reverse() })

    } catch (e) {
      console.error('[PanelDocente:cargarDatos]', e)
    } finally { setLoading(false) }
  }

  const guardarCheckin = async (estado) => {
    const estadoObj = ESTADOS.find(e => e.id === estado)
    setEstadoHoy(estado)
    try {
      await supabase.from('docente_checkins').upsert({
        docente_codigo: docente.codigo,
        fecha: hoy,
        estado,
        valor: estadoObj?.valor ?? 3
      }, { onConflict: 'docente_codigo,fecha' })
      setCheckinGuardado(true)
      await cargarDatos()
    } catch (e) { console.error(e) }
  }

  const completarBurnout = () => {
    const resultado = calcularBurnout(burnoutResp)
    setBurnoutResultado(resultado)
  }

  const guardarBurnout = async () => {
    if (!burnoutResultado) return
    try {
      await supabase.from('docente_burnout').insert({
        docente_codigo: docente.codigo,
        cansancio: burnoutResultado.canRaw,
        despersonalizacion: burnoutResultado.desRaw,
        realizacion: burnoutResultado.reaRaw,
        total: burnoutResultado.total,
        nivel: burnoutResultado.nivel,
      })
      setBurnoutGuardado(true)
      await cargarDatos()
    } catch (e) { console.error(e) }
  }

  const respondidas = Object.keys(burnoutResp).length
  const completo = respondidas === BURNOUT_ITEMS.length

  const TABS = [
    { id: 'checkin',    label: 'Hoy',          emoji: '🌤️' },
    { id: 'burnout',    label: 'Burnout',       emoji: '🧠' },
    { id: 'respiracion',label: 'Respirar',      emoji: '🌬️' },
    { id: 'recursos',   label: 'Recursos',      emoji: '📚' },
    { id: 'evolucion',  label: 'Evolución',     emoji: '📈' },
  ]

  return (
    <div className="min-h-screen" style={{ background: '#f0f7f7' }}>
      {/* Header */}
      <div className="sticky top-0 z-20 shadow-sm"
        style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0f6b6b 100%)' }}>
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-white font-black text-base leading-tight">Espacio Docente</h1>
            <p className="text-teal-200 text-xs">
              {docente.nombre || `Código ${docente.codigo}`} · Resetea
            </p>
          </div>
          <button onClick={onSalir}
            className="flex items-center gap-1.5 text-white/70 hover:text-white text-xs px-3 py-1.5 rounded-xl border border-white/20">
            <LogOut className="w-3.5 h-3.5" /> Salir
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-lg mx-auto px-4 pb-2 flex gap-1 overflow-x-auto scrollbar-hide">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"
              style={tab === t.id
                ? { background: 'rgba(255,255,255,0.2)', color: 'white' }
                : { color: 'rgba(255,255,255,0.55)' }}>
              <span>{t.emoji}</span> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-lg mx-auto px-4 py-5">
        <AnimatePresence mode="wait">

          {/* ── CHECK-IN ── */}
          {tab === 'checkin' && (
            <motion.div key="checkin" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} className="space-y-4">

              <div className="bg-white rounded-3xl p-5 shadow-sm border border-teal-50">
                <h2 className="font-black text-slate-800 text-lg mb-1">¿Cómo llegas hoy?</h2>
                <p className="text-slate-500 text-sm mb-5">Un momento de honestidad contigo mismo/a.</p>

                <div className="grid grid-cols-5 gap-2">
                  {ESTADOS.map(e => (
                    <button key={e.id} onClick={() => guardarCheckin(e.id)}
                      className="flex flex-col items-center p-2 rounded-2xl transition-all"
                      style={estadoHoy === e.id
                        ? { background: e.color + '20', border: `2px solid ${e.color}` }
                        : { background: '#f8fafc', border: '2px solid transparent' }}>
                      <span className="text-2xl mb-1">{e.emoji}</span>
                      <span className="text-xs font-bold" style={{ color: estadoHoy === e.id ? e.color : '#94a3b8' }}>
                        {e.label}
                      </span>
                    </button>
                  ))}
                </div>

                {checkinGuardado && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-4 flex items-center gap-2 bg-teal-50 rounded-xl p-3">
                    <CheckCircle className="w-4 h-4 text-teal-600 flex-shrink-0" />
                    <p className="text-teal-700 text-sm font-medium">Registrado. Gracias por tomarte un momento.</p>
                  </motion.div>
                )}
              </div>

              {/* Historial reciente */}
              {historialCheckin.length > 1 && (
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-teal-50">
                  <p className="font-bold text-slate-700 text-sm mb-3">Últimos días</p>
                  <div className="flex flex-wrap gap-2">
                    {historialCheckin.slice(0, 14).map(ci => {
                      const est = ESTADOS.find(e => e.id === ci.estado)
                      const d = new Date(ci.fecha + 'T12:00:00')
                      return (
                        <div key={ci.fecha} className="flex flex-col items-center">
                          <span className="text-xl">{est?.emoji ?? '❓'}</span>
                          <span className="text-xs text-slate-400">
                            {d.getDate()}/{d.getMonth() + 1}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="bg-teal-50 rounded-2xl p-4 border border-teal-100">
                <p className="text-teal-800 font-bold text-xs mb-1">💡 Recuerda</p>
                <p className="text-teal-700 text-xs leading-relaxed">
                  Este registro es tuyo y solo tuyo. Nadie en el centro puede ver tus respuestas individuales.
                  Los datos son completamente anónimos.
                </p>
              </div>
            </motion.div>
          )}

          {/* ── BURNOUT ── */}
          {tab === 'burnout' && (
            <motion.div key="burnout" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} className="space-y-4">

              {!burnoutResultado ? (
                <>
                  <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
                    <h2 className="font-black text-slate-800 text-lg mb-1">Test de desgaste profesional</h2>
                    <p className="text-slate-500 text-sm mb-1">Basado en el MBI (Maslach Burnout Inventory), versión breve.</p>
                    <p className="text-xs text-slate-400">9 preguntas · 5 minutos · Anónimo</p>

                    <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <motion.div className="h-full rounded-full bg-teal-500"
                        animate={{ width: `${(respondidas / BURNOUT_ITEMS.length) * 100}%` }}
                        transition={{ duration: 0.4 }} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{respondidas}/{BURNOUT_ITEMS.length} respondidas</p>
                  </div>

                  {BURNOUT_ITEMS.map((item, idx) => (
                    <motion.div key={item.id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                      <p className="text-sm font-semibold text-slate-700 mb-3 leading-snug">{item.texto}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {BURNOUT_OPCIONES.map(op => (
                          <button key={op.valor} onClick={() => setBurnoutResp(r => ({ ...r, [item.id]: op.valor }))}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                            style={burnoutResp[item.id] === op.valor
                              ? { background: '#0f6b6b', color: 'white' }
                              : { background: '#f1f5f9', color: '#64748b' }}>
                            {op.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  ))}

                  {completo && (
                    <button onClick={completarBurnout}
                      className="w-full py-4 rounded-2xl text-white font-black text-base shadow-lg"
                      style={{ background: 'linear-gradient(135deg, #1e3a5f, #0f6b6b)' }}>
                      Ver mi resultado →
                    </button>
                  )}
                </>
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4">

                  {/* Resultado principal */}
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 text-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
                      style={{ background: burnoutResultado.bg }}>
                      <Activity className="w-8 h-8" style={{ color: burnoutResultado.color }} />
                    </div>
                    <p className="font-black text-3xl mb-1" style={{ color: burnoutResultado.color }}>
                      {burnoutResultado.nivel}
                    </p>
                    <p className="text-xs text-slate-400 mb-3">Puntuación total: {burnoutResultado.total}/54</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{burnoutResultado.desc}</p>
                  </div>

                  {/* Desglose por dimensiones */}
                  <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
                    <p className="font-bold text-slate-700 mb-3 text-sm">Desglose por dimensiones</p>
                    {[
                      { label: 'Cansancio emocional', val: burnoutResultado.canRaw, max: 18, inv: true },
                      { label: 'Despersonalización', val: burnoutResultado.desRaw, max: 18, inv: true },
                      { label: 'Realización personal', val: burnoutResultado.reaRaw, max: 18, inv: false },
                    ].map(dim => {
                      const pct = (dim.val / dim.max) * 100
                      const bueno = dim.inv ? dim.val <= 6 : dim.val >= 12
                      const col = bueno ? '#16a34a' : dim.val <= 12 ? '#ca8a04' : '#dc2626'
                      return (
                        <div key={dim.label} className="mb-3">
                          <div className="flex justify-between mb-1">
                            <p className="text-xs font-semibold text-slate-600">{dim.label}</p>
                            <p className="text-xs font-bold" style={{ color: col }}>{dim.val}/{dim.max}</p>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                            <motion.div className="h-full rounded-full"
                              style={{ background: col, width: `${pct}%` }}
                              initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.6 }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex gap-3">
                    {!burnoutGuardado ? (
                      <button onClick={guardarBurnout}
                        className="flex-1 py-3 rounded-2xl text-white font-bold text-sm"
                        style={{ background: 'linear-gradient(135deg, #1e3a5f, #0f6b6b)' }}>
                        Guardar en mi historial
                      </button>
                    ) : (
                      <div className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-teal-50 border border-teal-200">
                        <CheckCircle className="w-4 h-4 text-teal-600" />
                        <p className="text-teal-700 text-sm font-bold">Guardado</p>
                      </div>
                    )}
                    <button onClick={() => { setBurnoutResultado(null); setBurnoutResp({}); setBurnoutGuardado(false) }}
                      className="px-4 py-3 rounded-2xl bg-slate-100 text-slate-600 text-sm font-bold">
                      Repetir
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── RESPIRACIÓN ── */}
          {tab === 'respiracion' && (
            <motion.div key="respiracion" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}>

              {respSeleccionada ? (
                <EjercicioRespiracion
                  ejercicio={respSeleccionada}
                  onVolver={() => setRespSeleccionada(null)} />
              ) : (
                <div className="space-y-4">
                  <div className="bg-white rounded-3xl p-5 shadow-sm border border-teal-50">
                    <h2 className="font-black text-slate-800 text-lg mb-1">Respiración guiada</h2>
                    <p className="text-slate-500 text-sm">
                      Técnicas breves para usar antes, durante y después de clase.
                      Cada ejercicio dura menos de 5 minutos.
                    </p>
                  </div>

                  {RESPIRACIONES.map((r, i) => (
                    <motion.button key={r.id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      onClick={() => setRespSeleccionada(r)}
                      className="w-full bg-white rounded-2xl p-5 shadow-sm border border-slate-100 text-left hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                          style={{ background: r.color + '15' }}>
                          {r.emoji}
                        </div>
                        <div className="flex-1">
                          <p className="font-black text-slate-800 text-sm">{r.nombre}</p>
                          <p className="text-slate-500 text-xs mt-0.5 leading-snug">{r.desc}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                      </div>
                    </motion.button>
                  ))}

                  <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                    <p className="text-blue-800 font-bold text-xs mb-1">🧠 Por qué funciona</p>
                    <p className="text-blue-700 text-xs leading-relaxed">
                      La respiración lenta activa el nervio vago y frena la respuesta de estrés en menos de 90 segundos.
                      No necesitas creerlo, solo probarlo.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── RECURSOS ── */}
          {tab === 'recursos' && (
            <motion.div key="recursos" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} className="space-y-4">

              <div className="bg-white rounded-3xl p-5 shadow-sm border border-teal-50">
                <h2 className="font-black text-slate-800 text-lg mb-1">Estrategias para el aula</h2>
                <p className="text-slate-500 text-sm">
                  Protocolos breves para situaciones difíciles. Basados en evidencia clínica.
                </p>
              </div>

              {RECURSOS.map((r, i) => (
                <motion.div key={r.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

                  <button className="w-full flex items-center gap-3 p-4 text-left"
                    onClick={() => setRecursoAbierto(recursoAbierto === r.id ? null : r.id)}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: r.bg }}>
                      {r.emoji}
                    </div>
                    <p className="flex-1 font-black text-slate-800 text-sm leading-snug">{r.titulo}</p>
                    <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 transition-transform"
                      style={{ transform: recursoAbierto === r.id ? 'rotate(180deg)' : 'none' }} />
                  </button>

                  <AnimatePresence>
                    {recursoAbierto === r.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-4 pb-4 space-y-3">
                        {r.estrategias.map((e, j) => (
                          <div key={j} className="rounded-xl p-3" style={{ background: r.bg, border: `1px solid ${r.border}` }}>
                            <p className="font-black text-sm mb-1" style={{ color: r.color }}>{e.t}</p>
                            <p className="text-xs text-slate-600 leading-relaxed">{e.d}</p>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="font-bold text-slate-700 text-xs mb-2">📌 Recordatorio</p>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Ningún docente puede gestionar solo una crisis clínica. Tu rol es contener y derivar, no resolver.
                  El orientador es tu aliado, no tu reemplazo.
                </p>
              </div>
            </motion.div>
          )}

          {/* ── EVOLUCIÓN ── */}
          {tab === 'evolucion' && (
            <motion.div key="evolucion" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} className="space-y-4">

              <div className="bg-white rounded-3xl p-5 shadow-sm border border-teal-50">
                <h2 className="font-black text-slate-800 text-lg mb-1">Mi evolución</h2>
                <p className="text-slate-500 text-sm">Historial de tus check-ins y tests. Última semana destacada.</p>
              </div>

              {/* Check-ins */}
              {historialCheckin.length > 0 ? (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <p className="font-bold text-slate-700 text-sm mb-4">Estado emocional — últimas 4 semanas</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-3">
                    {[...historialCheckin].reverse().map(ci => {
                      const est = ESTADOS.find(e => e.id === ci.estado)
                      const d = new Date(ci.fecha + 'T12:00:00')
                      const esHoy = ci.fecha === hoy
                      return (
                        <div key={ci.fecha} className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${esHoy ? 'ring-2 ring-teal-400' : ''}`}
                            style={{ background: (est?.color ?? '#94a3b8') + '20' }}>
                            {est?.emoji ?? '❓'}
                          </div>
                          <span className="text-xs text-slate-400 mt-0.5">
                            {d.getDate()}/{d.getMonth() + 1}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Resumen */}
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {[
                      { label: 'Registros', val: historialCheckin.length },
                      {
                        label: 'Media', val: historialCheckin.length
                          ? (historialCheckin.reduce((s, c) => s + (c.valor ?? 3), 0) / historialCheckin.length).toFixed(1)
                          : '—'
                      },
                      {
                        label: 'Mejor estado',
                        val: historialCheckin.length
                          ? ESTADOS.find(e => e.valor === Math.max(...historialCheckin.map(c => c.valor ?? 0)))?.emoji ?? '—'
                          : '—'
                      },
                    ].map(s => (
                      <div key={s.label} className="bg-slate-50 rounded-xl p-3 text-center">
                        <p className="font-black text-lg text-slate-800">{s.val}</p>
                        <p className="text-xs text-slate-400">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-100">
                  <p className="text-3xl mb-2">📊</p>
                  <p className="font-bold text-slate-600 text-sm">Aún no hay datos</p>
                  <p className="text-slate-400 text-xs mt-1">Empieza con el check-in diario y aquí verás tu evolución.</p>
                </div>
              )}

              {/* Historial burnout */}
              {historialBurnout.length > 0 && (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <p className="font-bold text-slate-700 text-sm mb-3">Tests de burnout realizados</p>
                  <div className="space-y-2">
                    {historialBurnout.map((b, i) => {
                      const cfg =
                        b.nivel === 'Bajo' ? { color: '#16a34a', bg: '#dcfce7' } :
                        b.nivel === 'Moderado' ? { color: '#ca8a04', bg: '#fef9c3' } :
                        { color: '#dc2626', bg: '#fee2e2' }
                      const fecha = new Date(b.created_at)
                      return (
                        <div key={i} className="flex items-center justify-between rounded-xl p-3"
                          style={{ background: cfg.bg }}>
                          <div>
                            <p className="font-black text-sm" style={{ color: cfg.color }}>{b.nivel}</p>
                            <p className="text-xs text-slate-500">
                              {fecha.getDate()}/{fecha.getMonth() + 1}/{fecha.getFullYear()} · Puntuación: {b.total}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-400">CE: {b.cansancio} · DP: {b.despersonalizacion} · RP: {b.realizacion}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="bg-teal-50 rounded-2xl p-4 border border-teal-100 text-center">
                <p className="text-teal-700 text-xs leading-relaxed">
                  Tus datos son anónimos y privados. Solo tú puedes ver este historial.
                  Nadie en el centro tiene acceso a tu información individual.
                </p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// COMPONENTE RAÍZ
// ─────────────────────────────────────────────────────────────
export default function PanelDocente() {
  const [docente, setDocente] = useState(null)
  return docente
    ? <PanelDocenteDashboard docente={docente} onSalir={() => setDocente(null)} />
    : <LoginDocente onAcceso={setDocente} />
}
