import { apiClient } from "./apiClient"

export interface DashboardStats {
  total_users: number
  total_students: number
  total_instructors: number
  total_admins: number
  user_growth: number
  total_courses: number
  active_courses: number
  draft_courses: number
  archived_courses: number
  total_exercises: number
  submissions_today: number
  average_completion_rate: number
  system_health: string
  cpu_usage: number
  memory_usage: number
}

export interface UserGrowthData {
  date: string
  count: number
}

export interface EnrollmentData {
  date: string
  enrollments: number
  completions: number
}

export interface Activity {
  id: string
  type: "user" | "course" | "exercise" | "review"
  action: string
  actor_name: string
  actor_avatar?: string
  timestamp: string
}

interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: {
    code: string
    message: string
  }
}

export const adminStatsApi = {
  // Get dashboard statistics
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<ApiResponse<DashboardStats>>("/admin/stats/dashboard")
    return response.data.data
  },

  // Get user growth data
  getUserGrowthData: async (days: number = 30): Promise<UserGrowthData[]> => {
    const response = await apiClient.get<ApiResponse<UserGrowthData[]>>(
      `/admin/stats/user-growth?days=${days}`
    )
    return response.data.data
  },

  // Get enrollment statistics
  getEnrollmentData: async (days: number = 7): Promise<EnrollmentData[]> => {
    const response = await apiClient.get<ApiResponse<EnrollmentData[]>>(
      `/admin/stats/enrollments?days=${days}`
    )
    return response.data.data
  },

  // Get recent activities
  getRecentActivities: async (limit: number = 20): Promise<Activity[]> => {
    const response = await apiClient.get<ApiResponse<Activity[]>>(
      `/admin/stats/activities?limit=${limit}`
    )
    return response.data.data
  },
}
