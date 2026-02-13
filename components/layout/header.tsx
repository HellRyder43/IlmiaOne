'use client'

import { useState } from 'react'
import { Bell, ChevronDown, LogOut, Menu } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface HeaderProps {
  onMobileMenuToggle: () => void
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const { user, isLoading, logout } = useAuth()
  const [isProfileOpen, setIsProfileOpen] = useState(false)

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
        {/* Notification Button */}
        <button
          className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white" />
        </button>

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
