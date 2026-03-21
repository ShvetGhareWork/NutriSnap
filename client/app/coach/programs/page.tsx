"use client";

import { useState, useEffect } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Category = "All" | "Cutting" | "Bulking" | "Maintenance" | "Strength";
type Level = "Beginner" | "Intermediate" | "Advanced" | "Elite";

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
    exercises: ExerciseItem[];
    cardio: CardioItem[];
}

interface Program {
    id: string | number;
    title: string;
    category: Exclude<Category, "All">;
    description: string;
    weeks: number;
    level: Level;
    clients: number;
    gradientFrom: string;
    gradientTo: string;
    emoji: string;
    weeksData?: Week[];
}

interface CoachClient {
    id: string;
    name: string;
}

// ── Gym Data ──────────────────────────────────────────────────────────────────

const MUSCLE_GROUPS = ["Chest", "Back", "Shoulders", "Biceps", "Triceps", "Legs", "Glutes", "Core", "Full Body"] as const;
type MuscleGroup = typeof MUSCLE_GROUPS[number];

const EXERCISES: Record<MuscleGroup, string[]> = {
    Chest: ["Barbell Bench Press", "Incline Dumbbell Press", "Cable Fly", "Dumbbell Fly", "Push-Up", "Pec Deck", "Chest Dip", "Landmine Press"],
    Back: ["Deadlift", "Pull-Up", "Barbell Row", "Seated Cable Row", "Lat Pulldown", "T-Bar Row", "Single Arm Row", "Face Pull"],
    Shoulders: ["Overhead Press", "Lateral Raise", "Front Raise", "Arnold Press", "Rear Delt Fly", "Upright Row", "Cable Lateral Raise", "Machine Shoulder Press"],
    Biceps: ["Barbell Curl", "Dumbbell Curl", "Hammer Curl", "Preacher Curl", "Cable Curl", "Incline Curl", "Concentration Curl", "Reverse Curl"],
    Triceps: ["Tricep Pushdown", "Skull Crusher", "Overhead Tricep Extension", "Close Grip Bench", "Dips", "Kickbacks", "Cable Overhead Extension", "Diamond Push-Up"],
    Legs: ["Barbell Squat", "Leg Press", "Romanian Deadlift", "Leg Extension", "Leg Curl", "Hack Squat", "Bulgarian Split Squat", "Walking Lunge"],
    Glutes: ["Hip Thrust", "Glute Bridge", "Cable Kickback", "Step-Up", "Sumo Squat", "Donkey Kick", "Abductor Machine", "Good Morning"],
    Core: ["Plank", "Cable Crunch", "Hanging Leg Raise", "Ab Rollout", "Russian Twist", "Bicycle Crunch", "Decline Crunch", "Side Plank"],
    "Full Body": ["Deadlift", "Clean and Press", "Kettlebell Swing", "Burpee", "Thruster", "Sled Push", "Battle Ropes", "Box Jump"],
};

const SET_OPTIONS = ["1", "2", "3", "4", "5", "6"];
const REP_OPTIONS = ["3–5", "5", "6–8", "8–10", "10–12", "12–15", "15–20", "20–25", "30", "AMRAP", "Failure"];
const REST_OPTIONS = ["30s", "45s", "60s", "90s", "2 min", "3 min", "5 min"];
const CARDIO_MACHINES = ["Treadmill", "Stationary Bike", "Elliptical", "Rowing Machine", "Stair Climber", "Assault Bike", "Ski Erg", "Jump Rope", "Outdoor Run", "Swimming"];
const CARDIO_DURATIONS = ["10 min", "15 min", "20 min", "25 min", "30 min", "40 min", "45 min", "60 min"];
const CARDIO_INTENSITIES = ["Low (Zone 1–2)", "Moderate (Zone 2–3)", "High (Zone 3–4)", "HIIT", "Fasted Cardio", "Steady State", "Interval"];

const INTENSITY_COLORS: Record<string, string> = {
    "Low (Zone 1–2)": "text-blue-400",
    "Moderate (Zone 2–3)": "text-green-400",
    "High (Zone 3–4)": "text-yellow-400",
    "HIIT": "text-orange-400",
    "Fasted Cardio": "text-purple-400",
    "Steady State": "text-teal-400",
    "Interval": "text-red-400",
};

const CATEGORY_COLORS: Record<string, string> = {
    Bulking: "bg-lime-400/20 text-lime-400 border border-lime-400/30",
    Cutting: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
    Maintenance: "bg-sky-400/20 text-sky-300 border border-sky-400/30",
    Strength: "bg-purple-400/20 text-purple-300 border border-purple-400/30",
};

const CATEGORIES: Category[] = ["All", "Cutting", "Bulking", "Maintenance", "Strength"];



// ── Small reusable chip button ────────────────────────────────────────────────

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all shrink-0 ${active
                    ? "bg-[#a3e635]/20 border border-[#a3e635] text-[#a3e635]"
                    : "bg-[#1a2208] border border-[#2a3a10] text-gray-400 hover:text-white hover:border-[#3a5010]"
                }`}
        >
            {label}
        </button>
    );
}

function SmallChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`px-2 py-1.5 rounded-lg text-[10px] font-black transition-all shrink-0 ${active
                    ? "bg-[#a3e635] text-black"
                    : "bg-[#1a2208] border border-[#2a3a10] text-gray-500 hover:text-white"
                }`}
        >
            {label}
        </button>
    );
}

// ── Week Builder Modal ────────────────────────────────────────────────────────

function WeekBuilderModal({ week, onConfirm, onClose }: {
    week: Week;
    onConfirm: (updated: Week) => void;
    onClose: () => void;
}) {
    const [tab, setTab] = useState<"exercises" | "cardio">("exercises");
    const [selectedGroup, setSelectedGroup] = useState<MuscleGroup>("Chest");
    const [exercises, setExercises] = useState<ExerciseItem[]>(week.exercises);
    const [cardio, setCardio] = useState<CardioItem[]>(week.cardio);
    const [weekName, setWeekName] = useState(week.name);

    const [pickedExercise, setPickedExercise] = useState(EXERCISES.Chest[0]);
    const [pickedSets, setPickedSets] = useState("3");
    const [pickedReps, setPickedReps] = useState("8–10");
    const [pickedRest, setPickedRest] = useState("90s");
    const [pickedNote, setPickedNote] = useState("");

    const [pickedMachine, setPickedMachine] = useState(CARDIO_MACHINES[0]);
    const [pickedDuration, setPickedDuration] = useState("30 min");
    const [pickedIntensity, setPickedIntensity] = useState(CARDIO_INTENSITIES[0]);

    const addExercise = () => {
        setExercises(prev => [...prev, { id: `ex-${Date.now()}`, name: pickedExercise, sets: pickedSets, reps: pickedReps, rest: pickedRest, note: pickedNote }]);
        setPickedNote("");
    };
    const removeExercise = (id: string) => setExercises(prev => prev.filter(e => e.id !== id));

    const addCardio = () => {
        setCardio(prev => [...prev, { id: `c-${Date.now()}`, machine: pickedMachine, duration: pickedDuration, intensity: pickedIntensity }]);
    };
    const removeCardio = (id: string) => setCardio(prev => prev.filter(c => c.id !== id));

    const handleConfirm = () => {
        const detail = [
            exercises.length > 0 ? `${exercises.length} EXERCISE${exercises.length > 1 ? "S" : ""}` : null,
            cardio.length > 0 ? `${cardio.length} CARDIO SESSION${cardio.length > 1 ? "S" : ""}` : null,
        ].filter(Boolean).join(" • ") || "CUSTOM WEEK";
        onConfirm({ ...week, name: weekName, detail, exercises, cardio });
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />

            {/*
              * Mobile : bottom-sheet style (slides up, max 92dvh, rounded top corners)
              * Desktop: centered modal (max-w-3xl, rounded all corners)
              */}
            <div className="relative w-full sm:max-w-3xl bg-[#0a100a] border border-[#2a3a10]
                            rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl
                            max-h-[92dvh] sm:max-h-[95vh] overflow-hidden">

                {/* ── Header ── */}
                <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-[#2a3a10] shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#a3e635]/15 border border-[#a3e635]/30 flex items-center justify-center text-xs font-black text-[#a3e635] shrink-0">
                            {week.id}
                        </div>
                        <input
                            className="bg-transparent text-white font-black text-sm sm:text-base focus:outline-none border-b border-transparent focus:border-[#a3e635]/50 transition-colors min-w-0 w-full"
                            value={weekName}
                            onChange={e => setWeekName(e.target.value)}
                        />
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white w-7 h-7 flex items-center justify-center shrink-0 ml-2">✕</button>
                </div>

                {/* ── Tabs ── */}
                <div className="flex gap-1 px-4 sm:px-5 pt-3 pb-0 shrink-0 border-b border-[#2a3a10]">
                    {(["exercises", "cardio"] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`px-3 sm:px-4 py-2 text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all border-b-2 -mb-px ${tab === t ? "text-[#a3e635] border-[#a3e635]" : "text-gray-600 border-transparent hover:text-gray-400"
                                }`}
                        >
                            {t === "exercises" ? `💪 Exercises (${exercises.length})` : `🏃 Cardio (${cardio.length})`}
                        </button>
                    ))}
                </div>

                {/* ── Scrollable body ── */}
                <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5 py-4 space-y-4">

                    {/* ══ EXERCISES ══ */}
                    {tab === "exercises" && (
                        <>
                            {/* Muscle groups */}
                            <div>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Muscle Group</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {MUSCLE_GROUPS.map(g => (
                                        <button
                                            key={g}
                                            onClick={() => { setSelectedGroup(g); setPickedExercise(EXERCISES[g][0]); }}
                                            className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-black transition-all ${selectedGroup === g
                                                    ? "bg-[#a3e635] text-black"
                                                    : "bg-[#1a2208] border border-[#2a3a10] text-gray-500 hover:text-white"
                                                }`}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Picker card */}
                            <div className="bg-[#111a05] border border-[#2a3a10] rounded-xl p-3 sm:p-4 space-y-4">

                                {/* Exercises */}
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Exercise</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {EXERCISES[selectedGroup].map(ex => (
                                            <Chip key={ex} label={ex} active={pickedExercise === ex} onClick={() => setPickedExercise(ex)} />
                                        ))}
                                    </div>
                                </div>

                                {/*
                                  * Sets / Reps / Rest
                                  * Mobile  : stacked (1 col) so buttons have room to breathe
                                  * Desktop : 3 cols side-by-side
                                  */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {/* Sets */}
                                    <div>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Sets</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {SET_OPTIONS.map(s => (
                                                <SmallChip key={s} label={s} active={pickedSets === s} onClick={() => setPickedSets(s)} />
                                            ))}
                                        </div>
                                    </div>
                                    {/* Reps */}
                                    <div>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Reps</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {REP_OPTIONS.map(r => (
                                                <SmallChip key={r} label={r} active={pickedReps === r} onClick={() => setPickedReps(r)} />
                                            ))}
                                        </div>
                                    </div>
                                    {/* Rest */}
                                    <div>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Rest</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {REST_OPTIONS.map(r => (
                                                <SmallChip key={r} label={r} active={pickedRest === r} onClick={() => setPickedRest(r)} />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Coach note */}
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Coach Note (optional)</p>
                                    <input
                                        className="w-full bg-[#1a2208] border border-[#2a3a10] rounded-lg px-3 py-2 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-[#a3e635]/50"
                                        placeholder="e.g. Keep elbows tucked, control the eccentric..."
                                        value={pickedNote}
                                        onChange={e => setPickedNote(e.target.value)}
                                    />
                                </div>

                                {/* Add button */}
                                <button
                                    onClick={addExercise}
                                    className="w-full bg-[#a3e635] hover:bg-[#b5f03f] text-black font-black text-xs py-3 rounded-xl transition-colors shadow-lg shadow-[#a3e635]/10"
                                >
                                    + ADD {pickedSets} × {pickedReps} {pickedExercise}
                                </button>
                            </div>

                            {/* Exercise list */}
                            {exercises.length > 0 ? (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                        Added ({exercises.length})
                                    </p>
                                    {exercises.map((ex, idx) => (
                                        <div key={ex.id} className="flex items-center gap-3 bg-[#111a05] border border-[#2a3a10] rounded-xl px-3 py-2.5 group hover:border-[#3a5010]">
                                            <span className="w-6 h-6 rounded-md bg-[#a3e635]/10 text-[#a3e635] text-[10px] font-black flex items-center justify-center shrink-0">{idx + 1}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-black text-white truncate">{ex.name}</p>
                                                <p className="text-[10px] text-gray-500">{ex.sets} × {ex.reps} · Rest {ex.rest}{ex.note ? ` · ${ex.note}` : ""}</p>
                                            </div>
                                            <button onClick={() => removeExercise(ex.id)} className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 text-xs transition-all shrink-0 p-1">✕</button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center py-4 text-gray-600 text-xs">No exercises added yet.</p>
                            )}
                        </>
                    )}

                    {/* ══ CARDIO ══ */}
                    {tab === "cardio" && (
                        <>
                            <div className="bg-[#111a05] border border-[#2a3a10] rounded-xl p-3 sm:p-4 space-y-4">
                                {/* Machines */}
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Machine / Activity</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {CARDIO_MACHINES.map(m => (
                                            <Chip key={m} label={m} active={pickedMachine === m} onClick={() => setPickedMachine(m)} />
                                        ))}
                                    </div>
                                </div>

                                {/* Duration + Intensity — stack on mobile */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Duration</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {CARDIO_DURATIONS.map(d => (
                                                <SmallChip key={d} label={d} active={pickedDuration === d} onClick={() => setPickedDuration(d)} />
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Intensity / Type</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {CARDIO_INTENSITIES.map(i => (
                                                <SmallChip key={i} label={i} active={pickedIntensity === i} onClick={() => setPickedIntensity(i)} />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={addCardio}
                                    className="w-full bg-[#a3e635] hover:bg-[#b5f03f] text-black font-black text-xs py-3 rounded-xl transition-colors shadow-lg shadow-[#a3e635]/10"
                                >
                                    + ADD {pickedDuration} {pickedMachine} ({pickedIntensity})
                                </button>
                            </div>

                            {cardio.length > 0 ? (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Added ({cardio.length})</p>
                                    {cardio.map((c) => (
                                        <div key={c.id} className="flex items-center gap-3 bg-[#111a05] border border-[#2a3a10] rounded-xl px-3 py-2.5 group hover:border-[#3a5010]">
                                            <span className="text-lg shrink-0">🏃</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-black text-white">{c.machine}</p>
                                                <p className={`text-[10px] font-bold ${INTENSITY_COLORS[c.intensity] ?? "text-gray-500"}`}>{c.duration} · {c.intensity}</p>
                                            </div>
                                            <button onClick={() => removeCardio(c.id)} className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 text-xs transition-all shrink-0 p-1">✕</button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center py-4 text-gray-600 text-xs">No cardio added yet.</p>
                            )}
                        </>
                    )}
                </div>

                {/* ── Footer ── */}
                <div className="px-4 sm:px-5 py-3.5 border-t border-[#2a3a10] shrink-0 flex items-center justify-between gap-3 bg-[#0a100a]">
                    <p className="text-[11px] text-gray-600 shrink-0">
                        {exercises.length} ex · {cardio.length} cardio
                    </p>
                    <div className="flex gap-2 sm:gap-3">
                        <button onClick={onClose} className="px-3 sm:px-4 py-2 text-xs font-bold text-gray-500 hover:text-white transition-colors">
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="bg-[#a3e635] hover:bg-[#b5f03f] text-black font-black text-xs px-4 sm:px-6 py-2.5 rounded-xl transition-colors shadow-lg shadow-[#a3e635]/20 whitespace-nowrap"
                        >
                            ✓ CONFIRM WEEK
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Create Program Modal ──────────────────────────────────────────────────────

function CreateProgramModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [programName, setProgramName] = useState("");
    const [category, setCategory] = useState("Bulking");
    const [duration, setDuration] = useState("8");
    const [difficulty, setDifficulty] = useState<Level>("Intermediate");
    const [weeks, setWeeks] = useState<Week[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [editingWeek, setEditingWeek] = useState<Week | null>(null);

    const addWeek = () => {
        const next = weeks.length + 1;
        setWeeks(prev => [...prev, { id: next, name: `Week ${next}`, detail: "CUSTOM WEEK", exercises: [], cardio: [] }]);
    };

    const removeWeek = (id: number) =>
        setWeeks(prev => prev.filter(w => w.id !== id).map((w, i) => ({ ...w, id: i + 1 })));

    const handleWeekConfirm = (updated: Week) => {
        setWeeks(prev => prev.map(w => w.id === updated.id ? updated : w));
        setEditingWeek(null);
    };

    const handleCreate = async () => {
        if (!programName) return alert("Please enter a program name");
        setIsSaving(true);
        try {
            const res = await fetch("/api/programs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: programName, category,
                    description: `A customized ${category} protocol for ${difficulty} level athletes.`,
                    weeks: parseInt(duration), level: difficulty,
                    emoji: category === "Cutting" ? "🔥" : category === "Bulking" ? "🏋️" : "💪",
                    gradientFrom: category === "Cutting" ? "#1a1a1a" : category === "Bulking" ? "#f5e6c8" : "#1a1a2e",
                    gradientTo: category === "Cutting" ? "#0a0a0a" : category === "Bulking" ? "#d4a96a" : "#0d0d1a",
                    weeksData: weeks,
                }),
            });
            const data = await res.json();
            if (data.success) { onSuccess(); onClose(); }
            else alert(data.error || "Failed to create program");
        } catch (err) {
            console.error(err);
            alert("Error creating program");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            {/* Backdrop + modal */}
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

                <div className="relative w-full sm:max-w-2xl bg-[#0d1408] border border-[#2a3a10]
                                rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl
                                max-h-[92dvh] sm:max-h-[90vh] overflow-hidden">

                    {/* Header */}
                    <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#2a3a10] shrink-0">
                        <h2 className="text-lg sm:text-xl font-black text-white">Create New Program</h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-white w-7 h-7 flex items-center justify-center">✕</button>
                    </div>

                    {/* Scrollable body */}
                    <div className="overflow-y-auto flex-1 overscroll-contain px-5 py-5 space-y-5">

                        {/* Name + Category */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Program Name</label>
                                <input
                                    className="w-full bg-[#1a2208] border border-[#2a3a10] rounded-xl px-4 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-[#a3e635]/50"
                                    placeholder="e.g. Summer Shred 2024"
                                    value={programName}
                                    onChange={e => setProgramName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Category</label>
                                <select
                                    className="w-full bg-[#1a2208] border border-[#2a3a10] rounded-xl px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-[#a3e635]/50 appearance-none"
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                >
                                    {["Strength", "Cutting", "Bulking", "Maintenance"].map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Duration + Level */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Duration (Weeks)</label>
                                <input
                                    type="number"
                                    className="w-full bg-[#1a2208] border border-[#2a3a10] rounded-xl px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-[#a3e635]/50"
                                    value={duration}
                                    onChange={e => setDuration(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Level</label>
                                <div className="flex gap-1 bg-[#1a2208] p-1 rounded-xl border border-[#2a3a10]">
                                    {(["Beginner", "Intermediate", "Advanced"] as Level[]).map(l => (
                                        <button key={l} onClick={() => setDifficulty(l)}
                                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all ${difficulty === l ? "bg-[#a3e635] text-black" : "text-gray-500 hover:text-white"}`}>
                                            {l.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Program Structure */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Program Structure</p>
                                <button onClick={addWeek} className="text-[10px] font-black text-[#a3e635] hover:underline">+ ADD WEEK</button>
                            </div>
                            <div className="space-y-2">
                                {weeks.map(w => {
                                    const hasContent = w.exercises.length > 0 || w.cardio.length > 0;
                                    return (
                                        <div key={w.id} className={`flex items-center gap-3 rounded-xl px-3 sm:px-4 py-3 border transition-all group ${hasContent ? "bg-[#1a2a08] border-[#3a5a10]" : "bg-[#1a2208] border-[#2a3a10]"}`}>
                                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${hasContent ? "bg-[#a3e635]/20 text-[#a3e635]" : "bg-[#2a3a10] text-gray-500"}`}>
                                                {w.id}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-black text-white truncate">{w.name}</p>
                                                <p className="text-[10px] text-gray-500 truncate">{w.detail}</p>
                                                {hasContent && (
                                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                                        {w.exercises.length > 0 && (
                                                            <span className="text-[9px] bg-[#a3e635]/10 text-[#a3e635] px-1.5 py-0.5 rounded font-bold">💪 {w.exercises.length} exercises</span>
                                                        )}
                                                        {w.cardio.length > 0 && (
                                                            <span className="text-[9px] bg-blue-400/10 text-blue-400 px-1.5 py-0.5 rounded font-bold">🏃 {w.cardio.length} cardio</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    onClick={() => setEditingWeek(w)}
                                                    className="text-[10px] font-black text-[#a3e635] bg-[#a3e635]/10 hover:bg-[#a3e635]/20 px-2 sm:px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap"
                                                >
                                                    {hasContent ? "✏ EDIT" : "⚡ BUILD"}
                                                </button>
                                                <button
                                                    onClick={() => removeWeek(w.id)}
                                                    className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all text-xs p-1"
                                                >✕</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-4 border-t border-[#2a3a10] flex justify-end gap-3 shrink-0 bg-[#0d1408]">
                        <button onClick={onClose} className="px-4 py-2.5 text-sm font-bold text-gray-500 hover:text-white transition-colors">Cancel</button>
                        <button
                            disabled={isSaving}
                            onClick={handleCreate}
                            className="bg-[#a3e635] text-black px-6 py-2.5 rounded-xl text-sm font-black disabled:opacity-50 hover:bg-[#b5f03f] transition-colors"
                        >
                            {isSaving ? "Creating..." : "Create Program"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Week Builder on top */}
            {editingWeek && (
                <WeekBuilderModal week={editingWeek} onConfirm={handleWeekConfirm} onClose={() => setEditingWeek(null)} />
            )}
        </>
    );
}

// ── Assign Modal ──────────────────────────────────────────────────────────────

function AssignModal({ program, clients, onClose }: { program: Program; clients: CoachClient[]; onClose: () => void }) {
    const [selected, setSelected] = useState<string[]>([]);
    const [isAssigning, setAssigning] = useState(false);

    const toggle = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    const handleAssign = async () => {
        if (selected.length === 0) return alert("Select at least one client");
        setAssigning(true);
        try {
            const res = await fetch("/api/programs/assign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ programId: program.id, clientIds: selected }) });
            const data = await res.json();
            if (data.success) { alert("Program assigned!"); onClose(); }
            else alert(data.error || "Failed to assign");
        } catch { alert("Error assigning program"); }
        finally { setAssigning(false); }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full sm:max-w-md bg-[#0d1408] border border-[#2a3a10] rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-5 border-b border-[#2a3a10]">
                    <h2 className="text-base font-black text-white">Assign "{program.title}"</h2>
                    <p className="text-xs text-gray-500 mt-1">Select clients to receive this program.</p>
                </div>
                <div className="max-h-56 overflow-y-auto p-4 space-y-2">
                    {clients.length === 0 ? (
                        <p className="text-center text-sm text-gray-500 py-8">No connected clients.</p>
                    ) : clients.map(c => (
                        <button key={c.id} onClick={() => toggle(c.id)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${selected.includes(c.id) ? "bg-[#a3e635]/15 border-[#a3e635] text-[#a3e635]" : "bg-[#111a05] border-[#2a3a10] text-gray-400 hover:text-white"}`}>
                            <span className="text-sm font-bold">{c.name}</span>
                            {selected.includes(c.id) && <span className="text-xs">✓</span>}
                        </button>
                    ))}
                </div>
                <div className="p-4 border-t border-[#2a3a10] flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 text-sm font-bold text-gray-500">Cancel</button>
                    <button disabled={isAssigning || selected.length === 0} onClick={handleAssign}
                        className="flex-1 bg-[#a3e635] text-black py-2.5 rounded-xl text-sm font-black disabled:opacity-50">
                        {isAssigning ? "Assigning..." : `Assign (${selected.length})`}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Program Card ──────────────────────────────────────────────────────────────

function ProgramCard({ program, onAssign }: { program: Program; onAssign: (p: Program) => void }) {
    return (
        <div className="bg-[#111a05] border border-[#2a3a10] rounded-2xl overflow-hidden flex flex-col hover:border-[#a3e635]/40 hover:shadow-lg hover:shadow-[#a3e635]/5 transition-all group">
            <div className="relative h-40 sm:h-44 flex items-center justify-center overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${program.gradientFrom}, ${program.gradientTo})` }}>
                <span className="text-6xl sm:text-7xl opacity-60 group-hover:scale-110 transition-transform duration-300 select-none">{program.emoji}</span>
                <span className={`absolute top-3 left-3 text-[9px] sm:text-[10px] font-black tracking-widest px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md ${CATEGORY_COLORS[program.category] ?? CATEGORY_COLORS["Bulking"]}`}>
                    {program.category.toUpperCase()}
                </span>
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 sm:gap-2">
                    <span className="flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full">📅 {program.weeks}wk</span>
                    <span className="flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full">📈 {program.level}</span>
                </div>
            </div>
            <div className="p-3 sm:p-4 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-1">
                    <h3 className="font-black text-white text-sm sm:text-base leading-tight">{program.title}</h3>
                    <span className="flex items-center gap-1 text-[#a3e635] text-xs font-semibold whitespace-nowrap ml-2">👥 {program.clients}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3 flex-1">{program.description}</p>
                <div className="flex items-center gap-2 pt-2 border-t border-[#2a3a10]">
                    <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors px-2 py-1.5 rounded-lg hover:bg-[#1a2208]">✏️ Edit</button>
                    <button onClick={() => onAssign(program)}
                        className="flex items-center gap-1 text-xs font-semibold text-black bg-[#a3e635] hover:bg-[#b5f03f] px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors ml-auto shadow-md shadow-[#a3e635]/20">
                        📌 Assign
                    </button>
                </div>
            </div>
        </div>
    );
}

function CreateCard({ onClick }: { onClick: () => void }) {
    return (
        <button onClick={onClick}
            className="bg-[#111a05] border-2 border-dashed border-[#2a3a10] rounded-2xl flex flex-col items-center justify-center gap-3 p-6 hover:border-[#a3e635]/50 hover:bg-[#1a2208] transition-all group min-h-[160px] sm:min-h-[200px]">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-dashed border-[#3a5010] group-hover:border-[#a3e635]/60 flex items-center justify-center transition-colors">
                <span className="text-lg sm:text-xl text-gray-600 group-hover:text-[#a3e635] transition-colors">+</span>
            </div>
            <div className="text-center">
                <p className="font-bold text-gray-300 group-hover:text-white transition-colors text-sm">Create New Program</p>
                <p className="text-xs text-gray-600 mt-0.5">Build a custom template</p>
            </div>
        </button>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProgramsPage() {
    const [activeFilter, setActiveFilter] = useState<Category>("All");
    const [search, setSearch] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [assignProgram, setAssignProgram] = useState<Program | null>(null);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [clients, setClients] = useState<CoachClient[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [pRes, cRes] = await Promise.all([fetch("/api/programs"), fetch("/api/coach/clients")]);
            const pData = await pRes.json();
            const cData = await cRes.json();
            if (pData.success) setPrograms(pData.data);
            if (cData.success) setClients(cData.data.map((x: { id: string; name: string }) => ({ id: x.id, name: x.name })));
        } catch (err) { console.error(err); }
        finally { setIsLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const filtered = programs.filter(p => {
        const matchCat = activeFilter === "All" || p.category === activeFilter;
        const matchSearch = search === "" || p.title.toLowerCase().includes(search.toLowerCase());
        return matchCat && matchSearch;
    });

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden -mx-4 md:-mx-6 mt-[-1.5rem] mb-[-1.5rem]">

            {/* Header */}
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-0 shrink-0">
                <div className="flex items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6 flex-wrap">
                    <div>
                        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">Programs</h1>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Manage and assign your signature training protocols</p>
                    </div>
                    <button onClick={() => setShowCreate(true)}
                        className="bg-[#a3e635] hover:bg-[#b5f03f] text-black font-black text-xs sm:text-sm px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl transition-all shadow-lg shadow-[#a3e635]/20 shrink-0">
                        ⊕ CREATE PROGRAM
                    </button>
                </div>

                {/* Search + Filters */}
                <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 mb-4 sm:mb-6">
                    <div className="relative flex-1 sm:max-w-lg">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
                        <input
                            className="w-full bg-[#111a05] border border-[#2a3a10] rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-[#a3e635]/50"
                            placeholder="Search programs..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    {/* Horizontally scrollable filter pills on mobile */}
                    <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
                        {CATEGORIES.map(cat => (
                            <button key={cat} onClick={() => setActiveFilter(cat)}
                                className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-black transition-all whitespace-nowrap shrink-0 ${activeFilter === cat ? "bg-[#a3e635] text-black" : "bg-[#111a05] border border-[#2a3a10] text-gray-500 hover:text-white"
                                    }`}>
                                {cat.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
                {isLoading ? (
                    <div className="h-64 flex items-center justify-center">
                        <div className="w-10 h-10 border-4 border-[#a3e635] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filtered.length === 0 && search === "" && activeFilter === "All" ? (
                    <div className="flex flex-col items-center justify-center h-48 sm:h-64 border-2 border-dashed border-[#2a3a10] rounded-3xl opacity-60">
                        <span className="text-4xl mb-3">📋</span>
                        <p className="font-bold text-gray-400 text-sm">No programs yet</p>
                        <button onClick={() => setShowCreate(true)} className="text-[#a3e635] text-xs font-bold mt-2 hover:underline">Create your first protocol</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6 pb-20">
                        {filtered.map(p => <ProgramCard key={p.id} program={p} onAssign={setAssignProgram} />)}
                        <CreateCard onClick={() => setShowCreate(true)} />
                    </div>
                )}
            </div>

            {showCreate && <CreateProgramModal onClose={() => setShowCreate(false)} onSuccess={fetchData} />}
            {assignProgram && <AssignModal program={assignProgram} clients={clients} onClose={() => setAssignProgram(null)} />}
        </div>
    );
}