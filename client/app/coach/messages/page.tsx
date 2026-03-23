"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useSocket } from "@/contexts/SocketContext";
import { Search, Edit3, MoreVertical, Send, Plus, ChevronLeft, User, Hash, Paperclip, Smile } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Avatar Helper ─────────────────────────────────────────────────────────────
function Avatar({ initials, size = "md" }: { initials: string; size?: "sm" | "md" | "lg" }) {
    const sz = {
        sm: "w-8 h-8 text-[10px]",
        md: "w-10 h-10 text-xs",
        lg: "w-12 h-12 text-sm"
    }[size];

    return (
        <div className={`${sz} rounded-full bg-[#1A1A24] border border-white/10 flex items-center justify-center font-black text-[#B8FF3C] flex-shrink-0 relative group-hover:border-[#B8FF3C]/30 transition-colors`}>
            {initials}
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0A0A0F]" />
        </div>
    );
}

// ── Chat List Panel ───────────────────────────────────────────────────────────
function ChatList({
    chats,
    selected,
    onSelect,
    currentUserId,
}: {
    chats: any[];
    selected: string | null;
    onSelect: (id: string) => void;
    currentUserId: string;
}) {
    return (
        <div className="flex flex-col h-full bg-[#0D0D12]">
            {/* Header */}
            <div className="px-6 py-6 flex-shrink-0">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black text-white flex items-center gap-2">
                        Messages

                    </h2>
                    <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/5">
                        <Edit3 size={16} />
                    </button>
                </div>

                {/* Search */}
                <div className="relative group">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#B8FF3C] transition-colors" />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        className="w-full bg-[#0A0A0F] border border-white/8 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#B8FF3C]/30 transition-all"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-3 space-y-1 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
                {chats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center mt-12 px-8 text-center gap-4 opacity-50">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-dashed border-white/10">
                            <User size={24} className="text-slate-500" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-white text-xs font-bold">Inbox is empty</p>
                            <p className="text-slate-600 text-[10px]">Your member messages will appear here</p>
                        </div>
                    </div>
                ) : chats.map((chat) => {
                    const otherUser = chat.participants.find((p: any) => p._id !== currentUserId);
                    const name = otherUser
                        ? `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || otherUser.email?.split('@')[0] || "Member"
                        : "Member";
                    const initial = name.charAt(0).toUpperCase();
                    const isSelected = selected === chat._id;

                    return (
                        <button
                            key={chat._id}
                            onClick={() => onSelect(chat._id)}
                            className={`w-full flex items-center gap-3 px-3 py-4 rounded-xl transition-all group relative ${isSelected
                                ? "bg-[#B8FF3C]/10 border border-[#B8FF3C]/20"
                                : "hover:bg-white/5 border border-transparent"
                                }`}
                        >
                            {isSelected && (
                                <motion.div
                                    layoutId="active-chat-indicator"
                                    className="absolute left-0 w-1 h-6 bg-[#B8FF3C] rounded-r-full"
                                />
                            )}
                            <Avatar initials={initial} size="md" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <span className={`font-black text-xs truncate ${isSelected ? "text-[#B8FF3C]" : "text-white"}`}>
                                        {name}
                                    </span>
                                    <span className="text-[9px] text-slate-600 font-bold shrink-0 uppercase tracking-tighter">12:45 PM</span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <p className={`text-[11px] truncate leading-tight ${isSelected ? "text-white/70" : "text-slate-500"}`}>
                                        {chat.lastMessage || 'Start a conversation with your member...'}
                                    </p>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ── Conversation Panel ────────────────────────────────────────────────────────
function Conversation({
    chatId,
    currentUserId,
    memberName,
    onBack,
}: {
    chatId: string;
    currentUserId: string;
    memberName: string;
    onBack: () => void;
}) {
    const { socket } = useSocket();
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function fetchHistory() {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/chat/${chatId}/messages`);
                const json = await res.json();
                if (json.success) setMessages(json.data);
            } catch (err) {
                console.error("Failed to load chat history", err);
            }
        }
        if (chatId) {
            fetchHistory();
            if (socket) socket.emit("join_chat", chatId);
        }
    }, [chatId, socket]);

    useEffect(() => {
        if (!socket) return;
        const handleMsg = (newMessage: any) => {
            if (newMessage.chatId === chatId) {
                setMessages((prev) => [...prev, newMessage]);
            }
        };
        socket.on("receive_message", handleMsg);
        return () => { socket.off("receive_message", handleMsg); };
    }, [socket, chatId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = () => {
        if (!input.trim() || !socket) return;
        socket.emit("send_message", {
            chatId,
            senderId: currentUserId,
            text: input.trim(),
        });
        setInput("");
    };

    return (
        <div className="flex flex-col h-full bg-[#0A0A0F]">
            {/* Header */}
            <div className="flex items-center gap-4 px-6 py-5 border-b border-white/5 flex-shrink-0 bg-[#0D0D12]/50 backdrop-blur-md">
                <button
                    onClick={onBack}
                    className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:text-white transition-colors"
                >
                    <ChevronLeft size={18} />
                </button>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar initials={memberName.charAt(0).toUpperCase()} size="md" />
                    <div className="flex-1 min-w-0">
                        <p className="font-black text-white text-sm leading-tight flex items-center gap-2">
                            {memberName}
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Active Now</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <button className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                        <Hash size={18} />
                    </button>
                    <button className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                        <MoreVertical size={18} />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 bg-[radial-gradient(circle_at_top_right,rgba(184,255,60,0.03),transparent)] scrollbar-thin scrollbar-thumb-white/5">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center px-12 gap-5 opacity-40">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                            <Send size={24} className="text-slate-500 -rotate-12" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-white text-sm font-black">No messages yet</p>
                            <p className="text-slate-500 text-[11px] leading-relaxed">Break the ice! Send a message to start your coaching conversation with {memberName}.</p>
                        </div>
                    </div>
                ) : messages.map((msg, i) => {
                    const isMe = msg.senderId._id === currentUserId || msg.senderId === currentUserId;
                    return (
                        <AnimatePresence key={msg._id || i}>
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className={`flex items-start gap-4 ${isMe ? "flex-row-reverse" : ""}`}
                            >
                                <div className={`flex flex-col gap-1.5 max-w-[80%] sm:max-w-[70%] ${isMe ? "items-end" : "items-start"}`}>
                                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${isMe
                                        ? "bg-[#1E2B12] text-white rounded-tr-none border border-[#B8FF3C]/10"
                                        : "bg-[#161A10] text-slate-200 rounded-tl-none border border-white/5"
                                        }`}>
                                        {msg.text}
                                    </div>
                                    <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest px-1">12:46 PM</span>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Composer */}
            <div className="flex-shrink-0 px-6 py-6 border-t border-white/5 bg-[#0D0D12]">
                <div className="flex items-end gap-3 bg-[#0A0A0F] border border-white/8 rounded-2xl p-2 focus-within:border-[#B8FF3C]/40 transition-all">
                    <button className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl hover:bg-white/5 text-slate-500 hover:text-white transition-colors">
                        <Paperclip size={18} />
                    </button>
                    <div className="flex-1 min-w-0">
                        <textarea
                            rows={1}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder={`Message ${memberName.split(' ')[0]}...`}
                            className="w-full bg-transparent border-none resize-none px-2 py-2.5 text-sm text-white placeholder-slate-600 focus:ring-0 max-h-32 scrollbar-none"
                        />
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl hover:bg-white/5 text-slate-500 hover:text-white transition-colors">
                            <Smile size={18} />
                        </button>
                        <button
                            onClick={handleSend}
                            disabled={!input.trim()}
                            className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-[#B8FF3C] text-[#0A0A0F] hover:bg-[#d4ff6e] transition-all disabled:grayscale disabled:opacity-30 shadow-lg shadow-[#B8FF3C]/10"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
                <p className="text-[9px] text-slate-600 font-bold mt-2 text-center uppercase tracking-widest hidden sm:block">
                    Press <span className="text-[#B8FF3C]">Enter</span> to send · <span className="text-[#B8FF3C]">Shift + Enter</span> for new line
                </p>
            </div>
        </div>
    );
}

// ── Main Content ─────────────────────────────────────────────────────────────
function CoachMessagesContent() {
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const memberIdParam = searchParams.get('memberId');

    const [chats, setChats] = useState<any[]>([]);
    const [selectedChat, setSelectedChat] = useState<string | null>(null);
    const [selectedMemberName, setSelectedMemberName] = useState("Member");
    const [mobileView, setMobileView] = useState<"list" | "chat">("list");

    useEffect(() => {
        async function fetchAndSetup() {
            if (!session?.user?.id) return;
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

            try {
                const res = await fetch(`${apiBase}/api/chat?userId=${session.user.id}`);
                const json = await res.json();
                let currentChats = [];
                if (json.success) {
                    const unique = new Map();
                    json.data.forEach((c: any) => {
                        const otherId = c.participants.find((p: any) => p._id !== session.user.id)?._id;
                        if (otherId && !unique.has(otherId)) unique.set(otherId, c);
                    });
                    currentChats = Array.from(unique.values());
                    setChats(currentChats);
                }

                if (memberIdParam) {
                    const connectRes = await fetch(`${apiBase}/api/chat/connect`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ memberId: memberIdParam, coachId: session.user.id })
                    });
                    const connectJson = await connectRes.json();

                    if (connectJson.success) {
                        const targetChat = connectJson.data;
                        if (!currentChats.find((c: any) => c._id === targetChat._id)) {
                            setChats(prev => [targetChat, ...prev]);
                        }

                        const otherUser = targetChat.participants.find((p: any) => p._id !== session.user.id);
                        const name = otherUser
                            ? `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || otherUser.email?.split('@')[0] || "Member"
                            : "Member";
                        setSelectedMemberName(name);
                        setSelectedChat(targetChat._id);
                        setMobileView("chat");
                    }
                }
            } catch (err) {
                console.error("Failed to load coach chats", err);
            }
        }
        fetchAndSetup();
    }, [session?.user?.id, memberIdParam]);

    const handleSelectChat = (chatId: string) => {
        const chat = chats.find((c) => c._id === chatId);
        if (chat && session?.user?.id) {
            const otherUser = chat.participants.find((p: any) => p._id !== session.user.id);
            const name = otherUser
                ? `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || otherUser.email?.split('@')[0] || "Member"
                : "Member";
            setSelectedMemberName(name);
        }
        setSelectedChat(chatId);
        setMobileView("chat");
    };

    return (
        <div className="flex h-[calc(100vh-160px)] min-h-[500px] overflow-hidden rounded-[2.5rem] border border-white/5 bg-[#0D0D12] shadow-2xl">

            {/* ── Col 1: Chat list ── */}
            <div className={`
                flex-shrink-0 w-full lg:w-[320px] xl:w-[380px] border-r border-white/5 shadow-xl z-20
                ${mobileView === "list" ? "block" : "hidden"} lg:block
            `}>
                {session?.user?.id && (
                    <ChatList
                        chats={chats}
                        selected={selectedChat}
                        onSelect={handleSelectChat}
                        currentUserId={session.user.id}
                    />
                )}
            </div>

            {/* ── Col 2: Conversation ── */}
            <div className={`
                flex-1 min-w-0 z-10
                ${mobileView === "chat" ? "flex" : "hidden"} lg:flex
                flex-col
            `}>
                {selectedChat && session?.user?.id ? (
                    <Conversation
                        chatId={selectedChat}
                        currentUserId={session.user.id}
                        memberName={selectedMemberName}
                        onBack={() => setMobileView("list")}
                    />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-8 text-center px-12 bg-[#0D0D12] relative overflow-hidden">
                        {/* Decorative background elements */}
                        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#B8FF3C]/5 blur-[100px] rounded-full" />
                        <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full" />

                        <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-[#1A1A24] to-[#0D0D12] border border-white/10 flex items-center justify-center shadow-2xl transform rotate-3 relative z-10 transition-transform hover:rotate-0 duration-700">
                            <div className="w-12 h-12 rounded-full bg-[#B8FF3C]/10 flex items-center justify-center border border-[#B8FF3C]/30">
                                <Send size={32} className="text-[#B8FF3C] -translate-y-0.5 translate-x-0.5" />
                            </div>
                        </div>
                        <div className="space-y-3 relative z-10 max-w-sm">
                            <h3 className="text-white font-black text-2xl tracking-tight">Select a Chat</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">
                                Ready to guide your members? Choose a conversation from the left to start communicating.
                            </p>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}

export default function CoachMessagesPage() {
    return (
        <Suspense fallback={
            <div className="h-[calc(100vh-160px)] flex items-center justify-center bg-[#0D0D12] rounded-[2.5rem] border border-white/5">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#B8FF3C]"></div>
            </div>
        }>
            <CoachMessagesContent />
        </Suspense>
    );
}