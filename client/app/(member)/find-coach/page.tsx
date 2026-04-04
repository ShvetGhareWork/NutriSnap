"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Search, Star, ChevronDown, Zap, Check, User, Info, Loader2, Calendar, IndianRupee, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Toast } from "@/components/ui/Toast";

// ── Types ─────────────────────────────────────────────────────────────────────
type Specialty = string;
type Coach = {
    _id: string;
    user: { _id: string; email: string };
    firstName: string;
    lastName: string;
    bio: string;
    specialties: Specialty[];
    yearsExp: string;
    coachingStyle: string;
    gymName?: string;
    clientMethod?: string;
    checkInFreq?: string;
    certifications?: string;
    paidChatEnabled?: boolean;
    chatFeeINR?: number;
};

declare global {
    interface Window {
        Razorpay: any;
    }
}

// ── Components ─────────────────────────────────────────────────────────────────

function CoachCard({ coach, onConnect, onViewProfile }: {
    coach: Coach;
    onConnect: (coach: Coach) => void;
    onViewProfile: (coach: Coach) => void;
}) {
    const fullName = `${coach.firstName} ${coach.lastName}`;
    const initials = (coach.firstName[0] || "") + (coach.lastName[0] || "");
    const rating = 5.0; // Mocked for now

    return (
        <div className="bg-[#13131A] border border-white/5 rounded-[2.5rem] p-6 sm:p-8 hover:border-[#B8FF3C]/20 transition-all duration-500 group flex flex-col h-full shadow-2xl relative overflow-hidden">
            {/* Decorative BG element */}
            <div className={`absolute top-0 right-0 w-32 h-32 blur-[80px] -mr-16 -mt-16 transition-opacity duration-500 ${coach.paidChatEnabled ? 'bg-[#B8FF3C]/10' : 'bg-blue-500/5'}`} />

            <div className="flex items-start justify-between mb-6 relative">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-black rounded-2xl flex items-center justify-center font-black text-white text-xl border border-white/10 shrink-0 shadow-2xl group-hover:scale-105 transition-transform">
                    {initials || "C"}
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1.5 bg-[#B8FF3C]/10 text-[#B8FF3C] px-3 py-1.5 rounded-full border border-[#B8FF3C]/20">
                        <Star size={12} className="fill-[#B8FF3C]" />
                        <span className="text-[11px] font-black">{rating.toFixed(1)}</span>
                    </div>
                </div>
            </div>

            <div className="mb-6">
                <h3 className="font-black text-white text-xl sm:text-2xl leading-tight mb-3 group-hover:text-[#B8FF3C] transition-colors tracking-tight">
                    {fullName}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                    {coach.specialties?.slice(0, 3).map((s) => (
                        <span key={s} className="text-[9px] font-black tracking-widest px-3 py-1 rounded-lg border bg-white/5 text-white/30 border-white/5 uppercase">
                            {s}
                        </span>
                    ))}
                </div>
            </div>

            <p className="text-sm text-slate-500 leading-relaxed mb-8 line-clamp-3 font-medium">
                {coach.bio || "No bio provided. This coach is ready to help you reach your goals."}
            </p>

            <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between mb-8">
                <div className="flex flex-col">
                    <span className="text-2xl font-black text-white flex items-center gap-1">
                        <IndianRupee size={18} className="text-[#B8FF3C]" />
                        {coach.paidChatEnabled ? coach.chatFeeINR : "0"}
                    </span>
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">
                        {coach.paidChatEnabled ? "Payment Required" : "Free Access"}
                    </span>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{coach.yearsExp || "5+"}Y Experience</span>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    onClick={() => onConnect(coach)}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#B8FF3C] hover:bg-[#d4ff6e] text-black font-black text-[11px] py-4 px-2 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-[#B8FF3C]/10 uppercase tracking-widest"
                >
                    {coach.paidChatEnabled ? "Pay & Connect" : "CONNECT"}
                </button>
                <button
                    onClick={() => onViewProfile(coach)}
                    className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/8 text-white font-black text-[11px] py-4 px-2 rounded-2xl transition-all active:scale-[0.98] uppercase tracking-widest"
                >
                    PROFILE
                </button>
            </div>
        </div>
    );
}

function CoachProfileModal({ coach, onClose, onConnect }: { coach: Coach; onClose: () => void; onConnect: (coach: Coach) => void }) {
    const fullName = `${coach.firstName} ${coach.lastName}`;
    const initials = (coach.firstName[0] || "") + (coach.lastName[0] || "");

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-[#0A0A0F] border-t sm:border border-white/10 rounded-t-[2.5rem] sm:rounded-[3rem] overflow-hidden flex flex-col max-h-[92vh] shadow-[0_0_100px_rgba(0,0,0,1)] animate-slide-up">
                <div className="p-8 sm:p-12 overflow-y-auto custom-scrollbar">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 mb-12">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-slate-800 to-black rounded-[2.5rem] flex items-center justify-center font-black text-white text-3xl sm:text-4xl border border-white/10 shrink-0 shadow-2xl relative">
                            <div className="absolute inset-0 rounded-[2.5rem] bg-[#B8FF3C]/5 blur-xl" />
                            <span className="relative">{initials}</span>
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mb-4">
                                <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tighter italic leading-none">{fullName}</h2>
                                <div className="flex items-center gap-1.5 bg-[#B8FF3C] text-black text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-[#B8FF3C]/20">
                                    <ShieldCheck size={14} />
                                    VERIFIED ELITE
                                </div>
                            </div>
                            <div className="flex flex-wrap justify-center sm:justify-start gap-5 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                                <div className="flex items-center gap-2"><Star size={14} className="text-amber-400 fill-amber-400" /> 5.0 RATING</div>
                                <div className="flex items-center gap-2 border-l border-white/10 pl-5"><Calendar size={14} /> {coach.yearsExp || "5+"}Y EXP</div>
                                <div className="flex items-center gap-2 border-l border-white/10 pl-5 text-[#B8FF3C]"><Zap size={14} fill="currentColor" /> ACTIVE STATUS</div>
                            </div>
                        </div>
                        <button onClick={onClose} className="absolute top-8 right-8 w-11 h-11 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
                            <X size={22} className="rotate-0 hover:rotate-90 transition-transform duration-300" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
                        <div className="space-y-10">
                            <div>
                                <h4 className="text-[#B8FF3C] text-[10px] font-black uppercase tracking-[0.3em] mb-4">The Methodology</h4>
                                <p className="text-slate-400 text-base leading-relaxed font-medium">{coach.bio || "Exclusive coaching methodology tailored for high-performance individuals."}</p>
                            </div>
                            <div>
                                <h4 className="text-[#B8FF3C] text-[10px] font-black uppercase tracking-[0.3em] mb-4">Elite Mastery</h4>
                                <div className="flex flex-wrap gap-2">
                                    {coach.specialties?.map(s => (
                                        <span key={s} className="bg-white/[0.03] border border-white/5 rounded-xl px-5 py-2.5 text-[11px] text-white font-black tracking-wide uppercase">{s}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 space-y-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 text-[#B8FF3C]/10"><CreditCard size={48} /></div>
                                <h4 className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Professional Access</h4>
                                <div className="flex items-baseline gap-2 mb-8">
                                    <span className="text-[10px] text-[#B8FF3C] font-black mb-1">₹</span>
                                    <span className="text-4xl sm:text-5xl font-black text-white italic">{coach.paidChatEnabled ? coach.chatFeeINR : "FREE"}</span>
                                    <span className="text-[10px] text-white/40 font-black uppercase ml-1">Per connection</span>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-[#B8FF3C]/10 flex items-center justify-center text-[#B8FF3C] shrink-0 mt-0.5"><Check size={16} /></div>
                                        <div>
                                            <p className="text-white text-sm font-black leading-tight">Instant Priority Access</p>
                                            <p className="text-[11px] text-slate-500 font-medium">Bypass the queue for direct 1:1 consultation.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-[#B8FF3C]/10 flex items-center justify-center text-[#B8FF3C] shrink-0 mt-0.5"><Check size={16} /></div>
                                        <div>
                                            <p className="text-white text-sm font-black leading-tight">Verified Transactions</p>
                                            <p className="text-[11px] text-slate-500 font-medium">Secure payments processed via Razorpay.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-10 border-t border-white/5">
                        <button
                            onClick={() => { onConnect(coach); onClose(); }}
                            className="flex-1 w-full bg-[#B8FF3C] text-black font-black text-sm py-5 px-2 rounded-[1.5rem] shadow-2xl shadow-[#B8FF3C]/20 hover:bg-[#d4ff6e] transition-all transform hover:-translate-y-1 active:translate-y-0"
                        >
                            {coach.paidChatEnabled ? `PAY ₹${coach.chatFeeINR} & CONNECT` : "CONNECT WITH COACH"}
                        </button>
                        <button onClick={onClose} className="flex-1 w-full bg-white/5 text-white/40 hover:text-white font-black text-sm py-5 px-2 rounded-[1.5rem] border border-white/5 hover:bg-white/10 transition-all">
                            CLOSE PROFILE
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Icons ───────────────────────────────────────────────────────────────────
function X({ size, className }: { size: number; className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
        </svg>
    );
}

function CreditCard({ size }: { size: number }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" />
        </svg>
    );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

const FILTERS = ["All", "Strength", "Nutrition", "Weight Loss", "Performance", "HIIT", "Muscle Gain"];

export default function FindCoachPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [coaches, setCoaches] = useState<Coach[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");
    const [viewCoach, setViewCoach] = useState<Coach | null>(null);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        async function fetchCoaches() {
            try {
                const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
                const res = await fetch(`${apiBase}/api/user/coaches`);
                const json = await res.json();
                if (json.success) setCoaches(json.data);
            } catch (error) {
                console.error("Failed to load coaches", error);
            } finally {
                setLoading(false);
            }
        }
        fetchCoaches();
    }, []);

    const processPayment = async (coach: Coach) => {
        if (!session?.user?.id) return;
        setIsProcessingPayment(true);
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

        try {
            // 1. Create Order
            const orderRes = await fetch(`${apiBase}/api/payment/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: session.user.id, coachId: coach.user._id })
            });
            const orderJson = await orderRes.json();

            if (!orderJson.success) throw new Error(orderJson.error);

            // 1.5 Dev Mode Bypass
            if (orderJson.order.id.startsWith("order_dev_")) {
                showToast("🛠 Dev Mode: Razerpay keys not detected. Bypassing payment.", "info");
                await finalizeRequest(coach.user._id);
                return;
            }

            // 2. Razorpay Modal
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: orderJson.order.amount,
                currency: "INR",
                name: "NutriSnap Elite Coaching",
                description: `Consultation fee for ${coach.firstName} ${coach.lastName}`,
                order_id: orderJson.order.id,
                theme: { color: "#B8FF3C" },
                handler: async (response: any) => {
                    // 3. Verify Payment
                    const verifyRes = await fetch(`${apiBase}/api/payment/verify`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(response)
                    });
                    const verifyJson = await verifyRes.json();

                    if (verifyJson.success) {
                        // 4. Finalize Connection
                        await finalizeRequest(coach.user._id);
                    } else {
                        showToast("Payment verification failed.", "error");
                    }
                },
                modal: {
                    ondismiss: () => setIsProcessingPayment(false)
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (err: any) {
            showToast(`Payment Error: ${err.message}`, "error");
            setIsProcessingPayment(false);
        }
    };

    const finalizeRequest = async (coachId: string) => {
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const res = await fetch(`${apiBase}/api/coach/request`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ memberId: session?.user?.id, coachId })
            });
            const json = await res.json();
            if (json.success) showToast("Payment successful! Request sent to coach.", "success");
            else showToast(json.error || "Payment passed but final request failed.", "error");
        } catch (error) {
            showToast("Error completing request.", "error");
        } finally {
            setIsProcessingPayment(false);
        }
    };

    const handleConnect = async (coach: Coach) => {
        if (!session?.user?.id) {
            router.push('/login');
            return;
        }

        if (coach.paidChatEnabled) {
            await processPayment(coach);
        } else {
            await finalizeRequest(coach.user._id);
        }
    };

    const filtered = coaches.filter((c) => {
        const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
        const matchSearch = fullName.includes(search.toLowerCase());
        const matchFilter = activeFilter === "All" ||
            c.specialties?.some(s => s.toLowerCase() === activeFilter.toLowerCase());
        return matchSearch && matchFilter;
    });

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-6">
                <Loader2 className="w-12 h-12 text-[#B8FF3C] animate-spin" />
                <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Syncing Elite Coach Network...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 sm:space-y-12 pb-20 pt-4 sm:pt-6 max-w-[1400px] mx-auto overflow-x-hidden px-4 sm:px-6 lg:px-8">
            {isProcessingPayment && (
                <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-[#13131A] p-10 rounded-[2.5rem] border border-white/5 flex flex-col items-center gap-6 shadow-2xl">
                        <Loader2 className="w-10 h-10 text-[#B8FF3C] animate-spin" />
                        <p className="text-white font-black text-xs uppercase tracking-widest">Processing Secure Payment...</p>
                    </div>
                </div>
            )}

            <div className="animate-fade-in relative mt-4 sm:mt-0">
                {/* Background Glow */}
                <div className="absolute -top-24 -left-20 sm:-left-24 w-72 h-72 sm:w-96 sm:h-96 bg-[#B8FF3C]/5 blur-[100px] sm:blur-[120px] rounded-full" />

                <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-white tracking-tighter leading-[0.9] sm:leading-[0.9] mb-4 sm:mb-6 italic relative">
                    World-Class Guidance. <br className="hidden sm:block" />
                    <span className="text-[#B8FF3C] block sm:inline mt-2 sm:mt-0">Quantified Results.</span>
                </h1>
                <p className="text-slate-400 text-[15px] sm:text-base md:text-lg max-w-2xl leading-relaxed font-medium relative">
                    Access high-performance transformation experts in our verified elite network.
                    NutriSnap intelligence meets real-world professional coaching experience.
                </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between border-y border-white/5 py-6 sm:py-8 bg-white/[0.01] -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="flex overflow-x-auto w-full lg:w-auto pb-4 sm:pb-0 sm:flex-wrap gap-2.5 custom-scrollbar snap-x">
                    {FILTERS.map((f) => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={`whitespace-nowrap shrink-0 px-5 sm:px-6 py-3 sm:py-2.5 rounded-xl text-[11px] sm:text-[10px] font-black tracking-widest uppercase transition-all transform active:scale-95 snap-center ${activeFilter === f ? "bg-[#B8FF3C] text-black shadow-lg shadow-[#B8FF3C]/20" : "bg-white/5 text-white/30 hover:text-white hover:bg-white/10"
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
                <div className="relative w-full lg:w-96 shrink-0">
                    <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" />
                    <input
                        type="text"
                        placeholder="Filter by master coach name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-6 py-4 text-[11px] font-black uppercase text-white outline-none focus:border-[#B8FF3C]/30 transition-all placeholder:text-white/10 focus:bg-white/[0.05]"
                    />
                </div>
            </div>

            {filtered.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
                    {filtered.map((coach) => (
                        <CoachCard
                            key={coach._id}
                            coach={coach}
                            onConnect={handleConnect}
                            onViewProfile={(c) => setViewCoach(c)}
                        />
                    ))}
                </div>
            ) : (
                <div className="py-32 flex flex-col items-center justify-center text-center gap-6 border border-dashed border-white/10 rounded-[3.5rem] bg-white/[0.01]">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                        <User className="text-white/10" size={32} />
                    </div>
                    <div className="space-y-1">
                        <p className="text-white font-black text-xl">No Coaches Found</p>
                        <p className="text-slate-500 text-sm">Try adjusting your search or category filters.</p>
                    </div>
                </div>
            )}

            {viewCoach && (
                <CoachProfileModal
                    coach={viewCoach}
                    onClose={() => setViewCoach(null)}
                    onConnect={handleConnect}
                />
            )}

            <AnimatePresence>
                {toast && <Toast message={toast.message} type={toast.type} />}
            </AnimatePresence>
        </div>
    );
}