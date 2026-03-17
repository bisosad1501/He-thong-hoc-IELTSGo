"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { PageContainer } from "@/components/layout/page-container"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BookOpen, 
  FolderTree, 
  FileText, 
  Video, 
  PenTool, 
  ChevronRight,
  Database,
  Network,
  Eye
} from "lucide-react"
import { coursesApi } from "@/lib/api/courses"
import { exercisesApi } from "@/lib/api/exercises"
import { useTranslations } from '@/lib/i18n'

export default function DataModelPage() {

  const t = useTranslations('common')

  const [courseData, setCourseData] = useState<any>(null)
  const [exerciseData, setExerciseData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load sample course with full structure
      const course = await coursesApi.getCourseDetail('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
      setCourseData(course)
      
      // Load sample exercise
      const exercise = await exercisesApi.getExerciseById('11111111-1111-1111-1111-111111111111')
      setExerciseData(exercise)
    } catch (error) {
      console.error('[Data Model] Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout>
      <PageContainer maxWidth="7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Database className="h-10 w-10 text-primary" />
            Data Model Relationships
          </h1>
          <p className="text-muted-foreground text-lg">
            Visualize the complete structure of Course, Module, Lesson, Video, and Exercise relationships
          </p>
        </div>

        <Tabs defaultValue="diagram" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="diagram">
              <Network className="h-4 w-4 mr-2" />
              Diagram
            </TabsTrigger>
            <TabsTrigger value="live-data">
              <Eye className="h-4 w-4 mr-2" />
              Live Data
            </TabsTrigger>
            <TabsTrigger value="explanation">
              <FileText className="h-4 w-4 mr-2" />
              Explanation
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Diagram */}
          <TabsContent value="diagram" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('data_model_structure')}</CardTitle>
                <CardDescription>
                  Visual representation of how Course, Module, Lesson, Video, and Exercise are connected
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {/* Course Level */}
                  <div className="border-l-4 border-blue-500 pl-6">
                    <div className="flex items-center gap-3 mb-4">
                      <BookOpen className="h-8 w-8 text-blue-500" />
                      <div>
                        <h3 className="text-2xl font-bold">{t('course')}</h3>
                        <p className="text-sm text-muted-foreground">Khóa học hoàn chỉnh</p>
                      </div>
                      <Badge variant="outline" className="ml-auto">1</Badge>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                      <p className="text-sm"><strong>Example:</strong> "IELTS Listening Mastery"</p>
                      <p className="text-sm text-muted-foreground">Contains: Modules, Lessons, Videos</p>
                    </div>

                    {/* Module Level */}
                    <div className="mt-6 border-l-4 border-green-500 pl-6">
                      <div className="flex items-center gap-3 mb-4">
                        <FolderTree className="h-7 w-7 text-green-500" />
                        <div>
                          <h3 className="text-xl font-bold">{t('module')}</h3>
                          <p className="text-sm text-muted-foreground">Chương/Phần của khóa học</p>
                        </div>
                        <Badge variant="outline" className="ml-auto">{t('many')}</Badge>
                      </div>
                      <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg space-y-2">
                        <p className="text-sm"><strong>Examples:</strong></p>
                        <ul className="text-sm space-y-1 ml-4">
                          <li>• Module 1: Introduction & Basic Skills</li>
                          <li>• Module 2: Advanced Techniques</li>
                          <li>• Module 3: Full Mock Tests</li>
                        </ul>
                      </div>

                      {/* Lesson Level */}
                      <div className="mt-6 border-l-4 border-purple-500 pl-6">
                        <div className="flex items-center gap-3 mb-4">
                          <FileText className="h-6 w-6 text-purple-500" />
                          <div>
                            <h3 className="text-lg font-bold">{t('lesson')}</h3>
                            <p className="text-sm text-muted-foreground">Bài học cụ thể</p>
                          </div>
                          <Badge variant="outline" className="ml-auto">{t('many')}</Badge>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg space-y-3">
                          <p className="text-sm"><strong>Types:</strong></p>
                          
                          {/* Video Lesson */}
                          <div className="border-l-2 border-orange-400 pl-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Video className="h-5 w-5 text-orange-500" />
                              <span className="font-semibold text-sm">{t('video_lesson')}</span>
                            </div>
                            <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded text-sm">
                              <p><strong>Example:</strong> "Welcome to IELTS Listening"</p>
                              <p className="text-muted-foreground">→ Contains: YouTube videos with duration</p>
                            </div>
                          </div>

                          {/* Article Lesson */}
                          <div className="border-l-2 border-cyan-400 pl-4">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="h-5 w-5 text-cyan-500" />
                              <span className="font-semibold text-sm">{t('article_lesson')}</span>
                            </div>
                            <div className="bg-cyan-50 dark:bg-cyan-950/20 p-3 rounded text-sm">
                              <p><strong>Example:</strong> "Understanding IELTS Format"</p>
                              <p className="text-muted-foreground">→ Contains: HTML content</p>
                            </div>
                          </div>

                          {/* Exercise Lesson */}
                          <div className="border-l-2 border-pink-400 pl-4">
                            <div className="flex items-center gap-2 mb-2">
                              <PenTool className="h-5 w-5 text-pink-500" />
                              <span className="font-semibold text-sm">{t('exercise_lesson')}</span>
                            </div>
                            <div className="bg-pink-50 dark:bg-pink-950/20 p-3 rounded text-sm">
                              <p><strong>Example:</strong> "Practice Exercise: Basic Listening"</p>
                              <p className="text-muted-foreground">→ Links to: Exercise Service</p>
                              <div className="mt-2 p-2 bg-white dark:bg-gray-900 rounded border">
                                <p className="text-xs font-mono">exercise_id: 11111111-1111-1111-1111-111111111111</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Exercise Service (Separate) */}
                  <div className="border-l-4 border-red-500 pl-6">
                    <div className="flex items-center gap-3 mb-4">
                      <PenTool className="h-8 w-8 text-red-500" />
                      <div>
                        <h3 className="text-2xl font-bold">{t('exercise')}</h3>
                        <p className="text-sm text-muted-foreground">Bài tập/Đề thi (Exercise Service)</p>
                      </div>
                      <Badge variant="outline" className="ml-auto">{t('independent')}</Badge>
                    </div>
                    <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg space-y-2">
                      <p className="text-sm"><strong>Can be:</strong></p>
                      <ul className="text-sm space-y-1 ml-4">
                        <li>• <strong>Standalone:</strong> Browse at /exercises</li>
                        <li>• <strong>Linked:</strong> Referenced in lesson (content_type = "exercise")</li>
                      </ul>
                      <p className="text-sm mt-3"><strong>Structure:</strong></p>
                      <div className="ml-4 text-sm space-y-1">
                        <p>Exercise → Sections → Questions → Options</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Live Data */}
          <TabsContent value="live-data" className="space-y-6">
            {loading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">{t('loading_data')}</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Course Data */}
                {courseData && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-6 w-6 text-blue-500" />
                        Course: {courseData.course?.title}
                      </CardTitle>
                      <CardDescription>
                        ID: {courseData.course?.id}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {courseData.modules?.map((moduleData: any, moduleIndex: number) => (
                        <div key={moduleData.module?.id || moduleIndex} className="border-l-4 border-green-500 pl-4">
                          <div className="flex items-center gap-2 mb-3">
                            <FolderTree className="h-5 w-5 text-green-500" />
                            <h4 className="font-semibold">{moduleData.module?.title}</h4>
                            <Badge variant="secondary" className="ml-auto">
                              {moduleData.lessons?.length || 0} lessons
                            </Badge>
                          </div>

                          <div className="space-y-3">
                            {moduleData.lessons?.map((lesson: any, lessonIndex: number) => (
                              <div key={lesson.id || lessonIndex} className="bg-muted/50 p-3 rounded-lg">
                                <div className="flex items-start gap-3">
                                  {lesson.content_type === 'video' && <Video className="h-4 w-4 text-orange-500 mt-1" />}
                                  {lesson.content_type === 'text' && <FileText className="h-4 w-4 text-cyan-500 mt-1" />}
                                  {lesson.content_type === 'exercise' && <PenTool className="h-4 w-4 text-pink-500 mt-1" />}
                                  
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{lesson.title}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="outline" className="text-xs">
                                        {lesson.content_type}
                                      </Badge>
                                      {lesson.duration_minutes && (
                                        <span className="text-xs text-muted-foreground">
                                          {lesson.duration_minutes} min
                                        </span>
                                      )}
                                      {lesson.is_free && (
                                        <Badge variant="secondary" className="text-xs">{t('free')}</Badge>
                                      )}
                                    </div>

                                    {/* Show video info if available */}
                                    {lesson.content_type === 'video' && lesson.videos && lesson.videos.length > 0 && (
                                      <div className="mt-2 p-2 bg-background rounded border text-xs">
                                        <p className="font-mono">
                                          Video ID: {lesson.videos[0].video_id} | 
                                          Duration: {Math.floor(lesson.videos[0].duration_seconds / 60)}m {lesson.videos[0].duration_seconds % 60}s
                                        </p>
                                      </div>
                                    )}

                                    {/* Show exercise link if available */}
                                    {lesson.content_type === 'exercise' && lesson.completion_criteria?.exercise_id && (
                                      <div className="mt-2 p-2 bg-background rounded border text-xs">
                                        <p className="font-mono flex items-center gap-2">
                                          <ChevronRight className="h-3 w-3" />
                                          Linked to Exercise: {lesson.completion_criteria.exercise_id}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Exercise Data */}
                {exerciseData && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PenTool className="h-6 w-6 text-red-500" />
                        Exercise: {exerciseData.exercise?.title}
                      </CardTitle>
                      <CardDescription>
                        ID: {exerciseData.exercise?.id}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">{t('skill')}</p>
                          <Badge>{exerciseData.exercise?.skill_type}</Badge>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t('difficulty')}</p>
                          <Badge variant="outline">{exerciseData.exercise?.difficulty}</Badge>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t('sections')}</p>
                          <p className="font-semibold">{exerciseData.sections?.length || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t('questions')}</p>
                          <p className="font-semibold">{exerciseData.exercise?.total_questions || 0}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {exerciseData.sections?.map((sectionData: any, index: number) => (
                          <div key={sectionData.section?.id || index} className="border-l-4 border-purple-500 pl-4 bg-muted/30 p-3 rounded">
                            <p className="font-semibold text-sm">{sectionData.section?.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {sectionData.questions?.length || 0} questions
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Tab 3: Explanation */}
          <TabsContent value="explanation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('key_concepts')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">🎓 COURSE vs EXERCISE</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-blue-600 mb-2">{t('course')}</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Structured learning path</li>
                        <li>• Multiple modules/lessons</li>
                        <li>• Video + Article content</li>
                        <li>• Progress tracking</li>
                        <li>• Must enroll</li>
                      </ul>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-red-600 mb-2">{t('exercise')}</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Practice/Test only</li>
                        <li>• Single test/exercise</li>
                        <li>• Questions + Answers</li>
                        <li>• Score tracking</li>
                        <li>• Can do anytime (if free)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">🔗 Relationships</h3>
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
                    <p>Course (1) ──&lt; Modules (Many)</p>
                    <p>Module (1) ──&lt; Lessons (Many)</p>
                    <p>Lesson (1) ──&lt; Videos (Many) [if content_type = "video"]</p>
                    <p>Lesson (1) ──&gt; Exercise (1) [if content_type = "exercise"]</p>
                    <p>Exercise (1) ──&lt; Sections (Many)</p>
                    <p>Section (1) ──&lt; Questions (Many)</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">📊 User Journey</h3>
                  <ol className="text-sm space-y-2 ml-4">
                    <li>1. Browse Courses → Find "IELTS Listening Mastery"</li>
                    <li>2. Enroll in Course → Get access to all modules</li>
                    <li>3. Navigate Modules → See lessons organized by topic</li>
                    <li>4. Watch Video Lessons → Learn strategies</li>
                    <li>5. Read Article Lessons → Understand concepts</li>
                    <li>6. Do Exercise Lessons → Practice what you learned</li>
                    <li>7. Complete Course → Track progress</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </PageContainer>
    </AppLayout>
  )
}

