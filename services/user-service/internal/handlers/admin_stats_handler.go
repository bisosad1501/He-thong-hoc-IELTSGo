package handlers

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type AdminStatsHandler struct {
	db *sql.DB
}

func NewAdminStatsHandler(db *sql.DB) *AdminStatsHandler {
	return &AdminStatsHandler{db: db}
}

// DashboardStats represents the main dashboard statistics
type DashboardStats struct {
	TotalUsers            int     `json:"total_users"`
	TotalStudents         int     `json:"total_students"`
	TotalInstructors      int     `json:"total_instructors"`
	TotalAdmins           int     `json:"total_admins"`
	UserGrowth            float64 `json:"user_growth"` // percentage
	TotalCourses          int     `json:"total_courses"`
	ActiveCourses         int     `json:"active_courses"`
	DraftCourses          int     `json:"draft_courses"`
	TotalExercises        int     `json:"total_exercises"`
	SubmissionsToday      int     `json:"submissions_today"`
	AverageCompletionRate float64 `json:"average_completion_rate"`
	SystemHealth          string  `json:"system_health"`
	CPUUsage              float64 `json:"cpu_usage"`
	MemoryUsage           float64 `json:"memory_usage"`
}

// UserGrowthData represents user growth over time
type UserGrowthData struct {
	Date  string `json:"date"`
	Count int    `json:"count"`
}

// EnrollmentData represents enrollment statistics
type EnrollmentData struct {
	Date        string `json:"date"`
	Enrollments int    `json:"enrollments"`
	Completions int    `json:"completions"`
}

// ActivityData represents recent activity
type ActivityData struct {
	ID          string  `json:"id"`
	Type        string  `json:"type"` // user, course, exercise, review
	Action      string  `json:"action"`
	ActorName   string  `json:"actor_name"`
	ActorAvatar *string `json:"actor_avatar,omitempty"`
	Timestamp   string  `json:"timestamp"`
}

// GetDashboardStats returns overall platform statistics
// GET /api/v1/admin/stats/dashboard
func (h *AdminStatsHandler) GetDashboardStats(c *gin.Context) {
	stats := DashboardStats{
		SystemHealth: "healthy",
		CPUUsage:     0,
		MemoryUsage:  0,
	}

	// Query user statistics from auth_db via dblink
	var totalUsers, totalStudents, totalInstructors, totalAdmins int
	err := h.db.QueryRow(`
		SELECT 
			COUNT(*) as total,
			COUNT(*) FILTER (WHERE role = 'student') as students,
			COUNT(*) FILTER (WHERE role = 'instructor') as instructors,
			COUNT(*) FILTER (WHERE role = 'admin') as admins
		FROM dblink('dbname=auth_db user=ielts_admin password=123456 host=localhost port=5432',
			$$ SELECT u.id, r.name as role
			   FROM users u
			   LEFT JOIN user_roles ur ON u.id = ur.user_id
			   LEFT JOIN roles r ON ur.role_id = r.id
			   WHERE u.deleted_at IS NULL $$
		) AS user_data(id UUID, role VARCHAR)
	`).Scan(&totalUsers, &totalStudents, &totalInstructors, &totalAdmins)

	if err != nil {
		log.Printf("❌ Error querying user stats: %v", err)
		// Continue with partial data
	} else {
		stats.TotalUsers = totalUsers
		stats.TotalStudents = totalStudents
		stats.TotalInstructors = totalInstructors
		stats.TotalAdmins = totalAdmins
	}

	// Calculate user growth (last 30 days vs previous 30 days)
	var currentCount, previousCount int
	err = h.db.QueryRow(`
		SELECT 
			COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days'),
			COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days')
		FROM dblink('dbname=auth_db user=ielts_admin password=123456 host=localhost port=5432',
			'SELECT created_at FROM users WHERE deleted_at IS NULL'
		) AS auth_users(created_at TIMESTAMP)
	`).Scan(&currentCount, &previousCount)

	if err == nil && previousCount > 0 {
		stats.UserGrowth = float64(currentCount-previousCount) / float64(previousCount) * 100
	}

	// Query course statistics from course_db
	var totalCourses, activeCourses, draftCourses int
	err = h.db.QueryRow(`
		SELECT 
			COUNT(*),
			COUNT(*) FILTER (WHERE status = 'published'),
			COUNT(*) FILTER (WHERE status = 'draft')
		FROM dblink('dbname=course_db user=ielts_admin password=123456 host=localhost port=5432',
			'SELECT id, status FROM courses WHERE deleted_at IS NULL'
		) AS courses(id UUID, status VARCHAR)
	`).Scan(&totalCourses, &activeCourses, &draftCourses)

	if err != nil {
		log.Printf("❌ Error querying course stats: %v", err)
	} else {
		stats.TotalCourses = totalCourses
		stats.ActiveCourses = activeCourses
		stats.DraftCourses = draftCourses
	}

	// Query exercise statistics from exercise_db
	var totalExercises int
	err = h.db.QueryRow(`
		SELECT COUNT(*)
		FROM dblink('dbname=exercise_db user=ielts_admin password=123456 host=localhost port=5432',
			'SELECT id FROM exercises WHERE deleted_at IS NULL'
		) AS exercises(id UUID)
	`).Scan(&totalExercises)

	if err != nil {
		log.Printf("❌ Error querying exercise stats: %v", err)
	} else {
		stats.TotalExercises = totalExercises
	}

	// Query submissions today from exercise_db
	var submissionsToday int
	err = h.db.QueryRow(`
		SELECT COUNT(*)
		FROM dblink('dbname=exercise_db user=ielts_admin password=123456 host=localhost port=5432',
			'SELECT id FROM user_exercise_attempts WHERE DATE(completed_at) = CURRENT_DATE'
		) AS attempts(id UUID)
	`).Scan(&submissionsToday)

	if err != nil {
		log.Printf("❌ Error querying submissions today: %v", err)
	} else {
		stats.SubmissionsToday = submissionsToday
	}

	// Calculate average completion rate from user_db
	var avgCompletionRate sql.NullFloat64
	err = h.db.QueryRow(`
		SELECT AVG((listening_progress + reading_progress + writing_progress + speaking_progress) / 4.0)
		FROM learning_progress
		WHERE user_id IN (
			SELECT user_id FROM user_profiles WHERE deleted_at IS NULL
		)
	`).Scan(&avgCompletionRate)

	if err == nil && avgCompletionRate.Valid {
		stats.AverageCompletionRate = avgCompletionRate.Float64
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stats,
	})
}

// GetUserGrowthData returns user registration growth data
// GET /api/v1/admin/stats/user-growth?days=30
func (h *AdminStatsHandler) GetUserGrowthData(c *gin.Context) {
	days := 30 // default
	if d := c.Query("days"); d != "" {
		if parsed, err := strconv.Atoi(d); err == nil {
			days = parsed
		}
	}

	// Query user registration data from auth_db
	query := fmt.Sprintf(`
		SELECT 
			DATE(created_at) as date,
			COUNT(*) as count
		FROM dblink('dbname=auth_db user=ielts_admin password=123456 host=localhost port=5432',
			$$ SELECT created_at FROM users 
			   WHERE deleted_at IS NULL 
			   AND created_at >= CURRENT_DATE - INTERVAL '%d days' $$
		) AS auth_users(created_at TIMESTAMP)
		GROUP BY DATE(created_at)
		ORDER BY date ASC
	`, days)

	rows, err := h.db.Query(query)

	if err != nil {
		log.Printf("❌ Error querying user growth data: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch user growth data",
		})
		return
	}
	defer rows.Close()

	data := []UserGrowthData{}
	for rows.Next() {
		var item UserGrowthData
		var date time.Time
		if err := rows.Scan(&date, &item.Count); err != nil {
			log.Printf("❌ Error scanning row: %v", err)
			continue
		}
		item.Date = date.Format("2006-01-02")
		data = append(data, item)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    data,
	})
}

// GetEnrollmentData returns enrollment and completion statistics
// GET /api/v1/admin/stats/enrollments?days=7
func (h *AdminStatsHandler) GetEnrollmentData(c *gin.Context) {
	days := 7 // default
	if d := c.Query("days"); d != "" {
		if parsed, err := strconv.Atoi(d); err == nil {
			days = parsed
		}
	}

	// Query enrollment data from course_db
	query := fmt.Sprintf(`
		SELECT 
			DATE(enrollment_date) as date,
			COUNT(*) as enrollments,
			COUNT(*) FILTER (WHERE status = 'completed') as completions
		FROM dblink('dbname=course_db user=ielts_admin password=123456 host=localhost port=5432',
			$$ SELECT enrollment_date, status FROM course_enrollments 
			   WHERE enrollment_date >= CURRENT_DATE - INTERVAL '%d days' $$
		) AS enrollments(enrollment_date TIMESTAMP, status VARCHAR)
		GROUP BY DATE(enrollment_date)
		ORDER BY date ASC
	`, days)

	rows, err := h.db.Query(query)

	if err != nil {
		log.Printf("❌ Error querying enrollment data: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch enrollment data",
		})
		return
	}
	defer rows.Close()

	data := []EnrollmentData{}
	for rows.Next() {
		var item EnrollmentData
		var date time.Time
		if err := rows.Scan(&date, &item.Enrollments, &item.Completions); err != nil {
			log.Printf("❌ Error scanning row: %v", err)
			continue
		}
		item.Date = date.Format("2006-01-02")
		data = append(data, item)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    data,
	})
}

// GetRecentActivities returns recent platform activities
// GET /api/v1/admin/stats/activities?limit=20
func (h *AdminStatsHandler) GetRecentActivities(c *gin.Context) {
	limit := 20 // default
	if l := c.Query("limit"); l != "" {
		// Parse limit from query parameter
	}

	activities := []ActivityData{}

	// Get recent user registrations with names
	userRows, err := h.db.Query(`
		SELECT 
			u.id::text,
			'user' as type,
			'registered' as action,
			COALESCE(p.full_name, u.email) as actor_name,
			p.avatar_url,
			u.created_at
		FROM dblink('dbname=auth_db user=ielts_admin password=123456 host=localhost port=5432',
			$$ SELECT id, email, created_at FROM users 
			   WHERE deleted_at IS NULL 
			   ORDER BY created_at DESC 
			   LIMIT 10 $$
		) AS u(id UUID, email VARCHAR, created_at TIMESTAMP)
		LEFT JOIN user_profiles p ON u.id = p.user_id
	`)

	if err == nil {
		defer userRows.Close()
		for userRows.Next() {
			var activity ActivityData
			var createdAt time.Time
			if err := userRows.Scan(&activity.ID, &activity.Type, &activity.Action, &activity.ActorName, &activity.ActorAvatar, &createdAt); err == nil {
				activity.Timestamp = createdAt.Format(time.RFC3339)
				activities = append(activities, activity)
			}
		}
	} else {
		log.Printf("❌ Error querying user activities: %v", err)
	}

	// Get recent exercise submissions with user names
	exerciseRows, err := h.db.Query(`
		SELECT 
			e.id::text,
			'exercise' as type,
			'submitted exercise' as action,
			COALESCE(p.full_name, 'User ' || SUBSTRING(e.user_id::text, 1, 8)) as actor_name,
			p.avatar_url,
			e.completed_at
		FROM dblink('dbname=exercise_db user=ielts_admin password=123456 host=localhost port=5432',
			$$ SELECT id, user_id, completed_at FROM user_exercise_attempts 
			   WHERE completed_at IS NOT NULL
			   ORDER BY completed_at DESC 
			   LIMIT 10 $$
		) AS e(id UUID, user_id UUID, completed_at TIMESTAMP)
		LEFT JOIN user_profiles p ON e.user_id = p.user_id
	`)

	if err == nil {
		defer exerciseRows.Close()
		for exerciseRows.Next() {
			var activity ActivityData
			var completedAt time.Time
			if err := exerciseRows.Scan(&activity.ID, &activity.Type, &activity.Action, &activity.ActorName, &activity.ActorAvatar, &completedAt); err == nil {
				activity.Timestamp = completedAt.Format(time.RFC3339)
				activities = append(activities, activity)
			}
		}
	} else {
		log.Printf("❌ Error querying exercise activities: %v", err)
	}

	// Sort activities by timestamp (newest first)
	// Simple bubble sort since we have small dataset
	for i := 0; i < len(activities)-1; i++ {
		for j := i + 1; j < len(activities); j++ {
			if activities[i].Timestamp < activities[j].Timestamp {
				activities[i], activities[j] = activities[j], activities[i]
			}
		}
	}

	// Limit activities
	if len(activities) > limit {
		activities = activities[:limit]
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    activities,
	})
}
