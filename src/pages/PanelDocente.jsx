import React, { useState } from 'react'
import { Brain, Heart, Flame, ChevronDown, ChevronUp, Play, CheckCircle } from 'lucide-react'

// ── TEST DE ESTRÉS (PSS-10 adaptado) ──────────────────────────────────────
const TEST_PREGUNTAS = [
  'En el último mes, ¿con qué frecuencia te has sentido agitado/a o estresado/a por algo inesperado?',
  '¿Has sentido que eras incapaz de controlar las cosas importantes de tu trabajo?',
  '¿Te has sentido nervioso/a o bajo presión constante?',
  '¿Has tenido dificultades para concentrarte debido al agotamiento?',
  '¿Has sentido que las dificultades se acumulaban tanto que no podías superarlas?',
  '¿Has podido controlar la forma de pasar tu tiempo en el trabajo?',
  '¿Has podido manejar con eficacia los problemas de tu día a día?',
  '¿Has sentido que tenías el control sobre las cosas?',
  '¿Has podido hacer frente a todas las tareas que se te presentaban?',
  '¿Has podido controlar tus reacciones emocionales ante situaciones difíciles?',
]
const OPCIONES = ['Nunca', 'Casi nunca', 'A veces', 'Con bastante frecuencia', 'Muy frecuentemente']
// Preguntas inversas (índices 5,6,7,8,9) suman al revés
const INVERSAS = [5, 6, 7, 8, 9]

function getResultado(puntuacion) {
  if (puntuacion <= 13) return {
    nivel: 'Estrés bajo',
    color: '#10b981',
    emoji: '🟢',
    desc: 'Tu nivel de estrés es manejable. Mantén tus hábitos de autocuidado y sigue practicando las técnicas que ya conoces.',
  }
  if (puntuacion <= 26) return {
    nivel: 'Estrés moderado',
    color: '#f59e0b',
    emoji: '🟡',
    desc: 'Hay señales de estrés significativo. Te recomendamos practicar regularmente las técnicas de relajación de este panel y revisar la sección de prevención del burnout.',
  }
  return {
    nivel: 'Estrés elevado',
    color: '#ef4444',
    emoji: '🔴',
    desc: 'Tu nivel de estrés es alto. Prioriza el autocuidado de forma urgente y considera hablar con el servicio de salud laboral de tu centro o con un profesional de la psicología.',
  }
}

// ── EJERCICIOS DE RELAJACIÓN ──────────────────────────────────────────────
const EJERCICIOS = [
  {
    id: 'respiracion',
    emoji: '🫁',
    titulo: 'Respiración 4-7-8',
    duracion: '3 min',
    desc: 'Activa el sistema nervioso parasimpático y reduce la tensión acumulada.',
    pasos: [
      'Siéntate cómodamente con la espalda recta.',
      'Inhala por la nariz contando mentalmente hasta 4.',
      'Retén el aire contando hasta 7.',
      'Exhala lentamente por la boca contando hasta 8.',
      'Repite el ciclo entre 4 y 6 veces.',
      'Al terminar, observa cómo tu cuerpo se ha relajado.',
    ],
  },
  {
    id: 'muscular',
    emoji: '💪',
    titulo: 'Relajación muscular progresiva',
    duracion: '8 min',
    desc: 'Técnica de Jacobson adaptada. Tensa y suelta grupos musculares de forma secuencial.',
    pasos: [
      'Siéntate o túmbate en un lugar tranquilo.',
      'Cierra los ojos y respira profundamente 3 veces.',
      'Tensa los pies durante 5 segundos. Suéltalos. Nota la diferencia.',
      'Sube progresivamente: pantorrillas → muslos → abdomen → manos → brazos → hombros → cara.',
      'En cada grupo: tensa 5 seg → suelta → respira → avanza al siguiente.',
      'Termina respirando profundo y abriendo los ojos despacio.',
    ],
  },
  {
    id: 'mindfulness',
    emoji: '🧘',
    titulo: 'Pausa mindful de 5 minutos',
    duracion: '5 min',
    desc: 'Un momento de atención plena para resetear entre clase y clase.',
    pasos: [
      'Pon un temporizador en 5 minutos.',
      'Cierra los ojos o baja la mirada al suelo.',
      'Siente el peso de tu cuerpo en la silla. Los pies apoyados en el suelo.',
      'Observa tu respiración sin cambiarla. Solo obsérvala.',
      'Cuando llegue un pensamiento, nómbralo ("hay un pensamiento") y vuelve a la respiración.',
      'Al sonar el temporizador, toma una respiración profunda y retoma el día.',
    ],
  },
  {
    id: 'grounding',
    emoji: '🌿',
    titulo: 'Grounding 5-4-3-2-1',
    duracion: '2 min',
    desc: 'Ancla tu atención al presente usando los sentidos. Ideal antes de una clase difícil.',
    pasos: [
      'Nombra mentalmente 5 cosas que puedes VER a tu alrededor.',
      'Nombra 4 cosas que puedes TOCAR. Tócalas brevemente.',
      'Nombra 3 cosas que puedes OÍR ahora mismo.',
      'Nombra 2 cosas que puedes OLER (o que te gustaría oler).',
      'Nombra 1 cosa que puedes SABOREAR.',
      'Respira hondo. Ya estás en el presente.',
    ],
  },
]

// ── BURNOUT ───────────────────────────────────────────────────────────────
const BURNOUT_SENALES = [
  {
    icon: '😮‍💨',
    titulo: 'Agotamiento emocional',
    desc: 'Sensación de vaciamiento al final del día, dificultad para desconectar, falta de energía incluso tras descansar.',
  },
  {
    icon: '🧊',
    titulo: 'Despersonalización',
    desc: 'Actitud distante o cínica hacia el alumnado, pérdida de empatía, sentir que "ya no me importa" como antes.',
  },
  {
    icon: '📉',
    titulo: 'Baja realización personal',
    desc: 'Sensación de que tu trabajo no tiene impacto, compararte negativamente con colegas, dudas sobre tu vocación.',
  },
]
const BURNOUT_ESTRATEGIAS = [
  {
    emoji: '🚧',
    titulo: 'Pon límites claros',
    texto: 'Establece un horario real de desconexión. Apaga notificaciones del trabajo fuera del horario lectivo. El "siempre disponible" es el primer peldaño hacia el burnout.',
  },
  {
    emoji: '🤝',
    titulo: 'Busca apoyo entre iguales',
    texto: 'Compartir con compañeros lo que te pesa normaliza la experiencia y reduce el aislamiento. Crear espacios de escucha en el claustro marca la diferencia.',
  },
  {
    emoji: '🎯',
    titulo: 'Recupera tu "para qué"',
    texto: 'En los momentos de mayor agotamiento, escribir 3 momentos recientes en los que has marcado una diferencia positiva puede reorientar la perspectiva.',
  },
  {
    emoji: '🛑',
    titulo: 'Identifica las fuentes de estrés',
    texto: 'Distingue lo que puedes cambiar de lo que no. Actúa en lo primero; trabaja la aceptación en lo segundo. No todo es modificable, pero sí gestionable.',
  },
  {
    emoji: '🌱',
    titulo: 'Autocuidado no negociable',
    texto: 'Sueño, movimiento, alimentación y tiempo social son pilares. El autocuidado no es un lujo: es el mantenimiento del instrumento que eres tú.',
  },
]

// ─────────────────────────────────────────────────────────────────────────────

export default function PanelDocente() {
  const [seccionAbierta, setSeccionAbierta] = useState('relajacion')
  const [ejercicioAbierto, setEjercicioAbierto] = useState(null)
  const [respuestas, setRespuestas] = useState({})
  const [resultado, setResultado] = useState(null)
  const [burnoutAbierto, setBurnoutAbierto] = useState(null)

  const toggle = (id) => setSeccionAbierta(prev => prev === id ? null : id)

  const calcularTest = () => {
    let total = 0
    TEST_PREGUNTAS.forEach((_, i) => {
      const val = respuestas[i] ?? 0
      total += INVERSAS.includes(i) ? (4 - val) : val
    })
    setResultado(getResultado(total))
  }

  const testCompleto = Object.keys(respuestas).length === TEST_PREGUNTAS.length

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* ── Cabecera ── */}
      <div className="rounded-3xl p-6 text-white"
        style={{ background: 'linear-gradient(135deg, #1a2744 0%, #2d4a6b 100%)' }}>
        <div className="flex items-center gap-3 mb-2">
         <img src="https://zbusdixrxedfhbkquafh.supabase.co/storage/v1/object/public/logo/WhatsApp%20Image%202026-04-06%20at%2015.58.04.jpeg"
  alt="Resetea" className="w-12 h-12 rounded-full object-cover border-2 border-white/20 shadow-md" />
          <div>
            <h1 className="text-2xl font-black">Panel Docente</h1>
            <p className="text-white/60 text-sm">Recursos para tu bienestar profesional</p>
          </div>
        </div>
        <p className="text-white/70 text-sm leading-relaxed mt-3">
          Cuidas a tus estudiantes cada día. Este espacio es para cuidarte a ti.
          Aquí encontrarás herramientas para gestionar el estrés, técnicas de relajación
          y recursos para prevenir el burnout docente.
        </p>
      </div>

      {/* ── SECCIÓN 1: Ejercicios de relajación ── */}
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
        <button
          onClick={() => toggle('relajacion')}
          className="w-full flex items-center justify-between p-5 text-left transition-colors"
          style={{ background: seccionAbierta === 'relajacion' ? 'rgba(244,114,182,0.06)' : 'white' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(244,114,182,0.12)' }}>
              <Heart className="w-5 h-5" style={{ color: '#f472b6' }} />
            </div>
            <div>
              <p className="font-bold text-slate-800">Ejercicios de relajación</p>
              <p className="text-xs text-slate-400">4 técnicas · 2–8 minutos</p>
            </div>
          </div>
          {seccionAbierta === 'relajacion'
            ? <ChevronUp className="w-5 h-5 text-slate-300" />
            : <ChevronDown className="w-5 h-5 text-slate-300" />}
        </button>

        {seccionAbierta === 'relajacion' && (
          <div className="px-5 pb-5 space-y-3">
            {EJERCICIOS.map(ej => (
              <div key={ej.id} className="rounded-2xl border overflow-hidden"
                style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                <button
                  onClick={() => setEjercicioAbierto(prev => prev === ej.id ? null : ej.id)}
                  className="w-full flex items-center justify-between p-4 text-left transition-colors"
                  style={{ background: ejercicioAbierto === ej.id ? 'rgba(244,114,182,0.05)' : '#f8fafc' }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{ej.emoji}</span>
                    <div>
                      <p className="font-semibold text-slate-700 text-sm">{ej.titulo}</p>
                      <p className="text-xs text-slate-400">{ej.duracion} · {ej.desc}</p>
                    </div>
                  </div>
                  <Play className="w-4 h-4 text-slate-300 flex-shrink-0" />
                </button>

                {ejercicioAbierto === ej.id && (
                  <div className="p-4 space-y-2 border-t" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                    {ej.pasos.map((paso, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span
                          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                          style={{ background: '#f472b6', minWidth: 24 }}
                        >
                          {i + 1}
                        </span>
                        <p className="text-sm text-slate-600 leading-relaxed pt-0.5">{paso}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── SECCIÓN 2: Test de estrés ── */}
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
        <button
          onClick={() => toggle('test')}
          className="w-full flex items-center justify-between p-5 text-left transition-colors"
          style={{ background: seccionAbierta === 'test' ? 'rgba(99,102,241,0.06)' : 'white' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(99,102,241,0.12)' }}>
              <Brain className="w-5 h-5" style={{ color: '#6366f1' }} />
            </div>
            <div>
              <p className="font-bold text-slate-800">Test de estrés y ansiedad</p>
              <p className="text-xs text-slate-400">Escala PSS-10 adaptada · 10 preguntas</p>
            </div>
          </div>
          {seccionAbierta === 'test'
            ? <ChevronUp className="w-5 h-5 text-slate-300" />
            : <ChevronDown className="w-5 h-5 text-slate-300" />}
        </button>

        {seccionAbierta === 'test' && (
          <div className="px-5 pb-5 space-y-4">
            {!resultado ? (
              <>
                <p className="text-xs text-slate-400 pt-1">
                  Responde pensando en las <strong>últimas 4 semanas</strong>.
                  Tus respuestas son completamente privadas.
                </p>

                {TEST_PREGUNTAS.map((preg, i) => (
                  <div key={i} className="space-y-2">
                    <p className="text-sm font-medium text-slate-700">{i + 1}. {preg}</p>
                    <div className="flex flex-wrap gap-2">
                      {OPCIONES.map((op, j) => (
                        <button
                          key={j}
                          onClick={() => setRespuestas(prev => ({ ...prev, [i]: j }))}
                          className="px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
                          style={{
                            background: respuestas[i] === j ? '#6366f1' : 'white',
                            color: respuestas[i] === j ? 'white' : '#64748b',
                            borderColor: respuestas[i] === j ? '#6366f1' : '#e2e8f0',
                          }}
                        >
                          {op}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <button
                  onClick={calcularTest}
                  disabled={!testCompleto}
                  className="w-full py-3 rounded-2xl text-white font-bold disabled:opacity-40 mt-2 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                >
                  Ver mi resultado
                </button>
              </>
            ) : (
              <div className="space-y-4 pt-1">
                <div
                  className="rounded-2xl p-5 text-center"
                  style={{
                    background: `${resultado.color}15`,
                    border: `2px solid ${resultado.color}30`,
                  }}
                >
                  <p className="text-4xl mb-2">{resultado.emoji}</p>
                  <p className="font-black text-lg" style={{ color: resultado.color }}>
                    {resultado.nivel}
                  </p>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">{resultado.desc}</p>
                </div>

                <button
                  onClick={() => { setResultado(null); setRespuestas({}) }}
                  className="w-full py-2.5 rounded-2xl text-sm font-medium border transition-colors"
                  style={{ borderColor: '#e2e8f0', color: '#64748b' }}
                >
                  Repetir el test
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── SECCIÓN 3: Prevención del burnout ── */}
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
        <button
          onClick={() => toggle('burnout')}
          className="w-full flex items-center justify-between p-5 text-left transition-colors"
          style={{ background: seccionAbierta === 'burnout' ? 'rgba(249,115,22,0.06)' : 'white' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(249,115,22,0.12)' }}>
              <Flame className="w-5 h-5" style={{ color: '#f97316' }} />
            </div>
            <div>
              <p className="font-bold text-slate-800">Prevención del burnout</p>
              <p className="text-xs text-slate-400">Señales de alerta y estrategias de protección</p>
            </div>
          </div>
          {seccionAbierta === 'burnout'
            ? <ChevronUp className="w-5 h-5 text-slate-300" />
            : <ChevronDown className="w-5 h-5 text-slate-300" />}
        </button>

        {seccionAbierta === 'burnout' && (
          <div className="px-5 pb-5 space-y-4 pt-1">

            {/* Señales de alerta */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Señales que merecen atención
              </p>
              <div className="space-y-2">
                {BURNOUT_SENALES.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-2xl"
                    style={{
                      background: 'rgba(249,115,22,0.05)',
                      border: '1px solid rgba(249,115,22,0.1)',
                    }}
                  >
                    <span className="text-xl flex-shrink-0">{s.icon}</span>
                    <div>
                      <p className="font-semibold text-sm text-slate-700">{s.titulo}</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Estrategias */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Estrategias de protección
              </p>
              <div className="space-y-2">
                {BURNOUT_ESTRATEGIAS.map((e, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border overflow-hidden transition-all"
                    style={{
                      borderColor: burnoutAbierto === i ? 'rgba(249,115,22,0.3)' : 'rgba(0,0,0,0.06)',
                    }}
                  >
                    <button
                      onClick={() => setBurnoutAbierto(prev => prev === i ? null : i)}
                      className="w-full flex items-center gap-3 p-3 text-left transition-colors"
                      style={{ background: burnoutAbierto === i ? 'rgba(249,115,22,0.06)' : 'white' }}
                    >
                      <span className="text-xl">{e.emoji}</span>
                      <p className="font-semibold text-sm text-slate-700 flex-1">{e.titulo}</p>
                      {burnoutAbierto === i
                        ? <ChevronUp className="w-4 h-4 text-slate-300" />
                        : <ChevronDown className="w-4 h-4 text-slate-300" />}
                    </button>
                    {burnoutAbierto === i && (
                      <div className="px-4 pb-3 pt-1 border-t" style={{ borderColor: 'rgba(0,0,0,0.04)' }}>
                        <p className="text-sm text-slate-600 leading-relaxed">{e.texto}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Nota profesional */}
            <div
              className="rounded-2xl p-4 flex items-start gap-3"
              style={{
                background: 'rgba(99,102,241,0.06)',
                border: '1px solid rgba(99,102,241,0.15)',
              }}
            >
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#6366f1' }} />
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>Nota profesional:</strong> Si llevas más de dos semanas experimentando síntomas
persistentes de agotamiento, considera consultar con tu médico o con el orientador de tu centro.
              </p>
            </div>

          </div>
        )}
      </div>

    </div>
  )
}
