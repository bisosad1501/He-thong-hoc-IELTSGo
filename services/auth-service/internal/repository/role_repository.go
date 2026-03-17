package repository

import (
	"database/sql"
	"fmt"

	"github.com/bisosad1501/DATN/services/auth-service/internal/models"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

type RoleRepository interface {
	FindByName(name string) (*models.Role, error)
	FindByUserID(userID uuid.UUID) ([]models.Role, error)
	AssignRoleToUser(userID uuid.UUID, roleID int, assignedBy *uuid.UUID) error
	RemoveRoleFromUser(userID uuid.UUID, roleID int) error
	AssignRole(userID uuid.UUID, roleID int) error
	RevokeRole(userID uuid.UUID, roleID int) error
}

type roleRepository struct {
	db *sqlx.DB
}

func NewRoleRepository(db *sqlx.DB) RoleRepository {
	return &roleRepository{db: db}
}

func (r *roleRepository) FindByName(name string) (*models.Role, error) {
	query := `SELECT id, name, display_name, description, created_at, updated_at FROM roles WHERE name = $1`

	var role models.Role
	err := r.db.Get(&role, query, name)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("role not found")
		}
		return nil, fmt.Errorf("failed to find role: %w", err)
	}

	return &role, nil
}

func (r *roleRepository) FindByUserID(userID uuid.UUID) ([]models.Role, error) {
	query := `
		SELECT r.id, r.name, r.display_name, r.description, r.created_at, r.updated_at
		FROM roles r
		INNER JOIN user_roles ur ON r.id = ur.role_id
		WHERE ur.user_id = $1
	`

	var roles []models.Role
	err := r.db.Select(&roles, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to find roles: %w", err)
	}

	return roles, nil
}

func (r *roleRepository) AssignRoleToUser(userID uuid.UUID, roleID int, assignedBy *uuid.UUID) error {
	query := `
		INSERT INTO user_roles (user_id, role_id, assigned_by)
		VALUES ($1, $2, $3)
		ON CONFLICT (user_id, role_id) DO NOTHING
	`

	_, err := r.db.Exec(query, userID, roleID, assignedBy)
	if err != nil {
		return fmt.Errorf("failed to assign role: %w", err)
	}

	return nil
}

func (r *roleRepository) RemoveRoleFromUser(userID uuid.UUID, roleID int) error {
	query := `DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2`

	_, err := r.db.Exec(query, userID, roleID)
	if err != nil {
		return fmt.Errorf("failed to remove role: %w", err)
	}

	return nil
}

// AssignRole assigns a role to a user (admin operation)
func (r *roleRepository) AssignRole(userID uuid.UUID, roleID int) error {
	return r.AssignRoleToUser(userID, roleID, nil)
}

// RevokeRole revokes a role from a user (admin operation)
func (r *roleRepository) RevokeRole(userID uuid.UUID, roleID int) error {
	return r.RemoveRoleFromUser(userID, roleID)
}
