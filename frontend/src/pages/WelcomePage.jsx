import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  MessageSquare,
  Phone,
  Video,
  ShieldCheck,
  Zap,
  Lock,
  Users,
  Briefcase,
  EyeOff,
  Sparkles,
  Check,
  X,
  ArrowRight,
  Globe,
  Laptop,
  Smartphone,
  Sun,
  Moon,
  ScreenShare,
  Mic,
  Clock,
  Shield,
  Layers,
  Heart,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import logoLight from "../assets/logo-light.png";
import logoDark from "../assets/logo-dark.png";
import DeveloperFooter from "../components/DeveloperFooter";

export default function WelcomePage() {
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const [activeTab, setActiveTab] = useState("all");

  const comparisonData = [
    {
      feature: "Zero Personal Contact/Email Exposure",
      description: "Shows only your professional Designation instead of exposing email or phone number",
      letsConnect: true,
      whatsapp: false,
      telegram: false,
      slack: false,
    },
    {
      feature: "24-Hour Ephemeral Auto-Cleanup",
      description: "Messages automatically purge after 24 hours to protect privacy and free device storage",
      letsConnect: true,
      whatsapp: false,
      telegram: false,
      slack: false,
    },
    {
      feature: "Browser-Native HD Voice & Video Calls",
      description: "1-Click P2P calling directly in browser with no desktop software or mobile app required",
      letsConnect: true,
      whatsapp: false,
      telegram: false,
      slack: true,
    },
    {
      feature: "Screen Sharing Directly in Browser",
      description: "Share your screen instantly during video calls with a single click",
      letsConnect: true,
      whatsapp: false,
      telegram: false,
      slack: true,
    },
    {
      feature: "Cross-Network NAT Traversal (STUN + TURN)",
      description: "Guaranteed connection even across 4G/5G mobile carriers and strict corporate firewalls",
      letsConnect: true,
      whatsapp: true,
      telegram: true,
      slack: true,
    },
    {
      feature: "Voice Notes & High-Res Media Sharing",
      description: "Record voice notes and share images with instant fullscreen zoom",
      letsConnect: true,
      whatsapp: true,
      telegram: true,
      slack: true,
    },
    {
      feature: "100% Ad-Free & Zero Tracking",
      description: "No behavioral ads, algorithmic feed, or telemetry data selling",
      letsConnect: true,
      whatsapp: false,
      telegram: false,
      slack: false,
    },
    {
      feature: "Ultra-Lightweight & Instant Loading",
      description: "Fast package transfer powered by Vite and optimized WebSockets",
      letsConnect: true,
      whatsapp: false,
      telegram: true,
      slack: false,
    },
  ];

  return (
    <div className="min-h-screen w-full bg-base-300 text-base-content flex flex-col selection:bg-primary selection:text-primary-content">
      {/* ========================================================================= */}
      {/* 1. TOP STICKY NAVIGATION BAR */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-base-200/80 border-b border-base-content/10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src={theme === "dark" ? logoDark : logoLight}
              alt="Let's Connect Logo"
              className="size-9 sm:size-11 object-contain transition-transform group-hover:scale-105"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-xl tracking-tight text-base-content">
                  Let's Connect
                </span>
                <span className="badge badge-primary badge-xs sm:badge-sm font-semibold uppercase tracking-wider text-[10px]">
                  v2.0
                </span>
              </div>
              <span className="text-[10px] text-base-content/60 hidden sm:inline">
                Real-Time Messaging &amp; WebRTC Calling
              </span>
            </div>
          </Link>

          {/* Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-base-content/75">
            <a href="#features" className="hover:text-primary transition-colors">
              Features
            </a>
            <a href="#calling" className="hover:text-primary transition-colors">
              Voice &amp; Video
            </a>
            <a href="#comparison" className="hover:text-primary transition-colors">
              Comparison
            </a>
            <a href="#privacy" className="hover:text-primary transition-colors">
              Privacy &amp; Safety
            </a>
            <a href="#benefits" className="hover:text-primary transition-colors">
              Benefits
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="btn btn-ghost btn-circle btn-sm text-base-content/75 hover:text-base-content"
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
            </button>

            {authUser ? (
              <button
                type="button"
                onClick={() => navigate("/")}
                className="btn btn-primary btn-sm sm:btn-md gap-2 rounded-xl shadow-md font-semibold"
              >
                <span>Open Chat App</span>
                <ArrowRight className="size-4" />
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="btn btn-ghost btn-sm sm:btn-md text-sm font-semibold rounded-xl text-base-content/80 hover:text-base-content"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="btn btn-primary btn-sm sm:btn-md gap-1.5 rounded-xl shadow-md font-bold hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <span>Sign Up</span>
                  <Sparkles className="size-3.5 hidden sm:inline" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-16 sm:pb-28 px-4 sm:px-6 lg:px-8">
        {/* Ambient Glow Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 sm:size-[500px] bg-primary/20 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-10 size-80 bg-secondary/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto text-center relative z-10">
          {/* Release Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-base-100/80 border border-primary/30 text-xs sm:text-sm font-semibold text-primary mb-6 shadow-sm backdrop-blur-md animate-in fade-in duration-300">
            <span className="size-2 rounded-full bg-primary animate-ping" />
            <span>New: WebRTC Voice &amp; Video Calling with Screen Sharing</span>
            <ArrowRight className="size-3.5" />
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-base-content max-w-4xl mx-auto leading-[1.12]">
            Connect Freely. <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Chat Privately.
            </span>{" "}
            Zero Bloat.
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-xl text-base-content/70 max-w-2xl mx-auto leading-relaxed">
            The modern real-time communication platform engineered for clarity, ephemeral privacy, and speed.
            Experience crystal-clear voice and video calls, automated 24-hour message cleanup, and professional
            designations without exposing your personal email address.
          </p>

          {/* CTA Button Group */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 max-w-md mx-auto">
            {authUser ? (
              <button
                type="button"
                onClick={() => navigate("/")}
                className="btn btn-primary btn-lg w-full sm:w-auto gap-2.5 rounded-2xl shadow-xl hover:shadow-primary/30 font-bold text-base hover:scale-[1.02] active:scale-95 transition-all"
              >
                <span>Launch Chat App</span>
                <ArrowRight className="size-5" />
              </button>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="btn btn-primary btn-lg w-full sm:w-auto gap-2.5 rounded-2xl shadow-xl hover:shadow-primary/30 font-bold text-base hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <Sparkles className="size-5" />
                  <span>Get Started Free</span>
                </Link>
                <Link
                  to="/login"
                  className="btn btn-outline btn-lg w-full sm:w-auto rounded-2xl font-semibold text-base hover:bg-base-200"
                >
                  <span>Sign In</span>
                </Link>
              </>
            )}
          </div>

          {/* Social Proof / Pillars */}
          <div className="mt-10 sm:mt-12 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-base-content/60 font-medium">
            <div className="flex items-center gap-1.5">
              <Zap className="size-4 text-primary" />
              <span>Real-Time WebSockets</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="size-4 text-emerald-500" />
              <span>24h Auto-Cleanup</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Video className="size-4 text-secondary" />
              <span>HD WebRTC P2P</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-accent" />
              <span>Zero Email Exposure</span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* MOCKUP INTERFACE PREVIEW */}
          {/* ========================================================================= */}
          <div className="mt-12 sm:mt-16 relative mx-auto max-w-4xl rounded-2xl sm:rounded-3xl p-2 sm:p-4 bg-gradient-to-b from-primary/30 via-base-100/50 to-transparent border border-base-content/10 shadow-2xl backdrop-blur-2xl">
            <div className="rounded-xl sm:rounded-2xl overflow-hidden bg-neutral-900 border border-white/10 shadow-2xl text-left">
              {/* Window Header */}
              <div className="h-10 sm:h-12 bg-neutral-950/80 px-4 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-full bg-red-500/80" />
                  <span className="size-3 rounded-full bg-yellow-500/80" />
                  <span className="size-3 rounded-full bg-green-500/80" />
                  <span className="ml-2 text-xs font-mono text-white/50">Let's Connect v2.0</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Secure WebRTC Connected</span>
                </div>
              </div>

              {/* Window Body Simulation */}
              <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 bg-neutral-900/90 text-white min-h-[340px]">
                {/* Left Mini Sidebar */}
                <div className="hidden md:flex flex-col gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-white/10">
                    <img
                      src={`${import.meta.env.BASE_URL}avatar.png`}
                      alt="Avatar"
                      className="size-9 rounded-full ring-2 ring-primary"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-white">Hans Soni</h4>
                      <p className="text-[10px] text-emerald-400 font-medium">Software Engineer • Online</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="p-2 rounded-lg bg-primary/20 border border-primary/30 flex items-center gap-2">
                      <div className="size-7 rounded-full bg-primary/40 flex items-center justify-center font-bold text-xs">
                        A
                      </div>
                      <div className="flex-1 truncate">
                        <div className="text-xs font-semibold">Alice Johnson</div>
                        <div className="text-[10px] text-white/60 truncate">Product Designer • Online</div>
                      </div>
                    </div>
                    <div className="p-2 rounded-lg hover:bg-white/5 flex items-center gap-2 opacity-60">
                      <div className="size-7 rounded-full bg-secondary/40 flex items-center justify-center font-bold text-xs">
                        B
                      </div>
                      <div className="flex-1 truncate">
                        <div className="text-xs font-semibold">Bob Miller</div>
                        <div className="text-[10px] text-white/60 truncate">DevOps Specialist</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Chat & Call Simulation */}
                <div className="md:col-span-2 flex flex-col justify-between p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10 relative overflow-hidden">
                  {/* Chat Header Bar */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs ring-1 ring-emerald-500/40">
                        AJ
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold">Alice Johnson</h4>
                        <p className="text-[10px] text-primary font-medium">Lead Designer • Active Now</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="badge badge-success badge-sm gap-1 text-[10px]">
                        <Phone className="size-2.5" /> Call Active
                      </span>
                    </div>
                  </div>

                  {/* Messages Bubble Simulation */}
                  <div className="py-4 space-y-2.5 text-xs">
                    <div className="flex justify-start">
                      <div className="bg-neutral-800 text-white/90 p-2.5 rounded-2xl rounded-tl-sm max-w-[80%] border border-white/10 shadow-sm">
                        Hey! Have you tested the new WebRTC audio &amp; video call update? The audio streams smoothly with zero latency! 🎙️
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="bg-primary text-primary-content p-2.5 rounded-2xl rounded-tr-sm max-w-[80%] shadow-md">
                        Yes! And our personal email addresses are completely protected — it only shows our Designations now! 🚀
                      </div>
                    </div>
                  </div>

                  {/* Floating Call Bar Simulation */}
                  <div className="p-2.5 rounded-xl bg-neutral-950/90 border border-primary/40 flex items-center justify-between backdrop-blur-md">
                    <div className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[11px] font-mono font-bold text-white">Voice Call (04:18)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="p-1.5 rounded-full bg-white/10 text-white">
                        <Mic className="size-3" />
                      </div>
                      <div className="p-1.5 rounded-full bg-white/10 text-white">
                        <Video className="size-3" />
                      </div>
                      <div className="p-1.5 rounded-full bg-white/10 text-white">
                        <ScreenShare className="size-3" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. CORE FEATURES SHOWCASE */}
      {/* ========================================================================= */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-base-200/50 relative border-t border-base-content/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-primary mb-2">
              Engineered for Modern Communication
            </h2>
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-base-content tracking-tight">
              Every Feature You Need, None of the Bloat
            </h3>
            <p className="mt-4 text-base sm:text-lg text-base-content/70">
              Built from scratch with Vite, React, Express, MongoDB Atlas, and WebRTC to deliver an unbeatable, clean experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Feature 1 */}
            <div className="card bg-base-100 shadow-xl border border-base-content/10 hover:border-primary/40 transition-all hover:-translate-y-1">
              <div className="card-body p-6 sm:p-7">
                <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Phone className="size-6" />
                </div>
                <h4 className="card-title text-xl font-bold text-base-content">
                  1-on-1 Voice &amp; Video Calling
                </h4>
                <p className="text-sm text-base-content/70 leading-relaxed">
                  Direct peer-to-peer WebRTC connections with STUN and Open Relay TURN support. Call seamlessly across Wi-Fi and mobile networks with zero setup.
                </p>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-primary font-semibold">
                  <Check className="size-4" /> Global STUN / TURN Traversal
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="card bg-base-100 shadow-xl border border-base-content/10 hover:border-primary/40 transition-all hover:-translate-y-1">
              <div className="card-body p-6 sm:p-7">
                <div className="size-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center mb-4">
                  <ScreenShare className="size-6" />
                </div>
                <h4 className="card-title text-xl font-bold text-base-content">
                  In-Browser Screen Sharing
                </h4>
                <p className="text-sm text-base-content/70 leading-relaxed">
                  Share your active desktop screen, browser tab, or slide deck in real-time during video calls. Switch seamlessly back to your camera at any moment.
                </p>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-secondary font-semibold">
                  <Check className="size-4" /> Live Video Track Swapping
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="card bg-base-100 shadow-xl border border-base-content/10 hover:border-primary/40 transition-all hover:-translate-y-1">
              <div className="card-body p-6 sm:p-7">
                <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
                  <Clock className="size-6" />
                </div>
                <h4 className="card-title text-xl font-bold text-base-content">
                  24-Hour Ephemeral Retention
                </h4>
                <p className="text-sm text-base-content/70 leading-relaxed">
                  Say goodbye to bloated cloud storage and permanent data traces. Chat history cleans itself up automatically after 24 hours, keeping conversations fresh.
                </p>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-500 font-semibold">
                  <Check className="size-4" /> Automated Background Pruning
                </div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="card bg-base-100 shadow-xl border border-base-content/10 hover:border-primary/40 transition-all hover:-translate-y-1">
              <div className="card-body p-6 sm:p-7">
                <div className="size-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mb-4">
                  <Briefcase className="size-6" />
                </div>
                <h4 className="card-title text-xl font-bold text-base-content">
                  Designation Over Email Privacy
                </h4>
                <p className="text-sm text-base-content/70 leading-relaxed">
                  Keep your personal email address confidential. Set your professional designation (e.g., Software Architect, Designer) which is displayed to peers.
                </p>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-accent font-semibold">
                  <Check className="size-4" /> Zero Email Exposure
                </div>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="card bg-base-100 shadow-xl border border-base-content/10 hover:border-primary/40 transition-all hover:-translate-y-1">
              <div className="card-body p-6 sm:p-7">
                <div className="size-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
                  <Zap className="size-6" />
                </div>
                <h4 className="card-title text-xl font-bold text-base-content">
                  Sub-Millisecond WebSockets
                </h4>
                <p className="text-sm text-base-content/70 leading-relaxed">
                  Instant packet delivery with bidirectional Socket.io pipelines. Real-time typing status, live online indicators, and instantaneous read receipts.
                </p>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-500 font-semibold">
                  <Check className="size-4" /> High-Throughput Delivery
                </div>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="card bg-base-100 shadow-xl border border-base-content/10 hover:border-primary/40 transition-all hover:-translate-y-1">
              <div className="card-body p-6 sm:p-7">
                <div className="size-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
                  <ShieldCheck className="size-6" />
                </div>
                <h4 className="card-title text-xl font-bold text-base-content">
                  User Blocking &amp; Safety Controls
                </h4>
                <p className="text-sm text-base-content/70 leading-relaxed">
                  Take full control over your conversations. Block unwanted users with immediate DP concealment, purge individual chat histories, and mute device sounds.
                </p>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-rose-500 font-semibold">
                  <Check className="size-4" /> Strict Privacy &amp; Consent Tracking
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. COMPARISON WITH OTHER PLATFORMS */}
      {/* ========================================================================= */}
      <section id="comparison" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-primary mb-2">
              Transparent Comparison
            </h2>
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-base-content tracking-tight">
              Why Let's Connect is Different
            </h3>
            <p className="mt-4 text-base sm:text-lg text-base-content/70">
              See how Let's Connect stands apart from legacy corporate platforms and personal messaging apps.
            </p>
          </div>

          {/* Interactive Comparison Table */}
          <div className="overflow-x-auto rounded-3xl border border-base-content/15 shadow-2xl bg-base-100">
            <table className="table table-lg w-full">
              <thead>
                <tr className="border-b border-base-content/15 bg-base-200/80 text-xs sm:text-sm">
                  <th className="py-5 px-6 font-bold text-base-content">Capability &amp; Privacy Benefit</th>
                  <th className="py-5 px-6 font-extrabold text-primary text-center bg-primary/10 border-x border-primary/20">
                    <span className="text-base sm:text-lg">Let's Connect</span>
                    <span className="block text-[11px] font-normal text-primary/80 mt-0.5">Modern &amp; Private</span>
                  </th>
                  <th className="py-5 px-6 text-center font-bold text-base-content/70">WhatsApp</th>
                  <th className="py-5 px-6 text-center font-bold text-base-content/70">Telegram</th>
                  <th className="py-5 px-6 text-center font-bold text-base-content/70">Slack / Teams</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-content/10 text-xs sm:text-sm">
                {comparisonData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-base-200/40 transition-colors">
                    <td className="py-4 px-6 font-medium text-base-content">
                      <div className="font-bold text-sm sm:text-base">{row.feature}</div>
                      <div className="text-xs text-base-content/60 mt-0.5">{row.description}</div>
                    </td>

                    {/* Let's Connect Cell */}
                    <td className="py-4 px-6 text-center bg-primary/5 border-x border-primary/20 font-bold">
                      {row.letsConnect ? (
                        <div className="inline-flex items-center justify-center size-8 rounded-full bg-emerald-500/20 text-emerald-500">
                          <Check className="size-5 stroke-[2.5]" />
                        </div>
                      ) : (
                        <div className="inline-flex items-center justify-center size-8 rounded-full bg-error/20 text-error">
                          <X className="size-5 stroke-[2.5]" />
                        </div>
                      )}
                    </td>

                    {/* WhatsApp Cell */}
                    <td className="py-4 px-6 text-center">
                      {row.whatsapp ? (
                        <div className="inline-flex items-center justify-center size-7 rounded-full bg-base-300 text-base-content/80">
                          <Check className="size-4" />
                        </div>
                      ) : (
                        <div className="inline-flex items-center justify-center size-7 rounded-full bg-base-200 text-base-content/40">
                          <X className="size-4" />
                        </div>
                      )}
                    </td>

                    {/* Telegram Cell */}
                    <td className="py-4 px-6 text-center">
                      {row.telegram ? (
                        <div className="inline-flex items-center justify-center size-7 rounded-full bg-base-300 text-base-content/80">
                          <Check className="size-4" />
                        </div>
                      ) : (
                        <div className="inline-flex items-center justify-center size-7 rounded-full bg-base-200 text-base-content/40">
                          <X className="size-4" />
                        </div>
                      )}
                    </td>

                    {/* Slack / Teams Cell */}
                    <td className="py-4 px-6 text-center">
                      {row.slack ? (
                        <div className="inline-flex items-center justify-center size-7 rounded-full bg-base-300 text-base-content/80">
                          <Check className="size-4" />
                        </div>
                      ) : (
                        <div className="inline-flex items-center justify-center size-7 rounded-full bg-base-200 text-base-content/40">
                          <X className="size-4" />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. CORE USER BENEFITS */}
      {/* ========================================================================= */}
      <section id="benefits" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-base-200/60 border-t border-base-content/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-primary mb-2">
              Why Users Choose Us
            </h2>
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-base-content tracking-tight">
              Real Benefits for Individuals &amp; Teams
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Benefit 1 */}
            <div className="p-6 rounded-2xl bg-base-100 border border-base-content/10 shadow-lg text-center flex flex-col items-center">
              <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <EyeOff className="size-7" />
              </div>
              <h4 className="font-bold text-lg mb-2">No Identity Leakage</h4>
              <p className="text-xs sm:text-sm text-base-content/70">
                You never have to give away your private phone number or personal email address to connect with colleagues or peers.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="p-6 rounded-2xl bg-base-100 border border-base-content/10 shadow-lg text-center flex flex-col items-center">
              <div className="size-14 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center mb-4">
                <Laptop className="size-7" />
              </div>
              <h4 className="font-bold text-lg mb-2">Runs in Any Browser</h4>
              <p className="text-xs sm:text-sm text-base-content/70">
                Zero app downloads or bulky installation packages. Simply open the link on Chrome, Safari, Firefox, Edge, or mobile browsers.
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="p-6 rounded-2xl bg-base-100 border border-base-content/10 shadow-lg text-center flex flex-col items-center">
              <div className="size-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
                <Clock className="size-7" />
              </div>
              <h4 className="font-bold text-lg mb-2">Zero Storage Bloat</h4>
              <p className="text-xs sm:text-sm text-base-content/70">
                Automatic 24-hour retention keeps your device memory clean. No GBs of stale media cache eating up your device storage.
              </p>
            </div>

            {/* Benefit 4 */}
            <div className="p-6 rounded-2xl bg-base-100 border border-base-content/10 shadow-lg text-center flex flex-col items-center">
              <div className="size-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
                <Zap className="size-7" />
              </div>
              <h4 className="font-bold text-lg mb-2">Instant P2P Performance</h4>
              <p className="text-xs sm:text-sm text-base-content/70">
                High-speed package transfer with low latency media pipelines. Enjoy crisp audio and fluid 30 FPS video without lag.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. FINAL CALL TO ACTION (CTA) */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-br from-primary/90 via-primary to-secondary p-8 sm:p-14 text-white shadow-2xl relative overflow-hidden text-center">
          {/* Subtle Ambient Shapes */}
          <div className="absolute -top-16 -left-16 size-60 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 size-60 bg-black/20 rounded-full blur-2xl pointer-events-none" />

          <h3 className="text-3xl sm:text-5xl font-extrabold tracking-tight relative z-10">
            Ready to Connect with Confidence?
          </h3>
          <p className="mt-4 text-base sm:text-lg text-white/90 max-w-2xl mx-auto relative z-10">
            Join thousands of users enjoying real-time chat, HD voice &amp; video calling, and true ephemeral privacy.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            {authUser ? (
              <button
                type="button"
                onClick={() => navigate("/")}
                className="btn btn-neutral btn-lg w-full sm:w-auto px-8 rounded-2xl font-bold shadow-xl text-base hover:scale-105 active:scale-95 transition-all text-white"
              >
                <span>Go to My Chats</span>
                <ArrowRight className="size-5" />
              </button>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="btn btn-neutral btn-lg w-full sm:w-auto px-8 rounded-2xl font-bold shadow-xl text-base hover:scale-105 active:scale-95 transition-all text-white"
                >
                  <Sparkles className="size-5" />
                  <span>Create Free Account</span>
                </Link>
                <Link
                  to="/login"
                  className="btn btn-ghost btn-lg w-full sm:w-auto px-8 rounded-2xl font-semibold text-white/90 hover:text-white hover:bg-white/10"
                >
                  <span>Already Have an Account? Sign In</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. FOOTER */}
      {/* ========================================================================= */}
      <footer className="mt-auto border-t border-base-content/10 bg-base-200 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-base-content/60">
          <div className="flex items-center gap-2">
            <img
              src={theme === "dark" ? logoDark : logoLight}
              alt="Let's Connect"
              className="size-6 object-contain"
            />
            <span className="font-bold text-base-content">Let's Connect</span>
            <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-primary transition-colors">
              Sign In
            </Link>
            <Link to="/signup" className="hover:text-primary transition-colors">
              Sign Up
            </Link>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-6 pt-4 border-t border-base-content/5">
          <DeveloperFooter variant="app" />
        </div>
      </footer>
    </div>
  );
}
