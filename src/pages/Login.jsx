import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/api/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, X, ShieldCheck } from 'lucide-react'

const LOGO_URL = 'https://zbusdixrxedfhbkquafh.supabase.co/storage/v1/object/public/logo/WhatsApp%20Image%202026-04-06%20at%2015.58.04.jpeg'
const CURSOS = [
  '1º Primaria', '2º Primaria', '3º Primaria',
  '4º Primaria', '5º Primaria', '6º Primaria',
  '1º ESO', '2º ESO', '3º ESO', '4º ESO',
  '1º Bachillerato', '2º Bachillerato',
  'FP Básica', '1º FP Medio', '2º FP Medio',
  '1º FP Superior', '2º FP Superior',
]

const POLITICA_TEXTO = `
POLÍTICA DE PROTECCIÓN DE DATOS — RESETEA

Responsable del tratamiento:
Fundación San Valero, con domicilio en Zaragoza, España.

Finalidad:
Los datos recogidos (email y curso) se utilizan exclusivamente para:
• Gestionar tu acceso a la aplicación Resetea.
• Generar estadísticas anónimas y agregadas sobre bienestar emocional por grupo/curso.
• Ningún dato personal se comparte con terceros ni se usa con fines comerciales.

Datos que se recogen:
• Email institucional (@svalero.com)
• Curso al que perteneces
• Registros anónimos de uso de los módulos de la app

Base legal:
Consentimiento explícito del usuario (art. 6.1.a RGPD).

Conservación:
Los datos se conservan mientras mantengas tu cuenta activa. Puedes solicitar su eliminación en cualquier momento.

Derechos:
Tienes derecho a acceder, rectificar, suprimir, oponerte y limitar el tratamiento de tus datos. Para ejercerlos, contacta con: resetea@svalero.com

Seguridad:
Todos los datos se almacenan en servidores europeos (Supabase EU West) con cifrado en tránsito y en reposo.

Última actualización: abril 2025
`

export default function Login() {
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [curso, setCurso]           = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState('')
  const [aceptaPolitica, setAceptaPolitica] = useState(false)
  const [showPolitica, setShowPolitica]     = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async () => {
    setLoading(true); setError(''); setSuccess('')

    // Validar dominio dinámicamente contra tabla centros
    const dominio = email.split('@')[1]
    if (!dominio) {
      setError('Introduce un email válido')
      setLoading(false); return
    }

    const { data: centroCheck } = await supabase
      .from('centros')
      .select('id, nombre')
      .eq('dominio', dominio)
      .eq('activo', true)
      .single()

    if (!centroCheck) {
      setError('Tu centro educativo no está registrado en Resetea. Contacta con tu orientador/a.')
      setLoading(false); return
    }

    if (isRegister) {
      if (!curso) {
        setError('Por favor selecciona tu curso')
        setLoading(false); return
      }
      if (!aceptaPolitica) {
        setError('Debes aceptar la política de protección de datos para registrarte')
        setLoading(false); return
      }
      if (password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres')
        setLoading(false); return
      }
      if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden')
        setLoading(false); return
      }
    }

    try {
      if (isRegister) {
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
        if (signUpError) throw signUpError

        if (data?.user) {
          await supabase.from('perfiles_alumnos').upsert({
            user_id: data.user.id,
            curso,
            centro_id: centroCheck.id,
            acepta_politica: true,
            fecha_aceptacion: new Date().toISOString(),
          }, { onConflict: 'user_id' })
        }
        setSuccess('¡Cuenta creada! Revisa tu email para confirmar tu cuenta y después entra.')
        setIsRegister(false)
        setPassword('')
        setConfirmPassword('')
        setCurso('')
        setAceptaPolitica(false)
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
        navigate('/')
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = email && password &&
    (!isRegister || (curso && aceptaPolitica && confirmPassword))

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0d3d3d 0%, #0f6b6b 50%, #1a9090 100%)' }}
    >
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src={LOGO_URL} alt="Resetea"
              className="w-24 h-24 rounded-full object-cover shadow-2xl border-4 border-white/20" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Resetea</h1>
          <p className="text-teal-200 text-sm mt-1">Tu espacio de calma y conexión</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-4">
          <h2 className="text-lg font-bold mb-2" style={{ color: '#0d3d3d' }}>
            {isRegister ? 'Crear cuenta' : 'Bienvenido/a'}
          </h2>

          {error   && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
          {success && <div className="bg-teal-50 border border-teal-200 text-teal-700 text-sm rounded-xl px-4 py-3">{success}</div>}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="tu@centro.com"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
            />
            <p className="text-xs text-slate-400 mt-1">Usa el email de tu centro educativo</p>
          </div>

          {/* Curso (solo registro) */}
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Tu curso</label>
              <div className="relative">
                <select
                  value={curso} onChange={e => setCurso(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 appearance-none bg-white pr-10"
                  style={{ color: curso ? '#1e293b' : '#94a3b8' }}
                >
                  <option value="" disabled>Selecciona tu curso</option>
                  {CURSOS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Contraseña */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Contraseña</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              onKeyDown={e => e.key === 'Enter' && !isRegister && handleSubmit()}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          {/* Confirmar contraseña (solo registro) */}
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Confirmar contraseña</label>
              <input
                type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repite tu contraseña"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              />
            </div>
          )}

          {/* Política de datos (solo registro) */}
          {isRegister && (
            <div className="flex items-start gap-3 bg-slate-50 rounded-xl p-3">
              <input
                type="checkbox"
                id="politica"
                checked={aceptaPolitica}
                onChange={e => setAceptaPolitica(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-teal-600 cursor-pointer flex-shrink-0"
              />
              <label htmlFor="politica" className="text-xs text-slate-600 leading-relaxed cursor-pointer">
                He leído y acepto la{' '}
                <button
                  type="button"
                  onClick={() => setShowPolitica(true)}
                  className="text-teal-600 underline font-medium hover:text-teal-800"
                >
                  política de protección de datos
                </button>
                . Entiendo que mis datos se usarán únicamente para gestionar mi acceso y estadísticas anónimas de bienestar.
              </label>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !canSubmit}
            className="w-full py-3 rounded-xl text-white font-bold disabled:opacity-50 mt-2"
            style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}
          >
            {loading ? 'Cargando...' : isRegister ? 'Crear cuenta' : 'Entrar'}
          </button>

          <button
            onClick={() => {
              setIsRegister(!isRegister)
              setError(''); setSuccess('')
              setCurso(''); setAceptaPolitica(false)
              setConfirmPassword('')
            }}
            className="w-full text-sm text-teal-600 hover:text-teal-800 transition-colors pt-1"
          >
            {isRegister ? '¿Ya tienes cuenta? Entra aquí' : '¿Primera vez? Crea tu cuenta'}
          </button>
        </div>

        <p className="text-center text-xs text-teal-200/60 mt-6">Tus datos son privados y seguros 🔒</p>
      </motion.div>

      {/* Modal Política de Datos */}
      <AnimatePresence>
        {showPolitica && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={() => setShowPolitica(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
            >
              {/* Header modal */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-teal-600" />
                  <h3 className="font-bold text-slate-800">Política de Protección de Datos</h3>
                </div>
                <button
                  onClick={() => setShowPolitica(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              {/* Contenido */}
              <div className="overflow-y-auto p-6 flex-1">
                <pre className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed font-sans">
                  {POLITICA_TEXTO}
                </pre>
              </div>

              {/* Footer modal */}
              <div className="p-6 border-t border-slate-100">
                <button
                  onClick={() => { setAceptaPolitica(true); setShowPolitica(false) }}
                  className="w-full py-3 rounded-xl text-white font-bold"
                  style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}
                >
                  Entendido, acepto la política
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
