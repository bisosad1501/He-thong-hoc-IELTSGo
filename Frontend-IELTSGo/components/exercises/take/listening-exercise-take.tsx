"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, ChevronLeft, ChevronRight, Flag, Eye, EyeOff, Loader2, Play, Pause, RotateCcw, Volume2 } from "lucide-react"
import { useTranslations } from "@/lib/i18n"
import type { ExerciseSection, QuestionWithOptions } from "@/types"

interface ListeningExerciseTakeProps {
  exercise: {
    id: string
    title: string
    time_limit_minutes?: number
  }
  sections: ExerciseSection[]
  currentQuestionIndex: number
  answers: Map<string, any>
  timeRemaining: number | null
  hasTimeLimit: boolean
  answeredCount: number
  totalQuestions: number
  progress: number
  onAnswerChange: (questionId: string, answer: any) => void
  onNext: () => void
  onPrevious: () => void
  onSubmit: () => void
  submitting: boolean
}

export function ListeningExerciseTake({
  exercise,
  sections,
  currentQuestionIndex,
  answers,
  timeRemaining,
  hasTimeLimit,
  answeredCount,
  totalQuestions,
  progress,
  onAnswerChange,
  onNext,
  onPrevious,
  onSubmit,
  submitting,
}: ListeningExerciseTakeProps) {
  const t = useTranslations('exercises')
  
  // Get current question and section
  const allQuestions: (QuestionWithOptions & { sectionId: string; sectionData: any })[] =
    sections.flatMap((sectionData) =>
      (sectionData.questions || []).map((q) => ({
        ...q,
        sectionId: sectionData.section?.id || '',
        sectionData: sectionData.section
      }))
    ) || []
  const currentQuestion = allQuestions[currentQuestionIndex]
  const currentSection = currentQuestion?.sectionData
  
  // Determine audio source: prefer section audio, fallback to exercise audio
  const audioUrl = currentSection?.audio_url || exercise.audio_url
  const audioTitle = currentSection?.audio_url 
    ? `${t('audio')} - ${currentSection.title || `Section ${sections.findIndex(s => s.section?.id === currentSection.id) + 1}`}`
    : t('audio') || 'Audio'
  
  // Audio player state
  const [showSectionContent, setShowSectionContent] = useState(true)
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [audioCurrentTime, setAudioCurrentTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)
  const [audioPlayed, setAudioPlayed] = useState(false) // Track if audio has been played
  const audioRef = useRef<HTMLAudioElement>(null)
  
  // Format time
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getDisplayTime = () => {
    if (hasTimeLimit && timeRemaining !== null) {
      return formatTime(timeRemaining)
    }
    return formatTime(0)
  }

  const isTimeVeryLow = hasTimeLimit && timeRemaining !== null && timeRemaining > 0 && timeRemaining <= 60
  const isTimeRunningLow = hasTimeLimit && timeRemaining !== null && timeRemaining > 0 && timeRemaining <= 300

  // Audio controls
  const handlePlayPause = () => {
    if (audioRef.current) {
      if (audioPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
        setAudioPlayed(true)
      }
      setAudioPlaying(!audioPlaying)
    }
  }

  const handleReplay = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play()
      setAudioPlaying(true)
      setAudioPlayed(true)
    }
  }

  // Update audio time
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setAudioCurrentTime(audio.currentTime)
    const updateDuration = () => setAudioDuration(audio.duration)
    const handleEnded = () => setAudioPlaying(false)
    const handlePlay = () => setAudioPlaying(true)
    const handlePause = () => setAudioPlaying(false)

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
    }
  }, [audioUrl]) // Re-run when audio URL changes

  if (!currentQuestion) return null

  return (
    <div className="space-y-4">
      {/* Header with Timer */}
      <Card className="border-purple-200 dark:border-purple-800">
        <CardContent className="py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-semibold">{exercise.title}</h2>
              <p className="text-sm text-muted-foreground">
                {t('question_of', { current: (currentQuestionIndex + 1).toString(), total: totalQuestions.toString() })}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 ${isTimeVeryLow ? 'text-red-600 dark:text-red-400 animate-pulse' : isTimeRunningLow ? 'text-orange-600 dark:text-orange-400' : ''}`}>
                <Clock className="w-4 h-4" />
                <span className="font-mono text-lg">
                  {hasTimeLimit ? (
                    <>
                      {timeRemaining !== null && timeRemaining > 0 ? (
                        <>
                          {getDisplayTime()}
                          {isTimeVeryLow && ' ⚠️'}
                        </>
                      ) : (
                        t('time_up') || 'Hết giờ'
                      )}
                    </>
                  ) : (
                    getDisplayTime()
                  )}
                </span>
              </div>
              <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950">
                {answeredCount}/{totalQuestions} {t('answered')}
              </Badge>
            </div>
          </div>
          <Progress value={progress} className="mt-3 h-2" />
        </CardContent>
      </Card>

      {/* Audio Player Card - Always Visible for Listening */}
      {audioUrl && (
        <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                {audioTitle}
              </CardTitle>
              <div className="flex items-center gap-2">
                {audioPlayed && (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300">
                    {t('audio_note_label')} {t('audio_note')?.split('.')[0]}
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSectionContent(!showSectionContent)}
                >
                  {showSectionContent ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      {t('hide_section_content')}
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      {t('show_section_content')}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Audio Controls */}
            <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-lg border-2 border-purple-200 dark:border-purple-800">
              <audio
                ref={audioRef}
                src={audioUrl}
                className="hidden"
              />
              
              <Button
                onClick={handlePlayPause}
                size="lg"
                variant={audioPlaying ? "default" : "outline"}
                className="w-12 h-12 rounded-full"
              >
                {audioPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </Button>

              <Button
                onClick={handleReplay}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                disabled={audioPlayed}
                title={audioPlayed ? "Audio has been played (IELTS standard: play once only)" : "Replay audio from start"}
              >
                <RotateCcw className="w-4 h-4" />
                {t('replay') || 'Phát lại'}
              </Button>

              <div className="flex-1">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                  <span>{formatTime(audioCurrentTime)}</span>
                  <span>{formatTime(audioDuration)}</span>
                </div>
                <Progress 
                  value={audioDuration > 0 ? (audioCurrentTime / audioDuration) * 100 : 0} 
                  className="h-2"
                />
              </div>
            </div>

            {/* Important Note */}
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>⚠️ {t('audio_note_label')}</strong> {t('audio_note')}
              </p>
            </div>

            {/* Transcript (Collapsible) */}
            {showSectionContent && currentSection.transcript && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100 mb-2">
                  {t('view_transcript')}
                </summary>
                <div className="mt-2 p-4 bg-white dark:bg-gray-900 rounded-lg border border-purple-200 dark:border-purple-800 text-sm leading-relaxed">
                  {currentSection.transcript}
                </div>
              </details>
            )}

            {/* Instructions */}
            {showSectionContent && currentSection.instructions && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                  📋 {t('instructions')}:
                </p>
                <div
                  className="prose prose-sm max-w-none text-blue-800 dark:text-blue-200"
                  dangerouslySetInnerHTML={{ __html: currentSection.instructions }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Question Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            {t('question')} {currentQuestion.question.question_number}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Question Text */}
          <div className="text-lg font-medium">{currentQuestion.question.question_text}</div>

          {/* Context */}
          {currentQuestion.question.context_text && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">{currentQuestion.question.context_text}</p>
            </div>
          )}

          {/* Answer Input */}
          <div className="mt-6">
            {currentQuestion.question.question_type === "multiple_choice" ? (
              <div className="space-y-3">
                {currentQuestion.options?.map((option) => (
                  <label
                    key={option.id}
                    className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      answers.get(currentQuestion.question.id) === option.id
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-950"
                        : "border-border hover:border-purple-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion.question.id}`}
                      value={option.id}
                      checked={answers.get(currentQuestion.question.id) === option.id}
                      onChange={(e) =>
                        onAnswerChange(currentQuestion.question.id, e.target.value)
                      }
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <span className="font-medium mr-2">{option.option_label}.</span>
                      <span>{option.option_text}</span>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <input
                type="text"
                value={answers.get(currentQuestion.question.id) || ""}
                onChange={(e) =>
                  onAnswerChange(currentQuestion.question.id, e.target.value)
                }
                placeholder={t('type_your_answer_here')}
                className="w-full p-3 border-2 rounded-lg focus:border-purple-500 outline-none"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button onClick={onPrevious} disabled={currentQuestionIndex === 0} variant="outline">
          <ChevronLeft className="w-4 h-4 mr-2" />
          {t('previous')}
        </Button>

        {currentQuestionIndex === allQuestions.length - 1 ? (
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('submitting')}
              </>
            ) : (
              <>
                <Flag className="w-4 h-4 mr-2" />
                {t('submit_exercise')}
              </>
            )}
          </Button>
        ) : (
          <Button onClick={onNext}>
            {t('next')}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  )
}

