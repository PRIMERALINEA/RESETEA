import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import { motion } from 'framer-motion'
import { Wind, Anchor, Heart, BookOpen, Brain, ChevronRight, Sparkles, ClipboardList } from 'lucide-react'
import { useState as useStateHome, useEffect as useEffectHome } from 'react'
import { supabase } from '@/api/supabaseClient'
import EvaluacionQuincenal from '@/components/EvaluacionQuincenal'

const LOGO_URL = 'https://zbusdixrxedfhbkquafh.supabase.co/storage/v1/object/public/logo/Gemini_Generated_Image_rar33drar33drar3.png'

const modules = [
  { path: '/respiracion', title: 'Respiración guiada', desc: 'Calma tu mente en 4 minutos', icon: Wind, color: 'from-teal-400 to-cyan-500', emoji: '🌬️', tag: 'Más usado' },
  { path: '/anclajes', title: 'Técnicas de anclaje', desc: 'Vuelve al presente cuando te abrumas', icon: Anchor, color: 'from-blue-400 to-indigo-500', emoji: '⚓', tag: null },
  { path: '/relajacion', title: 'Relajación muscular', desc: 'Suelta la tensión del cuerpo', icon: Heart, color: 'from-rose-400 to-pink-500', emoji: '💆', tag: null },
  { path: '/diario', title: 'Diario emocional', desc: 'Registra cómo te sientes hoy', icon: BookOpen, color: 'from-amber-400 to-orange-500', emoji: '📓', tag: null },
  { path: '/test-estres', title: 'Test de estrés', desc: 'Evalúa tu nivel de ansiedad', icon: Brain, color: 'from-violet-400 to-purple-500', emoji: '🧠', tag: null },
]

export default function Home() {
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
      const dias = Math.floor((Date.now() - new Date(data[0].created_at)) / (1000*60*60*24))
      if (dias >= 14) setQuinc(true)
    }
    check()
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 13 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches'
  const [showAll, setShowAll] = useState(false)

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div className="flex justify-center mb-6" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <img src={LOGO_URL} alt="Resetea" className="w-28 h-28 rounded-full object-cover shadow-xl border-4 border-white" />
      </motion.div>

      <motion.div className="flex justify-center mb-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="inline-flex items-center gap-2 bg-white px-5 py-2.5 rounded-full shadow-md border border-teal-100">
          <img src={LOGO_URL} alt="" className="w-5 h-5 rounded-full object-cover" />
          <span className="text-sm font-semibold text-teal-700">100% Privado y Confidencial</span>
        </div>
      </motion.div>

      <motion.div className="text-center mb-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <h1 className="text-3xl font-black mb-2" style={{ color: '#0d3d3d' }}>Tu espacio de calma</h1>
        <p className="text-slate-500 text-sm">Herramientas para gestionar el estrés y el bienestar emocional</p>
        <p className="text-xs text-teal-400 mt-2 tracking-widest font-medium">RESETEA™ · Tu espacio de calma y conexión™</p>
      </motion.div>

      <motion.div className="mb-6" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
        <div className="rounded-3xl p-6 text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #0d3d3d 0%, #0f6b6b 100%)' }}>
          <p className="text-teal-300 text-xs font-bold tracking-widest mb-1">{greeting.toUpperCase()} 👋</p>
          <p className="text-xl font-black leading-snug">¿Cómo te sientes hoy?</p>
          <p className="text-teal-200/70 text-sm mt-1">Elige lo que necesitas ahora mismo</p>
        </div>
      </motion.div>

      {/* Banner evaluación quincenal */}
      {quinc && !mostrarQuincenal && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="mb-4 rounded-2xl p-4 flex items-center gap-3 cursor-pointer hover:opacity-90 transition-all"
          style={{ background: 'linear-gradient(135deg, #7c3aed22, #0f6b6b22)', border: '1px solid #7c3aed44' }}
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
      {mostrarQuincenal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <EvaluacionQuincenal onClose={() => { setMostrarQuincenal(false); setQuinc(false) }} />
        </div>
      )}

      {!showAll ? (
        <>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <motion.div className="col-span-2" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
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
              <motion.div key={mod.path} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.07 }}>
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
            <motion.div key={mod.path} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
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
