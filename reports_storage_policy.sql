-- =====================================================================
-- Storage RLS for the "reports" bucket.
--
-- storage.objects has its own RLS, separate from your public.* table
-- policies. Creating the "reports" bucket (even as Public) does NOT by
-- itself grant permission to upload into it — Public only affects
-- anonymous read access. Without this, ReportsAdmin.jsx's upload call
-- (src/lib/storage.js -> uploadReportFile) fails silently or with a
-- permission/RLS error, and "Generate sales report" won't work.
--
-- Run this in the Supabase SQL editor. Idempotent — safe to re-run.
-- =====================================================================

drop policy if exists "reports_bucket_insert_admin" on storage.objects;
create policy "reports_bucket_insert_admin" on storage.objects for insert
  with check (bucket_id = 'reports' and public.my_role() = 'administrator');

drop policy if exists "reports_bucket_select_admin" on storage.objects;
create policy "reports_bucket_select_admin" on storage.objects for select
  using (bucket_id = 'reports' and public.my_role() = 'administrator');

-- If the bucket is marked Public in the dashboard, reads already bypass
-- RLS for anyone with the file's URL, so the select policy above is a
-- safety net for admin dashboard queries, not the only read path.

-- ---------------------------------------------------------------------
-- Verify (optional): run standalone.
-- ---------------------------------------------------------------------
-- select policyname, cmd from pg_policies
-- where schemaname = 'storage' and tablename = 'objects'
-- and policyname like 'reports_bucket%';
