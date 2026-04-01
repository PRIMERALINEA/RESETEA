import React, { useState, useEffect } from 'react'
import { supabase } from '@/api/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Users, Activity, TrendingUp, Brain, Calendar, AlertTriangle,
  BookOpen, Heart, RefreshCw, LogOut, ChevronRight, Eye, EyeOff,
  Wind, Anchor, Zap, BarChart2, Shield
} from 'lucide-react'

// ── COLORES ───────────────────────────────────────────────────
const TIPO_CONFIG = {
  respiracion: { label: 'Respiración',   emoji: '🌬️', color: '#0891b2', bg: '#cffafe' },
  anclaje:     { label: 'Anclaje',        emoji: '⚓', color: '#1d4ed8', bg: '#dbeafe' },
  relajacion:  { label: 'Relajación',     emoji: '💆', color: '#be185d', bg: '#fce7f3' },
  tecnica:     { label: 'Técnica rápida', emoji: '⚡', color: '#b45309', bg: '#fef3c7' },
  diario:      { label: 'Diario',         emoji: '📓', color: '#7c3aed', bg: '#ede9fe' },
  test:        { label: 'Test estrés',    emoji: '🧠', color: '#065f46', bg: '#d1fae5' },
}
const SEMAFORO = {
  verde:    { color: '#16a34a', bg: '#dcfce7', label: 'Mínima' },
  amarillo: { color: '#ca8a04', bg: '#fef9c3', label: 'Leve' },
  naranja:  { color: '#ea580c', bg: '#ffedd5', label: 'Moderada' },
  rojo:     { color: '#dc2626', bg: '#fee2e2', label: 'Severa' },
}
const RIESGO_COLOR = {
  'Ansiedad severa en último test':    { color: '#dc2626', bg: '#fee2e2', icon: '🔴' },
  'Ansiedad moderada en último test':  { color: '#ea580c', bg: '#ffedd5', icon: '🟠' },
  'Sin actividad +14 días':            { color: '#ca8a04', bg: '#fef9c3', icon: '🟡' },
  'Seguimiento recomendado':           { color: '#0891b2', bg: '#cffafe', icon: '🔵' },
}

// ── LOGIN ORIENTADOR ──────────────────────────────────────────
function LoginOrientador({ onAcceso }) {
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCode, setShowCode] = useState(false)

  const verificar = async () => {
    if (!codigo.trim()) return
    setLoading(true); setError('')
    try {
      const { data, error } = await supabase
        .from('orientadores')
        .select('*')
        .eq('codigo', codigo.trim().toUpperCase())
        .eq('activo', true)
        .single()
      if (error || !data) {
        setError('Código incorrecto. Contacta con el administrador.')
      } else {
        onAcceso(data)
      }
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0d3d3d 0%, #1d4ed8 100%)' }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(255,255,255,0.15)' }}>
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">Panel Orientador</h1>
          <p className="text-blue-200 text-sm mt-1">Resetea · Acceso profesional</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-6 space-y-4">
          <p className="font-bold text-slate-700">Introduce tu código de acceso</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div className="relative">
            <input
              type={showCode ? 'text' : 'password'}
              value={codigo}
              onChange={e => setCodigo(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && verificar()}
              placeholder="CÓDIGO DE ACCESO"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono tracking-widest focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 pr-12"
            />
            <button onClick={() => setShowCode(!showCode)}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
              {showCode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <button onClick={verificar} disabled={loading || !codigo}
            className="w-full py-3 rounded-xl text-white font-bold disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #0d3d3d, #1d4ed8)' }}>
            {loading ? 'Verificando...' : 'Acceder al panel'}
          </button>

          <p className="text-xs text-slate-400 text-center">
            ¿No tienes código? Contacta con el administrador del centro.
          </p>
        </div>
      </motion.div>
    </div>
  )
}

// ── KPI CARD ──────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, color, delay }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2"
        style={{ background: color + '20' }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <p className="text-2xl font-black text-slate-800">{value ?? '—'}</p>
      <p className="text-xs font-semibold text-slate-600 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </motion.div>
  )
}

// ── PANEL PRINCIPAL ───────────────────────────────────────────
function PanelOrientadorDashboard({ orientador, onSalir }) {
  const [tab, setTab] = useState('resumen')
  const [loading, setLoading] = useState(true)
  const [metricas, setMetricas] = useState(null)
  const [herramientas, setHerramientas] = useState([])
  const [evolucion, setEvolucion] = useState([])
  const [ansiedad, setAnsiedad] = useState([])
  const [quincenales, setQuincenales] = useState([])
  const [prepost, setPrepost] = useState([])
  const [riesgo, setRiesgo] = useState([])
  const [lastUpdate, setLastUpdate] = useState(null)

  const cargar = async () => {
    setLoading(true)
    try {
      const [r1, r2, r3, r4, r5, r6, r7] = await Promise.all([
        supabase.rpc('get_orientador_metricas_generales'),
        supabase.rpc('get_orientador_uso_herramientas'),
        supabase.rpc('get_orientador_evolucion_semanal'),
        supabase.rpc('get_orientador_ansiedad_grupo'),
        supabase.rpc('get_orientador_quincenales_grupo'),
        supabase.rpc('get_orientador_prepost_ejercicios'),
        supabase.rpc('get_orientador_alumnos_riesgo'),
      ])
      if (r1.data) setMetricas(r1.data)
      if (r2.data) setHerramientas(r2.data)
      if (r3.data) setEvolucion(r3.data)
      if (r4.data) setAnsiedad(r4.data)
      if (r5.data) setQuincenales(r5.data)
      if (r6.data) setPrepost(r6.data)
      if (r7.data) setRiesgo(r7.data)
      setLastUpdate(new Date())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [])

  const TABS = [
    { id: 'resumen',     label: 'Resumen',    icon: BarChart2 },
    { id: 'herramientas', label: 'Uso',        icon: Activity },
    { id: 'ansiedad',    label: 'Ansiedad',   icon: Brain },
    { id: 'quincenales', label: 'Quincenal',  icon: Calendar },
    { id: 'riesgo',      label: 'Atención',   icon: AlertTriangle },
  ]

  const maxHerramienta = Math.max(...herramientas.map(h => h.total), 1)
  const maxEvolucion = Math.max(...evolucion.map(e => e.total_actividades), 1)

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <p className="font-black text-slate-800">Panel Orientador</p>
          </div>
          <p className="text-slate-500 text-xs">{orientador.centro} · {lastUpdate?.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={cargar}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-teal-600 bg-teal-50">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={onSalir}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-red-500 bg-red-50">
            <LogOut className="w-3.5 h-3.5" /> Salir
          </button>
        </div>
      </div>

      {/* Aviso privacidad */}
      <div className="bg-blue-50 rounded-2xl p-3 mb-4 flex items-start gap-2 border border-blue-100">
        <Shield className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-blue-700 text-xs leading-relaxed">
          Todos los datos son <strong>anónimos y agregados</strong>. No se identifican alumnos individuales. Los hashes son irreversibles.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0"
            style={{
              background: tab === t.id ? 'linear-gradient(135deg, #0d3d3d, #1d4ed8)' : 'white',
              color: tab === t.id ? 'white' : '#64748b',
              border: tab === t.id ? 'none' : '1px solid #e2e8f0'
            }}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            {t.id === 'riesgo' && riesgo.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center ml-0.5">
                {riesgo.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : (
        <AnimatePresence mode="wait">

          {/* ── RESUMEN ── */}
          {tab === 'resumen' && (
            <motion.div key="resumen" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <KpiCard icon={Users}       label="Alumnos registrados"   value={metricas?.total_usuarios}          color="#0f6b6b" delay={0.05} />
                <KpiCard icon={Activity}    label="Actividades totales"    value={metricas?.total_actividades}       color="#7c3aed" delay={0.1}  />
                <KpiCard icon={Calendar}    label="Activos esta semana"    value={metricas?.usuarios_activos_semana} color="#0891b2" delay={0.15} sub="Últimos 7 días" />
                <KpiCard icon={TrendingUp}  label="Activos este mes"       value={metricas?.usuarios_activos_mes}    color="#b45309" delay={0.2}  sub="Últimos 30 días" />
                <KpiCard icon={Brain}       label="Tests completados"      value={metricas?.tests_completados}       color="#be185d" delay={0.25} />
                <KpiCard icon={Heart}       label="Ansiedad media grupo"   value={metricas?.ansiedad_promedio != null ? `${metricas.ansiedad_promedio} pts` : '—'} color="#dc2626" delay={0.3} sub="GAD-7" />
              </div>

              {/* Mejora pre/post */}
              {metricas?.mejoria_promedio_pre_post && (
                <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
                  <p className="font-bold text-green-800 text-sm mb-1">
                    📈 Eficacia de las técnicas
                  </p>
                  <p className="text-green-700 text-sm">
                    Reducción media de malestar tras usar una técnica:
                    <span className="font-black text-lg ml-2">{metricas.mejoria_promedio_pre_post} pts</span>
                  </p>
                  <p className="text-green-600 text-xs mt-1">Basado en evaluaciones pre/post de los alumnos</p>
                </div>
              )}

              {/* Evolución semanal */}
              {evolucion.length > 0 && (
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
                  <p className="font-black text-slate-800 mb-4">Actividad semanal (últimas 10 semanas)</p>
                  <div className="flex items-end gap-1 h-24">
                    {evolucion.map((e, i) => {
                      const pct = (e.total_actividades / maxEvolucion) * 100
                      const fecha = new Date(e.semana)
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                          <span className="text-teal-600 font-black" style={{ fontSize: '8px' }}>
                            {e.total_actividades > 0 ? e.total_actividades : ''}
                          </span>
                          <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max(pct, 4)}%` }}
                            transition={{ duration: 0.6, delay: i * 0.05 }}
                            className="w-full rounded-t-lg" style={{ background: '#1d4ed8', minHeight: '4px' }} />
                          <span className="text-slate-400" style={{ fontSize: '7px' }}>
                            {fecha.getDate()}/{fecha.getMonth() + 1}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── USO HERRAMIENTAS ── */}
          {tab === 'herramientas' && (
            <motion.div key="herramientas" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="space-y-4">
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
                <p className="font-black text-slate-800 mb-4">Uso por herramienta</p>
                <div className="space-y-4">
                  {herramientas.map(h => {
                    const cfg = TIPO_CONFIG[h.tipo] || TIPO_CONFIG.tecnica
                    const pct = Math.round((h.total / maxHerramienta) * 100)
                    return (
                      <div key={h.tipo}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span>{cfg.emoji}</span>
                            <span className="text-sm font-medium text-slate-700">{cfg.label}</span>
                          </div>
                          <div className="flex gap-3 text-xs">
                            <span className="text-slate-400">{h.usuarios_unicos} usuarios</span>
                            <span className="font-black" style={{ color: cfg.color }}>{h.total} usos</span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8 }}
                            className="h-full rounded-full" style={{ background: cfg.color }} />
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Esta semana: <span className="font-bold" style={{ color: cfg.color }}>{h.ultima_semana}</span>
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── ANSIEDAD ── */}
          {tab === 'ansiedad' && (
            <motion.div key="ansiedad" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="space-y-4">

              {/* Distribución niveles */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-5 h-5 text-rose-500" />
                  <p className="font-black text-slate-800">Distribución de ansiedad (GAD-7)</p>
                </div>
                {ansiedad.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-4">Sin tests completados aún</p>
                ) : (
                  <div className="space-y-3">
                    {ansiedad.map(a => {
                      const sem = SEMAFORO[a.color_semaforo] || SEMAFORO.verde
                      return (
                        <div key={a.nivel} className="flex items-center gap-3">
                          <span className="text-xs font-bold px-2 py-1 rounded-lg w-32 text-center flex-shrink-0"
                            style={{ color: sem.color, background: sem.bg }}>{a.nivel}</span>
                          <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${a.porcentaje}%` }}
                              transition={{ duration: 0.8 }}
                              className="h-full rounded-full" style={{ background: sem.color }} />
                          </div>
                          <span className="text-sm font-black w-20 text-right flex-shrink-0"
                            style={{ color: sem.color }}>
                            {a.total} ({a.porcentaje}%)
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Pre/post por ejercicio */}
              {prepost.length > 0 && (
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
                  <p className="font-black text-slate-800 mb-1">Eficacia pre/post por ejercicio</p>
                  <p className="text-slate-400 text-xs mb-4">Reducción media de malestar (0-10)</p>
                  <div className="space-y-3">
                    {prepost.map((p, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-700 truncate">{p.ejercicio_nombre}</p>
                          <div className="flex gap-2 text-xs text-slate-400 mt-0.5">
                            <span>✅ Sí: {p.pct_ayudo_si}%</span>
                            <span>🟡 Algo: {p.pct_ayudo_algo}%</span>
                            <span>❌ No: {p.pct_ayudo_no}%</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-black text-lg" style={{ color: p.mejoria_media > 0 ? '#16a34a' : '#dc2626' }}>
                            {p.mejoria_media > 0 ? '-' : '+'}{Math.abs(p.mejoria_media)}
                          </p>
                          <p className="text-xs text-slate-400">{p.total_sesiones} usos</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── QUINCENALES ── */}
          {tab === 'quincenales' && (
            <motion.div key="quincenales" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="space-y-4">
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
                <p className="font-black text-slate-800 mb-1">Evaluaciones quincenales del grupo</p>
                <p className="text-slate-400 text-xs mb-4">Escala 1-5 · Promedio del grupo por semana</p>

                {quincenales.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-4">Sin evaluaciones completadas aún</p>
                ) : (
                  <>
                    {/* Últimos valores */}
                    {(() => {
                      const ultima = quincenales[quincenales.length - 1]
                      return (
                        <div className="grid grid-cols-2 gap-3 mb-5">
                          {[
                            { label: 'Rumiación', val: ultima.rumiacion_media, inv: true, emoji: '🔄', desc: 'Menos es mejor' },
                            { label: 'Atención presente', val: ultima.atencion_media, inv: false, emoji: '🎯', desc: 'Más es mejor' },
                            { label: 'Capacidad de calma', val: ultima.calma_media, inv: false, emoji: '🌊', desc: 'Más es mejor' },
                            { label: 'Bienestar general', val: ultima.bienestar_media, inv: false, emoji: '✨', desc: 'Más es mejor' },
                          ].map(({ label, val, inv, emoji, desc }) => {
                            const score = parseFloat(val)
                            const bueno = inv ? score <= 2.5 : score >= 3.5
                            const color = bueno ? '#16a34a' : score >= 3 ? '#ca8a04' : '#dc2626'
                            return (
                              <div key={label} className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                                <p className="text-lg mb-1">{emoji}</p>
                                <p className="font-black text-xl" style={{ color }}>{val}</p>
                                <p className="text-xs font-medium text-slate-700">{label}</p>
                                <p className="text-xs text-slate-400">{desc}</p>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })()}

                    {/* Evolución tabla */}
                    <p className="font-bold text-slate-700 text-sm mb-2">Evolución por semanas</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-slate-400">
                            <th className="text-left py-1 pr-2">Semana</th>
                            <th className="text-center py-1 px-1">🔄</th>
                            <th className="text-center py-1 px-1">🎯</th>
                            <th className="text-center py-1 px-1">🌊</th>
                            <th className="text-center py-1 px-1">✨</th>
                            <th className="text-center py-1 px-1">N</th>
                          </tr>
                        </thead>
                        <tbody>
                          {quincenales.map((q, i) => {
                            const fecha = new Date(q.semana)
                            return (
                              <tr key={i} className="border-t border-slate-50">
                                <td className="py-1.5 pr-2 text-slate-500">
                                  {fecha.getDate()}/{fecha.getMonth() + 1}
                                </td>
                                <td className="text-center py-1.5 px-1 font-bold"
                                  style={{ color: q.rumiacion_media <= 2.5 ? '#16a34a' : '#dc2626' }}>
                                  {q.rumiacion_media}
                                </td>
                                <td className="text-center py-1.5 px-1 font-bold"
                                  style={{ color: q.atencion_media >= 3.5 ? '#16a34a' : '#dc2626' }}>
                                  {q.atencion_media}
                                </td>
                                <td className="text-center py-1.5 px-1 font-bold"
                                  style={{ color: q.calma_media >= 3.5 ? '#16a34a' : '#dc2626' }}>
                                  {q.calma_media}
                                </td>
                                <td className="text-center py-1.5 px-1 font-bold"
                                  style={{ color: q.bienestar_media >= 3.5 ? '#16a34a' : '#dc2626' }}>
                                  {q.bienestar_media}
                                </td>
                                <td className="text-center py-1.5 px-1 text-slate-400">{q.respuestas}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* ── ALUMNOS EN RIESGO ── */}
          {tab === 'riesgo' && (
            <motion.div key="riesgo" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="space-y-4">

              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                <p className="font-bold text-amber-800 text-sm mb-1">⚠️ Sobre esta sección</p>
                <p className="text-amber-700 text-xs leading-relaxed">
                  Muestra alumnos que podrían necesitar atención basándose en sus datos anónimos. Los identificadores son hashes irreversibles — no es posible saber quién es cada alumno.
                </p>
              </div>

              {riesgo.length === 0 ? (
                <div className="bg-green-50 rounded-2xl p-6 text-center border border-green-100">
                  <p className="text-4xl mb-2">✅</p>
                  <p className="font-bold text-green-800">Sin alertas en este momento</p>
                  <p className="text-green-600 text-sm mt-1">Todos los alumnos activos están dentro del rango normal</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-bold text-slate-700">{riesgo.length} alumno{riesgo.length > 1 ? 's' : ''} requieren atención</p>
                  {riesgo.map((r, i) => {
                    const cfg = RIESGO_COLOR[r.motivo] || RIESGO_COLOR['Seguimiento recomendado']
                    return (
                      <motion.div key={r.alumno_hash}
                        initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl flex-shrink-0">{cfg.icon}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold px-2 py-0.5 rounded-lg"
                                style={{ color: cfg.color, background: cfg.bg }}>
                                {r.motivo}
                              </span>
                            </div>
                            <p className="text-xs font-mono text-slate-400 mb-2">
                              ID: {r.alumno_hash.slice(0, 8)}...
                            </p>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div className="bg-slate-50 rounded-lg p-2 text-center">
                                <p className="font-black text-slate-800">
                                  {r.ultimo_test_puntuacion > 0 ? r.ultimo_test_puntuacion : '—'}
                                </p>
                                <p className="text-slate-400">GAD-7</p>
                              </div>
                              <div className="bg-slate-50 rounded-lg p-2 text-center">
                                <p className="font-black text-slate-800">{r.dias_sin_actividad}d</p>
                                <p className="text-slate-400">Sin uso</p>
                              </div>
                              <div className="bg-slate-50 rounded-lg p-2 text-center">
                                <p className="font-black text-slate-800">{r.total_sesiones}</p>
                                <p className="text-slate-400">Sesiones</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      )}
    </div>
  )
}

// ── COMPONENTE RAÍZ ───────────────────────────────────────────
export default function PanelOrientador() {
  const [orientador, setOrientador] = useState(null)

  return orientador
    ? <PanelOrientadorDashboard orientador={orientador} onSalir={() => setOrientador(null)} />
    : <LoginOrientador onAcceso={setOrientador} />
}
