"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
    Dumbbell, Calendar, ChevronRight, User, ArrowLeft,
    Loader2, Sparkles, Flame, Timer, RotateCcw, ChevronDown, ChevronUp
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ExerciseItem {
    id: string;
    name: string;
    sets: string;
    reps: string;
    rest: string;
    note?: string;
}

interface CardioItem {
    id: string;
    machine: string;
    duration: string;
    intensity: string;
}

interface Week {
    id: number;
    name: string;
    detail: string;
    exercises?: ExerciseItem[];
    cardio?: CardioItem[];
}

interface AssignedProgram {
    _id: string;
    title: string;
    category: string;
    description: string;
    weeks: number;
    level: string;
    emoji: string;
    gradientFrom: string;
    gradientTo: string;
    weeksData: Week[];
    coachInfo: {
        id: string;
        name: string;
        email: string;
    } | null;
    assignedAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const INTENSITY_COLORS: Record<string, { text: string; bg: string }> = {
    "Low (Zone 1–2)": { text: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20" },
    "Moderate (Zone 2–3)": { text: "text-green-400", bg: "bg-green-400/10 border-green-400/20" },
    "High (Zone 3–4)": { text: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20" },
    "HIIT": { text: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/20" },
    "Fasted Cardio": { text: "text-purple-400", bg: "bg-purple-400/10 border-purple-400/20" },
    "Steady State": { text: "text-teal-400", bg: "bg-teal-400/10 border-teal-400/20" },
    "Interval": { text: "text-red-400", bg: "bg-red-400/10 border-red-400/20" },
};

const CATEGORY_STYLES: Record<string, string> = {
    Bulking: "bg-lime-400/15 text-lime-400 border-lime-400/25",
    Cutting: "bg-orange-400/15 text-orange-400 border-orange-400/25",
    Maintenance: "bg-sky-400/15 text-sky-300 border-sky-400/25",
    Strength: "bg-purple-400/15 text-purple-300 border-purple-400/25",
};

const MUSCLE_EMOJI: Record<string, string> = {
    "Barbell": "🏋️", "Dumbbell": "💪", "Cable": "🔗", "Machine": "⚙️",
    "Pull": "↑", "Push": "↓", "Row": "↔️", "Squat": "🦵", "Deadlift": "⚡",
    "Curl": "💪", "Press": "🏋️", "Fly": "🦅", "Plank": "🧘", "Crunch": "🎯",
};

function getExerciseEmoji(name: string): string {
    for (const [key, emoji] of Object.entries(MUSCLE_EMOJI)) {
        if (name.includes(key)) return emoji;
    }
    return "🏋️";
}

// ── Week Detail Expanded Card ─────────────────────────────────────────────────

function WeekDetailCard({ week, index }: { week: Week; index: number }) {
    const [open, setOpen] = useState(false);
    const hasExercises = (week.exercises?.length ?? 0) > 0;
    const hasCardio = (week.cardio?.length ?? 0) > 0;
    const hasContent = hasExercises || hasCardio;

    return (
        <div className={`rounded-2xl sm:rounded-3xl border transition-all duration-300 overflow-hidden ${open ? "border-[#B8FF3C]/30 bg-[#0e1409]" : "border-white/5 bg-[#13131A] hover:border-white/10"}`}>
            {/* Row Header */}
            <button
                onClick={() => hasContent && setOpen(!open)}
                className="w-full flex items-center gap-4 sm:gap-5 p-4 sm:p-5 text-left group"
            >
                {/* Week number */}
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-sm sm:text-base font-black shrink-0 transition-all ${open ? "bg-[#B8FF3C] text-[#0A0A0F]" : "bg-white/5 text-slate-600 group-hover:text-[#B8FF3C]"}`}>
                    {String(week.id).padStart(2, "0")}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <p className={`text-sm sm:text-base font-black uppercase tracking-tight transition-colors ${open ? "text-[#B8FF3C]" : "text-white group-hover:text-[#B8FF3C]"}`}>
                        {week.name}
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 font-bold tracking-wider uppercase mt-0.5 truncate">{week.detail}</p>
                    {/* Mini badges */}
                    {hasContent && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {hasExercises && (
                                <span className="flex items-center gap-1 text-[9px] font-black bg-[#B8FF3C]/10 text-[#B8FF3C] border border-[#B8FF3C]/20 px-2 py-0.5 rounded-full">
                                    💪 {week.exercises!.length} exercise{week.exercises!.length !== 1 ? "s" : ""}
                                </span>
                            )}
                            {hasCardio && (
                                <span className="flex items-center gap-1 text-[9px] font-black bg-orange-400/10 text-orange-400 border border-orange-400/20 px-2 py-0.5 rounded-full">
                                    🏃 {week.cardio!.length} cardio
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Toggle icon */}
                <div className={`shrink-0 transition-colors ${open ? "text-[#B8FF3C]" : "text-slate-700 group-hover:text-slate-400"}`}>
                    {!hasContent ? (
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider hidden sm:block">No content</span>
                    ) : open ? (
                        <ChevronUp size={18} />
                    ) : (
                        <ChevronDown size={18} />
                    )}
                </div>
            </button>

            {/* Expanded Content */}
            {open && hasContent && (
                <div className="px-4 sm:px-6 pb-5 sm:pb-6 space-y-5">
                    <div className="h-px bg-white/5" />

                    {/* Exercises */}
                    {hasExercises && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Dumbbell size={12} className="text-[#B8FF3C]" />
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                    Training Exercises
                                </p>
                            </div>
                            <div className="space-y-2">
                                {week.exercises!.map((ex, i) => (
                                    <div key={ex.id} className="flex items-start gap-3 bg-white/[0.03] border border-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-4 hover:border-white/10 transition-colors group">
                                        {/* Index */}
                                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#B8FF3C]/10 border border-[#B8FF3C]/15 flex items-center justify-center text-[10px] font-black text-[#B8FF3C] shrink-0 mt-0.5">
                                            {i + 1}
                                        </div>

                                        {/* Name + note */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-white truncate">{ex.name}</p>
                                            {ex.note && (
                                                <p className="text-[10px] text-slate-500 italic mt-0.5 truncate">📝 {ex.note}</p>
                                            )}
                                        </div>

                                        {/* Stats row */}
                                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                                            <span className="flex items-center gap-1 bg-white/5 border border-white/5 px-2 py-1 rounded-lg text-[10px] font-black text-slate-300">
                                                <RotateCcw size={9} className="text-slate-500" />
                                                {ex.sets}×
                                            </span>
                                            <span className="flex items-center gap-1 bg-[#B8FF3C]/10 border border-[#B8FF3C]/15 px-2 py-1 rounded-lg text-[10px] font-black text-[#B8FF3C]">
                                                {ex.reps} reps
                                            </span>
                                            <span className="flex items-center gap-1 bg-white/5 border border-white/5 px-2 py-1 rounded-lg text-[10px] font-black text-slate-400">
                                                <Timer size={9} className="text-slate-500" />
                                                {ex.rest}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Cardio */}
                    {hasCardio && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Flame size={12} className="text-orange-400" />
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                    Cardio Sessions
                                </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {week.cardio!.map((c) => {
                                    const style = INTENSITY_COLORS[c.intensity] ?? { text: "text-slate-400", bg: "bg-white/5 border-white/10" };
                                    return (
                                        <div key={c.id} className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-4 hover:border-white/10 transition-colors">
                                            <div className="w-9 h-9 rounded-xl bg-orange-400/10 border border-orange-400/15 flex items-center justify-center text-base shrink-0">
                                                🏃
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-black text-white truncate">{c.machine}</p>
                                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                                    <span className="text-[10px] font-bold text-slate-500">{c.duration}</span>
                                                    <span className="text-slate-700">·</span>
                                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border ${style.bg} ${style.text}`}>
                                                        {c.intensity}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Program Detail View ───────────────────────────────────────────────────────

function ProgramDetail({ program, onBack }: { program: AssignedProgram; onBack: () => void }) {
    const totalExercises = program.weeksData?.reduce((acc, w) => acc + (w.exercises?.length ?? 0), 0) ?? 0;
    const totalCardio = program.weeksData?.reduce((acc, w) => acc + (w.cardio?.length ?? 0), 0) ?? 0;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-24">
            {/* Back */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-500 hover:text-[#B8FF3C] transition-all group focus:outline-none"
            >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-xs font-black uppercase tracking-[0.2em]">Back to Protocols</span>
            </button>

            {/* Hero card */}
            <div className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] border border-white/5 shadow-2xl bg-[#0D0D12]">
                <div
                    className="h-52 sm:h-72 flex items-center justify-center relative overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${program.gradientFrom}, ${program.gradientTo})` }}
                >
                    <span className="text-[8rem] sm:text-[12rem] opacity-25 select-none blur-[1px]">{program.emoji}</span>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D12] via-[#0D0D12]/10 to-transparent" />
                    <div className="absolute bottom-6 sm:bottom-8 left-5 sm:left-8 right-5 sm:right-8">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest border ${CATEGORY_STYLES[program.category] ?? "bg-white/10 text-white border-white/20"}`}>
                                {program.category}
                            </span>
                            <span className="bg-white/10 backdrop-blur-md text-white/80 text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest border border-white/10">
                                {program.level}
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight tracking-tight">{program.title}</h1>
                        <p className="text-slate-400 text-xs sm:text-sm mt-2 sm:mt-3 italic border-l-2 border-[#B8FF3C] pl-3 leading-relaxed line-clamp-2">
                            "{program.description}"
                        </p>
                    </div>
                </div>

                {/* Meta strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/5 border-t border-white/5">
                    {[
                        { icon: <User size={14} />, label: "Coach", value: program.coachInfo?.name?.split(" ")[0] ?? "Unknown" },
                        { icon: <Calendar size={14} />, label: "Assigned", value: new Date(program.assignedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) },
                        { icon: <Dumbbell size={14} />, label: "Duration", value: `${program.weeks} Weeks` },
                        { icon: <Flame size={14} />, label: "Exercises", value: `${totalExercises} total` },
                    ].map((m, i) => (
                        <div key={i} className="flex items-center gap-2.5 px-4 sm:px-5 py-3 sm:py-4">
                            <div className="text-[#B8FF3C] shrink-0">{m.icon}</div>
                            <div>
                                <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">{m.label}</p>
                                <p className="text-xs sm:text-sm font-black text-white mt-0.5 truncate">{m.value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Overview pills */}
            {(totalExercises > 0 || totalCardio > 0) && (
                <div className="flex flex-wrap gap-3">
                    {totalExercises > 0 && (
                        <div className="flex items-center gap-2 bg-[#B8FF3C]/10 border border-[#B8FF3C]/20 rounded-xl px-4 py-2.5">
                            <Dumbbell size={13} className="text-[#B8FF3C]" />
                            <span className="text-xs font-black text-[#B8FF3C]">{totalExercises} Total Exercises</span>
                        </div>
                    )}
                    {totalCardio > 0 && (
                        <div className="flex items-center gap-2 bg-orange-400/10 border border-orange-400/20 rounded-xl px-4 py-2.5">
                            <Flame size={13} className="text-orange-400" />
                            <span className="text-xs font-black text-orange-400">{totalCardio} Cardio Sessions</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-4 py-2.5">
                        <Calendar size={13} className="text-slate-500" />
                        <span className="text-xs font-black text-slate-400">{program.weeks} Week Program</span>
                    </div>
                </div>
            )}

            {/* Week list */}
            <div>
                <div className="flex items-center gap-4 mb-4">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Protocol Structure</p>
                    <div className="h-px bg-white/5 flex-1" />
                    <p className="text-[10px] text-slate-600 font-bold">{program.weeksData?.length ?? 0} weeks</p>
                </div>
                <div className="space-y-3">
                    {program.weeksData?.map((week, i) => (
                        <WeekDetailCard key={week.id} week={week} index={i} />
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── Program Card ──────────────────────────────────────────────────────────────

function ProgramCard({ program, onClick }: { program: AssignedProgram; onClick: () => void }) {
    const totalExercises = program.weeksData?.reduce((acc, w) => acc + (w.exercises?.length ?? 0), 0) ?? 0;
    const totalCardio = program.weeksData?.reduce((acc, w) => acc + (w.cardio?.length ?? 0), 0) ?? 0;

    return (
        <div
            onClick={onClick}
            className="bg-[#13131A] border border-white/5 rounded-[2rem] overflow-hidden group hover:border-[#B8FF3C]/30 transition-all duration-300 cursor-pointer shadow-xl hover:shadow-[#B8FF3C]/5 flex flex-col"
        >
            {/* Image */}
            <div
                className="h-36 sm:h-44 flex items-center justify-center relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${program.gradientFrom}, ${program.gradientTo})` }}
            >
                <span className="text-7xl opacity-30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 select-none">{program.emoji}</span>
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                <div className="absolute top-4 left-4 flex flex-wrap gap-1.5">
                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest border ${CATEGORY_STYLES[program.category] ?? "bg-black/50 text-white border-white/10"} backdrop-blur-sm`}>
                        {program.category}
                    </span>
                    <span className="text-[9px] font-black px-2 py-1 rounded-lg bg-black/40 backdrop-blur-sm text-white/70 border border-white/10 uppercase tracking-wider">
                        {program.level}
                    </span>
                </div>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 flex flex-col flex-1">
                <h3 className="font-black text-white text-lg sm:text-xl leading-tight tracking-tight mb-1 group-hover:text-[#B8FF3C] transition-colors">
                    {program.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed italic flex-1">"{program.description}"</p>

                {/* Stats row */}
                <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-[10px] font-black text-slate-500 bg-white/5 border border-white/5 px-2.5 py-1.5 rounded-lg">
                        📅 {program.weeks}wk
                    </span>
                    {totalExercises > 0 && (
                        <span className="text-[10px] font-black text-[#B8FF3C] bg-[#B8FF3C]/10 border border-[#B8FF3C]/15 px-2.5 py-1.5 rounded-lg">
                            💪 {totalExercises} exercises
                        </span>
                    )}
                    {totalCardio > 0 && (
                        <span className="text-[10px] font-black text-orange-400 bg-orange-400/10 border border-orange-400/15 px-2.5 py-1.5 rounded-lg">
                            🏃 {totalCardio} cardio
                        </span>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-800/60 border border-white/5 flex items-center justify-center text-xs font-black text-[#B8FF3C] uppercase">
                            {program.coachInfo?.name?.slice(0, 1) ?? "?"}
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest leading-none">Coach</p>
                            <p className="text-xs font-black text-slate-300 leading-tight mt-0.5">
                                {program.coachInfo?.name?.split(" ")[0] ?? "Unknown"}
                            </p>
                        </div>
                    </div>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-500 group-hover:bg-[#B8FF3C] group-hover:text-[#0A0A0F] transition-all">
                        <ChevronRight size={14} />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CoachPage() {
    const { data: session } = useSession();
    const [programs, setPrograms] = useState<AssignedProgram[]>([]);
    const [selected, setSelected] = useState<AssignedProgram | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!session?.user?.id) return;
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        fetch(`${apiBase}/api/programs/member/${session.user.id}`)
            .then(r => r.json())
            .then(json => { if (json.success) setPrograms(json.data); })
            .catch(err => console.error("Failed to fetch programs", err))
            .finally(() => setLoading(false));
    }, [session]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-[#B8FF3C]/10 rounded-full" />
                    <div className="absolute inset-0 border-4 border-[#B8FF3C] border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-slate-500 text-xs font-black uppercase tracking-[0.25em] animate-pulse">Loading Protocols</p>
            </div>
        );
    }

    if (selected) {
        return <ProgramDetail program={selected} onBack={() => setSelected(null)} />;
    }

    return (
        <div className="max-w-6xl mx-auto py-2">
            {/* Header */}
            <div className="mb-8 sm:mb-12">
                <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">Coach Protocols</h2>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#B8FF3C]/10 rounded-xl flex items-center justify-center shrink-0">
                        <Sparkles className="text-[#B8FF3C]" size={15} />
                    </div>
                </div>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    Professional training protocols designed specifically for your goals.
                </p>
                {programs.length > 0 && (
                    <div className="flex flex-wrap gap-3 mt-4">
                        <span className="text-[10px] font-black text-slate-600 bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl">
                            {programs.length} Protocol{programs.length !== 1 ? "s" : ""} Assigned
                        </span>
                        <span className="text-[10px] font-black text-[#B8FF3C] bg-[#B8FF3C]/10 border border-[#B8FF3C]/15 px-3 py-1.5 rounded-xl">
                            💪 {programs.reduce((a, p) => a + (p.weeksData?.reduce((b, w) => b + (w.exercises?.length ?? 0), 0) ?? 0), 0)} Total Exercises
                        </span>
                    </div>
                )}
            </div>

            {/* Empty state */}
            {programs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 sm:py-28 px-6 text-center border-2 border-dashed border-white/5 rounded-[2.5rem] bg-white/[0.01]">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/5 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center text-4xl sm:text-5xl mb-6 grayscale opacity-40 rotate-[-6deg]">
                        📋
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white mb-2">No Protocols Yet</h3>
                    <p className="text-slate-500 max-w-sm text-sm font-medium leading-relaxed">
                        Once your coach assigns your training protocol, it will appear here with full exercise details.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                    {programs.map(p => (
                        <ProgramCard key={p._id} program={p} onClick={() => setSelected(p)} />
                    ))}
                </div>
            )}
        </div>
    );
}