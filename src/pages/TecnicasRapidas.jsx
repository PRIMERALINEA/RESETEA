import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/api/supabaseClient'
import { useNavigate } from 'react-router-dom'
import { Zap, ChevronRight, CheckCircle, Mic, Volume2 } from 'lucide-react'

// ── Google TTS ────────────────────────────────────────────────────────────────
const GOOGLE_TTS_KEY = import.meta.env.VITE_GOOGLE_TTS_KEY
const audioCache = {}
let activeAudio = null

function stopAudio() {
  if (activeAudio) { activeAudio.pause(); activeAudio.currentTime = 0; activeAudio = null }
  window.speechSynthesis?.cancel()
}

function speakNow(text, cancelRef) {
  if (!window.speechSynthesis) return Promise.resolve()
  window.speechSynthesis.cancel()
  return new Promise(resolve => {
    if (cancelRef?.current) { resolve(); return }
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'es-ES'; u.rate = 0.78; u.pitch = 1.1; u.volume = 1.0
    u.onend = resolve
    const loadVoice = () => {
      const voices = window.speechSynthesis.getVoices()
      const fem = voices.find(v => v.lang === 'es-ES' && /female|mujer|mónica|lucia|elena|paulina/i.test(v.name))
        || voices.find(v => v.lang.startsWith('es'))
      if (fem) u.voice = fem
      window.speechSynthesis.speak(u)
    }
    if (window.speechSynthesis.getVoices().length > 0) loadVoice()
    else window.speechSynthesis.onvoiceschanged = loadVoice
  })
}

async function speak(text, cancelRef) {
  if (cancelRef?.current) return
  if (GOOGLE_TTS_KEY) {
    const key = text.slice(0, 80)
    try {
      if (!audioCache[key]) {
        const res = await fetch(
          `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              input: { text },
              voice: { languageCode: 'es-ES', name: 'es-ES-Neural2-A', ssmlGender: 'FEMALE' },
              audioConfig: { audioEncoding: 'MP3', speakingRate: 0.78, pitch: -2.0 }
            })
          }
        )
        if (!res.ok) throw new Error('Google TTS error')
        const { audioContent } = await res.json()
        const blob = await fetch(`data:audio/mp3;base64,${audioContent}`).then(r => r.blob())
        audioCache[key] = URL.createObjectURL(blob)
      }
      if (cancelRef?.current) return
      return new Promise(resolve => {
        const audio = new Audio(audioCache[key])
        audio.volume = 0.95
        activeAudio = audio
        audio.onended = () => { activeAudio = null; resolve() }
        audio.play()
      })
    } catch (e) { console.error('Google TTS error:', e) }
  }
  return speakNow(text, cancelRef)
}

// ── TÉCNICAS ──────────────────────────────────────────────────────────────────
const TECNICAS = [
  {
    id: 'pausa_1min',
    name: 'Pausa de 1 minuto',
    desc: 'Resetea tu mente entre tareas',
    emoji: '⏱️',
    color: 'from-teal-400 to-cyan-500',
    duracion: '1 min',
    intro: 'Vamos a hacer una pausa de un minuto para resetear tu mente. Sigue las instrucciones y deja que tu cuerpo y tu mente descansen.',
    pasos: [
      { texto: 'Cierra los ojos o baja la mirada', duracion: 10, voice: 'Cierra los ojos, o simplemente baja la mirada. Suelta el móvil o el bolígrafo.' },
      { texto: 'Respira lento: inhala 4s, exhala 6s', duracion: 20, voice: 'Respira lento. Inhala contando hasta cuatro... y exhala contando hasta seis. Más largo al soltar.' },
      { texto: 'Suelta la tensión de hombros y mandíbula', duracion: 15, voice: 'Ahora suelta conscientemente los hombros. Relaja la mandíbula. Deja caer cualquier tensión acumulada.' },
      { texto: 'Di mentalmente: "Estoy en pausa. Ahora vuelvo."', duracion: 15, voice: 'Para cerrar, dite en silencio: Estoy en pausa. Ahora vuelvo. Con calma, cuando estés listo.' },
    ]
  },
  {
    id: 'escalera',
    name: 'Escalera de calmado',
    desc: 'Baja la intensidad emocional paso a paso',
    emoji: '🪜',
    color: 'from-indigo-400 to-blue-500',
    duracion: '2-3 min',
    intro: 'Vamos a usar la escalera de calmado. Cada paso te ayudará a bajar un nivel de intensidad emocional. Tómate el tiempo que necesites en cada uno.',
    pasos: [
      { texto: '🔴 NIVEL 5 — Respira profundo 3 veces. Solo eso.', duracion: 20, voice: 'Nivel cinco. Respira profundo tres veces. Nada más. Solo el aire entrando y saliendo.' },
      { texto: '🟠 NIVEL 4 — Nombra 5 cosas que ves ahora mismo.', duracion: 20, voice: 'Nivel cuatro. Mira a tu alrededor y nombra en silencio cinco cosas que puedes ver ahora mismo.' },
      { texto: '🟡 NIVEL 3 — Tensa y suelta los puños 3 veces.', duracion: 20, voice: 'Nivel tres. Aprieta los puños con fuerza... y suelta. Hazlo tres veces. Nota cómo baja la tensión.' },
      { texto: '🟢 NIVEL 2 — Respira: inhala 4s, retén 4s, exhala 4s.', duracion: 20, voice: 'Nivel dos. Respiración cuadrada. Inhala cuatro segundos, retén cuatro, exhala cuatro.' },
      { texto: '🔵 NIVEL 1 — Di: "Lo estoy gestionando. Voy bien."', duracion: 20, voice: 'Nivel uno. Dite a ti mismo: Lo estoy gestionando. Voy bien. Y es verdad.' },
    ]
  },
  {
    id: 'grounding',
    name: 'Grounding 5-4-3-2-1',
    desc: 'Vuelve al presente usando los sentidos',
    emoji: '🌱',
    color: 'from-green-400 to-emerald-500',
    duracion: '2-3 min',
    intro: 'Vamos a hacer el grounding cinco, cuatro, tres, dos, uno. Esta técnica usa tus sentidos para traerte de vuelta al momento presente.',
    pasos: [
      { texto: '👁️ Nombra 5 cosas que puedes VER ahora mismo', duracion: 25, voice: 'Mira despacio a tu alrededor. Nombra en silencio cinco cosas que puedes ver.' },
      { texto: '✋ Nombra 4 cosas que puedes TOCAR o sentir', duracion: 25, voice: 'Toca cuatro cosas cercanas. Nota su textura. Deja que cada sensación te ancle aquí.' },
      { texto: '👂 Nombra 3 sonidos que puedes ESCUCHAR', duracion: 20, voice: 'Escucha con atención. Identifica tres sonidos distintos a tu alrededor.' },
      { texto: '👃 Nombra 2 cosas que puedes OLER (o recordar)', duracion: 20, voice: 'Fíjate en los olores cercanos. Si no hay ninguno, imagina uno que te resulte agradable.' },
      { texto: '👅 Nombra 1 cosa que puedes SABOREAR ahora', duracion: 15, voice: 'Por último, pasa la lengua por tu boca. Deja que ese sabor te recuerde que estás aquí.' },
    ]
  },
  {
    id: 'respiracion_box',
    name: 'Respiración cuadrada rápida',
    desc: 'Calma inmediata en 2 minutos',
    emoji: '⬜',
    color: 'from-violet-400 to-purple-500',
    duracion: '2 min',
    intro: 'Vamos a hacer la respiración cuadrada. Cuatro segundos en cada fase. Repite el ciclo cuatro veces.',
    pasos: [
      { texto: 'INHALA por la nariz — 4 segundos', duracion: 4, voice: 'Inhala por la nariz.' },
      { texto: 'RETÉN el aire — 4 segundos',        duracion: 4, voice: 'Retén el aire.' },
      { texto: 'EXHALA por la boca — 4 segundos',   duracion: 4, voice: 'Exhala lentamente.' },
      { texto: 'PAUSA — 4 segundos',                duracion: 4, voice: 'Pausa.' },
    ],
    repetir: 4
  },
]

// ── Componente ejercicio ──────────────────────────────────────────────────────
function TecnicaEjercicio({ tecnica, conVoz, onDone, onBack }) {
  const [pasoIdx, setPasoIdx]       = useState(-1)
  const [counter, setCounter]       = useState(0)
  const [repeticion, setRepeticion] = useState(0)
  const [finalizado, setFinalizado] = useState(false)
  const [hablando, setHablando]     = useState(false)
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)
  const timerRef  = useRef(null)
  const startRef  = useRef(Date.now())
  const cancelRef = useRef(false)

  const clearTimer = () => { if (timerRef.current) clearInterval(timerRef.current) }

  useEffect(() => {
    cancelRef.current = false
    const init = async () => {
      if (conVoz) {
        setHablando(true)
        await speak(tecnica.intro, cancelRef)
        if (cancelRef.current) return
        await speak(tecnica.pasos[0].voice, cancelRef)
        setHablando(false)
      }
      if (!cancelRef.current) setPasoIdx(0)
    }
    init()
    return () => { cancelRef.current = true; clearTimer(); stopAudio() }
  }, [])

  useEffect(() => {
    if (pasoIdx < 0 || finalizado) return
    clearTimer()
    setCounter(tecnica.pasos[pasoIdx].duracion)
    timerRef.current = setInterval(() => {
      if (cancelRef.current) { clearInterval(timerRef.current); return }
      setCounter(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          if (cancelRef.current) return 0
          const nextPaso = pasoIdx + 1
          if (nextPaso >= tecnica.pasos.length) {
            const maxRep = tecnica.repetir || 1
            const nextRep = repeticion + 1
            if (nextRep < maxRep) {
              setRepeticion(nextRep)
              setPasoIdx(0)
              if (conVoz) speak(tecnica.pasos[0].voice, cancelRef)
            } else {
              setFinalizado(true)
              if (conVoz) speak('Perfecto. Has completado la técnica. Tómate un momento para notar cómo te sientes.', cancelRef)
            }
          } else {
            setPasoIdx(nextPaso)
            if (conVoz) speak(tecnica.pasos[nextPaso].voice, cancelRef)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return clearTimer
  }, [pasoIdx, repeticion])

  const saveSession = async () => {
    if (saving || saved) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const duracion = Math.round((Date.now() - startRef.current) / 1000)
      await supabase.from('sesiones_tecnicas').insert({
        user_id: user.id,
        tecnica_id: tecnica.id,
        tecnica_nombre: tecnica.name,
        duracion_segundos: duracion,
        created_at: new Date().toISOString()
      })
      setSaved(true)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const handleBack = () => {
    cancelRef.current = true
    clearTimer()
    stopAudio()
    onBack()
  }

  // ── Pantalla final ──
  if (finalizado) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6"
        style={{ background: 'linear-gradient(135deg, #0d3d3d 0%, #0f6b6b 100%)' }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center flex flex-col items-center gap-4 max-w-sm">
          <CheckCircle className="w-16 h-16 text-green-400" />
          <p className="text-white text-2xl font-black">¡Técnica completada!</p>
          <p className="text-white/60 text-sm">Tómate un momento para notar cómo te sientes ahora</p>
          <div className="flex flex-col gap-3 w-full mt-2">
            <button onClick={async () => { await saveSession(); onDone() }}
              disabled={saving}
              className="w-full py-3 rounded-2xl text-white font-bold"
              style={{ background: saved ? 'rgba(74,222,128,0.25)' : 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
              {saving ? 'Guardando...' : saved ? '✓ Guardado' : '💾 Guardar y cerrar'}
            </button>
            <button onClick={handleBack} className="text-white/30 text-xs hover:text-white/50">Volver a técnicas</button>
          </div>
        </motion.div>
      </div>
    )
  }

  const paso = pasoIdx >= 0 ? tecnica.pasos[pasoIdx] : null
  const totalPasos = tecnica.pasos.length * (tecnica.repetir || 1)
  const pasoGlobal = repeticion * tecnica.pasos.length + pasoIdx

  // ── Pantalla ejercicio ── layout en columna, botón EN flujo normal arriba
  return (
    <div className="min-h-screen flex flex-col p-6"
      style={{ background: 'linear-gradient(135deg, #0d3d3d 0%, #0f6b6b 100%)' }}>

      {/* Barra superior — en flujo normal, siempre visible */}
      <div className="flex items-center justify-between mb-8 flex-shrink-0">
        <button onClick={handleBack}
          className="px-4 py-2 rounded-xl text-white font-bold text-sm"
          style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}>
          ✕ Salir
        </button>

        {conVoz && (
          <motion.div
            animate={hablando ? { opacity: [1, 0.3, 1] } : { opacity: 0.3 }}
            transition={{ duration: 0.8, repeat: hablando ? Infinity : 0 }}>
            <Volume2 className="w-5 h-5 text-white/60" />
          </motion.div>
        )}
      </div>

      {/* Contenido centrado */}
      <div className="flex-1 flex flex-col items-center justify-center">

        {/* Intro en curso */}
        {pasoIdx < 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center max-w-sm">
            <p className="text-white/50 text-sm tracking-widest">Preparando...</p>
          </motion.div>
        )}

        {/* Ejercicio en curso */}
        {pasoIdx >= 0 && paso && (
          <>
            <div className="flex gap-1.5 mb-8">
              {Array.from({ length: totalPasos }).map((_, i) => (
                <div key={i} className="h-1.5 rounded-full transition-all"
                  style={{ width: i === pasoGlobal ? '24px' : '8px', background: i < pasoGlobal ? '#4ade80' : i === pasoGlobal ? '#5eead4' : 'rgba(255,255,255,0.15)' }} />
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={`${repeticion}-${pasoIdx}`}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="text-center max-w-sm w-full">
                <p className="text-white/40 text-xs tracking-widest mb-2">{tecnica.name.toUpperCase()}</p>
                <p className="text-white text-xl font-black leading-relaxed mb-8 px-2">{paso.texto}</p>

                <div className="relative w-28 h-28 mx-auto">
                  <svg className="w-28 h-28 -rotate-90" viewBox="0 0 112 112">
                    <circle cx="56" cy="56" r="48" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                    <motion.circle cx="56" cy="56" r="48" fill="none"
                      stroke="#5eead4" strokeWidth="6" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 48}`}
                      strokeDashoffset={`${2 * Math.PI * 48 * (counter / paso.duracion)}`}
                      style={{ transition: 'stroke-dashoffset 1s linear' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-white font-black text-2xl">{counter}</p>
                    <p className="text-white/40 text-xs">seg</p>
                  </div>
                </div>

                {tecnica.repetir && (
                  <p className="text-white/30 text-xs mt-4">Vuelta {repeticion + 1} de {tecnica.repetir}</p>
                )}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function TecnicasRapidas() {
  const [selected, setSelected] = useState(null)
  const [conVoz, setConVoz]     = useState(false)

  if (selected) {
    return <TecnicaEjercicio
      tecnica={selected}
      conVoz={conVoz}
      onDone={() => setSelected(null)}
      onBack={() => setSelected(null)}
    />
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black" style={{ color: '#0d3d3d' }}>Técnicas rápidas</h1>
          <p className="text-slate-500 text-sm">Regulación emocional en 1–3 minutos</p>
        </div>
      </div>

      <div className="bg-teal-50 rounded-2xl p-4 mb-6 border border-teal-100 mt-4">
        <p className="text-teal-700 text-sm">⚡ <strong>¿Cuándo usarlas?</strong> Antes de un examen, cuando sientes que te bloqueas, entre clases o en cualquier momento de tensión.</p>
      </div>

      <div className="space-y-4">
        {TECNICAS.map((tec, i) => (
          <motion.div key={tec.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all border border-slate-100">
              <div className="flex items-center gap-4 mb-3">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tec.color} flex items-center justify-center text-2xl flex-shrink-0`}>
                  {tec.emoji}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800">{tec.name}</p>
                  <p className="text-sm text-slate-500">{tec.desc}</p>
                  <p className="text-xs text-teal-500 mt-1">⏱ {tec.duracion} · {tec.pasos.length} pasos</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setConVoz(false); setSelected(tec) }}
                  className={`flex-1 py-2 rounded-xl text-white text-sm font-bold bg-gradient-to-r ${tec.color}`}>
                  Sin voz
                </button>
                <button onClick={() => { setConVoz(true); setSelected(tec) }}
                  className="flex-1 py-2 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-1"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                  <Mic className="w-3 h-3" /> Con voz
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
