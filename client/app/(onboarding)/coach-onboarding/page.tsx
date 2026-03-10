"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
    ArrowRight, ArrowLeft, Zap, User, Star, Users, Building2,
    ChevronDown, Check, Bell, X, Plus, Sparkles, Camera
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
interface CoachData {
    // Step 1 – Profile
    avatarUrl: string;
    firstName: string;
    lastName: string;
    email: string;
    bio: string;
    certifications: string;
    yearsExp: string;
    // Step 2 – Specialty
    specialties: string[];
    coachingStyle: string;
    // Step 3 – Clients
    clientMethod: string;
    inviteEmails: string[];
    // Step 4 – Workspace
    gymName: string;
    programStyle: string;
    checkInFreq: string;
    notifyNewClient: boolean;
    notifyProgress: boolean;
    notifyMessages: boolean;
}

const INITIAL: CoachData = {
    avatarUrl: "",
    firstName: "", lastName: "", email: "", bio: "", certifications: "", yearsExp: "",
    specialties: [], coachingStyle: "",
    clientMethod: "", inviteEmails: [],
    gymName: "", programStyle: "", checkInFreq: "",
    notifyNewClient: true, notifyProgress: true, notifyMessages: true,
};

const STEPS = ["Profile", "Specialty", "Clients", "Workspace"];

// ── Confetti (teal palette) ────────────────────────────────────────────────
function ConfettiPiece({ x, color, delay }: { x: number; color: string; delay: number }) {
    return (
        <div className="absolute top-0 w-2.5 h-2.5 rounded-sm animate-confetti"
            style={{ left: `${x}%`, backgroundColor: color, animationDelay: `${delay}s`, animationDuration: `${1.5 + Math.random()}s` }} />
    );
}
function Confetti() {
    const pieces = Array.from({ length: 60 }, (_, i) => ({
        x: Math.random() * 100,
        color: ["#10b981", "#34d399", "#ffffff", "#6ee7b7", "#059669"][i % 5],
        delay: Math.random() * 0.8,
    }));
    return (
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-50">
            {pieces.map((p, i) => <ConfettiPiece key={i} {...p} />)}
        </div>
    );
}

// ── Shared UI ────────────────────────────────────────────────────────────
function Input({ label, hint, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</label>
            <input {...props} className="bg-[#13131A] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-[#10b981]/50 focus:bg-[#0f1f1a] transition-all w-full" />
            {hint && <span className="text-[10px] text-slate-600">{hint}</span>}
        </div>
    );
}
function Textarea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</label>
            <textarea {...props} rows={3} className="bg-[#13131A] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-[#10b981]/50 focus:bg-[#0f1f1a] transition-all w-full resize-none" />
        </div>
    );
}
function SelectField({ label, options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: { value: string; label: string }[] }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</label>
            <div className="relative">
                <select {...props} className="w-full bg-[#13131A] border border-white/8 rounded-xl px-4 py-3 text-white text-sm appearance-none focus:outline-none focus:border-[#10b981]/50 transition-all pr-10">
                    <option value="" disabled>Select…</option>
                    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
        </div>
    );
}
function Toggle({ checked, onChange, label, sub }: { checked: boolean; onChange: () => void; label: string; sub?: string }) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
            <div>
                <div className="text-sm font-bold text-white">{label}</div>
                {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
            </div>
            <button onClick={onChange} className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${checked ? "bg-[#10b981]" : "bg-white/10"}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${checked ? "left-7" : "left-1"}`} />
            </button>
        </div>
    );
}

// ── Step 1 – Profile (avatar added here, rest unchanged) ──────────────────
function StepProfile({ data, onChange }: { data: CoachData; onChange: (d: Partial<CoachData>) => void }) {
    const avatarRef = useRef<HTMLInputElement>(null);
    const displayName = [data.firstName, data.lastName].filter(Boolean).join(" ") || "Your Name";
    const initials = [(data.firstName[0] || ""), (data.lastName[0] || "")].join("").toUpperCase() || "CO";

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Form — takes 3 cols */}
            <div className="lg:col-span-3 space-y-4">
                {/* Avatar upload */}
                <div className="flex flex-col items-center gap-2 pb-1">
                    <button
                        type="button"
                        onClick={() => avatarRef.current?.click()}
                        className="relative w-24 h-24 rounded-full border-2 border-dashed border-[#10b981]/40 flex items-center justify-center bg-[#13131A] hover:border-[#10b981] transition-all group overflow-hidden"
                    >
                        {data.avatarUrl
                            ? <img src={data.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                            : <Camera size={26} className="text-[#10b981]/60 group-hover:text-[#10b981] group-hover:scale-110 transition-all" />
                        }
                    </button>
                    <button type="button" onClick={() => avatarRef.current?.click()}
                        className="text-xs text-[#10b981] font-bold hover:text-[#34d399] transition-colors">
                        Upload Profile Picture
                    </button>
                    <input ref={avatarRef} type="file" accept="image/*" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) onChange({ avatarUrl: URL.createObjectURL(f) }); }} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <Input label="First Name" placeholder="Jordan" value={data.firstName} onChange={e => onChange({ firstName: e.target.value })} />
                    <Input label="Last Name" placeholder="Miller" value={data.lastName} onChange={e => onChange({ lastName: e.target.value })} />
                </div>
                <Input label="Email" type="email" placeholder="jordan@gym.com" value={data.email} onChange={e => onChange({ email: e.target.value })} />
                <Textarea label="Bio" placeholder="Tell clients what makes you the right coach for them…" value={data.bio} onChange={e => onChange({ bio: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                    <Input label="Certifications" placeholder="NASM, ACE…" value={data.certifications} onChange={e => onChange({ certifications: e.target.value })} />
                    <SelectField label="Years Experience" value={data.yearsExp} onChange={e => onChange({ yearsExp: e.target.value })}
                        options={["< 1", "1–2", "3–5", "6–10", "10+"].map(v => ({ value: v, label: v + " years" }))} />
                </div>
            </div>

            {/* Live preview card — 2 cols */}
            <div className="lg:col-span-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Live Preview</div>
                <div className="bg-[#13131A] border border-white/8 rounded-2xl p-5 sticky top-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-base flex-shrink-0 overflow-hidden bg-gradient-to-br from-[#10b981] to-[#059669]">
                            {data.avatarUrl
                                ? <img src={data.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                : initials
                            }
                        </div>
                        <div>
                            <div className="font-black text-white text-sm">{displayName}</div>
                            <div className="text-xs text-[#10b981] font-medium">Coach</div>
                        </div>
                    </div>
                    {data.bio && <p className="text-slate-400 text-xs leading-relaxed mb-3 line-clamp-3">{data.bio}</p>}
                    <div className="flex flex-wrap gap-1.5">
                        {data.certifications.split(",").filter(Boolean).map(c => (
                            <span key={c} className="text-[10px] bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 px-2 py-0.5 rounded-lg">{c.trim()}</span>
                        ))}
                        {data.yearsExp && (
                            <span className="text-[10px] bg-white/5 text-slate-400 border border-white/8 px-2 py-0.5 rounded-lg">{data.yearsExp} exp</span>
                        )}
                    </div>
                    {!data.certifications && !data.bio && (
                        <p className="text-slate-600 text-xs italic">Fill in your profile to see the preview</p>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Steps 2–4 unchanged ───────────────────────────────────────────────────
function StepSpecialty({ data, onChange }: { data: CoachData; onChange: (d: Partial<CoachData>) => void }) {
    const specialties = [
        { id: "weight_loss", label: "Weight Loss", icon: "🔥" },
        { id: "muscle_building", label: "Muscle Building", icon: "💪" },
        { id: "sports_perf", label: "Sports Perf.", icon: "⚡" },
        { id: "nutrition", label: "Nutrition", icon: "🥗" },
        { id: "rehab", label: "Rehab & Recovery", icon: "🏥" },
        { id: "endurance", label: "Endurance", icon: "🏃" },
    ];
    const styles = [
        { value: "supportive", label: "Supportive", desc: "Encouraging and empathetic" },
        { value: "analytical", label: "Analytical", desc: "Data-driven, precise" },
        { value: "motivational", label: "Motivational", desc: "High energy, results-focused" },
        { value: "holistic", label: "Holistic", desc: "Mind-body-nutrition balance" },
    ];
    const toggle = (id: string) => {
        const already = data.specialties.includes(id);
        onChange({ specialties: already ? data.specialties.filter(s => s !== id) : [...data.specialties, id] });
    };
    return (
        <div className="space-y-6">
            <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Areas of Expertise <span className="text-slate-600 normal-case font-normal">(select all that apply)</span></div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {specialties.map(s => {
                        const active = data.specialties.includes(s.id);
                        return (
                            <button key={s.id} onClick={() => toggle(s.id)}
                                className={`p-4 rounded-2xl border text-left transition-all relative ${active ? "border-[#10b981] bg-[#10b981]/8" : "border-white/8 bg-[#13131A] hover:border-white/20"}`}>
                                <div className="text-xl mb-1.5">{s.icon}</div>
                                <div className={`font-bold text-xs ${active ? "text-[#10b981]" : "text-white"}`}>{s.label}</div>
                                {active && <div className="absolute top-2.5 right-2.5 w-4 h-4 bg-[#10b981] rounded-full flex items-center justify-center"><Check size={9} className="text-white" /></div>}
                            </button>
                        );
                    })}
                </div>
            </div>
            <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Coaching Style</div>
                <div className="grid grid-cols-2 gap-3">
                    {styles.map(s => (
                        <button key={s.value} onClick={() => onChange({ coachingStyle: s.value })}
                            className={`p-3.5 rounded-xl border text-left transition-all ${data.coachingStyle === s.value ? "border-[#10b981] bg-[#10b981]/8" : "border-white/8 bg-[#13131A] hover:border-white/20"}`}>
                            <div className={`font-bold text-sm mb-0.5 ${data.coachingStyle === s.value ? "text-[#10b981]" : "text-white"}`}>{s.label}</div>
                            <div className="text-xs text-slate-500">{s.desc}</div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

function StepClients({ data, onChange }: { data: CoachData; onChange: (d: Partial<CoachData>) => void }) {
    const [emailInput, setEmailInput] = useState("");
    const [emailError, setEmailError] = useState("");
    const methods = [
        { value: "individual", label: "Individual", desc: "1-on-1 coaching for each client" },
        { value: "group", label: "Group", desc: "Cohort-based programmes" },
        { value: "hybrid", label: "Hybrid", desc: "Mix of group and individual" },
        { value: "online", label: "Online Only", desc: "100% remote coaching" },
    ];
    const addEmail = () => {
        const email = emailInput.trim();
        if (!email) return;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError("Enter a valid email"); return; }
        if (data.inviteEmails.includes(email)) { setEmailError("Already added"); return; }
        onChange({ inviteEmails: [...data.inviteEmails, email] });
        setEmailInput(""); setEmailError("");
    };
    const removeEmail = (e: string) => onChange({ inviteEmails: data.inviteEmails.filter(x => x !== e) });
    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addEmail(); } };
    return (
        <div className="space-y-6">
            <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Client Management Method</div>
                <div className="grid grid-cols-2 gap-3">
                    {methods.map(m => (
                        <button key={m.value} onClick={() => onChange({ clientMethod: m.value })}
                            className={`p-4 rounded-xl border text-left transition-all ${data.clientMethod === m.value ? "border-[#10b981] bg-[#10b981]/8" : "border-white/8 bg-[#13131A] hover:border-white/20"}`}>
                            <div className={`font-bold text-sm mb-0.5 ${data.clientMethod === m.value ? "text-[#10b981]" : "text-white"}`}>{m.label}</div>
                            <div className="text-xs text-slate-500">{m.desc}</div>
                            {data.clientMethod === m.value && <div className="w-4 h-4 bg-[#10b981] rounded-full flex items-center justify-center mt-2"><Check size={9} className="text-white" /></div>}
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Invite Clients <span className="text-slate-600 normal-case font-normal">(optional)</span></div>
                <div className="bg-[#13131A] border border-white/8 rounded-2xl p-4">
                    {data.inviteEmails.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                            {data.inviteEmails.map(e => (
                                <div key={e} className="flex items-center gap-1.5 bg-[#10b981]/10 border border-[#10b981]/20 rounded-full pl-3 pr-1.5 py-1">
                                    <span className="text-xs text-[#10b981] font-medium">{e}</span>
                                    <button onClick={() => removeEmail(e)} className="w-4 h-4 bg-[#10b981]/20 rounded-full flex items-center justify-center hover:bg-[#10b981]/40 transition-colors"><X size={9} className="text-[#10b981]" /></button>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="flex gap-2">
                        <input type="email" value={emailInput} onChange={e => { setEmailInput(e.target.value); setEmailError(""); }} onKeyDown={handleKeyDown}
                            placeholder="client@example.com"
                            className="flex-1 bg-[#0A0A0F] border border-white/8 rounded-xl px-3 py-2.5 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-[#10b981]/50 transition-all" />
                        <button onClick={addEmail} className="flex items-center gap-1.5 bg-[#10b981] text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-[#0d9e72] transition-colors"><Plus size={13} /> Add</button>
                    </div>
                    {emailError && <p className="text-red-400 text-xs mt-1.5">{emailError}</p>}
                    <p className="text-slate-600 text-[10px] mt-2">Press Enter or comma to add multiple emails</p>
                </div>
            </div>
        </div>
    );
}

function StepWorkspace({ data, onChange }: { data: CoachData; onChange: (d: Partial<CoachData>) => void }) {
    const programStyles = [
        { value: "periodised", label: "Periodised", desc: "Structured cycles" },
        { value: "flexible", label: "Flexible", desc: "Adaptive daily plans" },
        { value: "fixed", label: "Fixed", desc: "Same weekly structure" },
        { value: "hybrid", label: "Hybrid", desc: "Mix of structured & flexible" },
    ];
    const checkInOptions = [
        { value: "daily", label: "Daily" },
        { value: "3x_week", label: "3× / Week" },
        { value: "weekly", label: "Weekly" },
        { value: "biweekly", label: "Bi-weekly" },
    ];
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gym / Business Name</label>
                <input type="text" value={data.gymName} onChange={e => onChange({ gymName: e.target.value })} placeholder="Elite Performance Studio"
                    className="bg-[#13131A] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-[#10b981]/50 focus:bg-[#0f1f1a] transition-all w-full" />
            </div>
            <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Default Program Style</div>
                <div className="grid grid-cols-2 gap-3">
                    {programStyles.map(s => (
                        <button key={s.value} onClick={() => onChange({ programStyle: s.value })}
                            className={`p-3.5 rounded-xl border text-left transition-all ${data.programStyle === s.value ? "border-[#10b981] bg-[#10b981]/8" : "border-white/8 bg-[#13131A] hover:border-white/20"}`}>
                            <div className={`font-bold text-sm mb-0.5 ${data.programStyle === s.value ? "text-[#10b981]" : "text-white"}`}>{s.label}</div>
                            <div className="text-xs text-slate-500">{s.desc}</div>
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Check-in Frequency</div>
                <div className="flex flex-wrap gap-2">
                    {checkInOptions.map(o => (
                        <button key={o.value} onClick={() => onChange({ checkInFreq: o.value })}
                            className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${data.checkInFreq === o.value ? "border-[#10b981] bg-[#10b981]/15 text-[#10b981]" : "border-white/10 bg-[#13131A] text-slate-400 hover:border-white/25"}`}>
                            {o.label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="bg-[#13131A] border border-white/8 rounded-2xl px-4">
                <div className="pt-3 pb-1 text-xs font-bold text-slate-400 uppercase tracking-wider">Notifications</div>
                <Toggle checked={data.notifyNewClient} onChange={() => onChange({ notifyNewClient: !data.notifyNewClient })} label="New Client Joins" sub="Alert when someone accepts your invite" />
                <Toggle checked={data.notifyProgress} onChange={() => onChange({ notifyProgress: !data.notifyProgress })} label="Client Progress" sub="Weekly summary of client metrics" />
                <Toggle checked={data.notifyMessages} onChange={() => onChange({ notifyMessages: !data.notifyMessages })} label="Direct Messages" sub="Real-time client messages" />
            </div>
        </div>
    );
}

// ── Main page ────────────────────────────────────────────────────────────
export default function CoachOnboarding() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [data, setData] = useState<CoachData>(INITIAL);
    const [done, setDone] = useState(false);
    const [loading, setLoading] = useState(false);
    const { data: session, update } = useSession();

    const onChange = (partial: Partial<CoachData>) => setData(prev => ({ ...prev, ...partial }));

    const isValid = () => {
        if (step === 0) return data.firstName && data.email;
        if (step === 1) return data.specialties.length > 0 && data.coachingStyle;
        if (step === 2) return data.clientMethod;
        if (step === 3) return data.gymName || data.programStyle;
        return true;
    };

    const handleNext = async () => {
        if (step < STEPS.length - 1) {
            setStep(s => s + 1);
        } else {
            if (!session?.user?.id) return;
            setLoading(true);
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/onboarding/coach`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: session.user.id, data }),
                });
                if (res.ok) {
                    await update({ onboardingComplete: true });
                    setDone(true);
                    setTimeout(() => router.push("/coach/dashboard"), 2800);
                } else {
                    console.error("Failed to save coach profile");
                }
            } catch (error) {
                console.error("Network error saving profile:", error);
            } finally {
                setLoading(false);
            }
        }
    };

    const stepIcons = [User, Star, Users, Building2];

    return (
        <div className="min-h-screen bg-[#0A0A0F] flex flex-col">
            {done && <Confetti />}

            <header className="px-5 sm:px-8 py-4 flex items-center gap-3 border-b border-white/5">
                <div className="w-8 h-8 bg-[#10b981] rounded-lg flex items-center justify-center">
                    <Zap size={14} className="text-white" fill="currentColor" />
                </div>
                <span className="font-black text-white tracking-tight">MacroSnap <span className="text-[#10b981] font-medium text-sm ml-1">Coach</span></span>
            </header>

            <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-8 sm:py-12">
                <div className="w-full max-w-2xl">
                    {done ? (
                        <div className="text-center py-16 animate-fade-in">
                            <div className="w-20 h-20 bg-[#10b981]/15 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-[#10b981]/40">
                                <Check size={36} className="text-[#10b981]" />
                            </div>
                            <h2 className="text-3xl font-black text-white mb-3">Welcome, Coach {data.firstName || ""}!</h2>
                            <p className="text-slate-400 text-sm">Your workspace is ready. Taking you to your dashboard…</p>
                            {data.inviteEmails.length > 0 && (
                                <p className="text-[#10b981] text-xs mt-3">{data.inviteEmails.length} client invitation{data.inviteEmails.length > 1 ? "s" : ""} will be sent shortly.</p>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-1 mb-8 sm:mb-10">
                                {STEPS.map((s, i) => {
                                    const Icon = stepIcons[i];
                                    return (
                                        <div key={s} className="flex items-center flex-1 last:flex-none">
                                            <div className={`flex items-center gap-1.5 ${i <= step ? "opacity-100" : "opacity-30"}`}>
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border transition-all ${i < step ? "bg-[#10b981] border-[#10b981]" : i === step ? "bg-[#10b981]/15 border-[#10b981]" : "bg-[#13131A] border-white/10"}`}>
                                                    {i < step ? <Check size={12} className="text-white" /> : <Icon size={12} className={i === step ? "text-[#10b981]" : "text-slate-500"} />}
                                                </div>
                                                <span className={`text-[11px] font-bold hidden sm:block ${i === step ? "text-[#10b981]" : "text-slate-500"}`}>{s}</span>
                                            </div>
                                            {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-2 transition-all ${i < step ? "bg-[#10b981]/50" : "bg-white/8"}`} />}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mb-6">
                                <h1 className="text-2xl sm:text-3xl font-black text-white mb-1">
                                    {["Build your coach profile", "Your expertise", "Managing your clients", "Set up your workspace"][step]}
                                </h1>
                                <p className="text-slate-500 text-sm">
                                    {["Step 1 of 4 — How clients will see you", "Step 2 of 4 — Showcase your strengths", "Step 3 of 4 — Invite your first clients", "Step 4 of 4 — Configure your workspace"][step]}
                                </p>
                            </div>

                            <div className="mb-8">
                                {step === 0 && <StepProfile data={data} onChange={onChange} />}
                                {step === 1 && <StepSpecialty data={data} onChange={onChange} />}
                                {step === 2 && <StepClients data={data} onChange={onChange} />}
                                {step === 3 && <StepWorkspace data={data} onChange={onChange} />}
                            </div>

                            <div className="flex gap-3">
                                {step > 0 && (
                                    <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-2 px-5 py-3.5 rounded-xl border border-white/10 text-slate-400 text-sm font-bold hover:bg-white/5 transition-all">
                                        <ArrowLeft size={16} /> Back
                                    </button>
                                )}
                                <button onClick={handleNext} disabled={!isValid() || loading}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm transition-all ${isValid() ? "bg-[#10b981] text-white hover:bg-[#0d9e72] shadow-lg shadow-[#10b981]/15" : "bg-[#13131A] text-slate-600 cursor-not-allowed border border-white/5"}`}>
                                    {loading ? "Saving..." : step === STEPS.length - 1 ? "Launch Workspace" : "Continue"}
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