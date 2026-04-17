import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import { Wind, Anchor, BookOpen, Heart, Brain, Home, LogOut, Menu, X, ChevronDown, ChevronRight, Zap, AlertCircle, Sun, User, BarChart2, Shield } from 'lucide-react'

const LOGO_URL = 'https://zbusdixrxedfhbkquafh.supabase.co/storage/v1/object/public/logo/WhatsApp%20Image%202026-04-06%20at%2015.58.04.jpeg'

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
    label: '📖 MÓDULOS',
    subtitle: 'Aprende a gestionar la ansiedad',
    color: 'text-indigo-400',
    borderColor: 'border-indigo-500/30',
    items: [
      { name: '🚨 SOS Examen', sub: '9 técnicas · Voz guiada', path: '/sos-examen', icon: Zap },
      { name: 'Ansiedad y exámenes', sub: '4 sesiones · Psicoeducación', path: '/ansiedad-examenes', icon: Brain },
      { name: 'Cuando me quedo en blanco', sub: 'Protocolo + simulación', path: '/quedo-en-blanco', icon: Brain },
    ]
  },
  {
    label: '☀️ RUTINAS',
    subtitle: 'Hábitos que marcan la diferencia',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    items: [
      { name: 'Rutinas diarias', sub: 'Mañana, examen, noche', path: '/rutinas', icon: Sun },
      { name: 'Bienestar general', sub: 'Hábitos, retos y plan', path: '/bienestar', icon: Heart },
      { name: '❤️ Para familias', sub: 'Guía de acompañamiento', path: '/familias', icon: Heart },
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
    ]
  },
]

// Navegación inferior móvil
const bottomNav = [
  { name: 'Inicio', path: '/', icon: '🏠' },
  { name: 'Diario', path: '/diario', icon: '📓' },
  { name: 'Rutinas', path: '/rutinas', icon: '☀️' },
  { name: 'Perfil', path: '/perfil', icon: '👤' },
]

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState({ '⚡ HERRAMIENTAS RÁPIDAS': true })
  const { logout } = useAuth()
  const location = useLocation()

  const toggleGroup = (label) => {
    setExpandedGroups(prev => ({ ...prev, [label]: !prev[label] }))
  }

  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen" style={{ background: '#f0f4f8' }}>

      {/* ── MOBILE HEADER ── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 px-4 h-16 flex items-center justify-between shadow-sm"
        style={{ background: 'linear-gradient(135deg, #1a2744 0%, #2d4a6b 100%)' }}>
        <div className="flex items-center gap-3">
          <img src={LOGO_URL} alt="Resetea" className="w-10 h-10 rounded-full object-cover border-2 border-white/20 shadow-md" />
          <div>
            <span className="font-black text-white text-lg tracking-tight">Resetea</span>
            <p className="text-white/50 text-xs -mt-0.5">Tu espacio de calma</p>
          </div>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.1)' }}>
          {sidebarOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
        </button>
      </header>

      {/* Overlay móvil */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`fixed top-0 left-0 h-full z-50 shadow-2xl transition-all duration-300 overflow-y-auto w-72
        lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ background: 'linear-gradient(180deg, #1a2744 0%, #1e3356 100%)' }}>

        <div className="flex flex-col min-h-full pb-4">

          {/* Logo sidebar */}
          <div className="p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-3">
              <img src={LOGO_URL} alt="Resetea"
                className="w-12 h-12 rounded-full object-cover shadow-lg border-2 border-white/10" />
              <div>
                <h1 className="font-black text-white text-xl tracking-tight">Resetea</h1>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Tu espacio de calma y conexión</p>
              </div>
            </div>
          </div>

          {/* Links principales */}
          <div className="px-4 pt-4 space-y-1">
            {[
              { name: 'Inicio', sub: 'Panel principal', path: '/', icon: Home },
              { name: 'Mi Perfil', sub: 'Actividades y logros', path: '/perfil', icon: User },
              { name: 'Panel Orientador', sub: 'Acceso con código', path: '/orientador', icon: Shield },
              { name: 'Espacio Docente', sub: 'Bienestar del profesorado', path: '/docentes', icon: Heart },
              { name: 'Panel Admin', sub: 'Métricas y usuarios', path: '/admin', icon: BarChart2 },
            ].map(item => (
              <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all"
                style={{
                  background: isActive(item.path) ? 'rgba(99,210,190,0.15)' : 'transparent',
                  border: isActive(item.path) ? '1px solid rgba(99,210,190,0.3)' : '1px solid transparent',
                }}>
                <item.icon className="w-5 h-5 flex-shrink-0"
                  style={{ color: isActive(item.path) ? '#63d2be' : 'rgba(255,255,255,0.5)' }} />
                <div>
                  <p className="font-semibold text-sm"
                    style={{ color: isActive(item.path) ? '#63d2be' : 'rgba(255,255,255,0.8)' }}>
                    {item.name}
                  </p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{item.sub}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Grupos de navegación */}
          <nav className="flex-1 px-4 mt-2 space-y-1">
            {navGroups.map((group) => {
              const isExpanded = expandedGroups[group.label]
              return (
                <div key={group.label} className="mb-1">
                  <button onClick={() => toggleGroup(group.label)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all"
                    style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="text-left">
                      <p className={`text-xs font-black tracking-wider ${group.color}`}>{group.label}</p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>{group.subtitle}</p>
                    </div>
                    {isExpanded
                      ? <ChevronDown className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.2)' }} />
                      : <ChevronRight className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.2)' }} />}
                  </button>

                  {isExpanded && (
                    <div className="space-y-0.5 pl-2 pt-1 pb-1">
                      {group.items.map((item) => (
                        <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                          style={{
                            background: isActive(item.path) ? 'rgba(99,210,190,0.12)' : 'transparent',
                          }}>
                          <item.icon className="w-4 h-4 flex-shrink-0"
                            style={{ color: isActive(item.path) ? '#63d2be' : 'rgba(255,255,255,0.4)' }} />
                          <div>
                            <p className="font-semibold text-sm leading-tight"
                              style={{ color: isActive(item.path) ? '#63d2be' : 'rgba(255,255,255,0.7)' }}>
                              {item.name}
                            </p>
                            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{item.sub}</p>
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
          <div className="px-4 pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <button onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all"
              style={{ color: '#f87171' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <LogOut className="w-5 h-5" />
              <span className="font-medium text-sm">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="pt-16 pb-20 lg:pt-0 lg:pb-0 lg:ml-72 min-h-screen">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>

      {/* ── BOTTOM NAV MÓVIL ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-4 py-2"
        style={{ background: 'white', borderTop: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}>
        <div className="flex justify-around">
          {bottomNav.map(item => (
            <Link key={item.path} to={item.path}
              className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all"
              style={{ minWidth: 60 }}>
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs font-600"
                style={{ color: isActive(item.path) ? '#0d9488' : '#94a3b8', fontWeight: isActive(item.path) ? 700 : 500 }}>
                {item.name}
              </span>
              {isActive(item.path) && (
                <div className="w-1 h-1 rounded-full" style={{ background: '#0d9488' }} />
              )}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
