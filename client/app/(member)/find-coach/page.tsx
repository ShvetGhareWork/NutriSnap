"use client";

import { useState } from "react";
import { Search, Star, ChevronDown, Zap, Check } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type Tag = { label: string; color: string };
type Coach = {
    id: number;
    name: string;
    avatar: string;
    avatarBg: string;
    badge?: { label: string; color: string };
    tags: Tag[];
    bio: string;
    price: string | number;
    priceUnit?: string;
    rating: number;
    reviews?: number;
    cta: string;
    secondary: string;
    isAI?: boolean;
};

// ── Mock data ─────────────────────────────────────────────────────────────────
const FEATURED = {
    name: "Elena Rodriguez",
    role: "Elite Performance Specialist",
    bio: "Elite Performance Specialist with 10+ years experience in metabolic conditioning and Olympic lifting. Elena has helped over 500 athletes reach their peak physical form.",
    stats: [
        { value: "98%", label: "Success Rate" },
        { value: "1.2k", label: "Sessions" },
        { value: "Elite", label: "Certification" },
    ],
};

const COACHES: Coach[] = [
    {
        id: 1,
        name: "MacroSnap AI",
        avatar: "🤖",
        avatarBg: "bg-[#1E2B12]",
        badge: { label: "INSTANT", color: "bg-[#B8FF3C]/15 text-[#B8FF3C] border-[#B8FF3C]/30" },
        tags: [{ label: "24/7 AVAILABILITY", color: "bg-blue-500/15 text-blue-400 border-blue-500/20" }],
        bio: "Personalized nutrition assistant with instant macro analysis, meal planning, and workout advice anytime you need it.",
        price: "Free",
        rating: 4.8,
        cta: "Activate AI",
        secondary: "Features",
        isAI: true,
    },
    {
        id: 2,
        name: "Coach Alex Rivers",
        avatar: "AR",
        avatarBg: "bg-gradient-to-br from-slate-600 to-slate-800",
        badge: { label: "MOST POPULAR", color: "bg-amber-400/15 text-amber-400 border-amber-400/30" },
        tags: [
            { label: "HYPERTROPHY", color: "bg-purple-500/15 text-purple-400 border-purple-500/20" },
            { label: "PERFORMANCE", color: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
        ],
        bio: "Science-based muscle growth specialist focusing on high-intensity training and movement mechanics.",
        price: 49,
        priceUnit: "/mo",
        rating: 4.9,
        reviews: 120,
        cta: "Connect",
        secondary: "View Profile",
    },
    {
        id: 3,
        name: "Sarah Jenkins",
        avatar: "SJ",
        avatarBg: "bg-gradient-to-br from-rose-500 to-pink-700",
        tags: [
            { label: "NUTRITION", color: "bg-[#B8FF3C]/15 text-[#B8FF3C] border-[#B8FF3C]/30" },
            { label: "FAT LOSS", color: "bg-orange-500/15 text-orange-400 border-orange-500/20" },
        ],
        bio: "Registered dietitian helping you build sustainable eating habits without restrictive dieting.",
        price: 65,
        priceUnit: "/mo",
        rating: 5.0,
        reviews: 85,
        cta: "Connect",
        secondary: "View Profile",
    },
    {
        id: 4,
        name: "David Moore",
        avatar: "DM",
        avatarBg: "bg-gradient-to-br from-blue-600 to-blue-900",
        tags: [
            { label: "STRENGTH", color: "bg-red-500/15 text-red-400 border-red-500/20" },
            { label: "CONDITIONING", color: "bg-slate-500/15 text-slate-400 border-slate-500/20" },
        ],
        bio: "Focusing on powerlifting and functional strength for longevity and everyday performance.",
        price: 39,
        priceUnit: "/mo",
        rating: 4.7,
        reviews: 42,
        cta: "Connect",
        secondary: "View Profile",
    },
    {
        id: 5,
        name: "Maya Patel",
        avatar: "MP",
        avatarBg: "bg-gradient-to-br from-violet-600 to-indigo-800",
        badge: { label: "NEW", color: "bg-violet-500/15 text-violet-400 border-violet-500/30" },
        tags: [
            { label: "YOGA", color: "bg-violet-500/15 text-violet-400 border-violet-500/20" },
            { label: "MOBILITY", color: "bg-teal-500/15 text-teal-400 border-teal-500/20" },
        ],
        bio: "Certified yoga instructor and mobility specialist helping athletes move pain-free and improve flexibility.",
        price: 45,
        priceUnit: "/mo",
        rating: 4.9,
        reviews: 67,
        cta: "Connect",
        secondary: "View Profile",
    },
    {
        id: 6,
        name: "Marcus Thompson",
        avatar: "MT",
        avatarBg: "bg-gradient-to-br from-emerald-600 to-green-900",
        tags: [
            { label: "ENDURANCE", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
            { label: "MARATHON", color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20" },
        ],
        bio: "Former Olympic marathon runner turned coach. Specializes in aerobic base building and race-day preparation.",
        price: 55,
        priceUnit: "/mo",
        rating: 4.8,
        reviews: 93,
        cta: "Connect",
        secondary: "View Profile",
    },
    {
        id: 7,
        name: "Lisa Chen",
        avatar: "LC",
        avatarBg: "bg-gradient-to-br from-amber-500 to-orange-700",
        badge: { label: "TOP RATED", color: "bg-amber-400/15 text-amber-400 border-amber-400/30" },
        tags: [
            { label: "WEIGHT LOSS", color: "bg-orange-500/15 text-orange-400 border-orange-500/20" },
            { label: "LIFESTYLE", color: "bg-pink-500/15 text-pink-400 border-pink-500/20" },
        ],
        bio: "Holistic wellness coach combining behavioral psychology with evidence-based nutrition for lasting transformation.",
        price: 59,
        priceUnit: "/mo",
        rating: 5.0,
        reviews: 158,
        cta: "Connect",
        secondary: "View Profile",
    },
    {
        id: 8,
        name: "Jake Russo",
        avatar: "JR",
        avatarBg: "bg-gradient-to-br from-red-600 to-rose-900",
        tags: [
            { label: "CROSSFIT", color: "bg-red-500/15 text-red-400 border-red-500/20" },
            { label: "HIIT", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20" },
        ],
        bio: "CrossFit Level 3 trainer and competitive athlete. Builds elite conditioning through structured high-intensity programming.",
        price: 42,
        priceUnit: "/mo",
        rating: 4.6,
        reviews: 54,
        cta: "Connect",
        secondary: "View Profile",
    },
];

const FILTERS = ["All", "AI Coaches", "Strength", "Nutrition", "Weight Loss", "Endurance", "Mobility"];

// ── Avatar ─────────────────────────────────────────────────────────────────────
function CoachAvatar({ coach, size = "md" }: { coach: Coach; size?: "sm" | "md" | "lg" }) {
    const sz = { sm: "w-10 h-10 text-sm", md: "w-12 h-12 text-base", lg: "w-14 h-14 text-lg" }[size];
    return (
        <div className={`${sz} ${coach.avatarBg} rounded-2xl flex items-center justify-center font-black text-white flex-shrink-0 border border-white/10`}>
            {coach.isAI ? <span className="text-xl">{coach.avatar}</span> : <span>{coach.avatar}</span>}
        </div>
    );
}

// ── Coach Card ─────────────────────────────────────────────────────────────────
function CoachCard({ coach, onConnect }: { coach: any, onConnect: (id: string) => void }) {
    // Handling both our mock format and the new Backend Profile format
    const name = coach.firstName ? `${coach.firstName} ${coach.lastName}` : coach.name;
    const initial = coach.firstName ? coach.firstName.charAt(0) : (coach.avatar || 'C');

    return (
        <div className="bg-[#13131A] border border-white/8 rounded-2xl p-5 flex flex-col gap-4 hover:border-[#B8FF3C]/20 transition-all duration-200 group">
            {/* Top row */}
            <div className="flex items-start justify-between gap-2">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-800 rounded-2xl flex items-center justify-center font-black text-white flex-shrink-0 border border-white/10">
                    {initial}
                </div>
            </div>

            {/* Name + tags */}
            <div>
                <h3 className="font-black text-white text-base leading-tight mb-2">{name}</h3>
                <div className="flex flex-wrap gap-1.5">
                    {coach.specialties ? coach.specialties.map((t: string) => (
                        <span key={t} className="text-[10px] font-black tracking-wider px-2 py-0.5 rounded-md border bg-[#B8FF3C]/15 text-[#B8FF3C] border-[#B8FF3C]/30">
                            {t}
                        </span>
                    )) : coach.tags?.map((t: any) => (
                        <span key={t.label} className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded-md border ${t.color}`}>
                            {t.label}
                        </span>
                    ))}
                </div>
            </div>

            {/* Bio */}
            <p className="text-sm text-slate-400 leading-relaxed flex-1 line-clamp-3">{coach.bio}</p>

            {/* Price + rating */}
            <div className="flex items-center justify-between">
                <div>
                    <span className="text-2xl font-black text-white">
                        $49<span className="text-sm text-slate-400 font-medium">/mo</span>
                    </span>
                </div>
                <div className="flex items-center gap-1 text-sm text-slate-400">
                    <Star size={13} className="text-amber-400 fill-amber-400" />
                    <span className="font-bold text-white">5.0</span>
                </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-2">
                <button
                    onClick={() => onConnect(coach.user || coach.id)}
                    className="w-full bg-[#B8FF3C] text-[#0A0A0F] font-black text-sm py-2.5 rounded-xl hover:bg-[#d4ff6e] transition-colors"
                >
                    Connect
                </button>
                <button className="w-full bg-white/5 border border-white/8 text-white font-bold text-sm py-2.5 rounded-xl hover:bg-white/8 hover:border-white/15 transition-colors">
                    View Profile
                </button>
            </div>
        </div>
    );
}

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function FindCoachPage() {
    const { data: session } = useSession();
    const router = useRouter();

    const [coaches, setCoaches] = useState<any[]>(COACHES); // Fallback to mock initially
    const [activeFilter, setActiveFilter] = useState("All");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch real coaches from Backend DB
        async function fetchCoaches() {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/user/coaches`);
                const json = await res.json();
                if (json.success && json.data.length > 0) {
                    setCoaches(json.data); // Override with DB data
                }
            } catch (err) {
                console.error("Failed to load coaches from DB", err);
            } finally {
                setLoading(false);
            }
        }
        fetchCoaches();
    }, []);

    const connectWithCoach = async (coachUserId: string) => {
        if (!session?.user?.id) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/coach/request`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    memberId: session.user.id,
                    coachId: coachUserId
                })
            });
            const json = await res.json();
            if (json.success) {
                alert("Request sent successfully! Once the coach accepts, they will be able to see your logs.");
                // Update local state to reflect requested status if needed
            } else {
                alert(json.error || "Failed to send request");
            }
        } catch (err) {
            console.error("Failed to connect coach", err);
        }
    };

    const filtered = coaches.filter((c) => {
        const name = c.firstName ? `${c.firstName} ${c.lastName}` : c.name;
        const matchSearch = name.toLowerCase().includes(search.toLowerCase());
        if (activeFilter === "All") return matchSearch;
        if (activeFilter === "AI Coaches") return c.isAI && matchSearch;

        // Match against specialties (DB) or tags (mock)
        const specialties = c.specialties || (c.tags ? c.tags.map((t: any) => t.label) : []);
        return (
            matchSearch &&
            specialties.some((s: string) => s.toLowerCase().includes(activeFilter.toLowerCase()))
        );
    });

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div>
                <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">Find Your Coach</h1>
                <p className="text-slate-400 mt-2 text-sm sm:text-base max-w-xl">
                    Choose from our elite network of AI and human experts to accelerate your transformation.
                </p>
            </div>

            {/* ── Featured Coach ── */}
            <div className="bg-[#13131A] border border-white/8 rounded-2xl overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                    {/* Photo placeholder */}
                    <div className="w-full sm:w-64 lg:w-80 h-48 sm:h-auto bg-gradient-to-br from-slate-700 to-slate-900 flex-shrink-0 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-[#13131A]/60 to-transparent sm:bg-gradient-to-r" />
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#B8FF3C]/30 to-emerald-500/30 flex items-center justify-center">
                            <span className="text-5xl font-black text-white/20">ER</span>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 p-5 sm:p-7 flex flex-col justify-center gap-4">
                        <div>
                            <span className="text-[10px] font-black tracking-widest text-[#B8FF3C] border border-[#B8FF3C]/30 bg-[#B8FF3C]/10 px-3 py-1 rounded-full inline-block mb-3">
                                FEATURED COACH
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-black text-white">{FEATURED.name}</h2>
                            <p className="text-slate-400 text-sm mt-2 leading-relaxed max-w-lg">{FEATURED.bio}</p>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-6 sm:gap-8">
                            {FEATURED.stats.map((s) => (
                                <div key={s.label}>
                                    <p className="text-xl sm:text-2xl font-black text-[#B8FF3C]">{s.value}</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-0.5">{s.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Buttons */}
                        <div className="flex flex-wrap gap-3">
                            <button className="bg-[#B8FF3C] text-[#0A0A0F] font-black text-sm px-6 py-2.5 rounded-xl hover:bg-[#d4ff6e] transition-colors">
                                Connect Now
                            </button>
                            <button className="bg-white/5 border border-white/10 text-white font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-white/8 transition-colors">
                                View Success Stories
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Search + Filters ── */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-shrink-0 w-full sm:w-56">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search coach name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-[#13131A] border border-white/8 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#B8FF3C]/30 transition-colors"
                    />
                </div>

                {/* Filter pills - scrollable on mobile */}
                <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {FILTERS.map((f) => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={`flex-shrink-0 text-xs font-bold px-4 py-2 rounded-full border transition-all ${activeFilter === f
                                ? "bg-[#B8FF3C] text-[#0A0A0F] border-[#B8FF3C]"
                                : "bg-[#13131A] text-slate-400 border-white/8 hover:text-white hover:border-white/20"
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* Sort */}
                <button className="flex-shrink-0 flex items-center gap-2 bg-[#13131A] border border-white/8 text-slate-400 text-sm px-4 py-2.5 rounded-xl hover:text-white hover:border-white/15 transition-colors whitespace-nowrap">
                    Sort: Recommended
                    <ChevronDown size={14} />
                </button>
            </div>

            {/* ── Coach Grid ── */}
            {filtered.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map((coach) => (
                        <CoachCard key={coach.id || coach._id} coach={coach} onConnect={connectWithCoach} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 text-slate-500">
                    <p className="text-lg font-bold">No coaches found</p>
                    <p className="text-sm mt-1">Try a different search or filter</p>
                </div>
            )}
        </div>
    );
}