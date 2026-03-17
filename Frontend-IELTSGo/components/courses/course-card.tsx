"use client"

import React from "react"
import { Clock, Users, Star, BookOpen, GraduationCap, Award } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { VerticalCardLayout } from "@/components/cards/base-card-layout"
import type { Course } from "@/types"
import { formatCourseDuration, formatNumber } from "@/lib/utils/format"
import { useTranslations } from '@/lib/i18n'
import { cn } from "@/lib/utils"

interface CourseCardProps {
  course: Course
  showProgress?: boolean
  progress?: number
  priority?: boolean // For above-fold images
}

function CourseCardComponent({ course, showProgress, progress, priority = false }: CourseCardProps) {
  const t = useTranslations('common')
  const tCourses = useTranslations('courses')

  // Skill and level color mappings
  const skillColors: Record<string, string> = {
    listening: "bg-blue-500",
    reading: "bg-green-500",
    writing: "bg-orange-500",
    speaking: "bg-purple-500",
    general: "bg-gray-500",
  }

  const levelColors: Record<string, string> = {
    beginner: "bg-emerald-500",
    intermediate: "bg-yellow-500",
    advanced: "bg-red-500",
  }

  // Extract course data with fallbacks
  const skillType = course.skill_type || course.skillType || 'general'
  const level = course.level || 'beginner'
  const thumbnail = course.thumbnail_url || course.thumbnail
  const enrollmentType = course.enrollment_type || course.enrollmentType
  const instructorName = course.instructor_name
  const averageRating = course.average_rating || course.rating || 0
  const totalReviews = course.total_reviews || course.reviewCount || 0
  const totalEnrollments = course.total_enrollments || course.enrollmentCount || 0
  const totalLessons = course.total_lessons || course.lessonCount || 0
  const durationHours = course.duration_hours || course.duration || 0

  // Build image overlay with badges
  const imageOverlay = (
    <>
      <div className="absolute top-3 left-3 flex gap-2">
        <Badge 
          className={skillColors[skillType.toLowerCase()] || skillColors.general}
          aria-label={t(skillType.toLowerCase() || 'general')}
        >
          {t(skillType.toLowerCase() || 'general').toUpperCase()}
        </Badge>
        <Badge 
          className={levelColors[level.toLowerCase()] || levelColors.beginner} 
          variant="secondary"
          aria-label={t(level.toLowerCase() || 'beginner')}
        >
          {t(level.toLowerCase() || 'beginner').toUpperCase()}
        </Badge>
        {course.is_featured && (
          <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
            <Star className="w-3 h-3 mr-1 fill-white" />
            Featured
          </Badge>
        )}
        {course.is_recommended && (
          <Badge className="bg-blue-500 hover:bg-blue-600 text-white">
            <Award className="w-3 h-3 mr-1" />
            Recommended
          </Badge>
        )}
      </div>
      {(enrollmentType === "premium" || enrollmentType === "PAID") && course.price > 0 && (
        <div 
          className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full"
          aria-label={t('price') || 'Price'}
        >
          <span className="font-bold text-primary">${course.price}</span>
        </div>
      )}
    </>
  )

  // Build content section with stats
  const contentSection = (
    <>
      {/* Instructor */}
      {instructorName && (
        <div className="flex items-center gap-2 mb-3" aria-label={t('instructor') || 'Instructor'}>
          <GraduationCap className="w-4 h-4 text-purple-600" aria-hidden="true" />
          <span className="text-sm text-muted-foreground">{instructorName}</span>
        </div>
      )}

      {/* Rating and Enrollments */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground" role="group" aria-label={t('course_statistics') || 'Course statistics'}>
        <div className="flex items-center gap-1">
          <Star 
            className="w-4 h-4 fill-yellow-400 text-yellow-400" 
            aria-hidden="true"
          />
          <span className="font-medium" aria-label={t('rating') || 'Rating'}>
            {averageRating.toFixed(1)}
          </span>
          <span className="sr-only">{t('out_of') || 'out of'} 5</span>
          <span>({formatNumber(totalReviews)})</span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4" aria-hidden="true" />
          <span aria-label={t('total_enrollments') || 'Total enrollments'}>
            {formatNumber(totalEnrollments)}
          </span>
        </div>
      </div>

      {/* Lessons and Duration */}
      <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground" role="group" aria-label={t('course_details') || 'Course details'}>
        <div className="flex items-center gap-1">
          <BookOpen className="w-4 h-4 text-blue-600" aria-hidden="true" />
          <span>
            {totalLessons} {tCourses('lessons')}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <span>
            {formatCourseDuration(durationHours)}
          </span>
        </div>
      </div>
    </>
  )

  return (
    <VerticalCardLayout
      variant="interactive"
      image={{
        src: thumbnail || undefined,
        alt: course.title,
        priority,
        overlay: imageOverlay,
        placeholder: {
          icon: BookOpen,
        }
      }}
      title={course.title}
      titleHref={`/courses/${course.id}`}
      description={course.short_description || course.description || null}
      content={contentSection}
      footer={{
        action: showProgress ? t('continue_learning') : t('view_course'),
        href: `/courses/${course.id}`,
      }}
      progress={showProgress && progress !== undefined ? {
        value: progress,
        label: t('progress'),
      } : undefined}
      onClick={() => {
        // Optional: Allow clicking entire card to navigate
        if (typeof window !== 'undefined') {
          window.location.href = `/courses/${course.id}`
        }
      }}
    />
  )
}

export const CourseCard = React.memo(CourseCardComponent)
