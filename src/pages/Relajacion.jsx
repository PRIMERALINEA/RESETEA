import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/api/supabaseClient'
import { Heart, ChevronRight, CheckCircle } from 'lucide-react'

const GROUPS = [
  { id: 'manos', name: 'Manos y brazos', emoji: '🤜', instruction: 'Aprieta los puños con fuerza durante 7 segundos... ahora suelta y nota la diferencia durante 20 segundos.', tense: 7, relax: 20 },
  { id: 'hombros', name: 'Hombros', emoji: '🤷', instruction: 'Sube los hombros hacia las orejas, muy tenso, 7 segundos... suelta y relaja completamente durante 20 segundos.', tense: 7, relax: 20 },
  { id: 'cara', name: 'Cara', emoji: '😬', instruction: 'Arruga toda la cara: frente, ojos, nariz, mandíbula durante 7 segundos... suelta y siente el calor relajante durante 20 segundos.', tense: 7, relax: 20 },
  { id: 'abdomen', name: 'Abdomen', emoji: '🫃', instruction: 'Tensa el abdomen como si fuera a recibir un golpe, 7 segundos... suelta y respira profundamente durante 20 segundos.', tense: 7, relax: 20 },
  { id: 'piernas', name: 'Piernas y pies', emoji: '🦵', instruction: 'Estira las piernas, apunta los dedos hacia ti tensando todo, 7 segundos... suelta y deja que caigan pesadas durante 20 segundos.', tense: 7, relax: 20 },
]

export default function Relajacion() {
  const [started, setStarted] = useState(false)
  const [groupIdx, setGroupIdx] = useState(0)
  const [phase, setPhase] = useState('tense') // tense | relax
  const [counter, setCounter] = useState(7)
  const [done, setDone] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)

  const group = GROUPS[groupIdx]

  useEffect(() => {
    if (!started || done) return
    timerRef.current = setInterval(() => {
      setCounter(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          if (phase === 'tense') {
            setPhase('relax')
            setCounter(group.relax)
          } else {
            if (groupIdx < GROUPS.length - 1) {
              setGroupIdx(g => g + 1)
              setPhase('tense')
              setCounter(GROUPS[groupIdx + 1].tense)
            } else {
              setDone(true)
            }
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [started, phase, groupIdx, done])

  const start = () => {
    startTimeRef.current = Date.now()
    setStarted(true)
    setGroupIdx(0)
    setPhase('tense')
    setCounter(GROUPS[0].tense)
    setDone(false)
    setSaved(false)
  }

  const saveSession = async () => {
    if (saving || saved) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const duracion = startTimeRef.current ? Math.round((Date.now() - startTimeRef.current) / 1000) : 0
      await supabase.from('sesiones_relajacion').insert({
        user_id: user.id,
        tipo: 'relajacion_muscular_progresiva',
        grupos_completados: GROUPS.length,
        duracion_segundos: duracion,
        created_at: new Date().toISOString()
      })
      setSaved(true)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const reset = () => {
    clearInterval(timerRef.current)
    setStarted(false)
    setGroupIdx(0)
    setPhase('tense')
    setCounter(7)
    setDone(false)
    setSaved(false)
  }

  if (!started) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-blue-900">Relajación muscular</h1>
            <p className="text-slate-500 text-sm">Técnica de Jacobson progresiva</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-blue-50 mb-6">
          <p className="font-bold text-slate-800 mb-2">¿Cómo funciona?</p>
          <p className="text-slate-600 text-sm leading-relaxed">Vas a tensar y soltar distintos grupos musculares. Al soltar, notarás una relajación profunda. Es ideal para antes de dormir o cuando sientes el cuerpo muy tenso por el estrés del estudio.</p>
          <div className="mt-4 space-y-2">
            {GROUPS.map((g, i) => (
              <div key={g.id} className="flex items-center gap-3 text-sm text-slate-500">
                <span>{g.emoji}</span>
                <span>{g.name}</span>
                <span className="text-xs text-slate-300 ml-auto">{g.tense + g.relax}s</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-4">Duración total: ~{Math.round(GROUPS.reduce((a, g) => a + g.tense + g.relax, 0) / 60)} minutos</p>
        </div>

        <button onClick={start}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold text-lg shadow-lg hover:opacity-90 transition-opacity">
          Comenzar sesión
        </button>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-rose-900 to-pink-900">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center flex flex-col items-center gap-4">
          <CheckCircle className="w-16 h-16 text-green-400" />
          <p className="text-white text-2xl font-black">¡Sesión completada!</p>
          <p className="text-white/60 text-sm max-w-xs">Tu cuerpo debería sentirse más ligero y relajado. Tómate un momento antes de continuar.</p>
          <button onClick={async () => { await saveSession(); reset() }}
            disabled={saving}
            className="px-8 py-3 rounded-2xl text-white font-bold text-sm mt-2"
            style={{ background: saved ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
            {saving ? 'Guardando...' : saved ? '✓ Guardado' : '💾 Guardar y cerrar'}
          </button>
          <button onClick={reset} className="text-white/30 text-xs hover:text-white/50">Repetir</button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-rose-900 to-pink-900">
      <button onClick={reset} className="absolute top-6 left-6 text-white/40 hover:text-white text-sm">← Salir</button>

      {/* Progreso */}
      <div className="flex gap-2 mb-8">
        {GROUPS.map((_, i) => (
          <div key={i} className="w-2 h-2 rounded-full transition-all"
            style={{ background: i < groupIdx ? '#4ade80' : i === groupIdx ? '#fb7185' : 'rgba(255,255,255,0.2)' }} />
        ))}
      </div>

      <motion.div key={`${groupIdx}-${phase}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-sm">
        <div className="text-6xl mb-4">{group.emoji}</div>
        <p className="text-white/40 text-xs tracking-widest mb-1">{group.name.toUpperCase()}</p>
        <p className="text-3xl font-black mb-2" style={{ color: phase === 'tense' ? '#fb7185' : '#4ade80' }}>
          {phase === 'tense' ? 'TENSA' : 'SUELTA'}
        </p>
        <p className="text-white/70 text-base leading-relaxed mb-8">{group.instruction}</p>
        <div className="w-24 h-24 rounded-full border-4 flex items-center justify-center mx-auto"
          style={{ borderColor: phase === 'tense' ? '#fb7185' : '#4ade80' }}>
          <p className="text-white font-black text-3xl">{counter}</p>
        </div>
      </motion.div>
    </div>
  )
}
