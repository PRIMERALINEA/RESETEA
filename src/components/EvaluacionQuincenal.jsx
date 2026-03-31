import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/api/supabaseClient'
import { CheckCircle, Brain, ChevronRight } from 'lucide-react'

const PREGUNTAS = [
  {
    id: 'rumiacion',
    titulo: 'Pensamientos repetitivos',
    pregunta: '¿Con qué frecuencia te has quedado "atrapado/a" dando vueltas a los mismos pensamientos negativos o preocupaciones?',
    etiquetas: ['Casi nunca', 'Poco', 'A veces', 'Bastante', 'Muy seguido'],
    inversion: true, // mayor puntuación = peor (rumiación)
    emoji: '🔄',
    color: '#7c3aed',
  },
  {
    id: 'atencion_presente',
    titulo: 'Atención al momento presente',
    pregunta: '¿Con qué facilidad has podido centrar tu atención en lo que estabas haciendo, sin que tu mente se fuera a otros sitios?',
    etiquetas: ['Muy difícil', 'Difícil', 'Regular', 'Fácil', 'Muy fácil'],
    inversion: false,
    emoji: '🎯',
    color: '#0891b2',
  },
  {
    id: 'capacidad_calma',
    titulo: 'Capacidad de calmarte',
    pregunta: '¿Hasta qué punto has sentido que podías calmarte cuando te sentías nervioso/a o estresado/a?',
    etiquetas: ['Nada', 'Poco', 'Algo', 'Bastante', 'Mucho'],
    inversion: false,
    emoji: '🌊',
    color: '#0f6b6b',
  },
  {
    id: 'bienestar_general',
    titulo: 'Bienestar general',
    pregunta: '¿Cómo valorarías tu bienestar emocional en general durante estas últimas dos semanas?',
    etiquetas: ['Muy malo', 'Malo', 'Regular', 'Bueno', 'Muy bueno'],
    inversion: false,
    emoji: '✨',
    color: '#b45309',
  },
]

function EscalaLikert({ pregunta, value, onChange }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{pregunta.emoji}</span>
        <p className="font-bold text-slate-800">{pregunta.titulo}</p>
      </div>
      <p className="text-sm text-slate-600 leading-relaxed">{pregunta.pregunta}</p>
      <div className="flex gap-2">
        {pregunta.etiquetas.map((etiqueta, i) => {
          const puntuacion = i + 1
          const isSelected = value === puntuacion
          return (
            <button key={i} onClick={() => onChange(puntuacion)}
              className="flex-1 flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all"
              style={{
                background: isSelected ? pregunta.color + '15' : 'white',
                borderColor: isSelected ? pregunta.color : '#e2e8f0',
              }}>
              <span className="text-lg font-black" style={{ color: isSelected ? pregunta.color : '#94a3b8' }}>
                {puntuacion}
              </span>
              <span className="text-center leading-tight"
                style={{ fontSize: '9px', color: isSelected ? pregunta.color : '#94a3b8', fontWeight: isSelected ? '700' : '400' }}>
                {etiqueta}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function diasDesdeUltima(fechaISO) {
  if (!fechaISO) return 999
  const diff = Date.now() - new Date(fechaISO).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export default function EvaluacionQuincenal({ onClose }) {
  const [paso, setPaso] = useState(0) // 0 = intro, 1..4 = preguntas, 5 = fin
  const [respuestas, setRespuestas] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [disponible, setDisponible] = useState(true)
  const [diasRestantes, setDiasRestantes] = useState(0)

  useEffect(() => {
    const verificar = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('evaluaciones_quincenales')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
      if (data && data.length > 0) {
        const dias = diasDesdeUltima(data[0].created_at)
        if (dias < 14) {
          setDisponible(false)
          setDiasRestantes(14 - dias)
        }
      }
    }
    verificar()
  }, [])

  const preguntaActual = PREGUNTAS[paso - 1]
  const todasRespondidas = PREGUNTAS.every(p => respuestas[p.id] !== undefined)

  const guardar = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('evaluaciones_quincenales').insert({
          user_id: user.id,
          rumiacion: respuestas.rumiacion,
          atencion_presente: respuestas.atencion_presente,
          capacidad_calma: respuestas.capacidad_calma,
          bienestar_general: respuestas.bienestar_general,
          created_at: new Date().toISOString(),
        })
      }
      setSaved(true)
      setPaso(5)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  // No disponible
  if (!disponible) {
    return (
      <div className="bg-white rounded-3xl p-6 max-w-sm mx-auto shadow-xl text-center">
        <span className="text-4xl block mb-3">⏰</span>
        <p className="font-black text-slate-800 text-lg mb-2">Evaluación no disponible</p>
        <p className="text-slate-500 text-sm leading-relaxed mb-4">
          Ya completaste tu evaluación reciente. Podrás hacer la siguiente en <strong>{diasRestantes} días</strong>.
        </p>
        <button onClick={onClose}
          className="w-full py-3 rounded-2xl text-white font-bold"
          style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>
          Entendido
        </button>
      </div>
    )
  }

  // Intro
  if (paso === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-6 max-w-sm mx-auto shadow-xl">
        <span className="text-4xl block mb-3">📋</span>
        <p className="font-black text-slate-800 text-xl mb-2">Evaluación quincenal</p>
        <p className="text-slate-600 text-sm leading-relaxed mb-4">
          Cada dos semanas te hacemos 4 preguntas cortas sobre cómo te has sentido. Solo tardarás 2 minutos.
        </p>
        <div className="bg-teal-50 rounded-2xl p-4 mb-5 space-y-2">
          {PREGUNTAS.map(p => (
            <div key={p.id} className="flex items-center gap-2 text-sm text-teal-700">
              <span>{p.emoji}</span>
              <span>{p.titulo}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={() => setPaso(1)}
            className="w-full py-3 rounded-2xl text-white font-bold flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>
            Empezar <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="text-slate-400 text-xs py-1">Ahora no</button>
        </div>
      </motion.div>
    )
  }

  // Fin
  if (paso === 5) {
    const puntuaciones = PREGUNTAS.map(p => ({
      ...p,
      valor: respuestas[p.id],
      valorAjustado: p.inversion ? 6 - respuestas[p.id] : respuestas[p.id],
    }))
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl p-6 max-w-sm mx-auto shadow-xl">
        <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
        <p className="font-black text-slate-800 text-xl mb-1">¡Evaluación completada!</p>
        <p className="text-slate-500 text-sm mb-5">Así están tus indicadores ahora mismo:</p>
        <div className="space-y-3 mb-5">
          {puntuaciones.map(p => (
            <div key={p.id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-600 flex items-center gap-1">
                  {p.emoji} {p.titulo}
                </span>
                <span className="text-sm font-black" style={{ color: p.color }}>{p.valor}/5</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${(p.valor / 5) * 100}%`, background: p.color }} />
              </div>
            </div>
          ))}
        </div>
        <button onClick={onClose}
          className="w-full py-3 rounded-2xl text-white font-bold"
          style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>
          Cerrar
        </button>
      </motion.div>
    )
  }

  // Preguntas 1-4
  return (
    <motion.div key={paso} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      className="bg-white rounded-3xl p-6 max-w-sm mx-auto shadow-xl">

      {/* Progreso */}
      <div className="flex gap-1.5 mb-5">
        {PREGUNTAS.map((_, i) => (
          <div key={i} className="flex-1 h-1.5 rounded-full transition-all"
            style={{ background: i < paso ? '#0f6b6b' : i === paso - 1 ? '#5eead4' : '#e2e8f0' }} />
        ))}
      </div>
      <p className="text-xs text-slate-400 mb-4">Pregunta {paso} de {PREGUNTAS.length}</p>

      <EscalaLikert
        pregunta={preguntaActual}
        value={respuestas[preguntaActual.id]}
        onChange={(v) => setRespuestas(prev => ({ ...prev, [preguntaActual.id]: v }))}
      />

      <div className="flex gap-2 mt-6">
        {paso > 1 && (
          <button onClick={() => setPaso(paso - 1)}
            className="px-4 py-3 rounded-2xl border border-slate-200 text-slate-500 font-medium text-sm">
            ← Atrás
          </button>
        )}
        {paso < PREGUNTAS.length ? (
          <button
            onClick={() => setPaso(paso + 1)}
            disabled={!respuestas[preguntaActual.id]}
            className="flex-1 py-3 rounded-2xl text-white font-bold disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>
            Siguiente <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={guardar}
            disabled={!todasRespondidas || saving}
            className="flex-1 py-3 rounded-2xl text-white font-bold disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>
            {saving ? 'Guardando...' : <><CheckCircle className="w-4 h-4" /> Guardar</>}
          </button>
        )}
      </div>
    </motion.div>
  )
}
