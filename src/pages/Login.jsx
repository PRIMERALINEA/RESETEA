import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/api/supabaseClient'
import { motion } from 'framer-motion'

const LOGO_URL = 'https://zbusdixrxedfhbkquafh.supabase.co/storage/v1/object/public/logo/Gemini_Generated_Image_rar33drar33drar3.png'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  const DOMINIO_PERMITIDO = '@svalero.com'

  const handleSubmit = async () => {
    setLoading(true); setError(''); setSuccess('')

    if (!email.toLowerCase().endsWith(DOMINIO_PERMITIDO)) {
      setError('Solo pueden acceder usuarios con email @svalero.com')
      setLoading(false)
      return
    }

    try {
      if (isRegister) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setSuccess('¡Cuenta creada! Ya puedes entrar.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
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

          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
          {success && <div className="bg-teal-50 border border-teal-200 text-teal-700 text-sm rounded-xl px-4 py-3">{success}</div>}

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="tu@svalero.com"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" />
            <p className="text-xs text-slate-400 mt-1">Solo emails @svalero.com</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" />
          </div>

          <button onClick={handleSubmit} disabled={loading || !email || !password}
            className="w-full py-3 rounded-xl text-white font-bold disabled:opacity-50 mt-2"
            style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>
            {loading ? 'Cargando...' : isRegister ? 'Crear cuenta' : 'Entrar'}
          </button>

          <button onClick={() => { setIsRegister(!isRegister); setError(''); setSuccess('') }}
            className="w-full text-sm text-teal-600 hover:text-teal-800 transition-colors pt-1">
            {isRegister ? '¿Ya tienes cuenta? Entra aquí' : '¿Primera vez? Crea tu cuenta'}
          </button>
        </div>

        <p className="text-center text-xs text-teal-200/60 mt-6">Tus datos son privados y seguros 🔒</p>
      </motion.div>
    </div>
  )
}
