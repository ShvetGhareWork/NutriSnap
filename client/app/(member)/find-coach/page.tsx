"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Search, Star, ChevronDown, Zap, Check, User, Info, Loader2, Calendar } from "lucide-react";

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
};

// ── Components ─────────────────────────────────────────────────────────────────

function CoachCard({ coach, onConnect, onViewProfile }: { 
    coach: Coach; 
    onConnect: (id: string) => void;
    onViewProfile: (coach: Coach) => void; 
}) {
    const fullName = `${coach.firstName} ${coach.lastName}`;
    const initials = (coach.firstName[0] || "") + (coach.lastName[0] || "");
    const rating = 5.0; // Mocked for now
    const price = 49; // Mocked for now

    return (
        <div className="bg-[#13131A] border border-white/5 rounded-3xl p-6 hover:border-[#B8FF3C]/20 transition-all duration-300 group flex flex-col h-full">
            <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl flex items-center justify-center font-black text-white text-lg border border-white/10 shrink-0 shadow-lg group-hover:shadow-[#B8FF3C]/10 transition-all">
                    {initials || "C"}
                </div>
                <div className="flex items-center gap-1.5 bg-[#B8FF3C]/10 text-[#B8FF3C] px-2.5 py-1 rounded-lg border border-[#B8FF3C]/20">
                    <Star size={12} className="fill-[#B8FF3C]" />
                    <span className="text-[11px] font-black">{rating.toFixed(1)}</span>
                </div>
            </div>

            <div className="mb-4">
                <h3 className="font-black text-white text-lg leading-tight mb-2 group-hover:text-[#B8FF3C] transition-colors">
                    {fullName}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                    {coach.specialties?.slice(0, 3).map((s) => (
                        <span key={s} className="text-[10px] font-black tracking-wider px-2 py-0.5 rounded-md border bg-white/5 text-white/40 border-white/5 uppercase">
                            {s}
                        </span>
                    ))}
                    {(!coach.specialties || coach.specialties.length === 0) && (
                        <span className="text-[10px] font-black tracking-wider px-2 py-0.5 rounded-md border bg-white/5 text-white/40 border-white/5 uppercase">
                            GENERAL WELLNESS
                        </span>
                    )}
                </div>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed mb-6 line-clamp-3">
                {coach.bio || "No bio provided. This coach is ready to help you reach your goals."}
            </p>

            <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between mb-6">
                <div>
                    <span className="text-2xl font-black text-white">${price}</span>
                    <span className="text-xs text-slate-500 font-bold ml-1 uppercase">/mo</span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{coach.yearsExp || "5+"}Y Experience</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={() => onConnect(coach.user._id)}
                    className="flex items-center justify-center gap-2 bg-[#B8FF3C] hover:bg-[#d4ff6e] text-black font-black text-xs py-3 rounded-2xl transition-all active:scale-[0.98]"
                >
                    CONNECT
                </button>
                <button 
                    onClick={() => onViewProfile(coach)}
                    className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/8 text-white font-black text-xs py-3 rounded-2xl transition-all active:scale-[0.98]"
                >
                    PROFILE
                </button>
            </div>
        </div>
    );
}

function CoachProfileModal({ coach, onClose, onConnect }: { coach: Coach; onClose: () => void; onConnect: (id: string) => void }) {
    const fullName = `${coach.firstName} ${coach.lastName}`;
    const initials = (coach.firstName[0] || "") + (coach.lastName[0] || "");

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-[#090e03] border-t sm:border border-white/10 rounded-t-[2.5rem] sm:rounded-[3rem] overflow-hidden flex flex-col max-h-[92vh] shadow-2xl animate-slide-up">
                <div className="p-8 sm:p-10 overflow-y-auto custom-scrollbar">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 mb-10">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-slate-700 to-slate-900 rounded-[2.5rem] flex items-center justify-center font-black text-white text-3xl sm:text-4xl border border-white/10 shrink-0">
                            {initials}
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-3">
                                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">{fullName}</h2>
                                <span className="bg-[#B8FF3C] text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">VERIFIED</span>
                            </div>
                            <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-slate-500 text-sm font-bold uppercase tracking-widest">
                                <div className="flex items-center gap-1.5"><Star size={14} className="text-amber-400 fill-amber-400" /> 5.0 RATING</div>
                                <div className="flex items-center gap-1.5"><Calendar size={14} /> {coach.yearsExp || "5+"}Y EXP</div>
                                <div className="flex items-center gap-1.5"><Zap size={14} className="text-[#B8FF3C]" /> ELITE COACH</div>
                            </div>
                        </div>
                        <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white">
                            <Info size={20} className="rotate-45" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                        <div className="space-y-8">
                            <div>
                                <h4 className="text-[#B8FF3C] text-[11px] font-black uppercase tracking-[0.2em] mb-3">About Coach</h4>
                                <p className="text-slate-400 text-base leading-relaxed">{coach.bio || "No bio available."}</p>
                            </div>
                            {coach.certifications && (
                                <div>
                                    <h4 className="text-[#B8FF3C] text-[11px] font-black uppercase tracking-[0.2em] mb-3">Certifications</h4>
                                    <div className="flex flex-wrap gap-2 text-xs text-white/70">
                                        {coach.certifications}
                                    </div>
                                </div>
                            )}
                            <div>
                                <h4 className="text-[#B8FF3C] text-[11px] font-black uppercase tracking-[0.2em] mb-3">Specialties</h4>
                                <div className="flex flex-wrap gap-2">
                                    {coach.specialties?.map(s => (
                                        <span key={s} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-[#B8FF3C] font-black tracking-wide">{s.toUpperCase()}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 space-y-6">
                            <div className="bg-[#0D0D12] rounded-[1.5rem] p-5 border border-white/5">
                                <h4 className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-4">Methodology</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-[#B8FF3C]/10 flex items-center justify-center text-[#B8FF3C]"><Check size={14} /></div>
                                        <p className="text-white/70 text-sm font-bold">{coach.coachingStyle}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-[#B8FF3C]/10 flex items-center justify-center text-[#B8FF3C]"><Check size={14} /></div>
                                        <p className="text-white/70 text-sm font-bold">{coach.clientMethod}</p>
                                    </div>
                                    {coach.gymName && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-[#B8FF3C]/10 flex items-center justify-center text-[#B8FF3C]"><Check size={14} /></div>
                                            <p className="text-white/70 text-sm font-bold">{coach.gymName}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-white/5">
                        <button 
                            onClick={() => { onConnect(coach.user._id); onClose(); }} 
                            className="flex-1 bg-[#B8FF3C] text-black font-black text-sm py-4 rounded-2xl shadow-xl shadow-[#B8FF3C]/10"
                        >
                            CONNECT WITH COACH
                        </button>
                        <button onClick={onClose} className="flex-1 bg-white/5 text-white font-black text-sm py-4 rounded-2xl border border-white/10">
                            CLOSE PROFILE
                        </button>
                    </div>
                </div>
            </div>
        </div>
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

    const handleConnect = async (coachId: string) => {
        if (!session?.user?.id) return;
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const res = await fetch(`${apiBase}/api/coach/request`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ memberId: session.user.id, coachId })
            });
            const json = await res.json();
            if (json.success) alert("Request sent successfully!");
            else alert(json.error || "Failed to send request.");
        } catch (error) {
            alert("Connection error.");
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
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-[#B8FF3C] animate-spin" />
                <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Curating Elite Coach Network...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            <div>
                <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4">
                    Expert Guidance. <br />
                    <span className="text-[#B8FF3C]">Hyper-Personalized.</span>
                </h1>
                <p className="text-slate-400 text-sm sm:text-lg max-w-2xl leading-relaxed">
                    Connect with industry-leading transformation experts who use NutriSnap's AI intelligence 
                    to drive your real-world physical results. Only verified professionals.
                </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between border-y border-white/5 py-6">
                <div className="flex-1 flex flex-wrap gap-2">
                    {FILTERS.map((f) => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={`px-5 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${
                                activeFilter === f ? "bg-[#B8FF3C] text-black" : "bg-white/5 text-white/40 hover:text-white"
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
                <div className="relative w-full lg:w-72">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                        type="text"
                        placeholder="SEARCH BY NAME..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-[10px] font-black uppercase text-white outline-none"
                    />
                </div>
            </div>

            {filtered.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
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
                <div className="py-24 flex flex-col items-center justify-center text-center gap-4 border border-dashed border-white/5 rounded-[3rem]">
                    <User className="text-white/20" size={32} />
                    <p className="text-white font-black text-lg">No coaches found.</p>
                </div>
            )}

            {viewCoach && (
                <CoachProfileModal 
                    coach={viewCoach} 
                    onClose={() => setViewCoach(null)} 
                    onConnect={handleConnect}
                />
            )}

            <div className="bg-[#B8FF3C]/5 border border-[#B8FF3C]/10 rounded-[2.5rem] p-8 mt-12 flex flex-col md:flex-row items-center gap-8">
                <div className="w-16 h-16 rounded-2xl bg-[#B8FF3C] flex items-center justify-center shrink-0">
                    <Zap className="text-black" size={32} fill="black" />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h3 className="text-xl font-black text-white mb-2">Want Instant Support?</h3>
                    <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
                        Our internal Pro AI Assistant is always available in your dashboard for real-time meal analysis.
                    </p>
                </div>
                <button 
                  onClick={() => router.push('/member/dashboard')}
                  className="bg-white/5 text-white font-black text-xs px-8 py-4 rounded-2xl border border-white/10"
                >
                    Go to Dashboard
                </button>
            </div>
        </div>
    );
}