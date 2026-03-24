"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useGlobalStore } from "@/store/useGlobalStore";
import {
    User, Camera, Check, Scale, Ruler, Target,
    Activity, Flame, Beef, Wheat, Droplets,
    Bell, Sparkles, Save, Shield, LogOut,
    Loader2, ChevronRight
} from "lucide-react";
import { CustomSelect } from "@/components/ui/Select";

// ── Types ─────────────────────────────────────────────────────────────────────
interface ProfileData {
    firstName: string; lastName: string; email: string;
    gender: string; age: string; heightCm: string; weightKg: string;
    goal: string; activityLevel: string; experience: string;
    targetCalories: string; targetProtein: string; targetCarbs: string; targetFat: string;
    notifications: boolean; aiAdaptive: boolean;
    avatarUrl: string; memberSince: string; plan: string;
}

const INITIAL: ProfileData = {
    firstName: "", lastName: "", email: "", gender: "male", age: "",
    heightCm: "", weightKg: "", goal: "maintain", activityLevel: "moderate",
    experience: "Intermediate", targetCalories: "2200", targetProtein: "160",
    targetCarbs: "240", targetFat: "70", notifications: true, aiAdaptive: true,
    avatarUrl: "", memberSince: "Jan 2024", plan: "Standard Plan",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function calcBMI(w: string, h: string) {
    const wn = parseFloat(w), hn = parseFloat(h) / 100;
    if (!wn || !hn) return null;
    return +(wn / (hn * hn)).toFixed(1);
}
function bmiLabel(bmi: number) {
    if (bmi < 18.5) return { label: "Underweight", color: "text-blue-400", accent: "#60a5fa" };
    if (bmi < 25) return { label: "Healthy", color: "text-[#B8FF3C]", accent: "#B8FF3C" };
    if (bmi < 30) return { label: "Overweight", color: "text-orange-400", accent: "#fb923c" };
    return { label: "Obese", color: "text-red-400", accent: "#f87171" };
}

// ── Atoms ─────────────────────────────────────────────────────────────────────
const Label = ({ children }: { children: React.ReactNode }) => (
    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.12em] block mb-1.5">{children}</span>
);

const TextInput = ({ value, onChange, placeholder, type = "text", disabled }: {
    value: string; onChange: (v: string) => void; placeholder?: string; type?: string; disabled?: boolean;
}) => (
    <input type={type} value={value} placeholder={placeholder} disabled={disabled}
        onChange={e => onChange(e.target.value)}
        className="bg-[#0E0E14] border border-white/8 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-slate-600
                   focus:outline-none focus:border-[#B8FF3C]/40 focus:bg-[#14141C] transition-all w-full
                   disabled:opacity-40 disabled:cursor-not-allowed" />
);

const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button onClick={onChange}
        className={`w-11 h-6 rounded-full transition-all relative flex-shrink-0 ${value ? "bg-[#B8FF3C]" : "bg-white/10"}`}>
        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${value ? "left-6" : "left-1"}`} />
    </button>
);

const SectionHeading = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
        <span className="text-[#B8FF3C]">{icon}</span> {children}
    </h2>
);

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <section className={`bg-[#0E0E14] border border-white/6 rounded-2xl sm:rounded-3xl p-4 sm:p-6 ${className}`}>
        {children}
    </section>
);

const ACTIVITY_LEVELS = [
    { value: "sedentary", label: "Low", desc: "0–1 days/wk", icon: "🛋️" },
    { value: "moderate", label: "Moderate", desc: "3–5 days/wk", icon: "🏃" },
    { value: "very_active", label: "High", desc: "6–7 days/wk", icon: "⚡" },
];

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ProfilePage() {
    const { data: session } = useSession();
    const { user, setUser } = useGlobalStore();
    const [data, setData] = useState<ProfileData>(INITIAL);
    const [loading, setLoading] = useState(true);
    const [dirty, setDirty] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activeTab, setActiveTab] = useState<"profile" | "nutrition" | "settings">("profile");
    const avatarRef = useRef<HTMLInputElement>(null);

    useEffect(() => { 
        if (user) {
            syncData(user);
            setLoading(false);
        }
        fetchProfile(); 
    }, []);

    const syncData = (p: any) => {
        // Pre-fill names from session name if profile is empty
        let fName = p.firstName || "";
        let lName = p.lastName || "";
        
        if (!fName && !lName && session?.user?.name) {
            const parts = session.user.name.split(' ');
            fName = parts[0] || "";
            lName = parts.slice(1).join(' ') || "";
        }

        setData(prev => ({
            ...prev,
            firstName: fName, lastName: lName,
            email: p.email || session?.user?.email || "",
            gender: p.gender || "male", 
            age: p.age?.toString() || p.dob ? (new Date().getFullYear() - new Date(p.dob).getFullYear()).toString() : "",
            heightCm: p.heightCm?.toString() || "", 
            weightKg: p.weightKg?.toString() || "",
            goal: p.goal || "maintain", 
            activityLevel: p.activityLevel || "moderate",
            experience: p.experience || "Intermediate",
            targetCalories: p.targetCalories?.toString() || "2200",
            targetProtein: p.targetProtein?.toString() || "160",
            targetCarbs: p.targetCarbs?.toString() || "240",
            targetFat: p.targetFat?.toString() || "70",
            notifications: p.notifications ?? true, 
            aiAdaptive: p.aiAdaptive ?? true,
            avatarUrl: p.avatarUrl || "",
            memberSince: p.createdAt
                ? new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                : new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            plan: p.plan || (session?.user?.role === 'member' ? "Standard Plan" : "Premium Plan"),
        }));
    };

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/profile/member');
            const result = await res.json();
            if (result.success && result.data) {
                syncData(result.data);
                setUser(result.data);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const update = (patch: Partial<ProfileData>) => {
        setData(prev => ({ ...prev, ...patch }));
        setDirty(true); setSaved(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/profile/member', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: data.firstName, lastName: data.lastName,
                    gender: data.gender, age: parseInt(data.age),
                    heightCm: parseFloat(data.heightCm), weightKg: parseFloat(data.weightKg),
                    goal: data.goal, activityLevel: data.activityLevel, experience: data.experience,
                    targetCalories: parseInt(data.targetCalories), targetProtein: parseInt(data.targetProtein),
                    targetCarbs: parseInt(data.targetCarbs), targetFat: parseInt(data.targetFat),
                    notifications: data.notifications, aiAdaptive: data.aiAdaptive,
                }),
            });
            const result = await res.json();
            if (result.success) {
                setSaved(true); setDirty(false);
                if (result.data) {
                    setUser(result.data);
                    syncData(result.data);
                }
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const handleDiscard = () => { fetchProfile(); setDirty(false); };

    const bmi = calcBMI(data.weightKg, data.heightCm);
    const bmiInfo = bmi ? bmiLabel(bmi) : null;
    const displayName = [data.firstName, data.lastName].filter(Boolean).join(" ") || session?.user?.name || "User";

    if (loading) return (
        <div className="min-h-screen bg-[#08080D] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-[#B8FF3C] animate-spin" />
                <p className="text-slate-500 text-sm">Loading profile…</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#08080D] pb-32">

            {/* ── Hero ──────────────────────────────────────────────────────── */}
            <div className="relative overflow-hidden border-b border-white/5">
                {/* Grid texture */}
                <div className="absolute inset-0 opacity-[0.025]"
                    style={{ backgroundImage: "linear-gradient(#B8FF3C 1px,transparent 1px),linear-gradient(90deg,#B8FF3C 1px,transparent 1px)", backgroundSize: "36px 36px" }} />
                {/* Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-28 bg-[#B8FF3C]/8 rounded-full blur-3xl pointer-events-none" />

                <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-6 sm:pb-8">

                    {/* Identity row */}
                    <div className="flex items-center gap-3 sm:gap-4">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl border-2 border-[#B8FF3C]/50 overflow-hidden bg-[#13131A] flex items-center justify-center">
                                {data.avatarUrl
                                    ? <img src={data.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                    : <div className="w-full h-full bg-gradient-to-br from-[#B8FF3C]/15 to-transparent flex items-center justify-center">
                                        <User size={24} className="text-[#B8FF3C]/40 sm:w-8 sm:h-8" />
                                    </div>}
                            </div>
                            <button onClick={() => avatarRef.current?.click()}
                                className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#B8FF3C] rounded-lg flex items-center justify-center shadow-lg shadow-[#B8FF3C]/30 hover:bg-[#d4ff6e] transition-colors">
                                <Camera size={10} className="text-[#0A0A0F]" />
                            </button>
                            <input ref={avatarRef} type="file" accept="image/*" className="hidden"
                                onChange={e => { const f = e.target.files?.[0]; if (f) update({ avatarUrl: URL.createObjectURL(f) }); }} />
                        </div>

                        {/* Name + badges */}
                        <div className="flex-1 min-w-0">
                            <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight truncate">{displayName}</h1>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                <span className="text-[9px] font-bold text-[#B8FF3C] bg-[#B8FF3C]/10 border border-[#B8FF3C]/20 px-2 py-0.5 rounded-full uppercase tracking-widest whitespace-nowrap">
                                    Since {data.memberSince}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400 bg-white/5 border border-white/8 px-2 py-0.5 rounded-full whitespace-nowrap">
                                    {data.plan}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stats strip */}
                    <div className="flex gap-px mt-4 sm:mt-5 bg-white/4 border border-white/6 rounded-xl sm:rounded-2xl overflow-hidden">
                        {[
                            { val: data.heightCm || "—", sub: "cm" },
                            { val: data.weightKg || "—", sub: "kg" },
                            { val: bmi || "—", sub: bmiInfo?.label || "bmi", color: bmiInfo?.color },
                            { val: data.targetCalories, sub: "kcal/day" },
                        ].map((s, i) => (
                            <div key={i} className="flex-1 bg-[#0E0E14] px-2 sm:px-4 py-2.5 sm:py-3 text-center border-r border-white/4 last:border-0 min-w-0">
                                <div className={`text-sm sm:text-lg font-black truncate ${s.color || "text-white"}`}>{s.val}</div>
                                <div className="text-[8px] sm:text-[9px] text-slate-500 uppercase tracking-wider mt-0.5 truncate">{s.sub}</div>
                            </div>
                        ))}
                    </div>

                    {/* ── Tab bar ── */}
                    <div className="mt-6 sm:mt-7 flex gap-1 bg-[#0E0E14] border border-white/6 rounded-2xl p-1.5 w-full sm:w-fit overflow-x-auto scrollbar-none">
                        {([
                            { id: "profile", label: "Profile", icon: <User size={13} /> },
                            { id: "nutrition", label: "Nutrition", icon: <Flame size={13} /> },
                            { id: "settings", label: "Settings", icon: <Shield size={13} /> },
                        ] as const).map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id
                                    ? "bg-[#B8FF3C] text-[#0A0A0F] shadow-sm"
                                    : "text-slate-500 hover:text-slate-300"
                                    }`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Tab Content ──────────────────────────────────────────────── */}
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-5 space-y-3 sm:space-y-4">

                {/* ─── PROFILE ─── */}
                {activeTab === "profile" && (<>

                    {/* Personal Info */}
                    <Card>
                        <SectionHeading icon={<User size={11} />}>Personal Information</SectionHeading>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><Label>First Name</Label>
                                <TextInput value={data.firstName} onChange={v => update({ firstName: v })} placeholder="First Name" /></div>
                            <div><Label>Last Name</Label>
                                <TextInput value={data.lastName} onChange={v => update({ lastName: v })} placeholder="Last Name" /></div>
                            <div><Label>Gender</Label>
                                <CustomSelect value={data.gender} onChange={v => update({ gender: v })} options={[
                                    { value: "male", label: "Male" },
                                    { value: "female", label: "Female" },
                                    { value: "other", label: "Other" },
                                ]} /></div>
                            <div><Label>Age</Label>
                                <TextInput value={data.age} onChange={v => update({ age: v })} placeholder="Age" type="number" /></div>
                            <div><Label>Email</Label>
                                <TextInput value={data.email} onChange={() => { }} placeholder="Email" type="email" disabled /></div>
                            <div><Label>Health Goal</Label>
                                <CustomSelect value={data.goal} onChange={v => update({ goal: v })} options={[
                                    { value: "cut", label: "🔥 Cut — Lose fat" },
                                    { value: "maintain", label: "⚖️ Maintain — Stay lean" },
                                    { value: "bulk", label: "💪 Bulk — Build muscle" },
                                ]} /></div>
                        </div>
                    </Card>

                    <Card>
                        <SectionHeading icon={<Scale size={11} />}>Body Metrics</SectionHeading>
                        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
                            <div className="bg-[#0A0A0F] border border-white/5 rounded-xl p-3 sm:p-4">
                                <div className="text-[8px] text-slate-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                                    <Ruler size={8} /> Height
                                </div>
                                <div className="flex items-baseline gap-0.5">
                                    <input type="number" value={data.heightCm} onChange={e => update({ heightCm: e.target.value })}
                                        className="bg-transparent text-xl sm:text-2xl font-black text-white w-12 sm:w-16 focus:outline-none" />
                                    <span className="text-slate-500 text-[10px]">cm</span>
                                </div>
                            </div>
                            <div className="bg-[#0A0A0F] border border-white/5 rounded-xl p-3 sm:p-4">
                                <div className="text-[8px] text-slate-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                                    <Scale size={8} /> Weight
                                </div>
                                <div className="flex items-baseline gap-0.5">
                                    <input type="number" value={data.weightKg} onChange={e => update({ weightKg: e.target.value })}
                                        className="bg-transparent text-xl sm:text-2xl font-black text-white w-12 sm:w-16 focus:outline-none" />
                                    <span className="text-slate-500 text-[10px]">kg</span>
                                </div>
                            </div>
                            <div className="bg-[#0A0A0F] border border-white/5 rounded-xl p-3 sm:p-4">
                                <div className="text-[8px] text-slate-600 uppercase tracking-widest mb-2">BMI</div>
                                {bmi && bmiInfo
                                    ? <><div className={`text-xl sm:text-2xl font-black ${bmiInfo.color}`}>{bmi}</div>
                                        <div className={`text-[9px] font-bold mt-0.5 ${bmiInfo.color}`}>{bmiInfo.label}</div></>
                                    : <div className="text-xl sm:text-2xl font-black text-slate-700">—</div>}
                            </div>
                        </div>
                        <Label>Experience Level</Label>
                        <div className="flex gap-2 flex-wrap">
                            {["Beginner", "Intermediate", "Advanced", "Elite"].map(exp => (
                                <button key={exp} onClick={() => update({ experience: exp })}
                                    className={`px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold border transition-all ${data.experience === exp
                                        ? "border-[#B8FF3C] bg-[#B8FF3C]/10 text-[#B8FF3C]"
                                        : "border-white/8 text-slate-500 hover:border-white/20 hover:text-slate-300"
                                        }`}>{exp}</button>
                            ))}
                        </div>
                    </Card>

                    <Card>
                        <SectionHeading icon={<Activity size={11} />}>Activity Level</SectionHeading>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                            {ACTIVITY_LEVELS.map(level => {
                                const active = data.activityLevel === level.value;
                                return (
                                    <button key={level.value} onClick={() => update({ activityLevel: level.value })}
                                        className={`relative text-left p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all ${active ? "border-[#B8FF3C] bg-[#B8FF3C]/6" : "border-white/6 bg-[#0A0A0F] hover:border-white/15"
                                            }`}>
                                        <div className="text-xl sm:text-2xl mb-2">{level.icon}</div>
                                        <div className={`text-xs sm:text-sm font-black mb-0.5 ${active ? "text-[#B8FF3C]" : "text-white"}`}>
                                            {level.label}
                                        </div>
                                        <div className={`text-[8px] sm:text-[10px] font-semibold ${active ? "text-[#B8FF3C]/60" : "text-slate-600"}`}>
                                            {level.desc}
                                        </div>
                                        {active && (
                                            <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#B8FF3C] flex items-center justify-center">
                                                <Check size={8} className="text-[#0A0A0F]" strokeWidth={3} />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </Card>
                </>)}

                {/* ─── NUTRITION ─── */}
                {activeTab === "nutrition" && (
                    <Card>
                        <SectionHeading icon={<Target size={11} />}>Daily Targets</SectionHeading>
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                            {[
                                { label: "Calories", key: "targetCalories", unit: "kcal", icon: <Flame size={14} />, color: "text-[#B8FF3C]", accent: "#B8FF3C" },
                                { label: "Protein", key: "targetProtein", unit: "g", icon: <Beef size={14} />, color: "text-emerald-400", accent: "#34d399" },
                                { label: "Carbs", key: "targetCarbs", unit: "g", icon: <Wheat size={14} />, color: "text-orange-400", accent: "#fb923c" },
                                { label: "Fat", key: "targetFat", unit: "g", icon: <Droplets size={14} />, color: "text-yellow-400", accent: "#facc15" },
                            ].map(({ label, key, unit, icon, color, accent }) => (
                                <div key={key} className="bg-[#0A0A0F] border border-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-5 group">
                                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                                        <span className={`${color} opacity-70 group-hover:opacity-100 transition-opacity`}>{icon}</span>
                                        <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">{unit}</span>
                                    </div>
                                    <input type="number" value={(data as any)[key]}
                                        onChange={e => update({ [key]: e.target.value } as any)}
                                        className={`bg-transparent text-2xl sm:text-3xl font-black w-full focus:outline-none ${color}`} />
                                    <div className="text-[10px] sm:text-xs text-slate-500 font-semibold mt-0.5">{label}</div>
                                    <div className="mt-2 h-0.5 rounded-full bg-white/5 overflow-hidden">
                                        <div className="h-full rounded-full w-2/3 opacity-40" style={{ background: accent }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* ─── SETTINGS ─── */}
                {activeTab === "settings" && (
                    <Card className="space-y-3">
                        <SectionHeading icon={<Shield size={11} />}>Account Settings</SectionHeading>

                        <div className="flex items-center justify-between bg-[#0A0A0F] border border-white/5 rounded-xl sm:rounded-2xl px-4 py-3 sm:py-4">
                            <div>
                                <div className="text-sm font-bold text-white">Current Plan</div>
                                <div className="text-xs text-[#B8FF3C] mt-0.5 font-semibold">{data.plan}</div>
                            </div>
                            <span className="text-xs font-black text-[#B8FF3C] bg-[#B8FF3C]/10 border border-[#B8FF3C]/25 px-3 py-1 rounded-full">PRO</span>
                        </div>

                        <div className="flex items-center justify-between bg-[#0A0A0F] border border-white/5 rounded-xl sm:rounded-2xl px-4 py-3 sm:py-4">
                            <div className="flex items-center gap-3">
                                <Bell size={14} className="text-slate-400 flex-shrink-0" />
                                <div>
                                    <div className="text-sm font-bold text-white">Notifications</div>
                                    <div className="text-xs text-slate-500 mt-0.5">Push & email alerts</div>
                                </div>
                            </div>
                            <Toggle value={data.notifications} onChange={() => update({ notifications: !data.notifications })} />
                        </div>

                        <div className="flex items-center justify-between bg-[#0A0A0F] border border-white/5 rounded-xl sm:rounded-2xl px-4 py-3 sm:py-4">
                            <div className="flex items-center gap-3">
                                <Sparkles size={14} className="text-slate-400 flex-shrink-0" />
                                <div>
                                    <div className="text-sm font-bold text-white">AI Adaptive Goals</div>
                                    <div className="text-xs text-slate-500 mt-0.5">Auto-adjust targets over time</div>
                                </div>
                            </div>
                            <Toggle value={data.aiAdaptive} onChange={() => update({ aiAdaptive: !data.aiAdaptive })} />
                        </div>

                        <button className="w-full flex items-center justify-between bg-red-500/5 border border-red-500/10 rounded-xl sm:rounded-2xl px-4 py-3 sm:py-4 hover:bg-red-500/8 transition-colors group">
                            <div className="flex items-center gap-3">
                                <LogOut size={14} className="text-red-500/60 group-hover:text-red-400 transition-colors flex-shrink-0" />
                                <div className="text-left">
                                    <div className="text-sm font-bold text-red-400">Sign Out</div>
                                    <div className="text-xs text-slate-500 mt-0.5">Log out of this account</div>
                                </div>
                            </div>
                            <ChevronRight size={13} className="text-slate-600" />
                        </button>
                    </Card>
                )}
            </div>

            {/* ── Save Bar ─────────────────────────────────────────────────── */}
            <div className={`fixed bottom-0 left-0 right-0 transition-all duration-300 z-40 ${dirty || saved ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}`}>
                <div className="bg-[#0E0E14]/95 backdrop-blur-xl border-t border-white/6 px-4 sm:px-6 py-3 sm:py-4">
                    <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
                        <p className="text-xs sm:text-sm text-slate-400 truncate">
                            {saved
                                ? <span className="text-[#B8FF3C] font-semibold">✓ Changes saved</span>
                                : "You have unsaved changes"}
                        </p>
                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                            <button onClick={handleDiscard} disabled={saving}
                                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-slate-500 hover:text-white transition-colors">
                                Discard
                            </button>
                            <button onClick={handleSave} disabled={saving}
                                className="flex items-center gap-1.5 px-4 sm:px-5 py-2 bg-[#B8FF3C] text-[#0A0A0F] rounded-xl text-xs sm:text-sm font-black hover:bg-[#d4ff6e] shadow-md shadow-[#B8FF3C]/20 transition-all disabled:opacity-50">
                                {saving
                                    ? <Loader2 size={13} className="animate-spin" />
                                    : saved ? <Check size={13} /> : <Save size={13} />}
                                {saving ? "Saving…" : saved ? "Saved!" : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}