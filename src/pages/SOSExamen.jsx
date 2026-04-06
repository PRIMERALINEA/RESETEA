import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/api/supabaseClient'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ChevronRight, CheckCircle, Volume2, Play, AlertCircle, Zap, Clock, Activity } from 'lucide-react'

// ── VOZ ───────────────────────────────────────────────────────────────────
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
      return new Promise(r => { const a = new Audio(audioCache[key]); a.onended = r; a.play() })
    } catch {}
  }
  return new Promise(r => {
    if (!window.speechSynthesis) { r(); return }
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'es-ES'; u.rate = 0.72; u.pitch = 1.05; u.volume = 1.0; u.onend = r
    const v = window.speechSynthesis.getVoices().find(v => v.lang === 'es-ES')
    if (v) u.voice = v
    window.speechSynthesis.speak(u)
  })
}

// ── SLIDER MALESTAR ───────────────────────────────────────────────────────
function SliderMalestar({ value, onChange, label = 'Nivel de malestar' }) {
  const getColor = v => v <= 3 ? '#16a34a' : v <= 6 ? '#ca8a04' : '#dc2626'
  const getEmoji = v => v <= 2 ? '😌' : v <= 4 ? '😐' : v <= 6 ? '😟' : v <= 8 ? '😰' : '😱'
  const color = getColor(value)
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-600">{label}</span>
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
        <span className="text-xs text-green-500">Sin malestar</span>
        <span className="text-xs text-red-500">Máximo</span>
      </div>
    </div>
  )
}

// ── TÉCNICA 1A: RESPIRACIÓN CUADRADA ─────────────────────────────────────
function RespiracionCuadrada({ onBack }) {
  const [state, setState] = useState('idle')
  const [phase, setPhase] = useState(0)
  const [counter, setCounter] = useState(4)
  const [cycle, setCycle] = useState(0)
  const [malestarPre, setMalestarPre] = useState(5)
  const [malestarPost, setMalestarPost] = useState(5)
  const [showPost, setShowPost] = useState(false)
  const timerRef = useRef(null)
  const PHASES = [
    { label: 'INHALA', color: '#60a5fa', scale: 1.4, secs: 4 },
    { label: 'RETÉN', color: '#a78bfa', scale: 1.4, secs: 4 },
    { label: 'EXHALA', color: '#34d399', scale: 0.7, secs: 4 },
    { label: 'RETÉN', color: '#60a5fa', scale: 0.7, secs: 4 },
  ]
  const TOTAL_CYCLES = 4

  const start = () => {
    setState('running'); setPhase(0); setCycle(0); setCounter(4)
    speak('Empezamos. Inhala lentamente por la nariz.')
  }

  useEffect(() => {
    if (state !== 'running') return
    timerRef.current = setInterval(() => {
      setCounter(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          setPhase(ph => {
            const nextPh = (ph + 1) % 4
            if (nextPh === 0) {
              setCycle(c => {
                const nextC = c + 1
                if (nextC >= TOTAL_CYCLES) { setState('done'); setShowPost(true); return nextC }
                speak('Inhala.')
                return nextC
              })
            } else {
              if (nextPh === 1) speak('Retén.')
              if (nextPh === 2) speak('Exhala lentamente.')
              if (nextPh === 3) speak('Retén.')
            }
            return nextPh
          })
          return PHASES[(phase + 1) % 4].secs
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [state, phase])

  const ph = PHASES[phase]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-600"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h3 className="font-black text-slate-800">Respiración cuadrada 4-4-4-4</h3>
          <p className="text-slate-500 text-xs">3-4 ciclos · Reduce la frecuencia cardíaca</p>
        </div>
      </div>

      {state === 'idle' && (
        <div className="space-y-4">
          <SliderMalestar value={malestarPre} onChange={setMalestarPre} label="¿Cómo estás ahora?" />
          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
            <p className="text-blue-700 text-sm">Inhala 4s · Retén 4s · Exhala 4s · Retén 4s · Repite 4 veces</p>
          </div>
          <button onClick={start} className="w-full py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #0891b2)' }}>
            <Volume2 className="w-5 h-5" /> Iniciar con voz guiada
          </button>
        </div>
      )}

      {state === 'running' && (
        <div className="flex flex-col items-center gap-6">
          <div className="flex gap-1.5">
            {Array.from({ length: TOTAL_CYCLES }).map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full transition-all"
                style={{ background: i < cycle ? '#4ade80' : i === cycle ? ph.color : 'rgba(0,0,0,0.1)' }} />
            ))}
          </div>
          <motion.div className="w-40 h-40 rounded-full flex items-center justify-center shadow-xl"
            style={{ background: `radial-gradient(circle, ${ph.color}44, ${ph.color}22)`, border: `3px solid ${ph.color}66` }}
            animate={{ scale: ph.scale }} transition={{ duration: ph.secs, ease: 'easeInOut' }}>
            <div className="text-center">
              <p className="font-black text-lg" style={{ color: ph.color }}>{ph.label}</p>
              <p className="text-slate-500 font-black text-3xl">{counter}s</p>
            </div>
          </motion.div>
          <button onClick={() => { clearInterval(timerRef.current); setState('idle'); window.speechSynthesis?.cancel() }}
            className="text-slate-400 text-xs hover:text-slate-600">Detener</button>
        </div>
      )}

      {showPost && (
        <div className="space-y-4">
          <div className="bg-green-50 rounded-2xl p-4 border border-green-100 text-center">
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
            <p className="font-black text-green-800">¡4 ciclos completados!</p>
          </div>
          <SliderMalestar value={malestarPost} onChange={setMalestarPost} label="¿Cómo estás ahora?" />
          {malestarPre - malestarPost > 0 && (
            <p className="text-teal-600 text-sm font-bold text-center">
              ✅ Has bajado {malestarPre - malestarPost} punto{malestarPre - malestarPost > 1 ? 's' : ''} tu malestar
            </p>
          )}
          <button onClick={onBack} className="w-full py-3 rounded-2xl text-white font-bold"
            style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>
            Volver al SOS
          </button>
        </div>
      )}
    </div>
  )
}

// ── TÉCNICA 1B: RESPIRACIÓN DIAFRAGMÁTICA ────────────────────────────────
function RespiracionDiafragmatica({ onBack }) {
  const [state, setState] = useState('idle')
  const [fase, setFase] = useState('barriga') // barriga | respiracion | fin
  const [counter, setCounter] = useState(60)
  const [malestarPre, setMalestarPre] = useState(5)
  const [malestarPost, setMalestarPost] = useState(5)
  const timerRef = useRef(null)
  const runRef = useRef(false)

  const start = async () => {
    setState('running'); setFase('barriga'); setCounter(60); runRef.current = true
    await speak('Pon tu mano en el abdomen. Deja que suba al inspirar y baje al exhalar.')
    await speak('Siente tu barriga. Solo observa cómo se mueve.')
    let c = 58
    timerRef.current = setInterval(() => {
      c -= 1; setCounter(c)
      if (c <= 0) {
        clearInterval(timerRef.current)
        if (runRef.current) iniciarFase2()
      }
    }, 1000)
  }

  const iniciarFase2 = async () => {
    setFase('respiracion'); setCounter(60)
    await speak('Ahora respira. Inhala 4 segundos... exhala 6 segundos. Barriga sube al inhalar, baja al exhalar.')
    let c = 58
    timerRef.current = setInterval(() => {
      c -= 1; setCounter(c)
      if (c <= 0) { clearInterval(timerRef.current); if (runRef.current) setFase('fin') }
    }, 1000)
  }

  useEffect(() => () => { runRef.current = false; clearInterval(timerRef.current); window.speechSynthesis?.cancel() }, [])

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-600"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h3 className="font-black text-slate-800">Respiración diafragmática</h3>
          <p className="text-slate-500 text-xs">2 minutos · Calma profunda</p>
        </div>
      </div>

      {state === 'idle' && (
        <div className="space-y-4">
          <SliderMalestar value={malestarPre} onChange={setMalestarPre} label="¿Cómo estás ahora?" />
          <div className="bg-teal-50 rounded-2xl p-4 border border-teal-100 space-y-2">
            <p className="font-bold text-teal-700 text-sm">Cómo hacerlo:</p>
            <p className="text-teal-600 text-sm">1. Pon una mano en el pecho y otra en el abdomen</p>
            <p className="text-teal-600 text-sm">2. Respira de forma que solo suba la mano del abdomen</p>
            <p className="text-teal-600 text-sm">3. Inhala 4s, exhala 6s. Suave y continuo.</p>
          </div>
          <button onClick={start} className="w-full py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>
            <Volume2 className="w-5 h-5" /> Iniciar con voz guiada
          </button>
        </div>
      )}

      {state === 'running' && fase !== 'fin' && (
        <div className="flex flex-col items-center gap-5">
          <div className="relative flex items-center justify-center">
            <motion.div className="w-36 h-36 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #ccfbf1, #5eead4)', border: '3px solid #0f6b6b' }}
              animate={fase === 'respiracion' ? { scale: [1, 1.3, 1.3, 0.8, 0.8, 1] } : { scale: [1, 1.1, 1] }}
              transition={{ duration: fase === 'respiracion' ? 10 : 3, repeat: Infinity, ease: 'easeInOut' }}>
              <span className="text-4xl">{fase === 'barriga' ? '🫁' : '🌊'}</span>
            </motion.div>
          </div>
          <div className="text-center">
            <p className="font-black text-slate-800 text-lg">
              {fase === 'barriga' ? 'Siente tu barriga' : 'Inhala 4s · Exhala 6s'}
            </p>
            <p className="text-slate-500 text-sm">{counter}s restantes</p>
          </div>
          {fase === 'barriga' && <p className="text-slate-500 text-sm text-center italic">"Pon tu mano en el abdomen. Deja que suba al inspirar, baje al exhalar."</p>}
          <button onClick={() => { runRef.current = false; clearInterval(timerRef.current); setState('idle'); window.speechSynthesis?.cancel() }}
            className="text-slate-400 text-xs">Detener</button>
        </div>
      )}

      {(state === 'running' && fase === 'fin') && (
        <div className="space-y-4">
          <div className="bg-green-50 rounded-2xl p-4 text-center border border-green-100">
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
            <p className="font-black text-green-800">2 minutos completados</p>
          </div>
          <SliderMalestar value={malestarPost} onChange={setMalestarPost} label="¿Cómo estás ahora?" />
          {malestarPre - malestarPost > 0 && (
            <p className="text-teal-600 text-sm font-bold text-center">✅ Has bajado {malestarPre - malestarPost} puntos tu malestar</p>
          )}
          <button onClick={onBack} className="w-full py-3 rounded-2xl text-white font-bold"
            style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>Volver al SOS</button>
        </div>
      )}
    </div>
  )
}

// ── TÉCNICA 2A: MAPA CORPORAL ─────────────────────────────────────────────
const ZONAS = [
  { id: 'cabeza', label: 'Cabeza', emoji: '🤕', tip: 'Gira el cuello lentamente 3 veces a cada lado.' },
  { id: 'cuello', label: 'Cuello', emoji: '😤', tip: 'Inclina la cabeza hacia cada hombro, mantén 10 segundos.' },
  { id: 'hombros', label: 'Hombros', emoji: '🤷', tip: 'Sube los hombros a las orejas, mantén 3s, suelta. Repite 3 veces.' },
  { id: 'pecho', label: 'Pecho', emoji: '💓', tip: 'Pon la mano en el pecho. Respira profundo 4 veces notando cómo sube.' },
  { id: 'mandibula', label: 'Mandíbula', emoji: '😬', tip: 'Aprieta la mandíbula 3s, suelta. Mueve el mentón de lado a lado.' },
  { id: 'manos', label: 'Manos', emoji: '🤜', tip: 'Aprieta los puños 3s, suelta. Sacude las manos 10 segundos.' },
  { id: 'estomago', label: 'Estómago', emoji: '😰', tip: 'Respira hacia el abdomen. Infla el estómago 4s, vacía 6s. 3 veces.' },
  { id: 'piernas', label: 'Piernas', emoji: '🦵', tip: 'Presiona los pies contra el suelo 5s, suelta. Repite 3 veces.' },
]

function MapaCorporal({ onBack }) {
  const [zonasSel, setZonasSel] = useState([])
  const [mostrarTips, setMostrarTips] = useState(false)

  const toggle = (id) => setZonasSel(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const zonasTips = ZONAS.filter(z => zonasSel.includes(z.id))

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-600"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h3 className="font-black text-slate-800">Mapa corporal del examen</h3>
          <p className="text-slate-500 text-xs">¿Dónde sientes la tensión?</p>
        </div>
      </div>

      {!mostrarTips ? (
        <div className="space-y-4">
          <p className="text-slate-600 text-sm">Selecciona las zonas donde sientes tensión ahora mismo:</p>
          <div className="grid grid-cols-2 gap-2">
            {ZONAS.map(z => (
              <button key={z.id} onClick={() => toggle(z.id)}
                className="flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all"
                style={{ background: zonasSel.includes(z.id) ? '#fee2e2' : 'white', borderColor: zonasSel.includes(z.id) ? '#dc2626' : '#e2e8f0' }}>
                <span className="text-2xl">{z.emoji}</span>
                <span className="text-sm font-medium" style={{ color: zonasSel.includes(z.id) ? '#dc2626' : '#64748b' }}>{z.label}</span>
              </button>
            ))}
          </div>
          <button onClick={() => zonasSel.length > 0 && setMostrarTips(true)}
            disabled={zonasSel.length === 0}
            className="w-full py-3 rounded-2xl text-white font-bold disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}>
            Ver técnicas para mis zonas
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-slate-600 text-sm font-medium">Técnicas para tus zonas de tensión:</p>
          {zonasTips.map(z => (
            <div key={z.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{z.emoji}</span>
                <p className="font-bold text-slate-800">{z.label}</p>
              </div>
              <p className="text-slate-600 text-sm">{z.tip}</p>
            </div>
          ))}
          <button onClick={() => { setMostrarTips(false); setZonasSel([]) }}
            className="text-slate-400 text-xs">← Cambiar zonas</button>
          <button onClick={onBack} className="w-full py-3 rounded-2xl text-white font-bold"
            style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>Volver al SOS</button>
        </div>
      )}
    </div>
  )
}

// ── TÉCNICA 2B: MICRO-RELAJACIÓN ─────────────────────────────────────────
const MICRO_PASOS_JACOBSON = [
  { zona: 'Hombros', instruccion: 'Sube los hombros hacia las orejas... aguanta...', relax: 'Suelta. Siente el calor.', tense: 3, relax: 10 },
  { zona: 'Mandíbula', instruccion: 'Aprieta la mandíbula... aguanta...', relax: 'Suelta. Relaja la cara.', tense: 3, relax: 10 },
  { zona: 'Puños', instruccion: 'Aprieta los puños con fuerza... aguanta...', relax: 'Suelta. Deja caer las manos.', tense: 3, relax: 10 },
]

function MicroRelajacion({ onBack }) {
  const [state, setState] = useState('idle')
  const [pasoIdx, setPasoIdx] = useState(0)
  const [fase, setFase] = useState('tense')
  const [counter, setCounter] = useState(3)
  const timerRef = useRef(null)
  const runRef = useRef(false)

  const start = async () => {
    setState('running'); runRef.current = true
    setPasoIdx(0); setFase('tense'); setCounter(MICRO_PASOS_JACOBSON[0].tense)
    await speak('Micro-relajación muscular. Vamos a tensar y soltar tres grupos.')
    speak(MICRO_PASOS_JACOBSON[0].instruccion)
  }

  useEffect(() => {
    if (state !== 'running') return
    timerRef.current = setInterval(() => {
      setCounter(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          if (fase === 'tense') {
            setFase('relax')
            setCounter(MICRO_PASOS_JACOBSON[pasoIdx].relax)
            speak(MICRO_PASOS_JACOBSON[pasoIdx].relax)
          } else {
            const next = pasoIdx + 1
            if (next >= MICRO_PASOS_JACOBSON.length) {
              setState('done')
            } else {
              setPasoIdx(next); setFase('tense')
              setCounter(MICRO_PASOS_JACOBSON[next].tense)
              speak(MICRO_PASOS_JACOBSON[next].instruccion)
            }
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [state, fase, pasoIdx])

  useEffect(() => () => { runRef.current = false; clearInterval(timerRef.current); window.speechSynthesis?.cancel() }, [])

  const paso = MICRO_PASOS_JACOBSON[pasoIdx]

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-600"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h3 className="font-black text-slate-800">Micro-relajación muscular</h3>
          <p className="text-slate-500 text-xs">40 segundos · Jacobson resumido</p>
        </div>
      </div>

      {state === 'idle' && (
        <div className="space-y-4">
          <div className="space-y-2">
            {MICRO_PASOS_JACOBSON.map((p, i) => (
              <div key={i} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-slate-100">
                <span className="text-xl">{['🤷', '😬', '🤜'][i]}</span>
                <span className="text-sm text-slate-600">{p.zona}</span>
              </div>
            ))}
          </div>
          <button onClick={start} className="w-full py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #be185d, #db2777)' }}>
            <Volume2 className="w-5 h-5" /> Iniciar con voz guiada
          </button>
        </div>
      )}

      {state === 'running' && (
        <div className="flex flex-col items-center gap-5">
          <p className="text-slate-400 text-xs">Zona {pasoIdx + 1} de {MICRO_PASOS_JACOBSON.length}</p>
          <div className="w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center"
            style={{ borderColor: fase === 'tense' ? '#dc2626' : '#16a34a' }}>
            <p className="font-black text-lg" style={{ color: fase === 'tense' ? '#dc2626' : '#16a34a' }}>
              {fase === 'tense' ? 'TENSA' : 'SUELTA'}
            </p>
            <p className="text-slate-600 font-black text-2xl">{counter}s</p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-4 text-center">
            <p className="font-bold text-slate-800">{paso.zona}</p>
            <p className="text-slate-600 text-sm mt-1">{fase === 'tense' ? paso.instruccion : paso.relax}</p>
          </div>
        </div>
      )}

      {state === 'done' && (
        <div className="space-y-4 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
          <p className="font-black text-slate-800 text-lg">¡Micro-relajación completada!</p>
          <p className="text-slate-500 text-sm">Nota cómo tus músculos están más sueltos.</p>
          <button onClick={onBack} className="w-full py-3 rounded-2xl text-white font-bold"
            style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>Volver al SOS</button>
        </div>
      )}
    </div>
  )
}

// ── TÉCNICA 3: GROUNDING EN EL AULA ──────────────────────────────────────
const GROUNDING_AULA = [
  { n: 5, sentido: 'VES', emoji: '👁️', color: '#60a5fa', ejemplos: 'borrador · reloj · ventana · silla · tu nombre en el examen', texto: 'Mira despacio. Nombra 5 cosas que puedes ver ahora mismo.' },
  { n: 4, sentido: 'TOCAS', emoji: '✋', color: '#34d399', ejemplos: 'boli · hoja · mesa · ropa · silla', texto: 'Siente la textura. ¿Es suave, duro, frío, rugoso?' },
  { n: 3, sentido: 'OYES', emoji: '👂', color: '#a78bfa', ejemplos: 'ambiente · reloj · pasos · respiración · lápices', texto: 'No busques silencio. Encuentra 3 sonidos presentes.' },
  { n: 2, sentido: 'HUELES', emoji: '👃', color: '#fbbf24', ejemplos: 'papel · tinta · desinfectante · tu ropa', texto: 'Si no hay olores claros, imagina uno que te guste.' },
  { n: 1, sentido: 'SABOREAS', emoji: '👅', color: '#f472b6', ejemplos: 'agua · chicle · algo reconfortante', texto: 'Pasa la lengua por tu boca. ¿Qué notas?' },
]

function GroundingAula({ onBack }) {
  const [state, setState] = useState('idle')
  const [idx, setIdx] = useState(0)
  const [malestarPre, setMalestarPre] = useState(5)
  const [malestarPost, setMalestarPost] = useState(5)
  const [showPost, setShowPost] = useState(false)
  const runRef = useRef(false)

  const runGrounding = async () => {
    setState('running'); runRef.current = true
    await speak('Grounding de examen. Dos minutos. Quédate donde estás.')
    for (let i = 0; i < GROUNDING_AULA.length; i++) {
      if (!runRef.current) break
      setIdx(i)
      const g = GROUNDING_AULA[i]
      await speak(`${g.n} cosas que ${g.sentido.toLowerCase()}. ${g.texto}`)
      await new Promise(r => setTimeout(r, 18000))
    }
    if (runRef.current) { setState('done'); setShowPost(true) }
  }

  useEffect(() => () => { runRef.current = false; window.speechSynthesis?.cancel() }, [])

  const g = GROUNDING_AULA[idx]

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-600"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h3 className="font-black text-slate-800">Grounding en el aula</h3>
          <p className="text-slate-500 text-xs">2 minutos · Sin levantarte</p>
        </div>
      </div>

      {state === 'idle' && (
        <div className="space-y-4">
          <SliderMalestar value={malestarPre} onChange={setMalestarPre} label="¿Cómo estás ahora?" />
          <div className="space-y-1">
            {GROUNDING_AULA.map(g => (
              <div key={g.n} className="flex items-center gap-2 text-sm" style={{ color: g.color }}>
                <span>{g.emoji}</span><span className="font-bold">{g.n}</span>
                <span className="text-slate-500">{g.sentido.toLowerCase()}</span>
              </div>
            ))}
          </div>
          <button onClick={runGrounding} className="w-full py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #16a34a, #0d9488)' }}>
            <Volume2 className="w-5 h-5" /> Iniciar grounding guiado
          </button>
        </div>
      )}

      {state === 'running' && (
        <div className="space-y-5">
          <div className="flex justify-center gap-2">
            {GROUNDING_AULA.map((_, i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-full transition-all"
                style={{ background: i < idx ? '#4ade80' : i === idx ? g.color : '#e2e8f0', transform: i === idx ? 'scale(1.5)' : 'scale(1)' }} />
            ))}
          </div>
          <motion.div key={idx} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="text-center rounded-3xl p-6" style={{ background: g.color + '15', border: `2px solid ${g.color}44` }}>
            <span className="text-5xl block mb-3">{g.emoji}</span>
            <p className="font-black text-2xl mb-2" style={{ color: g.color }}>{g.n} {g.sentido}</p>
            <p className="text-slate-700 text-sm leading-relaxed">{g.texto}</p>
            <p className="text-slate-400 text-xs mt-3">Ejemplos: {g.ejemplos}</p>
          </motion.div>
          <button onClick={() => { runRef.current = false; setState('idle'); window.speechSynthesis?.cancel() }}
            className="text-slate-400 text-xs w-full text-center">Detener</button>
        </div>
      )}

      {showPost && (
        <div className="space-y-4">
          <div className="bg-green-50 rounded-2xl p-4 text-center border border-green-100">
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
            <p className="font-black text-green-800">Grounding completado</p>
          </div>
          <SliderMalestar value={malestarPost} onChange={setMalestarPost} label="¿Cómo estás ahora?" />
          {malestarPre - malestarPost > 0 && (
            <p className="text-teal-600 text-sm font-bold text-center">✅ Bajaste {malestarPre - malestarPost} puntos tu malestar</p>
          )}
          <button onClick={onBack} className="w-full py-3 rounded-2xl text-white font-bold"
            style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>Volver al SOS</button>
        </div>
      )}
    </div>
  )
}

// ── TÉCNICA 4A: SACUDIR LA TORMENTA ──────────────────────────────────────
function SacudirTormenta({ onBack }) {
  const [state, setState] = useState('idle')
  const [counter, setCounter] = useState(30)
  const timerRef = useRef(null)

  const SCRIPT_SACUDIR = [
    'Suelta los hombros. Déjalos caer.',
    'Mueve los dedos de las manos, como si sacudieras agua.',
    'Afloja las piernas. Siente los pies en el suelo.',
    'Haz 5 respiraciones profundas mientras sientes cómo la tensión sale por las manos.',
    'Mueve todo lo que puedas sin levantarte. La tensión sale.',
  ]

  const start = async () => {
    setState('running'); setCounter(30)
    for (const t of SCRIPT_SACUDIR) { await speak(t) }
    timerRef.current = setInterval(() => {
      setCounter(prev => { if (prev <= 1) { clearInterval(timerRef.current); setState('done'); return 0 } return prev - 1 })
    }, 1000)
  }

  useEffect(() => () => { clearInterval(timerRef.current); window.speechSynthesis?.cancel() }, [])

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-600"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h3 className="font-black text-slate-800">Sacudir la tormenta</h3>
          <p className="text-slate-500 text-xs">30 segundos · Micro-descarga motriz</p>
        </div>
      </div>

      {state === 'idle' && (
        <div className="space-y-4">
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 space-y-1">
            {['Suelta hombros, piernas y manos', 'Mueve los dedos suavemente', 'Haz 5 respiraciones profundas', '"Saca" la energía a través de las manos'].map((item, i) => (
              <p key={i} className="text-amber-700 text-sm">• {item}</p>
            ))}
          </div>
          <button onClick={start} className="w-full py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #b45309, #d97706)' }}>
            <Volume2 className="w-5 h-5" /> Iniciar (30s)
          </button>
        </div>
      )}

      {state === 'running' && (
        <div className="flex flex-col items-center gap-5">
          <motion.div className="w-36 h-36 rounded-full flex items-center justify-center text-6xl"
            style={{ background: '#fef3c7', border: '3px solid #b45309' }}
            animate={{ rotate: [-3, 3, -3] }} transition={{ duration: 0.3, repeat: Infinity }}>
            🌊
          </motion.div>
          <div className="text-center">
            <p className="font-black text-slate-800 text-xl">Muévete todo lo que puedas</p>
            <p className="text-amber-600 font-black text-3xl mt-1">{counter}s</p>
          </div>
        </div>
      )}

      {state === 'done' && (
        <div className="space-y-4 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
          <p className="font-black text-slate-800 text-lg">¡Tensión liberada!</p>
          <button onClick={onBack} className="w-full py-3 rounded-2xl text-white font-bold"
            style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>Volver al SOS</button>
        </div>
      )}
    </div>
  )
}

// ── TÉCNICA 4B: POSTURA DE CALMA ─────────────────────────────────────────
function PosturaCalma({ onBack }) {
  const [state, setState] = useState('idle')
  const [counter, setCounter] = useState(60)
  const timerRef = useRef(null)

  const start = async () => {
    setState('running'); setCounter(60)
    await speak('Adopta la postura de calma. Pies apoyados en el suelo, cadera erguida, espalda lejos del respaldo, manos sobre la mesa.')
    await speak('Mantén esta postura. Respira lentamente durante un minuto.')
    timerRef.current = setInterval(() => {
      setCounter(prev => { if (prev <= 1) { clearInterval(timerRef.current); setState('done'); return 0 } return prev - 1 })
    }, 1000)
  }

  useEffect(() => () => { clearInterval(timerRef.current); window.speechSynthesis?.cancel() }, [])

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-600"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h3 className="font-black text-slate-800">Postura de calma</h3>
          <p className="text-slate-500 text-xs">1 minuto · Reduce la activación fisiológica</p>
        </div>
      </div>

      {state === 'idle' && (
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100 space-y-3">
            {[{ e: '🦶', t: 'Pies', d: 'Apoyados completamente en el suelo' },
              { e: '🪑', t: 'Cadera', d: 'Erguida, no hundida en la silla' },
              { e: '🔙', t: 'Espalda', d: 'Separada del respaldo, recta' },
              { e: '🤲', t: 'Manos', d: 'Apoyadas y relajadas sobre la mesa' }
            ].map(({ e, t, d }) => (
              <div key={t} className="flex items-center gap-3">
                <span className="text-2xl">{e}</span>
                <div>
                  <p className="font-bold text-blue-800 text-sm">{t}</p>
                  <p className="text-blue-600 text-xs">{d}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-slate-500 text-xs text-center">La postura vertical y abierta reduce la activación fisiológica y mejora la sensación de control.</p>
          <button onClick={start} className="w-full py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #0891b2)' }}>
            <Volume2 className="w-5 h-5" /> Mantener postura 1 min
          </button>
        </div>
      )}

      {state === 'running' && (
        <div className="flex flex-col items-center gap-5">
          <div className="text-8xl">🧍</div>
          <div className="text-center">
            <p className="font-black text-slate-800 text-lg">Mantén la postura</p>
            <p className="text-blue-600 text-sm mt-1">Respira lento y profundo</p>
            <p className="font-black text-4xl text-blue-600 mt-2">{counter}s</p>
          </div>
        </div>
      )}

      {state === 'done' && (
        <div className="space-y-4 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
          <p className="font-black text-slate-800">¡Un minuto en postura de calma!</p>
          <button onClick={onBack} className="w-full py-3 rounded-2xl text-white font-bold"
            style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>Volver al SOS</button>
        </div>
      )}
    </div>
  )
}

// ── TÉCNICA 5: RITUAL 5 MINUTOS ───────────────────────────────────────────
const RITUAL_PASOS = [
  { duracion: 60, titulo: 'Respiración cuadrada', instruccion: 'Inhala 4s · Retén 4s · Exhala 4s · Retén 4s. Repite hasta completar el minuto.', emoji: '⬜', color: '#1d4ed8' },
  { duracion: 120, titulo: 'Mapa corporal + tensión', instruccion: 'Sube hombros a orejas, aguanta 3s, suelta. Aprieta mandíbula, aguanta 3s, suelta. Aprieta puños, aguanta 3s, suelta. Repite 2 veces.', emoji: '💆', color: '#be185d' },
  { duracion: 60, titulo: 'Grounding rápido', instruccion: '5 cosas que ves · 4 que tocas · 3 que oyes · 2 que hueles · 1 que saboreas.', emoji: '🌱', color: '#16a34a' },
  { duracion: 60, titulo: 'Frase de auto-apoyo', instruccion: 'Di en voz baja o mentalmente: "Llevo preparando esto. Solo tengo que empezar. Puedo con ello."', emoji: '💬', color: '#b45309' },
]

const SCRIPT_RITUAL = [
  { idx: 0, texto: 'Ritual de cinco minutos antes del examen. Empezamos con respiración cuadrada.' },
  { idx: 0, texto: 'Inhala cuatro segundos. Retén. Exhala. Retén. Así durante un minuto.' },
  { idx: 1, texto: 'Muy bien. Ahora el mapa corporal. Sube hombros, aguanta tres segundos y suelta.' },
  { idx: 1, texto: 'Aprieta la mandíbula, aguanta, suelta. Aprieta los puños, aguanta, suelta.' },
  { idx: 2, texto: 'Grounding. Cinco cosas que ves. Cuatro que tocas. Tres que oyes. Dos que hueles. Una que saboreas.' },
  { idx: 3, texto: 'Último paso. Tu frase de apoyo. Repite: "Llevo preparando esto. Solo tengo que empezar."' },
  { idx: 3, texto: 'Estás listo. Estás lista. Entra al examen.' },
]

function RitualCincoMinutos({ onBack }) {
  const [state, setState] = useState('idle')
  const [pasoIdx, setPasoIdx] = useState(0)
  const [counter, setCounter] = useState(0)
  const [malestarPre, setMalestarPre] = useState(5)
  const [malestarPost, setMalestarPost] = useState(5)
  const [showPost, setShowPost] = useState(false)
  const runRef = useRef(false)
  const timerRef = useRef(null)

  const start = async () => {
    setState('running'); runRef.current = true
    for (let i = 0; i < RITUAL_PASOS.length; i++) {
      if (!runRef.current) break
      setPasoIdx(i)
      setCounter(RITUAL_PASOS[i].duracion)
      const scripts = SCRIPT_RITUAL.filter(s => s.idx === i)
      for (const s of scripts) { if (!runRef.current) break; await speak(s.texto) }
      await new Promise(r => {
        let c = RITUAL_PASOS[i].duracion
        timerRef.current = setInterval(() => {
          c -= 1; setCounter(c)
          if (c <= 0) { clearInterval(timerRef.current); r() }
        }, 1000)
      })
    }
    if (runRef.current) { setState('done'); setShowPost(true) }
  }

  useEffect(() => () => { runRef.current = false; clearInterval(timerRef.current); window.speechSynthesis?.cancel() }, [])

  const paso = RITUAL_PASOS[pasoIdx]

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-600"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h3 className="font-black text-slate-800">Ritual 5 minutos antes</h3>
          <p className="text-slate-500 text-xs">Ruta automática con voz guiada</p>
        </div>
      </div>

      {state === 'idle' && (
        <div className="space-y-4">
          <SliderMalestar value={malestarPre} onChange={setMalestarPre} label="¿Cómo estás antes?" />
          <div className="space-y-2">
            {RITUAL_PASOS.map((p, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100">
                <span className="text-2xl">{p.emoji}</span>
                <div className="flex-1">
                  <p className="font-bold text-slate-700 text-sm">{p.titulo}</p>
                  <p className="text-slate-400 text-xs">{p.duracion / 60} min</p>
                </div>
              </div>
            ))}
          </div>
          <button onClick={start} className="w-full py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #dc2626, #b45309)' }}>
            <Volume2 className="w-5 h-5" /> 🚨 Activar SOS 5 minutos
          </button>
        </div>
      )}

      {state === 'running' && (
        <div className="space-y-5">
          <div className="flex gap-1.5">
            {RITUAL_PASOS.map((_, i) => (
              <div key={i} className="flex-1 h-2 rounded-full transition-all"
                style={{ background: i < pasoIdx ? '#4ade80' : i === pasoIdx ? paso.color : '#e2e8f0' }} />
            ))}
          </div>
          <motion.div key={pasoIdx} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-6 text-center" style={{ background: paso.color + '15', border: `2px solid ${paso.color}44` }}>
            <span className="text-5xl block mb-3">{paso.emoji}</span>
            <p className="font-black text-xl mb-2" style={{ color: paso.color }}>{paso.titulo}</p>
            <p className="text-slate-700 text-sm leading-relaxed mb-4">{paso.instruccion}</p>
            <div className="w-20 h-20 rounded-full border-4 flex items-center justify-center mx-auto"
              style={{ borderColor: paso.color }}>
              <p className="font-black text-2xl" style={{ color: paso.color }}>{counter}s</p>
            </div>
          </motion.div>
          <button onClick={() => { runRef.current = false; clearInterval(timerRef.current); setState('idle'); window.speechSynthesis?.cancel() }}
            className="text-slate-400 text-xs w-full text-center">Detener ritual</button>
        </div>
      )}

      {showPost && (
        <div className="space-y-4">
          <div className="bg-green-50 rounded-2xl p-4 text-center border border-green-100">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <p className="font-black text-green-800 text-lg">¡Ritual completado!</p>
            <p className="text-green-600 text-sm">Estás preparado/a. Entra al examen.</p>
          </div>
          <SliderMalestar value={malestarPost} onChange={setMalestarPost} label="¿Cómo estás ahora?" />
          {malestarPre - malestarPost > 0 && (
            <p className="text-teal-600 text-sm font-bold text-center">✅ Bajaste {malestarPre - malestarPost} puntos tu malestar</p>
          )}
          <button onClick={onBack} className="w-full py-3 rounded-2xl text-white font-bold"
            style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>Volver al SOS</button>
        </div>
      )}
    </div>
  )
}

// ── TÉCNICA 6: REGISTRO SÍNTOMAS ──────────────────────────────────────────
const SINTOMAS_FISICOS = ['Corazón acelerado', 'Manos frías/sudorosas', 'Nudo en el estómago', 'Tensión muscular', 'Dificultad para respirar', 'Dolor de cabeza', 'Sequedad en la boca']

function RegistroSintomas({ onBack }) {
  const [fase, setFase] = useState('pre') // pre | post
  const [sintomasPre, setSintomasPre] = useState([])
  const [sintomasPost, setSintomasPost] = useState([])
  const [malestarPre, setMalestarPre] = useState(5)
  const [malestarPost, setMalestarPost] = useState(5)
  const [saved, setSaved] = useState(false)

  const toggleSintoma = (lista, setLista, s) => setLista(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const guardar = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('evaluaciones_sesion').insert({
          user_id: user.id, ejercicio_id: 'registro_sintomas', ejercicio_nombre: 'Registro síntomas SOS',
          malestar_pre: malestarPre, malestar_post: malestarPost, ha_ayudado: malestarPre - malestarPost >= 2 ? 'si' : malestarPre - malestarPost >= 0 ? 'algo' : 'no'
        })
      }
      setSaved(true)
    } catch { setSaved(true) }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-600"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h3 className="font-black text-slate-800">Registro de síntomas</h3>
          <p className="text-slate-500 text-xs">Observa tu evolución</p>
        </div>
      </div>

      {!saved ? (
        <>
          {fase === 'pre' ? (
            <div className="space-y-4">
              <p className="font-bold text-slate-700">Antes de practicar:</p>
              <SliderMalestar value={malestarPre} onChange={setMalestarPre} label="Malestar fisiológico" />
              <p className="text-sm text-slate-600">¿Qué siento en el cuerpo ahora?</p>
              <div className="flex flex-wrap gap-2">
                {SINTOMAS_FISICOS.map(s => (
                  <button key={s} onClick={() => toggleSintoma(sintomasPre, setSintomasPre, s)}
                    className="px-3 py-1.5 rounded-xl text-sm border-2 transition-all"
                    style={{ background: sintomasPre.includes(s) ? '#fee2e2' : 'white', borderColor: sintomasPre.includes(s) ? '#dc2626' : '#e2e8f0', color: sintomasPre.includes(s) ? '#dc2626' : '#64748b' }}>
                    {s}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400">Ahora practica alguna técnica del SOS y vuelve aquí.</p>
              <button onClick={() => setFase('post')} className="w-full py-3 rounded-2xl text-white font-bold"
                style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}>
                Ya practiqué → Registrar después
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="font-bold text-slate-700">Después de practicar:</p>
              <SliderMalestar value={malestarPost} onChange={setMalestarPost} label="Malestar fisiológico ahora" />
              <p className="text-sm text-slate-600">¿Qué siento ahora?</p>
              <div className="flex flex-wrap gap-2">
                {SINTOMAS_FISICOS.map(s => (
                  <button key={s} onClick={() => toggleSintoma(sintomasPost, setSintomasPost, s)}
                    className="px-3 py-1.5 rounded-xl text-sm border-2 transition-all"
                    style={{ background: sintomasPost.includes(s) ? '#dcfce7' : 'white', borderColor: sintomasPost.includes(s) ? '#16a34a' : '#e2e8f0', color: sintomasPost.includes(s) ? '#16a34a' : '#64748b' }}>
                    {s}
                  </button>
                ))}
              </div>
              {malestarPre - malestarPost > 0 && (
                <div className="bg-green-50 rounded-2xl p-3 border border-green-100">
                  <p className="text-green-700 font-bold text-sm">✅ Tu malestar bajó {malestarPre - malestarPost} puntos</p>
                  <p className="text-green-600 text-xs">Síntomas antes: {sintomasPre.length} · Ahora: {sintomasPost.length}</p>
                </div>
              )}
              <button onClick={guardar} className="w-full py-3 rounded-2xl text-white font-bold flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>
                <CheckCircle className="w-4 h-4" /> Guardar registro
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
          <p className="font-black text-slate-800">Registro guardado</p>
          <p className="text-slate-500 text-sm">Tu psicólogo podrá ver tu evolución en el panel de admin.</p>
          <button onClick={onBack} className="w-full py-3 rounded-2xl text-white font-bold"
            style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>Volver al SOS</button>
        </div>
      )}
    </div>
  )
}

// ── ÍNDICE PRINCIPAL ───────────────────────────────────────────────────────
const TECNICAS = [
  {
    id: 'resp_cuadrada', grupo: '🌬️ Respiración', nombre: 'Respiración cuadrada 4-4-4-4',
    desc: 'Reduce el ritmo cardíaco en 3-4 ciclos', emoji: '⬜', duracion: '2 min',
    color: '#1d4ed8', bg: '#dbeafe', component: RespiracionCuadrada
  },
  {
    id: 'resp_diafragm', grupo: '🌬️ Respiración', nombre: 'Respiración diafragmática',
    desc: 'Siente tu barriga · inhala 4s, exhala 6s', emoji: '🫁', duracion: '2 min',
    color: '#0f6b6b', bg: '#ccfbf1', component: RespiracionDiafragmatica
  },
  {
    id: 'mapa_corporal', grupo: '🔍 Escaneo corporal', nombre: 'Mapa corporal',
    desc: '¿Dónde sientes tensión? Técnicas para cada zona', emoji: '🗺️', duracion: '2 min',
    color: '#dc2626', bg: '#fee2e2', component: MapaCorporal
  },
  {
    id: 'micro_relajacion', grupo: '🔍 Escaneo corporal', nombre: 'Micro-relajación muscular',
    desc: 'Jacobson en 40 segundos', emoji: '💆', duracion: '40 seg',
    color: '#be185d', bg: '#fce7f3', component: MicroRelajacion
  },
  {
    id: 'grounding_aula', grupo: '🌱 Grounding', nombre: 'Grounding en el aula',
    desc: '5-4-3-2-1 para usar sin levantarte', emoji: '🌱', duracion: '2 min',
    color: '#16a34a', bg: '#dcfce7', component: GroundingAula
  },
  {
    id: 'sacudir', grupo: '⚡ Activación motora', nombre: 'Sacudir la tormenta',
    desc: 'Micro-descarga de tensión en 30 segundos', emoji: '🌊', duracion: '30 seg',
    color: '#b45309', bg: '#fef3c7', component: SacudirTormenta
  },
  {
    id: 'postura', grupo: '⚡ Activación motora', nombre: 'Postura de calma',
    desc: 'Postura vertical + respiración 1 minuto', emoji: '🧍', duracion: '1 min',
    color: '#0891b2', bg: '#cffafe', component: PosturaCalma
  },
  {
    id: 'ritual', grupo: '🚨 Ritual completo', nombre: 'Ritual 5 min antes del examen',
    desc: 'Ruta automática guiada por voz', emoji: '⏱️', duracion: '5 min',
    color: '#dc2626', bg: '#fee2e2', component: RitualCincoMinutos
  },
  {
    id: 'registro', grupo: '📊 Auto-observación', nombre: 'Registro de síntomas',
    desc: 'Mide tu malestar antes/después', emoji: '📋', duracion: 'Variable',
    color: '#7c3aed', bg: '#ede9fe', component: RegistroSintomas
  },
]

const GRUPOS = [...new Set(TECNICAS.map(t => t.grupo))]

export default function SOSExamen() {
  const [tecnicaActiva, setTecnicaActiva] = useState(null)
  const navigate = useNavigate()

  if (tecnicaActiva !== null) {
    const tecnica = TECNICAS[tecnicaActiva]
    const Comp = tecnica.component
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <Comp onBack={() => setTecnicaActiva(null)} />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="rounded-3xl p-5 mb-6 text-white"
        style={{ background: 'linear-gradient(135deg, #7f1d1d, #dc2626)' }}>
        <div className="flex items-center gap-3 mb-2">
          <img src="https://zbusdixrxedfhbkquafh.supabase.co/storage/v1/object/public/logo/WhatsApp%20Image%202026-04-06%20at%2015.58.04.jpeg"
            alt="Resetea" className="w-10 h-10 rounded-full object-cover border-2 border-white/30 flex-shrink-0" />
          <div>
            <h1 className="text-2xl font-black">SOS Examen</h1>
            <p className="text-red-200 text-sm">Técnicas de emergencia para antes y durante el examen</p>
          </div>
        </div>
        <p className="text-red-100 text-xs mt-2">9 técnicas · Con voz guiada · Sin levantarte</p>
      </div>

      {/* Técnica recomendada: ritual */}
      <div className="mb-5">
        <p className="text-xs font-black text-slate-400 tracking-widest mb-2">⭐ RECOMENDADO AHORA</p>
        <button onClick={() => setTecnicaActiva(TECNICAS.findIndex(t => t.id === 'ritual'))}
          className="w-full rounded-2xl p-5 text-left shadow-md hover:shadow-lg transition-all"
          style={{ background: 'linear-gradient(135deg, #dc2626, #b45309)' }}>
          <div className="flex items-center gap-4">
            <span className="text-4xl">⏱️</span>
            <div className="flex-1">
              <p className="text-white font-black text-lg">Ritual 5 min antes del examen</p>
              <p className="text-white/70 text-sm">Respiración · Relajación · Grounding · Frase de apoyo</p>
              <p className="text-white/50 text-xs mt-1">Ruta automática con voz guiada</p>
            </div>
            <ChevronRight className="w-5 h-5 text-white" />
          </div>
        </button>
      </div>

      {/* Grupos de técnicas */}
      {GRUPOS.map(grupo => (
        <div key={grupo} className="mb-5">
          <p className="text-xs font-black text-slate-400 tracking-widest mb-2">{grupo.toUpperCase()}</p>
          <div className="space-y-2">
            {TECNICAS.filter(t => t.grupo === grupo && t.id !== 'ritual').map((tecnica, i) => {
              const idx = TECNICAS.findIndex(t => t.id === tecnica.id)
              return (
                <motion.button key={tecnica.id} onClick={() => setTecnicaActiva(idx)}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="w-full bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all border border-slate-100 text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: tecnica.bg }}>
                      {tecnica.emoji}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-800 text-sm">{tecnica.nombre}</p>
                      <p className="text-xs text-slate-500">{tecnica.desc}</p>
                      <p className="text-xs font-bold mt-0.5" style={{ color: tecnica.color }}>⏱ {tecnica.duracion}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
