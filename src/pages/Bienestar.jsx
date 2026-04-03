import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/api/supabaseClient'
import { Link } from 'react-router-dom'
import {
  Moon, Sun, Smartphone, Activity, Heart, CheckCircle,
  ChevronRight, Plus, Trophy, Flame, Star, BookOpen, Zap
} from 'lucide-react'

// ── RETOS DE AUTOCUIDADO ──────────────────────────────────────
const RETOS = [
  {
    id: 'desconexion_15',
    emoji: '📵',
    nombre: '15 min sin pantallas',
    desc: 'Apaga el móvil 15 minutos y haz algo sin tecnología.',
    color: '#7c3aed', bg: '#ede9fe',
    duracion: '15 min',
    ideas: ['Lee un libro', 'Sal a dar una vuelta', 'Escucha música sin mirar el móvil', 'Estira o haz yoga']
  },
  {
    id: 'disfrute_5',
    emoji: '✨',
    nombre: '5 min de lo que disfruto',
    desc: 'Dedica 5 minutos a algo que te guste de verdad, sin obligación.',
    color: '#0891b2', bg: '#cffafe',
    duracion: '5 min',
    ideas: ['Dibuja o garabatea', 'Escucha tu canción favorita', 'Llama a alguien que quieras', 'Come algo rico sin prisas']
  },
  {
    id: 'ejercicio_20',
    emoji: '🏃',
    nombre: '20 min de movimiento',
    desc: 'Mueve el cuerpo durante 20 minutos. No tiene que ser intenso.',
    color: '#16a34a', bg: '#dcfce7',
    duracion: '20 min',
    ideas: ['Camina escuchando música', 'Baila en tu habitación', 'Haz estiramientos', 'Sube y baja escaleras']
  },
  {
    id: 'agua',
    emoji: '💧',
    nombre: 'Bebe 2 litros de agua',
    desc: 'Hidratarse bien reduce el cortisol y mejora la concentración.',
    color: '#0d3d3d', bg: '#ccfbf1',
    duracion: 'Todo el día',
    ideas: ['Pon recordatorios cada 2h', 'Lleva botella contigo', 'Agua con limón o menta']
  },
  {
    id: 'sueno',
    emoji: '😴',
    nombre: 'A dormir antes de las 23h',
    desc: 'Una noche de sueño antes de medianoche mejora el rendimiento al día siguiente.',
    color: '#1d4ed8', bg: '#dbeafe',
    duracion: 'Esta noche',
    ideas: ['Nada de móvil 30 min antes', 'Temperatura fresca en la habitación', 'Luz tenue']
  },
  {
    id: 'pausa_activa',
    emoji: '⏸️',
    nombre: '3 pausas activas hoy',
    desc: 'Cada 45-50 min de estudio, para 5 min y mueve el cuerpo.',
    color: '#b45309', bg: '#fef3c7',
    duracion: 'Cada 50 min',
    ideas: ['Estira cuello y hombros', 'Da 20 pasos por la habitación', 'Respira profundo 5 veces']
  },
  {
    id: 'naturaleza',
    emoji: '🌳',
    nombre: '10 min al aire libre',
    desc: 'La exposición a la naturaleza reduce el cortisol en 15 minutos.',
    color: '#065f46', bg: '#d1fae5',
    duracion: '10 min',
    ideas: ['Balcón o ventana abierta', 'Parque cercano', 'Patio del colegio en el recreo']
  },
  {
    id: 'gratitud',
    emoji: '🙏',
    nombre: '3 cosas por las que estoy agradecido/a',
    desc: 'Anota 3 cosas buenas del día, aunque sean pequeñas.',
    color: '#92400e', bg: '#fef3c7',
    duracion: '5 min',
    ideas: ['Por escrito en el diario', 'Mentalmente antes de dormir', 'Compartirlo con alguien']
  },
]

// ── PLAN ANTIESTRES ───────────────────────────────────────────
const PLAN_DIAS = [
  {
    dia: 'Lunes', emoji: '📚',
    bloques: [
      { hora: '17:00-17:30', actividad: 'Repaso de apuntes del día', tipo: 'estudio' },
      { hora: '17:30-17:35', actividad: 'Pausa activa (estirar, agua)', tipo: 'pausa' },
      { hora: '17:35-18:05', actividad: 'Ejercicios o problemas', tipo: 'estudio' },
      { hora: '18:05-18:20', actividad: 'Descanso libre (sin pantallas)', tipo: 'descanso' },
      { hora: '18:20-18:50', actividad: 'Lectura o resúmenes', tipo: 'estudio' },
      { hora: '21:30', actividad: 'Rutina de noche (desconexión)', tipo: 'bienestar' },
    ]
  },
  {
    dia: 'Martes', emoji: '🔄',
    bloques: [
      { hora: '17:00-17:30', actividad: 'Materia más difícil', tipo: 'estudio' },
      { hora: '17:30-17:35', actividad: 'Pausa activa', tipo: 'pausa' },
      { hora: '17:35-18:05', actividad: 'Materia más fácil', tipo: 'estudio' },
      { hora: '18:05-18:30', actividad: '20 min de movimiento', tipo: 'ejercicio' },
      { hora: '18:30-19:00', actividad: 'Deberes pendientes', tipo: 'estudio' },
    ]
  },
  {
    dia: 'Miércoles', emoji: '⚡',
    bloques: [
      { hora: '17:00-17:25', actividad: 'Repaso rápido del día', tipo: 'estudio' },
      { hora: '17:25-18:00', actividad: 'Actividad que disfrutas (hobby)', tipo: 'bienestar' },
      { hora: '18:00-18:30', actividad: 'Estudio con Pomodoro 25+5', tipo: 'estudio' },
      { hora: '18:30-18:55', actividad: 'Otro Pomodoro', tipo: 'estudio' },
    ]
  },
  {
    dia: 'Jueves', emoji: '📝',
    bloques: [
      { hora: '17:00-17:30', actividad: 'Preguntas tipo examen', tipo: 'estudio' },
      { hora: '17:30-17:35', actividad: 'Pausa activa', tipo: 'pausa' },
      { hora: '17:35-18:05', actividad: 'Repasar errores anteriores', tipo: 'estudio' },
      { hora: '18:05-18:20', actividad: 'Grounding o respiración', tipo: 'bienestar' },
      { hora: '18:20-18:50', actividad: 'Estudio libre', tipo: 'estudio' },
    ]
  },
  {
    dia: 'Viernes', emoji: '🎉',
    bloques: [
      { hora: '17:00-17:45', actividad: 'Repaso semanal ligero', tipo: 'estudio' },
      { hora: '17:45-18:00', actividad: '¿Qué he aprendido esta semana?', tipo: 'reflexion' },
      { hora: '18:00+', actividad: '¡Tiempo libre merecido!', tipo: 'descanso' },
    ]
  },
]

const BLOQUE_COLOR = {
  estudio:   { color: '#1d4ed8', bg: '#dbeafe', emoji: '📖' },
  pausa:     { color: '#16a34a', bg: '#dcfce7', emoji: '⏸️' },
  descanso:  { color: '#7c3aed', bg: '#ede9fe', emoji: '🎮' },
  bienestar: { color: '#0f6b6b', bg: '#ccfbf1', emoji: '🌿' },
  ejercicio: { color: '#b45309', bg: '#fef3c7', emoji: '🏃' },
  reflexion: { color: '#be185d', bg: '#fce7f3', emoji: '💭' },
}

// ── COMPONENTES ───────────────────────────────────────────────

function TabBar({ tab, setTab }) {
  const tabs = [
    { id: 'habitos',  label: 'Hábitos hoy', icon: Sun },
    { id: 'retos',    label: 'Retos',       icon: Trophy },
    { id: 'plan',     label: 'Plan estudio', icon: BookOpen },
    { id: 'progreso', label: 'Progreso',    icon: Activity },
  ]
  return (
    <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
      {tabs.map(t => (
        <button key={t.id} onClick={() => setTab(t.id)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all"
          style={{
            background: tab === t.id ? 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' : 'white',
            color: tab === t.id ? 'white' : '#64748b',
            border: tab === t.id ? 'none' : '1px solid #e2e8f0'
          }}>
          <t.icon className="w-3.5 h-3.5" />
          {t.label}
        </button>
      ))}
    </div>
  )
}

function SliderHabito({ label, value, onChange, min = 0, max = 10, step = 0.5, unit = '', color = '#0f6b6b' }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        <span className="font-black text-sm" style={{ color }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2.5 rounded-full appearance-none cursor-pointer"
        style={{ background: `linear-gradient(to right, ${color} ${(value-min)/(max-min)*100}%, #e2e8f0 ${(value-min)/(max-min)*100}%)`, accentColor: color }} />
      <div className="flex justify-between mt-0.5">
        <span className="text-xs text-slate-400">{min}{unit}</span>
        <span className="text-xs text-slate-400">{max}{unit}</span>
      </div>
    </div>
  )
}

function EstrellaRating({ value, onChange, max = 5 }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <button key={i} onClick={() => onChange(i + 1)}>
          <Star className="w-6 h-6 transition-all"
            style={{ color: i < value ? '#fbbf24' : '#e2e8f0', fill: i < value ? '#fbbf24' : 'none' }} />
        </button>
      ))}
    </div>
  )
}

// ── PESTAÑA HÁBITOS HOY ───────────────────────────────────────
function HabitosHoy() {
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [horasSueno, setHorasSueno] = useState(7)
  const [calidadSueno, setCalidadSueno] = useState(3)
  const [minEjercicio, setMinEjercicio] = useState(0)
  const [horasPantalla, setHorasPantalla] = useState(3)
  const [pausasActivas, setPausasActivas] = useState(0)
  const [energia, setEnergia] = useState(3)

  const guardar = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const hoy = new Date().toISOString().slice(0, 10)
      await supabase.from('registro_habitos').upsert({
        user_id: user.id, fecha: hoy,
        horas_sueno: horasSueno, calidad_sueno: calidadSueno,
        minutos_ejercicio: minEjercicio, horas_pantalla: horasPantalla,
        pausas_activas: pausasActivas, energia,
      }, { onConflict: 'user_id,fecha' })
      setSaved(true)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const hoy = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })

  const getSuenoColor = h => h >= 8 ? '#16a34a' : h >= 6 ? '#ca8a04' : '#dc2626'
  const getPantallaColor = h => h <= 2 ? '#16a34a' : h <= 4 ? '#ca8a04' : '#dc2626'

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <Sun className="w-5 h-5 text-amber-500" />
          <div>
            <p className="font-black text-slate-800">Registro de hoy</p>
            <p className="text-slate-400 text-xs capitalize">{hoy}</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Sueño */}
          <div className="border-b border-slate-50 pb-4">
            <p className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <Moon className="w-4 h-4 text-blue-500" /> Sueño anoche
            </p>
            <SliderHabito label="Horas dormidas" value={horasSueno} onChange={setHorasSueno}
              min={0} max={12} step={0.5} unit="h" color={getSuenoColor(horasSueno)} />
            {horasSueno < 7 && <p className="text-xs text-amber-600 mt-1">⚠️ Los adolescentes necesitan 8-10h para rendir bien</p>}
            <div className="mt-3">
              <p className="text-xs text-slate-500 mb-1">Calidad del sueño</p>
              <EstrellaRating value={calidadSueno} onChange={setCalidadSueno} />
            </div>
          </div>

          {/* Ejercicio */}
          <div className="border-b border-slate-50 pb-4">
            <p className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-500" /> Movimiento
            </p>
            <SliderHabito label="Minutos de ejercicio o movimiento" value={minEjercicio}
              onChange={setMinEjercicio} min={0} max={120} step={5} unit=" min" color="#16a34a" />
            {minEjercicio >= 20 && <p className="text-xs text-green-600 mt-1">✅ ¡Bien! El movimiento reduce el cortisol</p>}
          </div>

          {/* Pantallas */}
          <div className="border-b border-slate-50 pb-4">
            <p className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-violet-500" /> Tiempo de pantalla (ocio)
            </p>
            <SliderHabito label="Horas de móvil/redes (fuera del estudio)" value={horasPantalla}
              onChange={setHorasPantalla} min={0} max={10} step={0.5} unit="h" color={getPantallaColor(horasPantalla)} />
            {horasPantalla > 4 && <p className="text-xs text-red-500 mt-1">⚠️ Más de 4h de pantalla afecta al sueño y concentración</p>}
          </div>

          {/* Pausas activas */}
          <div className="border-b border-slate-50 pb-4">
            <p className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" /> Pausas activas
            </p>
            <div className="flex items-center gap-3">
              <button onClick={() => setPausasActivas(Math.max(0, pausasActivas - 1))}
                className="w-10 h-10 rounded-xl border-2 border-slate-200 text-slate-500 font-black text-lg">−</button>
              <div className="flex-1 text-center">
                <p className="font-black text-3xl" style={{ color: pausasActivas >= 3 ? '#16a34a' : '#ca8a04' }}>{pausasActivas}</p>
                <p className="text-xs text-slate-400">pausas de 5 min</p>
              </div>
              <button onClick={() => setPausasActivas(pausasActivas + 1)}
                className="w-10 h-10 rounded-xl border-2 border-slate-200 text-slate-500 font-black text-lg">+</button>
            </div>
            {pausasActivas >= 3 && <p className="text-xs text-green-600 mt-2 text-center">✅ ¡Excelente! 3+ pausas al día mejora la concentración</p>}
          </div>

          {/* Energía */}
          <div>
            <p className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" /> ¿Cómo es tu energía hoy?
            </p>
            <div className="flex gap-2">
              {[
                { v: 1, emoji: '😴', label: 'Agotado/a' },
                { v: 2, emoji: '😪', label: 'Cansado/a' },
                { v: 3, emoji: '😐', label: 'Regular' },
                { v: 4, emoji: '🙂', label: 'Bien' },
                { v: 5, emoji: '😄', label: 'Genial' },
              ].map(({ v, emoji, label }) => (
                <button key={v} onClick={() => setEnergia(v)}
                  className="flex-1 flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all"
                  style={{ background: energia === v ? '#ccfbf1' : 'white', borderColor: energia === v ? '#0f6b6b' : '#e2e8f0' }}>
                  <span className="text-xl">{emoji}</span>
                  <span className="text-xs font-medium" style={{ color: energia === v ? '#0d3d3d' : '#94a3b8', fontSize: '9px' }}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <button onClick={guardar} disabled={saving}
        className="w-full py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2"
        style={{ background: saved ? '#16a34a' : 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>
        {saving ? 'Guardando...' : saved ? <><CheckCircle className="w-5 h-5" /> Guardado</> : <><CheckCircle className="w-5 h-5" /> Guardar registro de hoy</>}
      </button>
    </div>
  )
}

// ── PESTAÑA RETOS ─────────────────────────────────────────────
function RetosAutocuidado() {
  const [completados, setCompletados] = useState([])
  const [expandido, setExpandido] = useState(null)
  const [guardando, setGuardando] = useState(null)

  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const hoy = new Date().toISOString().slice(0, 10)
      const { data } = await supabase.from('retos_autocuidado')
        .select('reto_id').eq('user_id', user.id)
        .gte('completado_en', hoy + 'T00:00:00')
      if (data) setCompletados(data.map(r => r.reto_id))
    }
    cargar()
  }, [])

  const completarReto = async (reto) => {
    if (completados.includes(reto.id)) return
    setGuardando(reto.id)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('retos_autocuidado').insert({
        user_id: user.id, reto_id: reto.id, reto_nombre: reto.nombre
      })
      setCompletados(prev => [...prev, reto.id])
    } catch (e) { console.error(e) }
    finally { setGuardando(null) }
  }

  const completadosHoy = completados.length
  const totalRetos = RETOS.length

  return (
    <div className="space-y-4">
      {/* Progreso */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <p className="font-black text-slate-800">Retos de hoy</p>
          <span className="font-black text-teal-600">{completadosHoy}/{totalRetos}</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${(completadosHoy/totalRetos)*100}%` }}
            transition={{ duration: 0.8 }}
            className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #0f6b6b, #5eead4)' }} />
        </div>
        {completadosHoy >= 3 && (
          <p className="text-green-600 text-sm font-bold mt-2">🔥 ¡{completadosHoy} retos completados hoy!</p>
        )}
      </div>

      {/* Lista de retos */}
      <div className="space-y-3">
        {RETOS.map((reto, i) => {
          const hecho = completados.includes(reto.id)
          return (
            <motion.div key={reto.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <button onClick={() => setExpandido(expandido === reto.id ? null : reto.id)}
                  className="w-full flex items-center gap-3 p-4 text-left">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: hecho ? '#dcfce7' : reto.bg }}>
                    {hecho ? '✅' : reto.emoji}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-slate-800">{reto.nombre}</p>
                    <p className="text-xs text-slate-400">{reto.duracion} · {reto.desc.slice(0, 45)}...</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-slate-300 transition-transform ${expandido === reto.id ? 'rotate-90' : ''}`} />
                </button>

                <AnimatePresence>
                  {expandido === reto.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-4 pb-4 space-y-3">
                        <p className="text-sm text-slate-600">{reto.desc}</p>
                        <div>
                          <p className="text-xs font-bold text-slate-500 mb-2">Ideas para hacerlo:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {reto.ideas.map((idea, j) => (
                              <span key={j} className="text-xs px-2 py-1 rounded-lg"
                                style={{ background: reto.bg, color: reto.color }}>
                                {idea}
                              </span>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={() => completarReto(reto)}
                          disabled={hecho || guardando === reto.id}
                          className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                          style={{
                            background: hecho ? '#dcfce7' : `linear-gradient(135deg, ${reto.color}, ${reto.color}bb)`,
                            color: hecho ? '#16a34a' : 'white',
                            opacity: guardando === reto.id ? 0.6 : 1
                          }}>
                          {hecho ? <><CheckCircle className="w-4 h-4" /> Completado hoy</> :
                            guardando === reto.id ? 'Guardando...' :
                            <><Trophy className="w-4 h-4" /> Marcar como completado</>}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ── PESTAÑA PLAN ANTIESTRES ───────────────────────────────────
function PlanAntistres() {
  const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
  const TIPOS = [
    { id: 'estudio',  label: 'Estudio',        color: '#1d4ed8', bg: '#dbeafe',  emoji: '📖' },
    { id: 'pausa',    label: 'Pausa activa',    color: '#16a34a', bg: '#dcfce7',  emoji: '🏃' },
    { id: 'descanso', label: 'Descanso',        color: '#7c3aed', bg: '#ede9fe',  emoji: '☕' },
    { id: 'repaso',   label: 'Repaso',          color: '#0891b2', bg: '#cffafe',  emoji: '🔄' },
    { id: 'libre',    label: 'Tiempo libre',    color: '#b45309', bg: '#fef3c7',  emoji: '🎯' },
  ]

  const HORAS = Array.from({ length: 18 }, (_, i) => {
    const h = i + 7
    return `${String(h).padStart(2, '0')}:00`
  })

  const planVacio = () => DIAS.reduce((acc, dia) => ({ ...acc, [dia]: [] }), {})

  const [diaActivo, setDiaActivo] = useState('Lunes')
  const [plan, setPlan] = useState(planVacio)
  const [guardado, setGuardado] = useState(false)
  const [nuevoBloque, setNuevoBloque] = useState({ hora: '17:00', duracion: 30, actividad: '', tipo: 'estudio' })
  const [añadiendo, setAñadiendo] = useState(false)

  useEffect(() => { cargarPlan() }, [])

  const cargarPlan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('plan_estudio')
        .select('plan_json').eq('user_id', user.id).single()
      if (data?.plan_json) setPlan(data.plan_json)
    } catch {}
  }

  const guardarPlan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('plan_estudio').upsert(
        { user_id: user.id, plan_json: plan },
        { onConflict: 'user_id' }
      )
      setGuardado(true)
      setTimeout(() => setGuardado(false), 2000)
    } catch (e) { console.error(e) }
  }

  const añadirBloque = () => {
    if (!nuevoBloque.actividad.trim()) return
    const bloqueCompleto = { ...nuevoBloque, id: Date.now() }
    setPlan(prev => ({
      ...prev,
      [diaActivo]: [...(prev[diaActivo] || []), bloqueCompleto]
        .sort((a, b) => a.hora.localeCompare(b.hora))
    }))
    setNuevoBloque({ hora: '17:00', duracion: 30, actividad: '', tipo: 'estudio' })
    setAñadiendo(false)
  }

  const eliminarBloque = (id) => {
    setPlan(prev => ({
      ...prev,
      [diaActivo]: prev[diaActivo].filter(b => b.id !== id)
    }))
  }

  const copiarDia = (diaOrigen) => {
    setPlan(prev => ({
      ...prev,
      [diaActivo]: [...(prev[diaOrigen] || [])]
    }))
  }

  const bloquesHoy = plan[diaActivo] || []
  const minutosEstudio = bloquesHoy.filter(b => b.tipo === 'estudio' || b.tipo === 'repaso').reduce((a, b) => a + (b.duracion || 0), 0)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-teal-50 rounded-2xl p-4 border border-teal-100">
        <p className="font-bold text-teal-800 text-sm mb-1">📚 Mi plan de estudio</p>
        <p className="text-teal-600 text-xs leading-relaxed">
          Organiza cada día a tu manera. Añade bloques de estudio, pausas y tiempo libre.
        </p>
      </div>

      {/* Selector de día */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {DIAS.map(dia => {
          const tiene = (plan[dia] || []).length > 0
          return (
            <button key={dia} onClick={() => setDiaActivo(dia)}
              className="flex-shrink-0 px-2.5 py-2 rounded-xl text-xs font-bold transition-all relative"
              style={{
                background: diaActivo === dia ? 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' : 'white',
                color: diaActivo === dia ? 'white' : '#64748b',
                border: diaActivo === dia ? 'none' : '1px solid #e2e8f0'
              }}>
              {dia.slice(0, 3)}
              {tiene && diaActivo !== dia && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-teal-500" />
              )}
            </button>
          )
        })}
      </div>

      {/* Resumen del día */}
      {bloquesHoy.length > 0 && (
        <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-2">
          <span className="text-xs text-slate-500">{bloquesHoy.length} bloques</span>
          <span className="text-xs text-blue-600 font-bold">📖 {minutosEstudio} min estudio</span>
        </div>
      )}

      {/* Bloques del día */}
      <AnimatePresence mode="wait">
        <motion.div key={diaActivo} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
          className="space-y-2">
          {bloquesHoy.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-slate-200">
              <p className="text-3xl mb-2">📅</p>
              <p className="text-slate-500 text-sm">Sin bloques para {diaActivo}</p>
              <p className="text-slate-400 text-xs mt-1">Pulsa "Añadir bloque" para empezar</p>
            </div>
          ) : (
            bloquesHoy.map(bloque => {
              const tipo = TIPOS.find(t => t.id === bloque.tipo) || TIPOS[0]
              return (
                <motion.div key={bloque.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: tipo.bg }}>
                  <span className="text-lg flex-shrink-0">{tipo.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-xs" style={{ color: tipo.color }}>{bloque.hora} · {bloque.duracion} min</p>
                    </div>
                    <p className="text-sm text-slate-700 font-medium">{bloque.actividad}</p>
                  </div>
                  <button onClick={() => eliminarBloque(bloque.id)}
                    className="text-slate-300 hover:text-red-400 transition-colors text-lg leading-none flex-shrink-0">×</button>
                </motion.div>
              )
            })
          )}
        </motion.div>
      </AnimatePresence>

      {/* Formulario añadir bloque */}
      {añadiendo ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-4 border-2 border-teal-200 shadow-sm space-y-3">
          <p className="font-bold text-slate-700 text-sm">Nuevo bloque — {diaActivo}</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Hora de inicio</label>
              <select value={nuevoBloque.hora} onChange={e => setNuevoBloque(p => ({ ...p, hora: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-400">
                {HORAS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Duración</label>
              <select value={nuevoBloque.duracion} onChange={e => setNuevoBloque(p => ({ ...p, duracion: Number(e.target.value) }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-400">
                {[15, 25, 30, 45, 60, 90].map(m => <option key={m} value={m}>{m} min</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Tipo</label>
            <div className="flex flex-wrap gap-1.5">
              {TIPOS.map(t => (
                <button key={t.id} onClick={() => setNuevoBloque(p => ({ ...p, tipo: t.id }))}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold border-2 transition-all"
                  style={{
                    background: nuevoBloque.tipo === t.id ? t.bg : 'white',
                    borderColor: nuevoBloque.tipo === t.id ? t.color : '#e2e8f0',
                    color: nuevoBloque.tipo === t.id ? t.color : '#64748b'
                  }}>
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">¿Qué vas a hacer?</label>
            <input value={nuevoBloque.actividad} onChange={e => setNuevoBloque(p => ({ ...p, actividad: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && añadirBloque()}
              placeholder="Ej: Matemáticas tema 5, Inglés vocabulario..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-400" />
          </div>

          <div className="flex gap-2">
            <button onClick={() => setAñadiendo(false)}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm font-medium">
              Cancelar
            </button>
            <button onClick={añadirBloque} disabled={!nuevoBloque.actividad.trim()}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>
              Añadir
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="flex gap-2">
          <button onClick={() => setAñadiendo(true)}
            className="flex-1 py-3 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>
            <Plus className="w-4 h-4" /> Añadir bloque
          </button>
          <button onClick={guardarPlan}
            className="px-4 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-1"
            style={{ background: guardado ? '#dcfce7' : '#f0fdf4', color: guardado ? '#16a34a' : '#0f6b6b', border: '1px solid #bbf7d0' }}>
            {guardado ? '✓ Guardado' : '💾 Guardar'}
          </button>
        </div>
      )}

      {/* Copiar de otro día */}
      {bloquesHoy.length === 0 && DIAS.some(d => d !== diaActivo && (plan[d] || []).length > 0) && (
        <div className="bg-white rounded-2xl p-4 border border-slate-100">
          <p className="text-xs font-bold text-slate-500 mb-2">Copiar plan de otro día:</p>
          <div className="flex flex-wrap gap-2">
            {DIAS.filter(d => d !== diaActivo && (plan[d] || []).length > 0).map(d => (
              <button key={d} onClick={() => copiarDia(d)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition-all">
                Copiar {d}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tips de recuperación activa */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
        <p className="font-black text-slate-800 mb-4">💡 Tips de descanso y recuperación activa</p>
        {[
          { e: '⏱️', t: 'Bloques de 25-30 min', d: 'El cerebro aguanta 25-30 min de concentración máxima. Descansar activa la memoria.' },
          { e: '🏃', t: 'Pausa activa, no pasiva', d: 'Levántate, estira o camina en el descanso. El móvil no descansa tu cerebro.' },
          { e: '💧', t: 'Agua y snack sano', d: 'El cerebro necesita glucosa e hidratación para funcionar al máximo.' },
          { e: '📵', t: 'Móvil en silencio', d: 'Una notificación rompe 20 min de concentración. Ponlo boca abajo.' },
          { e: '🌙', t: 'Para antes de las 22h', d: 'El aprendizaje se consolida durmiendo, no estudiando de noche.' },
          { e: '🌅', t: '3 min de respiración al despertar', d: 'Antes de mirar el móvil, respira. Activa el modo calma para el día.' },
        ].map(({ e, t, d }) => (
          <div key={t} className="flex items-start gap-3 mb-3 last:mb-0">
            <span className="text-xl flex-shrink-0">{e}</span>
            <div>
              <p className="font-bold text-slate-800 text-sm">{t}</p>
              <p className="text-slate-500 text-xs leading-relaxed">{d}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


// ── PESTAÑA PROGRESO ──────────────────────────────────────────
function Progreso() {
  const [historial, setHistorial] = useState([])
  const [retosHistorial, setRetosHistorial] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [r1, r2] = await Promise.all([
        supabase.from('registro_habitos').select('*').eq('user_id', user.id)
          .order('fecha', { ascending: false }).limit(14),
        supabase.from('retos_autocuidado').select('*').eq('user_id', user.id)
          .order('completado_en', { ascending: false }).limit(30),
      ])
      if (r1.data) setHistorial(r1.data)
      if (r2.data) setRetosHistorial(r2.data)
      setLoading(false)
    }
    cargar()
  }, [])

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" /></div>

  const mediaSueno = historial.length ? (historial.reduce((a, h) => a + (h.horas_sueno || 0), 0) / historial.length).toFixed(1) : null
  const mediaEjercicio = historial.length ? Math.round(historial.reduce((a, h) => a + (h.minutos_ejercicio || 0), 0) / historial.length) : null
  const retosUnicos = [...new Set(retosHistorial.map(r => r.reto_id))].length

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Media sueño', value: mediaSueno ? `${mediaSueno}h` : '—', color: '#1d4ed8', emoji: '😴' },
          { label: 'Media ejercicio', value: mediaEjercicio ? `${mediaEjercicio}m` : '—', color: '#16a34a', emoji: '🏃' },
          { label: 'Retos distintos', value: retosUnicos || '—', color: '#7c3aed', emoji: '🏆' },
        ].map(({ label, value, color, emoji }) => (
          <div key={label} className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 text-center">
            <span className="text-2xl block mb-1">{emoji}</span>
            <p className="font-black text-lg" style={{ color }}>{value}</p>
            <p className="text-xs text-slate-400 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* Historial sueño */}
      {historial.length > 0 && (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
          <p className="font-black text-slate-800 mb-4">😴 Sueño últimas 2 semanas</p>
          <div className="flex items-end gap-1 h-20">
            {historial.slice(0, 14).reverse().map((h, i) => {
              const pct = ((h.horas_sueno || 0) / 12) * 100
              const color = (h.horas_sueno || 0) >= 8 ? '#16a34a' : (h.horas_sueno || 0) >= 6 ? '#ca8a04' : '#dc2626'
              const fecha = new Date(h.fecha)
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max(pct, 5)}%` }}
                    transition={{ duration: 0.5, delay: i * 0.03 }}
                    className="w-full rounded-t-md" style={{ background: color, minHeight: '4px' }} />
                  <span className="text-slate-400" style={{ fontSize: '7px' }}>
                    {fecha.getDate()}/{fecha.getMonth() + 1}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="flex gap-3 mt-2 text-xs">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>≥8h</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>6-8h</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>&lt;6h</span>
          </div>
        </div>
      )}

      {/* Retos completados */}
      {retosHistorial.length > 0 && (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
          <p className="font-black text-slate-800 mb-3">🏆 Últimos retos completados</p>
          <div className="space-y-2">
            {retosHistorial.slice(0, 8).map((r, i) => {
              const reto = RETOS.find(re => re.id === r.reto_id)
              const fecha = new Date(r.completado_en).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
              return (
                <div key={i} className="flex items-center gap-3 py-1.5 border-b border-slate-50 last:border-0">
                  <span className="text-xl">{reto?.emoji || '✅'}</span>
                  <p className="flex-1 text-sm text-slate-700">{r.reto_nombre}</p>
                  <p className="text-xs text-slate-400">{fecha}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {historial.length === 0 && retosHistorial.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-100">
          <span className="text-4xl block mb-2">🌱</span>
          <p className="font-bold text-slate-700">Aún sin datos</p>
          <p className="text-slate-400 text-sm mt-1">Registra tus hábitos y completa retos para ver tu progreso</p>
        </div>
      )}
    </div>
  )
}

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────
export default function Bienestar() {
  const [tab, setTab] = useState('habitos')

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>
          <Heart className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black" style={{ color: '#0d3d3d' }}>Bienestar general</h1>
          <p className="text-slate-500 text-sm">Hábitos, retos y plan de estudio</p>
        </div>
      </div>

      <TabBar tab={tab} setTab={setTab} />

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          {tab === 'habitos'  && <HabitosHoy />}
          {tab === 'retos'    && <RetosAutocuidado />}
          {tab === 'plan'     && <PlanAntistres />}
          {tab === 'progreso' && <Progreso />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
