"use client";

import { useSession, signOut } from "next-auth/react";
import { User, Shield, Bell, LogOut, ChevronRight, Check, CreditCard, IndianRupee, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useUserContext } from "@/contexts/UserContext";

export default function CoachSettingsPage() {
    const { data: session } = useSession();
    const { coachProfile, refetchProfile } = useUserContext();
    
    const [saved, setSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form states
    const [paidChatEnabled, setPaidChatEnabled] = useState(false);
    const [chatFeeINR, setChatFeeINR] = useState(500);

    // Initialize from profile
    useEffect(() => {
        if (coachProfile) {
            setPaidChatEnabled(coachProfile.paidChatEnabled || false);
            setChatFeeINR(coachProfile.chatFeeINR || 500);
        }
    }, [coachProfile]);

    const handleSave = async () => {
        if (!session?.user?.id) return;
        setIsSaving(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/profile/coach/${session.user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    paidChatEnabled,
                    chatFeeINR
                })
            });
            const json = await res.json();
            if (json.success) {
                setSaved(true);
                await refetchProfile();
                setTimeout(() => setSaved(false), 2000);
            }
        } catch (err) {
            console.error("Save error", err);
        } finally {
            setIsSaving(false);
        }
    };

    const sections = [
        {
            title: "Profile Information",
            icon: <User size={18} className="text-[#a3e635]" />,
            items: [
                { label: "Full Name", value: session?.user?.name || "No name set" },
                { label: "Email Address", value: session?.user?.email || "No email set" },
                { label: "Coach Bio", value: coachProfile?.bio || "No bio set." },
            ]
        },
        {
            title: "Professional Monetization",
            icon: <CreditCard size={18} className="text-[#B8FF3C]" />,
            isCustom: true,
            content: (
                <div className="px-6 py-6 space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-white">Enable Paid Individual Chat</p>
                            <p className="text-[11px] text-white/40 italic">Members must pay your fee before connecting with you personally.</p>
                        </div>
                        <button 
                            onClick={() => setPaidChatEnabled(!paidChatEnabled)}
                            className={`w-12 h-6 rounded-full transition-all relative ${paidChatEnabled ? 'bg-[#B8FF3C]' : 'bg-white/10'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-black transition-all ${paidChatEnabled ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>

                    {paidChatEnabled && (
                        <div className="space-y-3 animate-fade-in">
                            <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest pl-1">Consultation Fee (INR)</p>
                            <div className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-2xl p-4 focus-within:border-[#B8FF3C]/30 transition-all">
                                <IndianRupee size={18} className="text-[#B8FF3C]" />
                                <input 
                                    type="number" 
                                    value={chatFeeINR}
                                    onChange={(e) => setChatFeeINR(Number(e.target.value))}
                                    className="bg-transparent text-white font-black text-xl w-full outline-none"
                                    placeholder="Enter amount"
                                />
                                <span className="text-[11px] font-black text-white/20 uppercase tracking-tighter">PER CONNECTION</span>
                            </div>
                            <p className="text-[10px] text-[#B8FF3C]/60 italic pl-1 flex items-center gap-1.5">
                                <Check size={10} /> Payments will be processed instantly via Razorpay.
                            </p>
                        </div>
                    )}
                </div>
            )
        },
        {
            title: "Notifications",
            icon: <Bell size={18} className="text-orange-400" />,
            items: [
                { label: "Email Alerts", value: "Enabled" },
                { label: "Push Notifications", value: "Daily Summary" },
            ]
        }
    ];

    return (
        <div className="max-w-4xl mx-auto py-6 animate-fade-in space-y-10">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-white tracking-tight italic">Settings</h1>
                    <p className="text-sm text-white/40">Optimize your professional workflow and monetization.</p>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-[#B8FF3C] text-[#0A0A0F] font-black px-8 py-3 rounded-2xl text-sm flex items-center gap-2 hover:bg-[#d4ff6e] transition-all disabled:opacity-50 shadow-xl shadow-[#B8FF3C]/10"
                >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : saved ? <><Check size={16} /> SAVED</> : "SAVE CHANGES"}
                </button>
            </div>

            <div className="grid gap-8">
                {sections.map((section, idx) => (
                    <div key={idx} className="bg-[#13131A] border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl relative">
                        <div className="px-6 py-5 border-b border-white/5 flex items-center gap-3 bg-white/[0.01]">
                            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                                {section.icon}
                            </div>
                            <h2 className="font-black text-white uppercase tracking-[0.2em] text-[11px]">{section.title}</h2>
                        </div>
                        
                        {section.isCustom ? section.content : (
                            <div className="divide-y divide-white/5">
                                {section.items?.map((item, i) => (
                                    <div key={i} className="px-8 py-5 flex items-center justify-between hover:bg-white/[0.01] cursor-pointer group transition-colors">
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-white/30 uppercase font-black tracking-widest leading-none mb-1">{item.label}</p>
                                            <p className="text-sm text-white font-bold">{item.value}</p>
                                        </div>
                                        <ChevronRight size={16} className="text-white/10 group-hover:text-[#B8FF3C] transition-colors" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}

                {/* DANGER ZONE */}
                <div className="bg-[#1A1010] border border-red-500/10 rounded-[2rem] overflow-hidden p-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/10">
                            <LogOut size={22} className="text-red-500" />
                        </div>
                        <div>
                            <h2 className="font-black text-white uppercase tracking-widest text-xs">Danger Zone</h2>
                            <p className="text-[10px] text-red-500/50 font-bold uppercase tracking-tighter mt-1">Disconnect your current session</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="bg-red-500/10 text-red-500 border border-red-500/15 px-8 py-3 rounded-2xl font-black text-xs hover:bg-red-500/20 transition-all active:scale-95"
                    >
                        SIGN OUT ACCOUNT
                    </button>
                </div>
            </div>
        </div>
    );
}
