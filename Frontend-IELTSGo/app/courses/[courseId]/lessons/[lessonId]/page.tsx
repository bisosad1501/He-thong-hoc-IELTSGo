"use client"

// Resume watching feature + Video history tracking
import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { AppLayout } from "@/components/layout/app-layout"
import { PageContainer } from "@/components/layout/page-container"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  Volume2,
  VolumeX,
  Maximize,
  FileText,
  PenTool,
  Target,
  Loader2,
  Layers,
  BookOpen,
} from "lucide-react"
import { PageLoading } from "@/components/ui/page-loading"
import { EmptyState } from "@/components/ui/empty-state"
import { coursesApi } from "@/lib/api/courses"
import { getToken } from "@/lib/api/apiClient"
import type { Lesson, Module } from "@/types"
import { formatDuration } from "@/lib/utils/format"
import { useYouTubeProgress } from "@/lib/hooks/use-youtube-progress"
import { usePreferences } from "@/lib/contexts/preferences-context"
import { useAuth } from "@/lib/contexts/auth-context"
import { useTranslations } from '@/lib/i18n'
import { useLessonSwipeNavigation } from "@/lib/hooks/use-swipe-gestures"

export default function LessonPlayerPage() {

  const t = useTranslations('courses')
  const tCommon = useTranslations('common')
  const { user } = useAuth()

  const params = useParams()
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [videos, setVideos] = useState<any[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [courseLevelExercises, setCourseLevelExercises] = useState<any[]>([]) // NEW: Course-level exercises
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [note, setNote] = useState("")
  const [notes, setNotes] = useState<Array<{ id: string; content: string; timestamp?: number; createdAt: string }>>([])
  const [lastPosition, setLastPosition] = useState(0) // ✅ For resume watching
  const [progressLoaded, setProgressLoaded] = useState(false) // ✅ Track if progress has been fetched
  // ✅ Generate UUID for session (backend expects UUID format)
  const sessionIdRef = useRef<string | undefined>(undefined) // Optional, backend will handle if missing
  
  // Track time spent on page (for non-video lessons)
  const pageStartTimeRef = useRef<number>(Date.now())
  const totalTimeSpentRef = useRef<number>(0)
  
  // ✅ Get user preferences for playback speed and auto-play
  const { preferences } = usePreferences()
  const playbackSpeed = preferences?.playback_speed || 1.0
  const autoPlayNext = preferences?.auto_play_next_lesson || false

  // Send progress update to backend
  const sendProgressUpdate = async (data: {
    videoWatchedSeconds?: number
    videoTotalSeconds?: number
    progressPercentage?: number
    isCompleted?: boolean
    useKeepalive?: boolean
  }) => {
    try {
      const payload: any = {}

      if (data.videoWatchedSeconds !== undefined) {
        payload.video_watched_seconds = data.videoWatchedSeconds
      }
      if (data.videoTotalSeconds !== undefined) {
        payload.video_total_seconds = data.videoTotalSeconds
      }
      if (data.progressPercentage !== undefined) {
        payload.progress_percentage = data.progressPercentage
      }
      if (data.isCompleted) {
        payload.is_completed = true
      }

      if (data.useKeepalive) {
        // Use fetch with keepalive for page unload
        const token = getToken()
        const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"
        const url = `${base}/progress/lessons/${params.lessonId}`
        await fetch(url, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
          keepalive: true,
        })
      } else {
        await coursesApi.updateLessonProgress(params.lessonId as string, payload)
      }
    } catch (error) {
      // Silent fail - progress will retry on next update
    }
  }

  // Check if this is a YouTube video
  const isYouTube = videos.length > 0 && videos[0]?.video_provider?.toLowerCase() === 'youtube' && videos[0]?.video_id
  const youtubeVideoId = isYouTube ? videos[0].video_id : ''
  
  // Debug logging
  useEffect(() => {
    console.log('[Lesson Player] Render - videos:', videos)
    console.log('[Lesson Player] Render - isYouTube:', isYouTube)
    console.log('[Lesson Player] Render - youtubeVideoId:', youtubeVideoId)
    console.log('[Lesson Player] Render - lesson content_type:', lesson?.content_type)
    console.log('[Lesson Player] Render - progressLoaded:', progressLoaded)
  }, [videos, isYouTube, youtubeVideoId, lesson?.content_type, progressLoaded])

  // ✅ Memoize onProgressUpdate để tránh re-render loop
  const handleProgressUpdate = useCallback((data: {
    currentTime: number
    duration: number
    watchedSeconds: number
    progressPercentage: number
    accumulatedTime: number
    lastPosition: number
    completed: boolean
  }) => {
    // ❌ REMOVED: setCurrentTime/setDuration cause re-render loop!
    // ✅ Use youtubeProgress.currentTime/duration directly instead
    
    // ✅ Dùng accumulated time từ hook (thời gian thực sự xem)
    // Send progress to backend với last position + video stats
    const payload: any = {
      video_watched_seconds: data.watchedSeconds,
      video_total_seconds: Math.floor(data.duration),
      // ⚠️ Don't send progress_percentage - let backend auto-calculate from last_position
      // This ensures consistent calculation: progress = last_position / total_duration * 100
      last_position_seconds: data.lastPosition, // ✅ Lưu vị trí để resume
    }
    
    // Update lesson progress and invalidate cache to trigger refetch
    coursesApi.updateLessonProgress(params.lessonId as string, payload)
      .then(() => {
        // ✅ Trigger refetch of enrollment data to update course progress in My Courses
        // This ensures course progress percentage reflects lesson progress immediately
        // Use SWR mutate or custom event to refresh enrollment cache
        if (typeof window !== 'undefined') {
          // Dispatch custom event to signal My Courses page to refetch
          window.dispatchEvent(new CustomEvent('lessonProgressUpdated', { 
            detail: { lessonId: params.lessonId, courseId: params.courseId }
          }))
        }
      })
      .catch(() => {
        // Silent fail - progress will retry on next update
      })
  }, [params.lessonId, params.courseId, videos])

  // Initialize YouTube player and tracking (only for YouTube videos)
  // Hook MUST be called unconditionally, but with empty videoId it will skip init
  // ✅ Only pass videoId after progress is loaded to ensure startPosition is correct
  const youtubeProgress = useYouTubeProgress({
    videoId: progressLoaded ? youtubeVideoId : '', // ✅ Wait for progress to load first
    startPosition: lastPosition, // ✅ Resume from last position
    onProgressUpdate: handleProgressUpdate,
    updateInterval: 5000, // Send update every 5 seconds
    autoPlay: false, // Don't auto play
    playbackSpeed: playbackSpeed, // ✅ Apply user's preferred playback speed
  })

  useEffect(() => {
    const fetchLessonData = async () => {
      try {
        setLoading(true)
        
        // Fix: getLessonById only takes lessonId, not courseId
        const lessonData = await coursesApi.getLessonById(params.lessonId as string)
        
        console.log('[Lesson Player] Lesson data:', lessonData)
        console.log('[Lesson Player] Videos:', lessonData.videos)
        console.log('[Lesson Player] Lesson content_type:', lessonData.lesson?.content_type)
        
        setLesson(lessonData.lesson)
        setVideos(lessonData.videos || [])
        
        console.log('[Lesson Player] Videos set:', lessonData.videos || [])

        // ✅ Load last position để resume watching (BEFORE rendering player)
        try {
          const progress = await coursesApi.getLessonProgress(params.lessonId as string)
          if (progress && progress.last_position_seconds > 0) {
            setLastPosition(progress.last_position_seconds)
          }
        } catch (error) {
          // Silent fail - no progress yet, start from beginning
        }
        
        // ✅ Mark progress as loaded so player can initialize with correct startPosition
        setProgressLoaded(true)

        // Get course detail with modules and lessons (including videos)
        console.log('[Lesson Player] Fetching course with ID:', params.courseId)
        
        // Clear cache for debugging (temporary)
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem(`api_cache_/courses/${params.courseId}`)
        }
        
        const courseDetail = await coursesApi.getCourseById(params.courseId as string)
        console.log('[Lesson Player] Course Detail Response:', courseDetail)
        console.log('[Lesson Player] Course modules:', courseDetail?.modules)
        console.log('[Lesson Player] Modules is array?', Array.isArray(courseDetail?.modules))
        console.log('[Lesson Player] Modules length:', courseDetail?.modules?.length)

        // Auto-enroll if not enrolled and user is authenticated (but not admin)
        const token = getToken()
        const userData = user
        if (token && courseDetail && courseDetail.is_enrolled === false) {
          // Only auto-enroll for students and instructors, NOT admins
          if (userData?.role === 'student' || userData?.role === 'instructor') {
            try {
              await coursesApi.enrollCourse(params.courseId as string)
            } catch (enErr) {
              // Silent fail - user can enroll manually
              console.log('[Lesson Player] Auto-enroll failed:', enErr)
            }
          }
        }
        
        // Transform the modules data to match our Module type
        // UPDATED: Include exercises from API
        console.log('[Lesson Player] Course Detail:', courseDetail)
        console.log('[Lesson Player] Modules from API:', courseDetail.modules)
        
        // Debug: Check exercises in raw response
        if (courseDetail.modules && Array.isArray(courseDetail.modules)) {
          courseDetail.modules.forEach((m: any, i: number) => {
            console.log(`[Lesson Player] Raw Module ${i + 1} from API:`, {
              module: m.module,
              exercises: m.exercises,
              exercisesType: typeof m.exercises,
              exercisesIsArray: Array.isArray(m.exercises)
            })
          })
        }
        
        // Store course-level exercises separately
        console.log('[Lesson Player] Course-level exercises:', courseDetail.course_level_exercises)
        setCourseLevelExercises(courseDetail.course_level_exercises || [])
        
        const transformedModules: Module[] = (courseDetail.modules || []).map((moduleData: any, index: number) => {
          console.log(`[Lesson Player] Module ${index + 1}:`, moduleData.module.title)
          console.log(`[Lesson Player] Module ${index + 1} exercises:`, moduleData.exercises)
          console.log(`[Lesson Player] Module ${index + 1} exercises count:`, moduleData.exercises?.length || 0)
          
          return {
            id: moduleData.module.id,
            course_id: params.courseId as string,
            title: moduleData.module.title || `${tCommon('module')} ${index + 1}`,
            display_order: moduleData.module.display_order || index + 1,
            total_lessons: moduleData.lessons?.length || 0,
            total_exercises: moduleData.exercises?.length || 0,  // NEW
            is_published: true,
            created_at: moduleData.module.created_at || new Date().toISOString(),
            updated_at: moduleData.module.updated_at || new Date().toISOString(),
            lessons: moduleData.lessons || [],
            exercises: moduleData.exercises || [],  // NEW
          }
        })
        
        console.log('[Lesson Player] Transformed modules:', transformedModules)
        setModules(transformedModules)

        // TODO: Backend notes endpoint not implemented yet
        // const lessonNotes = await coursesApi.getLessonNotes(params.courseId as string, params.lessonId as string)
        // setNotes(lessonNotes)
      } catch (error) {
        // Error handled by UI
      } finally {
        setLoading(false)
      }
    }

    fetchLessonData()
  }, [params.courseId, params.lessonId])

  // Track HTML5 video progress (for non-YouTube videos)
  useEffect(() => {
    const video = videoRef.current
    if (!video || isYouTube) return

    let progressInterval: NodeJS.Timeout | null = null

    // ✅ Apply playback speed from user preferences
    if (playbackSpeed && playbackSpeed !== 1.0) {
      video.playbackRate = playbackSpeed
    }

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
    }

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
      // ✅ Ensure playback speed is set after metadata loads
      if (playbackSpeed && playbackSpeed !== 1.0) {
        video.playbackRate = playbackSpeed
      }
    }

    const handlePlay = () => {
      setIsPlaying(true)
      // Send progress every 5 seconds while playing
      progressInterval = setInterval(() => {
        if (video.duration > 0) {
          sendProgressUpdate({
            videoWatchedSeconds: Math.floor(video.currentTime),
            videoTotalSeconds: Math.floor(video.duration),
            progressPercentage: (video.currentTime / video.duration) * 100,
          })
        }
      }, 5000)
    }

    const handlePause = () => {
      setIsPlaying(false)
      if (progressInterval) {
        clearInterval(progressInterval)
        progressInterval = null
      }
      // Send final progress
      if (video.duration > 0) {
        sendProgressUpdate({
          videoWatchedSeconds: Math.floor(video.currentTime),
          videoTotalSeconds: Math.floor(video.duration),
          progressPercentage: (video.currentTime / video.duration) * 100,
        })
      }
    }

    const handleEnded = () => {
                setIsPlaying(false)
      if (progressInterval) {
        clearInterval(progressInterval)
        progressInterval = null
      }
      // Mark as completed
      sendProgressUpdate({
        videoWatchedSeconds: Math.floor(video.duration),
        videoTotalSeconds: Math.floor(video.duration),
        progressPercentage: 100,
        isCompleted: true,
      })
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)

    return () => {
      if (progressInterval) {
        clearInterval(progressInterval)
      }
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
    }
  }, [isYouTube, playbackSpeed])

  // Send progress on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      sendProgressUpdate({ useKeepalive: true })
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        sendProgressUpdate({ useKeepalive: true })
      }
    }

      window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect()
      const pos = (e.clientX - rect.left) / rect.width
      videoRef.current.currentTime = pos * duration
    }
  }

  // TODO: Backend notes feature not implemented yet
  /*
  const handleAddNote = async () => {
    if (!note.trim()) return

    try {
      await coursesApi.addLessonNote(params.courseId as string, params.lessonId as string, {
        content: note,
        timestamp: Math.floor(currentTime),
      })
      const updatedNotes = await coursesApi.getLessonNotes(params.courseId as string, params.lessonId as string)
      setNotes(updatedNotes)
      setNote("")
    } catch (error) {
      console.error("[v0] Failed to add note:", error)
    }
  }
  */


  const handleCompleteLesson = async () => {
    try {
      await sendProgressUpdate({
        videoWatchedSeconds: Math.floor(currentTime),
        videoTotalSeconds: Math.floor(duration),
        progressPercentage: 100,
        isCompleted: true,
      })
      
      // ✅ Check auto_play_next_lesson preference
      if (autoPlayNext) {
        // Auto-redirect to next lesson
        handleNextLesson()
      } else {
        // Show completion message or just stay on page
        // User can manually navigate to next lesson
      }
    } catch (error) {
      // Silent fail - progress will be saved on next update
    }
  }

  const handleNextLesson = () => {
    const allLessons = modules.flatMap((m) => m.lessons || [])
    const currentIndex = allLessons.findIndex((l) => l?.id === params.lessonId)
    if (currentIndex < allLessons.length - 1) {
      const nextLesson = allLessons[currentIndex + 1]
      if (nextLesson?.id) {
        router.push(`/courses/${params.courseId}/lessons/${nextLesson.id}`)
      }
    } else {
      router.push(`/courses/${params.courseId}`)
    }
  }

  const handlePreviousLesson = () => {
    const allLessons = modules.flatMap((m) => m.lessons || [])
    const currentIndex = allLessons.findIndex((l) => l?.id === params.lessonId)
    if (currentIndex > 0) {
      const prevLesson = allLessons[currentIndex - 1]
      if (prevLesson?.id) {
        router.push(`/courses/${params.courseId}/lessons/${prevLesson.id}`)
      }
    }
  }

  // Calculate lesson navigation state
  const allLessons = modules.flatMap((m) => m.lessons || [])
  const currentIndex = allLessons.findIndex((l) => l?.id === params.lessonId)
  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex < allLessons.length - 1

  // Swipe gestures for mobile navigation - must be called before early returns (Rules of Hooks)
  const { ref: swipeRef } = useLessonSwipeNavigation(
    () => {
      if (hasPrevious) {
        handlePreviousLesson()
      }
    },
    () => {
      if (hasNext) {
        handleNextLesson()
      }
    },
    true // Enable on mobile only
  )

  if (loading) {
    return (
      <AppLayout showSidebar={false} showFooter={false}>
        <div className="flex items-center justify-center min-h-screen">
          <PageLoading translationKey="loading" />
        </div>
      </AppLayout>
    )
  }

  if (!lesson) {
    return (
      <AppLayout showSidebar={false} showFooter={false}>
        <PageContainer>
          <EmptyState
            icon={BookOpen}
            title={t('lesson_not_found') || "Lesson not found"}
            description={t('lesson_not_found_description') || "The lesson you are looking for does not exist"}
            actionLabel={t('back_to_course') || "Back to Course"}
            actionOnClick={() => router.push(`/courses/${params.courseId}`)}
          />
        </PageContainer>
      </AppLayout>
    )
  }

  return (
    <AppLayout showSidebar={false} showFooter={false}>
    <div ref={swipeRef as React.RefObject<HTMLDivElement>} className="min-h-screen relative">
      {/* Header */}
      <div className="border-b bg-white sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push(`/courses/${params.courseId}`)}
              className="flex-shrink-0"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {t('back')}
            </Button>
            
            <h1 className="text-base md:text-lg font-semibold truncate flex-1 text-center px-4">
              {lesson.title}
            </h1>
            
            <Button 
              onClick={handleCompleteLesson}
              size="sm"
              className="flex-shrink-0"
              disabled={!hasNext}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              {t('next')}
            </Button>
          </div>
        </div>
      </div>

      <PageContainer className="py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Video Content - Show if videos exist OR if lesson is video/mixed type */}
            {(videos.length > 0 || (lesson && (lesson.content_type === 'video' || lesson.content_type === 'mixed'))) && (
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative bg-black aspect-video">
                    {videos.length > 0 && videos[0]?.video_provider?.toLowerCase() === 'youtube' && videos[0]?.video_id ? (
                      /* YouTube player container - controlled by useYouTubeProgress hook */
                      <div 
                        ref={youtubeProgress.containerRef}
                        className="absolute inset-0 w-full h-full"
                      />
                    ) : videos.length > 0 && videos[0]?.video_url ? (
                      <video
                        ref={videoRef}
                        src={videos[0].video_url}
                        className="absolute inset-0 w-full h-full object-contain"
                        controls
                        controlsList="nodownload"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-white">
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            {videos.length === 0 ? 'Đang tải video...' : 'Không thể tải video'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                
                {/* Video Info */}
                <CardHeader className="border-t">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{lesson.title}</CardTitle>
                      {/* Don't show description preview for mixed lessons - will show full HTML below */}
                      {lesson.description && 
                       !(lesson.content_type === "mixed" || lesson.contentType === "MIXED") && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {lesson.description.replace(/<[^>]*>/g, '').substring(0, 150)}...
                        </p>
                      )}
                    </div>
                    {/* Show actual video duration if available, fallback to lesson duration */}
                    {(videos[0]?.duration_seconds || lesson.duration_minutes) && (
                      <div className="ml-4 text-sm text-muted-foreground whitespace-nowrap">
                        {videos[0]?.duration_seconds 
                          ? formatDuration(videos[0].duration_seconds)
                          : lesson.duration_minutes 
                            ? `${lesson.duration_minutes} ${t('minutes_full')}`
                            : ''
                        }
                      </div>
                    )}
                  </div>
                </CardHeader>
              </Card>
            )}

            {/* Lesson Navigation */}
            <div className="flex justify-between items-center gap-4 py-4">
              <Button
                variant="outline"
                onClick={handlePreviousLesson}
                disabled={!hasPrevious}
                className="flex-1 max-w-[200px]"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                {t('previous_lesson')}
              </Button>
              
              <div className="text-sm text-muted-foreground">
                {t('lesson')} {currentIndex + 1} / {allLessons.length}
              </div>
              
              <Button
                onClick={handleNextLesson}
                disabled={!hasNext}
                className="flex-1 max-w-[200px]"
              >
                {t('next_lesson')}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {(lesson.content_type === "article" || lesson.contentType === "ARTICLE") && (
              <Card>
                <CardHeader>
                  <CardTitle>{lesson.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="prose prose-sm md:prose-base max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: lesson.description || '' }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Mixed Content - Show detailed description after video */}
            {(lesson.content_type === "mixed" || lesson.contentType === "MIXED") && videos.length > 0 && lesson.description && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('lesson_content')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="prose prose-sm md:prose-base max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: lesson.description || '' }}
                  />
                </CardContent>
              </Card>
            )}

            {/* TODO: Backend notes feature not implemented yet
            <Card>
              <CardHeader>
                <CardTitle>{t('courses.lesson_notes')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="add">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="add">{t('courses.add_note')}</TabsTrigger>
                    <TabsTrigger value="view">View Notes ({notes.length})</TabsTrigger>
                  </TabsList>
                  <TabsContent value="add" className="space-y-4">
                    <Textarea
                      placeholder={t('courses.write_your_notes_here')}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={4}
                    />
                    <Button onClick={handleAddNote}>{t('courses.save_note')}</Button>
                  </TabsContent>
                  <TabsContent value="view">
                    {notes.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">{t('courses.no_notes_yet')}</p>
                    ) : (
                      <div className="space-y-3">
                        {notes.map((n) => (
                          <div key={n.id} className="p-3 bg-muted rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              {n.timestamp !== undefined && (
                                <span className="text-xs text-muted-foreground">{formatDuration(n.timestamp)}</span>
                              )}
                            </div>
                            <p className="text-sm">{n.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            */}
          </div>

          {/* Sidebar - Course Content */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t('course_content')}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                  {modules.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">
                      <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm font-medium mb-1">{t('no_modules_yet') || 'No modules yet'}</p>
                      <p className="text-xs">{t('content_being_prepared') || 'Content is being prepared'}</p>
                    </div>
                  ) : (
                    modules.map((module) => (
                      <div key={module.id} className="border-b last:border-b-0">
                        <div className="p-4 bg-muted/50">
                          <h4 className="font-semibold text-sm">{module.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {module.lessons?.length || 0} {t('lesson_plural')}
                            {(module.exercises?.length || 0) > 0 && (
                              <span className="text-pink-600 dark:text-pink-400"> • {module.exercises?.length || 0} {t('exercise_plural')}</span>
                            )}
                          </p>
                        </div>
                      <div className="divide-y">
                        {/* Lessons */}
                        {module.lessons?.map((l, index) => {
                          const contentType = (l.content_type || l.contentType || 'video').toLowerCase()

                          // Prioritize video duration_seconds for accurate display
                          const videoDurationSeconds = (l as any).videos?.[0]?.duration_seconds || 0
                          const durationMinutes = l.duration_minutes || l.duration || 0
                          const durationSeconds = videoDurationSeconds > 0 ? videoDurationSeconds : durationMinutes * 60

                          const isActive = l.id === params.lessonId

                          return (
                            <button
                              key={l.id}
                              onClick={() => router.push(`/courses/${params.courseId}/lessons/${l.id}`)}
                              className={`w-full text-left p-3 transition-all ${
                                isActive
                                  ? "bg-primary/10 border-l-4 border-primary"
                                  : "hover:bg-muted/50 border-l-4 border-transparent"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                  isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground"
                                }`}>
                                  {index + 1}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium truncate ${
                                    isActive ? "text-primary" : ""
                                  }`}>
                                    {l.title}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    {contentType === "video" && (
                                      <>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                          <PlayCircle className="w-3 h-3" />
                                          {t('video')}
                                        </span>
                                        {durationSeconds > 0 && (
                                          <span className="text-xs text-muted-foreground">
                                            • {formatDuration(durationSeconds)}
                                          </span>
                                        )}
                                      </>
                                    )}
                                    {contentType === "article" && (
                                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <FileText className="w-3 h-3" />
                                        {t('article')}
                                      </span>
                                    )}
                                    {contentType === "mixed" && (
                                      <>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                          <Layers className="w-3 h-3" />
                                          {t('mixed')}
                                        </span>
                                        {durationSeconds > 0 && (
                                          <span className="text-xs text-muted-foreground">
                                            • {formatDuration(durationSeconds)}
                                          </span>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </button>
                          )
                        })}

                        {/* Exercises - NEW */}
                        {module.exercises?.map((ex, index) => {
                          // Get exercise type label
                          const getExerciseTypeLabel = (type?: string) => {
                            if (!type) return t('practice') || 'Practice'
                            if (type === 'practice') return t('practice') || 'Practice'
                            if (type === 'mock_test') return t('mock_test') || 'Mock Test'
                            if (type === 'full_test') return t('full_test') || 'Full Test'
                            return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                          }

                          const getExerciseTypeBadgeColor = (type?: string) => {
                            if (type === 'mock_test') return 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
                            if (type === 'full_test') return 'bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800'
                            return 'bg-pink-100 text-pink-700 border-pink-300 dark:bg-pink-950 dark:text-pink-300 dark:border-pink-800'
                          }

                          return (
                            <button
                              key={ex.id}
                              onClick={() => router.push(`/exercises/${ex.id}`)}
                              className="w-full text-left p-3 transition-all bg-pink-50/50 dark:bg-pink-950/10 hover:bg-pink-100 dark:hover:bg-pink-950/20 border-l-4 border-transparent hover:border-pink-500"
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium bg-pink-200 dark:bg-pink-900 text-pink-700 dark:text-pink-300">
                                  <Target className="w-3 h-3" />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm font-medium truncate text-pink-700 dark:text-pink-300">
                                      {ex.title}
                                    </p>
                                    <Badge variant="outline" className={`${getExerciseTypeBadgeColor(ex.exercise_type)} text-xs`}>
                                      {getExerciseTypeLabel(ex.exercise_type)}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="text-xs text-pink-600 dark:text-pink-400 flex items-center gap-1 font-medium">
                                      <PenTool className="w-3 h-3" />
                                      {ex.total_questions} {t('questions')}
                                    </span>
                                    {ex.time_limit_minutes && (
                                      <span className="text-xs text-pink-600 dark:text-pink-400">
                                        • {ex.time_limit_minutes}{t('minutes_short')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )))}
                  
                  {/* Course-Level Exercises Section - NEW */}
                  {courseLevelExercises && courseLevelExercises.length > 0 && (
                    <div className="border-t-2 border-pink-200 dark:border-pink-800 mt-4">
                      <div className="p-4 bg-pink-50/50 dark:bg-pink-950/20">
                        <h4 className="font-semibold text-sm text-pink-700 dark:text-pink-300 flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          {t('course_exercises') || 'Course Exercises'}
                        </h4>
                        <p className="text-xs text-pink-600 dark:text-pink-400 mt-1">
                          {courseLevelExercises.length} {t('exercise_plural')} {t('for_entire_course') || 'for entire course'}
                        </p>
                      </div>
                      <div className="divide-y">
                        {courseLevelExercises.map((ex, index) => {
                          // Get exercise type label
                          const getExerciseTypeLabel = (type?: string) => {
                            if (!type) return t('practice') || 'Practice'
                            if (type === 'practice') return t('practice') || 'Practice'
                            if (type === 'mock_test') return t('mock_test') || 'Mock Test'
                            if (type === 'full_test') return t('full_test') || 'Full Test'
                            return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                          }

                          const getExerciseTypeBadgeColor = (type?: string) => {
                            if (type === 'mock_test') return 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
                            if (type === 'full_test') return 'bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800'
                            return 'bg-pink-100 text-pink-700 border-pink-300 dark:bg-pink-950 dark:text-pink-300 dark:border-pink-800'
                          }

                          return (
                            <button
                              key={ex.id}
                              onClick={() => router.push(`/exercises/${ex.id}`)}
                              className="w-full text-left p-3 transition-all bg-pink-50/50 dark:bg-pink-950/10 hover:bg-pink-100 dark:hover:bg-pink-950/20 border-l-4 border-transparent hover:border-pink-500"
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium bg-pink-200 dark:bg-pink-900 text-pink-700 dark:text-pink-300">
                                  <Target className="w-3 h-3" />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm font-medium truncate text-pink-700 dark:text-pink-300">
                                      {ex.title}
                                    </p>
                                    <Badge variant="outline" className={`${getExerciseTypeBadgeColor(ex.exercise_type)} text-xs`}>
                                      {getExerciseTypeLabel(ex.exercise_type)}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="text-xs text-pink-600 dark:text-pink-400 flex items-center gap-1 font-medium">
                                      <PenTool className="w-3 h-3" />
                                      {ex.total_questions} {t('questions')}
                                    </span>
                                    {ex.time_limit_minutes && (
                                      <span className="text-xs text-pink-600 dark:text-pink-400">
                                        • {ex.time_limit_minutes}{t('minutes_short')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    </div>
    </AppLayout>
  )
}
