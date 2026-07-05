import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/api/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, X, ShieldCheck } from 'lucide-react'

const LOGO_URL = 'https://zbusdixrxedfhbkquafh.supabase.co/storage/v1/object/public/logo/WhatsApp%20Image%202026-04-06%20at%2015.58.04.jpeg'

const VERSION_POLITICA = 'v2-2026-06'

const CURSOS = [
  '1º Primaria', '2º Primaria', '3º Primaria',
  '4º Primaria', '5º Primaria', '6º Primaria',
  '1º ESO', '2º ESO', '3º ESO', '4º ESO',
  '1º Bachillerato', '2º Bachillerato',
  'FP Básica', '1º FP Medio', '2º FP Medio',
  '1º FP Superior', '2º FP Superior',
]

const POLITICA_TEXTO = `
POLÍTICA DE PROTECCIÓN DE DATOS — RESETEA ACADÉMICA

[BORRADOR PENDIENTE DE REVISIÓN POR ASESOR LEGAL]

Responsable del tratamiento:
Patricia Iso — Contacto: reseteaacademica@gmail.com

Quién usa la aplicación:
Resetea Académica está dirigida a personas menores de edad (alumnado).
La cuenta pertenece al menor, y su uso requiere la autorización de quien
ostente la patria potestad o tutela.

Datos que se tratan:
• Datos identificativos del menor (email, nombre, fecha de nacimiento, curso).
• Datos del adulto responsable (nombre, DNI/NIE, relación con el menor).
• Datos relativos al BIENESTAR EMOCIONAL Y LA SALUD del menor: resultados de
  test de estrés y ansiedad, entradas de diario y registros de uso de los
  módulos de la aplicación. Estos son datos de categoría especial (salud).

Finalidad:
Prestar el servicio de acompañamiento y regulación emocional de la aplicación,
y gestionar la cuenta y la suscripción.

Base jurídica:
• Consentimiento de quien ostenta la patria potestad o tutela
  (art. 8 RGPD y art. 7 LOPDGDD), por tratarse de un menor.
• Consentimiento explícito para el tratamiento de datos de salud
  (art. 9.2.a RGPD).

Destinatarios / Encargados del tratamiento:
Proveedores tecnológicos que prestan la infraestructura (Supabase, Vercel),
que actúan como encargados del tratamiento. No se ceden datos a terceros
salvo obligación legal.

Conservación:
Mientras la cuenta esté activa. Tras la baja, los datos se bloquearán y se
suprimirán una vez transcurridos los plazos legales aplicables.

Derechos:
Acceso, rectificación, supresión, oposición, limitación y portabilidad, así
como la retirada del consentimiento en cualquier momento, escribiendo a
reseteaacademica@gmail.com. Puede presentarse reclamación ante la Agencia
Española de Protección de Datos (AEPD).

Seguridad:
Los datos se almacenan en servidores europeos con cifrado en tránsito y en reposo.

Última actualización: junio 2026
`

export default function RegistroIndividual() {
  // Cuenta del menor
  const [email, setEmail]                     = useState('')
  const [password, setPassword]               = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [curso, setCurso]                     = useState('')
  const [menorNombre, setMenorNombre]         = useState('')
  const [menorFechaNac, setMenorFechaNac]     = useState('')

  // Datos del adulto responsable
  const [adultoNombre, setAdultoNombre]       = useState('')
  const [adultoDni, setAdultoDni]             = useState('')
  const [relacion, setRelacion]               = useState('padre')

  // Consentimientos
  const [aceptaPrivacidad, setAceptaPrivacidad]       = useState(false)
  const [autorizaTratamiento, setAutorizaTratamiento] = useState(false)
  const [consienteSalud, setConsienteSalud]           = useState(false)

  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [showPolitica, setShowPolitica] = useState(false)
  const navigate = useNavigate()

  const handleRegistro = async () => {
    setLoading(true); setError('')

    // Validaciones cuenta del menor
    if (!email || !password || !curso || !menorNombre || !menorFechaNac) {
      setError('Completa todos los datos del menor'); setLoading(false); return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres'); setLoading(false); return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden'); setLoading(false); return
    }
    // Validaciones adulto
    if (!adultoNombre || !adultoDni || !relacion) {
      setError('Completa los datos del adulto responsable'); setLoading(false); return
    }
    // Validaciones consentimientos
    if (!aceptaPrivacidad || !autorizaTratamiento || !consienteSalud) {
      setError('El adulto debe marcar las tres autorizaciones'); setLoading(false); return
    }

    try {
      // 1. Crear cuenta en Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
      if (signUpError) throw signUpError

      // 2. Iniciar sesión inmediatamente (sin esperar confirmación de email)
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw signInError

      const userId = signInData?.user?.id || data?.user?.id
      if (!userId) throw new Error('No se pudo crear la cuenta.')

      // 3. Crear perfil individual (sin centro_id)
      const { error: perfilError } = await supabase.from('perfiles_alumnos').upsert({
        user_id: userId,
        curso,
        rol: 'alumno',
        centro_id: null,
        subscription_status: 'free',
        subscription_type: 'individual',
        acepta_politica: true,
        fecha_aceptacion: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      if (perfilError) throw perfilError

      // 4. Guardar el consentimiento parental (prueba documental)
      const { error: consentError } = await supabase.from('consentimientos').insert({
        user_id: userId,
        adulto_nombre: adultoNombre,
        adulto_dni: adultoDni,
        relacion,
        menor_nombre: menorNombre,
        menor_fecha_nac: menorFechaNac,
        acepta_privacidad: aceptaPrivacidad,
        autoriza_tratamiento: autorizaTratamiento,
        consiente_salud: consienteSalud,
        version_politica: VERSION_POLITICA,
      })
      if (consentError) throw consentError

      // 5. Redirigir al pago
      navigate('/acceso-individual')

    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const canSubmit =
    email && password && confirmPassword && curso && menorNombre && menorFechaNac &&
    adultoNombre && adultoDni && relacion &&
    aceptaPrivacidad && autorizaTratamiento && consienteSalud

  const inputCls = 'w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100'

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0d3d3d 0%, #0f6b6b 50%, #1a9090 100%)' }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src={LOGO_URL} alt="Resetea"
              className="w-24 h-24 rounded-full object-cover shadow-2xl border-4 border-white/20" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Resetea</h1>
          <p className="text-teal-200 text-sm mt-1">Acceso individual · 4,99 € al mes</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-4">
          <h2 className="text-lg font-bold mb-2" style={{ color: '#0d3d3d' }}>Crear cuenta individual</h2>
          <p className="text-xs text-slate-500 -mt-2">La cuenta es del menor. El adulto responsable debe completar sus datos y autorizar el registro.</p>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}

          {/* ── Datos del menor ── */}
          <p className="text-sm font-bold pt-2" style={{ color: '#0d3d3d' }}>Datos del menor</p>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Nombre del menor</label>
            <input type="text" value={menorNombre} onChange={e => setMenorNombre(e.target.value)}
              placeholder="Nombre y apellidos" className={inputCls} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Fecha de nacimiento</label>
            <input type="date" value={menorFechaNac} onChange={e => setMenorFechaNac(e.target.value)} className={inputCls} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Email (cuenta del menor)</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com" className={inputCls} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Curso</label>
            <div className="relative">
              <select value={curso} onChange={e => setCurso(e.target.value)}
                className={inputCls + ' appearance-none bg-white pr-10'}
                style={{ color: curso ? '#1e293b' : '#94a3b8' }}>
                <option value="" disabled>Selecciona tu curso</option>
                {CURSOS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres" className={inputCls} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Confirmar contraseña</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repite tu contraseña" className={inputCls} />
          </div>

          {/* ── Datos del adulto responsable ── */}
          <p className="text-sm font-bold pt-3" style={{ color: '#0d3d3d' }}>Adulto responsable</p>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Nombre y apellidos del adulto</label>
            <input type="text" value={adultoNombre} onChange={e => setAdultoNombre(e.target.value)}
              placeholder="Nombre del padre, madre o tutor/a" className={inputCls} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">DNI / NIE del adulto</label>
            <input type="text" value={adultoDni} onChange={e => setAdultoDni(e.target.value)}
              placeholder="00000000X" className={inputCls} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Relación con el menor</label>
            <div className="relative">
              <select value={relacion} onChange={e => setRelacion(e.target.value)}
                className={inputCls + ' appearance-none bg-white pr-10'}>
                <option value="padre">Padre</option>
                <option value="madre">Madre</option>
                <option value="tutor">Tutor/a legal</option>
              </select>
              <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* ── Consentimientos (los marca el adulto) ── */}
          <p className="text-sm font-bold pt-3" style={{ color: '#0d3d3d' }}>Autorizaciones del adulto</p>

          <div className="flex items-start gap-3 bg-slate-50 rounded-xl p-3">
            <input type="checkbox" checked={aceptaPrivacidad}
              onChange={e => setAceptaPrivacidad(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-teal-600 cursor-pointer flex-shrink-0" />
            <label className="text-xs text-slate-600 leading-relaxed">
              He leído y acepto la{' '}
              <button type="button" onClick={() => setShowPolitica(true)}
                className="text-teal-600 underline font-medium hover:text-teal-800">
                Política de Privacidad y los Términos
              </button>.
            </label>
          </div>

          <div className="flex items-start gap-3 bg-slate-50 rounded-xl p-3">
            <input type="checkbox" checked={autorizaTratamiento}
              onChange={e => setAutorizaTratamiento(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-teal-600 cursor-pointer flex-shrink-0" />
            <label className="text-xs text-slate-600 leading-relaxed">
              Autorizo, como titular de la patria potestad o tutela, el tratamiento de los datos del menor.
            </label>
          </div>

          <div className="flex items-start gap-3 bg-slate-50 rounded-xl p-3">
            <input type="checkbox" checked={consienteSalud}
              onChange={e => setConsienteSalud(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-teal-600 cursor-pointer flex-shrink-0" />
            <label className="text-xs text-slate-600 leading-relaxed">
              Consiento expresamente el tratamiento de sus datos de salud y bienestar emocional.
            </label>
          </div>

          <button onClick={handleRegistro} disabled={loading || !canSubmit}
            className="w-full py-3 rounded-xl text-white font-bold disabled:opacity-50 mt-2"
            style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta y continuar al pago'}
          </button>

          <button onClick={() => navigate('/login')}
            className="w-full text-sm text-teal-600 hover:text-teal-800 transition-colors pt-1">
            ¿Ya tienes cuenta? Entra aquí
          </button>

          <p className="text-center text-xs text-slate-400 pt-2 border-t border-slate-100">
            © 2026 Patricia Iso · Todos los derechos reservados
          </p>
        </div>

        <p className="text-center text-xs text-teal-200/60 mt-6">Tus datos son privados y seguros 🔒</p>
      </motion.div>

      {/* Modal Política */}
      <AnimatePresence>
        {showPolitica && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setShowPolitica(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-teal-600" />
                  <h3 className="font-bold text-slate-800">Política de Protección de Datos</h3>
                </div>
                <button onClick={() => setShowPolitica(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
              <div className="overflow-y-auto p-6 flex-1">
                <pre className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed font-sans">{POLITICA_TEXTO}</pre>
              </div>
              <div className="p-6 border-t border-slate-100">
                <button onClick={() => { setAceptaPrivacidad(true); setShowPolitica(false) }}
                  className="w-full py-3 rounded-xl text-white font-bold"
                  style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>
                  Entendido, acepto la política
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
