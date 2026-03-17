package handlers

import (
	"log"
	"net/http"
	"strconv"

	"github.com/bisosad1501/ielts-platform/course-service/internal/models"
	"github.com/bisosad1501/ielts-platform/course-service/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CourseHandler struct {
	service          *service.CourseService
	videoSyncService *service.VideoSyncService
}

func NewCourseHandler(service *service.CourseService, videoSyncService *service.VideoSyncService) *CourseHandler {
	return &CourseHandler{
		service:          service,
		videoSyncService: videoSyncService,
	}
}

type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Error   *ErrorInfo  `json:"error,omitempty"`
}

type ErrorInfo struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
}

// HealthCheck checks service health
func (h *CourseHandler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, Response{
		Success: true,
		Data: map[string]string{
			"service": "course-service",
			"status":  "healthy",
		},
	})
}

// GetCourses retrieves courses with filters
func (h *CourseHandler) GetCourses(c *gin.Context) {
	var query models.CourseListQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_QUERY",
				Message: "Invalid query parameters",
				Details: err.Error(),
			},
		})
		return
	}

	courses, total, err := h.service.GetCourses(&query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INTERNAL_ERROR",
				Message: "Failed to get courses",
				Details: err.Error(),
			},
		})
		return
	}

	limit := query.Limit
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	totalPages := (total + limit - 1) / limit

	c.JSON(http.StatusOK, Response{
		Success: true,
		Data: map[string]interface{}{
			"courses": courses,
			"pagination": map[string]interface{}{
				"page":        query.Page,
				"limit":       limit,
				"total":       total,
				"total_pages": totalPages,
			},
		},
	})
}

// GetCourseDetail retrieves detailed course information
func (h *CourseHandler) GetCourseDetail(c *gin.Context) {
	courseIDStr := c.Param("id")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_COURSE_ID",
				Message: "Invalid course ID format",
			},
		})
		return
	}

	// Get user ID if authenticated (optional)
	var userID *uuid.UUID
	if userIDVal, exists := c.Get("user_id"); exists {
		if userIDStr, ok := userIDVal.(string); ok {
			parsedID, err := uuid.Parse(userIDStr)
			if err == nil {
				userID = &parsedID
			}
		}
	}

	// Get user role
	userRole := ""
	if roleVal, exists := c.Get("role"); exists {
		userRole = roleVal.(string)
	}

	courseDetail, err := h.service.GetCourseDetail(courseID, userID, userRole)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "course not found" {
			statusCode = http.StatusNotFound
		}
		c.JSON(statusCode, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "COURSE_NOT_FOUND",
				Message: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Data:    courseDetail,
	})
}

// GetLessonDetail retrieves detailed lesson information
func (h *CourseHandler) GetLessonDetail(c *gin.Context) {
	lessonIDStr := c.Param("id")
	lessonID, err := uuid.Parse(lessonIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_LESSON_ID",
				Message: "Invalid lesson ID format",
			},
		})
		return
	}

	// Get user ID if authenticated (optional)
	var userID *uuid.UUID
	if userIDVal, exists := c.Get("user_id"); exists {
		if userIDStr, ok := userIDVal.(string); ok {
			parsedID, err := uuid.Parse(userIDStr)
			if err == nil {
				userID = &parsedID
			}
		}
	}

	lessonDetail, err := h.service.GetLessonDetail(lessonID, userID)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "lesson not found" {
			statusCode = http.StatusNotFound
		}
		c.JSON(statusCode, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "LESSON_NOT_FOUND",
				Message: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Data:    lessonDetail,
	})
}

// EnrollCourse enrolls user in a course
func (h *CourseHandler) EnrollCourse(c *gin.Context) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "UNAUTHORIZED",
				Message: "User not authenticated",
			},
		})
		return
	}

	userIDStr := userIDVal.(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_USER_ID",
				Message: "Invalid user ID",
			},
		})
		return
	}

	var req models.EnrollmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "VALIDATION_ERROR",
				Message: "Invalid request data",
				Details: err.Error(),
			},
		})
		return
	}

	enrollment, err := h.service.EnrollCourse(userID, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "ENROLLMENT_FAILED",
				Message: "Failed to enroll in course",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusCreated, Response{
		Success: true,
		Message: "Successfully enrolled in course",
		Data:    enrollment,
	})
}

// GetMyEnrollments retrieves user's enrollments with pagination
func (h *CourseHandler) GetMyEnrollments(c *gin.Context) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "UNAUTHORIZED",
				Message: "User not authenticated",
			},
		})
		return
	}

	userIDStr := userIDVal.(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_USER_ID",
				Message: "Invalid user ID",
			},
		})
		return
	}

	// Parse pagination params
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	enrollments, total, err := h.service.GetMyEnrollments(userID, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INTERNAL_ERROR",
				Message: "Failed to get enrollments",
				Details: err.Error(),
			},
		})
		return
	}

	totalPages := (total + limit - 1) / limit
	c.JSON(http.StatusOK, Response{
		Success: true,
		Data: map[string]interface{}{
			"enrollments": enrollments.Enrollments,
			"pagination": map[string]interface{}{
				"page":        page,
				"limit":       limit,
				"total":       total,
				"total_pages": totalPages,
			},
		},
	})
}

// GetLessonProgress retrieves progress for a specific lesson (for resume watching)
func (h *CourseHandler) GetLessonProgress(c *gin.Context) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "UNAUTHORIZED",
				Message: "User not authenticated",
			},
		})
		return
	}

	userIDStr := userIDVal.(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_USER_ID",
				Message: "Invalid user ID",
			},
		})
		return
	}

	lessonIDStr := c.Param("id")
	lessonID, err := uuid.Parse(lessonIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_LESSON_ID",
				Message: "Invalid lesson ID format",
			},
		})
		return
	}

	// Get progress from service
	progress, err := h.service.GetLessonProgressByID(userID, lessonID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INTERNAL_ERROR",
				Message: "Failed to get lesson progress",
				Details: err.Error(),
			},
		})
		return
	}

	// If no progress found, return nil (frontend will handle this)
	if progress == nil {
		c.JSON(http.StatusOK, Response{
			Success: true,
			Data:    nil,
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Data:    progress,
	})
}

func (h *CourseHandler) UpdateLessonProgress(c *gin.Context) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "UNAUTHORIZED",
				Message: "User not authenticated",
			},
		})
		return
	}

	userIDStr := userIDVal.(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_USER_ID",
				Message: "Invalid user ID",
			},
		})
		return
	}

	lessonIDStr := c.Param("id")
	lessonID, err := uuid.Parse(lessonIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_LESSON_ID",
				Message: "Invalid lesson ID format",
			},
		})
		return
	}

	var req models.UpdateLessonProgressRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "VALIDATION_ERROR",
				Message: "Invalid request data",
				Details: err.Error(),
			},
		})
		return
	}

	progress, err := h.service.UpdateLessonProgress(userID, lessonID, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "UPDATE_FAILED",
				Message: "Failed to update lesson progress",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Lesson progress updated successfully",
		Data:    progress,
	})
}

// GetEnrollmentProgress retrieves enrollment progress
func (h *CourseHandler) GetEnrollmentProgress(c *gin.Context) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "UNAUTHORIZED",
				Message: "User not authenticated",
			},
		})
		return
	}

	userIDStr := userIDVal.(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_USER_ID",
				Message: "Invalid user ID",
			},
		})
		return
	}

	courseIDStr := c.Param("id")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_COURSE_ID",
				Message: "Invalid course ID format",
			},
		})
		return
	}

	progress, err := h.service.GetEnrollmentProgress(userID, courseID)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "not enrolled in this course" {
			statusCode = http.StatusForbidden
		}
		c.JSON(statusCode, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "PROGRESS_ERROR",
				Message: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Data:    progress,
	})
}

// GetCourseProgress retrieves all lesson progress for a course
func (h *CourseHandler) GetCourseProgress(c *gin.Context) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "UNAUTHORIZED",
				Message: "User not authenticated",
			},
		})
		return
	}

	userIDStr := userIDVal.(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_USER_ID",
				Message: "Invalid user ID",
			},
		})
		return
	}

	courseIDStr := c.Param("id")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_COURSE_ID",
				Message: "Invalid course ID format",
			},
		})
		return
	}

	// Get all lesson progress for this course
	lessons, err := h.service.GetCourseProgressLessons(userID, courseID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "PROGRESS_ERROR",
				Message: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Data: map[string]interface{}{
			"lessons": lessons,
		},
	})
}

// CreateCourse creates a new course (Admin/Instructor only)
func (h *CourseHandler) CreateCourse(c *gin.Context) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "UNAUTHORIZED",
				Message: "User not authenticated",
			},
		})
		return
	}

	userIDStr := userIDVal.(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_USER_ID",
				Message: "Invalid user ID",
			},
		})
		return
	}

	// Get user email for instructor name
	email := ""
	if emailVal, exists := c.Get("email"); exists {
		email = emailVal.(string)
	}

	var req models.CreateCourseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "VALIDATION_ERROR",
				Message: "Invalid request data",
				Details: err.Error(),
			},
		})
		return
	}

	course, err := h.service.CreateCourse(userID, email, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "CREATION_FAILED",
				Message: "Failed to create course",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusCreated, Response{
		Success: true,
		Message: "Course created successfully",
		Data:    course,
	})
}

// UpdateCourse updates a course (Admin/Instructor only with ownership check)
func (h *CourseHandler) UpdateCourse(c *gin.Context) {
	// Get user info from JWT
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "UNAUTHORIZED",
				Message: "User not authenticated",
			},
		})
		return
	}

	userIDStr := userIDVal.(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_USER_ID",
				Message: "Invalid user ID",
			},
		})
		return
	}

	userRole := ""
	if roleVal, exists := c.Get("role"); exists {
		userRole = roleVal.(string)
	}

	courseIDStr := c.Param("id")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_COURSE_ID",
				Message: "Invalid course ID format",
			},
		})
		return
	}

	var req models.UpdateCourseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "VALIDATION_ERROR",
				Message: "Invalid request data",
				Details: err.Error(),
			},
		})
		return
	}

	// Debug log
	log.Printf("[UpdateCourse] Request: %+v", req)

	course, err := h.service.UpdateCourse(courseID, userID, userRole, &req)
	if err != nil {
		log.Printf("[UpdateCourse] Error: %v", err)
		statusCode := http.StatusBadRequest
		if err.Error() == "you don't have permission to update this course" {
			statusCode = http.StatusForbidden
		} else if err.Error() == "course not found" {
			statusCode = http.StatusNotFound
		}
		c.JSON(statusCode, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "UPDATE_FAILED",
				Message: err.Error(),
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Course updated successfully",
		Data:    course,
	})
}

// DeleteCourse deletes a course (Admin only)
func (h *CourseHandler) DeleteCourse(c *gin.Context) {
	courseIDStr := c.Param("id")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_COURSE_ID",
				Message: "Invalid course ID format",
			},
		})
		return
	}

	err = h.service.DeleteCourse(courseID)
	if err != nil {
		log.Printf("[DeleteCourse] Error: %v", err)
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "DELETE_FAILED",
				Message: err.Error(),
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Course deleted successfully",
	})
}

// CreateModule creates a new module (Admin/Instructor only with ownership check)
func (h *CourseHandler) CreateModule(c *gin.Context) {
	// Get user info from JWT
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "UNAUTHORIZED",
				Message: "User not authenticated",
			},
		})
		return
	}

	userIDStr := userIDVal.(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_USER_ID",
				Message: "Invalid user ID",
			},
		})
		return
	}

	userRole := ""
	if roleVal, exists := c.Get("role"); exists {
		userRole = roleVal.(string)
	}

	var req models.CreateModuleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "VALIDATION_ERROR",
				Message: "Invalid request data",
				Details: err.Error(),
			},
		})
		return
	}

	module, err := h.service.CreateModule(userID, userRole, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "CREATION_FAILED",
				Message: "Failed to create module",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusCreated, Response{
		Success: true,
		Message: "Module created successfully",
		Data:    module,
	})
}

// CreateLesson creates a new lesson (Admin/Instructor only with ownership check)
func (h *CourseHandler) CreateLesson(c *gin.Context) {
	// Get user info from JWT
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "UNAUTHORIZED",
				Message: "User not authenticated",
			},
		})
		return
	}

	userIDStr := userIDVal.(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_USER_ID",
				Message: "Invalid user ID",
			},
		})
		return
	}

	userRole := ""
	if roleVal, exists := c.Get("role"); exists {
		userRole = roleVal.(string)
	}

	var req models.CreateLessonRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "VALIDATION_ERROR",
				Message: "Invalid request data",
				Details: err.Error(),
			},
		})
		return
	}

	lesson, err := h.service.CreateLesson(userID, userRole, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "CREATION_FAILED",
				Message: "Failed to create lesson",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusCreated, Response{
		Success: true,
		Message: "Lesson created successfully",
		Data:    lesson,
	})
}

// UpdateModule updates an existing module
func (h *CourseHandler) UpdateModule(c *gin.Context) {
	// Get user info from JWT
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "UNAUTHORIZED",
				Message: "User not authenticated",
			},
		})
		return
	}

	userIDStr := userIDVal.(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_USER_ID",
				Message: "Invalid user ID",
			},
		})
		return
	}

	userRole := ""
	if roleVal, exists := c.Get("role"); exists {
		userRole = roleVal.(string)
	}

	// Get module ID from URL param
	moduleIDStr := c.Param("id")
	moduleID, err := uuid.Parse(moduleIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_MODULE_ID",
				Message: "Invalid module ID",
			},
		})
		return
	}

	var req models.CreateModuleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "VALIDATION_ERROR",
				Message: "Invalid request data",
				Details: err.Error(),
			},
		})
		return
	}

	module, err := h.service.UpdateModule(userID, userRole, moduleID, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "UPDATE_FAILED",
				Message: "Failed to update module",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Module updated successfully",
		Data:    module,
	})
}

// DeleteModule deletes a module
func (h *CourseHandler) DeleteModule(c *gin.Context) {
	// Get user info from JWT
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "UNAUTHORIZED",
				Message: "User not authenticated",
			},
		})
		return
	}

	userIDStr := userIDVal.(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_USER_ID",
				Message: "Invalid user ID",
			},
		})
		return
	}

	userRole := ""
	if roleVal, exists := c.Get("role"); exists {
		userRole = roleVal.(string)
	}

	// Get module ID from URL param
	moduleIDStr := c.Param("id")
	moduleID, err := uuid.Parse(moduleIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_MODULE_ID",
				Message: "Invalid module ID",
			},
		})
		return
	}

	err = h.service.DeleteModule(userID, userRole, moduleID)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "DELETE_FAILED",
				Message: "Failed to delete module",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Module deleted successfully",
	})
}

// UpdateLesson updates an existing lesson
func (h *CourseHandler) UpdateLesson(c *gin.Context) {
	// Get user info from JWT
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "UNAUTHORIZED",
				Message: "User not authenticated",
			},
		})
		return
	}

	userIDStr := userIDVal.(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_USER_ID",
				Message: "Invalid user ID",
			},
		})
		return
	}

	userRole := ""
	if roleVal, exists := c.Get("role"); exists {
		userRole = roleVal.(string)
	}

	// Get lesson ID from URL param
	lessonIDStr := c.Param("id")
	lessonID, err := uuid.Parse(lessonIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_LESSON_ID",
				Message: "Invalid lesson ID",
			},
		})
		return
	}

	var req models.CreateLessonRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "VALIDATION_ERROR",
				Message: "Invalid request data",
				Details: err.Error(),
			},
		})
		return
	}

	lesson, err := h.service.UpdateLesson(userID, userRole, lessonID, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "UPDATE_FAILED",
				Message: "Failed to update lesson",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Lesson updated successfully",
		Data:    lesson,
	})
}

// DeleteLesson deletes a lesson
func (h *CourseHandler) DeleteLesson(c *gin.Context) {
	// Get user info from JWT
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "UNAUTHORIZED",
				Message: "User not authenticated",
			},
		})
		return
	}

	userIDStr := userIDVal.(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_USER_ID",
				Message: "Invalid user ID",
			},
		})
		return
	}

	userRole := ""
	if roleVal, exists := c.Get("role"); exists {
		userRole = roleVal.(string)
	}

	// Get lesson ID from URL param
	lessonIDStr := c.Param("id")
	lessonID, err := uuid.Parse(lessonIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_LESSON_ID",
				Message: "Invalid lesson ID",
			},
		})
		return
	}

	err = h.service.DeleteLesson(userID, userRole, lessonID)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "DELETE_FAILED",
				Message: "Failed to delete lesson",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Lesson deleted successfully",
	})
}

// PublishCourse publishes a draft course (Admin/Instructor with ownership check)
func (h *CourseHandler) PublishCourse(c *gin.Context) {
	// Get user info from JWT
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "UNAUTHORIZED",
				Message: "User not authenticated",
			},
		})
		return
	}

	userIDStr := userIDVal.(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_USER_ID",
				Message: "Invalid user ID",
			},
		})
		return
	}

	userRole := ""
	if roleVal, exists := c.Get("role"); exists {
		userRole = roleVal.(string)
	}

	courseIDStr := c.Param("id")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_COURSE_ID",
				Message: "Invalid course ID format",
			},
		})
		return
	}

	err = h.service.PublishCourse(courseID, userID, userRole)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "PUBLISH_FAILED",
				Message: "Failed to publish course",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Course published successfully",
	})
}

// ============================================
// COURSE REVIEWS
// ============================================

// GetCourseReviews retrieves reviews for a course with pagination
func (h *CourseHandler) GetCourseReviews(c *gin.Context) {
	courseIDStr := c.Param("id")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_COURSE_ID",
				Message: "Invalid course ID format",
			},
		})
		return
	}

	// Parse pagination params
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	reviews, total, err := h.service.GetCourseReviews(courseID, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "GET_REVIEWS_FAILED",
				Message: "Failed to get course reviews",
				Details: err.Error(),
			},
		})
		return
	}

	totalPages := (total + limit - 1) / limit
	c.JSON(http.StatusOK, Response{
		Success: true,
		Data: models.CourseReviewsResponse{
			Reviews:    reviews,
			Total:      total,
			Page:       page,
			Limit:      limit,
			TotalPages: totalPages,
		},
	})
}

// CreateReview creates a new review for a course
func (h *CourseHandler) CreateReview(c *gin.Context) {
	courseIDStr := c.Param("id")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_COURSE_ID",
				Message: "Invalid course ID format",
			},
		})
		return
	}

	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_USER",
				Message: "Invalid user authentication",
			},
		})
		return
	}

	var req models.CreateReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_REQUEST",
				Message: "Invalid review data",
				Details: err.Error(),
			},
		})
		return
	}

	review, err := h.service.CreateReview(userID, courseID, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "CREATE_REVIEW_FAILED",
				Message: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusCreated, Response{
		Success: true,
		Message: "Review submitted successfully.",
		Data:    review,
	})
}

// UpdateReview updates an existing review for a course
func (h *CourseHandler) UpdateReview(c *gin.Context) {
	courseIDStr := c.Param("id")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_COURSE_ID",
				Message: "Invalid course ID format",
			},
		})
		return
	}

	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_USER",
				Message: "Invalid user authentication",
			},
		})
		return
	}

	var req models.UpdateReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_REQUEST",
				Message: "Invalid review data",
				Details: err.Error(),
			},
		})
		return
	}

	review, err := h.service.UpdateReview(userID, courseID, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "UPDATE_REVIEW_FAILED",
				Message: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Review updated successfully.",
		Data:    review,
	})
}

// ============================================
// CATEGORIES
// ============================================

// GetCategories retrieves all course categories
func (h *CourseHandler) GetCategories(c *gin.Context) {
	categories, err := h.service.GetAllCategories()
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "GET_CATEGORIES_FAILED",
				Message: "Failed to get categories",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Data:    categories,
	})
}

// GetCourseCategories retrieves categories for a specific course
func (h *CourseHandler) GetCourseCategories(c *gin.Context) {
	courseIDStr := c.Param("id")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_COURSE_ID",
				Message: "Invalid course ID format",
			},
		})
		return
	}

	categories, err := h.service.GetCourseCategories(courseID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "GET_CATEGORIES_FAILED",
				Message: "Failed to get course categories",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Data:    categories,
	})
}

// ============================================
// VIDEO TRACKING
// ============================================

// TrackVideoProgress records video watch progress
func (h *CourseHandler) TrackVideoProgress(c *gin.Context) {
	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_USER",
				Message: "Invalid user authentication",
			},
		})
		return
	}

	var req models.TrackVideoProgressRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_REQUEST",
				Message: "Invalid video progress data",
				Details: err.Error(),
			},
		})
		return
	}

	err = h.service.TrackVideoProgress(userID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "TRACK_PROGRESS_FAILED",
				Message: "Failed to track video progress",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Video progress tracked successfully",
	})
}

// GetVideoWatchHistory retrieves user's video watch history with pagination
func (h *CourseHandler) GetVideoWatchHistory(c *gin.Context) {
	userIDStr := c.GetString("user_id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_USER",
				Message: "Invalid user authentication",
			},
		})
		return
	}

	// Parse pagination params
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	history, total, err := h.service.GetUserVideoWatchHistory(userID, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "GET_HISTORY_FAILED",
				Message: "Failed to get watch history",
				Details: err.Error(),
			},
		})
		return
	}

	totalPages := (total + limit - 1) / limit
	c.JSON(http.StatusOK, Response{
		Success: true,
		Data: models.VideoWatchHistoryResponse{
			History:    history,
			Total:      total,
			Page:       page,
			Limit:      limit,
			TotalPages: totalPages,
		},
	})
}

// DownloadMaterial increments download count and returns success
func (h *CourseHandler) DownloadMaterial(c *gin.Context) {
	materialIDStr := c.Param("id")
	materialID, err := uuid.Parse(materialIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_MATERIAL_ID",
				Message: "Invalid material ID format",
			},
		})
		return
	}

	err = h.service.IncrementMaterialDownload(materialID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "DOWNLOAD_FAILED",
				Message: "Failed to record download",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Download recorded successfully",
	})
}

// GetVideoSubtitles retrieves subtitles for a video
func (h *CourseHandler) GetVideoSubtitles(c *gin.Context) {
	videoIDStr := c.Param("id")
	videoID, err := uuid.Parse(videoIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_VIDEO_ID",
				Message: "Invalid video ID format",
			},
		})
		return
	}

	subtitles, err := h.service.GetVideoSubtitles(videoID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "GET_SUBTITLES_FAILED",
				Message: "Failed to get video subtitles",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Data:    subtitles,
	})
}

// ============================================
// VIDEO MANAGEMENT
// ============================================

// AddVideoToLesson adds a video to a lesson (Admin/Instructor only)
func (h *CourseHandler) AddVideoToLesson(c *gin.Context) {
	// Get user info from JWT
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "UNAUTHORIZED",
				Message: "User not authenticated",
			},
		})
		return
	}

	userIDStr := userIDVal.(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_USER_ID",
				Message: "Invalid user ID",
			},
		})
		return
	}

	userRole := ""
	if roleVal, exists := c.Get("role"); exists {
		userRole = roleVal.(string)
	}

	// Get lesson ID from URL
	lessonIDStr := c.Param("id")
	lessonID, err := uuid.Parse(lessonIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_LESSON_ID",
				Message: "Invalid lesson ID format",
			},
		})
		return
	}

	// Parse request body
	var req models.AddVideoToLessonRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "VALIDATION_ERROR",
				Message: "Invalid request data",
				Details: err.Error(),
			},
		})
		return
	}

	// Add video to lesson
	video, err := h.service.AddVideoToLesson(userID, userRole, lessonID, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "ADD_VIDEO_FAILED",
				Message: "Failed to add video to lesson",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusCreated, Response{
		Success: true,
		Message: "Video added to lesson successfully",
		Data:    video,
	})
}

// UpdateLessonVideo updates an existing video in a lesson (Admin/Instructor only)
func (h *CourseHandler) UpdateLessonVideo(c *gin.Context) {
	// Get user info from JWT
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "UNAUTHORIZED",
				Message: "User not authenticated",
			},
		})
		return
	}

	userIDStr := userIDVal.(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_USER_ID",
				Message: "Invalid user ID",
			},
		})
		return
	}

	userRole := ""
	if roleVal, exists := c.Get("role"); exists {
		userRole = roleVal.(string)
	}

	// Get lesson ID and video ID from URL
	lessonIDStr := c.Param("id")
	lessonID, err := uuid.Parse(lessonIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_LESSON_ID",
				Message: "Invalid lesson ID format",
			},
		})
		return
	}

	videoIDStr := c.Param("video_id")
	videoID, err := uuid.Parse(videoIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_VIDEO_ID",
				Message: "Invalid video ID format",
			},
		})
		return
	}

	// Parse request body
	var req models.UpdateVideoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "VALIDATION_ERROR",
				Message: "Invalid request data",
				Details: err.Error(),
			},
		})
		return
	}

	// Update video
	video, err := h.service.UpdateLessonVideo(userID, userRole, lessonID, videoID, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "UPDATE_VIDEO_FAILED",
				Message: "Failed to update video",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Video updated successfully",
		Data:    video,
	})
}

// DeleteLessonVideo removes a video from a lesson (Admin/Instructor only)
func (h *CourseHandler) DeleteLessonVideo(c *gin.Context) {
	// Get user info from JWT
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "UNAUTHORIZED",
				Message: "User not authenticated",
			},
		})
		return
	}

	userIDStr := userIDVal.(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_USER_ID",
				Message: "Invalid user ID",
			},
		})
		return
	}

	userRole := ""
	if roleVal, exists := c.Get("role"); exists {
		userRole = roleVal.(string)
	}

	// Get lesson ID and video ID from URL
	lessonIDStr := c.Param("id")
	lessonID, err := uuid.Parse(lessonIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_LESSON_ID",
				Message: "Invalid lesson ID format",
			},
		})
		return
	}

	videoIDStr := c.Param("video_id")
	videoID, err := uuid.Parse(videoIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_VIDEO_ID",
				Message: "Invalid video ID format",
			},
		})
		return
	}

	// Delete video
	err = h.service.DeleteLessonVideo(userID, userRole, lessonID, videoID)
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "DELETE_VIDEO_FAILED",
				Message: "Failed to delete video",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Video deleted successfully",
	})
}

// SyncAllVideoDurations triggers sync for all videos with missing duration
func (h *CourseHandler) SyncAllVideoDurations(c *gin.Context) {
	if h.videoSyncService == nil {
		c.JSON(http.StatusServiceUnavailable, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "SYNC_UNAVAILABLE",
				Message: "Video sync service not available",
			},
		})
		return
	}

	// Run sync in background
	go h.videoSyncService.SyncMissingDurations()

	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Video duration sync started in background",
	})
}

// SyncLessonVideoDurations syncs durations for all videos in a lesson
func (h *CourseHandler) SyncLessonVideoDurations(c *gin.Context) {
	lessonID := c.Param("id")
	if lessonID == "" {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_LESSON_ID",
				Message: "Lesson ID is required",
			},
		})
		return
	}

	if h.videoSyncService == nil {
		c.JSON(http.StatusServiceUnavailable, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "SYNC_UNAVAILABLE",
				Message: "Video sync service not available",
			},
		})
		return
	}

	count, err := h.videoSyncService.SyncLessonVideos(lessonID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "SYNC_FAILED",
				Message: "Failed to sync lesson videos",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Lesson videos synced successfully",
		Data: map[string]interface{}{
			"lesson_id":      lessonID,
			"videos_updated": count,
		},
	})
}

// SyncSingleVideoDuration syncs duration for a specific video
func (h *CourseHandler) SyncSingleVideoDuration(c *gin.Context) {
	videoID := c.Param("video_id")
	if videoID == "" {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_VIDEO_ID",
				Message: "Video ID is required",
			},
		})
		return
	}

	if h.videoSyncService == nil {
		c.JSON(http.StatusServiceUnavailable, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "SYNC_UNAVAILABLE",
				Message: "Video sync service not available",
			},
		})
		return
	}

	err := h.videoSyncService.SyncSingleVideo(videoID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "SYNC_FAILED",
				Message: "Failed to sync video duration",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "Video duration synced successfully",
		Data: map[string]string{
			"video_id": videoID,
		},
	})
}

// ForceResyncAllVideos forces re-sync for ALL YouTube videos (regardless of current duration)
func (h *CourseHandler) ForceResyncAllVideos(c *gin.Context) {
	if h.videoSyncService == nil {
		c.JSON(http.StatusServiceUnavailable, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "SYNC_UNAVAILABLE",
				Message: "Video sync service not available",
			},
		})
		return
	}

	successCount, failCount, err := h.videoSyncService.ForceResyncAllVideos()
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "FORCE_RESYNC_FAILED",
				Message: "Failed to force re-sync videos",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Message: "All YouTube videos force re-synced successfully",
		Data: map[string]interface{}{
			"success_count": successCount,
			"fail_count":    failCount,
			"total":         successCount + failCount,
		},
	})
}
