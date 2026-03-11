"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useGlobalStore } from "@/store/useGlobalStore";
import {
    User, Camera, Check, ChevronDown, Zap, Scale,
    Ruler, Target, Activity, Flame, Beef, Wheat,
    Droplets, Bell, BellOff, Sparkles, Save, X,
    Shield, Trash2, LogOut, Loader2
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface ProfileData {
    firstName: string;
    lastName: string;
    email: string;
    gender: string;
    age: string;
    heightCm: string;
    weightKg: string;
    goal: string;
    activityLevel: string;
    experience: string;
    targetCalories: string;
    targetProtein: string;
    targetCarbs: string;
    targetFat: string;
    notifications: boolean;
    aiAdaptive: boolean;
    avatarUrl: string;
    memberSince: string;
    plan: string;
}

const INITIAL: ProfileData = {
    firstName: "",
    lastName: "",
    email: "",
    gender: "male",
    age: "",
    heightCm: "",
    weightKg: "",
    goal: "maintain",
    activityLevel: "moderate",
    experience: "Intermediate",
    targetCalories: "2200",
    targetProtein: "160",
    targetCarbs: "240",
    targetFat: "70",
    notifications: true,
    aiAdaptive: true,
    avatarUrl: "",
    memberSince: "Jan 2024",
    plan: "Standard Plan",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function calcBMI(weightKg: string, heightCm: string) {
    const w = parseFloat(weightKg);
    const h = parseFloat(heightCm) / 100;
    if (!w || !h) return null;
    return +(w / (h * h)).toFixed(1);
}
function bmiLabel(bmi: number) {
    if (bmi < 18.5) return { label: "Underweight", color: "text-blue-400", bg: "bg-blue-400/15" };
    if (bmi < 25) return { label: "Healthy", color: "text-[#B8FF3C]", bg: "bg-[#B8FF3C]/15" };
    if (bmi < 30) return { label: "Overweight", color: "text-orange-400", bg: "bg-orange-400/15" };
    return { label: "Obese", color: "text-red-400", bg: "bg-red-400/15" };
}

// ── Shared input components ───────────────────────────────────────────────────
function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                {icon && <span className="text-slate-600">{icon}</span>}
                {label}
            </label>
            {children}
        </div>
    );
}

function TextInput({ value, onChange, placeholder, type = "text" }: {
    value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
    return (
        <input
            type={type}
            value={value}
            placeholder={placeholder}
            onChange={e => onChange(e.target.value)}
            className="bg-[#0D0D12] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-[#B8FF3C]/50 focus:bg-[#13131A] transition-all w-full"
        />
    );
}

function SelectInput({ value, onChange, options }: {
    value: string; onChange: (v: string) => void;
    options: { value: string; label: string }[];
}) {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full bg-[#0D0D12] border border-white/8 rounded-xl px-4 py-3 text-white text-sm appearance-none focus:outline-none focus:border-[#B8FF3C]/50 transition-all pr-10"
            >
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>
    );
}

function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
    return (
        <button
            onClick={onChange}
            className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${value ? "bg-[#B8FF3C]" : "bg-white/10"}`}
        >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${value ? "left-7" : "left-1"}`} />
        </button>
    );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
    return (
        <div className="flex items-center gap-2.5 mb-5">
            <div className="w-7 h-7 bg-[#B8FF3C]/10 rounded-lg flex items-center justify-center">
                <span className="text-[#B8FF3C]">{icon}</span>
            </div>
            <h2 className="text-base font-black text-white tracking-tight">{title}</h2>
        </div>
    );
}

const ACTIVITY_LEVELS = [
    { value: "sedentary", label: "Low", desc: "Sedentary lifestyle with minimal movement.", days: "0-1 days/week", icon: "🛋️" },
    { value: "moderate", label: "Moderate", desc: "Active lifestyle with consistent training.", days: "3-5 days/week", icon: "🏃" },
    { value: "very_active", label: "High", desc: "Intense physical activity or athletic training.", days: "6-7 days/week", icon: "⚡" },
];

export default function ProfilePage() {
    const { data: session } = useSession();
    const { setUser } = useGlobalStore();
    const [data, setData] = useState<ProfileData>(INITIAL);
    const [loading, setLoading] = useState(true);
    const [dirty, setDirty] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activeTab, setActiveTab] = useState<"profile" | "nutrition" | "settings">("profile");
    const avatarRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/profile/member');
            const result = await res.json();
            if (result.success && result.data) {
                const p = result.data;
                setData({
                    firstName: p.firstName || "",
                    lastName: p.lastName || "",
                    email: session?.user?.email || p.email || "",
                    gender: p.gender || "male",
                    age: p.age?.toString() || "",
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
                    memberSince: p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : "Jan 2024",
                    plan: p.plan || (session?.user?.role === 'member' ? "Standard Plan" : "Premium Plan"),
                });
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const update = (patch: Partial<ProfileData>) => {
        setData(prev => ({ ...prev, ...patch }));
        setDirty(true);
        setSaved(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/profile/member', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: data.firstName,
                    lastName: data.lastName,
                    gender: data.gender,
                    age: parseInt(data.age),
                    heightCm: parseFloat(data.heightCm),
                    weightKg: parseFloat(data.weightKg),
                    goal: data.goal,
                    activityLevel: data.activityLevel,
                    experience: data.experience,
                    targetCalories: parseInt(data.targetCalories),
                    targetProtein: parseInt(data.targetProtein),
                    targetCarbs: parseInt(data.targetCarbs),
                    targetFat: parseInt(data.targetFat),
                    notifications: data.notifications,
                    aiAdaptive: data.aiAdaptive,
                }),
            });
            const result = await res.json();
            if (result.success) {
                setSaved(true);
                setDirty(false);
                // Sync with store
                if (result.data) {
                    setUser(result.data);
                }
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (error) {
            console.error("Error saving profile:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleDiscard = () => {
        fetchProfile();
        setDirty(false);
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        update({ avatarUrl: url });
    };

    const bmi = calcBMI(data.weightKg, data.heightCm);
    const bmiInfo = bmi ? bmiLabel(bmi) : null;

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-[#B8FF3C] animate-spin" />
                    <p className="text-slate-500 font-medium">Loading your profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0A0A0F]">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-black text-white tracking-tight">My Profile</h1>
                    <div className="flex items-center gap-2">
                        <button className="w-9 h-9 bg-[#13131A] border border-white/8 rounded-xl flex items-center justify-center hover:bg-white/5 transition-colors">
                            <Zap size={16} className="text-[#B8FF3C]" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">

                    {/* LEFT: Identity */}
                    <div className="space-y-4">
                        <div className="bg-[#13131A] border border-white/8 rounded-3xl p-6 flex flex-col items-center text-center">
                            <div className="relative mb-4">
                                <div className="w-28 h-28 rounded-full border-[3px] border-[#B8FF3C] overflow-hidden bg-[#0D0D12] flex items-center justify-center">
                                    {data.avatarUrl ? (
                                        <img src={data.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-[#B8FF3C]/20 to-[#B8FF3C]/5 flex items-center justify-center">
                                            <User size={40} className="text-[#B8FF3C]/40" />
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => avatarRef.current?.click()}
                                    className="absolute bottom-0 right-0 w-8 h-8 bg-[#B8FF3C] rounded-full flex items-center justify-center shadow-lg shadow-[#B8FF3C]/30 hover:bg-[#d4ff6e] transition-colors"
                                >
                                    <Camera size={14} className="text-[#0A0A0F]" />
                                </button>
                                <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                            </div>

                            <h2 className="text-xl font-black text-white">
                                {data.firstName || session?.user?.name || "User"} {data.lastName || ""}
                            </h2>
                            <div className="mt-1.5 px-3 py-1 bg-[#B8FF3C]/10 border border-[#B8FF3C]/20 rounded-full">
                                <span className="text-[10px] font-black text-[#B8FF3C] uppercase tracking-widest">
                                    Member since {data.memberSince}
                                </span>
                            </div>
                            <div className="mt-2 text-xs text-slate-500">{data.plan}</div>

                            <div className="w-full mt-5 pt-5 border-t border-white/5 grid grid-cols-3 gap-2 text-center">
                                <div>
                                    <div className="text-base font-black text-white">{data.heightCm || "—"}</div>
                                    <div className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">cm</div>
                                </div>
                                <div>
                                    <div className="text-base font-black text-white">{data.weightKg || "—"}</div>
                                    <div className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">kg</div>
                                </div>
                                <div>
                                    {bmi && bmiInfo ? (
                                        <>
                                            <div className={`text-base font-black ${bmiInfo.color}`}>{bmi}</div>
                                            <div className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">BMI</div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="text-base font-black text-slate-600">—</div>
                                            <div className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">BMI</div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#13131A] border border-white/8 rounded-2xl p-1.5 flex flex-col gap-1">
                            {([
                                { id: "profile", label: "Profile", icon: <User size={14} /> },
                                { id: "nutrition", label: "Nutrition", icon: <Flame size={14} /> },
                                { id: "settings", label: "Settings", icon: <Shield size={14} /> },
                            ] as const).map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all text-left ${activeTab === tab.id
                                        ? "bg-[#B8FF3C] text-[#0A0A0F]"
                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                        }`}
                                >
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT: Tab Contents */}
                    <div className="space-y-6">
                        {activeTab === "profile" && (
                            <>
                                <div className="bg-[#13131A] border border-white/8 rounded-3xl p-6">
                                    <SectionTitle icon={<User size={14} />} title="Personal Information" />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Field label="First Name" icon={<User size={11} />}>
                                            <TextInput value={data.firstName} onChange={v => update({ firstName: v })} placeholder="First Name" />
                                        </Field>
                                        <Field label="Last Name" icon={<User size={11} />}>
                                            <TextInput value={data.lastName} onChange={v => update({ lastName: v })} placeholder="Last Name" />
                                        </Field>
                                        <Field label="Gender">
                                            <SelectInput value={data.gender} onChange={v => update({ gender: v })} options={[
                                                { value: "male", label: "Male" },
                                                { value: "female", label: "Female" },
                                                { value: "other", label: "Other" },
                                            ]} />
                                        </Field>
                                        <Field label="Age">
                                            <TextInput value={data.age} onChange={v => update({ age: v })} placeholder="Age" type="number" />
                                        </Field>
                                        <Field label="Email" icon={<Shield size={11} />}>
                                            <TextInput value={data.email} onChange={() => {}} placeholder="Email" type="email" />
                                        </Field>
                                        <Field label="Health Goal">
                                            <SelectInput value={data.goal} onChange={v => update({ goal: v })} options={[
                                                { value: "cut", label: "🔥 Cut — Lose fat" },
                                                { value: "maintain", label: "⚖️ Maintain — Stay lean" },
                                                { value: "bulk", label: "💪 Bulk — Build muscle" },
                                            ]} />
                                        </Field>
                                    </div>
                                </div>

                                <div className="bg-[#13131A] border border-white/8 rounded-3xl p-6">
                                    <SectionTitle icon={<Activity size={14} />} title="Activity Level" />
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {ACTIVITY_LEVELS.map(level => {
                                            const active = data.activityLevel === level.value;
                                            return (
                                                <button
                                                    key={level.value}
                                                    onClick={() => update({ activityLevel: level.value })}
                                                    className={`relative text-left p-4 rounded-2xl border-2 transition-all ${active
                                                        ? "border-[#B8FF3C] bg-[#B8FF3C]/8"
                                                        : "border-white/8 bg-[#0D0D12] hover:border-white/20"
                                                        }`}
                                                >
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 text-lg ${active ? "bg-[#B8FF3C]/20" : "bg-white/5"}`}>
                                                        {level.icon}
                                                    </div>
                                                    <div className={`font-black text-sm mb-1.5 ${active ? "text-[#B8FF3C]" : "text-white"}`}>
                                                        {level.label}
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 leading-relaxed mb-2">{level.desc}</p>
                                                    <div className={`flex items-center gap-1 text-[10px] font-bold ${active ? "text-[#B8FF3C]" : "text-slate-600"}`}>
                                                        {active ? <Check size={10} /> : <span className="w-2.5 h-2.5 rounded-full bg-slate-700 inline-block" />}
                                                        {level.days}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="bg-[#13131A] border border-white/8 rounded-3xl p-6">
                                    <SectionTitle icon={<Scale size={14} />} title="Body Metrics" />
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="bg-[#0D0D12] border border-white/5 rounded-2xl p-4">
                                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                                <Ruler size={10} /> Height
                                            </div>
                                            <div className="flex items-end gap-1">
                                                <input
                                                    type="number"
                                                    value={data.heightCm}
                                                    onChange={e => update({ heightCm: e.target.value })}
                                                    className="bg-transparent text-3xl font-black text-white w-20 focus:outline-none"
                                                />
                                                <span className="text-slate-500 text-sm mb-1.5">cm</span>
                                            </div>
                                        </div>
                                        <div className="bg-[#0D0D12] border border-white/5 rounded-2xl p-4">
                                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                                <Scale size={10} /> Weight
                                            </div>
                                            <div className="flex items-end gap-1">
                                                <input
                                                    type="number"
                                                    value={data.weightKg}
                                                    onChange={e => update({ weightKg: e.target.value })}
                                                    className="bg-transparent text-3xl font-black text-white w-20 focus:outline-none"
                                                />
                                                <span className="text-slate-500 text-sm mb-1.5">kg</span>
                                            </div>
                                        </div>
                                        <div className={`border rounded-2xl p-4 ${bmiInfo ? `${bmiInfo.bg} border-current/20` : "bg-[#0D0D12] border-white/5"}`}>
                                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">BMI</div>
                                            {bmi && bmiInfo ? (
                                                <>
                                                    <div className={`text-3xl font-black ${bmiInfo.color}`}>{bmi}</div>
                                                    <div className={`text-xs font-bold mt-1 ${bmiInfo.color}`}>{bmiInfo.label}</div>
                                                </>
                                            ) : (
                                                <div className="text-3xl font-black text-slate-600">—</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Experience Level</div>
                                        <div className="flex flex-wrap gap-2">
                                            {["Beginner", "Intermediate", "Advanced", "Elite"].map(exp => (
                                                <button
                                                    key={exp}
                                                    onClick={() => update({ experience: exp })}
                                                    className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${data.experience === exp
                                                        ? "border-[#B8FF3C] bg-[#B8FF3C]/15 text-[#B8FF3C]"
                                                        : "border-white/10 text-slate-400 hover:border-white/25 bg-[#0D0D12]"
                                                        }`}
                                                >
                                                    {exp}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === "nutrition" && (
                            <div className="bg-[#13131A] border border-white/8 rounded-3xl p-6">
                                <SectionTitle icon={<Target size={14} />} title="Daily Targets" />
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { label: "Calories", key: "targetCalories", unit: "kcal", icon: <Flame size={16} />, color: "text-[#B8FF3C]", bg: "bg-[#B8FF3C]/10" },
                                        { label: "Protein", key: "targetProtein", unit: "g", icon: <Beef size={16} />, color: "text-emerald-400", bg: "bg-emerald-400/10" },
                                        { label: "Carbs", key: "targetCarbs", unit: "g", icon: <Wheat size={16} />, color: "text-orange-400", bg: "bg-orange-400/10" },
                                        { label: "Fat", key: "targetFat", unit: "g", icon: <Droplets size={16} />, color: "text-yellow-400", bg: "bg-yellow-400/10" },
                                    ].map(({ label, key, unit, icon, color, bg }) => (
                                        <div key={key} className="bg-[#0D0D12] border border-white/5 rounded-2xl p-4">
                                            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                                                <span className={color}>{icon}</span>
                                            </div>
                                            <div className="flex items-end gap-1 mb-0.5">
                                                <input
                                                    type="number"
                                                    value={(data as any)[key]}
                                                    onChange={e => update({ [key]: e.target.value } as any)}
                                                    className={`bg-transparent text-2xl font-black w-20 focus:outline-none ${color}`}
                                                />
                                                <span className="text-slate-500 text-xs mb-1">{unit}</span>
                                            </div>
                                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === "settings" && (
                            <div className="bg-[#13131A] border border-white/8 rounded-3xl p-6 space-y-3">
                                <SectionTitle icon={<Shield size={14} />} title="Account Settings" />
                                <div className="bg-[#0D0D12] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-bold text-white">Current Plan</div>
                                        <div className="text-xs text-[#B8FF3C] mt-0.5 font-bold">{data.plan}</div>
                                    </div>
                                    <div className="px-3 py-1.5 bg-[#B8FF3C]/15 border border-[#B8FF3C]/30 rounded-xl">
                                        <span className="text-xs font-black text-[#B8FF3C]">Pro</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between bg-red-500/5 border border-red-500/15 rounded-2xl p-4 cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <LogOut size={16} className="text-red-400" />
                                        <div>
                                            <div className="text-sm font-bold text-red-400">Sign Out</div>
                                            <div className="text-xs text-slate-500 mt-0.5">Logout of this account</div>
                                        </div>
                                    </div>
                                    <ChevronDown size={14} className="text-slate-500 -rotate-90" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className={`fixed bottom-0 left-0 right-0 transition-all duration-300 z-40 ${dirty || saved ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}`}>
                <div className="bg-[#13131A]/95 backdrop-blur-xl border-t border-white/8 px-4 sm:px-6 py-4">
                    <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
                        <p className="text-sm text-slate-400">
                            {saved ? "✓ Profile and goals saved to database" : "You have unsaved changes"}
                        </p>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleDiscard}
                                disabled={saving}
                                className="px-5 py-2.5 text-sm font-bold text-slate-400 hover:text-white transition-colors"
                            >
                                Discard
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2.5 bg-[#B8FF3C] text-[#0A0A0F] rounded-xl text-sm font-black hover:bg-[#d4ff6e] shadow-lg shadow-[#B8FF3C]/20 transition-all disabled:opacity-50"
                            >
                                {saving ? <Loader2 size={15} className="animate-spin" /> : (saved ? <Check size={15} /> : <Save size={15} />)}
                                {saving ? "Saving..." : (saved ? "Saved!" : "Save Changes")}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}