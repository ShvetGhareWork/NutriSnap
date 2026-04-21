"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, LayoutDashboard, Camera, BookOpen, Dumbbell, Eye, UserCircle, Settings, Bell, MessageCircle, LogOut, Menu, X, ChevronLeft, Activity } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRemindersRunner } from "@/hooks/useRemindersRunner";
import { useGlobalStore } from "@/store/useGlobalStore";
import { useEffect } from "react";
import NotificationDropdown from "@/components/NotificationDropdown";

const NAV_MAIN = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Analyze Meal", icon: Camera, href: "/analyze-meal" },
    { label: "Recipes", icon: BookOpen, href: "/recipes" },
    { label: "Workouts", icon: Dumbbell, href: "/workout" },
    { label: "Physique AI", icon: Eye, href: "/physique-ai" },
    { label: "Fitness", icon: Activity, href: "/fitness" },
    { label: "Coach Protocols", icon: Dumbbell, href: "/coach-protocol" },
    { label: "Messages", icon: MessageCircle, href: "/messages" },
    { label: "Find a Coach", icon: UserCircle, href: "/find-coach" },
];

const NAV_ACCOUNT = [
    { label: "Profile", icon: UserCircle, href: "/profile" },
    { label: "Settings", icon: Settings, href: "/settings" },
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({
    mobileOpen,
    onClose,
    collapsed,
    onToggleCollapse,
}: {
    mobileOpen: boolean;
    onClose: () => void;
    collapsed: boolean;
    onToggleCollapse: () => void;
}) {
    const pathname = usePathname();

    const linkClass = (active: boolean) => `
    flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium mb-0.5
    transition-all duration-150
    ${collapsed ? "lg:justify-center lg:px-0" : "px-3"}
    ${active
            ? "bg-[#B8FF3C]/15 text-[#B8FF3C] font-bold"
            : "text-slate-400 hover:text-white hover:bg-white/5"
        }
  `;

    return (
        <>
            {mobileOpen && (
                <div className="fixed inset-0 bg-black/70 z-30 lg:hidden" onClick={onClose} />
            )}

            <aside className={`
        fixed top-0 left-0 h-full z-40 flex flex-col
        bg-[#0D0D12] border-r border-white/5
        transition-all duration-300 ease-in-out
        lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:z-auto lg:flex-shrink-0
        ${mobileOpen ? "translate-x-0 w-[220px] shadow-2xl" : "-translate-x-full w-[220px]"}
        ${collapsed ? "lg:w-[80px]" : "lg:w-[220px]"}
      `}>

                {/* ── Logo ── */}
                <div className={`flex items-center h-16 border-b border-white/5 flex-shrink-0 px-4 ${collapsed ? "lg:justify-center lg:px-0" : "justify-between"}`}>
                    <div className={`flex items-center gap-3 min-w-0 overflow-hidden`}>
                        <div className="w-9 h-9 bg-[#B8FF3C] rounded-xl flex items-center justify-center flex-shrink-0">
                            <Zap size={16} className="text-[#0A0A0F]" fill="currentColor" />
                        </div>
                        <div className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${collapsed ? "lg:w-0 lg:opacity-0" : "opacity-100"}`}>
                            <p className="font-black text-white text-sm leading-none">NutriSnap</p>
                            <p className="text-[9px] text-[#B8FF3C] tracking-widest uppercase font-bold mt-0.5">AI Fitness Coach</p>
                        </div>
                    </div>
                    {/* Mobile close */}
                    <button onClick={onClose} className="lg:hidden flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-slate-400 hover:text-white">
                        <X size={15} />
                    </button>
                    {/* Desktop collapse — hidden when collapsed, shown via header menu button */}
                    {!collapsed && (
                        <button onClick={onToggleCollapse} className="hidden lg:flex flex-shrink-0 w-7 h-7 items-center justify-center rounded-lg bg-white/5 text-slate-500 hover:text-white transition-colors">
                            <ChevronLeft size={14} />
                        </button>
                    )}
                </div>

                {/* ── Main nav ── */}
                <nav className="flex-1 py-4 overflow-y-auto scrollbar-none px-3">
                    {NAV_MAIN.map(({ label, icon: Icon, href }) => {
                        const active = pathname === href;
                        return (
                            <Link key={label} href={href} title={label} className={linkClass(active)}>
                                <Icon size={17} className="flex-shrink-0" />
                                <span className={`whitespace-nowrap ${collapsed ? "lg:hidden" : ""}`}>{label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* ── Account ── */}
                <div className="px-3 pb-3 flex-shrink-0">
                    <p className={`text-[10px] font-black text-slate-600 tracking-widest uppercase px-3 mb-1.5 ${collapsed ? "lg:hidden" : ""}`}>
                        Account
                    </p>
                    {NAV_ACCOUNT.map(({ label, icon: Icon, href }) => (
                        <Link key={label} href={href} title={label} className={linkClass(false)}>
                            <Icon size={17} className="flex-shrink-0" />
                            <span className={`whitespace-nowrap ${collapsed ? "lg:hidden" : ""}`}>{label}</span>
                        </Link>
                    ))}
                    <button
                        onClick={() => {
                            useGlobalStore.getState().clearStore();
                            signOut({ callbackUrl: "/login" });
                        }}
                        title="Logout"
                        className={`w-full flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium mt-0.5 text-red-500/70 hover:text-red-400 hover:bg-red-500/10 transition-all text-left ${collapsed ? "lg:justify-center lg:px-0" : "px-3"}`}
                    >
                        <LogOut size={17} className="flex-shrink-0" />
                        <span className={`whitespace-nowrap ${collapsed ? "lg:hidden" : ""}`}>Logout</span>
                    </button>
                </div>

                {/* ── Upgrade banner (hidden when collapsed) ── */}
                <div className={`transition-all duration-300 overflow-hidden flex-shrink-0 ${collapsed ? "lg:h-0 lg:opacity-0 lg:m-0 lg:p-0" : "mx-3 mb-4 bg-[#13131A] border border-white/[0.08] rounded-2xl p-4"}`}>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Limit reached</p>
                    <p className="text-white text-xs font-black mb-3">Unlock Pro Insights</p>
                    <button className="w-full bg-[#B8FF3C] text-[#0A0A0F] text-xs font-black py-2 rounded-xl hover:bg-[#d4ff6e] transition-colors">
                        Upgrade Now
                    </button>
                </div>

                {/* Collapsed: expand button at bottom */}
                {collapsed && (
                    <button
                        onClick={onToggleCollapse}
                        className="hidden lg:flex mx-auto mb-5 w-8 h-8 items-center justify-center rounded-lg bg-white/5 text-slate-500 hover:text-white transition-colors"
                    >
                        <ChevronLeft size={14} className="rotate-180" />
                    </button>
                )}
            </aside>
        </>
    );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const setUser = useGlobalStore(state => state.setUser);
    const user = useGlobalStore(state => state.user);

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!session?.user?.id) return;
            try {
                const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                const res = await fetch(`${apiBase}/api/profile/member/${session.user.id}`);
                const data = await res.json();
                if (data.success && data.data) {
                    setUser(data.data);
                }
            } catch (error) {
                console.error("Failed to fetch profile:", error);
            }
        };

        if (session?.user?.id) {
            fetchProfile();
        }
    }, [session?.user?.id, setUser]);

    useRemindersRunner();

    const userName = user?.firstName ? `${user.firstName} ${user.lastName || ""}` : (session?.user as any)?.name || "User";
    const initials = userName.trim().split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <div className="h-screen bg-[#0A0A0F] flex overflow-hidden">
            <Sidebar
                mobileOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed((c) => !c)}
            />

            <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
                {/* ── Top bar ── */}
                <header className="flex-shrink-0 bg-[#0A0A0F]/95 backdrop-blur-md border-b border-white/5 z-20">
                    <div className="flex items-center justify-between px-4 sm:px-6 h-16">
                        <div className="flex items-center gap-3">
                            {/* Mobile hamburger */}
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-slate-400 hover:text-white transition-colors"
                            >
                                <Menu size={16} />
                            </button>
                            {/* Desktop collapse toggle */}
                            <button
                                onClick={() => setCollapsed((c) => !c)}
                                className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg bg-white/5 text-slate-400 hover:text-white transition-colors"
                            >
                                <Menu size={16} />
                            </button>
                            <h1 className="text-base sm:text-lg font-black text-white">Dashboard</h1>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                            <NotificationDropdown />
                            <Link href="/profile" className="flex items-center gap-2 bg-[#13131A] border border-white/[0.08] rounded-xl px-2.5 py-1.5 cursor-pointer hover:border-white/15 transition-colors">
                                <div className="hidden sm:block text-right">
                                    <p className="text-xs font-bold text-white leading-none">{userName}</p>
                                    <p className="text-[10px] text-[#B8FF3C] mt-0.5">Poweruser</p>
                                </div>
                                <div className="w-7 h-7 bg-gradient-to-br from-[#B8FF3C] to-[#10b981] rounded-lg flex items-center justify-center text-[#0A0A0F] font-black text-xs flex-shrink-0">
                                    {initials}
                                </div>
                            </Link>
                        </div>
                    </div>
                </header>

                {/* ── Page content ── */}
                <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 sm:py-6">
                    {children}
                </main>
            </div>
        </div>
    );
}