"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { PageContainer } from "@/components/layout/page-container"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, XCircle, Clock, Target, TrendingUp, Home, RotateCcw, AlertCircle, FileText, Mic, Loader2, Sparkles, Brain, MessageSquare, Award, Upload } from "lucide-react"
import { PageLoading } from "@/components/ui/page-loading"
import { EmptyState } from "@/components/ui/empty-state"
import { exercisesApi } from "@/lib/api/exercises"
import type { SubmissionResult } from "@/types"
import { usePreferences } from "@/lib/contexts/preferences-context"
import { useTranslations } from '@/lib/i18n'
import { useI18nStore } from '@/lib/i18n/client'

export default function ExerciseResultPage() {
  // Call ALL hooks at top level (before any conditional returns)
  const t = useTranslations('exercises')
  const tAI = useTranslations("ai")
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { preferences } = usePreferences()
  const showExplanations = preferences?.show_answer_explanation ?? true // Default to true for backward compatibility
  const exerciseId = params.exerciseId as string
  const submissionId = params.submissionId as string
  const [result, setResult] = useState<SubmissionResult | null>(null)
  const [loading, setLoading] = useState(true)
  const { locale } = useI18nStore()
  // Use user's locale setting (not a toggle button)
  const feedbackLang = locale === 'vi' ? 'vi' : 'en'

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const data = await exercisesApi.getSubmissionResult(submissionId)
        setResult(data)
      } catch (error: any) {
        console.error("Failed to fetch result:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchResult()
  }, [submissionId])

  if (loading) {
    return (
      <AppLayout>
        <PageContainer>
          <PageLoading translationKey="loading" />
        </PageContainer>
      </AppLayout>
    )
  }

  if (!result) {
    return (
      <AppLayout>
        <PageContainer>
          <EmptyState
            icon={Target}
            title={t('results_not_found')}
            description={t('results_not_found_description') || "Không tìm thấy kết quả bài tập"}
            actionLabel={t('back_to_exercises') || "Quay lại bài tập"}
            actionOnClick={() => router.push("/exercises/list")}
          />
        </PageContainer>
      </AppLayout>
    )
  }

  const { submission, exercise, answers, performance } = result
  
  // Determine skill type - use both exercise.skill_type and submission data
  const skillType = exercise?.skill_type?.toLowerCase() || submission?.task_type || ""
  const isWritingExercise = skillType === "writing" || submission?.task_type === "task1" || submission?.task_type === "task2"
  const isSpeakingExercise = skillType === "speaking" || submission?.speaking_part_number !== undefined
  const isAIExercise = isWritingExercise || isSpeakingExercise
  
  // Debug logging
  console.log("[Result Page] Exercise data:", {
    exerciseId,
    skillType,
    isWritingExercise,
    isSpeakingExercise,
    isAIExercise,
    evaluationStatus: submission?.evaluation_status,
    status: submission?.status,
    bandScore: submission?.band_score,
    hasAudio: !!submission?.audio_url,
    audioUrl: submission?.audio_url,
    hasEssay: !!submission?.essay_text,
    hasTranscript: !!submission?.transcript_text,
    transcriptPreview: submission?.transcript_text?.substring(0, 100),
  })

  // Parse detailed_scores if it's a string (only for AI exercises - Writing/Speaking)
  let detailedScores: Record<string, any> = {}
  if (submission.detailed_scores) {
    try {
      detailedScores = typeof submission.detailed_scores === 'string' 
        ? JSON.parse(submission.detailed_scores) 
        : submission.detailed_scores
      console.log("[Result Page] Parsed detailed_scores:", detailedScores)
    } catch (e) {
      console.error("Failed to parse detailed_scores:", e, "Raw value:", submission.detailed_scores)
    }
  }
  // Note: detailed_scores is only available for AI exercises (Writing/Speaking)

  // Helper function to get step info based on evaluation status
  const getEvaluationStepInfo = (status: string, type: "writing" | "speaking") => {
    if (type === "writing") {
      if (status === "pending" || status === "processing") {
        return { 
          step: 0, 
          icon: FileText, 
          label: tAI("step_submitting") || "Đang xử lý bài viết...", 
          description: tAI("step_submitting_desc") || "Đang kiểm tra và phân tích nội dung bài viết của bạn" 
        }
      } else if (status === "evaluating") {
        return { 
          step: 1, 
          icon: Brain, 
          label: tAI("step_analyzing") || "Đang phân tích...", 
          description: tAI("step_analyzing_desc_writing") || "Đánh giá cấu trúc, ngữ pháp và từ vựng" 
        }
      } else {
        return { 
          step: 2, 
          icon: Award, 
          label: tAI("step_evaluating") || "Đang chấm điểm...", 
          description: tAI("step_evaluating_desc_writing") || "Đánh giá theo các tiêu chí IELTS chấm điểm" 
        }
      }
    } else {
      if (status === "pending" || status === "processing") {
        return { 
          step: 0, 
          icon: Upload, 
          label: tAI("step_uploading") || "Đang tải file âm thanh...", 
          description: tAI("step_uploading_desc") || "Đang xử lý và tải lên file ghi âm của bạn" 
        }
      } else if (status === "transcribing") {
        return { 
          step: 1, 
          icon: MessageSquare, 
          label: tAI("step_transcribing") || "Đang chuyển đổi giọng nói...", 
          description: tAI("step_transcribing_desc") || "Đang chuyển đổi giọng nói thành văn bản để phân tích" 
        }
      } else if (status === "evaluating") {
        return { 
          step: 2, 
          icon: Brain, 
          label: tAI("step_analyzing") || "Đang phân tích...", 
          description: tAI("step_analyzing_desc_speaking") || "Đánh giá phát âm, ngữ pháp và từ vựng" 
        }
      } else {
        return { 
          step: 3, 
          icon: Award, 
          label: tAI("step_evaluating") || "Đang chấm điểm...", 
          description: tAI("step_evaluating_desc_speaking") || "Đánh giá theo các tiêu chí IELTS Speaking" 
        }
      }
    }
  }

  // Render AI Evaluation Results for Writing/Speaking
  // Always show Speaking/Writing specific UI, regardless of evaluation status
  if (isAIExercise) {
    const evaluationStatus = submission.evaluation_status || submission.status
    // Check if evaluation is completed - more lenient check
    const hasBandScore = submission.band_score !== undefined && submission.band_score !== null
    const isEvaluationCompleted = evaluationStatus === "completed" && hasBandScore
    const isEvaluationPending = evaluationStatus === "pending" || evaluationStatus === "processing" || evaluationStatus === "transcribing" || evaluationStatus === "evaluating"
    const isEvaluationFailed = evaluationStatus === "failed"
    
    // Get step info for pending evaluation
    const stepInfo = isEvaluationPending ? getEvaluationStepInfo(evaluationStatus, isWritingExercise ? "writing" : "speaking") : null
    const StepIcon = stepInfo?.icon || FileText
    const currentStep = stepInfo?.step || 0
    const totalSteps = 4
    const progressPercentage = isEvaluationPending ? Math.min(90, Math.max(10, ((currentStep + 1) / totalSteps) * 100)) : 0
    
    // Render evaluation results (completed, pending, or failed)
    // Always show submission content (audio/essay) even if evaluation is not complete
    return (
      <AppLayout>
        <PageContainer maxWidth="4xl">
          {/* Evaluation Header */}
          {isEvaluationPending ? (
            // Beautiful Pending Evaluation Card
            <Card className="mb-8 relative overflow-hidden border-0 shadow-2xl backdrop-blur-xl bg-background/80 dark:bg-background/90">
              {/* Gradient Border Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 opacity-50" />
              
              <CardContent className="relative p-8 md:p-10">
                <div className="flex flex-col items-center justify-center space-y-6">
                  {/* Animated Loading Icon */}
                  <div className="relative">
                    {/* Outer Glow Rings */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-32 h-32 rounded-full bg-primary/20 blur-2xl animate-pulse" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full bg-primary/10 blur-xl animate-ping" style={{ animationDuration: '2s' }} />
                    </div>
                    
                    {/* Main Icon Container */}
                    <div className="relative flex items-center justify-center w-24 h-24">
                      {/* Spinning Ring */}
                      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary border-r-primary/50 animate-spin" style={{ animationDuration: '2s' }} />
                      
                      {/* Center Icon */}
                      <div className="relative z-10 flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur-sm">
                        {isWritingExercise ? (
                          <FileText className="w-8 h-8 text-primary animate-pulse" strokeWidth={2} />
                        ) : (
                          <Mic className="w-8 h-8 text-primary animate-pulse" strokeWidth={2} />
                        )}
                      </div>
                      
                      {/* Sparkles Effect */}
                      <div className="absolute -top-1 -right-1">
                        <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                      </div>
                      <div className="absolute -bottom-1 -left-1">
                        <Sparkles className="w-4 h-4 text-primary/70 animate-pulse" style={{ animationDelay: '0.5s' }} />
                      </div>
                    </div>
                  </div>

                  {/* Title Section */}
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                      {isWritingExercise 
                        ? (tAI("evaluating_writing") || "Đang chấm điểm bài viết")
                        : (tAI("evaluating_speaking") || "Đang chấm điểm bài nói")
                      }
                    </h2>
                    <p className="text-muted-foreground text-sm md:text-base">
                      {tAI("please_wait_processing") || "Vui lòng đợi trong khi hệ thống đang xử lý..."}
                    </p>
                  </div>

                  {/* Current Step Indicator */}
                  {stepInfo && (
                    <div className="w-full max-w-md space-y-3">
                      <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10">
                        <StepIcon className="w-5 h-5 text-primary animate-pulse flex-shrink-0" />
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-sm text-foreground">
                            {stepInfo.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {stepInfo.description}
                          </p>
                        </div>
                      </div>

                      {/* Enhanced Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>{tAI("progress") || "Tiến độ"}</span>
                          <span className="font-semibold text-primary">{Math.round(progressPercentage)}%</span>
                        </div>
                        <div className="relative h-2.5 w-full bg-muted/50 rounded-full overflow-hidden shadow-inner">
                          {/* Progress Fill */}
                          <div 
                            className="relative h-full bg-gradient-to-r from-primary via-primary/90 to-primary rounded-full transition-all duration-700 ease-out shadow-lg overflow-hidden"
                            style={{ 
                              width: `${progressPercentage}%`,
                            }}
                          >
                            {/* Shimmer Effect */}
                            <div 
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
                              style={{
                                backgroundSize: '200% 100%',
                              }}
                            />
                            {/* Glow Effect on Progress */}
                            <div className="absolute inset-0 bg-white/20 rounded-full blur-sm" />
                          </div>
                        </div>
                      </div>

                      {/* Step Indicators */}
                      <div className="flex justify-center gap-2">
                        {[...Array(totalSteps)].map((_, index) => (
                          <div
                            key={index}
                            className={`h-2 rounded-full transition-all duration-300 ${
                              index <= currentStep
                                ? 'w-8 bg-primary shadow-lg shadow-primary/50'
                                : 'w-2 bg-muted'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Info Message */}
                  <div className="text-center max-w-md">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10">
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      <p className="text-xs text-muted-foreground">
                        {tAI("evaluation_takes_time") || "Quá trình chấm điểm có thể mất 30-60 giây. Vui lòng không đóng trang này."}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Completed or Failed Evaluation Card
            <Card className="mb-8">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  {isEvaluationCompleted ? (
                    <CheckCircle2 className="w-16 h-16 text-green-500" />
                  ) : isEvaluationFailed ? (
                    <XCircle className="w-16 h-16 text-red-500" />
                  ) : (
                    <AlertCircle className="w-16 h-16 text-yellow-500" />
                  )}
                </div>
                <CardTitle className="text-3xl mb-2">
                  {isEvaluationCompleted 
                    ? (tAI("evaluation_complete") || "Evaluation Complete")
                    : isEvaluationFailed
                    ? (tAI("evaluation_failed") || "Evaluation Failed")
                    : (tAI("processing") || "Evaluation in Progress")}
                </CardTitle>
                <p className="text-muted-foreground">
                  {isEvaluationCompleted 
                    ? (isWritingExercise 
                      ? (tAI("your_writing_has_been_evaluated") || "Your writing has been evaluated")
                      : (tAI("your_speaking_has_been_evaluated") || "Your speaking has been evaluated"))
                    : isEvaluationFailed
                    ? (tAI("evaluation_failed_description") || "Đánh giá không thành công. Vui lòng thử lại sau.")
                    : (tAI("please_wait_for_evaluation") || "Please wait while we evaluate your submission...")}
                </p>
              </CardHeader>
              <CardContent>
                {/* Overall Band Score - Only show if evaluation is completed */}
                {isEvaluationCompleted && hasBandScore && (
                  <div className="text-center mb-6">
                    <p className="text-sm text-muted-foreground mb-2">
                      {tAI("overall_band_score") || "Overall Band Score"}
                    </p>
                    <div className="text-6xl font-bold text-primary mb-4">
                      {submission.band_score?.toFixed(1) || "N/A"}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Criteria Scores - Always show for Speaking/Writing if evaluation is completed */}
          {isEvaluationCompleted && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {isWritingExercise ? (
                <>
                  {/* Task Achievement */}
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">{tAI("task_achievement") || "Task Achievement"}</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {(() => {
                        const score = detailedScores.task_achievement ?? detailedScores.task_response ?? 0
                        return typeof score === 'number' ? score.toFixed(1) : String(score || '0.0')
                      })()}
                    </p>
                  </div>
                  {/* Coherence & Cohesion */}
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">{tAI("coherence_cohesion") || "Coherence & Cohesion"}</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {(() => {
                        const score = detailedScores.coherence_cohesion ?? 0
                        return typeof score === 'number' ? score.toFixed(1) : String(score || '0.0')
                      })()}
                    </p>
                  </div>
                  {/* Lexical Resource */}
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">{tAI("lexical_resource") || "Lexical Resource"}</p>
                    <p className="text-2xl font-bold text-green-600">
                      {(() => {
                        const score = detailedScores.lexical_resource ?? 0
                        return typeof score === 'number' ? score.toFixed(1) : String(score || '0.0')
                      })()}
                    </p>
                  </div>
                  {/* Grammatical Range */}
                  <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">{tAI("grammatical_range") || "Grammatical Range"}</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {(() => {
                        const score = detailedScores.grammar_accuracy ?? detailedScores.grammatical_range ?? detailedScores.grammar ?? 0
                        return typeof score === 'number' ? score.toFixed(1) : String(score || '0.0')
                      })()}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* Fluency & Coherence - Always show for Speaking */}
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">{tAI("fluency_coherence") || "Fluency & Coherence"}</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {(() => {
                        const score = detailedScores.fluency ?? detailedScores.fluency_coherence ?? 0
                        return typeof score === 'number' ? score.toFixed(1) : String(score || '0.0')
                      })()}
                    </p>
                  </div>
                  {/* Lexical Resource - Always show for Speaking */}
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">{tAI("lexical_resource") || "Lexical Resource"}</p>
                    <p className="text-2xl font-bold text-green-600">
                      {(() => {
                        const score = detailedScores.lexical_resource ?? 0
                        return typeof score === 'number' ? score.toFixed(1) : String(score || '0.0')
                      })()}
                    </p>
                  </div>
                  {/* Grammatical Range - Always show for Speaking */}
                  <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">{tAI("grammatical_range") || "Grammatical Range"}</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {(() => {
                        const score = detailedScores.grammar ?? detailedScores.grammatical_range ?? 0
                        return typeof score === 'number' ? score.toFixed(1) : String(score || '0.0')
                      })()}
                    </p>
                  </div>
                  {/* Pronunciation - Always show for Speaking */}
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">{tAI("pronunciation") || "Pronunciation"}</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {(() => {
                        const score = detailedScores.pronunciation ?? 0
                        return typeof score === 'number' ? score.toFixed(1) : String(score || '0.0')
                      })()}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Submission Content - Always show for Writing/Speaking */}
          {isWritingExercise && submission.essay_text && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>{tAI("your_essay") || "Your Essay"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{submission.essay_text}</p>
                </div>
                {submission.word_count && (
                  <p className="text-sm text-muted-foreground mt-4">
                    {t('word_count')?.replace('{count}', submission.word_count.toString()) || `Word count: ${submission.word_count}`}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {isSpeakingExercise && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="w-5 h-5" />
                  {tAI("your_recording") || "Your Recording"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                  {submission.audio_url ? (
                    <>
                      <audio src={submission.audio_url} controls className="w-full mb-4" />
                      {submission.audio_duration_seconds && (
                        <p className="text-sm text-muted-foreground mb-4">
                          {tAI("duration") || "Duration"}: {Math.floor(submission.audio_duration_seconds / 60)}:{(submission.audio_duration_seconds % 60).toString().padStart(2, '0')}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-muted-foreground">{tAI("audio_not_available") || "Audio recording not available"}</p>
                  )}
                  {submission.transcript_text && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">{tAI("transcript") || "Transcript"}</h4>
                      <div className="prose prose-sm max-w-none">
                        <p className="whitespace-pre-wrap">{submission.transcript_text}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

          {/* AI Feedback - Only show if evaluation is completed */}
          {isEvaluationCompleted && submission.ai_feedback && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>{tAI("detailed_feedback") || "Detailed Feedback"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{submission.ai_feedback}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Strengths and Weaknesses - Only show if evaluation is completed */}
          {isEvaluationCompleted && detailedScores.strengths && Array.isArray(detailedScores.strengths) && detailedScores.strengths.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  {tAI("strengths") || "Strengths"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2">
                  {detailedScores.strengths.map((strength: string, idx: number) => (
                    <li key={idx}>{strength}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {isEvaluationCompleted && (detailedScores.weaknesses || detailedScores.areas_for_improvement) && 
           ((Array.isArray(detailedScores.weaknesses) && detailedScores.weaknesses.length > 0) ||
            (Array.isArray(detailedScores.areas_for_improvement) && detailedScores.areas_for_improvement.length > 0)) && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  {tAI("areas_for_improvement") || "Areas for Improvement"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2">
                  {(detailedScores.weaknesses || detailedScores.areas_for_improvement || []).map((area: string, idx: number) => (
                    <li key={idx}>{area}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" onClick={() => router.push("/exercises/list")}>
              <Home className="w-4 h-4 mr-2" />
              {t('back_to_exercises')}
            </Button>
            <Button onClick={() => router.push(`/exercises/${exerciseId}`)}>
              <RotateCcw className="w-4 h-4 mr-2" />
              {t('try_again')}
            </Button>
          </div>
        </PageContainer>
      </AppLayout>
    )
  }

  // Render Listening/Reading exercise results (non-AI exercises)

  // Render standard result page for Listening/Reading exercises
  const passed = performance.score >= (exercise.passing_score || 0)
  
  return (
    <AppLayout>
      <PageContainer>
        {/* Result Header */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {passed ? (
                <CheckCircle2 className="w-16 h-16 text-green-500" />
              ) : (
                <XCircle className="w-16 h-16 text-red-500" />
              )}
            </div>
            <CardTitle className="text-3xl mb-2">
              {passed ? t('congratulations') : t('better_luck_next_time')}
            </CardTitle>
            {/* Different messages for different skill types */}
            {exercise.skill_type?.toLowerCase() === 'writing' ? (
              <p className="text-muted-foreground">
                {submission.word_count ? `${submission.word_count} ${t('words_written')}` : t('essay_submitted')}
              </p>
            ) : exercise.skill_type?.toLowerCase() === 'speaking' ? (
              <p className="text-muted-foreground">
                {submission.audio_duration_seconds 
                  ? `${t('speaking_duration')}: ${Math.floor(submission.audio_duration_seconds / 60)}:${String(submission.audio_duration_seconds % 60).padStart(2, '0')}`
                  : t('audio_submitted')}
              </p>
            ) : (
              <p className="text-muted-foreground">
                {t('you_scored')} {performance.correct_answers}/{performance.total_questions} {t('questions_correct')}
              </p>
            )}
            <p className="text-2xl font-semibold text-primary mt-2">
              {performance.score.toFixed(1)}%
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center mb-4">
              <Progress value={performance.score} className="w-full max-w-md" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {/* Show different stats for Writing/Speaking vs Reading/Listening */}
              {exercise.skill_type?.toLowerCase() === 'writing' ? (
                <>
                  <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">{t('word_count')}</p>
                    <p className="text-2xl font-bold text-orange-600">{submission.word_count || 0}</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">{t('evaluation_status')}</p>
                    <p className="text-sm font-bold text-purple-600">{submission.evaluation_status || 'pending'}</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">{t('time_spent')}</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {(() => {
                        const totalSeconds = performance.time_spent_seconds ?? 0
                        const minutes = Math.floor(totalSeconds / 60)
                        const seconds = totalSeconds % 60
                        if (minutes > 0) {
                          return `${minutes}m ${seconds}s`
                        }
                        return `${seconds}s`
                      })()}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">{t('task_type')}</p>
                    <p className="text-lg font-bold text-green-600">{submission.task_type || exercise.writing_task_type || 'N/A'}</p>
                  </div>
                </>
              ) : exercise.skill_type?.toLowerCase() === 'speaking' ? (
                <>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">{t('speaking_duration')}</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {submission.audio_duration_seconds 
                        ? `${Math.floor(submission.audio_duration_seconds / 60)}:${String(submission.audio_duration_seconds % 60).padStart(2, '0')}`
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">{t('evaluation_status')}</p>
                    <p className="text-sm font-bold text-orange-600">{submission.evaluation_status || 'pending'}</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">{t('time_spent')}</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {(() => {
                        const totalSeconds = performance.time_spent_seconds ?? 0
                        const minutes = Math.floor(totalSeconds / 60)
                        const seconds = totalSeconds % 60
                        if (minutes > 0) {
                          return `${minutes}m ${seconds}s`
                        }
                        return `${seconds}s`
                      })()}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">{t('speaking_part')}</p>
                    <p className="text-2xl font-bold text-green-600">Part {submission.speaking_part_number || exercise.speaking_part_number || 'N/A'}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">{t('correct_answers')}</p>
                    <p className="text-2xl font-bold text-green-600">{performance.correct_answers ?? 0}</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">{t('incorrect_answers')}</p>
                    <p className="text-2xl font-bold text-red-600">{performance.incorrect_answers ?? 0}</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-950 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">{t('skipped_answers')}</p>
                    <p className="text-2xl font-bold text-gray-600">{performance.skipped_answers ?? 0}</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">{t('time_spent')}</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {(() => {
                        const totalSeconds = performance.time_spent_seconds ?? 0
                        const minutes = Math.floor(totalSeconds / 60)
                        const seconds = totalSeconds % 60
                        if (minutes > 0) {
                          return `${minutes}m ${seconds}s`
                        }
                        return `${seconds}s`
                      })()}
                    </p>
                  </div>
                </>
              )}
            </div>
            
            {/* Band Score Display for Listening/Reading exercises */}
            {performance.band_score && exercise.skill_type && 
             (exercise.skill_type.toLowerCase() === 'listening' || exercise.skill_type.toLowerCase() === 'reading') && (
              <div className="mt-6 flex justify-center">
                <div className="text-center p-6 bg-purple-50 dark:bg-purple-950 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                  <p className="text-sm text-muted-foreground mb-2">{t('ielts_band_score') || 'IELTS Band Score'}</p>
                  <p className="text-5xl font-bold text-purple-600 dark:text-purple-400">
                    {performance.band_score.toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {t('band_score_description') || 'Điểm theo thang IELTS chuẩn (0.0 - 9.0)'}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Answer Review */}
        {answers && answers.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{t('answer_review')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {answers.map((answerItem, idx) => {
                  const answer = answerItem.answer
                  const question = answerItem.question
                  const isCorrect = answer.is_correct ?? false
                  const userAnswer = answer.answer_text || null
                  const correctAnswer = answerItem.correct_answer
                  
                  // Format correct answer for display
                  let correctAnswerDisplay = ''
                  if (correctAnswer) {
                    if (typeof correctAnswer === 'string') {
                      correctAnswerDisplay = correctAnswer
                    } else if (correctAnswer && typeof correctAnswer === 'object' && 'option_text' in correctAnswer) {
                      correctAnswerDisplay = `Option ${correctAnswer.option_text || ''}`
                    }
                  }
                  
                  // Format user answer for display
                  // Backend now formats answer_text as "Option A: text" for multiple_choice
                  const userAnswerDisplay = userAnswer || t('no_answer')
                  
                  return (
                    <div key={idx} className={`p-4 rounded-lg border ${isCorrect ? 'bg-green-50 dark:bg-green-950 border-green-200' : 'bg-red-50 dark:bg-red-950 border-red-200'}`}>
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant={isCorrect ? "default" : "destructive"}>
                          {isCorrect ? t('correct') : t('incorrect')}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{t('question')} {question.question_number ?? idx + 1}</span>
                      </div>
                      <p className="font-semibold mb-2">{question.question_text || t('question')}</p>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">{t('your_answer')}:</span> {userAnswerDisplay}</p>
                        {!isCorrect && correctAnswerDisplay && (
                          <p><span className="font-medium text-green-600">{t('correct_answer')}:</span> {correctAnswerDisplay}</p>
                        )}
                        {showExplanations && question.explanation && (
                          <p className="mt-2 text-muted-foreground">{question.explanation}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="outline" onClick={() => router.push("/exercises/list")}>
            <Home className="w-4 h-4 mr-2" />
            {t('back_to_exercises')}
          </Button>
          <Button onClick={() => router.push(`/exercises/${exerciseId}`)}>
            <RotateCcw className="w-4 h-4 mr-2" />
            {t('try_again')}
          </Button>
        </div>
      </PageContainer>
    </AppLayout>
  )
}

