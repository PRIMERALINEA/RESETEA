import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import { Wind, Anchor, BookOpen, Heart, Brain, Home, LogOut, Menu, X, ChevronDown, ChevronRight, Zap, AlertCircle, Sun, User } from 'lucide-react'

const navGroups = [
  {
    label: '⚡ HERRAMIENTAS RÁPIDAS',
    subtitle: 'Para el momento de necesidad',
    color: 'text-red-400',
    borderColor: 'border-red-500/30',
    items: [
      { name: 'Kit de emergencia', sub: 'Ayuda inmediata', path: '/kit-emergencia', icon: AlertCircle },
      { name: 'Técnicas rápidas', sub: '1-3 minutos', path: '/tecnicas-rapidas', icon: Zap },
      { name: 'Escalera de calmado', sub: 'Baja la intensidad paso a paso', path: '/escalera-calmado', icon: Zap },
      { name: 'Grounding 5-4-3-2-1', sub: 'Vuelve al presente con los sentidos', path: '/grounding', icon: Zap },
    ]
  },
  {
    label: '🌬️ RESPIRACIÓN',
    subtitle: 'Calma el estrés al momento',
    color: 'text-teal-400',
    borderColor: 'border-teal-500/30',
    items: [
      { name: 'Técnicas de Respiración', sub: 'Guiada paso a paso', path: '/respiracion', icon: Wind },
    ]
  },
  {
    label: '⚓ ANCLAJE',
    subtitle: 'Vuelve al presente',
    color: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    items: [
      { name: 'Técnicas de Anclaje', sub: '5-4-3-2-1 y más', path: '/anclajes', icon: Anchor },
    ]
  },
  {
    label: '💆 RELAJACIÓN',
    subtitle: 'Suelta la tensión',
    color: 'text-rose-400',
    borderColor: 'border-rose-500/30',
    items: [
      { name: 'Relajación Muscular', sub: 'Técnica de Jacobson', path: '/relajacion', icon: Heart },
    ]
  },
  {
    label: '☀️ RUTINAS',
    subtitle: 'Hábitos que marcan la diferencia',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    items: [
      { name: 'Rutinas diarias', sub: 'Mañana, examen, noche', path: '/rutinas', icon: Sun },
    ]
  },
  {
    label: '📓 DIARIO & TEST',
    subtitle: 'Conoce tu estado emocional',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    items: [
      { name: 'Diario Emocional', sub: 'Registra cómo te sientes', path: '/diario', icon: BookOpen },
      { name: 'Test de Estrés', sub: 'Evalúa tu ansiedad', path: '/test-estres', icon: Brain },
      { name: 'Mi Perfil', sub: 'Mis actividades y logros', path: '/perfil', icon: User },
    ]
  },
]

const LOGO_URL = 'https://zbusdixrxedfhbkquafh.supabase.co/storage/v1/object/public/logo/Gemini_Generated_Image_rar33drar33drar3.png'

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState({ '⚡ HERRAMIENTAS RÁPIDAS': true })
  const { logout } = useAuth()
  const location = useLocation()

  const toggleGroup = (label) => {
    setExpandedGroups(prev => ({ ...prev, [label]: !prev[label] }))
  }

  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen" style={{ background: '#f0f9f9' }}>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 border-b border-teal-100 px-4 h-16 flex items-center justify-between shadow-sm"
        style={{ background: '#0d3d3d' }}>
        <div className="flex items-center gap-3">
          <img src={LOGO_URL} alt="Resetea" className="w-10 h-10 rounded-full object-cover" />
          <div>
            <span className="font-black text-white text-lg tracking-tight">Resetea</span>
            <p className="text-teal-300 text-xs -mt-0.5">Tu espacio de calma y conexión</p>
          </div>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white/60 hover:text-white">
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Overlay móvil */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full z-50 shadow-2xl transition-all duration-300 overflow-y-auto w-72
        lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ background: '#0d3d3d' }}>

        <div className="flex flex-col min-h-full pb-4">
          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3 mb-1">
              <img src={LOGO_URL} alt="Resetea" className="w-12 h-12 rounded-full object-cover shadow-lg" />
              <div>
                <h1 className="font-black text-white text-xl tracking-tight">Resetea</h1>
                <p className="text-teal-300 text-xs">Tu espacio de calma y conexión</p>
              </div>
            </div>
          </div>

          {/* Inicio */}
          <div className="px-4 pt-4">
            <Link to="/" onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-2 ${
                isActive('/') ? 'bg-teal-600 text-white shadow-md' : 'text-white/60 hover:bg-white/8 hover:text-white'
              }`}>
              <Home className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">Inicio</p>
                <p className="text-xs opacity-60">Panel principal</p>
              </div>
            </Link>
          </div>

          {/* Grupos de navegación */}
          <nav className="flex-1 px-4 space-y-1">
            {navGroups.map((group) => {
              const isExpanded = expandedGroups[group.label]
              return (
                <div key={group.label} className={`border-l-2 ${group.borderColor} pl-2 mb-2`}>
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-white/5 transition-all"
                  >
                    <div>
                      <p className={`text-xs font-black tracking-wider ${group.color}`}>{group.label}</p>
                      <p className="text-white/30 text-xs">{group.subtitle}</p>
                    </div>
                    {isExpanded
                      ? <ChevronDown className="w-4 h-4 text-white/30" />
                      : <ChevronRight className="w-4 h-4 text-white/30" />}
                  </button>

                  {isExpanded && (
                    <div className="space-y-0.5 pb-1">
                      {group.items.map((item) => (
                        <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-xl ml-2 transition-all ${
                            isActive(item.path)
                              ? 'bg-teal-700 text-white shadow-md'
                              : 'text-white/60 hover:bg-white/8 hover:text-white'
                          }`}>
                          <item.icon className="w-4 h-4 flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-sm leading-tight">{item.name}</p>
                            <p className="text-xs opacity-50">{item.sub}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          {/* Cerrar sesión */}
          <div className="px-4 pt-2 border-t border-white/10">
            <button onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all">
              <LogOut className="w-5 h-5" />
              <span className="font-medium text-sm">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="pt-16 lg:pt-0 lg:ml-72 min-h-screen">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
