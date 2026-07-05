import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/api/supabaseClient'
import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'

export default function PagoExitoso() {
  const [checking, setChecking] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // Esperar 3s para que el webhook de Stripe active la suscripción
    const timer = setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('perfiles_alumnos').update({
          subscription_status: 'active',
          subscription_type: 'individual',
        }).eq('user_id', user.id)
      }
      setChecking(false)
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0d3d3d 0%, #0f6b6b 100%)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="text-center flex flex-col items-center gap-4">
        <CheckCircle className="w-20 h-20 text-green-400" />
        <p className="text-white text-2xl font-black">¡Suscripción activada!</p>
        <p className="text-white/60 text-sm max-w-xs">
          Ya tienes acceso completo a Resetea. Bienvenido/a.
        </p>
        {checking
          ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mt-2" />
          : <button onClick={() => navigate('/')}
              className="mt-4 px-8 py-3 rounded-2xl text-white font-bold"
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' }}>
              Entrar a Resetea →
            </button>
        }
      </motion.div>
    </div>
  )
}
