import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Wind, Anchor, Zap, Heart, X, ChevronRight } from 'lucide-react'

const KIT_ITEMS = [
  {
    id: 'respira',
    titulo: 'RESPIRA AHORA',
    subtitulo: '30 segundos · Efecto inmediato',
    emoji: '🌬️',
    color: '#0f6b6b',
    instruccion: [
      'Inhala por la nariz contando hasta 4',
      'Retén el aire 4 segundos',
      'Exhala muy lento por la boca, 6 segundos',
      'Repite 3 veces',
    ],
    accion: '/respiracion'
  },
  {
    id: 'grounding',
    titulo: 'ANCLA AL PRESENTE',
    subtitulo: '1 minuto · Para el bloqueo mental',
    emoji: '🖐️',
    color: '#1e40af',
    instruccion: [
      'Mira a tu alrededor',
      'Nombra en voz alta o mentalmente:',
      '5 cosas que ves · 4 que tocas · 3 que oyes',
      'Esto te saca del bucle de pensamientos',
    ],
    accion: '/anclajes'
  },
  {
    id: 'frase',
    titulo: 'FRASE DE ANCLAJE',
    subtitulo: 'Instantáneo · Para la ansiedad',
    emoji: '💬',
    color: '#6d28d9',
    instruccion: [
      'Di esto en voz alta o mentalmente:',
      '"Esto es temporal. Puedo con ello."',
      '"No tengo que ser perfecto/a. Solo tengo que intentarlo."',
      '"Este momento pasará. Estoy a salvo."',
    ],
    accion: null
  },
  {
    id: 'frio',
    titulo: 'RESET CON FRÍO',
    subtitulo: '30 segundos · Activa el nervio vago',
    emoji: '❄️',
    color: '#0e7490',
    instruccion: [
      'Pon las muñecas bajo agua fría del grifo',
      'O sostén algo frío (botella, hielo)',
      'Concéntrate SOLO en esa sensación',
      'El frío activa el sistema nervioso parasimpático',
    ],
    accion: null
  },
  {
    id: 'movimiento',
    titulo: 'MUEVE EL CUERPO',
    subtitulo: '1 minuto · Para el estrés acumulado',
    emoji: '🤸',
    color: '#b45309',
    instruccion: [
      'Sacude las manos y brazos 15 segundos',
      'Da 10 saltos suaves en el sitio',
      'Gira el cuello lentamente derecha e izquierda',
      'El movimiento libera cortisol y adrenalina',
    ],
    accion: null
  },
]

function KitItem({ item, onClose }) {
  const navigate = useNavigate()
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-8"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
        style={{ background: item.color }}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/60 text-xs tracking-widest">{item.subtitulo}</p>
              <p className="text-white font-black text-xl">{item.titulo}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-4xl">{item.emoji}</span>
              <button onClick={onClose} className="text-white/40 hover:text-white ml-2">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            {item.instruccion.map((linea, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-white/40 text-sm font-bold mt-0.5">{i + 1}.</span>
                <p className="text-white/90 text-sm leading-relaxed">{linea}</p>
              </div>
            ))}
          </div>

          {item.accion && (
            <button onClick={() => { onClose(); navigate(item.accion) }}
              className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}>
              Ver ejercicio completo <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function KitEmergencia() {
  const [selected, setSelected] = useState(null)

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}>
          <AlertCircle className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black" style={{ color: '#0d3d3d' }}>Kit de emergencia</h1>
          <p className="text-slate-500 text-sm">Ayuda inmediata cuando más lo necesitas</p>
        </div>
      </div>

      {/* Banner */}
      <div className="rounded-3xl p-5 mb-6 text-white"
        style={{ background: 'linear-gradient(135deg, #7f1d1d, #dc2626)' }}>
        <p className="font-black text-lg mb-1">🆘 ¿Estás desbordado/a ahora?</p>
        <p className="text-white/70 text-sm">Estas técnicas funcionan en menos de 2 minutos. Elige la que más te resuene.</p>
      </div>

      {/* Grid de técnicas */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {KIT_ITEMS.slice(0, 4).map((item, i) => (
          <motion.button key={item.id}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07 }}
            onClick={() => setSelected(item)}
            className="rounded-2xl p-4 text-left shadow-md hover:shadow-lg transition-all active:scale-95"
            style={{ background: item.color }}>
            <span className="text-3xl block mb-2">{item.emoji}</span>
            <p className="text-white font-black text-sm leading-tight">{item.titulo}</p>
            <p className="text-white/60 text-xs mt-1">{item.subtitulo.split('·')[0]}</p>
          </motion.button>
        ))}
      </div>

      {/* Último item ancho completo */}
      <motion.button
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        onClick={() => setSelected(KIT_ITEMS[4])}
        className="w-full rounded-2xl p-4 text-left shadow-md hover:shadow-lg transition-all flex items-center gap-4"
        style={{ background: KIT_ITEMS[4].color }}>
        <span className="text-4xl">{KIT_ITEMS[4].emoji}</span>
        <div>
          <p className="text-white font-black">{KIT_ITEMS[4].titulo}</p>
          <p className="text-white/60 text-sm">{KIT_ITEMS[4].subtitulo}</p>
        </div>
      </motion.button>

      {/* Nota pie */}
      <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
        <p className="text-slate-500 text-xs text-center">
          💡 Si el malestar es muy intenso o persistente, habla con el orientador de tu centro o un adulto de confianza.
        </p>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selected && <KitItem item={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  )
}
