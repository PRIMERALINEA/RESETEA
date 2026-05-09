import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/api/supabaseClient'
import { ChevronRight, CheckCircle, Mic, Volume2 } from 'lucide-react'

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
              voice: { languageCode: 'es-ES', name: 'es-ES-Wavenet-C', ssmlGender: 'FEMALE' },
              audioConfig: { audioEncoding: 'MP3', speakingRate: 0.82, pitch: 0.0 }
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

const TECHNIQUES = [
  {
    id: '54321',
    name: 'Técnica 5-4-3-2-1',
    desc: 'Vuelve al presente usando tus sentidos',
    emoji: '🖐️',
    color: 'from-indigo-400 to-purple-500',
    intro: 'Vamos a hacer la técnica cinco, cuatro, tres, dos, uno. Te ayudará a volver al momento presente usando tus sentidos.',
    steps: [
      { n: 5, sense: 'VES',      icon: '👁️', prompt: 'Nombra 5 cosas que puedes ver ahora mismo',                           voice: 'Mira despacio a tu alrededor. Nombra en silencio cinco cosas que puedes ver.' },
      { n: 4, sense: 'TOCAS',    icon: '✋', prompt: 'Nombra 4 cosas que puedes tocar o sentir físicamente',                 voice: 'Ahora toca cuatro cosas cercanas. Nota su textura: si son suaves, frías, duras o blandas.' },
      { n: 3, sense: 'ESCUCHAS', icon: '👂', prompt: 'Nombra 3 sonidos que puedes escuchar',                                 voice: 'Escucha con atención. Identifica tres sonidos a tu alrededor. No importa lo pequeños que sean.' },
      { n: 2, sense: 'HUELES',   icon: '👃', prompt: 'Nombra 2 cosas que puedes oler (o que recuerdas oler)',                voice: 'Fíjate en los olores cercanos. Si no hay ninguno claro, imagina uno que te resulte agradable.' },
      { n: 1, sense: 'SABOREAS', icon: '👅', prompt: 'Nombra 1 cosa que puedes saborear ahora mismo',                        voice: 'Por último, pasa la lengua suavemente por tu boca. ¿Qué sabor percibes? Deja que ese sabor te ancle aquí.' },
    ]
  },
  {
    id: 'tierra',
    name: 'Conexión con el suelo',
    desc: 'Siente tu cuerpo en el espacio presente',
    emoji: '🌱',
    color: 'from-green-400 to-teal-500',
    intro: 'Vamos a hacer el ejercicio de conexión con el suelo. Te ayudará a sentir tu cuerpo presente y a reducir la sensación de agobio.',
    steps: [
      { n: 1, sense: 'POSTURA',     icon: '🧍', prompt: 'Siéntate o ponte de pie. Nota el contacto de tus pies con el suelo.',            voice: 'Siéntate o ponte de pie. Ahora nota el contacto de tus pies con el suelo. Esa sensación real te conecta con el presente.' },
      { n: 2, sense: 'RESPIRACIÓN', icon: '🌬️', prompt: 'Toma 3 respiraciones lentas y profundas. Siente el aire entrando y saliendo.',   voice: 'Toma tres respiraciones lentas y profundas. Siente el aire entrando... y saliendo. Sin prisa.' },
      { n: 3, sense: 'CUERPO',      icon: '💪', prompt: 'Tensa todos tus músculos 5 segundos. Luego suéltalos. Nota la diferencia.',      voice: 'Tensa todos tus músculos durante cinco segundos. Mantén... y ahora suelta. Nota la diferencia entre la tensión y la calma.' },
      { n: 4, sense: 'PRESENCIA',   icon: '✨', prompt: 'Di en voz alta o mentalmente: "Estoy aquí. Estoy a salvo. Esto pasará."',         voice: 'Para cerrar, dite a ti mismo, en voz alta o en silencio: Estoy aquí. Estoy a salvo. Esto pasará.' },
    ]
  },
  {
    id: 'frio',
    name: 'Anclaje del frío',
    desc: 'Resetea el sistema nervioso rápidamente',
    emoji: '❄️',
    color: 'from-cyan-400 to-blue-500',
    intro: 'Vamos a hacer el anclaje del frío. Es una técnica muy efectiva para bajar rápidamente la intensidad emocional.',
    steps: [
      { n: 1, sense: 'PREPARA',   icon: '🖐️', prompt: 'Busca agua fría (grifo, botella) o un objeto frío cercano.',                        voice: 'Primero, busca agua fría o un objeto frío cercano. Tómate un momento para encontrarlo.' },
      { n: 2, sense: 'CONTACTO',  icon: '💧', prompt: 'Pon las muñecas bajo agua fría 30 segundos, o sostén el objeto frío.',               voice: 'Pon las muñecas bajo el agua fría, o sostén el objeto frío. Mantén el contacto durante treinta segundos.' },
      { n: 3, sense: 'ATENCIÓN',  icon: '🎯', prompt: 'Concentra toda tu atención en esa sensación de frío. Solo en eso.',                  voice: 'Ahora concentra toda tu atención en esa sensación de frío. Solo en eso. Si tu mente se va, tráela de vuelta al frío.' },
      { n: 4, sense: 'RESPIRA',   icon: '🌬️', prompt: 'Respira lentamente mientras mantienes el contacto. Nota cómo baja la intensidad.',  voice: 'Respira lentamente mientras mantienes el contacto. Nota cómo la intensidad emocional va bajando con cada respiración.' },
    ]
  }
]

export default function Anclajes() {
  const [selected, setSelected]   = useState(null)
  const [conVoz, setConVoz]       = useState(false)
  const [stepIdx, setStepIdx]     = useState(0)
  const [done, setDone]           = useState(false)
  const [hablando, setHablando]   = useState(false)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const cancelRef = useRef(false)

  const technique = selected ? TECHNIQUES.find(t => t.id === selected) : null

  const iniciar = async (techId, withVoice) => {
    cancelRef.current = false
    setSelected(techId)
    setConVoz(withVoice)
    setStepIdx(0)
    setDone(false)
    setSaved(false)
    if (withVoice) {
      const tech = TECHNIQUES.find(t => t.id === techId)
      setHablando(true)
      await speak(tech.intro, cancelRef)
      if (cancelRef.current) return
      await speak(tech.steps[0].voice, cancelRef)
      setHablando(false)
    }
  }

  const siguiente = async () => {
    if (!technique) return
    const next = stepIdx + 1
    if (next < technique.steps.length) {
      setStepIdx(next)
      if (conVoz && !cancelRef.current) {
        setHablando(true)
        await speak(technique.steps[next].voice, cancelRef)
        setHablando(false)
      }
    } else {
      setDone(true)
      if (conVoz && !cancelRef.current) {
        setHablando(true)
        await speak('Muy bien. Has completado el ejercicio de anclaje. Tómate un momento para notar cómo te sientes ahora.', cancelRef)
        setHablando(false)
      }
    }
  }

  const saveSession = async () => {
    if (saving || saved || !technique) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: perfil } = await supabase.from('perfiles_alumnos').select('centro_id').eq('user_id', user.id).single()
      await supabase.from('sesiones_anclaje').insert({
        user_id: user.id,
        centro_id: perfil?.centro_id || null,
        tecnica_id: technique.id,
        tecnica_nombre: technique.name,
        pasos_completados: technique.steps.length,
        created_at: new Date().toISOString()
      })
      setSaved(true)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const reset = () => {
    cancelRef.current = true
    stopAudio()
    setSelected(null)
    setStepIdx(0)
    setDone(false)
    setSaved(false)
    setHablando(false)
  }

  // ── Vista técnica activa ── layout en columna, botón en flujo normal
  if (selected && technique) {
    const step = technique.steps[stepIdx]
    return (
      <div className="min-h-screen flex flex-col p-6 bg-gradient-to-br from-indigo-900 to-blue-900">

        {/* Barra superior en flujo normal */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <button onClick={reset}
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
          <AnimatePresence mode="wait">
            {!done ? (
              <motion.div key={stepIdx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-sm text-center">
                <div className="text-6xl mb-4">{step.icon}</div>
                <p className="text-white/40 text-xs tracking-widest mb-2">{stepIdx + 1} DE {technique.steps.length}</p>
                <p className="text-2xl font-black mb-2" style={{ color: '#93c5fd' }}>{step.sense}</p>
                <p className="text-white/70 text-base leading-relaxed mb-10">{step.prompt}</p>

                <div className="flex gap-2 justify-center mb-8">
                  {technique.steps.map((_, i) => (
                    <div key={i} className="w-2 h-2 rounded-full transition-all"
                      style={{ background: i < stepIdx ? '#4ade80' : i === stepIdx ? '#93c5fd' : 'rgba(255,255,255,0.2)' }} />
                  ))}
                </div>

                <button
                  onClick={siguiente}
                  disabled={hablando}
                  className="px-10 py-4 rounded-2xl text-white font-bold disabled:opacity-40 transition-opacity"
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                  {hablando ? '🎙️ Escucha...' : stepIdx < technique.steps.length - 1 ? 'Siguiente →' : 'Terminar'}
                </button>
              </motion.div>
            ) : (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center flex flex-col items-center gap-4">
                <CheckCircle className="w-16 h-16 text-green-400" />
                <p className="text-white text-2xl font-black">¡Anclaje completado!</p>
                <p className="text-white/50 text-sm">Tómate un momento. ¿Cómo te sientes ahora?</p>
                <button onClick={async () => { await saveSession(); reset() }}
                  disabled={saving}
                  className="px-8 py-3 rounded-2xl text-white font-bold text-sm"
                  style={{ background: saved ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
                  {saving ? 'Guardando...' : saved ? '✓ Guardado' : '💾 Guardar y cerrar'}
                </button>
                <button onClick={reset} className="text-white/30 text-xs hover:text-white/50">Repetir</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    )
  }

  // ── Lista de técnicas ──
  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <img src="https://zbusdixrxedfhbkquafh.supabase.co/storage/v1/object/public/logo/WhatsApp%20Image%202026-04-06%20at%2015.58.04.jpeg"
          alt="Resetea" className="w-10 h-10 rounded-full object-cover shadow-md flex-shrink-0" />
        <div>
          <h1 className="text-xl font-black text-blue-900">Técnicas de anclaje</h1>
          <p className="text-slate-500 text-sm">Vuelve al presente cuando te abrumas</p>
        </div>
      </div>

      <div className="bg-blue-50 rounded-2xl p-4 mb-6 border border-blue-100">
        <p className="text-blue-700 text-sm">💡 <strong>¿Cuándo usarlos?</strong> Cuando sientes que te bloqueas, tienes ansiedad antes de un examen o simplemente necesitas calmarte.</p>
      </div>

      <div className="space-y-4">
        {TECHNIQUES.map((tech, i) => (
          <motion.div key={tech.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all border border-blue-50">
              <div className="flex items-center gap-4 mb-3">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tech.color} flex items-center justify-center text-2xl flex-shrink-0`}>
                  {tech.emoji}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800">{tech.name}</p>
                  <p className="text-sm text-slate-500">{tech.desc}</p>
                  <p className="text-xs text-indigo-400 mt-1">{tech.steps.length} pasos guiados</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => iniciar(tech.id, false)}
                  className={`flex-1 py-2 rounded-xl text-white text-sm font-bold bg-gradient-to-r ${tech.color}`}>
                  Sin voz
                </button>
                <button onClick={() => iniciar(tech.id, true)}
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
