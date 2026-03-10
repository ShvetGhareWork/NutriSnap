"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, Medal, ArrowRight, Zap } from "lucide-react";
import { useSession } from "next-auth/react";

type Role = "member" | "coach" | null;

export default function RoleSelector() {
    const [selected, setSelected] = useState<Role>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { data: session, update } = useSession();

    const handleContinue = async () => {
        if (!selected || !session?.user?.id) return;
        setLoading(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/user/role`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: session.user.id,
                    role: selected,
                }),
            });

            if (res.ok) {
                // Update NextAuth session with new role locally
                await update({ role: selected });
                router.push(`/${selected}-onboarding`);
            } else {
                console.error("Failed to update role");
            }
        } catch (error) {
            console.error("Network error updating role:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0A0F] flex flex-col">
            {/* Header */}
            <header className="px-5 sm:px-8 py-5 flex items-center gap-3">
                <div className="w-10 h-10 bg-[#B8FF3C] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Zap size={18} className="text-[#0A0A0F]" fill="currentColor" />
                </div>
                <div>
                    <div className="font-black text-white text-base tracking-tight leading-none">MacroSnap</div>
                    <div className="text-[10px] text-slate-500 tracking-[0.15em] uppercase font-medium mt-0.5">Precision Nutrition</div>
                </div>
            </header>

            {/* Main */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12">
                <div className="w-full max-w-2xl">
                    {/* Heading */}
                    <div className="text-center mb-10 sm:mb-12">
                        <h1 className="text-4xl sm:text-5xl font-black text-white mb-3 tracking-tight">
                            Who are you?
                        </h1>
                        <p className="text-slate-400 text-sm sm:text-base">
                            Choose your journey to get started with MacroSnap
                        </p>
                    </div>

                    {/* Role cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-8">
                        {/* Member card */}
                        <button
                            onClick={() => setSelected("member")}
                            className={`relative text-left rounded-2xl border-2 p-6 sm:p-8 transition-all duration-200 group ${selected === "member"
                                ? "border-[#B8FF3C] bg-[#B8FF3C]/8"
                                : "border-white/8 bg-[#13131A] hover:border-white/20 hover:bg-[#161620]"
                                }`}
                        >
                            {/* Icon circle */}
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto transition-all ${selected === "member" ? "bg-[#B8FF3C]/25" : "bg-[#1e2a1e]"
                                }`}>
                                <Dumbbell
                                    size={28}
                                    className={`transition-colors ${selected === "member" ? "text-[#B8FF3C]" : "text-[#4a7c4a]"}`}
                                />
                            </div>

                            <h2 className="text-xl sm:text-2xl font-black text-white text-center mb-3 italic">
                                I&apos;m a Member
                            </h2>
                            <p className="text-slate-400 text-sm text-center leading-relaxed mb-5">
                                Track your nutrition, calories, and workouts with AI-powered precision. Reach your goals faster.
                            </p>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-2 justify-center">
                                {["Tracking", "AI Scanning", "Insights"].map(tag => (
                                    <span
                                        key={tag}
                                        className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${selected === "member"
                                            ? "border-[#B8FF3C]/30 text-[#B8FF3C] bg-[#B8FF3C]/10"
                                            : "border-white/10 text-slate-400 bg-white/5"
                                            }`}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            {/* Selected indicator */}
                            {selected === "member" && (
                                <div className="absolute top-4 right-4 w-5 h-5 bg-[#B8FF3C] rounded-full flex items-center justify-center">
                                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                        <path d="M1 4L3.5 6.5L9 1" stroke="#0A0A0F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            )}
                        </button>

                        {/* Coach card */}
                        <button
                            onClick={() => setSelected("coach")}
                            className={`relative text-left rounded-2xl border-2 p-6 sm:p-8 transition-all duration-200 group ${selected === "coach"
                                ? "border-[#B8FF3C] bg-[#B8FF3C]/8"
                                : "border-white/8 bg-[#13131A] hover:border-white/20 hover:bg-[#161620]"
                                }`}
                        >
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto transition-all ${selected === "coach" ? "bg-[#B8FF3C]/25" : "bg-[#1e2a1e]"
                                }`}>
                                <Medal
                                    size={28}
                                    className={`transition-colors ${selected === "coach" ? "text-[#B8FF3C]" : "text-[#4a7c4a]"}`}
                                />
                            </div>

                            <h2 className="text-xl sm:text-2xl font-black text-white text-center mb-3 italic">
                                I&apos;m a Coach
                            </h2>
                            <p className="text-slate-400 text-sm text-center leading-relaxed mb-5">
                                Manage your roster, monitor client progress, and provide real-time feedback in one dashboard.
                            </p>

                            <div className="flex flex-wrap gap-2 justify-center">
                                {["Dashboards", "Messaging", "CRM"].map(tag => (
                                    <span
                                        key={tag}
                                        className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${selected === "coach"
                                            ? "border-[#B8FF3C]/30 text-[#B8FF3C] bg-[#B8FF3C]/10"
                                            : "border-white/10 text-slate-400 bg-white/5"
                                            }`}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            {selected === "coach" && (
                                <div className="absolute top-4 right-4 w-5 h-5 bg-[#B8FF3C] rounded-full flex items-center justify-center">
                                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                        <path d="M1 4L3.5 6.5L9 1" stroke="#0A0A0F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            )}
                        </button>
                    </div>

                    {/* Continue button */}
                    <button
                        onClick={handleContinue}
                        disabled={!selected || loading}
                        className={`w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all duration-200 ${selected
                            ? "bg-[#B8FF3C] text-[#0A0A0F] hover:bg-[#d4ff6e] shadow-lg shadow-[#B8FF3C]/20"
                            : "bg-[#13131A] text-slate-600 cursor-not-allowed border border-white/5"
                            }`}
                    >
                        {loading ? "Updating..." : "Continue"}
                        <ArrowRight size={18} className={selected ? "text-[#0A0A0F]" : "text-slate-600"} />
                    </button>

                    {/* Sign in */}
                    <p className="text-center text-slate-500 text-sm mt-5">
                        Already have an account?{" "}
                        <a href="/auth/sign-in" className="text-[#B8FF3C] font-bold underline underline-offset-2 hover:text-[#d4ff6e] transition-colors">
                            Sign in
                        </a>
                    </p>
                </div>
            </main>

            {/* Footer */}
            <footer className="text-center pb-6 text-slate-600 text-xs">
                © 2024 MacroSnap. All rights reserved.
            </footer>
        </div>
    );
}