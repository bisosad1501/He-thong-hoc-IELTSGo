"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { instructorApi } from "@/lib/api/instructor"
import { Loader2 } from "lucide-react"

interface LessonFormModalProps {
  moduleId: string
  lesson?: {
    id: string
    title: string
    description?: string
    content_type: string
    duration_minutes?: number
    display_order: number
    is_free: boolean
    exercise_id?: string
    videos?: Array<{
      id: string
      title: string
      video_url: string
      video_provider: string
      video_id: string
      duration_seconds?: number
    }>
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  onVideoNeeded?: (lessonId: string) => void
  lessonsCount: number
}

export function LessonFormModal({ moduleId, lesson, open, onOpenChange, onSuccess, onVideoNeeded, lessonsCount }: LessonFormModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content_type: "video", // video, text, quiz, exercise
    duration_minutes: 0,
    display_order: lessonsCount,
    is_free: false,
  })
  const [videoData, setVideoData] = useState({
    title: "",
    url: "",
    duration_seconds: 0,
  })
  const [originalVideoData, setOriginalVideoData] = useState<{
    id?: string
    url: string
  } | null>(null)
  const [fetchingDuration, setFetchingDuration] = useState(false)

  // Note: YouTube oEmbed doesn't provide duration, so we rely on backend auto-fetch
  // This function is kept for future reference but not actively used
  const fetchYouTubeDuration = async (videoId: string) => {
    // Disabled - backend handles YouTube duration auto-fetch
    return 0
  }

  // Handle video URL changes without auto-fetching duration
  const handleVideoUrlChange = (url: string) => {
    setVideoData({ ...videoData, url })
    // Backend will auto-fetch duration for YouTube videos
  }

  useEffect(() => {
    console.log("LessonFormModal mounted/updated:", { moduleId, open, lesson })
  }, [moduleId, open, lesson])

  useEffect(() => {
    if (lesson) {
      setFormData({
        title: lesson.title || "",
        description: lesson.description || "",
        content_type: lesson.content_type || "video",
        duration_minutes: lesson.duration_minutes || 0,
        display_order: lesson.display_order,
        is_free: lesson.is_free,
      })
      
      // Load video data if lesson has videos
      const firstVideo = lesson.videos && lesson.videos.length > 0 ? lesson.videos[0] : null
      setVideoData({
        title: firstVideo?.title || lesson.title || "",
        url: firstVideo?.video_url || "",
        duration_seconds: firstVideo?.duration_seconds || 0,
      })
      // Store original video data for comparison
      setOriginalVideoData(firstVideo ? {
        id: firstVideo.id,
        url: firstVideo.video_url || ""
      } : null)
    } else {
      setFormData({
        title: "",
        description: "",
        content_type: "video",
        duration_minutes: 0,
        display_order: lessonsCount,
        is_free: false,
      })
      setVideoData({
        title: "",
        url: "",
        duration_seconds: 0,
      })
      setOriginalVideoData(null)
    }
  }, [lesson, lessonsCount, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log("handleSubmit called with:", { moduleId, formData, videoData })
    
    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a lesson title",
        variant: "destructive",
      })
      return
    }

    // Validate video fields if content type is video and creating new lesson
    if (formData.content_type === "video" && !lesson && !videoData.url.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter video URL for video lessons",
        variant: "destructive",
      })
      return
    }

    if (!moduleId || moduleId === "") {
      console.error("Module ID is missing:", moduleId)
      toast({
        title: "Error",
        description: "Module ID is required. Please close this dialog and try again.",
        variant: "destructive",
      })
      return
    }

    // Helper function to parse video URL and extract provider/ID
    const parseVideoUrl = (url: string) => {
      // YouTube patterns
      const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\?\/]+)/
      const youtubeMatch = url.match(youtubeRegex)
      if (youtubeMatch) {
        return {
          provider: 'youtube',
          video_id: youtubeMatch[1],
          video_url: url
        }
      }

      // Vimeo patterns
      const vimeoRegex = /vimeo\.com\/(\d+)/
      const vimeoMatch = url.match(vimeoRegex)
      if (vimeoMatch) {
        return {
          provider: 'vimeo',
          video_id: vimeoMatch[1],
          video_url: url
        }
      }

      // Default to self-hosted for direct video URLs
      return {
        provider: 'self-hosted',
        video_id: url.split('/').pop()?.split('?')[0] || 'video',
        video_url: url
      }
    }

    try {
      setLoading(true)
      
      if (lesson) {
        // Update existing lesson
        console.log("Updating lesson - ID:", lesson.id)
        console.log("Updating lesson - Type:", typeof lesson.id)
        console.log("Updating lesson - Full lesson:", lesson)
        console.log("Updating lesson - FormData:", formData)
        console.log("Updating lesson - Module ID:", moduleId)
        
        const updateData: any = {
          module_id: moduleId,
          title: formData.title,
          description: formData.description || undefined,
          content_type: formData.content_type,
          duration_minutes: formData.duration_minutes > 0 ? formData.duration_minutes : undefined,
          display_order: formData.display_order,
          is_free: formData.is_free,
        }
        
        await instructorApi.updateLesson(lesson.id, updateData)
        
        // Handle video updates if video URL changed
        if (formData.content_type === "video" && videoData.url) {
          const videoUrlChanged = originalVideoData?.url !== videoData.url
          
          if (originalVideoData?.id && videoUrlChanged) {
            // Update existing video
            const parsedVideo = parseVideoUrl(videoData.url)
            console.log("Updating video with parsed data:", parsedVideo)
            
            const videoPayload: any = {
              title: videoData.title || formData.title,
              video_provider: parsedVideo.provider,
              video_id: parsedVideo.video_id,
              video_url: parsedVideo.video_url,
            }
            
            // Only include duration if manually set (> 0)
            if (videoData.duration_seconds > 0) {
              videoPayload.duration_seconds = videoData.duration_seconds
            }
            
            await instructorApi.updateLessonVideo(lesson.id, originalVideoData.id, videoPayload)
            console.log("Video updated successfully")
          } else if (!originalVideoData && videoData.url) {
            // Add new video to lesson that didn't have one
            const parsedVideo = parseVideoUrl(videoData.url)
            console.log("Adding video to existing lesson:", parsedVideo)
            
            const videoPayload: any = {
              title: videoData.title || formData.title,
              video_provider: parsedVideo.provider,
              video_id: parsedVideo.video_id,
              video_url: parsedVideo.video_url,
            }
            
            if (videoData.duration_seconds > 0) {
              videoPayload.duration_seconds = videoData.duration_seconds
            }
            
            await instructorApi.addVideoToLesson(lesson.id, videoPayload)
            console.log("Video added successfully")
          }
        }
        
        toast({
          title: "Success",
          description: "Lesson updated successfully",
        })
      } else {
        // Create new lesson
        const lessonData: any = {
          module_id: moduleId,
          title: formData.title,
          description: formData.description || undefined,
          content_type: formData.content_type,
          duration_minutes: formData.duration_minutes > 0 ? formData.duration_minutes : undefined,
          display_order: formData.display_order,
          is_free: formData.is_free,
        }

        console.log("Creating lesson with data:", lessonData)
        const newLesson = await instructorApi.createLesson(lessonData)
        
        // If video lesson, add video immediately
        if (formData.content_type === "video" && newLesson.id) {
          const parsedVideo = parseVideoUrl(videoData.url)
          console.log("Adding video with parsed data:", parsedVideo)
          
          // Prepare video payload - only include duration if > 0, let backend auto-fetch for YouTube
          const videoPayload: any = {
            title: videoData.title || formData.title,
            video_provider: parsedVideo.provider,
            video_id: parsedVideo.video_id,
            video_url: parsedVideo.video_url,
          }
          
          // Only include duration if manually set (> 0)
          // For YouTube, omit duration to trigger backend auto-fetch
          if (videoData.duration_seconds > 0) {
            videoPayload.duration_seconds = videoData.duration_seconds
          }
          
          await instructorApi.addVideoToLesson(newLesson.id, videoPayload)
        }
        
        toast({
          title: "Success",
          description: "Lesson created successfully",
        })
      }
      
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Failed to save lesson:", error)
      console.error("Error response:", error.response)
      console.error("Error data:", error.response?.data)
      console.error("Error details:", error.response?.data?.error)
      const errorMsg = error.response?.data?.error?.message || error.response?.data?.message || error.response?.data?.error || "Failed to save lesson. Please try again."
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lesson ? "Edit Lesson" : "Add New Lesson"}</DialogTitle>
          <DialogDescription>
            {lesson ? "Update the lesson information" : "Add a new lesson to this module"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Lesson Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Introduction to Part 1"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              {formData.content_type === "text" ? "Text Content *" : "Description"}
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={
                formData.content_type === "text" 
                  ? "Enter the full text content here (supports Markdown)"
                  : "What will students learn in this lesson?"
              }
              rows={formData.content_type === "text" ? 10 : 3}
              required={formData.content_type === "text"}
            />
            {formData.content_type === "text" && (
              <p className="text-sm text-muted-foreground">
                For text lessons, use this field to write the complete lesson content
              </p>
            )}
            {formData.content_type === "quiz" && (
              <p className="text-sm text-muted-foreground">
                Add instructions here. Create actual quizzes in the Exercise Management section
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="content_type">Content Type *</Label>
            <Select
              value={formData.content_type}
              onValueChange={(value) => setFormData({ ...formData, content_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="text">Text/Article</SelectItem>
                <SelectItem value="quiz">Quiz</SelectItem>
                <SelectItem value="exercise">Exercise</SelectItem>
              </SelectContent>
            </Select>
            {formData.content_type === "quiz" && (
              <p className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded mt-2">
                💡 Note: Quiz lessons are markers only. Create actual quizzes in the Exercise Management section.
              </p>
            )}
          </div>

          {/* Exercise Note - show when content type is exercise */}
          {formData.content_type === "exercise" && (
            <div className="space-y-3 border-t pt-4 mt-4 bg-blue-50 p-4 rounded">
              <h3 className="text-sm font-medium text-blue-900">📝 Exercise Lesson</h3>
              <p className="text-sm text-blue-700">
                This lesson is a <strong>marker</strong> in the learning path. <br />
                Actual exercises are managed separately in <strong>Exercise Management</strong> and automatically linked via <code>course_id</code> or <code>module_id</code>.
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => window.open('/admin/exercises', '_blank')}
              >
                Go to Exercise Management →
              </Button>
            </div>
          )}

          {/* Video fields - show when content type is video */}
          {formData.content_type === "video" && (
            <div className="space-y-4 border-t pt-4 mt-4">
              <h3 className="font-medium">Video Details</h3>
              
              <div className="space-y-2">
                <Label htmlFor="video_url">
                  Video URL * {lesson && <span className="text-sm text-muted-foreground">(leave empty to keep existing)</span>}
                  {fetchingDuration && <span className="text-sm text-blue-500 ml-2">Fetching duration...</span>}
                </Label>
                <Input
                  id="video_url"
                  value={videoData.url}
                  onChange={(e) => handleVideoUrlChange(e.target.value)}
                  placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                  required={!lesson}
                />
                <p className="text-sm text-muted-foreground">
                  YouTube, Vimeo, or direct video URL. Duration will be auto-detected for YouTube videos.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="video_title">Video Title (optional)</Label>
                <Input
                  id="video_title"
                  value={videoData.title}
                  onChange={(e) => setVideoData({ ...videoData, title: e.target.value })}
                  placeholder="Leave empty to use lesson title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="video_duration">Duration (seconds)</Label>
                <Input
                  id="video_duration"
                  type="number"
                  min="0"
                  value={videoData.duration_seconds}
                  onChange={(e) => setVideoData({ ...videoData, duration_seconds: parseInt(e.target.value) || 0 })}
                  placeholder="e.g., 600 for 10 minutes"
                />
                <p className="text-sm text-muted-foreground">
                  Video thumbnail will be automatically extracted from the video URL.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="display_order">Display Order</Label>
            <p className="text-sm text-muted-foreground">Order this lesson appears in the module (0 = first)</p>
            <Input
              id="display_order"
              type="number"
              min="0"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_free"
              checked={formData.is_free}
              onChange={(e) => setFormData({ ...formData, is_free: e.target.checked })}
              className="h-4 w-4 rounded"
            />
            <Label htmlFor="is_free" className="cursor-pointer">
              Free Preview (Available without enrollment)
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {lesson ? "Update Lesson" : "Add Lesson"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
