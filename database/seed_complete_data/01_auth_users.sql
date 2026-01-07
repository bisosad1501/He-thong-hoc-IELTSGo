-- ============================================
-- PHASE 1: AUTH_DB - USERS, ROLES, PERMISSIONS
-- ============================================
-- Purpose: Create foundation users for testing
-- Database: auth_db
-- 
-- Creates:
-- - 70 users (50 students, 15 instructors, 5 admins)
-- - Role assignments
-- - Verified accounts
-- ============================================

-- ============================================
-- 1. USERS (Auth DB)
-- ============================================

-- Note: Password hash is for "password123" using bcrypt with pgcrypto crypt() function
-- For testing: password = "password123" for ALL users
-- IMPORTANT: Ensure pgcrypto extension is available before running this script

-- Ensure pgcrypto extension is available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO users (id, email, password_hash, phone, is_active, is_verified, email_verified_at, created_at) VALUES
-- Admins (5)
('a0000001-0000-0000-0000-000000000001'::uuid, 'admin@ieltsplatform.com', crypt('password123', gen_salt('bf', 10)), '+84901234567', true, true, NOW(), NOW() - INTERVAL '365 days'),
('a0000002-0000-0000-0000-000000000002'::uuid, 'admin2@ieltsplatform.com', crypt('password123', gen_salt('bf', 10)), '+84901234568', true, true, NOW(), NOW() - INTERVAL '300 days'),
('a0000003-0000-0000-0000-000000000003'::uuid, 'admin3@ieltsplatform.com', crypt('password123', gen_salt('bf', 10)), '+84901234569', true, true, NOW(), NOW() - INTERVAL '280 days'),
('a0000004-0000-0000-0000-000000000004'::uuid, 'admin4@ieltsplatform.com', crypt('password123', gen_salt('bf', 10)), '+84901234570', true, true, NOW(), NOW() - INTERVAL '250 days'),
('a0000005-0000-0000-0000-000000000005'::uuid, 'admin5@ieltsplatform.com', crypt('password123', gen_salt('bf', 10)), '+84901234571', true, true, NOW(), NOW() - INTERVAL '200 days'),

-- Instructors (15)
('b0000001-0000-0000-0000-000000000001'::uuid, 'sarah.mitchell@ieltsplatform.com', crypt('password123', gen_salt('bf', 10)), '+84901234572', true, true, NOW(), NOW() - INTERVAL '180 days'),
('b0000002-0000-0000-0000-000000000002'::uuid, 'james.anderson@ieltsplatform.com', crypt('password123', gen_salt('bf', 10)), '+84901234573', true, true, NOW(), NOW() - INTERVAL '175 days'),
('b0000003-0000-0000-0000-000000000003'::uuid, 'emma.thompson@ieltsplatform.com', crypt('password123', gen_salt('bf', 10)), '+84901234574', true, true, NOW(), NOW() - INTERVAL '170 days'),
('b0000004-0000-0000-0000-000000000004'::uuid, 'michael.chen@ieltsplatform.com', crypt('password123', gen_salt('bf', 10)), '+84901234575', true, true, NOW(), NOW() - INTERVAL '165 days'),
('b0000005-0000-0000-0000-000000000005'::uuid, 'david.miller@ieltsplatform.com', crypt('password123', gen_salt('bf', 10)), '+84901234576', true, true, NOW(), NOW() - INTERVAL '160 days'),
('b0000006-0000-0000-0000-000000000006'::uuid, 'robert.chen@ieltsplatform.com', crypt('password123', gen_salt('bf', 10)), '+84901234577', true, true, NOW(), NOW() - INTERVAL '155 days'),
('b0000007-0000-0000-0000-000000000007'::uuid, 'jennifer.lee@ieltsplatform.com', crypt('password123', gen_salt('bf', 10)), '+84901234578', true, true, NOW(), NOW() - INTERVAL '150 days'),
('b0000008-0000-0000-0000-000000000008'::uuid, 'emma.wilson@ieltsplatform.com', crypt('password123', gen_salt('bf', 10)), '+84901234579', true, true, NOW(), NOW() - INTERVAL '145 days'),
('b0000009-0000-0000-0000-000000000009'::uuid, 'sophie.brown@ieltsplatform.com', crypt('password123', gen_salt('bf', 10)), '+84901234580', true, true, NOW(), NOW() - INTERVAL '140 days'),
('b0000010-0000-0000-0000-000000000010'::uuid, 'mark.johnson@ieltsplatform.com', crypt('password123', gen_salt('bf', 10)), '+84901234581', true, true, NOW(), NOW() - INTERVAL '135 days'),
('b0000011-0000-0000-0000-000000000011'::uuid, 'patricia.williams@ieltsplatform.com', crypt('password123', gen_salt('bf', 10)), '+84901234582', true, true, NOW(), NOW() - INTERVAL '130 days'),
('b0000012-0000-0000-0000-000000000012'::uuid, 'daniel.kim@ieltsplatform.com', crypt('password123', gen_salt('bf', 10)), '+84901234583', true, true, NOW(), NOW() - INTERVAL '125 days'),
('b0000013-0000-0000-0000-000000000013'::uuid, 'alexandra.green@ieltsplatform.com', crypt('password123', gen_salt('bf', 10)), '+84901234584', true, true, NOW(), NOW() - INTERVAL '120 days'),
('b0000014-0000-0000-0000-000000000014'::uuid, 'rachel.taylor@ieltsplatform.com', crypt('password123', gen_salt('bf', 10)), '+84901234585', true, true, NOW(), NOW() - INTERVAL '115 days'),
('b0000015-0000-0000-0000-000000000015'::uuid, 'thomas.wright@ieltsplatform.com', crypt('password123', gen_salt('bf', 10)), '+84901234586', true, true, NOW(), NOW() - INTERVAL '110 days'),

-- Students (50) - Emails match real names from user_profiles
('f0000001-0000-0000-0000-000000000001'::uuid, 'minh.tran@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234587', true, true, NOW(), NOW() - INTERVAL '100 days'),
('f0000002-0000-0000-0000-000000000002'::uuid, 'lan.nguyen@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234588', true, true, NOW(), NOW() - INTERVAL '95 days'),
('f0000003-0000-0000-0000-000000000003'::uuid, 'duc.le@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234589', true, true, NOW(), NOW() - INTERVAL '90 days'),
('f0000004-0000-0000-0000-000000000004'::uuid, 'huyen.pham@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234590', true, true, NOW(), NOW() - INTERVAL '85 days'),
('f0000005-0000-0000-0000-000000000005'::uuid, 'khoa.hoang@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234591', true, true, NOW(), NOW() - INTERVAL '80 days'),
('f0000006-0000-0000-0000-000000000006'::uuid, 'thao.vo@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234592', true, true, NOW(), NOW() - INTERVAL '75 days'),
('f0000007-0000-0000-0000-000000000007'::uuid, 'nam.bui@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234593', true, true, NOW(), NOW() - INTERVAL '70 days'),
('f0000008-0000-0000-0000-000000000008'::uuid, 'mai.do@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234594', true, true, NOW(), NOW() - INTERVAL '65 days'),
('f0000009-0000-0000-0000-000000000009'::uuid, 'anh.tran@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234595', true, true, NOW(), NOW() - INTERVAL '60 days'),
('f0000010-0000-0000-0000-000000000010'::uuid, 'phuong.le@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234596', true, true, NOW(), NOW() - INTERVAL '55 days'),
('f0000011-0000-0000-0000-000000000011'::uuid, 'quang.nguyen@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234597', true, true, NOW(), NOW() - INTERVAL '50 days'),
('f0000012-0000-0000-0000-000000000012'::uuid, 'hung.tran@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234598', true, true, NOW(), NOW() - INTERVAL '45 days'),
('f0000013-0000-0000-0000-000000000013'::uuid, 'long.le@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234599', true, true, NOW(), NOW() - INTERVAL '40 days'),
('f0000014-0000-0000-0000-000000000014'::uuid, 'thanh.pham@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234600', true, true, NOW(), NOW() - INTERVAL '35 days'),
('f0000015-0000-0000-0000-000000000015'::uuid, 'dung.hoang@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234601', true, true, NOW(), NOW() - INTERVAL '30 days'),
('f0000016-0000-0000-0000-000000000016'::uuid, 'hai.vo@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234602', true, true, NOW(), NOW() - INTERVAL '25 days'),
('f0000017-0000-0000-0000-000000000017'::uuid, 'tuan.bui@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234603', true, true, NOW(), NOW() - INTERVAL '20 days'),
('f0000018-0000-0000-0000-000000000018'::uuid, 'cuong.do@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234604', true, true, NOW(), NOW() - INTERVAL '15 days'),
('f0000019-0000-0000-0000-000000000019'::uuid, 'kien.truong@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234605', true, true, NOW(), NOW() - INTERVAL '10 days'),
('f0000020-0000-0000-0000-000000000020'::uuid, 'tien.dang@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234606', true, true, NOW(), NOW() - INTERVAL '5 days'),
('f0000021-0000-0000-0000-000000000021'::uuid, 'binh.ngo@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234607', true, true, NOW(), NOW() - INTERVAL '4 days'),
('f0000022-0000-0000-0000-000000000022'::uuid, 'dat.luu@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234608', true, true, NOW(), NOW() - INTERVAL '3 days'),
('f0000023-0000-0000-0000-000000000023'::uuid, 'hieu.ly@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234609', true, true, NOW(), NOW() - INTERVAL '2 days'),
('f0000024-0000-0000-0000-000000000024'::uuid, 'khang.vu@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234610', true, true, NOW(), NOW() - INTERVAL '1 day'),
('f0000025-0000-0000-0000-000000000025'::uuid, 'huy.dinh@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234611', true, false, NULL, NOW()),
('f0000026-0000-0000-0000-000000000026'::uuid, 'lam.dao@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234612', true, false, NULL, NOW()),
('f0000027-0000-0000-0000-000000000027'::uuid, 'loc.ho@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234613', true, false, NULL, NOW()),
('f0000028-0000-0000-0000-000000000028'::uuid, 'phuc.phan@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234614', true, false, NULL, NOW()),
('f0000029-0000-0000-0000-000000000029'::uuid, 'son.duong@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234615', true, false, NULL, NOW()),
('f0000030-0000-0000-0000-000000000030'::uuid, 'hoa.nguyen@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234616', true, false, NULL, NOW()),
('f0000031-0000-0000-0000-000000000031'::uuid, 'huong.tran@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234617', true, false, NULL, NOW()),
('f0000032-0000-0000-0000-000000000032'::uuid, 'ly.le@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234618', true, false, NULL, NOW()),
('f0000033-0000-0000-0000-000000000033'::uuid, 'nga.pham@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234619', true, false, NULL, NOW()),
('f0000034-0000-0000-0000-000000000034'::uuid, 'linh.hoang@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234620', true, false, NULL, NOW()),
('f0000035-0000-0000-0000-000000000035'::uuid, 'my.vo@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234621', true, false, NULL, NOW()),
('f0000036-0000-0000-0000-000000000036'::uuid, 'ngoc.bui@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234622', true, false, NULL, NOW()),
('f0000037-0000-0000-0000-000000000037'::uuid, 'thu.do@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234623', true, false, NULL, NOW()),
('f0000038-0000-0000-0000-000000000038'::uuid, 'trang.truong@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234624', true, false, NULL, NOW()),
('f0000039-0000-0000-0000-000000000039'::uuid, 'van.dang@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234625', true, false, NULL, NOW()),
('f0000040-0000-0000-0000-000000000040'::uuid, 'yen.ngo@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234626', true, false, NULL, NOW()),
('f0000041-0000-0000-0000-000000000041'::uuid, 'quynh.luu@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234627', true, false, NULL, NOW()),
('f0000042-0000-0000-0000-000000000042'::uuid, 'diem.ly@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234628', true, false, NULL, NOW()),
('f0000043-0000-0000-0000-000000000043'::uuid, 'giang.vu@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234629', true, false, NULL, NOW()),
('f0000044-0000-0000-0000-000000000044'::uuid, 'khanh.dinh@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234630', true, false, NULL, NOW()),
('f0000045-0000-0000-0000-000000000045'::uuid, 'ha.dao@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234631', true, false, NULL, NOW()),
('f0000046-0000-0000-0000-000000000046'::uuid, 'nhung.ho@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234632', true, false, NULL, NOW()),
('f0000047-0000-0000-0000-000000000047'::uuid, 'hong.phan@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234633', true, false, NULL, NOW()),
('f0000048-0000-0000-0000-000000000048'::uuid, 'bich.duong@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234634', true, false, NULL, NOW()),
('f0000049-0000-0000-0000-000000000049'::uuid, 'hanh.nguyen@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234635', true, false, NULL, NOW()),
('f0000050-0000-0000-0000-000000000050'::uuid, 'diep.tran@example.com', crypt('password123', gen_salt('bf', 10)), '+84901234636', true, false, NULL, NOW());

-- ============================================
-- 2. USER ROLES ASSIGNMENTS
-- ============================================

-- Assign admin role (role_id = 3)
INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES
('a0000001-0000-0000-0000-000000000001'::uuid, 3, NOW() - INTERVAL '365 days'),
('a0000002-0000-0000-0000-000000000002'::uuid, 3, NOW() - INTERVAL '300 days'),
('a0000003-0000-0000-0000-000000000003'::uuid, 3, NOW() - INTERVAL '280 days'),
('a0000004-0000-0000-0000-000000000004'::uuid, 3, NOW() - INTERVAL '250 days'),
('a0000005-0000-0000-0000-000000000005'::uuid, 3, NOW() - INTERVAL '200 days')
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Assign instructor role (role_id = 2)
INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES
('b0000001-0000-0000-0000-000000000001'::uuid, 2, NOW() - INTERVAL '180 days'),
('b0000002-0000-0000-0000-000000000002'::uuid, 2, NOW() - INTERVAL '175 days'),
('b0000003-0000-0000-0000-000000000003'::uuid, 2, NOW() - INTERVAL '170 days'),
('b0000004-0000-0000-0000-000000000004'::uuid, 2, NOW() - INTERVAL '165 days'),
('b0000005-0000-0000-0000-000000000005'::uuid, 2, NOW() - INTERVAL '160 days'),
('b0000006-0000-0000-0000-000000000006'::uuid, 2, NOW() - INTERVAL '155 days'),
('b0000007-0000-0000-0000-000000000007'::uuid, 2, NOW() - INTERVAL '150 days'),
('b0000008-0000-0000-0000-000000000008'::uuid, 2, NOW() - INTERVAL '145 days'),
('b0000009-0000-0000-0000-000000000009'::uuid, 2, NOW() - INTERVAL '140 days'),
('b0000010-0000-0000-0000-000000000010'::uuid, 2, NOW() - INTERVAL '135 days'),
('b0000011-0000-0000-0000-000000000011'::uuid, 2, NOW() - INTERVAL '130 days'),
('b0000012-0000-0000-0000-000000000012'::uuid, 2, NOW() - INTERVAL '125 days'),
('b0000013-0000-0000-0000-000000000013'::uuid, 2, NOW() - INTERVAL '120 days'),
('b0000014-0000-0000-0000-000000000014'::uuid, 2, NOW() - INTERVAL '115 days'),
('b0000015-0000-0000-0000-000000000015'::uuid, 2, NOW() - INTERVAL '110 days')
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Assign student role (role_id = 1) to all students ONLY
-- Admins and instructors do NOT get student role to maintain role separation
INSERT INTO user_roles (user_id, role_id, assigned_at)
SELECT 
    id,
    1,
    created_at
FROM users 
WHERE id::text LIKE 'f%'
ON CONFLICT (user_id, role_id) DO NOTHING;


-- Summary
SELECT 
    '✅ Phase 1 Complete: Users Created' as status,
    (SELECT COUNT(*) FROM users WHERE id::text LIKE 'a%') as admins,
    (SELECT COUNT(*) FROM users WHERE id::text LIKE 'b%') as instructors,
    (SELECT COUNT(*) FROM users WHERE id::text LIKE 'f%') as students,
    (SELECT COUNT(*) FROM user_roles) as total_role_assignments;

