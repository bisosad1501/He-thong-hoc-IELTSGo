"use client"

import { useState, useEffect, lazy, Suspense, useCallback, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { AppLayout } from "@/components/layout/app-layout"
import { PageContainer } from "@/components/layout/page-container"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Users, Star, BookOpen, PlayCircle, FileText, CheckCircle, Loader2, Target, Layers } from "lucide-react"
import { coursesApi } from "@/lib/api/courses"
import { useAuth } from "@/lib/contexts/auth-context"
import type { Course, Module, LessonProgress } from "@/types"
import { formatCourseDuration, formatDuration, formatNumber } from "@/lib/utils/format"
import { useTranslations } from '@/lib/i18n'
import { useToastWithI18n } from "@/lib/hooks/use-toast-with-i18n"
import { PageLoading } from "@/components/ui/page-loading"
import { EmptyState } from "@/components/ui/empty-state"

// Lazy load heavy components to improve initial load time
const ReviewList = lazy(() => import("@/components/course/review-list").then(m => ({ default: m.ReviewList })))
const ReviewForm = lazy(() => import("@/components/course/review-form").then(m => ({ default: m.ReviewForm })))

export default function CourseDetailPage() {

  const tCourses = useTranslations('courses')
  const t = useTranslations('common')
  const toast = useToastWithI18n()

  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [lessonProgressMap, setLessonProgressMap] = useState<Record<string, LessonProgress>>({})
  const [reviewRefreshTrigger, setReviewRefreshTrigger] = useState(0)

  // Memoize fetchCourseData so it can be used in event listener
  const fetchCourseData = useCallback(async () => {
    try {
      setLoading(true)
      const courseDetail = await coursesApi.getCourseById(params.courseId as string)
      
      // Backend returns { course, modules, is_enrolled, enrollment_details }
      setCourse(courseDetail.course)
      setIsEnrolled(courseDetail.is_enrolled || false)
      
      // Use modules from backend response
      // UPDATED: Include exercises array from API
      if (courseDetail.modules && Array.isArray(courseDetail.modules)) {
        const formattedModules = courseDetail.modules.map((moduleData) => ({
          ...moduleData.module,
          lessons: moduleData.lessons || [],
          exercises: moduleData.exercises || []  // NEW: Include exercises
        }))
        setModules(formattedModules)
      }

      // ✅ Fetch lesson progress if enrolled
      if (courseDetail.is_enrolled && user) {
        try {
          // Use the correct endpoint: GET /courses/:id/progress
          const response = await coursesApi.getCourseProgressByCourseId(params.courseId as string)
          const progressMap: Record<string, LessonProgress> = {}
          
          // Backend returns { lessons: LessonProgress[] }
          if (response?.lessons && Array.isArray(response.lessons)) {
            response.lessons.forEach((p: LessonProgress) => {
              progressMap[p.lesson_id] = p
            })
            setLessonProgressMap(progressMap)
          }
        } catch (error) {
          // Silent fail - no progress yet
        }
      }
    } catch (error) {
      // Error handled by UI
    } finally {
      setLoading(false)
    }
  }, [params.courseId, user])

  useEffect(() => {
    fetchCourseData()
  }, [fetchCourseData])

  // ✅ Listen for lesson progress updates to refresh course progress
  useEffect(() => {
    const handleProgressUpdate = (event: Event) => {
      const customEvent = event as CustomEvent
      const { courseId } = customEvent.detail || {}
      
      // Only refetch if the event is for this course
      if (courseId === params.courseId) {
        console.log('[Course Detail] Lesson progress updated - refetching course data')
        fetchCourseData()
      }
    }

    window.addEventListener('lessonProgressUpdated', handleProgressUpdate)
    return () => window.removeEventListener('lessonProgressUpdated', handleProgressUpdate)
  }, [params.courseId, fetchCourseData])

  const handleEnroll = useCallback(async () => {
    if (!user) {
      router.push("/login")
      return
    }

    try {
      setEnrolling(true)
      // Get courseId and ensure it's a string
      const courseId = Array.isArray(params.courseId) ? params.courseId[0] : params.courseId
      
      if (!courseId) {
        throw new Error('Course ID is missing')
      }
      
      await coursesApi.enrollCourse(courseId)
      setIsEnrolled(true)
    } catch (error: any) {
      const errorData = error.response?.data?.error
      
      if (errorData?.details === "this course requires payment") {
        toast.error(tCourses('course_requires_payment') || "Khóa học này yêu cầu thanh toán. Vui lòng mua khóa học trước khi đăng ký.")
      } else if (errorData?.message) {
        toast.error(errorData.message)
      } else {
        toast.error(tCourses('enrollment_failed') || "Không thể đăng ký khóa học")
      }
    } finally {
      setEnrolling(false)
    }
  }, [user, router, params.courseId, toast, tCourses])

  const handleStartLearning = useCallback(() => {
    // Find first module that has lessons
    const moduleWithLessons = modules.find(m => m.lessons && m.lessons.length > 0)
    
    if (moduleWithLessons && moduleWithLessons.lessons && moduleWithLessons.lessons.length > 0) {
      const lessonId = moduleWithLessons.lessons[0].id
      router.push(`/courses/${params.courseId}/lessons/${lessonId}`)
    } else {
      toast.info(tCourses('no_lessons_available') || "Chưa có bài học nào. Nội dung đang được cập nhật.")
    }
  }, [modules, params.courseId, router, toast, tCourses])

  if (loading) {
    return (
      <AppLayout>
        <PageContainer>
          <PageLoading translationKey="loading" />
        </PageContainer>
      </AppLayout>
    )
  }

  if (!course) {
    return (
      <AppLayout>
        <PageContainer>
          <EmptyState
            icon={BookOpen}
            title={tCourses('course_not_found')}
            description={tCourses('course_not_found_description') || "This course may have been removed or does not exist"}
            actionLabel={tCourses('back_to_courses') || "Back to Courses"}
            actionOnClick={() => router.push("/courses")}
          />
        </PageContainer>
      </AppLayout>
    )
  }

  const skillColors: Record<string, string> = {
    LISTENING: "bg-blue-500",
    READING: "bg-green-500",
    WRITING: "bg-orange-500",
    SPEAKING: "bg-purple-500",
    GENERAL: "bg-gray-500",
  }

  const levelColors: Record<string, string> = {
    BEGINNER: "bg-emerald-500",
    INTERMEDIATE: "bg-yellow-500",
    ADVANCED: "bg-red-500",
  }

  const contentTypeIcons: Record<string, any> = {
    VIDEO: PlayCircle,
    video: PlayCircle,
    ARTICLE: FileText,
    article: FileText,
    MIXED: Layers,
    mixed: Layers,
    QUIZ: CheckCircle,
    quiz: CheckCircle,
    exercise: CheckCircle,
  }

  return (
    <AppLayout>
      <div className="bg-gradient-to-b from-primary/5 to-background">
        <PageContainer>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex gap-3 mb-4">
                <Badge className={skillColors[(course.skill_type || course.skillType || 'listening').toUpperCase()]}>
                  {t((course.skill_type || course.skillType || 'listening').toLowerCase()).toUpperCase()}
                </Badge>
                <Badge className={levelColors[(course.level || 'beginner').toUpperCase()]} variant="secondary">
                  {t((course.level || 'beginner').toLowerCase()).toUpperCase()}
                </Badge>
              </div>

              <h1 className="text-3xl font-bold tracking-tight mb-4">{course.title}</h1>
              <p className="text-base text-muted-foreground mb-6">{course.short_description || course.description}</p>

              <div className="flex items-center gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{(course.average_rating || course.rating || 0).toFixed(1)}</span>
                  <span className="text-muted-foreground">({formatNumber(course.total_reviews || course.reviewCount || 0)} {tCourses('reviews')})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <span>{formatNumber(course.total_enrollments || course.enrollmentCount || 0)} {t('students')}</span>
                </div>
              </div>

              {course.instructor_name && (
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-semibold text-primary">{course.instructor_name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{tCourses('instructor')}</p>
                    <p className="font-semibold">{course.instructor_name}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-4 overflow-hidden group p-0">
                <div className="relative aspect-video overflow-hidden bg-muted">
                  {course.thumbnail_url || course.thumbnail ? (
                    <Image
                      src={course.thumbnail_url || course.thumbnail || "/placeholder.svg"}
                      alt={course.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, 400px"
                      priority
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                      <BookOpen className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardContent className="p-6">
                  {/* Check both old and new field names */}
                  {((course.enrollment_type || course.enrollmentType) === "premium" || 
                    (course.enrollment_type || course.enrollmentType) === "paid") && course.price ? (
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-primary">
                        {course.price.toLocaleString()} {course.currency || "VND"}
                      </span>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <Badge className="text-lg px-3 py-1">{t('free')}</Badge>
                    </div>
                  )}

                  {isEnrolled ? (
                    modules.length > 0 && modules.some(m => m.lessons && m.lessons.length > 0) ? (
                      <Button className="w-full mb-4" size="lg" onClick={handleStartLearning}>
                        {tCourses('continue_learning')}
                      </Button>
                    ) : (
                      <Button className="w-full mb-4" size="lg" disabled variant="secondary">
                        {tCourses('content_being_updated')}
                      </Button>
                    )
                  ) : ((course.enrollment_type || course.enrollmentType) === "premium" || 
                       (course.enrollment_type || course.enrollmentType) === "paid") ? (
                    <Button className="w-full mb-4" size="lg" onClick={handleEnroll} disabled={true}>
                      {tCourses('payment_required') || "Yêu cầu thanh toán"}
                    </Button>
                  ) : (
                    <Button className="w-full mb-4" size="lg" onClick={handleEnroll} disabled={enrolling}>
                      {enrolling ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t('loading')}
                        </>
                      ) : (
                        tCourses('enroll_now') || t('register')
                      )}
                    </Button>
                  )}

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{tCourses('duration')}</span>
                      <span className="font-medium">{formatCourseDuration(course.duration_hours || course.duration)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{tCourses('lessons')}</span>
                      <span className="font-medium">{course.total_lessons || course.lessonCount || 0} {tCourses('lesson_plural')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{tCourses('level')}</span>
                      <span className="font-medium capitalize">{t((course.level || 'beginner').toLowerCase())}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{tCourses('skill')}</span>
                      <span className="font-medium capitalize">{t((course.skill_type || course.skillType || 'listening').toLowerCase())}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </PageContainer>
      </div>

      <PageContainer>
        <Tabs defaultValue="curriculum" className="w-full">
          <TabsList className="grid w-full max-w-3xl grid-cols-3">
            <TabsTrigger value="curriculum">{tCourses('curriculum')}</TabsTrigger>
            <TabsTrigger value="about">{tCourses('about')}</TabsTrigger>
            <TabsTrigger value="reviews">{tCourses('reviews')}</TabsTrigger>
          </TabsList>

          <TabsContent value="curriculum" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{tCourses('course_content')}</CardTitle>
              </CardHeader>
              <CardContent>
                {modules.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-semibold mb-2">{tCourses('content_being_updated')}</p>
                    <p className="text-sm text-muted-foreground">
                      {tCourses('course_will_have_lessons', { count: (course.total_lessons || course.lessonCount || 0).toString() })}
                      {' '}{tCourses('content_being_prepared')}
                    </p>
                  </div>
                ) : (
                  <Accordion type="single" collapsible className="w-full">
                    {modules.map((module, index) => (
                      <AccordionItem key={module.id} value={`module-${index}`}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center justify-between w-full pr-4">
                            <span className="font-semibold">{module.title}</span>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span>{module.lessons?.length || 0} {tCourses('lesson_plural')}</span>
                              {(module.exercises?.length || 0) > 0 && (
                                <span className="text-pink-600 dark:text-pink-400">
                                  • {module.exercises?.length || 0} {tCourses('exercise_plural')}
                                </span>
                              )}
                            </div>
                          </div>
                        </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-2">
                          {/* Lessons Section */}
                          {module.lessons && module.lessons.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3">
                                📚 {tCourses('lessons')}
                              </h4>
                              {module.lessons.map((lesson) => {
                                const contentType = (lesson.content_type || lesson.contentType || 'video').toUpperCase()
                                const Icon = contentTypeIcons[contentType] || PlayCircle
                                const isPreview = lesson.is_free || lesson.isPreview || false

                                // Prioritize video duration_seconds for accurate display
                                const videoDurationSeconds = (lesson as any).videos?.[0]?.duration_seconds || 0
                                const durationMinutes = lesson.duration_minutes || lesson.duration || 0
                                const durationSeconds = videoDurationSeconds > 0 ? videoDurationSeconds : durationMinutes * 60

                                // ✅ Get lesson progress
                                const progress = lessonProgressMap[lesson.id]
                                // 📊 Use progress_percentage (single source of truth)
                                // Note: video_watch_percentage is deprecated and synced with progress_percentage
                                const progressPct = Math.round(progress?.progress_percentage || 0)
                                const isCompleted = progress?.status === 'completed' || progressPct >= 100

                                const handleLessonClick = () => {
                                  // Check if user is enrolled or if lesson is free/preview
                                  if (isEnrolled || isPreview) {
                                    router.push(`/courses/${params.courseId}/lessons/${lesson.id}`)
                                  } else {
                                    toast.error(tCourses('please_enroll_to_view_lesson'))
                                  }
                                }

                                return (
                                  <button
                                    key={lesson.id}
                                    onClick={handleLessonClick}
                                    className="w-full p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer text-left"
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-3 flex-1">
                                        <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium truncate">{lesson.title}</span>
                                            {isCompleted && (
                                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                                        {progressPct > 0 && !isCompleted && (
                                          <span className="text-xs font-medium text-primary">
                                            {progressPct}%
                                          </span>
                                        )}
                                        {durationSeconds > 0 && (
                                          <span className="text-xs text-muted-foreground">
                                            {formatDuration(durationSeconds)}
                                          </span>
                                        )}
                                        {isPreview && <Badge variant="outline">{tCourses('preview')}</Badge>}
                                      </div>
                                    </div>
                                    {/* ✅ Progress bar */}
                                    {progressPct > 0 && (
                                      <div className="ml-7">
                                        <Progress 
                                          value={progressPct} 
                                          className="h-1.5"
                                        />
                                      </div>
                                    )}
                                  </button>
                                )
                              })}
                            </div>
                          )}

                          {/* Exercises Section - NEW */}
                          {module.exercises && module.exercises.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-xs font-semibold text-pink-600 dark:text-pink-400 uppercase tracking-wide px-3">
                                ✍️ {tCourses('exercises_in_module')}
                              </h4>
                              {module.exercises.map((exercise) => {
                                const handleExerciseClick = () => {
                                  if (isEnrolled || exercise.is_free) {
                                    router.push(`/exercises/${exercise.id}`)
                                  } else {
                                    toast.error(tCourses('please_enroll_to_take_exercise'))
                                  }
                                }

                                // Get exercise type label
                                const getExerciseTypeLabel = (type?: string) => {
                                  if (!type) return tCourses('practice') || 'Practice'
                                  if (type === 'practice') return tCourses('practice') || 'Practice'
                                  if (type === 'mock_test') return tCourses('mock_test') || 'Mock Test'
                                  if (type === 'full_test') return tCourses('full_test') || 'Full Test'
                                  return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                                }

                                const getExerciseTypeBadgeColor = (type?: string) => {
                                  if (type === 'mock_test') return 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
                                  if (type === 'full_test') return 'bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800'
                                  return 'bg-pink-100 text-pink-700 border-pink-300 dark:bg-pink-950 dark:text-pink-300 dark:border-pink-800'
                                }

                                return (
                                  <button
                                    key={exercise.id}
                                    onClick={handleExerciseClick}
                                    className="w-full flex items-center justify-between p-3 rounded-lg bg-pink-50/50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800 hover:bg-pink-100/50 dark:hover:bg-pink-950/30 transition-colors cursor-pointer text-left"
                                  >
                                    <div className="flex items-center gap-3 flex-1">
                                      <Target className="w-4 h-4 text-pink-500" />
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="text-sm font-medium">{exercise.title}</span>
                                          <Badge variant="outline" className={`${getExerciseTypeBadgeColor(exercise.exercise_type)} text-xs`}>
                                            {getExerciseTypeLabel(exercise.exercise_type)}
                                          </Badge>
                                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 text-xs">
                                            📍 {tCourses('part_of_course') || 'Part of Course'}
                                          </Badge>
                                        </div>
                                        {exercise.description && (
                                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                            {exercise.description}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="text-xs text-pink-600 dark:text-pink-400 font-medium flex items-center gap-2">
                                        <span>{exercise.total_questions} {tCourses('questions_short')}</span>
                                        {exercise.time_limit_minutes && (
                                          <>
                                            <span>•</span>
                                            <span>{exercise.time_limit_minutes}{tCourses('minutes_short')}</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="about" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{tCourses('about_this_course')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p>{course.description || course.short_description}</p>
                  <h3 className="font-semibold mt-6 mb-3">{tCourses('what_you_will_learn')}</h3>
                  <ul className="space-y-3 text-muted-foreground">
                    <li>{tCourses('master_techniques') || `Nắm vững các kỹ thuật ${(course.skill_type || course.skillType || 'IELTS').toLowerCase()} cần thiết cho IELTS`}</li>
                    <li>{tCourses('practice_with_official_materials') || "Thực hành với tài liệu chính thống"}</li>
                    <li>{tCourses('receive_detailed_feedback') || "Nhận phản hồi chi tiết"}</li>
                    <li>{tCourses('track_learning_progress') || "Theo dõi tiến trình học tập"}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Review Form - Left column (only if enrolled) */}
              {isEnrolled && (
                <div className="lg:col-span-1">
                  <Suspense fallback={<Card><CardContent className="p-6"><div className="h-[300px] flex items-center justify-center">Loading review form...</div></CardContent></Card>}>
                    <ReviewForm 
                      courseId={params.courseId as string}
                      onSuccess={() => {
                        // Refresh review list immediately after successful submission
                        setReviewRefreshTrigger(prev => prev + 1)
                      }}
                    />
                  </Suspense>
                </div>
              )}

              {/* Review List - Right column (takes full width if not enrolled) */}
              <div className={isEnrolled ? "lg:col-span-2" : "lg:col-span-3"}>
                <Suspense fallback={<Card><CardContent className="p-6"><div className="h-[400px] flex items-center justify-center">Loading reviews...</div></CardContent></Card>}>
                  <ReviewList 
                    courseId={params.courseId as string} 
                    refreshTrigger={reviewRefreshTrigger}
                  />
                </Suspense>
              </div>
            </div>

            {/* Show enrollment CTA if not enrolled */}
            {!isEnrolled && (
              <Card className="mt-6">
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground mb-4">
                    {tCourses('need_enroll_to_review')}
                  </p>
                  <div className="flex justify-center">
                    <Button onClick={handleEnroll} disabled={enrolling}>
                      {enrolling ? t('loading') : tCourses('enroll_now')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </PageContainer>
    </AppLayout>
  )
}
