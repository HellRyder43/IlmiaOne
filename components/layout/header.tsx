'use client'

import { useState } from 'react'
import { Bell, ChevronDown, KeyRound, LogOut, Menu, UserCheck, UserX, Clock } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useNotifications } from '@/hooks/use-notifications'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn, getInitials } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least 1 uppercase letter')
      .regex(/[0-9]/, 'Must contain at least 1 number'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type ChangePasswordData = z.infer<typeof changePasswordSchema>

function ChangePasswordDialog({
  open,
  onOpenChange,
  userEmail,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  userEmail: string
}) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordData>({ resolver: zodResolver(changePasswordSchema) })

  const onSubmit = async (data: ChangePasswordData) => {
    const supabase = createClient()

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: data.currentPassword,
    })

    if (signInError) {
      setError('currentPassword', { message: 'Incorrect password' })
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: data.newPassword })

    if (updateError) {
      toast.error('Failed to update password')
      return
    }

    toast.success('Password updated successfully')
    onOpenChange(false)
    reset()
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) reset()
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            Enter your current password and choose a new one.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Current Password</label>
            <input
              {...register('currentPassword')}
              type="password"
              placeholder="Enter current password"
              className="w-full h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
            />
            {errors.currentPassword && (
              <p className="text-xs text-red-600">{errors.currentPassword.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">New Password</label>
            <input
              {...register('newPassword')}
              type="password"
              placeholder="Min. 8 chars, 1 uppercase, 1 number"
              className="w-full h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
            />
            {errors.newPassword && (
              <p className="text-xs text-red-600">{errors.newPassword.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Confirm New Password</label>
            <input
              {...register('confirmPassword')}
              type="password"
              placeholder="Re-enter new password"
              className="w-full h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save Password'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface HeaderProps {
  onMobileMenuToggle: () => void
}

function NotificationIcon({ type }: { type: string }) {
  if (type === 'REGISTRATION_APPROVED') return <UserCheck className="w-4 h-4 text-emerald-600" />
  if (type === 'REGISTRATION_REJECTED') return <UserX className="w-4 h-4 text-red-600" />
  return <Bell className="w-4 h-4 text-indigo-600" />
}

function NotificationIconBg({ type }: { type: string }) {
  if (type === 'REGISTRATION_APPROVED') return 'bg-emerald-50'
  if (type === 'REGISTRATION_REJECTED') return 'bg-red-50'
  return 'bg-indigo-50'
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const { user, isLoading, logout } = useAuth()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications()

  if (isLoading) {
    return (
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
        <div className="w-32 h-4 bg-slate-100 rounded animate-pulse" />
        <a
          href="/signout"
          className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1.5 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </a>
      </header>
    )
  }

  if (!user) return null

  const initials = getInitials(user.name)

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 hover:bg-slate-100 rounded-md transition-colors"
          aria-label="Toggle mobile menu"
        >
          <Menu className="w-5 h-5 text-slate-600" />
        </button>
        <h1 className="text-lg font-semibold text-slate-800 capitalize hidden sm:block">
          Community Portal
        </h1>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 border border-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0" sideOffset={8}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900 text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>

            <ScrollArea className="max-h-80">
              {notifications.length === 0 ? (
                <div className="py-8 text-center">
                  <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {notifications.slice(0, 10).map((n) => (
                    <button
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={cn(
                        'w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex gap-3',
                        !n.read && 'bg-indigo-50/40'
                      )}
                    >
                      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5', NotificationIconBg({ type: n.type }))}>
                        <NotificationIcon type={n.type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm text-slate-900', !n.read && 'font-semibold')}>
                          {n.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                          {n.message.length > 80 ? n.message.slice(0, 80) + '…' : n.message}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3 text-slate-300" />
                          <span className="text-[11px] text-slate-400">
                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      {!n.read && (
                        <div className="w-2 h-2 bg-indigo-500 rounded-full shrink-0 mt-2" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 hover:bg-slate-50 p-1.5 rounded-full border border-transparent hover:border-slate-200 transition-colors"
            aria-label="User menu"
          >
            <Avatar className="w-8 h-8">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback className="bg-indigo-600 text-white text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {/* Dropdown Menu */}
          {isProfileOpen && (
            <>
              {/* Backdrop for closing dropdown */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsProfileOpen(false)}
              />

              {/* Dropdown Content */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-50">
                <div className="px-4 py-2 border-b border-slate-50">
                  <p className="text-sm font-medium text-slate-900">{user.name}</p>
                  {user.houseNumber && (
                    <p className="text-xs text-slate-500">{user.houseNumber}</p>
                  )}
                  {user.email && (
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setIsProfileOpen(false)
                    setIsChangePasswordOpen(true)
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                >
                  <KeyRound className="w-4 h-4" /> Change Password
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button
                  onClick={() => {
                    setIsProfileOpen(false)
                    logout()
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <ChangePasswordDialog
        open={isChangePasswordOpen}
        onOpenChange={setIsChangePasswordOpen}
        userEmail={user.email ?? ''}
      />
    </header>
  )
}
