"use client";

import { useSession, signOut } from "next-auth/react";
import { User, Shield, Bell, LogOut, ChevronRight, Check } from "lucide-react";
import { useState } from "react";

export default function CoachSettingsPage() {
    const { data: session } = useSession();
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const sections = [
        {
            title: "Profile Information",
            icon: <User size={18} className="text-[#a3e635]" />,
            items: [
                { label: "Full Name", value: session?.user?.name || "No name set" },
                { label: "Email Address", value: session?.user?.email || "No email set" },
                { label: "Coach Bio", value: "Expert in muscle gain & nutrition protocol." },
            ]
        },
        {
            title: "Account Security",
            icon: <Shield size={18} className="text-blue-400" />,
            items: [
                { label: "Password", value: "••••••••••••" },
                { label: "Two-Factor Auth", value: "Disabled" },
            ]
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
        <div className="max-w-4xl mx-auto py-6 animate-fade-in space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight italic">Settings</h1>
                    <p className="text-sm text-white/40 mt-1">Manage your account and preferences.</p>
                </div>
                <button 
                    onClick={handleSave}
                    className="bg-[#a3e635] text-[#0A0A0F] font-black px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 hover:bg-[#b5f03f] transition-all"
                >
                    {saved ? <><Check size={16} /> SAVED</> : "SAVE CHANGES"}
                </button>
            </div>

            <div className="grid gap-6">
                {sections.map((section, idx) => (
                    <div key={idx} className="bg-[#1A2210] border border-white/5 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                {section.icon}
                            </div>
                            <h2 className="font-bold text-white uppercase tracking-widest text-xs">{section.title}</h2>
                        </div>
                        <div className="divide-y divide-white/5">
                            {section.items.map((item, i) => (
                                <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] cursor-pointer group transition-colors">
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">{item.label}</p>
                                        <p className="text-sm text-white font-medium">{item.value}</p>
                                    </div>
                                    <ChevronRight size={16} className="text-white/20 group-hover:text-[#a3e635] transition-colors" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {/* LOGOUT AREA */}
                <div className="bg-[#1A2210] border border-red-500/10 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                                <LogOut size={18} className="text-red-400" />
                            </div>
                            <div>
                                <h2 className="font-bold text-white uppercase tracking-widest text-xs">Danger Zone</h2>
                                <p className="text-[10px] text-red-500/60 font-medium">Session management</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => signOut()}
                            className="bg-red-500/10 text-red-400 border border-red-500/20 px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-red-500/20 transition-all flex items-center gap-2"
                        >
                            SIGN OUT ACCOUNT
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
