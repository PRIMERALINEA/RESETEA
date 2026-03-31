import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Sun, Moon, BookOpen, ChevronRight, Play, CheckCircle } from 'lucide-react'

const RUTINAS = [
  {
    id: 'manana',
    nombre: 'Rutina de mañana',
    desc: 'Empieza el día con calma y enfoque',
    emoji: '🌅',
    icon: Sun,
    color: 'from-amber-400 to-orange-500',
    bg: '#fef3c7',
    duracion: '5 min',
    pasos: [
      { titulo: 'Respiración de activación', desc: 'Inhala profundo 5 veces. Cada exhala más larga que la inhala.', duracion: 60, emoji: '🌬️', accion: '/respiracion' },
      { titulo: 'Escaneo corporal rápido', desc: 'Cierra los ojos. ¿Cómo está tu cuerpo hoy? Sin juzgar, solo observa.', duracion: 60, emoji: '🧘' },
      { titulo: 'Intención del día', desc: 'Di mentalmente: "Hoy me propongo..." Elige UNA cosa.', duracion: 30, emoji: '🎯' },
      { titulo: 'Movimiento suave', desc: 'Estira los brazos, gira el cuello, sacude las manos. 1 minuto.', duracion: 60, emoji: '🤸' },
      { titulo: 'Frase de inicio', desc: '"Estoy listo/a para este día. Puedo con lo que venga."', duracion: 15, emoji: '💪' },
    ]
  },
  {
    id: 'examen',
    nombre: 'Antes del examen',
    desc: 'Prepara tu mente para el máximo rendimiento',
    emoji: '📝',
    icon: BookOpen,
    color: 'from-teal-400 to-cyan-500',
    bg: '#ccfbf1',
    duracion: '5 min',
    pasos: [
      { titulo: 'Para la espiral de pensamientos', desc: 'Estás nervioso/a. Es normal. El nerviosismo activa tu cerebro. Respira 3 veces profundo.', duracion: 30, emoji: '🧠' },
      { titulo: 'Respiración cuadrada', desc: 'Inhala 4s · Retén 4s · Exhala 4s · Pausa 4s. Repite 4 veces.', duracion: 90, emoji: '⬜', accion: '/respiracion/cuadrada' },
      { titulo: 'Grounding rápido', desc: 'Nombra 3 cosas que ves, 2 que sientes en tu cuerpo, 1 que escuchas.', duracion: 60, emoji: '🌱' },
      { titulo: 'Afirmación de confianza', desc: '"He estudiado. Estoy preparado/a. Voy a hacer lo mejor que puedo."', duracion: 20, emoji: '✨' },
      { titulo: 'Activa el modo enfoque', desc: 'Coloca las manos sobre la mesa. Respira. Di: "Empiezo ahora."', duracion: 20, emoji: '🎯' },
    ]
  },
  {
    id: 'noche',
    nombre: 'Rutina de noche',
    desc: 'Suelta el día y prepárate para descansar',
    emoji: '🌙',
    icon: Moon,
    color: 'from-indigo-400 to-violet-500',
    bg: '#ede9fe',
    duracion: '7 min',
    pasos: [
      { titulo: 'Descarga emocional', desc: 'Escribe o di en voz alta: ¿Qué ha sido lo más difícil hoy? Solo nombrarlo ayuda.', duracion: 60, emoji: '📓', accion: '/diario' },
      { titulo: '3 cosas buenas', desc: 'Piensa en 3 cosas positivas que han pasado hoy, aunque sean pequeñas.', duracion: 45, emoji: '✨' },
      { titulo: 'Relajación muscular', desc: 'Tensa y suelta hombros, cara, manos. Suelta la tensión del día.', duracion: 120, emoji: '💆', accion: '/relajacion/jacobson' },
      { titulo: 'Respiración para dormir', desc: 'Inhala 4s · Retén 7s · Exhala 8s. Repite 4 veces. Activa el sueño.', duracion: 90, emoji: '🌙', accion: '/respiracion' },
      { titulo: 'Suelta el día', desc: '"El día ha terminado. Mañana es otro día. Ahora descanso."', duracion: 20, emoji: '🌛' },
    ]
  },
]

function RutinaEjercicio({ rutina, onBack }) {
  const [pasoIdx, setPasoIdx] = useState(0)
  const [counter, setCounter] = useState(null)
  const [activo, setActivo] = useState(false)
  const [completados, setCompletados] = useState([])
  const [finalizado, setFinalizado] = useState(false)
  const navigate = useNavigate()
  const timerRef = React.useRef(null)

  const paso = rutina.pasos[pasoIdx]

  const iniciarTemporizador = () => {
    if (activo) return
    setActivo(true)
    setCounter(paso.duracion)
    timerRef.current = setInterval(() => {
      setCounter(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          setActivo(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const siguientePaso = () => {
    clearInterval(timerRef.current)
    setActivo(false)
    setCompletados(prev => [...prev, pasoIdx])
    if (pasoIdx < rutina.pasos.length - 1) {
      setPasoIdx(pasoIdx + 1)
      setCounter(null)
    } else {
      setFinalizado(true)
    }
  }

  if (finalizado) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6"
        style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center flex flex-col items-center gap-4">
          <CheckCircle className="w-16 h-16 text-green-400" />
          <p className="text-white text-2xl font-black">¡Rutina completada! {rutina.emoji}</p>
          <p className="text-white/60 text-sm max-w-xs">Has completado los {rutina.pasos.length} pasos de tu rutina de {rutina.nombre.toLowerCase()}.</p>
          <button onClick={onBack}
            className="px-8 py-3 rounded-2xl text-white font-bold mt-2"
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
            Volver a rutinas
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4" style={{ background: '#f0f9f9' }}>
      <button onClick={onBack} className="flex items-center gap-2 text-teal-600 font-medium mb-6 mt-2">
        <ChevronRight className="w-4 h-4 rotate-180" /> Volver
      </button>

      {/* Header rutina */}
      <div className={`bg-gradient-to-r ${rutina.color} rounded-3xl p-5 mb-6 text-white`}>
        <p className="text-white/70 text-xs font-bold tracking-widest">{rutina.nombre.toUpperCase()}</p>
        <p className="font-black text-xl mt-1">Paso {pasoIdx + 1} de {rutina.pasos.length}</p>
        <div className="flex gap-1.5 mt-3">
          {rutina.pasos.map((_, i) => (
            <div key={i} className="h-1.5 flex-1 rounded-full"
              style={{ background: completados.includes(i) ? 'rgba(255,255,255,0.9)' : i === pasoIdx ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)' }} />
          ))}
        </div>
      </div>

      {/* Paso actual */}
      <AnimatePresence mode="wait">
        <motion.div key={pasoIdx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
          className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-4">
          <span className="text-4xl block mb-3">{paso.emoji}</span>
          <p className="font-black text-slate-800 text-lg mb-2">{paso.titulo}</p>
          <p className="text-slate-600 text-sm leading-relaxed mb-5">{paso.desc}</p>

          {/* Temporizador */}
          <div className="flex items-center gap-3 mb-4">
            <button onClick={iniciarTemporizador} disabled={activo}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>
              <Play className="w-4 h-4" />
              {activo ? `${counter}s` : counter === 0 ? '✓ Listo' : `Iniciar ${paso.duracion}s`}
            </button>
            {paso.accion && (
              <button onClick={() => navigate(paso.accion)}
                className="px-4 py-2 rounded-xl border border-teal-200 text-teal-600 text-sm font-medium">
                Ver ejercicio →
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <button onClick={siguientePaso}
        className="w-full py-4 rounded-2xl text-white font-bold shadow-lg"
        style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>
        {pasoIdx < rutina.pasos.length - 1 ? 'Siguiente paso →' : 'Completar rutina ✓'}
      </button>
    </div>
  )
}

export default function Rutinas() {
  const [selected, setSelected] = useState(null)

  if (selected) {
    return <RutinaEjercicio rutina={selected} onBack={() => setSelected(null)} />
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
          <Sun className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black" style={{ color: '#0d3d3d' }}>Rutinas de bienestar</h1>
          <p className="text-slate-500 text-sm">Hábitos que marcan la diferencia</p>
        </div>
      </div>

      <div className="space-y-4">
        {RUTINAS.map((rutina, i) => (
          <motion.div key={rutina.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <button onClick={() => setSelected(rutina)} className="w-full text-left">
              <div className="bg-white rounded-3xl p-5 shadow-sm hover:shadow-md transition-all border border-slate-100">
                <div className={`bg-gradient-to-r ${rutina.color} rounded-2xl p-4 mb-4`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-black text-lg">{rutina.emoji} {rutina.nombre}</p>
                      <p className="text-white/70 text-sm">{rutina.desc}</p>
                    </div>
                    <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {rutina.duracion}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {rutina.pasos.map((paso, j) => (
                    <div key={j} className="flex items-center gap-2 text-sm text-slate-500">
                      <span>{paso.emoji}</span>
                      <span className="truncate">{paso.titulo}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs text-slate-400">{rutina.pasos.length} pasos guiados</p>
                  <div className="flex items-center gap-1 text-teal-600 text-sm font-bold">
                    Iniciar <ChevronRight className="w-4 h-4" />
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
