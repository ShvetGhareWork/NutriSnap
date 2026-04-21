'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    LayoutDashboard, Scan, BookOpen, Dumbbell, Camera, MessageCircle,
    User, Settings, Zap, LogOut, Activity,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';

const navItems = [
    { href: '/member/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/member/analyze', icon: Scan, label: 'Analyze Meal' },
    { href: '/member/recipes', icon: BookOpen, label: 'Recipes' },
    { href: '/member/workouts', icon: Dumbbell, label: 'Workouts' },
    { href: '/member/physique', icon: Camera, label: 'Physique AI' },
    { href: '/member/fitness', icon: Activity, label: 'Fitness' },
    { href: '/member/coach', icon: MessageCircle, label: 'AI Coach' },
];

const bottomItems = [
    { href: '/member/profile', icon: User, label: 'Profile' },
    { href: '/member/settings', icon: Settings, label: 'Settings' },
];

export default function MemberSidebar() {
    const pathname = usePathname();

    return (
        <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-[#13131A] border-r border-white/[0.06] fixed left-0 top-0 bottom-0 z-40">
            <div className="p-6 border-b border-white/[0.06]">
                <Link href="/member/dashboard" className="flex items-center gap-2.5">
                    <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                    <span className="text-lg font-bold text-white">NutriSnap</span>
                </Link>
            </div>

            {/* Nav */}
            <nav className="flex-1 py-4 px-3 flex flex-col gap-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                        <Link key={item.href} href={item.href}>
                            <motion.div
                                whileHover={{ x: 2 }}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer',
                                    isActive
                                        ? 'bg-[rgba(184,255,60,0.12)] text-[#B8FF3C]'
                                        : 'text-white/50 hover:text-white hover:bg-white/[0.04]'
                                )}
                            >
                                <item.icon size={18} className={isActive ? 'text-[#B8FF3C]' : ''} />
                                {item.label}
                                {isActive && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#B8FF3C]" />
                                )}
                            </motion.div>
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom */}
            <div className="border-t border-white/[0.06] px-3 py-4 flex flex-col gap-1">
                {bottomItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.href} href={item.href}>
                            <div className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer',
                                isActive ? 'bg-[rgba(184,255,60,0.12)] text-[#B8FF3C]' : 'text-white/50 hover:text-white hover:bg-white/[0.04]'
                            )}>
                                <item.icon size={18} />
                                {item.label}
                            </div>
                        </Link>
                    );
                })}
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-red-400 hover:bg-red-500/[0.08] transition-all duration-200 cursor-pointer w-full text-left mt-1"
                >
                    <LogOut size={18} />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
