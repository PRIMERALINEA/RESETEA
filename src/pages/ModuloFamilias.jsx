import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/api/supabaseClient'
import { ChevronRight, ChevronDown, CheckCircle, Heart, BookOpen, ArrowLeft, Home } from 'lucide-react'
import { Link } from 'react-router-dom'

// ── CONTENIDO ─────────────────────────────────────────────────

const BLOQUES = [
  {
    id: 'b1',
    emoji: '🧠',
    titulo: 'Entender lo que le pasa a tu hijo/a',
    color: '#1d4ed8',
    bg: '#dbeafe',
    border: '#93c5fd',
    secciones: [
      {
        id: 'b1s1',
        titulo: '¿Qué es la ansiedad escolar y por qué no es "falta de esfuerzo"?',
        contenido: `La ansiedad escolar no es pereza ni "no le apetece estudiar". Es una respuesta de supervivencia del cerebro cuando la persona siente que algo importante está en riesgo: su aprobado, su imagen, su valor, su futuro, su aceptación.

No es una cuestión de fuerza de voluntad. Es una mezcla de pensamientos negativos ("no voy a aprobar", "todos van mejor"), sensaciones físicas muy intensas (corazón acelerado, falta de aire, manos frías) y comportamientos de evitación o bloqueo.

Un adolescente con ansiedad escolar sí se esfuerza, pero ese esfuerzo se lo lleva a mantenerse ahí, conteniendo el llanto, ocultando el miedo. Por eso desde fuera parece que "no se esfuerza", cuando en realidad se está esforzando demasiado por dentro.`,
        puntos: []
      },
      {
        id: 'b1s2',
        titulo: 'Las tres señales de que ya no es ansiedad normal',
        contenido: 'No toda ansiedad es un problema. Lo problemático es cuando:',
        puntos: [
          { icono: '🔴', titulo: 'Pasa de "antes del examen" a "siempre"', desc: 'Se manifiesta en casa, en el recreo, en la cena, antes de ponerse a hacer la tarea.' },
          { icono: '🟠', titulo: 'Le bloquea en vez de motivarlo', desc: 'En lugar de estudiar más, se queda en blanco, se aísla, o simplemente se descompone.' },
          { icono: '🟡', titulo: 'Genera síntomas físicos habituales', desc: 'Dolor de estómago recurrente, náuseas, migrañas, sudoración, llanto cuando habla del examen.' },
        ]
      },
      {
        id: 'b1s3',
        titulo: '¿Por qué no habla aunque le preguntes?',
        contenido: 'Los adolescentes con ansiedad escolar no hablan porque:',
        puntos: [
          { icono: '😶', titulo: 'Vergüenza y miedo a decepcionar', desc: 'Especialmente a los padres.' },
          { icono: '😔', titulo: 'Culpa', desc: '"No sé por qué me pasa", "debería ser capaz de controlarlo".' },
          { icono: '🤷', titulo: 'Sensación de que contar no cambiará nada', desc: 'O incluso que empeorará la presión.' },
          { icono: '❓', titulo: 'Falta de vocabulario emocional', desc: 'No es falta de sinceridad, es dificultad para traducir el malestar en palabras.' },
        ]
      },
      {
        id: 'b1s4',
        titulo: 'El error más común: las soluciones rápidas',
        contenido: 'Muchos padres intentan "resolverlo en 1 minuto" con frases como "tranquilo, no es para tanto" o "ten confianza en ti". Estas frases no son malas en sí, pero no sustituyen el acompañamiento verdadero.\n\nEl error está en saltar directamente a la solución sin antes reconocer la emoción, validar que está pasando y dar espacio para que la cuente.\n\nCuando la ansiedad no se valida, se amplía. El hijo percibe: "Ni ellos entienden lo que siento". Y la ansiedad se vuelve más fuerte porque siente que está solo.',
        puntos: []
      },
    ]
  },
  {
    id: 'b2',
    emoji: '🤝',
    titulo: 'Cómo acompañar sin sobreproteger',
    color: '#0f6b6b',
    bg: '#ccfbf1',
    border: '#5eead4',
    secciones: [
      {
        id: 'b2s1',
        titulo: 'Validar vs. amplificar — la diferencia clave',
        contenido: `Validar = reconocer que la emoción existe, sin juzgarla.
"Te noto muy nervioso hoy." / "Entiendo que te dé miedo este examen."
No es dar razón a sus catástrofes, es decir: "Te veo, lo que sientes es real para ti."

Amplificar = quedarse dando vueltas al catastrofismo sin poner límites sanos.
"Si suspendes, tu vida está hecha un desastre." / "Siempre haces lo mismo."

La clave: reconocer la emoción y luego dar un marco real.
"Te entiendo que estés muy preocupado, y al mismo tiempo confío en que puedes gestionarlo, aunque ahora no lo notes."`,
        puntos: []
      },
      {
        id: 'b2s2',
        titulo: 'Frases que ayudan vs. frases que agravan',
        contenido: '',
        tabla: {
          izq: { titulo: '✅ Frases que ayudan', color: '#16a34a', bg: '#dcfce7', items: [
            '"¿Qué te está pasando con este examen?"',
            '"Te noto muy tenso, ¿qué te gustaría hacer ahora?"',
            '"Entiendo que estés asustado."',
            '"¿Qué parte del examen te da más miedo?"',
            '"Estoy contigo aunque salga mal."',
          ]},
          der: { titulo: '❌ Frases que agravan', color: '#dc2626', bg: '#fee2e2', items: [
            '"Ya te he dicho que no pienses tanto."',
            '"Siempre te pones así, es un drama."',
            '"Solo tienes que estudiar más, punto."',
            '"Si suspendes, ya verás lo que pasa."',
            '"Con todo lo que hemos hecho por ti..."',
          ]}
        },
        puntos: []
      },
      {
        id: 'b2s3',
        titulo: 'Qué hacer cuando llega del examen destrozado',
        contenido: '',
        puntos: [
          { icono: '1️⃣', titulo: 'No inicies con soluciones', desc: 'No empieces con "¿Cómo te ha salido?" o "¿Qué preguntas entraron?"' },
          { icono: '2️⃣', titulo: 'Comienza con acogida', desc: '"Vamos a dejarlo respirar. ¿Quieres abrazo, agua o sentarte un rato?"' },
          { icono: '3️⃣', titulo: 'Abre espacio después', desc: '"Cuando quieras, me cuentas cómo ha sido, sin prisas."' },
          { icono: '4️⃣', titulo: 'Destaca lo que sí ha hecho bien', desc: '"Aunque sientas que te ha ido mal, llegaste preparado y lo entregaste. Eso ya es valiosísimo."' },
        ]
      },
      {
        id: 'b2s4',
        titulo: 'Cuándo preocuparse de verdad',
        contenido: '',
        puntos: [
          { icono: '⚠️', titulo: 'Preocúpate cuando:', desc: 'Llora casi cada noche, se duerme vomitando o llorando, evita ir al centro, se aísla o pierde el apetito/sueño de forma sostenida.' },
          { icono: '✅', titulo: 'Puedes confiar en el proceso cuando:', desc: 'Aunque nervioso, va al centro, estudia, entrega los exámenes. Una vez pasado el examen, baja la tensión y puede hablar de lo que ha pasado.' },
        ]
      },
    ]
  },
  {
    id: 'b3',
    emoji: '🌙',
    titulo: 'La noche antes del examen',
    color: '#7c3aed',
    bg: '#ede9fe',
    border: '#c4b5fd',
    secciones: [
      {
        id: 'b3s1',
        titulo: 'Qué decir (y qué no) esa noche',
        contenido: '',
        puntos: [
          { icono: '✅', titulo: '"Mañana darás lo que puedas, eso ya es suficiente."', desc: '' },
          { icono: '✅', titulo: '"No necesitas demostrar nada, ya vale la pena tal y como eres."', desc: '' },
          { icono: '✅', titulo: '"Te quiero, pase lo que pase con la nota."', desc: '' },
          { icono: '❌', titulo: '"Si suspendes, te quedas atrás."', desc: 'Este examen ya tiene suficiente peso, no añadas más.' },
          { icono: '❌', titulo: '"Con todo lo que hemos hecho por ti..."', desc: 'Genera culpa y amplifica la ansiedad.' },
          { icono: '❌', titulo: '"Solo es un examen más, no te pongas así."', desc: 'Minimiza lo que siente y lo deja más solo.' },
        ]
      },
      {
        id: 'b3s2',
        titulo: 'Cómo gestionar tu propia ansiedad para no contagiarla',
        contenido: 'La ansiedad de los padres suele ser más visible de lo que creen: paseos nerviosos, miradas severas, suspiros, preguntas constantes ("¿Has estudiado?", "¿Cuánto te falta?").',
        puntos: [
          { icono: '🔍', titulo: 'Reconoce tu propia ansiedad', desc: 'Admítete: "Estoy más preocupado de lo que creo."' },
          { icono: '🌬️', titulo: 'Regula tu cuerpo antes de hablar con él', desc: '3 respiraciones profundas, un paseo de 5 minutos, un vaso de agua.' },
          { icono: '💬', titulo: 'Habla con tu pareja o alguien antes', desc: 'Libera tu ansiedad en otro espacio, no en la conversación con tu hijo.' },
        ]
      },
      {
        id: 'b3s3',
        titulo: 'Si no duerme: qué hacer y qué no',
        contenido: '',
        puntos: [
          { icono: '✅', titulo: 'Mantén la calma', desc: '"Es normal que te cueste dormir, pero no significa que mañana no puedas rendir."' },
          { icono: '✅', titulo: 'Propón una rutina sencilla', desc: 'Luz baja, pantalla apagada, respiración guiada corta (4-4-4-4), o una conversación suave sobre algo diferente al examen.' },
          { icono: '❌', titulo: 'No fuerces el sueño', desc: '"Tienes que dormir ahora, si no mañana no vas a rendir."' },
          { icono: '❌', titulo: 'No generes más culpa', desc: '"Porque no duermes es porque no has estudiado."' },
        ]
      },
      {
        id: 'b3s4',
        titulo: 'Rutina de la mañana del examen',
        contenido: '',
        puntos: [
          { icono: '☀️', titulo: 'Despertar tranquilo', desc: 'No empezar con "¿Qué hora es?", "Te vas a llegar tarde". Usa una alarma suave y tono calmado.' },
          { icono: '🥣', titulo: 'Desayuno ligero y acogedor', desc: 'Sin charla sobre el examen al desayunar. Sin comida muy pesada.' },
          { icono: '🚪', titulo: 'Rito de salida breve', desc: '"Te quiero, confiamos en ti, te veremos después." Sin repaso intenso en el coche.' },
        ]
      },
    ]
  },
  {
    id: 'b4',
    emoji: '🏡',
    titulo: 'Hábitos en casa que reducen la ansiedad',
    color: '#16a34a',
    bg: '#dcfce7',
    border: '#86efac',
    secciones: [
      {
        id: 'b4s1',
        titulo: 'Sueño: cuánto necesita y cómo ayudar sin peleas',
        contenido: 'Un adolescente necesita entre 8 y 10 horas de sueño. El sueño es el primer antídoto contra la ansiedad escolar. Sin él, el cerebro se siente en guerra constante.',
        puntos: [
          { icono: '📵', titulo: 'Apagado de pantallas 30-60 min antes', desc: 'Acuerda una hora de desconexión, sin debatirlo cada noche.' },
          { icono: '🌙', titulo: 'Crea un ritual de sueño', desc: 'Luz baja, música suave, lectura ligera.' },
          { icono: '🗣️', titulo: 'No entres en debate moral', desc: 'Mejor: "Probemos estas dos semanas acostarnos 30 min antes y ver cómo te sientes al día siguiente."' },
        ]
      },
      {
        id: 'b4s2',
        titulo: 'Pantallas y redes: el marco que funciona',
        contenido: '',
        puntos: [
          { icono: '✅', titulo: 'Acuerdos claros y negociados', desc: '"De 20:00 a 21:30, pantalla libre; luego, solo para tarea o comunicación."' },
          { icono: '✅', titulo: 'Espacios de desconexión', desc: 'Cenar sin móvil, 15 min de paseo o no-pantalla juntos al final del día.' },
          { icono: '✅', titulo: 'Dale autonomía', desc: 'Enséñale a usar horarios de uso en el móvil para que él mismo controle.' },
          { icono: '❌', titulo: 'No funciona: el control absoluto', desc: 'Vigilar todo o quitar el móvil como castigo constante genera rebeldía y más culpa.' },
        ]
      },
      {
        id: 'b4s3',
        titulo: 'Ejercicio y alimentación: lo mínimo que marca diferencia',
        contenido: '',
        puntos: [
          { icono: '🏃', titulo: '20-30 min de movimiento diario', desc: 'Paseo, bici, baile, deporte. No tiene que ser un deportista de élite. Cada movimiento reduce tensión y mejora el sueño.' },
          { icono: '🥗', titulo: 'Comidas regulares', desc: 'Evitar grandes cantidades de azúcar o cafeína cerca de los exámenes.' },
          { icono: '❌', titulo: 'No condicionar la comida a la nota', desc: '"Si suspendes, no vamos a la pizzería." Esto mezcla el resultado académico con la satisfacción de necesidades básicas.' },
        ]
      },
      {
        id: 'b4s4',
        titulo: 'Cómo crear un ambiente que no añada presión',
        contenido: '',
        puntos: [
          { icono: '💬', titulo: 'Habla de procesos, no de resultados', desc: '"Estoy orgulloso/a de que hayas terminado el trabajo." "Lo que más me gusta es cómo estás intentando organizarte."' },
          { icono: '🚫', titulo: 'Evita hablar de resultados como identidad', desc: 'No frases como "Eres un desastre" o "Jamás vas a ser alguien". Son juicios de valor sobre la persona, no sobre el resultado.' },
          { icono: '☕', titulo: 'Crea espacios de "no examen"', desc: 'Tiempo de charla sobre planes, hobbies, cine, deporte. En esos espacios el adolescente se siente "más persona, menos nota".' },
        ]
      },
    ]
  },
  {
    id: 'b5',
    emoji: '🆘',
    titulo: 'Cuándo buscar ayuda profesional',
    color: '#dc2626',
    bg: '#fee2e2',
    border: '#fca5a5',
    secciones: [
      {
        id: 'b5s1',
        titulo: 'Señales de que ya necesita apoyo externo',
        contenido: 'La ansiedad escolar se vuelve crítica cuando:',
        puntos: [
          { icono: '🔴', titulo: 'No solo es el día del examen, sino todos los días', desc: '' },
          { icono: '🔴', titulo: 'Llora a menudo, pierde apetito o sueño de forma sostenida', desc: '' },
          { icono: '🔴', titulo: 'Evita el centro, pide quedarse en casa, se niega a hablar', desc: '' },
          { icono: '🔴', titulo: 'Síntomas físicos importantes', desc: 'Mareos, vómitos recurrentes, dolor de cabeza o estómago antes de cada examen.' },
        ]
      },
      {
        id: 'b5s2',
        titulo: 'Diferencia entre orientador, psicólogo educativo y psicólogo clínico',
        contenido: '',
        puntos: [
          { icono: '🏫', titulo: 'Orientador del centro', desc: 'Primer punto de contacto. Evalúa el impacto en el rendimiento y coordina apoyos dentro del centro.' },
          { icono: '📋', titulo: 'Psicólogo educativo', desc: 'Especialista en dificultades de aprendizaje y adaptación escolar. Trabaja en contexto educativo.' },
          { icono: '🧠', titulo: 'Psicólogo clínico', desc: 'Intervención cuando la ansiedad ya afecta la vida diaria de forma significativa. Trabaja con técnicas de TCC, relajación y reestructuración cognitiva.' },
        ]
      },
      {
        id: 'b5s3',
        titulo: 'Cómo hablar con tu hijo de ir al psicólogo',
        contenido: '',
        puntos: [
          { icono: '✅', titulo: 'Normaliza la ayuda', desc: '"Igual que vamos al médico cuando el cuerpo no funciona bien, también se puede pedir ayuda cuando la cabeza necesita apoyo."' },
          { icono: '✅', titulo: 'No uses el psicólogo como amenaza', desc: 'No: "Como no cambias, te llevo al psicólogo." Eso convierte la ayuda en castigo.' },
          { icono: '✅', titulo: 'Involúcralo en la decisión', desc: '"¿Te gustaría hablar con alguien que ayuda a gestionar estos nervios? Tú decides."' },
          { icono: '✅', titulo: 'Acompáñalo el primer día', desc: 'La primera sesión genera mucha ansiedad anticipatoria. Tu presencia en la sala de espera ayuda.' },
        ]
      },
    ]
  },
]

// ── COMPONENTE SECCIÓN ────────────────────────────────────────
function Seccion({ sec, color, bg, border }) {
  const [abierta, setAbierta] = useState(false)

  return (
    <div className="mb-2">
      <button onClick={() => setAbierta(!abierta)}
        className="w-full text-left rounded-2xl border-2 p-4 transition-all"
        style={{ borderColor: abierta ? color : '#e2e8f0', background: abierta ? bg : 'white' }}>
        <div className="flex items-start gap-3">
          <span className="font-bold text-lg flex-shrink-0 mt-0.5"
            style={{ color: abierta ? color : '#64748b' }}>
            {abierta ? '−' : '+'}
          </span>
          <p className="font-bold text-sm text-left" style={{ color: abierta ? color : '#334155' }}>
            {sec.titulo}
          </p>
        </div>
      </button>

      <AnimatePresence>
        {abierta && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-2 rounded-b-2xl border border-t-0 p-4 space-y-3"
            style={{ borderColor: border, background: 'white' }}>

            {/* Tabla comparativa */}
            {sec.tabla && (
              <div className="grid grid-cols-2 gap-2">
                {[sec.tabla.izq, sec.tabla.der].map(col => (
                  <div key={col.titulo} className="rounded-xl p-3" style={{ background: col.bg }}>
                    <p className="font-bold text-xs mb-2" style={{ color: col.color }}>{col.titulo}</p>
                    {col.items.map((item, i) => (
                      <p key={i} className="text-xs italic mb-1.5" style={{ color: col.color }}>
                        {item}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Contenido principal */}
            {sec.contenido && (
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{sec.contenido}</p>
            )}

            {/* Puntos */}
            {sec.puntos && sec.puntos.length > 0 && (
              <div className="space-y-2">
                {sec.puntos.map((punto, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl"
                    style={{ background: bg }}>
                    <span className="text-xl flex-shrink-0">{punto.icono}</span>
                    <div>
                      {punto.titulo && (
                        <p className="text-sm font-bold" style={{ color }}>{punto.titulo}</p>
                      )}
                      {punto.desc && (
                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{punto.desc}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── COMPONENTE BLOQUE ─────────────────────────────────────────
function Bloque({ bloque, completados, onCompletar }) {
  const [expandido, setExpandido] = useState(false)
  const completado = completados.includes(bloque.id)

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border-2 overflow-hidden shadow-sm mb-4 transition-all"
      style={{ borderColor: completado ? bloque.color : '#e2e8f0' }}>

      {/* Cabecera del bloque */}
      <button onClick={() => setExpandido(!expandido)} className="w-full text-left">
        <div className="flex items-center gap-3 p-4"
          style={{ background: expandido ? bloque.bg : 'white' }}>
          <span className="text-3xl">{bloque.emoji}</span>
          <div className="flex-1">
            <p className="font-black text-slate-800 text-sm leading-tight">{bloque.titulo}</p>
            <p className="text-xs mt-0.5" style={{ color: bloque.color }}>
              {bloque.secciones.length} apartados
            </p>
          </div>
          {completado ? (
            <CheckCircle className="w-6 h-6 flex-shrink-0" style={{ color: bloque.color }} />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0"
              style={{ transform: expandido ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          )}
        </div>
      </button>

      {/* Contenido expandible */}
      <AnimatePresence>
        {expandido && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} className="px-4 pb-4 pt-2">

            <div className="space-y-1">
              {bloque.secciones.map(sec => (
                <Seccion key={sec.id} sec={sec}
                  color={bloque.color} bg={bloque.bg} border={bloque.border} />
              ))}
            </div>

            {!completado && (
              <button onClick={() => onCompletar(bloque.id)}
                className="mt-4 w-full py-3 rounded-2xl text-white font-bold flex items-center justify-center gap-2"
                style={{ background: `linear-gradient(135deg, ${bloque.color}, ${bloque.color}cc)` }}>
                <CheckCircle className="w-4 h-4" /> Marcar como leído
              </button>
            )}
            {completado && (
              <div className="mt-4 flex items-center justify-center gap-2 py-3 rounded-2xl"
                style={{ background: bloque.bg }}>
                <CheckCircle className="w-4 h-4" style={{ color: bloque.color }} />
                <p className="text-sm font-bold" style={{ color: bloque.color }}>Leído ✓</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────
export default function ModuloFamilias() {
  const [completados, setCompletados] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargar()
  }, [])

  const cargar = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('modulo_familias_progreso')
        .select('bloque_id').eq('user_id', user.id)
      if (data) setCompletados(data.map(r => r.bloque_id))
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const completar = async (bloqueId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('modulo_familias_progreso').upsert(
        { user_id: user.id, bloque_id: bloqueId },
        { onConflict: 'user_id,bloque_id' }
      )
      setCompletados(prev => [...prev, bloqueId])
    } catch (e) { console.error(e) }
  }

  const pct = Math.round((completados.length / BLOQUES.length) * 100)

  return (
    <div className="max-w-lg mx-auto px-4 py-6">

      {/* Header */}
      <div className="rounded-3xl p-5 mb-5 text-white"
        style={{ background: 'linear-gradient(135deg, #0d3d3d 0%, #1d4ed8 100%)' }}>
        <div className="flex items-center gap-3 mb-2">
          <Heart className="w-8 h-8 text-blue-200" />
          <div>
            <h1 className="text-2xl font-black">Para familias</h1>
            <p className="text-blue-200 text-sm">Acompañar la ansiedad escolar de tu hijo/a</p>
          </div>
        </div>
        <p className="text-white/70 text-xs leading-relaxed mt-2">
          Guía clínica en 5 bloques. Sin tecnicismos. Directa y práctica.
        </p>

        {/* Progreso */}
        {completados.length > 0 && (
          <div className="mt-4">
            <div className="flex justify-between mb-1">
              <p className="text-blue-200 text-xs">Progreso</p>
              <p className="text-white font-bold text-xs">{completados.length}/{BLOQUES.length} bloques</p>
            </div>
            <div className="h-2 rounded-full bg-white/20 overflow-hidden">
              <motion.div className="h-full rounded-full bg-blue-300"
                animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }} />
            </div>
          </div>
        )}
      </div>

      {/* Intro */}
      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 mb-5">
        <p className="text-blue-800 font-bold text-sm mb-1">¿Para quién es esta guía?</p>
        <p className="text-blue-700 text-sm leading-relaxed">
          Para madres, padres y tutores de estudiantes de Secundaria y Bachillerato que quieren entender qué les pasa a sus hijos con la ansiedad escolar y cómo acompañarles sin empeorar las cosas.
        </p>
      </div>

      {/* Bloques */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div>
          {BLOQUES.map(bloque => (
            <Bloque key={bloque.id} bloque={bloque}
              completados={completados} onCompletar={completar} />
          ))}
        </div>
      )}

      {/* Enlace a Resetea para el alumno */}
      {completados.length === BLOQUES.length && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-teal-50 rounded-2xl p-5 border border-teal-200 text-center mt-4">
          <CheckCircle className="w-12 h-12 text-teal-500 mx-auto mb-3" />
          <p className="font-black text-teal-800 text-lg mb-2">¡Guía completa!</p>
          <p className="text-teal-600 text-sm leading-relaxed mb-4">
            Ahora que conoces el marco, puedes ver el resumen emocional que tu hijo/a quizás quiera compartir contigo desde su perfil de Resetea.
          </p>
          <Link to="/">
            <div className="py-3 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>
              <Home className="w-4 h-4" /> Volver al inicio
            </div>
          </Link>
        </motion.div>
      )}

      {/* Footer */}
      <p className="text-center text-xs text-slate-400 mt-6 leading-relaxed">
        Contenido elaborado por Patricia Iso, psicóloga clínica.<br />
        Resetea · Tu espacio de calma y conexión™
      </p>
    </div>
  )
}
