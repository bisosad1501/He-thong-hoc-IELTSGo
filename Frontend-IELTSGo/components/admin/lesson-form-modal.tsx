"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  onVideoNeeded?: (lessonId: string) => void
  lessonsCount: number
}

export function LessonFormModal({ moduleId, lesson, open, onOpenChange, onSuccess, onVideoNeeded, lessonsCount }: LessonFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content_type: "video",
    duration_minutes: 0,
    display_order: lessonsCount,
    is_free: false,
  })

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
    } else {
      setFormData({
        title: "",
        description: "",
        content_type: "video",
        duration_minutes: 0,
        display_order: lessonsCount,
        is_free: false,
      })
    }
  }, [lesson, lessonsCount, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      alert("Please enter a lesson title")
      return
    }

    if (!moduleId) {
      alert("Module ID is required")
      return
    }

    try {
      setLoading(true)
      
      if (lesson) {
        // Update existing lesson
        console.log("Updating lesson:", lesson.id, formData)
        await instructorApi.updateLesson(lesson.id, {
          title: formData.title,
          description: formData.description || undefined,
          content_type: formData.content_type,
          duration_minutes: formData.duration_minutes > 0 ? formData.duration_minutes : undefined,
          display_order: formData.display_order,
          is_free: formData.is_free,
        })
      } else {
        // Create new lesson
        const lessonData = {
          module_id: moduleId,
          title: formData.title,
          description: formData.description || undefined,
          content_type: formData.content_type,
          duration_minutes: formData.duration_minutes > 0 ? formData.duration_minutes : undefined,
          display_order: formData.display_order,
          is_free: formData.is_free,
        }
        console.log("Creating lesson with data:", lessonData)
        await instructorApi.createLesson(lessonData)
      }
      
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Failed to save lesson:", error)
      console.error("Error details:", error.response?.data)
      const errorMsg = error.response?.data?.error?.message || error.response?.data?.message || "Failed to save lesson. Please try again."
      alert(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What will students learn in this lesson?"
              rows={3}
            />
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
                <SelectItem value="article">Article</SelectItem>
                <SelectItem value="quiz">Quiz</SelectItem>
                <SelectItem value="exercise">Exercise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration_minutes">Duration (minutes)</Label>
              <Input
                id="duration_minutes"
                type="number"
                min="0"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
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
