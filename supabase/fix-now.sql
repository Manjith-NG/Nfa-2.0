-- =============================================================================
-- NFA 2.0 — RESET & FIX (Supabase SQL Editor)
-- Use when you get "relation users does not exist" or partial/failed migrations.
-- WARNING: Deletes ALL data in public schema. Dev/test only.
-- =============================================================================

DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- After this succeeds, run these files IN ORDER (new query each time):
--   1. schema.sql
--   2. seed-master-data.sql
--   3. org-master.sql
--   4. naac-metrics.sql   (optional)
