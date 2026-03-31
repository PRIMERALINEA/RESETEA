import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import { motion } from 'framer-motion'
import { Wind, Anchor, Heart, BookOpen, Brain, ChevronRight } from 'lucide-react'

const modules = [
  {
    path: '/respiracion',
    title: 'Respiración guiada',
    desc: 'Calma tu mente en 4 minutos',
    icon: Wind,
    color: 'from-blue-400 to-cyan-500',
    bg: 'bg-blue-50',
    emoji: '🌬️'
  },
  {
    path: '/anclajes',
    title: 'Técnicas de anclaje',
    desc: 'Vuelve al presente cuando te abrumas',
    icon: Anchor,
    color: 'from-indigo-400 to-purple-500',
    bg: 'bg-indigo-50',
    emoji: '⚓'
  },
  {
    path: '/relajacion',
    title: 'Relajación muscular',
    desc: 'Suelta la tensión del cuerpo',
    icon: Heart,
    color: 'from-rose-400 to-pink-500',
    bg: 'bg-rose-50',
    emoji: '💆'
  },
  {
    path: '/diario',
    title: 'Diario emocional',
    desc: 'Registra cómo te sientes hoy',
    icon: BookOpen,
    color: 'from-amber-400 to-orange-500',
    bg: 'bg-amber-50',
    emoji: '📓'
  },
  {
    path: '/test-estres',
    title: 'Test de estrés',
    desc: 'Evalúa tu nivel de ansiedad',
    icon: Brain,
    color: 'from-teal-400 to-green-500',
    bg: 'bg-teal-50',
    emoji: '🧠'
  },
]

export default function Home() {
  const { user } = useAuth()
  const hour = new Date().getHours()
  const greeting = hour < 13 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Saludo */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <p className="text-blue-400 text-sm font-medium">{greeting} 👋</p>
        <h1 className="text-2xl font-black text-blue-900 mt-1">¿Cómo estás hoy?</h1>
        <p className="text-slate-500 text-sm mt-1">Elige lo que necesitas ahora mismo</p>
      </motion.div>

      {/* Banner motivacional */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-3xl p-6 mb-8 text-white shadow-lg shadow-blue-200"
      >
        <p className="text-blue-200 text-xs font-semibold tracking-widest mb-1">RECUERDA</p>
        <p className="text-lg font-bold leading-snug">
          Tómate un momento para ti. Resetear es parte del aprendizaje. 💙
        </p>
      </motion.div>

      {/* Módulos */}
      <div className="space-y-3">
        {modules.map((mod, i) => (
          <motion.div
            key={mod.path}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.07 }}
          >
            <Link to={mod.path}>
              <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex items-center gap-4 border border-blue-50">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${mod.color} flex items-center justify-center text-2xl shadow-sm flex-shrink-0`}>
                  {mod.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800">{mod.title}</p>
                  <p className="text-sm text-slate-500 truncate">{mod.desc}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
