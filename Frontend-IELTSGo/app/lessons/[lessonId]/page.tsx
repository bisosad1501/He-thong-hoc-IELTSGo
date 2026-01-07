"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { PageContainer } from "@/components/layout/page-container"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  CheckCircle,
  PlayCircle,
  FileText,
  PenTool,
  Clock,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Target,
  Award,
  Loader2
} from "lucide-react"
import { PageLoading } from "@/components/ui/page-loading"
import { EmptyState } from "@/components/ui/empty-state"
import { coursesApi } from "@/lib/api/courses"
import { exercisesApi } from "@/lib/api/exercises"
import { useTranslations } from '@/lib/i18n'
import { useLessonSwipeNavigation } from "@/lib/hooks/use-swipe-gestures"

export default function LessonDetailPage() {

  const t = useTranslations('common')

  const params = useParams()
  const router = useRouter()
  const [lesson, setLesson] = useState<any>(null)
  const [exerciseInfo, setExerciseInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [loadingExercise, setLoadingExercise] = useState(false)
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    loadLesson()
  }, [params.lessonId])

  const loadLesson = async () => {
    try {
      setLoading(true)
      const data = await coursesApi.getLessonById(params.lessonId as string)
      setLesson(data)

      // If lesson is exercise type, load exercise details
      if (data?.lesson?.content_type === 'exercise' && data?.lesson?.completion_criteria?.exercise_id) {
        loadExerciseInfo(data.lesson.completion_criteria.exercise_id)
      }
    } catch (error) {
      console.error('[Lesson Detail] Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadExerciseInfo = async (exerciseId: string) => {
    try {
      setLoadingExercise(true)
      const data = await exercisesApi.getExerciseById(exerciseId)
      setExerciseInfo(data)
    } catch (error) {
      console.error('[Lesson Detail] Error loading exercise:', error)
    } finally {
      setLoadingExercise(false)
    }
  }

  const handleComplete = async () => {
    try {
      setCompleting(true)
      await coursesApi.completLesson(params.lessonId as string)
      // Reload lesson to get updated status
      await loadLesson()
    } catch (error) {
      console.error('[Lesson Detail] Error completing:', error)
    } finally {
      setCompleting(false)
    }
  }

  const handleStartExercise = () => {
    // Prevent admins from starting exercises
    if (user?.role === 'admin') {
      toast.error(t('admin_cannot_start_exercise') || 'Admins cannot start exercises. Use a student or instructor account.')
      return
    }
    
    const exerciseId = lesson?.lesson?.completion_criteria?.exercise_id
    if (exerciseId) {
      // Pass lesson context via URL params
      const lessonId = params.lessonId as string
      const courseId = lessonData.course_id
      router.push(`/exercises/${exerciseId}?from=lesson&lessonId=${lessonId}&courseId=${courseId}`)
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

  if (!lesson) {
    return (
      <AppLayout>
        <PageContainer>
          <EmptyState
            icon={BookOpen}
            title={t('lesson_not_found') || "Lesson not found"}
            description={t('lesson_not_found_description') || "The lesson you are looking for does not exist"}
            actionLabel={t('go_back') || "Go Back"}
            actionOnClick={() => router.back()}
          />
        </PageContainer>
      </AppLayout>
    )
  }

  const { lesson: lessonData, videos, materials } = lesson
  const contentType = lessonData.content_type

  return (
    <AppLayout>
      <PageContainer maxWidth="5xl">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-4"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Course
          </Button>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {contentType === 'video' && <PlayCircle className="h-5 w-5 text-orange-500" />}
                {contentType === 'article' && <FileText className="h-5 w-5 text-cyan-500" />}
                {contentType === 'exercise' && <PenTool className="h-5 w-5 text-pink-500" />}
                <Badge variant="outline">{contentType}</Badge>
                {lessonData.is_free && <Badge variant="secondary">{t('free')}</Badge>}
              </div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">{lessonData.title}</h1>
              {lessonData.description && (
                <p className="text-base text-muted-foreground">{lessonData.description}</p>
              )}

              {/* Exercise Info in Header */}
              {contentType === 'exercise' && exerciseInfo && !loadingExercise && (
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    <span>{exerciseInfo.exercise.total_questions || 0} câu</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{exerciseInfo.exercise.time_limit_minutes || 20} phút</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Target className="h-4 w-4" />
                    <span>Pass: {lessonData.completion_criteria?.min_score || 60}%</span>
                  </div>
                </div>
              )}

              {lessonData.duration_minutes && contentType !== 'exercise' && (
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{lessonData.duration_minutes} minutes</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {contentType === 'exercise' ? (
              <Button
                onClick={handleStartExercise}
                disabled={loadingExercise || !exerciseInfo}
                className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600"
                size="lg"
              >
                {loadingExercise ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PenTool className="h-4 w-4" />
                )}
                Bắt đầu làm bài
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={completing}
                className="flex items-center gap-2"
              >
                {completing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Mark as Complete
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* VIDEO LESSON */}
          {contentType === 'video' && videos && videos.length > 0 && (
            <Card>
              <CardContent className="p-0">
                {videos.map((video: any, index: number) => (
                  <div key={video.id || index} className="space-y-4">
                    {/* Video Player */}
                    <div className="aspect-video bg-black rounded-t-lg overflow-hidden">
                      {video.video_provider === 'youtube' && video.video_id ? (
                        <iframe
                          className="w-full h-full"
                          src={`https://www.youtube.com/embed/${video.video_id}`}
                          title={video.title || lessonData.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-white">
                          <p>{t('video_player_not_available')}</p>
                        </div>
                      )}
                    </div>

                    {/* Video Info */}
                    <div className="p-6">
                      <h3 className="font-semibold text-lg mb-2">{video.title}</h3>
                      {video.description && (
                        <p className="text-muted-foreground text-sm">{video.description}</p>
                      )}
                      {video.duration_seconds && (
                        <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>
                            {Math.floor(video.duration_seconds / 60)}m {video.duration_seconds % 60}s
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* ARTICLE LESSON */}
          {contentType === 'article' && lessonData.description && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Article Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose prose-sm md:prose-base max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: lessonData.description }}
                />
              </CardContent>
            </Card>
          )}

          {/* EXERCISE LESSON - Simplified */}
          {contentType === 'exercise' && exerciseInfo && (
            <Card className="border-blue-200 bg-blue-50/30 dark:bg-blue-950/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-blue-500" />
                  Lưu ý khi làm bài
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Đọc kỹ hướng dẫn và câu hỏi trước khi bắt đầu</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Quản lý thời gian hợp lý - bạn có {exerciseInfo.exercise.time_limit_minutes || 20} phút</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Cần đạt tối thiểu {lessonData.completion_criteria?.min_score || 60}% để hoàn thành bài học</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Bạn có thể xem lại đáp án trước khi nộp bài</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Materials */}
          {materials && materials.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('downloadable_materials')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {materials.map((material: any) => (
                    <div 
                      key={material.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{material.title}</p>
                        {material.description && (
                          <p className="text-sm text-muted-foreground">{material.description}</p>
                        )}
                      </div>
                      <Button variant="outline" size="sm">
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Progress Info */}
          <Card className="bg-muted/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t('lesson_progress')}</p>
                  <p className="text-2xl font-bold">0%</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">{t('time_spent')}</p>
                  <p className="text-2xl font-bold">0m</p>
                </div>
              </div>
              <Progress value={0} className="mt-4" />
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </AppLayout>
  )
}

