package handlers

import (
	"log"
	"net/http"
	"strconv"

	"github.com/bisosad1501/ielts-platform/exercise-service/internal/models"
	"github.com/bisosad1501/ielts-platform/exercise-service/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ExerciseHandler struct {
	service *service.ExerciseService
}

type Response struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   *ErrorInfo  `json:"error,omitempty"`
}

type ErrorInfo struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
}

func NewExerciseHandler(service *service.ExerciseService) *ExerciseHandler {
	return &ExerciseHandler{service: service}
}

// GetMyExercises handles GET /api/v1/admin/exercises (instructor's exercises only)
func (h *ExerciseHandler) GetMyExercises(c *gin.Context) {
	// Get instructor ID from JWT context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "UNAUTHORIZED",
				Message: "User ID not found in context",
			},
		})
		return
	}

	// JWT claims return string, need to parse to UUID
	var instructorID uuid.UUID
	var err error

	switch v := userID.(type) {
	case string:
		instructorID, err = uuid.Parse(v)
		if err != nil {
			c.JSON(http.StatusInternalServerError, Response{
				Success: false,
				Error: &ErrorInfo{
					Code:    "INVALID_USER_ID",
					Message: "Invalid user ID format",
					Details: err.Error(),
				},
			})
			return
		}
	case uuid.UUID:
		instructorID = v
	default:
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_USER_ID",
				Message: "User ID type not supported",
			},
		})
		return
	}

	query := &models.ExerciseListQuery{}

	// Parse query params
	query.Page, _ = strconv.Atoi(c.DefaultQuery("page", "1"))
	query.Limit, _ = strconv.Atoi(c.DefaultQuery("limit", "100"))

	// Parse filters
	skillTypeParam := c.Query("skill_type")
	if skillTypeParam != "" {
		query.SkillType = skillTypeParam
	}
	difficultyParam := c.Query("difficulty")
	if difficultyParam != "" {
		query.Difficulty = difficultyParam
	}
	exerciseTypeParam := c.Query("exercise_type")
	if exerciseTypeParam != "" {
		query.ExerciseType = exerciseTypeParam
	}
	query.Search = c.Query("search")
	query.SortBy = c.DefaultQuery("sort_by", "newest")
	query.SortOrder = c.DefaultQuery("sort_order", "desc")

	// Filter by instructor
	query.CreatedBy = &instructorID

	exercises, total, err := h.service.GetExercises(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "GET_EXERCISES_ERROR",
				Message: "Failed to get exercises",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Data: map[string]interface{}{
			"exercises": exercises,
			"total":     total,
			"page":      query.Page,
			"limit":     query.Limit,
		},
	})
}

// GetExercises handles GET /api/v1/exercises
func (h *ExerciseHandler) GetExercises(c *gin.Context) {
	query := &models.ExerciseListQuery{}

	// Parse query params
	query.Page, _ = strconv.Atoi(c.DefaultQuery("page", "1"))
	query.Limit, _ = strconv.Atoi(c.DefaultQuery("limit", "20"))

	// Support comma-separated values for OR logic (e.g., skill_type=listening,reading)
	skillTypeParam := c.Query("skill_type")
	if skillTypeParam != "" {
		query.SkillType = skillTypeParam // Will be parsed in repository
	}
	difficultyParam := c.Query("difficulty")
	if difficultyParam != "" {
		query.Difficulty = difficultyParam // Will be parsed in repository
	}
	exerciseTypeParam := c.Query("exercise_type")
	if exerciseTypeParam != "" {
		query.ExerciseType = exerciseTypeParam // Will be parsed in repository
	}
	query.Search = c.Query("search")

	// Sort parameters
	query.SortBy = c.DefaultQuery("sort_by", "newest")     // newest, popular, difficulty, title
	query.SortOrder = c.DefaultQuery("sort_order", "desc") // asc, desc

	if isFree := c.Query("is_free"); isFree != "" {
		isFreeVal := isFree == "true"
		query.IsFree = &isFreeVal
	}

	if isPublished := c.Query("is_published"); isPublished != "" {
		isPublishedVal := isPublished == "true"
		query.IsPublished = &isPublishedVal
	}

	if courseID := c.Query("course_id"); courseID != "" {
		if id, err := uuid.Parse(courseID); err == nil {
			query.CourseID = &id
		}
	}

	if moduleID := c.Query("module_id"); moduleID != "" {
		if id, err := uuid.Parse(moduleID); err == nil {
			query.ModuleID = &id
		}
	}

	// Parse course_level_only flag
	if courseLevelOnly := c.Query("course_level_only"); courseLevelOnly == "true" {
		query.CourseLevelOnly = true
	}

	exercises, total, err := h.service.GetExercises(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "GET_EXERCISES_ERROR",
				Message: "Failed to get exercises",
				Details: err.Error(),
			},
		})
		return
	}

	totalPages := (total + query.Limit - 1) / query.Limit
	c.JSON(http.StatusOK, Response{
		Success: true,
		Data: gin.H{
			"exercises": exercises,
			"pagination": gin.H{
				"page":        query.Page,
				"limit":       query.Limit,
				"total":       total,
				"total_pages": totalPages,
			},
		},
	})
}

// GetExerciseByID handles GET /api/v1/exercises/:id
func (h *ExerciseHandler) GetExerciseByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_ID",
				Message: "Invalid exercise ID",
			},
		})
		return
	}

	exercise, err := h.service.GetExerciseByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "EXERCISE_NOT_FOUND",
				Message: "Exercise not found",
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Data:    exercise,
	})
}

// GetExerciseByIDAdmin handles GET /api/v1/admin/exercises/:id (includes unpublished)
func (h *ExerciseHandler) GetExerciseByIDAdmin(c *gin.Context) {
	log.Printf("[GetExerciseByIDAdmin] Called for exercise ID: %s", c.Param("id"))
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		log.Printf("[GetExerciseByIDAdmin] Invalid ID: %v", err)
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_ID",
				Message: "Invalid exercise ID",
			},
		})
		return
	}

	exercise, err := h.service.GetExerciseByIDAdmin(id)
	if err != nil {
		log.Printf("[GetExerciseByIDAdmin] Service error: %v", err)
		c.JSON(http.StatusNotFound, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "EXERCISE_NOT_FOUND",
				Message: "Exercise not found",
			},
		})
		return
	}

	log.Printf("[GetExerciseByIDAdmin] Success for exercise: %s", exercise.Exercise.Title)
	c.JSON(http.StatusOK, Response{
		Success: true,
		Data:    exercise,
	})
}

// StartExercise handles POST /api/v1/submissions
func (h *ExerciseHandler) StartExercise(c *gin.Context) {
	userID, exists := c.Get("user_id")
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

	var req struct {
		ExerciseID *uuid.UUID `json:"exercise_id" binding:"-"`
		DeviceType *string    `json:"device_type"` // web, android, ios
	}

	// Try to bind JSON body if present
	_ = c.ShouldBindJSON(&req)

	// If exercise_id not provided in body, try URL param
	if req.ExerciseID == nil {
		if idStr := c.Param("id"); idStr != "" {
			if id, err := uuid.Parse(idStr); err == nil {
				req.ExerciseID = &id
			}
		}
	}

	if req.ExerciseID == nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_REQUEST",
				Message: "exercise_id is required either in body or URL",
			},
		})
		return
	}

	userUUID, _ := uuid.Parse(userID.(string))
	submission, err := h.service.StartExercise(userUUID, *req.ExerciseID, req.DeviceType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "START_EXERCISE_ERROR",
				Message: "Failed to start exercise",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusCreated, Response{
		Success: true,
		Data:    submission,
	})
}

// SubmitAnswers handles PUT /api/v1/submissions/:id/answers
func (h *ExerciseHandler) SubmitAnswers(c *gin.Context) {
	submissionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_ID",
				Message: "Invalid submission ID",
			},
		})
		return
	}

	var req models.SubmitAnswersRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_REQUEST",
				Message: "Invalid request body",
				Details: err.Error(),
			},
		})
		return
	}

	// Pass time_spent_seconds from frontend to service
	err = h.service.SubmitAnswers(submissionID, req.Answers, req.TimeSpentSeconds)
	if err != nil {
		log.Printf("[Exercise-Handler] Error submitting answers for submission %s: %v", submissionID, err)
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "SUBMIT_ANSWERS_ERROR",
				Message: "Failed to submit answers",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Data: gin.H{
			"message": "Answers submitted and graded successfully",
		},
	})
}

// GetSubmissionResult handles GET /api/v1/submissions/:id/result
func (h *ExerciseHandler) GetSubmissionResult(c *gin.Context) {
	submissionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_ID",
				Message: "Invalid submission ID",
			},
		})
		return
	}

	result, err := h.service.GetSubmissionResult(submissionID)
	if err != nil {
		c.JSON(http.StatusNotFound, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "RESULT_NOT_FOUND",
				Message: "Submission result not found",
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Data:    result,
	})
}

// GetMySubmissions handles GET /api/v1/submissions/my
func (h *ExerciseHandler) GetMySubmissions(c *gin.Context) {
	userID, exists := c.Get("user_id")
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

	query := &models.MySubmissionsQuery{}
	query.Page, _ = strconv.Atoi(c.DefaultQuery("page", "1"))
	query.Limit, _ = strconv.Atoi(c.DefaultQuery("limit", "20"))
	query.SkillType = c.Query("skill_type")
	query.Status = c.Query("status")
	query.SortBy = c.DefaultQuery("sort_by", "date")
	query.SortOrder = c.DefaultQuery("sort_order", "desc")
	query.DateFrom = c.Query("date_from")
	query.DateTo = c.Query("date_to")
	query.Search = c.Query("search")

	userUUID, _ := uuid.Parse(userID.(string))
	submissions, err := h.service.GetMySubmissions(userUUID, query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "GET_SUBMISSIONS_ERROR",
				Message: "Failed to get submissions",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Data:    submissions,
	})
}

// CreateExercise handles POST /api/v1/admin/exercises
func (h *ExerciseHandler) CreateExercise(c *gin.Context) {
	userID, exists := c.Get("user_id")
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

	var req models.CreateExerciseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("[CreateExercise] Bind error: %v", err)
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_REQUEST",
				Message: "Invalid request body",
				Details: err.Error(),
			},
		})
		return
	}

	log.Printf("[CreateExercise] Request data: %+v", req)

	userUUID, _ := uuid.Parse(userID.(string))
	exercise, err := h.service.CreateExercise(&req, userUUID)
	if err != nil {
		log.Printf("[CreateExercise] Service error: %v", err)
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "CREATE_EXERCISE_ERROR",
				Message: "Failed to create exercise",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusCreated, Response{
		Success: true,
		Data:    exercise,
	})
}

// UpdateExercise handles PUT /api/v1/admin/exercises/:id
func (h *ExerciseHandler) UpdateExercise(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_ID",
				Message: "Invalid exercise ID",
			},
		})
		return
	}

	var req models.UpdateExerciseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("[UpdateExercise] Bind error: %v", err)
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_REQUEST",
				Message: "Invalid request body",
				Details: err.Error(),
			},
		})
		return
	}

	log.Printf("[UpdateExercise] Request data: %+v", req)

	userID, _ := c.Get("user_id")
	userUUID, _ := uuid.Parse(userID.(string))
	role, _ := c.Get("role")
	userRole := role.(string)

	err = h.service.UpdateExercise(id, &req, userUUID, userRole)
	if err != nil {
		log.Printf("[UpdateExercise] Service error: %v", err)
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "UPDATE_EXERCISE_ERROR",
				Message: "Failed to update exercise",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Data: gin.H{
			"message": "Exercise updated successfully",
		},
	})
}

// DeleteExercise handles DELETE /api/v1/admin/exercises/:id
func (h *ExerciseHandler) DeleteExercise(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_ID",
				Message: "Invalid exercise ID",
			},
		})
		return
	}

	userID, _ := c.Get("user_id")
	userUUID, _ := uuid.Parse(userID.(string))
	role, _ := c.Get("role")
	userRole := role.(string)

	err = h.service.DeleteExercise(id, userUUID, userRole)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "DELETE_EXERCISE_ERROR",
				Message: "Failed to delete exercise",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Data: gin.H{
			"message": "Exercise deleted successfully",
		},
	})
}

// CreateSection handles POST /api/v1/admin/exercises/:id/sections
func (h *ExerciseHandler) CreateSection(c *gin.Context) {
	exerciseID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_ID",
				Message: "Invalid exercise ID",
			},
		})
		return
	}

	userID, _ := c.Get("user_id")
	userUUID, _ := uuid.Parse(userID.(string))

	var req models.CreateSectionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_REQUEST",
				Message: "Invalid request body",
				Details: err.Error(),
			},
		})
		return
	}

	role, _ := c.Get("role")
	userRole := role.(string)

	section, err := h.service.CreateSection(exerciseID, &req, userUUID, userRole)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "exercise not found" {
			statusCode = http.StatusNotFound
		} else if err.Error() == "unauthorized: you don't own this exercise" {
			statusCode = http.StatusForbidden
		}
		c.JSON(statusCode, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "CREATE_SECTION_ERROR",
				Message: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusCreated, Response{
		Success: true,
		Data:    section,
	})
}

// CreateQuestion handles POST /api/v1/admin/questions
func (h *ExerciseHandler) CreateQuestion(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userUUID, _ := uuid.Parse(userID.(string))

	var req models.CreateQuestionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_REQUEST",
				Message: "Invalid request body",
				Details: err.Error(),
			},
		})
		return
	}

	role, _ := c.Get("role")
	userRole := role.(string)

	question, err := h.service.CreateQuestion(&req, userUUID, userRole)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "exercise not found" {
			statusCode = http.StatusNotFound
		} else if err.Error() == "unauthorized: you don't own this exercise" {
			statusCode = http.StatusForbidden
		}
		c.JSON(statusCode, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "CREATE_QUESTION_ERROR",
				Message: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusCreated, Response{
		Success: true,
		Data:    question,
	})
}

// CreateQuestionOption handles POST /api/v1/admin/questions/:id/options
func (h *ExerciseHandler) CreateQuestionOption(c *gin.Context) {
	questionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_ID",
				Message: "Invalid question ID",
			},
		})
		return
	}

	userID, _ := c.Get("user_id")
	userUUID, _ := uuid.Parse(userID.(string))

	var req models.CreateQuestionOptionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_REQUEST",
				Message: "Invalid request body",
				Details: err.Error(),
			},
		})
		return
	}

	role, _ := c.Get("role")
	userRole := role.(string)

	option, err := h.service.CreateQuestionOption(questionID, &req, userUUID, userRole)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "CREATE_OPTION_ERROR",
				Message: "Failed to create option",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusCreated, Response{
		Success: true,
		Data:    option,
	})
}

// CreateQuestionAnswer handles POST /api/v1/admin/questions/:id/answer
func (h *ExerciseHandler) CreateQuestionAnswer(c *gin.Context) {
	questionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_ID",
				Message: "Invalid question ID",
			},
		})
		return
	}

	userID, _ := c.Get("user_id")
	userUUID, _ := uuid.Parse(userID.(string))

	var req models.CreateQuestionAnswerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_REQUEST",
				Message: "Invalid request body",
				Details: err.Error(),
			},
		})
		return
	}

	role, _ := c.Get("role")
	userRole := role.(string)

	answer, err := h.service.CreateQuestionAnswer(questionID, &req, userUUID, userRole)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "CREATE_ANSWER_ERROR",
				Message: "Failed to create answer",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusCreated, Response{
		Success: true,
		Data:    answer,
	})
}

// PublishExercise handles POST /api/v1/admin/exercises/:id/publish
func (h *ExerciseHandler) PublishExercise(c *gin.Context) {
	exerciseID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_ID",
				Message: "Invalid exercise ID",
			},
		})
		return
	}

	userID, _ := c.Get("user_id")
	userUUID, _ := uuid.Parse(userID.(string))

	role, _ := c.Get("role")
	userRole := role.(string)

	if err := h.service.PublishExercise(exerciseID, userUUID, userRole); err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "PUBLISH_FAILED",
				Message: "Failed to publish exercise",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Data: gin.H{
			"message": "Exercise published successfully",
		},
	})
}

// UnpublishExercise handles POST /api/v1/admin/exercises/:id/unpublish
func (h *ExerciseHandler) UnpublishExercise(c *gin.Context) {
	exerciseID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_ID",
				Message: "Invalid exercise ID",
			},
		})
		return
	}

	userID, _ := c.Get("user_id")
	userUUID, _ := uuid.Parse(userID.(string))

	role, _ := c.Get("role")
	userRole := role.(string)

	if err := h.service.UnpublishExercise(exerciseID, userUUID, userRole); err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "UNPUBLISH_FAILED",
				Message: "Failed to unpublish exercise",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Data: gin.H{
			"message": "Exercise unpublished successfully",
		},
	})
}

// GetAllTags handles GET /api/v1/tags
func (h *ExerciseHandler) GetAllTags(c *gin.Context) {
	tags, err := h.service.GetAllTags()
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "FETCH_FAILED",
				Message: "Failed to fetch tags",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Data:    tags,
	})
}

// GetExerciseTags handles GET /api/v1/exercises/:id/tags
func (h *ExerciseHandler) GetExerciseTags(c *gin.Context) {
	exerciseID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_ID",
				Message: "Invalid exercise ID",
			},
		})
		return
	}

	tags, err := h.service.GetExerciseTags(exerciseID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "FETCH_FAILED",
				Message: "Failed to fetch exercise tags",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Data:    tags,
	})
}

// AddTagToExercise handles POST /api/v1/admin/exercises/:id/tags
func (h *ExerciseHandler) AddTagToExercise(c *gin.Context) {
	exerciseID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_ID",
				Message: "Invalid exercise ID",
			},
		})
		return
	}

	var req models.AddTagRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_REQUEST",
				Message: "Invalid request body",
				Details: err.Error(),
			},
		})
		return
	}

	userID, _ := c.Get("user_id")
	userUUID, _ := uuid.Parse(userID.(string))

	if err := h.service.AddTagToExercise(exerciseID, req.TagID, userUUID); err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "ADD_TAG_FAILED",
				Message: "Failed to add tag to exercise",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Data: gin.H{
			"message": "Tag added successfully",
		},
	})
}

// RemoveTagFromExercise handles DELETE /api/v1/admin/exercises/:id/tags/:tag_id
func (h *ExerciseHandler) RemoveTagFromExercise(c *gin.Context) {
	exerciseID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_ID",
				Message: "Invalid exercise ID",
			},
		})
		return
	}

	tagID, err := strconv.Atoi(c.Param("tag_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_TAG_ID",
				Message: "Invalid tag ID",
			},
		})
		return
	}

	userID, _ := c.Get("user_id")
	userUUID, _ := uuid.Parse(userID.(string))

	if err := h.service.RemoveTagFromExercise(exerciseID, tagID, userUUID); err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "REMOVE_TAG_FAILED",
				Message: "Failed to remove tag from exercise",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Data: gin.H{
			"message": "Tag removed successfully",
		},
	})
}

// CreateTag handles POST /api/v1/admin/tags
func (h *ExerciseHandler) CreateTag(c *gin.Context) {
	var req models.CreateTagRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_REQUEST",
				Message: "Invalid request body",
				Details: err.Error(),
			},
		})
		return
	}

	tag, err := h.service.CreateTag(req.Name, req.Slug)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "CREATE_TAG_FAILED",
				Message: "Failed to create tag",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusCreated, Response{
		Success: true,
		Data:    tag,
	})
}

// GetBankQuestions handles GET /api/v1/admin/question-bank
func (h *ExerciseHandler) GetBankQuestions(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	skillType := c.Query("skill_type")
	questionType := c.Query("question_type")

	questions, total, err := h.service.GetBankQuestions(skillType, questionType, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "FETCH_FAILED",
				Message: "Failed to fetch question bank",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Data: gin.H{
			"questions":  questions,
			"total":      total,
			"page":       page,
			"limit":      limit,
			"totalPages": (total + limit - 1) / limit,
		},
	})
}

// CreateBankQuestion handles POST /api/v1/admin/question-bank
func (h *ExerciseHandler) CreateBankQuestion(c *gin.Context) {
	var req models.CreateBankQuestionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_REQUEST",
				Message: "Invalid request body",
				Details: err.Error(),
			},
		})
		return
	}

	userID, _ := c.Get("user_id")
	userUUID, _ := uuid.Parse(userID.(string))

	question, err := h.service.CreateBankQuestion(&req, userUUID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "CREATE_FAILED",
				Message: "Failed to create question",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusCreated, Response{
		Success: true,
		Data:    question,
	})
}

// UpdateBankQuestion handles PUT /api/v1/admin/question-bank/:id
func (h *ExerciseHandler) UpdateBankQuestion(c *gin.Context) {
	questionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_ID",
				Message: "Invalid question ID",
			},
		})
		return
	}

	var req models.UpdateBankQuestionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_REQUEST",
				Message: "Invalid request body",
				Details: err.Error(),
			},
		})
		return
	}

	userID, _ := c.Get("user_id")
	userUUID, _ := uuid.Parse(userID.(string))

	if err := h.service.UpdateBankQuestion(questionID, &req, userUUID); err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "UPDATE_FAILED",
				Message: "Failed to update question",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Data: gin.H{
			"message": "Question updated successfully",
		},
	})
}

// DeleteBankQuestion handles DELETE /api/v1/admin/question-bank/:id
func (h *ExerciseHandler) DeleteBankQuestion(c *gin.Context) {
	questionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_ID",
				Message: "Invalid question ID",
			},
		})
		return
	}

	userID, _ := c.Get("user_id")
	userUUID, _ := uuid.Parse(userID.(string))

	if err := h.service.DeleteBankQuestion(questionID, userUUID); err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "DELETE_FAILED",
				Message: "Failed to delete question",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Data: gin.H{
			"message": "Question deleted successfully",
		},
	})
}

// GetExerciseAnalytics handles GET /api/v1/admin/exercises/:id/analytics
func (h *ExerciseHandler) GetExerciseAnalytics(c *gin.Context) {
	exerciseID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_ID",
				Message: "Invalid exercise ID",
			},
		})
		return
	}

	analytics, err := h.service.GetExerciseAnalytics(exerciseID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "FETCH_FAILED",
				Message: "Failed to fetch analytics",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Data:    analytics,
	})
}

// SubmitExercise handles POST /api/v1/submissions/:id/submit
// Unified submission handler for all 4 skills (Phase 4)
func (h *ExerciseHandler) SubmitExercise(c *gin.Context) {
	submissionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_ID",
				Message: "Invalid submission ID",
			},
		})
		return
	}

	var req models.SubmitExerciseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_REQUEST",
				Message: "Invalid request body",
				Details: err.Error(),
			},
		})
		return
	}

	err = h.service.SubmitExercise(submissionID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "SUBMIT_EXERCISE_ERROR",
				Message: "Failed to submit exercise",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Data: gin.H{
			"message":       "Exercise submitted successfully",
			"submission_id": submissionID,
		},
	})
}

// UpdateQuestion handles PUT /api/v1/admin/questions/:id
func (h *ExerciseHandler) UpdateQuestion(c *gin.Context) {
	questionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_QUESTION_ID",
				Message: "Invalid question ID format",
				Details: err.Error(),
			},
		})
		return
	}

	var req models.UpdateQuestionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_REQUEST",
				Message: "Invalid request body",
				Details: err.Error(),
			},
		})
		return
	}

	userID, _ := c.Get("user_id")
	userUUID, _ := uuid.Parse(userID.(string))
	role, _ := c.Get("role")
	userRole := role.(string)

	err = h.service.UpdateQuestion(questionID, &req, userUUID, userRole)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "UPDATE_QUESTION_FAILED",
				Message: "Failed to update question",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Data: gin.H{
			"message": "Question updated successfully",
		},
	})
}

// DeleteQuestion handles DELETE /api/v1/admin/questions/:id
func (h *ExerciseHandler) DeleteQuestion(c *gin.Context) {
	questionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_QUESTION_ID",
				Message: "Invalid question ID format",
				Details: err.Error(),
			},
		})
		return
	}

	userID, _ := c.Get("user_id")
	userUUID, _ := uuid.Parse(userID.(string))
	role, _ := c.Get("role")
	userRole := role.(string)

	err = h.service.DeleteQuestion(questionID, userUUID, userRole)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "DELETE_QUESTION_FAILED",
				Message: "Failed to delete question",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Data: gin.H{
			"message": "Question deleted successfully",
		},
	})
}

// DeleteSection handles DELETE /api/v1/admin/sections/:id
func (h *ExerciseHandler) DeleteSection(c *gin.Context) {
	sectionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_SECTION_ID",
				Message: "Invalid section ID format",
				Details: err.Error(),
			},
		})
		return
	}

	userID, _ := c.Get("user_id")
	userUUID, _ := uuid.Parse(userID.(string))
	role, _ := c.Get("role")
	userRole := role.(string)

	err = h.service.DeleteSection(sectionID, userUUID, userRole)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "DELETE_SECTION_FAILED",
				Message: "Failed to delete section",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Data: gin.H{
			"message": "Section deleted successfully",
		},
	})
}

// DeleteQuestionOption handles DELETE /api/v1/admin/questions/:id/options/:option_id
func (h *ExerciseHandler) DeleteQuestionOption(c *gin.Context) {
	questionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_QUESTION_ID",
				Message: "Invalid question ID format",
				Details: err.Error(),
			},
		})
		return
	}

	optionID, err := uuid.Parse(c.Param("option_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_OPTION_ID",
				Message: "Invalid option ID format",
				Details: err.Error(),
			},
		})
		return
	}

	userID, _ := c.Get("user_id")
	userUUID, _ := uuid.Parse(userID.(string))
	role, _ := c.Get("role")
	userRole := role.(string)

	err = h.service.DeleteQuestionOption(questionID, optionID, userUUID, userRole)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "DELETE_OPTION_FAILED",
				Message: "Failed to delete option",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Data: gin.H{
			"message": "Option deleted successfully",
		},
	})
}

// UpdateQuestionAnswer handles PUT /api/v1/admin/questions/:id/answers/:answer_id
func (h *ExerciseHandler) UpdateQuestionAnswer(c *gin.Context) {
	questionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_QUESTION_ID",
				Message: "Invalid question ID format",
				Details: err.Error(),
			},
		})
		return
	}

	answerID, err := uuid.Parse(c.Param("answer_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_ANSWER_ID",
				Message: "Invalid answer ID format",
				Details: err.Error(),
			},
		})
		return
	}

	var req models.UpdateQuestionAnswerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_REQUEST",
				Message: "Invalid request body",
				Details: err.Error(),
			},
		})
		return
	}

	userID, _ := c.Get("user_id")
	userUUID, _ := uuid.Parse(userID.(string))
	role, _ := c.Get("role")
	userRole := role.(string)

	err = h.service.UpdateQuestionAnswer(questionID, answerID, &req, userUUID, userRole)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "UPDATE_ANSWER_FAILED",
				Message: "Failed to update answer",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Data: gin.H{
			"message": "Answer updated successfully",
		},
	})
}

// DeleteQuestionAnswer handles DELETE /api/v1/admin/questions/:id/answers/:answer_id
func (h *ExerciseHandler) DeleteQuestionAnswer(c *gin.Context) {
	questionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_QUESTION_ID",
				Message: "Invalid question ID format",
				Details: err.Error(),
			},
		})
		return
	}

	answerID, err := uuid.Parse(c.Param("answer_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "INVALID_ANSWER_ID",
				Message: "Invalid answer ID format",
				Details: err.Error(),
			},
		})
		return
	}

	userID, _ := c.Get("user_id")
	userUUID, _ := uuid.Parse(userID.(string))
	role, _ := c.Get("role")
	userRole := role.(string)

	err = h.service.DeleteQuestionAnswer(questionID, answerID, userUUID, userRole)
	if err != nil {
		c.JSON(http.StatusInternalServerError, Response{
			Success: false,
			Error: &ErrorInfo{
				Code:    "DELETE_ANSWER_FAILED",
				Message: "Failed to delete answer",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, Response{
		Success: true,
		Data: gin.H{
			"message": "Answer deleted successfully",
		},
	})
}

// HealthCheck handles GET /health
func (h *ExerciseHandler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "healthy",
		"service": "exercise-service",
	})
}
