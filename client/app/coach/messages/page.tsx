"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useSocket } from "@/contexts/SocketContext";
import { Search, Edit3, MoreVertical, Send, Plus, ChevronLeft, User } from "lucide-react";

// ── Avatar Helper ─────────────────────────────────────────────────────────────
function Avatar({ initials, size = "md" }: { initials: string; size?: "sm" | "md" | "lg" }) {
    const sz = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-11 h-11 text-sm" }[size];
    return (
        <div className={`${sz} rounded-full bg-gradient-to-br from-[#B8FF3C]/80 to-emerald-500 flex items-center justify-center font-black text-[#0A0A0F] flex-shrink-0`}>
            {initials}
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
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/5 flex-shrink-0">
                <h2 className="text-lg font-black text-white">Members</h2>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-slate-400 hover:text-white transition-colors">
                    <Edit3 size={15} />
                </button>
            </div>

            {/* Search */}
            <div className="px-4 py-3 flex-shrink-0">
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search members..."
                        className="w-full bg-white/5 border border-white/8 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#B8FF3C]/30 transition-colors"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {chats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center mt-12 px-4 text-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                            <User size={20} className="text-slate-500" />
                        </div>
                        <p className="text-slate-500 text-sm font-bold">No active conversations</p>
                        <p className="text-slate-600 text-xs">Members will appear here once they connect with you</p>
                    </div>
                ) : chats.map((chat) => {
                    const otherUser = chat.participants.find((p: any) => p._id !== currentUserId);
                    const name = otherUser
                        ? `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || otherUser.email.split('@')[0]
                        : "Member";
                    const initial = name.charAt(0).toUpperCase();

                    return (
                        <button
                            key={chat._id}
                            onClick={() => onSelect(chat._id)}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all border-l-2 ${selected === chat._id
                                ? "bg-[#B8FF3C]/8 border-[#B8FF3C]"
                                : "border-transparent hover:bg-white/3"
                                }`}
                        >
                            <Avatar initials={initial} size="md" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                    <span className="font-bold text-sm text-white truncate">{name}</span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-xs text-slate-400 truncate">{chat.lastMessage || 'Start a conversation...'}</p>
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

    // Load existing history
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

    // Listen for incoming socket messages
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

    // Auto-scroll to bottom
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
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 flex-shrink-0 bg-[#0D0D12]">
                <button
                    onClick={onBack}
                    className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-slate-400 hover:text-white transition-colors flex-shrink-0"
                >
                    <ChevronLeft size={16} />
                </button>
                <Avatar initials={memberName.charAt(0).toUpperCase()} size="md" />
                <div className="flex-1 min-w-0">
                    <p className="font-black text-white text-sm leading-none">{memberName}</p>
                    <p className="text-[10px] text-[#B8FF3C] uppercase tracking-widest font-bold mt-0.5">Member</p>
                </div>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-slate-400 hover:text-white transition-colors">
                    <MoreVertical size={15} />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
                {messages.length === 0 ? (
                    <div className="flex justify-center text-slate-500 text-sm mt-5">No messages yet. Start the conversation!</div>
                ) : messages.map((msg, i) => {
                    const isMe = msg.senderId._id === currentUserId || msg.senderId === currentUserId;
                    return (
                        <div key={msg._id || i} className={`flex items-end gap-2.5 ${isMe ? "flex-row-reverse" : ""}`}>
                            {!isMe && <Avatar initials={memberName.charAt(0).toUpperCase()} size="sm" />}
                            <div className={`max-w-[75%] sm:max-w-[65%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${isMe
                                    ? "bg-[#1E2B12] text-white rounded-br-sm border border-[#B8FF3C]/15"
                                    : "bg-[#161A10] text-slate-200 rounded-bl-sm border border-white/5"
                                    }`}>
                                    {msg.text}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex-shrink-0 px-4 py-4 border-t border-white/5 bg-[#0D0D12]">
                <div className="flex items-center gap-2">
                    <button className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:text-white transition-colors">
                        <Plus size={16} />
                    </button>
                    <div className="flex-1">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            placeholder="Message your member..."
                            className="w-full bg-white/5 border border-white/8 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#B8FF3C]/30 transition-colors"
                        />
                    </div>
                    <button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-[#B8FF3C] text-[#0A0A0F] hover:bg-[#d4ff6e] transition-colors disabled:opacity-50"
                    >
                        <Send size={15} />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CoachMessagesPage() {
    const { data: session } = useSession();

    const [chats, setChats] = useState<any[]>([]);
    const [selectedChat, setSelectedChat] = useState<string | null>(null);
    const [selectedMemberName, setSelectedMemberName] = useState("Member");
    const [mobileView, setMobileView] = useState<"list" | "chat">("list");

    // Fetch all chats for this coach
    useEffect(() => {
        async function fetchChats() {
            if (!session?.user?.id) return;
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/chat?userId=${session.user.id}`);
                const json = await res.json();
                if (json.success) setChats(json.data);
            } catch (err) {
                console.error("Failed to load coach chats", err);
            }
        }
        fetchChats();
    }, [session?.user?.id]);

    const handleSelectChat = (chatId: string) => {
        const chat = chats.find((c) => c._id === chatId);
        if (chat && session?.user?.id) {
            const otherUser = chat.participants.find((p: any) => p._id !== session.user.id);
            const name = otherUser
                ? `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || otherUser.email.split('@')[0]
                : "Member";
            setSelectedMemberName(name);
        }
        setSelectedChat(chatId);
        setMobileView("chat");
    };

    return (
        <div className="h-full flex overflow-hidden rounded-xl border border-white/5">

            {/* ── Col 1: Chat list ── */}
            <div className={`
                flex-shrink-0 w-full lg:w-[280px] xl:w-[300px] border-r border-white/5
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
                flex-1 min-w-0
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
                    <div className="h-full flex flex-col items-center justify-center gap-4 text-center px-6">
                        <div className="w-16 h-16 rounded-2xl bg-[#B8FF3C]/10 border border-[#B8FF3C]/20 flex items-center justify-center">
                            <User size={28} className="text-[#B8FF3C]" />
                        </div>
                        <div>
                            <p className="text-white font-black text-lg">Select a Conversation</p>
                            <p className="text-slate-500 text-sm mt-1">Choose a member from the left to start chatting</p>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}