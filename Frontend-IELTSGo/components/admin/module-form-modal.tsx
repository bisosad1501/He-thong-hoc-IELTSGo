"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { instructorApi } from "@/lib/api/instructor"
import { Loader2 } from "lucide-react"

interface ModuleFormModalProps {
  courseId: string
  module?: {
    id: string
    title: string
    description?: string
    duration_hours?: number
    display_order: number
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  modulesCount: number
}

export function ModuleFormModal({ courseId, module, open, onOpenChange, onSuccess, modulesCount }: ModuleFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration_hours: 0,
    display_order: modulesCount,
  })

  useEffect(() => {
    if (module) {
      setFormData({
        title: module.title || "",
        description: module.description || "",
        duration_hours: module.duration_hours || 0,
        display_order: module.display_order,
      })
    } else {
      setFormData({
        title: "",
        description: "",
        duration_hours: 0,
        display_order: modulesCount,
      })
    }
  }, [module, modulesCount, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      alert("Please enter a module title")
      return
    }

    if (!courseId) {
      alert("Course ID is required")
      return
    }

    try {
      setLoading(true)
      
      if (module) {
        // Update existing module
        console.log("Updating module:", module.id, formData)
        await instructorApi.updateModule(module.id, {
          title: formData.title,
          description: formData.description || undefined,
          duration_hours: formData.duration_hours > 0 ? formData.duration_hours : undefined,
          display_order: formData.display_order,
        })
      } else {
        // Create new module
        const moduleData = {
          course_id: courseId,
          title: formData.title,
          description: formData.description || undefined,
          duration_hours: formData.duration_hours > 0 ? formData.duration_hours : undefined,
          display_order: formData.display_order,
        }
        console.log("Creating module with data:", moduleData)
        await instructorApi.createModule(moduleData)
      }
      
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Failed to save module:", error)
      console.error("Error details:", error.response?.data)
      const errorMsg = error.response?.data?.error?.message || error.response?.data?.message || "Failed to save module. Please try again."
      alert(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{module ? "Edit Module" : "Add New Module"}</DialogTitle>
          <DialogDescription>
            {module ? "Update the module information" : "Add a new module to organize your course content"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Module Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Introduction to IELTS Speaking"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of what this module covers"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration_hours">Duration (hours)</Label>
              <Input
                id="duration_hours"
                type="number"
                step="0.5"
                min="0"
                value={formData.duration_hours}
                onChange={(e) => setFormData({ ...formData, duration_hours: parseFloat(e.target.value) || 0 })}
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
              {module ? "Update Module" : "Add Module"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
