"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useGlobalStore } from "@/store/useGlobalStore";
import { 
    Bell, Brain, Shield, User, Target, HelpCircle, 
    Download, Trash2, Save, Check, AlertTriangle, 
    ChevronDown, Eye, EyeOff, Bug, Rocket, Monitor,
    Droplets, Utensils, Dumbbell, Sparkles
} from "lucide-react";

// ─── Internal UI Components (Premium Look) ───────────────────────────────────
const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!checked)}
        className="relative inline-flex items-center rounded-full transition-all duration-300 focus:outline-none flex-shrink-0"
        style={{
            width: 44, height: 24,
            background: checked ? "#B8FF3C" : "#1A1A24",
            border: checked ? "1px solid #B8FF3C" : "1px solid rgba(255,255,255,0.1)",
            boxShadow: checked ? "0 0 15px rgba(184,255,60,0.3)" : "none",
        }}>
        <span className="absolute rounded-full bg-white transition-all duration-300"
            style={{ width: 18, height: 18, left: checked ? 23 : 3, boxShadow: "0 1px 4px rgba(0,0,0,0.5)" }} />
    </button>
);

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`rounded-2xl p-5 bg-[#13131A] border border-white/5 ${className}`}>
        {children}
    </div>
);

const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
    <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#B8FF3C]/10 border border-[#B8FF3C]/20 text-[#B8FF3C]">
            <Icon size={20} />
        </div>
        <div>
            <h2 className="text-xl font-black text-white">{title}</h2>
        </div>
    </div>
);

const ModeBtn = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button onClick={onClick}
        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 border ${
            active 
                ? "bg-[#B8FF3C] text-[#0A0A0F] border-[#B8FF3C]" 
                : "bg-transparent text-slate-500 border-white/10 hover:border-white/20"
        }`}>
        {label}
    </button>
);

export default function SettingsPage() {
    const { data: session } = useSession();
    const { user, setUser } = useGlobalStore();
    
    // UI Local State
    const [waterOn, setWaterOn] = useState(true);
    const [mealOn, setMealOn] = useState(true);
    const [workoutOn, setWorkoutOn] = useState(false);
    const [analytics, setAnalytics] = useState(true);
    const [aiProvider, setAiProvider] = useState("groq");
    const [apiKey, setApiKey] = useState("••••••••••••••••••••");
    const [showKey, setShowKey] = useState(false);
    const [saved, setSaved] = useState(false);

    // Sync from store
    const [targets, setTargets] = useState({
        calories: user?.targetCalories || 2000,
        protein: user?.targetProtein || 150,
        water: 3000, // Water is not in profile yet
    });

    const handleSave = () => {
        if (user) {
            setUser({
                ...user,
                targetCalories: targets.calories,
                targetProtein: targets.protein,
            });
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const inputCls = "w-full bg-[#0A0A0F] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#B8FF3C]/50 transition-all";

    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-24">
            
            <div className="mb-10">
                <h1 className="text-3xl font-black text-white mb-2">Settings</h1>
                <p className="text-slate-500">Customize your NutriSnap experience and AI preferences</p>
            </div>

            {/* ── Notifications ── */}
            <section>
                <SectionHeader icon={Bell} title="Notifications & Reminders" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { icon: Droplets, label: "Water Intake", sub: "Daily nudges", on: waterOn, set: setWaterOn, color: "text-blue-400" },
                        { icon: Utensils, label: "Meal Logging", sub: "Post-meal checks", on: mealOn, set: setMealOn, color: "text-[#B8FF3C]" },
                        { icon: Dumbbell, label: "Workouts", sub: "Session reminders", on: workoutOn, set: setWorkoutOn, color: "text-purple-400" },
                    ].map((r) => (
                        <Card key={r.label}>
                            <div className="flex items-center justify-between mb-4">
                                <r.icon className={r.color} size={20} />
                                <Toggle checked={r.on} onChange={r.set} />
                            </div>
                            <p className="text-sm font-bold text-white mb-1">{r.label}</p>
                            <p className="text-xs text-slate-500">{r.sub}</p>
                        </Card>
                    ))}
                </div>
            </section>

            {/* ── AI Config ── */}
            <section>
                <SectionHeader icon={Brain} title="AI Configuration" />
                <Card>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">AI Provider</label>
                            <div className="relative">
                                <select value={aiProvider} onChange={(e) => setAiProvider(e.target.value)} className={inputCls}>
                                    <option value="groq">Groq — Llama 3 (Ultra Fast)</option>
                                    <option value="openai">OpenAI — GPT-4o</option>
                                    <option value="gemini">Google — Gemini 1.5 Pro</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">API Key</label>
                            <div className="relative">
                                <input type={showKey ? "text" : "password"} value={apiKey} onChange={(e) => setApiKey(e.target.value)} className={inputCls} />
                                <button onClick={() => setShowKey(!showKey)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>
                    <p className="text-[10px] text-slate-600 italic">NutriSnap uses high-performance edge models for instant analysis.</p>
                </Card>
            </section>

            {/* ── Goals ── */}
            <section>
                <SectionHeader icon={Target} title="Goals & Targets" />
                <Card className="divide-y divide-white/5">
                    {[
                        { label: "Daily Calories", key: "calories", unit: "kcal", icon: Sparkles },
                        { label: "Protein Intake", key: "protein", unit: "g", icon: Sparkles },
                        { label: "Water Goal", key: "water", unit: "ml", icon: Sparkles },
                    ].map((row) => (
                        <div key={row.label} className="py-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-white">{row.label}</p>
                                <p className="text-xs text-slate-500 capitalize">Manual adjustment</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <input 
                                    type="number" 
                                    value={targets[row.key as keyof typeof targets]} 
                                    onChange={(e) => setTargets({ ...targets, [row.key]: parseInt(e.target.value) || 0 })}
                                    className="w-24 bg-[#0A0A0F] border border-white/10 rounded-lg px-3 py-1.5 text-right font-bold text-[#B8FF3C] text-sm focus:border-[#B8FF3C]/30 outline-none"
                                />
                                <span className="text-xs text-slate-500 font-bold w-8">{row.unit}</span>
                            </div>
                        </div>
                    ))}
                </Card>
            </section>

            {/* ── Privacy ── */}
            <section>
                <SectionHeader icon={Shield} title="Privacy & Data" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button className="flex items-center justify-center gap-2 py-4 px-6 bg-[#13131A] border border-white/5 rounded-2xl text-sm font-bold text-white hover:bg-white/5 transition-all">
                        <Download size={18} className="text-[#B8FF3C]" /> Export My Data (.json)
                    </button>
                    <button className="flex items-center justify-center gap-2 py-4 px-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-500/20 transition-all">
                        <Trash2 size={18} /> Delete Account
                    </button>
                </div>
            </section>

            {/* ── Support ── */}
            <section>
                <SectionHeader icon={HelpCircle} title="Support & Feedback" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="hover:border-white/20 transition-all cursor-pointer">
                        <Bug size={24} className="text-orange-400 mb-3" />
                        <p className="text-sm font-bold text-white mb-1">Report a Bug</p>
                        <p className="text-xs text-slate-500">Found an issue? Our team is on it.</p>
                    </Card>
                    <Card className="hover:border-white/20 transition-all cursor-pointer">
                        <Rocket size={24} className="text-[#B8FF3C] mb-3" />
                        <p className="text-sm font-bold text-white mb-1">Feature Request</p>
                        <p className="text-xs text-slate-500">Tell us what you want to see next.</p>
                    </Card>
                </div>
            </section>

            {/* ── Fixed Footer ── */}
            <div className="fixed bottom-0 left-0 lg:left-[220px] right-0 bg-[#0A0A0F]/80 backdrop-blur-xl border-t border-white/5 p-4 z-40 flex justify-center">
                <div className="max-w-4xl w-full flex items-center justify-between">
                    <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#B8FF3C] animate-pulse" />
                        All systems operational
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <button className="flex-1 sm:flex-none text-sm font-bold text-slate-500 hover:text-white transition-colors">Discard</button>
                        <button 
                            onClick={handleSave}
                            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-sm font-black transition-all ${
                                saved 
                                    ? "bg-emerald-500 text-[#0A0A0F]" 
                                    : "bg-[#B8FF3C] text-[#0A0A0F] shadow-lg shadow-[#B8FF3C]/20 hover:scale-[1.02]"
                            }`}
                        >
                            {saved ? <Check size={18} /> : <Save size={18} />}
                            {saved ? "SAVED" : "SAVE SETTINGS"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}