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
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Edit, Trash2, FileText, BookOpen } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { adminApi } from "@/lib/api/admin"

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
    passage_title?: string
    passage_content?: string
    passage_word_count?: number
    instructions?: string
    total_questions: number
  }
  questions: Question[]
}

interface ExerciseDetail {
  exercise: {
    id: string
    title: string
    ielts_test_type?: string
    [key: string]: any
  }
  sections: Section[]
}

interface ReadingExerciseEditProps {
  exerciseData: ExerciseDetail
  onUpdate: () => void
}

export default function ReadingExerciseEdit({ exerciseData, onUpdate }: ReadingExerciseEditProps) {
  const { toast } = useToast()
  const [creatingPassage, setCreatingPassage] = useState(false)
  const [showPassageDialog, setShowPassageDialog] = useState(false)
  const [deletingSectionId, setDeletingSectionId] = useState<string | null>(null)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [questionForm, setQuestionForm] = useState({
    question_text: "",
    question_type: "multiple_choice",
    points: 1,
    difficulty: "medium",
    explanation: "",
    tips: "",
  })
  const [passageForm, setPassageForm] = useState({
    title: "",
    content: "",
    instructions: "Read the passage and answer the questions below.",
  })

  const handleAddPassage = async () => {
    if (!passageForm.title.trim() || !passageForm.content.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in both passage title and content",
        variant: "destructive",
      })
      return
    }

    try {
      setCreatingPassage(true)
      const nextSectionNumber = exerciseData.sections.length + 1
      const wordCount = passageForm.content.trim().split(/\s+/).length

      await adminApi.createSection(exerciseData.exercise.id, {
        title: `Passage ${nextSectionNumber}`,
        description: `Reading passage ${nextSectionNumber}`,
        section_number: nextSectionNumber,
        passage_title: passageForm.title,
        passage_content: passageForm.content,
        passage_word_count: wordCount,
        instructions: passageForm.instructions,
        display_order: nextSectionNumber,
      })

      toast({
        title: "Success",
        description: `Passage ${nextSectionNumber} created successfully`,
      })

      setShowPassageDialog(false)
      setPassageForm({
        title: "",
        content: "",
        instructions: "Read the passage and answer the questions below.",
      })
      onUpdate()
    } catch (error) {
      console.error("Failed to create passage:", error)
      toast({
        title: "Error",
        description: "Failed to create passage. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCreatingPassage(false)
    }
  }

  const handleDeleteSection = async (sectionId: string) => {
    try {
      await adminApi.deleteSection(sectionId)
      toast({
        title: "Success",
        description: "Passage deleted successfully",
      })
      setDeletingSectionId(null)
      onUpdate()
    } catch (error) {
      console.error("Failed to delete section:", error)
      toast({
        title: "Error",
        description: "Failed to delete passage. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      await adminApi.deleteQuestion(questionId)
      toast({
        title: "Success",
        description: "Question deleted successfully",
      })
      setDeletingQuestionId(null)
      onUpdate()
    } catch (error) {
      console.error("Failed to delete question:", error)
      toast({
        title: "Error",
        description: "Failed to delete question. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddQuestion = async (sectionId: string) => {
    try {
      const section = exerciseData.sections.find(s => s.section.id === sectionId)
      const nextQuestionNumber = section ? section.questions.length + 1 : 1
      const totalQuestions = exerciseData.sections.reduce((sum, s) => sum + s.questions.length, 0)

      await adminApi.createQuestion({
        exercise_id: exerciseData.exercise.id,
        section_id: sectionId,
        question_number: totalQuestions + 1,
        question_text: `Question ${nextQuestionNumber}: Choose the correct answer.`,
        question_type: "multiple_choice",
        points: 1,
        difficulty: "medium",
        display_order: nextQuestionNumber,
      })

      toast({
        title: "Success",
        description: "Question created successfully",
      })

      onUpdate()
    } catch (error) {
      console.error("Failed to create question:", error)
      toast({
        title: "Error",
        description: "Failed to create question. Please try again.",
        variant: "destructive",
      })
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
      setCreatingPassage(true)
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
      setCreatingPassage(false)
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

    // Validation
    if (!optionsForm.some(o => o.is_correct)) {
      toast({
        title: "Validation Error",
        description: "Please mark at least one option as correct",
        variant: "destructive",
      })
      return
    }

    if (optionsForm.filter(o => o.text.trim()).length < 2) {
      toast({
        title: "Validation Error",
        description: "Please provide at least 2 options",
        variant: "destructive",
      })
      return
    }

    try {
      setCreatingPassage(true)

      // Delete existing options first if any
      if (managingOptions.options && managingOptions.options.length > 0) {
        for (const option of managingOptions.options) {
          try {
            await adminApi.deleteQuestionOption(managingOptions.question.id, option.id)
          } catch (e) {
            // Ignore errors when deleting - continue with other options
            console.error("Error deleting option:", e)
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
      setCreatingPassage(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* IELTS Test Type */}
      {exerciseData.exercise.ielts_test_type && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              <span className="font-medium">Test Type:</span>
              <Badge variant="outline" className="capitalize">
                {exerciseData.exercise.ielts_test_type.replace(/_/g, ' ')}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Passages & Questions */}
      {exerciseData.sections.map((sectionData) => (
        <Card key={sectionData.section.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Passage {sectionData.section.section_number}: {sectionData.section.passage_title || sectionData.section.title}
                </CardTitle>
                <CardDescription>
                  {sectionData.section.passage_word_count && `${sectionData.section.passage_word_count} words • `}
                  {sectionData.section.total_questions} questions
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // TODO: Implement edit passage functionality
                    toast({
                      title: "Coming Soon",
                      description: "Edit passage functionality will be available soon",
                    })
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600"
                  onClick={() => setDeletingSectionId(sectionData.section.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Passage Content */}
            {sectionData.section.passage_content && (
              <div>
                <div className="font-medium text-sm mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Reading Passage:
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg max-h-64 overflow-y-auto">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {sectionData.section.passage_content.split('\n').map((paragraph, idx) => (
                      paragraph.trim() && <p key={idx} className="mb-3">{paragraph}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {sectionData.section.instructions && (
              <div className="text-sm bg-blue-50 dark:bg-blue-950/20 p-3 rounded">
                <span className="font-medium">Instructions: </span>
                {sectionData.section.instructions}
              </div>
            )}

            <Separator />

            {/* Questions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Questions</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddQuestion(sectionData.section.id)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question
                </Button>
              </div>

              {sectionData.questions.map((questionData) => (
                <div key={questionData.question.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">
                          Q{questionData.question.question_number}
                        </Badge>
                        <Badge variant="outline">
                          {questionData.question.question_type.replace(/_/g, ' ')}
                        </Badge>
                        <Badge variant="outline">
                          {questionData.question.difficulty}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {questionData.question.points} pt
                        </span>
                      </div>
                      <p className="text-sm">{questionData.question.question_text}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditQuestion(questionData)}
                        title="Edit question text and details"
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
                    <div className="mt-3 space-y-2 pl-4 border-l-2 border-muted">
                      {questionData.options && questionData.options.length > 0 ? (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-muted-foreground">Options:</span>
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
                            <div key={option.id} className="flex items-center gap-2 text-sm">
                              <Badge variant={option.is_correct ? "default" : "outline"} className={option.is_correct ? "bg-green-600" : ""}>
                                {option.option_label}
                              </Badge>
                              <span className={option.is_correct ? "font-semibold text-green-600" : ""}>
                                {option.option_text}
                                {option.is_correct && " ✓"}
                              </span>
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

                  {questionData.options && questionData.options.length > 0 && questionData.question.question_type !== 'multiple_choice' && (
                    <div className="mt-3 space-y-1 pl-4">
                      {questionData.options.map((option) => (
                        <div key={option.id} className="flex items-center gap-2 text-sm">
                          <span className={option.is_correct ? "font-semibold text-green-600" : ""}>
                            {option.option_label}.
                          </span>
                          <span className={option.is_correct ? "text-green-600" : ""}>
                            {option.option_text}
                            {option.is_correct && " ✓"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {questionData.question.explanation && (
                    <div className="mt-3 p-2 bg-muted rounded text-sm">
                      <span className="font-semibold">Explanation: </span>
                      {questionData.question.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <Button
        variant="outline"
        className="w-full flex items-center justify-center gap-2 h-12"
        onClick={() => setShowPassageDialog(true)}
      >
        <Plus className="w-5 h-5" />
        Add New Reading Passage
      </Button>

      {/* Edit Question Dialog */}
      <Dialog open={!!editingQuestion} onOpenChange={(open) => !open && setEditingQuestion(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
            <DialogDescription>Update question text, points, and difficulty</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="question-text">Question Text *</Label>
              <Textarea
                id="question-text"
                value={questionForm.question_text}
                onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                placeholder="Enter the question text"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="points">Points *</Label>
                <Input
                  id="points"
                  type="number"
                  value={questionForm.points}
                  onChange={(e) => setQuestionForm({ ...questionForm, points: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <select
                  id="difficulty"
                  className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={questionForm.difficulty}
                  onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value })}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="explanation">Explanation</Label>
              <Textarea
                id="explanation"
                value={questionForm.explanation}
                onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                placeholder="Explain why the correct answer is correct..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tips">Tips</Label>
              <Textarea
                id="tips"
                value={questionForm.tips}
                onChange={(e) => setQuestionForm({ ...questionForm, tips: e.target.value })}
                placeholder="Helpful tips for this question type..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingQuestion(null)} disabled={creatingPassage}>
              Cancel
            </Button>
            <Button onClick={handleUpdateQuestion} disabled={creatingPassage}>
              {creatingPassage ? "Updating..." : "Update Question"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Passage Dialog */}
      <Dialog open={showPassageDialog} onOpenChange={setShowPassageDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Reading Passage</DialogTitle>
            <DialogDescription>
              Create a new reading passage for this exercise. Add questions after creating the passage.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="passage-title">Passage Title *</Label>
              <Input
                id="passage-title"
                placeholder="e.g., The History of Photography"
                value={passageForm.title}
                onChange={(e) => setPassageForm({ ...passageForm, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passage-content">Passage Content *</Label>
              <Textarea
                id="passage-content"
                placeholder="Paste or type the reading passage here..."
                value={passageForm.content}
                onChange={(e) => setPassageForm({ ...passageForm, content: e.target.value })}
                rows={15}
                className="font-serif"
              />
              <p className="text-xs text-muted-foreground">
                Word count: {passageForm.content.trim().split(/\s+/).filter(w => w).length}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                placeholder="Instructions for students..."
                value={passageForm.instructions}
                onChange={(e) => setPassageForm({ ...passageForm, instructions: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPassageDialog(false)
                setPassageForm({
                  title: "",
                  content: "",
                  instructions: "Read the passage and answer the questions below.",
                })
              }}
              disabled={creatingPassage}
            >
              Cancel
            </Button>
            <Button onClick={handleAddPassage} disabled={creatingPassage}>
              {creatingPassage ? "Creating..." : "Create Passage"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Section Confirmation */}
      <AlertDialog open={!!deletingSectionId} onOpenChange={() => setDeletingSectionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Passage?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this passage and all its questions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingSectionId && handleDeleteSection(deletingSectionId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Question Confirmation */}
      <AlertDialog open={!!deletingQuestionId} onOpenChange={() => setDeletingQuestionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this question and all its options/answers. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingQuestionId && handleDeleteQuestion(deletingQuestionId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Manage Options Dialog */}
      <Dialog open={!!managingOptions} onOpenChange={(open) => !open && setManagingOptions(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Answer Options</DialogTitle>
            <DialogDescription>
              Create or edit multiple choice options. Mark the correct answer with the checkbox.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
                        // Uncheck all others if this is checked (single correct answer)
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
                  title={optionsForm.length <= 2 ? "Minimum 2 options required" : "Remove option"}
                >
                  <Trash2 className="w-4 h-4" />
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
            <Button variant="outline" onClick={() => setManagingOptions(null)} disabled={creatingPassage}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveOptions}
              disabled={creatingPassage || !optionsForm.some(o => o.is_correct) || optionsForm.filter(o => o.text.trim()).length < 2}
            >
              {creatingPassage ? "Saving..." : "Save Options"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
