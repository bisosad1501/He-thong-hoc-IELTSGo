"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Edit, Save, Image as ImageIcon, FileText } from "lucide-react"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { adminApi } from "@/lib/api/admin"

interface ExerciseDetail {
  exercise: {
    id: string
    title: string
    writing_task_type?: string
    writing_prompt_text?: string
    writing_visual_type?: string
    writing_visual_url?: string
    writing_word_requirement?: number
    [key: string]: any
  }
  sections: any[]
}

interface WritingExerciseEditProps {
  exerciseData: ExerciseDetail
  onUpdate: () => void
}

export default function WritingExerciseEdit({ exerciseData, onUpdate }: WritingExerciseEditProps) {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    writing_prompt_text: exerciseData.exercise.writing_prompt_text || "",
    writing_visual_url: exerciseData.exercise.writing_visual_url || "",
    writing_visual_type: exerciseData.exercise.writing_visual_type || "",
    writing_word_requirement: exerciseData.exercise.writing_word_requirement || 250,
  })

  // Update formData when exerciseData changes
  useEffect(() => {
    console.log("[Writing] Props updated, refreshing formData")
    setFormData({
      writing_prompt_text: exerciseData.exercise.writing_prompt_text || "",
      writing_visual_url: exerciseData.exercise.writing_visual_url || "",
      writing_visual_type: exerciseData.exercise.writing_visual_type || "",
      writing_word_requirement: exerciseData.exercise.writing_word_requirement || 250,
    })
  }, [exerciseData])

  const handleSave = async () => {
    console.log("[Writing] Starting save with data:", formData)
    try {
      setSaving(true)
      const result = await adminApi.updateExercise(exerciseData.exercise.id, formData)
      console.log("[Writing] Update result:", result)
      
      toast({
        title: "Success",
        description: "Writing exercise updated successfully",
      })
      
      setIsEditing(false)
      console.log("[Writing] Calling onUpdate to refresh data")
      await onUpdate()
    } catch (error) {
      console.error("[Writing] Failed to update exercise:", error)
      toast({
        title: "Error",
        description: "Failed to update exercise. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Task Type Badge */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5" />
            <span className="font-medium">Task Type:</span>
            <Badge variant="default" className="text-base px-3 py-1">
              {exerciseData.exercise.writing_task_type?.toUpperCase()}
            </Badge>
            <span className="text-muted-foreground">•</span>
            <span className="text-sm">
              Minimum {exerciseData.exercise.writing_word_requirement || 250} words
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Prompt & Visual */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Writing Prompt</CardTitle>
              <CardDescription>
                {exerciseData.exercise.writing_task_type === 'task1' 
                  ? 'Describe the visual data and trends'
                  : 'Essay question for argumentative/discussion writing'}
              </CardDescription>
            </div>
            <Button 
              variant={isEditing ? "default" : "outline"} 
              size="sm"
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={saving}
            >
              {isEditing ? (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Saving..." : "Save"}
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Prompt Text */}
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt Text</Label>
            {isEditing ? (
              <Textarea
                id="prompt"
                value={formData.writing_prompt_text}
                onChange={(e) => setFormData({ ...formData, writing_prompt_text: e.target.value })}
                rows={6}
                className="font-mono text-sm"
              />
            ) : (
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{formData.writing_prompt_text}</p>
              </div>
            )}
          </div>

          {/* Visual for Task 1 */}
          {exerciseData.exercise.writing_task_type === 'task1' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="visual_type">Visual Type</Label>
                  {isEditing ? (
                    <Input
                      id="visual_type"
                      value={formData.writing_visual_type}
                      onChange={(e) => setFormData({ ...formData, writing_visual_type: e.target.value })}
                      placeholder="e.g., bar_chart, line_graph, pie_chart"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {formData.writing_visual_type?.replace(/_/g, ' ') || 'Not specified'}
                      </Badge>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="word_requirement">Word Requirement</Label>
                  {isEditing ? (
                    <Input
                      id="word_requirement"
                      type="number"
                      value={formData.writing_word_requirement}
                      onChange={(e) => setFormData({ ...formData, writing_word_requirement: parseInt(e.target.value) })}
                    />
                  ) : (
                    <div className="text-sm font-medium">{formData.writing_word_requirement} words minimum</div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="visual_url">Visual/Chart URL</Label>
                {isEditing ? (
                  <Input
                    id="visual_url"
                    value={formData.writing_visual_url}
                    onChange={(e) => setFormData({ ...formData, writing_visual_url: e.target.value })}
                    placeholder="https://..."
                  />
                ) : (
                  formData.writing_visual_url && (
                    <div className="border rounded-lg p-4 bg-muted">
                      <div className="flex items-center gap-2 mb-2">
                        <ImageIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">Chart/Diagram:</span>
                      </div>
                      <img 
                        src={formData.writing_visual_url} 
                        alt="Writing prompt visual"
                        className="max-h-64 rounded border"
                      />
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Task 2 - Word requirement */}
          {exerciseData.exercise.writing_task_type === 'task2' && (
            <div className="space-y-2">
              <Label htmlFor="word_requirement_task2">Word Requirement</Label>
              {isEditing ? (
                <Input
                  id="word_requirement_task2"
                  type="number"
                  value={formData.writing_word_requirement}
                  onChange={(e) => setFormData({ ...formData, writing_word_requirement: parseInt(e.target.value) })}
                />
              ) : (
                <div className="text-sm font-medium bg-muted p-3 rounded">
                  Minimum {formData.writing_word_requirement} words
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scoring Criteria */}
      <Card>
        <CardHeader>
          <CardTitle>Scoring Criteria</CardTitle>
          <CardDescription>IELTS Writing Assessment Criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="font-medium text-sm">Task Achievement/Response</div>
              <div className="text-xs text-muted-foreground">25% of score</div>
            </div>
            <div className="space-y-1">
              <div className="font-medium text-sm">Coherence & Cohesion</div>
              <div className="text-xs text-muted-foreground">25% of score</div>
            </div>
            <div className="space-y-1">
              <div className="font-medium text-sm">Lexical Resource</div>
              <div className="text-xs text-muted-foreground">25% of score</div>
            </div>
            <div className="space-y-1">
              <div className="font-medium text-sm">Grammatical Range & Accuracy</div>
              <div className="text-xs text-muted-foreground">25% of score</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Note */}
      <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
        <CardContent className="pt-6">
          <p className="text-sm text-amber-900 dark:text-amber-100">
            <strong>Note:</strong> Writing exercises are evaluated by AI. Students will receive feedback on Task Achievement, Coherence, Vocabulary, and Grammar with a band score (0-9).
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
