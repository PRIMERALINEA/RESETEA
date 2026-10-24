// src/components/ReporteConvivencia.jsx
// Sección de MiPerfil para avisar de una situación de acoso escolar (propia o como testigo).
// El alumno solo puede ENVIAR: no guarda copia ni historial y no puede leer lo enviado
// (lo garantiza la RLS de reportes_acoso, no solo esta pantalla).
import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldAlert, Phone, X, CheckCircle, LogOut, Lock } from 'lucide-react'
import { supabase, sanitize, logError } from '@/api/supabaseClient'

// Verifica que estos teléfonos siguen vigentes antes de lanzar en producción.
const RECURSOS = [
  { nombre: 'Teléfono contra el Acoso Escolar', tel: '900018018', texto: '900 018 018' },
  { nombre: 'Fundación ANAR (ayuda a niños y adolescentes)', tel: '900202010', texto: '900 20 20 10' },
  { nombre: 'Emergencias', tel: '112', texto: '112' },
]

const SALIDA_RAPIDA_URL = 'https://www.google.es'

const VACIO = { tipo: '', descripcion: '', lugar: '', cuando: '', implicados: '', urgente: false }

function Recursos() {
  return (
    <div className="rounded-2xl p-3 space-y-1.5" style={{ background: '#f0f9f9', border: '1px solid #ccfbf1' }}>
      <p className="text-xs font-bold" style={{ color: '#0d3d3d' }}>Si necesitas hablar con alguien ahora</p>
      {RECURSOS.map(r => (
        <a key={r.tel} href={`tel:${r.tel}`} className="flex items-center gap-2 text-xs text-slate-600">
          <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#0f6b6b' }} />
          <span className="flex-1">{r.nombre}</span>
          <span className="font-bold" style={{ color: '#0f6b6b' }}>{r.texto}</span>
        </a>
      ))}
    </div>
  )
}

export default function ReporteConvivencia({ centroId }) {
  const [abierto, setAbierto]         = useState(false)
  const [disponible, setDisponible]   = useState(null) // null = comprobando
  const [paso, setPaso]               = useState('form') // 'form' | 'enviado'
  const [form, setForm]               = useState(VACIO)
  const [enviando, setEnviando]       = useState(false)
  const [error, setError]             = useState('')

  // Solo se comprueba si el centro tiene el canal operativo cuando se abre la sección.
  useEffect(() => {
    if (!abierto || !centroId || disponible !== null) return
    let cancel = false
    supabase.rpc('convivencia_disponible', { p_centro: centroId })
      .then(({ data, error }) => {
        if (cancel) return
        if (error) { logError('convivencia_disponible', error); setDisponible(false) }
        else setDisponible(data === true)
      })
    return () => { cancel = true }
  }, [abierto, centroId, disponible])

  const set = (campo, valor) => setForm(f => ({ ...f, [campo]: valor }))

  const cerrarYLimpiar = () => {
    setForm(VACIO); setPaso('form'); setError(''); setAbierto(false)
  }

  const salidaRapida = () => {
    setForm(VACIO)
    window.location.replace(SALIDA_RAPIDA_URL)
  }

  const enviar = async () => {
    setError('')
    if (!form.tipo) { setError('Indica si te ocurre a ti o has sido testigo.'); return }
    if (sanitize(form.descripcion).length < 10) { setError('Cuéntanos qué ha pasado con algo más de detalle (mínimo 10 caracteres).'); return }
    setEnviando(true)
    try {
      // El servidor fija quién eres, tu curso y tu centro: aquí solo se envía el contenido.
      const { error: err } = await supabase.from('reportes_acoso').insert({
        tipo: form.tipo,
        descripcion: sanitize(form.descripcion),
        lugar: sanitize(form.lugar) || null,
        cuando: sanitize(form.cuando) || null,
        implicados: sanitize(form.implicados) || null,
        urgente: !!form.urgente,
      })
      if (err) {
        logError('insert reporte', err)
        if ((err.message || '').includes('limite_avisos')) setError('Has enviado varios avisos seguidos. Espera un poco o llama a uno de los teléfonos de ayuda.')
        else if (err.code === '42501') setError('El canal de avisos no está disponible ahora mismo. Habla con tu tutor/a o con orientación, o llama a uno de los teléfonos de ayuda.')
        else setError('No se ha podido enviar. Tu texto sigue aquí: inténtalo de nuevo o llama a uno de los teléfonos de ayuda.')
        return
      }
      // Éxito: se borra el contenido de memoria; no se guarda nada en el dispositivo.
      setForm(VACIO)
      setPaso('enviado')
    } catch (e) {
      logError('enviar reporte', e)
      setError('No se ha podido enviar. Tu texto sigue aquí: inténtalo de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-6">
      <button type="button" onClick={() => (abierto ? cerrarYLimpiar() : setAbierto(true))}
        className="w-full flex items-center gap-3 text-left">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: '#fef2f2' }}>
          <ShieldAlert className="w-5 h-5" style={{ color: '#dc2626' }} />
        </div>
        <div className="flex-1">
          <p className="font-black text-slate-800 text-sm">Convivencia · Avisar de acoso escolar</p>
          <p className="text-xs text-slate-500">Si te ocurre a ti o has visto algo, puedes avisar al equipo del centro.</p>
        </div>
        <span className="text-xs font-bold" style={{ color: '#0f6b6b' }}>{abierto ? 'Cerrar' : 'Abrir'}</span>
      </button>

      <AnimatePresence initial={false}>
        {abierto && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="pt-4 space-y-4">

              {/* Salida rápida, siempre visible */}
              <div className="flex justify-end">
                <button type="button" onClick={salidaRapida}
                  className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl"
                  style={{ background: '#f1f5f9', color: '#475569' }}>
                  <LogOut className="w-3.5 h-3.5" /> Salida rápida
                </button>
              </div>

              {!centroId && (
                <>
                  <p className="text-sm text-slate-600">
                    Tu cuenta no está asociada a un centro, así que el aviso no puede llegar a un equipo de convivencia.
                    Si estás sufriendo acoso, habla con una persona adulta de confianza o usa estos teléfonos:
                  </p>
                  <Recursos />
                </>
              )}

              {centroId && disponible === null && (
                <p className="text-sm text-slate-400">Comprobando…</p>
              )}

              {centroId && disponible === false && (
                <>
                  <p className="text-sm text-slate-600">
                    El canal de avisos todavía no está activado en tu centro. Puedes hablar con tu tutor/a, con
                    orientación o con jefatura de estudios, o usar estos teléfonos:
                  </p>
                  <Recursos />
                </>
              )}

              {centroId && disponible === true && paso === 'form' && (
                <>
                  <div className="rounded-2xl p-3 flex gap-2" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                    <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#b45309' }} />
                    <p className="text-xs" style={{ color: '#92400e' }}>
                      Este aviso <b>no es anónimo</b>: lo verán únicamente la dirección, la jefatura de estudios y
                      orientación, con tu nombre de usuario, curso y grupo. Nadie más. Después de enviarlo no verás
                      aquí lo que escribiste, para proteger tu privacidad.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-bold text-slate-700">¿Qué quieres contarnos?</p>
                    {[
                      { v: 'victima', t: 'Me está ocurriendo a mí' },
                      { v: 'testigo', t: 'He visto que le ocurre a otra persona' },
                    ].map(o => (
                      <label key={o.v}
                        className="flex items-center gap-3 rounded-2xl px-4 py-3 cursor-pointer text-sm"
                        style={{
                          border: `2px solid ${form.tipo === o.v ? '#0f6b6b' : '#e2e8f0'}`,
                          background: form.tipo === o.v ? '#f0f9f9' : 'white',
                        }}>
                        <input type="radio" name="tipo-reporte" checked={form.tipo === o.v}
                          onChange={() => set('tipo', o.v)} className="accent-teal-600" />
                        {o.t}
                      </label>
                    ))}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">¿Qué ha pasado? *</label>
                    <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
                      rows={5} maxLength={5000} placeholder="Cuéntalo con tus palabras. No hace falta que sea perfecto."
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" />
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">¿Dónde ocurre? (opcional)</label>
                      <input value={form.lugar} onChange={e => set('lugar', e.target.value)} maxLength={300}
                        placeholder="Patio, clase, pasillo, redes sociales…"
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">¿Desde cuándo / cuándo fue? (opcional)</label>
                      <input value={form.cuando} onChange={e => set('cuando', e.target.value)} maxLength={300}
                        placeholder="Esta semana, desde septiembre…"
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">¿Quiénes están implicados? (opcional)</label>
                      <input value={form.implicados} onChange={e => set('implicados', e.target.value)} maxLength={1000}
                        placeholder="Nombres o cursos, si los sabes"
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" />
                    </div>
                  </div>

                  <label className="flex items-start gap-3 rounded-2xl p-3 cursor-pointer" style={{ background: '#fef2f2' }}>
                    <input type="checkbox" checked={form.urgente} onChange={e => set('urgente', e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-red-600" />
                    <span className="text-xs" style={{ color: '#991b1b' }}>
                      Es urgente: me siento en peligro ahora o la situación está ocurriendo hoy.
                    </span>
                  </label>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
                  )}

                  <button type="button" onClick={enviar} disabled={enviando}
                    className="w-full py-3 rounded-xl text-white font-bold disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>
                    {enviando ? 'Enviando…' : 'Enviar aviso al equipo de convivencia'}
                  </button>

                  <Recursos />
                </>
              )}

              {centroId && disponible === true && paso === 'enviado' && (
                <div className="space-y-4">
                  <div className="rounded-2xl p-4 text-center" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <CheckCircle className="w-9 h-9 mx-auto mb-2" style={{ color: '#16a34a' }} />
                    <p className="font-black text-slate-800">Aviso enviado</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Ha llegado al equipo de convivencia de tu centro. Por tu privacidad, esta pantalla no guarda
                      copia de lo que escribiste. Gracias por avisar: has hecho lo correcto.
                    </p>
                  </div>
                  <Recursos />
                  <button type="button" onClick={cerrarYLimpiar}
                    className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                    style={{ background: 'white', border: '1px solid #e2e8f0', color: '#64748b' }}>
                    <X className="w-4 h-4" /> Cerrar
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
