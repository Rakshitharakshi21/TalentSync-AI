'use client';

import { useAuth } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Users, Radar, Briefcase, Map, Route, MessageSquare,
  Sparkles, LogOut, Menu, X, ChevronRight, User, Settings, Target
} from 'lucide-react';
import Link from 'next/link';

const employeeNav = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/profile', label: 'My Profile', icon: User },
  { href: '/dashboard/talent-dna', label: 'Talent DNA', icon: Sparkles },
  { href: '/dashboard/talent-radar', label: 'Talent Radar', icon: Radar },
  { href: '/dashboard/opportunities', label: 'Opportunities', icon: Briefcase },
  { href: '/dashboard/capability-map', label: 'Capability Map', icon: Map },
  { href: '/dashboard/career-path', label: 'Career Path', icon: Route },
  { href: '/dashboard/assistant', label: 'AI Assistant', icon: MessageSquare },
];

const hrNav = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/workforce', label: 'Workforce', icon: Users },
  { href: '/dashboard/talent-radar', label: 'Talent Radar', icon: Radar },
  { href: '/dashboard/opportunities', label: 'Opportunities', icon: Briefcase },
  { href: '/dashboard/capability-map', label: 'Capability Map', icon: Map },
  { href: '/dashboard/capability-gaps', label: 'Capability Gaps', icon: Target },
  { href: '/dashboard/assistant', label: 'AI Assistant', icon: MessageSquare },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, userRole, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-surface-500 text-sm">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const nav = userRole === 'hr' ? hrNav : employeeNav;

  return (
    <div className="min-h-screen bg-surface-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-surface-200
        flex flex-col z-50 transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-surface-200">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-base font-bold text-surface-900 tracking-tight">TalentSync AI</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-surface-400 hover:text-surface-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role badge */}
        <div className="px-5 py-3">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
            userRole === 'hr'
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-primary-50 text-primary-700 border border-primary-200'
          }`}>
            {userRole === 'hr' ? <Users className="w-3 h-3" /> : <User className="w-3 h-3" />}
            {userRole === 'hr' ? 'HR / Talent Manager' : 'Employee'}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {nav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={isActive ? 'sidebar-link-active' : 'sidebar-link'}
              >
                <item.icon className="w-4.5 h-4.5" />
                <span>{item.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-50" />}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-surface-200">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary-700">
                {user.email?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-surface-900 truncate">{user.email}</p>
            </div>
            <button
              onClick={() => { signOut(); router.push('/'); }}
              className="text-surface-400 hover:text-surface-600 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden h-14 px-4 flex items-center border-b border-surface-200 bg-white sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="text-surface-600 hover:text-surface-900">
            <Menu className="w-5 h-5" />
          </button>
          <span className="ml-3 text-sm font-semibold text-surface-900">TalentSync AI</span>
        </div>

        <div className="p-6 lg:p-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
