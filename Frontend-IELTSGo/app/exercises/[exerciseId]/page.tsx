"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { PageContainer } from "@/components/layout/page-container"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Clock, BookOpen, FileText, PlayCircle, Award, Target, CheckCircle, ChevronLeft, Loader2 } from "lucide-react"
import { PageLoading } from "@/components/ui/page-loading"
import { EmptyState } from "@/components/ui/empty-state"
import { useToastWithI18n } from "@/lib/hooks/use-toast-with-i18n"
import { exercisesApi } from "@/lib/api/exercises"
import type { ExerciseDetailResponse } from "@/types"
import { useAuth } from "@/lib/contexts/auth-context"
import { useTranslations } from "@/lib/i18n"
import { 
  WritingExerciseDetail, 
  SpeakingExerciseDetail, 
  ListeningExerciseDetail, 
  ReadingExerciseDetail 
} from "@/components/exercises/skill-specific"

export default function ExerciseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const toast = useToastWithI18n()
  const t = useTranslations('exercises')
  const tCommon = useTranslations('common')

  const exerciseId = params.exerciseId as string

  // Get lesson context from URL params (optional, fallback to API data)
  const lessonId = searchParams.get('lessonId')

  const [exerciseData, setExerciseData] = useState<ExerciseDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    const fetchExercise = async () => {
      try {
        setLoading(true)
        const data = await exercisesApi.getExerciseById(exerciseId)
        setExerciseData(data)
      } catch (error) {
        console.error('[Exercise Detail] Failed to load:', error)
      } finally {
        setLoading(false)
      }
    }

    if (exerciseId) {
      fetchExercise()
    }
  }, [exerciseId])

  const handleStartExercise = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    // Prevent admins from starting exercises
    if (user.role === 'admin') {
      toast.error(t('admin_cannot_start_exercise') || 'Admins cannot start exercises. Use a student or instructor account.')
      return
    }

    try {
      setStarting(true)

      const submission = await exercisesApi.startExercise(exerciseId)

      router.push(`/exercises/${exerciseId}/take/${submission.id}`)
    } catch (error: any) {
      console.error('[Exercise Detail] Failed to start:', error)

      // Better error messages
      if (error.response?.status === 401) {
        toast.error(t('session_expired_please_login_again'))
        router.push('/login')
      } else if (error.response?.status === 404) {
        toast.error(t('exercise_not_found'))
      } else {
        const errorMsg = error.response?.data?.error?.message || error.message || t('cannot_start_exercise_please_try_again')
        toast.error(errorMsg)
      }
    } finally {
      setStarting(false)
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <PageContainer>
          <PageLoading translationKey="loading" />
        </PageContainer>
      </AppLayout>
    )
  }

  if (!exerciseData) {
    return (
      <AppLayout>
        <PageContainer>
          <EmptyState
            icon={FileText}
            title={t('exercise_not_found')}
            description={t('exercise_not_found_description') || "This exercise may have been removed or does not exist"}
            action={{
              label: tCommon('go_back') || "Go Back",
              onClick: () => router.back()
            }}
          />
        </PageContainer>
      </AppLayout>
    )
  }

  const { exercise, sections } = exerciseData
  // Backend returns sections as array of {section, questions}
  const totalQuestions = sections?.reduce((sum, sectionData) => {
    return sum + (sectionData.section?.total_questions || 0)
  }, 0) || 0

  const getSkillLabel = (skillType: string) => {
    const skillMap: Record<string, string> = {
      listening: '🎧 Listening',
      reading: '📖 Reading',
      writing: '✍️ Writing',
      speaking: '🗣️ Speaking'
    }
    return skillMap[skillType] || skillType
  }

  return (
    <AppLayout>
      <PageContainer maxWidth="6xl">
        {/* Back to Lesson Button - Only show if exercise is linked to a lesson */}
        {exercise.lesson_id && (
          <Button
            variant="ghost"
            onClick={() => router.push(`/lessons/${lessonId || exercise.lesson_id}`)}
            className="mb-4"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            {t('back_to_lessons')}
          </Button>
        )}

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Badge className="capitalize">
              {getSkillLabel(exercise.skill_type)}
            </Badge>
            <Badge variant="outline" className="capitalize">{exercise.difficulty || exercise.difficulty_level}</Badge>
            {/* Show test type badge for Reading exercises */}
            {exercise.skill_type?.toLowerCase() === 'reading' && exercise.ielts_test_type && (
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300">
                {exercise.ielts_test_type === 'academic' 
                  ? tCommon('academic') 
                  : tCommon('general_training')}
              </Badge>
            )}
            {/* Exercise Type Badge */}
            {exercise.exercise_type && (
              <Badge variant="outline" className={
                exercise.exercise_type === 'mock_test' 
                  ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300'
                  : exercise.exercise_type === 'full_test'
                  ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300'
                  : 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300'
              }>
                {exercise.exercise_type === 'practice' 
                  ? t('practice') || 'Practice'
                  : exercise.exercise_type === 'mock_test'
                  ? t('mock_test') || 'Mock Test'
                  : exercise.exercise_type === 'full_test'
                  ? t('full_test') || 'Full Test'
                  : exercise.exercise_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            )}
            {/* Course Badge - Show if exercise belongs to a course */}
            {exercise.course_id && (
              <Badge 
                variant="outline" 
                className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900"
                onClick={(e) => {
                  e.preventDefault()
                  router.push(`/courses/${exercise.course_id}`)
                }}
              >
                <BookOpen className="w-3 h-3 mr-1" />
                {t('part_of_course') || 'Part of Course'}
              </Badge>
            )}
            {exercise.is_official && (
              <Badge variant="secondary">
                <Award className="w-3 h-3 mr-1" />
                Official
              </Badge>
            )}
          </div>

          <h1 className="text-3xl font-bold tracking-tight mb-2">{exercise.title}</h1>
          {exercise.description && (
            <p className="text-base text-muted-foreground">{exercise.description}</p>
          )}
          {/* Course Link - Show if exercise belongs to a course */}
          {exercise.course_id && (
            <div className="mt-2">
              <Button
                variant="link"
                onClick={() => router.push(`/courses/${exercise.course_id}`)}
                className="p-0 h-auto text-muted-foreground hover:text-primary"
              >
                <BookOpen className="w-4 h-4 mr-1" />
                {t('view_course') || 'View Course'}
              </Button>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Skill-Specific Exercise Details */}
            {exercise.skill_type === 'writing' && <WritingExerciseDetail exercise={exercise} />}
            {exercise.skill_type === 'speaking' && <SpeakingExerciseDetail exercise={exercise} />}
            {exercise.skill_type === 'listening' && <ListeningExerciseDetail exercise={exercise} sections={sections} />}
            {exercise.skill_type === 'reading' && <ReadingExerciseDetail exercise={exercise} sections={sections} />}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('start_exercise')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={handleStartExercise} 
                  disabled={starting}
                  className="w-full"
                  size="lg"
                >
                  {starting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('preparing')}
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-4 h-4 mr-2" />
                      {t('start_exercise')}
                    </>
                  )}
                </Button>
                
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• {t('time_limit')}: {exercise.time_limit_minutes ? `${exercise.time_limit_minutes} ${t('minutes')}` : t('no_time_limit')}</p>
                  {/* Only show question count for Reading/Listening */}
                  {(exercise.skill_type?.toLowerCase() === 'reading' || exercise.skill_type?.toLowerCase() === 'listening') && totalQuestions > 0 && (
                    <p>• {t('number_of_questions')}: {totalQuestions} {t('questions')}</p>
                  )}
                  {(exercise.skill_type?.toLowerCase() === 'writing' || exercise.skill_type?.toLowerCase() === 'speaking') && (
                    <p>• {t('essay_based_exercise')}</p>
                  )}
                  <p>• {t('can_retry_multiple_times')}</p>
                </div>
              </CardContent>
            </Card>

            {((exercise.total_attempts !== null && exercise.total_attempts !== undefined) || 
              (exercise.average_score !== null && exercise.average_score !== undefined)) && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('statistics')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {exercise.total_attempts !== null && exercise.total_attempts !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t('total_attempts_count')}</span>
                      <span className="font-semibold">{exercise.total_attempts}</span>
                    </div>
                  )}

                  {exercise.average_score !== null && exercise.average_score !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t('average_score')}</span>
                      <span className="font-semibold text-primary">
                        {exercise.average_score.toFixed(1)}% {/* average_score is percentage (0-100) */}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>{t('exercise_details')}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('skill_type_label')}</span>
                  <span className="font-medium capitalize">{exercise.skill_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('difficulty_level_label')}</span>
                  <Badge 
                    variant="outline" 
                    className={`capitalize ${
                      (exercise.difficulty || exercise.difficulty_level)?.toLowerCase() === 'easy' 
                        ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300'
                        : (exercise.difficulty || exercise.difficulty_level)?.toLowerCase() === 'medium'
                        ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300'
                        : (exercise.difficulty || exercise.difficulty_level)?.toLowerCase() === 'hard'
                        ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300'
                        : ''
                    }`}
                  >
                    {exercise.difficulty || exercise.difficulty_level || 'N/A'}
                  </Badge>
                </div>
                {exercise.target_band_score && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('band_score_label')}</span>
                    <span className="font-medium">{exercise.target_band_score}</span>
                  </div>
                )}
                {/* Show test type for Reading exercises */}
                {exercise.skill_type?.toLowerCase() === 'reading' && exercise.ielts_test_type && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{tCommon('test_type')}</span>
                    <Badge variant="outline" className="capitalize">
                      {exercise.ielts_test_type === 'academic' 
                        ? tCommon('academic') 
                        : tCommon('general_training')}
                    </Badge>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('status_label')}</span>
                  <Badge variant={exercise.is_published ? "default" : "secondary"}>
                    {exercise.is_published ? t('published') : t('draft')}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    </AppLayout>
  )
}
