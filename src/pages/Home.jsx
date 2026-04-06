import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/api/supabaseClient'
import { ChevronRight, X, ClipboardList, AlertCircle, Zap } from 'lucide-react'
import EvaluacionQuincenal from '@/components/EvaluacionQuincenal'

const LOGO_URL = 'https://zbusdixrxedfhbkquafh.supabase.co/storage/v1/object/public/logo/WhatsApp%20Image%202026-04-06%20at%2015.58.04.jpeg'

const ESTADOS = [
  { valor: 0, label: 'Muy estresado/a',    emoji: '😱', color: '#dc2626', bg: '#fee2e2', semaforo: 'rojo' },
  { valor: 1, label: 'Bastante agobiado/a', emoji: '😰', color: '#dc2626', bg: '#fee2e2', semaforo: 'rojo' },
  { valor: 2, label: 'Algo nervioso/a',     emoji: '😟', color: '#ea580c', bg: '#ffedd5', semaforo: 'naranja' },
  { valor: 3, label: 'Un poco tenso/a',     emoji: '😐', color: '#ea580c', bg: '#ffedd5', semaforo: 'naranja' },
  { valor: 4, label: 'Bien',               emoji: '🙂', color: '#ca8a04', bg: '#fef9c3', semaforo: 'amarillo' },
  { valor: 5, label: '¡A tope!',           emoji: '😄', color: '#16a34a', bg: '#dcfce7', semaforo: 'verde' },
]

function SemaforoModal({ onSelect, onClose }) {
  const [selected, setSelected] = useState(null)
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-8"
      style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <p className="font-black text-slate-800 text-lg">¿Cómo estás ahora?</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-2 mb-5">
          {ESTADOS.map(estado => (
            <button key={estado.valor} onClick={() => setSelected(estado)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left"
              style={{ background: selected?.valor === estado.valor ? estado.bg : 'white', borderColor: selected?.valor === estado.valor ? estado.color : '#e2e8f0' }}>
              <span className="text-2xl">{estado.emoji}</span>
              <div className="flex-1">
                <span className="font-bold text-sm" style={{ color: selected?.valor === estado.valor ? estado.color : '#334155' }}>{estado.label}</span>
              </div>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-full" style={{ background: estado.semaforo === 'rojo'     ? '#dc2626' : '#e2e8f0' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: estado.semaforo === 'naranja'  ? '#ea580c' : '#e2e8f0' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: estado.semaforo === 'amarillo' ? '#ca8a04' : '#e2e8f0' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: estado.semaforo === 'verde'    ? '#16a34a' : '#e2e8f0' }} />
              </div>
            </button>
          ))}
        </div>
        <button onClick={() => selected && onSelect(selected)} disabled={!selected}
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
  const [mostrarSemaforo, setMostrarSemaforo]     = useState(false)
  const [estadoActual, setEstadoActual]           = useState(null)
  const [mostrarQuincenal, setMostrarQuincenal]   = useState(false)
  const [quinc, setQuinc]                         = useState(false)

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('evaluaciones_quincenales').select('created_at')
        .eq('user_id', user.id).order('created_at', { ascending: false }).limit(1)
      if (!data || data.length === 0) { setQuinc(true); return }
      const dias = Math.floor((Date.now() - new Date(data[0].created_at)) / (1000 * 60 * 60 * 24))
      if (dias >= 14) setQuinc(true)
    }
    check()
  }, [])

  const btnBg = estadoActual
    ? `linear-gradient(135deg, ${estadoActual.color}, ${estadoActual.color}bb)`
    : 'linear-gradient(135deg, #0d3d3d 0%, #0f6b6b 100%)'

  return (
    <div className="max-w-lg mx-auto">

      {/* Logo */}
      <motion.div className="flex justify-center mb-5"
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <img src={LOGO_URL} alt="Resetea" className="w-24 h-24 rounded-full object-cover shadow-xl border-4 border-white" />
      </motion.div>

      {/* Badge */}
      <motion.div className="flex justify-center mb-5"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md border border-teal-100">
          <img src={LOGO_URL} alt="" className="w-4 h-4 rounded-full object-cover" />
          <span className="text-xs font-semibold text-teal-700">100% Privado y Confidencial</span>
        </div>
      </motion.div>

      {/* Título */}
      <motion.div className="text-center mb-5"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
        <h1 className="text-2xl font-black mb-1" style={{ color: '#0d3d3d' }}>Tu espacio de calma</h1>
        <p className="text-slate-500 text-xs">RESETEA™ · Tu espacio de calma y conexión™</p>
      </motion.div>

      {/* ── SEMÁFORO EMOCIONAL ───────────────────────────────────────── */}
      <motion.div className="mb-4"
        initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}>
        <button onClick={() => setMostrarSemaforo(true)}
          className="w-full rounded-3xl p-5 text-left transition-all hover:opacity-95"
          style={{ background: btnBg }}>
          <p className="text-white/70 text-xs font-bold tracking-widest mb-1">{greeting.toUpperCase()} 👋</p>
          {estadoActual ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-xl font-black">{estadoActual.emoji} {estadoActual.label}</p>
                <p className="text-white/60 text-sm mt-0.5">Toca para actualizar</p>
              </div>
              <div className="flex flex-col gap-1.5 items-center bg-black/20 rounded-2xl px-3 py-3">
                <div className="w-5 h-5 rounded-full" style={{ background: estadoActual.semaforo === 'rojo'     ? '#dc2626' : 'rgba(255,255,255,0.2)', boxShadow: estadoActual.semaforo === 'rojo'     ? '0 0 10px #dc2626' : 'none' }} />
                <div className="w-5 h-5 rounded-full" style={{ background: estadoActual.semaforo === 'naranja'  ? '#ea580c' : 'rgba(255,255,255,0.2)', boxShadow: estadoActual.semaforo === 'naranja'  ? '0 0 10px #ea580c' : 'none' }} />
                <div className="w-5 h-5 rounded-full" style={{ background: estadoActual.semaforo === 'amarillo' ? '#ca8a04' : 'rgba(255,255,255,0.2)', boxShadow: estadoActual.semaforo === 'amarillo' ? '0 0 10px #ca8a04' : 'none' }} />
                <div className="w-5 h-5 rounded-full" style={{ background: estadoActual.semaforo === 'verde'    ? '#16a34a' : 'rgba(255,255,255,0.2)', boxShadow: estadoActual.semaforo === 'verde'    ? '0 0 10px #16a34a' : 'none' }} />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-xl font-black">¿Cómo te sientes hoy?</p>
                <p className="text-white/60 text-sm mt-0.5">Toca para indicar tu estado</p>
              </div>
              <div className="flex flex-col gap-1.5 items-center bg-black/20 rounded-2xl px-3 py-3">
                {[0,1,2,3].map(i => <div key={i} className="w-5 h-5 rounded-full bg-white/20" />)}
              </div>
            </div>
          )}
        </button>
      </motion.div>

      {/* ── ACCESOS RÁPIDOS: KIT + SOS ──────────────────────────────── */}
      <motion.div className="grid grid-cols-2 gap-3 mb-4"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>

        {/* Kit de emergencia */}
        <Link to="/kit-emergencia">
          <div className="rounded-2xl p-4 h-full flex flex-col justify-between shadow-md hover:shadow-lg transition-all"
            style={{ background: 'linear-gradient(135deg, #7f1d1d, #dc2626)' }}>
            <AlertCircle className="w-7 h-7 text-white mb-2" />
            <div>
              <p className="text-white font-black text-sm leading-tight">Kit de emergencia</p>
              <p className="text-white/60 text-xs mt-0.5">Ayuda inmediata</p>
            </div>
            <span className="text-2xl mt-2">🆘</span>
          </div>
        </Link>

        {/* SOS Examen */}
        <Link to="/sos-examen">
          <div className="rounded-2xl p-4 h-full flex flex-col justify-between shadow-md hover:shadow-lg transition-all"
            style={{ background: 'linear-gradient(135deg, #92400e, #b45309)' }}>
            <Zap className="w-7 h-7 text-white mb-2" />
            <div>
              <p className="text-white font-black text-sm leading-tight">SOS Examen</p>
              <p className="text-white/60 text-xs mt-0.5">9 técnicas rápidas</p>
            </div>
            <span className="text-2xl mt-2">🚨</span>
          </div>
        </Link>
      </motion.div>

      {/* ── BANNER QUINCENAL ─────────────────────────────────────────── */}
      <AnimatePresence>
        {quinc && !mostrarQuincenal && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-4 rounded-2xl p-4 flex items-center gap-3 cursor-pointer hover:opacity-90 transition-all"
            style={{ background: '#7c3aed15', border: '1px solid #7c3aed44' }}
            onClick={() => setMostrarQuincenal(true)}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#7c3aed20' }}>
              <ClipboardList className="w-5 h-5" style={{ color: '#7c3aed' }} />
            </div>
            <div className="flex-1">
              <p className="font-black text-sm" style={{ color: '#7c3aed' }}>📋 Evaluación quincenal disponible</p>
              <p className="text-slate-500 text-xs">2 minutos · Sigue tu progreso</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ACCESO AL MENÚ ──────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
        <div className="flex gap-2 flex-wrap flex-1">
          {['🌬️ Respiración', '⚓ Anclaje', '💆 Relajación', '📖 Módulos', '☀️ Rutinas', '📓 Diario'].map(item => (
            <span key={item} className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">{item}</span>
          ))}
        </div>
        <div className="flex-shrink-0 text-teal-600 text-xs font-bold">← Menú</div>
      </motion.div>

      {/* Modales */}
      <AnimatePresence>
        {mostrarQuincenal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)' }}>
            <EvaluacionQuincenal onClose={() => { setMostrarQuincenal(false); setQuinc(false) }} />
          </motion.div>
        )}
        {mostrarSemaforo && (
          <SemaforoModal onSelect={e => { setEstadoActual(e); setMostrarSemaforo(false) }}
            onClose={() => setMostrarSemaforo(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
