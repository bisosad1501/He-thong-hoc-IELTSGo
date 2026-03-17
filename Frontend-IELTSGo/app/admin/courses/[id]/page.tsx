"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import {
  Save,
  ArrowLeft,
  Plus,
  GripVertical,
  Trash2,
  Video,
  FileText,
  ChevronDown,
  ChevronRight,
  Edit,
  CheckCircle,
} from "lucide-react"
import { instructorApi } from "@/lib/api/instructor"
import { adminApi } from "@/lib/api/admin"
import { useToast } from "@/hooks/use-toast"
import { ModuleFormModal } from "@/components/admin/module-form-modal"
import { LessonFormModal } from "@/components/admin/lesson-form-modal"
import { VideoFormModal } from "@/components/admin/video-form-modal"

interface Module {
  id: string
  title: string
  description?: string
  duration_hours?: number
  display_order: number
  lessons?: Lesson[]
}

interface Lesson {
  id: string
  title: string
  description?: string
  content_type: string
  duration_minutes?: number
  display_order: number
  is_free: boolean
  videos?: Array<{
    id: string
    title: string
    video_url: string
    video_provider: string
    video_id: string
    duration_seconds?: number
  }>
}

export default function AdminCourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [course, setCourse] = useState<any>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [editingModule, setEditingModule] = useState<string | null>(null)
  const [editingLesson, setEditingLesson] = useState<string | null>(null)

  // Modal states
  const [moduleModalOpen, setModuleModalOpen] = useState(false)
  const [lessonModalOpen, setLessonModalOpen] = useState(false)
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [selectedModuleForLesson, setSelectedModuleForLesson] = useState<string | null>(null)
  const [addLessonDialogOpen, setAddLessonDialogOpen] = useState(false)
  const [newModuleId, setNewModuleId] = useState<string | null>(null)
  const [videoModalOpen, setVideoModalOpen] = useState(false)
  const [selectedLessonForVideo, setSelectedLessonForVideo] = useState<string | null>(null)
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [deleteLessonDialogOpen, setDeleteLessonDialogOpen] = useState(false)
  const [deleteLessonId, setDeleteLessonId] = useState<string | null>(null)
  const [deleteModuleDialogOpen, setDeleteModuleDialogOpen] = useState(false)
  const [deleteModuleId, setDeleteModuleId] = useState<string | null>(null)

  useEffect(() => {
    loadCourse()
  }, [params.id])

  const loadCourse = async () => {
    try {
      setLoading(true)
      const response = await instructorApi.getCourse(params.id as string)
      const courseData = (response as any).course || response
      const modulesData = ((response as any).modules || []).map((m: any) => ({
        ...m.module,
        lessons: (m.lessons || []).map((l: any) => ({
          ...(l.lesson || l),
          videos: l.videos || []
        })),
        exercises: m.exercises || []
      }))
      setCourse(courseData)
      setModules(modulesData)
    } catch (error) {
      console.error("Failed to load course:", error)
      toast({
        title: "Error",
        description: "Failed to load course details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCourseInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      await instructorApi.updateCourse(params.id as string, {
        title: course.title,
        description: course.description,
        short_description: course.short_description,
        skill_type: course.skill_type,
        level: course.level,
        enrollment_type: course.enrollment_type,
        price: Number(course.price) || 0,
        currency: course.currency || "VND",
        thumbnail_url: course.thumbnail_url,
        preview_video_url: course.preview_video_url,
        is_featured: course.is_featured,
        is_recommended: course.is_recommended,
      })
      toast({
        title: "Success",
        description: "Course information updated successfully",
      })
      loadCourse() // Reload to get updated data
    } catch (error) {
      console.error("Failed to update course:", error)
      toast({
        title: "Error",
        description: "Failed to update course",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = () => {
    setPublishDialogOpen(true)
  }

  const confirmPublish = async () => {
    try {
      await instructorApi.publishCourse(params.id as string)
      toast({
        title: "Success",
        description: "Course published successfully",
      })
      setPublishDialogOpen(false)
      loadCourse()
    } catch (error) {
      console.error("Failed to publish course:", error)
      toast({
        title: "Error",
        description: "Failed to publish course",
        variant: "destructive",
      })
    }
  }

  const handleArchive = () => {
    setArchiveDialogOpen(true)
  }

  const confirmArchive = async () => {
    try {
      await instructorApi.archiveCourse(params.id as string)
      toast({
        title: "Success",
        description: "Course archived successfully",
      })
      setArchiveDialogOpen(false)
      loadCourse()
    } catch (error) {
      console.error("Failed to archive course:", error)
      toast({
        title: "Error",
        description: "Failed to archive course",
        variant: "destructive",
      })
    }
  }

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId)
    } else {
      newExpanded.add(moduleId)
    }
    setExpandedModules(newExpanded)
  }

  const handleAddModule = () => {
    setSelectedModule(null)
    setModuleModalOpen(true)
  }

  const handleModuleSuccess = async () => {
    const wasCreating = !selectedModule
    await loadCourse()

    // If creating new module, auto-expand it and prompt to add lessons
    if (wasCreating) {
      // Wait for state to update
      setTimeout(async () => {
        // Reload to get the new module
        const response = await instructorApi.getCourse(params.id as string)
        const newModules = (response as any).modules || []
        if (newModules.length > 0) {
          const latestModule = newModules[newModules.length - 1]
          setExpandedModules(new Set([latestModule.id]))
          setNewModuleId(latestModule.id)
          setAddLessonDialogOpen(true)
        }
      }, 300)
    }
  }

  const handleEditModule = (module: Module) => {
    setSelectedModule(module)
    setModuleModalOpen(true)
  }

  const handleDeleteModule = (moduleId: string) => {
    setDeleteModuleId(moduleId)
    setDeleteModuleDialogOpen(true)
  }

  const confirmDeleteModule = async () => {
    if (!deleteModuleId) return

    try {
      await instructorApi.deleteModule(deleteModuleId)
      toast({
        title: "Success",
        description: "Module deleted successfully",
      })
      setDeleteModuleDialogOpen(false)
      setDeleteModuleId(null)
      loadCourse()
    } catch (error) {
      console.error("Failed to delete module:", error)
      toast({
        title: "Error",
        description: "Failed to delete module",
        variant: "destructive",
      })
    }
  }

  const handleAddLesson = (moduleId: string) => {
    console.log("handleAddLesson called with moduleId:", moduleId)
    if (!moduleId) {
      toast({
        title: "Error",
        description: "Module ID is missing",
        variant: "destructive",
      })
      return
    }
    setSelectedLesson(null)
    setSelectedModuleForLesson(moduleId)
    setLessonModalOpen(true)
  }

  const handleEditLesson = (lesson: Lesson, moduleId: string) => {
    console.log("handleEditLesson called with:", { lesson, moduleId })
    console.log("Lesson details:", JSON.stringify(lesson, null, 2))
    setSelectedLesson(lesson)
    setSelectedModuleForLesson(moduleId)
    setLessonModalOpen(true)
  }

  const handleDeleteLesson = (lessonId: string) => {
    setDeleteLessonId(lessonId)
    setDeleteLessonDialogOpen(true)
  }

  const confirmDeleteLesson = async () => {
    if (!deleteLessonId) return

    try {
      await instructorApi.deleteLesson(deleteLessonId)
      toast({
        title: "Success",
        description: "Lesson deleted successfully",
      })
      setDeleteLessonDialogOpen(false)
      setDeleteLessonId(null)
      loadCourse()
    } catch (error) {
      console.error("Failed to delete lesson:", error)
      toast({
        title: "Error",
        description: "Failed to delete lesson",
        variant: "destructive",
      })
    }
  }

  const handleVideoNeeded = (lessonId: string) => {
    setSelectedLessonForVideo(lessonId)
    setVideoModalOpen(true)
  }

  const handleVideoSuccess = () => {
    toast({
      title: "Success",
      description: "Video added successfully",
    })
    loadCourse()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading course...</p>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-xl text-muted-foreground">Course not found</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/admin/courses-management")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{course.title}</h1>
            <p className="text-muted-foreground mt-1">Manage course content and structure</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={course.status === "published" ? "default" : "secondary"}>
            {course.status}
          </Badge>
          {course.status === "draft" && (
            <Button onClick={handlePublish} variant="default">
              <CheckCircle className="mr-2 h-4 w-4" />
              Publish Course
            </Button>
          )}
          {course.status === "published" && (
            <Button onClick={handleArchive} variant="outline">
              Archive Course
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList>
          <TabsTrigger value="info">Course Information</TabsTrigger>
          <TabsTrigger value="content">Course Content</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Course Information Tab */}
        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveCourseInfo} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={course.title || ""}
                    onChange={(e) => setCourse({ ...course, title: e.target.value })}
                    placeholder="Course title"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Short Description</label>
                  <Input
                    value={course.short_description || ""}
                    onChange={(e) => setCourse({ ...course, short_description: e.target.value })}
                    placeholder="Brief description (max 200 chars)"
                    maxLength={200}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={course.description || ""}
                    onChange={(e) => setCourse({ ...course, description: e.target.value })}
                    placeholder="Full course description"
                    rows={6}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Skill Type</label>
                    <Select
                      value={course.skill_type || "listening"}
                      onValueChange={(value) => setCourse({ ...course, skill_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select skill type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="listening">Listening</SelectItem>
                        <SelectItem value="reading">Reading</SelectItem>
                        <SelectItem value="writing">Writing</SelectItem>
                        <SelectItem value="speaking">Speaking</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Level</label>
                    <Select
                      value={course.level || "beginner"}
                      onValueChange={(value) => setCourse({ ...course, level: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Enrollment Type</label>
                    <Select
                      value={course.enrollment_type || "free"}
                      onValueChange={(value) => setCourse({ ...course, enrollment_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {course.enrollment_type === 'premium' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Price</label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={course.price || 0}
                          onChange={(e) => setCourse({ ...course, price: parseFloat(e.target.value) })}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          className="flex-1"
                        />
                        <Select
                          value={course.currency || "VND"}
                          onValueChange={(value) => setCourse({ ...course, currency: value })}
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Currency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="VND">VND</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Thumbnail URL</label>
                  <Input
                    value={course.thumbnail_url || ""}
                    onChange={(e) => setCourse({ ...course, thumbnail_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                  {course.thumbnail_url && (
                    <div className="mt-2 relative w-full h-48 bg-muted rounded-md overflow-hidden">
                      <img src={course.thumbnail_url} alt="Thumbnail preview" className="object-cover w-full h-full" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Preview Video URL</label>
                  <Input
                    value={course.preview_video_url || ""}
                    onChange={(e) => setCourse({ ...course, preview_video_url: e.target.value })}
                    placeholder="https://example.com/video.mp4"
                  />
                </div>

                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Course Content Tab */}
        <TabsContent value="content">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Course Structure</CardTitle>
                <Button onClick={handleAddModule}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Module
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {modules.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg text-muted-foreground mb-2">No modules yet</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start building your course by adding modules and lessons
                  </p>
                  <Button onClick={handleAddModule}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Module
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {modules.map((module, index) => (
                    <Card key={module.id || `module-${index}`}>
                      <CardHeader className="cursor-pointer" onClick={() => toggleModule(module.id)}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {expandedModules.has(module.id) ? (
                              <ChevronDown className="h-5 w-5" />
                            ) : (
                              <ChevronRight className="h-5 w-5" />
                            )}
                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <h3 className="font-semibold">
                                Module {index + 1}: {module.title}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {module.lessons?.length || 0} lessons
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={(e) => {
                              e.stopPropagation()
                              handleEditModule(module)
                            }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteModule(module.id)
                            }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      {expandedModules.has(module.id) && (
                        <CardContent>
                          {module.lessons && module.lessons.length > 0 ? (
                            <div className="space-y-3">
                              <div className="space-y-2">
                                {module.lessons.map((lesson, lessonIndex) => (
                                  <div
                                    key={lesson.id || `lesson-${module.id}-${lessonIndex}`}
                                    className="flex items-center justify-between p-3 border rounded-lg"
                                  >
                                    <div className="flex items-center gap-3">
                                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                                      {lesson.content_type === "video" ? (
                                        <Video className="h-4 w-4" />
                                      ) : (
                                        <FileText className="h-4 w-4" />
                                      )}
                                      <span>
                                        Lesson {lessonIndex + 1}: {lesson.title}
                                      </span>
                                      {lesson.is_free && <Badge variant="secondary">Free</Badge>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button variant="ghost" size="sm" onClick={() => handleEditLesson(lesson, module.id)}>
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button variant="ghost" size="sm" onClick={() => handleDeleteLesson(lesson.id)}>
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddLesson(module.id)}
                                className="w-full"
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Another Lesson
                              </Button>
                            </div>
                          ) : (
                            <div className="text-center py-6">
                              <p className="text-muted-foreground mb-2">No lessons in this module</p>
                              <Button variant="outline" size="sm" onClick={() => handleAddLesson(module.id)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Lesson
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Course Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Featured Course</h4>
                    <p className="text-sm text-muted-foreground">Display this course on the homepage</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={course.is_featured || false}
                    onChange={(e) => setCourse({ ...course, is_featured: e.target.checked })}
                    className="h-5 w-5"
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Recommended Course</h4>
                    <p className="text-sm text-muted-foreground">Show in recommended section</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={course.is_recommended || false}
                    onChange={(e) => setCourse({ ...course, is_recommended: e.target.checked })}
                    className="h-5 w-5"
                  />
                </div>

                <Button onClick={handleSaveCourseInfo} disabled={saving}>
                  {saving ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Module Form Modal */}
      <ModuleFormModal
        courseId={params.id as string}
        module={selectedModule}
        open={moduleModalOpen}
        onOpenChange={setModuleModalOpen}
        onSuccess={handleModuleSuccess}
        modulesCount={modules.length}
      />

      {/* Lesson Form Modal */}
      {selectedModuleForLesson && (
        <LessonFormModal
          moduleId={selectedModuleForLesson}
          lesson={selectedLesson}
          open={lessonModalOpen}
          onOpenChange={setLessonModalOpen}
          onSuccess={loadCourse}
          onVideoNeeded={handleVideoNeeded}
          lessonsCount={
            modules.find(m => m.id === selectedModuleForLesson)?.lessons?.length || 0
          }
        />
      )}

      {/* Video Form Modal */}
      <VideoFormModal
        lessonId={selectedLessonForVideo}
        open={videoModalOpen}
        onOpenChange={setVideoModalOpen}
        onSuccess={handleVideoSuccess}
      />

      {/* Add Lesson Dialog */}
      <AlertDialog open={addLessonDialogOpen} onOpenChange={setAddLessonDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Module created successfully!</AlertDialogTitle>
            <AlertDialogDescription>
              Would you like to add lessons to this module now?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Later</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (newModuleId) {
                  handleAddLesson(newModuleId)
                }
              }}
            >
              Add Lesson
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Publish Course Dialog */}
      <AlertDialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to publish this course? It will be visible to all students and they can enroll in it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPublish} className="bg-green-600 hover:bg-green-700">
              Publish Course
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive Course Dialog */}
      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive this course? Students will no longer be able to access it or enroll in it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmArchive} className="bg-red-600 hover:bg-red-700">
              Archive Course
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Lesson Dialog */}
      <AlertDialog open={deleteLessonDialogOpen} onOpenChange={setDeleteLessonDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lesson</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this lesson? This action cannot be undone and will remove all associated videos and progress data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteLesson} className="bg-red-600 hover:bg-red-700">
              Delete Lesson
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Module Dialog */}
      <AlertDialog open={deleteModuleDialogOpen} onOpenChange={setDeleteModuleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Module</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this module? All lessons in this module will also be deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteModule} className="bg-red-600 hover:bg-red-700">
              Delete Module
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
