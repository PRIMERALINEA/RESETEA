import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import { Wind, Anchor, BookOpen, Heart, Brain, Home, LogOut } from 'lucide-react'

const navItems = [
  { path: '/', label: 'Inicio', icon: Home },
  { path: '/respiracion', label: 'Respiración', icon: Wind },
  { path: '/anclajes', label: 'Anclajes', icon: Anchor },
  { path: '/relajacion', label: 'Relajación', icon: Heart },
  { path: '/diario', label: 'Diario', icon: BookOpen },
  { path: '/test-estres', label: 'Test estrés', icon: Brain },
]

export default function Layout({ children }) {
  const { logout } = useAuth()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-blue-100 px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
            <span className="text-lg">🔄</span>
          </div>
          <span className="font-black text-blue-900 text-lg tracking-tight">Resetea</span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1 text-slate-400 hover:text-red-500 transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 pb-24">
        {children}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-blue-100 px-2 py-2 flex justify-around z-50 shadow-lg">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all ${
                isActive ? 'text-blue-600' : 'text-slate-400 hover:text-blue-400'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : ''}`} />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
