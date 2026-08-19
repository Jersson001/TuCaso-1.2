-- ================================================================
-- TuCaso - Migración Completa: Columnas + RLS Policies (lawyers)
-- Pega este SQL en: Dashboard > SQL Editor > New Query > Run
-- ================================================================

-- PARTE 1: Agregar columnas faltantes
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT NULL;
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT NULL;
ALTER TABLE lawyers ADD COLUMN IF NOT EXISTS headline TEXT DEFAULT NULL;

-- PARTE 2: Eliminar políticas conflictivas si existen
DROP POLICY IF EXISTS "Lawyers can insert own profile" ON lawyers;
DROP POLICY IF EXISTS "Lawyers can update own profile" ON lawyers;
DROP POLICY IF EXISTS "Lawyers can select own profile" ON lawyers;
DROP POLICY IF EXISTS "Public can read lawyer profiles" ON lawyers;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON lawyers;
DROP POLICY IF EXISTS "Enable update for users based on profile_id" ON lawyers;

-- PARTE 3: Crear políticas RLS correctas
-- Cualquier visitante puede leer perfiles de abogados (directorio público)
CREATE POLICY "Public can read lawyer profiles"
  ON lawyers FOR SELECT
  USING (true);

-- Solo el propio abogado puede crear su fila de perfil
CREATE POLICY "Lawyers can insert own profile"
  ON lawyers FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

-- Solo el propio abogado puede editar su fila de perfil
CREATE POLICY "Lawyers can update own profile"
  ON lawyers FOR UPDATE
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- PARTE 4: Forzar recarga del schema cache de PostgREST
NOTIFY pgrst, 'reload schema';

-- ================================================================
-- VERIFICACIÓN (ejecutar después para confirmar):
-- ================================================================
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'lawyers' AND table_schema = 'public'
-- ORDER BY ordinal_position;
--
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'lawyers';
-- ================================================================
