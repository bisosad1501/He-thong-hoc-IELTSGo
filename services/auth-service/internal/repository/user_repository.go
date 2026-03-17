package repository

import (
	"database/sql"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/bisosad1501/DATN/services/auth-service/internal/models"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type UserRepository interface {
	Create(user *models.User) error
	Delete(userID uuid.UUID) error
	FindByID(id uuid.UUID) (*models.User, error)
	FindByEmail(email string) (*models.User, error)
	FindByGoogleID(googleID string) (*models.User, error)
	FindOrCreateByGoogleID(googleID, email, name string) (*models.User, error)
	Update(user *models.User) error
	UpdateLoginInfo(userID uuid.UUID, ip string) error
	IncrementFailedAttempts(userID uuid.UUID) error
	ResetFailedAttempts(userID uuid.UUID) error
	LockAccount(userID uuid.UUID, duration time.Duration) error
	IsAccountLocked(userID uuid.UUID) (bool, error)
	ListUsers(offset, limit int, role, status, search string) ([]*models.User, int, error)
}

type userRepository struct {
	db *sqlx.DB
}

func NewUserRepository(db *sqlx.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) Create(user *models.User) error {
	query := `
		INSERT INTO users (id, email, password_hash, phone, is_active, is_verified, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, created_at, updated_at
	`

	now := time.Now()
	user.ID = uuid.New()
	user.CreatedAt = now
	user.UpdatedAt = now
	user.IsActive = true
	user.IsVerified = false

	err := r.db.QueryRowx(query,
		user.ID,
		user.Email,
		user.Password,
		user.Phone,
		user.IsActive,
		user.IsVerified,
		user.CreatedAt,
		user.UpdatedAt,
	).Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}

	return nil
}

func (r *userRepository) FindByID(id uuid.UUID) (*models.User, error) {
	query := `
		SELECT id, email, password_hash, phone, is_active, is_verified, email_verified_at,
		       failed_login_attempts, locked_until, last_login_at, last_login_ip,
		       created_at, updated_at, deleted_at
		FROM users
		WHERE id = $1 AND deleted_at IS NULL
	`

	var user models.User
	err := r.db.Get(&user, query, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to find user: %w", err)
	}

	return &user, nil
}

func (r *userRepository) FindByEmail(email string) (*models.User, error) {
	query := `
		SELECT id, email, password_hash, phone, google_id, oauth_provider, 
		       is_active, is_verified, email_verified_at,
		       failed_login_attempts, locked_until, last_login_at, last_login_ip,
		       created_at, updated_at, deleted_at
		FROM users
		WHERE email = $1 AND deleted_at IS NULL
	`

	var user models.User
	err := r.db.Get(&user, query, email)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to find user: %w", err)
	}

	return &user, nil
}

func (r *userRepository) FindByGoogleID(googleID string) (*models.User, error) {
	query := `
		SELECT id, email, password_hash, phone, google_id, oauth_provider,
		       is_active, is_verified, email_verified_at,
		       failed_login_attempts, locked_until, last_login_at, last_login_ip,
		       created_at, updated_at, deleted_at
		FROM users
		WHERE google_id = $1 AND deleted_at IS NULL
	`

	var user models.User
	err := r.db.Get(&user, query, googleID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to find user: %w", err)
	}

	return &user, nil
}

func (r *userRepository) FindOrCreateByGoogleID(googleID, email, name string) (*models.User, error) {
	// Try to find existing user
	log.Printf("[FindOrCreateByGoogleID] Searching for Google ID: %s", googleID)
	user, err := r.FindByGoogleID(googleID)
	if err == nil {
		log.Printf("[FindOrCreateByGoogleID] Found existing user by Google ID: %s", user.ID)
		return user, nil
	}
	log.Printf("[FindOrCreateByGoogleID] No user found by Google ID, checking email: %s", email)

	// Check if user exists with this email (non-Google account)
	existingUser, err := r.FindByEmail(email)
	if err == nil {
		log.Printf("[FindOrCreateByGoogleID] Found existing user by email: ID=%s, GoogleID=%v", existingUser.ID, existingUser.GoogleID)
		if existingUser.GoogleID == nil {
			log.Printf("[FindOrCreateByGoogleID] Linking Google ID to existing account...")
			// Link Google ID to existing account
			query := `
                UPDATE users 
                SET google_id = $1, oauth_provider = $2, is_verified = true, 
                    email_verified_at = $3, updated_at = $4
                WHERE id = $5
                RETURNING id, email, password_hash, phone, google_id, oauth_provider,
                          is_active, is_verified, email_verified_at,
                          failed_login_attempts, locked_until, last_login_at, last_login_ip,
                          created_at, updated_at, deleted_at
            `
			now := time.Now()
			provider := "google"
			err := r.db.Get(existingUser, query, googleID, provider, now, now, existingUser.ID)
			if err != nil {
				log.Printf("[FindOrCreateByGoogleID] ❌ Failed to link: %v", err)
				return nil, fmt.Errorf("failed to link Google account: %w", err)
			}
			log.Printf("[FindOrCreateByGoogleID] ✅ Successfully linked Google ID to existing account")
			return existingUser, nil
		}
		// Already linked to Google; return existing user instead of attempting to create duplicate
		log.Printf("[FindOrCreateByGoogleID] ⚠️ User already has Google ID: %v", existingUser.GoogleID)
		return existingUser, nil
	}
	// No user found by email; proceed to create a new Google user
	log.Printf("[FindOrCreateByGoogleID] No user found by email, creating new user...")

	// Create new user
	log.Printf("[FindOrCreateByGoogleID] Creating new user with email: %s, Google ID: %s", email, googleID)
	query := `
		INSERT INTO users (id, email, google_id, oauth_provider, is_active, is_verified,
		                   email_verified_at, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
		RETURNING id, email, password_hash, phone, google_id, oauth_provider,
		          is_active, is_verified, email_verified_at,
		          failed_login_attempts, locked_until, last_login_at, last_login_ip,
		          created_at, updated_at, deleted_at
	`

	now := time.Now()
	newUserID := uuid.New()
	newUser := &models.User{}
	err = r.db.Get(newUser, query,
		newUserID, // $1 - id
		email,     // $2 - email
		googleID,  // $3 - google_id
		"google",  // $4 - oauth_provider
		true,      // $5 - is_active
		true,      // $6 - is_verified
		now,       // $7 - email_verified_at
		now,       // $8 - created_at AND updated_at (reused)
	)

	if err != nil {
		log.Printf("[FindOrCreateByGoogleID] ❌ Failed to create user: %v", err)
		// Handle duplicate email: link Google ID to existing account and return it
		if strings.Contains(err.Error(), "idx_users_email_unique") || strings.Contains(strings.ToLower(err.Error()), "duplicate key value") {
			log.Printf("[FindOrCreateByGoogleID] 🔄 Detected duplicate email, attempting to link to existing account")
			existingUserByEmail, err2 := r.FindByEmail(email)
			if err2 == nil && existingUserByEmail != nil {
				if existingUserByEmail.GoogleID == nil {
					log.Printf("[FindOrCreateByGoogleID] Linking Google ID to existing account after duplicate...")
					linkQuery := `
                        UPDATE users 
                        SET google_id = $1, oauth_provider = $2, is_verified = true, 
                            email_verified_at = $3, updated_at = $4
                        WHERE id = $5
                        RETURNING id, email, password_hash, phone, google_id, oauth_provider,
                                  is_active, is_verified, email_verified_at,
                                  failed_login_attempts, locked_until, last_login_at, last_login_ip,
                                  created_at, updated_at, deleted_at
                    `
					now2 := time.Now()
					provider := "google"
					if err3 := r.db.Get(existingUserByEmail, linkQuery, googleID, provider, now2, now2, existingUserByEmail.ID); err3 != nil {
						log.Printf("[FindOrCreateByGoogleID] ❌ Failed to link after duplicate: %v", err3)
						return nil, fmt.Errorf("failed to link Google account: %w", err3)
					}
					log.Printf("[FindOrCreateByGoogleID] ✅ Successfully linked Google ID to existing account after duplicate")
					return existingUserByEmail, nil
				}
				// Already linked; return existing user
				log.Printf("[FindOrCreateByGoogleID] ⚠️ Existing account already linked to Google, returning existing user")
				return existingUserByEmail, nil
			}
			log.Printf("[FindOrCreateByGoogleID] ⚠️ Could not fetch existing account by email after duplicate: %v", err2)
		}
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	log.Printf("[FindOrCreateByGoogleID] ✅ Successfully created new user: %s", newUser.ID)
	return newUser, nil
}

func (r *userRepository) Update(user *models.User) error {
	query := `
		UPDATE users
		SET email = $2, password_hash = $3, phone = $4, is_active = $5, 
		    is_verified = $6, email_verified_at = $7, updated_at = $8
		WHERE id = $1 AND deleted_at IS NULL
	`

	user.UpdatedAt = time.Now()

	// Use the existing password hash from the user object
	// This should be preserved from FindByID
	var passwordHash string
	if user.Password != nil {
		passwordHash = *user.Password
	}

	_, err := r.db.Exec(query,
		user.ID,
		user.Email,
		passwordHash,
		user.Phone,
		user.IsActive,
		user.IsVerified,
		user.EmailVerifiedAt,
		user.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}

	return nil
}

func (r *userRepository) UpdateLoginInfo(userID uuid.UUID, ip string) error {
	query := `
		UPDATE users
		SET last_login_at = $2, last_login_ip = $3, updated_at = $4
		WHERE id = $1
	`

	now := time.Now()
	_, err := r.db.Exec(query, userID, now, ip, now)
	if err != nil {
		return fmt.Errorf("failed to update login info: %w", err)
	}

	return nil
}

func (r *userRepository) IncrementFailedAttempts(userID uuid.UUID) error {
	query := `
		UPDATE users
		SET failed_login_attempts = failed_login_attempts + 1, updated_at = $2
		WHERE id = $1
	`

	_, err := r.db.Exec(query, userID, time.Now())
	if err != nil {
		return fmt.Errorf("failed to increment failed attempts: %w", err)
	}

	return nil
}

func (r *userRepository) ResetFailedAttempts(userID uuid.UUID) error {
	query := `
		UPDATE users
		SET failed_login_attempts = 0, locked_until = NULL, updated_at = $2
		WHERE id = $1
	`

	_, err := r.db.Exec(query, userID, time.Now())
	if err != nil {
		return fmt.Errorf("failed to reset failed attempts: %w", err)
	}

	return nil
}

func (r *userRepository) LockAccount(userID uuid.UUID, duration time.Duration) error {
	query := `
		UPDATE users
		SET locked_until = $2, updated_at = $3
		WHERE id = $1
	`

	lockedUntil := time.Now().Add(duration)
	_, err := r.db.Exec(query, userID, lockedUntil, time.Now())
	if err != nil {
		return fmt.Errorf("failed to lock account: %w", err)
	}

	return nil
}

func (r *userRepository) IsAccountLocked(userID uuid.UUID) (bool, error) {
	query := `
		SELECT locked_until
		FROM users
		WHERE id = $1 AND deleted_at IS NULL
	`

	var lockedUntil sql.NullTime
	err := r.db.QueryRow(query, userID).Scan(&lockedUntil)
	if err != nil {
		return false, fmt.Errorf("failed to check account lock: %w", err)
	}

	if lockedUntil.Valid && lockedUntil.Time.After(time.Now()) {
		return true, nil
	}

	return false, nil
}

// Delete soft-deletes a user (for rollback scenarios)
func (r *userRepository) Delete(userID uuid.UUID) error {
	query := `
		UPDATE users
		SET deleted_at = CURRENT_TIMESTAMP
		WHERE id = $1 AND deleted_at IS NULL
	`

	result, err := r.db.Exec(query, userID)
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("user not found or already deleted")
	}

	return nil
}

// ListUsers returns a paginated list of users with filters
func (r *userRepository) ListUsers(offset, limit int, role, status, search string) ([]*models.User, int, error) {
	// Build WHERE clause with filters
	whereConditions := []string{"u.deleted_at IS NULL"}
	args := []interface{}{}
	argCount := 0

	// Build base query parts
	fromClause := "FROM users u"

	// Join with roles if role filter is specified
	if role != "" {
		fromClause += `
			LEFT JOIN user_roles ur ON u.id = ur.user_id
			LEFT JOIN roles r ON ur.role_id = r.id`
		argCount++
		whereConditions = append(whereConditions, fmt.Sprintf("r.name = $%d", argCount))
		args = append(args, role)
	}

	// Apply status filter
	if status != "" {
		switch status {
		case "active":
			argCount++
			whereConditions = append(whereConditions, fmt.Sprintf("u.is_active = $%d AND (u.locked_until IS NULL OR u.locked_until < NOW())", argCount))
			args = append(args, true)
		case "suspended":
			argCount++
			whereConditions = append(whereConditions, fmt.Sprintf("u.is_active = $%d", argCount))
			args = append(args, false)
		case "locked":
			whereConditions = append(whereConditions, "u.locked_until > NOW()")
		}
	}

	// Apply search filter
	if search != "" {
		argCount++
		searchPattern := "%" + search + "%"
		whereConditions = append(whereConditions, fmt.Sprintf("u.email ILIKE $%d", argCount))
		args = append(args, searchPattern)
	}

	// Combine WHERE conditions
	whereClause := "WHERE " + strings.Join(whereConditions, " AND ")

	// Count query
	countQuery := fmt.Sprintf("SELECT COUNT(DISTINCT u.id) %s %s", fromClause, whereClause)
	var total int
	err := r.db.Get(&total, countQuery, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count users: %w", err)
	}

	// Select query with pagination
	argCount++
	limitArg := argCount
	args = append(args, limit)

	argCount++
	offsetArg := argCount
	args = append(args, offset)

	selectQuery := fmt.Sprintf(`
		SELECT DISTINCT u.id, u.email, u.password_hash, u.phone, u.is_active, u.is_verified,
		       u.email_verified_at, u.failed_login_attempts, u.locked_until,
		       u.last_login_at, u.last_login_ip, u.created_at, u.updated_at, u.deleted_at
		%s
		%s
		ORDER BY u.created_at DESC
		LIMIT $%d OFFSET $%d`,
		fromClause, whereClause, limitArg, offsetArg)

	var users []*models.User
	err = r.db.Select(&users, selectQuery, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list users: %w", err)
	}

	return users, total, nil
}
