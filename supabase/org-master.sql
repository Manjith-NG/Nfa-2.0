-- =============================================================================
-- Org master SEED data (departments, designations, employee positions)
--
-- PREREQUISITE: Run schema.sql first — it creates users, designations, etc.
-- Do NOT run the old version of this file that used ALTER TABLE users.
--
-- Run order:
--   1. schema.sql
--   2. seed-master-data.sql   (roles, statuses, sample depts/clubs)
--   3. org-master.sql         (this file — full dept/designation/position lists)
--   4. naac-metrics.sql       (optional)
-- =============================================================================

-- Departments (19)
INSERT INTO departments (id, code, name) VALUES
  ('dept_admin', 'ADMIN', 'Administration'),
  ('dept_comm', 'COMM', 'Commerce'),
  ('dept_cs', 'CS', 'Computer Science'),
  ('dept_dom', 'DOM', 'Dean Of Management'),
  ('dept_em', 'EM', 'Electronic Media'),
  ('dept_eng', 'ENG', 'Engineering'),
  ('dept_english', 'ENGLISH', 'English'),
  ('dept_exam', 'EXAM', 'Examination Office'),
  ('dept_fad', 'FAD', 'Fashion & Apparel Design'),
  ('dept_fs', 'FS', 'Forensic Sciences'),
  ('dept_hm', 'HM', 'Hotel Management'),
  ('dept_iqac', 'IQAC_OFF', 'IQAC Office'),
  ('dept_lib', 'LIB', 'Library'),
  ('dept_ls', 'LS', 'Life Science'),
  ('dept_mgmt', 'MGMT', 'Management'),
  ('dept_phy', 'PHY', 'Physiotherapy'),
  ('dept_plac', 'PLAC', 'Placements'),
  ('dept_psy', 'PSY', 'Psychology'),
  ('dept_reg', 'REG_OFF', 'Registrar Office')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

-- Designations
INSERT INTO designations (id, code, name, "sortOrder") VALUES
  ('des_chancellor', 'CHANCELLOR', 'Chancellor', 0),
  ('des_vc', 'VICE_CHANCELLOR', 'Vice Chancellor', 1),
  ('des_pro_vc', 'PRO_VC', 'Pro Vice Chancellor', 2),
  ('des_registrar', 'REGISTRAR', 'Registrar', 3),
  ('des_coe', 'COE', 'Controller of Examination', 4),
  ('des_dean', 'DEAN', 'Dean', 5),
  ('des_hod', 'HOD', 'HOD', 6),
  ('des_iqac', 'IQAC', 'IQAC', 7),
  ('des_pmseb', 'PMSEB', 'PMSEB', 8),
  ('des_librarian', 'LIBRARIAN', 'Librarian', 9),
  ('des_faculty', 'FACULTY', 'Faculty', 10)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, "sortOrder" = EXCLUDED."sortOrder";

-- Employee positions
INSERT INTO employee_positions (id, code, name, "sortOrder") VALUES
  ('pos_chancellor', 'CHANCELLOR', 'Chancellor', 0),
  ('pos_vc', 'VICE_CHANCELLOR', 'Vice Chancellor', 1),
  ('pos_pro_vc', 'PRO_VC', 'Pro Vice Chancellor', 2),
  ('pos_registrar', 'REGISTRAR', 'Registrar', 3),
  ('pos_coe', 'COE', 'Controller of Examinations', 4),
  ('pos_dean', 'DEAN', 'Dean', 5),
  ('pos_director_phy', 'DIRECTOR_PHYSIO', 'Director Physiocare', 6),
  ('pos_prof', 'PROFESSOR', 'Professor', 7),
  ('pos_assoc_prof', 'ASSOC_PROFESSOR', 'Associate Professor', 8),
  ('pos_asst_prof', 'ASST_PROFESSOR', 'Assistant Professor', 9),
  ('pos_sen_lect', 'SENIOR_LECTURER', 'Senior Lecturer', 10),
  ('pos_lect', 'LECTURER', 'Lecturer', 11),
  ('pos_ta', 'TEACHING_ASST', 'Teaching Assistant', 12),
  ('pos_asst', 'ASSISTANT', 'Assistant', 13),
  ('pos_librarian', 'LIBRARIAN', 'Librarian', 14),
  ('pos_placement', 'PLACEMENT_CELL', 'Placement Cell', 15)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, "sortOrder" = EXCLUDED."sortOrder";
