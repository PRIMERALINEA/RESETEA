import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/api/supabaseClient'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const LOGO_URL = 'https://zbusdixrxedfhbkquafh.supabase.co/storage/v1/object/public/logo/Gemini_Generated_Image_rar33drar33drar3.png'
const DOMINIO_PERMITIDO = '@svalero.com'

const CURSOS = [
  '1º ESO', '2º ESO', '3º ESO', '4º ESO',
  '1º Bachillerato', '2º Bachillerato',
  'FP Básica', '1º FP Medio', '2º FP Medio',
  '1º FP Superior', '2º FP Superior',
]

export default function Login() {
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [curso, setCurso]         = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState('')
  const navigate = useNavigate()

  const handleSubmit = async () => {
    setLoading(true); setError(''); setSuccess('')

    if (!email.toLowerCase().endsWith(DOMINIO_PERMITIDO)) {
      setError('Solo pueden acceder usuarios con email @svalero.com')
      setLoading(false); return
    }

    if (isRegister && !curso) {
      setError('Por favor selecciona tu curso')
      setLoading(false); return
    }

    try {
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        // Guardar curso en perfiles_alumnos
        if (data?.user) {
          await supabase.from('perfiles_alumnos').upsert({
            user_id: data.user.id,
            curso,
          }, { onConflict: 'user_id' })
        }
        setSuccess('¡Cuenta creada! Ya puedes entrar.')
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate('/')
      }
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0d3d3d 0%, #0f6b6b 50%, #1a9090 100%)' }}>
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
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="tu@svalero.com"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" />
            <p className="text-xs text-slate-400 mt-1">Solo emails @svalero.com</p>
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" />
          </div>

          {/* Curso (solo en registro) */}
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Tu curso</label>
              <div className="relative">
                <select value={curso} onChange={e => setCurso(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 appearance-none bg-white pr-10"
                  style={{ color: curso ? '#1e293b' : '#94a3b8' }}>
                  <option value="" disabled>Selecciona tu curso</option>
                  {CURSOS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              <p className="text-xs text-slate-400 mt-1">Solo se usa para estadísticas anónimas de grupo</p>
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading || !email || !password || (isRegister && !curso)}
            className="w-full py-3 rounded-xl text-white font-bold disabled:opacity-50 mt-2"
            style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>
            {loading ? 'Cargando...' : isRegister ? 'Crear cuenta' : 'Entrar'}
          </button>

          <button onClick={() => { setIsRegister(!isRegister); setError(''); setSuccess(''); setCurso('') }}
            className="w-full text-sm text-teal-600 hover:text-teal-800 transition-colors pt-1">
            {isRegister ? '¿Ya tienes cuenta? Entra aquí' : '¿Primera vez? Crea tu cuenta'}
          </button>
        </div>

        <p className="text-center text-xs text-teal-200/60 mt-6">Tus datos son privados y seguros 🔒</p>
      </motion.div>
    </div>
  )
}
