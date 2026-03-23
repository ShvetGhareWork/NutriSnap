"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, Clock, X, Dumbbell, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useSocket } from "@/contexts/SocketContext";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationDropdown() {
    const { data: session } = useSession();
    const router = useRouter();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);
    const [activeToast, setActiveToast] = useState<any>(null);
    const [showToast, setShowToast] = useState(false);

    const { socket } = useSocket();

    useEffect(() => {
        setMounted(true);
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    const fetchNotifications = async () => {
        if (!session?.user?.id) return;
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const res = await fetch(`${apiBase}/api/user/notifications/${session.user.id}`);
            const json = await res.json();
            if (json.success) setNotifications(json.data);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        
        if (socket) {
            const handleNewNotification = (notification: any) => {
                setNotifications(prev => [notification, ...prev]);
                
                // Show pop-up toast
                setActiveToast(notification);
                setShowToast(true);
                
                // Auto-dismiss toast
                setTimeout(() => setShowToast(false), 5000);
            };
            socket.on("new_notification", handleNewNotification);
            return () => {
                socket.off("new_notification", handleNewNotification);
            };
        }

        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [session, socket]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const markAsRead = async (id: string) => {
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            await fetch(`${apiBase}/api/user/notifications/${id}/read`, { method: 'PUT' });
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };
    
    const handleAcceptRequest = async (e: React.MouseEvent, notification: any) => {
        e.stopPropagation();
        try {
            const relationshipId = notification.metadata?.relationshipId;
            if (!relationshipId) return;

            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const res = await fetch(`${apiBase}/api/coach/accept`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ relationshipId })
            });
            const data = await res.json();
            if (data.success) {
                markAsRead(notification._id);
                // Redirect to clients page
                router.push('/coach/clients');
                setIsOpen(false);
            }
        } catch (error) {
            console.error("Failed to accept request", error);
        }
    };

    const handleConnectWithCoach = async (notification: any) => {
        try {
            const coachId = notification.metadata?.coachId;
            if (!coachId || !session?.user?.id) return;

            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const res = await fetch(`${apiBase}/api/chat/connect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberId: session.user.id, coachId })
            });
            const data = await res.json();
            if (data.success) {
                markAsRead(notification._id);
                // Redirect to messages with auto-hello trigger
                router.push(`/messages?chatId=${data.data._id}&autoHello=true`);
                setIsOpen(false);
            }
        } catch (error) {
            console.error("DEBUG: handleConnectWithCoach Error:", error);
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
            const isCoach = session?.user?.role === 'coach';
            if (isCoach) {
                router.push(`/coach/messages?memberId=${n.metadata.senderId}`);
            } else {
                router.push(`/messages?chatId=${n.metadata.chatId}`);
            }
        }
        setIsOpen(false);
        setShowToast(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Real-time Pop-up Toast */}
            <AnimatePresence>
                {showToast && activeToast && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -20, x: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -20, x: 20 }}
                        onClick={() => handleNotificationClick(activeToast)}
                        className="fixed top-6 right-6 w-80 bg-[#13131A]/90 backdrop-blur-xl border border-[#B8FF3C]/30 rounded-2xl p-4 shadow-2xl z-50 cursor-pointer hover:bg-[#13131A] transition-colors group"
                    >
                        <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#B8FF3C]/10 flex items-center justify-center text-[#B8FF3C] shrink-0 border border-[#B8FF3C]/20">
                                {activeToast.type === 'message' ? <MessageSquare size={18} /> : 
                                 activeToast.type === 'acceptance' ? <Check size={18} /> : 
                                 <Bell size={18} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-white uppercase tracking-wider mb-0.5">Notification</p>
                                <p className="text-sm font-bold text-[#B8FF3C] leading-snug">{activeToast.title}</p>
                                <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{activeToast.message}</p>
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowToast(false); }}
                                className="text-slate-500 hover:text-white transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>
                        <div className="absolute bottom-0 left-0 w-full overflow-hidden h-[1.5px] rounded-b-2xl bg-white/5">
                            <div className="h-full bg-gradient-to-r from-transparent via-[#B8FF3C] to-white origin-left animate-timer shadow-[0_0_12px_#B8FF3C]" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-9 h-9 bg-[#13131A] border border-white/[0.08] rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors relative"
                suppressHydrationWarning
            >
                <Bell size={16} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#B8FF3C] rounded-full animate-pulse" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-[#13131A] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black text-white">Notifications</h3>
                            {unreadCount > 0 && <span className="text-[10px] bg-[#B8FF3C] text-[#0A0A0F] px-2 py-0.5 rounded-full font-bold">{unreadCount} New</span>}
                        </div>
                        {notifications.length > 0 && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); clearAll(); }}
                                className="text-[10px] text-slate-500 font-bold hover:text-red-400 transition-colors uppercase tracking-widest"
                            >
                                Clear All
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto scrollbar-none">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 text-xs">
                                No notifications yet
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div 
                                    key={n._id} 
                                    className={`p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors cursor-pointer group ${!n.read ? 'bg-[#B8FF3C]/5' : ''}`}
                                onClick={() => handleNotificationClick(n)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                            n.type === 'acceptance' ? 'bg-[#B8FF3C]/20 text-[#B8FF3C]' : 
                                            n.type === 'program_assignment' ? 'bg-purple-500/20 text-purple-400' : 
                                            n.type === 'request' ? 'bg-blue-500/20 text-blue-400' : 
                                            'bg-slate-500/20 text-slate-400'
                                        }`}>
                                            {n.type === 'acceptance' ? <Check size={14} /> : 
                                             n.type === 'program_assignment' ? <Dumbbell size={14} /> :
                                             n.type === 'message' ? <MessageSquare size={14} /> :
                                             <Clock size={14} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-white leading-snug">{n.title}</p>
                                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                                            
                                            {n.type === 'request' && (
                                                <div className="flex flex-col gap-2 mt-3">
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={(e) => handleAcceptRequest(e, n)}
                                                            className="flex-1 bg-[#B8FF3C] text-[#0A0A0F] text-[10px] font-black py-1.5 rounded-lg hover:scale-105 transition-all shadow-lg shadow-[#B8FF3C]/10"
                                                        >
                                                            Accept
                                                        </button>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); markAsRead(n._id); }}
                                                            className="flex-1 bg-white/5 text-slate-400 text-[10px] font-black py-1.5 rounded-lg border border-white/5 hover:bg-white/10 hover:text-white transition-all"
                                                        >
                                                            Decline
                                                        </button>
                                                    </div>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); router.push('/coach/clients?tab=Pending'); setIsOpen(false); }}
                                                        className="text-[9px] text-center text-[#B8FF3C] font-bold hover:underline py-1"
                                                    >
                                                        Review User Details →
                                                    </button>
                                                </div>
                                            )}
                                            
                                            {n.type === 'acceptance' && (
                                                <div className="mt-3">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleConnectWithCoach(n); }}
                                                        className="w-full bg-[#B8FF3C] text-[#0A0A0F] text-[10px] font-black py-2 rounded-lg hover:scale-[1.02] transition-all shadow-lg shadow-[#B8FF3C]/10 flex items-center justify-center gap-2"
                                                    >
                                                        <Dumbbell size={12} /> Connect with Coach
                                                    </button>
                                                </div>
                                            )}
                                            
                                            <p className="text-[10px] text-slate-600 mt-2">
                                                {mounted ? (
                                                    `${new Date(n.createdAt).toLocaleDateString()} · ${new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                                ) : (
                                                    '--/--/----'
                                                )}
                                            </p>
                                        </div>
                                        {!n.read && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#B8FF3C] mt-1.5" />
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-3 bg-white/5 border-t border-white/5 text-center">
                        <button className="text-[10px] text-slate-400 font-bold hover:text-white uppercase tracking-widest">
                            View All Notifications
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
