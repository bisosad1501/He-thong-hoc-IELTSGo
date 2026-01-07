"use client"

import { Clock, Target, TrendingUp, Award, BookOpen } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { HorizontalCardLayout } from "@/components/cards/base-card-layout"
import type { Exercise, Submission } from "@/types"
import { useTranslations } from '@/lib/i18n'

interface ExerciseSubmissionCardProps {
  exercise: Exercise
  submission: Submission
}

function formatScore(score: number): string {
  return `${Math.round(score * 10) / 10}%`
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}

export function ExerciseSubmissionCard({ exercise, submission }: ExerciseSubmissionCardProps) {
  const t = useTranslations('common')
  
  // Support both snake_case (backend) and camelCase (legacy)
  const skillType = exercise.skill_type || exercise.skillType || 'reading'
  const progressPct = submission.total_questions > 0
    ? Math.round((submission.questions_answered / submission.total_questions) * 100)
    : 0
  
  const statusColor = submission.status === 'completed' 
    ? 'bg-green-500' 
    : submission.status === 'in_progress'
    ? 'bg-orange-500'
    : 'bg-gray-500'
  
  // Skill color mapping
  const skillColors: Record<string, string> = {
    listening: "bg-blue-500",
    reading: "bg-green-500",
    writing: "bg-orange-500",
    speaking: "bg-purple-500",
    general: "bg-gray-500",
  }

  // Determine action button
  const actionHref = submission.status === 'completed' 
    ? `/exercises/${exercise.id}/result/${submission.id}`
    : `/exercises/${exercise.id}/take/${submission.id}`
  
  const actionLabel = submission.status === 'completed' 
    ? t('view_results') 
    : t('continue_practice')

  return (
    <HorizontalCardLayout
      variant="interactive"
      onClick={() => {
        if (typeof window !== 'undefined') {
          window.location.href = actionHref
        }
      }}
      thumbnail={{
        src: exercise.thumbnail_url || undefined,
        alt: exercise.title,
        placeholder: {
          icon: BookOpen,
        }
      }}
      title={exercise.title}
      description={exercise.description || null}
      badges={
        <>
          <Badge className={skillColors[skillType.toLowerCase()] || skillColors.general} aria-label={t(skillType.toLowerCase() || 'reading')}>
            {t(skillType.toLowerCase() || 'reading').toUpperCase()}
          </Badge>
          <Badge className={statusColor}>
            {submission.status === 'completed' 
              ? t('completed') 
              : submission.status === 'in_progress'
              ? t('in_progress')
              : t('not_started')}
          </Badge>
        </>
      }
      stats={
        <>
          {submission.status === 'completed' && submission.score !== undefined && (
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-green-600" aria-hidden="true" />
              <span className="font-semibold text-foreground">
                {t('score_label')} {formatScore(submission.score)}
              </span>
            </div>
          )}
          {submission.status === 'completed' && submission.band_score && (
            <div className="flex items-center gap-1.5">
              <Award className="h-4 w-4 text-yellow-600" aria-hidden="true" />
              <span className="font-semibold text-foreground">
                {t('band_label')} {submission.band_score.toFixed(1)}
              </span>
            </div>
          )}
          {/* Only show questions for Reading/Listening */}
          {(skillType.toLowerCase() === 'reading' || skillType.toLowerCase() === 'listening') && (
            <div className="flex items-center gap-1.5">
              <Target className="h-4 w-4 text-blue-600" aria-hidden="true" />
              <span className="font-medium">
                {submission.questions_answered || 0}/{submission.total_questions || 0} {t('questions')}
              </span>
            </div>
          )}
          {/* Show word count for Writing */}
          {skillType.toLowerCase() === 'writing' && submission.word_count && submission.word_count > 0 && (
            <div className="flex items-center gap-1.5">
              <Target className="h-4 w-4 text-orange-600" aria-hidden="true" />
              <span className="font-medium">
                {submission.word_count} {t('words_written')}
              </span>
            </div>
          )}
          {/* Show duration for Speaking */}
          {skillType.toLowerCase() === 'speaking' && submission.audio_duration_seconds && submission.audio_duration_seconds > 0 && (
            <div className="flex items-center gap-1.5">
              <Target className="h-4 w-4 text-purple-600" aria-hidden="true" />
              <span className="font-medium">
                {Math.floor(submission.audio_duration_seconds / 60)}:{String(submission.audio_duration_seconds % 60).padStart(2, '0')} {t('speaking_duration')}
              </span>
            </div>
          )}
          {/* Show time spent */}
          {submission.time_spent_seconds !== undefined && submission.time_spent_seconds > 0 && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="font-medium">
                {t('time_spent')}: {formatTime(submission.time_spent_seconds)}
              </span>
            </div>
          )}
        </>
      }
      progress={submission.status !== 'completed' && submission.total_questions > 0 ? {
        value: progressPct,
        label: t('progress'),
      } : undefined}
      action={{
        label: actionLabel,
        onClick: (e) => {
          e.stopPropagation()
          if (typeof window !== 'undefined') {
            window.location.href = actionHref
          }
        },
        variant: submission.status === 'completed' ? 'outline' : 'default',
        href: actionHref,
      }}
    />
  )
}

