"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Clock, Eye, Edit, Trash2, Plus } from "lucide-react"
import { adminApi } from "@/lib/api/admin"
import { useToast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/utils/date"
import { useTranslations } from '@/lib/i18n'
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

export default function AdminContentPage() {
  const router = useRouter()
  const t = useTranslations('common')

  const [content, setContent] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("draft")
  const { toast } = useToast()
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  useEffect(() => {
    fetchContent()
  }, [activeTab])

  const fetchContent = async () => {
    try {
      setLoading(true)
      const response = await adminApi.getContentReviewQueue(activeTab)
      console.log('[Admin Content] API Response:', response)
      
      // Transform courses data to ContentItem format
      const courses = response.data?.courses || []
      const transformedContent = courses.map((course: any) => ({
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
      setContent([])
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (id: string, status: "approved" | "rejected") => {
    try {
      await adminApi.reviewContent(id, status)
      toast({
        title: 'Success',
        description: status === "approved" ? 'Content published successfully' : 'Content archived successfully',
      })
      fetchContent()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to review content',
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return
    }
    try {
      await adminApi.deleteCourse(id)
      toast({
        title: 'Success',
        description: 'Course deleted successfully',
      })
      fetchContent()
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete course. Only admins can delete courses.',
        variant: "destructive",
      })
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
          <Badge className="bg-yellow-500">
            <Clock className="w-3 h-3 mr-1" />
            Draft
          </Badge>
        )
      case "published":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />Published</Badge>
        )
      case "archived":
        return (
          <Badge className="bg-red-500">
            <XCircle className="w-3 h-3 mr-1" />Archived</Badge>
        )
      default:
        return null
    }
  }

  const getTypeBadge = (type: string) => {
    const colors = {
      course: "bg-blue-500",
      exercise: "bg-purple-500",
      lesson: "bg-green-500",
    }
    return <Badge className={colors[type as keyof typeof colors]}>{type}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Content Management</h1>
            <p className="text-muted-foreground mt-1">Review and moderate content submissions</p>
          </div>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Course
          </Button>
        </div>
      </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4 mt-6">
            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : content.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">No content found</CardContent>
              </Card>
            ) : (
              content.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {getTypeBadge(item.type)}
                          {getStatusBadge(item.status)}
                          {item.skill_type && <Badge variant="outline">{item.skill_type}</Badge>}
                          {item.level && <Badge variant="outline">{item.level}</Badge>}
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
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-600 hover:bg-green-50 bg-transparent"
                              onClick={() => handleReview(item.id, "approved")}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Publish
                            </Button>
                          </>
                        )}
                        {item.status === "published" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-600 hover:bg-red-50 bg-transparent"
                            onClick={() => handleReview(item.id, "rejected")}
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
      </div>
  )
}
