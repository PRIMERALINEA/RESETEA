import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/api/supabaseClient'
import { Wind, Play, RotateCcw, Save } from 'lucide-react'

const EXERCISES = [
  {
    id: 'box',
    name: 'Respiración Cuadrada',
    desc: 'Técnica 4-4-4-4 para calmar el estrés antes de un examen',
    emoji: '⬜',
    color: 'from-blue-400 to-cyan-500',
    phases: [
      { label: 'INHALA', seconds: 4, color: '#60a5fa' },
      { label: 'RETÉN', seconds: 4, color: '#a78bfa' },
      { label: 'EXHALA', seconds: 4, color: '#34d399' },
      { label: 'PAUSA', seconds: 4, color: '#60a5fa' },
    ],
    cycles: 4
  },
  {
    id: '478',
    name: 'Respiración 4-7-8',
    desc: 'Reduce la ansiedad rápidamente',
    emoji: '🌙',
    color: 'from-purple-400 to-pink-500',
    phases: [
      { label: 'INHALA', seconds: 4, color: '#a78bfa' },
      { label: 'RETÉN', seconds: 7, color: '#f472b6' },
      { label: 'EXHALA', seconds: 8, color: '#34d399' },
    ],
    cycles: 3
  },
  {
    id: 'calma',
    name: 'Respiración Calmante',
    desc: 'Exhala más largo para relajarte',
    emoji: '☁️',
    color: 'from-teal-400 to-cyan-500',
    phases: [
      { label: 'INHALA', seconds: 4, color: '#2dd4bf' },
      { label: 'EXHALA', seconds: 8, color: '#06b6d4' },
    ],
    cycles: 5
  }
]

export default function Respiracion() {
  const [selected, setSelected] = useState(null)
  const [state, setState] = useState('idle') // idle, running, done
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [cycleCount, setCycleCount] = useState(0)
  const [counter, setCounter] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const startTimeRef = useRef(null)
  const timerRef = useRef(null)

  const exercise = selected ? EXERCISES.find(e => e.id === selected) : null

  const clearTimer = () => { if (timerRef.current) clearInterval(timerRef.current) }

  const startExercise = (exId) => {
    setSelected(exId)
    setState('idle')
    setPhaseIdx(0)
    setCycleCount(0)
    setSaved(false)
  }

  const start = () => {
    if (!exercise) return
    startTimeRef.current = Date.now()
    setState('running')
    setPhaseIdx(0)
    setCycleCount(0)
    setCounter(exercise.phases[0].seconds)
  }

  useEffect(() => {
    if (state !== 'running' || !exercise) return
    clearTimer()
    setCounter(exercise.phases[phaseIdx].seconds)
    timerRef.current = setInterval(() => {
      setCounter(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          const nextPhase = phaseIdx + 1
          if (nextPhase >= exercise.phases.length) {
            const nextCycle = cycleCount + 1
            if (nextCycle >= exercise.cycles) {
              setState('done')
            } else {
              setCycleCount(nextCycle)
              setPhaseIdx(0)
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
  }, [state, phaseIdx, cycleCount])

  const saveSession = async () => {
    if (saving || saved || !exercise) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const duracion = startTimeRef.current ? Math.round((Date.now() - startTimeRef.current) / 1000) : exercise.cycles * exercise.phases.reduce((a, p) => a + p.seconds, 0)
      await supabase.from('sesiones_respiracion').insert({
        user_id: user.id,
        ejercicio_id: exercise.id,
        ejercicio_nombre: exercise.name,
        duracion_segundos: duracion,
        ciclos_completados: exercise.cycles,
        created_at: new Date().toISOString()
      })
      setSaved(true)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const reset = () => {
    clearTimer()
    setState('idle')
    setPhaseIdx(0)
    setCycleCount(0)
    setSaved(false)
  }

  // Vista ejercicio activo
  if (selected && exercise) {
    const phase = exercise.phases[phaseIdx] || exercise.phases[0]
    const totalPhases = exercise.phases.length
    const progress = state === 'running' ? ((exercise.phases[phaseIdx].seconds - counter) / exercise.phases[phaseIdx].seconds) * 100 : 0

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)' }}>

        <button onClick={() => { clearTimer(); setSelected(null); setState('idle') }}
          className="absolute top-6 left-6 text-white/40 hover:text-white text-sm">← Volver</button>

        <p className="text-white/60 text-sm mb-2">{exercise.name}</p>
        <p className="text-white/40 text-xs mb-8">Ciclo {cycleCount + 1} de {exercise.cycles}</p>

        {/* Círculo animado */}
        <div className="relative flex items-center justify-center mb-8">
          <motion.div
            className="w-48 h-48 rounded-full flex items-center justify-center"
            style={{ background: `radial-gradient(circle, ${phase.color}44, ${phase.color}22)`, border: `3px solid ${phase.color}66` }}
            animate={state === 'running' ? {
              scale: phase.label === 'INHALA' ? [1, 1.3] : phase.label === 'EXHALA' ? [1.3, 1] : 1.3,
            } : { scale: 1 }}
            transition={{ duration: phase.seconds, ease: 'easeInOut' }}
          >
            <div className="text-center">
              <p className="text-white font-black text-xl tracking-widest" style={{ color: phase.color }}>
                {state === 'running' || state === 'done' ? phase.label : exercise.emoji}
              </p>
              {state === 'running' && <p className="text-white/60 text-3xl font-black mt-1">{counter}s</p>}
              {state === 'idle' && <p className="text-white/40 text-sm mt-1">Listo</p>}
            </div>
          </motion.div>
        </div>

        {/* Indicadores de ciclo */}
        <div className="flex gap-2 mb-8">
          {Array.from({ length: exercise.cycles }).map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full transition-all"
              style={{ background: i < cycleCount ? '#4ade80' : i === cycleCount && state === 'running' ? phase.color : 'rgba(255,255,255,0.2)' }} />
          ))}
        </div>

        {/* Controles */}
        <AnimatePresence mode="wait">
          {state === 'idle' && (
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              onClick={start}
              className="px-10 py-4 rounded-2xl text-white font-bold text-sm"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
              INICIAR
            </motion.button>
          )}
          {state === 'running' && (
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              onClick={reset}
              className="text-white/30 text-sm hover:text-white/60">
              Detener
            </motion.button>
          )}
          {state === 'done' && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 text-center">
              <p className="text-white text-xl font-black">¡Bien hecho! 🎉</p>
              <p className="text-white/50 text-sm">Tómate un momento para notar cómo te sientes</p>
              <button onClick={async () => { await saveSession(); reset(); setSelected(null) }}
                disabled={saving}
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

  // Lista de ejercicios
  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
          <Wind className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black text-blue-900">Respiración guiada</h1>
          <p className="text-slate-500 text-sm">Calma el estrés en minutos</p>
        </div>
      </div>

      <div className="space-y-4">
        {EXERCISES.map((ex, i) => (
          <motion.div key={ex.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <button onClick={() => startExercise(ex.id)} className="w-full text-left">
              <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all border border-blue-50">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${ex.color} flex items-center justify-center text-2xl flex-shrink-0`}>
                    {ex.emoji}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{ex.name}</p>
                    <p className="text-sm text-slate-500">{ex.desc}</p>
                    <p className="text-xs text-blue-400 mt-1">{ex.cycles} ciclos · {ex.phases.map(p => p.seconds).join('-')} seg</p>
                  </div>
                </div>
              </div>
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
