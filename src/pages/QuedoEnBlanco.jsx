import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/api/supabaseClient'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ChevronRight, CheckCircle, Volume2, Play, AlertCircle, Brain } from 'lucide-react'

const VOICE_ID = 'RgXx32WYOGrd7gFNifSf'
const XI_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY
const audioCache = {}

async function speak(text) {
  if (XI_API_KEY) {
    const key = `${VOICE_ID}_${text.slice(0, 40)}`
    try {
      if (!audioCache[key]) {
        const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
          method: 'POST',
          headers: { 'xi-api-key': XI_API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2',
            voice_settings: { stability: 0.85, similarity_boost: 0.85, style: 0.15, use_speaker_boost: true } })
        })
        if (!res.ok) throw new Error()
        audioCache[key] = URL.createObjectURL(await res.blob())
      }
      return new Promise(r => { const a = new Audio(audioCache[key]); a.onended = r; a.play() })
    } catch {}
  }
  return new Promise(r => {
    if (!window.speechSynthesis) { r(); return }
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'es-ES'; u.rate = 0.72; u.pitch = 1.05; u.volume = 1.0; u.onend = r
    const v = window.speechSynthesis.getVoices().find(v => v.lang === 'es-ES')
    if (v) u.voice = v
    window.speechSynthesis.speak(u)
  })
}

// ── PANTALLA 1: INTRO ─────────────────────────────────────────────────────
function PantallaIntro({ onNext }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="text-center">
        <span className="text-6xl block mb-4">🫥</span>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Cuando me quedo en blanco</h2>
        <p className="text-slate-500 text-sm">Aprende a recuperar el foco en 1–2 minutos sin levantarte de la mesa.</p>
      </div>

      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-3">
        <p className="text-slate-600 text-sm leading-relaxed">
          No es raro quedarse en blanco en un examen, sobre todo si notas que el cuerpo se tensa y la mente se va. Este módulo te enseña pasos concretos para:
        </p>
        {[
          { e: '🛡️', t: 'Evitar bloqueos largos' },
          { e: '🌊', t: 'Recuperar calma física' },
          { e: '🔄', t: 'Volver a leer y empezar desde cero' },
        ].map(({ e, t }) => (
          <div key={t} className="flex items-center gap-3 bg-teal-50 rounded-xl p-3">
            <span className="text-xl">{e}</span>
            <span className="text-teal-700 font-medium text-sm">{t}</span>
          </div>
        ))}
        <p className="text-xs text-slate-400 text-center pt-1">⏱ 3–4 minutos · Sin salir del asiento</p>
      </div>

      <button onClick={onNext}
        className="w-full py-4 rounded-2xl text-white font-bold text-lg shadow-lg flex items-center justify-center gap-2"
        style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}>
        Empezar módulo <ChevronRight className="w-5 h-5" />
      </button>
    </motion.div>
  )
}

// ── PANTALLA 2: PSICOEDUCACIÓN ────────────────────────────────────────────
function PantallaPsicoeducacion({ onNext }) {
  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
      <h2 className="text-xl font-black text-slate-800">¿Por qué me quedo en blanco?</h2>

      <div className="space-y-3">
        <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
          <p className="font-bold text-red-800 mb-2">💓 Cuerpo y mente se disparan</p>
          <p className="text-red-700 text-sm leading-relaxed">
            Cuando la ansiedad sube mucho, el cerebro activa la respuesta de alarma. Corazón acelerado, manos frías, nudo de estómago... y la memoria de trabajo se <strong>satura</strong>. Los recuerdos se bloquean temporalmente — no es que no hayas estudiado.
          </p>
        </div>

        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
          <p className="font-bold text-amber-800 mb-2">🧠 Los pensamientos empeoran el bloqueo</p>
          {['"No voy a aprobar"', '"No recuerdo nada"', '"Todo el mundo va mejor que yo"'].map(f => (
            <p key={f} className="text-amber-700 text-sm italic mb-0.5">• {f}</p>
          ))}
          <p className="text-amber-600 text-xs mt-2">Cada pensamiento catastrofista añade más presión y prolonga el bloqueo.</p>
        </div>

        <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
          <p className="font-bold text-green-800 mb-2">✅ Pero se puede reducir y superar</p>
          <p className="text-green-700 text-sm leading-relaxed">
            Con un protocolo de 30–60 segundos: respiración, grounding y una auto-instrucción clara. El bloqueo es <strong>temporal</strong>. La información sigue ahí.
          </p>
        </div>
      </div>

      <button onClick={onNext}
        className="w-full py-3 rounded-2xl text-white font-bold flex items-center justify-center gap-2"
        style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}>
        Siguiente: qué hacer en 30 segundos <ChevronRight className="w-4 h-4" />
      </button>
    </motion.div>
  )
}

// ── PANTALLA 3: PROTOCOLO ─────────────────────────────────────────────────
function PantallaProtocolo({ onNext }) {
  const [paso, setPaso] = useState(null)
  const [respirando, setRespirando] = useState(false)
  const [counter, setCounter] = useState(0)
  const [fase, setFase] = useState('inhala')
  const timerRef = useRef(null)

  const PASOS = [
    { n: 1, icon: '⏱️', titulo: 'Para. Mira el reloj', desc: '2 segundos. Solo observa. Deja de escribir.' },
    { n: 2, icon: '🌬️', titulo: 'Respira 3 veces', desc: '4 seg. inhalando · 6 seg. exhalando', accion: true },
    { n: 3, icon: '✋', titulo: 'Mira tus manos', desc: 'Ponlas sobre la mesa. Di mentalmente:\n"Estoy aquí. Puedo empezar otra vez."' },
    { n: 4, icon: '📄', titulo: 'Vuelve a la pregunta', desc: 'Léela despacio, palabra por palabra. Sin prisas.' },
    { n: 5, icon: '✏️', titulo: 'Elige una opción', desc: '"Escribo lo que sí recuerdo"\no "dejo espacio y sigo a la siguiente".' },
  ]

  const iniciarRespiracion = () => {
    setRespirando(true)
    setFase('inhala')
    setCounter(4)
    let ciclos = 0
    let f = 'inhala'
    let c = 4
    timerRef.current = setInterval(() => {
      c -= 1
      if (c <= 0) {
        if (f === 'inhala') { f = 'exhala'; c = 6; setFase('exhala') }
        else { ciclos += 1; if (ciclos >= 3) { clearInterval(timerRef.current); setRespirando(false); return } f = 'inhala'; c = 4; setFase('inhala') }
      }
      setCounter(c)
    }, 1000)
  }

  useEffect(() => () => clearInterval(timerRef.current), [])

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
      <h2 className="text-xl font-black text-slate-800">Qué hacer cuando te quedas en blanco</h2>
      <p className="text-slate-500 text-sm">Protocolo de 30–60 segundos. Sin levantarte.</p>

      <div className="space-y-2">
        {PASOS.map((p) => (
          <motion.div key={p.n} layout>
            <button onClick={() => setPaso(paso === p.n ? null : p.n)}
              className="w-full text-left rounded-2xl border-2 transition-all p-4"
              style={{ borderColor: paso === p.n ? '#dc2626' : '#e2e8f0', background: paso === p.n ? '#fee2e2' : 'white' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                  style={{ background: '#dc2626' }}>{p.n}</div>
                <span className="text-xl">{p.icon}</span>
                <p className="font-bold text-slate-800 text-sm">{p.titulo}</p>
              </div>
            </button>

            {paso === p.n && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className="mx-2 bg-red-50 rounded-b-2xl p-4 border border-t-0 border-red-200">
                <p className="text-red-800 text-sm whitespace-pre-line">{p.desc}</p>
                {p.accion && (
                  <div className="mt-3">
                    {!respirando ? (
                      <button onClick={iniciarRespiracion}
                        className="px-4 py-2 rounded-xl text-white text-sm font-bold flex items-center gap-2"
                        style={{ background: '#dc2626' }}>
                        <Play className="w-4 h-4" /> Guiarme ahora
                      </button>
                    ) : (
                      <div className="flex items-center gap-4">
                        <motion.div className="w-14 h-14 rounded-full border-4 flex items-center justify-center"
                          style={{ borderColor: '#dc2626' }}
                          animate={{ scale: fase === 'inhala' ? [1, 1.3] : [1.3, 1] }}
                          transition={{ duration: fase === 'inhala' ? 4 : 6, ease: 'easeInOut' }}>
                          <span className="text-red-700 font-black text-sm">{counter}s</span>
                        </motion.div>
                        <div>
                          <p className="font-black text-red-700">{fase === 'inhala' ? 'INHALA' : 'EXHALA'}</p>
                          <p className="text-red-500 text-xs">{fase === 'inhala' ? 'por la nariz' : 'por la boca, lento'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      <button onClick={onNext}
        className="w-full py-3 rounded-2xl text-white font-bold flex items-center justify-center gap-2"
        style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}>
        Siguiente: simulación de examen <ChevronRight className="w-4 h-4" />
      </button>
    </motion.div>
  )
}

// ── PANTALLA 4: SIMULACIÓN ────────────────────────────────────────────────
const SCRIPT_GROUNDING = [
  'Bien. Has detectado el bloqueo. Ahora activa el protocolo.',
  'Deja el bolígrafo. Pon las manos sobre la mesa.',
  'Inhala cuatro segundos... uno, dos, tres, cuatro.',
  'Exhala seis segundos... uno, dos, tres, cuatro, cinco, seis.',
  'Dos respiraciones más. Inhala... exhala despacio.',
  'Ahora, mira tu mano derecha. Siéntela sobre la mesa.',
  'Nombre tres cosas que ves a tu alrededor. En silencio.',
  'Di mentalmente: "Estoy aquí. La información sigue en mí. Solo tengo que empezar."',
  'Vuelve a la pregunta. Léela palabra por palabra.',
  'Escribe lo que sí recuerdas. Aunque sea poco. Eso es.',
]

function PantallaSimulacion({ onNext }) {
  const [fase, setFase] = useState('espera') // espera | bloqueo | protocolo | fin
  const [malestarPre, setMalestarPre] = useState(5)
  const [malestarPost, setMalestarPost] = useState(5)
  const [segundos, setSegundos] = useState(0)
  const [textoActual, setTextoActual] = useState('')
  const [scriptIdx, setScriptIdx] = useState(0)
  const runningRef = useRef(false)
  const startRef = useRef(null)
  const timerRef = useRef(null)

  const iniciarBloqueo = () => {
    setFase('bloqueo')
    setTimeout(() => setFase('activar'), 3000)
  }

  const activarProtocolo = async () => {
    setFase('protocolo')
    startRef.current = Date.now()
    timerRef.current = setInterval(() => setSegundos(Math.round((Date.now() - startRef.current) / 1000)), 500)
    runningRef.current = true
    for (let i = 0; i < SCRIPT_GROUNDING.length; i++) {
      if (!runningRef.current) break
      setScriptIdx(i)
      setTextoActual(SCRIPT_GROUNDING[i])
      await speak(SCRIPT_GROUNDING[i])
      await new Promise(r => setTimeout(r, 500))
    }
    clearInterval(timerRef.current)
    if (runningRef.current) setFase('fin')
  }

  useEffect(() => () => { runningRef.current = false; clearInterval(timerRef.current); window.speechSynthesis?.cancel() }, [])

  const getColor = v => v <= 3 ? '#16a34a' : v <= 6 ? '#ca8a04' : '#dc2626'

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
      <h2 className="text-xl font-black text-slate-800">Simulación de examen</h2>

      {fase === 'espera' && (
        <div className="space-y-4">
          <p className="text-slate-600 text-sm">Antes de la simulación, ¿cómo estás ahora?</p>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-slate-600">Nivel de malestar</span>
              <span className="font-black text-lg" style={{ color: getColor(malestarPre) }}>{malestarPre}/10</span>
            </div>
            <input type="range" min="0" max="10" value={malestarPre} onChange={e => setMalestarPre(Number(e.target.value))}
              className="w-full h-3 rounded-full appearance-none cursor-pointer"
              style={{ background: `linear-gradient(to right, ${getColor(malestarPre)} ${malestarPre*10}%, #e2e8f0 ${malestarPre*10}%)`, accentColor: getColor(malestarPre) }} />
          </div>
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <p className="font-bold text-slate-700 text-sm mb-2">📝 Pregunta de examen simulada:</p>
            <p className="text-slate-600 text-sm italic">"Explica las principales diferencias entre la memoria a corto y largo plazo."</p>
          </div>
          <p className="text-slate-500 text-xs">Imagina que estás en el examen. Llevas 10 minutos escribiendo y de repente... te quedas en blanco. Cuando estés listo/a, pulsa el botón.</p>
          <button onClick={iniciarBloqueo}
            className="w-full py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}>
            Iniciar examen simulado <Play className="w-5 h-5" />
          </button>
        </div>
      )}

      {fase === 'bloqueo' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="min-h-48 flex flex-col items-center justify-center rounded-3xl p-8 text-center"
          style={{ background: 'linear-gradient(135deg, #7f1d1d, #dc2626)' }}>
          <motion.p className="text-white text-4xl font-black mb-3"
            animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>
            ¡BLOQUEO!
          </motion.p>
          <p className="text-white/70 text-sm">La mente se va...</p>
        </motion.div>
      )}

      {fase === 'activar' && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
          <div className="bg-red-900 rounded-3xl p-6 text-center">
            <p className="text-white text-2xl font-black mb-2">🫥 Me he quedado en blanco</p>
            <p className="text-red-200 text-sm mb-4">Activa el protocolo de recuperación</p>
            <button onClick={activarProtocolo}
              className="px-8 py-3 rounded-2xl text-white font-bold flex items-center gap-2 mx-auto"
              style={{ background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)' }}>
              <Volume2 className="w-5 h-5" /> Pausa 30s · Activar protocolo
            </button>
          </div>
        </motion.div>
      )}

      {fase === 'protocolo' && (
        <div className="space-y-4">
          <div className="bg-slate-900 rounded-3xl p-6 min-h-40 flex flex-col items-center justify-center text-center">
            <div className="flex gap-1 mb-4">
              {[0, 1, 2].map(i => (
                <motion.div key={i} className="w-2 h-8 rounded-full bg-red-400"
                  animate={{ scaleY: [1, 2, 1] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }} />
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.p key={scriptIdx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-white/90 text-base leading-relaxed italic">
                "{textoActual}"
              </motion.p>
            </AnimatePresence>
            <p className="text-white/30 text-xs mt-4">{segundos}s</p>
          </div>
        </div>
      )}

      {fase === 'fin' && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5">
          <div className="bg-green-50 rounded-3xl p-5 border border-green-200 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="font-black text-green-800 text-lg">¡Protocolo completado!</p>
            <p className="text-green-600 text-sm mt-1">Has recuperado el foco en <strong>{segundos} segundos</strong></p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">¿Cómo estás ahora?</p>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-slate-600">Nivel de malestar</span>
              <span className="font-black text-lg" style={{ color: getColor(malestarPost) }}>{malestarPost}/10</span>
            </div>
            <input type="range" min="0" max="10" value={malestarPost} onChange={e => setMalestarPost(Number(e.target.value))}
              className="w-full h-3 rounded-full appearance-none cursor-pointer"
              style={{ background: `linear-gradient(to right, ${getColor(malestarPost)} ${malestarPost*10}%, #e2e8f0 ${malestarPost*10}%)`, accentColor: getColor(malestarPost) }} />
          </div>
          {malestarPre - malestarPost > 0 && (
            <div className="bg-teal-50 rounded-2xl p-4 border border-teal-100">
              <p className="text-teal-700 font-bold text-sm">✅ Has bajado {malestarPre - malestarPost} punto{malestarPre - malestarPost !== 1 ? 's' : ''} tu malestar</p>
              <p className="text-teal-600 text-xs mt-1">Cuando te quedes en blanco en un examen real, repite este mismo protocolo.</p>
            </div>
          )}
          <button onClick={onNext}
            className="w-full py-3 rounded-2xl text-white font-bold flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}>
            Siguiente: cómo prevenirlo <ChevronRight className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}

// ── PANTALLA 5: PREVENCIÓN + PACTO ────────────────────────────────────────
function PantallaPrevension({ onComplete }) {
  const [checks, setChecks] = useState([false, false, false, false])
  const [pacto, setPacto] = useState('')
  const [saving, setSaving] = useState(false)

  const CHECKLIST = [
    '5 min antes: respiración cuadrada 4-4-4-4',
    '2 min de grounding 5-4-3-2-1 en el aula',
    'Revisión rápida: 3 ideas clave por asignatura',
    'Decirme: "No necesito recordarlo todo, solo empezar"',
  ]

  const toggleCheck = (i) => setChecks(prev => prev.map((v, idx) => idx === i ? !v : v))

  const guardar = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('progreso_modulo').upsert({
          user_id: user.id, modulo_id: 'quedo_en_blanco', sesion_id: 'completo', completada: true
        }, { onConflict: 'user_id,modulo_id,sesion_id' })
      }
      onComplete()
    } catch { onComplete() }
    finally { setSaving(false) }
  }

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
      <h2 className="text-xl font-black text-slate-800">Prevenir que me quede en blanco</h2>
      <p className="text-slate-500 text-sm">Marca lo que puedes hacer antes de tu próximo examen:</p>

      <div className="space-y-2">
        {CHECKLIST.map((item, i) => (
          <button key={i} onClick={() => toggleCheck(i)}
            className="w-full flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all"
            style={{ background: checks[i] ? '#ccfbf1' : 'white', borderColor: checks[i] ? '#0f6b6b' : '#e2e8f0' }}>
            <div className="w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ borderColor: checks[i] ? '#0f6b6b' : '#94a3b8', background: checks[i] ? '#0f6b6b' : 'white' }}>
              {checks[i] && <span className="text-white text-xs font-black">✓</span>}
            </div>
            <span className="text-sm font-medium" style={{ color: checks[i] ? '#0d3d3d' : '#64748b' }}>{item}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Link to="/respiracion/cuadrada">
          <div className="bg-blue-50 rounded-2xl p-3 border border-blue-100 text-center">
            <span className="text-2xl block mb-1">⬜</span>
            <p className="text-blue-700 font-bold text-xs">Practicar respiración cuadrada</p>
          </div>
        </Link>
        <Link to="/grounding">
          <div className="bg-green-50 rounded-2xl p-3 border border-green-100 text-center">
            <span className="text-2xl block mb-1">🌱</span>
            <p className="text-green-700 font-bold text-xs">Practicar grounding 5-4-3-2-1</p>
          </div>
        </Link>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
        <p className="font-bold text-slate-800 text-sm mb-3">🤝 Mi pacto personal</p>
        <p className="text-slate-500 text-sm mb-2">Yo me comprometo a hacer...</p>
        <textarea value={pacto} onChange={e => setPacto(e.target.value)} rows={2}
          placeholder="Ej: respirar 3 veces antes de leer cada pregunta..."
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-teal-400 resize-none" />
        <p className="text-slate-400 text-xs mt-1">...justo antes de cada examen.</p>
      </div>

      <button onClick={guardar} disabled={saving}
        className="w-full py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2"
        style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}>
        {saving ? 'Guardando...' : <><CheckCircle className="w-5 h-5" /> Completar módulo</>}
      </button>
    </motion.div>
  )
}

// ── PANTALLA FIN ──────────────────────────────────────────────────────────
function PantallaFin({ onVolver }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-5 py-6">
      <span className="text-6xl block">🎉</span>
      <p className="text-2xl font-black text-slate-800">¡Módulo completado!</p>
      <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">
        Ya tienes el protocolo para cuando te quedes en blanco. Practica las técnicas para que sean automáticas el día del examen.
      </p>
      <div className="bg-teal-50 rounded-2xl p-4 border border-teal-100 text-left space-y-2">
        <p className="font-bold text-teal-800 text-sm">Recuerda el protocolo:</p>
        {['Para · Mira el reloj 2 segundos', 'Respira 3 veces (4s inhala · 6s exhala)', 'Mira tus manos · "Estoy aquí"', 'Vuelve a leer la pregunta despacio', 'Escribe lo que sí recuerdas'].map((p, i) => (
          <p key={i} className="text-teal-700 text-sm">{i + 1}. {p}</p>
        ))}
      </div>
      <button onClick={onVolver}
        className="w-full py-3 rounded-2xl text-white font-bold"
        style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}>
        Volver al inicio
      </button>
    </motion.div>
  )
}

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────
const PANTALLAS = ['intro', 'psicoeducacion', 'protocolo', 'simulacion', 'prevencion', 'fin']

export default function QuedoEnBlanco() {
  const [pantallaIdx, setPantallaIdx] = useState(0)
  const navigate = useNavigate()
  const pantalla = PANTALLAS[pantallaIdx]
  const next = () => setPantallaIdx(i => i + 1)

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {pantallaIdx > 0 && pantallaIdx < PANTALLAS.length - 1 && (
        <button onClick={() => setPantallaIdx(i => i - 1)} className="flex items-center gap-2 text-red-600 font-medium mb-4">
          <ArrowLeft className="w-4 h-4" /> Atrás
        </button>
      )}

      {/* Barra de progreso */}
      {pantallaIdx > 0 && pantallaIdx < PANTALLAS.length - 1 && (
        <div className="flex gap-1.5 mb-6">
          {PANTALLAS.slice(1, -1).map((_, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full transition-all"
              style={{ background: i < pantallaIdx - 1 ? '#dc2626' : i === pantallaIdx - 1 ? '#fca5a5' : '#e2e8f0' }} />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div key={pantalla}>
          {pantalla === 'intro'          && <PantallaIntro          onNext={next} />}
          {pantalla === 'psicoeducacion' && <PantallaPsicoeducacion onNext={next} />}
          {pantalla === 'protocolo'      && <PantallaProtocolo      onNext={next} />}
          {pantalla === 'simulacion'     && <PantallaSimulacion     onNext={next} />}
          {pantalla === 'prevencion'     && <PantallaPrevension     onComplete={next} />}
          {pantalla === 'fin'            && <PantallaFin            onVolver={() => navigate('/')} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
