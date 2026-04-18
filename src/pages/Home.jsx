import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/api/supabaseClient'
import { ChevronRight, X, ClipboardList } from 'lucide-react'
import EvaluacionQuincenal from '@/components/EvaluacionQuincenal'

const LOGO_URL = 'https://zbusdixrxedfhbkquafh.supabase.co/storage/v1/object/public/logo/WhatsApp%20Image%202026-04-06%20at%2015.58.04.jpeg'

const ESTADOS = [
  { valor: 0, label: 'Muy estresado/a',     emoji: '😱', color: '#dc2626', bg: '#fee2e2', semaforo: 'rojo' },
  { valor: 1, label: 'Bastante agobiado/a', emoji: '😰', color: '#dc2626', bg: '#fee2e2', semaforo: 'rojo' },
  { valor: 2, label: 'Algo nervioso/a',     emoji: '😟', color: '#ea580c', bg: '#ffedd5', semaforo: 'naranja' },
  { valor: 3, label: 'Un poco tenso/a',     emoji: '😐', color: '#ea580c', bg: '#ffedd5', semaforo: 'naranja' },
  { valor: 4, label: 'Bien',                emoji: '🙂', color: '#ca8a04', bg: '#fef9c3', semaforo: 'amarillo' },
  { valor: 5, label: '¡A tope!',            emoji: '😄', color: '#16a34a', bg: '#dcfce7', semaforo: 'verde' },
]
const SEMAFORO_COLORS = { rojo: '#dc2626', naranja: '#ea580c', amarillo: '#ca8a04', verde: '#16a34a' }

// ── Todos los módulos agrupados ───────────────────────────────────────────
const MODULOS = [
  {
    grupo: '⚡ Ayuda inmediata',
    color: '#dc2626',
    bg: 'rgba(220,38,38,0.06)',
    borde: 'rgba(220,38,38,0.15)',
    items: [
      { emoji: '🆘', title: 'Kit de emergencia',    sub: 'Ayuda inmediata',          path: '/kit-emergencia',   gradient: 'linear-gradient(135deg, #b91c1c, #dc2626)' },
      { emoji: '⚡', title: 'Técnicas rápidas',     sub: '1-3 minutos',              path: '/tecnicas-rapidas', gradient: 'linear-gradient(135deg, #b45309, #d97706)' },
      { emoji: '🪜', title: 'Escalera de calmado',  sub: 'Baja la intensidad',       path: '/escalera-calmado', gradient: 'linear-gradient(135deg, #4338ca, #6366f1)' },
      { emoji: '🌿', title: 'Grounding 5-4-3-2-1',  sub: 'Vuelve al presente',       path: '/grounding',        gradient: 'linear-gradient(135deg, #065f46, #059669)' },
    ]
  },
  {
    grupo: '🌬️ Respiración & Anclaje',
    color: '#0d9488',
    bg: 'rgba(13,148,136,0.06)',
    borde: 'rgba(13,148,136,0.15)',
    items: [
      { emoji: '🌬️', title: 'Técnicas de respiración', sub: 'Guiada paso a paso',      path: '/respiracion', gradient: 'linear-gradient(135deg, #0d9488, #14b8a6)' },
      { emoji: '⚓',  title: 'Técnicas de anclaje',     sub: '5-4-3-2-1 y más',         path: '/anclajes',    gradient: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' },
      { emoji: '💆', title: 'Relajación muscular',      sub: 'Técnica de Jacobson',     path: '/relajacion',  gradient: 'linear-gradient(135deg, #9d174d, #ec4899)' },
    ]
  },
  {
    grupo: '📖 Módulos de ansiedad',
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.06)',
    borde: 'rgba(99,102,241,0.15)',
    items: [
      { emoji: '🚨', title: 'SOS Examen',              sub: '9 técnicas · Voz guiada',      path: '/sos-examen',         gradient: 'linear-gradient(135deg, #92400e, #b45309)' },
      { emoji: '🧠', title: 'Ansiedad y exámenes',     sub: '4 sesiones · Psicoeducación',  path: '/ansiedad-examenes',  gradient: 'linear-gradient(135deg, #4338ca, #6366f1)' },
      { emoji: '🫥', title: 'Me quedo en blanco',      sub: 'Protocolo + simulación',       path: '/quedo-en-blanco',    gradient: 'linear-gradient(135deg, #1e3a5f, #2d6a9f)' },
    ]
  },
  {
    grupo: '☀️ Rutinas & Bienestar',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.06)',
    borde: 'rgba(245,158,11,0.15)',
    items: [
      { emoji: '☀️', title: 'Rutinas diarias',     sub: 'Mañana, examen, noche',          path: '/rutinas',   gradient: 'linear-gradient(135deg, #92400e, #f59e0b)' },
      { emoji: '💚', title: 'Bienestar general',   sub: 'Hábitos, retos y plan',           path: '/bienestar', gradient: 'linear-gradient(135deg, #065f46, #10b981)' },
      { emoji: '❤️', title: 'Para familias',       sub: 'Guía de acompañamiento',          path: '/familias',  gradient: 'linear-gradient(135deg, #9d174d, #e11d48)' },
    ]
  },
  {
    grupo: '📓 Diario & Test',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.06)',
    borde: 'rgba(139,92,246,0.15)',
    items: [
      { emoji: '📓', title: 'Diario emocional',  sub: 'Registra cómo te sientes',  path: '/diario',      gradient: 'linear-gradient(135deg, #5b21b6, #7c3aed)' },
      { emoji: '📊', title: 'Test de estrés',    sub: 'Evalúa tu ansiedad',         path: '/test-estres', gradient: 'linear-gradient(135deg, #1e3a5f, #6366f1)' },
    ]
  },
]

function SemaforoModal({ onSelect, onClose }) {
  const [selected, setSelected] = useState(null)
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-8"
      style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
        className="w-full max-w-sm rounded-3xl shadow-2xl p-6 bg-white"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <p className="font-black text-lg" style={{ color: '#1a2744' }}>¿Cómo estás ahora?</p>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="space-y-2 mb-5">
          {ESTADOS.map(estado => (
            <button key={estado.valor} onClick={() => setSelected(estado)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left"
              style={{
                background: selected?.valor === estado.valor ? estado.bg : 'white',
                borderColor: selected?.valor === estado.valor ? estado.color : '#e2e8f0'
              }}>
              <span className="text-2xl">{estado.emoji}</span>
              <span className="font-bold text-sm flex-1"
                style={{ color: selected?.valor === estado.valor ? estado.color : '#334155' }}>
                {estado.label}
              </span>
              <div className="flex gap-1">
                {['rojo','naranja','amarillo','verde'].map(s => (
                  <div key={s} className="w-3 h-3 rounded-full"
                    style={{ background: estado.semaforo === s ? SEMAFORO_COLORS[s] : '#e2e8f0' }} />
                ))}
              </div>
            </button>
          ))}
        </div>
        <button onClick={() => selected && onSelect(selected)} disabled={!selected}
          className="w-full py-3 rounded-2xl text-white font-bold disabled:opacity-40"
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
  const greetingEmoji = hour < 13 ? '☀️' : hour < 20 ? '🌤️' : '🌙'

  const [mostrarSemaforo, setMostrarSemaforo]   = useState(false)
  const [estadoActual, setEstadoActual]         = useState(null)
  const [mostrarQuincenal, setMostrarQuincenal] = useState(false)
  const [quinc, setQuinc]                       = useState(false)

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

  return (
    <div className="max-w-lg mx-auto">

      {/* ── HEADER CARD ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-5 mb-4 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1a2744 0%, #2d4a6b 100%)' }}>
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #63d2be, transparent)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-28 h-28 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #a78bfa, transparent)', transform: 'translate(-30%, 30%)' }} />

        <div className="flex items-center justify-between mb-4 relative">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="Resetea"
              className="w-12 h-12 rounded-full object-cover shadow-lg border-2"
              style={{ borderColor: 'rgba(255,255,255,0.2)' }} />
            <div>
              <p className="font-black text-white text-lg tracking-tight">Resetea</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Tu espacio de calma y conexión</p>
            </div>
          </div>
          <span className="text-2xl">{greetingEmoji}</span>
        </div>

        <p className="text-xs font-bold tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {greeting.toUpperCase()} 👋
        </p>
        <p className="text-2xl font-black text-white mb-4">¿Cómo te sientes hoy?</p>

        <button onClick={() => setMostrarSemaforo(true)}
          className="w-full rounded-2xl p-3 flex items-center justify-between transition-all"
          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
          {estadoActual ? (
            <>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{estadoActual.emoji}</span>
                <div>
                  <p className="text-white font-bold text-sm">{estadoActual.label}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Toca para actualizar</p>
                </div>
              </div>
              <div className="flex gap-1.5">
                {['rojo','naranja','amarillo','verde'].map(s => (
                  <div key={s} className="w-4 h-4 rounded-full"
                    style={{ background: estadoActual.semaforo === s ? SEMAFORO_COLORS[s] : 'rgba(255,255,255,0.15)' }} />
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Toca para indicar tu estado
              </p>
              <div className="flex gap-1.5">
                {[0,1,2,3].map(i => <div key={i} className="w-4 h-4 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />)}
              </div>
            </>
          )}
        </button>
      </motion.div>

      {/* ── ACCESOS RÁPIDOS ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <p className="text-xs font-black tracking-widest mb-3" style={{ color: '#94a3b8' }}>⚡ ACCESO RÁPIDO</p>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { emoji: '🆘', title: 'Kit de emergencia', sub: 'Ayuda inmediata',    path: '/kit-emergencia',   gradient: 'linear-gradient(135deg, #b91c1c, #dc2626)' },
            { emoji: '🚨', title: 'SOS Examen',         sub: '9 técnicas rápidas', path: '/sos-examen',       gradient: 'linear-gradient(135deg, #92400e, #b45309)' },
            { emoji: '🌬️', title: 'Respiración',        sub: 'Calma al momento',   path: '/respiracion',      gradient: 'linear-gradient(135deg, #0d9488, #14b8a6)' },
            { emoji: '🪜', title: 'Escalera de calmado',sub: 'Baja la intensidad', path: '/escalera-calmado', gradient: 'linear-gradient(135deg, #4338ca, #6366f1)' },
          ].map((item, i) => (
            <motion.div key={item.path} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.05 }}>
              <Link to={item.path}>
                <div className="rounded-2xl p-4 shadow-md transition-all hover:scale-[1.02]"
                  style={{ background: item.gradient }}>
                  <span className="text-3xl block mb-2">{item.emoji}</span>
                  <p className="text-white font-black text-sm leading-tight">{item.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>{item.sub}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── BANNER QUINCENAL ── */}
      <AnimatePresence>
        {quinc && !mostrarQuincenal && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-5 rounded-2xl p-4 flex items-center gap-3 cursor-pointer transition-all hover:opacity-90"
            style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}
            onClick={() => setMostrarQuincenal(true)}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(124,58,237,0.15)' }}>
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

      {/* ── TODOS LOS MÓDULOS ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="space-y-4 mb-5">
        <p className="text-xs font-black tracking-widest" style={{ color: '#94a3b8' }}>📚 TODOS LOS MÓDULOS</p>

        {MODULOS.map((grupo, gi) => (
          <motion.div key={grupo.grupo}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 + gi * 0.06 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: grupo.bg, border: `1px solid ${grupo.borde}` }}>
            {/* Cabecera del grupo */}
            <div className="px-4 py-3 flex items-center gap-2">
              <p className="text-xs font-black tracking-wide" style={{ color: grupo.color }}>{grupo.grupo}</p>
            </div>
            {/* Items del grupo */}
            <div className="px-3 pb-3 grid grid-cols-1 gap-2">
              {grupo.items.map(item => (
                <Link key={item.path} to={item.path}>
                  <div className="flex items-center gap-3 p-3 rounded-xl transition-all hover:opacity-90"
                    style={{ background: item.gradient }}>
                    <span className="text-2xl flex-shrink-0">{item.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm leading-tight">{item.title}</p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.6)' }}>{item.sub}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.5)' }} />
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── BADGE PRIVACIDAD ── */}
      <motion.div className="flex justify-center mb-6"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border"
          style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
          <span className="text-sm">🔒</span>
          <span className="text-xs font-semibold text-slate-500">100% Privado y Confidencial</span>
        </div>
      </motion.div>

      {/* ── MODALES ── */}
      <AnimatePresence>
        {mostrarQuincenal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)' }}>
            <EvaluacionQuincenal onClose={() => { setMostrarQuincenal(false); setQuinc(false) }} />
          </motion.div>
        )}
        {mostrarSemaforo && (
          <SemaforoModal
            onSelect={e => { setEstadoActual(e); setMostrarSemaforo(false) }}
            onClose={() => setMostrarSemaforo(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
