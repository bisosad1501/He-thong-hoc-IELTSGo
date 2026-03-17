"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Edit, Save, Mic, Clock, MessageSquare } from "lucide-react"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { adminApi } from "@/lib/api/admin"

interface ExerciseDetail {
  exercise: {
    id: string
    title: string
    speaking_part_number?: number
    speaking_prompt_text?: string
    speaking_cue_card_topic?: string
    speaking_cue_card_points?: string[]
    speaking_preparation_time_seconds?: number
    speaking_response_time_seconds?: number
    speaking_follow_up_questions?: string[]
    [key: string]: any
  }
  sections: any[]
}

interface SpeakingExerciseEditProps {
  exerciseData: ExerciseDetail
  onUpdate: () => void
}

export default function SpeakingExerciseEdit({ exerciseData, onUpdate }: SpeakingExerciseEditProps) {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    speaking_prompt_text: exerciseData.exercise.speaking_prompt_text || "",
    speaking_cue_card_topic: exerciseData.exercise.speaking_cue_card_topic || "",
    speaking_cue_card_points: exerciseData.exercise.speaking_cue_card_points || [],
    speaking_preparation_time_seconds: exerciseData.exercise.speaking_preparation_time_seconds || 60,
    speaking_response_time_seconds: exerciseData.exercise.speaking_response_time_seconds || 120,
    speaking_follow_up_questions: exerciseData.exercise.speaking_follow_up_questions || [],
  })

  // Update formData when exerciseData changes
  useEffect(() => {
    console.log("[Speaking] Props updated, refreshing formData")
    setFormData({
      speaking_prompt_text: exerciseData.exercise.speaking_prompt_text || "",
      speaking_cue_card_topic: exerciseData.exercise.speaking_cue_card_topic || "",
      speaking_cue_card_points: exerciseData.exercise.speaking_cue_card_points || [],
      speaking_preparation_time_seconds: exerciseData.exercise.speaking_preparation_time_seconds || 60,
      speaking_response_time_seconds: exerciseData.exercise.speaking_response_time_seconds || 120,
      speaking_follow_up_questions: exerciseData.exercise.speaking_follow_up_questions || [],
    })
  }, [exerciseData])

  const partNumber = exerciseData.exercise.speaking_part_number || 1

  const handleSave = async () => {
    console.log("[Speaking] Starting save with data:", formData)
    try {
      setSaving(true)
      
      console.log("[Speaking] Sending data to API:", formData)
      const result = await adminApi.updateExercise(exerciseData.exercise.id, formData)
      console.log("[Speaking] Update result:", result)
      
      toast({
        title: "Success",
        description: "Speaking exercise updated successfully",
      })
      
      setIsEditing(false)
      console.log("[Speaking] Calling onUpdate to refresh data")
      await onUpdate()
    } catch (error) {
      console.error("[Speaking] Failed to update exercise:", error)
      toast({
        title: "Error",
        description: "Failed to update exercise. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const getPartDescription = () => {
    switch (partNumber) {
      case 1:
        return "Introduction and interview (4-5 minutes)"
      case 2:
        return "Individual long turn with cue card (3-4 minutes)"
      case 3:
        return "Two-way discussion (4-5 minutes)"
      default:
        return "Speaking test"
    }
  }

  return (
    <div className="space-y-4">
      {/* Part Number Badge */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Mic className="w-5 h-5" />
            <span className="font-medium">Speaking Part:</span>
            <Badge variant="default" className="text-base px-3 py-1">
              Part {partNumber}
            </Badge>
            <span className="text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">{getPartDescription()}</span>
          </div>
        </CardContent>
      </Card>

      {/* Main Prompt */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Speaking Prompt</CardTitle>
              <CardDescription>Main question or topic for the student</CardDescription>
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
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt Text</Label>
            {isEditing ? (
              <Textarea
                id="prompt"
                value={formData.speaking_prompt_text}
                onChange={(e) => setFormData({ ...formData, speaking_prompt_text: e.target.value })}
                rows={4}
                placeholder="Enter the main speaking prompt..."
              />
            ) : (
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{formData.speaking_prompt_text}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Part 2 Specific: Cue Card */}
      {partNumber === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Cue Card
            </CardTitle>
            <CardDescription>Topic and speaking points for Part 2</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cue_topic">Cue Card Topic</Label>
              {isEditing ? (
                <Input
                  id="cue_topic"
                  value={formData.speaking_cue_card_topic}
                  onChange={(e) => setFormData({ ...formData, speaking_cue_card_topic: e.target.value })}
                  placeholder="e.g., Describe a memorable journey"
                />
              ) : (
                <div className="bg-purple-50 dark:bg-purple-950/20 p-3 rounded-lg">
                  <p className="font-medium">{formData.speaking_cue_card_topic || 'Not specified'}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Cue Card Points (bullet points for student)</Label>
              {isEditing ? (
                <div className="space-y-2">
                  {formData.speaking_cue_card_points.map((point, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input
                        value={point}
                        onChange={(e) => {
                          const newPoints = [...formData.speaking_cue_card_points]
                          newPoints[idx] = e.target.value
                          setFormData({ ...formData, speaking_cue_card_points: newPoints })
                        }}
                        placeholder={`Point ${idx + 1}`}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newPoints = formData.speaking_cue_card_points.filter((_, i) => i !== idx)
                          setFormData({ ...formData, speaking_cue_card_points: newPoints })
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({ 
                      ...formData, 
                      speaking_cue_card_points: [...formData.speaking_cue_card_points, ''] 
                    })}
                  >
                    Add Point
                  </Button>
                </div>
              ) : (
                <ul className="space-y-1 bg-muted p-4 rounded-lg">
                  {formData.speaking_cue_card_points.map((point, idx) => (
                    <li key={idx} className="text-sm flex gap-2">
                      <span>•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                  {formData.speaking_cue_card_points.length === 0 && (
                    <li className="text-sm text-muted-foreground">No points added yet</li>
                  )}
                </ul>
              )}
            </div>

            {/* Time allocations for Part 2 */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="prep_time" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Preparation Time
                </Label>
                {isEditing ? (
                  <Input
                    id="prep_time"
                    type="number"
                    value={formData.speaking_preparation_time_seconds}
                    onChange={(e) => setFormData({ ...formData, speaking_preparation_time_seconds: parseInt(e.target.value) })}
                  />
                ) : (
                  <div className="text-sm font-medium">{formData.speaking_preparation_time_seconds}s (1 minute)</div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="response_time" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Response Time
                </Label>
                {isEditing ? (
                  <Input
                    id="response_time"
                    type="number"
                    value={formData.speaking_response_time_seconds}
                    onChange={(e) => setFormData({ ...formData, speaking_response_time_seconds: parseInt(e.target.value) })}
                  />
                ) : (
                  <div className="text-sm font-medium">{formData.speaking_response_time_seconds}s (2 minutes)</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Part 3 Specific: Follow-up Questions */}
      {partNumber === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Follow-up Questions</CardTitle>
            <CardDescription>Discussion questions for Part 3</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {isEditing ? (
              <div className="space-y-2">
                {formData.speaking_follow_up_questions.map((question, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Textarea
                      value={question}
                      onChange={(e) => {
                        const newQuestions = [...formData.speaking_follow_up_questions]
                        newQuestions[idx] = e.target.value
                        setFormData({ ...formData, speaking_follow_up_questions: newQuestions })
                      }}
                      placeholder={`Question ${idx + 1}`}
                      rows={2}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newQuestions = formData.speaking_follow_up_questions.filter((_, i) => i !== idx)
                        setFormData({ ...formData, speaking_follow_up_questions: newQuestions })
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({ 
                    ...formData, 
                    speaking_follow_up_questions: [...formData.speaking_follow_up_questions, ''] 
                  })}
                >
                  Add Question
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.speaking_follow_up_questions.map((question, idx) => (
                  <div key={idx} className="bg-muted p-3 rounded-lg">
                    <div className="flex gap-2">
                      <Badge variant="secondary">{idx + 1}</Badge>
                      <p className="text-sm flex-1">{question}</p>
                    </div>
                  </div>
                ))}
                {formData.speaking_follow_up_questions.length === 0 && (
                  <p className="text-sm text-muted-foreground">No follow-up questions added yet</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Scoring Info */}
      <Card>
        <CardHeader>
          <CardTitle>Scoring Criteria</CardTitle>
          <CardDescription>IELTS Speaking Assessment Criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="font-medium text-sm">Fluency & Coherence</div>
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
            <div className="space-y-1">
              <div className="font-medium text-sm">Pronunciation</div>
              <div className="text-xs text-muted-foreground">25% of score</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Note */}
      <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
        <CardContent className="pt-6">
          <p className="text-sm text-amber-900 dark:text-amber-100">
            <strong>Note:</strong> Speaking exercises are evaluated by AI based on audio recordings. Students will receive feedback on Fluency, Vocabulary, Grammar, and Pronunciation with a band score (0-9).
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
