"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "@/components/charts/chart-wrapper"
import { TrendingUp, Users, BookOpen, Award, TrendingDown, DollarSign } from "lucide-react"
import { adminStatsApi } from "@/lib/api/admin-stats"
import type { DashboardStats, UserGrowthData, EnrollmentData } from "@/lib/api/admin-stats"
import { useTranslations } from '@/lib/i18n'
import { format, subDays } from "date-fns"

const COLORS = ["#ED372A", "#101615", "#FEF7EC", "#FF6B6B", "#4ECDC4"]

export default function AdminAnalyticsPage() {

  const t = useTranslations('common')
  const searchParams = useSearchParams()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview")
  const [timeRange, setTimeRange] = useState("30")
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [userGrowthData, setUserGrowthData] = useState<UserGrowthData[]>([])
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData[]>([])
  const [loading, setLoading] = useState(true)

  // Update tab when URL changes
  useEffect(() => {
    const tab = searchParams.get("tab") || "overview"
    setActiveTab(tab)
  }, [searchParams])

  // Update tab when URL changes
  useEffect(() => {
    const tab = searchParams.get("tab") || "overview"
    setActiveTab(tab)
  }, [searchParams])

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const days = parseInt(timeRange)

      const [stats, userGrowth, enrollments] = await Promise.all([
        adminStatsApi.getDashboardStats(),
        adminStatsApi.getUserGrowthData(days),
        adminStatsApi.getEnrollmentData(days),
      ])

      setDashboardStats(stats)
      setUserGrowthData(userGrowth)
      setEnrollmentData(enrollments)
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    router.push(`/admin/analytics?tab=${value}`)
  }

  if (loading || !dashboardStats) {
    return <div className="text-center py-12">{t('loading_analytics')}</div>
  }

  // Transform user growth data for chart
  const userGrowthChartData = userGrowthData.map((item) => ({
    date: format(new Date(item.date), "MMM dd"),
    users: item.count,
  }))

  // Transform enrollment data for chart
  const enrollmentChartData = enrollmentData.map((item) => ({
    date: format(new Date(item.date), "MMM dd"),
    enrollments: item.enrollments,
    completions: item.completions,
  }))

  // Calculate course completion percentage
  const totalCourses = dashboardStats.total_courses
  const activeCourses = dashboardStats.active_courses
  const draftCourses = dashboardStats.draft_courses
  const archivedCourses = dashboardStats.archived_courses
  const completedCourses = totalCourses - activeCourses - draftCourses - archivedCourses

  const courseCompletionData = [
    { name: "Completed", value: completedCourses },
    { name: "Active", value: activeCourses },
    { name: "Draft", value: draftCourses },
    { name: "Archived", value: archivedCourses },
  ].filter(item => item.value > 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('analytics_reports')}</h1>
          <p className="text-muted-foreground mt-1">{t('comprehensive_platform_analytics_and_ins')}</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">{t('last_7_days')}</SelectItem>
            <SelectItem value="30">{t('last_30_days')}</SelectItem>
            <SelectItem value="90">{t('last_90_days')}</SelectItem>
            <SelectItem value="365">{t('last_year')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t('total_users')}</CardTitle>
                <Users className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats.total_users.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  {dashboardStats.user_growth >= 0 ? (
                    <>
                      <TrendingUp className="w-3 h-3 text-green-500" />
                      <span className="text-green-500">+{dashboardStats.user_growth.toFixed(1)}%</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-3 h-3 text-red-500" />
                      <span className="text-red-500">{dashboardStats.user_growth.toFixed(1)}%</span>
                    </>
                  )}
                  {" "}from last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t('total_students')}</CardTitle>
                <Users className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats.total_students.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {dashboardStats.total_instructors} instructors, {dashboardStats.total_admins} admins
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t('total_courses')}</CardTitle>
                <BookOpen className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats.total_courses.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {dashboardStats.active_courses} active, {dashboardStats.draft_courses} draft, {dashboardStats.archived_courses} archived
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t('avg_completion_rate')}</CardTitle>
                <Award className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats.average_completion_rate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {dashboardStats.submissions_today} submissions today
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('user_growth')}</CardTitle>
                <CardDescription>New user registrations over time</CardDescription>
              </CardHeader>
              <CardContent>
                {userGrowthChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={userGrowthChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="users" stroke="#ED372A" strokeWidth={2} name="New Users" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No user growth data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('course_completion_status')}</CardTitle>
                <CardDescription>{t('distribution_of_course_completion_rates')}</CardDescription>
              </CardHeader>
              <CardContent>
                {courseCompletionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={courseCompletionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {courseCompletionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No course data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>{t('enrollments_and_completions')}</CardTitle>
                <CardDescription>Course enrollments and completions over time</CardDescription>
              </CardHeader>
              <CardContent>
                {enrollmentChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={enrollmentChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="enrollments" fill="#ED372A" name="Enrollments" />
                      <Bar dataKey="completions" fill="#4ECDC4" name="Completions" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No enrollment data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats.total_users.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  {dashboardStats.user_growth >= 0 ? (
                    <>
                      <TrendingUp className="w-3 h-3 text-green-500" />
                      <span className="text-green-500">+{dashboardStats.user_growth.toFixed(1)}%</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-3 h-3 text-red-500" />
                      <span className="text-red-500">{dashboardStats.user_growth.toFixed(1)}%</span>
                    </>
                  )}
                  {" "}growth
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Students</CardTitle>
                <Users className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats.total_students.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {((dashboardStats.total_students / dashboardStats.total_users) * 100).toFixed(1)}% of total users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Instructors & Admins</CardTitle>
                <Users className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(dashboardStats.total_instructors + dashboardStats.total_admins).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {dashboardStats.total_instructors} instructors, {dashboardStats.total_admins} admins
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>User Growth Over Time</CardTitle>
              <CardDescription>New user registrations over the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              {userGrowthChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={userGrowthChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="users" stroke="#ED372A" strokeWidth={2} name="New Users" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  No user growth data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                <BookOpen className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats.total_courses.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  All courses in the platform
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
                <BookOpen className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats.active_courses.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {((dashboardStats.active_courses / dashboardStats.total_courses) * 100).toFixed(1)}% of total ({dashboardStats.draft_courses} draft, {dashboardStats.archived_courses} archived)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <Award className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats.average_completion_rate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Average across all courses
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Status Distribution</CardTitle>
                <CardDescription>Breakdown of courses by status</CardDescription>
              </CardHeader>
              <CardContent>
                {courseCompletionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={courseCompletionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {courseCompletionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                    No course data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Enrollments & Completions</CardTitle>
                <CardDescription>Course activity over time</CardDescription>
              </CardHeader>
              <CardContent>
                {enrollmentChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={enrollmentChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="enrollments" fill="#ED372A" name="Enrollments" />
                      <Bar dataKey="completions" fill="#4ECDC4" name="Completions" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                    No enrollment data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Coming Soon</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Revenue tracking not yet implemented
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                <Users className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Subscription system pending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
                <DollarSign className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Payment integration required
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
              <CardDescription>Financial performance tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground">
                <DollarSign className="h-16 w-16 mb-4 opacity-20" />
                <p className="text-lg font-medium">Revenue tracking coming soon</p>
                <p className="text-sm mt-2">This feature requires payment integration</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
