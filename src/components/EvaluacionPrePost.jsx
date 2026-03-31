import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/api/supabaseClient'
import { ChevronRight, CheckCircle } from 'lucide-react'

// ── SLIDER DE MALESTAR ────────────────────────────────────────────────────────
function SliderMalestar({ value, onChange, label }) {
  const getColor = (v) => {
    if (v <= 3) return '#16a34a'
    if (v <= 6) return '#ca8a04'
    return '#dc2626'
  }
  const getEmoji = (v) => {
    if (v === 0) return '😌'
    if (v <= 2) return '🙂'
    if (v <= 4) return '😐'
    if (v <= 6) return '😟'
    if (v <= 8) return '😰'
    return '😱'
  }
  const color = getColor(value)

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getEmoji(value)}</span>
          <span className="text-2xl font-black" style={{ color }}>{value}</span>
          <span className="text-slate-400 text-sm">/10</span>
        </div>
      </div>
      <div className="relative">
        <input
          type="range" min="0" max="10" value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full h-3 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${color} 0%, ${color} ${value * 10}%, #e2e8f0 ${value * 10}%, #e2e8f0 100%)`,
            accentColor: color,
          }}
        />
        <div className="flex justify-between mt-1 px-0.5">
          {[0, 2, 4, 6, 8, 10].map(n => (
            <span key={n} className="text-xs text-slate-400">{n}</span>
          ))}
        </div>
      </div>
      <div className="flex justify-between mt-1 px-0.5">
        <span className="text-xs text-green-500 font-medium">Sin malestar</span>
        <span className="text-xs text-red-500 font-medium">Máximo malestar</span>
      </div>
    </div>
  )
}

// ── PREGUNTA ¿TE HA AYUDADO? ──────────────────────────────────────────────────
function PreguntaAyuda({ value, onChange }) {
  const opciones = [
    { id: 'si',   label: 'Sí, mucho',   emoji: '😌', color: '#16a34a', bg: '#dcfce7' },
    { id: 'algo', label: 'Un poco',      emoji: '🙂', color: '#ca8a04', bg: '#fef9c3' },
    { id: 'no',   label: 'No mucho',     emoji: '😐', color: '#dc2626', bg: '#fee2e2' },
  ]
  return (
    <div>
      <p className="text-sm font-medium text-slate-600 mb-3">¿Te ha ayudado a calmarte?</p>
      <div className="grid grid-cols-3 gap-2">
        {opciones.map(op => (
          <button key={op.id} onClick={() => onChange(op.id)}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all"
            style={{
              background: value === op.id ? op.bg : 'white',
              borderColor: value === op.id ? op.color : '#e2e8f0',
            }}>
            <span className="text-2xl">{op.emoji}</span>
            <span className="text-xs font-bold" style={{ color: value === op.id ? op.color : '#64748b' }}>
              {op.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
// Uso:
//   <EvaluacionPrePost
//     ejercicioId="escalera_calmado"
//     ejercicioNombre="Escalera de calmado"
//     modo="pre"                          // "pre" | "post"
//     malestarPre={7}                     // solo en modo post
//     onComplete={(datos) => ...}         // { malestarPre, malestarPost, haAyudado }
//     onSkip={() => ...}
//   />

export default function EvaluacionPrePost({
  ejercicioId,
  ejercicioNombre,
  modo = 'pre',
  malestarPre = null,
  onComplete,
  onSkip,
}) {
  const [malestar, setMalestar] = useState(modo === 'pre' ? 5 : malestarPre ?? 5)
  const [haAyudado, setHaAyudado] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const puedeGuardar = modo === 'pre'
    ? true
    : haAyudado !== null

  const guardar = async () => {
    if (modo === 'pre') {
      onComplete({ malestarPre: malestar })
      return
    }
    // Modo post: guardar en Supabase
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('evaluaciones_sesion').insert({
          user_id: user.id,
          ejercicio_id: ejercicioId,
          ejercicio_nombre: ejercicioNombre,
          malestar_pre: malestarPre,
          malestar_post: malestar,
          ha_ayudado: haAyudado,
          created_at: new Date().toISOString(),
        })
      }
      setSaved(true)
      onComplete({ malestarPost: malestar, haAyudado })
    } catch (e) {
      console.error(e)
      onComplete({ malestarPost: malestar, haAyudado })
    } finally {
      setSaving(false)
    }
  }

  const diferencia = modo === 'post' && malestarPre !== null ? malestarPre - malestar : null
  const mejoró = diferencia !== null && diferencia > 0

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, y: -16 }}
      className="w-full max-w-sm mx-auto"
    >
      <div className="bg-white rounded-3xl shadow-xl p-6 space-y-5">

        {/* Header */}
        <div>
          <p className="text-xs font-black tracking-widest text-teal-600 mb-1">
            {modo === 'pre' ? '📊 ANTES DE EMPEZAR' : '📊 AL TERMINAR'}
          </p>
          <p className="font-black text-slate-800 text-lg">
            {modo === 'pre'
              ? '¿Cómo estás ahora mismo?'
              : '¿Cómo te sientes ahora?'}
          </p>
          {modo === 'post' && diferencia !== null && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="mt-2 flex items-center gap-2">
              <span className="text-sm">
                {mejoró
                  ? `✅ Has bajado ${diferencia} punto${diferencia > 1 ? 's' : ''} tu malestar`
                  : diferencia === 0
                  ? '➡️ Tu malestar se mantiene igual'
                  : `⚠️ Tu malestar ha subido ${Math.abs(diferencia)} punto${Math.abs(diferencia) > 1 ? 's' : ''}`}
              </span>
            </motion.div>
          )}
        </div>

        {/* Slider */}
        <SliderMalestar
          value={malestar}
          onChange={setMalestar}
          label={modo === 'pre' ? 'Nivel de malestar ahora' : 'Nivel de malestar ahora'}
        />

        {/* Pregunta ayuda (solo post) */}
        {modo === 'post' && (
          <PreguntaAyuda value={haAyudado} onChange={setHaAyudado} />
        )}

        {/* Botones */}
        <div className="flex flex-col gap-2 pt-1">
          <button
            onClick={guardar}
            disabled={!puedeGuardar || saving}
            className="w-full py-3 rounded-2xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>
            {saving ? 'Guardando...' : modo === 'pre' ? <>Empezar el ejercicio <ChevronRight className="w-4 h-4" /></> : <>Guardar y cerrar <CheckCircle className="w-4 h-4" /></>}
          </button>
          <button onClick={onSkip}
            className="text-slate-400 text-xs hover:text-slate-600 transition-colors py-1">
            {modo === 'pre' ? 'Saltar evaluación' : 'Cerrar sin guardar'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
