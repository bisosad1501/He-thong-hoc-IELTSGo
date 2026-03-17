"use client"

import { useState, useEffect } from "react"
import type React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { BookOpen, Target, TrendingUp, Users, Award, Clock, Star, CheckCircle2, ArrowRight, PlayCircle, Quote, Zap, Globe, LayoutDashboard } from "lucide-react"
import { AppLayout } from "@/components/layout/app-layout"
import { BrandText } from "@/components/ui/brand-text"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTranslations } from "@/lib/i18n"
import { useAuth } from "@/lib/contexts/auth-context"

export default function HomePage() {
  return (
    <AppLayout showFooter={true}>
      <div className="relative min-h-screen">
        {/* Hero Section with subtle gradient */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/20 to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
          
          {/* Decorative shapes */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/30 rounded-full blur-3xl opacity-40" />
          
          <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-16 sm:py-20 lg:py-24">
              <HeroSection />
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-12 sm:-mt-16 relative z-10">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <FeatureCard
              icon={<BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />}
              titleKey="features.deepCourses.title"
              descriptionKey="features.deepCourses.description"
            />
            <FeatureCard
              icon={<Target className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />}
              titleKey="features.diversePractice.title"
              descriptionKey="features.diversePractice.description"
            />
            <FeatureCard
              icon={<TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />}
              titleKey="features.progressTracking.title"
              descriptionKey="features.progressTracking.description"
            />
            <FeatureCard
              icon={<Users className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />}
              titleKey="features.learningCommunity.title"
              descriptionKey="features.learningCommunity.description"
            />
          </div>
        </div>

        {/* Stats Section */}
        <StatsSection />

        {/* Featured Courses Section */}
        <FeaturedCoursesSection />

        {/* Recommended Courses Section */}
        <RecommendedCoursesSection />

        {/* Why Choose Section */}
        <WhyChooseSection />

        {/* Testimonials Section */}
        <TestimonialsSection />
        
        {/* CTA Section with gradient */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/90 text-primary-foreground">
          {/* Animated background elements */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-background/10 via-transparent to-transparent" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-background/10 rounded-full blur-3xl" />
          
          <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
            <div className="text-center max-w-3xl mx-auto space-y-6">
              <CTASection />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

function HeroSection() {
  const t = useTranslations('homepage')
  const tLoggedIn = useTranslations('homepage.loggedIn')
  const tCommon = useTranslations('common')
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  
  // Personalized content for logged-in users
  if (isAuthenticated && user) {
    const firstName = user.fullName?.split(" ")[0] || tCommon('student')
    
    return (
      <div className="text-center max-w-4xl mx-auto space-y-6">
        <div className="space-y-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight">
            {tLoggedIn('heroTitle')}, {firstName}! 👋
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {tLoggedIn('heroDescription')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
          <Button 
            size="lg" 
            onClick={() => router.push('/dashboard')}
            className="w-full sm:w-auto px-8 text-base sm:text-lg h-12 sm:h-14 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all duration-200 hover:shadow-xl hover:shadow-primary/30"
          >
            <LayoutDashboard className="mr-2 h-5 w-5" />
            {tLoggedIn('goToDashboard')}
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => router.push('/my-courses')}
            className="w-full sm:w-auto px-8 text-base sm:text-lg h-12 sm:h-14 border-2 hover:bg-accent/50 transition-all duration-200"
          >
            <BookOpen className="mr-2 h-5 w-5" />
            {tLoggedIn('myCourses')}
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => router.push('/exercises')}
            className="w-full sm:w-auto px-8 text-base sm:text-lg h-12 sm:h-14 border-2 hover:bg-accent/50 transition-all duration-200"
          >
            <Target className="mr-2 h-5 w-5" />
            {tLoggedIn('practiceExercises')}
          </Button>
        </div>
      </div>
    )
  }
  
  // Default content for non-authenticated users
  return (
    <div className="text-center max-w-4xl mx-auto space-y-6">
      <div className="space-y-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight">
          {t('heroTitle')}{" "}
          <BrandText className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl inline-block font-bold" />
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {t('heroDescription')}
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
        <Link href="/register" className="w-full sm:w-auto">
          <Button size="lg" className="w-full sm:w-auto px-8 text-base sm:text-lg h-12 sm:h-14 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all duration-200 hover:shadow-xl hover:shadow-primary/30">
            {t('getStarted')}
          </Button>
        </Link>
        <Link href="/login" className="w-full sm:w-auto">
          <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 text-base sm:text-lg h-12 sm:h-14 border-2 hover:bg-accent/50 transition-all duration-200">
            {t('signIn')}
          </Button>
        </Link>
      </div>
    </div>
  )
}

function CTASection() {
  const t = useTranslations('homepage')
  const tLoggedIn = useTranslations('homepage.loggedIn')
  const tCommon = useTranslations('common')
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  
  // Personalized CTA for logged-in users
  if (isAuthenticated) {
    return (
      <>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
          {tLoggedIn('ctaTitle')}
        </h2>
        <p className="text-base sm:text-lg opacity-95 leading-relaxed">
          {tLoggedIn('ctaDescription')}
        </p>
        <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            variant="secondary" 
            onClick={() => router.push('/courses')}
            className="px-8 text-base sm:text-lg h-12 sm:h-14 bg-background text-primary hover:bg-background/95 shadow-lg shadow-black/10 transition-all duration-200 hover:shadow-xl hover:scale-105"
          >
            <BookOpen className="mr-2 h-5 w-5" />
            {tLoggedIn('exploreCourses')}
          </Button>
          <Button 
            size="lg" 
            variant="secondary" 
            onClick={() => router.push('/exercises')}
            className="px-8 text-base sm:text-lg h-12 sm:h-14 bg-background text-primary hover:bg-background/95 shadow-lg shadow-black/10 transition-all duration-200 hover:shadow-xl hover:scale-105"
          >
            <Target className="mr-2 h-5 w-5" />
            {tLoggedIn('practiceExercises')}
          </Button>
        </div>
      </>
    )
  }
  
  // Default CTA for non-authenticated users
  return (
    <>
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
        {t('ctaTitle')}
      </h2>
      <p className="text-base sm:text-lg opacity-95 leading-relaxed">
        {t('ctaDescription')}
      </p>
      <div className="pt-4">
        <Link href="/register">
          <Button 
            size="lg" 
            variant="secondary" 
            className="px-8 text-base sm:text-lg h-12 sm:h-14 bg-background text-primary hover:bg-background/95 shadow-lg shadow-black/10 transition-all duration-200 hover:shadow-xl hover:scale-105"
          >
            {t('registerNow')}
          </Button>
        </Link>
      </div>
    </>
  )
}

function TestimonialsSection() {
  const t = useTranslations('homepage')
  const testimonials = [
    {
      nameKey: "testimonials.user1.name",
      roleKey: "testimonials.user1.role",
      contentKey: "testimonials.user1.content",
      rating: 5,
      avatarKey: "testimonials.user1.avatar"
    },
    {
      nameKey: "testimonials.user2.name",
      roleKey: "testimonials.user2.role",
      contentKey: "testimonials.user2.content",
      rating: 5,
      avatarKey: "testimonials.user2.avatar"
    },
    {
      nameKey: "testimonials.user3.name",
      roleKey: "testimonials.user3.role",
      contentKey: "testimonials.user3.content",
      rating: 5,
      avatarKey: "testimonials.user3.avatar"
    },
  ]

  return (
    <div className="relative bg-background overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center gap-2 mb-4">
            <Star className="w-5 h-5 text-primary fill-primary" />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
              {t('testimonials.title')}
            </h2>
            <Star className="w-5 h-5 text-primary fill-primary" />
          </div>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('testimonials.description')}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="group relative border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-5 sm:p-6">
                <div className="space-y-4">
                  {/* Quote icon */}
                  <div className="flex items-start justify-between">
                    <Quote className="w-8 h-8 text-primary/20 flex-shrink-0" />
                    <div className="flex gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-primary fill-primary" />
                      ))}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <p className="text-sm text-foreground leading-relaxed italic">
                    "{t(testimonial.contentKey)}"
                  </p>
                  
                  {/* Author */}
                  <div className="flex items-center gap-3 pt-2 border-t border-border/50">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {t(testimonial.avatarKey)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm text-foreground">{t(testimonial.nameKey)}</p>
                      <p className="text-xs text-muted-foreground">{t(testimonial.roleKey)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

function FeatureCard({
  icon,
  titleKey,
  descriptionKey,
  namespace = 'homepage',
}: {
  icon: React.ReactNode
  titleKey: string
  descriptionKey: string
  namespace?: string
}) {
  const t = useTranslations(namespace)
  return (
    <div className="group relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-6 sm:p-8 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 flex flex-col items-center text-center h-full">
      {/* Subtle gradient on hover */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-transparent group-hover:to-transparent transition-all duration-300" />
      
      <div className="relative mb-5 sm:mb-6 flex-shrink-0">
        <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors duration-300">
          {icon}
        </div>
      </div>
      <h3 className="relative text-base sm:text-lg font-semibold mb-3 text-foreground leading-tight">
        {t(titleKey)}
      </h3>
      <p className="relative text-sm text-muted-foreground leading-relaxed flex-grow">
        {t(descriptionKey)}
      </p>
    </div>
  )
}

function StatsSection() {
  const t = useTranslations('homepage')
  const stats = [
    { 
      icon: Users, 
      value: "10,000+", 
      labelKey: "stats.activeStudents",
      iconBg: "bg-blue-100 dark:bg-blue-950",
      iconColor: "text-blue-600 dark:text-blue-400"
    },
    { 
      icon: BookOpen, 
      value: "50+", 
      labelKey: "stats.qualityCourses",
      iconBg: "bg-green-100 dark:bg-green-950",
      iconColor: "text-green-600 dark:text-green-400"
    },
    { 
      icon: Target, 
      value: "500+", 
      labelKey: "stats.practiceExercises",
      iconBg: "bg-purple-100 dark:bg-purple-950",
      iconColor: "text-purple-600 dark:text-purple-400"
    },
    { 
      icon: Award, 
      value: "95%", 
      labelKey: "stats.successRate",
      iconBg: "bg-primary/10 dark:bg-primary/20",
      iconColor: "text-primary"
    },
  ]

  return (
    <div className="relative bg-gradient-to-b from-background via-accent/20 to-background overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-10 right-20 w-64 h-64 bg-primary/5 rounded-full blur-2xl" />
        <div className="absolute bottom-10 left-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      </div>
      
      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="text-center space-y-3">
              <div className="flex justify-center">
                <div className={`p-4 rounded-xl ${stat.iconBg}`}>
                  <stat.icon className={`w-8 h-8 ${stat.iconColor}`} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl sm:text-4xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{t(stat.labelKey)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function WhyChooseSection() {
  const t = useTranslations('homepage')
  const benefits = [
    {
      icon: CheckCircle2,
      titleKey: "whyChoose.internationalCurriculum.title",
      descriptionKey: "whyChoose.internationalCurriculum.description",
    },
    {
      icon: Clock,
      titleKey: "whyChoose.learnAnywhere.title",
      descriptionKey: "whyChoose.learnAnywhere.description",
    },
    {
      icon: TrendingUp,
      titleKey: "whyChoose.clearProgress.title",
      descriptionKey: "whyChoose.clearProgress.description",
    },
    {
      icon: Star,
      titleKey: "whyChoose.personalizedPath.title",
      descriptionKey: "whyChoose.personalizedPath.description",
    },
    {
      icon: PlayCircle,
      titleKey: "whyChoose.qualityVideos.title",
      descriptionKey: "whyChoose.qualityVideos.description",
    },
    {
      icon: Award,
      titleKey: "whyChoose.certificate.title",
      descriptionKey: "whyChoose.certificate.description",
    },
  ]

  return (
    <div className="relative bg-gradient-to-b from-background via-accent/20 to-background overflow-hidden">
      {/* Decorative pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>
      
      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
            {t('whyChoose.title')} <BrandText className="text-2xl sm:text-3xl md:text-4xl inline-block" />?
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('whyChoose.description')}
          </p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {benefits.map((benefit, index) => (
            <Card key={index} className="group relative border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors duration-300 flex-shrink-0">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold text-foreground">{t(benefit.titleKey)}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{t(benefit.descriptionKey)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 sm:mt-10 text-center">
          <Link href="/courses">
            <Button size="lg" variant="outline" className="group bg-background/80 backdrop-blur-sm">
              {t('whyChoose.exploreCourses')}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

function FeaturedCoursesSection() {
  const t = useTranslations('homepage')
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const { coursesApi } = await import('@/lib/api/courses')
        const response = await coursesApi.getCourses({ is_featured: true }, 1, 6)
        setCourses(response.data || [])
      } catch (error) {
        console.error('Failed to fetch featured courses:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchFeatured()
  }, [])

  if (loading || courses.length === 0) return null

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold mb-4">
          <Star className="w-4 h-4 fill-current" />
          Featured Courses
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Handpicked for Excellence</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Discover our most popular and highly-rated courses, carefully selected to help you achieve your IELTS goals.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course: any) => (
          <CourseCardComponent key={course.id} course={course} />
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link href="/courses?is_featured=true">
          <Button size="lg" variant="outline">
            View All Featured Courses
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
}

function RecommendedCoursesSection() {
  const t = useTranslations('homepage')
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecommended = async () => {
      try {
        const { coursesApi } = await import('@/lib/api/courses')
        const response = await coursesApi.getCourses({ is_recommended: true }, 1, 6)
        setCourses(response.data || [])
      } catch (error) {
        console.error('Failed to fetch recommended courses:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchRecommended()
  }, [])

  if (loading || courses.length === 0) return null

  return (
    <div className="bg-muted/30 py-16 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent-foreground font-semibold mb-4">
            <Award className="w-4 h-4" />
            Recommended for You
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Top Picks from Our Instructors</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Courses recommended by our expert instructors to maximize your learning outcomes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course: any) => (
            <CourseCardComponent key={course.id} course={course} />
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/courses">
            <Button size="lg">
              Explore All Courses
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

function CourseCardComponent({ course }: { course: any }) {
  const router = useRouter()
  return (
    <Card 
      className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
      onClick={() => router.push(`/courses/${course.id}`)}
    >
      <CardContent className="p-4">
        <div className="aspect-video bg-muted rounded-lg mb-4 overflow-hidden relative">
          {course.thumbnail_url ? (
            <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
          {course.is_featured && (
            <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full flex items-center gap-1 text-xs font-semibold">
              <Star className="w-3 h-3 fill-white" />
              Featured
            </div>
          )}
          {course.is_recommended && (
            <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-full flex items-center gap-1 text-xs font-semibold">
              <Award className="w-3 h-3" />
              Recommended
            </div>
          )}
        </div>
        <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {course.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {course.short_description || course.description}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{course.average_rating || '0.0'}</span>
          </div>
          <span className="text-sm font-medium text-primary">
            {course.enrollment_type === 'free' ? 'Free' : `${course.price} ${course.currency}`}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
