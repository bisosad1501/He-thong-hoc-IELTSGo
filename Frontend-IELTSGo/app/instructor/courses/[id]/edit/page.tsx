"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Save,
  X,
  Eye,
  Upload,
  Plus,
  GripVertical,
  Trash2,
  Video,
  FileText,
  HelpCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { instructorApi } from "@/lib/api/instructor"
import type { Course, Module, Lesson } from "@/types"
import { useTranslations } from '@/lib/i18n'

export default function CourseBuilderPage() {

  const t = useTranslations('common')

  const params = useParams()
  const router = useRouter()
  const [course, setCourse] = useState<Partial<Course>>({
    title: "",
    description: "",
    category: "",
    level: "beginner",
    modules: [],
  })
  const [activeSection, setActiveSection] = useState<"info" | "module" | "lesson">("info")
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (params.id && params.id !== "create") {
      loadCourse()
    }
  }, [params.id])

  const loadCourse = async () => {
    try {
      setLoading(true)
      const data = await instructorApi.getCourse(params.id as string)
      setCourse(data)
    } catch (error) {
      console.error("Failed to load course:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      if (params.id === "create") {
        const slug = course.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || ''
        const courseData = {
          title: course.title || '',
          slug: slug,
          description: course.description,
          short_description: course.description ? course.description.substring(0, 200) : undefined,
          skill_type: course.category || 'general',
          level: course.level || 'beginner',
          enrollment_type: 'free',
          price: 0,
          currency: 'VND',
        }
        await instructorApi.createCourse(courseData)
      } else {
        const updateData: any = {}
        if (course.title) updateData.title = course.title
        if (course.description) updateData.description = course.description
        if (course.description) updateData.short_description = course.description.substring(0, 200)
        
        await instructorApi.updateCourse(params.id as string, updateData)
      }
      router.push("/instructor/courses")
    } catch (error) {
      console.error("Failed to save course:", error)
    } finally {
      setLoading(false)
    }
  }

  const addModule = () => {
    const newModule: Partial<Module> = {
      id: `temp-${Date.now()}`,
      title: "New Module",
      description: "",
      order: (course.modules?.length || 0) + 1,
      lessons: [],
    }
    setCourse({
      ...course,
      modules: [...(course.modules || []), newModule as Module],
    })
    setSelectedModuleId(newModule.id!)
    setActiveSection("module")
  }

  const addLesson = (moduleId: string) => {
    const newLesson: Partial<Lesson> = {
      id: `temp-${Date.now()}`,
      moduleId,
      title: "New Lesson",
      type: "video",
      content: {},
      duration: 0,
      order: 1,
    }

    setCourse({
      ...course,
      modules: course.modules?.map((m) =>
        m.id === moduleId ? { ...m, lessons: [...(m.lessons || []), newLesson as Lesson] } : m,
      ),
    })
    setSelectedLessonId(newLesson.id!)
    setActiveSection("lesson")
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

  const selectedModule = course.modules?.find((m) => m.id === selectedModuleId)
  const selectedLesson = selectedModule?.lessons?.find((l) => l.id === selectedLessonId)

  return (
    <div className="min-h-screen relative">
      {/* Top Bar */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4 flex-1">
            <Input
              value={course.title}
              onChange={(e) => setCourse({ ...course, title: e.target.value })}
              placeholder={t('course_title')}
              className="text-xl font-semibold border-none focus-visible:ring-0 max-w-md"
            />
            <Badge variant={course.status === "published" ? "default" : "secondary"}>{course.status || "Draft"}</Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2" />{t('preview')}</Button>
            <Button variant="outline" size="sm" onClick={handleSave} disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={handleSave} disabled={loading}>
              Publish
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Sidebar - Course Structure */}
        <div className="w-80 bg-white border-r overflow-y-auto">
          <div className="p-4">
            <div
              className={`p-3 rounded-lg cursor-pointer mb-2 ${
                activeSection === "info" ? "bg-primary text-white" : "hover:bg-gray-100"
              }`}
              onClick={() => setActiveSection("info")}
            >
              <div className="font-medium">{t('course_info')}</div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-sm text-gray-600">{t('modules')}</div>
                <Button size="sm" variant="ghost" onClick={addModule}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-1">
                {course.modules?.map((module, index) => (
                  <div key={module.id}>
                    <div
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                        selectedModuleId === module.id && activeSection === "module"
                          ? "bg-primary text-white"
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => {
                        setSelectedModuleId(module.id)
                        setActiveSection("module")
                      }}
                    >
                      <GripVertical className="w-4 h-4 flex-shrink-0" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleModule(module.id)
                        }}
                        className="flex-shrink-0"
                      >
                        {expandedModules.has(module.id) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                      <span className="text-sm flex-1 truncate">{module.title || `Module ${index + 1}`}</span>
                    </div>

                    {expandedModules.has(module.id) && (
                      <div className="ml-8 mt-1 space-y-1">
                        {module.lessons?.map((lesson, lessonIndex) => (
                          <div
                            key={lesson.id}
                            className={`flex items-center gap-2 p-2 rounded cursor-pointer text-sm ${
                              selectedLessonId === lesson.id && activeSection === "lesson"
                                ? "bg-primary text-white"
                                : "hover:bg-gray-100"
                            }`}
                            onClick={() => {
                              setSelectedLessonId(lesson.id)
                              setActiveSection("lesson")
                            }}
                          >
                            {lesson.type === "video" ? (
                              <Video className="w-4 h-4" />
                            ) : lesson.type === "quiz" ? (
                              <HelpCircle className="w-4 h-4" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                            <span className="flex-1 truncate">{lesson.title || `Lesson ${lessonIndex + 1}`}</span>
                          </div>
                        ))}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-full justify-start text-xs"
                          onClick={() => addLesson(module.id)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Lesson
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <Card className="p-6">
            {activeSection === "info" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">{t('course_information')}</h2>

                <div>
                  <label className="block text-sm font-medium mb-2">{t('thumbnail')}</label>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">{t('click_to_upload_or_drag_and_drop')}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <Input
                    value={course.title}
                    onChange={(e) => setCourse({ ...course, title: e.target.value })}
                    placeholder={t('enter_course_title')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description *</label>
                  <Textarea
                    value={course.description}
                    onChange={(e) => setCourse({ ...course, description: e.target.value })}
                    placeholder={t('enter_course_description')}
                    rows={5}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">{t('category')}</label>
                    <select
                      value={course.category}
                      onChange={(e) => setCourse({ ...course, category: e.target.value })}
                      className="w-full border rounded-md px-3 py-2"
                    >
                      <option value="">{t('select_category')}</option>
                      <option value="reading">{t('reading')}</option>
                      <option value="listening">{t('listening')}</option>
                      <option value="writing">{t('writing')}</option>
                      <option value="speaking">{t('speaking')}</option>
                      <option value="general">{t('general')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">{t('level')}</label>
                    <select
                      value={course.level}
                      onChange={(e) => setCourse({ ...course, level: e.target.value as any })}
                      className="w-full border rounded-md px-3 py-2"
                    >
                      <option value="beginner">{t('beginner')}</option>
                      <option value="intermediate">{t('intermediate')}</option>
                      <option value="advanced">{t('advanced')}</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "module" && selectedModule && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">{t('module_settings')}</h2>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Module
                  </Button>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Module Title *</label>
                  <Input
                    value={selectedModule.title}
                    onChange={(e) => {
                      setCourse({
                        ...course,
                        modules: course.modules?.map((m) =>
                          m.id === selectedModuleId ? { ...m, title: e.target.value } : m,
                        ),
                      })
                    }}
                    placeholder={t('eg_module_1_introduction')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{t('module_description')}</label>
                  <Textarea
                    value={selectedModule.description}
                    onChange={(e) => {
                      setCourse({
                        ...course,
                        modules: course.modules?.map((m) =>
                          m.id === selectedModuleId ? { ...m, description: e.target.value } : m,
                        ),
                      })
                    }}
                    placeholder={t('describe_what_students_will_learn_in_thi')}
                    rows={4}
                  />
                </div>
              </div>
            )}

            {activeSection === "lesson" && selectedLesson && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">{t('lesson_settings')}</h2>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Lesson
                  </Button>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Lesson Title *</label>
                  <Input value={selectedLesson.title} placeholder={t('enter_lesson_title')} />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{t('lesson_type')}</label>
                  <select className="w-full border rounded-md px-3 py-2">
                    <option value="video">{t('video_lesson')}</option>
                    <option value="text">Text/Article</option>
                    <option value="quiz">{t('quiz')}</option>
                  </select>
                </div>

                {selectedLesson.type === "video" && (
                  <div>
                    <label className="block text-sm font-medium mb-2">{t('video_url')}</label>
                    <Input placeholder={t('youtube_url_or_upload_video')} />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
                  <Input type="number" placeholder="0" />
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Sidebar - Preview */}
        <div className="w-96 bg-white border-l p-4 overflow-y-auto">
          <div className="text-sm font-medium mb-4">{t('preview')}</div>
          <div className="border rounded-lg p-4 bg-gray-50">
            <p className="text-sm text-gray-600">{t('preview_will_appear_here')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
