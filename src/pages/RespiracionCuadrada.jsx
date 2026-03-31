import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/api/supabaseClient'
import { useNavigate } from 'react-router-dom'

const PHASE_DURATION = 4000
const PAUSE_DURATION = 4000
const TOTAL_CYCLES = 4

const PHASES = [
  { id: 'inhala',  color: '#60a5fa', glow: '#3b82f680', scale: 1.5  },
  { id: 'reten1', color: '#a78bfa', glow: '#8b5cf680', scale: 1.5  },
  { id: 'exhala', color: '#34d399', glow: '#10b98180', scale: 0.6  },
  { id: 'reten2', color: '#60a5fa', glow: '#3b82f640', scale: 0.6  },
]

const PHASE_LABELS    = ['INHALA', 'RETÉN', 'EXHALA', 'PAUSA']
const PHASE_SUBTITLES = ['por la nariz', 'el aire', 'por la boca', 'y descansa']

const VOICE_ID   = 'RgXx32WYOGrd7gFNifSf'
const XI_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY
const audioCache = {}

function speakNow(text) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'es-ES'; u.rate = 0.78; u.pitch = 1.1; u.volume = 1.0
  // Intentar voz femenina española
  const loadVoice = () => {
    const voices = window.speechSynthesis.getVoices()
    const fem = voices.find(v => v.lang === 'es-ES' && /female|mujer|mónica|lucia|elena|paulina/i.test(v.name))
      || voices.find(v => v.lang.startsWith('es'))
    if (fem) u.voice = fem
    window.speechSynthesis.speak(u)
  }
  if (window.speechSynthesis.getVoices().length > 0) {
    loadVoice()
  } else {
    window.speechSynthesis.onvoiceschanged = loadVoice
  }
}

async function speak(text) {
  if (XI_API_KEY) {
    const key = `${VOICE_ID}_${text}`
    try {
      if (!audioCache[key]) {
        const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
          method: 'POST',
          headers: { 'xi-api-key': XI_API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: { stability: 0.8, similarity_boost: 0.85, style: 0.2, use_speaker_boost: true }
          })
        })
        if (!res.ok) throw new Error('ElevenLabs error')
        audioCache[key] = URL.createObjectURL(await res.blob())
      }
      const audio = new Audio(audioCache[key])
      audio.volume = 0.95
      await audio.play()
      return
    } catch (e) {
      console.error('TTS error, usando navegador:', e)
    }
  }
  speakNow(text)
}

function buildScript() {
  const CYCLE_DUR = PHASES.length * PHASE_DURATION
  const INTRO = 8000
  const script = []

  script.push({ text: 'Siéntate cómodo y cierra los ojos.', delay: 0 })
  script.push({ text: 'Exhala todo el aire. Vamos a empezar.', delay: 3500 })

  for (let c = 0; c < TOTAL_CYCLES; c++) {
    const cs = INTRO + c * (CYCLE_DUR + PAUSE_DURATION)
    script.push({ text: 'Inhala por la nariz.', delay: cs })
    script.push({ text: 'Retén el aire.', delay: cs + PHASE_DURATION })
    script.push({ text: 'Exhala lentamente por la boca.', delay: cs + PHASE_DURATION * 2 })
    script.push({ text: 'Pausa. Relájate.', delay: cs + PHASE_DURATION * 3 })
    if (c < TOTAL_CYCLES - 1) {
      script.push({ text: `Muy bien. Ciclo ${c + 1} completado.`, delay: cs + CYCLE_DUR + 500 })
    }
  }

  const end = INTRO + TOTAL_CYCLES * (CYCLE_DUR + PAUSE_DURATION)
  script.push({ text: 'Perfecto. Vuelve a tu respiración natural.', delay: end })
  script.push({ text: '¡Lo has hecho genial! Abre los ojos cuando quieras.', delay: end + 4000 })

  return script.sort((a, b) => a.delay - b.delay)
}

export default function RespiracionCuadrada() {
  const [state, setState]       = useState('idle')
  const [cycle, setCycle]       = useState(0)
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [counter, setCounter]   = useState(4)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const startRef  = useRef(null)
  const timersRef = useRef([])
  const rafRef    = useRef(null)
  const navigate  = useNavigate()

  const CYCLE_DUR = PHASES.length * PHASE_DURATION
  const INTRO = 8000

  const clearAll = () => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    window.speechSynthesis?.cancel()
  }

  const tick = useCallback(() => {
    if (!startRef.current) return
    const elapsed = Date.now() - startRef.current
    if (elapsed < INTRO) {
      setPhaseIdx(0); setCycle(0); setIsPaused(false); setCounter(4)
      rafRef.current = requestAnimationFrame(tick)
      return
    }
    const afterIntro = elapsed - INTRO
    const blockDur = CYCLE_DUR + PAUSE_DURATION
    const block = Math.floor(afterIntro / blockDur)
    const timeInBlock = afterIntro % blockDur
    if (block >= TOTAL_CYCLES) { setState('done'); return }
    if (timeInBlock >= CYCLE_DUR) {
      setIsPaused(true); setCounter(0)
    } else {
      setIsPaused(false)
      const ph = Math.floor(timeInBlock / PHASE_DURATION)
      const remaining = Math.ceil((PHASE_DURATION - (timeInBlock % PHASE_DURATION)) / 1000)
      setCycle(block); setPhaseIdx(ph); setCounter(remaining)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const start = () => {
    clearAll()
    setState('running')
    setCycle(0); setPhaseIdx(0); setIsPaused(false); setCounter(4); setSaved(false)
    startRef.current = Date.now()
    buildScript().forEach(({ text, delay }) => {
      timersRef.current.push(setTimeout(() => speak(text), delay))
    })
    const total = INTRO + TOTAL_CYCLES * (CYCLE_DUR + PAUSE_DURATION) + 10000
    timersRef.current.push(setTimeout(() => setState('done'), total))
    rafRef.current = requestAnimationFrame(tick)
  }

  const reset = () => {
    clearAll(); setState('idle'); setCycle(0); setPhaseIdx(0); setIsPaused(false); setCounter(4)
  }

  const saveSession = async () => {
    if (saving || saved) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const duracion = startRef.current ? Math.round((Date.now() - startRef.current) / 1000) : 120
      await supabase.from('sesiones_respiracion').insert({
        user_id: user.id,
        ejercicio_id: 'box',
        ejercicio_nombre: 'Respiración Cuadrada',
        duracion_segundos: duracion,
        ciclos_completados: TOTAL_CYCLES,
        created_at: new Date().toISOString()
      })
      setSaved(true)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  useEffect(() => () => clearAll(), [])

  const phase = PHASES[phaseIdx] || PHASES[0]
  const isPulse = phaseIdx === 1 || phaseIdx === 3
  const isExpand = phaseIdx === 0

  return (
    <div className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at center, #0d1b3e 0%, #050d1f 100%)' }}>

      {/* Botón volver */}
      {state === 'idle' && (
        <button onClick={() => navigate('/respiracion')}
          className="absolute top-6 left-6 text-white/40 hover:text-white text-sm">← Volver</button>
      )}

      {/* Halo */}
      <div className="relative flex items-center justify-center" style={{ width: '85vmin', height: '85vmin' }}>
        <AnimatePresence mode="wait">
          <motion.div key={`halo-${phaseIdx}-${cycle}`}
            className="absolute rounded-full"
            style={{ width: '85vmin', height: '85vmin' }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: state === 'running' && !isPaused ? (isPulse ? [0.3, 0.8, 0.3] : 0.4) : 0.15,
              background: `radial-gradient(circle, ${phase.glow} 0%, transparent 70%)`
            }}
            transition={isPulse ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.5 }}
          />
        </AnimatePresence>

        {/* Círculo principal */}
        <motion.div
          className="rounded-full flex items-center justify-center"
          style={{
            width: '42vmin', height: '42vmin',
            background: `radial-gradient(circle at 35% 35%, ${phase.color}cc, ${phase.color}55)`,
            boxShadow: `0 0 80px ${phase.glow}`,
          }}
          animate={state === 'running' && !isPaused
            ? isPulse
              ? { scale: [phase.scale, phase.scale * 1.07, phase.scale], boxShadow: [`0 0 60px ${phase.glow}`, `0 0 120px ${phase.color}aa`, `0 0 60px ${phase.glow}`] }
              : { scale: phase.scale }
            : { scale: 0.85 }}
          transition={isPulse
            ? { duration: 1.3, repeat: Infinity, ease: 'easeInOut' }
            : { duration: PHASE_DURATION / 1000, ease: isExpand ? 'easeOut' : 'easeIn' }}
        />
      </div>

      {/* Label fase */}
      <div className="mt-6 h-16 flex flex-col items-center justify-center">
        {state === 'running' && !isPaused && (
          <AnimatePresence mode="wait">
            <motion.div key={`label-${phaseIdx}-${cycle}`}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="flex flex-col items-center">
              <span className="font-black tracking-widest text-2xl" style={{ color: phase.color }}>
                {PHASE_LABELS[phaseIdx]}
              </span>
              <span className="text-white/40 text-xs mt-0.5">{PHASE_SUBTITLES[phaseIdx]}</span>
              <span className="text-white/50 font-black mt-1">{counter}s</span>
            </motion.div>
          </AnimatePresence>
        )}
        {state === 'running' && isPaused && (
          <p className="text-white/30 text-xs tracking-widest">Ciclo {cycle + 1} completado</p>
        )}
      </div>

      {/* Controles */}
      <div className="mt-4 flex flex-col items-center gap-4 px-6 max-w-sm text-center">
        {state === 'idle' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <p className="text-white/80 font-bold text-lg">Respiración Cuadrada</p>
            <p className="text-white/40 text-sm">4 ciclos · 4 fases de 4 segundos · Voz guiada</p>
            <div className="grid grid-cols-4 gap-2 text-xs">
              {[{ l: 'INHALA', c: '#60a5fa' }, { l: 'RETÉN', c: '#a78bfa' }, { l: 'EXHALA', c: '#34d399' }, { l: 'PAUSA', c: '#60a5fa' }].map(({ l, c }) => (
                <div key={l} className="flex flex-col items-center gap-1">
                  <div className="w-6 h-6 rounded-full" style={{ background: c + '44', border: `1px solid ${c}88` }} />
                  <span className="text-white/40 font-bold" style={{ fontSize: '0.55rem' }}>{l}</span>
                </div>
              ))}
            </div>
            <button onClick={start}
              className="px-10 py-4 rounded-2xl text-white font-black tracking-widest text-sm"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}>
              INICIAR CON VOZ
            </button>
          </motion.div>
        )}

        {state === 'running' && (
          <>
            <div className="flex gap-2">
              {Array.from({ length: TOTAL_CYCLES }).map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full transition-all"
                  style={{ background: i < cycle ? '#4ade80' : i === cycle ? '#60a5fa' : 'rgba(255,255,255,0.1)', transform: i === cycle ? 'scale(1.4)' : 'scale(1)' }} />
              ))}
            </div>
            <button onClick={reset} className="text-white/20 text-xs hover:text-white/40">detener</button>
          </>
        )}

        <AnimatePresence>
          {state === 'done' && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4">
              <p className="text-white text-2xl font-black">¡Lo has conseguido! 🎉</p>
              <p className="text-white/40 text-sm">Tómate un momento para notar la calma</p>
              <button
                onClick={async () => { await saveSession(); navigate('/respiracion') }}
                disabled={saving}
                className="px-8 py-3 rounded-2xl text-white font-bold text-sm"
                style={{ background: saved ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
                {saving ? 'Guardando...' : saved ? '✓ Guardado' : '💾 Guardar y cerrar'}
              </button>
              <button onClick={reset} className="text-white/30 text-xs hover:text-white/50">Repetir</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
