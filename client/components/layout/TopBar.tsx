'use client';

import { Bell, Search, LogOut, Menu } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { getInitials } from '@/lib/utils';
import NotificationDropdown from '../NotificationDropdown';
import { useSidebar } from '@/contexts/SidebarContext';

const pageTitles: Record<string, string> = {
    '/member/dashboard': 'Dashboard',
    '/member/analyze': 'Analyze Meal',
    '/member/recipes': 'Recipes',
    '/member/workouts': 'Workouts',
    '/member/physique': 'Physique AI',
    '/member/coach': 'AI Coach',
    '/member/profile': 'Profile',
    '/member/settings': 'Settings',
    '/coach/dashboard': 'Dashboard',
    '/coach/clients': 'Clients',
    '/coach/programs': 'Programs',
    '/coach/analytics': 'Analytics',
    '/coach/messages': 'Messages',
    '/coach/settings': 'Settings',
};

export default function TopBar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const { setIsOpen } = useSidebar();
    const title = pageTitles[pathname] || 'NutriSnap';
    const isCoach = session?.user.role === 'coach';
    const accentColor = isCoach ? '#10b981' : '#B8FF3C';
    const initials = session?.user.email ? getInitials(session.user.email) : 'U';

    return (
        <header className="h-16 bg-[rgba(19,19,26,0.95)] backdrop-blur-lg border-b border-white/[0.06] flex items-center px-6 gap-4 sticky top-0 z-30">
            {/* Mobile Menu Toggle */}
            <button 
                onClick={() => setIsOpen(true)}
                className="lg:hidden p-1.5 -ml-1 text-white/60 hover:text-white transition-colors"
            >
                <Menu size={20} />
            </button>

            {/* Title */}
            <h1 className="text-lg font-semibold text-white flex-1">{title}</h1>


            {/* Search */}
            <div className="hidden md:flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 w-56">
                <Search size={15} className="text-white/30" />
                <input
                    type="text"
                    placeholder="Search..."
                    className="bg-transparent text-sm text-white placeholder:text-white/30 outline-none w-full"
                />
            </div>

            {/* Notification */}
            <NotificationDropdown />

            {/* Avatar */}
            <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer"
                style={{ backgroundColor: `${accentColor}20`, color: accentColor, border: `1px solid ${accentColor}40` }}
                title={session?.user.email}
            >
                {initials}
            </div>

            {/* Logout */}
            <button
                onClick={() => signOut()}
                className="w-8 h-8 rounded-full bg-red-400/10 border border-red-400/30 flex items-center justify-center text-red-100 hover:bg-red-400/20 transition-all ml-1"
                title="Log Out"
            >
                <LogOut size={16} />
            </button>
        </header>
    );
}
