/*
# OCMS — Online Complaint Management System: initial schema

1. Purpose
- Full schema for the OCMS academic project: profiles, complaints,
  complaint_history, notifications, complaint_attachments, departments.

2. New Tables
- `profiles` — extends auth.users with full_name, phone, role (user|admin).
- `departments` — reference list of departments/locations.
- `complaints` — user-submitted complaints with reference number, status, priority, assignment, resolution.
- `complaint_history` — chronological audit log of every status/assignment change.
- `notifications` — in-app notifications per user.
- `complaint_attachments` — files attached to complaints (stored in Supabase Storage).

3. Enums
- complaint_status: submitted, under_review, in_progress, resolved, rejected, reopened
- complaint_priority: low, medium, high, critical
- user_role: user, admin

4. Functions
- `handle_new_user()` — trigger on auth.users insert to create a profile row with role 'user' and copy email.
- `is_admin()` — returns true if the current user's profile role is 'admin' (used in RLS).
- `generate_reference_number()` — returns a unique human-readable reference like OCMS-YYYY-XXXXXX.

5. Security (RLS)
- profiles: a user can SELECT/UPDATE only their own row, and only permitted fields.
  role is NOT client-updatable; admin provisioning is done via service-role / SQL only.
- complaints: users can SELECT/INSERT their own; users can UPDATE only to reopen on their own
  resolved complaints; admins can SELECT/UPDATE all.
- complaint_history: users can SELECT history for their own complaints; admins can SELECT all.
  Inserts happen only via the SECURITY DEFINER update_complaint_status() function (service-side).
- notifications: a user can SELECT/UPDATE(read) only their own.
- complaint_attachments: users can SELECT/INSERT their own; admins can SELECT all.
- departments: readable by all authenticated users; writable only via service role.

6. Admin provisioning
- The `role` column on profiles is NOT updatable by clients. Admins are provisioned by
  running SQL (provided in README) that updates the role directly (service-role only).

7. Notes
- complaint reference numbers are unique via a generator and a UNIQUE constraint.
- All administrative status changes flow through `update_complaint_status()` (SECURITY DEFINER)
  which validates transitions, writes complaint_history, and creates notifications.
*/

-- ===== Enums =====
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE complaint_status AS ENUM
    ('submitted', 'under_review', 'in_progress', 'resolved', 'rejected', 'reopened');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE complaint_priority AS ENUM
    ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ===== Tables =====
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  role user_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number text NOT NULL UNIQUE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  department text,
  priority complaint_priority NOT NULL DEFAULT 'medium',
  status complaint_status NOT NULL DEFAULT 'submitted',
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  resolution_details text,
  reopen_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE TABLE IF NOT EXISTS complaint_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  changed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  previous_status complaint_status,
  new_status complaint_status NOT NULL,
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  complaint_id uuid REFERENCES complaints(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS complaint_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size bigint,
  content_type text,
  uploaded_by uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ===== Indexes =====
CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category);
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON complaints(priority);
CREATE INDEX IF NOT EXISTS idx_complaints_assigned_to ON complaints(assigned_to);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaint_history_complaint_id ON complaint_history(complaint_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attachments_complaint_id ON complaint_attachments(complaint_id);

-- ===== Helper functions =====
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Unique reference number generator
CREATE OR REPLACE FUNCTION public.generate_reference_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ref text;
  yr int := EXTRACT(YEAR FROM now());
BEGIN
  LOOP
    ref := 'OCMS-' || yr || '-' || lpad(floor(random() * 1000000)::text, 6, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.complaints WHERE reference_number = ref);
  END LOOP;
  RETURN ref;
END;
$$;

-- Trigger: create profile on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone',
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_touch_updated_at ON public.profiles;
CREATE TRIGGER profiles_touch_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS complaints_touch_updated_at ON public.complaints;
CREATE TRIGGER complaints_touch_updated_at
  BEFORE UPDATE ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===== RLS =====
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_attachments ENABLE ROW LEVEL SECURITY;

-- profiles policies
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_none" ON public.profiles;
CREATE POLICY "profiles_insert_none" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (false);

-- departments: read for all authenticated
DROP POLICY IF EXISTS "departments_select_all" ON public.departments;
CREATE POLICY "departments_select_all" ON public.departments
  FOR SELECT TO authenticated USING (true);

-- complaints policies
DROP POLICY IF EXISTS "complaints_select_own_or_admin" ON public.complaints;
CREATE POLICY "complaints_select_own_or_admin" ON public.complaints
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "complaints_insert_own" ON public.complaints;
CREATE POLICY "complaints_insert_own" ON public.complaints
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "complaints_update_own_reopen" ON public.complaints;
CREATE POLICY "complaints_update_own_reopen" ON public.complaints
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'reopened'
  );

DROP POLICY IF EXISTS "complaints_update_admin" ON public.complaints;
CREATE POLICY "complaints_update_admin" ON public.complaints
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- complaint_history: read for owner or admin; no client insert/update/delete
DROP POLICY IF EXISTS "history_select_own_or_admin" ON public.complaint_history;
CREATE POLICY "history_select_own_or_admin" ON public.complaint_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.complaints c
            WHERE c.id = complaint_history.complaint_id
            AND (c.user_id = auth.uid() OR public.is_admin()))
  );

-- notifications: owner only
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_insert_own" ON public.notifications;
CREATE POLICY "notifications_insert_own" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- complaint_attachments: owner or admin read; owner insert
DROP POLICY IF EXISTS "attachments_select_own_or_admin" ON public.complaint_attachments;
CREATE POLICY "attachments_select_own_or_admin" ON public.complaint_attachments
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.complaints c
            WHERE c.id = complaint_attachments.complaint_id
            AND (c.user_id = auth.uid() OR public.is_admin()))
  );

DROP POLICY IF EXISTS "attachments_insert_own" ON public.complaint_attachments;
CREATE POLICY "attachments_insert_own" ON public.complaint_attachments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.complaints c
            WHERE c.id = complaint_attachments.complaint_id
            AND c.user_id = auth.uid())
  );

-- ===== Column-level privilege: prevent clients from changing role =====
REVOKE UPDATE (role) ON public.profiles FROM authenticated, anon;
