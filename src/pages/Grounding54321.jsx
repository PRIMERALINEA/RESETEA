import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/api/supabaseClient'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Play, Volume2, CheckCircle } from 'lucide-react'
import EvaluacionPrePost from '@/components/EvaluacionPrePost'

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
          body: JSON.stringify({
            text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: { stability: 0.85, similarity_boost: 0.85, style: 0.15, use_speaker_boost: true }
          })
        })
        if (!res.ok) throw new Error('ElevenLabs error')
        audioCache[key] = URL.createObjectURL(await res.blob())
      }
      return new Promise((resolve) => {
        const audio = new Audio(audioCache[key])
        audio.volume = 0.95
        audio.onended = resolve
        audio.play()
      })
    } catch (e) { console.error('TTS:', e) }
  }
  return new Promise((resolve) => {
    if (!window.speechSynthesis) { resolve(); return }
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'es-ES'; u.rate = 0.72; u.pitch = 1.05; u.volume = 1.0
    u.onend = resolve
    const voices = window.speechSynthesis.getVoices()
    const fem = voices.find(v => v.lang === 'es-ES') || voices.find(v => v.lang.startsWith('es'))
    if (fem) u.voice = fem
    window.speechSynthesis.speak(u)
  })
}

const SENTIDOS = [
  {
    n: 5, sentido: 'VES', emoji: '👁️', color: '#60a5fa',
    titulo: '5 cosas que VES',
    desc: 'Mira despacio a tu alrededor. Nombra en silencio cinco cosas: objetos, formas, colores.',
    ejemplos: 'escritorio · silla · luz · ventana · algo delante de ti',
  },
  {
    n: 4, sentido: 'TOCAS', emoji: '✋', color: '#34d399',
    titulo: '4 cosas que TOCAS',
    desc: 'Siente la textura de cuatro cosas cercanas. ¿Es suave, áspero, duro, blando, frío o cálido?',
    ejemplos: 'camiseta · bolígrafo · mesa · pantalón · móvil',
  },
  {
    n: 3, sentido: 'OYES', emoji: '👂', color: '#a78bfa',
    titulo: '3 cosas que OYES',
    desc: 'Busca sonidos a tu alrededor. Si tu mente se va, tráela de vuelta con el sonido que escuchas.',
    ejemplos: 'ruido de fondo · voces lejanas · aire · pasos · lápices',
  },
  {
    n: 2, sentido: 'HUELES', emoji: '👃', color: '#fbbf24',
    titulo: '2 cosas que HUELES',
    desc: 'Fíjate en los olores cercanos. Si no hay ninguno claro, imagina uno que te guste.',
    ejemplos: 'tinta · ropa · ambiente · champú · colonia',
  },
  {
    n: 1, sentido: 'SABOREAS', emoji: '👅', color: '#f472b6',
    titulo: '1 cosa que SABOREAS',
    desc: 'Pasa la lengua suavemente por tu boca. Si no hay sabor, imagina uno que te guste.',
    ejemplos: 'agua · chicle · comida · un sorbo de algo',
  },
]

const SCRIPT = [
  { texto: 'Vamos a hacer ahora una técnica llamada grounding cinco cuatro tres dos uno, que sirve para volver a estar aquí, en el presente.', sentidoIdx: null, duracion: 7000 },
  { texto: 'Puedes seguir sentado o de pie, con los pies apoyados. Si puedes, suelta la mochila y deja que la espalda esté cómoda.', sentidoIdx: null, duracion: 6000 },
  { texto: 'Empezamos con cinco cosas que ves a tu alrededor. Mira despacio, sin juzgar lo que encuentres. Nombra en silencio cinco cosas: objetos, formas, colores.', sentidoIdx: 0, duracion: 9000 },
  { texto: 'Puede ser el escritorio, una silla, una luz, una ventana, algo que tengas delante. No pasa nada si son cosas pequeñas o sencillas. Imagina que cada objeto que nombras te sujeta más aquí.', sentidoIdx: 0, duracion: 10000 },
  { texto: 'Ahora, vamos con cuatro cosas que tocas. Siente la textura de cuatro cosas cercanas.', sentidoIdx: 1, duracion: 6000 },
  { texto: 'Puede ser tu camiseta, el bolígrafo, la mesa, tu pantalón. ¿Es suave, áspero, duro, blando, frío o cálido? Deja que cada sensación te recuerde que estás aquí, en tu cuerpo.', sentidoIdx: 1, duracion: 10000 },
  { texto: 'Siguiente paso: tres cosas que oyes. No intentes buscar silencio, busca sonidos.', sentidoIdx: 2, duracion: 6000 },
  { texto: 'Puede ser el ruido de fondo, voces lejanas, el aire, pasos en el pasillo. Si notas que tu mente se va, tráela de nuevo con el sonido que estés escuchando.', sentidoIdx: 2, duracion: 9000 },
  { texto: 'Ahora, dos cosas que hueles. Si estás en un lugar con olores claros, fíjate en ellos.', sentidoIdx: 3, duracion: 6000 },
  { texto: 'Si no hay ningún olor muy claro, imagina uno que te guste: champú, colonia, comida que te resulte reconfortante. Deja que el olor te conecte con tu cuerpo.', sentidoIdx: 3, duracion: 9000 },
  { texto: 'Por último, una cosa que saboreas. Pasa la lengua suavemente por el interior de tu boca.', sentidoIdx: 4, duracion: 6000 },
  { texto: 'Si no hay sabor claro, imagina uno que te guste: un sorbo de algo, un bocado de algún alimento. Deja que el sabor te recuerde que estás aquí, en tu cuerpo, en este momento.', sentidoIdx: 4, duracion: 10000 },
  { texto: 'Para cerrar, haz una o dos respiraciones más lentas de lo normal. Inspira por la nariz, suelta por la boca.', sentidoIdx: null, duracion: 8000 },
  { texto: 'Y dite en silencio: "Estoy aquí, en este lugar, en este momento, respirando".', sentidoIdx: null, duracion: 6000 },
]

function SentidoVisual({ sentidoIdx }) {
  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-xs mx-auto">
      {SENTIDOS.map((s, i) => {
        const isActivo = sentidoIdx === i
        const isPasado = sentidoIdx !== null && sentidoIdx > i
        return (
          <motion.div key={s.n}
            className="w-full rounded-2xl flex items-center gap-4 px-5 py-3 transition-all"
            style={{
              background: isActivo ? `${s.color}22` : isPasado ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.06)',
              border: isActivo ? `2px solid ${s.color}` : isPasado ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.1)',
            }}
            animate={isActivo ? { scale: [1, 1.02, 1] } : { scale: 1 }}
            transition={{ duration: 1.5, repeat: isActivo ? Infinity : 0 }}>
            <span className="text-2xl">{s.emoji}</span>
            <div className="flex-1">
              <p className="font-black text-sm" style={{ color: isActivo ? s.color : isPasado ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.5)' }}>
                {s.n} {s.sentido}
              </p>
              {isActivo && (
                <p className="text-white/50 text-xs mt-0.5">{s.desc.slice(0, 50)}...</p>
              )}
            </div>
            <div className="flex-shrink-0">
              {isPasado && <span className="text-green-400 text-sm">✓</span>}
              {isActivo && (
                <motion.div className="w-3 h-3 rounded-full" style={{ background: s.color }}
                  animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} />
              )}
              {!isActivo && !isPasado && (
                <span className="text-white/20 font-black text-sm">{s.n}</span>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

export default function Grounding54321() {
  const [state, setState] = useState('idle')
  const [scriptIdx, setScriptIdx] = useState(0)
  const [sentidoIdx, setSentidoIdx] = useState(null)
  const [textoActual, setTextoActual] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [evalFase, setEvalFase] = useState('pre')
  const [malestarPre, setMalestarPre] = useState(null)
  const startRef = useRef(null)
  const runningRef = useRef(false)
  const navigate = useNavigate()

  const runScript = async (conVoz) => {
    runningRef.current = true
    startRef.current = Date.now()
    for (let i = 0; i < SCRIPT.length; i++) {
      if (!runningRef.current) break
      const step = SCRIPT[i]
      setScriptIdx(i)
      setTextoActual(step.texto)
      if (step.sentidoIdx !== null) setSentidoIdx(step.sentidoIdx)
      if (conVoz) {
        await speak(step.texto)
      } else {
        await new Promise(r => setTimeout(r, step.duracion))
      }
      if (!runningRef.current) break
    }
    if (runningRef.current) setState('done')
  }

  const handleStart = (conVoz) => {
    setState('running')
    setSentidoIdx(null)
    runScript(conVoz)
  }

  const handleStop = () => {
    runningRef.current = false
    window.speechSynthesis?.cancel()
    setState('idle')
    setScriptIdx(0)
    setSentidoIdx(null)
    setTextoActual('')
  }

  const saveSession = async () => {
    if (saving || saved) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const duracion = startRef.current ? Math.round((Date.now() - startRef.current) / 1000) : 200
      await supabase.from('sesiones_tecnicas').insert({
        user_id: user.id,
        tecnica_id: 'grounding_54321',
        tecnica_nombre: 'Grounding 5-4-3-2-1',
        duracion_segundos: duracion,
        created_at: new Date().toISOString()
      })
      setSaved(true)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  useEffect(() => () => { runningRef.current = false; window.speechSynthesis?.cancel() }, [])

  const sentidoActual = sentidoIdx !== null ? SENTIDOS[sentidoIdx] : null

  // PANTALLA INICIO
  if (state === 'idle') {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-teal-600 font-medium mb-6">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-xl">
            🌱
          </div>
          <div>
            <h1 className="text-xl font-black" style={{ color: '#0d3d3d' }}>Grounding 5-4-3-2-1</h1>
            <p className="text-slate-500 text-sm">3-4 minutos · Vuelve al presente</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6">
          <p className="font-bold text-slate-800 mb-3">¿Qué es?</p>
          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            Una técnica de anclaje sensorial para salir del bucle de pensamientos y volver al momento presente. Usas los cinco sentidos para conectar con lo que te rodea.
          </p>
          <div className="space-y-2">
            {SENTIDOS.map(s => (
              <div key={s.n} className="flex items-center gap-3 text-sm"
                style={{ color: s.color }}>
                <span className="text-lg">{s.emoji}</span>
                <span className="font-bold">{s.n}</span>
                <span className="text-slate-500">{s.titulo.split('que ')[1]}</span>
              </div>
            ))}
          </div>
        </div>

        {evalFase === 'pre' ? (
          <EvaluacionPrePost
            ejercicioId="grounding_54321"
            ejercicioNombre="Grounding 5-4-3-2-1"
            modo="pre"
            onComplete={({ malestarPre: mp }) => { setMalestarPre(mp); setEvalFase('opciones') }}
            onSkip={() => setEvalFase('opciones')}
          />
        ) : (
          <div className="flex flex-col gap-3">
            <button onClick={() => { handleStart(true); setEvalFase('ejercicio') }}
              className="w-full py-4 rounded-2xl text-white font-bold text-lg shadow-lg flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #0f6b6b)' }}>
              <Volume2 className="w-5 h-5" /> 🎙️ Iniciar con voz guiada
            </button>
            <button onClick={() => { handleStart(false); setEvalFase('ejercicio') }}
              className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(15,107,107,0.3)', color: '#0f6b6b' }}>
              <Play className="w-4 h-4" /> Iniciar sin voz
            </button>
          </div>
        )}
      </div>
    )
  }

  // PANTALLA FIN
  if (state === 'done') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6"
        style={{ background: 'linear-gradient(135deg, #0d3d3d, #064e3b)' }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center flex flex-col items-center gap-4 max-w-sm">
          <CheckCircle className="w-16 h-16 text-green-400" />
          <p className="text-white text-2xl font-black">¡Grounding completado! 🌱</p>
          <p className="text-white/60 text-sm leading-relaxed">
            Has usado los cinco sentidos para volver al presente. Nota cómo te sientes ahora comparado con antes.
          </p>
          <div className="flex flex-col gap-3 w-full mt-2">
            {evalFase !== 'fin' ? (
              <EvaluacionPrePost
                ejercicioId="grounding_54321"
                ejercicioNombre="Grounding 5-4-3-2-1"
                modo="post"
                malestarPre={malestarPre}
                onComplete={async () => { await saveSession(); setEvalFase('fin') }}
                onSkip={async () => { await saveSession(); navigate(-1) }}
              />
            ) : (
              <>
                <button onClick={() => navigate(-1)}
                  className="w-full py-3 rounded-2xl text-white font-bold"
                  style={{ background: 'rgba(74,222,128,0.25)', border: '1px solid rgba(255,255,255,0.2)' }}>
                  ✓ Cerrar
                </button>
                <button onClick={() => { setState('idle'); setSentidoIdx(null); setEvalFase('pre') }}
                  className="text-white/30 text-xs hover:text-white/50">Repetir</button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    )
  }

  // PANTALLA EJERCICIO EN CURSO
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #0d3d3d 0%, #064e3b 100%)' }}>

      <button onClick={handleStop} className="absolute top-6 left-6 text-white/30 hover:text-white/60">
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Título sentido actual */}
      <motion.div key={sentidoIdx} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="mb-6 text-center">
        {sentidoActual ? (
          <span className="text-sm font-black tracking-widest px-3 py-1 rounded-full"
            style={{ color: sentidoActual.color, border: `1px solid ${sentidoActual.color}44`, background: `${sentidoActual.color}15` }}>
            {sentidoActual.emoji} {sentidoActual.titulo}
          </span>
        ) : (
          <span className="text-sm font-black tracking-widest px-3 py-1 rounded-full text-teal-300"
            style={{ border: '1px solid rgba(94,234,212,0.3)', background: 'rgba(94,234,212,0.1)' }}>
            🌱 Grounding 5-4-3-2-1
          </span>
        )}
      </motion.div>

      {/* Visual sentidos */}
      <div className="w-full max-w-xs mb-6">
        <SentidoVisual sentidoIdx={sentidoIdx} />
      </div>

      {/* Texto guía */}
      <AnimatePresence mode="wait">
        <motion.div key={scriptIdx}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
          className="text-center max-w-sm px-2 mt-2">
          <p className="text-white/80 text-sm leading-relaxed italic">
            "{textoActual}"
          </p>
          {sentidoActual && (
            <p className="text-white/30 text-xs mt-3">
              Ejemplos: {sentidoActual.ejemplos}
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      <button onClick={handleStop} className="mt-10 text-white/20 text-xs hover:text-white/40">
        Detener
      </button>
    </div>
  )
}
