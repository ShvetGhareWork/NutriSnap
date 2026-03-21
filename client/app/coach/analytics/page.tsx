"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
    Users, 
    TrendingUp, 
    BookOpen, 
    MessageSquare, 
    Download, 
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    AlertCircle,
    CheckCircle2,
    Activity
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface StatMetric {
    label: string;
    value: string;
    delta: string;
    positive: boolean;
    static?: boolean;
    icon: any;
    color: string;
    bars: number[];
}

interface Performer {
    name: string;
    score: number;
    initials: string;
    color: string;
}

interface ClientRow {
    id: string;
    name: string;
    initials: string;
    program: string;
    status: string;
    adherence: number;
    trend: "up" | "flat" | "down";
    color: string;
}

// ── Components ──────────────────────────────────────────────────────────────

function MiniSparkline({ bars, color }: { bars: number[]; color: string }) {
    const max = Math.max(...bars) || 1;
    return (
        <div className="flex items-end gap-1 h-10 w-24">
            {bars.map((v, i) => (
                <div
                    key={i}
                    className="flex-1 rounded-sm"
                    style={{ 
                        height: `${(v / max) * 100}%`, 
                        backgroundColor: color,
                        opacity: 0.3 + (i / bars.length) * 0.7 
                    }}
                />
            ))}
        </div>
    );
}

function StatCard({ stat }: { stat: StatMetric }) {
    return (
        <div className="bg-[#13131A] border border-white/5 rounded-3xl p-6 hover:border-white/10 transition-all group">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-2xl bg-white/5 text-white/40 group-hover:text-white transition-colors`}>
                    <stat.icon size={20} />
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg ${stat.static ? "bg-white/5 text-white/40" : stat.positive ? "bg-[#10b981]/15 text-[#10b981]" : "bg-red-500/15 text-red-400"}`}>
                    {stat.static ? "" : stat.positive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                    {stat.delta}
                </div>
            </div>
            <div className="flex items-end justify-between">
                <div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                    <p className="text-3xl font-black text-white tracking-tight">{stat.value}</p>
                </div>
                <MiniSparkline bars={stat.bars} color={stat.color} />
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
    const { data: session } = useSession();
    const [stats, setStats] = useState<any>(null);
    const [clients, setClients] = useState<ClientRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [chartMode, setChartMode] = useState<"Calories" | "Protein">("Calories");

    useEffect(() => {
        if (!session?.user?.id) return;

        const fetchData = async () => {
            try {
                const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
                const [sRes, cRes] = await Promise.all([
                    fetch(`${apiBase}/api/coach/stats/${session.user.id}`),
                    fetch(`${apiBase}/api/coach/clients/${session.user.id}`)
                ]);

                const sData = await sRes.json();
                const cData = await cRes.json();

                if (sData.success) setStats(sData.data);
                if (cData.success) {
                    setClients(cData.data.map((c: any) => ({
                        id: c.id,
                        name: c.name,
                        initials: c.initials,
                        program: c.program || "Custom Routine",
                        status: c.status,
                        adherence: c.adherenceScore || 85,
                        trend: c.adherenceScore > 80 ? "up" : "down",
                        color: c.avatarColor || "#10b981"
                    })));
                }
            } catch (error) {
                console.error("Failed to fetch analytics", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [session]);

    if (isLoading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-[#10b981]/10 border-t-[#10b981] rounded-full animate-spin" />
                <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Calculating Insights...</p>
            </div>
        );
    }

    const metrics: StatMetric[] = [
        { 
            label: "Total Clients", 
            value: stats?.totalClients?.toString() || "0", 
            delta: "+5%", 
            positive: true, 
            icon: Users,
            color: "#10b981",
            bars: [4, 6, 5, 8, 7, 9, 10]
        },
        { 
            label: "Avg Adherence", 
            value: stats?.adherence || "0%", 
            delta: "-2%", 
            positive: false, 
            icon: TrendingUp,
            color: "#f59e0b",
            bars: [9, 8, 7, 9, 8, 7, 8]
        },
        { 
            label: "Active Programs", 
            value: stats?.programs?.toString() || "0", 
            delta: "Static", 
            positive: true, 
            static: true,
            icon: BookOpen,
            color: "#8b5cf6",
            bars: [3, 3, 4, 3, 4, 4, 4]
        },
        { 
            label: "Engagements", 
            value: stats?.messages?.toLocaleString() || "0", 
            delta: "+18%", 
            positive: true, 
            icon: MessageSquare,
            color: "#3b82f6",
            bars: [2, 5, 4, 7, 6, 9, 8]
        }
    ];

    return (
        <div className="space-y-8 pb-10">
            {/* Header / Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">System Performance</h2>
                    <p className="text-white/40 text-sm mt-1">Real-time aggregate data across your entire client roster.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 text-white/70 hover:text-white px-4 py-2.5 rounded-2xl transition-all text-xs font-black uppercase tracking-wider">
                        <Calendar size={14} className="text-[#10b981]" />
                        Last 30 Days
                    </button>
                    <button className="flex items-center gap-2 bg-[#10b981] hover:bg-[#10b981]/90 text-[#090e03] px-5 py-2.5 rounded-2xl transition-all text-xs font-black shadow-lg shadow-[#10b981]/20">
                        <Download size={14} />
                        EXPORT PDF
                    </button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {metrics.map((m) => <StatCard key={m.label} stat={m} />)}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* At Risk Section */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xs font-black text-white/50 uppercase tracking-[0.2em] flex items-center gap-2">
                            <AlertCircle size={14} className="text-red-400" />
                            At Risk Clients
                        </h3>
                        <span className="text-[10px] font-black text-red-400 bg-red-400/10 px-2 py-0.5 rounded-lg">High Priority</span>
                    </div>
                    
                    <div className="space-y-3">
                        {clients.filter(c => c.adherence < 85).slice(0, 3).map(c => (
                            <div key={c.id} className="bg-[#13131A] border border-white/5 rounded-3xl p-5 hover:border-red-400/20 transition-all">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black" style={{ backgroundColor: `${c.color}20`, color: c.color }}>
                                        {c.initials}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black text-white truncate">{c.name}</p>
                                        <p className="text-[10px] text-red-400 font-bold mt-0.5">Low Adherence ({c.adherence}%)</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <button className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-[10px] font-black uppercase tracking-wider transition-all">Nudge</button>
                                    <button className="flex-1 py-2 rounded-xl bg-red-400/10 hover:bg-red-400/20 text-red-400 text-[10px] font-black uppercase tracking-wider transition-all">Intervene</button>
                                </div>
                            </div>
                        ))}
                        {clients.filter(c => c.adherence < 85).length === 0 && (
                            <div className="bg-[#13131A] border border-white/5 border-dashed rounded-3xl p-10 text-center">
                                <CheckCircle2 size={32} className="text-[#10b981] mx-auto mb-3 opacity-30" />
                                <p className="text-white/30 text-xs font-bold">All clients are thriving.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Progress Table */}
                <div className="lg:col-span-2 bg-[#13131A] border border-white/5 rounded-[2.5rem] overflow-hidden">
                    <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <Activity className="text-[#10b981]" size={18} />
                            <h3 className="text-lg font-black text-white tracking-tight">Active Rosters</h3>
                        </div>
                        <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                            <button className="px-3 py-1.5 rounded-lg text-[10px] font-black bg-[#10b981] text-[#090e03]">ACTIVE</button>
                            <button className="px-3 py-1.5 rounded-lg text-[10px] font-black text-white/40 hover:text-white">WATCHLIST</button>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/[0.02] border-b border-white/5">
                                <tr>
                                    <th className="px-8 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Client</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Program</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Adherence</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Trend</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {clients.slice(0, 5).map(c => (
                                    <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black" style={{ backgroundColor: `${c.color}15`, color: c.color }}>
                                                    {c.initials}
                                                </div>
                                                <span className="text-sm font-black text-white group-hover:text-[#10b981] transition-colors">{c.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs text-white/40 font-bold">{c.program}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-1.5 w-16 bg-white/5 rounded-full overflow-hidden">
                                                    <div className="h-full bg-[#10b981]" style={{ width: `${c.adherence}%` }} />
                                                </div>
                                                <span className="text-[10px] font-black text-white">{c.adherence}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`flex items-center gap-1 font-black text-xs ${c.trend === "up" ? "text-[#10b981]" : "text-red-400"}`}>
                                                {c.trend === "up" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                                {c.trend.toUpperCase()}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {clients.length > 5 && (
                        <div className="p-4 text-center border-t border-white/5">
                            <button className="text-[10px] font-black text-white/20 hover:text-[#10b981] transition-all uppercase tracking-widest leading-none">View Full Report</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}