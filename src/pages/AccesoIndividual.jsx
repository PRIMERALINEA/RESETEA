import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/api/supabaseClient'
import { motion } from 'framer-motion'
import { ShieldCheck, Zap, BookOpen, Brain, CreditCard } from 'lucide-react'

const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY
const PRICE_ID = import.meta.env.VITE_STRIPE_PRICE_INDIVIDUAL

const LOGO_URL = 'https://zbusdixrxedfhbkquafh.supabase.co/storage/v1/object/public/logo/WhatsApp%20Image%202026-04-06%20at%2015.58.04.jpeg'

export default function AccesoIndividual() {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [user, setUser]       = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const checkUser = async () => {
      // Esperar hasta 3s a que la sesión se propague tras el registro
      let attempts = 0
      let currentUser = null
      while (attempts < 6) {
        const { data: { user: u } } = await supabase.auth.getUser()
        if (u) { currentUser = u; break }
        await new Promise(r => setTimeout(r, 500))
        attempts++
      }

      if (!currentUser) { navigate('/registro-individual'); return }

      const { data: perfil } = await supabase
        .from('perfiles_alumnos')
        .select('subscription_status')
        .eq('user_id', currentUser.id)
        .maybeSingle()

      if (perfil?.subscription_status === 'active') {
        navigate('/')
        return
      }
      setUser(currentUser)
    }
    checkUser()
  }, [navigate])

  const handlePago = async () => {
    if (!user) return
    setLoading(true)
    setError('')

    try {
      // Usar anon key para llamar a la Edge Function (no requiere sesión activa)
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout-individual`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            price_id: PRICE_ID,
            user_id: user.id,
            email: user.email,
            success_url: `${window.location.origin}/pago-exitoso`,
            cancel_url: `${window.location.origin}/acceso-individual`,
          }),
        }
      )

      if (!res.ok) throw new Error('Error al crear la sesión de pago')
      const { session_id, url } = await res.json()

      // Redirigir directamente a la URL de Stripe
      if (url) {
        window.location.href = url
      } else if (session_id) {
        window.location.href = `https://checkout.stripe.com/pay/${session_id}`
      } else {
        throw new Error('No se recibió URL de pago')
      }

    } catch (e) {
      console.error(e)
      setError('Error al procesar el pago. Inténtalo de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0d3d3d 0%, #0f6b6b 50%, #1a9090 100%)' }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <img src={LOGO_URL} alt="Resetea"
              className="w-20 h-20 rounded-full object-cover shadow-2xl border-4 border-white/20" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Resetea</h1>
          <p className="text-teal-200 text-sm mt-1">Activa tu acceso completo</p>
        </div>

        {/* Card precio */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 mb-4">
          <div className="text-center mb-5">
            <p className="text-slate-500 text-sm mb-1">Acceso individual</p>
            <p className="text-5xl font-black" style={{ color: '#0d3d3d' }}>4,99€</p>
            <p className="text-slate-400 text-sm">/mes · cancela cuando quieras</p>
          </div>

          {/* Beneficios */}
          <div className="space-y-3 mb-6">
            {[
              { icon: Brain, texto: 'Test de estrés GAD-7 ilimitados' },
              { icon: Zap, texto: 'Todas las técnicas y ejercicios' },
              { icon: BookOpen, texto: 'Módulos de aprendizaje completos' },
              { icon: ShieldCheck, texto: 'Tu diario emocional privado' },
            ].map(({ icon: Icon, texto }, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: '#ccfbf1' }}>
                  <Icon className="w-4 h-4" style={{ color: '#0f6b6b' }} />
                </div>
                <p className="text-slate-700 text-sm">{texto}</p>
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <button onClick={handlePago} disabled={loading || !user}
            className="w-full py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Redirigiendo...</>
              : <><CreditCard className="w-5 h-5" /> Suscribirme por 4,99€/mes</>
            }
          </button>

          <p className="text-center text-xs text-slate-400 mt-3">
            Pago seguro con Stripe · Cancela en cualquier momento
          </p>
        </div>

        <button onClick={() => navigate('/login')}
          className="w-full text-center text-teal-200 text-sm hover:text-white transition-colors">
          ← Volver al login
        </button>
      </motion.div>
    </div>
  )
}
