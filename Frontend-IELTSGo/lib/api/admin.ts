import { apiClient } from "./apiClient"
import { instructorApi } from "./instructor"
import type {
  DashboardStats,
  Activity,
  SystemHealth,
  LogEntry,
  NotificationPayload,
  NotificationStats,
} from "@/types/admin"
import type { User, Course, Exercise, PaginatedResponse } from "@/types"

// Admin Analytics API
// Note: Backend admin analytics endpoints are not yet implemented
// Using available user and course endpoints as workaround
export const adminApi = {
  // Get overview analytics (MOCK - backend not implemented)
  getOverviewAnalytics: async () => {
    // TODO: Backend needs to implement /admin/analytics/overview
    // For now, return mock data
    return {
      totalUsers: 0,
      totalCourses: 0,
      totalExercises: 0,
      activeUsers: 0,
    }
  },

  // Get user analytics (MOCK - backend not implemented)
  getUserAnalytics: async (days: number = 30) => {
    // TODO: Backend needs to implement /admin/analytics/users
    return {
      newUsers: [],
      activeUsers: [],
    }
  },

  // Get enrollment analytics (MOCK - backend not implemented)  
  getEnrollmentAnalytics: async (days: number = 7) => {
    // TODO: Backend needs to implement /admin/analytics/enrollments
    return {
      enrollments: [],
    }
  },

  // Get recent activities (MOCK - backend not implemented)
  getRecentActivities: async (limit: number = 20) => {
    // TODO: Backend needs to implement /admin/activities
    return []
  },

  // User Management
  async getUsers(params: {
    page?: number
    limit?: number
    role?: string
    status?: string
    search?: string
  }): Promise<PaginatedResponse<User>> {
    const queryParams = new URLSearchParams()
    if (params.page) queryParams.append("page", params.page.toString())
    if (params.limit) queryParams.append("limit", params.limit.toString())
    if (params.role) queryParams.append("role", params.role)
    if (params.status) queryParams.append("status", params.status)
    if (params.search) queryParams.append("search", params.search)

    const response = await apiClient.get<{
      success: boolean
      data: {
        users: User[]
        pagination: {
          page: number
          limit: number
          total: number
          totalPages: number
        }
      }
    }>(`/admin/users?${queryParams.toString()}`)
    
    return {
      data: response.data.data.users,
      pagination: response.data.data.pagination
    }
  },

  async getUserById(id: string): Promise<User> {
    const response = await apiClient.get<{
      success: boolean
      data: User
    }>(`/admin/users/${id}`)
    return response.data.data
  },

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const response = await apiClient.put<{
      success: boolean
      data: User
      message: string
    }>(`/admin/users/${id}`, data)
    return response.data.data
  },

  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/admin/users/${id}`)
  },

  async updateUserStatus(id: string, status: "active" | "suspended" | "locked"): Promise<User> {
    const response = await apiClient.put<{
      success: boolean
      data: User
      message: string
    }>(`/admin/users/${id}/status`, { status })
    return response.data.data
  },

  async activateUser(id: string): Promise<void> {
    await this.updateUserStatus(id, "active")
  },

  async deactivateUser(id: string): Promise<void> {
    await this.updateUserStatus(id, "suspended")
  },

  async lockUser(id: string): Promise<void> {
    await this.updateUserStatus(id, "locked")
  },

  async unlockUser(id: string): Promise<void> {
    await this.updateUserStatus(id, "active")
  },

  async assignRole(id: string, role: "student" | "instructor" | "admin"): Promise<void> {
    await apiClient.post(`/admin/users/${id}/roles`, { role })
  },

  async revokeRole(id: string, role: string): Promise<void> {
    await apiClient.delete(`/admin/users/${id}/roles/${role}`)
  },


  async revokeRole(id: string, role: "student" | "instructor" | "admin"): Promise<void> {
    await apiClient.delete(`/admin/users/${id}/revoke-role`, { data: { role } })
  },

  async resetPassword(id: string): Promise<void> {
    await apiClient.post(`/admin/users/${id}/reset-password`)
  },

  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/admin/users/${id}`)
  },

  // Content Management
  async getCourses(params: {
    page?: number
    limit?: number
    status?: "draft" | "published" | "archived"
    skill_type?: string
    level?: string
    enrollment_type?: string
    search?: string
  }) {
    return instructorApi.getCourses(params)
  },

  async getContentReviewQueue(status: string) {
    // Map status to course status
    const statusMap: Record<string, string> = {
      'pending': 'draft',
      'approved': 'published',
      'rejected': 'archived',
      'draft': 'draft',
      'published': 'published',
      'archived': 'archived'
    }
    return this.getCourses({ status: statusMap[status] as any, limit: 50 })
  },

  async reviewContent(id: string, status: "approved" | "rejected") {
    if (status === "approved") {
      return instructorApi.publishCourse(id)
    } else {
      return instructorApi.archiveCourse(id)
    }
  },

  async createCourse(data: any) {
    return instructorApi.createCourse(data)
  },

  async updateCourse(id: string, data: any) {
    return instructorApi.updateCourse(id, data)
  },

  async deleteCourse(id: string) {
    return instructorApi.deleteCourse(id)
  },

  async getExercises(params: {
    page?: number
    limit?: number
    difficulty?: "easy" | "medium" | "hard"
  }): Promise<PaginatedResponse<Exercise>> {
    const queryParams = new URLSearchParams()
    if (params.page) queryParams.append("page", params.page.toString())
    if (params.limit) queryParams.append("limit", params.limit.toString())
    if (params.difficulty) queryParams.append("difficulty", params.difficulty)

    const response = await apiClient.get<PaginatedResponse<Exercise>>(
      `/admin/content/exercises?${queryParams.toString()}`,
    )
    return response.data
  },

  // System Health
  async getSystemHealth(): Promise<SystemHealth> {
    const response = await apiClient.get<SystemHealth>("/admin/system/health")
    return response.data
  },

  async getSystemLogs(params: {
    service?: string
    level?: "error" | "warning" | "info"
    from?: string
    to?: string
  }): Promise<LogEntry[]> {
    const queryParams = new URLSearchParams()
    if (params.service) queryParams.append("service", params.service)
    if (params.level) queryParams.append("level", params.level)
    if (params.from) queryParams.append("from", params.from)
    if (params.to) queryParams.append("to", params.to)

    const response = await apiClient.get<LogEntry[]>(`/admin/system/logs?${queryParams.toString()}`)
    return response.data
  },

  // Notifications
  async sendNotification(data: {
    user_id: string
    type: "achievement" | "reminder" | "course_update" | "exercise_graded" | "system"
    category: "info" | "success" | "warning" | "alert"
    title: string
    message: string
    action_type?: string
    action_data?: Record<string, any>
  }): Promise<any> {
    const response = await apiClient.post("/admin/notifications", data)
    return response.data
  },

  async sendBulkNotification(data: {
    user_ids: string[] // Array of user IDs (required, min 1)
    type: "achievement" | "reminder" | "course_update" | "exercise_graded" | "system"
    category: "info" | "success" | "warning" | "alert"
    title: string
    message: string
    action_type?: string
    action_data?: Record<string, any>
  }): Promise<{
    total_users: number
    success_count: number
    failed_count: number
    message: string
  }> {
    const response = await apiClient.post<{
      total_users: number
      success_count: number
      failed_count: number
      message: string
    }>("/admin/notifications/bulk", data)
    return response.data
  },

  async updateSettings(category: string, settings: any): Promise<void> {
    await apiClient.put(`/admin/settings/${category}`, settings)
  },

  // Exercise Management APIs
  async getAllExercises(params?: {
    page?: number
    limit?: number
    skill_type?: string
    difficulty?: string
    is_published?: boolean
  }): Promise<PaginatedResponse<Exercise>> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())
    if (params?.skill_type) queryParams.append("skill_type", params.skill_type)
    if (params?.difficulty) queryParams.append("difficulty", params.difficulty)
    if (params?.is_published !== undefined) queryParams.append("is_published", params.is_published.toString())

    const response = await apiClient.get<{
      success: boolean
      data: {
        exercises: Exercise[]
        pagination: {
          page: number
          limit: number
          total: number
          total_pages: number
        }
      }
    }>(`/exercises?${queryParams.toString()}`)
    
    return {
      data: response.data.data.exercises,
      pagination: response.data.data.pagination
    }
  },

  async getExerciseById(id: string): Promise<Exercise> {
    const response = await apiClient.get<{ 
      success: boolean
      data: Exercise 
    }>(`/exercises/${id}`)
    return response.data.data
  },

  async createExercise(data: {
    title: string
    description?: string
    skill_type: string
    difficulty: string
    time_limit?: number
    course_id?: string
  }): Promise<Exercise> {
    console.log("[API] Creating exercise with data:", data)
    const response = await apiClient.post<{ 
      success: boolean
      data: Exercise 
    }>("/admin/exercises", data)
    console.log("[API] Create response:", response.data)
    return response.data.data
  },

  async updateExercise(id: string, data: Partial<Exercise>): Promise<Exercise> {
    console.log("[API] Updating exercise:", id, "with data:", data)
    const response = await apiClient.put<{ 
      success: boolean
      data: Exercise 
    }>(`/admin/exercises/${id}`, data)
    console.log("[API] Update response:", response.data)
    return response.data.data
  },

  async deleteExercise(id: string): Promise<void> {
    await apiClient.delete(`/admin/exercises/${id}`)
  },

  async publishExercise(id: string): Promise<Exercise> {
    const response = await apiClient.post<{ 
      success: boolean
      data: Exercise 
    }>(`/admin/exercises/${id}/publish`)
    return response.data.data
  },

  async unpublishExercise(id: string): Promise<Exercise> {
    const response = await apiClient.post<{ 
      success: boolean
      data: Exercise 
    }>(`/admin/exercises/${id}/unpublish`)
    return response.data.data
  },

  async getExerciseAnalytics(id: string): Promise<any> {
    const response = await apiClient.get<{ 
      success: boolean
      data: any 
    }>(`/admin/exercises/${id}/analytics`)
    return response.data.data
  },

  // Section Management
  async createSection(exerciseId: string, data: {
    title: string
    description?: string
    section_number: number
    display_order: number
    audio_url?: string
    audio_start_time?: number
    audio_end_time?: number
    transcript?: string
    instructions?: string
    passage_title?: string
    passage_content?: string
    passage_word_count?: number
    time_limit_minutes?: number
  }): Promise<any> {
    const response = await apiClient.post<{
      success: boolean
      data: any
    }>(`/admin/exercises/${exerciseId}/sections`, data)
    return response.data.data
  },

  async deleteSection(sectionId: string): Promise<void> {
    await apiClient.delete(`/admin/sections/${sectionId}`)
  },

  // Question Management
  async createQuestion(data: {
    exercise_id: string
    section_id: string
    question_number: number
    question_text: string
    question_type: string
    points?: number
    difficulty?: string
    display_order: number
    audio_url?: string
    image_url?: string
    context_text?: string
    explanation?: string
    tips?: string
  }): Promise<any> {
    const response = await apiClient.post<{
      success: boolean
      data: any
    }>("/admin/questions", data)
    return response.data.data
  },

  async createQuestionOption(questionId: string, data: {
    option_label: string
    option_text: string
    is_correct: boolean
    display_order: number
    option_image_url?: string
  }): Promise<any> {
    const response = await apiClient.post<{
      success: boolean
      data: any
    }>(`/admin/questions/${questionId}/options`, data)
    return response.data.data
  },

  async createQuestionAnswer(questionId: string, data: {
    answer_text: string
    alternative_answers?: string[]
    is_case_sensitive?: boolean
    matching_order?: number
  }): Promise<any> {
    const response = await apiClient.post<{
      success: boolean
      data: any
    }>(`/admin/questions/${questionId}/answers`, data)
    return response.data.data
  },

  async updateQuestionAnswer(questionId: string, answerId: string, data: {
    answer_text?: string
    alternative_answers?: string[]
    is_case_sensitive?: boolean
    matching_order?: number
  }): Promise<any> {
    const response = await apiClient.put<{
      success: boolean
      data: any
    }>(`/admin/questions/${questionId}/answers/${answerId}`, data)
    return response.data.data
  },

  async deleteQuestionAnswer(questionId: string, answerId: string): Promise<void> {
    await apiClient.delete(`/admin/questions/${questionId}/answers/${answerId}`)
  },

  async updateQuestion(questionId: string, data: {
    question_text?: string
    question_type?: string
    points?: number
    difficulty?: string
    explanation?: string
    tips?: string
  }): Promise<any> {
    const response = await apiClient.put<{
      success: boolean
      data: any
    }>(`/admin/questions/${questionId}`, data)
    return response.data.data
  },

  async deleteQuestion(questionId: string): Promise<void> {
    await apiClient.delete(`/admin/questions/${questionId}`)
  },

  async deleteQuestionOption(questionId: string, optionId: string): Promise<void> {
    await apiClient.delete(`/admin/questions/${questionId}/options/${optionId}`)
  },

  // Tag Management
  async getAllTags(): Promise<any[]> {
    const response = await apiClient.get<{ 
      success: boolean
      data: any[] 
    }>("/tags")
    return response.data.data
  },

  async createTag(data: { name: string; category?: string }): Promise<any> {
    const response = await apiClient.post<{
      success: boolean
      data: any
    }>("/admin/tags", data)
    return response.data.data
  },

  async addTagToExercise(exerciseId: string, tagId: string): Promise<void> {
    await apiClient.post(`/admin/exercises/${exerciseId}/tags`, { tag_id: tagId })
  },

  async removeTagFromExercise(exerciseId: string, tagId: string): Promise<void> {
    await apiClient.delete(`/admin/exercises/${exerciseId}/tags/${tagId}`)
  },

  // Question Bank Management
  async getBankQuestions(params?: {
    page?: number
    limit?: number
    question_type?: string
    difficulty?: string
  }): Promise<PaginatedResponse<any>> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())
    if (params?.question_type) queryParams.append("question_type", params.question_type)
    if (params?.difficulty) queryParams.append("difficulty", params.difficulty)

    const response = await apiClient.get<{
      success: boolean
      data: {
        questions: any[]
        pagination: any
      }
    }>(`/admin/question-bank?${queryParams.toString()}`)
    
    return {
      data: response.data.data.questions,
      pagination: response.data.data.pagination
    }
  },

  async createBankQuestion(data: {
    question_type: string
    question_text: string
    difficulty?: string
    tags?: string[]
  }): Promise<any> {
    const response = await apiClient.post<{
      success: boolean
      data: any
    }>("/admin/question-bank", data)
    return response.data.data
  },

  async updateBankQuestion(id: string, data: Partial<any>): Promise<any> {
    const response = await apiClient.put<{
      success: boolean
      data: any
    }>(`/admin/question-bank/${id}`, data)
    return response.data.data
  },

  async deleteBankQuestion(id: string): Promise<void> {
    await apiClient.delete(`/admin/question-bank/${id}`)
  },
}
