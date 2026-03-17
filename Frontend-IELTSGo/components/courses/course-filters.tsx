"use client"

import { useState, useEffect } from "react"
import { useDebounce } from "@/lib/hooks/use-debounce"
import { Search, X, Filter, Gift, Crown, Star, Check, ArrowUpDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { CourseFilters } from "@/lib/api/courses"
import { useTranslations } from '@/lib/i18n'

interface CourseFiltersProps {
  filters: CourseFilters
  onFiltersChange: (filters: CourseFilters) => void
  onSearch: (search: string) => void
}

// SKILL_OPTIONS và LEVEL_OPTIONS sẽ được translate trong component
const SKILL_OPTIONS = [
  { value: "listening", color: "bg-blue-500" },
  { value: "reading", color: "bg-green-500" },
  { value: "writing", color: "bg-orange-500" },
  { value: "speaking", color: "bg-purple-500" },
  { value: "general", color: "bg-gray-500" },
]

const LEVEL_OPTIONS = [
  { value: "beginner", color: "bg-emerald-500" },
  { value: "intermediate", color: "bg-yellow-500" },
  { value: "advanced", color: "bg-red-500" },
]

const ENROLLMENT_TYPE_OPTIONS = [
  { value: "free", label: "Free", icon: Gift },
  { value: "premium", label: "Premium", icon: Crown },
]

const SPECIAL_OPTIONS = [
  { value: "featured", label: "Featured", icon: Star },
]

export function CourseFiltersComponent({ filters, onFiltersChange, onSearch }: CourseFiltersProps) {

  const t = useTranslations('common')

  const [searchValue, setSearchValue] = useState(filters.search || "")
  const [isOpen, setIsOpen] = useState(false)
  
  // Debounce search input to reduce API calls
  const debouncedSearch = useDebounce(searchValue, 500)

  // Sync searchValue when filters.search changes externally
  useEffect(() => {
    setSearchValue(filters.search || "")
  }, [filters.search])

  // Auto-search when debounced value changes (after 500ms of no typing)
  useEffect(() => {
    if (debouncedSearch !== (filters.search || "")) {
      onSearch(debouncedSearch)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]) // Only depend on debouncedSearch to avoid infinite loop

  const handleSkillChange = (skill: string) => {
    const currentSkills = Array.isArray(filters.skill_type) ? filters.skill_type : (filters.skill_type ? [filters.skill_type] : [])
    const newSkills = currentSkills.includes(skill)
      ? currentSkills.filter((s) => s !== skill)
      : [...currentSkills, skill]
    onFiltersChange({ ...filters, skill_type: newSkills.length > 0 ? (newSkills.length === 1 ? newSkills[0] : newSkills) : undefined })
  }

  const handleLevelChange = (level: string) => {
    const currentLevels = Array.isArray(filters.level) ? filters.level : (filters.level ? [filters.level] : [])
    const newLevels = currentLevels.includes(level)
      ? currentLevels.filter((l) => l !== level)
      : [...currentLevels, level]
    onFiltersChange({ ...filters, level: newLevels.length > 0 ? (newLevels.length === 1 ? newLevels[0] : newLevels) : undefined })
  }
  
  const handleEnrollmentTypeChange = (type: string) => {
    const currentTypes = Array.isArray(filters.enrollment_type) ? filters.enrollment_type : (filters.enrollment_type ? [filters.enrollment_type] : [])
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter((t) => t !== type)
      : [...currentTypes, type]
    onFiltersChange({ ...filters, enrollment_type: newTypes.length > 0 ? (newTypes.length === 1 ? newTypes[0] : newTypes) : undefined })
  }

  const handleFeaturedToggle = () => {
    onFiltersChange({ ...filters, is_featured: filters.is_featured ? undefined : true })
  }

  const handleClearFilters = () => {
    // Clear search first
    setSearchValue("")
    onSearch("")
    // Then clear all other filters - explicitly set all fields to undefined
    onFiltersChange({
      search: undefined,
      skill_type: undefined,
      level: undefined,
      enrollment_type: undefined,
      is_featured: undefined,
      sort: undefined,
      sort_order: undefined,
    })
    // Close sheet if open
    if (isOpen) {
      setIsOpen(false)
    }
  }

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    (Array.isArray(filters.skill_type) ? filters.skill_type.length : (filters.skill_type ? 1 : 0)) + 
    (Array.isArray(filters.level) ? filters.level.length : (filters.level ? 1 : 0)) + 
    (Array.isArray(filters.enrollment_type) ? filters.enrollment_type.length : (filters.enrollment_type ? 1 : 0)) + 
    (filters.is_featured ? 1 : 0)

  return (
    <div className="space-y-5">
      {/* Quick Sort Bar - Always visible for easy access */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <ArrowUpDown className="w-4 h-4" />
          <span>{t('sort_by')}:</span>
        </div>
        <div className="flex gap-3 flex-1 w-full sm:w-auto">
          <Select
            value={filters.sort || "newest"}
            onValueChange={(value) => {
              const newFilters = { ...filters, sort: value as "newest" | "popular" | "title" | "rating" }
              // Always set sort_order when sort is changed
              if (!newFilters.sort_order) {
                newFilters.sort_order = "desc"
              }
              onFiltersChange(newFilters)
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px] h-11 border-2">
              <SelectValue placeholder={t('select_sort_option')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t('newest')}</SelectItem>
              <SelectItem value="popular">{t('popular')}</SelectItem>
              <SelectItem value="rating">{t('rating')}</SelectItem>
              <SelectItem value="title">{t('title')}</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.sort_order || "desc"}
            onValueChange={(value) => onFiltersChange({ ...filters, sort_order: value as "asc" | "desc" })}
            disabled={!filters.sort}
          >
            <SelectTrigger className="w-full sm:w-[150px] h-11 border-2" disabled={!filters.sort}>
              <SelectValue placeholder={t('sort_order')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">{t('descending')}</SelectItem>
              <SelectItem value="asc">{t('ascending')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            placeholder={t('search_courses_by_title_instructor_or_ke')}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onSearch(searchValue)
              }
            }}
            className="pl-12 h-12 text-base border-2 focus:border-primary transition-all shadow-sm"
          />
        </div>
        <Button 
          onClick={() => onSearch(searchValue)} 
          className="h-12 px-8 text-base font-medium shadow-md hover:shadow-lg transition-shadow"
        >
          {t('search')}
        </Button>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              className="relative h-12 px-5 border-2 hover:border-primary transition-all shadow-sm"
            >
              <Filter className="w-4 h-4 mr-2" />
              <span className="font-medium">{t('filters')}</span>
              {activeFilterCount > 0 && (
                <Badge
                  className="absolute -top-2 -right-2 w-6 h-6 p-0 flex items-center justify-center text-xs font-bold bg-primary text-primary-foreground shadow-md"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0">
            <div className="sticky top-0 bg-background z-10 border-b px-6 py-5 shadow-sm">
              <SheetHeader>
                <SheetTitle className="text-2xl font-bold tracking-tight">{t('filter_courses')}</SheetTitle>
                <p className="text-sm text-muted-foreground mt-1.5">
                  {t('filter_description')}
                </p>
                <p className="text-xs text-muted-foreground mt-2 italic">
                  {t('filter_tip')}
                </p>
              </SheetHeader>
            </div>

            <div className="px-6 py-6 space-y-8">
              {/* Sort - Moved to top for better UX */}
              <div className="space-y-4 bg-muted/30 p-4 rounded-lg border-2 border-dashed">
                <div>
                  <Label className="text-base font-semibold text-foreground">{t('sort_by')}</Label>
                  <p className="text-xs text-muted-foreground mt-1">{t('choose_sort_option')}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select
                    value={filters.sort || "newest"}
                    onValueChange={(value) => {
                      const newFilters = { ...filters, sort: value as "newest" | "popular" | "title" | "rating" }
                      // Always set sort_order when sort is changed
                      if (!newFilters.sort_order) {
                        newFilters.sort_order = "desc"
                      }
                      onFiltersChange(newFilters)
                    }}
                  >
                    <SelectTrigger className="w-full h-11">
                      <SelectValue placeholder={t('select_sort_option')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">{t('newest')}</SelectItem>
                      <SelectItem value="popular">{t('popular')}</SelectItem>
                      <SelectItem value="rating">{t('rating')}</SelectItem>
                      <SelectItem value="title">{t('title')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={filters.sort_order || "desc"}
                    onValueChange={(value) => onFiltersChange({ ...filters, sort_order: value as "asc" | "desc" })}
                    disabled={!filters.sort}
                  >
                    <SelectTrigger className="w-full h-11" disabled={!filters.sort}>
                      <SelectValue placeholder={t('sort_order')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">{t('descending')}</SelectItem>
                      <SelectItem value="asc">{t('ascending')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Skill Type */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-semibold text-foreground">{t('skill_type')}</Label>
                  <p className="text-xs text-muted-foreground mt-1">{t('select_one_or_more')}</p>
                </div>
                <div className="space-y-2.5">
                  {SKILL_OPTIONS.map((option) => {
                    const skillArray = Array.isArray(filters.skill_type) ? filters.skill_type : (filters.skill_type ? [filters.skill_type] : [])
                    const isSelected = skillArray.includes(option.value)
                    return (
                      <label
                        key={option.value}
                        htmlFor={`skill-${option.value}`}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                          "hover:bg-muted/50 hover:border-primary/30",
                          isSelected && "bg-primary/5 border-primary shadow-sm"
                        )}
                      >
                        <Checkbox
                          id={`skill-${option.value}`}
                          checked={isSelected}
                          onCheckedChange={() => handleSkillChange(option.value)}
                          className="w-5 h-5"
                        />
                        <span className={`w-3 h-3 rounded-full ${option.color} shadow-sm`}></span>
                        <span className={cn(
                          "flex-1 text-sm font-medium transition-colors",
                          isSelected && "text-primary"
                        )}>
                          {t(option.value)}
                        </span>
                        {isSelected && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </label>
                    )
                  })}
                </div>
              </div>

              <Separator className="my-6" />

              {/* Level */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-semibold text-foreground">{t('difficulty_level')}</Label>
                  <p className="text-xs text-muted-foreground mt-1">{t('select_one_or_more')}</p>
                </div>
                <div className="space-y-2.5">
                  {LEVEL_OPTIONS.map((option) => {
                    const levelArray = Array.isArray(filters.level) ? filters.level : (filters.level ? [filters.level] : [])
                    const isSelected = levelArray.includes(option.value)
                    return (
                      <label
                        key={option.value}
                        htmlFor={`level-${option.value}`}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                          "hover:bg-muted/50 hover:border-primary/30",
                          isSelected && "bg-primary/5 border-primary shadow-sm"
                        )}
                      >
                        <Checkbox
                          id={`level-${option.value}`}
                          checked={isSelected}
                          onCheckedChange={() => handleLevelChange(option.value)}
                          className="w-5 h-5"
                        />
                        <span className={`w-3 h-3 rounded-full ${option.color} shadow-sm`}></span>
                        <span className={cn(
                          "flex-1 text-sm font-medium transition-colors",
                          isSelected && "text-primary"
                        )}>
                          {t(option.value)}
                        </span>
                        {isSelected && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </label>
                    )
                  })}
                </div>
              </div>

              <Separator className="my-6" />

              {/* Enrollment Type */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-semibold text-foreground">{t('enrollment_type')}</Label>
                  <p className="text-xs text-muted-foreground mt-1">{t('select_one_or_more')}</p>
                </div>
                <div className="space-y-2.5">
                  {ENROLLMENT_TYPE_OPTIONS.map((option) => {
                    const typeArray = Array.isArray(filters.enrollment_type) ? filters.enrollment_type : (filters.enrollment_type ? [filters.enrollment_type] : [])
                    const isSelected = typeArray.includes(option.value)
                    const IconComponent = option.icon
                    return (
                      <label
                        key={option.value}
                        htmlFor={`enrollment-${option.value}`}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                          "hover:bg-muted/50 hover:border-primary/30",
                          isSelected && "bg-primary/5 border-primary shadow-sm"
                        )}
                      >
                        <Checkbox
                          id={`enrollment-${option.value}`}
                          checked={isSelected}
                          onCheckedChange={() => handleEnrollmentTypeChange(option.value)}
                          className="w-5 h-5"
                        />
                        <IconComponent className={cn(
                          "w-4 h-4 transition-colors",
                          isSelected ? "text-primary" : "text-muted-foreground"
                        )} />
                        <span className={cn(
                          "flex-1 text-sm font-medium transition-colors",
                          isSelected && "text-primary"
                        )}>
                          {t(`enrollment_${option.value}`)}
                        </span>
                        {isSelected && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </label>
                    )
                  })}
                </div>
              </div>

              <Separator className="my-6" />

              {/* Featured */}
              <div className="space-y-4">
                <Label className="text-base font-semibold text-foreground">{t('special_options')}</Label>
                <label
                  htmlFor="featured"
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                    "hover:bg-muted/50 hover:border-primary/30",
                    filters.is_featured && "bg-primary/5 border-primary shadow-sm"
                  )}
                >
                  <Checkbox
                    id="featured"
                    checked={filters.is_featured || false}
                    onCheckedChange={(checked) => onFiltersChange({ ...filters, is_featured: checked as boolean })}
                    className="w-5 h-5"
                  />
                  <Star className={cn(
                    "w-4 h-4 transition-colors",
                    filters.is_featured ? "text-primary fill-primary" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "flex-1 text-sm font-medium transition-colors",
                    filters.is_featured && "text-primary"
                  )}>
                    {t('featured_courses_only')}
                  </span>
                </label>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-background border-t px-6 py-4 shadow-lg">
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 h-11 font-medium" 
                  onClick={handleClearFilters}
                  disabled={activeFilterCount === 0}
                >
                  <X className="w-4 h-4 mr-2" />
                  {t('clear_all')}
                </Button>
                <Button 
                  className="flex-1 h-11 font-medium shadow-md hover:shadow-lg transition-shadow" 
                  onClick={() => setIsOpen(false)}
                >
                  {t('apply_filters')}
                  {activeFilterCount > 0 && (
                    <Badge className="ml-2 bg-primary-foreground text-primary">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap py-2">
          <span className="text-sm font-medium text-muted-foreground mr-1">{t('active_filters')}:</span>
          {filters.search && (
            <Badge 
              variant="secondary" 
              className="gap-1.5 px-3 py-1.5 text-sm font-medium border shadow-sm hover:shadow-md transition-shadow"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="max-w-[150px] truncate">{filters.search}</span>
              <button
                onClick={() => {
                  setSearchValue("")
                  onSearch("")
                }}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5 transition-colors"
                  aria-label={t('remove_search_filter')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </Badge>
          )}
          {(Array.isArray(filters.skill_type) ? filters.skill_type : (filters.skill_type ? [filters.skill_type] : [])).map((skill) => {
            const option = SKILL_OPTIONS.find((s) => s.value === skill)
            return option ? (
              <Badge 
                key={skill}
                variant="secondary" 
                className="gap-1.5 px-3 py-1.5 text-sm font-medium border shadow-sm hover:shadow-md transition-shadow"
              >
                <span className={`w-2.5 h-2.5 rounded-full ${option.color} shadow-sm`}></span>
                {t(option.value)}
                <button
                  onClick={() => handleSkillChange(skill)}
                  className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5 transition-colors"
                  aria-label={t('remove_skill_filter')}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </Badge>
            ) : null
          })}
          {(Array.isArray(filters.level) ? filters.level : (filters.level ? [filters.level] : [])).map((level) => {
            const option = LEVEL_OPTIONS.find((l) => l.value === level)
            return option ? (
              <Badge 
                key={level}
                variant="secondary" 
                className="gap-1.5 px-3 py-1.5 text-sm font-medium border shadow-sm hover:shadow-md transition-shadow"
              >
                <span className={`w-2.5 h-2.5 rounded-full ${option.color} shadow-sm`}></span>
                {t(option.value)}
                <button
                  onClick={() => handleLevelChange(level)}
                  className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5 transition-colors"
                  aria-label={t('remove_level_filter')}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </Badge>
            ) : null
          })}
          {(Array.isArray(filters.enrollment_type) ? filters.enrollment_type : (filters.enrollment_type ? [filters.enrollment_type] : [])).map((type) => {
            const option = ENROLLMENT_TYPE_OPTIONS.find((e) => e.value === type)
            if (!option) return null
            const IconComponent = option.icon
            return (
              <Badge 
                key={type}
                variant="secondary" 
                className="gap-1.5 px-3 py-1.5 text-sm font-medium border shadow-sm hover:shadow-md transition-shadow"
              >
                <IconComponent className="w-3.5 h-3.5" />
                {t(`enrollment_${type}`)}
                <button
                  onClick={() => handleEnrollmentTypeChange(type)}
                  className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5 transition-colors"
                  aria-label={t('remove_enrollment_type_filter')}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </Badge>
            )
          })}
          {filters.is_featured && (
            <Badge 
              variant="secondary" 
              className="gap-1.5 px-3 py-1.5 text-sm font-medium border shadow-sm hover:shadow-md transition-shadow"
            >
              <Star className="w-3.5 h-3.5 fill-primary text-primary" />
              {t('featured_courses_only')}
              <button
                onClick={() => onFiltersChange({ ...filters, is_featured: false })}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5 transition-colors"
                aria-label={t('remove_featured_filter')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </Badge>
          )}
          {filters.sort && (
            <Badge 
              variant="secondary" 
              className="gap-1.5 px-3 py-1.5 text-sm font-medium border shadow-sm hover:shadow-md transition-shadow"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{t(filters.sort)}</span>
              {filters.sort_order && (
                <span className="text-muted-foreground">
                  ({filters.sort_order === "asc" ? t('ascending') : t('descending')})
                </span>
              )}
              <button
                onClick={() => onFiltersChange({ ...filters, sort: undefined, sort_order: undefined })}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5 transition-colors"
                aria-label={t('remove_sort_filter')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </Badge>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClearFilters} 
            className="h-8 px-3 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
          >
            <X className="w-3.5 h-3.5 mr-1.5" />
            {t('clear_all')}
          </Button>
        </div>
      )}
    </div>
  )
}
