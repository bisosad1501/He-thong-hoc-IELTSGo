"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Headphones, FileAudio, Clock, BookOpen, FileText } from "lucide-react"
import { useTranslations } from "@/lib/i18n"

interface ListeningExerciseDetailProps {
  exercise: {
    audio_url?: string
    audio_duration_seconds?: number
    audio_transcript?: string
    total_sections?: number
    time_limit_minutes?: number
  }
  sections?: Array<{
    section?: {
      id: string
      title?: string
      description?: string
      total_questions?: number
      audio_url?: string
    }
  }>
}

export function ListeningExerciseDetail({ exercise, sections = [] }: ListeningExerciseDetailProps) {
  const t = useTranslations('exercises')
  const totalQuestions = sections.reduce((sum, s) => sum + (s.section?.total_questions || 0), 0)
  const [detectedDuration, setDetectedDuration] = useState<number | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)

  // Auto-detect audio duration if not provided by backend
  useEffect(() => {
    if (!exercise.audio_url) return
    
    // If duration already provided and valid, don't detect
    if (exercise.audio_duration_seconds && exercise.audio_duration_seconds > 0) {
      return
    }

    setIsDetecting(true)
    const audio = new Audio(exercise.audio_url)
    
    audio.addEventListener('loadedmetadata', () => {
      const duration = Math.floor(audio.duration)
      if (duration > 0) {
        setDetectedDuration(duration)
      }
      setIsDetecting(false)
    })

    audio.addEventListener('error', () => {
      setIsDetecting(false)
    })

    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [exercise.audio_url, exercise.audio_duration_seconds])

  const displayDuration = exercise.audio_duration_seconds || detectedDuration

  return (
    <div className="space-y-6">
      {/* Audio Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Headphones className="w-5 h-5" />
            {t('audio_info')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{t('listening_duration')}</p>
                <p className="font-medium">
                  {isDetecting ? (
                    <span className="text-xs text-muted-foreground animate-pulse">
                      {t('detecting') || 'Detecting...'}
                    </span>
                  ) : displayDuration ? (
                    `${Math.floor(displayDuration / 60)} ${t('minutes')} ${displayDuration % 60} ${t('seconds')}`
                  ) : (
                    t('not_available')
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <FileAudio className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{t('total_test_time')}</p>
                <p className="font-medium">{exercise.time_limit_minutes || 30} {t('minutes')}</p>
              </div>
            </div>
          </div>

          {/* Audio Player Preview */}
          {exercise.audio_url && (
            <div className="pt-3 border-t">
              <p className="text-sm font-medium mb-2">{t('preview_audio') || 'Preview Audio'}</p>
              <audio 
                src={exercise.audio_url} 
                controls 
                className="w-full"
                preload="metadata"
              />
            </div>
          )}

          <div className="pt-3 border-t">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950">
              <Headphones className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>{t('audio_note_label')}</strong> {t('audio_note')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sections Structure */}
      {sections && sections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('listening_structure')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sections.map((sectionData, index) => {
                const section = sectionData.section
                return (
                  <div 
                    key={section?.id || index}
                    className="p-4 rounded-lg border hover:bg-muted/50 transition-colors space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{section?.title || `${t('part')} ${index + 1}`}</h4>
                          {section?.description && (
                            <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <FileAudio className="w-4 h-4" />
                          <span>{section?.total_questions || 0} {t('questions')}</span>
                        </div>
                      </div>
                    </div>
                    {/* Section Audio Player */}
                    {section?.audio_url && (
                      <div className="pl-13">
                        <p className="text-xs text-muted-foreground mb-1">
                          {t('section_audio') || 'Section Audio'}:
                        </p>
                        <audio 
                          src={section.audio_url} 
                          controls 
                          className="w-full h-8"
                          preload="metadata"
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Question Types Info */}
      <Card className="border-l-4 border-l-blue-500 bg-blue-50/30 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="text-base">📝 {t('common_question_types')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2"><span className="text-primary">•</span> {t('listening_question_type_mc')}</li>
            <li className="flex gap-2"><span className="text-primary">•</span> {t('listening_question_type_form')}</li>
            <li className="flex gap-2"><span className="text-primary">•</span> {t('listening_question_type_sentence')}</li>
            <li className="flex gap-2"><span className="text-primary">•</span> {t('listening_question_type_matching')}</li>
            <li className="flex gap-2"><span className="text-primary">•</span> {t('listening_question_type_map')}</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
