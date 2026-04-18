import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Brain, Heart, Flame, ChevronDown, ChevronUp, Play, CheckCircle, AlertTriangle, BarChart2, Sparkles, Mic, MicOff, BookOpen, History, Trash2, Square } from 'lucide-react'

const LOGO_URL = 'https://zbusdixrxedfhbkquafh.supabase.co/storage/v1/object/public/logo/WhatsApp%20Image%202026-04-06%20at%2015.58.04.jpeg'

// ── SEMÁFORO EMOCIONAL ────────────────────────────────────────────────────
const ESTADOS_SEMAFORO = [
  { valor: 5, label: 'Muy bien',        emoji: '😄', color: '#16a34a', bg: '#dcfce7', desc: 'Te sientes con energía y motivación.' },
  { valor: 4, label: 'Bien',            emoji: '🙂', color: '#65a30d', bg: '#ecfccb', desc: 'Te encuentras en un buen estado general.' },
  { valor: 3, label: 'Regular',         emoji: '😐', color: '#ca8a04', bg: '#fef9c3', desc: 'Algo de tensión pero manejable.' },
  { valor: 2, label: 'Algo agobiado/a', emoji: '😟', color: '#ea580c', bg: '#ffedd5', desc: 'Hay presión acumulada. Considera una pausa.' },
  { valor: 1, label: 'Muy estresado/a', emoji: '😰', color: '#dc2626', bg: '#fee2e2', desc: 'Nivel alto de estrés. Prioriza el autocuidado ahora.' },
]

const GRATITUD_PREGUNTAS = [
  '¿Qué momento de hoy ha merecido la pena?',
  '¿Qué alumno/a me ha sorprendido positivamente hoy?',
  '¿Qué he hecho bien hoy como docente?',
]

// ── TEST DE ESTRÉS PSS-10 ─────────────────────────────────────────────────
const TEST_PREGUNTAS = [
  { texto: 'En el último mes, ¿con qué frecuencia te has sentido agitado/a o estresado/a por algo inesperado?', inversa: false },
  { texto: '¿Has sentido que eras incapaz de controlar las cosas importantes de tu trabajo?', inversa: false },
  { texto: '¿Te has sentido nervioso/a o bajo presión constante?', inversa: false },
  { texto: '¿Has tenido dificultades para concentrarte debido al agotamiento?', inversa: false },
  { texto: '¿Has sentido que las dificultades se acumulaban tanto que no podías superarlas?', inversa: false },
  { texto: '¿Has podido controlar la forma de pasar tu tiempo en el trabajo?', inversa: true },
  { texto: '¿Has podido manejar con eficacia los problemas de tu día a día?', inversa: true },
  { texto: '¿Has sentido que tenías el control sobre las cosas?', inversa: true },
  { texto: '¿Has podido hacer frente a todas las tareas que se te presentaban?', inversa: true },
  { texto: '¿Has podido controlar tus reacciones emocionales ante situaciones difíciles?', inversa: true },
]
const OPCIONES_ESTRES = [
  { label: 'Nunca', valor: 0 }, { label: 'Casi nunca', valor: 1 },
  { label: 'A veces', valor: 2 }, { label: 'Bastante', valor: 3 }, { label: 'Siempre', valor: 4 },
]

function getResultadoEstres(pts) {
  if (pts <= 13) return { nivel: 'Estrés bajo', color: '#10b981', bg: '#ecfdf5', borde: '#6ee7b7', barra: 20, icono: '😌', desc: 'Tu nivel de estrés es manejable. Mantén tus hábitos de autocuidado y sigue practicando las técnicas que ya conoces.' }
  if (pts <= 26) return { nivel: 'Estrés moderado', color: '#f59e0b', bg: '#fffbeb', borde: '#fcd34d', barra: 55, icono: '😟', desc: 'Hay señales de estrés significativo. Te recomendamos practicar regularmente las técnicas de relajación y revisar la sección de prevención del burnout.' }
  return { nivel: 'Estrés elevado', color: '#ef4444', bg: '#fef2f2', borde: '#fca5a5', barra: 90, icono: '😰', desc: 'Tu nivel de estrés es alto. Prioriza el autocuidado urgente y considera consultar con tu médico o con el orientador de tu centro.' }
}

// ── CUESTIONARIO BURNOUT DOCENTE (MBI-ES) ────────────────────────────────
const BURNOUT_PREGUNTAS = [
  { texto: 'Me siento emocionalmente agotado/a por mi trabajo como docente.', dimension: 'AE' },
  { texto: 'Cuando termino mi jornada, me siento vacío/a por completo.', dimension: 'AE' },
  { texto: 'Me siento cansado/a cuando me levanto por la mañana y tengo que afrontar otro día de trabajo.', dimension: 'AE' },
  { texto: 'Siento que trabajar todo el día con el alumnado supone un gran esfuerzo emocional.', dimension: 'AE' },
  { texto: 'Me siento frustrado/a por mi trabajo docente.', dimension: 'AE' },
  { texto: 'Siento que trato a algunos alumnos/as como si fueran objetos impersonales.', dimension: 'DP' },
  { texto: 'Me he vuelto más insensible hacia las personas desde que ejerzo esta profesión.', dimension: 'DP' },
  { texto: 'Me preocupa que este trabajo me esté endureciendo emocionalmente.', dimension: 'DP' },
  { texto: 'No me importa realmente lo que les ocurra a algunos de mis alumnos/as.', dimension: 'DP' },
  { texto: 'Puedo comprender con facilidad cómo se sienten mis alumnos/as.', dimension: 'RP' },
  { texto: 'Trato eficazmente los problemas de mis alumnos/as.', dimension: 'RP' },
  { texto: 'Creo que estoy influyendo positivamente con mi trabajo en la vida de mis alumnos/as.', dimension: 'RP' },
  { texto: 'Me siento con mucha energía en mi trabajo.', dimension: 'RP' },
  { texto: 'Puedo crear fácilmente una atmósfera relajada con mis alumnos/as.', dimension: 'RP' },
]
const OPCIONES_BURNOUT = [
  { label: 'Nunca', valor: 0 }, { label: 'Alguna vez', valor: 1 },
  { label: 'A veces', valor: 2 }, { label: 'Frecuente', valor: 3 }, { label: 'Siempre', valor: 4 },
]

function getResultadoBurnout(respuestas) {
  let ae = 0, dp = 0, rp = 0, cntAE = 0, cntDP = 0, cntRP = 0
  BURNOUT_PREGUNTAS.forEach((p, i) => {
    const v = respuestas[i] ?? 0
    if (p.dimension === 'AE') { ae += v; cntAE++ }
    else if (p.dimension === 'DP') { dp += v; cntDP++ }
    else { rp += (4 - v); cntRP++ }
  })
  const nivel = (score, max) => {
    const pct = score / max
    if (pct < 0.33) return { label: 'Bajo', color: '#10b981', pct: pct * 100 }
    if (pct < 0.66) return { label: 'Moderado', color: '#f59e0b', pct: pct * 100 }
    return { label: 'Alto', color: '#ef4444', pct: pct * 100 }
  }
  const nAE = nivel(ae, cntAE * 4), nDP = nivel(dp, cntDP * 4), nRP = nivel(rp, cntRP * 4)
  const riesgo = [nAE, nDP, nRP].filter(n => n.label === 'Alto').length
  let global, globalColor, globalDesc
  if (riesgo === 0) { global = 'Sin riesgo significativo'; globalColor = '#10b981'; globalDesc = 'Tus puntuaciones indican que, por el momento, no hay señales preocupantes de burnout. Mantén tus estrategias de autocuidado.' }
  else if (riesgo === 1) { global = 'Riesgo incipiente'; globalColor = '#f59e0b'; globalDesc = 'Hay una dimensión con puntuación elevada. Presta atención a esa área y activa estrategias preventivas antes de que avance.' }
  else if (riesgo === 2) { global = 'Riesgo moderado-alto'; globalColor = '#f97316'; globalDesc = 'Dos dimensiones muestran puntuaciones preocupantes. Te recomendamos trabajar activamente en las estrategias de este panel y buscar apoyo.' }
  else { global = 'Burnout severo'; globalColor = '#ef4444'; globalDesc = 'Las tres dimensiones presentan niveles elevados. Es importante que consultes con tu médico o con el orientador de tu centro a la mayor brevedad.' }
  return { nAE, nDP, nRP, global, globalColor, globalDesc }
}

// ── EJERCICIOS RELAJACIÓN ─────────────────────────────────────────────────
const EJERCICIOS = [
  { id: 'respiracion', emoji: '🫁', titulo: 'Respiración 4-7-8', duracion: '3 min', desc: 'Activa el sistema nervioso parasimpático y reduce la tensión acumulada.', pasos: ['Siéntate cómodamente con la espalda recta.', 'Inhala por la nariz contando mentalmente hasta 4.', 'Retén el aire contando hasta 7.', 'Exhala lentamente por la boca contando hasta 8.', 'Repite el ciclo entre 4 y 6 veces.', 'Al terminar, observa cómo tu cuerpo se ha relajado.'] },
  { id: 'muscular', emoji: '💪', titulo: 'Relajación muscular progresiva', duracion: '8 min', desc: 'Técnica de Jacobson adaptada. Tensa y suelta grupos musculares de forma secuencial.', pasos: ['Siéntate o túmbate en un lugar tranquilo.', 'Cierra los ojos y respira profundamente 3 veces.', 'Tensa los pies durante 5 segundos. Suéltalos. Nota la diferencia.', 'Sube progresivamente: pantorrillas → muslos → abdomen → manos → brazos → hombros → cara.', 'En cada grupo: tensa 5 seg → suelta → respira → avanza al siguiente.', 'Termina respirando profundo y abriendo los ojos despacio.'] },
  { id: 'mindfulness', emoji: '🧘', titulo: 'Pausa mindful de 5 minutos', duracion: '5 min', desc: 'Un momento de atención plena para resetear entre clase y clase.', pasos: ['Pon un temporizador en 5 minutos.', 'Cierra los ojos o baja la mirada al suelo.', 'Siente el peso de tu cuerpo en la silla. Los pies apoyados en el suelo.', 'Observa tu respiración sin cambiarla. Solo obsérvala.', 'Cuando llegue un pensamiento, nómbralo ("hay un pensamiento") y vuelve a la respiración.', 'Al sonar el temporizador, toma una respiración profunda y retoma el día.'] },
  { id: 'grounding', emoji: '🌿', titulo: 'Grounding 5-4-3-2-1', duracion: '2 min', desc: 'Ancla tu atención al presente usando los sentidos. Ideal antes de una clase difícil.', pasos: ['Nombra mentalmente 5 cosas que puedes VER a tu alrededor.', 'Nombra 4 cosas que puedes TOCAR. Tócalas brevemente.', 'Nombra 3 cosas que puedes OÍR ahora mismo.', 'Nombra 2 cosas que puedes OLER (o que te gustaría oler).', 'Nombra 1 cosa que puedes SABOREAR.', 'Respira hondo. Ya estás en el presente.'] },
]

// ── GRADOS DE BURNOUT ─────────────────────────────────────────────────────
const GRADOS = [
  { id: 'prevencion', nivel: 'Prevención', subtitulo: 'Día a día', color: '#10b981', bg: 'rgba(16,185,129,0.06)', borde: 'rgba(16,185,129,0.2)', emoji: '🟢', desc: 'Para cuando todo va bien. Hábitos que construyen resistencia antes de que llegue el problema.', ejercicios: [
    { id: 'desconexion', emoji: '🚪', titulo: 'Ritual de desconexión al salir', duracion: '2 min', desc: 'Un cierre simbólico que separa el trabajo de tu vida personal.', pasos: ['Antes de salir del aula, para un momento y respira profundo 3 veces.', 'Haz un pequeño escáner corporal: ¿dónde tienes tensión? Suéltala conscientemente.', 'Nombra en voz baja 3 cosas que han ido bien hoy, aunque sean pequeñas.', 'Di mentalmente: "Aquí termina mi jornada. Lo que no está resuelto puede esperar."', 'Sal del aula y, si puedes, cambia físicamente de espacio antes de mirar el móvil.'] },
    { id: 'gratitud_ej', emoji: '📓', titulo: 'Diario de gratitud docente', duracion: '5 min', desc: 'Tres preguntas concretas que contrarrestan el sesgo negativo acumulado.', pasos: ['Busca un momento tranquilo al final del día.', 'Escribe o reflexiona: ¿Qué momento de hoy ha merecido la pena?', 'Pregúntate: ¿Qué alumno/a me ha sorprendido positivamente hoy?', 'Termina con: ¿Qué he hecho bien hoy como docente?', 'Hazlo durante 21 días seguidos para notar un cambio real en la perspectiva.'] },
  ]},
  { id: 'tension', nivel: 'Tensión aguda', subtitulo: 'En el momento', color: '#f59e0b', bg: 'rgba(245,158,11,0.06)', borde: 'rgba(245,158,11,0.2)', emoji: '🟡', desc: 'Para cuando estás en medio de un momento difícil: conflicto, desbordamiento, agobio repentino.', ejercicios: [
    { id: 'respiracion-cuadrada', emoji: '⬜', titulo: 'Respiración cuadrada guiada', duracion: '3 min', desc: 'Técnica de regulación del sistema nervioso. Disponible con voz guiada en Resetea.', pasos: ['Accede a la respiración cuadrada desde el menú de Respiración de Resetea.', 'Si estás en clase: inhala 4 seg → retén 4 seg → exhala 4 seg → retén 4 seg.', 'Repite el ciclo entre 4 y 6 veces.', 'Puedes hacerlo con los ojos abiertos y de pie, nadie lo notará.', 'En 3 minutos tu sistema nervioso habrá bajado significativamente la activación.'], enlace: '/respiracion', botonLabel: '🎧 Abrir respiración guiada' },
    { id: 'stop', emoji: '✋', titulo: 'Técnica STOP', duracion: '90 seg', desc: 'Cuatro pasos para salir del piloto automático en cualquier momento.', pasos: ['S — STOP: Para lo que estás haciendo. Solo un segundo.', 'T — TAKE A BREATH: Toma una respiración lenta y profunda.', 'O — OBSERVE: Observa qué está pasando dentro de ti: ¿qué sientes? ¿qué piensas?', 'P — PROCEED: Continúa con lo que estabas haciendo, pero ahora con más consciencia.', 'Todo el proceso cabe en 90 segundos.'] },
    { id: 'movimiento', emoji: '🙆', titulo: 'Movimiento en la silla', duracion: '2 min', desc: 'La tensión docente se acumula en hombros, cuello y mandíbula. Esto la suelta.', pasos: ['Siéntate con la espalda recta y los pies apoyados en el suelo.', 'Rotación de hombros: 5 veces hacia adelante, 5 hacia atrás. Despacio.', 'Inclinación lateral de cuello: oreja derecha hacia hombro derecho, aguanta 10 seg. Repite al otro lado.', 'Apertura de pecho: entrelaza las manos detrás de la espalda, saca pecho y respira profundo 3 veces.', 'Mandíbula: abre y cierra la boca exageradamente 5 veces.', 'Termina sacudiendo suavemente manos y muñecas durante 10 segundos.'] },
  ]},
  { id: 'recuperacion', nivel: 'Burnout instalado', subtitulo: 'Recuperación', color: '#ef4444', bg: 'rgba(239,68,68,0.06)', borde: 'rgba(239,68,68,0.2)', emoji: '🔴', desc: 'Para cuando el agotamiento ya es crónico. Ejercicios que reconectan con el sentido y la energía.', ejercicios: [
    { id: 'visualizacion', emoji: '🌅', titulo: 'Visualización del docente que quiero ser', duracion: '10 min', desc: 'Reconectar con la vocación original para recuperar el sentido.', pasos: ['Busca un lugar tranquilo donde no te interrumpan. Cierra los ojos.', 'Respira profundo 3 veces y deja que el cuerpo se relaje.', 'Recuerda: ¿por qué elegiste ser docente? ¿Qué te movía al principio?', 'Visualiza al docente que eras entonces: ¿cómo entrabas al aula? ¿Qué sentías?', 'Pregúntate: de esos valores y esa energía, ¿qué sigue presente hoy en ti, aunque sea en pequeño?', 'Al abrir los ojos, escribe una frase que resuma lo que quieres recuperar.'] },
    { id: 'carta', emoji: '✉️', titulo: 'Carta a un alumno/a que marcó la diferencia', duracion: '15 min', desc: 'Activar la realización personal, la dimensión más dañada en el burnout avanzado.', pasos: ['Coge papel y bolígrafo (o el móvil si lo prefieres).', 'Piensa en un alumno o alumna al que hayas ayudado.', 'Escríbele una carta. No tienes que enviársela. Nadie la va a leer.', 'Cuéntale qué viste en él/ella, qué te importó, qué hiciste por él/ella.', 'Deja que salga sin censura. Puede que aparezcan emociones. Está bien.', 'Al terminar, lee la carta en voz baja. Observa qué sientes.'] },
    { id: 'recarga', emoji: '🔋', titulo: 'Protocolo de recarga de fin de semana', duracion: '20 min de planificación', desc: 'Una estructura mínima para llegar el lunes con algo de energía.', pasos: ['El viernes por la tarde: cierra la semana. ¿Qué queda pendiente? Escríbelo y déjalo en el trabajo.', 'El sábado: identifica UNA actividad que te recargue de verdad. Ponla en el calendario.', 'El domingo por la mañana: desconexión total del trabajo. Sin correos antes del mediodía.', 'El domingo por la tarde: prepara la semana en no más de 30 minutos.', 'Incluye al menos un momento de conexión social real.', 'El domingo por la noche: cierra el ordenador a una hora fija.'] },
  ]},
]

const BURNOUT_SENALES = [
  { icon: '😮‍💨', titulo: 'Agotamiento emocional', desc: 'Sensación de vaciamiento al final del día, dificultad para desconectar, falta de energía incluso tras descansar.' },
  { icon: '🧊', titulo: 'Despersonalización', desc: 'Actitud distante o cínica hacia el alumnado, pérdida de empatía, sentir que "ya no me importa" como antes.' },
  { icon: '📉', titulo: 'Baja realización personal', desc: 'Sensación de que tu trabajo no tiene impacto, compararte negativamente con colegas, dudas sobre tu vocación.' },
]
const BURNOUT_ESTRATEGIAS = [
  { emoji: '🚧', titulo: 'Pon límites claros', texto: 'Establece un horario real de desconexión. Apaga notificaciones del trabajo fuera del horario lectivo.' },
  { emoji: '🤝', titulo: 'Busca apoyo entre iguales', texto: 'Compartir con compañeros lo que te pesa normaliza la experiencia y reduce el aislamiento.' },
  { emoji: '🎯', titulo: 'Recupera tu "para qué"', texto: 'Escribir 3 momentos recientes en los que has marcado una diferencia positiva puede reorientar la perspectiva.' },
  { emoji: '🛑', titulo: 'Identifica las fuentes de estrés', texto: 'Distingue lo que puedes cambiar de lo que no. Actúa en lo primero; trabaja la aceptación en lo segundo.' },
  { emoji: '🌱', titulo: 'Autocuidado no negociable', texto: 'Sueño, movimiento, alimentación y tiempo social son pilares. El autocuidado no es un lujo.' },
]

// ── UTILIDADES ────────────────────────────────────────────────────────────
function BarraProgreso({ pct, color }) {
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height: 8, background: '#f1f5f9' }}>
      <div className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
    </div>
  )
}

function TarjetaPregunta({ index, total, texto, opciones, valorSeleccionado, onChange, color = '#6366f1', etiqueta = null }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${color}20` }}>
      <div className="px-4 pt-3 pb-2 flex items-center gap-2">
        <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
          style={{ background: color, minWidth: 28, textAlign: 'center' }}>{index + 1}</span>
        {etiqueta && <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: `${color}15`, color }}>{etiqueta}</span>}
        <div className="flex-1" />
        {valorSeleccionado !== undefined && <CheckCircle className="w-4 h-4" style={{ color }} />}
      </div>
      <p className="px-4 pb-3 text-sm font-medium text-slate-700 leading-relaxed">{texto}</p>
      <div className="px-4 pb-4 flex gap-1.5">
        {opciones.map((op, j) => {
          const sel = valorSeleccionado === j
          return (
            <button key={j} onClick={() => onChange(j)}
              className="flex-1 flex flex-col items-center py-2 rounded-xl transition-all"
              style={{ background: sel ? color : '#f8fafc', border: `2px solid ${sel ? color : '#e2e8f0'}`, transform: sel ? 'scale(1.04)' : 'scale(1)' }}>
              <span className="text-xs font-bold text-center leading-tight"
                style={{ color: sel ? 'white' : '#64748b' }}>{op.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function formatFecha(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ── HOOK: grabación de audio ──────────────────────────────────────────────
function useAudioRecorder() {
  const [grabando, setGrabando] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)
  const mediaRef = useRef(null)
  const chunksRef = useRef([])

  const iniciar = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        stream.getTracks().forEach(t => t.stop())
      }
      mr.start()
      mediaRef.current = mr
      setGrabando(true)
    } catch { alert('No se pudo acceder al micrófono') }
  }, [])

  const detener = useCallback(() => {
    if (mediaRef.current) { mediaRef.current.stop(); mediaRef.current = null }
    setGrabando(false)
  }, [])

  const limpiar = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
  }, [audioUrl])

  return { grabando, audioUrl, iniciar, detener, limpiar }
}

// ─────────────────────────────────────────────────────────────────────────────

export default function PanelDocente() {
  const [seccionAbierta, setSeccionAbierta] = useState('semaforo')
  const [ejercicioAbierto, setEjercicioAbierto] = useState(null)
  const [gradoAbierto, setGradoAbierto] = useState('prevencion')
  const [ejercGradoAbierto, setEjercGradoAbierto] = useState(null)
  const [burnoutAbierto, setBurnoutAbierto] = useState(null)

  // Tests
  const [respEstres, setRespEstres] = useState({})
  const [resultadoEstres, setResultadoEstres] = useState(null)
  const [respBurnout, setRespBurnout] = useState({})
  const [resultadoBurnout, setResultadoBurnout] = useState(null)

  // Semáforo
  const [estadoSemaforo, setEstadoSemaforo] = useState(null)
  const [semáforoGuardado, setSemaforoGuardado] = useState(false)
  const [historialSemaforo, setHistorialSemaforo] = useState([])

  // Diario gratitud
  const [modoDiario, setModoDiario] = useState('texto') // 'texto' | 'audio'
  const [respGratitud, setRespGratitud] = useState(['', '', ''])
  const [pregActiva, setPregActiva] = useState(0)
  const [historialGratitud, setHistorialGratitud] = useState([])
  const [vistaHistorial, setVistaHistorial] = useState(false)
  const audioRec = useAudioRecorder()

  const toggle = (id) => setSeccionAbierta(prev => prev === id ? null : id)

  // ── Cargar historial ──
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('docente_semaforo') || '[]')
      const g = JSON.parse(localStorage.getItem('docente_gratitud') || '[]')
      setHistorialSemaforo(s)
      setHistorialGratitud(g)
    } catch {}
  }, [])

  // ── Guardar semáforo ──
  const guardarSemaforo = () => {
    if (!estadoSemaforo) return
    const entrada = { fecha: new Date().toISOString(), estado: estadoSemaforo }
    const nuevo = [entrada, ...historialSemaforo].slice(0, 60)
    setHistorialSemaforo(nuevo)
    localStorage.setItem('docente_semaforo', JSON.stringify(nuevo))
    setSemaforoGuardado(true)
    setTimeout(() => setSemaforoGuardado(false), 2000)
  }

  // ── Guardar entrada gratitud ──
  const guardarGratitud = () => {
    const tieneContenido = respGratitud.some(r => r.trim().length > 0)
    if (!tieneContenido && !audioRec.audioUrl) return
    const entrada = {
      fecha: new Date().toISOString(),
      respuestas: respGratitud,
      tieneAudio: !!audioRec.audioUrl,
    }
    const nuevo = [entrada, ...historialGratitud].slice(0, 90)
    setHistorialGratitud(nuevo)
    localStorage.setItem('docente_gratitud', JSON.stringify(nuevo))
    setRespGratitud(['', '', ''])
    audioRec.limpiar()
    setPregActiva(0)
    alert('✅ Entrada guardada en tu diario')
  }

  // ── Tests ──
  const calcularEstres = () => {
    let total = 0
    TEST_PREGUNTAS.forEach((p, i) => { const v = respEstres[i] ?? 0; total += p.inversa ? (4 - v) : v })
    setResultadoEstres(getResultadoEstres(total))
  }
  const calcularBurnout = () => setResultadoBurnout(getResultadoBurnout(respBurnout))
  const estresCompleto = Object.keys(respEstres).length === TEST_PREGUNTAS.length
  const burnoutCompleto = Object.keys(respBurnout).length === BURNOUT_PREGUNTAS.length
  const progEstres = Math.round((Object.keys(respEstres).length / TEST_PREGUNTAS.length) * 100)
  const progBurnout = Math.round((Object.keys(respBurnout).length / BURNOUT_PREGUNTAS.length) * 100)

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* ── Cabecera ── */}
      <div className="rounded-3xl p-6 text-white"
        style={{ background: 'linear-gradient(135deg, #1a2744 0%, #2d4a6b 100%)' }}>
        <div className="flex items-center gap-3 mb-2">
          <img src={LOGO_URL} alt="Resetea" className="w-12 h-12 rounded-full object-cover border-2 border-white/20 shadow-md" />
          <div>
            <h1 className="text-2xl font-black">Panel Docente</h1>
            <p className="text-white/60 text-sm">Recursos para tu bienestar profesional</p>
          </div>
        </div>
        <p className="text-white/70 text-sm leading-relaxed mt-3">
          Cuidas a tus estudiantes cada día. Este espacio es para cuidarte a ti.
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SECCIÓN 1: SEMÁFORO EMOCIONAL
      ══════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
        <button onClick={() => toggle('semaforo')}
          className="w-full flex items-center justify-between p-5 text-left transition-colors"
          style={{ background: seccionAbierta === 'semaforo' ? 'rgba(22,163,74,0.06)' : 'white' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
              style={{ background: 'rgba(22,163,74,0.12)' }}>🚦</div>
            <div>
              <p className="font-bold text-slate-800">Semáforo emocional</p>
              <p className="text-xs text-slate-400">¿Cómo estás hoy? · Registra tu estado</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {historialSemaforo.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: 'rgba(22,163,74,0.1)', color: '#16a34a' }}>
                {historialSemaforo.length} registros
              </span>
            )}
            {seccionAbierta === 'semaforo' ? <ChevronUp className="w-5 h-5 text-slate-300" /> : <ChevronDown className="w-5 h-5 text-slate-300" />}
          </div>
        </button>

        {seccionAbierta === 'semaforo' && (
          <div className="px-5 pb-5 space-y-4">

            {/* Selector visual */}
            <p className="text-xs text-slate-400 pt-1">Selecciona cómo te sientes ahora mismo. Tus registros son privados.</p>
            <div className="space-y-2">
              {ESTADOS_SEMAFORO.map(estado => (
                <button key={estado.valor} onClick={() => setEstadoSemaforo(estado)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all"
                  style={{
                    background: estadoSemaforo?.valor === estado.valor ? estado.bg : 'white',
                    borderColor: estadoSemaforo?.valor === estado.valor ? estado.color : '#e2e8f0',
                    transform: estadoSemaforo?.valor === estado.valor ? 'scale(1.01)' : 'scale(1)',
                  }}>
                  <span className="text-3xl">{estado.emoji}</span>
                  <div className="flex-1">
                    <p className="font-bold text-sm" style={{ color: estadoSemaforo?.valor === estado.valor ? estado.color : '#334155' }}>
                      {estado.label}
                    </p>
                    <p className="text-xs text-slate-400">{estado.desc}</p>
                  </div>
                  {/* Indicador de color */}
                  <div className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ background: estado.color, opacity: estadoSemaforo?.valor === estado.valor ? 1 : 0.25 }} />
                </button>
              ))}
            </div>

            <button onClick={guardarSemaforo} disabled={!estadoSemaforo}
              className="w-full py-3 rounded-2xl text-white font-bold disabled:opacity-40 transition-all"
              style={{ background: estadoSemaforo ? `linear-gradient(135deg, ${estadoSemaforo.color}, ${estadoSemaforo.color}cc)` : '#e2e8f0', color: estadoSemaforo ? 'white' : '#94a3b8' }}>
              {semáforoGuardado ? '✅ Estado guardado' : estadoSemaforo ? `Guardar · ${estadoSemaforo.emoji} ${estadoSemaforo.label}` : 'Selecciona tu estado'}
            </button>

            {/* Instrucciones semáforo */}
            <div className="rounded-2xl p-4 space-y-2"
              style={{ background: 'rgba(22,163,74,0.05)', border: '1px solid rgba(22,163,74,0.15)' }}>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cómo usarlo antes de clase</p>
              {[
                'Antes de entrar al aula, detente un momento fuera de la puerta.',
                '¿En qué color estoy emocionalmente ahora mismo?',
                '🟢 Verde: estás bien, puedes entrar.',
                '🟡 Naranja: hay tensión. Respira profundo 3 veces antes de entrar.',
                '🔴 Rojo: estás muy activado/a. Tómate 60 segundos extra, bebe agua, sacude las manos.',
                'Entrar en rojo tiene un coste. Un minuto de pausa lo previene.',
              ].map((paso, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
                    style={{ background: '#16a34a', minWidth: 20 }}>{i + 1}</span>
                  <p className="text-xs text-slate-600 leading-relaxed">{paso}</p>
                </div>
              ))}
            </div>

            {/* Historial semáforo */}
            {historialSemaforo.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Mis últimos registros</p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {historialSemaforo.slice(0, 20).map((r, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl"
                      style={{ background: `${r.estado.color}08`, border: `1px solid ${r.estado.color}20` }}>
                      <span className="text-lg">{r.estado.emoji}</span>
                      <div className="flex-1">
                        <p className="text-xs font-semibold" style={{ color: r.estado.color }}>{r.estado.label}</p>
                        <p className="text-xs text-slate-400">{formatFecha(r.fecha)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => { setHistorialSemaforo([]); localStorage.removeItem('docente_semaforo') }}
                  className="mt-2 flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3 h-3" /> Borrar historial
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SECCIÓN 2: DIARIO DE GRATITUD
      ══════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
        <button onClick={() => toggle('diarioGratitud')}
          className="w-full flex items-center justify-between p-5 text-left transition-colors"
          style={{ background: seccionAbierta === 'diarioGratitud' ? 'rgba(139,92,246,0.06)' : 'white' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(139,92,246,0.12)' }}>
              <BookOpen className="w-5 h-5" style={{ color: '#8b5cf6' }} />
            </div>
            <div>
              <p className="font-bold text-slate-800">Diario de gratitud docente</p>
              <p className="text-xs text-slate-400">Escribe o graba · 3 preguntas · Historial</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {historialGratitud.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
                {historialGratitud.length} entradas
              </span>
            )}
            {seccionAbierta === 'diarioGratitud' ? <ChevronUp className="w-5 h-5 text-slate-300" /> : <ChevronDown className="w-5 h-5 text-slate-300" />}
          </div>
        </button>

        {seccionAbierta === 'diarioGratitud' && (
          <div className="px-5 pb-5 space-y-4">

            {/* Tabs: nueva entrada / historial */}
            <div className="flex gap-2 pt-1">
              {[{ id: false, label: '✏️ Nueva entrada' }, { id: true, label: '📋 Historial' }].map(tab => (
                <button key={String(tab.id)} onClick={() => setVistaHistorial(tab.id)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: vistaHistorial === tab.id ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : '#f8fafc',
                    color: vistaHistorial === tab.id ? 'white' : '#64748b',
                    border: `2px solid ${vistaHistorial === tab.id ? '#8b5cf6' : '#e2e8f0'}`,
                  }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {!vistaHistorial ? (
              <>
                {/* Selector modo */}
                <div className="flex gap-2">
                  {[{ id: 'texto', icon: '✍️', label: 'Escribir' }, { id: 'audio', icon: '🎙️', label: 'Grabar audio' }].map(m => (
                    <button key={m.id} onClick={() => setModoDiario(m.id)}
                      className="flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                      style={{
                        background: modoDiario === m.id ? '#8b5cf6' : '#f8fafc',
                        color: modoDiario === m.id ? 'white' : '#64748b',
                        border: `2px solid ${modoDiario === m.id ? '#8b5cf6' : '#e2e8f0'}`,
                      }}>
                      <span>{m.icon}</span> {m.label}
                    </button>
                  ))}
                </div>

                {/* Preguntas */}
                <div className="space-y-3">
                  {GRATITUD_PREGUNTAS.map((preg, i) => (
                    <div key={i} className="rounded-2xl overflow-hidden border transition-all"
                      style={{ borderColor: pregActiva === i ? '#8b5cf6' : '#e2e8f0' }}>
                      <button onClick={() => setPregActiva(i)}
                        className="w-full flex items-center gap-3 p-3 text-left"
                        style={{ background: pregActiva === i ? 'rgba(139,92,246,0.06)' : '#f8fafc' }}>
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: pregActiva === i ? '#8b5cf6' : '#cbd5e1' }}>{i + 1}</span>
                        <p className="text-sm font-medium text-slate-700 flex-1">{preg}</p>
                        {(modoDiario === 'texto' ? respGratitud[i].trim() : false) && (
                          <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#8b5cf6' }} />
                        )}
                      </button>

                      {pregActiva === i && modoDiario === 'texto' && (
                        <div className="px-3 pb-3">
                          <textarea
                            value={respGratitud[i]}
                            onChange={e => {
                              const n = [...respGratitud]
                              n[i] = e.target.value
                              setRespGratitud(n)
                            }}
                            placeholder="Escribe aquí tu respuesta..."
                            rows={3}
                            className="w-full text-sm text-slate-700 border border-slate-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                          />
                        </div>
                      )}

                      {pregActiva === i && modoDiario === 'audio' && (
                        <div className="px-3 pb-3 space-y-2">
                          {!audioRec.audioUrl ? (
                            <button
                              onClick={audioRec.grabando ? audioRec.detener : audioRec.iniciar}
                              className="w-full py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all"
                              style={{
                                background: audioRec.grabando ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                                color: 'white',
                              }}>
                              {audioRec.grabando
                                ? <><Square className="w-4 h-4" /> Detener grabación</>
                                : <><Mic className="w-4 h-4" /> Iniciar grabación</>
                              }
                            </button>
                          ) : (
                            <div className="space-y-2">
                              <audio src={audioRec.audioUrl} controls className="w-full rounded-xl" />
                              <button onClick={audioRec.limpiar}
                                className="text-xs text-slate-400 flex items-center gap-1 hover:text-red-400 transition-colors">
                                <Trash2 className="w-3 h-3" /> Borrar y grabar de nuevo
                              </button>
                            </div>
                          )}
                          {audioRec.grabando && (
                            <div className="flex items-center gap-2 text-xs text-red-500 font-semibold animate-pulse">
                              <div className="w-2 h-2 rounded-full bg-red-500" />
                              Grabando...
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <button onClick={guardarGratitud}
                  disabled={modoDiario === 'texto' ? !respGratitud.some(r => r.trim()) : !audioRec.audioUrl}
                  className="w-full py-3 rounded-2xl text-white font-bold disabled:opacity-40 transition-all"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                  💾 Guardar entrada en el diario
                </button>
              </>
            ) : (
              /* HISTORIAL */
              <div className="space-y-3">
                {historialGratitud.length === 0 ? (
                  <p className="text-center text-sm text-slate-400 py-8">Aún no hay entradas guardadas.</p>
                ) : (
                  <>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {historialGratitud.map((entrada, i) => (
                        <div key={i} className="rounded-2xl p-4 space-y-2"
                          style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.15)' }}>
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold" style={{ color: '#8b5cf6' }}>{formatFecha(entrada.fecha)}</p>
                            {entrada.tieneAudio && (
                              <span className="text-xs px-2 py-0.5 rounded-full"
                                style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>🎙️ Audio</span>
                            )}
                          </div>
                          {entrada.respuestas?.map((r, j) => r.trim() ? (
                            <div key={j}>
                              <p className="text-xs text-slate-400 mb-0.5">{GRATITUD_PREGUNTAS[j]}</p>
                              <p className="text-sm text-slate-700 leading-relaxed">{r}</p>
                            </div>
                          ) : null)}
                          {entrada.tieneAudio && !entrada.respuestas?.some(r => r.trim()) && (
                            <p className="text-xs text-slate-400 italic">Entrada grabada en audio</p>
                          )}
                        </div>
                      ))}
                    </div>
                    <button onClick={() => { setHistorialGratitud([]); localStorage.removeItem('docente_gratitud') }}
                      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3 h-3" /> Borrar todo el historial
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SECCIÓN 3: EJERCICIOS DE RELAJACIÓN
      ══════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
        <button onClick={() => toggle('relajacion')}
          className="w-full flex items-center justify-between p-5 text-left transition-colors"
          style={{ background: seccionAbierta === 'relajacion' ? 'rgba(244,114,182,0.06)' : 'white' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(244,114,182,0.12)' }}>
              <Heart className="w-5 h-5" style={{ color: '#f472b6' }} />
            </div>
            <div>
              <p className="font-bold text-slate-800">Ejercicios de relajación</p>
              <p className="text-xs text-slate-400">4 técnicas · 2–8 minutos</p>
            </div>
          </div>
          {seccionAbierta === 'relajacion' ? <ChevronUp className="w-5 h-5 text-slate-300" /> : <ChevronDown className="w-5 h-5 text-slate-300" />}
        </button>
        {seccionAbierta === 'relajacion' && (
          <div className="px-5 pb-5 space-y-3">
            {EJERCICIOS.map(ej => (
              <div key={ej.id} className="rounded-2xl border overflow-hidden" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                <button onClick={() => setEjercicioAbierto(prev => prev === ej.id ? null : ej.id)}
                  className="w-full flex items-center justify-between p-4 text-left transition-colors"
                  style={{ background: ejercicioAbierto === ej.id ? 'rgba(244,114,182,0.05)' : '#f8fafc' }}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{ej.emoji}</span>
                    <div>
                      <p className="font-semibold text-slate-700 text-sm">{ej.titulo}</p>
                      <p className="text-xs text-slate-400">{ej.duracion} · {ej.desc}</p>
                    </div>
                  </div>
                  <Play className="w-4 h-4 text-slate-300 flex-shrink-0" />
                </button>
                {ejercicioAbierto === ej.id && (
                  <div className="p-4 space-y-2 border-t" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                    {ej.pasos.map((paso, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                          style={{ background: '#f472b6', minWidth: 24 }}>{i + 1}</span>
                        <p className="text-sm text-slate-600 leading-relaxed pt-0.5">{paso}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SECCIÓN 4: EJERCICIOS POR GRADO DE BURNOUT
      ══════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
        <button onClick={() => toggle('gradosBurnout')}
          className="w-full flex items-center justify-between p-5 text-left transition-colors"
          style={{ background: seccionAbierta === 'gradosBurnout' ? 'rgba(139,92,246,0.06)' : 'white' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(139,92,246,0.12)' }}>
              <Sparkles className="w-5 h-5" style={{ color: '#8b5cf6' }} />
            </div>
            <div>
              <p className="font-bold text-slate-800">Ejercicios por grado de burnout</p>
              <p className="text-xs text-slate-400">9 actividades · 3 niveles · Prevención → Recuperación</p>
            </div>
          </div>
          {seccionAbierta === 'gradosBurnout' ? <ChevronUp className="w-5 h-5 text-slate-300" /> : <ChevronDown className="w-5 h-5 text-slate-300" />}
        </button>
        {seccionAbierta === 'gradosBurnout' && (
          <div className="px-5 pb-5 space-y-3 pt-2">
            <p className="text-xs text-slate-400 leading-relaxed">Cada ejercicio está pensado para un momento concreto. Encuentra tu nivel actual y empieza por ahí.</p>
            {GRADOS.map(grado => (
              <div key={grado.id} className="rounded-2xl overflow-hidden border"
                style={{ borderColor: gradoAbierto === grado.id ? grado.borde : 'rgba(0,0,0,0.06)' }}>
                <button onClick={() => setGradoAbierto(prev => prev === grado.id ? null : grado.id)}
                  className="w-full flex items-center justify-between p-4 text-left transition-colors"
                  style={{ background: gradoAbierto === grado.id ? grado.bg : '#f8fafc' }}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{grado.emoji}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm" style={{ color: grado.color }}>{grado.nivel}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: `${grado.color}15`, color: grado.color }}>{grado.subtitulo}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{grado.ejercicios.length} ejercicios</p>
                    </div>
                  </div>
                  {gradoAbierto === grado.id ? <ChevronUp className="w-4 h-4 text-slate-300" /> : <ChevronDown className="w-4 h-4 text-slate-300" />}
                </button>
                {gradoAbierto === grado.id && (
                  <div className="px-4 pb-4 space-y-2 pt-1">
                    <p className="text-xs text-slate-500 leading-relaxed pb-1">{grado.desc}</p>
                    {grado.ejercicios.map(ej => (
                      <div key={ej.id} className="rounded-xl border overflow-hidden"
                        style={{ borderColor: ejercGradoAbierto === `${grado.id}-${ej.id}` ? `${grado.color}40` : 'rgba(0,0,0,0.06)' }}>
                        <button onClick={() => setEjercGradoAbierto(prev => prev === `${grado.id}-${ej.id}` ? null : `${grado.id}-${ej.id}`)}
                          className="w-full flex items-center justify-between p-3 text-left transition-colors"
                          style={{ background: ejercGradoAbierto === `${grado.id}-${ej.id}` ? `${grado.color}08` : 'white' }}>
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{ej.emoji}</span>
                            <div>
                              <p className="font-semibold text-sm text-slate-700">{ej.titulo}</p>
                              <p className="text-xs text-slate-400">{ej.duracion} · {ej.desc}</p>
                            </div>
                          </div>
                          <Play className="w-4 h-4 text-slate-300 flex-shrink-0" />
                        </button>
                        {ejercGradoAbierto === `${grado.id}-${ej.id}` && (
                          <div className="px-4 pb-4 pt-2 space-y-2 border-t" style={{ borderColor: 'rgba(0,0,0,0.04)' }}>
                            {ej.pasos.map((paso, i) => (
                              <div key={i} className="flex items-start gap-3">
                                <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                                  style={{ background: grado.color, minWidth: 24 }}>{i + 1}</span>
                                <p className="text-sm text-slate-600 leading-relaxed pt-0.5">{paso}</p>
                              </div>
                            ))}
                            {ej.enlace && (
                              <Link to={ej.enlace}
                                className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold text-white"
                                style={{ background: `linear-gradient(135deg, ${grado.color}, #8b5cf6)` }}>
                                {ej.botonLabel}
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SECCIÓN 5: TEST DE ESTRÉS
      ══════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
        <button onClick={() => toggle('test')}
          className="w-full flex items-center justify-between p-5 text-left transition-colors"
          style={{ background: seccionAbierta === 'test' ? 'rgba(99,102,241,0.06)' : 'white' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(99,102,241,0.12)' }}>
              <Brain className="w-5 h-5" style={{ color: '#6366f1' }} />
            </div>
            <div>
              <p className="font-bold text-slate-800">Test de estrés y ansiedad</p>
              <p className="text-xs text-slate-400">Escala PSS-10 · 10 preguntas</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!resultadoEstres && progEstres > 0 && progEstres < 100 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>{progEstres}%</span>
            )}
            {seccionAbierta === 'test' ? <ChevronUp className="w-5 h-5 text-slate-300" /> : <ChevronDown className="w-5 h-5 text-slate-300" />}
          </div>
        </button>
        {seccionAbierta === 'test' && (
          <div className="px-5 pb-5 space-y-3">
            {!resultadoEstres ? (
              <>
                <div className="pt-1 space-y-1">
                  <div className="flex justify-between text-xs text-slate-400"><span>Progreso</span><span>{Object.keys(respEstres).length} / {TEST_PREGUNTAS.length}</span></div>
                  <BarraProgreso pct={progEstres} color="#6366f1" />
                </div>
                <p className="text-xs text-slate-400">Responde pensando en las <strong>últimas 4 semanas</strong>. Tus respuestas son completamente privadas.</p>
                {TEST_PREGUNTAS.map((p, i) => (
                  <TarjetaPregunta key={i} index={i} total={TEST_PREGUNTAS.length} texto={p.texto} opciones={OPCIONES_ESTRES}
                    valorSeleccionado={respEstres[i]} onChange={(j) => setRespEstres(prev => ({ ...prev, [i]: j }))} color="#6366f1" />
                ))}
                <button onClick={calcularEstres} disabled={!estresCompleto}
                  className="w-full py-4 rounded-2xl font-bold disabled:opacity-40 transition-all text-base"
                  style={{ background: estresCompleto ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#e2e8f0', color: estresCompleto ? 'white' : '#94a3b8' }}>
                  {estresCompleto ? '✨ Ver mi resultado' : `Responde todas las preguntas (${Object.keys(respEstres).length}/${TEST_PREGUNTAS.length})`}
                </button>
              </>
            ) : (
              <div className="space-y-4 pt-1">
                <div className="rounded-2xl overflow-hidden" style={{ border: `2px solid ${resultadoEstres.borde}`, background: resultadoEstres.bg }}>
                  <div className="p-5 text-center">
                    <span className="text-5xl">{resultadoEstres.icono}</span>
                    <p className="font-black text-xl mt-2" style={{ color: resultadoEstres.color }}>{resultadoEstres.nivel}</p>
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">{resultadoEstres.desc}</p>
                  </div>
                  <div className="px-5 pb-5 space-y-1">
                    <div className="flex justify-between text-xs" style={{ color: resultadoEstres.color }}><span>Nivel detectado</span><span>{resultadoEstres.barra}%</span></div>
                    <BarraProgreso pct={resultadoEstres.barra} color={resultadoEstres.color} />
                    <div className="flex justify-between text-xs text-slate-300 mt-1"><span>Bajo</span><span>Moderado</span><span>Elevado</span></div>
                  </div>
                </div>
                <button onClick={() => { setResultadoEstres(null); setRespEstres({}) }}
                  className="w-full py-2.5 rounded-2xl text-sm font-medium border" style={{ borderColor: '#e2e8f0', color: '#64748b' }}>Repetir el test</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SECCIÓN 6: TEST BURNOUT DOCENTE
      ══════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
        <button onClick={() => toggle('testBurnout')}
          className="w-full flex items-center justify-between p-5 text-left transition-colors"
          style={{ background: seccionAbierta === 'testBurnout' ? 'rgba(249,115,22,0.06)' : 'white' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(249,115,22,0.12)' }}>
              <BarChart2 className="w-5 h-5" style={{ color: '#f97316' }} />
            </div>
            <div>
              <p className="font-bold text-slate-800">Test de burnout docente</p>
              <p className="text-xs text-slate-400">Basado en MBI · 14 preguntas · 3 dimensiones</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!resultadoBurnout && progBurnout > 0 && progBurnout < 100 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(249,115,22,0.1)', color: '#f97316' }}>{progBurnout}%</span>
            )}
            {seccionAbierta === 'testBurnout' ? <ChevronUp className="w-5 h-5 text-slate-300" /> : <ChevronDown className="w-5 h-5 text-slate-300" />}
          </div>
        </button>
        {seccionAbierta === 'testBurnout' && (
          <div className="px-5 pb-5 space-y-3">
            {!resultadoBurnout ? (
              <>
                <div className="flex flex-wrap gap-2 pt-1">
                  {[{ label: 'Agotamiento emocional', color: '#ef4444' }, { label: 'Despersonalización', color: '#f97316' }, { label: 'Realización personal', color: '#6366f1' }].map(d => (
                    <span key={d.label} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                      style={{ background: `${d.color}15`, color: d.color, border: `1px solid ${d.color}30` }}>
                      <span className="w-2 h-2 rounded-full inline-block" style={{ background: d.color }} />{d.label}
                    </span>
                  ))}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400"><span>Progreso</span><span>{Object.keys(respBurnout).length} / {BURNOUT_PREGUNTAS.length}</span></div>
                  <BarraProgreso pct={progBurnout} color="#f97316" />
                </div>
                <p className="text-xs text-slate-400">Responde con sinceridad. No hay respuestas correctas o incorrectas. Tus datos son privados.</p>
                {BURNOUT_PREGUNTAS.map((p, i) => {
                  const dimColor = p.dimension === 'AE' ? '#ef4444' : p.dimension === 'DP' ? '#f97316' : '#6366f1'
                  const dimLabel = p.dimension === 'AE' ? 'Agotamiento' : p.dimension === 'DP' ? 'Despersonalización' : 'Realización'
                  return <TarjetaPregunta key={i} index={i} total={BURNOUT_PREGUNTAS.length} texto={p.texto} opciones={OPCIONES_BURNOUT}
                    valorSeleccionado={respBurnout[i]} onChange={(j) => setRespBurnout(prev => ({ ...prev, [i]: j }))}
                    color={dimColor} etiqueta={dimLabel} />
                })}
                <button onClick={calcularBurnout} disabled={!burnoutCompleto}
                  className="w-full py-4 rounded-2xl font-bold disabled:opacity-40 transition-all text-base"
                  style={{ background: burnoutCompleto ? 'linear-gradient(135deg, #f97316, #ef4444)' : '#e2e8f0', color: burnoutCompleto ? 'white' : '#94a3b8' }}>
                  {burnoutCompleto ? '🔥 Ver mi resultado' : `Responde todas las preguntas (${Object.keys(respBurnout).length}/${BURNOUT_PREGUNTAS.length})`}
                </button>
              </>
            ) : (
              <div className="space-y-4 pt-1">
                <div className="rounded-2xl p-5 text-center"
                  style={{ background: `${resultadoBurnout.globalColor}10`, border: `2px solid ${resultadoBurnout.globalColor}30` }}>
                  <span className="text-5xl">{resultadoBurnout.globalColor === '#10b981' ? '😌' : resultadoBurnout.globalColor === '#f59e0b' ? '😟' : resultadoBurnout.globalColor === '#f97316' ? '😔' : '😰'}</span>
                  <p className="font-black text-xl mt-2" style={{ color: resultadoBurnout.globalColor }}>{resultadoBurnout.global}</p>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">{resultadoBurnout.globalDesc}</p>
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Desglose por dimensiones</p>
                {[{ key: 'nAE', label: 'Agotamiento emocional', desc: 'Desgaste emocional acumulado', icono: '😮‍💨' }, { key: 'nDP', label: 'Despersonalización', desc: 'Distancia emocional hacia el alumnado', icono: '🧊' }, { key: 'nRP', label: 'Baja realización personal', desc: 'Sensación de falta de logro profesional', icono: '📉' }].map(d => {
                  const r = resultadoBurnout[d.key]
                  return (
                    <div key={d.key} className="rounded-2xl p-4 space-y-2"
                      style={{ background: `${r.color}08`, border: `1px solid ${r.color}25` }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{d.icono}</span>
                          <div><p className="font-semibold text-sm text-slate-700">{d.label}</p><p className="text-xs text-slate-400">{d.desc}</p></div>
                        </div>
                        <span className="text-sm font-black px-3 py-1 rounded-full" style={{ background: `${r.color}15`, color: r.color }}>{r.label}</span>
                      </div>
                      <BarraProgreso pct={r.pct} color={r.color} />
                    </div>
                  )
                })}
                <div className="rounded-2xl p-4 flex items-start gap-3"
                  style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#6366f1' }} />
                  <p className="text-xs text-slate-600 leading-relaxed">Este cuestionario es orientativo y no sustituye una evaluación clínica. Si los resultados te preocupan, consulta con tu médico o con el orientador de tu centro.</p>
                </div>
                <button onClick={() => { setResultadoBurnout(null); setRespBurnout({}) }}
                  className="w-full py-2.5 rounded-2xl text-sm font-medium border" style={{ borderColor: '#e2e8f0', color: '#64748b' }}>Repetir el test</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SECCIÓN 7: PREVENCIÓN DEL BURNOUT
      ══════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
        <button onClick={() => toggle('burnout')}
          className="w-full flex items-center justify-between p-5 text-left transition-colors"
          style={{ background: seccionAbierta === 'burnout' ? 'rgba(239,68,68,0.06)' : 'white' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.12)' }}>
              <Flame className="w-5 h-5" style={{ color: '#ef4444' }} />
            </div>
            <div>
              <p className="font-bold text-slate-800">Prevención del burnout</p>
              <p className="text-xs text-slate-400">Señales de alerta y estrategias de protección</p>
            </div>
          </div>
          {seccionAbierta === 'burnout' ? <ChevronUp className="w-5 h-5 text-slate-300" /> : <ChevronDown className="w-5 h-5 text-slate-300" />}
        </button>
        {seccionAbierta === 'burnout' && (
          <div className="px-5 pb-5 space-y-4 pt-1">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Señales que merecen atención</p>
              <div className="space-y-2">
                {BURNOUT_SENALES.map((s, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-2xl"
                    style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)' }}>
                    <span className="text-xl flex-shrink-0">{s.icon}</span>
                    <div><p className="font-semibold text-sm text-slate-700">{s.titulo}</p><p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{s.desc}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Estrategias de protección</p>
              <div className="space-y-2">
                {BURNOUT_ESTRATEGIAS.map((e, i) => (
                  <div key={i} className="rounded-2xl border overflow-hidden"
                    style={{ borderColor: burnoutAbierto === i ? 'rgba(239,68,68,0.3)' : 'rgba(0,0,0,0.06)' }}>
                    <button onClick={() => setBurnoutAbierto(prev => prev === i ? null : i)}
                      className="w-full flex items-center gap-3 p-3 text-left transition-colors"
                      style={{ background: burnoutAbierto === i ? 'rgba(239,68,68,0.05)' : 'white' }}>
                      <span className="text-xl">{e.emoji}</span>
                      <p className="font-semibold text-sm text-slate-700 flex-1">{e.titulo}</p>
                      {burnoutAbierto === i ? <ChevronUp className="w-4 h-4 text-slate-300" /> : <ChevronDown className="w-4 h-4 text-slate-300" />}
                    </button>
                    {burnoutAbierto === i && (
                      <div className="px-4 pb-3 pt-1 border-t" style={{ borderColor: 'rgba(0,0,0,0.04)' }}>
                        <p className="text-sm text-slate-600 leading-relaxed">{e.texto}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl p-4 flex items-start gap-3"
              style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#6366f1' }} />
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>Nota profesional:</strong> Si llevas más de dos semanas experimentando síntomas persistentes de agotamiento, considera consultar con tu médico o con el orientador de tu centro.
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
