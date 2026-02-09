'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth'
import { NAVIGATION_CONFIG, ROLE_LABELS } from '@/lib/constants'

interface SidebarProps {
  isMobileMenuOpen: boolean
  onClose: () => void
}

interface SidebarItemProps {
  href: string
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

  // Get navigation items for user's role
  const navItems = NAVIGATION_CONFIG[user.role] || []

  // Admin sees additional navigation from all roles
  const shouldShowAllRoles = user.role === 'ADMIN'

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
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white font-bold text-lg">I</span>
          </div>
          <span className="font-bold text-slate-900 text-lg">Ilmia One</span>
        </div>

        {/* Navigation */}
        <div className="p-4 overflow-y-auto flex-1">
          <nav className="space-y-6">
            {/* User's Role Navigation */}
            <div>
              <div className="mb-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {ROLE_LABELS[user.role]}
              </div>
              {navItems.map((item) => (
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

            {/* Admin sees all roles (for demonstration/testing) */}
            {shouldShowAllRoles && (
              <>
                {Object.entries(NAVIGATION_CONFIG)
                  .filter(([role]) => role !== 'ADMIN')
                  .map(([role, items]) => (
                    <div key={role}>
                      <div className="mb-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        {ROLE_LABELS[role as keyof typeof ROLE_LABELS]}
                      </div>
                      {items.map((item) => (
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
                  ))}
              </>
            )}
          </nav>
        </div>
      </aside>
    </>
  )
}
