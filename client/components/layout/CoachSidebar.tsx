'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Users, BookOpen, BarChart3, MessageCircle, Settings, Zap,
    LogOut, ChevronLeft, ChevronRight
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { useUserContext } from '@/contexts/UserContext';
import { useSidebar } from '@/contexts/SidebarContext';

const navItems = [
    { href: '/coach/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/coach/clients', icon: Users, label: 'Clients' },
    { href: '/coach/programs', icon: BookOpen, label: 'Programs' },
    { href: '/coach/analytics', icon: BarChart3, label: 'Analytics' },
    { href: '/coach/messages', icon: MessageCircle, label: 'Messages' },
];

export default function CoachSidebar() {
    const pathname = usePathname();
    const { isCollapsed, setIsCollapsed, isOpen, setIsOpen } = useSidebar();
    const { coachProfile } = useUserContext();

    // Safely extract name and initials
    const coachName = coachProfile?.name || 'Coach';
    const initials = coachName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

    return (
        <>
            {/* Mobile Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            <motion.aside
                initial={false}
                animate={{ 
                    width: isCollapsed ? 80 : 256,
                    x: isOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 1024 ? -256 : 0)
                }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className={cn(
                    "flex flex-col min-h-screen bg-[#13131A] border-r border-white/[0.06] fixed left-0 top-0 bottom-0 z-50",
                    !isOpen && "hidden lg:flex"
                )}
            >
            {/* Collapse Toggle */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-8 w-6 h-6 bg-[#13131A] border border-white/[0.06] rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 z-50 transition-colors"
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            {/* Logo */}
            <div className={cn("p-6 border-b border-white/[0.06] flex items-center h-[88px] transition-all", isCollapsed ? "justify-center px-0" : "")}>
                <Link href="/coach/dashboard" className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-8 h-8 rounded-xl bg-[#10b981] flex items-center justify-center flex-shrink-0">
                        <Zap size={18} className="text-[#0A0A0F]" fill="currentColor" />
                    </div>
                    <AnimatePresence>
                        {!isCollapsed && (
                            <motion.div
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                className="whitespace-nowrap"
                            >
                                <span className="text-lg font-bold text-white block leading-tight">NutriSnap</span>
                                <span className="text-[10px] text-[#10b981] font-medium uppercase tracking-wider">Coach Portal</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Link>
            </div>

            {/* Nav */}
            <nav className={cn("flex-1 py-6 flex flex-col gap-2 overflow-y-auto overflow-x-hidden", isCollapsed ? "px-2 items-center" : "px-4")}>
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                        <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)} className={isCollapsed ? "w-full flex justify-center" : "w-full"}>
                            <motion.div
                                whileHover={{ x: isCollapsed ? 0 : 4 }}
                                title={isCollapsed ? item.label : undefined}
                                className={cn(
                                    'flex items-center rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer overflow-hidden',
                                    isCollapsed ? 'justify-center w-12 h-12' : 'px-4 py-3 gap-3',
                                    isActive
                                        ? 'bg-[rgba(16,185,129,0.12)] text-[#10b981]'
                                        : 'text-white/50 hover:text-white hover:bg-white/[0.04]'
                                )}
                            >
                                <item.icon size={20} className={cn("flex-shrink-0", isActive ? 'text-[#10b981]' : '')} />

                                <AnimatePresence>
                                    {!isCollapsed && (
                                        <motion.span
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{ opacity: 1, width: 'auto' }}
                                            exit={{ opacity: 0, width: 0 }}
                                            className="whitespace-nowrap flex-1"
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>

                                {!isCollapsed && isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#10b981] flex-shrink-0" />}
                            </motion.div>
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Section */}
            <div className={cn("border-t border-white/[0.06] py-4 flex flex-col gap-2", isCollapsed ? "px-2 items-center" : "px-4")}>

                {/* Profile Section */}
                <div className={cn(
                    "flex items-center transition-all",
                    isCollapsed
                        ? "justify-center w-12 h-12 rounded-xl mb-2"
                        : "gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] mb-2"
                )}>
                    <div className="w-9 h-9 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs flex-shrink-0 border border-indigo-500/30">
                        {initials}
                    </div>

                    <AnimatePresence>
                        {!isCollapsed && (
                            <motion.div
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                className="flex-1 min-w-0"
                            >
                                <p className="text-sm font-semibold text-white truncate">{coachName}</p>
                                <p className="text-[10px] text-white/40 truncate">Pro Coach</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <Link href="/coach/settings" onClick={() => setIsOpen(false)} className={isCollapsed ? "w-full flex justify-center" : "w-full"}>
                    <div
                        title={isCollapsed ? "Settings" : undefined}
                        className={cn(
                            'flex items-center rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer',
                            isCollapsed ? 'justify-center w-12 h-12' : 'px-4 py-3 gap-3',
                            pathname === '/coach/settings' ? 'bg-[rgba(16,185,129,0.12)] text-[#10b981]' : 'text-white/50 hover:text-white hover:bg-white/[0.04]'
                        )}
                    >
                        <Settings size={18} className="flex-shrink-0" />

                        <AnimatePresence>
                            {!isCollapsed && (
                                <motion.span
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: 'auto' }}
                                    exit={{ opacity: 0, width: 0 }}
                                    className="whitespace-nowrap flex-1"
                                >
                                    Settings
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>
                </Link>

                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    title={isCollapsed ? "Sign Out" : undefined}
                    className={cn(
                        "flex items-center rounded-xl text-sm font-medium text-white/40 hover:text-red-400 hover:bg-red-500/[0.08] transition-all duration-200 cursor-pointer text-left",
                        isCollapsed ? 'justify-center w-12 h-12' : 'px-4 py-3 gap-3 w-full'
                    )}
                >
                    <LogOut size={18} className="flex-shrink-0" />

                    <AnimatePresence>
                        {!isCollapsed && (
                            <motion.span
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                className="whitespace-nowrap flex-1"
                            >
                                Sign Out
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>
            </div>
        </motion.aside>
        </>
    );
}
