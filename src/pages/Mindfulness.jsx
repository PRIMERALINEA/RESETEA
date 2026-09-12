import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/api/supabaseClient'
import { useAuth } from '@/lib/AuthContext'
import { Save, Mic, Music, Volume2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// ─── VOZ ─────────────────────────────────────────────────────────────────
// Mismo motor endurecido que el resto de ejercicios de Resetea Académica:
// elemento de audio único reutilizado (desbloqueo para iOS/WebKit), circuito
// de corte tras fallos consecutivos de Google TTS, y margen entre cancel()+speak().
const GOOGLE_TTS_KEY = import.meta.env.VITE_GOOGLE_TTS_KEY
const audioCache = {}
let activeAudio = null
let ttsAudioEl = null
let ttsFailCount = 0
const TTS_FAIL_LIMIT = 2

// Debe llamarse de forma SÍNCRONA dentro del onClick que inicia el ejercicio,
// antes de cualquier await — si no, iOS/WebKit puede bloquear en silencio el
// audio disparado después por temporizador.
function unlockAudio() {
  if (!ttsAudioEl) ttsAudioEl = new Audio()
  ttsAudioEl.play().catch(() => {})
  ttsAudioEl.pause()
  if (window.speechSynthesis) {
    const u = new SpeechSynthesisUtterance('')
    u.volume = 0
    window.speechSynthesis.speak(u)
  }
}

function stopAudio() {
  if (activeAudio) { activeAudio.pause(); activeAudio.currentTime = 0; activeAudio = null }
  if (window.speechSynthesis?.speaking) window.speechSynthesis.cancel()
}

function speakNow(text, cancelRef) {
  if (!window.speechSynthesis) return Promise.resolve()
  return new Promise(resolve => {
    if (cancelRef?.current) { resolve(); return }
    const doSpeak = () => {
      if (cancelRef?.current) { resolve(); return }
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'es-ES'; u.rate = 0.78; u.pitch = 1.05; u.volume = 1.0
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
        if (!ttsAudioEl) ttsAudioEl = new Audio()
        ttsAudioEl.src = audioCache[key]
        ttsAudioEl.volume = 0.95
        activeAudio = ttsAudioEl
        ttsAudioEl.onended = () => { activeAudio = null; resolve() }
        ttsAudioEl.onerror = () => { activeAudio = null; reject(new Error('Google TTS: audio.play() falló')) }
        ttsAudioEl.play().catch(reject)
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

function formatMMSS(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ─── GUION (idéntico al de Resetea Profesional, según lo acordado) ─────────
const MINDFULNESS_TOTAL = 240 // segundos = 4 min
const MINDFULNESS_SCRIPT = [
  { atSecond: 0,   texto: 'Siéntate cómodo. Cierra los ojos o baja la mirada suavemente.' },
  { atSecond: 15,  texto: 'Lleva tu atención a la respiración. Nota cómo el aire entra y sale, sin cambiar nada.' },
  { atSecond: 45,  texto: 'Si notas que tu mente se ha ido a otro pensamiento, no pasa nada. Con suavidad, vuelve a la respiración.' },
  { atSecond: 80,  texto: 'Siente el contacto de tu cuerpo con la silla o el suelo. Nota el peso, el apoyo.' },
  { atSecond: 115, texto: 'Vuelve a la respiración. Inhala... y exhala, sin forzar nada.' },
  { atSecond: 150, texto: 'Si aparecen pensamientos sobre los estudios o pendientes, obsérvalos pasar como nubes, y vuelve aquí.' },
  { atSecond: 185, texto: 'Quedan los últimos instantes. Sigue con tu respiración, presente, sin prisa.' },
  { atSecond: 215, texto: 'Vamos a terminar. Mueve suavemente los dedos de las manos y los pies.' },
  { atSecond: 230, texto: 'Cuando quieras, abre los ojos. Lleva contigo esta sensación de calma.' },
]

// Sube este archivo a /public/audio/ del proyecto de Resetea Académica.
const MUSIC_URL = '/audio/mindfulness-relax.mp3'
const MUSIC_VOLUME_NORMAL = 0.28
const MUSIC_VOLUME_DUCKED = 0.08

export default function Mindfulness() {
  const navigate = useNavigate()
  const { isDocente } = useAuth()
  const [state, setState]     = useState('idle') // idle | running | done
  const [elapsed, setElapsed] = useState(0)
  const [modo, setModo]       = useState('voz') // 'voz' | 'musica-voz' | 'musica-sola'
  const [textoActual, setTextoActual] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  const cancelRef  = useRef(false)
  const spokenRef  = useRef(new Set())
  const tickRef    = useRef(null)
  const musicRef   = useRef(null)
  const startTimeRef = useRef(null)

  const getMusic = () => {
    if (!musicRef.current) {
      musicRef.current = new Audio(MUSIC_URL)
      musicRef.current.loop = true
    }
    return musicRef.current
  }
  const playMusic = () => {
    const audio = getMusic()
    audio.volume = MUSIC_VOLUME_NORMAL
    audio.currentTime = 0
    audio.play().catch(() => {})
  }
  const duckMusic = (down) => {
    if (musicRef.current) musicRef.current.volume = down ? MUSIC_VOLUME_DUCKED : MUSIC_VOLUME_NORMAL
  }
  const stopMusic = () => {
    if (musicRef.current) { musicRef.current.pause(); musicRef.current.currentTime = 0 }
  }
  const speakDucked = async (texto) => {
    duckMusic(true)
    await speak(texto, cancelRef)
    duckMusic(false)
  }

  const start = (m) => {
    unlockAudio()
    setModo(m)
    cancelRef.current = false
    spokenRef.current = new Set()
    setElapsed(0); setTextoActual(''); setSaved(false)
    setState('running')
    startTimeRef.current = Date.now()

    const conVoz = m === 'voz' || m === 'musica-voz'
    const conMusica = m === 'musica-voz' || m === 'musica-sola'

    if (conMusica) playMusic()

    if (conVoz) {
      const primero = MINDFULNESS_SCRIPT[0].texto
      setTextoActual(primero)
      spokenRef.current.add(0)
      if (conMusica) speakDucked(primero)
      else speak(primero, cancelRef)
    }

    tickRef.current = setInterval(() => {
      if (cancelRef.current) { clearInterval(tickRef.current); return }
      setElapsed(prev => {
        const next = prev + 1
        if (conVoz) {
          const cue = MINDFULNESS_SCRIPT.find(c => c.atSecond === next)
          if (cue && !spokenRef.current.has(cue.atSecond)) {
            spokenRef.current.add(cue.atSecond)
            setTextoActual(cue.texto)
            if (conMusica) speakDucked(cue.texto)
            else speak(cue.texto, cancelRef)
          }
        }
        if (next >= MINDFULNESS_TOTAL) {
          clearInterval(tickRef.current)
          setState('done')
          return MINDFULNESS_TOTAL
        }
        return next
      })
    }, 1000)
  }

  const stop = () => {
    cancelRef.current = true
    if (tickRef.current) clearInterval(tickRef.current)
    stopAudio()
    stopMusic()
    setState('idle'); setElapsed(0); setTextoActual('')
  }

  const saveSession = async () => {
    if (saving || saved) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const tablaPerfil = isDocente ? 'perfiles_docentes' : 'perfiles_alumnos'
      const { data: perfil } = await supabase
        .from(tablaPerfil)
        .select('centro_id')
        .eq('user_id', user.id)
        .single()
      const duracion = startTimeRef.current
        ? Math.round((Date.now() - startTimeRef.current) / 1000)
        : MINDFULNESS_TOTAL
      // NOTA: la tabla 'sesiones_mindfulness' probablemente no existe todavía
      // en el Supabase de Academica — hay que crearla (mismas columnas que
      // sesiones_respiracion) antes de que este insert funcione en producción.
      await supabase.from('sesiones_mindfulness').insert({
        user_id: user.id,
        centro_id: perfil?.centro_id || null,
        modo,
        duracion_segundos: duracion,
        created_at: new Date().toISOString()
      })
      setSaved(true)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  useEffect(() => () => {
    cancelRef.current = true
    if (tickRef.current) clearInterval(tickRef.current)
    stopAudio(); stopMusic()
  }, [])

  const remaining = MINDFULNESS_TOTAL - elapsed
  const progress = (elapsed / MINDFULNESS_TOTAL) * 100

  if (state === 'running' || state === 'done') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #14532d 100%)' }}>

        {state === 'running' && (
          <button onClick={stop} className="absolute top-6 left-6 text-white/40 hover:text-white text-sm">
            ✕ Detener
          </button>
        )}

        {state === 'running' && (
          <>
            <div className="relative w-40 h-40 mb-8">
              <svg className="w-40 h-40 -rotate-90" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="68" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                <circle cx="80" cy="80" r="68" fill="none"
                  stroke="#25A05C" strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 68}`}
                  strokeDashoffset={`${2 * Math.PI * 68 * (1 - progress / 100)}`}
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-white font-black text-3xl">{formatMMSS(remaining)}</p>
                <p className="text-white/30 text-xs tracking-widest mt-1">RESTANTE</p>
              </div>
            </div>

            {modo !== 'musica-sola' && textoActual && (
              <div className="max-w-xs text-center bg-white/5 rounded-2xl px-5 py-4">
                <p className="text-white/70 text-sm italic leading-relaxed">"{textoActual}"</p>
              </div>
            )}
            {modo === 'musica-sola' && (
              <p className="text-white/30 text-sm">🎵 Respira a tu propio ritmo</p>
            )}
          </>
        )}

        <AnimatePresence>
          {state === 'done' && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 text-center">
              <p className="text-5xl mb-2">🌟</p>
              <p className="text-white text-2xl font-black">Sesión completada</p>
              <p className="text-white/50 text-sm max-w-xs">4 minutos de presencia plena. Tómate un momento antes de continuar.</p>
              <button onClick={async () => { await saveSession(); setState('idle'); setElapsed(0); setTextoActual('') }}
                disabled={saving}
                className="px-8 py-3 rounded-2xl text-white font-bold text-sm flex items-center gap-2"
                style={{ background: saved ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
                <Save className="w-4 h-4" />
                {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar y cerrar'}
              </button>
              <button onClick={() => { setState('idle'); setElapsed(0); setTextoActual('') }}
                className="text-white/30 text-xs hover:text-white/50">Repetir</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // state === 'idle'
  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <img src="https://zbusdixrxedfhbkquafh.supabase.co/storage/v1/object/public/logo/WhatsApp%20Image%202026-04-06%20at%2015.58.04.jpeg"
          alt="Resetea" className="w-10 h-10 rounded-full object-cover shadow-md flex-shrink-0" />
        <div>
          <h1 className="text-xl font-black text-blue-900">Mindfulness breve</h1>
          <p className="text-slate-500 text-sm">4 minutos de presencia plena</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-50 mb-6 text-center">
        <div className="text-5xl mb-3">🌿</div>
        <p className="text-slate-600 text-sm leading-relaxed">Una pausa corta para volver al presente entre estudio y estudio. Elige cómo quieres hacerla.</p>
      </div>

      <div className="flex flex-col gap-3">
        <button onClick={() => start('voz')}
          className="w-full py-4 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #25A05C, #1E7040)' }}>
          <Mic className="w-4 h-4" /> Solo voz guiada
        </button>
        <button onClick={() => start('musica-voz')}
          className="w-full py-4 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #1E7040, #14532d)' }}>
          <Music className="w-4 h-4" /> Música + voz
        </button>
        <button onClick={() => start('musica-sola')}
          className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 bg-slate-100 text-slate-600">
          <Volume2 className="w-4 h-4" /> Solo música, sin voz
        </button>
      </div>

      <button onClick={() => navigate(-1)} className="w-full text-center text-slate-400 text-sm mt-6">← Volver</button>
    </div>
  )
}
