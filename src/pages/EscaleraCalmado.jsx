import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/api/supabaseClient'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Play, Volume2, VolumeX, CheckCircle } from 'lucide-react'

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
          body: JSON.stringify({
            text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: { stability: 0.85, similarity_boost: 0.85, style: 0.15, use_speaker_boost: true }
          })
        })
        if (!res.ok) throw new Error('ElevenLabs error')
        audioCache[key] = URL.createObjectURL(await res.blob())
      }
      return new Promise((resolve) => {
        const audio = new Audio(audioCache[key])
        audio.volume = 0.95
        audio.onended = resolve
        audio.play()
      })
    } catch (e) { console.error('TTS:', e) }
  }
  // Fallback navegador
  return new Promise((resolve) => {
    if (!window.speechSynthesis) { resolve(); return }
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'es-ES'; u.rate = 0.72; u.pitch = 1.05; u.volume = 1.0
    u.onend = resolve
    const voices = window.speechSynthesis.getVoices()
    const fem = voices.find(v => v.lang === 'es-ES') || voices.find(v => v.lang.startsWith('es'))
    if (fem) u.voice = fem
    window.speechSynthesis.speak(u)
  })
}

// Guion de audio
const SCRIPT = [
  { texto: 'Hola, bienvenido a esta pausa de calmado. Puedes estar sentado o de pie, con los pies apoyados en el suelo. Si quieres, cierra los ojos o simplemente baja un poco la mirada.', escalon: null, fase: 'intro', duracion: 7000 },
  { texto: 'Vamos a bajar juntos por una escalera de calma, escalón a escalón. Cada vez que sueltes la respiración, imagina que bajas un escalón hacia abajo.', escalon: null, fase: 'intro', duracion: 7000 },
  { texto: 'Primero, lleva tu atención a la respiración. Inspira lentamente por la nariz, contando interiormente... uno, dos, tres, cuatro.', escalon: 5, fase: 'respiracion', duracion: 6000 },
  { texto: 'Mantén un segundo... Y ahora suelta el aire por la boca... uno... dos... tres... cuatro... cinco... seis.', escalon: 5, fase: 'exhala', duracion: 7000 },
  { texto: 'Bajas un escalón. Bien.', escalon: 4, fase: 'bajando', duracion: 3000 },
  { texto: 'Inspira por la nariz... uno... dos... tres... cuatro.', escalon: 4, fase: 'respiracion', duracion: 5000 },
  { texto: 'Mantén... Y suelta... uno... dos... tres... cuatro... cinco... seis.', escalon: 4, fase: 'exhala', duracion: 7000 },
  { texto: 'Bajas otro escalón.', escalon: 3, fase: 'bajando', duracion: 3000 },
  { texto: 'Inspira por la nariz... uno... dos... tres... cuatro.', escalon: 3, fase: 'respiracion', duracion: 5000 },
  { texto: 'Mantén... Y suelta... uno... dos... tres... cuatro... cinco... seis.', escalon: 3, fase: 'exhala', duracion: 7000 },
  { texto: 'Ya estás en un escalón más bajo, más tranquilo.', escalon: 2, fase: 'bajando', duracion: 4000 },
  { texto: 'Ahora, fíjate en tu cuerpo. Si sientes que tus hombros están tensos, levántalos un poco hacia las orejas, mantén un segundo... Y déjalos caer.', escalon: 2, fase: 'cuerpo', duracion: 8000 },
  { texto: 'Siente que la espalda se apoya. Cada vez que sueltes el aire, imagina que tu cuerpo se vuelve más suave.', escalon: 2, fase: 'cuerpo', duracion: 6000 },
  { texto: 'Para terminar, una frase corta de calma. Repite en silencio: "Ahora estoy a salvo". "Respiro y estoy aquí". "Esto también pasará".', escalon: 1, fase: 'frase', duracion: 9000 },
  { texto: 'Cuando estés listo, abre los ojos lentamente, mira tu entorno y dite en voz baja: "Estoy aquí, en este lugar, respirando".', escalon: 1, fase: 'cierre', duracion: 7000 },
  { texto: 'Termina esta pausa cuando quieras, llevando contigo esta sensación de calma más cercana.', escalon: 0, fase: 'fin', duracion: 6000 },
]

const FASES_COLOR = {
  intro: '#5eead4',
  respiracion: '#60a5fa',
  exhala: '#34d399',
  bajando: '#a78bfa',
  cuerpo: '#f472b6',
  frase: '#fbbf24',
  cierre: '#5eead4',
  fin: '#4ade80',
}

const FASES_LABEL = {
  intro: 'Prepárate',
  respiracion: 'INHALA',
  exhala: 'EXHALA',
  bajando: 'Bajando...',
  cuerpo: 'Siente tu cuerpo',
  frase: 'Frase de calma',
  cierre: 'Cierre',
  fin: '✓ Completado',
}

// Componente visual escalera
function EscaleraVisual({ escalonActual }) {
  const escalones = [5, 4, 3, 2, 1, 0]
  return (
    <div className="flex flex-col items-end gap-0 w-full max-w-xs mx-auto">
      {escalones.map((n, i) => {
        const isActivo = escalonActual === n
        const isPasado = escalonActual !== null && escalonActual < n
        const width = 40 + i * 12 // escalones más anchos abajo
        return (
          <motion.div
            key={n}
            className="relative flex items-center justify-end"
            style={{ width: '100%' }}
          >
            <motion.div
              className="rounded-l-xl flex items-center justify-between px-3 py-2"
              style={{
                width: `${width}%`,
                background: isActivo
                  ? 'rgba(94,234,212,0.3)'
                  : isPasado
                  ? 'rgba(255,255,255,0.05)'
                  : 'rgba(255,255,255,0.08)',
                border: isActivo
                  ? '2px solid #5eead4'
                  : isPasado
                  ? '1px solid rgba(255,255,255,0.05)'
                  : '1px solid rgba(255,255,255,0.12)',
                transition: 'all 0.5s ease',
                minHeight: '40px',
              }}
              animate={isActivo ? { scale: [1, 1.02, 1] } : { scale: 1 }}
              transition={{ duration: 1.5, repeat: isActivo ? Infinity : 0 }}
            >
              {n > 0 && (
                <span className="text-white/40 text-xs font-bold">Nivel {n}</span>
              )}
              {n === 0 && (
                <span className="text-green-400 text-xs font-bold">✓ CALMA</span>
              )}
              {isActivo && (
                <motion.div
                  className="w-3 h-3 rounded-full"
                  style={{ background: '#5eead4' }}
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
              {isPasado && (
                <span className="text-green-400 text-xs">✓</span>
              )}
            </motion.div>
          </motion.div>
        )
      })}
    </div>
  )
}

export default function EscaleraCalmado() {
  const [state, setState] = useState('idle') // idle | running | done
  const [scriptIdx, setScriptIdx] = useState(0)
  const [escalonActual, setEscalonActual] = useState(5)
  const [faseActual, setFaseActual] = useState('intro')
  const [textoActual, setTextoActual] = useState('')
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [evalFase, setEvalFase] = useState('pre')
  const [malestarPre, setMalestarPre] = useState(null)
  const startRef = useRef(null)
  const runningRef = useRef(false)
  const navigate = useNavigate()

  const runScript = async () => {
    runningRef.current = true
    startRef.current = Date.now()

    for (let i = 0; i < SCRIPT.length; i++) {
      if (!runningRef.current) break
      const step = SCRIPT[i]
      setScriptIdx(i)
      setTextoActual(step.texto)
      if (step.escalon !== null) setEscalonActual(step.escalon)
      setFaseActual(step.fase)

      if (audioEnabled) {
        await speak(step.texto)
      } else {
        await new Promise(r => setTimeout(r, step.duracion))
      }

      if (!runningRef.current) break
    }

    if (runningRef.current) {
      setState('done')
    }
  }

  const handleStart = () => {
    setState('running')
    setEscalonActual(5)
    setFaseActual('intro')
    runScript()
  }

  const handleStop = () => {
    runningRef.current = false
    window.speechSynthesis?.cancel()
    setState('idle')
    setScriptIdx(0)
    setEscalonActual(5)
    setTextoActual('')
  }

  const saveSession = async () => {
    if (saving || saved) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const duracion = startRef.current ? Math.round((Date.now() - startRef.current) / 1000) : 180
      await supabase.from('sesiones_tecnicas').insert({
        user_id: user.id,
        tecnica_id: 'escalera_calmado',
        tecnica_nombre: 'Escalera de calmado',
        duracion_segundos: duracion,
        created_at: new Date().toISOString()
      })
      setSaved(true)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  useEffect(() => () => { runningRef.current = false; window.speechSynthesis?.cancel() }, [])

  const color = FASES_COLOR[faseActual] || '#5eead4'

  // PANTALLA INICIO
  if (state === 'idle') {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-teal-600 font-medium mb-6">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-xl">
            🪜
          </div>
          <div>
            <h1 className="text-xl font-black" style={{ color: '#0d3d3d' }}>Escalera de calmado</h1>
            <p className="text-slate-500 text-sm">2-3 minutos · Voz guiada</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6">
          <p className="font-bold text-slate-800 mb-3">¿Qué es?</p>
          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            Una técnica guiada de respiración y consciencia corporal para bajar la intensidad emocional paso a paso, como descender por una escalera hacia la calma.
          </p>
          <div className="space-y-2 text-sm text-slate-500">
            <div className="flex items-center gap-2">🔴 <span>Nivel 5 → Toma de consciencia</span></div>
            <div className="flex items-center gap-2">🟠 <span>Nivel 4 → Respiración guiada</span></div>
            <div className="flex items-center gap-2">🟡 <span>Nivel 3 → Relajación corporal</span></div>
            <div className="flex items-center gap-2">🟢 <span>Nivel 2 → Frase de anclaje</span></div>
            <div className="flex items-center gap-2">🔵 <span>Nivel 1 → Calma conseguida</span></div>
          </div>
        </div>

        {/* Toggle audio */}
        <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-4">
          <div className="flex items-center gap-3">
            {audioEnabled ? <Volume2 className="w-5 h-5 text-teal-600" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
            <div>
              <p className="font-medium text-slate-800 text-sm">Voz guiada</p>
              <p className="text-xs text-slate-400">{audioEnabled ? 'Activada' : 'Desactivada'}</p>
            </div>
          </div>
          <button onClick={() => setAudioEnabled(!audioEnabled)}
            className={`w-12 h-6 rounded-full transition-all ${audioEnabled ? 'bg-teal-500' : 'bg-slate-200'}`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-all ${audioEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {evalFase === 'pre' ? (
          <EvaluacionPrePost
            ejercicioId="escalera_calmado"
            ejercicioNombre="Escalera de calmado"
            modo="pre"
            onComplete={({ malestarPre: mp }) => { setMalestarPre(mp); setEvalFase('opciones') }}
            onSkip={() => setEvalFase('opciones')}
          />
        ) : (
          <div className="flex flex-col gap-3">
            <button onClick={() => { setAudioEnabled(true); handleStart(); setEvalFase('ejercicio') }}
              className="w-full py-4 rounded-2xl text-white font-bold text-lg shadow-lg flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #0f6b6b)' }}>
              <Volume2 className="w-5 h-5" /> 🎙️ Iniciar con voz guiada
            </button>
            <button onClick={() => { setAudioEnabled(false); handleStart(); setEvalFase('ejercicio') }}
              className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(15,107,107,0.3)', color: '#0f6b6b' }}>
              <Play className="w-4 h-4" /> Iniciar sin voz
            </button>
          </div>
        )}
      </div>
    )
  }

  // PANTALLA FIN
  if (state === 'done') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6"
        style={{ background: 'linear-gradient(135deg, #0d3d3d, #1e3a8a)' }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center flex flex-col items-center gap-4 max-w-sm">
          <CheckCircle className="w-16 h-16 text-green-400" />
          <p className="text-white text-2xl font-black">Escalera completada 🌿</p>
          <p className="text-white/60 text-sm leading-relaxed">
            Has bajado todos los escalones. Tómate un momento para notar esta sensación de calma.
          </p>
          <div className="flex flex-col gap-3 w-full mt-2">
            <button onClick={async () => { await saveSession(); navigate(-1) }}
              disabled={saving}
              className="w-full py-3 rounded-2xl text-white font-bold"
              style={{ background: saved ? 'rgba(74,222,128,0.25)' : 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
              {saving ? 'Guardando...' : saved ? '✓ Guardado' : '💾 Guardar y cerrar'}
            </button>
            <button onClick={() => { setState('idle'); setScriptIdx(0); setEscalonActual(5) }}
              className="text-white/30 text-xs hover:text-white/50">
              Repetir
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // PANTALLA EJERCICIO EN CURSO
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #0d3d3d 0%, #1e3a8a 100%)' }}>

      <button onClick={handleStop} className="absolute top-6 left-6 text-white/30 hover:text-white/60">
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Fase actual */}
      <motion.div key={faseActual} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="mb-6 text-center">
        <span className="text-xs font-black tracking-widest px-3 py-1 rounded-full"
          style={{ color, border: `1px solid ${color}44`, background: `${color}15` }}>
          {FASES_LABEL[faseActual]}
        </span>
      </motion.div>

      {/* Escalera visual */}
      <div className="w-full max-w-xs mb-8">
        <EscaleraVisual escalonActual={escalonActual} />
      </div>

      {/* Texto guía */}
      <AnimatePresence mode="wait">
        <motion.div key={scriptIdx}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
          className="text-center max-w-sm px-2">
          <p className="text-white/80 text-base leading-relaxed italic">
            "{textoActual}"
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Indicador respiración */}
      {(faseActual === 'respiracion' || faseActual === 'exhala') && (
        <motion.div className="mt-8 flex flex-col items-center gap-2">
          <motion.div
            className="w-20 h-20 rounded-full border-4 flex items-center justify-center"
            style={{ borderColor: color }}
            animate={faseActual === 'respiracion'
              ? { scale: [1, 1.4], borderColor: color }
              : { scale: [1.4, 1], borderColor: '#34d399' }}
            transition={{ duration: faseActual === 'respiracion' ? 4 : 6, ease: 'easeInOut' }}
          >
            <span className="text-white font-black text-sm">
              {faseActual === 'respiracion' ? '↑' : '↓'}
            </span>
          </motion.div>
          <p className="text-white/40 text-xs tracking-widest">
            {faseActual === 'respiracion' ? 'INHALA' : 'EXHALA'}
          </p>
        </motion.div>
      )}

      <button onClick={handleStop} className="mt-10 text-white/20 text-xs hover:text-white/40">
        Detener
      </button>
    </div>
  )
}
