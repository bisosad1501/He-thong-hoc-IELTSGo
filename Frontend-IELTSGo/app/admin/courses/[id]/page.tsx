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

  useEffect(() => {
    loadCourse()
  }, [params.id])

  const loadCourse = async () => {
    try {
      setLoading(true)
      const response = await instructorApi.getCourse(params.id as string)
      const courseData = (response as any).course || response
      setCourse(courseData)
      setModules((response as any).modules || [])
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
      })
      toast({
        title: "Success",
        description: "Course information updated successfully",
      })
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

  const handlePublish = async () => {
    if (!window.confirm("Publish this course? It will be visible to students.")) return
    try {
      await instructorApi.publishCourse(params.id as string)
      toast({
        title: "Success",
        description: "Course published successfully",
      })
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

  const handleArchive = async () => {
    if (!window.confirm("Archive this course? Students will no longer be able to access it.")) return
    try {
      await instructorApi.archiveCourse(params.id as string)
      toast({
        title: "Success",
        description: "Course archived successfully",
      })
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

  const handleDeleteModule = async (moduleId: string) => {
    if (!window.confirm("Delete this module? All lessons in this module will also be deleted.")) return
    try {
      await instructorApi.deleteModule(moduleId)
      toast({
        title: "Success",
        description: "Module deleted successfully",
      })
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
    setSelectedLesson(null)
    setSelectedModuleForLesson(moduleId)
    setLessonModalOpen(true)
  }

  const handleEditLesson = (lesson: Lesson, moduleId: string) => {
    setSelectedLesson(lesson)
    setSelectedModuleForLesson(moduleId)
    setLessonModalOpen(true)
  }

  const handleDeleteLesson = async (lessonId: string) => {
    if (!window.confirm("Delete this lesson?")) return
    try {
      await instructorApi.deleteLesson(lessonId)
      toast({
        title: "Success",
        description: "Lesson deleted successfully",
      })
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
          <Button variant="ghost" size="icon" onClick={() => router.push("/admin/content")}>
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

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Skill Type</label>
                    <Badge>{course.skill_type}</Badge>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Level</label>
                    <Badge>{course.level}</Badge>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Enrollment Type</label>
                    <Badge>{course.enrollment_type}</Badge>
                  </div>
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
      <LessonFormModal
        moduleId={selectedModuleForLesson || ""}
        lesson={selectedLesson}
        open={lessonModalOpen}
        onOpenChange={setLessonModalOpen}
        onSuccess={loadCourse}
        lessonsCount={
          selectedModuleForLesson 
            ? (modules.find(m => m.id === selectedModuleForLesson)?.lessons?.length || 0)
            : 0
        }
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
              Add Lessons
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
