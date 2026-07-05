import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '@/api/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Wind, Anchor, Heart, BookOpen, Brain, Zap, TrendingUp, TrendingDown, Minus,
  Calendar, Award, ChevronDown, ChevronUp, Share2, FileText,
  Copy, Check, Star, Clock, Sun, Sparkles
} from 'lucide-react'

const LOGO_URL = 'https://zbusdixrxedfhbkquafh.supabase.co/storage/v1/object/public/logo/Gemini_Generated_Image_rar33drar33drar3.png'

const TIPO_CONFIG = {
  respiracion: { label: 'Respiración',       emoji: '🌬️', color: '#0f6b6b', bg: '#ccfbf1' },
  anclaje:     { label: 'Anclaje',            emoji: '⚓',  color: '#1d4ed8', bg: '#dbeafe' },
  relajacion:  { label: 'Relajación',         emoji: '💆',  color: '#be185d', bg: '#fce7f3' },
  tecnica:     { label: 'Técnica rápida',     emoji: '⚡',  color: '#b45309', bg: '#fef3c7' },
  diario:      { label: 'Diario emocional',   emoji: '📓',  color: '#7c3aed', bg: '#ede9fe' },
  test:        { label: 'Test de estrés',     emoji: '🧠',  color: '#065f46', bg: '#d1fae5' },
  modulo:      { label: 'Módulo de aprendizaje', emoji: '🎓', color: '#9333ea', bg: '#f3e8ff' },
  rutina:      { label: 'Rutina diaria',      emoji: '☀️',  color: '#d97706', bg: '#fef9c3' },
}

// ─── Definición completa de logros ────────────────────────────────────────────
// Cada logro tiene: id, emoji, label, desc, categoria, meta (para la barra de progreso)
// y una función conseguido(datos) que devuelve true/false
// y una función progreso(datos) que devuelve { actual, total }

const calcMinutos = (datos) =>
  Math.round([...datos.respiracion, ...datos.relajacion, ...datos.tecnicas, ...datos.rutinas]
    .reduce((a, s) => a + (s.duracion_segundos || 0), 0) / 60)

const totalActividades = (datos) =>
  datos.respiracion.length + datos.anclajes.length + datos.relajacion.length +
  datos.tecnicas.length + datos.diario.length + datos.tests.length +
  datos.rutinas.length

// Calcula días únicos con actividad
const diasActivos = (datos) => {
  const todas = [
    ...datos.respiracion, ...datos.anclajes, ...datos.relajacion,
    ...datos.tecnicas, ...datos.diario, ...datos.tests,
    ...datos.rutinas,
  ]
  const dias = new Set(todas.map(s => new Date(s.created_at).toDateString()))
  return dias.size
}

// Racha de días consecutivos
const rachaActual = (datos) => {
  const todas = [
    ...datos.respiracion, ...datos.anclajes, ...datos.relajacion,
    ...datos.tecnicas, ...datos.diario, ...datos.tests,
    ...datos.rutinas,
  ]
  const dias = [...new Set(todas.map(s => new Date(s.created_at).toDateString()))]
    .map(d => new Date(d))
    .sort((a, b) => b - a)

  if (!dias.length) return 0
  let racha = 1
  for (let i = 0; i < dias.length - 1; i++) {
    const diff = (dias[i] - dias[i + 1]) / (1000 * 60 * 60 * 24)
    if (diff <= 1) racha++
    else break
  }
  return racha
}

const LOGROS = [
  // ── PRIMEROS PASOS ──
  {
    id: 'primera_sesion', emoji: '🌱', label: 'Primera sesión', categoria: 'Primeros pasos',
    desc: 'Completaste tu primera actividad en Resetea',
    conseguido: d => totalActividades(d) >= 1,
    progreso: d => ({ actual: Math.min(totalActividades(d), 1), total: 1 }),
  },
  {
    id: 'cinco_sesiones', emoji: '⭐', label: '5 actividades', categoria: 'Primeros pasos',
    desc: 'Completaste 5 actividades en total',
    conseguido: d => totalActividades(d) >= 5,
    progreso: d => ({ actual: Math.min(totalActividades(d), 5), total: 5 }),
  },
  {
    id: 'diez_sesiones', emoji: '🔥', label: '10 actividades', categoria: 'Primeros pasos',
    desc: 'Completaste 10 actividades en total',
    conseguido: d => totalActividades(d) >= 10,
    progreso: d => ({ actual: Math.min(totalActividades(d), 10), total: 10 }),
  },
  {
    id: 'veinticinco_sesiones', emoji: '💯', label: '25 actividades', categoria: 'Primeros pasos',
    desc: '¡25 actividades completadas!',
    conseguido: d => totalActividades(d) >= 25,
    progreso: d => ({ actual: Math.min(totalActividades(d), 25), total: 25 }),
  },
  {
    id: 'cincuenta_sesiones', emoji: '🏆', label: '50 actividades', categoria: 'Primeros pasos',
    desc: '¡Eres un campeón del bienestar!',
    conseguido: d => totalActividades(d) >= 50,
    progreso: d => ({ actual: Math.min(totalActividades(d), 50), total: 50 }),
  },

  // ── RESPIRACIÓN ──
  {
    id: 'respirador', emoji: '🌬️', label: 'Respirador', categoria: 'Respiración',
    desc: 'Hiciste 3 sesiones de respiración',
    conseguido: d => d.respiracion.length >= 3,
    progreso: d => ({ actual: Math.min(d.respiracion.length, 3), total: 3 }),
  },
  {
    id: 'maestro_aliento', emoji: '🌊', label: 'Maestro del aliento', categoria: 'Respiración',
    desc: '10 sesiones de respiración completadas',
    conseguido: d => d.respiracion.length >= 10,
    progreso: d => ({ actual: Math.min(d.respiracion.length, 10), total: 10 }),
  },
  {
    id: 'experto_respiracion', emoji: '🌀', label: 'Experto en respiración', categoria: 'Respiración',
    desc: '20 sesiones de respiración — ¡impresionante!',
    conseguido: d => d.respiracion.length >= 20,
    progreso: d => ({ actual: Math.min(d.respiracion.length, 20), total: 20 }),
  },

  // ── ANCLAJE ──
  {
    id: 'bien_anclado', emoji: '⚓', label: 'Bien anclado', categoria: 'Anclaje',
    desc: 'Hiciste 3 sesiones de anclaje',
    conseguido: d => d.anclajes.length >= 3,
    progreso: d => ({ actual: Math.min(d.anclajes.length, 3), total: 3 }),
  },
  {
    id: 'roca_firme', emoji: '🪨', label: 'Roca firme', categoria: 'Anclaje',
    desc: '10 sesiones de anclaje — ya tienes raíces',
    conseguido: d => d.anclajes.length >= 10,
    progreso: d => ({ actual: Math.min(d.anclajes.length, 10), total: 10 }),
  },

  // ── RELAJACIÓN ──
  {
    id: 'cuerpo_relajado', emoji: '💆', label: 'Cuerpo relajado', categoria: 'Relajación',
    desc: 'Completaste 2 sesiones de relajación muscular',
    conseguido: d => d.relajacion.length >= 2,
    progreso: d => ({ actual: Math.min(d.relajacion.length, 2), total: 2 }),
  },
  {
    id: 'maestro_jacobson', emoji: '🧘', label: 'Maestro Jacobson', categoria: 'Relajación',
    desc: '5 sesiones de relajación muscular progresiva',
    conseguido: d => d.relajacion.length >= 5,
    progreso: d => ({ actual: Math.min(d.relajacion.length, 5), total: 5 }),
  },

  // ── DIARIO ──
  {
    id: 'diario_activo', emoji: '📓', label: 'Diario activo', categoria: 'Diario emocional',
    desc: 'Escribiste 5 entradas en el diario',
    conseguido: d => d.diario.length >= 5,
    progreso: d => ({ actual: Math.min(d.diario.length, 5), total: 5 }),
  },
  {
    id: 'escritor_constante', emoji: '📚', label: 'Escritor constante', categoria: 'Diario emocional',
    desc: '15 entradas en el diario emocional',
    conseguido: d => d.diario.length >= 15,
    progreso: d => ({ actual: Math.min(d.diario.length, 15), total: 15 }),
  },
  {
    id: 'cronista_emocional', emoji: '📖', label: 'Cronista emocional', categoria: 'Diario emocional',
    desc: '30 entradas — conoces muy bien tus emociones',
    conseguido: d => d.diario.length >= 30,
    progreso: d => ({ actual: Math.min(d.diario.length, 30), total: 30 }),
  },

  // ── TÉCNICAS RÁPIDAS ──
  {
    id: 'reaccion_rapida', emoji: '⚡', label: 'Reacción rápida', categoria: 'Técnicas',
    desc: 'Usaste 3 técnicas rápidas en momentos de necesidad',
    conseguido: d => d.tecnicas.length >= 3,
    progreso: d => ({ actual: Math.min(d.tecnicas.length, 3), total: 3 }),
  },
  {
    id: 'experto_emergencias', emoji: '🚀', label: 'Experto en emergencias', categoria: 'Técnicas',
    desc: '10 técnicas rápidas — ya las dominas',
    conseguido: d => d.tecnicas.length >= 10,
    progreso: d => ({ actual: Math.min(d.tecnicas.length, 10), total: 10 }),
  },

  // ── CONSTANCIA ──
  {
    id: 'tres_dias', emoji: '📅', label: '3 días seguidos', categoria: 'Constancia',
    desc: 'Usaste Resetea 3 días consecutivos',
    conseguido: d => rachaActual(d) >= 3,
    progreso: d => ({ actual: Math.min(rachaActual(d), 3), total: 3 }),
  },
  {
    id: 'semana_activa', emoji: '🗓️', label: 'Semana activa', categoria: 'Constancia',
    desc: '7 días seguidos — ¡un hábito de verdad!',
    conseguido: d => rachaActual(d) >= 7,
    progreso: d => ({ actual: Math.min(rachaActual(d), 7), total: 7 }),
  },
  {
    id: 'mes_activo', emoji: '📆', label: 'Mes activo', categoria: 'Constancia',
    desc: 'Actividad en 20 días distintos este mes',
    conseguido: d => diasActivos(d) >= 20,
    progreso: d => ({ actual: Math.min(diasActivos(d), 20), total: 20 }),
  },

  // ── TIEMPO ──
  {
    id: 'treinta_minutos', emoji: '⏱️', label: '30 min de bienestar', categoria: 'Tiempo',
    desc: '30 minutos totales de práctica acumulada',
    conseguido: d => calcMinutos(d) >= 30,
    progreso: d => ({ actual: Math.min(calcMinutos(d), 30), total: 30 }),
  },
  {
    id: 'hora_bienestar', emoji: '⏰', label: '1 hora de bienestar', categoria: 'Tiempo',
    desc: '60 minutos totales — ¡cuidas mucho de ti!',
    conseguido: d => calcMinutos(d) >= 60,
    progreso: d => ({ actual: Math.min(calcMinutos(d), 60), total: 60 }),
  },

  // ── ESPECIALES ──
  {
    id: 'explorador', emoji: '🗺️', label: 'Explorador', categoria: 'Especiales',
    desc: 'Usaste 4 tipos de herramientas distintas',
    conseguido: d => [d.respiracion, d.anclajes, d.relajacion, d.diario, d.tecnicas, d.rutinas]
      .filter(a => a.length > 0).length >= 4,
    progreso: d => ({
      actual: Math.min([d.respiracion, d.anclajes, d.relajacion, d.diario, d.tecnicas, d.rutinas]
        .filter(a => a.length > 0).length, 4),
      total: 4
    }),
  },
  {
    id: 'todo_terreno', emoji: '🌈', label: 'Todo terreno', categoria: 'Especiales',
    desc: 'Probaste todos los tipos de herramientas',
    conseguido: d => [d.respiracion, d.anclajes, d.relajacion, d.diario, d.tecnicas, d.tests, d.rutinas]
      .filter(a => a.length > 0).length >= 6,
    progreso: d => ({
      actual: Math.min([d.respiracion, d.anclajes, d.relajacion, d.diario, d.tecnicas, d.tests, d.rutinas]
        .filter(a => a.length > 0).length, 6),
      total: 6
    }),
  },
  {
    id: 'autoconocimiento', emoji: '🧠', label: 'Autoconocimiento', categoria: 'Especiales',
    desc: 'Completaste tu primer test de estrés',
    conseguido: d => d.tests.length >= 1,
    progreso: d => ({ actual: Math.min(d.tests.length, 1), total: 1 }),
  },
  {
    id: 'primera_rutina', emoji: '☀️', label: 'Primera rutina', categoria: 'Rutinas',
    desc: 'Completaste tu primera rutina diaria',
    conseguido: d => d.rutinas.length >= 1,
    progreso: d => ({ actual: Math.min(d.rutinas.length, 1), total: 1 }),
  },
  {
    id: 'rutina_habitual', emoji: '🌤️', label: 'Rutina habitual', categoria: 'Rutinas',
    desc: '5 rutinas completadas — ya es parte de ti',
    conseguido: d => d.rutinas.length >= 5,
    progreso: d => ({ actual: Math.min(d.rutinas.length, 5), total: 5 }),
  },
  {
    id: 'maestro_rutinas', emoji: '🌞', label: 'Maestro de rutinas', categoria: 'Rutinas',
    desc: '15 rutinas — eres constante de verdad',
    conseguido: d => d.rutinas.length >= 15,
    progreso: d => ({ actual: Math.min(d.rutinas.length, 15), total: 15 }),
  },

  // ── TIEMPO (ampliación) ──
  {
    id: 'dos_horas', emoji: '🕑', label: '2 horas de bienestar', categoria: 'Tiempo',
    desc: '120 minutos acumulados — una inversión real en ti',
    conseguido: d => calcMinutos(d) >= 120,
    progreso: d => ({ actual: Math.min(calcMinutos(d), 120), total: 120 }),
  },
  {
    id: 'cinco_horas', emoji: '🕔', label: '5 horas de bienestar', categoria: 'Tiempo',
    desc: '300 minutos — tu bienestar es una prioridad',
    conseguido: d => calcMinutos(d) >= 300,
    progreso: d => ({ actual: Math.min(calcMinutos(d), 300), total: 300 }),
  },

  // ── CONSTANCIA (ampliación) ──
  {
    id: 'quince_dias', emoji: '🔐', label: '15 días activos', categoria: 'Constancia',
    desc: 'Actividad en 15 días distintos',
    conseguido: d => diasActivos(d) >= 15,
    progreso: d => ({ actual: Math.min(diasActivos(d), 15), total: 15 }),
  },
  {
    id: 'dos_semanas_racha', emoji: '🔥', label: '14 días seguidos', categoria: 'Constancia',
    desc: '¡Dos semanas sin parar — eso sí es un hábito!',
    conseguido: d => rachaActual(d) >= 14,
    progreso: d => ({ actual: Math.min(rachaActual(d), 14), total: 14 }),
  },

  // ── PRIMEROS PASOS (ampliación) ──
  {
    id: 'cien_sesiones', emoji: '💎', label: '100 actividades', categoria: 'Primeros pasos',
    desc: '100 actividades — leyenda del bienestar',
    conseguido: d => totalActividades(d) >= 100,
    progreso: d => ({ actual: Math.min(totalActividades(d), 100), total: 100 }),
  },

  // ── ESPECIALES (ampliación) ──
  {
    id: 'test_repetidor', emoji: '📊', label: 'En seguimiento', categoria: 'Especiales',
    desc: 'Hiciste 3 tests de estrés — conoces tu evolución',
    conseguido: d => d.tests.length >= 3,
    progreso: d => ({ actual: Math.min(d.tests.length, 3), total: 3 }),
  },
  {
    id: 'equilibrio_total', emoji: '⚖️', label: 'Equilibrio total', categoria: 'Especiales',
    desc: 'Usaste todos los tipos de herramientas al menos una vez',
    conseguido: d => [d.respiracion, d.anclajes, d.relajacion, d.diario, d.tecnicas, d.tests, d.rutinas]
      .every(a => a.length > 0),
    progreso: d => ({
      actual: Math.min([d.respiracion, d.anclajes, d.relajacion, d.diario, d.tecnicas, d.tests, d.rutinas]
        .filter(a => a.length > 0).length, 7),
      total: 7,
    }),
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatFecha(iso) {
  const d = new Date(iso)
  const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
  return `${d.getDate()} ${meses[d.getMonth()]} · ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

function diasAtras(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

function StatCard({ icon: Icon, label, value, color, delay }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: color + '20' }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-black text-slate-800">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </motion.div>
  )
}

// ─── Toast de logro desbloqueado ──────────────────────────────────────────────
function LogroToast({ logro, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0, y: -60, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -40, scale: 0.9 }}
      className="fixed top-20 left-1/2 z-[200] -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-amber-200 px-5 py-4 flex items-center gap-3 max-w-xs w-full"
      style={{ boxShadow: '0 8px 40px rgba(245,158,11,0.25)' }}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{ background: '#fef3c7' }}>
        {logro.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">¡Logro desbloqueado!</p>
        <p className="font-black text-slate-800 text-sm truncate">{logro.label}</p>
        <p className="text-xs text-slate-400 truncate">{logro.desc}</p>
      </div>
    </motion.div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function MiPerfil() {
  const [periodoIdx, setPeriodoIdx]     = useState(0)
  const [showAll, setShowAll]           = useState(false)
  const [mostrarResumen, setMostrarResumen] = useState(false)
  const [copiado, setCopiado]           = useState(false)
  const [diario, setDiario]             = useState([])
  const [loading, setLoading]           = useState(true)
  const [userEmail, setUserEmail]       = useState('')
  const [subscriptionStatus, setSubscriptionStatus] = useState(null)
  const [categoriaLogro, setCategoriaLogro] = useState('Todos')
  const [toastLogro, setToastLogro]     = useState(null)
  const logrosYaRegistrados             = useRef(new Set())

  const [datos, setDatos] = useState({
    respiracion: [], anclajes: [], relajacion: [],
    tecnicas: [], diario: [], tests: [], rutinas: [],
  })

  const PERIODOS = [
    { label: 'Esta semana', dias: 7 },
    { label: 'Este mes',    dias: 30 },
    { label: 'Todo',        dias: 3650 },
  ]

  // ── Carga de datos ──────────────────────────────────────────
  useEffect(() => {
    const cargar = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUserEmail(user.email || '')
      const uid = user.id

      // Cargar subscription status
      const { data: perfil } = await supabase
        .from('perfiles_alumnos')
        .select('subscription_status, subscription_type, centro_id')
        .eq('user_id', uid)
        .maybeSingle()
      if (perfil) setSubscriptionStatus(perfil)

      const { data: dDiario } = await supabase.from('diario_completo')
        .select('*').eq('user_id', uid).order('fecha_entrada', { ascending: false }).limit(30)
      if (dDiario) setDiario(dDiario)

      // Cargar logros ya registrados en BD
      const { data: logrosGuardados } = await supabase
        .from('logros_desbloqueados').select('logro_id').eq('user_id', uid)
      if (logrosGuardados) {
        logrosGuardados.forEach(l => logrosYaRegistrados.current.add(l.logro_id))
      }

      const [r1, r2, r3, r4, r5, r6, r7] = await Promise.all([
        supabase.from('sesiones_respiracion').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
        supabase.from('sesiones_anclaje').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
        supabase.from('sesiones_relajacion').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
        supabase.from('sesiones_tecnicas').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
        supabase.from('diario_completo').select('*').eq('user_id', uid).order('fecha_entrada', { ascending: false }),
        supabase.from('test_estres').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
        supabase.from('sesiones_rutinas').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      ])
      setDatos({
        respiracion: r1.data || [],
        anclajes:    r2.data || [],
        relajacion:  r3.data || [],
        tecnicas:    r4.data || [],
        diario:      (r5.data || []).map(d => ({ ...d, created_at: d.created_at || d.fecha_entrada })),
        tests:       r6.data || [],
        rutinas:     r7.data || [],
      })
      setLoading(false)
    }
    cargar()
  }, [])

  // ── Detectar y registrar nuevos logros ──────────────────────
  useEffect(() => {
    if (loading) return
    const registrarNuevos = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      for (const logro of LOGROS) {
        if (logro.conseguido(datos) && !logrosYaRegistrados.current.has(logro.id)) {
          // Nuevo logro desbloqueado → guardar en BD y mostrar toast
          logrosYaRegistrados.current.add(logro.id)
          await supabase.from('logros_desbloqueados').upsert({
            user_id: user.id,
            logro_id: logro.id,
            logro_nombre: logro.label,
            logro_emoji: logro.emoji,
          }, { onConflict: 'user_id,logro_id' })
          // Mostrar toast (solo el primero nuevo para no saturar)
          setToastLogro(logro)
          break
        }
      }
    }
    registrarNuevos()
  }, [datos, loading])

  // ── Filtrado por periodo ────────────────────────────────────
  const cutoff = diasAtras(PERIODOS[periodoIdx].dias)
  const f = (arr) => arr.filter(s => new Date(s.created_at) > cutoff)

  const rResp = f(datos.respiracion)
  const rAnc  = f(datos.anclajes)
  const rRel  = f(datos.relajacion)
  const rTec  = f(datos.tecnicas)
  const rDia  = f(datos.diario)
  const rTest = f(datos.tests)
  const rRut  = f(datos.rutinas)

  const totalSesiones = rResp.length + rAnc.length + rRel.length + rTec.length +
    rDia.length + rTest.length + rRut.length
  const totalMinutos = Math.round(
    [...rResp, ...rRel, ...rTec, ...rRut]
      .reduce((a, s) => a + (s.duracion_segundos || 0), 0) / 60
  )

  // ── Historial unificado ────────────────────────────────────
  const historial = [
    ...datos.respiracion.map(s => ({ ...s, tipo: 'respiracion', nombre: s.ejercicio_nombre || 'Respiración' })),
    ...datos.anclajes.map(s =>    ({ ...s, tipo: 'anclaje',     nombre: s.tecnica_nombre  || 'Anclaje' })),
    ...datos.relajacion.map(s =>  ({ ...s, tipo: 'relajacion',  nombre: 'Relajación Jacobson' })),
    ...datos.tecnicas.map(s =>    ({ ...s, tipo: 'tecnica',     nombre: s.tecnica_nombre  || 'Técnica rápida' })),
    ...datos.diario.map(s =>      ({ ...s, tipo: 'diario',      nombre: `Diario · ${s.emocion || 'emoción'}` })),
    ...datos.tests.map(s =>       ({ ...s, tipo: 'test',        nombre: `Test estrés · ${s.puntuacion ?? 0} pts` })),
    ...datos.rutinas.map(s =>     ({ ...s, tipo: 'rutina',      nombre: s.rutina_nombre   || 'Rutina diaria' })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const historialFiltrado = historial.filter(s => new Date(s.created_at) > cutoff)
  const historialMostrado = showAll ? historialFiltrado : historialFiltrado.slice(0, 10)

  // ── Logros con estado calculado ────────────────────────────
  const logrosCalculados = LOGROS.map(l => ({
    ...l,
    conseguido: l.conseguido(datos),
    progreso:   l.progreso(datos),
  }))

  const categorias = ['Todos', ...new Set(LOGROS.map(l => l.categoria))]
  const logrosFiltrados = categoriaLogro === 'Todos'
    ? logrosCalculados
    : logrosCalculados.filter(l => l.categoria === categoriaLogro)

  const totalConseguidos = logrosCalculados.filter(l => l.conseguido).length
  const rachaActualVal   = rachaActual(datos)

  // ── Generador de resumen ────────────────────────────────────
  const generarTextoResumen = () => {
    const periodo  = PERIODOS[periodoIdx].label
    const fechaHoy = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    const diarFilt = diario.filter(d => new Date(d.fecha_entrada) > diasAtras(PERIODOS[periodoIdx].dias))

    const emocionesCount = {}
    diarFilt.forEach(d => { if (d.emocion_principal) emocionesCount[d.emocion_principal] = (emocionesCount[d.emocion_principal] || 0) + 1 })
    const topEmociones = Object.entries(emocionesCount).sort((a,b) => b[1]-a[1]).slice(0,3).map(([e]) => e).join(', ')

    const intensidades = diarFilt.filter(d => d.intensidad != null).map(d => d.intensidad)
    const mediaInt     = intensidades.length ? (intensidades.reduce((a,b) => a+b, 0) / intensidades.length).toFixed(1) : null
    const testsF       = f(datos.tests)
    const mediaTest    = testsF.length ? (testsF.reduce((a,s) => a + (s.puntuacion||0), 0) / testsF.length).toFixed(1) : null

    let texto = `RESUMEN EMOCIONAL · RESETEA
Generado el ${fechaHoy}
Período: ${periodo}
─────────────────────────────

📊 ACTIVIDAD
• Sesiones de bienestar: ${totalSesiones}
• Minutos de práctica: ${totalMinutos}
• Entradas en el diario: ${rDia.length}
• Rutinas completadas: ${rRut.length}

🏆 LOGROS
• Conseguidos: ${totalConseguidos}/${LOGROS.length}
• Racha actual: ${rachaActualVal} día(s) seguido(s)

❤️ ESTADO EMOCIONAL
`
    if (topEmociones) texto += `• Emociones más frecuentes: ${topEmociones}\n`
    if (mediaInt)     texto += `• Intensidad emocional media: ${mediaInt}/10\n`
    if (mediaTest)    texto += `• Puntuación media GAD-7: ${mediaTest}/21\n`

    texto += `
🛠️ HERRAMIENTAS USADAS
• Respiración: ${rResp.length} veces
• Anclaje: ${rAnc.length} veces
• Relajación: ${rRel.length} veces
• Técnicas rápidas: ${rTec.length} veces

─────────────────────────────
Este resumen ha sido generado automáticamente por la app Resetea.
Los datos son personales y confidenciales.`
    return texto
  }

  const copiarResumen = () => {
    navigator.clipboard.writeText(generarTextoResumen()).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 3000)
    })
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f0f9f9' }}>
      <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-lg mx-auto px-4 py-6">

      {/* Toast de logro desbloqueado */}
      <AnimatePresence>
        {toastLogro && (
          <LogroToast logro={toastLogro} onClose={() => setToastLogro(null)} />
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-6">
        <img src="https://zbusdixrxedfhbkquafh.supabase.co/storage/v1/object/public/logo/WhatsApp%20Image%202026-04-06%20at%2015.58.04.jpeg"
          alt="Resetea" className="w-16 h-16 rounded-full object-cover shadow-lg flex-shrink-0" />
        <div>
          <p className="font-black text-xl" style={{ color: '#0d3d3d' }}>
            {userEmail.split('@')[0]}
          </p>
          <p className="text-slate-500 text-sm">{userEmail}</p>
          <p className="text-teal-600 text-xs font-medium mt-0.5">
            {historial.length} actividades en total · {rachaActualVal > 1 ? `🔥 ${rachaActualVal} días seguidos` : ''}
          </p>
        </div>
      </motion.div>

      {/* Gestión suscripción individual */}
      {subscriptionStatus?.subscription_type === 'individual' && subscriptionStatus?.subscription_status === 'active' && !subscriptionStatus?.centro_id && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-teal-50 border border-teal-100 rounded-2xl p-4 mb-4 flex items-center justify-between">
          <div>
            <p className="font-bold text-teal-800 text-sm">Suscripción activa</p>
            <p className="text-teal-600 text-xs">4,99€/mes · se renueva automáticamente</p>
          </div>
          <button
            onClick={async () => {
              try {
                const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
                const res = await fetch(
                  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-portal`,
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${ANON_KEY}`,
                      'apikey': ANON_KEY,
                    },
                    body: JSON.stringify({
                      email: userEmail,
                      return_url: window.location.href,
                    }),
                  }
                )
                const { url, error } = await res.json()
                if (error) throw new Error(error)
                window.location.href = url
              } catch (e) {
                alert('Error al abrir el portal: ' + e.message)
              }
            }}
            className="px-3 py-2 rounded-xl text-xs font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>
            Gestionar
          </button>
        </motion.div>
      )}
      <div className="flex gap-2 mb-6">
        {PERIODOS.map((p, i) => (
          <button key={i} onClick={() => { setPeriodoIdx(i); setShowAll(false) }}
            className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
            style={{
              background: periodoIdx === i ? 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' : 'white',
              color: periodoIdx === i ? 'white' : '#64748b',
              border: periodoIdx === i ? 'none' : '1px solid #e2e8f0'
            }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard icon={TrendingUp}  label="Actividades"          value={totalSesiones}  color="#0f6b6b"  delay={0.1} />
        <StatCard icon={Clock}       label="Minutos de bienestar"  value={totalMinutos}   color="#7c3aed"  delay={0.15} />
        <StatCard icon={Wind}        label="Respiraciones"         value={rResp.length}   color="#0891b2"  delay={0.2} />
        <StatCard icon={Heart}       label="Relajaciones"          value={rRel.length}    color="#be185d"  delay={0.25} />
        <StatCard icon={Anchor}      label="Anclajes"              value={rAnc.length}    color="#1d4ed8"  delay={0.3} />
        <StatCard icon={BookOpen}    label="Diario emocional"      value={rDia.length}    color="#7c3aed"  delay={0.35} />
        <StatCard icon={Sun}         label="Rutinas"               value={rRut.length}    color="#d97706"  delay={0.38} />
      </div>

      {/* Evolución test de estrés */}
      {datos.tests.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.39 }}
          className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-teal-600" />
            <p className="font-black text-slate-800">Evolución del estrés</p>
            {datos.tests.length >= 2 && (() => {
              const ultimo = datos.tests[0].puntuacion
              const anterior = datos.tests[1].puntuacion
              const diff = ultimo - anterior
              if (diff < 0) return <span className="ml-auto flex items-center gap-1 text-green-600 text-xs font-bold"><TrendingDown className="w-3 h-3" /> Mejorando</span>
              if (diff > 0) return <span className="ml-auto flex items-center gap-1 text-red-500 text-xs font-bold"><TrendingUp className="w-3 h-3" /> Subiendo</span>
              return <span className="ml-auto flex items-center gap-1 text-slate-400 text-xs font-bold"><Minus className="w-3 h-3" /> Estable</span>
            })()}
          </div>

          {/* Gráfico de barras */}
          <div className="flex items-end gap-1.5 h-20 mb-3">
            {[...datos.tests].reverse().slice(-8).map((t, i) => {
              const pct = (t.puntuacion / 21) * 100
              const color = t.puntuacion <= 4 ? '#22c55e' : t.puntuacion <= 9 ? '#eab308' : t.puntuacion <= 14 ? '#f97316' : '#ef4444'
              const fecha = new Date(t.created_at)
              const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
              return (
                <div key={t.id || i} className="flex-1 flex flex-col items-center gap-1">
                  <p className="text-xs font-bold text-slate-600">{t.puntuacion}</p>
                  <div className="w-full rounded-t-lg" style={{ height: `${Math.max(pct, 8)}%`, background: color, minHeight: 6 }} />
                  <p className="text-xs text-slate-300 truncate w-full text-center">{fecha.getDate()}/{fecha.getMonth()+1}</p>
                </div>
              )
            })}
          </div>

          {/* Último resultado destacado */}
          {(() => {
            const ultimo = datos.tests[0]
            const res = (() => {
              const s = ultimo.puntuacion
              if (s <= 4) return { label: 'Ansiedad mínima', color: '#22c55e', bg: '#f0fdf4', emoji: '😌' }
              if (s <= 9) return { label: 'Ansiedad leve', color: '#eab308', bg: '#fefce8', emoji: '😐' }
              if (s <= 14) return { label: 'Ansiedad moderada', color: '#f97316', bg: '#fff7ed', emoji: '😟' }
              return { label: 'Ansiedad severa', color: '#ef4444', bg: '#fef2f2', emoji: '😰' }
            })()
            const fecha = new Date(ultimo.created_at)
            const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
            return (
              <div className="rounded-2xl p-3 flex items-center gap-3" style={{ background: res.bg }}>
                <span className="text-2xl">{res.emoji}</span>
                <div className="flex-1">
                  <p className="font-bold text-sm" style={{ color: res.color }}>{res.label}</p>
                  <p className="text-xs text-slate-400">Último test · {fecha.getDate()} {meses[fecha.getMonth()]}</p>
                </div>
                <p className="text-2xl font-black" style={{ color: res.color }}>
                  {ultimo.puntuacion}<span className="text-xs font-normal text-slate-400">/21</span>
                </p>
              </div>
            )
          })()}
        </motion.div>
      )}

      {/* Botón resumen */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}
        className="mb-4">
        <button onClick={() => setMostrarResumen(!mostrarResumen)}
          className="w-full py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2 shadow-md"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #0d3d3d)' }}>
          <FileText className="w-5 h-5" />
          {mostrarResumen ? 'Ocultar resumen' : '📋 Generar resumen para compartir'}
        </button>
      </motion.div>

      {mostrarResumen && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-violet-600" />
              <p className="font-black text-slate-800">Resumen emocional</p>
            </div>
            <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
              {PERIODOS[periodoIdx].label}
            </span>
          </div>
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-4 overflow-auto max-h-64">
            <pre className="text-xs text-slate-600 whitespace-pre-wrap font-mono leading-relaxed">
              {generarTextoResumen()}
            </pre>
          </div>
          <button onClick={copiarResumen}
            className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
            style={{ background: copiado ? '#dcfce7' : 'linear-gradient(135deg, #7c3aed, #0d3d3d)', color: copiado ? '#16a34a' : 'white' }}>
            {copiado ? <><Check className="w-4 h-4" /> Copiado</> : <><Copy className="w-4 h-4" /> Copiar al portapapeles</>}
          </button>
          <p className="text-xs text-slate-400 mt-3 text-center">
            🔒 Solo tú decides con quién compartes este resumen
          </p>
        </motion.div>
      )}

      {/* ── LOGROS ────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.44 }}
        className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-6">

        {/* Cabecera logros */}
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-amber-500" />
          <p className="font-black text-slate-800">Mis logros</p>
          <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-xl"
            style={{ background: '#fef3c7', color: '#b45309' }}>
            {totalConseguidos}/{LOGROS.length}
          </span>
        </div>

        {/* Barra de progreso global */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Progreso total</span>
            <span>{Math.round((totalConseguidos / LOGROS.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(totalConseguidos / LOGROS.length) * 100}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #0f6b6b, #f59e0b)' }}
            />
          </div>
        </div>

        {/* Filtro por categoría */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-hide">
          {categorias.map(cat => (
            <button key={cat} onClick={() => setCategoriaLogro(cat)}
              className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
              style={{
                background: categoriaLogro === cat ? '#0d3d3d' : '#f1f5f9',
                color:      categoriaLogro === cat ? 'white'   : '#64748b',
              }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Grid de logros */}
        <div className="grid grid-cols-3 gap-3">
          {logrosFiltrados.map((logro, i) => {
            const pct = logro.conseguido ? 100 : Math.round((logro.progreso.actual / logro.progreso.total) * 100)
            return (
              <motion.div key={logro.id}
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                className="flex flex-col items-center gap-1.5 text-center p-2 rounded-2xl"
                style={{ background: logro.conseguido ? '#fffbeb' : '#f8fafc' }}>

                {/* Emoji + anillo de progreso */}
                <div className="relative w-14 h-14 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="24" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                    <circle cx="28" cy="28" r="24" fill="none"
                      stroke={logro.conseguido ? '#f59e0b' : '#94a3b8'}
                      strokeWidth="3"
                      strokeDasharray={`${2 * Math.PI * 24}`}
                      strokeDashoffset={`${2 * Math.PI * 24 * (1 - pct / 100)}`}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 1s ease' }}
                    />
                  </svg>
                  <span className={`text-2xl relative z-10 ${!logro.conseguido ? 'grayscale opacity-40' : ''}`}>
                    {logro.emoji}
                  </span>
                  {logro.conseguido && (
                    <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: '#f59e0b' }}>
                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                    </div>
                  )}
                </div>

                <p className="text-xs font-bold text-slate-700 leading-tight">{logro.label}</p>

                {!logro.conseguido && (
                  <p className="text-xs text-slate-400">
                    {logro.progreso.actual}/{logro.progreso.total}
                  </p>
                )}
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* ── HISTORIAL ──────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }}>
        <div className="flex items-center justify-between mb-3">
          <p className="font-black text-slate-800">Historial de actividades</p>
          <span className="text-xs text-slate-400">{historialFiltrado.length} registros</span>
        </div>

        {historialFiltrado.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-100">
            <p className="text-4xl mb-2">🌱</p>
            <p className="text-slate-500 text-sm font-medium">Sin actividades en este periodo</p>
            <p className="text-slate-400 text-xs mt-1">¡Empieza una sesión para ver tu progreso!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {historialMostrado.map((item, i) => {
              const cfg = TIPO_CONFIG[item.tipo] || TIPO_CONFIG.tecnica
              const durMin = item.duracion_segundos ? Math.round(item.duracion_segundos / 60) : null
              return (
                <motion.div key={`${item.tipo}-${item.id}`}
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: cfg.bg }}>
                    {cfg.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{item.nombre}</p>
                    <p className="text-xs text-slate-400">{formatFecha(item.created_at)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-bold px-2 py-1 rounded-lg"
                      style={{ color: cfg.color, background: cfg.bg }}>
                      {cfg.label}
                    </span>
                    {durMin !== null && durMin > 0 && (
                      <p className="text-xs text-slate-400 mt-1">{durMin} min</p>
                    )}
                  </div>
                </motion.div>
              )
            })}

            {historialFiltrado.length > 10 && (
              <button onClick={() => setShowAll(!showAll)}
                className="w-full py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
                style={{ background: 'white', border: '1px solid #e2e8f0', color: '#64748b' }}>
                {showAll
                  ? <><ChevronUp className="w-4 h-4" /> Ver menos</>
                  : <><ChevronDown className="w-4 h-4" /> Ver todos ({historialFiltrado.length})</>}
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}
