-- NFA demo seed (password for all users: password123)
-- Run: node scripts/generate-seed-hash.mjs  (do NOT paste bcrypt hashes manually — $ breaks in SQL)

INSERT INTO roles (id, code, name, permissions, "createdAt", "updatedAt") VALUES
('role_faculty', 'FACULTY', 'Faculty', '[]', NOW(), NOW()),
('role_hod', 'HOD', 'Head of Department', '[]', NOW(), NOW()),
('role_club', 'CLUB_AUTHORITY', 'Club Authority', '[]', NOW(), NOW()),
('role_iqac', 'IQAC', 'IQAC', '[]', NOW(), NOW()),
('role_pmseb', 'PMSEB', 'PMSEB', '[]', NOW(), NOW()),
('role_coe', 'COE', 'Controller of Examinations', '[]', NOW(), NOW()),
('role_registrar', 'REGISTRAR', 'Registrar', '[]', NOW(), NOW()),
('role_ofc', 'OFC', 'OFC', '[]', NOW(), NOW()),
('role_admin', 'ADMIN', 'System Admin', '[]', NOW(), NOW())
ON CONFLICT DO NOTHING;

INSERT INTO departments (id, code, name, "isActive", "createdAt", "updatedAt") VALUES
('dept_cse', 'CSE', 'Computer Science & Engineering', true, NOW(), NOW()),
('dept_mba', 'MBA', 'Master of Business Administration', true, NOW(), NOW()),
('dept_ece', 'ECE', 'Electronics & Communication', true, NOW(), NOW()),
('dept_mech', 'MECH', 'Mechanical Engineering', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

INSERT INTO clubs (id, code, name, "isActive", "createdAt", "updatedAt") VALUES
('club_sports', 'SPORTS', 'Sports Club', true, NOW(), NOW()),
('club_pulse', 'PULSE', 'Pulse Club', true, NOW(), NOW()),
('club_phd', 'PHD', 'PHD Committee', true, NOW(), NOW()),
('club_coral', 'CORAL', 'Coral Anniversary Committee', true, NOW(), NOW()),
('club_cultural', 'CULTURAL', 'Cultural Club', true, NOW(), NOW()),
('club_research', 'RESEARCH', 'Research Club', true, NOW(), NOW()),
('club_event', 'EVENT', 'Event Committee', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

INSERT INTO users (id, "employeeId", email, "passwordHash", "firstName", "lastName", "roleId", "departmentId", "isActive", "createdAt", "updatedAt") VALUES
('user_faculty', 'FAC001', 'faculty.cse@gcu.edu.in', '$2b$10$FIByqQAyShUKdqwOtEsleuKKRnjGQbiyiJuG6.c568zfXJeDpw11q', 'Raj', 'Kumar', 'role_faculty', 'dept_cse', true, NOW(), NOW()),
('user_hod', 'HOD001', 'hod.cse@gcu.edu.in', '$2b$10$FIByqQAyShUKdqwOtEsleuKKRnjGQbiyiJuG6.c568zfXJeDpw11q', 'Priya', 'Sharma', 'role_hod', 'dept_cse', true, NOW(), NOW()),
('user_club', 'CLUB001', 'club.sports@gcu.edu.in', '$2b$10$FIByqQAyShUKdqwOtEsleuKKRnjGQbiyiJuG6.c568zfXJeDpw11q', 'Amit', 'Verma', 'role_club', 'dept_cse', true, NOW(), NOW()),
('user_iqac', 'IQAC001', 'iqac@gcu.edu.in', '$2b$10$FIByqQAyShUKdqwOtEsleuKKRnjGQbiyiJuG6.c568zfXJeDpw11q', 'Sunita', 'Reddy', 'role_iqac', NULL, true, NOW(), NOW()),
('user_pmseb', 'PMSEB001', 'pmseb@gcu.edu.in', '$2b$10$FIByqQAyShUKdqwOtEsleuKKRnjGQbiyiJuG6.c568zfXJeDpw11q', 'Vikram', 'Singh', 'role_pmseb', NULL, true, NOW(), NOW()),
('user_coe', 'COE001', 'coe@gcu.edu.in', '$2b$10$FIByqQAyShUKdqwOtEsleuKKRnjGQbiyiJuG6.c568zfXJeDpw11q', 'Lakshmi', 'Nair', 'role_coe', NULL, true, NOW(), NOW()),
('user_registrar', 'REG001', 'registrar@gcu.edu.in', '$2b$10$FIByqQAyShUKdqwOtEsleuKKRnjGQbiyiJuG6.c568zfXJeDpw11q', 'Anil', 'Menon', 'role_registrar', NULL, true, NOW(), NOW()),
('user_ofc', 'OFC001', 'ofc@gcu.edu.in', '$2b$10$FIByqQAyShUKdqwOtEsleuKKRnjGQbiyiJuG6.c568zfXJeDpw11q', 'Deepa', 'Iyer', 'role_ofc', NULL, true, NOW(), NOW())
ON CONFLICT DO NOTHING;

UPDATE departments SET "hodId" = 'user_hod' WHERE id = 'dept_cse';

INSERT INTO club_authorities (id, "clubId", "userId", "isActive", "assignedAt") VALUES
('ca_sports', 'club_sports', 'user_club', true, NOW())
ON CONFLICT DO NOTHING;

INSERT INTO authority_mapping (id, "roleCode", "userId", "assignmentType", "isActive", "startDate", "createdAt", "updatedAt") VALUES
('am_iqac', 'IQAC', 'user_iqac', 'PERMANENT', true, NOW(), NOW(), NOW()),
('am_pmseb', 'PMSEB', 'user_pmseb', 'PERMANENT', true, NOW(), NOW(), NOW()),
('am_coe', 'COE', 'user_coe', 'PERMANENT', true, NOW(), NOW(), NOW()),
('am_registrar', 'REGISTRAR', 'user_registrar', 'PERMANENT', true, NOW(), NOW(), NOW()),
('am_ofc', 'OFC', 'user_ofc', 'PERMANENT', true, NOW(), NOW(), NOW())
ON CONFLICT DO NOTHING;
