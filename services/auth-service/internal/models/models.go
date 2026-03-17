package models

import (
	"time"

	"github.com/google/uuid"
)

// User represents a user in the system
type User struct {
	ID       uuid.UUID `db:"id" json:"id"`
	Email    string    `db:"email" json:"email"`
	Password *string   `db:"password_hash" json:"-"`
	Phone    *string   `db:"phone" json:"phone,omitempty"`

	// OAuth fields
	GoogleID      *string `db:"google_id" json:"google_id,omitempty"`
	OAuthProvider *string `db:"oauth_provider" json:"oauth_provider,omitempty"`

	IsActive        bool       `db:"is_active" json:"is_active"`
	IsVerified      bool       `db:"is_verified" json:"is_verified"`
	EmailVerifiedAt *time.Time `db:"email_verified_at" json:"email_verified_at,omitempty"`

	FailedLoginAttempts int        `db:"failed_login_attempts" json:"-"`
	LockedUntil         *time.Time `db:"locked_until" json:"-"`
	LastLoginAt         *time.Time `db:"last_login_at" json:"last_login_at,omitempty"`
	LastLoginIP         *string    `db:"last_login_ip" json:"-"`

	CreatedAt time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt time.Time  `db:"updated_at" json:"updated_at"`
	DeletedAt *time.Time `db:"deleted_at" json:"-"`

	// Computed field (not in database)
	Role string `db:"-" json:"role,omitempty"`
}

// Role represents a user role
type Role struct {
	ID          int       `db:"id" json:"id"`
	Name        string    `db:"name" json:"name"`
	DisplayName string    `db:"display_name" json:"display_name"`
	Description string    `db:"description" json:"description"`
	CreatedAt   time.Time `db:"created_at" json:"created_at"`
	UpdatedAt   time.Time `db:"updated_at" json:"updated_at"`
}

// UserRole represents the many-to-many relationship between users and roles
type UserRole struct {
	ID         int        `db:"id" json:"id"`
	UserID     uuid.UUID  `db:"user_id" json:"user_id"`
	RoleID     int        `db:"role_id" json:"role_id"`
	AssignedAt time.Time  `db:"assigned_at" json:"assigned_at"`
	AssignedBy *uuid.UUID `db:"assigned_by" json:"assigned_by,omitempty"`
}

// Permission represents a permission
type Permission struct {
	ID          int       `db:"id" json:"id"`
	Name        string    `db:"name" json:"name"`
	Resource    string    `db:"resource" json:"resource"`
	Action      string    `db:"action" json:"action"`
	Description string    `db:"description" json:"description"`
	CreatedAt   time.Time `db:"created_at" json:"created_at"`
}

// RefreshToken represents a refresh token for JWT authentication
type RefreshToken struct {
	ID        uuid.UUID `db:"id" json:"id"`
	UserID    uuid.UUID `db:"user_id" json:"user_id"`
	TokenHash string    `db:"token_hash" json:"-"`

	DeviceID   *string `db:"device_id" json:"device_id,omitempty"`
	DeviceName *string `db:"device_name" json:"device_name,omitempty"`
	DeviceType *string `db:"device_type" json:"device_type,omitempty"`
	UserAgent  *string `db:"user_agent" json:"-"`
	IPAddress  *string `db:"ip_address" json:"ip_address,omitempty"`

	ExpiresAt     time.Time  `db:"expires_at" json:"expires_at"`
	RevokedAt     *time.Time `db:"revoked_at" json:"revoked_at,omitempty"`
	RevokedBy     *uuid.UUID `db:"revoked_by" json:"-"`
	RevokedReason *string    `db:"revoked_reason" json:"-"`

	CreatedAt  time.Time `db:"created_at" json:"created_at"`
	LastUsedAt time.Time `db:"last_used_at" json:"last_used_at"`
}

// AuditLog represents an audit log entry
type AuditLog struct {
	ID           int64      `db:"id" json:"id"`
	UserID       *uuid.UUID `db:"user_id" json:"user_id,omitempty"`
	EventType    string     `db:"event_type" json:"event_type"`
	EventStatus  string     `db:"event_status" json:"event_status"`
	IPAddress    *string    `db:"ip_address" json:"ip_address,omitempty"`
	UserAgent    *string    `db:"user_agent" json:"-"`
	DeviceInfo   *string    `db:"device_info" json:"device_info,omitempty"`
	Metadata     *string    `db:"metadata" json:"metadata,omitempty"`
	ErrorMessage *string    `db:"error_message" json:"error_message,omitempty"`
	CreatedAt    time.Time  `db:"created_at" json:"created_at"`
}

// PasswordResetToken represents a password reset token
type PasswordResetToken struct {
	ID        uuid.UUID  `db:"id" json:"id"`
	UserID    uuid.UUID  `db:"user_id" json:"user_id"`
	TokenHash string     `db:"token_hash" json:"-"`
	Code      *string    `db:"code" json:"code,omitempty"`
	ExpiresAt time.Time  `db:"expires_at" json:"expires_at"`
	UsedAt    *time.Time `db:"used_at" json:"used_at,omitempty"`
	CreatedAt time.Time  `db:"created_at" json:"created_at"`
}

// EmailVerificationToken represents an email verification token
type EmailVerificationToken struct {
	ID         uuid.UUID  `db:"id" json:"id"`
	UserID     uuid.UUID  `db:"user_id" json:"user_id"`
	TokenHash  string     `db:"token_hash" json:"-"`
	Code       *string    `db:"code" json:"code,omitempty"`
	ExpiresAt  time.Time  `db:"expires_at" json:"expires_at"`
	VerifiedAt *time.Time `db:"verified_at" json:"verified_at,omitempty"`
	CreatedAt  time.Time  `db:"created_at" json:"created_at"`
}

// UserWithRoles represents a user with their roles
type UserWithRoles struct {
	User
	Roles []Role `json:"roles"`
}
