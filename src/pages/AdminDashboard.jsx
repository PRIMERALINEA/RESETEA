import React, { useState, useEffect } from 'react'
import { supabase } from '@/api/supabaseClient'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Users, Activity, TrendingUp, Brain, Calendar, AlertTriangle, Shield, RefreshCw } from 'lucide-react'

const ADMIN_EMAIL = 'piso@svalero.com'

const TIPO_CONFIG = {
  respiracion: { label: 'Respiración',   emoji: '🌬️', color: '#0891b2' },
  anclaje:     { label: 'Anclaje',        emoji: '⚓', color: '#1d4ed8' },
  relajacion:  { label: 'Relajación',     emoji: '💆', color: '#be185d' },
  tecnica:     { label: 'Técnica rápida', emoji: '⚡', color: '#b45309' },
  diario:      { label: 'Diario',         emoji: '📓', color: '#7c3aed' },
  test:        { label: 'Test estrés',    emoji: '🧠', color: '#065f46' },
}

const ANSIEDAD_COLOR = {
  'Mínima (0-4)':      { color: '#16a34a', bg: '#dcfce7' },
  'Leve (5-9)':        { color: '#ca8a04', bg: '#fef9c3' },
  'Moderada (10-14)':  { color: '#ea580c', bg: '#ffedd5' },
  'Severa (15+)':      { color: '#dc2626', bg: '#fee2e2' },
}

function KpiCard({ icon: Icon, label, value, sub, color, delay }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
        style={{ background: color + '20' }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <p className="text-3xl font-black text-slate-800">{value ?? '—'}</p>
      <p className="text-sm font-semibold text-slate-600 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </motion.div>
  )
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [acceso, setAcceso] = useState(false)
  const [dashboard, setDashboard] = useState(null)
  const [actividades, setActividades] = useState([])
  const [actividadDiaria, setActividadDiaria] = useState([])
  const [usuariosActivos, setUsuariosActivos] = useState([])
  const [ansiedad, setAnsiedad] = useState([])
  const [lastUpdate, setLastUpdate] = useState(null)
  const navigate = useNavigate()

  const cargar = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.email !== ADMIN_EMAIL) { setAcceso(false); setLoading(false); return }
      setAcceso(true)
      const [r1, r2, r3, r4, r5] = await Promise.all([
        supabase.rpc('get_resetea_dashboard'),
        supabase.rpc('get_resetea_actividades_por_tipo'),
        supabase.rpc('get_resetea_actividad_diaria'),
        supabase.rpc('get_resetea_usuarios_activos'),
        supabase.rpc('get_resetea_ansiedad_stats'),
      ])
      if (r1.data) setDashboard(r1.data)
      if (r2.data) setActividades(r2.data)
      if (r3.data) setActividadDiaria(r3.data)
      if (r4.data) setUsuariosActivos(r4.data)
      if (r5.data) setAnsiedad(r5.data)
      setLastUpdate(new Date())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [])

  const maxDiario = Math.max(...actividadDiaria.map(d => d.total), 1)
  const maxActividad = Math.max(...actividades.map(a => a.total), 1)

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f0f9f9' }}>
      <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
    </div>
  )

  if (!acceso) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: '#f0f9f9' }}>
      <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
      <p className="text-xl font-black text-slate-800">Acceso restringido</p>
      <p className="text-slate-500 text-sm mt-2">No tienes permisos para ver esta página.</p>
      <button onClick={() => navigate('/')} className="mt-6 px-6 py-3 rounded-2xl text-white font-bold"
        style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>Volver al inicio</button>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black" style={{ color: '#0d3d3d' }}>Panel Admin</h1>
            <p className="text-slate-500 text-xs">{lastUpdate ? `Actualizado ${lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}` : ''}</p>
          </div>
        </div>
        <button onClick={cargar} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-teal-600 bg-teal-50 hover:bg-teal-100 transition-all">
          <RefreshCw className="w-4 h-4" /> Actualizar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <KpiCard icon={Users}         label="Usuarios registrados"  value={dashboard?.total_usuarios}          color="#0f6b6b" delay={0.05} />
        <KpiCard icon={Activity}      label="Actividades totales"    value={dashboard?.total_actividades}       color="#7c3aed" delay={0.1}  />
        <KpiCard icon={TrendingUp}    label="Actividades hoy"        value={dashboard?.actividades_hoy}         color="#0891b2" delay={0.15} sub="Hoy" />
        <KpiCard icon={Calendar}      label="Activos esta semana"    value={dashboard?.usuarios_activos_semana} color="#b45309" delay={0.2}  sub="Últimos 7 días" />
        <KpiCard icon={Brain}         label="Tests completados"      value={dashboard?.tests_completados}       color="#be185d" delay={0.25} />
        <KpiCard icon={AlertTriangle} label="Ansiedad promedio"      value={dashboard?.ansiedad_promedio != null ? `${dashboard.ansiedad_promedio} pts` : '—'} color="#dc2626" delay={0.3} sub="Puntuación GAD-7" />
      </div>

      {/* Actividades por tipo */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-6">
        <p className="font-black text-slate-800 mb-4">Actividades por tipo</p>
        <div className="space-y-3">
          {actividades.map((a) => {
            const cfg = TIPO_CONFIG[a.tipo] || TIPO_CONFIG.tecnica
            const pct = Math.round((a.total / maxActividad) * 100)
            return (
              <div key={a.tipo}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span>{cfg.emoji}</span>
                    <span className="text-sm font-medium text-slate-700">{cfg.label}</span>
                  </div>
                  <span className="text-sm font-black" style={{ color: cfg.color }}>{a.total}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="h-full rounded-full" style={{ background: cfg.color }} />
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Actividad diaria */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-6">
        <p className="font-black text-slate-800 mb-4">Actividad últimos 14 días</p>
        {actividadDiaria.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4">Sin datos aún</p>
        ) : (
          <div className="flex items-end gap-1 h-28">
            {actividadDiaria.map((d, i) => {
              const pct = (d.total / maxDiario) * 100
              const fecha = new Date(d.dia)
              const label = `${fecha.getDate()}/${fecha.getMonth() + 1}`
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-black text-teal-600" style={{ fontSize: '9px' }}>{d.total > 0 ? d.total : ''}</span>
                  <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max(pct, 4)}%` }}
                    transition={{ duration: 0.6, delay: i * 0.04 }}
                    className="w-full rounded-t-lg" style={{ background: '#0f6b6b', minHeight: '4px' }} />
                  <span className="text-slate-400" style={{ fontSize: '8px' }}>{label}</span>
                </div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* Niveles de ansiedad */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
        className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-rose-500" />
          <p className="font-black text-slate-800">Niveles de ansiedad (GAD-7)</p>
        </div>
        {ansiedad.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4">Sin tests completados aún</p>
        ) : (
          <div className="space-y-3">
            {ansiedad.map((a) => {
              const cfg = ANSIEDAD_COLOR[a.nivel] || { color: '#64748b', bg: '#f1f5f9' }
              return (
                <div key={a.nivel} className="flex items-center gap-3">
                  <span className="text-xs font-bold px-2 py-1 rounded-lg w-32 text-center flex-shrink-0"
                    style={{ color: cfg.color, background: cfg.bg }}>{a.nivel}</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${a.porcentaje}%` }}
                      transition={{ duration: 0.8, delay: 0.5 }}
                      className="h-full rounded-full" style={{ background: cfg.color }} />
                  </div>
                  <span className="text-sm font-black w-20 text-right flex-shrink-0" style={{ color: cfg.color }}>
                    {a.total} ({a.porcentaje}%)
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* Usuarios más activos */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            <p className="font-black text-slate-800">Usuarios más activos</p>
          </div>
          <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">Anonimizados 🔒</span>
        </div>
        {usuariosActivos.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4">Sin datos aún</p>
        ) : (
          <div className="space-y-2">
            {usuariosActivos.map((u, i) => {
              const diasActivo = Math.round((new Date() - new Date(u.ultima_actividad)) / (1000 * 60 * 60 * 24))
              return (
                <div key={u.usuario_hash} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                    style={{ background: i < 3 ? 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' : '#e2e8f0', color: i < 3 ? 'white' : '#94a3b8' }}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-mono text-slate-500">{u.usuario_hash.slice(0, 12)}...</p>
                    <p className="text-xs text-slate-400">{diasActivo === 0 ? 'activo hoy' : `hace ${diasActivo}d`}</p>
                  </div>
                  <span className="text-sm font-black text-teal-600">{u.total_actividades} act.</span>
                </div>
              )
            })}
          </div>
        )}
      </motion.div>
    </div>
  )
}
