"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

// ── icons (inline SVGs to keep single-file) ──────────────────────────────────
const Icons = {
    Logo: () => (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 2a4 4 0 100 8 4 4 0 000-8z" />
        </svg>
    ),
    Dashboard: () => (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="8" rx="1" />
            <rect x="3" y="13" width="8" height="8" rx="1" /><rect x="13" y="13" width="8" height="8" rx="1" />
        </svg>
    ),
    Clients: () => (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <circle cx="9" cy="7" r="4" /><path d="M2 21v-2a7 7 0 0114 0v2" />
            <circle cx="19" cy="7" r="3" /><path d="M22 21v-2a5 5 0 00-3-4.6" />
        </svg>
    ),
    Programs: () => (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <rect x="3" y="3" width="18" height="4" rx="1" /><rect x="3" y="10" width="18" height="4" rx="1" />
            <rect x="3" y="17" width="11" height="4" rx="1" />
        </svg>
    ),
    Analytics: () => (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M3 21h18M5 21V10l7-7 7 7v11M9 21v-6h6v6" />
        </svg>
    ),
    Messages: () => (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
        </svg>
    ),
    Settings: () => (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
    ),
    Bell: () => (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
        </svg>
    ),
    Search: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
    ),
    Users: () => (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
    ),
    Bolt: () => (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
    ),
    Barbell: () => (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M6.5 6.5h11M6.5 17.5h11M4 9v6M8 7v10M16 7v10M20 9v6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </svg>
    ),
    Trophy: () => (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M6 9H3.5a2.5 2.5 0 010-5H6M18 9h2.5a2.5 2.5 0 000-5H18M8 21h8M12 17v4M17 9A5 5 0 017 9V4h10v5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
    ),
    Clock: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
        </svg>
    ),
    Check: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
            <path d="M20 6L9 17l-5-5" />
        </svg>
    ),
    UserPlus: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
        </svg>
    ),
    Fork: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M12 2a2 2 0 110 4 2 2 0 010-4zM12 6v4M8 8a2 2 0 11-1.73-3A5 5 0 0112 10a5 5 0 015.73-5A2 2 0 1118 8M8 8v6a4 4 0 008 0V8" />
        </svg>
    ),
    Dumbbell: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M6.5 6.5h11M6.5 17.5h11M4 9v6M8 7v10M16 7v10M20 9v6" strokeLinecap="round" />
        </svg>
    ),
    Target: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
        </svg>
    ),
    Msg: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
        </svg>
    ),
    Menu: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
            <path d="M3 12h18M3 6h18M3 18h18" />
        </svg>
    ),
    X: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
            <path d="M18 6L6 18M6 6l12 12" />
        </svg>
    ),
};

const checkIns = [
    { name: "Liam Wilson", time: "Submitted 2h ago" },
    { name: "Emma Watson", time: "Submitted 5h ago" },
];

const topPrograms = [
    { name: "Summer Shred 2.0", users: 45 },
    { name: "Foundational Strength", users: 22 },
];

// ── Avatar placeholder ────────────────────────────────────────────────────────
function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
    const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2);
    const sizes = { sm: "w-7 h-7 text-xs", md: "w-9 h-9 text-sm", lg: "w-10 h-10 text-sm" };
    const hues = [220, 250, 200, 270, 180];
    const hue = hues[name.charCodeAt(0) % hues.length];
    return (
        <div
            className={`${sizes[size]} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}
            style={{ background: `hsl(${hue},40%,38%)` }}
        >
            {initials}
        </div>
    );
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function Bar({ value, color }: { value: number; color: string }) {
    return (
        <div className="flex items-center gap-2 min-w-[80px]">
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
            </div>
            <span className="text-xs text-white/60 w-8 text-right">{value}%</span>
        </div>
    );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, change, Icon, positive }: { 
    label: string, value: string | number, change: string | null, Icon: any, positive: boolean | null 
}) {
    return (
        <div className="bg-[#1A2210] border border-white/5 rounded-2xl p-4 flex flex-col gap-3 hover:border-[#B5FF4D]/20 transition-colors">
            <div className="flex items-start justify-between">
                <p className="text-xs text-white/40 uppercase tracking-widest font-medium">{label}</p>
                <div className="w-9 h-9 rounded-xl bg-[#B5FF4D]/10 flex items-center justify-center text-[#B5FF4D]">
                    <Icon />
                </div>
            </div>
            <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-white tracking-tight">{value}</span>
                <span className={`text-xs font-semibold pb-1 ${positive === true ? "text-[#B5FF4D]" : positive === false ? "text-red-400" : "text-white/40"}`}>
                    {change}
                </span>
            </div>
        </div>
    );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function CoachDashboard() {
    const { data: session } = useSession();
    const [clients, setClients] = useState<any[]>([]);
    const [feed, setFeed] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [inviting, setInviting] = useState(false);
    
    const [selectedClient, setSelectedClient] = useState<any | null>(null);
    const [clientLogs, setClientLogs] = useState<any[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    const fetchData = async () => {
        if (!session?.user?.id) return;
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            
            // Fetch stats
            const statsRes = await fetch(`${apiBase}/api/coach/stats/${session.user.id}`);
            const statsData = await statsRes.json();
            if (statsData.success) setStats(statsData.data);

            // Fetch clients
            const clientsRes = await fetch(`${apiBase}/api/coach/clients/${session.user.id}`);
            const clientsData = await clientsRes.json();
            if (clientsData.success) setClients(clientsData.data);

            // Fetch requests
            const requestsRes = await fetch(`${apiBase}/api/coach/requests/${session.user.id}`);
            const requestsData = await requestsRes.json();
            if (requestsData.success) setRequests(requestsData.data);

            // Fetch activities
            const activitiesRes = await fetch(`${apiBase}/api/coach/activities/${session.user.id}`);
            const activitiesData = await activitiesRes.json();
            if (activitiesData.success) setFeed(activitiesData.data.map((act: any) => ({
                user: act.user,
                action: act.action,
                time: new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                note: act.note,
                Icon: act.type === 'meal_log' ? Icons.Fork : act.type === 'workout_complete' ? Icons.Dumbbell : Icons.Bolt,
                color: act.type === 'meal_log' ? "bg-[#B5FF4D]/20 text-[#B5FF4D]" : "bg-blue-500/20 text-blue-400"
            })));

        } catch (error) {
            console.error("Coach dashboard fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchClientLogs = async (clientId: string) => {
        setLoadingLogs(true);
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const res = await fetch(`${apiBase}/api/coach/client-logs/${clientId}`);
            const json = await res.json();
            if (json.success) setClientLogs(json.data);
        } catch (error) {
            console.error("Failed to fetch client logs", error);
        } finally {
            setLoadingLogs(false);
        }
    };

    const handleClientClick = (client: any) => {
        setSelectedClient(client);
        fetchClientLogs(client.id); // Assuming c.id is memberId or similar
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, [session]);

    const handleAccept = async (requestId: string) => {
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const res = await fetch(`${apiBase}/api/coach/accept`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ relationshipId: requestId })
            });
            if (res.ok) {
                fetchData(); // Refresh all data
            }
        } catch (error) {
            console.error("Failed to accept request", error);
        }
    };

    const handleInvite = async () => {
        const email = prompt("Enter client's email to invite:");
        if (!email) return;

        setInviting(true);
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const res = await fetch(`${apiBase}/api/coach/invite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    coachId: session?.user?.id,
                    email 
                })
            });
            if (res.ok) {
                alert("Invite sent!");
                fetchData();
            }
        } catch (error) {
            console.error("Invite error", error);
        } finally {
            setInviting(false);
        }
    };

    const displayStats = [
        { label: "Total Clients", value: stats?.totalClients || 0, change: "+0%", Icon: Icons.Users, positive: true },
        { label: "Active", value: stats?.activeUsers || 0, change: "+0%", Icon: Icons.Bolt, positive: true },
        { label: "Programs", value: stats?.programs || 0, change: "Stable", Icon: Icons.Barbell, positive: null },
        { label: "Goal Success", value: stats?.successRate || "0%", change: "+0%", Icon: Icons.Trophy, positive: true },
    ];

    if (loading) return <div className="flex items-center justify-center min-h-[400px] text-white/50">Loading coach dashboard...</div>;

    return (
        <div className="space-y-5 animate-fade-in">
            {/* Stat cards */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                {displayStats.map((c) => <StatCard key={c.label} {...c} />)}
            </div>

            {/* Middle row: Client Overview + Activity Feed */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
                {/* Client Overview */}
                <div className="bg-[#1A2210] border border-white/5 rounded-2xl p-4 sm:p-5">
                    <div className="flex items-start justify-between mb-4 gap-3">
                        <div>
                            <h2 className="font-bold text-white text-base">Client Overview</h2>
                            <p className="text-xs text-white/40 mt-0.5">Monitor daily progress and engagement</p>
                        </div>
                        <button 
                            onClick={handleInvite}
                            disabled={inviting}
                            className="flex-shrink-0 flex items-center gap-2 bg-[#B5FF4D] hover:bg-[#c8ff6e] text-[#0F1A06] font-bold text-xs px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                        >
                            <Icons.UserPlus />
                            <span>{inviting ? 'Inviting...' : 'Invite'}</span>
                        </button>
                    </div>

                    {/* Table header */}
                    <div className="hidden sm:grid grid-cols-[1fr_100px_140px_100px] gap-2 px-2 mb-2">
                        {["CLIENT", "STATUS", "PROGRAM", "COMPLIANCE"].map((h) => (
                            <span key={h} className="text-[10px] text-white/30 uppercase tracking-widest font-medium">{h}</span>
                        ))}
                    </div>

                    <div className="space-y-2">
                        {clients.map((c) => (
                            <div
                                key={c.id}
                                onClick={() => handleClientClick(c)}
                                className="grid grid-cols-1 sm:grid-cols-[1fr_100px_140px_100px] gap-2 items-center bg-white/3 hover:bg-white/6 rounded-xl px-2 py-3 transition-colors cursor-pointer"
                            >
                                <div className="flex items-center gap-2.5">
                                    <Avatar name={c.name} size="md" />
                                    <span className="font-semibold text-sm text-white">{c.name}</span>
                                </div>
                                <div>
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${c.status === 'Active' ? 'text-[#B5FF4D] bg-[#B5FF4D]/10 border-[#B5FF4D]/30' : 'text-amber-400 bg-amber-400/10 border-amber-400/30'}`}>
                                        {c.status}
                                    </span>
                                </div>
                                <span className="text-sm text-white/60 hidden sm:block">{c.program}</span>
                                <div className="sm:block">
                                    <Bar value={c.compliance} color={c.compliance > 80 ? "bg-[#B5FF4D]" : "bg-amber-400"} />
                                </div>
                            </div>
                        ))}
                        {clients.length === 0 && (
                            <div className="text-center py-10 text-white/20 text-sm">No clients connected yet.</div>
                        )}
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="bg-[#1A2210] border border-white/5 rounded-2xl p-4 sm:p-5 flex flex-col">
                    <div className="flex flex-col flex-1">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-7 h-7 rounded-lg bg-[#B5FF4D]/10 flex items-center justify-center text-[#B5FF4D] flex-shrink-0">
                                <Icons.Clock />
                            </div>
                            <h2 className="font-bold text-white text-base">Activity Feed</h2>
                        </div>

                        <div className="space-y-4">
                            {feed.map((item, i) => (
                                <div key={i} className="flex gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${item.color}`}>
                                        <item.Icon />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm text-white/80 leading-snug">
                                            <span className="font-semibold text-white">{item.user}</span>{" "}
                                            {item.action}
                                        </p>
                                        <p className="text-[11px] text-[#B5FF4D]/60 mt-0.5">{item.time}</p>
                                        {item.note && (
                                            <p className="mt-1.5 text-xs text-white/40 bg-white/5 rounded-lg px-3 py-2 border border-white/5 italic">
                                                {item.note}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {feed.length === 0 && (
                                <div className="text-center py-10 text-white/20 text-sm">No recent activity.</div>
                            )}
                        </div>
                    </div>

                    <button className="mt-4 w-full text-center text-xs text-white/30 hover:text-[#B5FF4D] transition-colors pt-3 border-t border-white/5">
                        View All Activity
                    </button>
                </div>
            </div>

            {/* Bottom row: Check-ins + Top Programs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Check-in Requests */}
                <div className="bg-[#1A2210] border border-white/5 rounded-2xl p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-7 h-7 rounded-lg bg-[#B5FF4D]/10 flex items-center justify-center text-[#B5FF4D]">
                            <Icons.Check />
                        </div>
                        <h2 className="font-bold text-white text-base">Client Requests</h2>
                    </div>
                    <div className="space-y-3">
                        {requests.map((r) => (
                            <div key={r.id} className="flex items-center gap-3 bg-white/3 rounded-xl px-3 py-3">
                                <Avatar name={r.name} size="md" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-white truncate">{r.name}</p>
                                    <p className="text-[11px] text-white/40">{r.time}</p>
                                </div>
                                <button 
                                    onClick={() => handleAccept(r.id)}
                                    className="text-[10px] font-bold bg-[#B5FF4D] text-[#0F1A06] px-3 py-1.5 rounded-lg hover:bg-[#c8ff6e] transition-colors flex-shrink-0"
                                >
                                    ACCEPT
                                </button>
                            </div>
                        ))}
                        {requests.length === 0 && (
                            <div className="text-center py-10 text-white/20 text-sm">No pending requests.</div>
                        )}
                    </div>
                </div>

                {/* Top Programs */}
                <div className="bg-[#1A2210] border border-white/5 rounded-2xl p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-7 h-7 rounded-lg bg-[#B5FF4D]/10 flex items-center justify-center text-[#B5FF4D]">
                            <Icons.Bolt />
                        </div>
                        <h2 className="font-bold text-white text-base">Top Programs</h2>
                    </div>
                    <div className="space-y-4">
                        {topPrograms.map((p, i) => (
                            <div key={p.name}>
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-bold text-white/30 w-5">{String(i + 1).padStart(2, "0")}</span>
                                        <span className="text-sm font-bold text-white">{p.name}</span>
                                    </div>
                                    <span className="text-xs text-white/40">{p.users} users</span>
                                </div>
                                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden ml-7">
                                    <div
                                        className="h-full bg-[#B5FF4D] rounded-full transition-all"
                                        style={{ width: `${(p.users / 50) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Client Logs Modal */}
            {selectedClient && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-[#0D0D12] border border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Avatar name={selectedClient.name} size="lg" />
                                <div>
                                    <h2 className="text-xl font-black text-white">{selectedClient.name}</h2>
                                    <p className="text-sm text-white/40">{selectedClient.program}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedClient(null)}
                                className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white/40 hover:text-white"
                            >
                                <Icons.X />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 scrollbar-none">
                            <h3 className="text-sm font-black text-[#B5FF4D] uppercase tracking-widest mb-4">Recent Meal Logs</h3>
                            {loadingLogs ? (
                                <div className="py-20 text-center text-white/20 text-sm">Loading logs...</div>
                            ) : clientLogs.length === 0 ? (
                                <div className="text-center py-20 text-white/20 text-sm">No meal logs found for this client.</div>
                            ) : (
                                <div className="space-y-6">
                                    {clientLogs.map((log: any, i: number) => (
                                        <div key={log._id || i} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex gap-4">
                                                    {log.imageUrl ? (
                                                        <img src={log.imageUrl} alt={log.food_name || log.foodName} className="w-14 h-14 rounded-xl object-cover" />
                                                    ) : (
                                                        <div className="w-14 h-14 bg-white/5 rounded-xl flex items-center justify-center text-slate-500">
                                                            <Icons.Fork />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-black text-white text-lg">{log.food_name || log.foodName}</p>
                                                        <p className="text-[10px] text-white/30 uppercase tracking-widest">{new Date(log.createdAt || log.date).toLocaleDateString()} · {log.mealType || 'Meal'}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xl font-black text-[#B5FF4D]">{Math.round(log.total_calories || log.nutrition?.calories || 0)} <span className="text-xs text-white/30 uppercase">kcal</span></p>
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="bg-white/3 rounded-xl p-3 border border-white/5">
                                                    <p className="text-[9px] text-white/30 uppercase font-black mb-1">Protein</p>
                                                    <p className="text-sm font-black text-white">{Math.round(log.total_protein || log.nutrition?.protein || 0)}g</p>
                                                </div>
                                                <div className="bg-white/3 rounded-xl p-3 border border-white/5">
                                                    <p className="text-[9px] text-white/30 uppercase font-black mb-1">Carbs</p>
                                                    <p className="text-sm font-black text-white">{Math.round(log.total_carbs || log.nutrition?.carbs || 0)}g</p>
                                                </div>
                                                <div className="bg-white/3 rounded-xl p-3 border border-white/5">
                                                    <p className="text-[9px] text-white/30 uppercase font-black mb-1">Fat</p>
                                                    <p className="text-sm font-black text-white">{Math.round(log.total_fat || log.nutrition?.fat || 0)}g</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}