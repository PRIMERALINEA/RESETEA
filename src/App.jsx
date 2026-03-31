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
import Layout from '@/components/Layout'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout>
            <Home />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/respiracion" element={
        <ProtectedRoute><Layout><Respiracion /></Layout></ProtectedRoute>
      } />
      <Route path="/anclajes" element={
        <ProtectedRoute><Layout><Anclajes /></Layout></ProtectedRoute>
      } />
      <Route path="/diario" element={
        <ProtectedRoute><Layout><Diario /></Layout></ProtectedRoute>
      } />
      <Route path="/relajacion" element={
        <ProtectedRoute><Layout><Relajacion /></Layout></ProtectedRoute>
      } />
      <Route path="/test-estres" element={
        <ProtectedRoute><Layout><TestEstres /></Layout></ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
