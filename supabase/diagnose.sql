-- Run this in Supabase SQL Editor to see what exists
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected after a FULL setup includes at least:
--   roles, departments, users, designations, employee_positions, clubs, requests, ...
