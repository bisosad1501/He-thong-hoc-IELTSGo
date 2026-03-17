"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { CheckCircle, XCircle, Clock, Eye, Edit, Trash2, Plus, ChevronLeft, ChevronRight, Search } from "lucide-react"
import { adminApi } from "@/lib/api/admin"
import { instructorApi } from "@/lib/api/instructor"
import { useToast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/utils/date"
import { CourseEditModal } from "@/components/admin/course-edit-modal"
import { CourseCreateModal } from "@/components/admin/course-create-modal"

interface Course {
  id: string
  title: string
  instructor_name?: string
  status: "draft" | "published" | "archived"
  created_at?: string
  published_at?: string
  skill_type?: string
  level?: string
  total_enrollments?: number
}

export default function AdminCoursesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const initialSkill = searchParams.get("skill") || "all"
  const initialStatus = (searchParams.get("status") as "all" | "published" | "draft" | "archived") || "all"
  const [activeTab, setActiveTab] = useState(initialSkill)
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft" | "archived">(initialStatus)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const itemsPerPage = 20
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null)

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (activeTab !== "all") params.set("skill", activeTab)
    if (statusFilter !== "all") params.set("status", statusFilter)
    router.replace(`/admin/courses-management?${params.toString()}`, { scroll: false })
  }, [activeTab, statusFilter, router])

  useEffect(() => {
    setCurrentPage(1)
    fetchCourses(1)
  }, [activeTab, statusFilter])

  const fetchCourses = async (page: number = currentPage) => {
    try {
      setLoading(true)
      
      // Fetch all courses from all statuses
      const draftResponse = await adminApi.getContentReviewQueue("draft")
      const publishedResponse = await adminApi.getContentReviewQueue("published")
      const archivedResponse = await adminApi.getContentReviewQueue("archived")
      
      const allCourses = [
        ...(draftResponse.data?.courses || []),
        ...(publishedResponse.data?.courses || []),
        ...(archivedResponse.data?.courses || [])
      ]
      
      // Filter out deleted courses
      let filteredCourses = allCourses.filter((course: any) => 
        course.deleted_at === null || course.deleted_at === undefined
      )
      
      // Apply status filter
      if (statusFilter !== "all") {
        filteredCourses = filteredCourses.filter((course: any) => 
          course.status === statusFilter
        )
      }
      
      // Apply skill type filter
      if (activeTab !== "all") {
        filteredCourses = filteredCourses.filter((course: any) => 
          course.skill_type?.toLowerCase() === activeTab.toLowerCase()
        )
      }
      
      // Calculate pagination
      const totalItems = filteredCourses.length
      setTotal(totalItems)
      setTotalPages(Math.ceil(totalItems / itemsPerPage))
      
      // Apply pagination
      const startIndex = (page - 1) * itemsPerPage
      const endIndex = startIndex + itemsPerPage
      const paginatedCourses = filteredCourses.slice(startIndex, endIndex)
      
      // Transform to Course format
      const transformedCourses = paginatedCourses.map((course: any) => ({
        id: course.id,
        title: course.title,
        instructor_name: course.instructor_name,
        status: course.status,
        created_at: course.created_at,
        published_at: course.published_at,
        skill_type: course.skill_type,
        level: course.level,
        total_enrollments: course.total_enrollments
      }))
      
      setCourses(transformedCourses)
      setCurrentPage(page)
    } catch (error) {
      console.error("Failed to fetch courses:", error)
      toast({
        title: "Error",
        description: "Failed to load courses. Please try again.",
        variant: "destructive",
      })
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchCourses(page)
    }
  }

  const handlePublish = async (id: string, fromArchived: boolean = false) => {
    try {
      if (fromArchived) {
        // Move to draft first, then publish
        await instructorApi.unarchiveCourse(id)
        await instructorApi.publishCourse(id)
      } else {
        await adminApi.reviewContent(id, "approved")
      }
      toast({
        title: 'Success',
        description: 'Course published successfully',
      })
      fetchCourses()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to publish course',
        variant: "destructive",
      })
    }
  }

  const handleArchive = async (id: string) => {
    try {
      await adminApi.reviewContent(id, "rejected")
      toast({
        title: 'Success',
        description: 'Course archived successfully',
      })
      fetchCourses()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to archive course',
        variant: "destructive",
      })
    }
  }

  const handleUnarchive = async (id: string) => {
    try {
      await instructorApi.unarchiveCourse(id)
      toast({
        title: 'Success',
        description: 'Course moved to draft successfully',
      })
      fetchCourses()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to unarchive course',
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    setCourseToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!courseToDelete) return
    
    try {
      await adminApi.deleteCourse(courseToDelete)
      toast({
        title: 'Success',
        description: 'Course deleted successfully',
      })
      // Remove deleted course from state immediately
      setCourses(prevCourses => prevCourses.filter(course => course.id !== courseToDelete))
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error?.message || 'Failed to delete course',
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setCourseToDelete(null)
    }
  }

  const handleEdit = (id: string) => {
    setEditingCourseId(id)
    setEditModalOpen(true)
  }

  const handleEditSuccess = () => {
    toast({
      title: 'Success',
      description: 'Course updated successfully',
    })
    fetchCourses()
  }

  const handleCreateSuccess = () => {
    toast({
      title: 'Success',
      description: 'Course created successfully',
    })
    fetchCourses()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-600">
            Draft
          </Badge>
        )
      case "published":
        return (
          <Badge variant="outline" className="border-green-500 text-green-600">
            Published
          </Badge>
        )
      case "archived":
        return (
          <Badge variant="outline" className="border-red-500 text-red-600">
            Archived
          </Badge>
        )
      default:
        return null
    }
  }

  const getSkillBadge = (skill: string) => {
    const colors: Record<string, string> = {
      listening: "bg-blue-500",
      reading: "bg-green-500",
      writing: "bg-orange-500",
      speaking: "bg-purple-500",
    }
    return (
      <Badge className={colors[skill.toLowerCase()] || "bg-gray-500"}>
        {skill}
      </Badge>
    )
  }

  const getLevelBadge = (level: string) => {
    const colors: Record<string, string> = {
      beginner: "bg-emerald-500",
      intermediate: "bg-amber-500",
      advanced: "bg-rose-500",
    }
    return (
      <Badge className={colors[level.toLowerCase()] || "bg-gray-500"}>
        {level}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Courses</h1>
            <p className="text-muted-foreground mt-1">Manage and review all courses</p>
          </div>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Course
          </Button>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="listening">Listening</TabsTrigger>
            <TabsTrigger value="reading">Reading</TabsTrigger>
            <TabsTrigger value="writing">Writing</TabsTrigger>
            <TabsTrigger value="speaking">Speaking</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
            >
              All
            </Button>
            <Button
              variant={statusFilter === "published" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("published")}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Published
            </Button>
            <Button
              variant={statusFilter === "draft" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("draft")}
            >
              <Clock className="w-4 h-4 mr-2" />
              Draft
            </Button>
            <Button
              variant={statusFilter === "archived" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("archived")}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Archived
            </Button>
          </div>
        </div>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : courses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="space-y-3">
                  <p className="text-muted-foreground">No courses found</p>
                  <Button
                    variant="outline"
                    onClick={() => setCreateModalOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Course
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {courses
                .filter((course) => 
                  course.title.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((course) => (
                <Card key={course.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {course.skill_type && getSkillBadge(course.skill_type)}
                          {course.level && getLevelBadge(course.level)}
                          {getStatusBadge(course.status)}
                        </div>
                        <CardTitle>{course.title}</CardTitle>
                        <CardDescription>
                          By {course.instructor_name || 'Unknown'} • Created{' '}
                          {formatDate(course.created_at || '')}
                          {course.total_enrollments !== undefined &&
                            ` • ${course.total_enrollments} enrollments`}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/courses/${course.id}`)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Manage
                        </Button>
                        {course.status === "draft" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-600 hover:bg-green-50 bg-transparent"
                            onClick={() => handlePublish(course.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Publish
                          </Button>
                        )}
                        {course.status === "published" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-yellow-600 border-yellow-600 hover:bg-yellow-50 bg-transparent"
                              onClick={() => handleUnarchive(course.id)}
                            >
                              <Clock className="w-4 h-4 mr-2" />
                              Move to Draft
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-600 hover:bg-red-50 bg-transparent"
                              onClick={() => handleArchive(course.id)}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Archive
                            </Button>
                          </>
                        )}
                        {course.status === "archived" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-yellow-600 border-yellow-600 hover:bg-yellow-50 bg-transparent"
                              onClick={() => handleUnarchive(course.id)}
                            >
                              <Clock className="w-4 h-4 mr-2" />
                              Move to Draft
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-600 hover:bg-green-50 bg-transparent"
                              onClick={() => handlePublish(course.id, true)}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Publish
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(course.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {course.published_at && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Published on {formatDate(course.published_at)}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages} ({total} courses)
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {editingCourseId && (
        <CourseEditModal
          courseId={editingCourseId}
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          onSuccess={handleEditSuccess}
        />
      )}

      <CourseCreateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={handleCreateSuccess}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this course. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
