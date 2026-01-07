import { apiClient } from "./apiClient"
import type { Course, Exercise, PaginatedResponse } from "@/types"

export interface InstructorStats {
  totalCourses: number
  publishedCourses: number
  draftCourses: number
  totalExercises: number
  publishedExercises: number
  draftExercises: number
  totalStudents: number
  activeStudents: number
  averageCompletionRate: number
  completionTrend: number
}

export interface InstructorActivity {
  id: string
  type: "enrollment" | "completion" | "review" | "submission"
  action: string
  studentName: string
  studentAvatar?: string
  contentTitle: string
  timestamp: string
}

export const instructorApi = {
  // Dashboard
  async getDashboardStats(): Promise<InstructorStats> {
    const response = await apiClient.get<InstructorStats>("/instructor/dashboard/stats")
    return response.data
  },

  async getRecentActivity(limit = 10): Promise<InstructorActivity[]> {
    const response = await apiClient.get<InstructorActivity[]>(`/instructor/dashboard/activity?limit=${limit}`)
    return response.data
  },

  async getEngagementData(
    days = 30,
  ): Promise<{ date: string; enrollments: number; attempts: number; completions: number }[]> {
    const response = await apiClient.get(`/instructor/analytics/engagement?days=${days}`)
    return response.data
  },

  // Courses
  async getCourses(params?: {
    page?: number
    limit?: number
    status?: "draft" | "published" | "archived"
    sort?: string
  }): Promise<PaginatedResponse<Course>> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())
    if (params?.status) queryParams.append("status", params.status)
    if (params?.sort) queryParams.append("sort", params.sort)

    const response = await apiClient.get<PaginatedResponse<Course>>(`/courses?${queryParams.toString()}`)
    return response.data
  },

  async getMyCourses(params?: {
    page?: number
    limit?: number
    status?: "draft" | "published" | "archived"
    sort?: string
  }): Promise<PaginatedResponse<Course>> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())
    if (params?.status) queryParams.append("status", params.status)
    if (params?.sort) queryParams.append("sort", params.sort)

    const response = await apiClient.get<PaginatedResponse<Course>>(`/instructor/courses?${queryParams.toString()}`)
    return response.data
  },

  async getCourseById(id: string): Promise<Course> {
    const response = await apiClient.get<{ success: boolean; data: Course }>(`/courses/${id}`)
    return response.data.data || response.data
  },

  async getCourse(id: string): Promise<Course> {
    return this.getCourseById(id)
  },

  async createCourse(data: {
    title: string
    slug: string
    description?: string
    short_description?: string
    skill_type: string
    level: string
    target_band_score?: number
    thumbnail_url?: string
    preview_video_url?: string
    duration_hours?: number
    enrollment_type: string
    price: number
    currency: string
  }): Promise<Course> {
    const response = await apiClient.post<{ success: boolean; data: Course }>('/admin/courses', data)
    return response.data.data
  },

  async updateCourse(id: string, data: {
    title?: string
    description?: string
    short_description?: string
    target_band_score?: number
    thumbnail_url?: string
    preview_video_url?: string
    duration_hours?: number
    price?: number
    status?: string
    is_featured?: boolean
    is_recommended?: boolean
  }): Promise<Course> {
    const response = await apiClient.put<{ success: boolean; data: Course }>(`/admin/courses/${id}`, data)
    return response.data.data
  },

  async deleteCourse(id: string): Promise<void> {
    await apiClient.delete(`/admin/courses/${id}`)
  },

  async publishCourse(id: string): Promise<Course> {
    const response = await apiClient.post<{ success: boolean; data: Course }>(`/admin/courses/${id}/publish`)
    return response.data.data
  },

  async archiveCourse(id: string): Promise<Course> {
    return this.updateCourse(id, { status: 'archived' })
  },

  // Modules
  async createModule(data: {
    course_id: string
    title: string
    description?: string
    duration_hours?: number
    display_order: number
  }): Promise<any> {
    const response = await apiClient.post('/admin/modules', data)
    return response.data.data || response.data
  },

  async updateModule(id: string, data: {
    title?: string
    description?: string
    duration_hours?: number
    display_order?: number
  }): Promise<any> {
    const response = await apiClient.put(`/admin/modules/${id}`, data)
    return response.data.data || response.data
  },

  async deleteModule(id: string): Promise<void> {
    await apiClient.delete(`/admin/modules/${id}`)
  },

  // Lessons
  async createLesson(data: {
    module_id: string
    title: string
    description?: string
    content_type: string
    duration_minutes?: number
    display_order: number
    is_free: boolean
  }): Promise<any> {
    const response = await apiClient.post('/admin/lessons', data)
    return response.data.data || response.data
  },

  async updateLesson(id: string, data: {
    title?: string
    description?: string
    content_type?: string
    duration_minutes?: number
    display_order?: number
    is_free?: boolean
  }): Promise<any> {
    const response = await apiClient.put(`/admin/lessons/${id}`, data)
    return response.data.data || response.data
  },

  async deleteLesson(id: string): Promise<void> {
    await apiClient.delete(`/admin/lessons/${id}`)
  },

  async addVideoToLesson(lessonId: string, data: {
    title: string
    video_provider: string
    video_id: string
    video_url: string
    duration_seconds?: number
    thumbnail_url?: string
    quality?: string
    display_order?: number
  }): Promise<any> {
    const response = await apiClient.post(`/admin/lessons/${lessonId}/videos`, data)
    return response.data.data || response.data
  },

  // Exercises
  async getMyExercises(params?: {
    page?: number
    limit?: number
    type?: string
    difficulty?: string
    status?: string
  }): Promise<PaginatedResponse<Exercise>> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())
    if (params?.type) queryParams.append("type", params.type)
    if (params?.difficulty) queryParams.append("difficulty", params.difficulty)
    if (params?.status) queryParams.append("status", params.status)

    const response = await apiClient.get<PaginatedResponse<Exercise>>(`/instructor/exercises?${queryParams.toString()}`)
    return response.data
  },
}
