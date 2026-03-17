"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Plus, Eye, Edit, Trash2, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/utils/date"
import { adminApi } from "@/lib/api/admin"
import type { Exercise } from "@/types"

export default function AdminExercisesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingExerciseId, setDeletingExerciseId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(searchParams.get("skill") || "all")
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">(
    (searchParams.get("status") as "all" | "published" | "draft") || "all"
  )
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const itemsPerPage = 20

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (activeTab !== "all") params.set("skill", activeTab)
    if (statusFilter !== "all") params.set("status", statusFilter)
    router.replace(`/admin/exercises?${params.toString()}`, { scroll: false })
  }, [activeTab, statusFilter, router])

  useEffect(() => {
    setCurrentPage(1) // Reset to page 1 when tab or filter changes
    fetchExercises(1)
  }, [activeTab, statusFilter])

  const fetchExercises = async (page: number = currentPage) => {
    try {
      setLoading(true)
      const params: any = {
        page: page,
        limit: itemsPerPage,
      }

      if (activeTab !== "all") {
        params.skill_type = activeTab
      }

      if (statusFilter === "published") {
        params.is_published = true
      } else if (statusFilter === "draft") {
        params.is_published = false
      }

      const response = await adminApi.getAllExercises(params)
      setExercises(response.data)
      setTotal(response.pagination.total)
      setTotalPages(response.pagination.total_pages)
      setCurrentPage(page)
    } catch (error) {
      console.error("Failed to fetch exercises:", error)
      toast({
        title: "Error",
        description: "Failed to load exercises. Please try again.",
        variant: "destructive",
      })
      setExercises([])
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchExercises(page)
    }
  }

  const handlePublish = async (id: string) => {
    try {
      await adminApi.publishExercise(id)
      toast({
        title: "Success",
        description: "Exercise published successfully",
      })
      fetchExercises()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to publish exercise",
        variant: "destructive",
      })
    }
  }

  const handleUnpublish = async (id: string) => {
    try {
      await adminApi.unpublishExercise(id)
      toast({
        title: "Success",
        description: "Exercise unpublished successfully",
      })
      fetchExercises()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unpublish exercise",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteExercise(id)
      toast({
        title: "Success",
        description: "Exercise deleted successfully",
      })
      setExercises(exercises.filter((ex) => ex.id !== id))
      setDeletingExerciseId(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete exercise",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-600">
            Draft
          </Badge>
        )
      case "published":
        return (
          <Badge variant="outline" className="border-green-500 text-green-600">
            Published
          </Badge>
        )
      case "archived":
        return (
          <Badge variant="outline" className="border-red-500 text-red-600">
            Archived
          </Badge>
        )
      default:
        return null
    }
  }

  const getSkillBadge = (skill: string) => {
    const colors: Record<string, string> = {
      listening: "bg-blue-500",
      reading: "bg-green-500",
      writing: "bg-orange-500",
      speaking: "bg-purple-500",
    }
    return (
      <Badge className={colors[skill.toLowerCase()] || "bg-gray-500"}>
        {skill}
      </Badge>
    )
  }

  const getLevelBadge = (level: string) => {
    const colors: Record<string, string> = {
      easy: "bg-emerald-500",
      medium: "bg-amber-500",
      hard: "bg-rose-500",
    }
    const displayLevel = level === "easy" ? "Easy" : level === "medium" ? "Medium" : "Hard"
    return (
      <Badge className={colors[level.toLowerCase()] || "bg-gray-500"}>
        {displayLevel}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Exercises</h1>
            <p className="text-muted-foreground mt-1">
              Manage and review all IELTS exercises
            </p>
          </div>
          <Button onClick={() => router.push("/admin/exercises/create")}>
            <Plus className="w-4 h-4 mr-2" />
            Create Exercise
          </Button>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search exercises by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="listening">Listening</TabsTrigger>
            <TabsTrigger value="reading">Reading</TabsTrigger>
            <TabsTrigger value="writing">Writing</TabsTrigger>
            <TabsTrigger value="speaking">Speaking</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
            >
              All
            </Button>
            <Button
              variant={statusFilter === "published" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("published")}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Published
            </Button>
            <Button
              variant={statusFilter === "draft" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("draft")}
            >
              <Clock className="w-4 h-4 mr-2" />
              Draft
            </Button>
          </div>
        </div>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : exercises.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="space-y-3">
                  <p className="text-muted-foreground">No exercises found</p>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/admin/exercises/create")}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Exercise
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            exercises
              .filter((exercise) => 
                exercise.title.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((exercise) => {
              // Convert is_published boolean to status string for badge display
              const exerciseStatus = exercise.is_published ? "published" : "draft"
              return (
              <Card key={exercise.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getSkillBadge(exercise.skill_type)}
                        {getStatusBadge(exerciseStatus)}
                        {exercise.difficulty && getLevelBadge(exercise.difficulty)}
                      </div>
                      <CardTitle>{exercise.title}</CardTitle>
                      <CardDescription>
                        Created {formatDate(exercise.created_at)}
                        {exercise.total_attempts !== undefined &&
                          ` • ${exercise.total_attempts} attempts`}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/exercises/${exercise.id}`)}
                        title="View as student"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const currentUrl = window.location.pathname + window.location.search
                          router.push(`/admin/exercises/${exercise.id}/edit?returnUrl=${encodeURIComponent(currentUrl)}`)
                        }}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      {!exercise.is_published ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-600 hover:bg-green-50 bg-transparent"
                          onClick={() => handlePublish(exercise.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Publish
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-yellow-600 border-yellow-600 hover:bg-yellow-50 bg-transparent"
                          onClick={() => handleUnpublish(exercise.id)}
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          Move to Draft
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                        onClick={() => setDeletingExerciseId(exercise.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            )})
          )}

          {/* Pagination */}
          {!loading && exercises.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4 mt-6">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, total)} of {total} exercises
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-9"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingExerciseId} onOpenChange={() => setDeletingExerciseId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exercise?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this exercise? This will permanently delete the exercise and all its sections, questions, and student submissions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingExerciseId && handleDelete(deletingExerciseId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
