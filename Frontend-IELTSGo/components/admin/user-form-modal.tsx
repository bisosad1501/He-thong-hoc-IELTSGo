"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { User } from "@/types"
import { useTranslations } from '@/lib/i18n'

interface UserFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: Partial<User>) => void
  user?: User | null
}

export function UserFormModal({ open, onClose, onSubmit, user }: UserFormModalProps) {

  const t = useTranslations('common')

  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    password: "",
    role: "student",
    is_active: true,
  })

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        phone: user.phone || "",
        password: "",
        role: user.role || "student",
        is_active: user.is_active,
      })
    } else {
      setFormData({
        email: "",
        phone: "",
        password: "",
        role: "student",
        is_active: true,
      })
    }
  }, [user, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user ? t('edit_user') : t('create_new_user')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={!!user} // Email cannot be changed
              />
              {user && (
                <p className="text-xs text-muted-foreground">
                  {t('email_cannot_be_changed')}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t('phone')}</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+84901234567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            {!user && (
              <div className="space-y-2">
                <Label htmlFor="password">{t('password')}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('enter_password')}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="role">{t('role')}</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => setFormData({ ...formData, role: value })}
                disabled={!!user}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">{t('student')}</SelectItem>
                  <SelectItem value="instructor">{t('instructor')}</SelectItem>
                  <SelectItem value="admin">{t('admin')}</SelectItem>
                </SelectContent>
              </Select>
              {user && (
                <p className="text-xs text-muted-foreground">
                  {t('role_cannot_be_changed_here')}
                </p>
              )}
            </div>
            {user && (
              <div className="space-y-2">
                <Label htmlFor="status">{t('status')}</Label>
                <Select 
                  value={formData.is_active ? "active" : "suspended"} 
                  onValueChange={(value) => setFormData({ ...formData, is_active: value === "active" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t('active')}</SelectItem>
                    <SelectItem value="suspended">{t('suspended')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button type="submit">{user ? t('update') : t('create')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
