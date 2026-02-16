'use client'

import { useState } from 'react'
import { Bell, ChevronDown, LogOut, Menu, UserCheck, UserX, Clock } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useNotifications } from '@/hooks/use-notifications'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

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

  // Get user initials for avatar fallback
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

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
    </header>
  )
}
