"use client"

import { useState, useEffect } from "react"
import { UserTable } from "@/components/admin/user-table"
import { UserFilters } from "@/components/admin/user-filters"
import { UserFormModal } from "@/components/admin/user-form-modal"
import { Button } from "@/components/ui/button"
import { Plus, Download } from "lucide-react"
import { adminApi } from "@/lib/api/admin"
import type { User } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { useTranslations } from '@/lib/i18n'

export default function AdminUsersPage() {

  const t = useTranslations('common')

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: "",
    role: "all",
    status: "all",
  })
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [filters])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      
      // Build query params
      const params: {
        page?: number
        limit?: number
        role?: string
        status?: string
        search?: string
      } = {
        page: 1,
        limit: 100,
      }

      if (filters.role !== 'all') {
        params.role = filters.role
      }

      if (filters.status !== 'all') {
        params.status = filters.status
      }

      if (filters.search) {
        params.search = filters.search
      }

      const response = await adminApi.getUsers(params)
      setUsers(response.data)
    } catch (error) {
      console.error("Failed to fetch users:", error)
      toast({
        title: t('error'),
        description: t('failed_to_load_users'),
        variant: "destructive",
      })
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value })
  }

  const handleResetFilters = () => {
    setFilters({ search: "", role: "all", status: "all" })
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setModalOpen(true)
  }

  const handleDelete = async (userId: string) => {
    try {
      await adminApi.deleteUser(userId)
      
      // Update state immediately
      setUsers(users.filter(u => u.id !== userId))
      
      toast({
        title: t('success'),
        description: t('user_deleted_successfully'),
      })
    } catch (error) {
      toast({
        title: t('error'),
        description: t('failed_to_delete_user'),
        variant: "destructive",
      })
    }
  }

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "suspended" : "active"
    
    try {
      const updatedUser = await adminApi.updateUserStatus(userId, newStatus)
      
      console.log('[handleToggleStatus] Updated user:', {
        userId,
        currentStatus,
        newStatus,
        backendResponse: updatedUser
      })
      
      // Update state immediately with full user data from backend
      setUsers(prevUsers => prevUsers.map(u => {
        if (u.id === userId) {
          const updated = {
            ...u,
            is_active: updatedUser.is_active,
            status: updatedUser.is_active ? 'active' : 'suspended'
          }
          console.log('[handleToggleStatus] Updated user in state:', updated)
          return updated
        }
        return u
      }))
      
      toast({
        title: t('success'),
        description: newStatus === "active" ? t('user_activated_successfully') : t('user_suspended_successfully'),
      })
    } catch (error) {
      console.error('[handleToggleStatus] Error:', error)
      toast({
        title: t('error'),
        description: t('failed_to_update_user_status'),
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (data: Partial<User>) => {
    try {
      if (editingUser) {
        const updatedUser = await adminApi.updateUser(editingUser.id, data)
        
        // Update state immediately with the backend response
        setUsers(prevUsers => prevUsers.map(u => 
          u.id === editingUser.id 
            ? { ...u, ...updatedUser }
            : u
        ))
        
        toast({
          title: t('success'),
          description: t('user_updated_successfully'),
        })
      }
      // Note: Create user API not implemented in backend yet
      setModalOpen(false)
      setEditingUser(null)
    } catch (error) {
      console.error("[Update User Error]", error)
      toast({
        title: t('error'),
        description: t('failed_to_update_user'),
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('user_management')}</h1>
          <p className="text-muted-foreground mt-1">{t('manage_all_users_in_the_system')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            {t('export')}
          </Button>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            {t('add_user')}
          </Button>
        </div>
      </div>

      <UserFilters filters={filters} onFilterChange={handleFilterChange} onReset={handleResetFilters} />

      {loading ? (
        <div className="text-center py-12">{t('loading')}</div>
      ) : (
        <UserTable users={users} onEdit={handleEdit} onDelete={handleDelete} onToggleStatus={handleToggleStatus} />
      )}

      <UserFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingUser(null)
        }}
        onSubmit={handleSubmit}
        user={editingUser}
      />
    </div>
  )
}
