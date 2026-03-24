"use client";
// FILE LOCATION: app/(dashboard)/analyze-meal/page.tsx
// Content-only — NO Sidebar/Header (parent layout owns those)

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
    Upload, Camera, Sparkles, RotateCcw, Save,
    X, Check, AlertCircle, Loader2, Plus, Minus,
    Flame, Beef, Wheat, Droplets, RefreshCw,
} from "lucide-react";
import { useGlobalStore } from "@/store/useGlobalStore";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Toast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Nutrition {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
}

interface AnalysisResult {
    foodName: string;
    servingGrams: number;
    servings: number;
    prepTimeMin: number;
    confidence: string;
    ingredients: string[];
    nutrition: Nutrition;
    per100g: Nutrition;
}

interface LogEntry {
    id: string;
    imageUrl: string;
    foodName: string;
    grams: number;
    servings: number;
    mealType: string;
    nutrition: Nutrition;
    loggedAt: string;
    date: string;
}

type PageState = "idle" | "analyzing" | "result" | "error";

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = (reader.result as string).split(",")[1];
            resolve({ base64, mimeType: file.type || "image/jpeg" });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function scaleNutrition(per100g: Nutrition, grams: number, servings: number): Nutrition {
    const m = (grams * servings) / 100;
    return {
        calories: Math.round(per100g.calories * m),
        protein: Math.round(per100g.protein * m),
        carbs: Math.round(per100g.carbs * m),
        fat: Math.round(per100g.fat * m),
        fiber: Math.round(per100g.fiber * m),
        sugar: Math.round(per100g.sugar * m),
        sodium: Math.round(per100g.sodium * m),
    };
}

function today() {
    return new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function nowTime() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ── Scan overlay ──────────────────────────────────────────────────────────────
function ScanOverlay({ imageUrl }: { imageUrl: string }) {
    return (
        <div className="relative rounded-2xl overflow-hidden border border-white/8">
            <img src={imageUrl} alt="analyzing" className="w-full h-64 object-cover opacity-60" />
            <div className="absolute inset-0 overflow-hidden">
                <div className="scan-line absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#B8FF3C] to-transparent" />
            </div>
            {["top-3 left-3", "top-3 right-3", "bottom-3 left-3", "bottom-3 right-3"].map((pos, i) => (
                <div key={i} className={`absolute ${pos} w-5 h-5 border-[#B8FF3C] border-2 ${i === 0 ? "border-r-0 border-b-0 rounded-tl-sm" :
                        i === 1 ? "border-l-0 border-b-0 rounded-tr-sm" :
                            i === 2 ? "border-r-0 border-t-0 rounded-bl-sm" :
                                "border-l-0 border-t-0 rounded-br-sm"}`} />
            ))}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#0A0A0F]/80 border border-white/10 rounded-full px-3 py-1.5">
                <Loader2 size={12} className="text-[#B8FF3C] animate-spin" />
                <span className="text-xs text-[#B8FF3C] font-bold">Analyzing with AI…</span>
            </div>
            <style jsx>{`
        .scan-line { animation: scan 2s linear infinite; }
        @keyframes scan { 0%{top:0%} 100%{top:100%} }
      `}</style>
        </div>
    );
}

// ── Macro card ────────────────────────────────────────────────────────────────
function MacroCard({ icon, label, value, unit, color }: {
    icon: React.ReactNode; label: string; value: number; unit: string; color: string;
}) {
    return (
        <div className="bg-[#13131A] border border-white/8 rounded-2xl p-4 flex flex-col gap-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-1 bg-white/5">
                <span className={color}>{icon}</span>
            </div>
            <div className="text-2xl font-black text-white">
                {value}<span className="text-sm font-medium text-slate-500 ml-0.5">{unit}</span>
            </div>
            <div className="text-xs text-slate-500">{label}</div>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AnalyzeMeal() {
    const [state, setState] = useState<PageState>("idle");
    const [imageUrl, setImageUrl] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [errorMsg, setErrorMsg] = useState("");
    const [isDragging, setIsDragging] = useState(false);
    const [activeTab, setActiveTab] = useState<"analyze" | "log">("analyze");
    const [mounted, setMounted] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<LogEntry | null>(null);
    const { data: session } = useSession();
    
    const { foodLog, addFoodLog, deleteFoodLog, setFoodLog } = useGlobalStore();
    
    const log = useMemo<LogEntry[]>(() => {
        return foodLog.map((item) => {
            const f = item as any;
            return {
                id: f._id || f.id || Math.random().toString(),
                imageUrl: f.imageUrl || "",
                foodName: f.food_name || f.foodName || "Custom Meal",
                grams: 100, // Fallback
                servings: 1, 
                mealType: "Logged",
                nutrition: {
                    calories: f.total_calories ?? f.nutrition?.calories ?? 0,
                    protein: Math.round(f.total_protein ?? f.nutrition?.protein ?? 0),
                    carbs: Math.round(f.total_carbs ?? f.nutrition?.carbs ?? 0),
                    fat: Math.round(f.total_fat ?? f.nutrition?.fat ?? 0),
                    fiber: f.nutrition?.fiber ?? 0,
                    sugar: f.nutrition?.sugar ?? 0,
                    sodium: f.nutrition?.sodium ?? 0
                },
                date: f.date || (f.createdAt ? new Date(f.createdAt).toISOString() : new Date().toISOString()),
                loggedAt: new Date(f.createdAt || Date.now()).toLocaleTimeString() 
            };
        });
    }, [foodLog]);

    const [logLoading, setLogLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

    const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    // Inline adjustment state
    const [adjGrams, setAdjGrams] = useState(0);
    const [adjServings, setAdjServings] = useState(1);
    const [adjMealType, setAdjMealType] = useState("Lunch");

    const fileRef = useRef<HTMLInputElement>(null);
    const cameraRef = useRef<HTMLInputElement>(null);

    const liveNutrition = result
        ? scaleNutrition(result.per100g, adjGrams, adjServings)
        : null;

    // ── Load log from backend on mount ────────────────────────────────────────
    const fetchLog = useCallback(async () => {
        if (!session?.user?.id) return;
        setLogLoading(true);
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const res = await fetch(`${apiBase}/api/meal-log/user/${session.user.id}`);
            if (res.ok) {
                const json = await res.json();
                const data = json.data || [];
                // Completely replace the food log in the store to prevent user accounts from sharing cached data.
                const freshLogs = data.map((l: any) => ({
                    ...l,
                    _id: l._id || l.id,
                    food_name: l.food_name || l.foodName,
                    total_calories: l.total_calories ?? l.nutrition?.calories ?? 0,
                    total_protein: l.total_protein ?? l.nutrition?.protein ?? 0,
                    total_carbs: l.total_carbs ?? l.nutrition?.carbs ?? 0,
                    total_fat: l.total_fat ?? l.nutrition?.fat ?? 0,
                }));
                setFoodLog(freshLogs);
            }
        } catch (err) {
            console.error("Failed to load log", err);
        } finally {
            setLogLoading(false);
        }
    }, [setFoodLog, session]);

    useEffect(() => {
        setMounted(true);
        fetchLog();
    }, [fetchLog]);

    // ── File handling ──────────────────────────────────────────────────────────
    const handleFile = useCallback((file: File) => {
        if (!file.type.startsWith("image/")) return;
        setImageFile(file);
        setImageUrl(URL.createObjectURL(file));
        setState("idle");
        setSaved(false);
        setResult(null);
    }, []);

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault(); setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    // ── Analyze ────────────────────────────────────────────────────────────────
    const analyze = async () => {
        if (!imageFile) return;
        setState("analyzing");
        setErrorMsg("");
        setSaved(false);

        try {
            const { base64, mimeType } = await fileToBase64(imageFile);
            const res = await fetch("/api/analyze-meal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: base64, mimeType }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Analysis failed");
            }

            const data: AnalysisResult = await res.json();
            setResult(data);
            setAdjGrams(data.servingGrams);
            setAdjServings(data.servings);
            setState("result");
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
            setState("error");
        }
    };

    // ── Save to backend log ────────────────────────────────────────────────────
    const saveToLog = async () => {
        if (!result || !liveNutrition || saving || !session?.user?.id || session.user.id === 'undefined') {
            console.error("[DEBUG] Save attempted without valid session:", session);
            return;
        }
        setSaving(true);

        const formData = new FormData();
        formData.append("userId", session.user.id);
        formData.append("food_name", result.foodName);
        formData.append("date", today());
        formData.append("mealType", adjMealType.toLowerCase());
        formData.append("grams", adjGrams.toString());
        formData.append("servings", adjServings.toString());
        
        // Detailed nutrition as JSON string for easy backend parsing
        formData.append("nutrition", JSON.stringify(liveNutrition));
        
        // Also keep top-level for backwards compatibility if needed
        formData.append("total_calories", liveNutrition.calories.toString());
        formData.append("total_protein", liveNutrition.protein.toString());
        formData.append("total_carbs", liveNutrition.carbs.toString());
        formData.append("total_fat", liveNutrition.fat.toString());

        if (imageFile) {
            formData.append("image", imageFile);
        }

        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const res = await fetch(`${apiBase}/api/meal-log`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const errText = await res.text();
                console.error("[DEBUG] Save failed with status", res.status, "and body:", errText);
                throw new Error("Save failed: " + errText);
            }

            const json = await res.json();
            const savedLog = json.data;
            
            showToast(`"${savedLog.food_name}" successfully logged!`, "success");

            // Push formatted entry to Zustand
            addFoodLog({
                ...savedLog,
                _id: savedLog._id,
                food_name: savedLog.food_name,
                total_calories: savedLog.total_calories,
                total_protein: savedLog.total_protein,
                total_carbs: savedLog.total_carbs,
                total_fat: savedLog.total_fat,
            } as any);

            // Log activity for coach
            const { logActivity } = await import('@/lib/activity');
            logActivity(
                session.user.id,
                'meal_log',
                `logged a meal: ${savedLog.food_name}`,
                { note: `"${savedLog.food_name} — ${savedLog.total_calories} kcal"` }
            );

            setSaved(true);
            setTimeout(() => setActiveTab("log"), 800);
        } catch (err) {
            console.error("Failed to save", err);
            showToast("Failed to save to log. Please try again.", "error");
        } finally {
            setSaving(false);
        }
    };

    // ── Delete entry ───────────────────────────────────────────────────────────
    const deleteEntryFromLog = async (id: string) => {
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            await fetch(`${apiBase}/api/meal-log/${id}`, { method: "DELETE" });
            deleteFoodLog(id);
        } catch (err) {
            console.error("Failed to delete", err);
        }
    };

    // ── Clear all ──────────────────────────────────────────────────────────────
    const clearAll = async () => {
        // Warning: This would usually loop over ids or need a backend mass-delete
        // Using local clearing for this demonstration
        try {
            await fetch("/api/meal-log", { method: "DELETE" });
            fetchLog();
        } catch (err) {
            console.error("Failed to clear", err);
        }
    };

    // ── Reset ──────────────────────────────────────────────────────────────────
    const reset = () => {
        setState("idle");
        setImageUrl("");
        setImageFile(null);
        setResult(null);
        setErrorMsg("");
        setSaved(false);
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    if (!mounted) return <div className="min-h-screen bg-[#0A0A0F]" />;

    return (
        <div className="px-2 sm:px-8 py-4 sm:py-8 max-w-2xl mx-auto">

            {/* Header + tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white leading-tight">Analyze Meal</h1>
                    <p className="text-slate-500 text-sm mt-1">Photo → AI → full nutrition breakdown</p>
                </div>
                <div className="flex gap-1 bg-[#13131A] border border-white/8 rounded-xl p-1 w-full sm:w-auto">
                    {(["analyze", "log"] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-xs font-bold capitalize transition-all ${activeTab === tab ? "bg-[#B8FF3C] text-[#0A0A0F]" : "text-slate-400 hover:text-white"
                                }`}>
                            {tab}
                            {tab === "log" && log.length > 0 && (
                                <span className="ml-1.5 bg-[#B8FF3C]/20 text-[#B8FF3C] px-1.5 py-0.5 rounded-full text-[9px] font-black">
                                    {log.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* ══════════════ ANALYZE TAB ══════════════ */}
            {activeTab === "analyze" && (
                <div className="space-y-5">

                    {/* Upload zone */}
                    {state === "idle" && !imageUrl && (
                        <div
                            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={onDrop}
                            onClick={() => fileRef.current?.click()}
                            className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all cursor-pointer ${isDragging
                                    ? "border-[#B8FF3C] bg-[#B8FF3C]/5"
                                    : "border-white/10 hover:border-white/25 bg-[#13131A]/50"
                                }`}
                        >
                            <div className="w-16 h-16 bg-[#B8FF3C]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Upload size={28} className="text-[#B8FF3C]" />
                            </div>
                            <h3 className="text-white font-black text-lg mb-1">Drop your food photo here</h3>
                            <p className="text-slate-500 text-sm mb-5">or click to browse · JPG, PNG, WEBP</p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <button onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
                                    className="flex items-center justify-center gap-2 px-6 py-3.5 bg-[#B8FF3C] text-[#0A0A0F] rounded-xl text-sm font-black hover:bg-[#d4ff6e] transition-all">
                                    <Upload size={16} /> Upload Photo
                                </button>
                                <button onClick={e => { e.stopPropagation(); cameraRef.current?.click(); }}
                                    className="flex items-center justify-center gap-2 px-6 py-3.5 border border-white/10 text-slate-400 rounded-xl text-sm font-bold hover:bg-white/5 transition-all">
                                    <Camera size={16} /> Take Photo
                                </button>
                            </div>
                            <input ref={fileRef} type="file" accept="image/*" className="hidden"
                                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
                                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                        </div>
                    )}

                    {/* Preview + analyze */}
                    {state === "idle" && imageUrl && (
                        <div className="space-y-4">
                            <div className="relative rounded-2xl overflow-hidden border border-white/8">
                                <img src={imageUrl} alt="food" className="w-full h-64 object-cover" />
                                <button onClick={reset}
                                    className="absolute top-3 right-3 w-8 h-8 bg-[#0A0A0F]/80 rounded-full flex items-center justify-center hover:bg-[#0A0A0F] transition-colors">
                                    <X size={14} className="text-white" />
                                </button>
                            </div>
                            <button onClick={analyze}
                                className="w-full flex items-center justify-center gap-2 py-4 bg-[#B8FF3C] text-[#0A0A0F] rounded-2xl font-black text-base hover:bg-[#d4ff6e] shadow-lg shadow-[#B8FF3C]/20 transition-all">
                                <Sparkles size={18} /> Analyze with AI
                            </button>
                        </div>
                    )}

                    {/* Scanning */}
                    {state === "analyzing" && imageUrl && <ScanOverlay imageUrl={imageUrl} />}

                    {/* Error */}
                    {state === "error" && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 text-center">
                            <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
                            <p className="text-white font-bold mb-1">Analysis Failed</p>
                            <p className="text-slate-400 text-sm mb-4">{errorMsg}</p>
                            <button onClick={reset}
                                className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-slate-300 hover:bg-white/10 transition-all">
                                Try Again
                            </button>
                        </div>
                    )}

                    {/* Result */}
                    {state === "result" && result && liveNutrition && (
                        <div className="space-y-4">

                            {/* Food image */}
                            <div className="relative rounded-2xl overflow-hidden border border-white/8">
                                <img src={imageUrl} alt={result.foodName} className="w-full h-52 object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] via-transparent to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-4">
                                    <h2 className="text-xl font-black text-white">{result.foodName}</h2>
                                    <div className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${result.confidence === "high" ? "bg-[#B8FF3C]/20 text-[#B8FF3C]" :
                                            result.confidence === "medium" ? "bg-orange-400/20 text-orange-400" :
                                                "bg-red-400/20 text-red-400"
                                        }`}>
                                        <Sparkles size={9} /> {result.confidence} confidence
                                    </div>
                                </div>
                            </div>

                            {/* Adjustment panel */}
                            <div className="bg-[#13131A] border border-[#B8FF3C]/20 rounded-2xl p-5 space-y-4">
                                <div className="text-xs font-bold text-[#B8FF3C] uppercase tracking-wider">
                                    Adjust Serving — macros update live
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {/* Weight */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Weight (g)</label>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setAdjGrams(g => Math.max(10, g - 25))}
                                                className="w-8 h-8 bg-white/5 border border-white/8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors flex-shrink-0">
                                                <Minus size={12} className="text-slate-400" />
                                            </button>
                                            <input type="number" value={adjGrams}
                                                onChange={e => setAdjGrams(Math.max(1, Number(e.target.value)))}
                                                className="flex-1 w-0 bg-[#0A0A0F] border border-white/8 rounded-xl px-3 py-2 text-white text-sm font-bold text-center focus:outline-none focus:border-[#B8FF3C]/50 transition-all" />
                                            <button onClick={() => setAdjGrams(g => g + 25)}
                                                className="w-8 h-8 bg-white/5 border border-white/8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors flex-shrink-0">
                                                <Plus size={12} className="text-slate-400" />
                                            </button>
                                        </div>
                                        <input type="range" min={25} max={800} step={25} value={adjGrams}
                                            onChange={e => setAdjGrams(Number(e.target.value))}
                                            className="w-full mt-2 accent-[#B8FF3C]" />
                                    </div>

                                    {/* Servings */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Servings</label>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setAdjServings(s => Math.max(0.5, +(s - 0.5).toFixed(1)))}
                                                className="w-8 h-8 bg-white/5 border border-white/8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors flex-shrink-0">
                                                <Minus size={12} className="text-slate-400" />
                                            </button>
                                            <input type="number" value={adjServings} min={0.5} step={0.5}
                                                onChange={e => setAdjServings(Math.max(0.5, Number(e.target.value)))}
                                                className="flex-1 w-0 bg-[#0A0A0F] border border-white/8 rounded-xl px-3 py-2 text-white text-sm font-bold text-center focus:outline-none focus:border-[#B8FF3C]/50 transition-all" />
                                            <button onClick={() => setAdjServings(s => +(s + 0.5).toFixed(1))}
                                                className="w-8 h-8 bg-white/5 border border-white/8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors flex-shrink-0">
                                                <Plus size={12} className="text-slate-400" />
                                            </button>
                                        </div>
                                        <input type="range" min={0.5} max={5} step={0.5} value={adjServings}
                                            onChange={e => setAdjServings(Number(e.target.value))}
                                            className="w-full mt-2 accent-[#B8FF3C]" />
                                    </div>
                                </div>

                                {/* Meal type */}
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Meal Type</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {MEAL_TYPES.map(m => (
                                            <button key={m} onClick={() => setAdjMealType(m)}
                                                className={`py-2 rounded-xl text-xs font-bold border transition-all ${adjMealType === m
                                                        ? "border-[#B8FF3C] bg-[#B8FF3C]/15 text-[#B8FF3C]"
                                                        : "border-white/8 text-slate-400 hover:border-white/20"
                                                    }`}>
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="text-[10px] text-slate-500 text-center">
                                    Total: {adjGrams}g × {adjServings} serving{adjServings !== 1 ? "s" : ""} = {Math.round(adjGrams * adjServings)}g
                                </div>
                            </div>

                            {/* Live macros */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <MacroCard icon={<Flame size={16} />} label="Calories" value={liveNutrition.calories} unit="kcal" color="text-[#B8FF3C]" />
                                <MacroCard icon={<Beef size={16} />} label="Protein" value={liveNutrition.protein} unit="g" color="text-emerald-400" />
                                <MacroCard icon={<Wheat size={16} />} label="Carbs" value={liveNutrition.carbs} unit="g" color="text-orange-400" />
                                <MacroCard icon={<Droplets size={16} />} label="Fat" value={liveNutrition.fat} unit="g" color="text-yellow-400" />
                            </div>

                            {/* Full breakdown */}
                            <div className="bg-[#13131A] border border-white/8 rounded-2xl p-4">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Full Breakdown</div>
                                <div className="space-y-2">
                                    {[
                                        { label: "Fiber", val: liveNutrition.fiber, unit: "g" },
                                        { label: "Sugar", val: liveNutrition.sugar, unit: "g" },
                                        { label: "Sodium", val: liveNutrition.sodium, unit: "mg" },
                                    ].map(({ label, val, unit }) => (
                                        <div key={label} className="flex items-center justify-between text-sm">
                                            <span className="text-slate-400">{label}</span>
                                            <span className="text-white font-bold">{val}{unit}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Per 100g */}
                            <div className="bg-[#13131A] border border-white/8 rounded-2xl p-4">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Per 100g Reference</div>
                                <div className="grid grid-cols-4 gap-2 text-center">
                                    {[
                                        { label: "Cal", val: result.per100g.calories, color: "text-white" },
                                        { label: "Prot", val: result.per100g.protein, color: "text-emerald-400" },
                                        { label: "Carb", val: result.per100g.carbs, color: "text-orange-400" },
                                        { label: "Fat", val: result.per100g.fat, color: "text-yellow-400" },
                                    ].map(({ label, val, color }) => (
                                        <div key={label} className="bg-[#0A0A0F] rounded-xl p-2">
                                            <div className={`text-sm font-black ${color}`}>{val}</div>
                                            <div className="text-[9px] text-slate-600">{label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Ingredients */}
                            {result.ingredients.length > 0 && (
                                <div className="bg-[#13131A] border border-white/8 rounded-2xl p-4">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Detected Ingredients</div>
                                    <div className="flex flex-wrap gap-2">
                                        {result.ingredients.map(ing => (
                                            <span key={ing} className="px-3 py-1 bg-white/5 border border-white/8 rounded-full text-xs text-slate-300">{ing}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-3 pb-4">
                                <button onClick={reset}
                                    className="flex items-center gap-2 px-5 py-3.5 rounded-xl border border-white/10 text-slate-400 text-sm font-bold hover:bg-white/5 transition-all">
                                    <RotateCcw size={15} /> New
                                </button>
                                <button onClick={saveToLog} disabled={saved || saving}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-black transition-all ${saved
                                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default"
                                            : saving
                                                ? "bg-[#B8FF3C]/50 text-[#0A0A0F] cursor-wait"
                                                : "bg-[#B8FF3C] text-[#0A0A0F] hover:bg-[#d4ff6e] shadow-lg shadow-[#B8FF3C]/15"
                                        }`}>
                                    {saved ? <><Check size={15} />  Saved to Log!</> :
                                        saving ? <><Loader2 size={15} className="animate-spin" /> Saving…</> :
                                            <><Save size={15} />   Save to Log</>}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ══════════════ LOG TAB ══════════════ */}
            {activeTab === "log" && (
                <div className="space-y-4">

                    {/* Refresh button */}
                    <div className="flex justify-end">
                        <button onClick={fetchLog} disabled={logLoading}
                            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                            <RefreshCw size={12} className={logLoading ? "animate-spin" : ""} />
                            Refresh
                        </button>
                    </div>

                    {logLoading && log.length === 0 ? (
                        <div className="text-center py-16">
                            <Loader2 size={24} className="text-slate-600 animate-spin mx-auto mb-3" />
                            <p className="text-slate-500 text-sm">Loading your meal log…</p>
                        </div>
                    ) : log.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Save size={22} className="text-slate-600" />
                            </div>
                            <p className="text-slate-500 text-sm">No meals logged yet.</p>
                            <button onClick={() => setActiveTab("analyze")}
                                className="mt-3 text-[#B8FF3C] text-sm font-bold hover:text-[#d4ff6e] transition-colors">
                                Analyze your first meal →
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Daily summary */}
                            <div className="bg-[#13131A] border border-white/8 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-y-4 sm:gap-y-0 sm:divide-x divide-white/5 text-center">
                                <div className="border-r border-white/5 sm:border-r-0">
                                    <div className="text-lg font-black text-white">{log.length}</div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Meals</div>
                                </div>
                                <div className="border-l-0">
                                    <div className="text-lg font-black text-white">{log.reduce((s: number, e: LogEntry) => s + e.nutrition.calories, 0)}</div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Cal</div>
                                </div>
                                <div className="border-t sm:border-t-0 border-white/5 pt-4 sm:pt-0 border-r border-white/5 sm:border-r-0">
                                    <div className="text-lg font-black text-emerald-400">{log.reduce((s: number, e: LogEntry) => s + e.nutrition.protein, 0)}g</div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Protein</div>
                                </div>
                                <div className="border-t sm:border-t-0 border-white/5 pt-4 sm:pt-0 border-l-0">
                                    <div className="text-lg font-black text-orange-400">{log.reduce((s: number, e: LogEntry) => s + e.nutrition.carbs, 0)}g</div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Carbs</div>
                                </div>
                            </div>
                            {/* Entries */}
                            {log.map((entry: LogEntry) => (
                                <div 
                                    key={entry.id} 
                                    onClick={() => setSelectedEntry(entry)}
                                    className="bg-[#13131A] border border-white/8 rounded-2xl p-3 sm:p-4 flex gap-3 sm:gap-4 hover:border-[#B8FF3C]/30 cursor-pointer transition-all hover:bg-[#13131A]/80 group"
                                >
                                    {/* Image or placeholder */}
                                    {entry.imageUrl ? (
                                        <img src={entry.imageUrl} alt={entry.foodName}
                                            className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl flex-shrink-0"
                                            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                                        />
                                    ) : (
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/5 rounded-xl flex-shrink-0 flex items-center justify-center">
                                            <Flame size={20} className="text-slate-600" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-1">
                                            <h3 className="text-sm font-black text-white truncate pr-2 group-hover:text-[#B8FF3C] transition-colors">{entry.foodName}</h3>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); deleteEntryFromLog(entry.id); }}
                                                className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center hover:bg-red-500/20 transition-all flex-shrink-0"
                                            >
                                                <X size={11} className="text-slate-500" />
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs mb-2">
                                            <span className="text-white font-bold">{entry.nutrition.calories} <span className="text-slate-500">kcal</span></span>
                                            <span className="text-emerald-400 font-bold">{entry.nutrition.protein}g <span className="text-slate-500 text-[10px]">prot</span></span>
                                            <span className="text-orange-400 font-bold">{entry.nutrition.carbs}g <span className="text-slate-500 text-[10px]">carb</span></span>
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-[10px] px-2 py-0.5 bg-white/5 border border-white/8 rounded-full text-slate-400">{entry.mealType}</span>
                                            <span className="text-[10px] text-slate-600 truncate">{entry.grams}g × {entry.servings}s</span>
                                            <span className="text-[10px] text-slate-600 ml-auto">{entry.loggedAt}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button onClick={clearAll}
                                className="w-full py-2.5 border border-white/8 rounded-xl text-xs text-slate-600 hover:text-red-400 hover:border-red-500/20 transition-all font-bold">
                                Clear All Entries
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* ── Meal Details Modal ─────────────────────────────────────── */}
            <Modal
                open={!!selectedEntry}
                onClose={() => setSelectedEntry(null)}
                title="Meal Details"
                size="md"
            >
                {selectedEntry && (
                    <div className="space-y-6">
                        <div className="flex gap-4 items-start">
                            {selectedEntry.imageUrl ? (
                                <img src={selectedEntry.imageUrl} alt={selectedEntry.foodName} className="w-24 h-24 rounded-2xl object-cover border border-white/10" />
                            ) : (
                                <div className="w-24 h-24 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                                    <Flame size={32} className="text-slate-600" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0 py-1">
                                <h3 className="text-xl font-black text-white leading-tight mb-1">{selectedEntry.foodName}</h3>
                                <p className="text-xs text-[#B8FF3C] font-bold uppercase tracking-widest">{selectedEntry.mealType}</p>
                                <p className="text-xs text-slate-500 mt-2">{selectedEntry.date} · {selectedEntry.loggedAt}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <MacroCard icon={<Flame size={16} />} label="Calories" value={selectedEntry.nutrition.calories} unit="kcal" color="text-[#B8FF3C]" />
                            <MacroCard icon={<Beef size={16} />} label="Protein" value={selectedEntry.nutrition.protein} unit="g" color="text-emerald-400" />
                            <MacroCard icon={<Wheat size={16} />} label="Carbs" value={selectedEntry.nutrition.carbs} unit="g" color="text-orange-400" />
                            <MacroCard icon={<Droplets size={16} />} label="Fat" value={selectedEntry.nutrition.fat} unit="g" color="text-yellow-400" />
                        </div>

                        <div className="bg-white/5 border border-white/8 rounded-2xl p-5">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Detailed Breakdown</h4>
                            <div className="space-y-3">
                                {[
                                    { label: "Fiber", value: selectedEntry.nutrition.fiber, unit: "g" },
                                    { label: "Sugar", value: selectedEntry.nutrition.sugar, unit: "g" },
                                    { label: "Sodium", value: selectedEntry.nutrition.sodium, unit: "mg" },
                                ].map((item) => (
                                    <div key={item.label} className="flex justify-between items-center text-sm border-b border-white/[0.04] pb-2 last:border-0 last:pb-0">
                                        <span className="text-slate-400 font-medium">{item.label}</span>
                                        <span className="text-white font-bold">{item.value}{item.unit}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedEntry(null)}
                            className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-colors border border-white/10"
                        >
                            Close
                        </button>
                    </div>
                )}
            </Modal>
        </div>
    );
}