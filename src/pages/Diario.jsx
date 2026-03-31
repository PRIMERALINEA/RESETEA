import React, { useState } from 'react'
import { supabase } from '@/api/supabaseClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BookOpen, Plus, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const EMOCIONES = [
  { id: 'tranquilo', label: 'Tranquilo', emoji: '😌', color: 'bg-green-100 border-green-300 text-green-700' },
  { id: 'contento', label: 'Contento', emoji: '😊', color: 'bg-yellow-100 border-yellow-300 text-yellow-700' },
  { id: 'nervioso', label: 'Nervioso', emoji: '😬', color: 'bg-amber-100 border-amber-300 text-amber-700' },
  { id: 'estresado', label: 'Estresado', emoji: '😤', color: 'bg-orange-100 border-orange-300 text-orange-700' },
  { id: 'agobiado', label: 'Agobiado', emoji: '😩', color: 'bg-red-100 border-red-300 text-red-700' },
  { id: 'triste', label: 'Triste', emoji: '😢', color: 'bg-blue-100 border-blue-300 text-blue-700' },
  { id: 'enfadado', label: 'Enfadado', emoji: '😠', color: 'bg-red-100 border-red-300 text-red-700' },
  { id: 'bien', label: 'Bien', emoji: '🙂', color: 'bg-teal-100 border-teal-300 text-teal-700' },
]

const INTENSIDADES = [1, 2, 3, 4, 5]

export default function Diario() {
  const [showForm, setShowForm] = useState(false)
  const [emocion, setEmocion] = useState('')
  const [intensidad, setIntensidad] = useState(3)
  const [nota, setNota] = useState('')
  const [saving, setSaving] = useState(false)
  const queryClient = useQueryClient()

  const { data: entradas = [] } = useQuery({
    queryKey: ['diario'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      const { data } = await supabase
        .from('diario_estudiante')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)
      return data || []
    }
  })

  const guardar = async () => {
    if (!emocion || saving) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('diario_estudiante').insert({
        user_id: user.id,
        emocion,
        intensidad,
        nota: nota.trim() || null,
        created_at: new Date().toISOString()
      })
      queryClient.invalidateQueries(['diario'])
      setShowForm(false)
      setEmocion('')
      setIntensidad(3)
      setNota('')
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const emocionData = (id) => EMOCIONES.find(e => e.id === id)

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-blue-900">Diario emocional</h1>
            <p className="text-slate-500 text-sm">¿Cómo te sientes hoy?</p>
          </div>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 shadow-lg border border-blue-50 mb-6">
          <p className="font-bold text-slate-800 mb-4">¿Cómo te sientes ahora mismo?</p>

          {/* Emociones */}
          <div className="grid grid-cols-4 gap-2 mb-5">
            {EMOCIONES.map(em => (
              <button key={em.id} onClick={() => setEmocion(em.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all text-xs font-medium ${
                  emocion === em.id ? em.color + ' scale-105' : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}>
                <span className="text-2xl">{em.emoji}</span>
                <span>{em.label}</span>
              </button>
            ))}
          </div>

          {/* Intensidad */}
          {emocion && (
            <div className="mb-4">
              <p className="text-sm font-medium text-slate-600 mb-2">Intensidad</p>
              <div className="flex gap-2">
                {INTENSIDADES.map(n => (
                  <button key={n} onClick={() => setIntensidad(n)}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                      intensidad === n ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>{n}</button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1 px-1">
                <span>Poco</span><span>Mucho</span>
              </div>
            </div>
          )}

          {/* Nota */}
          <textarea
            value={nota}
            onChange={e => setNota(e.target.value)}
            placeholder="¿Qué ha pasado? (opcional)"
            rows={3}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none mb-4"
          />

          <div className="flex gap-3">
            <button onClick={() => setShowForm(false)}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-500 text-sm font-medium">
              Cancelar
            </button>
            <button onClick={guardar} disabled={!emocion || saving}
              className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Historial */}
      {entradas.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Aún no hay entradas</p>
          <p className="text-sm mt-1">Pulsa + para registrar cómo te sientes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entradas.map((entrada, i) => {
            const em = emocionData(entrada.emocion)
            return (
              <motion.div key={entrada.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-blue-50">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{em?.emoji || '😐'}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-800">{em?.label || entrada.emocion}</p>
                        <div className="flex gap-0.5">
                          {Array.from({ length: entrada.intensidad || 0 }).map((_, j) => (
                            <div key={j} className="w-2 h-2 rounded-full bg-blue-400" />
                          ))}
                        </div>
                      </div>
                      {entrada.nota && <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{entrada.nota}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-slate-400">
                        {format(new Date(entrada.created_at), "d MMM", { locale: es })}
                      </p>
                      <p className="text-xs text-slate-400">
                        {format(new Date(entrada.created_at), "HH:mm")}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
