"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { InstructorLayout } from "@/components/instructor/instructor-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { instructorApi } from "@/lib/api/instructor"
import { ArrowLeft, Plus, Trash2, GripVertical } from "lucide-react"
import Link from "next/link"
import { useTranslations } from '@/lib/i18n'
import { useToastWithI18n } from "@/lib/hooks/use-toast-with-i18n"

interface Module {
  id: string
  title: string
  description: string
  order: number
  lessons: Lesson[]
}

interface Lesson {
  id: string
  title: string
  description: string
  duration: number
  order: number
}

export default function CreateCoursePage() {

  const t = useTranslations('common')
  const toast = useToastWithI18n()

  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    level: "beginner",
    category: "listening",
    price: 0,
    thumbnail: "",
  })
  const [modules, setModules] = useState<Module[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Create slug from title
      const slug = formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      
      // Format data according to backend API requirements
      const courseData = {
        title: formData.title,
        slug: slug,
        description: formData.description || undefined,
        short_description: formData.description ? formData.description.substring(0, 200) : undefined,
        skill_type: formData.category, // map category to skill_type
        level: formData.level,
        target_band_score: undefined,
        thumbnail_url: formData.thumbnail || undefined,
        preview_video_url: undefined,
        duration_hours: undefined,
        enrollment_type: formData.price > 0 ? 'premium' : 'free',
        price: formData.price,
        currency: 'VND',
      }

      const course = await instructorApi.createCourse(courseData)
      toast.success(t('course_created_successfully') || "Course created successfully")
      
      // After creating course, you can add modules and lessons separately
      // For now, redirect to course detail page
      router.push(`/instructor/courses/${course.id}`)
    } catch (error) {
      console.error("Failed to create course:", error)
      toast.error(t('failed_to_create_course') || "Failed to create course. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const addModule = () => {
    const newModule: Module = {
      id: `module-${Date.now()}`,
      title: "",
      description: "",
      order: modules.length,
      lessons: [],
    }
    setModules([...modules, newModule])
  }

  const updateModule = (id: string, field: string, value: string) => {
    setModules(modules.map((m) => (m.id === id ? { ...m, [field]: value } : m)))
  }

  const deleteModule = (id: string) => {
    setModules(modules.filter((m) => m.id !== id))
  }

  const addLesson = (moduleId: string) => {
    setModules(
      modules.map((m) => {
        if (m.id === moduleId) {
          const newLesson: Lesson = {
            id: `lesson-${Date.now()}`,
            title: "",
            description: "",
            duration: 0,
            order: m.lessons.length,
          }
          return { ...m, lessons: [...m.lessons, newLesson] }
        }
        return m
      }),
    )
  }

  const updateLesson = (moduleId: string, lessonId: string, field: string, value: any) => {
    setModules(
      modules.map((m) => {
        if (m.id === moduleId) {
          return {
            ...m,
            lessons: m.lessons.map((l) => (l.id === lessonId ? { ...l, [field]: value } : l)),
          }
        }
        return m
      }),
    )
  }

  const deleteLesson = (moduleId: string, lessonId: string) => {
    setModules(
      modules.map((m) => {
        if (m.id === moduleId) {
          return { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) }
        }
        return m
      }),
    )
  }

  return (
    <InstructorLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/instructor/courses">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('create_new_course')}</h1>
            <p className="text-muted-foreground mt-1">{t('fill_in_the_details_to_create_your_cours')}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">{t('basic_information')}</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Course Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., IELTS Listening Mastery"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what students will learn..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="level">{t('level')}</Label>
                  <select
                    id="level"
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="beginner">{t('beginner')}</option>
                    <option value="intermediate">{t('intermediate')}</option>
                    <option value="advanced">{t('advanced')}</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="category">{t('category')}</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="listening">{t('listening')}</option>
                    <option value="reading">{t('reading')}</option>
                    <option value="writing">{t('writing')}</option>
                    <option value="speaking">{t('speaking')}</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number.parseFloat(e.target.value) })}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </Card>

          {/* Curriculum */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">{t('curriculum')}</h2>
              <Button type="button" onClick={addModule} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Module
              </Button>
            </div>

            <div className="space-y-4">
              {modules.map((module, moduleIndex) => (
                <Card key={module.id} className="p-4 bg-muted/50">
                  <div className="space-y-4">
                    {/* Module Header */}
                    <div className="flex items-start gap-3">
                      <GripVertical className="w-5 h-5 text-muted-foreground mt-2 cursor-move" />
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <Input
                            value={module.title}
                            onChange={(e) => updateModule(module.id, "title", e.target.value)}
                            placeholder={`Module ${moduleIndex + 1} Title`}
                            className="font-semibold"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteModule(module.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <Textarea
                          value={module.description}
                          onChange={(e) => updateModule(module.id, "description", e.target.value)}
                          placeholder="Module description..."
                          rows={2}
                        />

                        {/* Lessons */}
                        <div className="space-y-2 pl-4 border-l-2 border-border">
                          {module.lessons.map((lesson, lessonIndex) => (
                            <div key={lesson.id} className="flex items-center gap-2">
                              <Input
                                value={lesson.title}
                                onChange={(e) => updateLesson(module.id, lesson.id, "title", e.target.value)}
                                placeholder={`Lesson ${lessonIndex + 1} Title`}
                                className="flex-1"
                              />
                              <Input
                                type="number"
                                value={lesson.duration}
                                onChange={(e) =>
                                  updateLesson(module.id, lesson.id, "duration", Number.parseInt(e.target.value))
                                }
                                placeholder="Duration (min)"
                                className="w-32"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteLesson(module.id, lesson.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            onClick={() => addLesson(module.id)}
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Lesson
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              {modules.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No modules yet. Click "Add Module" to start building your curriculum.
                </div>
              )}
            </div>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Link href="/instructor/courses">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Course"}
            </Button>
          </div>
        </form>
      </div>
    </InstructorLayout>
  )
}
