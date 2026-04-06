import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/api/supabaseClient'
import { useNavigate } from 'react-router-dom'
import { BookOpen, ChevronRight, ChevronLeft, CheckCircle, Clock, Plus, X } from 'lucide-react'

// ── DATOS ─────────────────────────────────────────────────────

const EMOCIONES = [
  { id: 'feliz',        emoji: '😄', label: 'Feliz',        color: '#16a34a', bg: '#dcfce7' },
  { id: 'tranquilo',    emoji: '😌', label: 'Tranquilo/a',  color: '#0891b2', bg: '#cffafe' },
  { id: 'motivado',     emoji: '💪', label: 'Motivado/a',   color: '#7c3aed', bg: '#ede9fe' },
  { id: 'triste',       emoji: '😢', label: 'Triste',       color: '#1d4ed8', bg: '#dbeafe' },
  { id: 'enfadado',     emoji: '😠', label: 'Enfadado/a',   color: '#dc2626', bg: '#fee2e2' },
  { id: 'ansioso',      emoji: '😰', label: 'Ansioso/a',    color: '#ea580c', bg: '#ffedd5' },
  { id: 'aburrido',     emoji: '😑', label: 'Aburrido/a',   color: '#64748b', bg: '#f1f5f9' },
  { id: 'avergonzado',  emoji: '😳', label: 'Avergonzado/a',color: '#be185d', bg: '#fce7f3' },
  { id: 'culpable',     emoji: '😟', label: 'Culpable',     color: '#92400e', bg: '#fef3c7' },
  { id: 'agobiado',     emoji: '🤯', label: 'Agobiado/a',   color: '#b45309', bg: '#fef3c7' },
  { id: 'solo',         emoji: '🫥', label: 'Solo/a',       color: '#475569', bg: '#f8fafc' },
  { id: 'confuso',      emoji: '😕', label: 'Confuso/a',    color: '#0d9488', bg: '#ccfbf1' },
]

const SITUACIONES = [
  'En clase', 'En el recreo', 'Con familia', 'Con amigos',
  'Redes sociales', 'Preparando exámenes', 'En casa solo/a',
  'Partido / actividad deportiva', 'Trayecto al colegio',
]

const SITUACIONES_TIPO = [
  'Tensión con un compañero', 'Crítica del profesor', 'Problema familiar',
  'Fracaso académico percibido', 'Examen o control', 'Discusión en redes',
  'Me han excluido', 'No he llegado a una fecha límite', 'He cometido un error',
]

const PENSAMIENTOS_SUGERIDOS = [
  '"No voy a aprobar"', '"Todos me juzgan"', '"Soy tonto/a por no poder"',
  '"No le importo a nadie"', '"Todo me sale mal"', '"No sirvo para esto"',
  '"Me van a castigar"', '"Debería haberlo hecho mejor"',
]

const ESTRATEGIAS = [
  { id: 'calle', emoji: '🤐', label: 'Me callé' },
  { id: 'brusco', emoji: '💥', label: 'Reaccioné de forma brusca' },
  { id: 'fui', emoji: '🚶', label: 'Me fui a otro lugar' },
  { id: 'tecnica', emoji: '🧘', label: 'Usé técnica de calmado' },
  { id: 'hable', emoji: '🗣️', label: 'Hablé con alguien' },
  { id: 'bloqueo', emoji: '🫥', label: 'Me quedé bloqueado/a' },
  { id: 'llore', emoji: '😭', label: 'Lloré' },
  { id: 'distrae', emoji: '📱', label: 'Me distraje con el móvil' },
]

const ZONAS_CORPORALES = [
  { id: 'corazon', emoji: '💓', label: 'Corazón' },
  { id: 'estomago', emoji: '🫃', label: 'Estómago' },
  { id: 'cabeza', emoji: '🤕', label: 'Cabeza' },
  { id: 'manos', emoji: '🤲', label: 'Manos' },
  { id: 'pecho', emoji: '🫁', label: 'Pecho' },
  { id: 'musculos', emoji: '💪', label: 'Tensión muscular' },
]

// ── COMPONENTES AUXILIARES ────────────────────────────────────

function TagButton({ emoji, label, selected, color, bg, onClick }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all text-sm font-medium"
      style={{
        background: selected ? bg : 'white',
        borderColor: selected ? color : '#e2e8f0',
        color: selected ? color : '#64748b',
      }}>
      {emoji && <span>{emoji}</span>}
      <span>{label}</span>
    </button>
  )
}

function SliderEstres({ value, onChange, label }) {
  const getColor = v => v <= 3 ? '#16a34a' : v <= 6 ? '#ca8a04' : '#dc2626'
  const getEmoji = v => v <= 2 ? '😌' : v <= 4 ? '😐' : v <= 6 ? '😟' : v <= 8 ? '😰' : '😱'
  const color = getColor(value)
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        <div className="flex items-center gap-1">
          <span className="text-xl">{getEmoji(value)}</span>
          <span className="font-black text-xl" style={{ color }}>{value}</span>
          <span className="text-slate-400 text-sm">/10</span>
        </div>
      </div>
      <input type="range" min="0" max="10" value={value} onChange={e => onChange(Number(e.target.value))}
        className="w-full h-3 rounded-full appearance-none cursor-pointer"
        style={{ background: `linear-gradient(to right, ${color} ${value*10}%, #e2e8f0 ${value*10}%)`, accentColor: color }} />
      <div className="flex justify-between mt-1">
        <span className="text-xs text-green-500">Nada</span>
        <span className="text-xs text-red-500">Desbordado/a</span>
      </div>
    </div>
  )
}

// ── PASOS DEL DIARIO ──────────────────────────────────────────

const PASOS_TOTAL = 7

export default function Diario() {
  const [paso, setPaso] = useState(0) // 0=lista entradas, 1-7=nueva entrada
  const [entradas, setEntradas] = useState([])
  const [loadingEntradas, setLoadingEntradas] = useState(true)
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  // Estado de la nueva entrada
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 16))
  const [emocionPrincipal, setEmocionPrincipal] = useState(null)
  const [intensidad, setIntensidad] = useState(5)
  const [emocionesSecundarias, setEmocionesSecundarias] = useState([])
  const [situaciones, setSituaciones] = useState([])
  const [situacionTexto, setSituacionTexto] = useState('')
  const [pensamientos, setPensamientos] = useState([])
  const [pensamientoLibre, setPensamientoLibre] = useState('')
  const [estrategias, setEstrategias] = useState([])
  const [nivelEstres, setNivelEstres] = useState(5)
  const [zonasCorporales, setZonasCorporales] = useState([])
  const [loCosto, setLoCosto] = useState('')
  const [loBien, setLoBien] = useState('')
  const [paraMañana, setParaMañana] = useState('')

  const toggle = (lista, setLista, item) =>
    setLista(prev => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item])

  useEffect(() => {
    cargarEntradas()
  }, [])

  const cargarEntradas = async () => {
    setLoadingEntradas(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('diario_completo')
        .select('*').eq('user_id', user.id)
        .order('fecha_entrada', { ascending: false }).limit(20)
      setEntradas(data || [])
    } catch (e) { console.error(e) }
    finally { setLoadingEntradas(false) }
  }

  const guardarEntrada = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Obtener centro_id del perfil del alumno
      const { data: perfil } = await supabase
        .from('perfiles_alumnos')
        .select('centro_id')
        .eq('user_id', user.id)
        .single()

      await supabase.from('diario_completo').insert({
        user_id: user.id,
        centro_id: perfil?.centro_id || null,
        fecha_entrada: new Date(fecha).toISOString(),
        emocion_principal: emocionPrincipal,
        intensidad,
        emociones_secundarias: emocionesSecundarias,
        situaciones,
        situacion_texto: situacionTexto,
        pensamientos,
        pensamiento_libre: pensamientoLibre,
        estrategia_usada: estrategias,
        nivel_estres: nivelEstres,
        zonas_corporales: zonasCorporales,
        lo_que_costo: loCosto,
        lo_que_bien: loBien,
        para_manana: paraMañana,
      })
      await cargarEntradas()
      setPaso(0)
      resetForm()
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const resetForm = () => {
    setFecha(new Date().toISOString().slice(0, 16))
    setEmocionPrincipal(null); setIntensidad(5); setEmocionesSecundarias([])
    setSituaciones([]); setSituacionTexto(''); setPensamientos([])
    setPensamientoLibre(''); setEstrategias([]); setNivelEstres(5)
    setZonasCorporales([]); setLoCosto(''); setLoBien(''); setParaMañana('')
  }

  const formatFecha = (iso) => {
    const d = new Date(iso)
    return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  // ── VISTA LISTA ──
  if (paso === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black" style={{ color: '#0d3d3d' }}>Diario emocional</h1>
              <p className="text-slate-500 text-sm">Registra cómo te sientes</p>
            </div>
          </div>
          <button onClick={() => { resetForm(); setPaso(1) }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>
            <Plus className="w-4 h-4" /> Nueva
          </button>
        </div>

        {loadingEntradas ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
          </div>
        ) : entradas.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-100">
            <span className="text-5xl block mb-3">📓</span>
            <p className="font-bold text-slate-700">Aún no hay entradas</p>
            <p className="text-slate-400 text-sm mt-1">Pulsa "Nueva" para registrar cómo te sientes hoy</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entradas.map((entrada, i) => {
              const emocion = EMOCIONES.find(e => e.id === entrada.emocion_principal)
              return (
                <motion.div key={entrada.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: emocion?.bg || '#f1f5f9' }}>
                      {emocion?.emoji || '📓'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-bold text-slate-800 text-sm">{emocion?.label || 'Sin emoción'}</p>
                        {entrada.intensidad != null && (
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded-lg"
                            style={{ color: emocion?.color || '#64748b', background: emocion?.bg || '#f1f5f9' }}>
                            {entrada.intensidad}/10
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatFecha(entrada.fecha_entrada)}
                      </p>
                      {entrada.lo_que_bien && (
                        <p className="text-xs text-slate-500 mt-1 truncate">✅ {entrada.lo_que_bien}</p>
                      )}
                    </div>
                    {entrada.nivel_estres != null && (
                      <div className="text-right flex-shrink-0">
                        <p className="font-black text-sm" style={{ color: entrada.nivel_estres <= 3 ? '#16a34a' : entrada.nivel_estres <= 6 ? '#ca8a04' : '#dc2626' }}>
                          {entrada.nivel_estres}/10
                        </p>
                        <p className="text-xs text-slate-400">estrés</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ── BARRA DE PROGRESO ──
  const ProgressBar = () => (
    <div className="flex gap-1.5 mb-2">
      {Array.from({ length: PASOS_TOTAL }).map((_, i) => (
        <div key={i} className="flex-1 h-1.5 rounded-full transition-all"
          style={{ background: i < paso - 1 ? '#0f6b6b' : i === paso - 1 ? '#5eead4' : '#e2e8f0' }} />
      ))}
    </div>
  )

  const NavButtons = ({ canNext = true, isLast = false }) => (
    <div className="flex gap-2 mt-6">
      <button onClick={() => paso === 1 ? setPaso(0) : setPaso(paso - 1)}
        className="px-4 py-3 rounded-2xl border border-slate-200 text-slate-500 font-medium text-sm flex items-center gap-1">
        <ChevronLeft className="w-4 h-4" /> {paso === 1 ? 'Cancelar' : 'Atrás'}
      </button>
      {!isLast ? (
        <button onClick={() => setPaso(paso + 1)} disabled={!canNext}
          className="flex-1 py-3 rounded-2xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>
          Siguiente <ChevronRight className="w-4 h-4" />
        </button>
      ) : (
        <button onClick={guardarEntrada} disabled={saving}
          className="flex-1 py-3 rounded-2xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>
          {saving ? 'Guardando...' : <><CheckCircle className="w-4 h-4" /> Guardar entrada</>}
        </button>
      )}
    </div>
  )

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <ProgressBar />
      <p className="text-xs text-slate-400 mb-4">Paso {paso} de {PASOS_TOTAL}</p>

      <AnimatePresence mode="wait">
        <motion.div key={paso} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>

          {/* ── PASO 1: FECHA ── */}
          {paso === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-black text-slate-800 mb-1">📅 Fecha y hora</h2>
                <p className="text-slate-500 text-sm">¿Cuándo ocurrió esto? Puedes editarla.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Fecha y hora de la entrada</label>
                <input type="datetime-local" value={fecha} onChange={e => setFecha(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400" />
              </div>
              <NavButtons canNext={true} />
            </div>
          )}

          {/* ── PASO 2: EMOCIÓN ── */}
          {paso === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-black text-slate-800 mb-1">❤️ ¿Qué emoción tienes ahora?</h2>
                <p className="text-slate-500 text-sm">Elige la principal y su intensidad.</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {EMOCIONES.map(emocion => (
                  <button key={emocion.id} onClick={() => setEmocionPrincipal(emocion.id)}
                    className="flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all"
                    style={{
                      background: emocionPrincipal === emocion.id ? emocion.bg : 'white',
                      borderColor: emocionPrincipal === emocion.id ? emocion.color : '#e2e8f0',
                    }}>
                    <span className="text-2xl">{emocion.emoji}</span>
                    <span className="text-xs font-medium leading-tight text-center"
                      style={{ color: emocionPrincipal === emocion.id ? emocion.color : '#64748b' }}>
                      {emocion.label}
                    </span>
                  </button>
                ))}
              </div>

              {emocionPrincipal && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <SliderEstres value={intensidad} onChange={setIntensidad} label="Intensidad de la emoción" />
                </motion.div>
              )}

              <div>
                <p className="text-sm font-medium text-slate-600 mb-2">¿Hay otras emociones también? (opcional)</p>
                <div className="flex flex-wrap gap-2">
                  {EMOCIONES.filter(e => e.id !== emocionPrincipal).map(emocion => (
                    <button key={emocion.id}
                      onClick={() => toggle(emocionesSecundarias, setEmocionesSecundarias, emocion.id)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border-2 transition-all text-xs font-medium"
                      style={{
                        background: emocionesSecundarias.includes(emocion.id) ? emocion.bg : 'white',
                        borderColor: emocionesSecundarias.includes(emocion.id) ? emocion.color : '#e2e8f0',
                        color: emocionesSecundarias.includes(emocion.id) ? emocion.color : '#64748b',
                      }}>
                      {emocion.emoji} {emocion.label}
                    </button>
                  ))}
                </div>
              </div>
              <NavButtons canNext={!!emocionPrincipal} />
            </div>
          )}

          {/* ── PASO 3: SITUACIONES ── */}
          {paso === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-black text-slate-800 mb-1">📍 ¿Qué situaciones te han marcado?</h2>
                <p className="text-slate-500 text-sm">¿Dónde estabas? ¿Qué pasó?</p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-600 mb-2">¿Dónde estabas?</p>
                <div className="flex flex-wrap gap-2">
                  {SITUACIONES.map(s => (
                    <TagButton key={s} label={s}
                      selected={situaciones.includes(s)} color="#0f6b6b" bg="#ccfbf1"
                      onClick={() => toggle(situaciones, setSituaciones, s)} />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-600 mb-2">¿Qué tipo de situación fue?</p>
                <div className="flex flex-wrap gap-2">
                  {SITUACIONES_TIPO.map(s => (
                    <TagButton key={s} label={s}
                      selected={situaciones.includes(s)} color="#7c3aed" bg="#ede9fe"
                      onClick={() => toggle(situaciones, setSituaciones, s)} />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-600 mb-2">Cuéntame más (opcional)</p>
                <textarea value={situacionTexto} onChange={e => setSituacionTexto(e.target.value)}
                  placeholder="Describe brevemente qué pasó..."
                  rows={3} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 resize-none" />
              </div>
              <NavButtons canNext={true} />
            </div>
          )}

          {/* ── PASO 4: PENSAMIENTOS ── */}
          {paso === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-black text-slate-800 mb-1">🧠 ¿Qué pensaste?</h2>
                <p className="text-slate-500 text-sm">Pensamientos automáticos que aparecieron.</p>
              </div>

              <div className="space-y-2">
                {PENSAMIENTOS_SUGERIDOS.map(p => (
                  <button key={p} onClick={() => toggle(pensamientos, setPensamientos, p)}
                    className="w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm italic"
                    style={{
                      background: pensamientos.includes(p) ? '#fee2e2' : 'white',
                      borderColor: pensamientos.includes(p) ? '#dc2626' : '#e2e8f0',
                      color: pensamientos.includes(p) ? '#dc2626' : '#64748b',
                    }}>
                    {pensamientos.includes(p) ? '✓ ' : '+ '}{p}
                  </button>
                ))}
              </div>

              <div>
                <p className="text-sm font-medium text-slate-600 mb-2">Añade tu propio pensamiento (opcional)</p>
                <textarea value={pensamientoLibre} onChange={e => setPensamientoLibre(e.target.value)}
                  placeholder='"Lo que pensé fue..."'
                  rows={2} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 resize-none" />
              </div>
              <NavButtons canNext={true} />
            </div>
          )}

          {/* ── PASO 5: ESTRATEGIAS ── */}
          {paso === 5 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-black text-slate-800 mb-1">🤔 ¿Qué hiciste con la emoción?</h2>
                <p className="text-slate-500 text-sm">Puedes seleccionar varias opciones.</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {ESTRATEGIAS.map(e => (
                  <button key={e.id} onClick={() => toggle(estrategias, setEstrategias, e.id)}
                    className="flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left"
                    style={{
                      background: estrategias.includes(e.id) ? '#ccfbf1' : 'white',
                      borderColor: estrategias.includes(e.id) ? '#0f6b6b' : '#e2e8f0',
                    }}>
                    <span className="text-2xl">{e.emoji}</span>
                    <span className="text-sm font-medium" style={{ color: estrategias.includes(e.id) ? '#0d3d3d' : '#64748b' }}>
                      {e.label}
                    </span>
                  </button>
                ))}
              </div>
              <NavButtons canNext={true} />
            </div>
          )}

          {/* ── PASO 6: ESTRÉS CORPORAL ── */}
          {paso === 6 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-black text-slate-800 mb-1">💓 Nivel de estrés y cuerpo</h2>
                <p className="text-slate-500 text-sm">¿Cómo está tu cuerpo ahora?</p>
              </div>

              <SliderEstres value={nivelEstres} onChange={setNivelEstres} label="Nivel de estrés / malestar" />

              <div>
                <p className="text-sm font-medium text-slate-600 mb-2">¿Dónde sientes la tensión?</p>
                <div className="grid grid-cols-3 gap-2">
                  {ZONAS_CORPORALES.map(z => (
                    <button key={z.id} onClick={() => toggle(zonasCorporales, setZonasCorporales, z.id)}
                      className="flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all"
                      style={{
                        background: zonasCorporales.includes(z.id) ? '#fee2e2' : 'white',
                        borderColor: zonasCorporales.includes(z.id) ? '#dc2626' : '#e2e8f0',
                      }}>
                      <span className="text-2xl">{z.emoji}</span>
                      <span className="text-xs font-medium"
                        style={{ color: zonasCorporales.includes(z.id) ? '#dc2626' : '#64748b' }}>
                        {z.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <NavButtons canNext={true} />
            </div>
          )}

          {/* ── PASO 7: REFLEXIÓN ── */}
          {paso === 7 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-black text-slate-800 mb-1">✨ Reflexión del día</h2>
                <p className="text-slate-500 text-sm">Solo 1-2 líneas. Sin presión.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  😓 Lo que más me ha costado hoy fue...
                </label>
                <textarea value={loCosto} onChange={e => setLoCosto(e.target.value)}
                  placeholder="Escribe libremente..." rows={2}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  ✅ Hoy he hecho bien...
                </label>
                <textarea value={loBien} onChange={e => setLoBien(e.target.value)}
                  placeholder="Aunque sea algo pequeño..." rows={2}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  🎯 Para mañana me propongo...
                </label>
                <textarea value={paraMañana} onChange={e => setParaMañana(e.target.value)}
                  placeholder="Una cosa concreta y alcanzable..." rows={2}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 resize-none" />
              </div>

              <NavButtons canNext={true} isLast={true} />
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  )
}
