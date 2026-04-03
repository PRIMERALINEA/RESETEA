// src/components/RgpdBanner.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Banner de consentimiento RGPD y pantalla de política de privacidad
// Se muestra la primera vez que el usuario entra en la app
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, X, ChevronDown, ChevronUp, Check } from 'lucide-react'

const CONSENT_KEY = 'resetea_rgpd_consent_v1'

export function useRgpdConsent() {
  const [consentDado, setConsentDado] = useState(true) // empieza en true para no parpadear

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY)
    setConsentDado(!!consent)
  }, [])

  const darConsent = () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({
      fecha: new Date().toISOString(),
      version: '1.0'
    }))
    setConsentDado(true)
  }

  return { consentDado, darConsent }
}

export function RgpdBanner({ onAceptar }) {
  const [detalle, setDetalle] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] flex items-end justify-center p-4 pb-6"
      style={{ background: 'rgba(0,0,0,0.7)' }}>

      <motion.div
        initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="p-5 pb-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: '#0d3d3d' }}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-black text-slate-800">Privacidad y datos</p>
              <p className="text-slate-500 text-xs">Resetea · Tu espacio de calma</p>
            </div>
          </div>

          <p className="text-slate-600 text-sm leading-relaxed mb-3">
            Resetea almacena tus datos de bienestar emocional para ofrecerte las herramientas de la app. Tus datos son <strong>privados, cifrados y nunca se comparten con terceros</strong>.
          </p>

          {/* Toggle detalle */}
          <button onClick={() => setDetalle(!detalle)}
            className="flex items-center gap-1.5 text-teal-600 text-xs font-bold mb-3">
            {detalle ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {detalle ? 'Ocultar detalles' : 'Ver qué datos guardamos'}
          </button>

          <AnimatePresence>
            {detalle && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-slate-50 rounded-2xl p-4 mb-3 space-y-2 overflow-hidden">
                {[
                  { icono: '✅', texto: 'Tu email (solo para identificarte, dominio @svalero.com)' },
                  { icono: '✅', texto: 'Tu curso (para estadísticas anónimas de grupo)' },
                  { icono: '✅', texto: 'Tus sesiones de ejercicios (cuántas veces los usas)' },
                  { icono: '✅', texto: 'Tu diario emocional (solo tú puedes verlo)' },
                  { icono: '✅', texto: 'Tus evaluaciones de bienestar' },
                  { icono: '❌', texto: 'Nunca: datos de geolocalización' },
                  { icono: '❌', texto: 'Nunca: datos de navegación o publicidad' },
                  { icono: '❌', texto: 'Nunca: ventas de datos a terceros' },
                  { icono: '🔒', texto: 'Servidores en la UE (Supabase, Irlanda)' },
                  { icono: '🔒', texto: 'Puedes pedir la eliminación de tus datos en cualquier momento' },
                ].map(({ icono, texto }, i) => (
                  <p key={i} className="text-xs text-slate-600 flex items-start gap-2">
                    <span className="flex-shrink-0">{icono}</span> {texto}
                  </p>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Botones */}
        <div className="p-5 pt-2">
          <button onClick={onAceptar}
            className="w-full py-3 rounded-2xl text-white font-bold flex items-center justify-center gap-2 mb-2"
            style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>
            <Check className="w-4 h-4" /> Entendido y acepto
          </button>
          <p className="text-center text-xs text-slate-400">
            Al continuar aceptas nuestra{' '}
            <span className="text-teal-600 font-medium cursor-pointer underline">política de privacidad</span>
            {' '}y el tratamiento de tus datos conforme al RGPD.
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Política de privacidad completa (página) ──────────────────
export function PoliticaPrivacidad() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-8 h-8 text-teal-600" />
        <h1 className="text-2xl font-black text-slate-800">Política de Privacidad</h1>
      </div>

      <p className="text-slate-500 text-sm mb-6">Última actualización: abril 2025 · Versión 1.0</p>

      {[
        {
          titulo: '1. Responsable del tratamiento',
          contenido: `Patricia Iso (psicóloga clínica) es la responsable del tratamiento de los datos personales recogidos a través de la aplicación Resetea.
          
Contacto: piso@svalero.com`
        },
        {
          titulo: '2. Datos que recogemos',
          contenido: `• Dirección de email (identificación, dominio @svalero.com)
• Curso académico (estadísticas anónimas de grupo)
• Registros de uso de herramientas (número de sesiones, duración)
• Diario emocional (solo accesible por el propio alumno)
• Evaluaciones de bienestar y estrés (GAD-7 y pre/post)
• Hábitos de sueño, ejercicio y bienestar (introducidos voluntariamente)

NO recogemos: geolocalización, datos de navegación, datos de dispositivo, ni ningún dato que permita identificación fuera del sistema.`
        },
        {
          titulo: '3. Finalidad del tratamiento',
          contenido: `Los datos se tratan exclusivamente para:
• Proporcionar las herramientas de bienestar emocional de la app
• Mostrar al alumno su propio historial y progreso
• Generar estadísticas anónimas y agregadas para el panel del orientador
• Mejorar la app en base a patrones de uso anónimos`
        },
        {
          titulo: '4. Base legal',
          contenido: `El tratamiento se basa en el consentimiento explícito del usuario (Art. 6.1.a RGPD) otorgado al aceptar esta política durante el registro.

Para menores de 14 años, el consentimiento debe ser otorgado por el tutor legal (Art. 8 RGPD y Art. 7 LOPDGDD).`
        },
        {
          titulo: '5. Confidencialidad y anonimización',
          contenido: `Los datos del panel del orientador son 100% anónimos. Ningún orientador, tutor ni administrador puede ver los datos individuales de un alumno. Los identificadores usados en el panel son hashes criptográficos SHA-256 irreversibles.

El diario emocional y las evaluaciones individuales solo son visibles para el propio alumno.`
        },
        {
          titulo: '6. Almacenamiento y seguridad',
          contenido: `Los datos se almacenan en servidores de Supabase (EU West — Dublín, Irlanda), dentro del Espacio Económico Europeo.

Medidas de seguridad aplicadas:
• Cifrado en tránsito (HTTPS/TLS 1.3)
• Row Level Security (RLS) en todas las tablas
• Autenticación con tokens JWT de corta duración (1 hora)
• Contraseñas con hash bcrypt (gestionadas por Supabase)
• Sin acceso desde el cliente a datos de otros usuarios`
        },
        {
          titulo: '7. Conservación de datos',
          contenido: `Los datos se conservan mientras la cuenta esté activa. Tras 2 años de inactividad, los datos de uso se eliminan automáticamente.

El usuario puede solicitar la eliminación completa en cualquier momento escribiendo a piso@svalero.com.`
        },
        {
          titulo: '8. Derechos del usuario',
          contenido: `Tienes derecho a:
• Acceso: conocer qué datos tenemos sobre ti
• Rectificación: corregir datos incorrectos
• Supresión ("derecho al olvido"): eliminar todos tus datos
• Portabilidad: recibir tus datos en formato legible
• Limitación: restringir el tratamiento
• Oposición: oponerte al tratamiento

Para ejercer cualquiera de estos derechos, escribe a piso@svalero.com con el asunto "Derechos RGPD".`
        },
        {
          titulo: '9. Sin publicidad ni venta de datos',
          contenido: `Resetea no muestra publicidad. No vendemos, cedemos ni compartimos datos con terceros bajo ningún concepto. Los datos nunca se usan para fines comerciales ajenos a la app.`
        },
        {
          titulo: '10. Cambios en esta política',
          contenido: `Si modificamos esta política, te lo notificaremos dentro de la app con al menos 30 días de antelación. Podrás revisar los cambios y revocar tu consentimiento si no estás de acuerdo.`
        },
      ].map((seccion, i) => (
        <div key={i} className="mb-6">
          <h2 className="font-bold text-slate-800 mb-2">{seccion.titulo}</h2>
          <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{seccion.contenido}</p>
        </div>
      ))}

      <div className="bg-teal-50 rounded-2xl p-4 border border-teal-100 mt-6">
        <p className="text-teal-700 text-sm font-bold mb-1">¿Preguntas sobre tus datos?</p>
        <p className="text-teal-600 text-sm">Escribe a piso@svalero.com y respondemos en un máximo de 72 horas.</p>
      </div>
    </div>
  )
}
