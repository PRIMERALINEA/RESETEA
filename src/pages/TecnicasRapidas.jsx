import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/api/supabaseClient'
import { useNavigate } from 'react-router-dom'
import { Zap, ChevronRight, CheckCircle, ArrowLeft } from 'lucide-react'

// ── TÉCNICAS ──────────────────────────────────────────────────────────────────
const TECNICAS = [
  {
    id: 'pausa_1min',
    name: 'Pausa de 1 minuto',
    desc: 'Resetea tu mente entre tareas',
    emoji: '⏱️',
    color: 'from-teal-400 to-cyan-500',
    duracion: '1 min',
    pasos: [
      { texto: 'Cierra los ojos o baja la mirada', duracion: 10 },
      { texto: 'Respira lento: inhala 4s, exhala 6s', duracion: 20 },
      { texto: 'Suelta la tensión de hombros y mandíbula', duracion: 15 },
      { texto: 'Di mentalmente: "Estoy en pausa. Ahora vuelvo."', duracion: 15 },
    ]
  },
  {
    id: 'escalera',
    name: 'Escalera de calmado',
    desc: 'Baja la intensidad emocional paso a paso',
    emoji: '🪜',
    color: 'from-indigo-400 to-blue-500',
    duracion: '2-3 min',
    pasos: [
      { texto: '🔴 NIVEL 5 — Respira profundo 3 veces. Solo eso.', duracion: 20 },
      { texto: '🟠 NIVEL 4 — Nombre 5 cosas que ves ahora mismo.', duracion: 20 },
      { texto: '🟡 NIVEL 3 — Tensa y suelta los puños 3 veces.', duracion: 20 },
      { texto: '🟢 NIVEL 2 — Respira: inhala 4s, retén 4s, exhala 4s.', duracion: 20 },
      { texto: '🔵 NIVEL 1 — Di: "Lo estoy gestionando. Voy bien."', duracion: 20 },
    ]
  },
  {
    id: 'grounding',
    name: 'Grounding 5-4-3-2-1',
    desc: 'Vuelve al presente usando los sentidos',
    emoji: '🌱',
    color: 'from-green-400 to-emerald-500',
    duracion: '2-3 min',
    pasos: [
      { texto: '👁️ Nombra 5 cosas que puedes VER ahora mismo', duracion: 25 },
      { texto: '✋ Nombra 4 cosas que puedes TOCAR o sentir', duracion: 25 },
      { texto: '👂 Nombra 3 sonidos que puedes ESCUCHAR', duracion: 20 },
      { texto: '👃 Nombra 2 cosas que puedes OLER (o recordar)', duracion: 20 },
      { texto: '👅 Nombra 1 cosa que puedes SABOREAR ahora', duracion: 15 },
    ]
  },
  {
    id: 'respiracion_box',
    name: 'Respiración cuadrada rápida',
    desc: 'Calma inmediata en 2 minutos',
    emoji: '⬜',
    color: 'from-violet-400 to-purple-500',
    duracion: '2 min',
    pasos: [
      { texto: 'INHALA por la nariz — 4 segundos', duracion: 4 },
      { texto: 'RETÉN el aire — 4 segundos', duracion: 4 },
      { texto: 'EXHALA por la boca — 4 segundos', duracion: 4 },
      { texto: 'PAUSA — 4 segundos. Repite 4 veces.', duracion: 4 },
    ],
    repetir: 4
  },
]

function TecnicaEjercicio({ tecnica, onDone, onBack }) {
  const [pasoIdx, setPasoIdx] = useState(0)
  const [counter, setCounter] = useState(tecnica.pasos[0].duracion)
  const [repeticion, setRepeticion] = useState(0)
  const [finalizado, setFinalizado] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const timerRef = useRef(null)
  const startRef = useRef(Date.now())

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCounter(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          const nextPaso = pasoIdx + 1
          if (nextPaso >= tecnica.pasos.length) {
            const maxRep = tecnica.repetir || 1
            const nextRep = repeticion + 1
            if (nextRep < maxRep) {
              setRepeticion(nextRep)
              setPasoIdx(0)
              setCounter(tecnica.pasos[0].duracion)
            } else {
              setFinalizado(true)
            }
          } else {
            setPasoIdx(nextPaso)
            setCounter(tecnica.pasos[nextPaso].duracion)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [pasoIdx, repeticion])

  const saveSession = async () => {
    if (saving || saved) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const duracion = Math.round((Date.now() - startRef.current) / 1000)
      await supabase.from('sesiones_tecnicas').insert({
        user_id: user.id,
        tecnica_id: tecnica.id,
        tecnica_nombre: tecnica.name,
        duracion_segundos: duracion,
        created_at: new Date().toISOString()
      })
      setSaved(true)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const paso = tecnica.pasos[pasoIdx]
  const totalPasos = tecnica.pasos.length * (tecnica.repetir || 1)
  const pasoGlobal = repeticion * tecnica.pasos.length + pasoIdx

  if (finalizado) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6"
        style={{ background: 'linear-gradient(135deg, #0d3d3d 0%, #0f6b6b 100%)' }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center flex flex-col items-center gap-4 max-w-sm">
          <CheckCircle className="w-16 h-16 text-green-400" />
          <p className="text-white text-2xl font-black">¡Técnica completada!</p>
          <p className="text-white/60 text-sm">Tómate un momento para notar cómo te sientes ahora</p>
          <div className="flex flex-col gap-3 w-full mt-2">
            <button onClick={async () => { await saveSession(); onDone() }}
              disabled={saving}
              className="w-full py-3 rounded-2xl text-white font-bold"
              style={{ background: saved ? 'rgba(74,222,128,0.25)' : 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
              {saving ? 'Guardando...' : saved ? '✓ Guardado' : '💾 Guardar y cerrar'}
            </button>
            <button onClick={onBack} className="text-white/30 text-xs hover:text-white/50">Volver a técnicas</button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #0d3d3d 0%, #0f6b6b 100%)' }}>
      <button onClick={onBack} className="absolute top-6 left-6 text-white/40 hover:text-white">
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Progreso */}
      <div className="flex gap-1.5 mb-8">
        {Array.from({ length: totalPasos }).map((_, i) => (
          <div key={i} className="h-1.5 rounded-full transition-all"
            style={{ width: i === pasoGlobal ? '24px' : '8px', background: i < pasoGlobal ? '#4ade80' : i === pasoGlobal ? '#5eead4' : 'rgba(255,255,255,0.15)' }} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={`${repeticion}-${pasoIdx}`}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
          className="text-center max-w-sm w-full">
          <p className="text-white/40 text-xs tracking-widest mb-2">{tecnica.name.toUpperCase()}</p>
          <p className="text-white text-xl font-black leading-relaxed mb-8 px-2">{paso.texto}</p>

          {/* Temporizador */}
          <div className="relative w-28 h-28 mx-auto">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 112 112">
              <circle cx="56" cy="56" r="48" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
              <motion.circle cx="56" cy="56" r="48" fill="none"
                stroke="#5eead4" strokeWidth="6" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 48}`}
                strokeDashoffset={`${2 * Math.PI * 48 * (counter / paso.duracion)}`}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-white font-black text-2xl">{counter}</p>
              <p className="text-white/40 text-xs">seg</p>
            </div>
          </div>

          {tecnica.repetir && (
            <p className="text-white/30 text-xs mt-4">Vuelta {repeticion + 1} de {tecnica.repetir}</p>
          )}
        </motion.div>
      </AnimatePresence>

      <button onClick={onBack} className="mt-10 text-white/20 text-xs hover:text-white/40">Salir</button>
    </div>
  )
}

export default function TecnicasRapidas() {
  const [selected, setSelected] = useState(null)
  const navigate = useNavigate()

  if (selected) {
    return <TecnicaEjercicio
      tecnica={selected}
      onDone={() => setSelected(null)}
      onBack={() => setSelected(null)}
    />
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black" style={{ color: '#0d3d3d' }}>Técnicas rápidas</h1>
          <p className="text-slate-500 text-sm">Regulación emocional en 1–3 minutos</p>
        </div>
      </div>

      <div className="bg-teal-50 rounded-2xl p-4 mb-6 border border-teal-100 mt-4">
        <p className="text-teal-700 text-sm">⚡ <strong>¿Cuándo usarlas?</strong> Antes de un examen, cuando sientes que te bloqueas, entre clases o en cualquier momento de tensión.</p>
      </div>

      <div className="space-y-4">
        {TECNICAS.map((tec, i) => (
          <motion.div key={tec.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <button onClick={() => setSelected(tec)} className="w-full text-left">
              <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tec.color} flex items-center justify-center text-2xl flex-shrink-0`}>
                    {tec.emoji}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">{tec.name}</p>
                    <p className="text-sm text-slate-500">{tec.desc}</p>
                    <p className="text-xs text-teal-500 mt-1">⏱ {tec.duracion} · {tec.pasos.length} pasos</p>
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
