"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { MessageSquare } from "lucide-react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Client {
    id: string | number;
    initials: string;
    name: string;
    goal: "WEIGHT LOSS" | "MUSCLE GAIN" | "MAINTENANCE";
    status: "Active" | "Inactive";
    progress: number;
    calories: number;
    protein: string;
    workouts: string;
    lastActive: string;
    avatarColor: string;
    weight: number;
    weightDelta: string;
    bmi: number;
    bmiLabel: string;
    bodyFat: number;
    bodyFatDelta: string;
    adherenceScore: number;
    adherenceData: number[];
    tier: string;
    joined: string;
    meals: Meal[];
    coachNote: string;
}

interface Meal {
    id: number;
    name: string;
    kcal: number;
    protein: number;
    status: "logged" | "pending";
    emoji: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const goalColors: Record<string, string> = {
    "WEIGHT LOSS": "bg-[#a3e635]/20 text-[#a3e635] border border-[#a3e635]/30",
    "MUSCLE GAIN": "bg-orange-500/20 text-orange-400 border border-orange-500/30",
    "MAINTENANCE": "bg-indigo-400/20 text-indigo-300 border border-indigo-400/30",
};

const progressColor = (pct: number) =>
    pct >= 75 ? "#a3e635" : pct >= 50 ? "#f97316" : "#ef4444";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ initials, color, size = "md" }: {
    initials: string; color: string; size?: "sm" | "md" | "lg";
}) {
    const sz = { sm: "w-9 h-9 text-sm", md: "w-11 h-11 text-sm", lg: "w-14 h-14 text-lg" }[size];
    return (
        <div
            className={`${sz} rounded-full flex items-center justify-center font-bold border-2 shrink-0`}
            style={{ borderColor: color, color, background: `${color}18` }}
        >
            {initials}
        </div>
    );
}

// ── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <div className="bg-[#1a2208] border border-[#2a3a10] rounded-xl p-3 flex flex-col gap-0.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</span>
            <span className="text-lg font-bold text-white leading-tight">{value}</span>
            {sub && <span className="text-[10px] text-gray-500">{sub}</span>}
        </div>
    );
}

// ── Adherence Chart ───────────────────────────────────────────────────────────

function AdherenceChart({ data, score }: { data: number[]; score: number }) {
    const max = Math.max(...data, 1);
    return (
        <div className="bg-[#111a05] border border-[#2a3a10] rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-gray-300">Weekly Adherence</span>
                <span className="text-2xl font-black text-[#a3e635]">
                    {score}<span className="text-xs text-gray-500">/100</span>
                </span>
            </div>
            <div className="flex items-end gap-1.5 h-16">
                {data.map((v, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 flex-1">
                        <div
                            className="w-full rounded-sm"
                            style={{ height: `${(v / max) * 48}px`, background: v > 60 ? "#a3e635" : "#3d5210" }}
                        />
                        <span className="text-[8px] text-gray-600">{DAYS[i]}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── MealItem ──────────────────────────────────────────────────────────────────

function MealItem({ meal }: { meal: Meal }) {
    const pending = meal.status === "pending";
    return (
        <div className={`flex items-center gap-3 p-3 rounded-xl border
            ${pending ? "border-[#2a3a10] opacity-60" : "border-[#3a5015] bg-[#1a2208]"}`}
        >
            <div className="w-9 h-9 rounded-lg bg-[#2a3a10] flex items-center justify-center text-lg shrink-0">
                {meal.emoji}
            </div>
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${pending ? "text-gray-500 italic" : "text-gray-200"}`}>
                    {meal.name}
                </p>
                <p className="text-[10px] text-gray-500">{meal.kcal} kcal · {meal.protein}g Protein</p>
            </div>
            {!pending && (
                <div className="w-5 h-5 rounded-full bg-[#a3e635] flex items-center justify-center shrink-0">
                    <span className="text-[9px] text-black font-bold">✓</span>
                </div>
            )}
        </div>
    );
}

// ── Client Detail Panel ───────────────────────────────────────────────────────

function ClientDetail({ client, onClose }: { client: Client; onClose: () => void }) {
    return (
        /*
         * Uses flex-col with a fixed header + independently scrollable body.
         * This prevents the profile from ever scrolling out of view on mobile.
         */
        <div className="flex flex-col h-full bg-[#0d1408]">

            {/* ── Fixed header — never scrolls ── */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a3a10] shrink-0">
                <h2 className="text-base font-bold text-white">Client Details</h2>
                <button
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1a2208] text-gray-500 hover:text-white hover:bg-[#2a3a10] transition-colors text-sm"
                >
                    ✕
                </button>
            </div>

            {/* ── Profile strip — always visible below header ── */}
            <div className="flex items-center gap-4 px-5 py-4 border-b border-[#2a3a10] shrink-0">
                <Avatar initials={client.initials} color={client.avatarColor} size="lg" />
                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="text-lg font-bold text-white truncate">{client.name}</h3>
                        <Link 
                            href={`/coach/messages?memberId=${client.id}`}
                            className="p-2 rounded-xl bg-[#a3e635] text-black hover:scale-105 transition-all shadow-lg shadow-[#a3e635]/20 flex items-center justify-center"
                            title="Message Client"
                        >
                            <MessageSquare size={16} />
                        </Link>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 mb-2">Joined: {client.joined}</p>
                    <div className="flex flex-wrap gap-1.5">
                        <span className="text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#a3e635]/15 text-[#a3e635] border border-[#a3e635]/30">
                            {client.tier}
                        </span>
                        <span className="text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            ACTIVE
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
                <div className="p-5 space-y-4 pb-16">

                    {/* Body stats */}
                    <div className="grid grid-cols-3 gap-2">
                        <StatCard label="Weight" value={`${client.weight}`} sub={client.weightDelta} />
                        <StatCard label="BMI" value={`${client.bmi}`} sub={client.bmiLabel} />
                        <StatCard label="Body Fat" value={`${client.bodyFat}%`} sub={client.bodyFatDelta} />
                    </div>

                    {/* Adherence */}
                    <AdherenceChart data={client.adherenceData} score={client.adherenceScore} />

                    {/* Meals */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-300 mb-2">Today's Meal Log</h4>
                        <div className="space-y-2">
                            {client.meals.map((m) => <MealItem key={m.id} meal={m} />)}
                        </div>
                    </div>

                    {/* Coach note */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-300 mb-2">Coach Notes</h4>
                        <div className="bg-[#1a2208] border border-[#2a3a10] rounded-xl p-4">
                            <p className="text-sm text-gray-400 italic leading-relaxed">"{client.coachNote}"</p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

// ── Client Card ───────────────────────────────────────────────────────────────

function ClientCard({ client, selected, onClick }: {
    client: Client; selected: boolean; onClick: () => void;
}) {
    const pColor = progressColor(client.progress);
    return (
        <div
            onClick={onClick}
            className={`bg-[#111a05] border rounded-2xl p-4 sm:p-5 cursor-pointer transition-all
                hover:border-[#a3e635]/50 hover:shadow-lg hover:shadow-[#a3e635]/5
                ${selected ? "border-[#a3e635]/60 shadow-lg shadow-[#a3e635]/10" : "border-[#2a3a10]"}`}
        >
            {/* Top row */}
            <div className="flex items-start justify-between mb-3 gap-2">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                        <Avatar initials={client.initials} color={client.avatarColor} />
                        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#111a05]
                            ${client.status === "Active" ? "bg-[#a3e635]" : "bg-gray-500"}`} />
                    </div>
                    <div className="min-w-0">
                        <p className="font-bold text-white text-sm truncate">{client.name}</p>
                        <span className={`text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-full ${goalColors[client.goal]}`}>
                            {client.goal}
                        </span>
                    </div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#a3e635]/15 text-[#a3e635] border border-[#a3e635]/30 shrink-0">
                    {client.status}
                </span>
            </div>

            {/* Progress */}
            <div className="mb-3">
                <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                    <span>Weekly Goal Progress</span>
                    <span className="font-bold" style={{ color: pColor }}>{client.progress}%</span>
                </div>
                <div className="h-1.5 bg-[#2a3a10] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${client.progress}%`, background: pColor }} />
                </div>
            </div>

            {/* Macros */}
            <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                    { label: "CAL", value: client.calories.toLocaleString() },
                    { label: "PROTEIN", value: client.protein },
                    { label: "WORKOUTS", value: client.workouts },
                ].map((s) => (
                    <div key={s.label} className="bg-[#1a2208] border border-[#2a3a10] rounded-lg p-2 text-center">
                        <p className="text-[8px] tracking-widest text-gray-500 uppercase">{s.label}</p>
                        <p className="text-xs font-bold text-white mt-0.5">{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center pt-2 border-t border-[#1a2208]">
                <div className="flex items-center gap-2">
                   <Link 
                     href={`/coach/messages?memberId=${client.id}`}
                     onClick={(e) => e.stopPropagation()}
                     className="p-1.5 rounded-lg bg-white/5 text-[#a3e635] hover:bg-[#a3e635]/10 active:scale-95 transition-all flex items-center justify-center"
                   >
                     <MessageSquare size={14} />
                   </Link>
                   <span className="text-[10px] text-gray-600">Last active: {client.lastActive}</span>
                </div>
                <span className="text-[#a3e635] text-[10px] font-semibold">View Profile →</span>
            </div>
        </div>
    );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function CardSkeleton() {
    return (
        <div className="bg-[#111a05] border border-[#2a3a10] rounded-2xl p-5 space-y-4 animate-pulse">
            <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#2a3a10]" />
                <div className="space-y-2 flex-1">
                    <div className="h-3 bg-[#2a3a10] rounded w-2/3" />
                    <div className="h-2 bg-[#2a3a10] rounded w-1/3" />
                </div>
            </div>
            <div className="h-1.5 bg-[#2a3a10] rounded-full" />
            <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-[#2a3a10] rounded-lg" />)}
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [selected, setSelected] = useState<Client | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<"All" | "Active" | "Pending">("All");
    const [search, setSearch] = useState("");
    const [panelOpen, setPanelOpen] = useState(false);

    const { data: session } = useSession();

    useEffect(() => {
        if (!session?.user?.id) return;
        (async () => {
            setIsLoading(true);
            try {
                const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                
                // Fetch active clients
                const res = await fetch(`${apiBase}/api/coach/clients/${session.user.id}`);
                const data = await res.json();
                if (data.success && data.data) {
                    setClients(data.data);
                }

                // Fetch pending requests
                const reqRes = await fetch(`${apiBase}/api/coach/requests/${session.user.id}`);
                const reqData = await reqRes.json();
                if (reqData.success && reqData.data) {
                    setPendingRequests(reqData.data);
                }

            } catch {
                setError("Failed to fetch data from server");
            } finally {
                setIsLoading(false);
            }
        })();
    }, [session]);

    const filtered = clients.filter((c) => {
        const matchFilter = filter === "All" || (filter === "Active" && c.status === "Active");
        if (filter === "Pending") return false; // Handled separately
        const matchSearch =
            search === "" ||
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.goal.toLowerCase().includes(search.toLowerCase());
        return matchFilter && matchSearch;
    });

    const activeCount = clients.filter((c) => c.status === "Active").length;
    const pendingCount = pendingRequests.length;

    const handleSelect = (c: Client) => { setSelected(c); setPanelOpen(true); };
    const closePanel = () => setPanelOpen(false);

    // When detail panel is open on desktop, the list gets narrower →
    // switch from 2-col grid to 1-col so cards don't get crushed.
    const gridClass = panelOpen && selected
        ? "grid-cols-1 sm:grid-cols-1 lg:grid-cols-1 xl:grid-cols-2"
        : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3";

    return (
        /**
         * Outer flex row:
         *   • LEFT  = scrollable client list (flex-1, shrinks when panel opens)
         *   • RIGHT = fixed-width detail panel (desktop only, hidden on mobile)
         *
         * Mobile: detail renders as a fixed full-viewport overlay instead.
         */
        <div className="flex h-[calc(100vh-120px)] overflow-hidden -mx-4 md:-mx-6 mt-[-1.5rem] mb-[-1.5rem]">

            {/* ══════════ LEFT — list ══════════ */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">

                    {/* Page header */}
                    <div className="flex items-start justify-between flex-wrap gap-2 mb-5">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black text-white">My Clients</h1>
                            <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                {activeCount} active client{activeCount !== 1 ? "s" : ""} this month
                            </p>
                        </div>
                        {/* Mobile: reopen panel */}
                        {selected && !panelOpen && (
                            <button
                                onClick={() => setPanelOpen(true)}
                                className="lg:hidden text-xs font-bold text-[#a3e635] bg-[#a3e635]/10 border border-[#a3e635]/30 px-3 py-1.5 rounded-xl"
                            >
                                {selected.name.split(" ")[0]} →
                            </button>
                        )}
                    </div>

                    {/* Search + Filter */}
                    <div className="flex gap-2 mb-5">
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-sm">🔍</span>
                            <input
                                className="w-full bg-[#111a05] border border-[#2a3a10] rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-[#a3e635]/50 transition-colors"
                                placeholder="Search by name, goal, or status..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 shrink-0">
                            {(["All", "Active", "Pending"] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all relative
                                        ${filter === f
                                            ? "bg-[#a3e635] text-black shadow-lg shadow-[#a3e635]/20"
                                            : "bg-[#111a05] border border-[#2a3a10] text-gray-400 hover:text-white"
                                        }`}
                                >
                                    {f}
                                    {f === 'Pending' && pendingCount > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-[#0d1408]">
                                            {pendingCount}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    {isLoading ? (
                        <div className={`grid ${gridClass} gap-4`}>
                            {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
                        </div>
                    ) : error ? (
                        <div className="py-20 flex flex-col items-center gap-3 text-center">
                            <span className="text-3xl">⚠️</span>
                            <p className="text-sm text-red-400">{error}</p>
                            <button onClick={() => window.location.reload()} className="text-[#a3e635] text-sm font-bold hover:underline">
                                Try again
                            </button>
                        </div>
                    ) : filter === 'Pending' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                            {pendingRequests.length === 0 ? (
                                <div className="col-span-full py-20 flex flex-col items-center gap-3 border-2 border-dashed border-[#2a3a10] rounded-2xl">
                                    <span className="text-4xl opacity-30">📬</span>
                                    <p className="text-sm text-gray-500">No pending coach requests.</p>
                                </div>
                            ) : (
                                pendingRequests.map(req => (
                                    <div key={req.id} className="bg-[#13131A] border border-[#2a3a10] p-6 rounded-3xl group hover:border-[#B8FF3C]/30 transition-all flex flex-col justify-between">
                                        <div className="flex items-start gap-4 mb-6">
                                            <div className="w-16 h-16 rounded-2xl bg-[#B8FF3C]/10 flex items-center justify-center text-[#B8FF3C] text-2xl font-black border border-[#B8FF3C]/20">
                                                {req.name?.[0] || 'U'}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-white">{req.name}</h3>
                                                <p className="text-xs text-slate-500 mt-1">{req.time}</p>
                                                <div className="mt-2 text-[10px] bg-white/5 inline-block px-2 py-0.5 rounded text-slate-400 font-bold uppercase tracking-wider">Requested Coach</div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="bg-[#0A0A0F] p-3 rounded-2xl border border-white/5">
                                                    <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Goal</div>
                                                    <div className="text-xs font-bold text-white uppercase">{req.profile?.goal || 'Maintenance'}</div>
                                                </div>
                                                <div className="bg-[#0A0A0F] p-3 rounded-2xl border border-white/5">
                                                    <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Weight</div>
                                                    <div className="text-xs font-bold text-white">{req.profile?.weightKg || '??'} kg</div>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={async () => {
                                                        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                                                        await fetch(`${apiBase}/api/coach/accept`, {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ relationshipId: req.id })
                                                        });
                                                        window.location.reload();
                                                    }}
                                                    className="flex-1 py-3 bg-[#B8FF3C] text-[#0A0A0F] rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#B8FF3C]/10"
                                                >
                                                    Accept
                                                </button>
                                                <button className="flex-1 py-3 bg-white/5 text-slate-400 border border-white/5 rounded-2xl font-black text-sm hover:bg-white/10 transition-all uppercase tracking-widest">
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-20 flex flex-col items-center gap-3 border-2 border-dashed border-[#2a3a10] rounded-2xl">
                            <span className="text-4xl opacity-30">👥</span>
                            <p className="text-sm text-gray-500">No clients match your search.</p>
                            {search && (
                                <button onClick={() => setSearch("")} className="text-[#a3e635] text-xs font-bold hover:underline">
                                    Clear search
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className={`grid ${gridClass} gap-4 pb-10 transition-all duration-300`}>
                            {filtered.map((c) => (
                                <ClientCard
                                    key={c.id}
                                    client={c}
                                    selected={selected?.id === c.id && panelOpen}
                                    onClick={() => handleSelect(c)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ══════════ RIGHT — Desktop detail panel ══════════ */}
            {selected && panelOpen && (
                <div className="hidden lg:flex w-[360px] xl:w-[400px] 2xl:w-[440px] shrink-0 border-l border-[#2a3a10] flex-col overflow-hidden">
                    <ClientDetail client={selected} onClose={closePanel} />
                </div>
            )}

            {/* ══════════ MOBILE — Overlay ══════════ */}
            {selected && panelOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex">
                    {/* tap-to-close backdrop */}
                    <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={closePanel} />
                    {/* slide-in panel - 100dvh accounts for mobile browser chrome */}
                    <div
                        className="relative ml-auto flex flex-col shadow-2xl border-l border-[#2a3a10]"
                        style={{ width: "min(90vw, 380px)", height: "100dvh" }}
                    >
                        <ClientDetail client={selected} onClose={closePanel} />
                    </div>
                </div>
            )}
        </div>
    );
}