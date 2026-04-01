import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/api/supabaseClient'
import { Wind, Anchor, Heart, BookOpen, Brain, ChevronRight, Sparkles, X, ClipboardList } from 'lucide-react'
import EvaluacionQuincenal from '@/components/EvaluacionQuincenal'

const LOGO_URL = 'https://zbusdixrxedfhbkquafh.supabase.co/storage/v1/object/public/logo/Gemini_Generated_Image_rar33drar33drar3.png'

const modules = [
  { path: '/respiracion', title: 'Respiración guiada', desc: 'Calma tu mente en 4 minutos', color: 'from-teal-400 to-cyan-500', emoji: '🌬️', tag: 'Más usado' },
  { path: '/anclajes', title: 'Técnicas de anclaje', desc: 'Vuelve al presente cuando te abrumas', color: 'from-blue-400 to-indigo-500', emoji: '⚓', tag: null },
  { path: '/relajacion', title: 'Relajación muscular', desc: 'Suelta la tensión del cuerpo', color: 'from-rose-400 to-pink-500', emoji: '💆', tag: null },
  { path: '/diario', title: 'Diario emocional', desc: 'Registra cómo te sientes hoy', color: 'from-amber-400 to-orange-500', emoji: '📓', tag: null },
  { path: '/test-estres', title: 'Test de estrés', desc: 'Evalúa tu nivel de ansiedad', color: 'from-violet-400 to-purple-500', emoji: '🧠', tag: null },
]

const ESTADOS = [
  { valor: 0, label: 'Muy estresado/a', emoji: '😱', color: '#dc2626', bg: '#fee2e2', semaforo: 'rojo' },
  { valor: 1, label: 'Bastante agobiado/a', emoji: '😰', color: '#dc2626', bg: '#fee2e2', semaforo: 'rojo' },
  { valor: 2, label: 'Algo nervioso/a', emoji: '😟', color: '#ea580c', bg: '#ffedd5', semaforo: 'naranja' },
  { valor: 3, label: 'Un poco tenso/a', emoji: '😐', color: '#ea580c', bg: '#ffedd5', semaforo: 'naranja' },
  { valor: 4, label: 'Bien', emoji: '🙂', color: '#ca8a04', bg: '#fef9c3', semaforo: 'amarillo' },
  { valor: 5, label: '¡A tope!', emoji: '😄', color: '#16a34a', bg: '#dcfce7', semaforo: 'verde' },
]

function SemaforoModal({ onSelect, onClose }) {
  const [selected, setSelected] = useState(null)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-8"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}>
      <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6"
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-5">
          <p className="font-black text-slate-800 text-lg">¿Cómo estás ahora?</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 mb-5">
          {ESTADOS.map((estado) => (
            <button key={estado.valor} onClick={() => setSelected(estado)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left"
              style={{
                background: selected?.valor === estado.valor ? estado.bg : 'white',
                borderColor: selected?.valor === estado.valor ? estado.color : '#e2e8f0',
              }}>
              <span className="text-2xl">{estado.emoji}</span>
              <div className="flex-1">
                <span className="font-bold text-sm" style={{ color: selected?.valor === estado.valor ? estado.color : '#334155' }}>
                  {estado.label}
                </span>
              </div>
              {/* Indicador semáforo */}
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-full" style={{ background: estado.semaforo === 'rojo' ? '#dc2626' : '#e2e8f0' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: estado.semaforo === 'naranja' ? '#ea580c' : '#e2e8f0' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: estado.semaforo === 'amarillo' ? '#ca8a04' : '#e2e8f0' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: estado.semaforo === 'verde' ? '#16a34a' : '#e2e8f0' }} />
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => selected && onSelect(selected)}
          disabled={!selected}
          className="w-full py-3 rounded-2xl text-white font-bold disabled:opacity-40 transition-all"
          style={{ background: selected ? `linear-gradient(135deg, ${selected.color}, ${selected.color}bb)` : '#94a3b8' }}>
          {selected ? `Confirmar · ${selected.emoji} ${selected.label}` : 'Selecciona cómo estás'}
        </button>
      </motion.div>
    </motion.div>
  )
}

export default function Home() {
  const hour = new Date().getHours()
  const greeting = hour < 13 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches'
  const [showAll, setShowAll] = useState(false)
  const [mostrarSemaforo, setMostrarSemaforo] = useState(false)
  const [estadoActual, setEstadoActual] = useState(null)
  const [mostrarQuincenal, setMostrarQuincenal] = useState(false)
  const [quinc, setQuinc] = useState(false)

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('evaluaciones_quincenales')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
      if (!data || data.length === 0) { setQuinc(true); return }
      const dias = Math.floor((Date.now() - new Date(data[0].created_at)) / (1000 * 60 * 60 * 24))
      if (dias >= 14) setQuinc(true)
    }
    check()
  }, [])

  const handleSelectEstado = (estado) => {
    setEstadoActual(estado)
    setMostrarSemaforo(false)
  }

  // Color del botón según estado
  const btnBg = estadoActual
    ? `linear-gradient(135deg, ${estadoActual.color}, ${estadoActual.color}bb)`
    : 'linear-gradient(135deg, #0d3d3d 0%, #0f6b6b 100%)'

  return (
    <div className="max-w-2xl mx-auto">

      {/* Logo */}
      <motion.div className="flex justify-center mb-6"
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <img src={LOGO_URL} alt="Resetea"
          className="w-28 h-28 rounded-full object-cover shadow-xl border-4 border-white" />
      </motion.div>

      {/* Badge */}
      <motion.div className="flex justify-center mb-6"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="inline-flex items-center gap-2 bg-white px-5 py-2.5 rounded-full shadow-md border border-teal-100">
          <img src={LOGO_URL} alt="" className="w-5 h-5 rounded-full object-cover" />
          <span className="text-sm font-semibold text-teal-700">100% Privado y Confidencial</span>
        </div>
      </motion.div>

      {/* Título */}
      <motion.div className="text-center mb-6"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <h1 className="text-3xl font-black mb-2" style={{ color: '#0d3d3d' }}>Tu espacio de calma</h1>
        <p className="text-slate-500 text-sm">Herramientas para gestionar el estrés y el bienestar emocional</p>
        <p className="text-xs text-teal-400 mt-2 tracking-widest font-medium">RESETEA™ · Tu espacio de calma y conexión™</p>
      </motion.div>

      {/* Botón semáforo emocional */}
      <motion.div className="mb-6"
        initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
        <button onClick={() => setMostrarSemaforo(true)}
          className="w-full rounded-3xl p-6 text-left transition-all hover:opacity-95 active:scale-98"
          style={{ background: btnBg }}>
          <p className="text-white/70 text-xs font-bold tracking-widest mb-1">{greeting.toUpperCase()} 👋</p>
          {estadoActual ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-xl font-black">{estadoActual.emoji} {estadoActual.label}</p>
                <p className="text-white/60 text-sm mt-1">Toca para actualizar cómo te sientes</p>
              </div>
              {/* Semáforo visual */}
              <div className="flex flex-col gap-1.5 items-center bg-black/20 rounded-2xl px-3 py-3">
                <div className="w-5 h-5 rounded-full transition-all"
                  style={{ background: estadoActual.semaforo === 'rojo' ? '#dc2626' : 'rgba(255,255,255,0.2)', boxShadow: estadoActual.semaforo === 'rojo' ? '0 0 10px #dc2626' : 'none' }} />
                <div className="w-5 h-5 rounded-full transition-all"
                  style={{ background: estadoActual.semaforo === 'naranja' ? '#ea580c' : 'rgba(255,255,255,0.2)', boxShadow: estadoActual.semaforo === 'naranja' ? '0 0 10px #ea580c' : 'none' }} />
                <div className="w-5 h-5 rounded-full transition-all"
                  style={{ background: estadoActual.semaforo === 'amarillo' ? '#ca8a04' : 'rgba(255,255,255,0.2)', boxShadow: estadoActual.semaforo === 'amarillo' ? '0 0 10px #ca8a04' : 'none' }} />
                <div className="w-5 h-5 rounded-full transition-all"
                  style={{ background: estadoActual.semaforo === 'verde' ? '#16a34a' : 'rgba(255,255,255,0.2)', boxShadow: estadoActual.semaforo === 'verde' ? '0 0 10px #16a34a' : 'none' }} />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-xl font-black">¿Cómo te sientes hoy?</p>
                <p className="text-white/60 text-sm mt-1">Toca para indicar tu estado</p>
              </div>
              <div className="flex flex-col gap-1.5 items-center bg-black/20 rounded-2xl px-3 py-3">
                <div className="w-5 h-5 rounded-full bg-white/20" />
                <div className="w-5 h-5 rounded-full bg-white/20" />
                <div className="w-5 h-5 rounded-full bg-white/20" />
                <div className="w-5 h-5 rounded-full bg-white/20" />
              </div>
            </div>
          )}
        </button>
      </motion.div>

      {/* Banner evaluación quincenal */}
      {quinc && !mostrarQuincenal && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="mb-4 rounded-2xl p-4 flex items-center gap-3 cursor-pointer hover:opacity-90 transition-all"
          style={{ background: '#7c3aed15', border: '1px solid #7c3aed44' }}
          onClick={() => setMostrarQuincenal(true)}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#7c3aed20' }}>
            <ClipboardList className="w-5 h-5" style={{ color: '#7c3aed' }} />
          </div>
          <div className="flex-1">
            <p className="font-black text-sm" style={{ color: '#7c3aed' }}>📋 Evaluación quincenal disponible</p>
            <p className="text-slate-500 text-xs">2 minutos · Ayuda a seguir tu progreso</p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </motion.div>
      )}

      {/* Modal evaluación quincenal */}
      <AnimatePresence>
        {mostrarQuincenal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)' }}>
            <EvaluacionQuincenal onClose={() => { setMostrarQuincenal(false); setQuinc(false) }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal semáforo */}
      <AnimatePresence>
        {mostrarSemaforo && (
          <SemaforoModal onSelect={handleSelectEstado} onClose={() => setMostrarSemaforo(false)} />
        )}
      </AnimatePresence>

      {/* Módulos */}
      {!showAll ? (
        <>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <motion.div className="col-span-2"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Link to={modules[0].path}>
                <div className={`bg-gradient-to-br ${modules[0].color} rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full mb-2 inline-block">⭐ {modules[0].tag}</span>
                      <p className="text-white font-black text-xl">{modules[0].title}</p>
                      <p className="text-white/70 text-sm mt-1">{modules[0].desc}</p>
                    </div>
                    <span className="text-5xl">{modules[0].emoji}</span>
                  </div>
                </div>
              </Link>
            </motion.div>
            {modules.slice(1, 3).map((mod, i) => (
              <motion.div key={mod.path}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.07 }}>
                <Link to={mod.path}>
                  <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all border border-slate-100 h-full">
                    <span className="text-3xl mb-2 block">{mod.emoji}</span>
                    <p className="font-bold text-slate-800 text-sm">{mod.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{mod.desc}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            onClick={() => setShowAll(true)}
            className="w-full py-4 rounded-2xl font-bold text-white shadow-lg flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>
            <Sparkles className="w-5 h-5" />
            Ver todas las herramientas
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </>
      ) : (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-black text-lg" style={{ color: '#0d3d3d' }}>Todas las herramientas</h2>
            <button onClick={() => setShowAll(false)} className="text-sm text-teal-600 font-medium">Ocultar</button>
          </div>
          {modules.map((mod, i) => (
            <motion.div key={mod.path}
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
              <Link to={mod.path}>
                <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all border border-slate-100 flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${mod.color} flex items-center justify-center text-2xl flex-shrink-0`}>
                    {mod.emoji}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">{mod.title}</p>
                    <p className="text-sm text-slate-500">{mod.desc}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
