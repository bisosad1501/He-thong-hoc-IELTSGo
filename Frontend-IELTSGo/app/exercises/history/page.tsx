"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { PageContainer } from "@/components/layout/page-container"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Target, TrendingUp, Eye, Calendar, BookOpen, ArrowRight } from "lucide-react"
import { PageLoading } from "@/components/ui/page-loading"
import { EmptyState } from "@/components/ui/empty-state"
import { exercisesApi, type SubmissionFilters } from "@/lib/api/exercises"
import { SubmissionFiltersComponent } from "@/components/exercises/submission-filters"
import type { Submission, Exercise } from "@/types"
import { useTranslations } from '@/lib/i18n'

interface SubmissionWithExercise {
  submission: Submission
  exercise: Exercise
}

export default function ExerciseHistoryPage() {

  const t = useTranslations('exercises')
  const tCommon = useTranslations('common')

  const router = useRouter()
  const [submissions, setSubmissions] = useState<SubmissionWithExercise[]>([])
  const [loading, setLoading] = useState(true)
  // Default: không áp sẵn filter trạng thái; hiển thị tất cả
  const [filters, setFilters] = useState<SubmissionFilters>({})
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  // Memoize filter key to trigger refetch only when filters actually change
  const filterKey = useMemo(() => {
    return JSON.stringify({
      skill: filters.skill?.sort().join(',') || '',
      status: filters.status?.sort().join(',') || '',
      sort_by: filters.sort_by || '',
      sort_order: filters.sort_order || '',
      date_from: filters.date_from || '',
      date_to: filters.date_to || '',
      search: filters.search || '', // Include search in filterKey
    })
  }, [filters.skill, filters.status, filters.sort_by, filters.sort_order, filters.date_from, filters.date_to, filters.search])

  // Memoize fetchSubmissions to avoid unnecessary re-renders
  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true)
      const data = await exercisesApi.getMySubmissions(filters, page, 20)
      setSubmissions(data.submissions || [])
      setTotal(data.total || 0)
    } catch (error) {
      // Silent fail - keep previous data
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  useEffect(() => {
    fetchSubmissions()
  }, [fetchSubmissions, filterKey])

  // Memoize utility functions
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "in_progress":
      case "submitted":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "abandoned":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }, [])

  const getScoreColor = useCallback((percentage: number) => {
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-yellow-600"
    return "text-red-600"
  }, [])

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString)
    try {
      const locale = typeof navigator !== 'undefined' && navigator.language ? navigator.language : undefined
      return date.toLocaleDateString(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return date.toISOString()
    }
  }, [])

  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}m ${secs}s`
  }, [])

  const handleFiltersChange = (newFilters: SubmissionFilters) => {
    setFilters(newFilters)
    setPage(1)
  }

  const handleSearch = (search: string) => {
    setFilters((prev) => ({ ...prev, search: search || undefined }))
    setPage(1)
  }

  return (
    <AppLayout showSidebar={true} showFooter={false} hideNavbar={true} hideTopBar={true}>
      <PageHeader
        title={t('my_exercise_history')}
        subtitle={tCommon('exercise_history_description') || tCommon('view_full_history') || "Kho lưu trữ đầy đủ tất cả bài nộp đã hoàn thành với tìm kiếm và bộ lọc chi tiết"}
        rightActions={
          <Button 
            variant="outline" 
            onClick={() => router.push('/my-exercises')}
            className="text-sm"
          >
            {tCommon('back_to_active_exercises') || "Quay lại bài tập đang làm"}
          </Button>
        }
      />
      <PageContainer>

        {/* Filters - Full features including search */}
        <div className="mb-6">
          <SubmissionFiltersComponent 
            filters={filters} 
            onFiltersChange={handleFiltersChange} 
            onSearch={handleSearch}
          />
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Target className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('total_attempts')}</p>
                  <p className="text-2xl font-bold">{total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">{tCommon('completed')}</p>
                  <p className="text-2xl font-bold">
                    {submissions.filter((s) => 
                      s.submission.status === "completed" || 
                      (s.submission.status === "submitted" && s.submission.evaluation_status === "completed")
                    ).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-yellow-600" />
                <div>
                  <p className="text-sm text-muted-foreground">{tCommon('in_progress')}</p>
                  <p className="text-2xl font-bold">
                    {submissions.filter((s) => 
                      s.submission.status === "in_progress" || 
                      (s.submission.status === "submitted" && s.submission.evaluation_status !== "completed")
                    ).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('avg_score')}</p>
                  <p className="text-2xl font-bold">
                    {(() => {
                      // Calculate average band score for Speaking/Writing
                      const bandScoreSubmissions = submissions.filter(
                        (s) => s.submission.band_score !== undefined && s.submission.band_score !== null
                      )
                      
                      if (bandScoreSubmissions.length > 0) {
                        const avgBandScore = (
                          bandScoreSubmissions.reduce((sum, s) => sum + (s.submission.band_score || 0), 0) /
                          bandScoreSubmissions.length
                        ).toFixed(1)
                        return avgBandScore
                      }
                      
                      // Calculate average percentage for Reading/Listening
                      const scoreSubmissions = submissions.filter(
                        (s) => s.submission.score !== undefined && s.submission.score !== null
                      )
                      
                      if (scoreSubmissions.length > 0) {
                        const avgScore = (
                          scoreSubmissions.reduce((sum, s) => sum + (s.submission.score || 0), 0) /
                          scoreSubmissions.length
                        ).toFixed(1)
                        return `${avgScore}%`
                      }
                      
                      return t('not_available')
                    })()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submissions List */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <PageLoading translationKey="loading" size="md" />
          </div>
        ) : submissions.length === 0 ? (
          <EmptyState
            icon={Target}
            title={t('no_attempts_yet')}
            description={t('no_attempts_description') || "Bắt đầu luyện tập để xem lịch sử của bạn"}
            actionLabel={t('browse_exercises')}
            actionOnClick={() => router.push("/exercises/list")}
          />
        ) : (
          <div className="space-y-4">
            {submissions.map(({ submission, exercise }) => {
              const percentage = submission.total_questions
                ? (submission.correct_answers / submission.total_questions) * 100
                : 0

              return (
                <Card
                  key={submission.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => {
                    if (submission.status === "completed") {
                      router.push(`/exercises/${exercise.id}/result/${submission.id}`)
                    } else {
                      router.push(`/exercises/${exercise.id}/take/${submission.id}`)
                    }
                  }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <CardTitle className="text-lg">{exercise.title}</CardTitle>
                          {/* Source Badge - Show if exercise belongs to a course */}
                          {exercise.course_id && (
                            <Badge 
                              variant="outline" 
                              className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 text-xs"
                            >
                              <BookOpen className="w-3 h-3 mr-1" />
                              {exercise.module_id ? t('part_of_module') || 'Part of Module' : t('part_of_course') || 'Part of Course'}
                            </Badge>
                          )}
                          {!exercise.course_id && (
                            <Badge 
                              variant="outline" 
                              className="bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300 text-xs"
                            >
                              {t('standalone') || 'Standalone'}
                            </Badge>
                          )}
                          {/* Course Link Badge - Show if exercise belongs to a course */}
                          {exercise.course_id && (
                            <Badge 
                              variant="outline" 
                              className="bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 transition-colors cursor-pointer text-xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/courses/${exercise.course_id}`)
                              }}
                            >
                              <ArrowRight className="w-3 h-3 mr-1" />
                              {t('view_course') || 'View Course'}
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="flex items-center gap-2 flex-wrap">
                          <Calendar className="w-3 h-3" />
                          {formatDate(submission.started_at)}
                          {submission.completed_at && (
                            <span>
                              • {t('completed_label')} {formatDate(submission.completed_at)}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(submission.status)}>
                        {submission.status === "completed" 
                          ? t('status_completed')
                          : submission.status === "in_progress"
                          ? t('status_in_progress')
                          : submission.status === "abandoned"
                          ? t('status_abandoned')
                          : String(submission.status).replace("_", " ")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1 min-w-0">
                        {/* Attempt Number */}
                        <div>
                          <p className="text-sm text-muted-foreground">{t('attempt')}</p>
                          <p className="text-lg font-semibold">#{submission.attempt_number}</p>
                        </div>

                        {/* Performance - Different display based on skill type */}
                        {submission.status === "completed" ? (
                          <div>
                            {/* Reading/Listening: Show percentage */}
                            {(exercise.skill_type?.toLowerCase() === 'reading' || exercise.skill_type?.toLowerCase() === 'listening') ? (
                              <>
                                <p className="text-sm text-muted-foreground">{t('percentage')}</p>
                                <p className={`text-2xl font-semibold ${getScoreColor(percentage)}`}>
                                  {percentage.toFixed(1)}%
                                </p>
                                {submission.total_questions > 0 && (
                                  <p className="text-xs text-muted-foreground">
                                    {submission.correct_answers}/{submission.total_questions} {t('questions')}
                                  </p>
                                )}
                              </>
                            ) : exercise.skill_type?.toLowerCase() === 'writing' ? (
                              /* Writing: Show band score if available */
                              submission.band_score ? (
                                <>
                                  <p className="text-sm text-muted-foreground">{t('band_score')}</p>
                                  <p className="text-2xl font-semibold text-primary">
                                    {submission.band_score}
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p className="text-sm text-muted-foreground">{t('status')}</p>
                                  <p className="text-lg font-semibold">
                                    {t('completed')}
                                  </p>
                                </>
                              )
                            ) : exercise.skill_type?.toLowerCase() === 'speaking' ? (
                              /* Speaking: Show band score if available */
                              submission.band_score ? (
                                <>
                                  <p className="text-sm text-muted-foreground">{t('band_score')}</p>
                                  <p className="text-2xl font-semibold text-primary">
                                    {submission.band_score}
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p className="text-sm text-muted-foreground">{t('status')}</p>
                                  <p className="text-lg font-semibold">
                                    {t('completed')}
                                  </p>
                                </>
                              )
                            ) : null}
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm text-muted-foreground">{t('progress')}</p>
                            <p className="text-lg font-semibold">
                              {(exercise.skill_type?.toLowerCase() === 'reading' || exercise.skill_type?.toLowerCase() === 'listening') && submission.total_questions > 0 ? (
                                <>{submission.questions_answered}/{submission.total_questions}</>
                              ) : (
                                t('in_progress')
                              )}
                            </p>
                          </div>
                        )}

                        {/* Band Score */}
                        {submission.band_score && (exercise.skill_type?.toLowerCase() === 'listening' || exercise.skill_type?.toLowerCase() === 'reading') && (
                          <div>
                            <p className="text-sm text-muted-foreground">{t('band_score')}</p>
                            <p className="text-lg font-semibold text-primary">
                              {submission.band_score}
                            </p>
                          </div>
                        )}

                        {/* Word Count for Writing */}
                        {exercise.skill_type?.toLowerCase() === 'writing' && submission.word_count && submission.word_count > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground">{t('word_count')}</p>
                            <p className="text-lg font-semibold text-orange-600">
                              {submission.word_count}
                            </p>
                          </div>
                        )}

                        {/* Audio Duration for Speaking */}
                        {exercise.skill_type?.toLowerCase() === 'speaking' && submission.audio_duration_seconds && submission.audio_duration_seconds > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground">{t('speaking_duration')}</p>
                            <p className="text-lg font-semibold text-purple-600">
                              {Math.floor(submission.audio_duration_seconds / 60)}:{String(submission.audio_duration_seconds % 60).padStart(2, '0')}
                            </p>
                          </div>
                        )}

                        {/* Time Spent */}
                        <div>
                          <p className="text-sm text-muted-foreground">{t('time_spent')}</p>
                          <p className="text-lg font-semibold">
                            {formatTime(submission.time_spent_seconds)}
                          </p>
                        </div>
                      </div>

                      {/* Action Button - Right aligned on large screens, full width on mobile */}
                      <div className="flex-shrink-0 lg:self-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full lg:w-auto"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (submission.status === "completed") {
                              router.push(`/exercises/${exercise.id}/result/${submission.id}`)
                            } else {
                              router.push(`/exercises/${exercise.id}/take/${submission.id}`)
                            }
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          {submission.status === "completed" ? t('view_results') : t('continue')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="mt-8 flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              {tCommon('previous')}
            </Button>
            <span className="flex items-center px-4">
              {tCommon('page_of', { page: page.toString(), totalPages: Math.ceil(total / 20).toString() })}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(total / 20)}
            >
              {tCommon('next')}
            </Button>
          </div>
        )}
      </PageContainer>
    </AppLayout>
  )
}

