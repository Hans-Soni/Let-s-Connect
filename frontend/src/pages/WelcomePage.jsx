import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import { useThemeStore } from "../store/useThemeStore";
import {
  ArrowRight,
  Bot,
  Check,
  Clock,
  Eye,
  EyeOff,
  Fingerprint,
  Gauge,
  KeyRound,
  Lock,
  Mail,
  Menu,
  Mic,
  MicOff,
  MonitorUp,
  Moon,
  Phone,
  PhoneOff,
  Plus,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
  UserX,
  Video,
  X,
  Zap,
} from "lucide-react";
import logoLight from "../assets/samvaad_logo_light.png";
import logoDark from "../assets/samvaad_logo_dark.png";
import emblemGold from "../assets/emblem_gold-sNN9olCf.png";
import emblemSilver from "../assets/emblem_silver-CXs3LN2i.png";
import "../welcome.css";

const LOGIN_URL = "https://hans-soni.github.io/Let-s-Connect/#/login";
const SIGNUP_URL = "#signup";
const LIVE_SIGNUP_URL = "https://hans-soni.github.io/Let-s-Connect/#/signup";

// Theme hook synchronizing with useThemeStore, localStorage, and <html> class
function useSamvaadTheme() {
  const { theme, setTheme } = useThemeStore();
  const dark = theme === "dark";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("samvaad-theme", dark ? "dark" : "light");
    localStorage.setItem("chat-theme", theme);
  }, [dark, theme]);

  const toggle = () => {
    setTheme(dark ? "light" : "dark");
  };

  return { dark, toggle };
}

// Reveal observer hook matching Lovable
function useReveal() {
  useEffect(() => {
    const elements = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.12 }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

// Emblem component (gold in light mode with contrast drop-shadow, silver in dark mode)
function Emblem({ className = "", dark: darkProp }) {
  const { dark: themeDark } = useSamvaadTheme();
  const dark = darkProp !== undefined ? darkProp : themeDark;

  return (
    <div aria-hidden="true" className={`pointer-events-none ${className}`}>
      <img
        src={dark ? emblemSilver : emblemGold}
        alt=""
        className="h-full w-full object-contain filter drop-shadow-sm dark:drop-shadow-none transition-opacity duration-300"
      />
    </div>
  );
}

// Orbiting Emblem ring
function EmblemOrbit({ className = "", dark: darkProp }) {
  const { dark: themeDark } = useSamvaadTheme();
  const dark = darkProp !== undefined ? darkProp : themeDark;

  return (
    <div aria-hidden="true" className={`pointer-events-none aspect-square ${className}`}>
      <div className="absolute inset-0 rounded-full bg-glow blur-2xl animate-breathe" />
      <div className="absolute inset-[6%] rounded-full border border-dashed border-gold/40 animate-spin-slow" />
      <div className="absolute inset-[18%] rounded-full border border-primary/30 animate-spin-reverse">
        <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-shine shadow-elegant" />
      </div>
      <div className="absolute inset-[30%] grid place-items-center">
        <div aria-hidden="true" className="pointer-events-none h-full w-full animate-bloom drop-shadow-2xl">
          <img
            src={dark ? emblemSilver : emblemGold}
            alt=""
            className="h-full w-full object-contain filter drop-shadow-md dark:drop-shadow-none transition-opacity duration-300"
          />
        </div>
      </div>
    </div>
  );
}

// Logo component - delivers the right high-contrast logo for light and dark modes
function Logo({ className = "", dark: darkProp }) {
  const { dark: themeDark } = useSamvaadTheme();
  const dark = darkProp !== undefined ? darkProp : themeDark;

  // In dark mode: use logoLight (light silver/white text on dark background)
  // In light mode: use logoDark (deep terracotta text on ivory background)
  return (
    <img
      src={dark ? logoLight : logoDark}
      alt="samवाद"
      className={`h-auto object-contain transition-opacity duration-300 ${className}`}
    />
  );
}

// Section heading helper
function SectionHeading({ kicker, title, sub }) {
  return (
    <div className="reveal mx-auto max-w-3xl text-center">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-shine">{kicker}</p>
      <h2 className="mt-4 text-4xl font-semibold sm:text-5xl">{title}</h2>
      {sub && <p className="mt-5 text-lg text-muted-foreground">{sub}</p>}
    </div>
  );
}

// Header component with scroll glass blur, theme toggle, and mobile menu
function Header({ dark, toggle }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    ["Features", "#features"],
    ["Calling", "#calling"],
    ["How it works", "#how"],
    ["Compare", "#compare"],
    ["Security", "#security"],
    ["FAQ", "#faq"],
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        isScrolled ? "glass border-b border-border py-2" : "py-4"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5">
        <a href="#top" className="shrink-0">
          <Logo className="h-9 w-auto sm:h-11" />
        </a>
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="grid h-10 w-10 place-items-center rounded-full border border-border transition hover:rotate-12 hover:bg-secondary"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <a
            href={LOGIN_URL}
            className="hidden rounded-full px-4 py-2 text-sm font-semibold sm:inline-block hover:text-primary"
          >
            Sign in
          </a>
          <a
            href={SIGNUP_URL}
            className="hidden rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant transition hover:-translate-y-0.5 sm:inline-block"
          >
            Start free
          </a>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Menu"
            className="grid h-10 w-10 place-items-center rounded-full border border-border lg:hidden"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {mobileMenuOpen && (
        <div className="glass mx-4 mt-3 animate-pop rounded-2xl border border-border p-3 lg:hidden">
          {navLinks.map(([label, href]) => (
            <a
              key={href}
              href={href}
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-xl px-4 py-3 font-medium hover:bg-secondary"
            >
              {label}
            </a>
          ))}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <a
              href={LOGIN_URL}
              className="rounded-xl border border-border px-4 py-3 text-center font-semibold"
            >
              Sign in
            </a>
            <a
              href={SIGNUP_URL}
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl bg-primary px-4 py-3 text-center font-semibold text-primary-foreground"
            >
              Start free
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

// Aarav Joshi Chat Card in Hero
function HeroChatCard() {
  return (
    <div className="relative mx-auto w-full max-w-md animate-float">
      <div className="absolute -inset-6 rounded-[2.5rem] bg-glow blur-2xl" />
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-elegant">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="relative grid h-10 w-10 place-items-center rounded-full bg-brand font-display font-bold text-primary-foreground">
              AJ
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-success" />
            </div>
            <div>
              <p className="text-sm font-semibold">Aarav Joshi</p>
              <p className="text-xs text-primary">Lead Designer · online</p>
            </div>
          </div>
          <div className="flex gap-2 text-muted-foreground">
            <Phone className="h-4 w-4" />
            <Video className="h-4 w-4" />
          </div>
        </div>
        <div className="space-y-3 p-5">
          <div className="flex animate-pop" style={{ animationDelay: "0.4s" }}>
            <p className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm rounded-bl-sm bg-secondary">
              Namaste! Tried the new HD video call yet? 🎙️
            </p>
          </div>
          <div className="flex animate-pop justify-end" style={{ animationDelay: "1.4s" }}>
            <p className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm rounded-br-sm bg-primary text-primary-foreground">
              Yes — crystal clear. And it only shows my designation, not my email ✨
            </p>
          </div>
          <div className="flex animate-pop" style={{ animationDelay: "2.4s" }}>
            <p className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm rounded-bl-sm bg-secondary">
              Perfect. Sharing my screen now…
            </p>
          </div>
          <div className="flex animate-pop gap-1 rounded-2xl bg-secondary px-4 py-3 w-fit" style={{ animationDelay: "3.2s" }}>
            <span className="h-2 w-2 animate-dot rounded-full bg-muted-foreground" style={{ animationDelay: "0s" }} />
            <span className="h-2 w-2 animate-dot rounded-full bg-muted-foreground" style={{ animationDelay: "0.15s" }} />
            <span className="h-2 w-2 animate-dot rounded-full bg-muted-foreground" style={{ animationDelay: "0.3s" }} />
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-border bg-muted px-5 py-3">
          <span className="flex items-center gap-2 font-mono text-xs">
            <span className="h-2 w-2 rounded-full bg-success" />
            Voice call · 04:18
          </span>
          <span className="flex h-5 items-end gap-0.5">
            <span className="h-full w-1 animate-wave rounded-full bg-primary" style={{ animationDelay: "0s" }} />
            <span className="h-full w-1 animate-wave rounded-full bg-primary" style={{ animationDelay: "0.12s" }} />
            <span className="h-full w-1 animate-wave rounded-full bg-primary" style={{ animationDelay: "0.24s" }} />
            <span className="h-full w-1 animate-wave rounded-full bg-primary" style={{ animationDelay: "0.36s" }} />
            <span className="h-full w-1 animate-wave rounded-full bg-primary" style={{ animationDelay: "0.48s" }} />
          </span>
        </div>
      </div>
    </div>
  );
}

// Hero section
function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pb-24 pt-36 sm:pt-44">
      <div className="grain absolute inset-0 opacity-60" />
      <Emblem className="absolute -left-10 bottom-10 h-40 w-56 opacity-30 dark:opacity-10 animate-float" />
      <Emblem className="absolute right-[42%] top-28 h-16 w-24 opacity-40 dark:opacity-20 animate-float [animation-delay:2s]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-5 lg:grid-cols-[1.1fr_1fr]">
        <div className="reveal">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> New · HD calling with screen sharing
          </span>
          <h1 className="mt-6 text-5xl font-semibold leading-[1.02] sm:text-7xl">
            Every conversation,<br />
            <span className="text-gradient italic">beautifully private.</span>
          </h1>
          <p className="mt-4 font-deva text-2xl text-muted-foreground">
            संवाद — where dialogue feels human again.
          </p>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Real-time chat, crystal-clear voice &amp; video and messages that clean themselves up after 24 hours — without ever exposing your email or phone number.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href={SIGNUP_URL}
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-4 font-semibold text-primary-foreground shadow-elegant transition hover:-translate-y-1"
            >
              Start chatting free <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </a>
            <a
              href={LOGIN_URL}
              className="rounded-full border border-border px-7 py-4 font-semibold transition hover:bg-secondary"
            >
              Sign in
            </a>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />Real-time WebSockets
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />24h auto-cleanup
            </span>
            <span className="flex items-center gap-2">
              <Video className="h-4 w-4 text-primary" />HD P2P calls
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />Zero email exposure
            </span>
          </div>
        </div>
        <div className="reveal relative">
          <EmblemOrbit className="absolute left-1/2 top-1/2 w-[140%] max-w-[680px] -translate-x-1/2 -translate-y-1/2" />
          <HeroChatCard />
        </div>
      </div>
    </section>
  );
}

// Marquee ticker
function Marquee() {
  const items = [
    "WebRTC P2P",
    "Screen sharing",
    "Socket.io realtime",
    "STUN + TURN",
    "Voice notes",
    "Read receipts",
    "No ads",
    "No tracking",
    "Designation privacy",
    "24h ephemeral",
  ];
  return (
    <div className="overflow-hidden border-y border-border bg-secondary py-5">
      <div className="flex w-max animate-marquee gap-10">
        {[...items, ...items].map((text, idx) => (
          <span key={idx} className="flex items-center gap-10 font-display text-xl italic text-muted-foreground">
            {text}
            <span className="text-shine">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// Features section
function Features() {
  const featuresList = [
    {
      icon: Phone,
      title: "1-on-1 Voice & Video",
      desc: "Direct peer-to-peer WebRTC with STUN and TURN support — call across Wi-Fi and mobile networks with zero setup.",
      tag: "Global NAT traversal",
    },
    {
      icon: MonitorUp,
      title: "In-browser Screen Sharing",
      desc: "Share your desktop, a tab or a slide deck live during calls, then swap back to your camera in a click.",
      tag: "Live track swapping",
    },
    {
      icon: Clock,
      title: "24-hour Ephemeral Chats",
      desc: "No permanent traces, no bloated storage. Chat history quietly cleans itself after 24 hours.",
      tag: "Automated pruning",
    },
    {
      icon: UserX,
      title: "Designation, not Email",
      desc: "Peers see your professional designation — Architect, Designer — never your personal email.",
      tag: "Zero email exposure",
    },
    {
      icon: Zap,
      title: "Instant WebSockets",
      desc: "Bidirectional Socket.io pipelines power typing status, online presence and instant read receipts.",
      tag: "High-throughput delivery",
    },
    {
      icon: ShieldCheck,
      title: "Blocking & Safety",
      desc: "Block unwanted users with immediate picture concealment, purge chats and mute sounds anytime.",
      tag: "Consent first",
    },
  ];

  return (
    <section id="features" className="relative py-28">
      <div className="mx-auto max-w-7xl px-5">
        <SectionHeading
          kicker="Crafted for modern dialogue"
          title={
            <>
              Everything you need, <span className="text-gradient italic">nothing you don't</span>
            </>
          }
          sub="Built with Vite, React, Express, MongoDB Atlas and WebRTC for a clean, lightning-fast experience."
        />
        <div className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {featuresList.map((item, index) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="reveal group relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-card transition duration-500 hover:-translate-y-2 hover:shadow-elegant"
                style={{ transitionDelay: `${index * 70}ms` }}
              >
                <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-glow opacity-0 transition duration-500 group-hover:opacity-100" />
                <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-brand text-primary-foreground transition duration-500 group-hover:rotate-6 group-hover:scale-110">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="relative mt-6 text-2xl font-semibold">{item.title}</h3>
                <p className="relative mt-3 text-muted-foreground">{item.desc}</p>
                <p className="relative mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  <Check className="h-4 w-4" />
                  {item.tag}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// How it works section
function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Create your account",
      desc: "Sign up with a name, email and password. Passwords are hashed with bcrypt and you accept the versioned terms — your consent is recorded with time and source.",
    },
    {
      num: "02",
      title: "Set your designation",
      desc: 'Choose how peers know you — “Software Architect”, “Designer”. Your email stays hidden from every other user.',
    },
    {
      num: "03",
      title: "Chat in real time",
      desc: "Socket.io delivers messages instantly with typing status, online presence, read receipts, voice notes and image sharing.",
    },
    {
      num: "04",
      title: "Call & share screen",
      desc: "Start a peer-to-peer WebRTC voice or video call in one click and swap your camera for your screen at any moment.",
    },
    {
      num: "05",
      title: "Let it fade away",
      desc: "A background job sweeps every minute and removes messages older than 24 hours — including their stored images and voice notes.",
    },
  ];

  return (
    <section id="how" className="py-28">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading
          kicker="How it works"
          title={
            <>
              From hello to <span className="text-gradient italic">gone in 24 hours</span>
            </>
          }
          sub="The life of a conversation on samवाद, step by step."
        />
        <ol className="relative mt-16 space-y-6 before:absolute before:bottom-6 before:left-7 before:top-6 before:w-px before:bg-border md:before:left-1/2">
          {steps.map((step, idx) => {
            const isEven = idx % 2 === 1;
            return (
              <li
                key={step.num}
                className={`reveal relative grid gap-4 pl-20 md:grid-cols-2 md:gap-16 md:pl-0 ${
                  !isEven ? "md:[&>div]:col-start-1" : ""
                }`}
              >
                <span className="absolute left-0 top-0 grid h-14 w-14 place-items-center rounded-full border-2 border-primary bg-background font-display text-lg font-semibold text-primary md:left-1/2 md:-translate-x-1/2">
                  {step.num}
                </span>
                <div
                  className={`rounded-3xl border border-border bg-card p-6 shadow-card ${
                    !isEven ? "md:text-right" : "md:col-start-2"
                  }`}
                >
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="mt-2 text-muted-foreground">{step.desc}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

// Calling section with interactive mute button
function CallingSection() {
  const [isMuted, setIsMuted] = useState(false);

  return (
    <section id="calling" className="relative overflow-hidden bg-secondary py-28">
      <EmblemOrbit className="absolute -right-40 top-1/2 w-[520px] -translate-y-1/2 opacity-40" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-2">
        <div className="reveal">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-shine">Voice · Video · Screen</p>
          <h2 className="mt-4 text-4xl font-semibold sm:text-5xl">
            Face-to-face, <span className="text-gradient italic">right in your browser</span>
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            One click starts a peer-to-peer HD call. No downloads, no plugins — fluid 30 FPS video and crisp audio across 4G, 5G and strict firewalls.
          </p>
          <ul className="mt-8 space-y-4">
            {[
              "Peer-to-peer encrypted media streams",
              "STUN + Open Relay TURN fallback",
              "Swap camera ↔ screen mid-call",
            ].map((text) => (
              <li key={text} className="flex items-center gap-3">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-4 w-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <div className="reveal">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-4 shadow-elegant">
            <div className="relative grid aspect-video place-items-center overflow-hidden rounded-2xl bg-brand">
              <div className="relative grid place-items-center">
                <span className="absolute h-28 w-28 animate-ring rounded-full border-2 border-primary-foreground" />
                <span
                  className="absolute h-28 w-28 animate-ring rounded-full border-2 border-primary-foreground"
                  style={{ animationDelay: "1.2s" }}
                />
                <div className="grid h-28 w-28 place-items-center rounded-full bg-card font-display text-4xl font-bold text-primary">
                  PS
                </div>
              </div>
              <p className="absolute bottom-4 left-4 rounded-full bg-card/80 px-3 py-1 text-xs font-semibold">
                Priya Sharma · Software Architect
              </p>
              <div className="absolute right-4 top-4 h-24 w-36 rounded-xl border-2 border-card bg-secondary grid place-items-center text-xs font-semibold text-muted-foreground">
                You
              </div>
            </div>
            <div className="mt-4 flex justify-center gap-3">
              <button
                onClick={() => setIsMuted(!isMuted)}
                aria-label="Toggle mute"
                className="grid h-12 w-12 place-items-center rounded-full bg-secondary transition hover:scale-110"
              >
                {isMuted ? <MicOff className="h-5 w-5 text-destructive" /> : <Mic className="h-5 w-5" />}
              </button>
              <span className="grid h-12 w-12 place-items-center rounded-full bg-secondary">
                <Video className="h-5 w-5" />
              </span>
              <span className="grid h-12 w-12 place-items-center rounded-full bg-secondary">
                <MonitorUp className="h-5 w-5" />
              </span>
              <span className="grid h-12 w-12 place-items-center rounded-full bg-destructive text-destructive-foreground">
                <PhoneOff className="h-5 w-5" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Privacy section with real-time 24h countdown
function PrivacySection() {
  const [hoursLeft, setHoursLeft] = useState(24);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = window.setInterval(() => {
      setHoursLeft((prev) => (prev <= 0 ? 24 : prev - 1));
    }, 900);
    return () => clearInterval(timerRef.current);
  }, []);

  const circumference = 2 * Math.PI * 88;
  const dashOffset = circumference * (1 - hoursLeft / 24);

  return (
    <section id="privacy" className="bg-secondary py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-2">
        <div className="reveal order-2 lg:order-1">
          <div className="relative mx-auto grid aspect-square max-w-sm place-items-center">
            <svg viewBox="0 0 200 200" className="absolute inset-0 -rotate-90">
              <circle cx="100" cy="100" r="88" fill="none" stroke="var(--border)" strokeWidth="10" />
              <circle
                cx="100"
                cy="100"
                r="88"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transition: "stroke-dashoffset 0.8s ease" }}
              />
            </svg>
            <div className="text-center">
              <Lock className="mx-auto h-8 w-8 text-primary" />
              <p className="mt-2 font-display text-6xl font-semibold">{hoursLeft}h</p>
              <p className="text-sm text-muted-foreground">until this chat disappears</p>
            </div>
          </div>
        </div>
        <div className="reveal order-1 lg:order-2">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-shine">Privacy &amp; safety</p>
          <h2 className="mt-4 text-4xl font-semibold sm:text-5xl">
            Your words, <span className="text-gradient italic">your control</span>
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            Conversations live for a day, then vanish. Your identity stays yours — only your designation is ever shown.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <Clock className="h-5 w-5 text-primary" />
              <span className="font-semibold">Self-cleaning chats</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <UserX className="h-5 w-5 text-primary" />
              <span className="font-semibold">Block &amp; hide pictures</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <Lock className="h-5 w-5 text-primary" />
              <span className="font-semibold">No email exposure</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span className="font-semibold">No ads, no tracking</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Security section
function SecuritySection() {
  const securityFeatures = [
    {
      icon: KeyRound,
      title: "AES-256-GCM at rest",
      desc: "Every message is encrypted before it reaches the database, with an authentication tag that detects tampering.",
    },
    {
      icon: RefreshCw,
      title: "Keys rotate twice a day",
      desc: "A versioned key ring rotates at 00:00 and 12:00 IST. Older messages stay readable; new ones always use a fresh key.",
    },
    {
      icon: Fingerprint,
      title: "Signed sessions",
      desc: "JSON Web Tokens in secure cookies authenticate both API calls and live socket connections.",
    },
    {
      icon: Bot,
      title: "Bot & attack shield",
      desc: "Arcjet blocks automated bots and common attacks like SQL injection before they reach the app.",
    },
    {
      icon: Gauge,
      title: "Rate limiting",
      desc: "100 requests per 15 minutes per client, tracked in Redis with an automatic fallback limiter.",
    },
    {
      icon: Shield,
      title: "Input hardening",
      desc: "Helmet security headers, MongoDB query sanitising and XSS cleaning on every request.",
    },
  ];

  return (
    <section id="security" className="relative overflow-hidden bg-secondary py-28">
      <Emblem className="absolute -left-16 top-16 h-48 w-64 -rotate-12 opacity-30 dark:opacity-10 animate-float" />
      <div className="relative mx-auto max-w-7xl px-5">
        <SectionHeading
          kicker="Security under the hood"
          title={
            <>
              Built like a vault, <span className="text-gradient italic">feels like a chat</span>
            </>
          }
          sub="Privacy isn't a setting on samवाद — it's how the backend is engineered."
        />
        <div className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {securityFeatures.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="reveal group flex gap-4 rounded-3xl border border-border bg-card p-6 transition duration-500 hover:-translate-y-1 hover:shadow-elegant"
                style={{ transitionDelay: `${idx * 60}ms` }}
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-border bg-secondary text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Compare section
function CompareSection() {
  const matrix = [
    ["Zero email / phone exposure", "Only your designation is shown", [true, false, false, false]],
    ["24-hour ephemeral cleanup", "Messages purge themselves automatically", [true, false, false, false]],
    ["Browser-native HD calls", "No desktop or mobile app needed", [true, false, false, false]],
    ["In-browser screen sharing", "One-click during video calls", [true, false, false, false]],
    ["STUN + TURN traversal", "Connects across carriers & firewalls", [true, true, true, true]],
    ["Voice notes & HD media", "Fullscreen zoom on images", [true, true, true, true]],
    ["100% ad-free, zero tracking", "No algorithmic feed or data selling", [true, false, true, false]],
    ["Ultra-lightweight loading", "Vite + optimized WebSockets", [true, false, true, false]],
  ];

  return (
    <section id="compare" className="py-28">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading
          kicker="Honest comparison"
          title={
            <>
              Why <span className="font-deva text-gradient">samवाद</span> feels different
            </>
          }
          sub="How we stand apart from corporate suites and personal messengers."
        />
        <div className="reveal mt-14 overflow-x-auto rounded-3xl border border-border bg-card shadow-card">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-border text-sm">
                <th className="p-5 font-semibold text-muted-foreground">Capability</th>
                <th className="bg-primary p-5 text-center font-deva text-lg text-primary-foreground">samवाद</th>
                {["WhatsApp", "Telegram", "Slack / Teams"].map((c) => (
                  <th key={c} className="p-5 text-center font-semibold text-muted-foreground">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map(([feature, subtitle, values]) => (
                <tr key={feature} className="border-b border-border last:border-0 transition hover:bg-muted">
                  <td className="p-5">
                    <p className="font-semibold">{feature}</p>
                    <p className="text-sm text-muted-foreground">{subtitle}</p>
                  </td>
                  {values.map((val, i) => (
                    <td key={i} className={`p-5 text-center ${i === 0 ? "bg-primary/10" : ""}`}>
                      {val ? (
                        <Check className="mx-auto h-5 w-5 text-primary" />
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// Benefits section
function BenefitsSection() {
  const benefits = [
    {
      icon: UserX,
      title: "No identity leakage",
      desc: "Connect with colleagues without handing out your phone number or personal email.",
    },
    {
      icon: MonitorUp,
      title: "Runs in any browser",
      desc: "Chrome, Safari, Firefox, Edge or mobile — just open the link. Nothing to install.",
    },
    {
      icon: Clock,
      title: "Zero storage bloat",
      desc: "24-hour retention keeps your device clean. No gigabytes of stale media cache.",
    },
    {
      icon: Zap,
      title: "Instant P2P speed",
      desc: "Low-latency media pipelines for crisp audio and fluid 30 FPS video.",
    },
  ];

  return (
    <section id="benefits" className="py-28">
      <div className="mx-auto max-w-7xl px-5">
        <SectionHeading
          kicker="Why people choose us"
          title={
            <>
              Real benefits for <span className="text-gradient italic">people &amp; teams</span>
            </>
          }
        />
        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="reveal rounded-3xl border border-border bg-card p-6 shadow-card transition duration-500 hover:-translate-y-2 hover:shadow-elegant"
                style={{ transitionDelay: `${idx * 70}ms` }}
              >
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Stack section
function StackSection() {
  const stack = [
    ["Frontend", ["React 19", "Vite", "Zustand", "React Router", "Socket.io client", "Axios"]],
    ["Realtime & media", ["Socket.io", "WebRTC", "STUN / TURN", "Cloudinary"]],
    ["Backend", ["Node.js", "Express", "MongoDB Atlas", "Mongoose", "node-cron"]],
    ["Security & services", ["Arcjet", "Upstash Redis", "JWT", "bcrypt", "Helmet", "Resend email"]],
  ];

  return (
    <section id="stack" className="py-28">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading
          kicker="The technology"
          title={
            <>
              A modern stack, <span className="text-gradient italic">end to end</span>
            </>
          }
          sub="Full-stack MERN with realtime sockets and peer-to-peer media."
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          {stack.map(([category, techList]) => (
            <div key={category} className="reveal rounded-3xl border border-border bg-card p-6 shadow-card">
              <h3 className="text-lg font-semibold">{category}</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {techList.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full border border-border bg-secondary px-3.5 py-1.5 text-xs font-medium text-foreground"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// FAQ section with animated accordion
function FaqSection() {
  const [activeFaq, setActiveFaq] = useState(0);

  const faqs = [
    [
      "Do I need to install anything?",
      "No. samवाद runs entirely in your browser — Chrome, Safari, Firefox, Edge or mobile. Calls and screen sharing work without plugins.",
    ],
    [
      "Can other users see my email address?",
      "Never. Other people only see your name and the designation you choose.",
    ],
    [
      "What exactly happens after 24 hours?",
      "A cleanup job runs every minute. Messages older than 24 hours are deleted, along with any images or voice notes attached to them.",
    ],
    [
      "Are my messages encrypted?",
      "Yes. Messages are stored with AES-256-GCM encryption using keys that rotate twice a day. Calls travel directly between devices over WebRTC.",
    ],
    [
      "Will calls work on mobile data or office Wi-Fi?",
      "Yes. STUN and TURN relay servers help calls connect across 4G/5G carriers and strict corporate firewalls.",
    ],
    [
      "Can I block someone?",
      "Yes. Blocking hides your profile picture from them immediately, and you can clear a chat history or mute sounds anytime.",
    ],
  ];

  return (
    <section id="faq" className="py-28">
      <div className="mx-auto max-w-3xl px-5">
        <SectionHeading
          kicker="Questions"
          title={
            <>
              Frequently <span className="text-gradient italic">asked</span>
            </>
          }
        />
        <div className="mt-12 space-y-3">
          {faqs.map(([q, a], idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={q}
                className={`reveal overflow-hidden rounded-2xl border bg-card transition ${
                  isOpen ? "border-primary shadow-card" : "border-border"
                }`}
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left font-semibold"
                >
                  <span>{q}</span>
                  <Plus className={`h-5 w-5 shrink-0 text-primary transition duration-300 ${isOpen ? "rotate-45" : ""}`} />
                </button>
                <div
                  className={`grid transition-all duration-300 ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <p className="overflow-hidden px-5 text-muted-foreground">
                    <span className="block pb-5">{a}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// CTA Banner
function CtaBanner() {
  return (
    <section className="px-5 pb-28">
      <div className="reveal relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-brand px-8 py-20 text-center text-primary-foreground shadow-elegant">
        <Emblem className="absolute -right-10 -top-6 h-48 w-72 rotate-12 opacity-35 dark:opacity-20 animate-float" />
        <Emblem className="relative mx-auto h-20 w-28 animate-bloom" />
        <h2 className="relative mt-6 text-4xl font-semibold sm:text-6xl">
          Begin your <span className="font-deva">संवाद</span>
        </h2>
        <p className="relative mx-auto mt-5 max-w-xl text-lg opacity-90">
          Join people enjoying real-time chat, HD calling and true ephemeral privacy.
        </p>
        <div className="relative mt-9 flex flex-wrap justify-center gap-3">
          <a
            href={SIGNUP_URL}
            className="rounded-full bg-card px-8 py-4 font-semibold text-foreground transition hover:-translate-y-1"
          >
            Create free account
          </a>
          <a
            href={LOGIN_URL}
            className="rounded-full border-2 border-primary-foreground/60 px-8 py-4 font-semibold transition hover:bg-primary-foreground/10"
          >
            I already have an account
          </a>
        </div>
      </div>
    </section>
  );
}

// Signup section
function SignupSection() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <section id="signup" aria-labelledby="signup-heading" className="scroll-mt-24 border-t border-border bg-secondary py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-2 lg:gap-20">
        <div className="min-w-0">
          <div aria-hidden="true" className="relative mb-8 h-32 w-32">
            <div className="absolute inset-0 animate-spin-slow rounded-full border border-dashed border-gold/50" />
            <Emblem className="absolute inset-5 h-22 w-22 animate-bloom" />
          </div>
          <p className="text-sm font-semibold text-primary">A new conversation starts here</p>
          <h2 id="signup-heading" className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
            Join <span className="font-deva text-primary">samवाद.</span>
          </h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">
            A little less noise. A little more connection. Make room for conversations that matter.
          </p>
          <div className="mt-8 flex items-start gap-3 border-l-2 border-primary pl-5">
            <ShieldAlert className="mt-1 h-5 w-5 shrink-0 text-primary" />
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              Your email is for your account, not your public identity. Other people see your name and designation.
            </p>
          </div>
        </div>
        <div className="min-w-0 rounded-lg border border-border bg-card p-6 shadow-card sm:p-9">
          <Logo className="mb-7 h-10 max-w-full object-contain object-left" />
          <h3 className="text-2xl font-semibold">Create your account</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Already part of the conversation?{" "}
            <a href={LOGIN_URL} className="text-primary underline hover:text-primary/80">
              Sign in
            </a>
          </p>
          {isSubmitted ? (
            <div className="mt-8 space-y-5" role="status">
              <div className="flex items-center gap-3 text-primary">
                <Check className="h-5 w-5" />
                <h4 className="font-semibold">Continue in the live app</h4>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Your account hasn’t been created yet. Enter your details again in the live app and review its Terms &amp; Data Authorization to finish signing up. Nothing entered here has been sent or saved.
              </p>
              <a
                href={LIVE_SIGNUP_URL}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground shadow transition hover:opacity-90"
              >
                Open signup <ArrowRight className="h-4 w-4" />
              </a>
              <button
                type="button"
                onClick={() => setIsSubmitted(false)}
                className="h-10 w-full rounded-lg text-sm font-medium hover:bg-secondary transition"
              >
                Back to form
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div className="space-y-2">
                <label htmlFor="signup-name" className="block text-sm font-medium">
                  Full name
                </label>
                <div className="relative">
                  <User aria-hidden="true" className="pointer-events-none absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
                  <input
                    id="signup-name"
                    name="fullName"
                    autoComplete="name"
                    placeholder="Your full name"
                    required
                    pattern=".*\S.*"
                    className="h-12 w-full rounded-md border border-input bg-background pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="signup-email" className="block text-sm font-medium">
                  Email address
                </label>
                <div className="relative">
                  <Mail aria-hidden="true" className="pointer-events-none absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
                  <input
                    id="signup-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    required
                    className="h-12 w-full rounded-md border border-input bg-background pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="signup-password" className="block text-sm font-medium">
                  Password
                </label>
                <div className="relative">
                  <Lock aria-hidden="true" className="pointer-events-none absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
                  <input
                    id="signup-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Create a password"
                    minLength={6}
                    maxLength={128}
                    required
                    aria-describedby="signup-password-hint"
                    className="h-12 w-full rounded-md border border-input bg-background pl-10 pr-12 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1.5 top-1.5 grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-secondary"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p id="signup-password-hint" className="text-xs text-muted-foreground">
                  Use 6–128 characters.
                </p>
              </div>
              <button
                type="submit"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground shadow transition hover:opacity-90"
              >
                Continue to signup <ArrowRight className="h-4 w-4" />
              </button>
              <p className="text-center text-xs leading-relaxed text-muted-foreground">
                Signup finishes in the live app, where you’ll review the Terms &amp; Data Authorization. Details entered here are not sent or saved.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-5 md:flex-row">
        <Logo className="h-10 w-auto" />
        <p className="text-center text-sm text-muted-foreground">
          Created by Hans Soni — Full-Stack Developer &amp; Cybersecurity Engineer ·{" "}
          <a
            href="https://hans-soni.github.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            hans-soni.github.io
          </a>
        </p>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} samवाद · All rights reserved.
        </p>
      </div>
    </footer>
  );
}

// Main WelcomePage Component
export default function WelcomePage() {
  const { dark, toggle } = useSamvaadTheme();
  useReveal();

  return (
    <div className={`welcome-page min-h-screen overflow-x-hidden ${dark ? "dark" : ""}`}>
      <Header dark={dark} toggle={toggle} />
      <main>
        <Hero />
        <Marquee />
        <Features />
        <HowItWorks />
        <CallingSection />
        <PrivacySection />
        <SecuritySection />
        <CompareSection />
        <BenefitsSection />
        <StackSection />
        <FaqSection />
        <CtaBanner />
        <SignupSection />
      </main>
      <Footer />
    </div>
  );
}
