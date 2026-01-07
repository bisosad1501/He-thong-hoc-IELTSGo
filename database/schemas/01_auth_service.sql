-- ============================================================================
-- AUTH SERVICE DATABASE SCHEMA (CLEAN VERSION)
-- ============================================================================
-- Database: auth_db
-- Purpose: Authentication, authorization, and user management
-- Version: 1.0
-- Last Updated: 2025-11-06
--
-- IMPORTANT: This is a CLEAN schema file that creates the database from scratch.
-- It is NOT a migration file. Use this to:
--   1. Create a new auth_db database
--   2. Understand the current schema structure
--   3. Document the database design
--
-- DO NOT use this file to update an existing database.
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

-- UUID generation for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cryptographic functions for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Text similarity search for audit logs
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Cross-database queries support
CREATE EXTENSION IF NOT EXISTS "dblink";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Users Table
-- ----------------------------------------------------------------------------
-- Main user accounts table with support for both email/password and OAuth
-- Includes security features: account locking, login tracking, soft delete
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255), -- NULL for OAuth users
    phone VARCHAR(20),
    google_id VARCHAR(255), -- For Google OAuth
    oauth_provider VARCHAR(50), -- 'google', 'facebook', etc.
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP, -- Account lockout timestamp
    last_login_at TIMESTAMP,
    last_login_ip VARCHAR(45), -- Supports both IPv4 and IPv6
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP -- Soft delete support
);

-- Indexes for users table
CREATE UNIQUE INDEX idx_users_email_unique ON users(email) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_users_phone_unique ON users(phone) WHERE phone IS NOT NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX idx_users_google_id_unique ON users(google_id) WHERE google_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_users_active ON users(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created_at ON users(created_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_oauth_provider ON users(oauth_provider) WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- Roles Table
-- ----------------------------------------------------------------------------
-- Role definitions for RBAC (Role-Based Access Control)
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'student', 'instructor', 'admin'
    display_name VARCHAR(100) NOT NULL, -- Localized display name
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- Permissions Table
-- ----------------------------------------------------------------------------
-- Permission definitions for fine-grained access control
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'view_courses', 'manage_users'
    resource VARCHAR(50) NOT NULL, -- Resource type: 'courses', 'users', 'exercises'
    action VARCHAR(50) NOT NULL, -- Action type: 'read', 'create', 'update', 'delete', 'manage'
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- RELATIONSHIP TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- User Roles Table
-- ----------------------------------------------------------------------------
-- Many-to-many relationship between users and roles
CREATE TABLE user_roles (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES users(id), -- Who assigned this role
    UNIQUE(user_id, role_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);

-- ----------------------------------------------------------------------------
-- Role Permissions Table
-- ----------------------------------------------------------------------------
-- Many-to-many relationship between roles and permissions
CREATE TABLE role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission_id)
);

-- ============================================================================
-- TOKEN MANAGEMENT TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Refresh Tokens Table
-- ----------------------------------------------------------------------------
-- JWT refresh tokens with device tracking and revocation support
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL, -- SHA-256 hash of the refresh token
    device_id VARCHAR(255), -- Unique device identifier
    device_name VARCHAR(100), -- User-friendly device name
    device_type VARCHAR(50), -- 'mobile', 'desktop', 'tablet'
    user_agent TEXT,
    ip_address VARCHAR(45),
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP, -- When token was revoked
    revoked_by UUID REFERENCES users(id), -- Who revoked it
    revoked_reason VARCHAR(255), -- Why it was revoked
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- ----------------------------------------------------------------------------
-- Password Reset Tokens Table
-- ----------------------------------------------------------------------------
-- One-time tokens for password reset flow
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL, -- SHA-256 hash of the reset token
    code VARCHAR(6), -- Optional 6-digit verification code
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP, -- When token was used
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_password_reset_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_token_hash ON password_reset_tokens(token_hash);
CREATE INDEX idx_password_reset_code ON password_reset_tokens(code) WHERE used_at IS NULL;

-- ----------------------------------------------------------------------------
-- Email Verification Tokens Table
-- ----------------------------------------------------------------------------
-- One-time tokens for email verification
CREATE TABLE email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL, -- SHA-256 hash of the verification token
    code VARCHAR(6), -- Optional 6-digit verification code
    expires_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP, -- When email was verified
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_verification_user_id ON email_verification_tokens(user_id);
CREATE INDEX idx_email_verification_token_hash ON email_verification_tokens(token_hash);
CREATE INDEX idx_email_verification_code ON email_verification_tokens(code) WHERE verified_at IS NULL;

-- ============================================================================
-- AUDIT AND LOGGING
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Audit Logs Table
-- ----------------------------------------------------------------------------
-- Comprehensive audit trail for security events
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL, -- 'login', 'logout', 'password_change', etc.
    event_status VARCHAR(20) NOT NULL, -- 'success', 'failure'
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_info JSONB, -- Additional device information
    metadata JSONB, -- Additional event-specific data
    error_message TEXT, -- Error details for failed events
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Auto-update updated_at timestamp
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at column
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Cleanup expired tokens
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    -- Delete expired refresh tokens
    DELETE FROM refresh_tokens WHERE expires_at < CURRENT_TIMESTAMP;
    
    -- Delete used/expired password reset tokens
    DELETE FROM password_reset_tokens
    WHERE expires_at < CURRENT_TIMESTAMP OR used_at IS NOT NULL;
    
    -- Delete verified/expired email verification tokens
    DELETE FROM email_verification_tokens
    WHERE expires_at < CURRENT_TIMESTAMP OR verified_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Default Roles
-- ----------------------------------------------------------------------------
INSERT INTO roles (name, display_name, description) VALUES
    ('student', 'Học viên', 'Người dùng học IELTS trên nền tảng'),
    ('instructor', 'Giảng viên', 'Người tạo và quản lý nội dung học liệu'),
    ('admin', 'Quản trị viên', 'Quản trị toàn bộ hệ thống');

-- ----------------------------------------------------------------------------
-- Default Permissions
-- ----------------------------------------------------------------------------
INSERT INTO permissions (name, resource, action, description) VALUES
    -- Student permissions
    ('view_courses', 'courses', 'read', 'View course catalog and enrolled courses'),
    ('enroll_course', 'courses', 'create', 'Enroll in courses'),
    ('submit_exercise', 'exercises', 'create', 'Submit exercise answers'),
    ('view_own_progress', 'progress', 'read', 'View own learning progress'),
    
    -- Instructor permissions
    ('manage_courses', 'courses', 'manage', 'Create, update, and delete courses'),
    ('manage_exercises', 'exercises', 'manage', 'Create, update, and delete exercises'),
    ('view_student_progress', 'progress', 'read', 'View student progress in their courses'),
    
    -- Admin permissions
    ('manage_users', 'users', 'manage', 'Manage user accounts and roles'),
    ('manage_system', 'system', 'manage', 'Configure system settings'),
    ('view_analytics', 'analytics', 'read', 'View system analytics and reports');

-- ----------------------------------------------------------------------------
-- Role-Permission Mappings
-- ----------------------------------------------------------------------------
-- Student role permissions (1-4)
INSERT INTO role_permissions (role_id, permission_id) VALUES
    (1, 1), (1, 2), (1, 3), (1, 4);

-- Instructor role permissions (1-7: student + instructor permissions)
INSERT INTO role_permissions (role_id, permission_id) VALUES
    (2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2, 6), (2, 7);

-- Admin role permissions (5-10: instructor + admin-only permissions, NO student-only permissions)
-- Admins do NOT have permissions 1-4 to prevent them from acting as students
-- This enforces proper role separation: admins manage, students learn
INSERT INTO role_permissions (role_id, permission_id) VALUES
    (3, 5), (3, 6), (3, 7), (3, 8), (3, 9), (3, 10);

-- ============================================================================
-- SCHEMA MIGRATIONS TRACKING
-- ============================================================================

CREATE TABLE schema_migrations (
    id SERIAL PRIMARY KEY,
    version VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO schema_migrations (version) VALUES ('001_initial_schema');

-- ============================================================================
-- END OF AUTH SERVICE SCHEMA
-- ============================================================================
