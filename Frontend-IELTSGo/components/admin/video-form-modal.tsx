"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { instructorApi } from "@/lib/api/instructor"
import { Loader2, Youtube, Video as VideoIcon } from "lucide-react"

interface VideoFormModalProps {
  lessonId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function VideoFormModal({ lessonId, open, onOpenChange, onSuccess }: VideoFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    video_provider: "youtube",
    video_id: "",
    video_url: "",
    duration_seconds: 0,
    thumbnail_url: "",
    quality: "1080p",
    display_order: 0,
  })

  useEffect(() => {
    if (open && !lessonId) {
      // Reset form when opening without lesson
      setFormData({
        title: "",
        video_provider: "youtube",
        video_id: "",
        video_url: "",
        duration_seconds: 0,
        thumbnail_url: "",
        quality: "1080p",
        display_order: 0,
      })
    }
  }, [open, lessonId])

  const handleYouTubeUrlChange = (url: string) => {
    setFormData({ ...formData, video_url: url })
    
    // Auto-extract YouTube video ID
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    const match = url.match(youtubeRegex)
    if (match && match[1]) {
      setFormData(prev => ({
        ...prev,
        video_url: url,
        video_id: match[1],
        thumbnail_url: `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.video_url.trim()) {
      alert("Please enter video title and URL")
      return
    }

    if (!lessonId) {
      alert("Lesson ID is required")
      return
    }

    try {
      setLoading(true)
      
      const videoData = {
        title: formData.title,
        video_provider: formData.video_provider,
        video_id: formData.video_id,
        video_url: formData.video_url,
        duration_seconds: formData.duration_seconds > 0 ? formData.duration_seconds : undefined,
        thumbnail_url: formData.thumbnail_url || undefined,
        quality: formData.quality || undefined,
        display_order: formData.display_order,
      }
      
      console.log("Adding video to lesson:", lessonId, videoData)
      await instructorApi.addVideoToLesson(lessonId, videoData)
      
      // Reset form
      setFormData({
        title: "",
        video_provider: "youtube",
        video_id: "",
        video_url: "",
        duration_seconds: 0,
        thumbnail_url: "",
        quality: "1080p",
        display_order: 0,
      })
      
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Failed to add video:", error)
      console.error("Error details:", error.response?.data)
      const errorMsg = error.response?.data?.error?.message || error.response?.data?.message || "Failed to add video. Please try again."
      alert(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Video to Lesson</DialogTitle>
          <DialogDescription>
            Add video content from YouTube, Vimeo, or other video platforms
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Video Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Introduction to Speaking Part 1"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="video_provider">Video Provider *</Label>
            <Select
              value={formData.video_provider}
              onValueChange={(value) => setFormData({ ...formData, video_provider: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="youtube">
                  <div className="flex items-center gap-2">
                    <Youtube className="h-4 w-4" />
                    YouTube
                  </div>
                </SelectItem>
                <SelectItem value="vimeo">
                  <div className="flex items-center gap-2">
                    <VideoIcon className="h-4 w-4" />
                    Vimeo
                  </div>
                </SelectItem>
                <SelectItem value="bunny">
                  <div className="flex items-center gap-2">
                    <VideoIcon className="h-4 w-4" />
                    Bunny CDN
                  </div>
                </SelectItem>
                <SelectItem value="self-hosted">Self Hosted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="video_url">Video URL *</Label>
            <Input
              id="video_url"
              value={formData.video_url}
              onChange={(e) => {
                if (formData.video_provider === "youtube") {
                  handleYouTubeUrlChange(e.target.value)
                } else {
                  setFormData({ ...formData, video_url: e.target.value })
                }
              }}
              placeholder={
                formData.video_provider === "youtube" 
                  ? "https://www.youtube.com/watch?v=..."
                  : "Enter video URL"
              }
              required
            />
            {formData.video_provider === "youtube" && formData.video_id && (
              <p className="text-sm text-muted-foreground">
                Video ID: {formData.video_id}
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration_seconds">Duration (seconds)</Label>
              <Input
                id="duration_seconds"
                type="number"
                min="0"
                value={formData.duration_seconds}
                onChange={(e) => setFormData({ ...formData, duration_seconds: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quality">Quality</Label>
              <Select
                value={formData.quality}
                onValueChange={(value) => setFormData({ ...formData, quality: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="480p">480p</SelectItem>
                  <SelectItem value="720p">720p (HD)</SelectItem>
                  <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                  <SelectItem value="1440p">1440p (2K)</SelectItem>
                  <SelectItem value="2160p">2160p (4K)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                min="0"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
          </div>

          {formData.thumbnail_url && (
            <div className="space-y-2">
              <Label>Thumbnail Preview</Label>
              <img 
                src={formData.thumbnail_url} 
                alt="Video thumbnail" 
                className="w-full h-48 object-cover rounded-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          )}

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
              Add Video
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
