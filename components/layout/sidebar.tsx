'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth'
import { NAVIGATION_BY_ROUTE, ROUTE_SECTION_LABELS, ROLE_LABELS } from '@/lib/constants'

interface SidebarProps {
  isMobileMenuOpen: boolean
  onClose: () => void
}

interface SidebarItemProps {
  href: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any
  label: string
  active: boolean
  onClick?: () => void
}

const SidebarItem: React.FC<SidebarItemProps> = ({ href, icon: Icon, label, active, onClick }) => (
  <Link
    href={href}
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1",
      active
        ? "bg-indigo-50 text-indigo-700"
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
    )}
  >
    <Icon className={cn("w-4 h-4", active ? "text-indigo-600" : "text-slate-400")} />
    {label}
  </Link>
)

export function Sidebar({ isMobileMenuOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()

  if (!user) return null

  // Build nav sections from the user's allowed route prefixes (injected via JWT)
  const navSections = (user.permissions.routes ?? [])
    .filter(route => NAVIGATION_BY_ROUTE[route])
    .map(route => ({
      key:   route,
      label: ROUTE_SECTION_LABELS[route] ?? route,
      items: NAVIGATION_BY_ROUTE[route],
    }))

  const roleLabel = ROLE_LABELS[user.role] ?? user.role

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transition-transform duration-200 ease-in-out flex flex-col",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 shrink-0">
          <Image src="/favicon-32x32.png" alt="Ilmia One" width={32} height={32} className="rounded-lg mr-3" />
          <span className="font-bold text-slate-900 text-lg">Ilmia One</span>
        </div>

        {/* Navigation */}
        <div className="p-4 overflow-y-auto flex-1">
          <nav className="space-y-6">
            {navSections.length === 0 ? (
              // Fallback: show role label when no permissions are loaded yet
              <div className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {roleLabel}
              </div>
            ) : (
              navSections.map(section => (
                <div key={section.key}>
                  <div className="mb-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {section.label}
                  </div>
                  {section.items.map(item => (
                    <SidebarItem
                      key={item.href}
                      href={item.href}
                      icon={item.icon}
                      label={item.label}
                      active={pathname === item.href}
                      onClick={onClose}
                    />
                  ))}
                </div>
              ))
            )}
          </nav>
        </div>

        {/* Sign Out Footer */}
        <div className="p-4 border-t border-slate-100 shrink-0">
          <a
            href="/signout"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors w-full"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            Sign out
          </a>
        </div>
      </aside>
    </>
  )
}
