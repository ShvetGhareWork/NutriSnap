"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
    ArrowRight, ArrowLeft, Zap, User, Activity, Target, Dumbbell,
    ChevronDown, Check, Bell, BellOff, Sparkles, Camera
} from "lucide-react";

interface MemberData {
    avatarUrl: string;
    firstName: string;
    lastName: string;
    email: string;
    dob: string;
    gender: string;
    heightCm: string;
    weightKg: string;
    goal: string;
    experience: string;
    activityLevel: string;
    targetCalories: string;
    targetProtein: string;
    targetCarbs: string;
    targetFat: string;
    aiAdaptive: boolean;
    notifications: boolean;
}

const INITIAL: MemberData = {
    avatarUrl: "",
    firstName: "", lastName: "", email: "", dob: "", gender: "",
    heightCm: "", weightKg: "",
    goal: "", experience: "",
    activityLevel: "",
    targetCalories: "", targetProtein: "", targetCarbs: "", targetFat: "",
    aiAdaptive: true, notifications: true,
};

const STEPS = ["Profile", "Body Stats", "Goal", "Activity", "Targets"];

function calcBMI(weightKg: string, heightCm: string) {
    const w = parseFloat(weightKg);
    const h = parseFloat(heightCm) / 100;
    if (!w || !h) return null;
    return +(w / (h * h)).toFixed(1);
}
function bmiLabel(bmi: number) {
    if (bmi < 18.5) return { label: "Underweight", color: "text-blue-400" };
    if (bmi < 25) return { label: "Healthy", color: "text-[#B8FF3C]" };
    if (bmi < 30) return { label: "Overweight", color: "text-orange-400" };
    return { label: "Obese", color: "text-red-400" };
}
function bodyTypeFromBMI(bmi: number | null) {
    if (!bmi) return null;
    if (bmi < 18.5) return "Ectomorph";
    if (bmi < 25) return "Mesomorph";
    return "Endomorph";
}
function calcMacros(data: MemberData) {
    const w = parseFloat(data.weightKg);
    const h = parseFloat(data.heightCm);
    if (!w || !h) return null;
    const activityMultipliers: Record<string, number> = {
        sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9,
    };
    const mult = activityMultipliers[data.activityLevel] ?? 1.55;
    const bmr = 10 * w + 6.25 * h - 5 * 25 + 5;
    const tdee = Math.round(bmr * mult);
    let calories = tdee;
    if (data.goal === "cut") calories = tdee - 500;
    if (data.goal === "bulk") calories = tdee + 300;
    const protein = Math.round(w * 2.0);
    const fat = Math.round((calories * 0.25) / 9);
    const carbs = Math.round((calories - protein * 4 - fat * 9) / 4);
    return { calories, protein, carbs, fat };
}

function ConfettiPiece({ x, color, delay }: { x: number; color: string; delay: number }) {
    return (
        <div className="absolute top-0 w-2.5 h-2.5 rounded-sm animate-confetti"
            style={{ left: `${x}%`, backgroundColor: color, animationDelay: `${delay}s`, animationDuration: `${1.5 + Math.random()}s` }} />
    );
}
function Confetti() {
    const pieces = Array.from({ length: 60 }, (_, i) => ({
        x: Math.random() * 100,
        color: ["#B8FF3C", "#ffffff", "#10b981", "#f97316", "#facc15"][i % 5],
        delay: Math.random() * 0.8,
    }));
    return (
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-50">
            {pieces.map((p, i) => <ConfettiPiece key={i} {...p} />)}
        </div>
    );
}

function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</label>
            <input {...props} className="bg-[#13131A] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-[#B8FF3C]/50 focus:bg-[#161620] transition-all w-full" />
        </div>
    );
}
function Select({ label, options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: { value: string; label: string }[] }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</label>
            <div className="relative">
                <select {...props} className="w-full bg-[#13131A] border border-white/8 rounded-xl px-4 py-3 text-white text-sm appearance-none focus:outline-none focus:border-[#B8FF3C]/50 transition-all pr-10">
                    <option value="" disabled>Select…</option>
                    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
        </div>
    );
}

// ── Step 1 – Profile (avatar added here, rest unchanged) ──────────────────────
function StepProfile({ data, onChange }: { data: MemberData; onChange: (d: Partial<MemberData>) => void }) {
    const avatarRef = useRef<HTMLInputElement>(null);

    return (
        <div className="space-y-4">
            {/* Avatar upload */}
            <div className="flex flex-col items-center gap-2 pb-2">
                <button
                    type="button"
                    onClick={() => avatarRef.current?.click()}
                    className="relative w-24 h-24 rounded-full border-2 border-dashed border-[#B8FF3C]/40 flex items-center justify-center bg-[#13131A] hover:border-[#B8FF3C] transition-all group overflow-hidden"
                >
                    {data.avatarUrl
                        ? <img src={data.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                        : <Camera size={26} className="text-[#B8FF3C]/60 group-hover:text-[#B8FF3C] group-hover:scale-110 transition-all" />
                    }
                </button>
                <button type="button" onClick={() => avatarRef.current?.click()}
                    className="text-xs text-[#B8FF3C] font-bold hover:text-[#d4ff6e] transition-colors">
                    Upload Profile Picture
                </button>
                <input ref={avatarRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) onChange({ avatarUrl: URL.createObjectURL(f) }); }} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="First Name" placeholder="Alex" value={data.firstName} onChange={e => onChange({ firstName: e.target.value })} />
                <Input label="Last Name" placeholder="Johnson" value={data.lastName} onChange={e => onChange({ lastName: e.target.value })} />
            </div>
            <Input label="Email" type="email" placeholder="alex@example.com" value={data.email} onChange={e => onChange({ email: e.target.value })} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Date of Birth" type="date" value={data.dob} onChange={e => onChange({ dob: e.target.value })} />
                <Select label="Gender" value={data.gender} onChange={e => onChange({ gender: e.target.value })}
                    options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }, { value: "other", label: "Prefer not to say" }]} />
            </div>
        </div>
    );
}

// ── Steps 2–5 unchanged ───────────────────────────────────────────────────────
function StepBodyStats({ data, onChange }: { data: MemberData; onChange: (d: Partial<MemberData>) => void }) {
    const bmi = calcBMI(data.weightKg, data.heightCm);
    const bmiInfo = bmi ? bmiLabel(bmi) : null;
    const bodyType = bodyTypeFromBMI(bmi);
    const bodyTypes = [
        { type: "Ectomorph", desc: "Naturally lean, fast metabolism", range: "BMI < 18.5" },
        { type: "Mesomorph", desc: "Balanced build, gains easily", range: "BMI 18.5–24.9" },
        { type: "Endomorph", desc: "Stockier build, stores fat easily", range: "BMI ≥ 25" },
    ];
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <Input label="Height (cm)" type="number" placeholder="175" value={data.heightCm} onChange={e => onChange({ heightCm: e.target.value })} />
                <Input label="Weight (kg)" type="number" placeholder="75" value={data.weightKg} onChange={e => onChange({ weightKg: e.target.value })} />
            </div>
            {bmi && bmiInfo && (
                <div className="bg-[#13131A] border border-white/8 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Your BMI</div>
                        <div className={`text-3xl font-black ${bmiInfo.color}`}>{bmi}</div>
                    </div>
                    <div className={`text-sm font-bold px-3 py-1.5 rounded-lg bg-white/5 ${bmiInfo.color}`}>{bmiInfo.label}</div>
                </div>
            )}
            <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Body Type</div>
                <div className="grid grid-cols-3 gap-3">
                    {bodyTypes.map(bt => (
                        <div key={bt.type} className={`rounded-xl p-3 border text-center transition-all ${bodyType === bt.type ? "border-[#B8FF3C]/50 bg-[#B8FF3C]/8" : "border-white/5 bg-[#13131A] opacity-50"}`}>
                            <div className={`font-black text-sm mb-1 ${bodyType === bt.type ? "text-[#B8FF3C]" : "text-slate-400"}`}>{bt.type}</div>
                            <div className="text-[10px] text-slate-500 leading-tight">{bt.desc}</div>
                            <div className={`text-[9px] mt-1 font-bold ${bodyType === bt.type ? "text-[#B8FF3C]/70" : "text-slate-600"}`}>{bt.range}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function StepGoal({ data, onChange }: { data: MemberData; onChange: (d: Partial<MemberData>) => void }) {
    const goals = [
        { value: "cut", icon: "🔥", label: "Cut", desc: "Lose body fat while preserving muscle" },
        { value: "maintain", icon: "⚖️", label: "Maintain", desc: "Stay at current weight, improve composition" },
        { value: "bulk", icon: "💪", label: "Bulk", desc: "Build muscle and increase size" },
    ];
    const experiences = ["Beginner", "Intermediate", "Advanced", "Elite"];
    return (
        <div className="space-y-6">
            <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Primary Goal</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {goals.map(g => (
                        <button key={g.value} onClick={() => onChange({ goal: g.value })}
                            className={`p-4 rounded-2xl border text-left transition-all ${data.goal === g.value ? "border-[#B8FF3C] bg-[#B8FF3C]/8" : "border-white/8 bg-[#13131A] hover:border-white/20"}`}>
                            <div className="text-2xl mb-2">{g.icon}</div>
                            <div className={`font-black text-sm mb-1 ${data.goal === g.value ? "text-[#B8FF3C]" : "text-white"}`}>{g.label}</div>
                            <div className="text-[11px] text-slate-500 leading-snug">{g.desc}</div>
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Experience Level</div>
                <div className="flex flex-wrap gap-2">
                    {experiences.map(exp => (
                        <button key={exp} onClick={() => onChange({ experience: exp })}
                            className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${data.experience === exp ? "border-[#B8FF3C] bg-[#B8FF3C]/15 text-[#B8FF3C]" : "border-white/10 bg-[#13131A] text-slate-400 hover:border-white/25"}`}>
                            {exp}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

function StepActivity({ data, onChange }: { data: MemberData; onChange: (d: Partial<MemberData>) => void }) {
    const levels = [
        { value: "sedentary", label: "Sedentary", desc: "Little or no exercise", icon: "🛋️" },
        { value: "light", label: "Light", desc: "1–3 days/week", icon: "🚶" },
        { value: "moderate", label: "Moderate", desc: "3–5 days/week", icon: "🏃" },
        { value: "active", label: "Active", desc: "6–7 days/week", icon: "⚡" },
        { value: "very_active", label: "Very Active", desc: "Twice daily or physical job", icon: "🔥" },
    ];
    const macros = data.activityLevel ? calcMacros(data) : null;
    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 gap-2.5">
                {levels.map(l => (
                    <button key={l.value} onClick={() => onChange({ activityLevel: l.value })}
                        className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${data.activityLevel === l.value ? "border-[#B8FF3C] bg-[#B8FF3C]/8" : "border-white/8 bg-[#13131A] hover:border-white/20"}`}>
                        <span className="text-xl flex-shrink-0">{l.icon}</span>
                        <div className="flex-1">
                            <div className={`font-bold text-sm ${data.activityLevel === l.value ? "text-[#B8FF3C]" : "text-white"}`}>{l.label}</div>
                            <div className="text-xs text-slate-500">{l.desc}</div>
                        </div>
                        {data.activityLevel === l.value && (
                            <div className="w-5 h-5 bg-[#B8FF3C] rounded-full flex items-center justify-center flex-shrink-0">
                                <Check size={10} className="text-[#0A0A0F]" />
                            </div>
                        )}
                    </button>
                ))}
            </div>
            {macros && (
                <div className="bg-[#13131A] border border-[#B8FF3C]/20 rounded-2xl p-4">
                    <div className="text-xs font-bold text-[#B8FF3C] uppercase tracking-wider mb-3">Estimated Daily Targets</div>
                    <div className="grid grid-cols-4 gap-3 text-center">
                        {[
                            { label: "Calories", val: macros.calories, unit: "kcal", color: "text-white" },
                            { label: "Protein", val: macros.protein, unit: "g", color: "text-emerald-400" },
                            { label: "Carbs", val: macros.carbs, unit: "g", color: "text-orange-400" },
                            { label: "Fat", val: macros.fat, unit: "g", color: "text-blue-400" },
                        ].map(({ label, val, unit, color }) => (
                            <div key={label} className="bg-[#0A0A0F] rounded-xl p-2.5">
                                <div className={`text-lg font-black ${color}`}>{val}</div>
                                <div className="text-[9px] text-slate-500">{unit}</div>
                                <div className="text-[9px] text-slate-600 mt-0.5">{label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function StepTargets({ data, onChange }: { data: MemberData; onChange: (d: Partial<MemberData>) => void }) {
    const suggested = data.activityLevel ? calcMacros(data) : null;
    const [autoFill, setAutoFill] = useState(true);
    useEffect(() => {
        if (autoFill && suggested) {
            const newC = String(suggested.calories);
            const newP = String(suggested.protein);
            const newCbs = String(suggested.carbs);
            const newF = String(suggested.fat);

            if (
                data.targetCalories !== newC ||
                data.targetProtein !== newP ||
                data.targetCarbs !== newCbs ||
                data.targetFat !== newF
            ) {
                onChange({
                    targetCalories: newC,
                    targetProtein: newP,
                    targetCarbs: newCbs,
                    targetFat: newF,
                });
            }
        }
    }, [autoFill, suggested?.calories, suggested?.protein, suggested?.carbs, suggested?.fat]);
    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between bg-[#13131A] border border-white/8 rounded-2xl p-4">
                <div>
                    <div className="text-sm font-bold text-white">Auto-fill from activity data</div>
                    <div className="text-xs text-slate-500 mt-0.5">Uses your stats & goal to calculate targets</div>
                </div>
                <button onClick={() => setAutoFill(v => !v)} className={`w-12 h-6 rounded-full transition-all relative ${autoFill ? "bg-[#B8FF3C]" : "bg-white/10"}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${autoFill ? "left-7" : "left-1"}`} />
                </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Input label="Calories (kcal)" type="number" value={data.targetCalories} readOnly={autoFill} placeholder="2200" onChange={e => onChange({ targetCalories: e.target.value })} style={{ opacity: autoFill ? 0.7 : 1 }} />
                <Input label="Protein (g)" type="number" value={data.targetProtein} readOnly={autoFill} placeholder="160" onChange={e => onChange({ targetProtein: e.target.value })} style={{ opacity: autoFill ? 0.7 : 1 }} />
                <Input label="Carbs (g)" type="number" value={data.targetCarbs} readOnly={autoFill} placeholder="280" onChange={e => onChange({ targetCarbs: e.target.value })} style={{ opacity: autoFill ? 0.7 : 1 }} />
                <Input label="Fat (g)" type="number" value={data.targetFat} readOnly={autoFill} placeholder="70" onChange={e => onChange({ targetFat: e.target.value })} style={{ opacity: autoFill ? 0.7 : 1 }} />
            </div>
            <div className="flex items-center justify-between bg-[#13131A] border border-white/8 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#B8FF3C]/10 rounded-xl flex items-center justify-center"><Sparkles size={16} className="text-[#B8FF3C]" /></div>
                    <div>
                        <div className="text-sm font-bold text-white">AI Adaptive Targets</div>
                        <div className="text-xs text-slate-500 mt-0.5">Targets auto-adjust based on progress</div>
                    </div>
                </div>
                <button onClick={() => onChange({ aiAdaptive: !data.aiAdaptive })} className={`w-12 h-6 rounded-full transition-all relative ${data.aiAdaptive ? "bg-[#B8FF3C]" : "bg-white/10"}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${data.aiAdaptive ? "left-7" : "left-1"}`} />
                </button>
            </div>
            <div className="flex items-center justify-between bg-[#13131A] border border-white/8 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#B8FF3C]/10 rounded-xl flex items-center justify-center">
                        {data.notifications ? <Bell size={16} className="text-[#B8FF3C]" /> : <BellOff size={16} className="text-slate-500" />}
                    </div>
                    <div>
                        <div className="text-sm font-bold text-white">Push Notifications</div>
                        <div className="text-xs text-slate-500 mt-0.5">Meal reminders and progress updates</div>
                    </div>
                </div>
                <button onClick={() => onChange({ notifications: !data.notifications })} className={`w-12 h-6 rounded-full transition-all relative ${data.notifications ? "bg-[#B8FF3C]" : "bg-white/10"}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${data.notifications ? "left-7" : "left-1"}`} />
                </button>
            </div>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MemberOnboarding() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [data, setData] = useState<MemberData>(INITIAL);
    const [done, setDone] = useState(false);
    const [loading, setLoading] = useState(false);
    const { data: session, update } = useSession();

    const onChange = (partial: Partial<MemberData>) => setData(prev => ({ ...prev, ...partial }));

    const isValid = () => {
        if (step === 0) return data.firstName && data.email;
        if (step === 1) return data.heightCm && data.weightKg;
        if (step === 2) return data.goal && data.experience;
        if (step === 3) return data.activityLevel;
        if (step === 4) return data.targetCalories;
        return true;
    };

    const handleNext = async () => {
        if (step < STEPS.length - 1) {
            setStep(s => s + 1);
        } else {
            if (!session?.user?.id) return;
            setLoading(true);
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/onboarding/member`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: session.user.id, data }),
                });
                if (res.ok) {
                    await update({ onboardingComplete: true });
                    setDone(true);
                    setTimeout(() => router.push("/dashboard"), 2800);
                } else {
                    console.error("Failed to save member profile");
                }
            } catch (error) {
                console.error("Network error saving profile:", error);
            } finally {
                setLoading(false);
            }
        }
    };

    const icons = [User, Activity, Target, Dumbbell, Sparkles];

    return (
        <div className="min-h-screen bg-[#0A0A0F] flex flex-col">
            {done && <Confetti />}

            <header className="px-5 sm:px-8 py-4 flex items-center gap-3 border-b border-white/5">
                <div className="w-8 h-8 bg-[#B8FF3C] rounded-lg flex items-center justify-center">
                    <Zap size={14} className="text-[#0A0A0F]" fill="currentColor" />
                </div>
                <span className="font-black text-white tracking-tight">MacroSnap</span>
            </header>

            <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-8 sm:py-12">
                <div className="w-full max-w-lg">
                    {done ? (
                        <div className="text-center py-16 animate-fade-in">
                            <div className="w-20 h-20 bg-[#B8FF3C]/15 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-[#B8FF3C]/40">
                                <Check size={36} className="text-[#B8FF3C]" />
                            </div>
                            <h2 className="text-3xl font-black text-white mb-3">You&apos;re all set, {data.firstName || "Athlete"}!</h2>
                            <p className="text-slate-400 text-sm">Your nutrition profile is ready. Taking you to your dashboard…</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-1 mb-8 sm:mb-10">
                                {STEPS.map((s, i) => {
                                    const Icon = icons[i];
                                    return (
                                        <div key={s} className="flex items-center flex-1 last:flex-none">
                                            <div className={`flex items-center gap-1.5 ${i <= step ? "opacity-100" : "opacity-30"}`}>
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border transition-all ${i < step ? "bg-[#B8FF3C] border-[#B8FF3C]" : i === step ? "bg-[#B8FF3C]/15 border-[#B8FF3C]" : "bg-[#13131A] border-white/10"}`}>
                                                    {i < step ? <Check size={12} className="text-[#0A0A0F]" /> : <Icon size={12} className={i === step ? "text-[#B8FF3C]" : "text-slate-500"} />}
                                                </div>
                                                <span className={`text-[11px] font-bold hidden sm:block ${i === step ? "text-[#B8FF3C]" : "text-slate-500"}`}>{s}</span>
                                            </div>
                                            {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-2 transition-all ${i < step ? "bg-[#B8FF3C]/50" : "bg-white/8"}`} />}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mb-6">
                                <h1 className="text-2xl sm:text-3xl font-black text-white mb-1">
                                    {["Tell us about yourself", "Your body stats", "What's your goal?", "Activity level", "Set your targets"][step]}
                                </h1>
                                <p className="text-slate-500 text-sm">
                                    {["Step 1 of 5 — Profile", "Step 2 of 5 — We'll calculate your BMI", "Step 3 of 5 — Shape your plan", "Step 4 of 5 — Fuel the formula", "Step 5 of 5 — Finalise your plan"][step]}
                                </p>
                            </div>

                            <div className="mb-8">
                                {step === 0 && <StepProfile data={data} onChange={onChange} />}
                                {step === 1 && <StepBodyStats data={data} onChange={onChange} />}
                                {step === 2 && <StepGoal data={data} onChange={onChange} />}
                                {step === 3 && <StepActivity data={data} onChange={onChange} />}
                                {step === 4 && <StepTargets data={data} onChange={onChange} />}
                            </div>

                            <div className="flex gap-3">
                                {step > 0 && (
                                    <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-2 px-5 py-3.5 rounded-xl border border-white/10 text-slate-400 text-sm font-bold hover:bg-white/5 transition-all">
                                        <ArrowLeft size={16} /> Back
                                    </button>
                                )}
                                <button onClick={handleNext} disabled={!isValid() || loading}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm transition-all ${isValid() ? "bg-[#B8FF3C] text-[#0A0A0F] hover:bg-[#d4ff6e] shadow-lg shadow-[#B8FF3C]/15" : "bg-[#13131A] text-slate-600 cursor-not-allowed border border-white/5"}`}>
                                    {loading ? "Saving..." : step === STEPS.length - 1 ? "Complete Setup" : "Continue"}
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </main>

            <style jsx global>{`
        @keyframes confetti { 0% { transform: translateY(-10px) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } }
        .animate-confetti { animation: confetti linear forwards; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        .animate-fade-in { animation: fade-in 0.5s ease forwards; }
      `}</style>
        </div>
    );
}