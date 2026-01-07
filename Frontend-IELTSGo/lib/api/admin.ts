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
    role?: "student" | "instructor" | "admin"
    status?: "active" | "inactive" | "locked"
    search?: string
  }): Promise<PaginatedResponse<User>> {
    const queryParams = new URLSearchParams()
    if (params.page) queryParams.append("page", params.page.toString())
    if (params.limit) queryParams.append("limit", params.limit.toString())
    if (params.role) queryParams.append("role", params.role)
    if (params.status) queryParams.append("status", params.status)
    if (params.search) queryParams.append("search", params.search)

    const response = await apiClient.get<PaginatedResponse<User>>(`/admin/users?${queryParams.toString()}`)
    return response.data
  },

  async getUserById(id: string): Promise<User> {
    const response = await apiClient.get<User>(`/admin/users/${id}`)
    return response.data
  },

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const response = await apiClient.put<User>(`/admin/users/${id}`, data)
    return response.data
  },

  async activateUser(id: string): Promise<void> {
    await apiClient.put(`/admin/users/${id}/activate`)
  },

  async deactivateUser(id: string): Promise<void> {
    await apiClient.put(`/admin/users/${id}/deactivate`)
  },

  async lockUser(id: string, reason: string): Promise<void> {
    await apiClient.put(`/admin/users/${id}/lock`, { reason })
  },

  async unlockUser(id: string): Promise<void> {
    await apiClient.put(`/admin/users/${id}/unlock`)
  },

  async assignRole(id: string, role: "student" | "instructor" | "admin"): Promise<void> {
    await apiClient.post(`/admin/users/${id}/assign-role`, { role })
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
  async sendNotification(payload: NotificationPayload): Promise<void> {
    await apiClient.post("/admin/notifications", payload)
  },

  async getNotificationStats(id: string): Promise<NotificationStats> {
    const response = await apiClient.get<NotificationStats>(`/admin/notifications/${id}/stats`)
    return response.data
  },

  async sendBulkNotification(data: {
    recipient: string
    type: string
    subject: string
    content: string
  }): Promise<void> {
    await apiClient.post("/admin/notifications/bulk", data)
  },

  async scheduleNotification(data: {
    recipient: string
    type: string
    subject: string
    content: string
    scheduledAt: string
  }): Promise<void> {
    await apiClient.post("/admin/notifications/schedule", data)
  },

  async updateSettings(category: string, settings: any): Promise<void> {
    await apiClient.put(`/admin/settings/${category}`, settings)
  },
}
