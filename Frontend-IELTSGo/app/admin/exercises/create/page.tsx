"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { adminApi } from "@/lib/api/admin"
import { instructorApi } from "@/lib/api/instructor"

export default function CreateExercisePage() {
  const router = useRouter()
  const { toast } = useToast()

  const [creating, setCreating] = useState(false)
  const [courses, setCourses] = useState<any[]>([])
  const [modules, setModules] = useState<any[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const [selectedModuleId, setSelectedModuleId] = useState<string>("")
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [loadingModules, setLoadingModules] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    skill_type: "listening",
    exercise_type: "practice",
    ielts_level: "",
    difficulty: "easy",
    time_limit_minutes: 0,
    // Speaking fields
    speaking_part_number: 1,
    speaking_prompt_text: "",
    // Writing fields
    writing_task_type: 1,
    writing_prompt_text: "",
    writing_word_requirement: 250,
    // Reading fields
    ielts_test_type: "academic",
  })

  // Load courses on mount
  useEffect(() => {
    loadCourses()
  }, [])

  // Load modules when course is selected
  useEffect(() => {
    if (selectedCourseId) {
      loadModules(selectedCourseId)
    } else {
      setModules([])
      setSelectedModuleId("")
    }
  }, [selectedCourseId])

  const loadCourses = async () => {
    try {
      setLoadingCourses(true)
      const response = await instructorApi.getMyCourses({ limit: 100 })
      setCourses(response.items || [])
    } catch (error) {
      console.error("Failed to load courses:", error)
      toast({
        title: "Error",
        description: "Failed to load courses",
        variant: "destructive",
      })
    } finally {
      setLoadingCourses(false)
    }
  }

  const loadModules = async (courseId: string) => {
    try {
      setLoadingModules(true)
      const courseDetail = await instructorApi.getCourseDetail(courseId)
      setModules(courseDetail.modules?.map((m: any) => m.module) || [])
    } catch (error) {
      console.error("Failed to load modules:", error)
      toast({
        title: "Error",
        description: "Failed to load modules",
        variant: "destructive",
      })
    } finally {
      setLoadingModules(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setCreating(true)
      
      // Generate slug from title
      const baseSlug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      
      // Add timestamp to ensure uniqueness
      const slug = `${baseSlug}-${Date.now()}`
      
      // Prepare payload based on skill type
      const payload: any = {
        title: formData.title,
        slug: slug,
        description: formData.description || null,
        skill_type: formData.skill_type,
        difficulty: formData.difficulty,
        exercise_type: formData.exercise_type,
        ielts_level: formData.ielts_level || null,
        time_limit_minutes: formData.time_limit_minutes || null,
        course_id: selectedCourseId || null,
        module_id: selectedModuleId || null,
      }
      
      // Add skill-specific fields
      if (formData.skill_type === "speaking") {
        payload.speaking_part_number = formData.speaking_part_number
        payload.speaking_prompt_text = formData.speaking_prompt_text
      } else if (formData.skill_type === "writing") {
        payload.writing_task_type = formData.writing_task_type
        payload.writing_prompt_text = formData.writing_prompt_text
        payload.writing_word_requirement = formData.writing_word_requirement
      } else if (formData.skill_type === "reading") {
        payload.ielts_test_type = formData.ielts_test_type
      }
      
      const exercise = await adminApi.createExercise(payload)
      
      toast({
        title: "Success",
        description: "Exercise created successfully. Add sections and questions in the edit page.",
        duration: 5000,
      })
      
      // Small delay to show the success message before redirect
      setTimeout(() => {
        router.push(`/admin/exercises/${exercise.id}/edit?returnUrl=/admin/exercises`)
      }, 800)
    } catch (error) {
      console.error("Failed to create exercise:", error)
      toast({
        title: "Error",
        description: "Failed to create exercise. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/admin/exercises")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Exercise</h1>
          <p className="text-muted-foreground mt-1">Add a new IELTS exercise</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Enter the main details of the exercise</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter exercise title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter exercise description"
                rows={4}
              />
            </div>

            {/* Course and Module Selection */}
            <div className="space-y-4 border-t pt-4 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Link to Course (Optional)</h3>
                  <p className="text-xs text-muted-foreground">
                    Link this exercise to a specific course or module
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="course_id">Course</Label>
                    {selectedCourseId && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setSelectedCourseId("")}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <Select
                    value={selectedCourseId}
                    onValueChange={setSelectedCourseId}
                    disabled={loadingCourses}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingCourses ? "Loading..." : "None (Standalone)"} />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Course-level exercise (applies to entire course)
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="module_id">Module (Optional)</Label>
                    {selectedModuleId && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setSelectedModuleId("")}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <Select
                    value={selectedModuleId}
                    onValueChange={setSelectedModuleId}
                    disabled={!selectedCourseId || loadingModules}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !selectedCourseId 
                          ? "Select a course first" 
                          : loadingModules 
                          ? "Loading..." 
                          : "None (Course-level)"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {modules.map((module) => (
                        <SelectItem key={module.id} value={module.id}>
                          {module.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Module-specific exercise (requires course selection)
                  </p>
                </div>
              </div>

              {!selectedCourseId && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-sm text-blue-700">
                    💡 <strong>Standalone Exercise:</strong> Can be accessed independently, not tied to any course.
                  </p>
                </div>
              )}
              {selectedCourseId && !selectedModuleId && (
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <p className="text-sm text-green-700">
                    📦 <strong>Course-level Exercise:</strong> Will appear in course detail, accessible from all modules.
                  </p>
                </div>
              )}
              {selectedCourseId && selectedModuleId && (
                <div className="bg-purple-50 border border-purple-200 rounded p-3">
                  <p className="text-sm text-purple-700">
                    🎯 <strong>Module-specific Exercise:</strong> Will only appear in the selected module.
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="skill_type">Skill Type *</Label>
                <Select
                  value={formData.skill_type}
                  onValueChange={(value) => setFormData({ ...formData, skill_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="listening">Listening</SelectItem>
                    <SelectItem value="reading">Reading</SelectItem>
                    <SelectItem value="writing">Writing</SelectItem>
                    <SelectItem value="speaking">Speaking</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="exercise_type">Exercise Type *</Label>
                <Select
                  value={formData.exercise_type}
                  onValueChange={(value) => setFormData({ ...formData, exercise_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select exercise type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="practice">Practice</SelectItem>
                    <SelectItem value="mock_test">Mock Test</SelectItem>
                    <SelectItem value="diagnostic">Diagnostic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty *</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ielts_level">IELTS Level</Label>
                <Input
                  id="ielts_level"
                  value={formData.ielts_level}
                  onChange={(e) => setFormData({ ...formData, ielts_level: e.target.value })}
                  placeholder="e.g., 6.0-6.5, 7.0+"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time_limit">Time Limit (minutes)</Label>
                <Input
                  id="time_limit"
                  type="number"
                  min="0"
                  value={formData.time_limit_minutes}
                  onChange={(e) => setFormData({ ...formData, time_limit_minutes: parseInt(e.target.value) || 0 })}
                  placeholder="0 = no limit"
                />
              </div>
            </div>

            {/* Speaking-specific fields */}
            {formData.skill_type === "speaking" && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold">Speaking Details</h3>
                <div className="space-y-2">
                  <Label htmlFor="speaking_part">Part Number *</Label>
                  <Select
                    value={formData.speaking_part_number.toString()}
                    onValueChange={(value) => setFormData({ ...formData, speaking_part_number: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Part 1 - Introduction & Interview (4-5 questions)</SelectItem>
                      <SelectItem value="2">Part 2 - Long Turn / Cue Card (2 minutes)</SelectItem>
                      <SelectItem value="3">Part 3 - Discussion (4-6 questions)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="speaking_prompt">Prompt Text (Optional)</Label>
                  <Textarea
                    id="speaking_prompt"
                    value={formData.speaking_prompt_text}
                    onChange={(e) => setFormData({ ...formData, speaking_prompt_text: e.target.value })}
                    placeholder="Brief overview (optional). Add detailed questions in the edit page."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    💡 After creating, go to edit page to add sections with specific questions
                  </p>
                </div>
              </div>
            )}

            {/* Writing-specific fields */}
            {formData.skill_type === "writing" && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold">Writing Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="writing_task">Task Type *</Label>
                    <Select
                      value={formData.writing_task_type.toString()}
                      onValueChange={(value) => setFormData({ ...formData, writing_task_type: parseInt(value), writing_word_requirement: parseInt(value) === 1 ? 150 : 250 })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Task 1 - Report (150+ words)</SelectItem>
                        <SelectItem value="2">Task 2 - Essay (250+ words)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="word_requirement">Minimum Words</Label>
                    <Input
                      id="word_requirement"
                      type="number"
                      value={formData.writing_word_requirement}
                      onChange={(e) => setFormData({ ...formData, writing_word_requirement: parseInt(e.target.value) || 250 })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="writing_prompt">Prompt Text (Optional)</Label>
                  <Textarea
                    id="writing_prompt"
                    value={formData.writing_prompt_text}
                    onChange={(e) => setFormData({ ...formData, writing_prompt_text: e.target.value })}
                    placeholder="Brief overview (optional). Add detailed task and rubric in the edit page."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    💡 After creating, go to edit page to add full task description, visual materials, and scoring rubric
                  </p>
                </div>
              </div>
            )}

            {/* Reading-specific fields */}
            {formData.skill_type === "reading" && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold">Reading Details</h3>
                <div className="space-y-2">
                  <Label htmlFor="ielts_test_type">IELTS Test Type *</Label>
                  <Select
                    value={formData.ielts_test_type}
                    onValueChange={(value) => setFormData({ ...formData, ielts_test_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="general_training">General Training</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/exercises")}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                <Plus className="w-4 h-4 mr-2" />
                {creating ? "Creating..." : "Create Exercise"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
