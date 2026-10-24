-- ============================================================================
-- RESETEA ACADÉMICA — Canal de aviso de acoso escolar (convivencia)
-- Ejecutar UNA vez en Supabase → SQL Editor. Es idempotente en lo posible.
--
-- Diseño:
--   * El alumno solo puede INSERTAR. No tiene ningún permiso de lectura.
--   * Leen los receptores del centro (director, orientación, jefatura...),
--     y solo con sesión de segundo factor verificado (aal2).
--   * Los datos de identificación (email, curso, grupo, centro) los rellena
--     el servidor; el cliente no puede falsearlos.
--   * El canal solo acepta reportes si el centro tiene receptores activos
--     y al menos un email de aviso (si no, el aviso no llegaría a nadie).
-- ============================================================================

-- ── 0. Requisito: columna de grupo en perfiles_alumnos (idempotente) ────────
ALTER TABLE perfiles_alumnos ADD COLUMN IF NOT EXISTS grupo text;

-- ── 1. Configuración por centro (multi-centro) ──────────────────────────────
CREATE TABLE IF NOT EXISTS config_convivencia (
  centro_id    uuid PRIMARY KEY REFERENCES centros(id) ON DELETE CASCADE,
  emails_aviso text[]  NOT NULL DEFAULT '{}',
  activo       boolean NOT NULL DEFAULT false,
  horas_recordatorio integer NOT NULL DEFAULT 4 CHECK (horas_recordatorio BETWEEN 1 AND 72),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ── 2. Receptores (quién puede leer los reportes de cada centro) ────────────
CREATE TABLE IF NOT EXISTS receptores_convivencia (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  centro_id  uuid NOT NULL REFERENCES centros(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cargo      text NOT NULL CHECK (cargo IN ('director','orientacion','jefe_estudios','otro')),
  activo     boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (centro_id, user_id)
);

-- ── 3. Reportes ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reportes_acoso (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  centro_id          uuid NOT NULL REFERENCES centros(id),
  user_id            uuid NOT NULL REFERENCES auth.users(id),
  email_alumno       text,
  curso              text,
  grupo              text,
  tipo               text NOT NULL CHECK (tipo IN ('victima','testigo')),
  descripcion        text NOT NULL CHECK (char_length(descripcion) BETWEEN 10 AND 5000),
  lugar              text CHECK (char_length(lugar) <= 300),
  cuando             text CHECK (char_length(cuando) <= 300),
  implicados         text CHECK (char_length(implicados) <= 1000),
  urgente            boolean NOT NULL DEFAULT false,
  estado             text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','en_gestion','cerrado')),
  responsable_id     uuid REFERENCES auth.users(id),
  responsable_cargo  text,
  fecha_asuncion     timestamptz,
  ultimo_recordatorio timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reportes_centro_estado ON reportes_acoso (centro_id, estado, created_at DESC);

-- Receptor que se aparta de un caso (conflicto de interés)
CREATE TABLE IF NOT EXISTS reportes_acoso_exclusiones (
  reporte_id uuid NOT NULL REFERENCES reportes_acoso(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (reporte_id, user_id)
);

-- Registro de accesos (quién abrió/gestionó cada reporte y cuándo)
CREATE TABLE IF NOT EXISTS reportes_acoso_accesos (
  id         bigserial PRIMARY KEY,
  reporte_id uuid NOT NULL REFERENCES reportes_acoso(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL,
  accion     text NOT NULL CHECK (accion IN ('abrir','asumir','abstenerse','cerrar')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE config_convivencia          ENABLE ROW LEVEL SECURITY;
ALTER TABLE receptores_convivencia      ENABLE ROW LEVEL SECURITY;
ALTER TABLE reportes_acoso              ENABLE ROW LEVEL SECURITY;
ALTER TABLE reportes_acoso_exclusiones  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reportes_acoso_accesos      ENABLE ROW LEVEL SECURITY;

-- ── 4. Funciones auxiliares (SECURITY DEFINER, sin exponer datos) ───────────
-- ¿Tiene la sesión actual el segundo factor verificado?
CREATE OR REPLACE FUNCTION public.sesion_aal2()
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT coalesce(auth.jwt() ->> 'aal', '') = 'aal2';
$$;

-- ¿Es el usuario actual receptor activo (de un centro concreto, o de cualquiera)?
CREATE OR REPLACE FUNCTION public.es_receptor_convivencia(p_centro uuid DEFAULT NULL)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM receptores_convivencia r
    WHERE r.user_id = auth.uid() AND r.activo
      AND (p_centro IS NULL OR r.centro_id = p_centro)
  );
$$;

-- ¿Puede un centro recibir reportes? (activo + ≥1 receptor + ≥1 email de aviso)
CREATE OR REPLACE FUNCTION public.convivencia_disponible(p_centro uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p_centro IS NOT NULL
     AND EXISTS (SELECT 1 FROM config_convivencia c
                 WHERE c.centro_id = p_centro AND c.activo
                   AND coalesce(array_length(c.emails_aviso, 1), 0) > 0)
     AND EXISTS (SELECT 1 FROM receptores_convivencia r
                 WHERE r.centro_id = p_centro AND r.activo);
$$;

-- ¿Se ha apartado el usuario actual de este reporte? (SECURITY DEFINER porque la
-- tabla de exclusiones no es legible por el cliente y la política necesita consultarla)
CREATE OR REPLACE FUNCTION public.convivencia_excluido(p_reporte uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM reportes_acoso_exclusiones e
                 WHERE e.reporte_id = p_reporte AND e.user_id = auth.uid());
$$;

-- Nº de reportes pendientes de asumir (solo un número, sin contenido).
-- No exige aal2 para poder mostrar el aviso antes de verificar el segundo factor.
CREATE OR REPLACE FUNCTION public.convivencia_pendientes()
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(*)::int
  FROM reportes_acoso ra
  WHERE ra.estado = 'pendiente' AND ra.responsable_id IS NULL
    AND EXISTS (SELECT 1 FROM receptores_convivencia r
                WHERE r.user_id = auth.uid() AND r.activo AND r.centro_id = ra.centro_id)
    AND NOT EXISTS (SELECT 1 FROM reportes_acoso_exclusiones e
                    WHERE e.reporte_id = ra.id AND e.user_id = auth.uid());
$$;

-- ── 5. Trigger de inserción: el servidor fija la identidad y limita abusos ──
CREATE OR REPLACE FUNCTION public.reportes_acoso_before_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_centro uuid; v_curso text; v_grupo text; v_recientes int;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado' USING ERRCODE = '42501';
  END IF;

  SELECT centro_id, curso, grupo INTO v_centro, v_curso, v_grupo
  FROM perfiles_alumnos WHERE user_id = auth.uid();

  IF v_centro IS NULL THEN
    RAISE EXCEPTION 'Solo alumnado de un centro puede enviar avisos' USING ERRCODE = '42501';
  END IF;
  IF NOT convivencia_disponible(v_centro) THEN
    RAISE EXCEPTION 'El canal no está activo en este centro' USING ERRCODE = '42501';
  END IF;

  -- Límite anti-abuso: máx. 5 avisos por hora y alumno
  SELECT count(*) INTO v_recientes FROM reportes_acoso
  WHERE user_id = auth.uid() AND created_at > now() - interval '1 hour';
  IF v_recientes >= 5 THEN
    RAISE EXCEPTION 'limite_avisos' USING ERRCODE = 'P0001';
  END IF;

  NEW.user_id           := auth.uid();
  NEW.centro_id         := v_centro;
  NEW.email_alumno      := auth.jwt() ->> 'email';
  NEW.curso             := v_curso;
  NEW.grupo             := v_grupo;
  NEW.estado            := 'pendiente';
  NEW.responsable_id    := NULL;
  NEW.responsable_cargo := NULL;
  NEW.fecha_asuncion    := NULL;
  NEW.ultimo_recordatorio := NULL;
  NEW.created_at        := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_reportes_acoso_before_insert ON reportes_acoso;
CREATE TRIGGER trg_reportes_acoso_before_insert
  BEFORE INSERT ON reportes_acoso
  FOR EACH ROW EXECUTE FUNCTION public.reportes_acoso_before_insert();

-- ── 6. Políticas RLS ────────────────────────────────────────────────────────
-- Alumno: SOLO insertar (sin lectura, sin edición, sin borrado).
DROP POLICY IF EXISTS "alumno_inserta_reporte" ON reportes_acoso;
CREATE POLICY "alumno_inserta_reporte" ON reportes_acoso
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Receptor: lectura con segundo factor, excepto casos de los que se ha apartado.
DROP POLICY IF EXISTS "receptor_lee_reporte" ON reportes_acoso;
CREATE POLICY "receptor_lee_reporte" ON reportes_acoso
  FOR SELECT TO authenticated
  USING (
    public.sesion_aal2()
    AND public.es_receptor_convivencia(centro_id)
    AND NOT public.convivencia_excluido(id)
  );
-- (No hay políticas de UPDATE/DELETE: los cambios de estado pasan por las funciones de abajo.)

-- Cada receptor ve únicamente su propia fila de receptor.
DROP POLICY IF EXISTS "receptor_ve_su_fila" ON receptores_convivencia;
CREATE POLICY "receptor_ve_su_fila" ON receptores_convivencia
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- config_convivencia, exclusiones y accesos: sin políticas → inaccesibles desde el cliente.
-- (Las funciones SECURITY DEFINER y la Edge Function con service_role sí pueden usarlas.
--  Para auditar accesos, consulta reportes_acoso_accesos desde el SQL Editor.)

-- ── 7. Acciones del receptor (todas exigen receptor + aal2) ─────────────────
CREATE OR REPLACE FUNCTION public.convivencia_registrar_acceso(p_reporte uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.sesion_aal2() THEN RAISE EXCEPTION 'Se requiere verificación en dos pasos' USING ERRCODE = '42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM reportes_acoso ra WHERE ra.id = p_reporte AND public.es_receptor_convivencia(ra.centro_id)) THEN
    RAISE EXCEPTION 'Sin acceso' USING ERRCODE = '42501';
  END IF;
  INSERT INTO reportes_acoso_accesos (reporte_id, user_id, accion) VALUES (p_reporte, auth.uid(), 'abrir');
END $$;

-- "Me hago cargo": solo el primero lo consigue (devuelve false si ya estaba asumido).
CREATE OR REPLACE FUNCTION public.convivencia_asumir(p_reporte uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_cargo text; v_n int;
BEGIN
  IF NOT public.sesion_aal2() THEN RAISE EXCEPTION 'Se requiere verificación en dos pasos' USING ERRCODE = '42501'; END IF;
  SELECT r.cargo INTO v_cargo
  FROM reportes_acoso ra JOIN receptores_convivencia r
    ON r.centro_id = ra.centro_id AND r.user_id = auth.uid() AND r.activo
  WHERE ra.id = p_reporte
    AND NOT EXISTS (SELECT 1 FROM reportes_acoso_exclusiones e WHERE e.reporte_id = ra.id AND e.user_id = auth.uid());
  IF v_cargo IS NULL THEN RAISE EXCEPTION 'Sin acceso' USING ERRCODE = '42501'; END IF;

  UPDATE reportes_acoso
     SET responsable_id = auth.uid(), responsable_cargo = v_cargo,
         fecha_asuncion = now(), estado = 'en_gestion'
   WHERE id = p_reporte AND responsable_id IS NULL;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n = 1 THEN
    INSERT INTO reportes_acoso_accesos (reporte_id, user_id, accion) VALUES (p_reporte, auth.uid(), 'asumir');
  END IF;
  RETURN v_n = 1;
END $$;

-- "Me abstengo": el receptor deja de ver el caso (conflicto de interés).
CREATE OR REPLACE FUNCTION public.convivencia_abstenerse(p_reporte uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.sesion_aal2() THEN RAISE EXCEPTION 'Se requiere verificación en dos pasos' USING ERRCODE = '42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM reportes_acoso ra WHERE ra.id = p_reporte AND public.es_receptor_convivencia(ra.centro_id)) THEN
    RAISE EXCEPTION 'Sin acceso' USING ERRCODE = '42501';
  END IF;
  INSERT INTO reportes_acoso_exclusiones (reporte_id, user_id) VALUES (p_reporte, auth.uid()) ON CONFLICT DO NOTHING;
  -- Si era el responsable, el caso vuelve a quedar sin asumir.
  UPDATE reportes_acoso
     SET responsable_id = NULL, responsable_cargo = NULL, fecha_asuncion = NULL, estado = 'pendiente'
   WHERE id = p_reporte AND responsable_id = auth.uid();
  INSERT INTO reportes_acoso_accesos (reporte_id, user_id, accion) VALUES (p_reporte, auth.uid(), 'abstenerse');
END $$;

-- Cerrar: solo el responsable.
CREATE OR REPLACE FUNCTION public.convivencia_cerrar(p_reporte uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_n int;
BEGIN
  IF NOT public.sesion_aal2() THEN RAISE EXCEPTION 'Se requiere verificación en dos pasos' USING ERRCODE = '42501'; END IF;
  UPDATE reportes_acoso SET estado = 'cerrado'
   WHERE id = p_reporte AND responsable_id = auth.uid() AND estado = 'en_gestion';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n = 1 THEN
    INSERT INTO reportes_acoso_accesos (reporte_id, user_id, accion) VALUES (p_reporte, auth.uid(), 'cerrar');
  END IF;
  RETURN v_n = 1;
END $$;

-- Defensa en profundidad: aunque falte una política, estos permisos no existen.
REVOKE ALL ON config_convivencia, receptores_convivencia, reportes_acoso,
  reportes_acoso_exclusiones, reportes_acoso_accesos FROM anon;
REVOKE UPDATE, DELETE, TRUNCATE ON reportes_acoso FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON receptores_convivencia, config_convivencia,
  reportes_acoso_exclusiones, reportes_acoso_accesos FROM authenticated;
GRANT SELECT, INSERT ON reportes_acoso TO authenticated;
GRANT SELECT ON receptores_convivencia TO authenticated;

-- Permisos de ejecución: solo usuarios autenticados.
REVOKE ALL ON FUNCTION public.convivencia_excluido(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.convivencia_excluido(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.es_receptor_convivencia(uuid), public.convivencia_disponible(uuid),
  public.convivencia_pendientes(), public.convivencia_registrar_acceso(uuid),
  public.convivencia_asumir(uuid), public.convivencia_abstenerse(uuid),
  public.convivencia_cerrar(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.es_receptor_convivencia(uuid), public.convivencia_disponible(uuid),
  public.convivencia_pendientes(), public.convivencia_registrar_acceso(uuid),
  public.convivencia_asumir(uuid), public.convivencia_abstenerse(uuid),
  public.convivencia_cerrar(uuid) TO authenticated;

-- ============================================================================
-- ALTA DE UN CENTRO (ejemplo — ajusta los datos y ejecútalo a mano):
--
--   -- 1) Las personas receptoras deben tener ya cuenta en Resetea (rol docente).
--   --    Busca sus user_id:  SELECT id, email FROM auth.users WHERE email IN (...);
--   INSERT INTO receptores_convivencia (centro_id, user_id, cargo) VALUES
--     ('<centro_id>', '<user_id_director>',      'director'),
--     ('<centro_id>', '<user_id_orientacion>',   'orientacion'),
--     ('<centro_id>', '<user_id_jefe_estudios>', 'jefe_estudios');
--
--   -- 2) Dirección(es) de aviso del centro y activación del canal:
--   INSERT INTO config_convivencia (centro_id, emails_aviso, activo)
--   VALUES ('<centro_id>', ARRAY['orientacion@centro.es'], true)
--   ON CONFLICT (centro_id) DO UPDATE SET emails_aviso = EXCLUDED.emails_aviso, activo = EXCLUDED.activo;
-- ============================================================================
