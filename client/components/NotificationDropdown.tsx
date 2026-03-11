"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, Clock, X } from "lucide-react";
import { useSession } from "next-auth/react";

export default function NotificationDropdown() {
    const { data: session } = useSession();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

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
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [session]);

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

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-9 h-9 bg-[#13131A] border border-white/[0.08] rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors relative"
            >
                <Bell size={16} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#B8FF3C] rounded-full animate-pulse" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-[#13131A] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                        <h3 className="text-sm font-black text-white">Notifications</h3>
                        {unreadCount > 0 && <span className="text-[10px] bg-[#B8FF3C] text-[#0A0A0F] px-2 py-0.5 rounded-full font-bold">{unreadCount} New</span>}
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
                                    onClick={() => !n.read && markAsRead(n._id)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                            n.type === 'acceptance' ? 'bg-[#B8FF3C]/20 text-[#B8FF3C]' : 
                                            n.type === 'request' ? 'bg-blue-500/20 text-blue-400' : 
                                            'bg-slate-500/20 text-slate-400'
                                        }`}>
                                            {n.type === 'acceptance' ? <Check size={14} /> : <Clock size={14} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-white leading-snug">{n.title}</p>
                                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                                            <p className="text-[10px] text-slate-600 mt-2">{new Date(n.createdAt).toLocaleDateString()} · {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
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
