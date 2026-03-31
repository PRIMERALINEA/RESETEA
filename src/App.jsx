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
import Layout from '@/components/Layout'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f0f9f9' }}>
      <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return children
}

const P = ({ children }) => <ProtectedRoute>{children}</ProtectedRoute>
const PL = ({ children }) => <ProtectedRoute><Layout>{children}</Layout></ProtectedRoute>

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PL><Home /></PL>} />
      <Route path="/respiracion" element={<PL><Respiracion /></PL>} />
      <Route path="/anclajes" element={<PL><Anclajes /></PL>} />
      <Route path="/diario" element={<PL><Diario /></PL>} />
      <Route path="/relajacion" element={<PL><Relajacion /></PL>} />
      <Route path="/test-estres" element={<PL><TestEstres /></PL>} />
      <Route path="/tecnicas-rapidas" element={<PL><TecnicasRapidas /></PL>} />
      <Route path="/kit-emergencia" element={<PL><KitEmergencia /></PL>} />
      <Route path="/rutinas" element={<PL><Rutinas /></PL>} />
      <Route path="/respiracion/cuadrada" element={<P><RespiracionCuadrada /></P>} />
      <Route path="/relajacion/jacobson" element={<P><RelajacionJacobson /></P>} />
      <Route path="/escalera-calmado" element={<P><EscaleraCalmado /></P>} />
      <Route path="/grounding" element={<P><Grounding54321 /></P>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
