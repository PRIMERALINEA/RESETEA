import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import OrientadorAcceso from '@/components/OrientadorAcceso'
import ConvivenciaReceptorCard from '@/components/ConvivenciaReceptorCard'
import { supabase } from '@/api/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Activity, TrendingUp, Brain, Calendar, AlertTriangle,
  BookOpen, Heart, RefreshCw, LogOut, Eye, EyeOff,
  BarChart2, Shield, GraduationCap, Zap, Wind
} from 'lucide-react'

// ── COLORES POR TIPO ──────────────────────────────────────────
const TIPO_CONFIG = {
  respiracion: { label: 'Respiración',    emoji: '🌬️', color: '#0891b2' },
  anclaje:     { label: 'Anclaje',         emoji: '⚓',  color: '#1d4ed8' },
  relajacion:  { label: 'Relajación',      emoji: '💆',  color: '#be185d' },
  tecnica:     { label: 'Técnica rápida',  emoji: '⚡',  color: '#b45309' },
  diario:      { label: 'Diario',          emoji: '📓',  color: '#7c3aed' },
  test:        { label: 'Test estrés',     emoji: '🧠',  color: '#065f46' },
}
const NIVEL_COLOR = {
  'Mínima (0-4)':    { color: '#16a34a', bg: '#dcfce7' },
  'Leve (5-9)':      { color: '#ca8a04', bg: '#fef9c3' },
  'Moderada (10-14)':{ color: '#ea580c', bg: '#ffedd5' },
  'Severa (15+)':    { color: '#dc2626', bg: '#fee2e2' },
}

// ── K-ANONIMATO (RGPD art. 9 + LOPDGDD) ──────────────────────
// Valores < K_UMBRAL no se muestran para evitar identificación
// individual en grupos pequeños. Datos de salud = categoría especial.
const K_UMBRAL = 5
const maskVal = (v) => (v == null || v < K_UMBRAL) ? `<${K_UMBRAL}` : v
const isMasked = (v) => (v == null || v < K_UMBRAL)

function KpiCard({ icon: Icon, label, value, sub, color, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ background: color + '20' }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <p className="text-2xl font-black text-slate-800">{value ?? '—'}</p>
      <p className="text-xs font-semibold text-slate-600 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </motion.div>
  )
}

// ── DASHBOARD PRINCIPAL ───────────────────────────────────────
function Dashboard({ orientador, onSalir }) {
  const [tab, setTab]           = useState('resumen')
  const [loading, setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)

  // Datos alumnos
  const [dashboard, setDashboard]     = useState(null)
  const [porTipo, setPorTipo]         = useState([])
  const [ansiedad, setAnsiedad]       = useState([])
  const [quincenal, setQuincenal]     = useState(null)
  const [sesionStats, setSesionStats] = useState(null)
  const [activos7, setActivos7] = useState(null)   // solo un número (o null si hay menos de 5)

  // Datos docentes
  const [docResumen, setDocResumen]   = useState(null)   // solo totales, nunca filas por docente
  const [loadingDocentes, setLoadingDocentes] = useState(false)

  // Datos grupos
  const [grupos, setGrupos]           = useState([])
  const [loadingGrupos, setLoadingGrupos] = useState(false)

  const cargar = async (silencioso = false) => {
    if (!silencioso) setLoading(true); else setRefreshing(true)
    try {
      const centroId = orientador.centro_id
      const [r1, r2, r3, r4, r5, r6] = await Promise.all([
        supabase.rpc('get_resetea_dashboard',            { p_centro_id: centroId }),
        supabase.rpc('get_resetea_actividades_por_tipo', { p_centro_id: centroId }),
        supabase.rpc('get_resetea_ansiedad_stats',       { p_centro_id: centroId }),
        supabase.rpc('get_resetea_eval_quincenal_stats', { p_centro_id: centroId }),
        supabase.rpc('get_resetea_eval_sesion_stats',    { p_centro_id: centroId }),
        supabase.rpc('panel_usuarios_activos'),
      ])

      // Dashboard — devuelve objeto JSON directamente
      if (r1.data) setDashboard(r1.data)

      // Actividades por tipo — devuelve array de tuplas {tipo, count}
      if (r2.data) setPorTipo(r2.data)

      // Ansiedad — devuelve array JSON [{nivel, total, porcentaje}]
      if (r3.data) {
        try {
          const parsed = typeof r3.data === 'string' ? JSON.parse(r3.data) : r3.data
          setAnsiedad(Array.isArray(parsed) ? parsed : [])
        } catch { setAnsiedad([]) }
      }

      // Quincenal — devuelve objeto JSON
      if (r4.data) {
        try {
          setQuincenal(typeof r4.data === 'string' ? JSON.parse(r4.data) : r4.data)
        } catch { setQuincenal(null) }
      }

      // Sesión stats — devuelve objeto JSON
      if (r5.data) {
        try {
          setSesionStats(typeof r5.data === 'string' ? JSON.parse(r5.data) : r5.data)
        } catch { setSesionStats(null) }
      }

      // Usuarios activos (7 días) — solo el total; null si hay menos de 5
      setActivos7(r6.data?.activos7 ?? null)

      setLastUpdate(new Date())
    } catch (e) { console.error('Error cargando datos orientador:', e) }
    finally { setLoading(false); setRefreshing(false) }
  }

  const cargarDocentes = async () => {
    setLoadingDocentes(true)
    try {
      const { data, error } = await supabase.rpc('panel_docentes_resumen')
      if (error) throw error
      setDocResumen(data || null)
    } catch (e) { console.error(e); setDocResumen(null) }
    finally { setLoadingDocentes(false) }
  }

  const ORDEN_CURSOS = [
    '1º Primaria','2º Primaria','3º Primaria','4º Primaria','5º Primaria','6º Primaria',
    '1º ESO','2º ESO','3º ESO','4º ESO',
    '1º Bachillerato','2º Bachillerato',
    'FP Básica','1º FP Medio','2º FP Medio','1º FP Superior','2º FP Superior','Sin curso','Otros cursos'
  ]

  // El servidor devuelve ya una fila por curso (mínimo 5 alumnos por curso) y con
  // las cifras pequeñas vacías. Aquí solo se ordena.
  const cargarGrupos = async () => {
    setLoadingGrupos(true)
    try {
      const { data, error } = await supabase.rpc('panel_grupos')
      if (error) throw error
      const lista = Array.isArray(data) ? data : []
      lista.sort((a, b) => {
        const ia = ORDEN_CURSOS.indexOf(a.curso), ib = ORDEN_CURSOS.indexOf(b.curso)
        return (ia === -1 ? 98 : ia) - (ib === -1 ? 98 : ib)
      })
      setGrupos(lista)
    } catch (e) { console.error(e); setGrupos([]) }
    finally { setLoadingGrupos(false) }
  }

  useEffect(() => { cargar() }, [])
  useEffect(() => { if (tab === 'docentes') cargarDocentes() }, [tab])
  useEffect(() => { if (tab === 'grupos') cargarGrupos() }, [tab])

  // Suscripciones realtime
  useEffect(() => {
    const tablas = ['sesiones_respiracion','sesiones_anclaje','sesiones_relajacion','sesiones_tecnicas','test_estres','diario_estudiante','evaluaciones_quincenales']
    const subs = tablas.map(t =>
      supabase.channel('rt_' + t)
        .on('postgres_changes', { event: '*', schema: 'public', table: t }, () => cargar(true))
        .subscribe()
    )
    return () => subs.forEach(s => supabase.removeChannel(s))
  }, [])

  const TABS = [
    { id: 'resumen',      label: 'Resumen',   icon: BarChart2 },
    { id: 'herramientas', label: 'Uso',        icon: Activity },
    { id: 'ansiedad',     label: 'Ansiedad',   icon: Brain },
    { id: 'quincenal',    label: 'Quincenal',  icon: Calendar },
    { id: 'grupos',       label: 'Grupos',     icon: BookOpen },
    { id: 'docentes',     label: 'Docentes',   icon: GraduationCap },
  ]

  const maxTipo = Math.max(...porTipo.map(h => h.count ?? h.total ?? 0), 1)

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <p className="font-black text-slate-800">Panel Orientador</p>
            {refreshing && <RefreshCw className="w-3.5 h-3.5 text-teal-500 animate-spin" />}
          </div>
          <p className="text-slate-500 text-xs mt-0.5">
            {orientador.centro} · {lastUpdate ? `Actualizado: ${lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}` : 'Cargando...'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => cargar(false)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-teal-600 bg-teal-50">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={onSalir}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-red-500 bg-red-50">
            <LogOut className="w-3.5 h-3.5" /> Salir
          </button>
        </div>
      </div>

      {/* Avisos de convivencia (solo se muestra a receptores; no enseña contenido) */}
      <div className="empty:hidden mb-4"><ConvivenciaReceptorCard /></div>

      {/* Aviso privacidad */}
      <div className="bg-blue-50 rounded-2xl p-3 mb-4 flex items-start gap-2 border border-blue-100">
        <Shield className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-blue-700 text-xs leading-relaxed">
          Todos los datos son <strong>anónimos y agregados</strong>. No se identifican usuarios individuales.
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
              border: tab === t.id ? 'none' : '1px solid #e2e8f0',
            }}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
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
            <motion.div key="resumen" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <KpiCard icon={Users}      label="Usuarios registrados"  value={dashboard?.total_usuarios}          color="#0f6b6b" delay={0.05} />
                <KpiCard icon={Activity}   label="Actividades totales"    value={dashboard?.total_actividades}       color="#7c3aed" delay={0.1} />
                <KpiCard icon={Calendar}   label="Actividades hoy"        value={dashboard?.actividades_hoy}         color="#0891b2" delay={0.15} />
                <KpiCard icon={TrendingUp} label="Usuarios activos (7d)"  value={activos7 == null ? `<${K_UMBRAL}` : activos7} color="#b45309" delay={0.2} sub="Últimos 7 días" />
              </div>

              {/* Métricas adicionales del dashboard */}
              {dashboard && (
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-3">
                  <p className="font-black text-slate-800">Desglose de actividad</p>
                  {Object.entries(dashboard)
                    .filter(([k]) => !['total_usuarios', 'total_actividades', 'actividades_hoy'].includes(k))
                    .map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
                        <p className="text-sm text-slate-600 capitalize">{k.replace(/_/g, ' ')}</p>
                        <p className="font-black text-slate-800">{v ?? '—'}</p>
                      </div>
                    ))}
                </div>
              )}


            </motion.div>
          )}

          {/* ── USO POR HERRAMIENTA ── */}
          {tab === 'herramientas' && (
            <motion.div key="herramientas" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
                <p className="font-black text-slate-800 mb-4">Uso por herramienta</p>
                {porTipo.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-4">Sin datos de uso aún</p>
                ) : (
                  <div className="space-y-4">
                    {porTipo.map((h, i) => {
                      const tipo = h.tipo ?? h[0]
                      const total = h.count ?? h.total ?? h[1] ?? 0
                      const cfg = TIPO_CONFIG[tipo] || { label: tipo, emoji: '📱', color: '#64748b' }
                      const pct = Math.round((total / maxTipo) * 100)
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span>{cfg.emoji}</span>
                              <span className="text-sm font-medium text-slate-700">{cfg.label}</span>
                            </div>
                            <span className="font-black text-sm" style={{ color: cfg.color }}>{total} usos</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8 }}
                              className="h-full rounded-full" style={{ background: cfg.color }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Pre/post sesión */}
              {sesionStats && (
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
                  <p className="font-black text-slate-800 mb-1">Eficacia de las sesiones</p>
                  <p className="text-slate-400 text-xs mb-4">Evaluaciones pre/post de los usuarios</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-2xl p-3 text-center">
                      <p className="font-black text-xl text-slate-800">{sesionStats.total_evaluaciones ?? '—'}</p>
                      <p className="text-xs text-slate-500">Evaluaciones</p>
                    </div>
                    <div className="bg-green-50 rounded-2xl p-3 text-center">
                      <p className="font-black text-xl text-green-700">{sesionStats.mejoria_promedio ?? '—'}</p>
                      <p className="text-xs text-green-600">Mejora media</p>
                    </div>
                    {sesionStats.pct_ayudo_si != null && (
                      <>
                        <div className="bg-emerald-50 rounded-2xl p-3 text-center">
                          <p className="font-black text-xl text-emerald-700">{sesionStats.pct_ayudo_si}%</p>
                          <p className="text-xs text-emerald-600">✅ Ayudó</p>
                        </div>
                        <div className="bg-amber-50 rounded-2xl p-3 text-center">
                          <p className="font-black text-xl text-amber-700">{sesionStats.pct_ayudo_algo ?? '—'}%</p>
                          <p className="text-xs text-amber-600">🟡 Algo</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── ANSIEDAD ── */}
          {tab === 'ansiedad' && (
            <motion.div key="ansiedad" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-5 h-5 text-rose-500" />
                  <p className="font-black text-slate-800">Distribución de ansiedad (Test estrés)</p>
                </div>
                {ansiedad.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-4">Sin tests completados aún</p>
                ) : (
                  <div className="space-y-3">
                    {ansiedad.map((a, i) => {
                      const cfg = NIVEL_COLOR[a.nivel] || { color: '#64748b', bg: '#f1f5f9' }
                      const pct = a.porcentaje ?? 0
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-xs font-bold px-2 py-1 rounded-lg w-36 text-center flex-shrink-0"
                            style={{ color: cfg.color, background: cfg.bg }}>{a.nivel}</span>
                          <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8 }}
                              className="h-full rounded-full" style={{ background: cfg.color }} />
                          </div>
                          <span className="text-sm font-black w-24 text-right flex-shrink-0"
                            style={{ color: cfg.color }}>
                            {a.total} ({pct}%)
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── QUINCENAL ── */}
          {tab === 'quincenal' && (
            <motion.div key="quincenal" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
                <p className="font-black text-slate-800 mb-1">Evaluaciones quincenales del grupo</p>
                <p className="text-slate-400 text-xs mb-4">Escala 1-5 · Promedio del grupo</p>
                {!quincenal ? (
                  <p className="text-slate-400 text-sm text-center py-4">Sin evaluaciones completadas aún</p>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Total evaluaciones', val: quincenal.total_evaluaciones, emoji: '📋', color: '#6366f1' },
                        { label: 'Rumiación media',    val: quincenal.rumiacion_promedio,  emoji: '🔄', color: '#dc2626', inv: true },
                        { label: 'Atención presente',  val: quincenal.atencion_promedio ?? quincenal.atencion_pro, emoji: '🎯', color: '#16a34a' },
                        { label: 'Calma',              val: quincenal.calma_promedio,      emoji: '🌊', color: '#0891b2' },
                        { label: 'Bienestar',          val: quincenal.bienestar_promedio,  emoji: '✨', color: '#f59e0b' },
                      ].filter(i => i.val != null).map(({ label, val, emoji, color, inv }) => {
                        const score = parseFloat(val)
                        const bueno = inv ? score <= 2.5 : score >= 3.5
                        const c = isNaN(score) ? color : bueno ? '#16a34a' : score >= 3 ? '#ca8a04' : '#dc2626'
                        return (
                          <div key={label} className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                            <p className="text-lg mb-1">{emoji}</p>
                            <p className="font-black text-xl" style={{ color: c }}>{val}</p>
                            <p className="text-xs font-medium text-slate-700">{label}</p>
                          </div>
                        )
                      })}
                    </div>
                    {/* Mostrar todos los campos del objeto */}
                    <div className="bg-slate-50 rounded-2xl p-4">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Todos los datos</p>
                      {Object.entries(quincenal).map(([k, v]) => (
                        <div key={k} className="flex justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                          <span className="text-slate-500 capitalize">{k.replace(/_/g, ' ')}</span>
                          <span className="font-bold text-slate-700">{v ?? '—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── GRUPOS ── */}
          {tab === 'grupos' && (
            <motion.div key="grupos" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {loadingGrupos ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                </div>
              ) : grupos.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-slate-100">
                  <p className="text-4xl mb-2">📚</p>
                  <p className="font-bold text-slate-700">Sin datos de grupos aún</p>
                  <p className="text-slate-400 text-sm mt-1">Los alumnos deben registrarse indicando su curso</p>
                </div>
              ) : (
                <>
                  {/* ── AVISO PRIVACIDAD K-ANONIMATO ── */}
                  <div className="bg-amber-50 rounded-2xl p-3 border border-amber-200 flex items-start gap-2">
                    <span className="text-sm flex-shrink-0 mt-0.5">⚖️</span>
                    <p className="text-amber-800 text-xs leading-relaxed">
                      <strong>Protección de privacidad activa.</strong> Los valores inferiores a {K_UMBRAL} alumnos
                      se muestran como "&lt;{K_UMBRAL}" para impedir la identificación individual.
                      Cumplimiento RGPD art. 9 (datos de salud) y LOPDGDD.
                    </p>
                  </div>

                  {/* Alertas de grupos con ansiedad alta */}
                  {grupos.some(g => g.ansiedad_severa >= K_UMBRAL) && (
                    <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
                      <p className="font-bold text-red-800 text-sm mb-2">🔴 Grupos con ansiedad severa</p>
                      <div className="space-y-1">
                        {grupos.filter(g => g.ansiedad_severa >= K_UMBRAL).map(g => (
                          <div key={g.curso} className="flex items-center justify-between text-xs bg-white rounded-xl px-3 py-2">
                            <span className="font-bold text-slate-700">{g.curso}</span>
                            <span className="font-black text-red-600">{maskVal(g.ansiedad_severa)} alumnos con ansiedad severa</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tarjeta por grupo */}
                  {grupos.map((g, i) => {
                    const ansColor = !g.ansiedad_media ? '#64748b'
                      : g.ansiedad_media <= 4 ? '#16a34a'
                      : g.ansiedad_media <= 9 ? '#ca8a04'
                      : g.ansiedad_media <= 14 ? '#ea580c'
                      : '#dc2626'
                    const totalSes = (g.sesiones_respiracion || 0) + (g.sesiones_relajacion || 0) + (g.sesiones_anclaje || 0)
                    const maxSes = Math.max(g.sesiones_respiracion || 0, g.sesiones_relajacion || 0, g.sesiones_anclaje || 0, 1)
                    const ultimaResp = g.ultima_sesion_respiracion
                      ? new Date(g.ultima_sesion_respiracion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—'
                    const ultimaRelaj = g.ultima_sesion_relajacion
                      ? new Date(g.ultima_sesion_relajacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—'

                    return (
                      <motion.div key={g.curso}
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">

                        {/* Cabecera grupo */}
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="font-black text-slate-800 text-lg">{g.curso}</p>
                            <p className="text-slate-400 text-xs">{g.total_alumnos} alumnos · {g.alumnos_con_test == null ? `<${K_UMBRAL}` : g.alumnos_con_test} con test</p>
                          </div>
                          {g.ansiedad_severa >= K_UMBRAL && (
                            <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-lg">
                              ⚠️ {g.ansiedad_severa} severa
                            </span>
                          )}
                        </div>

                        {/* Ansiedad */}
                        <div className="mb-4">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ansiedad</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-slate-50 rounded-xl p-3 text-center">
                              <p className="font-black text-xl" style={{ color: ansColor }}>
                                {g.ansiedad_media ?? '—'}
                              </p>
                              <p className="text-xs text-slate-400">Media grupo</p>
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                              {[
                                { label: 'Severa',   val: g.ansiedad_severa,   color: '#dc2626', bg: '#fee2e2' },
                                { label: 'Moderada', val: g.ansiedad_moderada, color: '#ea580c', bg: '#ffedd5' },
                                { label: 'Leve',     val: g.ansiedad_leve,     color: '#ca8a04', bg: '#fef9c3' },
                                { label: 'Mínima',   val: g.ansiedad_minima,   color: '#16a34a', bg: '#dcfce7' },
                              ].map(n => {
                                const mv = maskVal(n.val ?? 0)
                                const masked = isMasked(n.val ?? 0)
                                return (
                                  <div key={n.label} className="rounded-lg p-1.5 text-center"
                                    style={{ background: masked ? '#f8fafc' : n.bg, border: masked ? '1px dashed #e2e8f0' : 'none' }}>
                                    <p className="font-black text-sm" style={{ color: masked ? '#94a3b8' : n.color }}>{mv}</p>
                                    <p className="text-xs" style={{ color: masked ? '#94a3b8' : n.color, fontSize: '9px' }}>{n.label}</p>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Uso de técnicas */}
                        <div className="mb-4">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                            Uso de técnicas · {totalSes} sesiones totales
                            {g.respiracion_semana > 0 && (
                              <span className="ml-2 text-teal-500 normal-case font-semibold">
                                ({g.respiracion_semana} esta semana)
                              </span>
                            )}
                          </p>
                          <div className="space-y-2">
                            {[
                              { label: 'Respiración', val: g.sesiones_respiracion || 0, color: '#0891b2', emoji: '🌬️', ultima: ultimaResp },
                              { label: 'Relajación',  val: g.sesiones_relajacion  || 0, color: '#be185d', emoji: '💆', ultima: ultimaRelaj },
                              { label: 'Anclaje',     val: g.sesiones_anclaje     || 0, color: '#1d4ed8', emoji: '⚓', ultima: null },
                            ].map(t => (
                              <div key={t.label}>
                                <div className="flex items-center justify-between mb-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-sm">{t.emoji}</span>
                                    <span className="text-xs font-medium text-slate-600">{t.label}</span>
                                    {t.ultima && (
                                      <span className="text-xs text-slate-300">· última: {t.ultima}</span>
                                    )}
                                  </div>
                                  <span className="text-xs font-black" style={{ color: t.color }}>{t.val}</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                  <motion.div initial={{ width: 0 }}
                                    animate={{ width: `${Math.round((t.val / maxSes) * 100)}%` }}
                                    transition={{ duration: 0.8, delay: i * 0.06 }}
                                    className="h-full rounded-full" style={{ background: t.color }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                      </motion.div>
                    )
                  })}

                  <button onClick={cargarGrupos}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100">
                    <RefreshCw className="w-3.5 h-3.5" /> Actualizar datos de grupos
                  </button>
                </>
              )}
            </motion.div>
          )}

          {/* ── DOCENTES ── */}
          {tab === 'docentes' && (
            <motion.div key="docentes" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {loadingDocentes ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {!docResumen || docResumen.suprimido ? (
                    <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-slate-100">
                      <p className="text-4xl mb-2">👩‍🏫</p>
                      <p className="font-bold text-slate-700">Datos de docentes no disponibles</p>
                      <p className="text-slate-400 text-sm mt-1">
                        Se muestran cuando hay al menos {K_UMBRAL} docentes registrados en el centro,
                        para que ninguna cifra pueda atribuirse a una persona concreta.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <KpiCard icon={GraduationCap} label="Docentes registrados" value={docResumen.total_docentes} color="#6366f1" delay={0.05} />
                        <KpiCard icon={Activity}      label="Sesiones totales"      value={docResumen.total_sesiones}  color="#f97316" delay={0.1} />
                        <KpiCard icon={Calendar}      label="Activos esta semana"   value={docResumen.activos7}        color="#0891b2" delay={0.15} sub="Últimos 7 días" />
                        <KpiCard icon={TrendingUp}    label="Activos este mes"      value={docResumen.activos30}       color="#10b981" delay={0.2}  sub="Últimos 30 días" />
                      </div>

                      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
                        <p className="font-black text-slate-800 mb-4">Uso por herramienta (docentes)</p>
                        <div className="space-y-3">
                          {(() => {
                            const pt = docResumen.por_tipo || {}
                            const maxT = Math.max(pt.respiracion || 0, pt.relajacion || 0, pt.anclaje || 0, 1)
                            return [
                              { tipo: 'respiracion', label: 'Respiración', emoji: '🌬️', color: '#0891b2' },
                              { tipo: 'relajacion',  label: 'Relajación',  emoji: '💆',  color: '#be185d' },
                              { tipo: 'anclaje',     label: 'Anclaje',     emoji: '⚓',  color: '#1d4ed8' },
                            ].map(h => {
                              const total = pt[h.tipo] || 0
                              return (
                                <div key={h.tipo}>
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                      <span>{h.emoji}</span>
                                      <span className="text-sm font-medium text-slate-700">{h.label}</span>
                                    </div>
                                    <span className="font-black text-sm" style={{ color: h.color }}>{total} usos</span>
                                  </div>
                                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.round((total / maxT) * 100)}%` }}
                                      transition={{ duration: 0.8 }}
                                      className="h-full rounded-full" style={{ background: h.color }} />
                                  </div>
                                </div>
                              )
                            })
                          })()}
                        </div>
                      </div>

                      {docResumen.sin_actividad_14 >= K_UMBRAL && (
                        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <p className="text-amber-800 text-sm font-bold">
                            {docResumen.sin_actividad_14} docentes sin actividad en +14 días
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  <button onClick={cargarDocentes}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-100">
                    <RefreshCw className="w-3.5 h-3.5" /> Actualizar datos de docentes
                  </button>
                </>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      )}
    </div>
  )
}

// ── RAÍZ ─────────────────────────────────────────────────────
export default function PanelOrientador() {
  const navigate = useNavigate()
  const [orientador, setOrientador] = useState(null)
  return orientador
    ? <Dashboard orientador={orientador} onSalir={() => navigate('/docentes')} />
    : <OrientadorAcceso onAcceso={setOrientador} />
}
