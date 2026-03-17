"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Save, Plus, Trash2, Edit, FileText, Headphones, Mic, Pen, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { adminApi } from "@/lib/api/admin"
import { instructorApi } from "@/lib/api/instructor"
import { apiClient } from "@/lib/api/apiClient"

// Import skill-specific edit components
import ListeningExerciseEdit from "@/components/admin/exercises/listening-exercise-edit"
import ReadingExerciseEdit from "@/components/admin/exercises/reading-exercise-edit"
import WritingExerciseEdit from "@/components/admin/exercises/writing-exercise-edit"
import SpeakingExerciseEdit from "@/components/admin/exercises/speaking-exercise-edit"

interface Question {
  question: {
    id: string
    question_number: number
    question_text: string
    question_type: string
    points: number
    difficulty: string
    explanation?: string
    tips?: string
  }
  options?: Array<{
    id: string
    option_label: string
    option_text: string
    is_correct: boolean
  }>
}

interface Section {
  section: {
    id: string
    title: string
    description?: string
    section_number: number
    audio_url?: string
    transcript?: string
    instructions?: string
    total_questions: number
  }
  questions: Question[]
}

interface ExerciseDetail {
  exercise: {
    id: string
    title: string
    description?: string
    exercise_type: string
    skill_type: string
    difficulty: string
    ielts_level?: string
    total_questions: number
    total_sections: number
    time_limit_minutes?: number
    thumbnail_url?: string
    audio_url?: string
    audio_duration_seconds?: number
    audio_transcript?: string
    passing_score?: number
    total_points: number
    is_free: boolean
    is_published: boolean
    instructions?: string
    writing_word_requirement?: number
    speaking_preparation_time?: number
    speaking_response_time?: number
  }
  sections: Section[]
}

export default function EditExercisePage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const exerciseId = params.id as string

  // Store return URL with params
  const returnUrl = searchParams.get("returnUrl") || "/admin/exercises"

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  const [exerciseData, setExerciseData] = useState<ExerciseDetail | null>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [modules, setModules] = useState<any[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const [selectedModuleId, setSelectedModuleId] = useState<string>("")
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [loadingModules, setLoadingModules] = useState(false)
  const [detectingAudioDuration, setDetectingAudioDuration] = useState(false)
  const [detectedDuration, setDetectedDuration] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    skill_type: "listening",
    difficulty: "easy",
    exercise_type: "practice",
    time_limit_minutes: 0,
    passing_score: 0,
    is_free: false,
    ielts_level: "",
    audio_url: "",
    thumbnail_url: "",
  })

  useEffect(() => {
    fetchExerciseDetail()
  }, [exerciseId])

  // Auto-detect audio duration when audio URL changes
  useEffect(() => {
    if (!formData.audio_url || formData.skill_type !== 'listening') {
      setDetectedDuration(null)
      return
    }

    setDetectingAudioDuration(true)
    const audio = new Audio(formData.audio_url)

    audio.addEventListener('loadedmetadata', () => {
      const duration = Math.floor(audio.duration)
      setDetectedDuration(duration)
      setDetectingAudioDuration(false)
    })

    audio.addEventListener('error', () => {
      setDetectedDuration(null)
      setDetectingAudioDuration(false)
    })

    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [formData.audio_url, formData.skill_type])

  const fetchExerciseDetail = async () => {
    console.log("[Main] Fetching exercise detail for ID:", exerciseId)
    try {
      setLoading(true)
      const response = await apiClient.get<{ success: boolean; data: ExerciseDetail }>(
        `/admin/exercises/${exerciseId}`
      )
      console.log("[Main] Raw API response:", response)
      const data = response.data.data
      console.log("[Main] Fetched exercise data:", data)
      console.log("[Main] Exercise speaking fields:", {
        speaking_prompt_text: data.exercise.speaking_prompt_text,
        speaking_part_number: data.exercise.speaking_part_number
      })
      setExerciseData(data)

      setFormData({
        title: data.exercise.title || "",
        description: data.exercise.description || "",
        skill_type: data.exercise.skill_type || "listening",
        difficulty: data.exercise.difficulty || "easy",
        exercise_type: data.exercise.exercise_type || "practice",
        time_limit_minutes: data.exercise.time_limit_minutes || 0,
        passing_score: data.exercise.passing_score || 0,
        is_free: data.exercise.is_free || false,
        ielts_level: data.exercise.ielts_level || "",
        audio_url: data.exercise.audio_url || "",
        thumbnail_url: data.exercise.thumbnail_url || "",
      })
      console.log("[Main] Exercise data and form updated successfully")
    } catch (error) {
      console.error("[Main] Failed to fetch exercise:", error)
      toast({
        title: "Error",
        description: "Failed to load exercise. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      console.log("[Main] Fetch completed, loading=false")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSaving(true)
      await adminApi.updateExercise(exerciseId, formData)

      toast({
        title: "Success",
        description: "Exercise updated successfully",
      })

      router.push(returnUrl)
    } catch (error) {
      console.error("Failed to update exercise:", error)
      toast({
        title: "Error",
        description: "Failed to update exercise. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    try {
      setSaving(true)
      await apiClient.post(`/admin/exercises/${exerciseId}/publish`)

      toast({
        title: "Success",
        description: "Exercise published successfully",
      })

      // Refetch to update UI
      await fetchExerciseDetail()
    } catch (error) {
      console.error("Failed to publish exercise:", error)
      toast({
        title: "Error",
        description: "Failed to publish exercise. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleUnpublish = async () => {
    try {
      setSaving(true)
      await apiClient.post(`/admin/exercises/${exerciseId}/unpublish`)

      toast({
        title: "Success",
        description: "Exercise unpublished successfully",
      })

      // Refetch to update UI
      await fetchExerciseDetail()
    } catch (error) {
      console.error("Failed to unpublish exercise:", error)
      toast({
        title: "Error",
        description: "Failed to unpublish exercise. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Get icon based on skill type
  const getSkillIcon = () => {
    switch (exerciseData?.exercise.skill_type) {
      case 'listening':
        return <Headphones className="w-6 h-6" />
      case 'reading':
        return <FileText className="w-6 h-6" />
      case 'writing':
        return <Pen className="w-6 h-6" />
      case 'speaking':
        return <Mic className="w-6 h-6" />
      default:
        return null
    }
  }

  // Render skill-specific edit component
  const renderSkillSpecificEdit = () => {
    if (!exerciseData) return null

    const commonProps = {
      exerciseData,
      onUpdate: fetchExerciseDetail,
    }

    switch (exerciseData.exercise.skill_type) {
      case 'listening':
        return <ListeningExerciseEdit {...commonProps} />
      case 'reading':
        return <ReadingExerciseEdit {...commonProps} />
      case 'writing':
        return <WritingExerciseEdit {...commonProps} />
      case 'speaking':
        return <SpeakingExerciseEdit {...commonProps} />
      default:
        return <div className="text-center text-muted-foreground">Unknown skill type</div>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    )
  }

  if (!exerciseData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg">Exercise not found</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/exercises")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              {getSkillIcon()}
            </div>
            <div>
              <h1 className="text-3xl font-bold">Edit {exerciseData?.exercise.skill_type?.toUpperCase()} Exercise</h1>
              <p className="text-muted-foreground mt-1">
                {exerciseData?.exercise.total_sections > 0 && `${exerciseData.exercise.total_sections} sections • `}
                {exerciseData?.exercise.total_questions > 0 && `${exerciseData.exercise.total_questions} questions`}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={exerciseData?.exercise.is_published ? "default" : "secondary"}>
            {exerciseData?.exercise.is_published ? "Published" : "Draft"}
          </Badge>
          <Badge variant="outline">{exerciseData?.exercise.skill_type}</Badge>
          {exerciseData?.exercise.is_published ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnpublish}
              disabled={saving}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Unpublish
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handlePublish}
              disabled={saving}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Publish
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Edit the main details of the exercise</CardDescription>
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="skill_type">Skill Type *</Label>
                    <Select
                      value={formData.skill_type}
                      onValueChange={(value) => setFormData({ ...formData, skill_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select skill type" />
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
                        <SelectItem value="full_test">Full Test</SelectItem>
                        <SelectItem value="mini_test">Mini Test</SelectItem>
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
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ielts_level">IELTS Level</Label>
                    <Input
                      id="ielts_level"
                      value={formData.ielts_level}
                      onChange={(e) => setFormData({ ...formData, ielts_level: e.target.value })}
                      placeholder="e.g., band 7.5-8.0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="passing_score">Passing Score</Label>
                    <Input
                      id="passing_score"
                      type="number"
                      min="0"
                      value={formData.passing_score}
                      onChange={(e) => setFormData({ ...formData, passing_score: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
                  <Input
                    id="thumbnail_url"
                    value={formData.thumbnail_url}
                    onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                {/* Audio URL only for Listening exercises */}
                {formData.skill_type === 'listening' && (
                  <div className="space-y-3">
                    <Label htmlFor="audio_url">Audio URL</Label>
                    <Input
                      id="audio_url"
                      value={formData.audio_url}
                      onChange={(e) => setFormData({ ...formData, audio_url: e.target.value })}
                      placeholder="https://example.com/audio.mp3"
                    />
                    {formData.audio_url && (
                      <div className="rounded-lg border border-purple-200 bg-purple-50 dark:bg-purple-950/20 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-sm font-medium text-purple-700 dark:text-purple-300">
                            <Headphones className="w-4 h-4" />
                            Audio Preview
                          </div>
                          {detectingAudioDuration && (
                            <span className="text-xs text-muted-foreground animate-pulse">
                              Detecting duration...
                            </span>
                          )}
                          {detectedDuration !== null && !detectingAudioDuration && (
                            <span className="text-xs font-mono text-green-600 dark:text-green-400">
                              Duration: {Math.floor(detectedDuration / 60)}:{String(detectedDuration % 60).padStart(2, '0')}
                            </span>
                          )}
                        </div>
                        <audio
                          controls
                          src={formData.audio_url}
                          className="w-full"
                          preload="metadata"
                        >
                          Your browser does not support the audio element.
                        </audio>
                        <p className="text-xs text-muted-foreground mt-2">
                          Supported formats: MP3, WAV, M4A, OGG
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/admin/exercises")}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* Content Tab - Skill-specific */}
        <TabsContent value="content">
          {renderSkillSpecificEdit()}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Exercise Settings</CardTitle>
              <CardDescription>Configure additional settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Free Access</Label>
                  <p className="text-sm text-muted-foreground">Allow students to access without payment</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.is_free}
                  onChange={(e) => setFormData({ ...formData, is_free: e.target.checked })}
                  className="h-4 w-4"
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-semibold">Statistics</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Attempts</p>
                    <p className="text-2xl font-bold">{exerciseData.exercise.total_attempts || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Average Score</p>
                    <p className="text-2xl font-bold">
                      {exerciseData.exercise.average_score?.toFixed(1) || 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Completion Time</p>
                    <p className="text-2xl font-bold">
                      {exerciseData.exercise.average_completion_time || 0} min
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
