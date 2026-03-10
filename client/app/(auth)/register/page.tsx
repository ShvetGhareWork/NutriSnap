'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Leaf, Eye, EyeOff, ArrowRight } from 'lucide-react';

function getStrength(pw: string): { score: number; label: string; color: string } {
    if (!pw) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const levels = [
        { score: 1, label: 'Weak', color: '#ef4444' },
        { score: 2, label: 'Fair', color: '#f97316' },
        { score: 3, label: 'Moderate', color: '#eab308' },
        { score: 4, label: 'Strong', color: '#84cc16' },
        { score: 5, label: 'Very Strong', color: '#B8FF3C' },
    ];
    return levels[Math.min(score, 5) - 1] || { score: 0, label: '', color: '' };
}

export default function RegisterPage() {
    const router = useRouter();
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const strength = getStrength(form.password);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (form.password.length < 8) return setError('Password must be at least 8 characters');
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/account/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: form.email, password: form.password, name: form.name }),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.error || 'Registration failed');

            // Successfully registered, auto login
            const signInRes = await signIn('credentials', {
                email: form.email,
                password: form.password,
                redirect: false,
            });

            if (signInRes?.error) {
                // If login fails, redirect to login page with success flag
                router.push('/login?registered=1');
            } else {
                // Login succeeded, redirect to role selection
                router.push('/select-role');
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
            style={{
                background: 'radial-gradient(ellipse at 50% 40%, #1c3a0c 0%, #0e1f07 45%, #080f04 100%)',
            }}
        >
            {/* Logo outside card */}
            <div className="flex flex-col items-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-[#B8FF3C] flex items-center justify-center mb-3 shadow-lg shadow-[#B8FF3C]/20">
                    <Leaf size={28} className="text-[#0a1205]" fill="currentColor" />
                </div>
                <span className="font-black text-white text-2xl tracking-tight">MacroSnap</span>
            </div>

            {/* Card */}
            <div className="w-full max-w-sm bg-[#0e1a09]/90 border border-white/[0.08] rounded-2xl p-7 shadow-2xl backdrop-blur-sm">


                <h1 className="text-2xl font-black text-white mb-1">Start your transformation</h1>
                <p className="text-white/40 text-sm mb-6">Enter your details to create your account</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Full Name */}
                    <div>
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-1.5">
                            Full Name
                        </label>
                        <input
                            type="text"
                            required
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="John Doe"
                            className="w-full bg-[#162010]/60 border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#B8FF3C]/40 transition-colors"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-1.5">
                            Email Address
                        </label>
                        <input
                            type="email"
                            required
                            value={form.email}
                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                            placeholder="john@example.com"
                            className="w-full bg-[#162010]/60 border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#B8FF3C]/40 transition-colors"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-1.5">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPass ? 'text' : 'password'}
                                required
                                value={form.password}
                                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                placeholder="••••••••"
                                className="w-full bg-[#162010]/60 border border-white/[0.08] rounded-xl px-4 py-3 pr-11 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#B8FF3C]/40 transition-colors"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(!showPass)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                            >
                                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>

                        {/* Strength bar */}
                        {form.password && (
                            <div className="mt-2">
                                <div className="flex gap-1 mb-1">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div
                                            key={i}
                                            className="h-1 flex-1 rounded-full transition-all duration-300"
                                            style={{ background: i <= strength.score ? strength.color : 'rgba(255,255,255,0.08)' }}
                                        />
                                    ))}
                                </div>
                                <p className="text-xs" style={{ color: strength.color }}>
                                    Strength: {strength.label}
                                </p>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2.5 text-red-400 text-xs">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#B8FF3C] text-[#0a1205] font-black py-4 rounded-xl hover:bg-[#d4ff6e] transition-colors flex items-center justify-center gap-2 text-sm mt-2 disabled:opacity-60"
                    >
                        {loading ? 'Creating account...' : <> Create Account <ArrowRight size={16} /> </>}
                    </button>
                </form>

                <p className="text-center text-sm text-white/40 mt-5">
                    Already have an account?{' '}
                    <Link href="/login" className="font-bold text-[#B8FF3C] hover:text-[#d4ff6e] transition-colors">
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
}
