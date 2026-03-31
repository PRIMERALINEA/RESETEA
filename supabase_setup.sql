-- RESETEA · SQL de inicialización
-- Ejecutar en Supabase → SQL Editor

-- Sesiones de respiración
CREATE TABLE IF NOT EXISTS sesiones_respiracion (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ejercicio_id text,
  ejercicio_nombre text,
  duracion_segundos int,
  ciclos_completados int,
  created_at timestamptz DEFAULT now()
);

-- Sesiones de anclaje
CREATE TABLE IF NOT EXISTS sesiones_anclaje (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  tecnica_id text,
  tecnica_nombre text,
  pasos_completados int,
  created_at timestamptz DEFAULT now()
);

-- Sesiones de relajación
CREATE TABLE IF NOT EXISTS sesiones_relajacion (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo text,
  grupos_completados int,
  duracion_segundos int,
  created_at timestamptz DEFAULT now()
);

-- Diario emocional
CREATE TABLE IF NOT EXISTS diario_estudiante (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  emocion text,
  intensidad int CHECK (intensidad BETWEEN 1 AND 5),
  nota text,
  created_at timestamptz DEFAULT now()
);

-- Test de estrés
CREATE TABLE IF NOT EXISTS test_estres (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo text,
  puntuacion int,
  nivel text,
  respuestas jsonb,
  created_at timestamptz DEFAULT now()
);

-- RLS: cada usuario solo ve y edita sus propios datos
ALTER TABLE sesiones_respiracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesiones_anclaje ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesiones_relajacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE diario_estudiante ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_estres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuarios_propios_respiracion" ON sesiones_respiracion FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "usuarios_propios_anclaje" ON sesiones_anclaje FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "usuarios_propios_relajacion" ON sesiones_relajacion FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "usuarios_propios_diario" ON diario_estudiante FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "usuarios_propios_test" ON test_estres FOR ALL USING (auth.uid() = user_id);
