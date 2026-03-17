"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Edit, Trash2, Play, Volume2, Settings, AlertCircle, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { adminApi } from "@/lib/api/admin"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
  answers?: Array<{
    id: string
    answer_text: string
    alternative_answers?: string
    is_case_sensitive: boolean
    matching_order?: number
  }>
}

interface Section {
  section: {
    id: string
    title: string
    description?: string
    section_number: number
    audio_url?: string
    audio_start_time?: number
    audio_end_time?: number
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
    audio_url?: string
    audio_duration_seconds?: number
    audio_transcript?: string
    [key: string]: any
  }
  sections: Section[]
}

interface ListeningExerciseEditProps {
  exerciseData: ExerciseDetail
  onUpdate: () => void
}

export default function ListeningExerciseEdit({ exerciseData, onUpdate }: ListeningExerciseEditProps) {
  const { toast } = useToast()
  const [creating, setCreating] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [managingOptions, setManagingOptions] = useState<Question | null>(null)
  const [managingAnswers, setManagingAnswers] = useState<Question | null>(null)
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null)
  const [deletingSectionId, setDeletingSectionId] = useState<string | null>(null)
  const [questionForm, setQuestionForm] = useState({
    question_text: "",
    question_type: "multiple_choice",
    points: 1,
    difficulty: "medium",
    explanation: "",
    tips: "",
  })
  const [optionsForm, setOptionsForm] = useState<Array<{
    label: string
    text: string
    is_correct: boolean
  }>>([])
  const [answersForm, setAnswersForm] = useState<Array<{
    id?: string
    answer_text: string
    alternative_answers_raw: string  // Store as raw string for input
    is_case_sensitive: boolean
  }>>([{ answer_text: "", alternative_answers_raw: "", is_case_sensitive: false }])

  // Helper function to format question text with correct number
  const formatQuestionText = (questionText: string, questionNumber: number): string => {
    // Remove existing "Question X:" prefix if present
    const cleanedText = questionText.replace(/^Question\s+\d+:\s*/i, '')
    return `Question ${questionNumber}: ${cleanedText}`
  }

  // Helper function to format section title with correct number
  const formatSectionTitle = (sectionTitle: string, sectionNumber: number): string => {
    // Remove existing "Part X" prefix if present
    const cleanedTitle = sectionTitle.replace(/^Part\s+\d+\s*-?\s*/i, '')
    return cleanedTitle ? `Part ${sectionNumber} - ${cleanedTitle}` : `Part ${sectionNumber}`
  }

  const handleAddSection = async () => {
    try {
      setCreating(true)
      const nextSectionNumber = exerciseData.sections.length + 1
      
      await adminApi.createSection(exerciseData.exercise.id, {
        title: `Part ${nextSectionNumber}`,
        description: `Section ${nextSectionNumber} of the listening exercise`,
        section_number: nextSectionNumber,
        display_order: nextSectionNumber,
        instructions: "Answer all questions in this section",
      })
      
      toast({
        title: "Success",
        description: "Section created successfully",
      })
      
      onUpdate()
    } catch (error) {
      console.error("Failed to create section:", error)
      toast({
        title: "Error",
        description: "Failed to create section. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const handleAddQuestion = async (sectionId: string) => {
    try {
      setCreating(true)
      const section = exerciseData.sections.find(s => s.section.id === sectionId)
      const nextQuestionNumber = section ? section.questions.length + 1 : 1
      const totalQuestions = exerciseData.sections.reduce((sum, s) => sum + s.questions.length, 0)
      
      const result = await adminApi.createQuestion({
        exercise_id: exerciseData.exercise.id,
        section_id: sectionId,
        question_number: totalQuestions + 1,
        question_text: `Question ${nextQuestionNumber}: Choose the correct answer.`,
        question_type: "multiple_choice",
        points: 1,
        difficulty: "medium",
        display_order: nextQuestionNumber,
      })
      
      // Automatically add default options for multiple choice
      if (result && result.id) {
        const optionLabels = ['A', 'B', 'C', 'D']
        for (let i = 0; i < optionLabels.length; i++) {
          await adminApi.createQuestionOption(result.id, {
            option_label: optionLabels[i],
            option_text: `Option ${optionLabels[i]}`,
            is_correct: i === 0, // First option is correct by default
            display_order: i + 1,
          })
        }
      }
      
      toast({
        title: "Success",
        description: "Question created with default options",
      })
      
      onUpdate()
    } catch (error) {
      console.error("Failed to create question:", error)
      toast({
        title: "Error",
        description: "Failed to create question. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const confirmDeleteSection = async () => {
    if (!deletingSectionId) return
    
    try {
      setCreating(true)
      await adminApi.deleteSection(deletingSectionId)
      toast({
        title: "Success",
        description: "Section deleted successfully. Questions renumbered automatically.",
      })
      setDeletingSectionId(null)
      onUpdate()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error?.message || 
                          error?.message || 
                          "Failed to delete section. Please try again."
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const openEditQuestion = (question: Question) => {
    setQuestionForm({
      question_text: question.question.question_text,
      question_type: question.question.question_type,
      points: question.question.points,
      difficulty: question.question.difficulty,
      explanation: question.question.explanation || "",
      tips: question.question.tips || "",
    })
    setEditingQuestion(question)
  }

  const handleUpdateQuestion = async () => {
    if (!editingQuestion) return
    try {
      setCreating(true)
      await adminApi.updateQuestion(editingQuestion.question.id, questionForm)
      toast({
        title: "Success",
        description: "Question updated successfully",
      })
      setEditingQuestion(null)
      onUpdate()
    } catch (error) {
      console.error("Failed to update question:", error)
      toast({
        title: "Error",
        description: "Failed to update question. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const openManageOptions = (question: Question) => {
    if (question.options && question.options.length > 0) {
      setOptionsForm(question.options.map(opt => ({
        label: opt.option_label,
        text: opt.option_text,
        is_correct: opt.is_correct,
      })))
    } else {
      setOptionsForm([
        { label: "A", text: "", is_correct: false },
        { label: "B", text: "", is_correct: false },
        { label: "C", text: "", is_correct: false },
        { label: "D", text: "", is_correct: false },
      ])
    }
    setManagingOptions(question)
  }

  const handleSaveOptions = async () => {
    if (!managingOptions) return
    try {
      setCreating(true)
      
      // Delete existing options first if any
      if (managingOptions.options && managingOptions.options.length > 0) {
        for (const option of managingOptions.options) {
          try {
            await adminApi.deleteQuestionOption(managingOptions.question.id, option.id)
          } catch (e) {
            // Ignore errors when deleting - continue with other options
          }
        }
      }
      
      // Create new options
      for (const option of optionsForm) {
        if (option.text.trim()) {
          await adminApi.createQuestionOption(managingOptions.question.id, {
            option_label: option.label,
            option_text: option.text,
            is_correct: option.is_correct,
            display_order: option.label.charCodeAt(0) - 64,
          })
        }
      }
      
      toast({
        title: "Success",
        description: "Options updated successfully",
      })
      setManagingOptions(null)
      onUpdate()
    } catch (error) {
      console.error("Failed to update options:", error)
      toast({
        title: "Error",
        description: "Failed to update options. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const openManageAnswers = (question: Question) => {
    if (question.answers && question.answers.length > 0) {
      setAnswersForm(question.answers.map(ans => {
        const alts = ans.alternative_answers ? JSON.parse(ans.alternative_answers) : []
        return {
          id: ans.id,
          answer_text: ans.answer_text,
          alternative_answers_raw: Array.isArray(alts) ? alts.join(", ") : "",
          is_case_sensitive: ans.is_case_sensitive,
        }
      }))
    } else {
      setAnswersForm([{
        answer_text: "",
        alternative_answers_raw: "",
        is_case_sensitive: false,
      }])
    }
    setManagingAnswers(question)
  }

  const handleSaveAnswers = async () => {
    if (!managingAnswers) return
    try {
      setCreating(true)
      
      // Delete existing answers first if any
      if (managingAnswers.answers && managingAnswers.answers.length > 0) {
        for (const answer of managingAnswers.answers) {
          try {
            await adminApi.deleteQuestionAnswer(managingAnswers.question.id, answer.id)
          } catch (e) {
            // Ignore errors when deleting - continue with other answers
          }
        }
      }
      
      // Create new answers
      for (const answer of answersForm) {
        if (answer.answer_text.trim()) {
          const alternatives = answer.alternative_answers_raw
            .split(",")
            .map(s => s.trim())
            .filter(s => s)
          await adminApi.createQuestionAnswer(managingAnswers.question.id, {
            answer_text: answer.answer_text,
            alternative_answers: alternatives,
            is_case_sensitive: answer.is_case_sensitive,
          })
        }
      }
      
      toast({
        title: "Success",
        description: "Answers updated successfully",
      })
      setManagingAnswers(null)
      onUpdate()
    } catch (error) {
      console.error("Failed to update answers:", error)
      toast({
        title: "Error",
        description: "Failed to update answers. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const confirmDeleteQuestion = async () => {
    if (!deletingQuestionId) return
    
    try {
      setCreating(true)
      await adminApi.deleteQuestion(deletingQuestionId)
      toast({
        title: "Success",
        description: "Question deleted successfully",
      })
      setDeletingQuestionId(null)
      onUpdate()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error?.message || 
                          error?.message || 
                          "Failed to delete question. Please try again."
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Feature Notice */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>✨ Full Feature Available:</strong> Create sections and questions, edit question text and options, 
          manage answer choices with checkboxes. Click edit buttons to customize your exercise content.
        </AlertDescription>
      </Alert>

      {/* Main Audio Info */}
      {exerciseData.exercise.audio_url && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Volume2 className="w-6 h-6 text-blue-600" />
              Main Exercise Audio
            </CardTitle>
            <CardDescription>This audio is for the entire exercise</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border-2 border-blue-200 bg-blue-50 dark:bg-blue-950/20 p-4">
              <audio
                controls
                src={exerciseData.exercise.audio_url}
                className="w-full mb-2"
                preload="metadata"
              >
                Your browser does not support the audio element.
              </audio>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Duration: {Math.floor((exerciseData.exercise.audio_duration_seconds || 0) / 60)}:
                  {String((exerciseData.exercise.audio_duration_seconds || 0) % 60).padStart(2, '0')}
                </span>
                <span className="text-xs">MP3, WAV, M4A, OGG</span>
              </div>
            </div>
            {exerciseData.exercise.audio_transcript && (
              <div className="border-t pt-3">
                <div className="font-medium text-sm mb-2 flex items-center gap-2">
                  <span>📝 Transcript:</span>
                </div>
                <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg max-h-40 overflow-y-auto whitespace-pre-wrap">
                  {exerciseData.exercise.audio_transcript}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sections */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Sections ({exerciseData.sections.length})</h3>
        </div>

        {exerciseData.sections.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Volume2 className="w-12 h-12 text-muted-foreground mb-4" />
              <h4 className="text-lg font-semibold mb-2">No sections yet</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first section to start adding questions
              </p>
            </CardContent>
          </Card>
        )}

        {exerciseData.sections.map((sectionData, index) => (
          <Card key={sectionData.section.id} className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <Badge className="text-base px-3 py-1 bg-blue-600">
                      Part {sectionData.section.section_number}
                    </Badge>
                    <CardTitle className="text-xl">{formatSectionTitle(sectionData.section.title, sectionData.section.section_number)}</CardTitle>
                  </div>
                  <CardDescription className="flex items-center gap-4 mt-2">
                    <span>📊 {sectionData.questions.length} question{sectionData.questions.length !== 1 ? 's' : ''}</span>
                    {sectionData.section.audio_url && <span>🎵 Has audio</span>}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled
                    title="Edit section (backend API coming soon)"
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-600 hover:text-red-700"
                    onClick={() => setDeletingSectionId(sectionData.section.id)}
                    title="Delete section"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Section Info */}
              {(sectionData.section.audio_url || sectionData.section.instructions) && (
                <div className="space-y-3">
                  {/* Section Audio */}
                  {sectionData.section.audio_url && (
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-3">
                        <Volume2 className="w-5 h-5 text-blue-600" />
                        <span className="font-medium">Section Audio</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="text-muted-foreground">
                          🕐 {sectionData.section.audio_start_time || 0}s → {sectionData.section.audio_end_time || 0}s
                        </div>
                        <Button size="sm" variant="ghost" asChild className="h-auto p-0 text-blue-600 hover:text-blue-700 font-medium">
                          <a href={sectionData.section.audio_url} target="_blank" rel="noopener noreferrer">
                            ▶ Open Audio File
                          </a>
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Instructions */}
                  {sectionData.section.instructions && (
                    <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                      <div className="flex items-start gap-2">
                        <span className="text-lg">💡</span>
                        <div>
                          <div className="font-medium mb-1">Instructions:</div>
                          <div className="text-sm">{sectionData.section.instructions}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Separator />

              {/* Questions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-base flex items-center gap-2">
                    ❓ Questions 
                    <Badge variant="secondary">{sectionData.questions.length}</Badge>
                  </h4>
                  <Button 
                    variant="default"
                    size="sm"
                    onClick={() => handleAddQuestion(sectionData.section.id)}
                    disabled={creating}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {creating ? "Creating..." : "Add Question"}
                  </Button>
                </div>

                {sectionData.questions.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg bg-muted/30">
                    <p className="text-muted-foreground">No questions yet. Click "Add Question" to create one.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sectionData.questions.map((questionData) => (
                      <Card key={questionData.question.id} className="border hover:border-primary/50 transition-colors">
                        <CardContent className="p-4">
                          {/* Question Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="default" className="font-mono text-sm">
                                  Q{questionData.question.question_number}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {questionData.question.question_type.replace(/_/g, ' ')}
                                </Badge>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    questionData.question.difficulty === 'easy' ? 'bg-green-100 text-green-800 border-green-300' :
                                    questionData.question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                                    'bg-red-100 text-red-800 border-red-300'
                                  }`}
                                >
                                  {questionData.question.difficulty}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {questionData.question.points} {questionData.question.points === 1 ? 'point' : 'points'}
                                </Badge>
                              </div>
                              <p className="text-sm font-medium leading-relaxed">
                                {formatQuestionText(questionData.question.question_text, questionData.question.question_number)}
                              </p>
                            </div>
                            <div className="flex gap-1 ml-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => openEditQuestion(questionData)}
                                title="Edit question"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-600 hover:text-red-700"
                                onClick={() => setDeletingQuestionId(questionData.question.id)}
                                title="Delete question"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Multiple Choice Options */}
                          {questionData.question.question_type === 'multiple_choice' && (
                            <div className="space-y-2 pl-4 border-l-2 border-muted">
                              {questionData.options && questionData.options.length > 0 ? (
                                <>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-muted-foreground">Answer Options:</span>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => openManageOptions(questionData)}
                                    >
                                      <Edit className="w-3 h-3 mr-1" />
                                      Edit Options
                                    </Button>
                                  </div>
                                  {questionData.options.map((option) => (
                                    <div 
                                      key={option.id} 
                                      className={`flex items-start gap-3 p-2 rounded ${
                                        option.is_correct ? 'bg-green-50 dark:bg-green-950/20 border border-green-200' : 'bg-muted/30'
                                      }`}
                                    >
                                      <Badge 
                                        variant={option.is_correct ? "default" : "outline"} 
                                        className={`mt-0.5 ${option.is_correct ? 'bg-green-600' : ''}`}
                                      >
                                        {option.option_label}
                                      </Badge>
                                      <span className={`text-sm flex-1 ${option.is_correct ? 'font-medium' : ''}`}>
                                        {option.option_text}
                                      </span>
                                      {option.is_correct && <span className="text-green-600 font-bold">✓</span>}
                                    </div>
                                  ))}
                                </>
                              ) : (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => openManageOptions(questionData)}
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Add Options
                                </Button>
                              )}
                            </div>
                          )}

                          {/* Fill-in-the-blank / Short Answer Answers */}
                          {(questionData.question.question_type === 'fill_in_blank' || 
                            questionData.question.question_type === 'short_answer') && (
                            <div className="space-y-2 pl-4 border-l-2 border-muted">
                              {questionData.answers && questionData.answers.length > 0 ? (
                                <>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-muted-foreground">Correct Answers:</span>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => openManageAnswers(questionData)}
                                    >
                                      <Edit className="w-3 h-3 mr-1" />
                                      Edit Answers
                                    </Button>
                                  </div>
                                  {questionData.answers.map((answer) => {
                                    const alternatives = answer.alternative_answers 
                                      ? JSON.parse(answer.alternative_answers) 
                                      : []
                                    return (
                                      <div 
                                        key={answer.id} 
                                        className="flex flex-col gap-2 p-3 rounded bg-green-50 dark:bg-green-950/20 border border-green-200"
                                      >
                                        <div className="flex items-center gap-2">
                                          <Badge variant="default" className="bg-green-600">Main Answer</Badge>
                                          <span className="text-sm font-medium">{answer.answer_text}</span>
                                          {answer.is_case_sensitive && (
                                            <Badge variant="outline" className="text-xs">Case Sensitive</Badge>
                                          )}
                                        </div>
                                        {alternatives.length > 0 && (
                                          <div className="text-xs text-muted-foreground pl-2 border-l-2 border-green-300">
                                            <span className="font-medium">Also accepts: </span>
                                            {alternatives.join(", ")}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </>
                              ) : (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => openManageAnswers(questionData)}
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Add Answers
                                </Button>
                              )}
                            </div>
                          )}

                          {/* Explanation & Tips */}
                          {(questionData.question.explanation || questionData.question.tips) && (
                            <div className="mt-4 pt-3 border-t space-y-2">
                              {questionData.question.explanation && (
                                <div className="text-xs bg-blue-50 dark:bg-blue-950/20 p-2 rounded">
                                  <span className="font-semibold text-blue-900 dark:text-blue-300">💡 Explanation: </span>
                                  <span className="text-blue-800 dark:text-blue-200">{questionData.question.explanation}</span>
                                </div>
                              )}
                              {questionData.question.tips && (
                                <div className="text-xs bg-purple-50 dark:bg-purple-950/20 p-2 rounded">
                                  <span className="font-semibold text-purple-900 dark:text-purple-300">💭 Tips: </span>
                                  <span className="text-purple-800 dark:text-purple-200">{questionData.question.tips}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Section Button */}
      <Button 
        variant="outline"
        size="lg"
        className="w-full h-14 border-2 border-dashed hover:border-solid hover:bg-primary/5"
        onClick={handleAddSection}
        disabled={creating}
      >
        <Plus className="w-5 h-5 mr-2" />
        {creating ? "Creating Section..." : "Add New Section"}
      </Button>

      {/* Edit Question Dialog */}
      <Dialog open={!!editingQuestion} onOpenChange={(open) => !open && setEditingQuestion(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
            <DialogDescription>Update question details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="question-text">Question Text *</Label>
              <Textarea
                id="question-text"
                value={questionForm.question_text}
                onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                placeholder="Enter the question"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="question-type">Type</Label>
                <Select
                  value={questionForm.question_type}
                  onValueChange={(value) => setQuestionForm({ ...questionForm, question_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                    <SelectItem value="fill_in_blank">Fill in Blank</SelectItem>
                    <SelectItem value="sentence_completion">Sentence Completion</SelectItem>
                    <SelectItem value="matching">Matching</SelectItem>
                    <SelectItem value="diagram_labeling">Diagram Labeling</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="question-difficulty">Difficulty</Label>
                <Select
                  value={questionForm.difficulty}
                  onValueChange={(value) => setQuestionForm({ ...questionForm, difficulty: value })}
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
                <Label htmlFor="question-points">Points</Label>
                <Input
                  id="question-points"
                  type="number"
                  step="0.5"
                  min="0"
                  value={questionForm.points}
                  onChange={(e) => setQuestionForm({ ...questionForm, points: parseFloat(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="question-explanation">Explanation</Label>
              <Textarea
                id="question-explanation"
                value={questionForm.explanation}
                onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                placeholder="Explain the correct answer"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="question-tips">Tips</Label>
              <Textarea
                id="question-tips"
                value={questionForm.tips}
                onChange={(e) => setQuestionForm({ ...questionForm, tips: e.target.value })}
                placeholder="Tips for students"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingQuestion(null)}>Cancel</Button>
            <Button onClick={handleUpdateQuestion} disabled={creating}>
              {creating ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Options Dialog */}
      <Dialog open={!!managingOptions} onOpenChange={(open) => !open && setManagingOptions(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Answer Options</DialogTitle>
            <DialogDescription>
              Add or edit multiple choice options. Check the box to mark as correct answer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {optionsForm.map((option, index) => (
              <div key={option.label} className={`flex items-start gap-3 p-4 border-2 rounded-lg ${option.is_correct ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-border'}`}>
                <Badge className="mt-2 text-base px-2 py-1">{option.label}</Badge>
                <div className="flex-1 space-y-3">
                  <Input
                    value={option.text}
                    onChange={(e) => {
                      const newOptions = [...optionsForm]
                      newOptions[index].text = e.target.value
                      setOptionsForm(newOptions)
                    }}
                    placeholder={`Option ${option.label} text`}
                    className="text-base"
                  />
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`correct-${option.label}`}
                      checked={option.is_correct}
                      onCheckedChange={(checked) => {
                        const newOptions = [...optionsForm]
                        // Uncheck all others if this is checked
                        if (checked) {
                          newOptions.forEach((opt, i) => {
                            opt.is_correct = i === index
                          })
                        } else {
                          newOptions[index].is_correct = false
                        }
                        setOptionsForm(newOptions)
                      }}
                    />
                    <label htmlFor={`correct-${option.label}`} className="text-sm font-medium cursor-pointer">
                      ✓ This is the correct answer
                    </label>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newOptions = optionsForm.filter((_, i) => i !== index)
                    setOptionsForm(newOptions)
                  }}
                  disabled={optionsForm.length <= 2}
                  className="text-red-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {optionsForm.length < 6 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const nextLabel = String.fromCharCode(65 + optionsForm.length)
                  setOptionsForm([...optionsForm, { label: nextLabel, text: "", is_correct: false }])
                }}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Option {String.fromCharCode(65 + optionsForm.length)}
              </Button>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManagingOptions(null)}>Cancel</Button>
            <Button onClick={handleSaveOptions} disabled={creating || !optionsForm.some(o => o.is_correct)}>
              {creating ? "Saving..." : "Save Options"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Answers Dialog */}
      <Dialog open={!!managingAnswers} onOpenChange={(open) => !open && setManagingAnswers(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Correct Answers</DialogTitle>
            <DialogDescription>
              Define correct answers for fill-in-the-blank or short answer questions. You can add alternative acceptable answers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {answersForm.map((answer, index) => (
              <div key={index} className="p-4 border-2 border-green-500 bg-green-50 dark:bg-green-950/20 rounded-lg space-y-3">
                <div className="space-y-2">
                  <Label>Main Answer {answersForm.length > 1 ? `#${index + 1}` : ""}</Label>
                  <Input
                    value={answer.answer_text}
                    onChange={(e) => {
                      const newAnswers = [...answersForm]
                      newAnswers[index].answer_text = e.target.value
                      setAnswersForm(newAnswers)
                    }}
                    placeholder="Enter the correct answer"
                    className="text-base font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Alternative Answers (comma-separated)</Label>
                  <Input
                    value={answer.alternative_answers_raw}
                    onChange={(e) => {
                      const newAnswers = [...answersForm]
                      newAnswers[index].alternative_answers_raw = e.target.value
                      setAnswersForm(newAnswers)
                    }}
                    placeholder="e.g., Monday, mon, Mon"
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Alternative spellings or phrasings that should also be marked correct
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`case-sensitive-${index}`}
                    checked={answer.is_case_sensitive}
                    onCheckedChange={(checked) => {
                      const newAnswers = [...answersForm]
                      newAnswers[index].is_case_sensitive = !!checked
                      setAnswersForm(newAnswers)
                    }}
                  />
                  <label htmlFor={`case-sensitive-${index}`} className="text-sm cursor-pointer">
                    Case sensitive (e.g., "Monday" ≠ "monday")
                  </label>
                </div>
                {answersForm.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newAnswers = answersForm.filter((_, i) => i !== index)
                      setAnswersForm(newAnswers)
                    }}
                    className="text-red-600"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove Answer #{index + 1}
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setAnswersForm([...answersForm, { answer_text: "", alternative_answers_raw: "", is_case_sensitive: false }])
              }}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Acceptable Answer
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManagingAnswers(null)}>Cancel</Button>
            <Button 
              onClick={handleSaveAnswers} 
              disabled={creating || !answersForm.some(a => a.answer_text.trim())}
            >
              {creating ? "Saving..." : "Save Answers"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingQuestionId} onOpenChange={(open) => !open && setDeletingQuestionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the question and all its options/answers.
              Questions below will be automatically renumbered.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={creating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteQuestion}
              disabled={creating}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {creating ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Section Confirmation Dialog */}
      <AlertDialog open={!!deletingSectionId} onOpenChange={(open) => !open && setDeletingSectionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Section?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the section and all questions, options, and answers within it.
              Sections below will be automatically renumbered.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={creating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSection}
              disabled={creating}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {creating ? "Deleting..." : "Delete Section"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
