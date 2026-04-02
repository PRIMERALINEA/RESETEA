import React, { useState, useEffect } from 'react'
import { supabase } from '@/api/supabaseClient'
import { motion } from 'framer-motion'
import { User, Wind, Anchor, Heart, BookOpen, Brain, Zap, TrendingUp, Calendar, Award, ChevronDown, ChevronUp, Share2, FileText, Copy, Check } from 'lucide-react'

const LOGO_URL = 'https://zbusdixrxedfhbkquafh.supabase.co/storage/v1/object/public/logo/Gemini_Generated_Image_rar33drar33drar3.png'

const TIPO_CONFIG = {
  respiracion: { label: 'Respiración',     emoji: '🌬️', color: '#0f6b6b', bg: '#ccfbf1' },
  anclaje:     { label: 'Anclaje',          emoji: '⚓', color: '#1d4ed8', bg: '#dbeafe' },
  relajacion:  { label: 'Relajación',       emoji: '💆', color: '#be185d', bg: '#fce7f3' },
  tecnica:     { label: 'Técnica rápida',   emoji: '⚡', color: '#b45309', bg: '#fef3c7' },
  diario:      { label: 'Diario emocional', emoji: '📓', color: '#7c3aed', bg: '#ede9fe' },
  test:        { label: 'Test de estrés',   emoji: '🧠', color: '#065f46', bg: '#d1fae5' },
}

function formatFecha(iso) {
  const d = new Date(iso)
  const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
  return `${d.getDate()} ${meses[d.getMonth()]} · ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

function diasAtras(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

function StatCard({ icon: Icon, label, value, color, delay }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: color + '20' }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-black text-slate-800">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </motion.div>
  )
}

export default function MiPerfil() {
  const [periodoIdx, setPeriodoIdx] = useState(0)
  const [showAll, setShowAll] = useState(false)
  const [mostrarResumen, setMostrarResumen] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [diario, setDiario] = useState([])
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')
  const [datos, setDatos] = useState({
    respiracion: [], anclajes: [], relajacion: [],
    tecnicas: [], diario: [], tests: []
  })

  const PERIODOS = [
    { label: 'Esta semana', dias: 7 },
    { label: 'Este mes',    dias: 30 },
    { label: 'Todo',        dias: 3650 },
  ]

  useEffect(() => {
    const cargar = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUserEmail(user.email || '')
      const uid = user.id
      // Cargar diario completo
      const { data: dDiario } = await supabase.from('diario_completo')
        .select('*').eq('user_id', uid).order('fecha_entrada', { ascending: false }).limit(30)
      if (dDiario) setDiario(dDiario)
      const [r1, r2, r3, r4, r5, r6] = await Promise.all([
        supabase.from('sesiones_respiracion').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
        supabase.from('sesiones_anclaje').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
        supabase.from('sesiones_relajacion').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
        supabase.from('sesiones_tecnicas').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
        supabase.from('diario_estudiante').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
        supabase.from('test_estres').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      ])
      setDatos({
        respiracion: r1.data || [],
        anclajes:    r2.data || [],
        relajacion:  r3.data || [],
        tecnicas:    r4.data || [],
        diario:      r5.data || [],
        tests:       r6.data || [],
      })
      setLoading(false)
    }
    cargar()
  }, [])

  const cutoff = diasAtras(PERIODOS[periodoIdx].dias)
  const f = (arr) => arr.filter(s => new Date(s.created_at) > cutoff)

  const rResp = f(datos.respiracion)
  const rAnc  = f(datos.anclajes)
  const rRel  = f(datos.relajacion)
  const rTec  = f(datos.tecnicas)
  const rDia  = f(datos.diario)
  const rTest = f(datos.tests)

  const totalSesiones = rResp.length + rAnc.length + rRel.length + rTec.length + rDia.length + rTest.length
  const totalMinutos  = Math.round(
    [...rResp, ...rRel, ...rTec].reduce((a, s) => a + (s.duracion_segundos || 0), 0) / 60
  )

  // Historial unificado ordenado por fecha
  const historial = [
    ...datos.respiracion.map(s => ({ ...s, tipo: 'respiracion', nombre: s.ejercicio_nombre || 'Respiración' })),
    ...datos.anclajes.map(s => ({ ...s, tipo: 'anclaje',     nombre: s.tecnica_nombre || 'Anclaje' })),
    ...datos.relajacion.map(s => ({ ...s, tipo: 'relajacion', nombre: 'Relajación Jacobson' })),
    ...datos.tecnicas.map(s => ({ ...s, tipo: 'tecnica',     nombre: s.tecnica_nombre || 'Técnica rápida' })),
    ...datos.diario.map(s => ({ ...s, tipo: 'diario',       nombre: `Diario · ${s.emocion || 'emoción'}` })),
    ...datos.tests.map(s => ({ ...s, tipo: 'test',          nombre: `Test estrés · ${s.puntuacion ?? 0} pts` })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const historialFiltrado = historial.filter(s => new Date(s.created_at) > cutoff)
  const historialMostrado = showAll ? historialFiltrado : historialFiltrado.slice(0, 10)

  // Logros
  const logros = [
    { emoji: '🌱', label: 'Primera sesión',    conseguido: historial.length >= 1 },
    { emoji: '⭐', label: '5 sesiones',         conseguido: historial.length >= 5 },
    { emoji: '🔥', label: '10 sesiones',        conseguido: historial.length >= 10 },
    { emoji: '🌬️', label: 'Respirador',         conseguido: datos.respiracion.length >= 3 },
    { emoji: '⚓', label: 'Bien anclado',        conseguido: datos.anclajes.length >= 3 },
    { emoji: '📓', label: 'Diario activo',       conseguido: datos.diario.length >= 5 },
    { emoji: '💆', label: 'Cuerpo relajado',     conseguido: datos.relajacion.length >= 2 },
    { emoji: '🗺️', label: 'Explorador',          conseguido: [datos.respiracion, datos.anclajes, datos.relajacion, datos.diario].filter(a => a.length > 0).length >= 4 },
  ]

  const generarTextoResumen = () => {
    const periodo = PERIODOS[periodoIdx].label
    const fechaHoy = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    const diarFilt = diario.filter(d => new Date(d.fecha_entrada) > diasAtras(PERIODOS[periodoIdx].dias))

    // Emociones más frecuentes del diario
    const emocionesCount = {}
    diarFilt.forEach(d => { if (d.emocion_principal) emocionesCount[d.emocion_principal] = (emocionesCount[d.emocion_principal] || 0) + 1 })
    const topEmociones = Object.entries(emocionesCount).sort((a,b) => b[1]-a[1]).slice(0,3).map(([e]) => e).join(', ')

    // Media de intensidad
    const intensidades = diarFilt.filter(d => d.intensidad != null).map(d => d.intensidad)
    const mediaInt = intensidades.length ? (intensidades.reduce((a,b) => a+b, 0) / intensidades.length).toFixed(1) : null

    // Media estrés
    const estres = diarFilt.filter(d => d.nivel_estres != null).map(d => d.nivel_estres)
    const mediaEstres = estres.length ? (estres.reduce((a,b) => a+b, 0) / estres.length).toFixed(1) : null

    // Pensamientos más frecuentes
    const pensamientosAll = diarFilt.flatMap(d => d.pensamientos || [])
    const topPens = [...new Set(pensamientosAll)].slice(0,3).join(', ')

    // Estrategias
    const estrategiasAll = diarFilt.flatMap(d => d.estrategia_usada || [])
    const estrategiasCount = {}
    estrategiasAll.forEach(e => { estrategiasCount[e] = (estrategiasCount[e] || 0) + 1 })
    const topEstr = Object.entries(estrategiasCount).sort((a,b) => b[1]-a[1]).slice(0,2).map(([e]) => e).join(', ')

    // Tests ansiedad
    const testsF = f(datos.tests)
    const mediaTest = testsF.length ? (testsF.reduce((a,s) => a + (s.puntuacion||0), 0) / testsF.length).toFixed(1) : null

    let texto = `RESUMEN EMOCIONAL · RESETEA
Generado el ${fechaHoy}
Período: ${periodo}
─────────────────────────────

📊 ACTIVIDAD
• Sesiones de bienestar: ${totalSesiones}
• Minutos de práctica: ${totalMinutos}
• Entradas en el diario: ${rDia.length}

❤️ ESTADO EMOCIONAL
`
    if (topEmociones) texto += `• Emociones más frecuentes: ${topEmociones}
`
    if (mediaInt) texto += `• Intensidad emocional media: ${mediaInt}/10
`
    if (mediaEstres) texto += `• Nivel de estrés medio: ${mediaEstres}/10
`
    if (mediaTest) texto += `• Puntuación media GAD-7: ${mediaTest}/21
`

    if (topPens) {
      texto += `
🧠 PENSAMIENTOS RECURRENTES
• ${topPens}
`
    }

    if (topEstr) {
      texto += `
🤔 CÓMO GESTIONÉ LAS EMOCIONES
• ${topEstr}
`
    }

    texto += `
🛠️ HERRAMIENTAS USADAS
• Respiración: ${rResp.length} veces
• Anclaje: ${rAnc.length} veces
• Relajación: ${rRel.length} veces
• Técnicas rápidas: ${rTec.length} veces

─────────────────────────────
Este resumen ha sido generado automáticamente por la app Resetea.
Los datos son personales y confidenciales.`

    return texto
  }

  const copiarResumen = () => {
    const texto = generarTextoResumen()
    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 3000)
    })
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f0f9f9' }}>
      <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-lg mx-auto px-4 py-6">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
          style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>
          <User className="w-8 h-8 text-white" />
        </div>
        <div>
          <p className="font-black text-xl" style={{ color: '#0d3d3d' }}>
            {userEmail.split('@')[0]}
          </p>
          <p className="text-slate-500 text-sm">{userEmail}</p>
          <p className="text-teal-600 text-xs font-medium mt-0.5">
            {historial.length} actividades en total
          </p>
        </div>
      </motion.div>

      {/* Selector periodo */}
      <div className="flex gap-2 mb-6">
        {PERIODOS.map((p, i) => (
          <button key={i} onClick={() => { setPeriodoIdx(i); setShowAll(false) }}
            className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
            style={{
              background: periodoIdx === i ? 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' : 'white',
              color: periodoIdx === i ? 'white' : '#64748b',
              border: periodoIdx === i ? 'none' : '1px solid #e2e8f0'
            }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard icon={TrendingUp} label="Actividades"         value={totalSesiones} color="#0f6b6b"  delay={0.1} />
        <StatCard icon={Calendar}   label="Minutos de bienestar" value={totalMinutos}  color="#7c3aed"  delay={0.15} />
        <StatCard icon={Wind}       label="Respiraciones"        value={rResp.length}  color="#0891b2"  delay={0.2} />
        <StatCard icon={Heart}      label="Relajaciones"         value={rRel.length}   color="#be185d"  delay={0.25} />
        <StatCard icon={Anchor}     label="Anclajes"             value={rAnc.length}   color="#1d4ed8"  delay={0.3} />
        <StatCard icon={BookOpen}   label="Diario emocional"     value={rDia.length}   color="#7c3aed"  delay={0.35} />
      </div>

      {/* Botón resumen emocional */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}
        className="mb-4">
        <button onClick={() => setMostrarResumen(!mostrarResumen)}
          className="w-full py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2 shadow-md"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #0d3d3d)' }}>
          <FileText className="w-5 h-5" />
          {mostrarResumen ? 'Ocultar resumen' : '📋 Generar resumen para compartir'}
        </button>
      </motion.div>

      {mostrarResumen && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-violet-600" />
              <p className="font-black text-slate-800">Resumen emocional</p>
            </div>
            <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
              {PERIODOS[periodoIdx].label}
            </span>
          </div>
          <p className="text-slate-500 text-xs mb-4 leading-relaxed">
            Resumen de tus datos de bienestar. Puedes copiarlo y compartirlo con tu orientador, tutor o psicólogo.
          </p>
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-4 overflow-auto max-h-64">
            <pre className="text-xs text-slate-600 whitespace-pre-wrap font-mono leading-relaxed">
              {generarTextoResumen()}
            </pre>
          </div>
          <div className="flex gap-2">
            <button onClick={copiarResumen}
              className="flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
              style={{ background: copiado ? '#dcfce7' : 'linear-gradient(135deg, #7c3aed, #0d3d3d)', color: copiado ? '#16a34a' : 'white' }}>
              {copiado ? <><Check className="w-4 h-4" /> Copiado</> : <><Copy className="w-4 h-4" /> Copiar al portapapeles</>}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-3 text-center">
            🔒 Solo tú decides con quién compartes este resumen
          </p>
        </motion.div>
      )}

      {/* Logros */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-amber-500" />
          <p className="font-black text-slate-800">Mis logros</p>
          <span className="text-xs text-slate-400 ml-auto">
            {logros.filter(l => l.conseguido).length}/{logros.length}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {logros.map((logro, i) => (
            <div key={i} className="flex flex-col items-center gap-1 text-center">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${logro.conseguido ? 'shadow-md' : 'grayscale opacity-30'}`}
                style={{ background: logro.conseguido ? '#fef3c7' : '#f1f5f9' }}>
                {logro.emoji}
              </div>
              <p className="text-xs font-medium text-slate-600 leading-tight">{logro.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Historial */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
        <div className="flex items-center justify-between mb-3">
          <p className="font-black text-slate-800">Historial de actividades</p>
          <span className="text-xs text-slate-400">{historialFiltrado.length} registros</span>
        </div>

        {historialFiltrado.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-100">
            <p className="text-4xl mb-2">🌱</p>
            <p className="text-slate-500 text-sm font-medium">Sin actividades en este periodo</p>
            <p className="text-slate-400 text-xs mt-1">¡Empieza una sesión para ver tu progreso!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {historialMostrado.map((item, i) => {
              const cfg = TIPO_CONFIG[item.tipo] || TIPO_CONFIG.tecnica
              const durMin = item.duracion_segundos ? Math.round(item.duracion_segundos / 60) : null
              return (
                <motion.div key={`${item.tipo}-${item.id}`}
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: cfg.bg }}>
                    {cfg.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{item.nombre}</p>
                    <p className="text-xs text-slate-400">{formatFecha(item.created_at)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-bold px-2 py-1 rounded-lg"
                      style={{ color: cfg.color, background: cfg.bg }}>
                      {cfg.label}
                    </span>
                    {durMin !== null && durMin > 0 && (
                      <p className="text-xs text-slate-400 mt-1">{durMin} min</p>
                    )}
                  </div>
                </motion.div>
              )
            })}

            {historialFiltrado.length > 10 && (
              <button onClick={() => setShowAll(!showAll)}
                className="w-full py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
                style={{ background: 'white', border: '1px solid #e2e8f0', color: '#64748b' }}>
                {showAll
                  ? <><ChevronUp className="w-4 h-4" /> Ver menos</>
                  : <><ChevronDown className="w-4 h-4" /> Ver todos ({historialFiltrado.length})</>}
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}
