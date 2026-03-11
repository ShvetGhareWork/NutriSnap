"use client";

import { useMemo, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { TrendingUp, TrendingDown, Minus, Bell, Lightbulb, Activity, ArrowRight, Plus } from "lucide-react";
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, ReferenceLine, Cell, CartesianGrid
} from "recharts";
import { useGlobalStore } from "@/store/useGlobalStore";

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, unit, trendLabel, trend, icon }: {
    label: string; value: string | number; unit: string;
    trendLabel?: string; trend?: "up" | "down" | "flat"; icon?: string;
}) {
    const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
    const trendColor = trend === "up" ? "text-[#B8FF3C]" : trend === "down" ? "text-red-400" : "text-slate-400";

    return (
        <div className="group relative bg-[#13131A] border border-white/10 rounded-2xl p-5 overflow-hidden flex flex-col justify-between min-h-[120px] transition-all duration-300 hover:border-white/20 hover:shadow-[0_0_20px_rgba(0,0,0,0.4)]">
            {/* Ambient glow based on trend */}
            <div className={`absolute -right-8 -bottom-8 w-24 h-24 blur-[50px] opacity-20 pointer-events-none transition-colors duration-500 ${
                trend === "up" ? "bg-[#B8FF3C]" : trend === "down" ? "bg-red-500" : "bg-slate-500"
            }`} />
            
            {icon && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-5xl opacity-[0.07] select-none pointer-events-none transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                    {icon}
                </div>
            )}
            <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2 relative z-10">{label}</div>
            <div className="flex items-end gap-1.5 relative z-10">
                <span className="text-3xl font-black text-white leading-none">{value}</span>
                {unit && <span className="text-sm text-slate-500 mb-0.5 font-bold">{unit}</span>}
            </div>
            {trendLabel && (
                <div className={`flex items-center gap-1 mt-3 text-[11px] font-bold ${trendColor} relative z-10`}>
                    <div className={`p-0.5 rounded-full ${trend === "up" ? "bg-[#B8FF3C]/10" : trend === "down" ? "bg-red-500/10" : "bg-slate-500/10"}`}>
                        {trend && <TrendIcon size={12} />}
                    </div>
                    <span>{trendLabel}</span>
                </div>
            )}
        </div>
    );
}

// ── Water ring ────────────────────────────────────────────────────────────────
function WaterRing({ pct }: { pct: number }) {
    const r = 54, circ = 2 * Math.PI * r;
    return (
        <svg width={130} height={130} className="rotate-[-90deg]">
            <circle cx={65} cy={65} r={r} fill="none" stroke="#1e2a1e" strokeWidth={10} />
            <circle cx={65} cy={65} r={r} fill="none" stroke="#B8FF3C" strokeWidth={10}
                strokeDasharray={`${circ * Math.min(pct, 100) / 100} ${circ}`} strokeLinecap="round" />
        </svg>
    );
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ label, current, max, color, unit = "g" }: {
    label: string; current: number; max: number; color: string; unit?: string;
}) {
    return (
        <div className="mb-4 last:mb-0">
            <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">{label}</span>
                <span className="text-slate-500">{Math.round(current)}{unit} / {max}{unit}</span>
            </div>
            <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${Math.min(100, Math.max(0, current / max)) * 100}%` }} />
            </div>
        </div>
    );
}

// ── Chart tooltip ─────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    const isCal = payload[0].dataKey === "cal";
    return (
        <div className="bg-[#13131A]/90 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-2.5 shadow-2xl relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full ${isCal ? "bg-[#B8FF3C]" : "bg-[#10b981]"}`} />
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">{label}</div>
            <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black text-white leading-none">{payload[0].value.toLocaleString()}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">{isCal ? "kcal" : "grams"}</span>
            </div>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
    const { 
        user, 
        foodLog, 
        completedRecipes, 
        waterLog, 
        reminders,
        getDailyTotals,
        addWater
    } = useGlobalStore();

    const { data: session } = useSession();

    const [todayStr, setTodayStr] = useState("");
    const [mounted, setMounted] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    
    useEffect(() => {
        setMounted(true);
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        setTodayStr(`${yyyy}-${mm}-${dd}`);

        if (session?.user?.id) {
            fetchNotifications();
        }
    }, [session]);

    const fetchNotifications = async () => {
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const res = await fetch(`${apiBase}/api/user/notifications/${session?.user?.id}`);
            const json = await res.json();
            if (json.success) setNotifications(json.data);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            await fetch(`${apiBase}/api/user/notifications/${id}/read`, { method: 'PUT' });
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    // Get today's dynamic totals
    const todayTotals = useMemo(() => {
        if (!todayStr) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
        return getDailyTotals(todayStr);
    }, [getDailyTotals, todayStr, foodLog, completedRecipes]);

    // Calculate real weekly history from logs
    const weeklyHistory = useMemo(() => {
        const data = [];
        const daysShort = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
        
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const dateStr = `${yyyy}-${mm}-${dd}`;
            
            const totals = getDailyTotals(dateStr);
            data.push({
                day: daysShort[d.getDay()],
                cal: totals.calories,
                pro: totals.protein
            });
        }
        return data;
    }, [getDailyTotals, foodLog, completedRecipes]);

    // Construct today's logged meals list
    const todaysMeals = useMemo(() => {
        if (!todayStr) return [];
        const logs = foodLog
            .filter(f => {
                if (!f.date) return false;
                
                let createdAtMatches = false;
                if (f.createdAt) {
                    const d = new Date(f.createdAt);
                    if (!isNaN(d.getTime())) {
                        createdAtMatches = d.toISOString().startsWith(todayStr);
                    }
                }
                
                return f.date.startsWith(todayStr) || createdAtMatches;
            })
            .map(f => ({
                id: f._id,
                icon: "🍽️",
                name: f.food_name || "Custom Meal",
                time: (() => {
                    if (f.createdAt) {
                        const d = new Date(f.createdAt);
                        if (!isNaN(d.getTime())) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    }
                    if (f.date) {
                        const d = new Date(f.date);
                        if (!isNaN(d.getTime())) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    }
                    return "12:00 PM";
                })(),
                meal: "Logged Food",
                kcal: Math.round(f.total_calories || 0),
                protein: Math.round(f.total_protein || 0),
                bg: "bg-blue-500/20"
            }));

        const recipes = completedRecipes
            .filter(cr => cr.date === todayStr)
            .map(cr => ({
                id: cr.id,
                icon: "👨‍🍳",
                name: cr.recipe.title,
                time: "Completed",
                meal: "Recipe",
                kcal: Math.round(cr.nutritionSnapshot.calories || 0),
                protein: Math.round(cr.nutritionSnapshot.protein || 0),
                bg: "bg-emerald-500/20"
            }));

        return [...logs, ...recipes];
    }, [foodLog, completedRecipes, todayStr]);

    // Water data
    const todayWater = useMemo(() => {
        const entry = waterLog.find(w => w.date === todayStr);
        return entry ? entry.amount : 0;
    }, [waterLog, todayStr]);

    const waterTarget = 3000;
    const waterPct = Math.round((todayWater / waterTarget) * 100);

    // Dynamic AI Message
    const aiMessage = useMemo(() => {
        const userName = user?.firstName || "there";
        if (todayTotals.protein < (user?.targetProtein || 130) * 0.8) {
            return `"${userName}, your protein intake is slightly lagging today. Aim for a high-protein snack post-workout to hit your recovery sweet spot."`;
        }
        if (todayTotals.calories > (user?.targetCalories || 2000)) {
            return `"${userName}, you've hit your calorie target! Great job fueling up."`;
        }
        return `"${userName}, you're on track. Keep fueling your body with nutritious whole foods!"`;
    }, [user, todayTotals]);

    // Dynamic Weekly Insight
    const weeklyInsight = useMemo(() => {
        const avgPro = weeklyHistory.reduce((a, b) => a + b.pro, 0) / 7;
        const avgCal = weeklyHistory.reduce((a, b) => a + b.cal, 0) / 7;
        
        if (avgPro >= (user?.targetProtein || 130) * 0.9) {
            return "You're hitting your protein targets consistently! Great for muscle recovery.";
        }
        if (avgCal > (user?.targetCalories || 2000) * 1.1) {
            return "You're slightly above your calorie target this week. Try to balance it out with more fiber.";
        }
        return "Keep up the consistency. Logging every meal is the best way to stay on track!";
    }, [weeklyHistory, user]);

    // Dynamic Time Greeting
    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 17) return "Good afternoon";
        return "Good evening";
    }, []);

    // Reminder Data
    const nextReminder = useMemo(() => {
        if (reminders.length === 0) return null;
        return reminders[0];
    }, [reminders]);

    if (!mounted) {
        return <div className="min-h-screen bg-[#0A0A0F]" />;
    }

    const TARGET_PROTEIN = user?.targetProtein || 130;
    const TARGET_CALORIES = user?.targetCalories || 2000;

    return (
        <div className="space-y-5">

            <div className="mb-2">
                <h1 className="text-2xl font-black text-white">{greeting}, {user?.firstName || (session?.user as any)?.name?.split(' ')[0] || "there"}!</h1>
                <p className="text-sm text-slate-400">Here's your daily summary.</p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard label="Calories" value={Math.round(todayTotals.calories).toLocaleString()} unit="kcal" trend="up" trendLabel={`${Math.round((todayTotals.calories / TARGET_CALORIES) * 100)}% of goal`} icon="🔥" />
                <StatCard label="Protein" value={Math.round(todayTotals.protein).toString()} unit="grams" trend={todayTotals.protein >= TARGET_PROTEIN ? "up" : "down"} trendLabel={`${Math.round((todayTotals.protein / TARGET_PROTEIN) * 100)}% of goal`} icon="💪" />
                <StatCard label="Weight" value={user?.weightKg ? user.weightKg.toString() : "--"} unit="kg" trend="flat" trendLabel="Current" icon="⚖️" />
                <StatCard label="Carbs/Fat" value={`${Math.round(todayTotals.carbs)}/${Math.round(todayTotals.fat)}`} unit="g" trendLabel="Tracked" trend="up" icon="🥗" />
            </div>

            {/* Water + AI Focus + Reminder */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* Water + Reminder stacked */}
                <div className="flex flex-col gap-4">
                    <div className="bg-[#13131A] border border-white/6 rounded-2xl p-5 flex flex-col items-center flex-1">
                        <div className="text-sm font-black text-white mb-4 self-start flex justify-between w-full">
                            <span>Water Intake</span>
                        </div>
                        <div className="relative flex items-center justify-center mb-3">
                            <WaterRing pct={waterPct} />
                            <div className="absolute text-center pointer-events-none">
                                <div className="text-2xl font-black text-white">{waterPct}%</div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Goal</div>
                            </div>
                        </div>
                        <div className="text-xs text-slate-400 mb-4">
                            <span className="text-white font-bold">{todayWater}ml</span> / {waterTarget}ml
                        </div>
                        
                        <div className="flex gap-2 w-full mt-auto">
                            <button onClick={() => addWater(250)} className="flex-1 bg-white/5 hover:bg-[#B8FF3C]/20 hover:text-[#B8FF3C] text-xs font-bold text-white py-2 rounded-lg transition-colors border border-white/10 hover:border-[#B8FF3C]/30">+250ml</button>
                            <button onClick={() => addWater(500)} className="flex-1 bg-white/5 hover:bg-[#B8FF3C]/20 hover:text-[#B8FF3C] text-xs font-bold text-white py-2 rounded-lg transition-colors border border-white/10 hover:border-[#B8FF3C]/30">+500ml</button>
                            <button onClick={() => addWater(750)} className="flex-1 bg-white/5 hover:bg-[#B8FF3C]/20 hover:text-[#B8FF3C] text-xs font-bold text-white py-2 rounded-lg transition-colors border border-white/10 hover:border-[#B8FF3C]/30">+750ml</button>
                        </div>
                    </div>

                    {nextReminder && (
                        <div className="bg-[#B8FF3C]/10 border border-[#B8FF3C]/20 rounded-2xl p-4 flex items-center gap-4">
                            <div className="w-10 h-10 bg-[#B8FF3C] rounded-xl flex items-center justify-center flex-shrink-0">
                                <Bell size={18} className="text-[#0A0A0F]" />
                            </div>
                            <div>
                                <div className="text-[10px] text-[#B8FF3C] font-black uppercase tracking-wider mb-0.5">Next Reminder</div>
                                <div className="text-white font-bold text-sm">{nextReminder.message} at {nextReminder.time}</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* AI Daily Focus */}
                <div className="sm:col-span-1 lg:col-span-2 bg-[#13131A] border border-white/6 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-base font-black text-white">AI Daily Focus</h2>
                        <div className="w-6 h-6 bg-[#B8FF3C]/20 rounded-lg flex items-center justify-center">
                            <Lightbulb size={12} className="text-[#B8FF3C]" />
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 mb-5">Recommended targets based on your sleep & activity</p>

                    <ProgressBar label="Fiber Intake (est)" current={(todayTotals.carbs * 0.15)} max={user?.targetCalories ? Math.round(user.targetCalories / 100) : 35} color="bg-orange-400" unit="g" />
                    <ProgressBar label="Saturated Fat Limit (est)" current={(todayTotals.fat * 0.3)} max={user?.targetCalories ? Math.round(user.targetCalories * 0.02) : 20} color="bg-teal-400" unit="g" />
                    <ProgressBar label="Daily Recovery Focus" current={Math.min(100, (todayTotals.protein / TARGET_PROTEIN) * 100) || 0} max={100} color="bg-purple-400" unit="%" />

                    <div className="mt-5 border-t border-white/5 pt-4">
                        <p className="text-slate-300 text-sm italic leading-relaxed">
                            <span className="text-[#B8FF3C] not-italic font-black">"</span>
                            {aiMessage.replace(/"/g, '')}
                            <span className="text-[#B8FF3C] not-italic font-black">"</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Weekly Summary */}
            <div className="bg-[#13131A] border border-white/6 rounded-2xl p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <Activity size={15} className="text-[#B8FF3C]" />
                            <h2 className="text-sm font-black text-white">Weekly Summary</h2>
                        </div>
                        <p className="text-sm text-slate-400">
                            AI Insight:{" "}
                            <span className="text-[#B8FF3C] font-bold">{weeklyInsight}</span>
                        </p>
                    </div>
                    <div className="flex gap-6 sm:gap-8 flex-shrink-0">
                        {[
                            { label: "Avg. Calories", value: Math.round(weeklyHistory.reduce((a, b) => a + b.cal, 0) / 7).toLocaleString(), sub: "kcal", color: "text-white" },
                            { label: "Avg. Protein", value: Math.round(weeklyHistory.reduce((a, b) => a + b.pro, 0) / 7) + "g", sub: "daily", color: "text-[#B8FF3C]" },
                            { label: "Current Streak", value: "4", sub: "days", color: "text-white" },
                        ].map(({ label, value, sub, color }) => (
                            <div key={label} className="text-center">
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{label}</div>
                                <div className={`text-xl font-black ${color}`}>{value}</div>
                                <div className="text-[10px] text-slate-500">{sub}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Calorie area chart */}
                <div className="bg-[#13131A] border border-white/6 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-[#B8FF3C] animate-pulse" />
                             <h3 className="text-sm font-black text-white">Calorie Intake</h3>
                        </div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Last 7 Days</span>
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={weeklyHistory} margin={{ top: 10, right: 10, bottom: 0, left: -25 }}>
                            <defs>
                                <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#B8FF3C" stopOpacity={0.3} />
                                    <stop offset="50%" stopColor="#B8FF3C" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#B8FF3C" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                            <XAxis 
                                dataKey="day" 
                                tick={{ fill: "#64748b", fontSize: 10, fontWeight: 700 }} 
                                axisLine={false} 
                                tickLine={false} 
                                dy={10}
                            />
                            <YAxis 
                                tick={{ fill: "#64748b", fontSize: 10 }} 
                                axisLine={false} 
                                tickLine={false} 
                                domain={[0, 'auto']} 
                            />
                            <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(184, 255, 60, 0.15)', strokeWidth: 2 }} />
                            <Area 
                                type="monotone" 
                                dataKey="cal" 
                                stroke="#B8FF3C" 
                                strokeWidth={3} 
                                fill="url(#calGrad)"
                                animationDuration={1800}
                                dot={false}
                                activeDot={{ r: 6, fill: "#B8FF3C", stroke: "#0A0A0F", strokeWidth: 2 }} 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Protein bar chart */}
                <div className="bg-[#13131A] border border-white/6 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                             <h3 className="text-sm font-black text-white">Protein Consistency</h3>
                        </div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Last 7 Days</span>
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={weeklyHistory} margin={{ top: 10, right: 10, bottom: 0, left: -25 }} barCategoryGap="35%">
                            <defs>
                                <linearGradient id="proGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                                </linearGradient>
                                <linearGradient id="proGradLow" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#334155" stopOpacity={0.4} />
                                    <stop offset="100%" stopColor="#1e293b" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                            <XAxis 
                                dataKey="day" 
                                tick={{ fill: "#64748b", fontSize: 10, fontWeight: 700 }} 
                                axisLine={false} 
                                tickLine={false} 
                                dy={10}
                            />
                            <YAxis 
                                tick={{ fill: "#64748b", fontSize: 10 }} 
                                axisLine={false} 
                                tickLine={false} 
                                domain={[0, Math.max(TARGET_PROTEIN + 50, 200)]} 
                            />
                            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                            <ReferenceLine 
                                y={TARGET_PROTEIN} 
                                stroke="#10b981" 
                                strokeDasharray="5 5" 
                                strokeWidth={1}
                                strokeOpacity={0.4}
                                label={{ 
                                    value: `GOAL`, 
                                    fill: "#10b981", 
                                    fontSize: 9, 
                                    fontWeight: 800,
                                    position: "insideTopRight",
                                    offset: 10
                                }} 
                            />
                            <Bar dataKey="pro" animationDuration={1800} radius={[6, 6, 0, 0]}>
                                {weeklyHistory.map((entry, i) => (
                                    <Cell 
                                        key={i} 
                                        fill={entry.pro >= TARGET_PROTEIN ? "url(#proGrad)" : "url(#proGradLow)"}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Today's Meals */}
            <div className="bg-[#13131A] border border-white/6 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-black text-white">Today's Meals & Recipes</h3>
                    <button className="text-xs text-[#B8FF3C] font-bold flex items-center gap-1 hover:text-[#d4ff6e] transition-colors">
                        View All <ArrowRight size={12} />
                    </button>
                </div>

                {todaysMeals.length === 0 ? (
                    <div className="text-center py-6 border-t border-white/5">
                        <p className="text-sm text-slate-500 mb-2">You haven't logged any food today.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {todaysMeals.map((meal, i) => (
                            <div key={i} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
                                <div className={`w-10 h-10 ${meal.bg} rounded-xl flex items-center justify-center text-lg flex-shrink-0`}>
                                    {meal.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-white truncate">{meal.name}</div>
                                    <div className="text-[11px] text-slate-500 mt-0.5">{meal.time} · {meal.meal}</div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <div className="text-sm font-black text-white">{meal.kcal}</div>
                                    <div className="text-[9px] text-slate-500 uppercase tracking-wider">kcal</div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <div className="text-sm font-black text-[#B8FF3C]">{meal.protein}g</div>
                                    <div className="text-[9px] text-slate-500 uppercase tracking-wider">protein</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-4 pt-4 border-t border-white/5 flex gap-3">
                    <button className="flex-1 flex items-center justify-center gap-2 bg-[#0A0A0F] border border-white/10 text-white text-sm font-bold py-3 rounded-xl hover:bg-white/5 transition-colors">
                        <Plus size={15} /> Add Food Log
                    </button>
                </div>
            </div>

        </div>
    );
}