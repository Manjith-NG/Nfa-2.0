-- =============================================================================
-- NFA 2.0 — Master data seed (roles, statuses, departments, clubs)
-- Run AFTER schema.sql
-- User passwords are created by: npm run db:seed (uses bcrypt in Node)
-- =============================================================================

-- Roles
INSERT INTO roles (id, code, name, permissions) VALUES
  ('role_faculty', 'FACULTY', 'Faculty', '[]'::jsonb),
  ('role_hod', 'HOD', 'Head of Department', '[]'::jsonb),
  ('role_club', 'CLUB_AUTHORITY', 'Club Authority', '[]'::jsonb),
  ('role_iqac', 'IQAC', 'IQAC', '[]'::jsonb),
  ('role_pmseb', 'PMSEB', 'PMSEB', '[]'::jsonb),
  ('role_hr', 'HR', 'Human Resources', '[]'::jsonb),
  ('role_coe', 'COE', 'Controller of Examinations', '[]'::jsonb),
  ('role_registrar', 'REGISTRAR', 'Registrar', '[]'::jsonb),
  ('role_ofc', 'OFC', 'OFC', '[]'::jsonb),
  ('role_admin', 'ADMIN', 'System Administrator', '[]'::jsonb)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

-- Request statuses
INSERT INTO status_master (id, code, label, color, "sortOrder") VALUES
  ('st_draft', 'DRAFT', 'Draft', '#64748b', 0),
  ('st_pending', 'PENDING', 'Pending', '#ea580c', 1),
  ('st_review', 'UNDER_REVIEW', 'Under Review', '#2563eb', 2),
  ('st_approved', 'APPROVED', 'Approved', '#16a34a', 3),
  ('st_rejected', 'REJECTED', 'Rejected', '#dc2626', 4),
  ('st_resend', 'RESEND', 'Resend', '#ca8a04', 5),
  ('st_forwarded', 'FORWARDED', 'Forwarded', '#7c3aed', 6),
  ('st_completed', 'COMPLETED', 'Completed', '#059669', 7)
ON CONFLICT (code) DO UPDATE SET label = EXCLUDED.label, color = EXCLUDED.color;

-- Departments
INSERT INTO departments (id, code, name) VALUES
  ('dept_cse', 'CSE', 'Computer Science & Engineering'),
  ('dept_mba', 'MBA', 'Master of Business Administration'),
  ('dept_ece', 'ECE', 'Electronics & Communication'),
  ('dept_mech', 'MECH', 'Mechanical Engineering')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

-- Clubs / committees
INSERT INTO clubs (id, code, name) VALUES
  ('club_sports', 'SPORTS', 'Sports Club'),
  ('club_pulse', 'PULSE', 'Pulse Club'),
  ('club_phd', 'PHD', 'PHD Committee'),
  ('club_coral', 'CORAL', 'Coral Anniversary Committee'),
  ('club_cultural', 'CULTURAL', 'Cultural Club'),
  ('club_research', 'RESEARCH', 'Research Club'),
  ('club_event', 'EVENT', 'Event Committee')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
