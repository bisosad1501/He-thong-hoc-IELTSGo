package middleware

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/bisosad1501/ielts-platform/exercise-service/internal/config"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type AuthMiddleware struct {
	jwtSecret string
}

type ErrorInfo struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
}

type Response struct {
	Success bool       `json:"success"`
	Error   *ErrorInfo `json:"error,omitempty"`
}

func NewAuthMiddleware(cfg *config.Config) *AuthMiddleware {
	return &AuthMiddleware{
		jwtSecret: cfg.JWTSecret,
	}
}

// AuthRequired validates JWT token and extracts user info
func (m *AuthMiddleware) AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, Response{
				Success: false,
				Error: &ErrorInfo{
					Code:    "NO_TOKEN",
					Message: "Authorization header required",
				},
			})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.JSON(http.StatusUnauthorized, Response{
				Success: false,
				Error: &ErrorInfo{
					Code:    "INVALID_TOKEN_FORMAT",
					Message: "Authorization header must be Bearer token",
				},
			})
			c.Abort()
			return
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(m.jwtSecret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, Response{
				Success: false,
				Error: &ErrorInfo{
					Code:    "INVALID_TOKEN",
					Message: "Invalid or expired token",
					Details: err.Error(),
				},
			})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, Response{
				Success: false,
				Error: &ErrorInfo{
					Code:    "INVALID_CLAIMS",
					Message: "Invalid token claims",
				},
			})
			c.Abort()
			return
		}

		c.Set("user_id", claims["user_id"])
		c.Set("email", claims["email"])
		c.Set("role", claims["role"])
		c.Next()
	}
}

// OptionalAuth validates token if present
func (m *AuthMiddleware) OptionalAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(m.jwtSecret), nil
		})

		if err == nil && token.Valid {
			if claims, ok := token.Claims.(jwt.MapClaims); ok {
				c.Set("user_id", claims["user_id"])
				c.Set("email", claims["email"])
				c.Set("role", claims["role"])
			}
		}
		c.Next()
	}
}

// RequireRole checks if user has specific role
func (m *AuthMiddleware) RequireRole(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		fmt.Printf("[RequireRole] Middleware called for path: %s\n", c.Request.URL.Path)
		role, exists := c.Get("role")
		if !exists {
			fmt.Printf("[RequireRole] Role not found in context\n")
			c.JSON(http.StatusForbidden, Response{
				Success: false,
				Error: &ErrorInfo{
					Code:    "NO_ROLE",
					Message: "User role not found",
				},
			})
			c.Abort()
			return
		}

		roleStr := role.(string)
		fmt.Printf("[RequireRole] User role: %s, allowed: %v\n", roleStr, allowedRoles)
		for _, allowedRole := range allowedRoles {
			if roleStr == allowedRole {
				fmt.Printf("[RequireRole] Role matched, allowing request\n")
				c.Next()
				return
			}
		}

		fmt.Printf("[RequireRole] Role not allowed, rejecting with 403\n")
		c.JSON(http.StatusForbidden, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "FORBIDDEN",
				Message: "Insufficient permissions",
			},
		})
		c.Abort()
	}
}
