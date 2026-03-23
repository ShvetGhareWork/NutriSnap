"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Camera, Activity, Zap, LayoutDashboard, Flame, Target,
  ChevronDown, ChevronRight, Check, Star, ArrowRight, Play,
  Instagram, Twitter, Youtube, Menu, X
} from "lucide-react";
import { BeforeAfterSlider } from "@/components/ui/BeforeAfterSlider";
import beforeImage from "@/public/images/physique-before.jpg";
import afterImage from "@/public/images/physique-after.jpg";

// ─── Smooth scroll helper ────────────────────────────────────────────────────
function scrollTo(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ─── Nav links config ────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: "Features", id: "features" },
  { label: "How It Works", id: "how-it-works" },
  { label: "Pricing", id: "pricing" },
  { label: "Testimonials", id: "testimonials" },
  { label: "Help", id: "faq" },
];

// ─── Marquee ─────────────────────────────────────────────────────────────────
const MARQUEE_ITEMS = [
  "PHYSIQUE PROJECTION", "CUSTOM WORKOUT PLANS", "MACRO DASHBOARD",
  "RECIPE BUILDER", "AI COACH", "CALORIE TRACKING", "PROGRESS ANALYTICS",
];

function Marquee() {
  return (
    <div className="w-full overflow-hidden bg-[#B8FF3C] py-3 border-y border-[#B8FF3C]">
      <div className="flex animate-marquee whitespace-nowrap">
        {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
          <span
            key={i}
            className="mx-6 text-[#0A0A0F] font-black text-xs tracking-widest uppercase flex items-center gap-3 flex-shrink-0"
          >
            {item} <span className="text-[#0A0A0F]/40">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Navbar ──────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#0A0A0F]/95 backdrop-blur-md border-b border-white/5" : ""
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center gap-2"
        >
          <img src="/logo.png" alt="NutriSnap Logo" className="w-8 h-8 object-contain" />
          <span className="font-black text-white text-lg tracking-tight">NutriSnap</span>
        </button>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
          {NAV_LINKS.map(({ label, id }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              {label}
            </button>
          ))}
        </div>

        {/* CTA + mobile hamburger */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden md:block text-sm text-slate-400 hover:text-white transition-colors font-medium"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="bg-[#B8FF3C] hover:bg-[#d4ff6e] text-[#0A0A0F] font-black text-sm px-5 py-2.5 rounded-lg transition-colors"
          >
            Get Started Free
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-white p-1"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0A0A0F]/98 border-t border-white/5 px-6 py-4 flex flex-col gap-4">
          {NAV_LINKS.map(({ label, id }) => (
            <button
              key={id}
              onClick={() => { scrollTo(id); setMobileOpen(false); }}
              className="text-slate-300 text-sm font-medium hover:text-white text-left transition-colors"
            >
              {label}
            </button>
          ))}
          <div className="border-t border-white/5 pt-4 flex flex-col gap-3">
            <Link href="/login" className="text-slate-300 text-sm font-bold hover:text-white transition-colors">
              Log in
            </Link>
            <Link href="/register" className="bg-[#B8FF3C] text-[#0A0A0F] font-black text-sm px-4 py-2.5 rounded-lg transition-colors text-center">
              Get Started Free
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center pt-16 overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[#B8FF3C]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2  rounded-full px-4 py-1.5 mb-8">
        </div>

        <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-none mb-4 text-white">
          Snap your meal.
        </h1>
        <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-none mb-8 text-[#B8FF3C]">
          Smash your goals.
        </h1>

        <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-12 leading-relaxed">
          The ultimate AI companion that recognises any meal instantly,
          calculates macros with 98% accuracy, and generates custom
          workouts based on your physique goals.
        </p>

        {/* Phone mockup */}
        <div className="relative mx-auto w-64 mb-12">
          <div className="absolute inset-0 bg-[#B8FF3C]/20 blur-3xl rounded-full scale-75 translate-y-8" />
          <div className="relative bg-gradient-to-b from-[#1a1a24] to-[#13131A] rounded-[2.5rem] border border-white/10 p-3 shadow-2xl">
            <div className="bg-[#0f0f17] rounded-[2rem] overflow-hidden aspect-[9/19]">
              <div className="w-full h-full relative bg-gradient-to-br from-[#1a2a1a] to-[#0f1a0f] flex flex-col items-center justify-center p-6 gap-4">
                <div className="w-20 h-20 bg-[#B8FF3C]/20 rounded-2xl border border-[#B8FF3C]/30 flex items-center justify-center">
                  <Camera size={32} className="text-[#B8FF3C]" />
                </div>
                <div className="space-y-2 w-full">
                  <div className="h-2 bg-[#B8FF3C]/30 rounded-full w-3/4 mx-auto" />
                  <div className="h-2 bg-white/10 rounded-full w-1/2 mx-auto" />
                </div>
                <div className="grid grid-cols-3 gap-2 w-full">
                  {(
                    [
                      ["Protein", "42g", "text-emerald-400"],
                      ["Carbs", "68g", "text-orange-400"],
                      ["Fat", "18g", "text-blue-400"],
                    ] as [string, string, string][]
                  ).map(([l, v, c]) => (
                    <div key={l} className="bg-white/5 rounded-xl p-2 text-center border border-white/5">
                      <div className={`text-sm font-bold ${c}`}>{v}</div>
                      <div className="text-[9px] text-slate-500">{l}</div>
                    </div>
                  ))}
                </div>
                <div className="absolute top-4 right-4 w-3 h-3 bg-[#B8FF3C] rounded-full opacity-60 animate-pulse" />
                <div className="absolute bottom-8 left-4 w-2 h-2 bg-teal-400 rounded-full opacity-40 animate-pulse" style={{ animationDelay: "1s" }} />
              </div>
            </div>
          </div>
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-[#B8FF3C] rounded-full flex items-center justify-center shadow-lg shadow-[#B8FF3C]/30">
            <span className="text-[#0A0A0F] font-black text-lg leading-none">+</span>
          </div>
        </div>

        <p className="text-xs text-slate-600 uppercase tracking-widest mb-6">TRUSTED BY ELITE ATHLETES</p>
        <div className="flex items-center justify-center gap-10 mb-16 flex-wrap">
          {["ATHLETICA", "GYMFLOW", "VITALITY", "IRONWELL"].map(b => (
            <span key={b} className="text-slate-600 font-black text-sm tracking-widest">{b}</span>
          ))}
        </div>

        {/* Hero CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            href="/register"
            className="bg-[#B8FF3C] text-[#0A0A0F] font-black px-8 py-4 rounded-xl hover:bg-[#d4ff6e] transition-colors flex items-center gap-2 text-sm"
          >
            Get Started Free <ArrowRight size={16} />
          </Link>
          <button
            onClick={() => scrollTo("how-it-works")}
            className="border border-white/10 text-white font-bold px-8 py-4 rounded-xl hover:bg-white/5 transition-colors flex items-center gap-2 text-sm"
          >
            <Play size={14} fill="currentColor" /> See How It Works
          </button>
        </div>
      </div>

      <div className="w-full">
        <Marquee />
      </div>
    </section>
  );
}

// ─── Video Showcase ──────────────────────────────────────────────────────────
function VideoShowcase() {
  const videos = [
    { src: "/video1.mp4", title: "Smart Recognition" },
    { src: "/video2.mp4", title: "Elite Coaching" },
    { src: "/video3.mp4", title: "Progress Tracking" }
  ];

  return (
    <section className="bg-[#0A0A0F] py-28 px-6 border-y border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">See NutriSnap in <span className="text-[#B8FF3C]">Action</span></h2>
          <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Experience the future of fitness technology. Watch how our AI integrates seamlessly into your daily routine.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {videos.map((vid, i) => (
            <div key={i} className="group relative rounded-[2rem] overflow-hidden border border-white/5 bg-slate-900/50 aspect-[9/16] shadow-2xl">
              <video
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-700"
              >
                <source src={vid.src} type="video/mp4" />
              </video>
              <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-[#0A0A0F] to-transparent">
                <h3 className="text-white font-black text-xl mb-1 tracking-tight">{vid.title}</h3>
                <div className="w-8 h-1 bg-[#B8FF3C] rounded-full scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: Camera, title: "Instant Recognition", desc: "Point your camera at any meal. Our CV engine identifies complex dishes and estimates accurate portions in seconds." },
  { icon: Activity, title: "Physique Projection", desc: "See the result before the work. Upload a photo and AI visualises your bulk or cut progress 3 months from now." },
  { icon: Zap, title: "Adaptive Workouts", desc: "Plateau-busting plans generated based on your equipment, schedule, and recovery data." },
  { icon: LayoutDashboard, title: "Macro Dashboard", desc: "Real-time breakdown of Protein, Carbs, Fats and calculated daily targets, continuously adjusted." },
  { icon: Flame, title: "Calorie Burn", desc: "Integrated tracking for calories and estimated average metabolic activity data." },
  { icon: Target, title: "Goal Engine", desc: "Whether you're cutting, bulking or maintaining, set a target and get a roadmap to get there." },
];

function Features() {
  return (
    <section id="features" className="bg-[#0D0D12] py-28 px-6 scroll-mt-16">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Precision Features</h2>
          <p className="text-slate-500">Cutting edge technology to fuel your fitness journey.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group bg-[#13131A] border border-white/5 rounded-2xl p-7 hover:border-[#B8FF3C]/20 hover:bg-[#161620] transition-all duration-300 cursor-pointer"
            >
              <div className="w-11 h-11 bg-[#B8FF3C]/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-[#B8FF3C]/20 transition-colors">
                <Icon size={20} className="text-[#B8FF3C]" />
              </div>
              <h3 className="font-bold text-white mb-2 text-lg">{title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { icon: Camera, num: "01", title: "Snap", desc: "Take a photo of your meal. Our AI-powered camera recognises it in seconds." },
    { icon: Activity, num: "02", title: "Analyze", desc: "Our AI identifies nutrients, macronutrients, and macros instantly." },
    { icon: Zap, num: "03", title: "Transform", desc: "Follow dietary adjustments and transform your physique results." },
  ];

  return (
    <section id="how-it-works" className="bg-[#0A0A0F] py-28 px-6 scroll-mt-16">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">How It Works</h2>
          <p className="text-slate-500">Three simple steps to your best physique.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map(({ icon: Icon, num, title, desc }) => (
            <div key={title} className="text-center group">
              <div className="relative inline-flex mb-8">
                <div className="w-20 h-20 bg-[#13131A] border border-white/5 rounded-2xl flex items-center justify-center group-hover:border-[#B8FF3C]/30 transition-all">
                  <Icon size={28} className="text-slate-400 group-hover:text-[#B8FF3C] transition-colors" />
                </div>
                <span className="absolute -top-3 -right-3 bg-[#B8FF3C] text-[#0A0A0F] text-xs font-black w-6 h-6 rounded-full flex items-center justify-center">
                  {num.slice(1)}
                </span>
              </div>
              <h3 className="text-xl font-black text-white mb-3">{title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Physique Spotlight ───────────────────────────────────────────────────────
function PhysiqueSpotlight() {
  const [slider, setSlider] = useState(50);

  return (
    <section className="bg-[#0D0D12] py-28 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#B8FF3C]/10 border border-[#B8FF3C]/20 rounded-full px-4 py-1.5 mb-6">
              <span className="w-1.5 h-1.5 bg-[#B8FF3C] rounded-full" />
              <span className="text-[#B8FF3C] text-xs font-bold tracking-widest uppercase">Physique Insight</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-white leading-tight mb-6">
              See your future<br />
              <span className="text-[#B8FF3C]">self.</span>
            </h2>
            <p className="text-slate-400 leading-relaxed mb-8">
              Stop guessing if your hard work is paying off. NutriSnap&apos;s Generative AI
              analyses your current progression and visualises your physique 3 months from now.
            </p>
            <ul className="space-y-3 mb-10">
              {[
                "Fat percentage prediction with 94% accuracy",
                "Muscle mass growth visualisations",
                "Milestone timeline tracking",
              ].map(item => (
                <li key={item} className="flex items-center gap-3 text-slate-300 text-sm">
                  <div className="w-5 h-5 rounded-full bg-[#B8FF3C]/20 flex items-center justify-center flex-shrink-0">
                    <Check size={10} className="text-[#B8FF3C]" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="bg-[#B8FF3C] text-[#0A0A0F] font-black px-7 py-3.5 rounded-xl hover:bg-[#d4ff6e] transition-colors flex items-center gap-2"
            >
              Try Physique Projection <ArrowRight size={16} />
            </Link>
          </div>
          <BeforeAfterSlider
            beforeImage={beforeImage}
            afterImage={afterImage}
            beforeLabel="CURRENT 14% BF"
            afterLabel="PROJECTED 11% BF"
          />
        </div>
      </div>
    </section>
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────
function Stats() {
  const [stats, setStats] = useState({
    totalPeople: 0,
    mealsLogged: 0,
    workoutsCreated: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stats`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const result = await res.json();
        if (result.success) {
          setStats(result.data);
        }
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      }
    };
    fetchStats();
  }, []);

  const data = [
    { val: stats.totalPeople.toString(), label: "PEOPLE ON BOARD" },
    { val: stats.mealsLogged.toString(), label: "MEALS TRACKED" },
    { val: stats.workoutsCreated.toString(), label: "PLANS BUILT" },
  ];

  return (
    <section className="bg-[#0A0A0F] py-20 px-6 border-y border-white/5">
      <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-12 md:gap-24 text-center">
        {data.map(({ val, label }) => (
          <div key={label}>
            <div className="text-5xl md:text-7xl font-black text-[#B8FF3C] mb-2">{val}</div>
            <div className="text-xs text-slate-500 tracking-widest font-bold">{label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: "Marcus Chen", goal: "Lost 18lbs in 3 months", stars: 5,
    quote: "The meal recognition is scarily accurate. It even caught my cheat day oatmeal. Truly a game changer.",
    tags: ["Fat percentage prediction with 94% accuracy"],
  },
  {
    name: "Sarah Jenkins", goal: "Gained 12lbs lean mass", stars: 5,
    quote: "I've lost 24lbs since using the projection feature. It lightened our recommended first steps perfectly.",
    tags: ["Muscle mass growth visualisations"],
  },
  {
    name: "David Kim", goal: "Performance athlete", stars: 5,
    quote: "The workout adaptation is what stands out. It shifts load intelligently so I don't burn out.",
    tags: ["Milestone timeline tracking"],
  },
];

function Testimonials() {
  return (
    <section id="testimonials" className="bg-[#0D0D12] py-28 px-6 scroll-mt-16">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-black text-white text-center mb-16">Voices of results</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map(({ name, goal, quote, stars, tags }) => (
            <div key={name} className="bg-[#13131A] border border-white/5 rounded-2xl p-7 hover:border-[#B8FF3C]/20 transition-all">
              <div className="flex gap-1 mb-4">
                {Array(stars).fill(0).map((_, i) => (
                  <Star key={i} size={14} className="text-[#B8FF3C] fill-[#B8FF3C]" />
                ))}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-6 italic">&ldquo;{quote}&rdquo;</p>
              <div className="font-bold text-white text-sm mb-1">{name}</div>
              <div className="text-slate-500 text-xs mb-4">{goal}</div>
              <ul className="space-y-1">
                {tags.map(t => (
                  <li key={t} className="text-xs text-slate-500 flex items-center gap-2">
                    <span className="w-1 h-1 bg-[#B8FF3C] rounded-full flex-shrink-0" />{t}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
const PLANS = [
  {
    name: "Free", highlight: false, badge: "", cta: "Start for Free", price: { monthly: "$0", yearly: "$0" },
    features: ["Daily Meal Logging", "Standard Macro Tracking"],
    missing: ["AI Photo Recognition", "Physique Projection", "Adaptive Workouts", "Goal & Burn Tracking"],
  },
  {
    name: "Pro", highlight: true, badge: "MOST POPULAR", cta: "Start 7-Day Free Trial", price: { monthly: "$14.99", yearly: "$9.99" },
    features: ["AI Contact Photo Recognition", "Physique Projection (Unlimited)", "Custom AI Workouts", "Goal & Burn Tracking"],
    missing: [],
  },
  {
    name: "Elite", highlight: false, badge: "", cta: "Join Elite", price: { monthly: "$29.99", yearly: "$19.99" },
    features: ["All Pro Features", "1-on-1 AI Coach Chat 24/7", "Week & Digestion Tracking", "Elite 4.3 Integration"],
    missing: [],
  },
];

function Pricing() {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="pricing" className="bg-[#0A0A0F] py-28 px-6 scroll-mt-16">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Fuel your ambition</h2>
          <div className="inline-flex items-center gap-1 bg-[#13131A] border border-white/5 rounded-full p-1.5 mt-4">
            <button
              onClick={() => setYearly(false)}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${!yearly ? "bg-white text-[#0A0A0F]" : "text-slate-400 hover:text-white"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${yearly ? "bg-white text-[#0A0A0F]" : "text-slate-400 hover:text-white"}`}
            >
              Yearly
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded transition-all ${yearly ? "bg-[#B8FF3C] text-[#0A0A0F]" : "bg-[#B8FF3C]/20 text-[#B8FF3C]"}`}>
                SAVE 33%
              </span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {PLANS.map(plan => (
            <div
              key={plan.name}
              className={`rounded-2xl p-7 border transition-all relative ${plan.highlight
                ? "bg-[#B8FF3C] border-[#B8FF3C] text-[#0A0A0F]"
                : "bg-[#13131A] border-white/5 text-white"
                }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0A0A0F] text-[#B8FF3C] text-[10px] font-black px-3 py-1 rounded-full border border-[#B8FF3C]/30 whitespace-nowrap">
                  {plan.badge}
                </div>
              )}
              <div className={`text-sm font-bold mb-1 ${plan.highlight ? "text-[#0A0A0F]/60" : "text-slate-500"}`}>
                {plan.name}
              </div>
              <div className="text-4xl font-black mb-1">
                {yearly ? plan.price.yearly : plan.price.monthly}
              </div>
              <div className={`text-xs mb-6 ${plan.highlight ? "text-[#0A0A0F]/50" : "text-slate-600"}`}>
                /month{yearly && plan.name !== "Free" ? " billed annually" : ""}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${plan.highlight ? "bg-[#0A0A0F]/15" : "bg-[#B8FF3C]/20"}`}>
                      <Check size={9} className={plan.highlight ? "text-[#0A0A0F]" : "text-[#B8FF3C]"} />
                    </div>
                    {f}
                  </li>
                ))}
                {plan.missing.map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm line-through opacity-30">
                    <div className="w-4 h-4 rounded-full flex-shrink-0 bg-white/5" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-3.5 rounded-xl font-black text-sm transition-all ${plan.highlight
                  ? "bg-[#0A0A0F] text-[#B8FF3C] hover:bg-[#0A0A0F]/80"
                  : "bg-transparent border border-white/10 text-white hover:bg-white/5"
                  }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const FAQS = [
  { q: "How accurate is the photo recognition?", a: "Our AI is trained on over 10 million food images and verified by real dietitians. It achieves a 98% accuracy rate on common foods and even identifies complex multi-ingredient recipes." },
  { q: "Does it work with my Apple Watch or Garmin?", a: "Yes, NutriSnap syncs with Apple Health, Google Fit, Garmin Connect, and most major fitness trackers to combine your activity data with nutrition insights." },
  { q: "How does Physique Projection work?", a: "You upload a current photo, set your goal (cut, bulk, or recomp) and timeframe. Our AI generates a realistic visualisation of your projected physique based on your current stats and adherence." },
  { q: "Can I use it for keto or vegan diets?", a: "Absolutely. NutriSnap supports any dietary approach including keto, vegan, vegetarian, carnivore, and custom macro ratios. You can set your own targets manually or let AI calculate them." },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-[#0D0D12] py-28 px-6 scroll-mt-16">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-black text-white text-center mb-16">Common Questions</h2>
        <div className="space-y-3">
          {FAQS.map(({ q, a }, i) => (
            <div
              key={q}
              className={`bg-[#13131A] border rounded-2xl overflow-hidden transition-all ${open === i ? "border-[#B8FF3C]/20" : "border-white/5"
                }`}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className={`font-bold text-sm ${open === i ? "text-[#B8FF3C]" : "text-white"}`}>{q}</span>
                <ChevronDown
                  size={16}
                  className={`text-slate-500 transition-transform flex-shrink-0 ml-4 ${open === i ? "rotate-180 text-[#B8FF3C]" : ""
                    }`}
                />
              </button>
              {open === i && (
                <div className="px-6 pb-6 text-slate-400 text-sm leading-relaxed border-t border-white/5 pt-4">
                  {a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section className="bg-[#0A0A0F] py-28 px-6 relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[300px] bg-[#B8FF3C]/8 blur-[100px] rounded-full" />
      </div>
      <div className="relative z-10 text-center max-w-3xl mx-auto">
        <h2 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
          Your transformation<br />starts with one Snap.
        </h2>
        <p className="text-slate-400 mb-10">
          Join 50,000+ athletes who are using AI to optimise their physique.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="bg-[#B8FF3C] text-[#0A0A0F] font-black px-8 py-4 rounded-xl hover:bg-[#d4ff6e] transition-colors flex items-center gap-2 text-sm"
          >
            Get Started Free <ArrowRight size={16} />
          </Link>
          <button
            onClick={() => scrollTo("how-it-works")}
            className="border border-white/10 text-white font-bold px-8 py-4 rounded-xl hover:bg-white/5 transition-colors flex items-center gap-2 text-sm"
          >
            <Play size={14} fill="currentColor" /> Watch Demo
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  const cols = [
    { title: "PRODUCT", links: ["Features", "Pricing", "Changelog", "Roadmap"] },
    { title: "RESOURCES", links: ["Blog", "Documentation", "API", "Integrations"] },
    { title: "COMPANY", links: ["About", "Careers", "Press", "Contact"] },
  ];

  return (
    <footer className="bg-[#0A0A0F] border-t border-white/5 px-6 pt-16 pb-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-2 mb-4"
            >
              <img src="/logo.png" alt="NutriSnap Logo" className="w-8 h-8 object-contain" />
              <span className="font-black text-white text-lg tracking-tight">NutriSnap</span>
            </button>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              AI-powered nutrition tracking and physique transformation for serious athletes.
            </p>
            <div className="flex gap-3">
              {[Instagram, Twitter, Youtube].map((Icon, i) => (
                <a
                  key={i} href="#"
                  className="w-8 h-8 bg-[#13131A] border border-white/5 rounded-lg flex items-center justify-center hover:border-[#B8FF3C]/30 transition-all group"
                >
                  <Icon size={14} className="text-slate-500 group-hover:text-[#B8FF3C] transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {cols.map(({ title, links }) => (
            <div key={title}>
              <h4 className="text-xs font-black text-slate-500 tracking-widest mb-4">{title}</h4>
              <ul className="space-y-3">
                {links.map(l => (
                  <li key={l}>
                    <a href="#" className="text-slate-400 text-sm hover:text-white transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-600 text-xs">© 2026 NutriSnap. All rights reserved.</p>
          <div className="flex gap-6 text-slate-600 text-xs">
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map(l => (
              <a key={l} href="#" className="hover:text-slate-400 transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <main className="bg-[#0A0A0F] min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <VideoShowcase />
      <PhysiqueSpotlight />
      <Stats />
      <Testimonials />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}