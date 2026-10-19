/*
# OCMS — admin status update function, seed data, storage bucket

1. SECURITY DEFINER function `update_complaint_status`
- Callable by authenticated users; internally checks is_admin() for admin actions.
- Validates status transitions, updates complaint, inserts complaint_history, creates notification.
- Used by the admin UI to change status/assignment/resolution with a single safe call.

2. Seed departments
- Infrastructure, Electricity, Water Supply, Sanitation, Internet and Network, Hostel, Academic, Safety.

3. Storage bucket
- `complaint-attachments` public bucket for complaint files.

4. Storage policies
- Authenticated users can upload to a path under their own user id.
- Anyone can read (public bucket for demo simplicity).
*/

-- ===== update_complaint_status() =====
CREATE OR REPLACE FUNCTION public.update_complaint_status(
  p_complaint_id uuid,
  p_new_status complaint_status,
  p_remarks text DEFAULT NULL,
  p_assigned_to uuid DEFAULT NULL,
  p_resolution_details text DEFAULT NULL,
  p_reopen_reason text DEFAULT NULL
)
RETURNS public.complaints
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_complaint public.complaints;
  v_prev complaint_status;
  v_actor uuid := auth.uid();
  v_is_admin boolean;
  v_msg text;
BEGIN
  SELECT * INTO v_complaint FROM public.complaints WHERE id = p_complaint_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Complaint not found';
  END IF;

  v_prev := v_complaint.status;
  SELECT public.is_admin() INTO v_is_admin;

  -- Admin-only transitions
  IF p_new_status IN ('under_review','in_progress','resolved','rejected') THEN
    IF NOT v_is_admin THEN
      RAISE EXCEPTION 'Only administrators can set status to %', p_new_status;
    END IF;
  END IF;

  -- User can reopen their own resolved complaint
  IF p_new_status = 'reopened' THEN
    IF v_complaint.user_id <> v_actor AND NOT v_is_admin THEN
      RAISE EXCEPTION 'You can only reopen your own complaint';
    END IF;
    IF v_complaint.status <> 'resolved' THEN
      RAISE EXCEPTION 'Only resolved complaints can be reopened';
    END IF;
  END IF;

  -- Apply update
  UPDATE public.complaints
  SET
    status = p_new_status,
    assigned_to = COALESCE(p_assigned_to, assigned_to),
    resolution_details = CASE WHEN p_resolution_details IS NOT NULL THEN p_resolution_details ELSE resolution_details END,
    reopen_reason = CASE WHEN p_new_status = 'reopened' THEN COALESCE(p_reopen_reason, reopen_reason) ELSE reopen_reason END,
    resolved_at = CASE WHEN p_new_status = 'resolved' THEN now() ELSE resolved_at END
  WHERE id = p_complaint_id
  RETURNING * INTO v_complaint;

  -- History row
  INSERT INTO public.complaint_history (complaint_id, changed_by, previous_status, new_status, remarks)
  VALUES (p_complaint_id, v_actor, v_prev, p_new_status, p_remarks);

  -- Notification to the complaint owner
  v_msg := CASE p_new_status
    WHEN 'under_review' THEN 'Your complaint is under review.'
    WHEN 'in_progress' THEN 'Work on your complaint is in progress.'
    WHEN 'resolved' THEN 'Your complaint has been resolved.'
    WHEN 'rejected' THEN 'Your complaint has been rejected.'
    WHEN 'reopened' THEN 'Your complaint has been reopened.'
    ELSE 'Your complaint status was updated.'
  END;
  IF p_remarks IS NOT NULL THEN
    v_msg := v_msg || ' Remarks: ' || p_remarks;
  END IF;

  INSERT INTO public.notifications (user_id, complaint_id, message)
  VALUES (v_complaint.user_id, p_complaint_id, v_msg);

  RETURN v_complaint;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_complaint_status(uuid, complaint_status, text, uuid, text, text) TO authenticated;

-- ===== Seed departments =====
INSERT INTO public.departments (name, description) VALUES
  ('Infrastructure', 'Buildings, roads, classrooms, and structural facilities'),
  ('Electricity', 'Power supply, wiring, and electrical infrastructure'),
  ('Water Supply', 'Drinking water, plumbing, and water distribution'),
  ('Sanitation', 'Cleaning, waste management, and hygiene'),
  ('Internet and Network', 'Campus network, WiFi, and connectivity'),
  ('Hostel', 'Hostel facilities, maintenance, and resident issues'),
  ('Academic', 'Academic processes, examinations, and coursework'),
  ('Safety', 'Harassment, campus safety, and security concerns')
ON CONFLICT (name) DO NOTHING;

-- ===== Storage bucket =====
INSERT INTO storage.buckets (id, name, public)
VALUES ('complaint-attachments', 'complaint-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- ===== Storage policies =====
DROP POLICY IF EXISTS "attachments_storage_read" ON storage.objects;
CREATE POLICY "attachments_storage_read" ON storage.objects
  FOR SELECT TO authenticated, anon
  USING (bucket_id = 'complaint-attachments');

DROP POLICY IF EXISTS "attachments_storage_insert" ON storage.objects;
CREATE POLICY "attachments_storage_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'complaint-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "attachments_storage_update" ON storage.objects;
CREATE POLICY "attachments_storage_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'complaint-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "attachments_storage_delete" ON storage.objects;
CREATE POLICY "attachments_storage_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'complaint-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
