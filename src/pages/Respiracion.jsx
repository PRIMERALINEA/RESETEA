import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/api/supabaseClient'
import { Save, Mic } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const GOOGLE_TTS_KEY = import.meta.env.VITE_GOOGLE_TTS_KEY
const audioCache = {}
let activeAudio = null
let ttsFailCount = 0
const TTS_FAIL_LIMIT = 2 // tras N fallos seguidos de Google TTS, se deja de reintentar en esta sesión

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
    // Bug conocido de Chrome: cancel()+speak() seguidos a veces disparan onend sin sonar.
    // Si el motor está ocupado, cancelamos y esperamos un tick antes de encolar.
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
        const audio = new Audio(audioCache[key])
        audio.volume = 0.95
        activeAudio = audio
        audio.onended = () => { activeAudio = null; resolve() }
        audio.onerror = () => { activeAudio = null; reject(new Error('Google TTS: audio.play() falló')) }
        audio.play().catch(reject)
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

const PHASE_VOICE = {
  box:   ['Inhala por la nariz.', 'Retén el aire.', 'Exhala lentamente por la boca.', 'Pausa. Relájate.'],
  '478': ['Inhala por la nariz.', 'Retén el aire.', 'Exhala lentamente por la boca.'],
  calma: ['Inhala profundamente.', 'Exhala lentamente, suelta toda la tensión.'],
}

const EXERCISES = [
  {
    id: 'box',
    name: 'Respiración Cuadrada',
    desc: 'Técnica 4-4-4-4 para calmar el estrés antes de un examen',
    emoji: '🌬',
    color: 'from-blue-400 to-cyan-500',
    phases: [
      { label: 'INHALA', seconds: 4, color: '#60a5fa' },
      { label: 'RETÉN',  seconds: 4, color: '#a78bfa' },
      { label: 'EXHALA', seconds: 4, color: '#34d399' },
      { label: 'PAUSA',  seconds: 4, color: '#60a5fa' },
    ],
    cycles: 4
  },
  {
    id: '478',
    name: 'Respiración 4-7-8',
    desc: 'Reduce la ansiedad rápidamente',
    emoji: '🌸',
    color: 'from-purple-400 to-pink-500',
    phases: [
      { label: 'INHALA', seconds: 4, color: '#a78bfa' },
      { label: 'RETÉN',  seconds: 7, color: '#f472b6' },
      { label: 'EXHALA', seconds: 8, color: '#34d399' },
    ],
    cycles: 3
  },
  {
    id: 'calma',
    name: 'Respiración Calmante',
    desc: 'Exhala más largo para relajarte',
    emoji: '🍃',
    color: 'from-teal-400 to-cyan-500',
    phases: [
      { label: 'INHALA', seconds: 4, color: '#2dd4bf' },
      { label: 'EXHALA', seconds: 8, color: '#06b6d4' },
    ],
    cycles: 5
  }
]

export default function Respiracion() {
  const navigate = useNavigate()
  const [selected, setSelected]     = useState(null)
  const [conVoz, setConVoz]         = useState(false)
  const [state, setState]           = useState('idle')
  const [phaseIdx, setPhaseIdx]     = useState(0)
  const [cycleCount, setCycleCount] = useState(0)
  const [counter, setCounter]       = useState(0)
  const [introLista, setIntroLista] = useState(false)
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)
  const startTimeRef = useRef(null)
  const timerRef     = useRef(null)
  const cancelRef    = useRef(false)

  const exercise = selected ? EXERCISES.find(e => e.id === selected) : null
  const clearTimer = () => { if (timerRef.current) clearInterval(timerRef.current) }

  const startExercise = (exId, withVoice = false) => {
    setSelected(exId); setConVoz(withVoice)
    setState('idle'); setPhaseIdx(0); setCycleCount(0)
    setIntroLista(false); setSaved(false)
  }

  // Intro completa → luego activa fases
  const start = async () => {
    if (!exercise) return
    cancelRef.current = false
    startTimeRef.current = Date.now()
    setState('running')
    setPhaseIdx(0); setCycleCount(0); setIntroLista(false); setSaved(false)

    if (conVoz) {
      await speak('Siéntate cómodo. Cierra los ojos. Vamos a empezar.', cancelRef)
      if (cancelRef.current) return
      await speak('Exhala todo el aire.', cancelRef)
      if (cancelRef.current) return
    }
    setIntroLista(true)
  }

  // Timer de fases: solo arranca cuando introLista === true
  useEffect(() => {
    if (state !== 'running' || !exercise || !introLista) return
    clearTimer()
    setCounter(exercise.phases[phaseIdx].seconds)

    if (conVoz && !cancelRef.current) {
      const v = PHASE_VOICE[exercise.id]
      if (v?.[phaseIdx]) speak(v[phaseIdx], cancelRef)
    }

    timerRef.current = setInterval(() => {
      if (cancelRef.current) { clearInterval(timerRef.current); return }
      setCounter(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          if (cancelRef.current) return 0
          const nextPhase = phaseIdx + 1
          if (nextPhase >= exercise.phases.length) {
            const nextCycle = cycleCount + 1
            if (nextCycle >= exercise.cycles) {
              setState('done')
              if (conVoz) speak('Perfecto. Has terminado. Vuelve a tu respiración natural.', cancelRef)
            } else {
              setCycleCount(nextCycle); setPhaseIdx(0)
            }
          } else {
            setPhaseIdx(nextPhase)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return clearTimer
  }, [state, phaseIdx, cycleCount, introLista])

  const saveSession = async () => {
    if (saving || saved || !exercise) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const duracion = startTimeRef.current
        ? Math.round((Date.now() - startTimeRef.current) / 1000)
        : exercise.cycles * exercise.phases.reduce((a, p) => a + p.seconds, 0)
      const { data: perfil } = await supabase.from('perfiles_alumnos').select('centro_id').eq('user_id', user.id).single()
      await supabase.from('sesiones_respiracion').insert({
        user_id: user.id,
        centro_id: perfil?.centro_id || null,
        ejercicio_id: exercise.id,
        ejercicio_nombre: exercise.name,
        duracion_segundos: duracion,
        ciclos_completados: exercise.cycles,
        created_at: new Date().toISOString()
      })
      setSaved(true)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const reset = () => {
    cancelRef.current = true
    clearTimer(); stopAudio()
    setState('idle'); setPhaseIdx(0); setCycleCount(0); setIntroLista(false); setSaved(false)
  }

  useEffect(() => () => { cancelRef.current = true; clearTimer(); stopAudio() }, [])

  if (selected && exercise) {
    const phase = exercise.phases[phaseIdx] || exercise.phases[0]

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)' }}>

        <button onClick={() => { reset(); setSelected(null) }}
          className="absolute top-6 left-6 text-white/40 hover:text-white text-sm">← Volver</button>

        <p className="text-white/60 text-sm mb-2">{exercise.name}</p>
        <p className="text-white/40 text-xs mb-8">Ciclo {cycleCount + 1} de {exercise.cycles}</p>

        <div className="relative flex items-center justify-center mb-8">
          <motion.div
            className="w-48 h-48 rounded-full flex items-center justify-center"
            style={{ background: `radial-gradient(circle, ${phase.color}44, ${phase.color}22)`, border: `3px solid ${phase.color}66` }}
            animate={state === 'running' && introLista ? {
              scale: phase.label === 'INHALA' ? [1, 1.3] : phase.label === 'EXHALA' ? [1.3, 1] : 1.3,
            } : { scale: 1 }}
            transition={{ duration: phase.seconds, ease: 'easeInOut' }}>
            <div className="text-center">
              {state === 'running' && !introLista ? (
                <p className="text-white/50 text-sm">Preparando...</p>
              ) : (
                <>
                  <p className="text-white font-black text-xl tracking-widest" style={{ color: phase.color }}>
                    {state === 'running' ? phase.label : exercise.emoji}
                  </p>
                  {state === 'running' && <p className="text-white/60 text-3xl font-black mt-1">{counter}s</p>}
                  {state === 'idle' && <p className="text-white/40 text-sm mt-1">Listo</p>}
                </>
              )}
            </div>
          </motion.div>
        </div>

        <div className="flex gap-2 mb-8">
          {Array.from({ length: exercise.cycles }).map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full transition-all"
              style={{ background: i < cycleCount ? '#4ade80' : i === cycleCount && state === 'running' ? phase.color : 'rgba(255,255,255,0.2)' }} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {state === 'idle' && (
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={start}
              className="px-10 py-4 rounded-2xl text-white font-bold text-sm flex items-center gap-2"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
              {conVoz && <Mic className="w-4 h-4" />} INICIAR {conVoz ? 'CON VOZ' : ''}
            </motion.button>
          )}
          {state === 'running' && (
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={reset}
              className="px-6 py-2 rounded-xl text-white font-bold text-sm"
              style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
              ✕ Detener
            </motion.button>
          )}
          {state === 'done' && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 text-center">
              <p className="text-white text-xl font-black">¡Bien hecho! 🎉</p>
              <p className="text-white/50 text-sm">Tómate un momento para notar cómo te sientes</p>
              <button onClick={async () => { await saveSession(); reset(); setSelected(null) }} disabled={saving}
                className="px-8 py-3 rounded-2xl text-white font-bold text-sm flex items-center gap-2"
                style={{ background: saved ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
                <Save className="w-4 h-4" />
                {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar y cerrar'}
              </button>
              <button onClick={reset} className="text-white/30 text-xs hover:text-white/50">Repetir</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <img src="https://zbusdixrxedfhbkquafh.supabase.co/storage/v1/object/public/logo/WhatsApp%20Image%202026-04-06%20at%2015.58.04.jpeg"
          alt="Resetea" className="w-10 h-10 rounded-full object-cover shadow-md flex-shrink-0" />
        <div>
          <h1 className="text-xl font-black text-blue-900">Respiración guiada</h1>
          <p className="text-slate-500 text-sm">Calma el estrés en minutos</p>
        </div>
      </div>
      <div className="space-y-4">
        {EXERCISES.map((ex, i) => (
          <motion.div key={ex.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all border border-blue-50">
              <div className="flex items-center gap-4 mb-3">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${ex.color} flex items-center justify-center text-2xl flex-shrink-0`}>
                  {ex.emoji}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800">{ex.name}</p>
                  <p className="text-sm text-slate-500">{ex.desc}</p>
                  <p className="text-xs text-blue-400 mt-1">{ex.cycles} ciclos · {ex.phases.map(p => p.seconds).join('-')} seg</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startExercise(ex.id, false)}
                  className={`flex-1 py-2 rounded-xl text-white text-sm font-bold bg-gradient-to-r ${ex.color}`}>
                  Sin voz
                </button>
                <button onClick={() => ex.id === 'box' ? navigate('/respiracion/cuadrada') : startExercise(ex.id, true)}
                  className="flex-1 py-2 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-1"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                  <Mic className="w-3 h-3" /> Con voz
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
