"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { CheckCircle, XCircle, Clock, Eye, Edit, Trash2, Plus, ChevronLeft, ChevronRight } from "lucide-react"
import { adminApi } from "@/lib/api/admin"
import { useToast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/utils/date"
import { CourseEditModal } from "@/components/admin/course-edit-modal"
import { CourseCreateModal } from "@/components/admin/course-create-modal"

interface ContentItem {
  id: string
  type: "course"
  title: string
  author: string
  instructor_name?: string
  status: "draft" | "published" | "archived"
  submittedAt: string
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

  const [content, setContent] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(searchParams.get("skill") || "all")
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft" | "archived">(
    (searchParams.get("status") as "all" | "published" | "draft" | "archived") || "all"
  )
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
    router.replace(`/admin/courses?${params.toString()}`, { scroll: false })
  }, [activeTab, statusFilter, router])

  useEffect(() => {
    fetchContent()
  }, [activeTab, statusFilter])

  const fetchContent = async () => {
    try {
      setLoading(true)
      
      // Fetch all courses and filter on frontend
      // Since the API doesn't support skill_type filtering yet
      const draftResponse = await adminApi.getContentReviewQueue("draft")
      const publishedResponse = await adminApi.getContentReviewQueue("published")
      const archivedResponse = await adminApi.getContentReviewQueue("archived")
      
      const allCourses = [
        ...(draftResponse.data?.courses || []),
        ...(publishedResponse.data?.courses || []),
        ...(archivedResponse.data?.courses || [])
      ]
      
      // Filter out deleted courses (soft delete)
      let filteredCourses = allCourses.filter((course: any) => {
        return course.deleted_at === null || course.deleted_at === undefined
      })
      
      // Apply status filter
      if (statusFilter !== "all") {
        filteredCourses = filteredCourses.filter((course: any) => course.status === statusFilter)
      }
      
      // Apply skill type filter
      if (activeTab !== "all") {
        filteredCourses = filteredCourses.filter((course: any) => 
          course.skill_type?.toLowerCase() === activeTab.toLowerCase()
        )
      }
      
      // Transform to ContentItem format
      const transformedContent = filteredCourses.map((course: any) => ({
        id: course.id,
        type: 'course' as const,
        title: course.title,
        author: course.instructor_name || 'Unknown Instructor',
        instructor_name: course.instructor_name,
        status: course.status,
        submittedAt: course.created_at,
        created_at: course.created_at,
        published_at: course.published_at,
        skill_type: course.skill_type,
        level: course.level,
        total_enrollments: course.total_enrollments
      }))
      
      setContent(transformedContent)
    } catch (error) {
      console.error("Failed to fetch content:", error)
      toast({
        title: "Error",
        description: "Failed to load courses. Please try again.",
        variant: "destructive",
      })
      setContent([])
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async (id: string) => {
    try {
      await adminApi.reviewContent(id, "approved")
      toast({
        title: 'Success',
        description: 'Course published successfully',
      })
      fetchContent()
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
      fetchContent()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to archive course',
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
      setContent(prevContent => prevContent.filter(item => item.id !== courseToDelete))
    } catch (error: any) {
      console.error('Delete error:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.error?.message || 'Failed to delete course. Only admins can delete courses.',
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
    fetchContent()
  }

  const handleCreateSuccess = () => {
    toast({
      title: 'Success',
      description: 'Course created successfully',
    })
    fetchContent()
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
            <p className="text-muted-foreground mt-1">
              Manage and review all IELTS courses
            </p>
          </div>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Course
          </Button>
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
          ) : content.length === 0 ? (
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
            content.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {item.skill_type && getSkillBadge(item.skill_type)}
                        {item.level && getLevelBadge(item.level)}
                        {getStatusBadge(item.status)}
                      </div>
                      <CardTitle>{item.title}</CardTitle>
                      <CardDescription>
                        By {item.author} • Created {formatDate(item.submittedAt)}
                        {item.total_enrollments !== undefined && ` • ${item.total_enrollments} enrollments`}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => router.push(`/admin/courses/${item.id}`)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(item.id)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      {item.status === "draft" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-600 hover:bg-green-50 bg-transparent"
                          onClick={() => handlePublish(item.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Publish
                        </Button>
                      )}
                      {item.status === "published" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50 bg-transparent"
                          onClick={() => handleArchive(item.id)}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Archive
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {item.published_at && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Published on {formatDate(item.published_at)}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))
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
              Are you sure you want to delete this course? This action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
