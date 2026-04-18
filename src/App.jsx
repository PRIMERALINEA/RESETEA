import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import Login from '@/pages/Login'
import Home from '@/pages/Home'
import Respiracion from '@/pages/Respiracion'
import Anclajes from '@/pages/Anclajes'
import Diario from '@/pages/Diario'
import Relajacion from '@/pages/Relajacion'
import TestEstres from '@/pages/TestEstres'
import RespiracionCuadrada from '@/pages/RespiracionCuadrada'
import RelajacionJacobson from '@/pages/RelajacionJacobson'
import TecnicasRapidas from '@/pages/TecnicasRapidas'
import KitEmergencia from '@/pages/KitEmergencia'
import Rutinas from '@/pages/Rutinas'
import EscaleraCalmado from '@/pages/EscaleraCalmado'
import Grounding54321 from '@/pages/Grounding54321'
import MiPerfil from '@/pages/MiPerfil'
import AdminDashboard from '@/pages/AdminDashboard'
import AnsiedadExamenes from '@/pages/AnsiedadExamenes'
import QuedoEnBlanco from '@/pages/QuedoEnBlanco'
import SOSExamen from '@/pages/SOSExamen'
import PanelOrientador from '@/pages/PanelOrientador'
import PanelDocente from '@/pages/PanelDocente'
import Bienestar from '@/pages/Bienestar'
import ModuloFamilias from '@/pages/ModuloFamilias'
import Layout from '@/components/Layout'
import { RgpdBanner, useRgpdConsent, PoliticaPrivacidad } from '@/components/RgpdBanner'

// ── Spinner de carga ──────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f0f9f9' }}>
      <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
    </div>
  )
}

// ── Ruta protegida genérica (requiere login) ──────────────────────────────
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  return children
}

// ── Ruta exclusiva para alumnos ───────────────────────────────────────────
function AlumnoRoute({ children }) {
  const { user, loading, rol } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  // Si es docente, redirigir a su panel
  if (rol === 'docente') return <Navigate to="/docentes" replace />
  return children
}

// ── Ruta exclusiva para docentes ──────────────────────────────────────────
function DocenteRoute({ children }) {
  const { user, loading, rol } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  // Si es alumno, redirigir a su home
  if (rol === 'alumno') return <Navigate to="/" replace />
  return children
}

// ── Wrappers con layout ───────────────────────────────────────────────────
const AL = ({ children }) => <AlumnoRoute><Layout>{children}</Layout></AlumnoRoute>   // alumno + layout
const DL = ({ children }) => <DocenteRoute><Layout>{children}</Layout></DocenteRoute>  // docente + layout
const P  = ({ children }) => <ProtectedRoute>{children}</ProtectedRoute>               // solo auth, sin layout

export default function App() {
  const { consentDado, darConsent } = useRgpdConsent()

  return (
    <>
      {!consentDado && <RgpdBanner onAceptar={darConsent} />}
      <Routes>

        {/* ── Pública ── */}
        <Route path="/login" element={<Login />} />
        <Route path="/privacidad" element={<PoliticaPrivacidad />} />
        <Route path="/orientador" element={<PanelOrientador />} />

        {/* ── Rutas de ALUMNO (solo alumno) ── */}
        <Route path="/"                  element={<AL><Home /></AL>} />
        <Route path="/respiracion"       element={<AL><Respiracion /></AL>} />
        <Route path="/anclajes"          element={<AL><Anclajes /></AL>} />
        <Route path="/diario"            element={<AL><Diario /></AL>} />
        <Route path="/relajacion"        element={<AL><Relajacion /></AL>} />
        <Route path="/test-estres"       element={<AL><TestEstres /></AL>} />
        <Route path="/tecnicas-rapidas"  element={<AL><TecnicasRapidas /></AL>} />
        <Route path="/kit-emergencia"    element={<AL><KitEmergencia /></AL>} />
        <Route path="/rutinas"           element={<AL><Rutinas /></AL>} />
        <Route path="/escalera-calmado"  element={<AL><EscaleraCalmado /></AL>} />
        <Route path="/grounding"         element={<AL><Grounding54321 /></AL>} />
        <Route path="/ansiedad-examenes" element={<AL><AnsiedadExamenes /></AL>} />
        <Route path="/quedo-en-blanco"   element={<AL><QuedoEnBlanco /></AL>} />
        <Route path="/sos-examen"        element={<AL><SOSExamen /></AL>} />
        <Route path="/bienestar"         element={<AL><Bienestar /></AL>} />
        <Route path="/familias"          element={<AL><ModuloFamilias /></AL>} />

        {/* Rutas de alumno sin layout (pantallas inmersivas) */}
        <Route path="/respiracion/cuadrada" element={<P><RespiracionCuadrada /></P>} />
        <Route path="/relajacion/jacobson"  element={<P><RelajacionJacobson /></P>} />

        {/* ── Rutas compartidas (alumno y docente) ── */}
        <Route path="/perfil" element={<ProtectedRoute><Layout><MiPerfil /></Layout></ProtectedRoute>} />
        <Route path="/admin"  element={<ProtectedRoute><Layout><AdminDashboard /></Layout></ProtectedRoute>} />

        {/* ── Rutas de DOCENTE (solo docente) ── */}
        <Route path="/docentes" element={<DL><PanelDocente /></DL>} />

        {/* ── Fallback ── */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </>
  )
}
