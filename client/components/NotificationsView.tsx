"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Bell, Check, Clock, Dumbbell, MessageSquare, Trash2, CheckCircle2 } from "lucide-react";

export default function NotificationsView({ role }: { role: "member" | "coach" }) {
    const { data: session } = useSession();
    const router = useRouter();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        if (!session?.user?.id) return;
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const res = await fetch(`${apiBase}/api/user/notifications/${session.user.id}`);
            const json = await res.json();
            if (json.success) setNotifications(json.data);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [session]);

    const markAsRead = async (id: string) => {
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            await fetch(`${apiBase}/api/user/notifications/${id}/read`, { method: 'PUT' });
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    const deleteNotification = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            await fetch(`${apiBase}/api/user/notifications/${id}`, { method: 'DELETE' });
            setNotifications(prev => prev.filter(n => n._id !== id));
        } catch (error) {
            console.error("Failed to delete notification", error);
        }
    };

    const clearAll = async () => {
        if (!session?.user?.id) return;
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            await fetch(`${apiBase}/api/user/notifications/${session.user.id}/clear`, { method: 'DELETE' });
            setNotifications([]);
        } catch (error) {
            console.error("Failed to clear notifications", error);
        }
    };

    const handleNotificationClick = (n: any) => {
        if (!n.read) markAsRead(n._id);
        if (n.type === 'program_assignment') router.push('/coach-protocol');
        if (n.type === 'message' && n.metadata?.chatId) {
            if (role === 'coach') {
                router.push(`/coach/messages?memberId=${n.metadata.senderId}`);
            } else {
                router.push(`/messages?chatId=${n.metadata.chatId}`);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B8FF3C]"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white italic tracking-tight">Notifications Center</h1>
                    <p className="text-sm font-medium text-slate-400 mt-1">Manage all your alerts and requests.</p>
                </div>
                {notifications.length > 0 && (
                    <button 
                        onClick={clearAll}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest transition-colors"
                    >
                        <Trash2 size={14} /> Clear All
                    </button>
                )}
            </div>

            {notifications.length === 0 ? (
                <div className="bg-[#13131A] border border-white/5 rounded-[2rem] p-16 text-center shadow-xl">
                    <div className="w-20 h-20 bg-white/5 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 text-slate-500">
                        <Bell size={32} />
                    </div>
                    <h3 className="text-xl font-black text-white mb-2">You're all caught up!</h3>
                    <p className="text-slate-400 font-medium">No new notifications to show right now.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map((n) => (
                        <div 
                            key={n._id} 
                            onClick={() => handleNotificationClick(n)}
                            className={`flex flex-col sm:flex-row gap-4 p-5 sm:p-6 rounded-2xl border transition-all cursor-pointer group hover:-translate-y-1 shadow-lg ${
                                !n.read 
                                ? "bg-[#B8FF3C]/5 border-[#B8FF3C]/20" 
                                : "bg-[#13131A] border-white/5 hover:border-white/10"
                            }`}
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                n.type === 'acceptance' ? 'bg-[#B8FF3C]/20 text-[#B8FF3C]' : 
                                n.type === 'program_assignment' ? 'bg-purple-500/20 text-purple-400' : 
                                n.type === 'request' ? 'bg-blue-500/20 text-blue-400' : 
                                'bg-white/10 text-slate-300'
                            }`}>
                                {n.type === 'acceptance' ? <Check size={20} /> : 
                                 n.type === 'program_assignment' ? <Dumbbell size={20} /> :
                                 n.type === 'message' ? <MessageSquare size={20} /> :
                                 <Clock size={20} />}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline justify-between mb-1">
                                    <h4 className="text-lg font-bold text-white leading-tight pr-4 truncate">{n.title}</h4>
                                    <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
                                        {new Date(n.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-400 line-clamp-2 md:line-clamp-none mb-3">
                                    {n.message}
                                </p>
                            </div>
                            
                            <div className="flex items-center sm:flex-col justify-end gap-3 shrink-0 sm:pl-4 sm:border-l border-white/5">
                                {!n.read && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); markAsRead(n._id); }}
                                        className="w-full flex justify-center items-center gap-2 sm:w-auto px-4 py-2 bg-[#B8FF3C]/10 text-[#B8FF3C] hover:bg-[#B8FF3C] hover:text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
                                    >
                                        <CheckCircle2 size={14} /> Mark Read
                                    </button>
                                )}
                                <button 
                                    onClick={(e) => deleteNotification(n._id, e)}
                                    className="w-full sm:w-auto flex justify-center items-center gap-2 px-4 py-2 bg-white/5 text-slate-400 hover:bg-red-500/20 hover:text-red-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
                                >
                                    <Trash2 size={14} /> Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
