// src/components/ConvivenciaReceptorCard.jsx
// Tarjeta para el panel docente: solo aparece a quien es receptor/a de avisos de convivencia.
// Muestra únicamente un contador (sin contenido) y enlaza a /convivencia.
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldAlert, ChevronRight } from 'lucide-react'
import { supabase, logError } from '@/api/supabaseClient'

export default function ConvivenciaReceptorCard() {
  const [esReceptor, setEsReceptor] = useState(false)
  const [pendientes, setPendientes] = useState(0)

  useEffect(() => {
    let vivo = true
    let timer = null

    const contar = async () => {
      const { data, error } = await supabase.rpc('convivencia_pendientes')
      if (!vivo) return
      if (error) { logError('convivencia_pendientes', error); return }
      setPendientes(Number(data) || 0)
    }

    ;(async () => {
      const { data, error } = await supabase.rpc('es_receptor_convivencia', { p_centro: null })
      if (!vivo || error || data !== true) return
      setEsReceptor(true)
      await contar()
      timer = setInterval(contar, 60000)
    })()

    return () => { vivo = false; if (timer) clearInterval(timer) }
  }, [])

  if (!esReceptor) return null

  const alerta = pendientes > 0
  return (
    <Link to="/convivencia"
      className="flex items-center gap-3 rounded-3xl p-4 border-2"
      style={{ background: alerta ? '#fef2f2' : 'white', borderColor: alerta ? '#fca5a5' : '#e2e8f0' }}>
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: alerta ? '#fee2e2' : '#f1f5f9' }}>
        <ShieldAlert className="w-6 h-6" style={{ color: alerta ? '#dc2626' : '#64748b' }} />
      </div>
      <div className="flex-1">
        <p className="font-black text-sm" style={{ color: alerta ? '#991b1b' : '#334155' }}>
          {alerta
            ? (pendientes === 1 ? 'Tienes 1 aviso de convivencia sin asumir' : `Tienes ${pendientes} avisos de convivencia sin asumir`)
            : 'Convivencia · Avisos de acoso escolar'}
        </p>
        <p className="text-xs" style={{ color: alerta ? '#b91c1c' : '#94a3b8' }}>
          {alerta ? 'Accede con verificación en dos pasos' : 'No hay avisos pendientes de asumir'}
        </p>
      </div>
      <ChevronRight className="w-5 h-5 text-slate-400" />
    </Link>
  )
}
