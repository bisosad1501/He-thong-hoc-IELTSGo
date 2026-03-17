"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, Mic, Play, Pause, Upload, Trash2, AlertCircle, Info, MessageSquare, ListChecks, HelpCircle, Eye, EyeOff } from "lucide-react"
import { useTranslations } from "@/lib/i18n"

// Validation constants
const MAX_AUDIO_FILE_SIZE_MB = 50
const MAX_AUDIO_FILE_SIZE_BYTES = 50 * 1024 * 1024
const MAX_AUDIO_DURATION_SECONDS = 300 // 5 minutes
const ALLOWED_EXTENSIONS = [".mp3", ".wav", ".m4a", ".ogg"]

// Part-specific constants
const PREPARATION_TIME_SECONDS = 60 // 1 minute for Part 2
const RECOMMENDED_SPEAKING_TIME_SECONDS = 120 // 2 minutes for Part 2

interface SpeakingExerciseTakeProps {
  exercise: {
    id: string
    title: string
    time_limit_minutes?: number
    speaking_part_number?: number
    speaking_prompt_text?: string
    speaking_cue_card_topic?: string
    speaking_cue_card_points?: string[]
    speaking_follow_up_questions?: string[]
    speaking_preparation_time_seconds?: number
    speaking_response_time_seconds?: number
  }
  partNumber: 1 | 2 | 3
  prompt: string
  cueCardPoints?: string[]
  followUpQuestions?: string[]
  timeRemaining: number | null
  hasTimeLimit: boolean
  timeSpent: number
  audioFile: File | null
  audioDuration: number
  onFileChange: (file: File | null, duration: number) => void
  onSubmit: () => void
  submitting: boolean
}

export function SpeakingExerciseTake({
  exercise,
  partNumber,
  prompt,
  cueCardPoints = [],
  followUpQuestions = [],
  timeRemaining,
  hasTimeLimit,
  timeSpent,
  audioFile,
  audioDuration,
  onFileChange,
  onSubmit,
  submitting,
}: SpeakingExerciseTakeProps) {
  const t = useTranslations('exercises')
  const tAI = useTranslations('ai')
  
  const [recording, setRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [preparationTime, setPreparationTime] = useState(0)
  const [isPreparationPhase, setIsPreparationPhase] = useState(false)
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const [errors, setErrors] = useState<{ audio?: string }>({})
  const [showPrompt, setShowPrompt] = useState(true)
  const [showCueCard, setShowCueCard] = useState(true)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const preparationTimerRef = useRef<NodeJS.Timeout | null>(null)

  const isPart2 = partNumber === 2
  const isPart3 = partNumber === 3

  // Format time
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getDisplayTime = () => {
    if (hasTimeLimit && timeRemaining !== null) {
      return formatTime(timeRemaining)
    }
    return formatTime(timeSpent)
  }

  const isTimeVeryLow = hasTimeLimit && timeRemaining !== null && timeRemaining > 0 && timeRemaining <= 60
  const isTimeRunningLow = hasTimeLimit && timeRemaining !== null && timeRemaining > 0 && timeRemaining <= 300

  // Preparation timer for Part 2
  useEffect(() => {
    if (isPart2 && isPreparationPhase) {
      preparationTimerRef.current = setInterval(() => {
        setPreparationTime((prev) => {
          if (prev >= PREPARATION_TIME_SECONDS) {
            setIsPreparationPhase(false)
            if (preparationTimerRef.current) {
              clearInterval(preparationTimerRef.current)
            }
            return PREPARATION_TIME_SECONDS
          }
          return prev + 1
        })
      }, 1000)
    }

    return () => {
      if (preparationTimerRef.current) {
        clearInterval(preparationTimerRef.current)
      }
    }
  }, [isPart2, isPreparationPhase])

  // Recording timer
  useEffect(() => {
    if (recording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
    }
  }, [recording])

  const validateAudioFile = (file: File): boolean => {
    const newErrors: typeof errors = {}

    if (file.size > MAX_AUDIO_FILE_SIZE_BYTES) {
      newErrors.audio =
        tAI("audio_file_too_large") ||
        `Audio file size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds maximum (${MAX_AUDIO_FILE_SIZE_MB} MB)`
      setErrors(newErrors)
      return false
    }

    const ext = "." + file.name.split(".").pop()?.toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      newErrors.audio =
        tAI("audio_format_not_supported") ||
        `File format not supported. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`
      setErrors(newErrors)
      return false
    }

    setErrors({})
    return true
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!validateAudioFile(file)) return

    if (audioURL) {
      URL.revokeObjectURL(audioURL)
    }
    const url = URL.createObjectURL(file)
    setAudioURL(url)

    const audio = new Audio(url)
    audio.addEventListener("loadedmetadata", () => {
      const dur = Math.floor(audio.duration)
      onFileChange(file, dur)
      if (dur > MAX_AUDIO_DURATION_SECONDS) {
        setErrors({
          audio:
            tAI("audio_duration_too_long") ||
            `Audio duration (${dur}s) exceeds maximum (${MAX_AUDIO_DURATION_SECONDS}s)`,
        })
      }
    })
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      setRecordingTime(0)

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        const audioUrl = URL.createObjectURL(audioBlob)
        setAudioURL(audioUrl)

        const file = new File([audioBlob], "recording.webm", { type: "audio/webm" })
        onFileChange(file, recordingTime)

        const audio = new Audio(audioUrl)
        audio.addEventListener("loadedmetadata", () => {
          const dur = Math.floor(audio.duration)
          onFileChange(file, dur)
        })

        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setRecording(true)
    } catch (error) {
      console.error("Failed to start recording:", error)
      setErrors({
        audio: tAI("failed_to_start_recording") || "Failed to start recording. Please check microphone permissions.",
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop()
      setRecording(false)
    }
  }

  const removeAudio = () => {
    if (audioURL) {
      URL.revokeObjectURL(audioURL)
    }
    setAudioURL(null)
    onFileChange(null, 0)
    setRecordingTime(0)
    setErrors({})
  }

  const startPreparation = () => {
    setIsPreparationPhase(true)
    setPreparationTime(0)
  }

  const partConfig = {
    1: {
      title: t('speaking_part_1'),
      description: t('speaking_part_1_desc'),
      color: "bg-blue-500",
      icon: MessageSquare
    },
    2: {
      title: t('speaking_part_2'),
      description: t('speaking_part_2_desc'),
      color: "bg-purple-500",
      icon: ListChecks
    },
    3: {
      title: t('speaking_part_3'),
      description: t('speaking_part_3_desc'),
      color: "bg-orange-500",
      icon: HelpCircle
    }
  }

  const config = partConfig[partNumber]
  const Icon = config.icon

  return (
    <div className="space-y-4">
      {/* Header with Timer */}
      <Card className={
        partNumber === 1 ? 'border-blue-200 dark:border-blue-800' :
        partNumber === 2 ? 'border-purple-200 dark:border-purple-800' :
        'border-orange-200 dark:border-orange-800'
      }>
        <CardContent className="py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-semibold">{exercise.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={
                  partNumber === 1 ? 'bg-blue-50 dark:bg-blue-950' :
                  partNumber === 2 ? 'bg-purple-50 dark:bg-purple-950' :
                  'bg-orange-50 dark:bg-orange-950'
                }>
                  {config.title}
                </Badge>
              </div>
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preparation Phase for Part 2 */}
      {isPart2 && isPreparationPhase && (
        <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
          <CardContent className="py-8 text-center">
            <div className="space-y-4">
              <Icon className="w-16 h-16 mx-auto text-purple-600 dark:text-purple-400" />
              <h3 className="text-2xl font-bold">{t('preparation_time')}</h3>
              <div className="text-4xl font-mono font-bold text-purple-600 dark:text-purple-400">
                {formatTime(PREPARATION_TIME_SECONDS - preparationTime)}
              </div>
              <p className="text-sm text-muted-foreground">
                {t('preparation_time_desc') || 'Sử dụng thời gian này để chuẩn bị ý tưởng cho bài nói'}
              </p>
              <Progress 
                value={(preparationTime / PREPARATION_TIME_SECONDS) * 100} 
                className="h-2 max-w-md mx-auto"
              />
              {preparationTime >= PREPARATION_TIME_SECONDS && (
                <Button onClick={() => setIsPreparationPhase(false)} size="lg" className="mt-4">
                  {t('start_speaking') || 'Bắt đầu nói'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Split Layout: Prompt/Cues (Left) + Recorder (Right) */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Left Side: Prompt, Cue Card, Follow-up Questions */}
        <div className="space-y-4">
          {/* Prompt Card - Sticky */}
          <div className="lg:sticky lg:top-4">
            <Card className={
              partNumber === 1 ? 'border-blue-200 dark:border-blue-800' :
              partNumber === 2 ? 'border-purple-200 dark:border-purple-800' :
              'border-orange-200 dark:border-orange-800'
            }>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${
                      partNumber === 1 ? 'text-blue-600 dark:text-blue-400' :
                      partNumber === 2 ? 'text-purple-600 dark:text-purple-400' :
                      'text-orange-600 dark:text-orange-400'
                    }`} />
                    {partNumber === 1 && t('discussion_questions')}
                    {partNumber === 2 && t('cue_card_topic')}
                    {partNumber === 3 && t('in_depth_questions')}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPrompt(!showPrompt)}
                    className="lg:hidden"
                  >
                    {showPrompt ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <CardDescription>{config.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {showPrompt && (
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{prompt}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Cue Card Points for Part 2 */}
          {isPart2 && cueCardPoints && cueCardPoints.length > 0 && (
            <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    {t('points_to_cover')}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCueCard(!showCueCard)}
                  >
                    {showCueCard ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showCueCard && (
                  <div className="space-y-2">
                    {cueCardPoints.map((point, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg border bg-white dark:bg-gray-900">
                        <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                          {index + 1}
                        </div>
                        <p className="text-sm">{point}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Follow-up Questions for Part 3 */}
          {isPart3 && followUpQuestions && followUpQuestions.length > 0 && (
            <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  {t('follow_up_questions')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {followUpQuestions.map((question, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg border bg-white dark:bg-gray-900">
                      <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                        {index + 1}
                      </div>
                      <p className="text-sm">{question}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Side: Audio Recorder */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="w-5 h-5" />
                {tAI("record_or_upload_audio") || "Record or Upload Audio"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {errors.audio && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.audio}</AlertDescription>
                </Alert>
              )}

              {/* Preparation Button for Part 2 */}
              {isPart2 && !isPreparationPhase && !audioFile && !recording && (
                <Button
                  onClick={startPreparation}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  {t('start_preparation') || 'Bắt đầu chuẩn bị (1 phút)'}
                </Button>
              )}

              {audioURL ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {tAI("audio_ready") || "Audio ready"}
                      </span>
                      {audioDuration > 0 && (
                        <Badge variant="outline">
                          {formatTime(audioDuration)}
                        </Badge>
                      )}
                    </div>
                    <Button variant="outline" size="sm" onClick={removeAudio}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      {tAI("remove") || "Remove"}
                    </Button>
                  </div>
                  <audio src={audioURL} controls className="w-full" />
                  
                  {/* Recording Time Display */}
                  {recordingTime > 0 && (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        {t('recording_duration') || 'Recording duration'}: {formatTime(recordingTime)}
                      </p>
                      {isPart2 && (
                        <Progress 
                          value={(recordingTime / RECOMMENDED_SPEAKING_TIME_SECONDS) * 100} 
                          className="h-2 mt-2"
                        />
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <Button
                      onClick={recording ? stopRecording : startRecording}
                      variant={recording ? "destructive" : "default"}
                      className="flex-1"
                      size="lg"
                      disabled={isPart2 && isPreparationPhase}
                    >
                      {recording ? (
                        <>
                          <Pause className="w-4 h-4 mr-2" />
                          {tAI("stop_recording") || "Stop Recording"}
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4 mr-2" />
                          {tAI("start_recording") || "Start Recording"}
                        </>
                      )}
                    </Button>
                    <Button variant="outline" asChild className="flex-1" size="lg">
                      <label>
                        <Upload className="w-4 h-4 mr-2" />
                        {tAI("upload_file") || "Upload File"}
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                    </Button>
                  </div>

                  {/* Recording Timer */}
                  {recording && (
                    <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg border-2 border-red-200 dark:border-red-800">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-sm font-medium">{t('recording') || 'Recording...'}</span>
                      </div>
                      <div className="text-3xl font-mono font-bold text-red-600 dark:text-red-400">
                        {formatTime(recordingTime)}
                      </div>
                    </div>
                  )}

                  {/* Tips */}
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>
                          {tAI("tip_speak_clearly") ||
                            "Speak clearly and at a moderate pace"}
                        </li>
                        {isPart2 && (
                          <li>
                            {t('speaking_tip_part2_3') || "Nói đủ 2 phút, không nên dừng quá sớm"}
                          </li>
                        )}
                        <li>
                          {tAI("tip_max_duration")
                            ?.replace('{maxMinutes}', (MAX_AUDIO_DURATION_SECONDS / 60).toString()) ||
                            `Maximum duration: ${MAX_AUDIO_DURATION_SECONDS / 60} minutes`}
                        </li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {submitting && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <AlertCircle className="w-4 h-4 animate-spin" />
                      <span>{tAI('submitting') || "Đang nộp bài và đánh giá AI..."}</span>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {tAI('tip_speak_clearly') || "Đảm bảo đã ghi âm hoặc tải lên file audio"}
                  </p>
                </div>
                <Button
                  onClick={onSubmit}
                  disabled={submitting || !audioFile || (isPart2 && isPreparationPhase)}
                  size="lg"
                  className="ml-4"
                >
                  {submitting ? (
                    <>
                      <AlertCircle className="w-4 h-4 mr-2 animate-spin" />
                      {tAI('submitting') || "Đang nộp..."}
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      {tAI('submit_for_evaluation') || "Nộp để đánh giá"}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

