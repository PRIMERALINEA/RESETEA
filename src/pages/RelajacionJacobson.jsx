import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/api/supabaseClient'
import { useNavigate } from 'react-router-dom'
import { Heart, CheckCircle } from 'lucide-react'

const GOOGLE_TTS_KEY = import.meta.env.VITE_GOOGLE_TTS_KEY
const audioCache = {}
let activeAudio = null
let ttsFailCount = 0
const TTS_FAIL_LIMIT = 2

function stopAudio() {
  if (activeAudio) {
    activeAudio.pause()
    activeAudio.currentTime = 0
    activeAudio = null
  }
  if (window.speechSynthesis?.speaking) window.speechSynthesis.cancel()
}

function speakNow(text, cancelRef) {
  if (!window.speechSynthesis) return Promise.resolve()
  return new Promise(resolve => {
    if (cancelRef?.current) { resolve(); return }
    const doSpeak = () => {
      if (cancelRef?.current) { resolve(); return }
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'es-ES'; u.rate = 0.75; u.pitch = 1.05; u.volume = 1.0
      u.onend = resolve
      u.onerror = resolve
      const voices = window.speechSynthesis.getVoices()
      const fem = voices.find(v => v.lang === 'es-ES' && /female|mujer|mónica|lucia|elena|paulina/i.test(v.name))
        || voices.find(v => v.lang.startsWith('es'))
      if (fem) u.voice = fem
      window.speechSynthesis.speak(u)
    }
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel()
      setTimeout(() => {
        if (window.speechSynthesis.getVoices().length > 0) doSpeak()
        else window.speechSynthesis.onvoiceschanged = doSpeak
      }, 50)
    } else if (window.speechSynthesis.getVoices().length > 0) doSpeak()
    else window.speechSynthesis.onvoiceschanged = doSpeak
  })
}

async function speak(text, cancelRef) {
  if (cancelRef?.current) return
  stopAudio()
  if (GOOGLE_TTS_KEY && ttsFailCount < TTS_FAIL_LIMIT) {
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
              voice: { languageCode: 'es-ES', name: 'es-ES-Wavenet-C', ssmlGender: 'FEMALE' },
              audioConfig: { audioEncoding: 'MP3', speakingRate: 0.85, pitch: 0.0 }
            })
          }
        )
        if (!res.ok) throw new Error(`Google TTS HTTP ${res.status}`)
        const { audioContent } = await res.json()
        if (!audioContent) throw new Error('Google TTS: respuesta sin audioContent')
        const blob = await fetch(`data:audio/mp3;base64,${audioContent}`).then(r => r.blob())
        audioCache[key] = URL.createObjectURL(blob)
      }
      if (cancelRef?.current) return
      await new Promise((resolve, reject) => {
        const audio = new Audio(audioCache[key])
        audio.volume = 0.95
        activeAudio = audio
        audio.onended = () => { activeAudio = null; resolve() }
        audio.onerror = () => { activeAudio = null; reject(new Error('Google TTS: audio.play() falló')) }
        audio.play().catch(reject)
      })
      ttsFailCount = 0
      return
    } catch (e) {
      ttsFailCount++
      console.error(`Google TTS error (fallo ${ttsFailCount}/${TTS_FAIL_LIMIT}):`, e)
      delete audioCache[key]
    }
  }
  return speakNow(text, cancelRef)
}

// Espera N segundos actualizando el contador visual. Resuelve antes si cancelRef se activa.
function waitWithCounter(seconds, cancelRef, setCounter) {
  return new Promise(resolve => {
    setCounter(seconds)
    let remaining = seconds
    const tick = setInterval(() => {
      if (cancelRef.current) {
        clearInterval(tick)
        resolve()
        return
      }
      remaining -= 1
      setCounter(remaining)
      if (remaining <= 0) {
        clearInterval(tick)
        resolve()
      }
    }, 1000)
  })
}

// Espera N segundos en silencio sin mostrar contador
function waitSilent(seconds, cancelRef) {
  return new Promise(resolve => {
    let remaining = seconds
    const tick = setInterval(() => {
      if (cancelRef.current) { clearInterval(tick); resolve(); return }
      remaining -= 1
      if (remaining <= 0) { clearInterval(tick); resolve() }
    }, 1000)
  })
}

const GROUPS = [
  {
    id: 'manos', name: 'Manos y brazos', emoji: '🤜',
    color: '#60a5fa',
    tenseText: 'Aprieta los puños con fuerza. Siente la tensión en las manos y los antebrazos.',
    relaxText: 'Suelta. Deja que las manos caigan pesadas. Nota la diferencia entre la tensión y la relajación.',
    tense: 7, relax: 20
  },
  {
    id: 'hombros', name: 'Hombros y cuello', emoji: '🤷',
    color: '#a78bfa',
    tenseText: 'Sube los hombros hacia las orejas. Tensa el cuello. Mantén.',
    relaxText: 'Suelta los hombros hacia abajo. Siente el calor relajante recorriendo el cuello y los hombros.',
    tense: 7, relax: 20
  },
  {
    id: 'cara', name: 'Cara', emoji: '😬',
    color: '#f472b6',
    tenseText: 'Arruga toda la cara. Frente, ojos, nariz, mandíbula. Todo tenso.',
    relaxText: 'Suelta. Deja la cara completamente lisa. Siente cómo se relajan todos los músculos de la cara.',
    tense: 7, relax: 20
  },
  {
    id: 'abdomen', name: 'Abdomen', emoji: '🫃',
    color: '#34d399',
    tenseText: 'Tensa el abdomen como si fueras a recibir un golpe. Mantén la tensión.',
    relaxText: 'Suelta. Respira profundo. Siente el abdomen expandirse libremente con cada respiración.',
    tense: 7, relax: 20
  },
  {
    id: 'piernas', name: 'Piernas y pies', emoji: '🦵',
    color: '#fbbf24',
    tenseText: 'Estira las piernas y apunta los dedos hacia ti, tensando muslos, pantorrillas y pies.',
    relaxText: 'Suelta. Deja que las piernas caigan pesadas. Siente la relajación profunda desde los muslos hasta los pies.',
    tense: 7, relax: 20
  },
]

export default function RelajacionJacobson() {
  const [state, setState]       = useState('idle')
  const [groupIdx, setGroupIdx] = useState(0)
  const [phase, setPhase]       = useState('tense')
  const [counter, setCounter]   = useState(7)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const startRef  = useRef(null)
  const cancelRef = useRef(false)
  const navigate  = useNavigate()

  const group = GROUPS[groupIdx]

  // ─── Secuencia principal: completamente async y lineal ───────────────────
  // No hay useEffect de timer. Todo avanza cuando el audio termina + el tiempo pasa.
  const runSequence = useCallback(async () => {
    cancelRef.current = false
    startRef.current = Date.now()
    setSaved(false)

    // Intro
    await speak('Siéntate o túmbate cómodamente.', cancelRef)
    if (cancelRef.current) return

    for (let i = 0; i < GROUPS.length; i++) {
      const g = GROUPS[i]
      if (cancelRef.current) return

      // La pantalla cambia de grupo ANTES de anunciarlo por voz. Si no, mientras
      // suena "Ahora hombros y cuello" la pantalla seguía mostrando el grupo y la
      // fase anteriores — el solape reportado.
      setGroupIdx(i)
      setPhase('anuncio')

      const anuncio = i === 0
        ? 'Empezamos con manos y brazos.'
        : `Ahora ${g.name}.`
      await speak(anuncio, cancelRef)
      if (cancelRef.current) return

      // ── FASE TENSIÓN ──────────────────────────────────────────────────
      setPhase('tense')

      await speak(g.tenseText, cancelRef)
      if (cancelRef.current) return

      await waitWithCounter(g.tense, cancelRef, setCounter)
      if (cancelRef.current) return

      // ── FASE RELAJACIÓN ───────────────────────────────────────────────
      await speak(g.relaxText, cancelRef)
      if (cancelRef.current) return

      setPhase('relax')
      await waitWithCounter(g.relax, cancelRef, setCounter)
      if (cancelRef.current) return
    }

    // Fin
    setState('done')
    await speak('Perfecto. Has completado la relajación muscular completa.', cancelRef)
    if (cancelRef.current) return
    await speak('Tómate un momento para disfrutar de esta sensación de calma. Cuando quieras, abre los ojos.', cancelRef)
  }, [])

  const start = () => {
    setState('running')
    runSequence()
  }

  const reset = () => {
    cancelRef.current = true
    stopAudio()
    setState('idle')
    setGroupIdx(0)
    setPhase('tense')
    setCounter(7)
    setSaved(false)
  }

  useEffect(() => () => { cancelRef.current = true; stopAudio() }, [])

  const saveSession = async () => {
    if (saving || saved) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const duracion = startRef.current ? Math.round((Date.now() - startRef.current) / 1000) : 0
      await supabase.from('sesiones_relajacion').insert({
        user_id: user.id,
        tipo: 'relajacion_muscular_progresiva',
        grupos_completados: GROUPS.length,
        duracion_segundos: duracion,
        created_at: new Date().toISOString()
      })
      setSaved(true)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  // ─── UI: idle ────────────────────────────────────────────────────────────
  if (state === 'idle') {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/relajacion')} className="text-slate-400 hover:text-slate-600 text-sm">←</button>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-blue-900">Relajación de Jacobson</h1>
            <p className="text-slate-500 text-sm">Con voz guiada · ~7 minutos</p>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-blue-50 mb-6">
          <p className="font-bold text-slate-800 mb-3">¿Cómo funciona?</p>
          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            Vas a tensar y soltar grupos musculares uno a uno. La voz te guiará en cada paso. Al soltar notarás una relajación profunda — perfecta para antes de un examen o para dormir mejor.
          </p>
          <div className="space-y-2">
            {GROUPS.map((g) => (
              <div key={g.id} className="flex items-center gap-3">
                <span className="text-xl">{g.emoji}</span>
                <span className="text-sm text-slate-600 flex-1">{g.name}</span>
                <span className="text-xs text-slate-400">{g.tense + g.relax}s</span>
              </div>
            ))}
          </div>
        </div>
        <button onClick={start}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold text-lg shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
          🎙️ Iniciar con voz guiada
        </button>
      </div>
    )
  }

  // ─── UI: done ────────────────────────────────────────────────────────────
  if (state === 'done') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6"
        style={{ background: 'linear-gradient(135deg, #4c0519 0%, #881337 100%)' }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center flex flex-col items-center gap-4">
          <CheckCircle className="w-16 h-16 text-green-400" />
          <p className="text-white text-2xl font-black">¡Sesión completada! 🌟</p>
          <p className="text-white/60 text-sm max-w-xs leading-relaxed">
            Tu cuerpo debería sentirse mucho más ligero. Tómate un momento antes de continuar.
          </p>
          <button onClick={async () => { await saveSession(); navigate('/relajacion') }}
            disabled={saving}
            className="px-8 py-3 rounded-2xl text-white font-bold text-sm mt-2"
            style={{ background: saved ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
            {saving ? 'Guardando...' : saved ? '✓ Guardado' : '💾 Guardar y cerrar'}
          </button>
          <button onClick={reset} className="text-white/30 text-xs hover:text-white/50">Repetir</button>
        </motion.div>
      </div>
    )
  }

  // ─── UI: running ─────────────────────────────────────────────────────────
  const totalSecs = phase === 'tense' ? group.tense : phase === 'relax' ? group.relax : 1
  const progress = phase === 'anuncio' ? 0 : ((totalSecs - counter) / totalSecs) * 100

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #1a0533 0%, #2d1b69 100%)' }}>

      <button onClick={reset}
        className="absolute top-6 left-6 px-4 py-2 rounded-xl text-white font-bold text-sm"
        style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
        ✕ Salir
      </button>

      <div className="flex gap-2 mb-8">
        {GROUPS.map((_, i) => (
          <div key={i} className="w-2 h-2 rounded-full transition-all"
            style={{
              background: i < groupIdx ? '#4ade80' : i === groupIdx ? group.color : 'rgba(255,255,255,0.15)',
              transform: i === groupIdx ? 'scale(1.5)' : 'scale(1)'
            }} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={`${groupIdx}-${phase}`}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
          className="text-center max-w-sm w-full">
          <span className="text-6xl mb-4 block">{group.emoji}</span>
          <p className="text-white/40 text-xs tracking-widest mb-1">{group.name.toUpperCase()}</p>
          <p className="text-3xl font-black mb-3" style={{ color: phase === 'tense' ? '#f87171' : phase === 'relax' ? '#4ade80' : '#c4b5fd' }}>
            {phase === 'anuncio' ? 'PREPÁRATE' : phase === 'tense' ? 'TENSA' : 'SUELTA Y RELAJA'}
          </p>
          <p className="text-white/60 text-sm leading-relaxed mb-8 px-4">
            {phase === 'anuncio' ? `Vamos con ${group.name.toLowerCase()}.` : phase === 'tense' ? group.tenseText : group.relaxText}
          </p>
          <div className="relative w-28 h-28 mx-auto mb-6">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 112 112">
              <circle cx="56" cy="56" r="48" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
              {phase !== 'anuncio' && (
                <circle cx="56" cy="56" r="48" fill="none"
                  stroke={phase === 'tense' ? '#f87171' : '#4ade80'}
                  strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 48}`}
                  strokeDashoffset={`${2 * Math.PI * 48 * (1 - progress / 100)}`}
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {phase === 'anuncio'
                ? <span className="text-2xl">{group.emoji}</span>
                : (
                  <>
                    <p className="text-white font-black text-2xl">{counter}</p>
                    <p className="text-white/40 text-xs">seg</p>
                  </>
                )}
            </div>
          </div>
          <p className="text-white/20 text-xs">Grupo {groupIdx + 1} de {GROUPS.length}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
