# Integración de PanelDocente en App.jsx
# =========================================
# Añade estas 2 líneas al fichero App.jsx existente

## PASO 1 — Import (junto al resto de imports, al inicio del archivo)

import PanelDocente from '@/pages/PanelDocente'


## PASO 2 — Ruta (dentro de <Routes>, junto al resto de rutas)

<Route path="/docentes" element={<PanelDocente />} />


## RESULTADO: Las líneas quedan así en App.jsx

# (en la zona de imports, añade):
import PanelDocente from '@/pages/PanelDocente'

# (en la zona de <Routes>, añade junto a la ruta /orientador):
<Route path="/orientador" element={<PanelOrientador />} />
<Route path="/docentes"   element={<PanelDocente />} />     ← nueva


## NOTAS
- La ruta /docentes NO usa <PL> (ProtectedRoute + Layout), igual que /orientador.
  El login es interno al propio componente, por código.
- Los docentes acceden directamente a: https://resetea-two.vercel.app/docentes
- Puedes añadir un enlace a esta URL en el correo de bienvenida a cada docente.
