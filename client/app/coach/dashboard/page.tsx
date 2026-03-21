"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Users, Zap, Trophy, Clock, Check, UserPlus, Utensils, Dumbbell, Target, MessageSquare, Menu, X, Info, Search, Star, Calendar } from "lucide-react";

// ── Icons mapping ───────────────────────────────────────────────────────────
const Icons = {
    Users, Zap, Trophy, Clock, Check, UserPlus, Utensils, Dumbbell, Target, Msg: MessageSquare, Menu, X, Info, Search, Star
};

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
                    <Icon size={18} />
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

// ── Member Profile Modal ───────────────────────────────────────────────────────
function MemberProfileModal({ member, onClose, onAccept }: {
    member: any;
    onClose: () => void;
    onAccept: (id: string) => void;
}) {
    if (!member || !member.profile) return null;
    const { profile } = member;
    const fullName = `${profile.firstName} ${profile.lastName}`;

    const calculateAge = (dob: string) => {
        const diff = Date.now() - new Date(dob).getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-[#0F1A06] border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col max-h-[90vh] shadow-2xl animate-in zoom-in duration-300">
                <div className="p-8 overflow-y-auto custom-scrollbar">
                    <div className="flex items-center gap-6 mb-8 pb-8 border-b border-white/5">
                        <Avatar name={fullName} size="lg" />
                        <div>
                            <h2 className="text-2xl font-black text-white leading-tight">{fullName}</h2>
                            <p className="text-[#B5FF4D] text-xs font-black uppercase tracking-widest">{profile.goal}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                            <p className="text-[10px] text-white/30 uppercase font-black mb-1">Physical</p>
                            <p className="text-sm font-bold text-white">{profile.heightCm}cm · {profile.weightKg}kg</p>
                        </div>
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                            <p className="text-[10px] text-white/30 uppercase font-black mb-1">Personal</p>
                            <p className="text-sm font-bold text-white">{calculateAge(profile.dob)}Y · {profile.gender}</p>
                        </div>
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                            <p className="text-[10px] text-white/30 uppercase font-black mb-1">Experience</p>
                            <p className="text-sm font-bold text-white">{profile.experience}</p>
                        </div>
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                            <p className="text-[10px] text-white/30 uppercase font-black mb-1">Activity</p>
                            <p className="text-sm font-bold text-white">{profile.activityLevel}</p>
                        </div>
                    </div>

                    <div className="bg-black/20 border border-white/5 rounded-2xl p-5 mb-8">
                        <h4 className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-4">Nutritional Focus</h4>
                        <div className="grid grid-cols-4 gap-2 text-center">
                            <div><p className="text-[#B5FF4D] text-sm font-black">{profile.targetCalories}</p><p className="text-[8px] text-white/30 font-bold uppercase">Kcal</p></div>
                            <div><p className="text-white text-sm font-black">{profile.targetProtein}g</p><p className="text-[8px] text-white/30 font-bold uppercase">Pro</p></div>
                            <div><p className="text-white text-sm font-black">{profile.targetCarbs}g</p><p className="text-[8px] text-white/30 font-bold uppercase">Carb</p></div>
                            <div><p className="text-white text-sm font-black">{profile.targetFat}g</p><p className="text-[8px] text-white/30 font-bold uppercase">Fat</p></div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button onClick={() => { onAccept(member.id); onClose(); }} className="w-full bg-[#B5FF4D] text-[#0F1A06] font-black text-sm py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all">ACCEPT CLIENT</button>
                        <button onClick={onClose} className="w-full bg-white/5 text-white/60 font-black text-xs py-3 rounded-xl hover:text-white transition-colors">CLOSE PROFILE</button>
                    </div>
                </div>
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
    const [viewMember, setViewMember] = useState<any | null>(null);
    const [clientLogs, setClientLogs] = useState<any[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    const fetchData = async () => {
        if (!session?.user?.id) return;
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const statsRes = await fetch(`${apiBase}/api/coach/stats/${session.user.id}`);
            const statsData = await statsRes.json();
            if (statsData.success) setStats(statsData.data);

            const clientsRes = await fetch(`${apiBase}/api/coach/clients/${session.user.id}`);
            const clientsData = await clientsRes.json();
            if (clientsData.success) setClients(clientsData.data);

            const requestsRes = await fetch(`${apiBase}/api/coach/requests/${session.user.id}`);
            const requestsData = await requestsRes.json();
            if (requestsData.success) setRequests(requestsData.data);

            const activitiesRes = await fetch(`${apiBase}/api/coach/activities/${session.user.id}`);
            const activitiesData = await activitiesRes.json();
            if (activitiesData.success) setFeed(activitiesData.data.map((act: any) => ({
                user: act.user,
                action: act.action,
                time: new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                note: act.note,
                Icon: act.type === 'meal_log' ? Icons.Utensils : act.type === 'workout_complete' ? Icons.Dumbbell : Icons.Zap,
                color: act.type === 'meal_log' ? "bg-[#B5FF4D]/20 text-[#B5FF4D]" : "bg-blue-500/20 text-blue-400"
            })));
        } catch (error) {
            console.error("Dashboard fetch error:", error);
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
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingLogs(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
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
            if (res.ok) fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleInvite = async () => {
        const email = prompt("Enter client's email:");
        if (!email) return;
        setInviting(true);
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const res = await fetch(`${apiBase}/api/coach/invite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ coachId: session?.user?.id, email })
            });
            if (res.ok) alert("Invite sent!");
        } finally {
            setInviting(false);
            fetchData();
        }
    };

    const displayStats = [
        { label: "Total Clients", value: stats?.totalClients || 0, change: "+0%", Icon: Icons.Users, positive: true },
        { label: "Active", value: stats?.activeUsers || 0, change: "+0%", Icon: Icons.Zap, positive: true },
        { label: "Programs", value: stats?.programs || 0, change: "Stable", Icon: Icons.Dumbbell, positive: null },
        { label: "Goal Success", value: stats?.successRate || "0%", change: "+0%", Icon: Icons.Trophy, positive: true },
    ];

    if (loading) return <div className="flex items-center justify-center min-h-[400px] text-white/50">Loading coach dashboard...</div>;

    return (
        <div className="space-y-5 animate-fade-in">
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {displayStats.map((c) => <StatCard key={c.label} {...c} />)}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
                <div className="bg-[#1A2210] border border-white/5 rounded-2xl p-5">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h2 className="font-bold text-white text-base">Client Overview</h2>
                            <p className="text-xs text-white/40 mt-0.5">Monitor engagement</p>
                        </div>
                        <button onClick={handleInvite} disabled={inviting} className="bg-[#B5FF4D] text-[#0F1A06] font-bold text-xs px-4 py-2 rounded-xl disabled:opacity-50 flex items-center gap-2">
                            <Icons.UserPlus size={14} /> {inviting ? 'Inviting...' : 'Invite'}
                        </button>
                    </div>

                    <div className="hidden sm:grid grid-cols-[1fr_100px_140px_100px] gap-2 px-2 mb-2 text-[10px] text-white/30 uppercase tracking-widest font-medium">
                        <span>CLIENT</span><span>STATUS</span><span>PROGRAM</span><span>COMPLIANCE</span>
                    </div>

                    <div className="space-y-2">
                        {clients.map((c) => (
                            <div key={c.id} onClick={() => { setSelectedClient(c); fetchClientLogs(c.id); }} className="grid grid-cols-1 sm:grid-cols-[1fr_100px_140px_100px] gap-2 items-center bg-white/3 hover:bg-white/6 rounded-xl px-2 py-3 transition-colors cursor-pointer">
                                <div className="flex items-center gap-2.5"><Avatar name={c.name} /><span className="font-semibold text-sm text-white">{c.name}</span></div>
                                <span className={`text-[10px] font-black px-2 py-1 rounded-full text-center border ${c.status === 'Active' ? 'text-[#B5FF4D] border-[#B5FF4D]/30' : 'text-amber-400 border-amber-400/30'}`}>{c.status}</span>
                                <span className="text-sm text-white/60 hidden sm:block">{c.program}</span>
                                <Bar value={c.compliance} color={c.compliance > 80 ? "bg-[#B5FF4D]" : "bg-amber-400"} />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-[#1A2210] border border-white/5 rounded-2xl p-5 flex flex-col">
                    <div className="flex items-center gap-2 mb-4 text-white">
                        <Icons.Clock size={16} className="text-[#B5FF4D]" />
                        <h2 className="font-bold text-base">Activity Feed</h2>
                    </div>
                    <div className="space-y-4">
                        {feed.map((item, i) => (
                            <div key={i} className="flex gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${item.color}`}><item.Icon size={14} /></div>
                                <div className="min-w-0">
                                    <p className="text-sm text-white/80"><span className="font-bold text-white">{item.user}</span> {item.action}</p>
                                    <p className="text-[10px] text-white/40">{item.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#1A2210] border border-white/5 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-4 text-white">
                        <Icons.Check size={16} className="text-[#B5FF4D]" />
                        <h2 className="font-bold text-base">Pending Requests</h2>
                    </div>
                    <div className="space-y-3">
                        {requests.map((r) => (
                            <div key={r.id} className="flex items-center gap-3 bg-white/3 hover:bg-white/5 rounded-xl px-3 py-3 transition-all">
                                <Avatar name={r.name} />
                                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setViewMember(r)}>
                                    <p className="text-sm font-bold text-white hover:text-[#B5FF4D]">{r.name}</p>
                                    <p className="text-[10px] text-white/30">{r.time}</p>
                                </div>
                                <button onClick={() => handleAccept(r.id)} className="text-[10px] font-black bg-[#B5FF4D] text-[#0F1A06] px-3 py-1.5 rounded-lg active:scale-95">ACCEPT</button>
                            </div>
                        ))}
                        {!requests.length && <p className="text-center py-5 text-white/20 text-xs">No pending requests</p>}
                    </div>
                </div>
            </div>

            {selectedClient && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-[#0D0D12] border border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between text-white">
                            <div className="flex items-center gap-4"><Avatar name={selectedClient.name} size="lg" /><div><h2 className="text-xl font-black">{selectedClient.name}</h2><p className="text-xs text-white/40">{selectedClient.program}</p></div></div>
                            <button onClick={() => setSelectedClient(null)} className="p-2 bg-white/5 rounded-full hover:bg-white/10"><Icons.X size={20} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 scrollbar-none space-y-4 text-white">
                            <h3 className="text-[10px] font-black text-[#B5FF4D] uppercase tracking-[0.2em]">Recent Activity Logs</h3>
                            {loadingLogs ? <p className="text-center py-10 text-white/20">Loading...</p> :
                                clientLogs.length ? clientLogs.map((log: any, i: number) => (
                                    <div key={i} className="bg-white/5 border border-white/5 rounded-2xl p-4">
                                        <div className="flex justify-between items-center mb-3">
                                            <p className="font-bold">{log.food_name || log.foodName}</p>
                                            <span className="text-[#B5FF4D] font-black">{Math.round(log.total_calories || log.nutrition?.calories || 0)} kcal</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-white/40">
                                            <div className="bg-black/20 p-2 rounded-lg text-center">P: {Math.round(log.total_protein || 0)}g</div>
                                            <div className="bg-black/20 p-2 rounded-lg text-center">C: {Math.round(log.total_carbs || 0)}g</div>
                                            <div className="bg-black/20 p-2 rounded-lg text-center">F: {Math.round(log.total_fat || 0)}g</div>
                                        </div>
                                    </div>
                                )) : <p className="text-center py-10 text-white/20">No logs found</p>}
                        </div>
                    </div>
                </div>
            )}

            {viewMember && <MemberProfileModal member={viewMember} onClose={() => setViewMember(null)} onAccept={handleAccept} />}
        </div>
    );
}