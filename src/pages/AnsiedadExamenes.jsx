import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/api/supabaseClient'
import { useNavigate, Link } from 'react-router-dom'
import {
  BookOpen, Brain, ChevronRight, ChevronLeft, CheckCircle,
  Heart, Zap, Star, AlertCircle, Clock, Moon, Sun, ArrowLeft,
  Plus, Trash2, Volume2, BarChart2
} from 'lucide-react'

const VOICE_ID = 'RgXx32WYOGrd7gFNifSf'
const XI_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY
const audioCache = {}

async function speak(text) {
  if (XI_API_KEY) {
    const key = `${VOICE_ID}_${text.slice(0, 40)}`
    try {
      if (!audioCache[key]) {
        const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
          method: 'POST',
          headers: { 'xi-api-key': XI_API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2',
            voice_settings: { stability: 0.85, similarity_boost: 0.85, style: 0.15, use_speaker_boost: true } })
        })
        if (!res.ok) throw new Error()
        audioCache[key] = URL.createObjectURL(await res.blob())
      }
      return new Promise(resolve => { const a = new Audio(audioCache[key]); a.onended = resolve; a.play() })
    } catch {}
  }
  return new Promise(resolve => {
    if (!window.speechSynthesis) { resolve(); return }
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'es-ES'; u.rate = 0.72; u.pitch = 1.05; u.volume = 1.0; u.onend = resolve
    const v = window.speechSynthesis.getVoices().find(v => v.lang === 'es-ES') || window.speechSynthesis.getVoices().find(v => v.lang.startsWith('es'))
    if (v) u.voice = v
    window.speechSynthesis.speak(u)
  })
}

// ── COMPONENTES AUXILIARES ─────────────────────────────────────────────────

function ProgressBar({ sesionActual, sesiones, onSelect }) {
  return (
    <div className="flex gap-2 mb-6">
      {sesiones.map((s, i) => (
        <button key={s.id} onClick={() => s.desbloqueada && onSelect(i)}
          className="flex-1 flex flex-col items-center gap-1">
          <div className={`w-full h-2 rounded-full transition-all ${
            i < sesionActual ? 'bg-teal-500' : i === sesionActual ? 'bg-teal-300' : 'bg-slate-200'
          }`} />
          <span className="text-xs font-bold" style={{ color: i <= sesionActual ? '#0f6b6b' : '#94a3b8', fontSize: '9px' }}>
            S{i + 1}
          </span>
        </button>
      ))}
    </div>
  )
}

function TagSelector({ opciones, seleccionadas, onToggle, color = '#0f6b6b' }) {
  return (
    <div className="flex flex-wrap gap-2">
      {opciones.map(op => {
        const sel = seleccionadas.includes(op)
        return (
          <button key={op} onClick={() => onToggle(op)}
            className="px-3 py-1.5 rounded-xl text-sm font-medium border-2 transition-all"
            style={{
              background: sel ? color + '15' : 'white',
              borderColor: sel ? color : '#e2e8f0',
              color: sel ? color : '#64748b'
            }}>
            {op}
          </button>
        )
      })}
    </div>
  )
}

function SliderAnsiedad({ value, onChange }) {
  const getColor = v => v <= 3 ? '#16a34a' : v <= 6 ? '#ca8a04' : '#dc2626'
  const getEmoji = v => v <= 2 ? '😌' : v <= 4 ? '😐' : v <= 6 ? '😟' : v <= 8 ? '😰' : '😱'
  const color = getColor(value)
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-600">Nivel de ansiedad</span>
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
        <span className="text-xs text-green-500">Sin ansiedad</span>
        <span className="text-xs text-red-500">Máxima ansiedad</span>
      </div>
    </div>
  )
}

// ── SESIÓN 1 ───────────────────────────────────────────────────────────────
const SINTOMAS_FISICOS = ['Corazón acelerado', 'Manos sudorosas', 'Tensión muscular', 'Dificultad para respirar', 'Dolor de estómago', 'Temblores', 'Sequedad en la boca', 'Mareos']
const PENSAMIENTOS = ['"No voy a poder"', '"Voy a suspender seguro"', '"Todos van mejor que yo"', '"Si suspendo, todo se acaba"', '"Me he quedado en blanco"', '"No sé nada"', '"Soy un desastre"']
const COMPORTAMIENTOS = ['Procrastinar el estudio', 'Evitar pensar en el examen', 'Estudiar en exceso sin parar', 'Quedarme en blanco en el aula', 'Irme del examen antes', 'Buscar excusas para no ir', 'Necesitar ir al baño constantemente']

function Sesion1({ onComplete }) {
  const [paso, setPaso] = useState(0)
  const [sintomas, setSintomas] = useState([])
  const [pensamientos, setPensamientos] = useState([])
  const [comportamientos, setComportamientos] = useState([])
  const [nivel, setNivel] = useState(5)
  const [saving, setSaving] = useState(false)

  const toggleItem = (lista, setLista, item) => {
    setLista(prev => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item])
  }

  const guardar = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('mapa_ansiedad').upsert({
          user_id: user.id, sintomas_fisicos: sintomas,
          pensamientos, comportamientos, nivel_ansiedad_inicial: nivel,
          created_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
        await supabase.from('progreso_modulo').upsert({
          user_id: user.id, modulo_id: 'ansiedad_examenes', sesion_id: 'sesion1', completada: true
        }, { onConflict: 'user_id,modulo_id,sesion_id' })
      }
      onComplete()
    } catch (e) { console.error(e); onComplete() }
    finally { setSaving(false) }
  }

  const pasos = [
    {
      titulo: '¿Qué es la ansiedad en exámenes?',
      contenido: (
        <div className="space-y-4">
          <div className="bg-teal-50 rounded-2xl p-4 border border-teal-100">
            <p className="font-bold text-teal-800 mb-2">✅ Ansiedad normal (te ayuda)</p>
            <p className="text-teal-700 text-sm">Un poco de nerviosismo activa tu cerebro, te mantiene alerta y mejora tu rendimiento. Es como el combustible antes de una carrera.</p>
          </div>
          <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
            <p className="font-bold text-red-800 mb-2">⚠️ Ansiedad que bloquea</p>
            <p className="text-red-700 text-sm">Cuando la ansiedad es muy alta, interfiere: te quedas en blanco, no puedes concentrarte, evitas estudiar o quieres salir corriendo.</p>
          </div>
          <p className="text-slate-600 text-sm font-medium">La ansiedad afecta en tres niveles:</p>
          <div className="grid grid-cols-3 gap-2">
            {[{ e: '💓', t: 'Físico', d: 'Corazón, respiración, tensión muscular' },
              { e: '🧠', t: 'Mental', d: 'Pensamientos catastrofistas, comparaciones' },
              { e: '🏃', t: 'Conductual', d: 'Evitar, procrastinar, quedarse en blanco' }
            ].map(({ e, t, d }) => (
              <div key={t} className="bg-white rounded-xl p-3 border border-slate-100 text-center">
                <span className="text-2xl block mb-1">{e}</span>
                <p className="font-bold text-slate-700 text-xs">{t}</p>
                <p className="text-slate-500 text-xs mt-1 leading-tight">{d}</p>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      titulo: '¿Qué pasa en tu cuerpo?',
      contenido: (
        <div className="space-y-3">
          <p className="text-slate-600 text-sm">Selecciona los síntomas físicos que notas antes o durante un examen:</p>
          <TagSelector opciones={SINTOMAS_FISICOS} seleccionadas={sintomas} onToggle={item => toggleItem(sintomas, setSintomas, item)} color="#0891b2" />
          {sintomas.length > 0 && <p className="text-xs text-teal-600 font-medium">✓ {sintomas.length} síntomas seleccionados</p>}
        </div>
      )
    },
    {
      titulo: '¿Qué frases se repiten en tu cabeza?',
      contenido: (
        <div className="space-y-3">
          <p className="text-slate-600 text-sm">Estos pensamientos automáticos son muy comunes. Selecciona los que reconoces:</p>
          <TagSelector opciones={PENSAMIENTOS} seleccionadas={pensamientos} onToggle={item => toggleItem(pensamientos, setPensamientos, item)} color="#7c3aed" />
          {pensamientos.length > 0 && <p className="text-xs text-violet-600 font-medium">✓ {pensamientos.length} pensamientos reconocidos</p>}
        </div>
      )
    },
    {
      titulo: '¿Qué haces cuando notas ansiedad?',
      contenido: (
        <div className="space-y-3">
          <p className="text-slate-600 text-sm">Selecciona los comportamientos que sueles tener:</p>
          <TagSelector opciones={COMPORTAMIENTOS} seleccionadas={comportamientos} onToggle={item => toggleItem(comportamientos, setComportamientos, item)} color="#b45309" />
          {comportamientos.length > 0 && <p className="text-xs text-amber-600 font-medium">✓ {comportamientos.length} comportamientos reconocidos</p>}
        </div>
      )
    },
    {
      titulo: 'Tu nivel de ansiedad ante exámenes',
      contenido: (
        <div className="space-y-5">
          <p className="text-slate-600 text-sm">En general, ¿cómo valorarías tu nivel de ansiedad cuando tienes exámenes?</p>
          <SliderAnsiedad value={nivel} onChange={setNivel} />
          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
            <p className="font-bold text-blue-800 text-sm mb-1">📋 Tu mapa de ansiedad</p>
            <p className="text-blue-700 text-sm">Hemos registrado tus síntomas físicos, pensamientos y comportamientos. Al final del módulo podrás comparar cómo has evolucionado.</p>
          </div>
        </div>
      )
    }
  ]

  return (
    <div>
      <div className="flex gap-1.5 mb-5">
        {pasos.map((_, i) => (
          <div key={i} className="flex-1 h-1.5 rounded-full"
            style={{ background: i < paso ? '#0f6b6b' : i === paso ? '#5eead4' : '#e2e8f0' }} />
        ))}
      </div>
      <p className="text-xs text-slate-400 mb-2">Paso {paso + 1} de {pasos.length}</p>
      <h3 className="font-black text-slate-800 text-lg mb-4">{pasos[paso].titulo}</h3>
      <div className="mb-6">{pasos[paso].contenido}</div>
      <div className="flex gap-2">
        {paso > 0 && (
          <button onClick={() => setPaso(paso - 1)}
            className="px-4 py-3 rounded-2xl border border-slate-200 text-slate-500 font-medium text-sm">
            ← Atrás
          </button>
        )}
        {paso < pasos.length - 1 ? (
          <button onClick={() => setPaso(paso + 1)}
            className="flex-1 py-3 rounded-2xl text-white font-bold flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>
            Siguiente <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={guardar} disabled={saving}
            className="flex-1 py-3 rounded-2xl text-white font-bold flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>
            {saving ? 'Guardando...' : <><CheckCircle className="w-4 h-4" /> Guardar mapa</>}
          </button>
        )}
      </div>
    </div>
  )
}

// ── SESIÓN 2 ───────────────────────────────────────────────────────────────
function Sesion2({ onComplete }) {
  const [paso, setPaso] = useState(0)

  const guardar = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) await supabase.from('progreso_modulo').upsert({
        user_id: user.id, modulo_id: 'ansiedad_examenes', sesion_id: 'sesion2', completada: true
      }, { onConflict: 'user_id,modulo_id,sesion_id' })
    } catch {}
    onComplete()
  }

  const pasos = [
    {
      titulo: 'Estudia sin ahogarte',
      contenido: (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <p className="font-bold text-slate-800 mb-3">⏱️ Técnica Pomodoro adaptada</p>
            {[{ t: '25-30 min', d: 'Bloque de estudio concentrado, sin móvil' },
              { t: '5 min', d: 'Pausa activa: levántate, estira, respira' },
              { t: 'Cada 4 bloques', d: 'Descanso largo de 15-20 minutos' }
            ].map(({ t, d }) => (
              <div key={t} className="flex items-start gap-3 mb-2">
                <span className="text-teal-600 font-black text-sm w-24 flex-shrink-0">{t}</span>
                <span className="text-slate-600 text-sm">{d}</span>
              </div>
            ))}
          </div>
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
            <p className="font-bold text-amber-800 mb-2">💡 Reglas de oro</p>
            {['Estudia en el mismo sitio y a la misma hora', 'No estudies más de 4-5 horas al día', 'Empieza por lo más difícil cuando estés más despejado/a', 'Haz repasos cortos en vez de un maratón el día antes'].map(r => (
              <p key={r} className="text-amber-700 text-sm mb-1">✓ {r}</p>
            ))}
          </div>
        </div>
      )
    },
    {
      titulo: 'Cuídate mientras estudias',
      contenido: (
        <div className="space-y-3">
          {[{ emoji: '😴', titulo: 'Sueño', color: '#1d4ed8', bg: '#dbeafe',
              items: ['Duerme 8-9 horas. Sin negociar.', 'Evita el móvil 30 min antes de dormir', 'Misma hora de acostarte todos los días'] },
            { emoji: '🍎', titulo: 'Alimentación', color: '#16a34a', bg: '#dcfce7',
              items: ['No te saltes comidas por estudiar', 'Desayuna bien el día del examen', 'Evita el exceso de cafeína (ansiedad + ansiedad = más ansiedad)'] },
            { emoji: '🏃', titulo: 'Movimiento', color: '#b45309', bg: '#fef3c7',
              items: ['20-30 min de ejercicio al día reduce el cortisol', 'Una caminata vale: activa el cerebro', 'Pausas activas entre bloques de estudio'] }
          ].map(({ emoji, titulo, color, bg, items }) => (
            <div key={titulo} className="rounded-2xl p-4 border" style={{ background: bg, borderColor: color + '30' }}>
              <p className="font-bold mb-2" style={{ color }}>{emoji} {titulo}</p>
              {items.map(item => <p key={item} className="text-sm mb-0.5" style={{ color: color + 'cc' }}>• {item}</p>)}
            </div>
          ))}
        </div>
      )
    },
    {
      titulo: 'Mini-plan: los 3 días antes',
      contenido: (
        <div className="space-y-3">
          {[{ dia: '3 días antes', color: '#0891b2', bg: '#cffafe', icon: '📚',
              items: ['Repaso general de los temas principales', 'Identifica tus puntos flojos y refuérzalos', 'Prepara el material que necesitarás', 'Evita empezar temas nuevos'] },
            { dia: '2 días antes', color: '#7c3aed', bg: '#ede9fe', icon: '🔍',
              items: ['Repaso más específico de dudas', 'Haz ejercicios o preguntas tipo examen', 'Dedica tiempo a actividades que te gusten', 'Termina a una hora razonable'] },
            { dia: 'La noche antes', color: '#0d3d3d', bg: '#ccfbf1', icon: '🌙',
              items: ['Repaso muy ligero (máx. 1 hora)', 'Prepara lo que necesitas (material, ropa)', 'Ritual de sueño: ducha, lectura tranquila', 'Grounding 5-4-3-2-1 para calmarte'] }
          ].map(({ dia, color, bg, icon, items }) => (
            <div key={dia} className="rounded-2xl p-4 border-l-4" style={{ background: bg, borderLeftColor: color }}>
              <p className="font-bold mb-2" style={{ color }}>{icon} {dia}</p>
              {items.map(item => <p key={item} className="text-sm mb-0.5" style={{ color: color + 'cc' }}>• {item}</p>)}
            </div>
          ))}
          <Link to="/grounding">
            <div className="bg-teal-600 rounded-2xl p-4 flex items-center gap-3 mt-2">
              <span className="text-3xl">🌱</span>
              <div className="flex-1">
                <p className="text-white font-bold">Practica el Grounding ahora</p>
                <p className="text-teal-200 text-xs">Para usar la noche antes del examen</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white" />
            </div>
          </Link>
        </div>
      )
    }
  ]

  return (
    <div>
      <div className="flex gap-1.5 mb-5">
        {pasos.map((_, i) => (
          <div key={i} className="flex-1 h-1.5 rounded-full"
            style={{ background: i < paso ? '#0f6b6b' : i === paso ? '#5eead4' : '#e2e8f0' }} />
        ))}
      </div>
      <p className="text-xs text-slate-400 mb-2">Paso {paso + 1} de {pasos.length}</p>
      <h3 className="font-black text-slate-800 text-lg mb-4">{pasos[paso].titulo}</h3>
      <div className="mb-6 overflow-y-auto max-h-96">{pasos[paso].contenido}</div>
      <div className="flex gap-2">
        {paso > 0 && <button onClick={() => setPaso(paso - 1)} className="px-4 py-3 rounded-2xl border border-slate-200 text-slate-500 font-medium text-sm">← Atrás</button>}
        {paso < pasos.length - 1 ? (
          <button onClick={() => setPaso(paso + 1)} className="flex-1 py-3 rounded-2xl text-white font-bold flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>
            Siguiente <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={guardar} className="flex-1 py-3 rounded-2xl text-white font-bold flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>
            <CheckCircle className="w-4 h-4" /> Completar sesión
          </button>
        )}
      </div>
    </div>
  )
}

// ── SESIÓN 3 ───────────────────────────────────────────────────────────────
const FRASES_SUGERIDAS = [
  'Puedo con esto. He preparado el examen.',
  'Un paso a la vez. Leo la pregunta, pienso, respondo.',
  'Los nervios son normales. Mi cuerpo me está ayudando.',
  'No necesito saberlo todo. Hago lo que puedo.',
  'Si me bloqueo, respiro y vuelvo.',
  'No conozco el nivel real de mis compañeros. Solo el mío.',
]

function Sesion3({ onComplete }) {
  const [paso, setPaso] = useState(0)
  const [frases, setFrases] = useState([])
  const [nuevaFrase, setNuevaFrase] = useState('')
  const [visualPlaying, setVisualPlaying] = useState(false)
  const runningRef = useRef(false)

  const addFrase = (f) => {
    if (f && !frases.includes(f)) setFrases(prev => [...prev, f])
  }
  const removeFrase = (f) => setFrases(prev => prev.filter(x => x !== f))

  const VISUALIZACION = [
    'Cierra los ojos. Respira profundo.',
    'Imagina que entras al aula del examen. Estás tranquilo, tranquila. Sabes que has estudiado.',
    'Te sientas. Coges el bolígrafo. Lo notas en tu mano.',
    'El profesor reparte el examen. Lo recibes. Lo lees despacio, sin prisas.',
    'Las preguntas tienen sentido. Empiezas por la que conoces mejor.',
    'Escribes. Las palabras fluyen. Estás concentrado, concentrada.',
    'Cuando terminas, repasas con calma. Estás bien.',
    'Abre los ojos. Esa sensación de calma la llevas contigo.',
  ]

  const playVisualizacion = async () => {
    setVisualPlaying(true)
    runningRef.current = true
    for (const text of VISUALIZACION) {
      if (!runningRef.current) break
      await speak(text)
      await new Promise(r => setTimeout(r, 800))
    }
    setVisualPlaying(false)
  }

  const stopVisualizacion = () => {
    runningRef.current = false
    window.speechSynthesis?.cancel()
    setVisualPlaying(false)
  }

  const guardar = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        if (frases.length > 0) {
          await supabase.from('frases_apoyo').delete().eq('user_id', user.id)
          await supabase.from('frases_apoyo').insert(frases.map(f => ({ user_id: user.id, frase: f })))
        }
        await supabase.from('progreso_modulo').upsert({
          user_id: user.id, modulo_id: 'ansiedad_examenes', sesion_id: 'sesion3', completada: true
        }, { onConflict: 'user_id,modulo_id,sesion_id' })
      }
    } catch {}
    onComplete()
  }

  const pasos = [
    {
      titulo: 'Técnica rápida en el aula',
      contenido: (
        <div className="space-y-4">
          <p className="text-slate-600 text-sm">Cuando notes que te bloqueas en el examen, usa esta secuencia de 2 minutos:</p>
          {[{ n: '1', t: 'Para', d: 'Deja el bolígrafo. Apoya las manos en la mesa.', color: '#0891b2' },
            { n: '2', t: 'Respira', d: 'Inhala 4s, retén 4s, exhala 4s. Solo 3 veces.', color: '#0f6b6b' },
            { n: '3', t: 'Suelta hombros', d: 'Bájalos conscientemente. Relaja la mandíbula.', color: '#7c3aed' },
            { n: '4', t: 'Frase de calma', d: '"Llevo preparando esto. Solo tengo que empezar."', color: '#b45309' },
            { n: '5', t: 'Vuelve', d: 'Lee la pregunta de nuevo, despacio.', color: '#16a34a' }
          ].map(({ n, t, d, color }) => (
            <div key={n} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                style={{ background: color }}>{n}</div>
              <div>
                <p className="font-bold text-slate-800 text-sm">{t}</p>
                <p className="text-slate-500 text-sm">{d}</p>
              </div>
            </div>
          ))}
          <Link to="/escalera-calmado">
            <div className="bg-indigo-600 rounded-2xl p-4 flex items-center gap-3 mt-2">
              <span className="text-2xl">🪜</span>
              <div className="flex-1"><p className="text-white font-bold text-sm">Practicar escalera completa</p></div>
              <ChevronRight className="w-4 h-4 text-white" />
            </div>
          </Link>
        </div>
      )
    },
    {
      titulo: 'Restructura tus pensamientos',
      contenido: (
        <div className="space-y-3">
          <p className="text-slate-600 text-sm">Cuando aparezca un pensamiento negativo, transfórmalo:</p>
          {[{ neg: '"No voy a aprobar"', pos: '"Puede que no saque todo, pero sí parte. Voy por partes."' },
            { neg: '"Todos van mejor que yo"', pos: '"No conozco el nivel real de nadie. Solo me comparo con lo que veo."' },
            { neg: '"Me he quedado en blanco"', pos: '"Esto es temporal. Respiro, vuelvo y lo intento de nuevo."' },
            { neg: '"Soy un desastre"', pos: '"Estoy nervioso/a. Es normal. No define lo que valgo."' }
          ].map(({ neg, pos }) => (
            <div key={neg} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <div className="flex items-start gap-2 mb-2">
                <span className="text-red-500 font-black text-xs">✗</span>
                <p className="text-red-600 text-sm italic">{neg}</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500 font-black text-xs">✓</span>
                <p className="text-green-700 text-sm font-medium">{pos}</p>
              </div>
            </div>
          ))}
        </div>
      )
    },
    {
      titulo: 'Mis frases de apoyo',
      contenido: (
        <div className="space-y-4">
          <p className="text-slate-600 text-sm">Elige o escribe las frases que te ayudan. Las llevarás al examen.</p>
          <div className="space-y-2">
            {FRASES_SUGERIDAS.map(f => (
              <button key={f} onClick={() => frases.includes(f) ? removeFrase(f) : addFrase(f)}
                className="w-full text-left p-3 rounded-xl border-2 transition-all text-sm"
                style={{ background: frases.includes(f) ? '#ccfbf1' : 'white', borderColor: frases.includes(f) ? '#0f6b6b' : '#e2e8f0', color: frases.includes(f) ? '#0d3d3d' : '#64748b' }}>
                {frases.includes(f) ? '✓ ' : '+ '}{f}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={nuevaFrase} onChange={e => setNuevaFrase(e.target.value)}
              placeholder="Escribe tu propia frase..."
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-400" />
            <button onClick={() => { addFrase(nuevaFrase); setNuevaFrase('') }}
              disabled={!nuevaFrase}
              className="px-3 py-2 rounded-xl text-white disabled:opacity-40"
              style={{ background: '#0f6b6b' }}>
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {frases.length > 0 && (
            <div className="bg-teal-50 rounded-2xl p-3 border border-teal-100">
              <p className="text-xs font-bold text-teal-700 mb-2">Mis frases guardadas ({frases.length}):</p>
              {frases.map(f => (
                <div key={f} className="flex items-center justify-between py-1">
                  <p className="text-teal-800 text-sm">"{f}"</p>
                  <button onClick={() => removeFrase(f)}><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    },
    {
      titulo: 'Visualización guiada',
      contenido: (
        <div className="space-y-4">
          <p className="text-slate-600 text-sm">Imagínate entrando tranquilo/a al examen. 1 minuto de audio guiado con voz.</p>
          <div className="bg-indigo-50 rounded-3xl p-6 text-center border border-indigo-100">
            <span className="text-5xl block mb-4">🎬</span>
            <p className="font-bold text-indigo-800 mb-2">Visualización positiva</p>
            <p className="text-indigo-600 text-sm mb-5">Cierra los ojos, ponte cómodo/a y escucha.</p>
            {!visualPlaying ? (
              <button onClick={playVisualizacion}
                className="px-8 py-3 rounded-2xl text-white font-bold flex items-center gap-2 mx-auto"
                style={{ background: 'linear-gradient(135deg, #3730a3, #7c3aed)' }}>
                <Volume2 className="w-5 h-5" /> Iniciar visualización
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-center gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.div key={i} className="w-2 h-8 rounded-full bg-indigo-400"
                      animate={{ scaleY: [1, 2, 1] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }} />
                  ))}
                </div>
                <button onClick={stopVisualizacion} className="text-indigo-500 text-sm">Detener</button>
              </div>
            )}
          </div>
        </div>
      )
    }
  ]

  return (
    <div>
      <div className="flex gap-1.5 mb-5">
        {pasos.map((_, i) => (
          <div key={i} className="flex-1 h-1.5 rounded-full"
            style={{ background: i < paso ? '#0f6b6b' : i === paso ? '#5eead4' : '#e2e8f0' }} />
        ))}
      </div>
      <p className="text-xs text-slate-400 mb-2">Paso {paso + 1} de {pasos.length}</p>
      <h3 className="font-black text-slate-800 text-lg mb-4">{pasos[paso].titulo}</h3>
      <div className="mb-6 overflow-y-auto max-h-96">{pasos[paso].contenido}</div>
      <div className="flex gap-2">
        {paso > 0 && <button onClick={() => setPaso(paso - 1)} className="px-4 py-3 rounded-2xl border border-slate-200 text-slate-500 font-medium text-sm">← Atrás</button>}
        {paso < pasos.length - 1 ? (
          <button onClick={() => setPaso(paso + 1)} className="flex-1 py-3 rounded-2xl text-white font-bold flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>
            Siguiente <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={guardar} className="flex-1 py-3 rounded-2xl text-white font-bold flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>
            <CheckCircle className="w-4 h-4" /> Guardar y completar
          </button>
        )}
      </div>
    </div>
  )
}

// ── SESIÓN 4 ───────────────────────────────────────────────────────────────
function Sesion4({ onComplete }) {
  const [paso, setPaso] = useState(0)
  const [nivel, setNivel] = useState(5)
  const [usoEscalera, setUsoEscalera] = useState(false)
  const [usoGrounding, setUsoGrounding] = useState(false)
  const [usoVisual, setUsoVisual] = useState(false)
  const [bien, setBien] = useState('')
  const [mejorar, setMejorar] = useState('')
  const [cambiar, setCambiar] = useState('')
  const [saving, setSaving] = useState(false)
  const [mapaPrevio, setMapaPrevio] = useState(null)

  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('mapa_ansiedad').select('*').eq('user_id', user.id).limit(1)
      if (data && data.length > 0) setMapaPrevio(data[0])
    }
    cargar()
  }, [])

  const guardar = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('evaluacion_post_examen').insert({
          user_id: user.id, nivel_ansiedad_examen: nivel,
          uso_escalera: usoEscalera, uso_grounding: usoGrounding, uso_visualizacion: usoVisual,
          que_hice_bien: bien, que_mejorar: mejorar, que_cambiar: cambiar
        })
        await supabase.from('progreso_modulo').upsert({
          user_id: user.id, modulo_id: 'ansiedad_examenes', sesion_id: 'sesion4', completada: true
        }, { onConflict: 'user_id,modulo_id,sesion_id' })
      }
      onComplete()
    } catch { onComplete() }
    finally { setSaving(false) }
  }

  const pasos = [
    {
      titulo: 'Cómo evaluarte sin juzgarte',
      contenido: (
        <div className="space-y-4">
          <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
            <p className="font-bold text-red-800 mb-2">❌ Pensamiento "todo o nada"</p>
            <p className="text-red-700 text-sm">"Si no apruebo, soy un fracasado/a." "Si apruebo, soy lo mejor."</p>
          </div>
          <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
            <p className="font-bold text-green-800 mb-2">✅ Autoevaluación realista</p>
            <p className="text-green-700 text-sm">Un examen es solo una medida en un momento concreto. No define quién eres ni lo que vales. Siempre hay una próxima vez.</p>
          </div>
          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
            <p className="font-bold text-blue-800 mb-3">Las tres preguntas que importan:</p>
            {['¿Qué hice bien en este examen?', '¿Qué puedo mejorar la próxima vez?', '¿Qué necesito cambiar en mi preparación?'].map((q, i) => (
              <p key={i} className="text-blue-700 text-sm mb-1">{i + 1}. {q}</p>
            ))}
          </div>
        </div>
      )
    },
    {
      titulo: 'Tu reflexión post-examen',
      contenido: (
        <div className="space-y-4">
          <SliderAnsiedad value={nivel} onChange={setNivel} />
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">¿Qué técnicas usaste?</p>
            <div className="flex flex-col gap-2">
              {[{ label: '🪜 Escalera de calmado', val: usoEscalera, set: setUsoEscalera },
                { label: '🌱 Grounding 5-4-3-2-1', val: usoGrounding, set: setUsoGrounding },
                { label: '🎬 Visualización positiva', val: usoVisual, set: setUsoVisual }
              ].map(({ label, val, set }) => (
                <button key={label} onClick={() => set(!val)}
                  className="flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all"
                  style={{ background: val ? '#ccfbf1' : 'white', borderColor: val ? '#0f6b6b' : '#e2e8f0' }}>
                  <div className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0"
                    style={{ borderColor: val ? '#0f6b6b' : '#94a3b8', background: val ? '#0f6b6b' : 'white' }}>
                    {val && <span className="text-white text-xs font-black">✓</span>}
                  </div>
                  <span className="text-sm font-medium" style={{ color: val ? '#0d3d3d' : '#64748b' }}>{label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {[{ label: '✅ ¿Qué hice bien?', val: bien, set: setBien, ph: 'Llegué a tiempo, empecé por lo que sabía...' },
              { label: '🔧 ¿Qué puedo mejorar?', val: mejorar, set: setMejorar, ph: 'Gestionar mejor el tiempo, estudiar antes...' },
              { label: '🔄 ¿Qué cambiaría?', val: cambiar, set: setCambiar, ph: 'Dormir más, repasar de otra forma...' }
            ].map(({ label, val, set, ph }) => (
              <div key={label}>
                <p className="text-sm font-medium text-slate-700 mb-1">{label}</p>
                <textarea value={val} onChange={e => set(e.target.value)} placeholder={ph} rows={2}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-400 resize-none" />
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      titulo: 'Tu evolución',
      contenido: (
        <div className="space-y-4">
          {mapaPrevio ? (
            <>
              <p className="text-slate-600 text-sm">Comparando con cuando empezaste el módulo:</p>
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-center">
                    <p className="text-xs text-slate-400 mb-1">Antes</p>
                    <p className="text-4xl font-black" style={{ color: '#dc2626' }}>{mapaPrevio.nivel_ansiedad_inicial}</p>
                    <p className="text-xs text-slate-500">/10</p>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <ChevronRight className="w-6 h-6 text-slate-300" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400 mb-1">Ahora</p>
                    <p className="text-4xl font-black" style={{ color: nivel <= 4 ? '#16a34a' : nivel <= 7 ? '#ca8a04' : '#dc2626' }}>{nivel}</p>
                    <p className="text-xs text-slate-500">/10</p>
                  </div>
                </div>
                {mapaPrevio.nivel_ansiedad_inicial - nivel > 0 && (
                  <div className="bg-green-50 rounded-xl p-3 text-center">
                    <p className="text-green-700 font-bold text-sm">
                      🎉 Has bajado {mapaPrevio.nivel_ansiedad_inicial - nivel} punto{mapaPrevio.nivel_ansiedad_inicial - nivel !== 1 ? 's' : ''} tu ansiedad
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-slate-50 rounded-2xl p-4 text-center">
              <p className="text-slate-500 text-sm">Completa la Sesión 1 para ver tu evolución</p>
            </div>
          )}
          <div className="bg-teal-50 rounded-2xl p-4 border border-teal-100">
            <p className="font-bold text-teal-800 mb-2">📊 Tu informe se ha generado</p>
            <p className="text-teal-700 text-sm">Tu psicólogo u orientador puede ver tu evolución en el panel de administración.</p>
          </div>
        </div>
      )
    }
  ]

  return (
    <div>
      <div className="flex gap-1.5 mb-5">
        {pasos.map((_, i) => (
          <div key={i} className="flex-1 h-1.5 rounded-full"
            style={{ background: i < paso ? '#0f6b6b' : i === paso ? '#5eead4' : '#e2e8f0' }} />
        ))}
      </div>
      <p className="text-xs text-slate-400 mb-2">Paso {paso + 1} de {pasos.length}</p>
      <h3 className="font-black text-slate-800 text-lg mb-4">{pasos[paso].titulo}</h3>
      <div className="mb-6 overflow-y-auto max-h-96">{pasos[paso].contenido}</div>
      <div className="flex gap-2">
        {paso > 0 && <button onClick={() => setPaso(paso - 1)} className="px-4 py-3 rounded-2xl border border-slate-200 text-slate-500 font-medium text-sm">← Atrás</button>}
        {paso < pasos.length - 1 ? (
          <button onClick={() => setPaso(paso + 1)} className="flex-1 py-3 rounded-2xl text-white font-bold flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>
            Siguiente <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={guardar} disabled={saving} className="flex-1 py-3 rounded-2xl text-white font-bold flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>
            {saving ? 'Guardando...' : <><CheckCircle className="w-4 h-4" /> Completar módulo</>}
          </button>
        )}
      </div>
    </div>
  )
}

// ── PÁGINA PRINCIPAL ───────────────────────────────────────────────────────
const SESIONES = [
  { id: 'sesion1', titulo: 'Qué es la ansiedad en exámenes', subtitulo: 'Psicoeducación + tu mapa personal', emoji: '🧠', duracion: '10 min' },
  { id: 'sesion2', titulo: 'Prepárate sin ahogarte', subtitulo: 'Estrategias de estudio y mini-plan', emoji: '📚', duracion: '8 min' },
  { id: 'sesion3', titulo: 'En el momento del examen', subtitulo: 'Técnicas + frases de apoyo + visualización', emoji: '✏️', duracion: '12 min' },
  { id: 'sesion4', titulo: 'Después del examen', subtitulo: 'Reflexión y tu evolución', emoji: '📊', duracion: '8 min' },
]

export default function AnsiedadExamenes() {
  const [sesionActiva, setSesionActiva] = useState(null)
  const [progreso, setProgreso] = useState({})
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await supabase.from('progreso_modulo')
        .select('sesion_id, completada').eq('user_id', user.id).eq('modulo_id', 'ansiedad_examenes')
      const prog = {}
      data?.forEach(d => { prog[d.sesion_id] = d.completada })
      setProgreso(prog)
      setLoading(false)
    }
    cargar()
  }, [sesionActiva])

  const sesionesConEstado = SESIONES.map((s, i) => ({
    ...s,
    completada: progreso[s.id] || false,
    desbloqueada: i === 0 || progreso[SESIONES[i - 1]?.id],
  }))

  const totalCompletadas = Object.values(progreso).filter(Boolean).length

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f0f9f9' }}>
      <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
    </div>
  )

  // Vista sesión activa
  if (sesionActiva !== null) {
    const sesion = sesionesConEstado[sesionActiva]
    const Componente = [Sesion1, Sesion2, Sesion3, Sesion4][sesionActiva]
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <button onClick={() => setSesionActiva(null)} className="flex items-center gap-2 text-teal-600 font-medium mb-4">
          <ArrowLeft className="w-4 h-4" /> Volver al módulo
        </button>
        <div className={`rounded-2xl p-4 mb-5 flex items-center gap-3`}
          style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>
          <span className="text-3xl">{sesion.emoji}</span>
          <div>
            <p className="text-white font-black">Sesión {sesionActiva + 1}</p>
            <p className="text-teal-200 text-sm">{sesion.titulo}</p>
          </div>
        </div>
        <ProgressBar sesionActual={sesionActiva} sesiones={sesionesConEstado} onSelect={setSesionActiva} />
        <Componente onComplete={() => setSesionActiva(null)} />
      </div>
    )
  }

  // Vista índice
  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <img src="https://zbusdixrxedfhbkquafh.supabase.co/storage/v1/object/public/logo/WhatsApp%20Image%202026-04-06%20at%2015.58.04.jpeg"
          alt="Resetea" className="w-10 h-10 rounded-full object-cover shadow-md flex-shrink-0" />
        <div>
          <h1 className="text-xl font-black" style={{ color: '#0d3d3d' }}>Ansiedad y exámenes</h1>
          <p className="text-slate-500 text-sm">4 sesiones · Material psicoeducativo</p>
        </div>
      </div>

      {/* Progreso general */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold text-slate-700">Tu progreso</p>
          <span className="font-black text-teal-600">{totalCompletadas}/{SESIONES.length}</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${(totalCompletadas / SESIONES.length) * 100}%` }}
            transition={{ duration: 0.8 }}
            className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #0f6b6b, #5eead4)' }} />
        </div>
        {totalCompletadas === SESIONES.length && (
          <p className="text-green-600 text-sm font-bold mt-2">🎉 ¡Módulo completado!</p>
        )}
      </div>

      {/* Sesiones */}
      <div className="space-y-3">
        {sesionesConEstado.map((sesion, i) => (
          <motion.div key={sesion.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <button onClick={() => sesion.desbloqueada && setSesionActiva(i)}
              disabled={!sesion.desbloqueada}
              className="w-full text-left bg-white rounded-2xl p-5 shadow-sm border transition-all hover:shadow-md disabled:opacity-50"
              style={{ borderColor: sesion.completada ? '#0f6b6b30' : '#e2e8f0' }}>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: sesion.completada ? '#ccfbf1' : sesion.desbloqueada ? '#f0f9ff' : '#f1f5f9' }}>
                  {sesion.completada ? '✅' : sesion.desbloqueada ? sesion.emoji : '🔒'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs text-slate-400">Sesión {i + 1}</span>
                    <span className="text-xs text-slate-300">·</span>
                    <span className="text-xs text-slate-400">{sesion.duracion}</span>
                  </div>
                  <p className="font-bold text-slate-800 text-sm">{sesion.titulo}</p>
                  <p className="text-xs text-slate-500">{sesion.subtitulo}</p>
                </div>
                {sesion.desbloqueada && !sesion.completada && <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />}
                {sesion.completada && <span className="text-teal-500 text-xs font-bold">Completada</span>}
              </div>
            </button>
          </motion.div>
        ))}
      </div>

      {/* Módulo Cuando me quedo en blanco */}
      <div className="mt-6">
        <p className="font-black text-slate-700 mb-3">Módulo relacionado</p>
        <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🫥</span>
            <div className="flex-1">
              <p className="text-white font-black">Cuando me quedo en blanco</p>
              <p className="text-white/70 text-sm">Psicoeducación sobre bloqueo + grounding guiado</p>
            </div>
            <ChevronRight className="w-5 h-5 text-white" />
          </div>
          <div className="mt-4 space-y-2">
            <div className="bg-white/15 rounded-xl p-3">
              <p className="text-white font-bold text-sm mb-1">¿Por qué me quedo en blanco?</p>
              <p className="text-white/70 text-xs">El bloqueo ocurre cuando la ansiedad satura tu memoria de trabajo. El cerebro entra en modo alarma y "expulsa" los recuerdos almacenados. No es falta de preparación — es una respuesta de estrés.</p>
            </div>
            <div className="bg-white/15 rounded-xl p-3">
              <p className="text-white font-bold text-sm mb-2">Qué hacer en ese momento:</p>
              {['Para. No fuerces el recuerdo.', 'Respira 3 veces lento (4-4-6).', 'Grounding rápido: 3 cosas que ves, 2 que tocas.', 'Vuelve a leer la pregunta despacio.', 'Empieza por otra pregunta si es posible.'].map((paso, i) => (
                <p key={i} className="text-white/80 text-xs mb-0.5">{i + 1}. {paso}</p>
              ))}
            </div>
            <Link to="/grounding">
              <div className="bg-white rounded-xl p-3 flex items-center gap-2 mt-2">
                <span className="text-xl">🌱</span>
                <p className="text-red-600 font-bold text-sm flex-1">Hacer Grounding guiado ahora</p>
                <ChevronRight className="w-4 h-4 text-red-400" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
