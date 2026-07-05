import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/api/supabaseClient'
import { useNavigate } from 'react-router-dom'

const PHASE_DURATION = 4000
const PAUSE_DURATION = 3000 // margen real tras cada ciclo: 500ms antes de que suene "Ciclo X completado" + ~2.5s para que la frase termine antes del siguiente "Inhala". Con 800ms se solapaban.
const TOTAL_CYCLES   = 4
const INTRO_DURATION = 8000 // tiempo reservado para la intro de voz antes de empezar ciclos

const PHASES = [
  { id: 'inhala',  color: '#60a5fa', glow: '#3b82f680', scale: 1.5 },
  { id: 'reten1', color: '#a78bfa', glow: '#8b5cf680', scale: 1.5 },
  { id: 'exhala', color: '#34d399', glow: '#10b98180', scale: 0.6 },
  { id: 'reten2', color: '#60a5fa', glow: '#3b82f640', scale: 0.6 },
]
const PHASE_LABELS    = ['INHALA', 'RETÉN', 'EXHALA', 'PAUSA']
const PHASE_SUBTITLES = ['por la nariz', 'el aire', 'por la boca', 'y descansa']

const GOOGLE_TTS_KEY = import.meta.env.VITE_GOOGLE_TTS_KEY
const audioCache = {}
let activeAudio = null
let ttsAudioEl = null
let ttsFailCount = 0
const TTS_FAIL_LIMIT = 2

// Debe llamarse de forma SÍNCRONA dentro del propio onClick que inicia el
// ejercicio, antes de cualquier await. iOS/WebKit exige que la primera
// reproducción de audio y de voz esté vinculada directamente al toque; si no,
// bloquea en silencio las reproducciones posteriores disparadas por
// temporizador — el patrón exacto de "empieza con voz y luego se calla".
function unlockAudio() {
  if (!ttsAudioEl) ttsAudioEl = new Audio()
  ttsAudioEl.play().catch(() => {})
  ttsAudioEl.pause()
  if (window.speechSynthesis) {
    const u = new SpeechSynthesisUtterance('')
    u.volume = 0
    window.speechSynthesis.speak(u)
  }
}

function stopAudio() {
  if (activeAudio) { activeAudio.pause(); activeAudio.currentTime = 0; activeAudio = null }
  if (window.speechSynthesis?.speaking) window.speechSynthesis.cancel()
}

function speakNow(text, cancelRef) {
  if (!window.speechSynthesis) return Promise.resolve()
  return new Promise(resolve => {
    if (cancelRef?.current) { resolve(); return }
    const doSpeak = () => {
      if (cancelRef?.current) { resolve(); return }
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'es-ES'; u.rate = 0.78; u.pitch = 1.1; u.volume = 1.0
      u.onend = resolve
      u.onerror = resolve
      const voices = window.speechSynthesis.getVoices()
      const fem = voices.find(v => v.lang === 'es-ES' && /female|mujer|mónica|lucia|elena|paulina/i.test(v.name))
        || voices.find(v => v.lang.startsWith('es'))
      if (fem) u.voice = fem
      window.speechSynthesis.speak(u)
    }
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel()
      setTimeout(() => {
        if (window.speechSynthesis.getVoices().length > 0) doSpeak()
        else window.speechSynthesis.onvoiceschanged = doSpeak
      }, 50)
    } else if (window.speechSynthesis.getVoices().length > 0) doSpeak()
    else window.speechSynthesis.onvoiceschanged = doSpeak
  })
}

async function speak(text, cancelRef) {
  if (cancelRef?.current) return
  // Parada defensiva: si quedara cualquier audio anterior sonando (Google TTS o
  // voz del navegador) por solape de tiempos, lo cortamos antes de empezar el nuevo.
  // Sin esto, dos <audio> de Google TTS pueden sonar a la vez sin que nada los pare.
  stopAudio()
  if (GOOGLE_TTS_KEY && ttsFailCount < TTS_FAIL_LIMIT) {
    const key = text.slice(0, 80)
    try {
      if (!audioCache[key]) {
        const res = await fetch(
          `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              input: { text },
              voice: { languageCode: 'es-ES', name: 'es-ES-Wavenet-C', ssmlGender: 'FEMALE' },
              audioConfig: { audioEncoding: 'MP3', speakingRate: 0.85, pitch: 0.0 }
            })
          }
        )
        if (!res.ok) throw new Error(`Google TTS HTTP ${res.status}`)
        const { audioContent } = await res.json()
        if (!audioContent) throw new Error('Google TTS: respuesta sin audioContent')
        const blob = await fetch(`data:audio/mp3;base64,${audioContent}`).then(r => r.blob())
        audioCache[key] = URL.createObjectURL(blob)
      }
      if (cancelRef?.current) return
      await new Promise((resolve, reject) => {
        if (!ttsAudioEl) ttsAudioEl = new Audio()
        ttsAudioEl.src = audioCache[key]
        ttsAudioEl.volume = 0.95
        activeAudio = ttsAudioEl
        ttsAudioEl.onended = () => { activeAudio = null; resolve() }
        ttsAudioEl.onerror = () => { activeAudio = null; reject(new Error('Google TTS: audio.play() falló')) }
        ttsAudioEl.play().catch(reject)
      })
      ttsFailCount = 0
      return
    } catch (e) {
      ttsFailCount++
      console.error(`Google TTS error (fallo ${ttsFailCount}/${TTS_FAIL_LIMIT}):`, e)
      delete audioCache[key]
    }
  }
  return speakNow(text, cancelRef)
}

// Precarga el audio de un texto en caché SIN reproducirlo. Se usa para que las
// frases "Ciclo X completado" (distintas cada vez, nunca cacheadas de antemano)
// no dependan de la latencia de red de Google TTS justo en el instante en que
// el guion las necesita — que es lo que seguía causando el solape con "Inhala".
async function prefetchAudio(text) {
  if (!GOOGLE_TTS_KEY || ttsFailCount >= TTS_FAIL_LIMIT) return
  const key = text.slice(0, 80)
  if (audioCache[key]) return
  try {
    const res = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text },
          voice: { languageCode: 'es-ES', name: 'es-ES-Wavenet-C', ssmlGender: 'FEMALE' },
          audioConfig: { audioEncoding: 'MP3', speakingRate: 0.85, pitch: 0.0 }
        })
      }
    )
    if (!res.ok) return
    const { audioContent } = await res.json()
    if (!audioContent) return
    const blob = await fetch(`data:audio/mp3;base64,${audioContent}`).then(r => r.blob())
    audioCache[key] = URL.createObjectURL(blob)
  } catch (e) {
    console.error('Prefetch TTS error:', e)
  }
}

export default function RespiracionCuadrada() {
  const [state, setState]         = useState('idle')
  const [cycle, setCycle]         = useState(0)
  const [phaseIdx, setPhaseIdx]   = useState(0)
  const [isPaused, setIsPaused]   = useState(false)
  const [counter, setCounter]     = useState(4)
  const [introLista, setIntroLista] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const startRef  = useRef(null)
  const timersRef = useRef([])
  const rafRef    = useRef(null)
  const cancelRef = useRef(false)
  const navigate  = useNavigate()

  const CYCLE_DUR = PHASES.length * PHASE_DURATION

  const clearAll = () => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    stopAudio()
  }

  // RAF: solo corre después de la intro (introLista)
  const tick = useCallback(() => {
    if (!startRef.current || cancelRef.current) return
    const elapsed = Date.now() - startRef.current
    const afterIntro = elapsed
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

  // Arranque: primero intro completa → luego ciclos
  const start = async () => {
    cancelRef.current = false
    clearAll()
    setState('running')
    setCycle(0); setPhaseIdx(0); setIsPaused(false); setCounter(4); setSaved(false); setIntroLista(false)

    // Precarga en paralelo, sin esperar: para cuando el setTimeout de cada ciclo
    // necesite "Muy bien. Ciclo X completado.", el audio ya está en caché y no
    // depende de la latencia de red de Google TTS en ese instante exacto.
    ;['Muy bien. Ciclo 1 completado.', 'Muy bien. Ciclo 2 completado.', 'Muy bien. Ciclo 3 completado.']
      .forEach(t => prefetchAudio(t))

    // Intro de voz secuencial — NO empieza el RAF hasta que termina
    await speak('Siéntate cómodo y cierra los ojos.', cancelRef)
    if (cancelRef.current) return
    await speak('Exhala todo el aire. Vamos a empezar.', cancelRef)
    if (cancelRef.current) return

    // Intro terminada → arrancamos ciclos
    startRef.current = Date.now()
    setIntroLista(true)

    // Script de voz para los ciclos (relativo al momento en que empieza startRef)
    const script = []
    for (let c = 0; c < TOTAL_CYCLES; c++) {
      const cs = c * (CYCLE_DUR + PAUSE_DURATION)
      script.push({ text: 'Inhala por la nariz.',            delay: cs })
      script.push({ text: 'Retén el aire.',                  delay: cs + PHASE_DURATION })
      script.push({ text: 'Exhala lentamente por la boca.',  delay: cs + PHASE_DURATION * 2 })
      script.push({ text: 'Pausa. Relájate.',                delay: cs + PHASE_DURATION * 3 })
      if (c < TOTAL_CYCLES - 1) {
        script.push({ text: `Muy bien. Ciclo ${c + 1} completado.`, delay: cs + CYCLE_DUR + 500 })
      }
    }
    const endDelay = TOTAL_CYCLES * (CYCLE_DUR + PAUSE_DURATION)
    script.push({ text: 'Perfecto. Vuelve a tu respiración natural.',      delay: endDelay })
    script.push({ text: '¡Lo has hecho genial! Abre los ojos cuando quieras.', delay: endDelay + 4000 })

    script.sort((a, b) => a.delay - b.delay).forEach(({ text, delay }) => {
      timersRef.current.push(setTimeout(() => {
        if (!cancelRef.current) speak(text, cancelRef)
      }, delay))
    })

    timersRef.current.push(setTimeout(() => {
      if (!cancelRef.current) setState('done')
    }, endDelay + 10000))

    rafRef.current = requestAnimationFrame(tick)
  }

  const reset = () => {
    cancelRef.current = true
    clearAll()
    setState('idle'); setCycle(0); setPhaseIdx(0); setIsPaused(false); setCounter(4); setIntroLista(false)
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

  useEffect(() => () => { cancelRef.current = true; clearAll() }, [])

  const phase = PHASES[phaseIdx] || PHASES[0]
  const isPulse = phaseIdx === 1 || phaseIdx === 3
  const isExpand = phaseIdx === 0

  return (
    <div className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at center, #0d1b3e 0%, #050d1f 100%)' }}>

      {state === 'idle' && (
        <button onClick={() => navigate('/respiracion')}
          className="absolute top-6 left-6 text-white/40 hover:text-white text-sm">← Volver</button>
      )}
      {state === 'running' && (
        <button onClick={reset}
          className="absolute top-6 left-6 px-4 py-2 rounded-xl text-white font-bold text-sm"
          style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
          ✕ Detener
        </button>
      )}

      {/* Halo */}
      <div className="relative flex items-center justify-center" style={{ width: '85vmin', height: '85vmin' }}>
        <AnimatePresence mode="wait">
          <motion.div key={`halo-${phaseIdx}-${cycle}`}
            className="absolute rounded-full"
            style={{ width: '85vmin', height: '85vmin' }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: state === 'running' && introLista && !isPaused ? (isPulse ? [0.3, 0.8, 0.3] : 0.4) : 0.15,
              background: `radial-gradient(circle, ${phase.glow} 0%, transparent 70%)`
            }}
            transition={isPulse ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.5 }}
          />
        </AnimatePresence>

        <motion.div
          className="rounded-full flex items-center justify-center"
          style={{
            width: '42vmin', height: '42vmin',
            background: `radial-gradient(circle at 35% 35%, ${phase.color}cc, ${phase.color}55)`,
            boxShadow: `0 0 80px ${phase.glow}`,
          }}
          animate={state === 'running' && introLista && !isPaused
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
        {state === 'running' && !introLista && (
          <p className="text-white/40 text-sm tracking-widest">Preparando...</p>
        )}
        {state === 'running' && introLista && !isPaused && (
          <AnimatePresence mode="wait">
            <motion.div key={`label-${phaseIdx}-${cycle}`}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="flex flex-col items-center">
              <span className="font-black tracking-widest text-2xl" style={{ color: phase.color }}>{PHASE_LABELS[phaseIdx]}</span>
              <span className="text-white/40 text-xs mt-0.5">{PHASE_SUBTITLES[phaseIdx]}</span>
              <span className="text-white/50 font-black mt-1">{counter}s</span>
            </motion.div>
          </AnimatePresence>
        )}
        {state === 'running' && introLista && isPaused && (
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
            <button onClick={() => { unlockAudio(); start() }}
              className="px-10 py-4 rounded-2xl text-white font-black tracking-widest text-sm"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}>
              INICIAR CON VOZ
            </button>
          </motion.div>
        )}

        {state === 'running' && introLista && (
          <div className="flex gap-2">
            {Array.from({ length: TOTAL_CYCLES }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full transition-all"
                style={{ background: i < cycle ? '#4ade80' : i === cycle ? '#60a5fa' : 'rgba(255,255,255,0.1)', transform: i === cycle ? 'scale(1.4)' : 'scale(1)' }} />
            ))}
          </div>
        )}

        <AnimatePresence>
          {state === 'done' && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4">
              <p className="text-white text-2xl font-black">¡Lo has conseguido! 🎉</p>
              <p className="text-white/40 text-sm">Tómate un momento para notar la calma</p>
              <button onClick={async () => { await saveSession(); navigate('/respiracion') }} disabled={saving}
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
