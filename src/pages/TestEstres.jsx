import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/api/supabaseClient'
import { Brain, ChevronRight, RotateCcw } from 'lucide-react'

const PREGUNTAS = [
  'Me he sentido nervioso/a, ansioso/a o muy alterado/a',
  'No he podido dejar de preocuparme o controlar mis preocupaciones',
  'Me he preocupado demasiado por diferentes cosas',
  'He tenido dificultad para relajarme',
  'Me he sentido tan inquieto/a que no podía quedarme quieto/a',
  'Me he irritado o enfadado fácilmente',
  'He sentido miedo de que algo terrible pudiera pasar',
]

const OPCIONES = [
  { valor: 0, label: 'Nunca', color: 'bg-green-100 border-green-300 text-green-700' },
  { valor: 1, label: 'Algunos días', color: 'bg-yellow-100 border-yellow-300 text-yellow-700' },
  { valor: 2, label: 'Más de la mitad', color: 'bg-orange-100 border-orange-300 text-orange-700' },
  { valor: 3, label: 'Casi siempre', color: 'bg-red-100 border-red-300 text-red-700' },
]

const getResult = (score) => {
  if (score <= 4) return { label: 'Ansiedad mínima', color: 'text-green-600', bg: 'bg-green-50 border-green-200', emoji: '😌', advice: 'Tu nivel de estrés es bajo. Sigue cuidándote con las herramientas de bienestar.' }
  if (score <= 9) return { label: 'Ansiedad leve', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', emoji: '😐', advice: 'Tienes algo de ansiedad. Los ejercicios de respiración y relajación te ayudarán.' }
  if (score <= 14) return { label: 'Ansiedad moderada', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', emoji: '😟', advice: 'Tu ansiedad es moderada. Practica las técnicas de la app y considera hablar con el orientador de tu centro.' }
  return { label: 'Ansiedad severa', color: 'text-red-600', bg: 'bg-red-50 border-red-200', emoji: '😰', advice: 'Tu nivel de ansiedad es elevado. Te recomendamos hablar con el psicólogo u orientador de tu centro lo antes posible.' }
}

export default function TestEstres() {
  const [preguntaIdx, setPreguntaIdx] = useState(-1)
  const [respuestas, setRespuestas] = useState({})
  const [resultado, setResultado] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const responder = (valor) => {
    const nuevas = { ...respuestas, [preguntaIdx]: valor }
    setRespuestas(nuevas)
    if (preguntaIdx < PREGUNTAS.length - 1) {
      setTimeout(() => setPreguntaIdx(preguntaIdx + 1), 300)
    } else {
      const total = Object.values(nuevas).reduce((a, b) => a + b, 0)
      setResultado({ score: total, ...getResult(total) })
    }
  }

  const saveResult = async () => {
    if (saving || saved || !resultado) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Obtener centro_id del perfil del alumno
      const { data: perfil } = await supabase
        .from('perfiles_alumnos')
        .select('centro_id')
        .eq('user_id', user.id)
        .single()

      await supabase.from('test_estres').insert({
        user_id: user.id,
        centro_id: perfil?.centro_id || null,
        tipo: 'gad7_adaptado',
        puntuacion: resultado.score,
        nivel: resultado.label,
        respuestas,
        created_at: new Date().toISOString()
      })
      setSaved(true)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const reset = () => {
    setPreguntaIdx(-1)
    setRespuestas({})
    setResultado(null)
    setSaved(false)
  }

  if (preguntaIdx === -1) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <img src="https://zbusdixrxedfhbkquafh.supabase.co/storage/v1/object/public/logo/WhatsApp%20Image%202026-04-06%20at%2015.58.04.jpeg"
            alt="Resetea" className="w-10 h-10 rounded-full object-cover shadow-md flex-shrink-0" />
          <div>
            <h1 className="text-xl font-black text-blue-900">Test de estrés</h1>
            <p className="text-slate-500 text-sm">¿Cómo llevas la ansiedad esta semana?</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-blue-50 mb-6">
          <p className="font-bold text-slate-800 mb-2">Sobre este test</p>
          <p className="text-slate-600 text-sm leading-relaxed">
            Son 7 preguntas sobre cómo te has sentido en los <strong>últimos 7 días</strong>. No hay respuestas correctas o incorrectas. Tus resultados son privados y solo los ves tú.
          </p>
          <p className="text-xs text-slate-400 mt-3">⏱ Menos de 2 minutos</p>
        </div>

        <button onClick={() => setPreguntaIdx(0)}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-green-600 text-white font-bold text-lg shadow-lg hover:opacity-90 transition-opacity">
          Empezar test
        </button>
      </div>
    )
  }

  if (resultado) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div className={`rounded-3xl p-6 border-2 ${resultado.bg} mb-6 text-center`}>
            <p className="text-5xl mb-3">{resultado.emoji}</p>
            <p className={`text-2xl font-black ${resultado.color}`}>{resultado.label}</p>
            <p className="text-4xl font-black text-slate-800 mt-2">{resultado.score}<span className="text-lg font-normal text-slate-400">/21</span></p>
            <p className="text-slate-600 text-sm mt-4 leading-relaxed">{resultado.advice}</p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-blue-50 mb-4">
            <p className="font-bold text-slate-800 text-sm mb-3">¿Qué puedes hacer ahora?</p>
            <div className="space-y-2 text-sm text-slate-600">
              <p>🌬️ Prueba un ejercicio de respiración</p>
              <p>⚓ Usa una técnica de anclaje si te sientes abrumado/a</p>
              <p>💆 Haz la relajación muscular antes de dormir</p>
              {resultado.score >= 10 && <p className="text-orange-600 font-medium">💬 Habla con el orientador de tu centro</p>}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={reset}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-500 text-sm font-medium flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4" /> Repetir
            </button>
            <button onClick={saveResult} disabled={saving}
              className={`flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 ${saved ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700'} disabled:opacity-50`}>
              {saving ? 'Guardando...' : saved ? '✓ Guardado' : '💾 Guardar resultado'}
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  const progress = ((preguntaIdx + 1) / PREGUNTAS.length) * 100
  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>Pregunta {preguntaIdx + 1} de {PREGUNTAS.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div className="h-full bg-gradient-to-r from-teal-400 to-green-500 rounded-full"
            animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
        </div>
      </div>

      <p className="text-xs text-slate-400 mb-2 tracking-widest">DURANTE LOS ÚLTIMOS 7 DÍAS...</p>

      <AnimatePresence mode="wait">
        <motion.div key={preguntaIdx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
          <p className="text-xl font-bold text-slate-800 mb-8 leading-snug">{PREGUNTAS[preguntaIdx]}</p>
          <div className="space-y-3">
            {OPCIONES.map(op => (
              <button key={op.valor} onClick={() => responder(op.valor)}
                className={`w-full py-4 px-5 rounded-2xl border-2 text-left font-medium transition-all hover:scale-[1.02] ${op.color}`}>
                {op.label}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
