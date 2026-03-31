import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/api/supabaseClient'
import { Anchor, ChevronRight, CheckCircle } from 'lucide-react'

const TECHNIQUES = [
  {
    id: '54321',
    name: 'Técnica 5-4-3-2-1',
    desc: 'Vuelve al presente usando tus sentidos',
    emoji: '🖐️',
    color: 'from-indigo-400 to-purple-500',
    steps: [
      { n: 5, sense: 'VES', icon: '👁️', prompt: 'Nombra 5 cosas que puedes ver ahora mismo' },
      { n: 4, sense: 'TOCAS', icon: '✋', prompt: 'Nombra 4 cosas que puedes tocar o sentir físicamente' },
      { n: 3, sense: 'ESCUCHAS', icon: '👂', prompt: 'Nombra 3 sonidos que puedes escuchar' },
      { n: 2, sense: 'HUELES', icon: '👃', prompt: 'Nombra 2 cosas que puedes oler (o que recuerdas oler)' },
      { n: 1, sense: 'SABOREAS', icon: '👅', prompt: 'Nombra 1 cosa que puedes saborear ahora mismo' },
    ]
  },
  {
    id: 'tierra',
    name: 'Conexión con el suelo',
    desc: 'Siente tu cuerpo en el espacio presente',
    emoji: '🌱',
    color: 'from-green-400 to-teal-500',
    steps: [
      { n: 1, sense: 'POSTURA', icon: '🧍', prompt: 'Siéntate o ponte de pie. Nota el contacto de tus pies con el suelo.' },
      { n: 2, sense: 'RESPIRACIÓN', icon: '🌬️', prompt: 'Toma 3 respiraciones lentas y profundas. Siente el aire entrando y saliendo.' },
      { n: 3, sense: 'CUERPO', icon: '💪', prompt: 'Tensa todos tus músculos 5 segundos. Luego suéltalos. Nota la diferencia.' },
      { n: 4, sense: 'PRESENCIA', icon: '✨', prompt: 'Di en voz alta o mentalmente: "Estoy aquí. Estoy a salvo. Esto pasará."' },
    ]
  },
  {
    id: 'frio',
    name: 'Anclaje del frío',
    desc: 'Resetea el sistema nervioso rápidamente',
    emoji: '❄️',
    color: 'from-cyan-400 to-blue-500',
    steps: [
      { n: 1, sense: 'PREPARA', icon: '🖐️', prompt: 'Busca agua fría (grifo, botella) o un objeto frío cercano.' },
      { n: 2, sense: 'CONTACTO', icon: '💧', prompt: 'Pon las muñecas bajo agua fría 30 segundos, o sostén el objeto frío.' },
      { n: 3, sense: 'ATENCIÓN', icon: '🎯', prompt: 'Concentra toda tu atención en esa sensación de frío. Solo en eso.' },
      { n: 4, sense: 'RESPIRA', icon: '🌬️', prompt: 'Respira lentamente mientras mantienes el contacto. Nota cómo baja la intensidad.' },
    ]
  }
]

export default function Anclajes() {
  const [selected, setSelected] = useState(null)
  const [stepIdx, setStepIdx] = useState(0)
  const [done, setDone] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const technique = selected ? TECHNIQUES.find(t => t.id === selected) : null

  const saveSession = async () => {
    if (saving || saved || !technique) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('sesiones_anclaje').insert({
        user_id: user.id,
        tecnica_id: technique.id,
        tecnica_nombre: technique.name,
        pasos_completados: technique.steps.length,
        created_at: new Date().toISOString()
      })
      setSaved(true)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const reset = () => {
    setSelected(null)
    setStepIdx(0)
    setDone(false)
    setSaved(false)
  }

  if (selected && technique) {
    const step = technique.steps[stepIdx]
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-900 to-blue-900">
        <button onClick={reset} className="absolute top-6 left-6 text-white/40 hover:text-white text-sm">← Volver</button>

        <AnimatePresence mode="wait">
          {!done ? (
            <motion.div key={stepIdx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-sm text-center">
              <div className="text-6xl mb-4">{step.icon}</div>
              <p className="text-white/40 text-xs tracking-widest mb-2">{stepIdx + 1} DE {technique.steps.length}</p>
              <p className="text-2xl font-black text-white mb-2" style={{ color: '#93c5fd' }}>{step.sense}</p>
              <p className="text-white/70 text-base leading-relaxed mb-10">{step.prompt}</p>

              <div className="flex gap-2 justify-center mb-8">
                {technique.steps.map((_, i) => (
                  <div key={i} className="w-2 h-2 rounded-full transition-all"
                    style={{ background: i < stepIdx ? '#4ade80' : i === stepIdx ? '#93c5fd' : 'rgba(255,255,255,0.2)' }} />
                ))}
              </div>

              <button
                onClick={() => {
                  if (stepIdx < technique.steps.length - 1) setStepIdx(stepIdx + 1)
                  else setDone(true)
                }}
                className="px-10 py-4 rounded-2xl text-white font-bold"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                {stepIdx < technique.steps.length - 1 ? 'Siguiente →' : 'Terminar'}
              </button>
            </motion.div>
          ) : (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="text-center flex flex-col items-center gap-4">
              <CheckCircle className="w-16 h-16 text-green-400" />
              <p className="text-white text-2xl font-black">¡Anclaje completado!</p>
              <p className="text-white/50 text-sm">Tómate un momento. ¿Cómo te sientes ahora?</p>
              <button onClick={async () => { await saveSession(); reset() }}
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
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
          <Anchor className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black text-blue-900">Técnicas de anclaje</h1>
          <p className="text-slate-500 text-sm">Vuelve al presente cuando te abrumas</p>
        </div>
      </div>

      <div className="bg-blue-50 rounded-2xl p-4 mb-6 border border-blue-100">
        <p className="text-blue-700 text-sm">💡 <strong>¿Cuándo usarlos?</strong> Cuando sientes que te bloqueas, tienes ansiedad antes de un examen o simplemente necesitas calmarte.</p>
      </div>

      <div className="space-y-4">
        {TECHNIQUES.map((tech, i) => (
          <motion.div key={tech.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <button onClick={() => { setSelected(tech.id); setStepIdx(0); setDone(false) }} className="w-full text-left">
              <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all border border-blue-50">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tech.color} flex items-center justify-center text-2xl flex-shrink-0`}>
                    {tech.emoji}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">{tech.name}</p>
                    <p className="text-sm text-slate-500">{tech.desc}</p>
                    <p className="text-xs text-indigo-400 mt-1">{tech.steps.length} pasos guiados</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </div>
              </div>
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
