import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import { useThemeStore } from "../store/useThemeStore";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import {
  ArrowRight,
  Bot,
  Check,
  Clock,
  Download,
  Eye,
  EyeOff,
  Fingerprint,
  Gauge,
  KeyRound,
  Lock,
  Mail,
  Menu,
  MessageSquare,
  Mic,
  MicOff,
  MonitorUp,
  Moon,
  Phone,
  PhoneOff,
  Plus,
  RefreshCw,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Laptop,
  Sparkles,
  Star,
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
import { InstallAppButton } from "../components/InstallAppBanner";

const LOGIN_URL = "https://hans-soni.github.io/Let-s-Connect/#/login";
const SIGNUP_URL = "https://hans-soni.github.io/Let-s-Connect/#/signup";
const FEEDBACK_URL = "#feedback";

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

  return (
    <img
      src={dark ? logoDark : logoLight}
      alt="Samवाद"
      className={`object-contain transition-opacity duration-300 ${className}`}
      style={{ maxHeight: "36px", maxWidth: "160px", width: "auto", height: "auto" }}
    />
  );
}

// Section heading helper
function SectionHeading({ kicker, title, sub }) {
  return (
    <div className="reveal mx-auto max-w-3xl text-center">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-shine">{kicker}</p>
      <h2 className="mt-3 text-3xl font-semibold sm:text-4xl md:text-5xl">{title}</h2>
      {sub && <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-muted-foreground">{sub}</p>}
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
    { label: "Features", targetId: "features" },
    { label: "How it works", targetId: "how" },
    { label: "Calling", targetId: "calling" },
    { label: "Security", targetId: "security" },
    { label: "Compare", targetId: "compare" },
    { label: "App", targetId: "app" },
    { label: "FAQ", targetId: "faq" },
    { label: "Feedback", targetId: "feedback" },
  ];

  const handleNavClick = (e, targetId) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        isScrolled ? "glass border-b border-border py-2" : "py-3 sm:py-4"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-5">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="shrink-0 flex items-center cursor-pointer"
        >
          <Logo className="h-8 w-auto sm:h-10" />
        </a>
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map(({ label, targetId }) => (
            <a
              key={targetId}
              href={`#${targetId}`}
              onClick={(e) => handleNavClick(e, targetId)}
              className="cursor-pointer rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-full border border-border transition hover:rotate-12 hover:bg-secondary cursor-pointer"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <InstallAppButton className="hidden sm:inline-flex rounded-full border border-primary/40 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground shadow-sm" />
          <a
            href={LOGIN_URL}
            className="hidden rounded-full px-4 py-2 text-sm font-semibold md:inline-block hover:text-primary"
          >
            Sign in
          </a>
          <a
            href={SIGNUP_URL}
            className="hidden rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant transition hover:-translate-y-0.5 md:inline-block"
          >
            Start free
          </a>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Menu"
            className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-full border border-border md:hidden cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {mobileMenuOpen && (
        <div className="glass mx-4 mt-3 animate-pop rounded-2xl border border-border p-3 lg:hidden">
          {navLinks.map(({ label, targetId }) => (
            <a
              key={targetId}
              href={`#${targetId}`}
              onClick={(e) => handleNavClick(e, targetId)}
              className="block cursor-pointer rounded-xl px-4 py-3 font-medium hover:bg-secondary"
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
          <div className="mt-2">
            <InstallAppButton className="w-full justify-center rounded-xl bg-primary/10 border border-primary/30 py-3 text-sm font-semibold text-primary hover:bg-primary hover:text-primary-foreground" />
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
      <div className="absolute -inset-3 sm:-inset-6 rounded-[2.5rem] bg-glow blur-2xl pointer-events-none" />
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
    <section id="top" className="relative overflow-hidden pb-16 pt-24 sm:pb-24 sm:pt-36 md:pt-40">
      <Emblem className="hidden md:block absolute -left-10 bottom-10 h-40 w-56 opacity-30 dark:opacity-10 animate-float" />
      <Emblem className="hidden md:block absolute right-[42%] top-28 h-16 w-24 opacity-40 dark:opacity-20 animate-float [animation-delay:2s]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 sm:gap-16 px-4 sm:px-5 lg:grid-cols-[1.1fr_1fr]">
        <div className="reveal">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3.5 py-1.5 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5 shrink-0" /> New · HD calling with screen sharing
          </span>
          <h1 className="mt-5 sm:mt-6 text-3xl sm:text-5xl lg:text-6xl font-semibold leading-[1.1]">
            Every conversation,<br />
            <span className="text-gradient italic">beautifully private.</span>
          </h1>
          <p className="mt-3 sm:mt-4 font-deva text-xl sm:text-2xl text-muted-foreground">
            Samवाद — where dialogue feels human again.
          </p>
          <p className="mt-4 sm:mt-6 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            Real-time chat, crystal-clear voice &amp; video and messages that clean themselves up after 24 hours — without ever exposing your email or phone number.
          </p>
          <div className="mt-7 sm:mt-9 flex flex-col sm:flex-row gap-3">
            <a
              href={SIGNUP_URL}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 sm:py-4 font-semibold text-primary-foreground shadow-elegant transition hover:-translate-y-1 text-center"
            >
              Start chatting free <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </a>
            <a
              href={LOGIN_URL}
              className="rounded-full border border-border px-7 py-3.5 sm:py-4 font-semibold transition hover:bg-secondary text-center"
            >
              Sign in
            </a>
            <InstallAppButton className="rounded-full border border-primary/30 bg-primary/10 px-6 py-3.5 sm:py-4 font-semibold text-primary hover:bg-primary hover:text-primary-foreground text-center justify-center shadow-sm">
              <Download className="h-4 w-4" />
              <span>Install App</span>
            </InstallAppButton>
          </div>
          <div className="mt-8 sm:mt-10 grid grid-cols-2 sm:flex sm:flex-wrap gap-x-4 sm:gap-x-6 gap-y-3 text-xs sm:text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Zap className="h-4 w-4 shrink-0 text-primary" />Real-time WebSockets
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0 text-primary" />24h auto-cleanup
            </span>
            <span className="flex items-center gap-2">
              <Video className="h-4 w-4 shrink-0 text-primary" />HD P2P calls
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />Zero email exposure
            </span>
          </div>
        </div>
        <div className="reveal relative mt-12 sm:mt-16 lg:mt-0">
          <EmblemOrbit className="absolute left-1/2 top-1/2 w-[85%] sm:w-[110%] lg:w-[140%] max-w-[300px] sm:max-w-[460px] lg:max-w-[680px] -translate-x-1/2 -translate-y-1/2" />
          <div className="relative z-10">
            <HeroChatCard />
          </div>
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
    <section id="features" className="relative scroll-mt-24 py-16 sm:py-24 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-5">
        <SectionHeading
          kicker="Crafted for modern dialogue"
          title={
            <>
              Everything you need, <span className="text-gradient italic">nothing you don't</span>
            </>
          }
          sub="Built with Vite, React, Express, MongoDB Atlas and WebRTC for a clean, lightning-fast experience."
        />
        <div className="mt-10 sm:mt-16 grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featuresList.map((item, index) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="reveal group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border bg-card p-5 sm:p-8 shadow-card transition duration-500 hover:-translate-y-2 hover:shadow-elegant"
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
    <section id="how" className="scroll-mt-24 py-16 sm:py-24 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading
          kicker="How it works"
          title={
            <>
              From hello to <span className="text-gradient italic">gone in 24 hours</span>
            </>
          }
          sub="The life of a conversation on Samवाद, step by step."
        />
        <div className="how-timeline relative mt-12 sm:mt-16 max-w-4xl mx-auto">
          {/* Central vertical timeline divider */}
          <div aria-hidden="true" className="how-timeline-line" />

          <ol className="relative space-y-4 sm:space-y-6 md:space-y-16">
            {steps.map((step, idx) => {
              const isRight = idx % 2 === 1;
              return (
                <li
                  key={step.num}
                  className={`reveal how-timeline-item ${isRight ? "how-step-right" : "how-step-left"
                    }`}
                >
                  {/* Card Column */}
                  <div className="how-timeline-card-col">
                    <div className="how-timeline-card">
                      {/* Mobile step badge + title */}
                      <div className="flex items-center gap-3 md:block">
                        <span className="how-badge-mobile" aria-hidden="true">
                          {step.num}
                        </span>
                        <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                          {step.title}
                        </h3>
                      </div>
                      <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>

                  {/* Centered number badge (desktop) */}
                  <div className="how-timeline-badge" aria-label={`Step ${step.num}`}>
                    {step.num}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

// Calling section with interactive mute button
function CallingSection() {
  const [isMuted, setIsMuted] = useState(false);

  return (
    <section id="calling" className="relative scroll-mt-24 overflow-hidden bg-secondary py-16 sm:py-24 md:py-28">
      <EmblemOrbit className="absolute -right-40 top-1/2 w-[520px] -translate-y-1/2 opacity-40" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 sm:gap-14 px-4 sm:px-5 lg:grid-cols-2">
        <div className="reveal">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-shine">Voice · Video · Screen</p>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl md:text-5xl">
            Face-to-face, <span className="text-gradient italic">right in your browser</span>
          </h2>
          <p className="mt-4 sm:mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
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
    <section id="privacy" className="scroll-mt-24 bg-secondary py-28">
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
    <section id="security" className="relative scroll-mt-24 overflow-hidden bg-secondary py-16 sm:py-24 md:py-28">
      <Emblem className="hidden md:block absolute -left-16 top-16 h-48 w-64 -rotate-12 opacity-30 dark:opacity-10 animate-float" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-5">
        <SectionHeading
          kicker="Security under the hood"
          title={
            <>
              Built like a vault, <span className="text-gradient italic">feels like a chat</span>
            </>
          }
          sub="Privacy isn't a setting on Samवाद — it's how the backend is engineered."
        />
        <div className="mt-10 sm:mt-16 grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
    <section id="compare" className="scroll-mt-24 py-16 sm:py-24 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading
          kicker="Honest comparison"
          title={
            <>
              Why <span className="font-deva text-gradient">Samवाद</span> feels different
            </>
          }
          sub="How we stand apart from corporate suites and personal messengers."
        />
        <p className="mt-6 text-center text-xs text-muted-foreground md:hidden">
          ← Swipe horizontally to view all messengers →
        </p>
        <div className="reveal mt-6 md:mt-14 overflow-x-auto rounded-3xl border border-border bg-card shadow-card">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-border text-sm">
                <th className="p-5 font-semibold text-muted-foreground">Capability</th>
                <th className="bg-primary p-5 text-center font-deva text-lg text-primary-foreground">Samवाद</th>
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

// Mobile & Desktop App Experience Section
function AppExperienceSection() {
  const platforms = [
    {
      title: "Android & Chrome",
      badge: "1-Click WebAPK",
      desc: "Install directly from Chrome or Edge. Launches in full-screen standalone mode with no address bar, real app icon, and push responsiveness.",
      actionText: "Install on Phone",
      isPrimary: true,
    },
    {
      title: "iPhone & iPad",
      badge: "iOS Standalone PWA",
      desc: "Tap Share 📤 then 'Add to Home Screen' in Safari. Enjoy full-screen messaging and HD video calls tailored for iOS safe-area insets.",
      actionText: "Install on iPhone",
      isPrimary: false,
    },
    {
      title: "Standalone Android APK",
      badge: ".APK Direct",
      desc: "Prefer an actual APK installation package? Download our latest pre-compiled build with native WebRTC hardware permissions.",
      actionText: "Download APK",
      link: "https://github.com/Hans-Soni/Let-s-Connect/releases/latest",
      isPrimary: false,
    },
  ];

  return (
    <section id="app" className="scroll-mt-24 py-20 sm:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-radial from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="mx-auto max-w-7xl px-4 sm:px-5">
        <SectionHeading
          kicker="Mobile &amp; Desktop App Experience"
          title="Use It Like WhatsApp or Instagram — On Any Device"
          sub="No App Store accounts or multi-gigabyte bloatware required. Install to your home screen in 1 click or download the standalone APK."
        />

        {/* 3 Platform Feature Cards */}
        <div className="mt-12 sm:mt-16 grid gap-6 sm:grid-cols-3">
          {platforms.map((p, idx) => (
            <div
              key={idx}
              className="reveal relative overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-7 shadow-card transition hover:-translate-y-1 hover:border-primary/40 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">
                    {p.badge}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Check className="h-3.5 w-3.5 text-success" /> Verified
                  </span>
                </div>
                <h3 className="mt-4 text-xl font-bold font-display">{p.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {p.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-border/50">
                {p.link ? (
                  <a
                    href={p.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/70 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary transition"
                  >
                    <Download className="h-3.5 w-3.5 text-primary" />
                    <span>{p.actionText}</span>
                  </a>
                ) : (
                  <InstallAppButton className={`w-full justify-center rounded-xl py-2.5 text-xs font-semibold shadow-sm ${
                    p.isPrimary ? "bg-primary text-primary-foreground hover:opacity-95" : "border border-border bg-secondary/70 text-foreground hover:bg-secondary"
                  }`}>
                    <Smartphone className="h-3.5 w-3.5" />
                    <span>{p.actionText}</span>
                  </InstallAppButton>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* High-Impact Device Interactive Phone Mockup */}
        <div className="reveal mt-14 sm:mt-20 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-card/90 to-background p-6 sm:p-12 shadow-elegant">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                <Sparkles className="h-3.5 w-3.5" /> Seamless Standalone Mode
              </span>
              <h3 className="mt-4 text-2xl sm:text-4xl font-bold font-display">
                Zero Browser Address Bars.<br />
                <span className="text-gradient">Pure, Uncluttered Dialogue.</span>
              </h3>
              <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
                When launched from your home screen, Samवाद activates standard Progressive Web App standalone display. You get instant access to end-to-end encrypted chats, HD voice and video calls, camera previews, and voice messaging just like native apps.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3 text-xs sm:text-sm">
                <div className="rounded-2xl border border-border bg-secondary/40 p-3.5">
                  <p className="font-bold text-foreground">Under 2 MB Size</p>
                  <p className="text-muted-foreground text-xs mt-0.5">Loads 50x faster than traditional store apps</p>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/40 p-3.5">
                  <p className="font-bold text-foreground">Hardware Permissions</p>
                  <p className="text-muted-foreground text-xs mt-0.5">Camera, mic, and audio settings pre-configured</p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <InstallAppButton className="rounded-full bg-primary px-6 py-3 text-xs sm:text-sm font-semibold text-primary-foreground shadow-elegant hover:-translate-y-0.5 transition">
                  <Download className="h-4 w-4" />
                  <span>Install Samवाद Now (1-Click)</span>
                </InstallAppButton>
                <a
                  href="https://github.com/Hans-Soni/Let-s-Connect/releases/latest"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-border px-5 py-3 text-xs sm:text-sm font-semibold transition hover:bg-secondary inline-flex items-center gap-2"
                >
                  <Smartphone className="h-4 w-4 text-primary" />
                  <span>Get Android APK</span>
                </a>
              </div>
            </div>

            {/* Mobile App Frame Mockup */}
            <div className="mx-auto w-full max-w-sm rounded-[2.5rem] border-[6px] border-border/80 bg-background p-4 shadow-2xl relative">
              {/* Notch / Speaker Earbar */}
              <div className="mx-auto h-4 w-28 rounded-full bg-border/60 mb-3" />

              <div className="rounded-2xl overflow-hidden border border-border bg-card">
                {/* Mobile Header Bar */}
                <div className="flex items-center justify-between border-b border-border bg-muted/60 px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="relative h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs">
                      AJ
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-success border border-card" />
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-tight">Aarav Joshi</p>
                      <p className="text-[10px] text-primary">online · Samवाद</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    <Video className="h-3.5 w-3.5" />
                  </div>
                </div>

                {/* Mobile Chat Messages */}
                <div className="space-y-2.5 p-3.5 text-xs">
                  <div className="rounded-2xl rounded-bl-sm bg-secondary p-2.5 max-w-[85%]">
                    <p>Installed the 1-click app on my phone! No browser bar at all 🔥</p>
                    <span className="block text-[9px] text-muted-foreground text-right mt-1">10:42 AM</span>
                  </div>
                  <div className="rounded-2xl rounded-br-sm bg-primary text-primary-foreground p-2.5 max-w-[85%] ml-auto">
                    <p>Awesome! WebRTC calls and voice notes work natively just like WhatsApp ✨</p>
                    <span className="block text-[9px] text-primary-foreground/75 text-right mt-1">10:43 AM · ✓✓</span>
                  </div>
                </div>

                {/* Mobile Chat Input Mockup */}
                <div className="border-t border-border bg-card p-2 flex items-center gap-2">
                  <div className="flex-1 rounded-full bg-secondary/70 px-3 py-1.5 text-[11px] text-muted-foreground">
                    Type a message…
                  </div>
                  <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Send className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>

              {/* Bottom Gesture Bar */}
              <div className="mx-auto h-1 w-24 rounded-full bg-muted-foreground/30 mt-3" />
            </div>
          </div>
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
    <section id="benefits" className="scroll-mt-24 py-28">
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
    <section id="stack" className="scroll-mt-24 py-16 sm:py-24 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-5">
        <SectionHeading
          kicker="The technology"
          title={
            <>
              A modern stack, <span className="text-gradient italic">end to end</span>
            </>
          }
          sub="Full-stack MERN with realtime sockets and peer-to-peer media."
        />
        <div className="mt-10 sm:mt-14 grid gap-4 sm:gap-5 sm:grid-cols-2">
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
      "Do I need to install an app or plugin?",
      "You have total freedom! You can use Samवाद instantly in any browser with zero installation, OR install it in 1-click onto your phone (Android & iPhone) and computer (Windows & Mac) to use it full-screen just like WhatsApp or Instagram without any browser address bar. Android users can also download the standalone .apk directly from our releases page.",
    ],
    [
      "Can other people see my email address or phone number?",
      "Never. Your email address and phone number are strictly confidential and never displayed to other users. Only your display name and professional designation (e.g., 'Software Architect', 'Product Designer') are shown across contacts and active chats.",
    ],
    [
      "What exactly happens after 24 hours?",
      "To protect your privacy and eliminate storage bloat, a background cron job runs every minute on the server. Any message older than 24 hours is automatically and permanently purged from the database, along with its attached images, videos, and voice notes from Cloudinary storage.",
    ],
    [
      "How do voice, video, and screen sharing work?",
      "Calls are established using peer-to-peer WebRTC with STUN and TURN relay fallback. Media streams travel directly between participants with DTLS-SRTP encryption. You can seamlessly swap between your camera and screen share mid-call without interrupting the audio stream.",
    ],
    [
      "What file types and media sizes can I share?",
      "You can send crisp voice notes with live audio waveforms and variable speed playback (1x, 1.5x, 2x). You can also share images (JPEG, PNG, WebP up to 15MB) with click-to-zoom fullscreen lightboxes, and video clips (MP4, WebM up to 25MB) with inline playback.",
    ],
    [
      "Can I block someone or mute conversations?",
      "Yes. You can block any user directly from contact settings. Blocking immediately conceals your profile picture from them and stops all incoming messages and calls. You can also mute message notification sounds or purge chat history with one click.",
    ],
    [
      "How are messages secured and encrypted?",
      "Every message is encrypted at rest using AES-256-GCM authenticated encryption. Each message includes a unique IV and authentication tag that instantly flags any unauthorized tampering. Furthermore, server encryption keys rotate twice daily (at 00:00 and 12:00 IST).",
    ],
    [
      "Are there keyboard shortcuts for power users?",
      "Yes! Press Ctrl+K (or Cmd+K on macOS) anytime to open the instant contact search modal, press Enter to send a message (or Shift+Enter for a new line), and press Escape to quickly dismiss any open modal or image preview.",
    ],
  ];

  return (
    <section id="faq" className="scroll-mt-24 py-16 sm:py-24 md:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-5">
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
                className={`faq-item overflow-hidden rounded-2xl border bg-card transition-all duration-300 ${
                  isOpen ? "border-primary shadow-card" : "border-border hover:border-border/80"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left font-semibold cursor-pointer select-none"
                >
                  <span className="text-base sm:text-lg text-foreground font-medium">{q}</span>
                  <Plus
                    className={`h-5 w-5 shrink-0 text-primary transition-transform duration-300 ${
                      isOpen ? "rotate-45" : ""
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden min-h-0">
                    <p className="px-5 pb-5 text-sm sm:text-base leading-relaxed text-muted-foreground">
                      {a}
                    </p>
                  </div>
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
    <section className="px-4 sm:px-5 pb-16 sm:pb-28">
      <div className="reveal relative mx-auto max-w-6xl overflow-hidden rounded-2xl sm:rounded-[2.5rem] bg-brand px-5 py-12 sm:px-8 sm:py-20 text-center text-primary-foreground shadow-elegant">
        <Emblem className="hidden md:block absolute -right-10 -top-6 h-48 w-72 rotate-12 opacity-35 dark:opacity-20 animate-float" />
        <Emblem className="relative mx-auto h-16 w-24 sm:h-20 sm:w-28 animate-bloom" />
        <h2 className="relative mt-5 sm:mt-6 text-3xl sm:text-5xl lg:text-6xl font-semibold">
          Begin your <span className="font-deva">Samवाद</span>
        </h2>
        <p className="relative mx-auto mt-4 sm:mt-5 max-w-xl text-base sm:text-lg opacity-90">
          Join people enjoying real-time chat, HD calling and true ephemeral privacy.
        </p>
        <div className="relative mt-7 sm:mt-9 flex flex-col sm:flex-row justify-center gap-3">
          <a
            href={SIGNUP_URL}
            className="rounded-full bg-card px-7 py-3.5 sm:py-4 font-semibold text-foreground transition hover:-translate-y-1 text-center"
          >
            Create free account
          </a>
          <a
            href={LOGIN_URL}
            className="rounded-full border-2 border-primary-foreground/60 px-7 py-3.5 sm:py-4 font-semibold transition hover:bg-primary-foreground/10 text-center"
          >
            I already have an account
          </a>
        </div>
      </div>
    </section>
  );
}

// Feedback section (takes feedback from users)
function FeedbackSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "General",
    rating: 5,
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const categories = [
    { label: "General", icon: "💭" },
    { label: "Feature Request", icon: "💡" },
    { label: "Bug Report", icon: "🐛" },
    { label: "Praise", icon: "🌸" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!formData.name.trim()) {
      toast.error("Please enter your name.");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Please enter your registered email ID.");
      return;
    }
    if (!formData.message.trim()) {
      toast.error("Please enter your feedback message.");
      return;
    }

    setIsSubmitting(true);
    try {
      await axiosInstance.post("/feedback", formData);
      setIsSubmitted(true);
      toast.success("Thank you! Your feedback has been verified and received 🌸");
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        "Email ID not found in our database. Please use the email registered with your Samवाद account first.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: "",
      email: "",
      category: "General",
      rating: 5,
      message: "",
    });
    setErrorMessage("");
    setIsSubmitted(false);
  };

  return (
    <section id="feedback" aria-labelledby="feedback-heading" className="scroll-mt-24 border-t border-border bg-secondary py-16 sm:py-24 md:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-8 sm:gap-12 px-4 sm:px-5 lg:grid-cols-2 lg:gap-20">
        {/* Left Column: Context */}
        <div className="min-w-0">
          <div aria-hidden="true" className="relative mb-8 h-32 w-32">
            <div className="absolute inset-0 animate-spin-slow rounded-full border border-dashed border-gold/50" />
            <Emblem className="absolute inset-5 h-22 w-22 animate-bloom" />
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Community Feedback
          </span>
          <h2 id="feedback-heading" className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight">
            Help us shape <span className="font-deva text-primary">Samवाद.</span>
          </h2>
          <p className="mt-4 sm:mt-5 max-w-md text-base sm:text-lg leading-relaxed text-muted-foreground">
            Have a suggestion, spotted a bug, or loving the experience? We read every piece of feedback to make private dialogue better every single day.
          </p>
          <div className="mt-8 space-y-4">
            <div className="flex items-start gap-3 border-l-2 border-primary pl-4">
              <Check className="mt-1 h-4 w-4 shrink-0 text-primary" />
              <p className="text-sm leading-relaxed text-muted-foreground">
                <strong className="text-foreground font-semibold">Direct developer review</strong> — your notes guide our feature roadmap and bug fixes directly.
              </p>
            </div>
            <div className="flex items-start gap-3 border-l-2 border-primary/60 pl-4">
              <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-primary" />
              <p className="text-sm leading-relaxed text-muted-foreground">
                <strong className="text-foreground font-semibold">Verified account required</strong> — email IDs are checked against our database to ensure genuine, authentic community feedback.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Feedback Card */}
        <div className="min-w-0 rounded-3xl border border-border bg-card/90 p-6 shadow-glow backdrop-blur-xl sm:p-9 relative">
          <div className="text-center mb-6">
            <Logo className="mx-auto mb-3.5 h-10 object-contain" />
            <h3 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">Share your feedback</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Enter your registered Samवाद details to share your thoughts, bug reports, or feature ideas.
            </p>
          </div>

          {isSubmitted ? (
            <div className="mt-8 space-y-5 text-center py-6" role="status">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/15 text-primary">
                <Check className="h-8 w-8 animate-bloom" />
              </div>
              <div>
                <h4 className="text-xl font-semibold">Thank you for your feedback! 🌸</h4>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground max-w-sm mx-auto">
                  Your feedback has been verified and stored. Thank you for helping build a more thoughtful, private communication experience.
                </p>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-secondary px-6 text-sm font-semibold transition hover:bg-muted cursor-pointer"
              >
                Send another note <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 sm:mt-7 space-y-4 sm:space-y-5">
              {/* Category Pills */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Feedback category
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.label}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: cat.label })}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                        formData.category === cat.label
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "border border-border bg-secondary hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  How is your experience?
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      aria-label={`${star} star`}
                      onClick={() => setFormData({ ...formData, rating: star })}
                      className="p-1 transition hover:scale-110 cursor-pointer"
                    >
                      <Star
                        className={`h-6 w-6 transition-colors ${
                          star <= formData.rating
                            ? "fill-primary text-primary"
                            : "text-muted-foreground/30 hover:text-primary/50"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-medium text-muted-foreground">
                    {formData.rating === 5 && "Outstanding 🌟"}
                    {formData.rating === 4 && "Very good ✨"}
                    {formData.rating === 3 && "Good 👍"}
                    {formData.rating === 2 && "Could be better"}
                    {formData.rating === 1 && "Needs work"}
                  </span>
                </div>
              </div>

              {/* Name & Email Grid (Compulsory) */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="feedback-name" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Full Name <span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <User aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                    <input
                      id="feedback-name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (errorMessage) setErrorMessage("");
                      }}
                      placeholder="Your full name"
                      className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="feedback-email" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Registered Email <span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <Mail aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                    <input
                      id="feedback-email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (errorMessage) setErrorMessage("");
                      }}
                      placeholder="account@example.com"
                      className={`h-11 w-full rounded-xl border bg-background pl-10 pr-3 text-sm outline-none transition focus:ring-1 ${
                        errorMessage
                          ? "border-destructive text-destructive focus:border-destructive focus:ring-destructive"
                          : "border-input focus:border-primary focus:ring-primary"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Error Message Alert Banner */}
              {errorMessage && (
                <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3.5 text-xs text-destructive animate-rise">
                  <p className="font-semibold flex items-center gap-1.5">
                    <span>⚠️</span> {errorMessage}
                  </p>
                  <p className="mt-1.5 text-muted-foreground">
                    Don’t have an account yet?{" "}
                    <a href={SIGNUP_URL} className="font-medium text-primary underline">
                      Sign up for Samवाद first
                    </a>{" "}
                    to share feedback.
                  </p>
                </div>
              )}

              {/* Feedback Message (Compulsory) */}
              <div className="space-y-1.5">
                <label htmlFor="feedback-message" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Your feedback <span className="text-primary">*</span>
                </label>
                <div className="relative">
                  <textarea
                    id="feedback-message"
                    name="message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us what you like, what feels tricky, or what features you'd like to see next..."
                    className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 font-semibold text-primary-foreground shadow-glow transition hover:opacity-95 active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Verifying & Sending…
                  </>
                ) : (
                  <>
                    Send feedback <Send className="h-4 w-4" />
                  </>
                )}
              </button>

              <p className="text-center text-xs leading-relaxed text-muted-foreground">
                Verified feedback is stored and reviewed directly by our engineering team. Thank you!
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
    <footer className="border-t border-border py-8 sm:py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:px-5 md:flex-row text-center md:text-left">
        <Logo className="h-8 w-auto sm:h-10" />
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
          © {new Date().getFullYear()} Samवाद · All rights reserved.
        </p>
      </div>
    </footer>
  );
}

// Main WelcomePage Component
export default function WelcomePage({ scrollTarget }) {
  const { dark, toggle } = useSamvaadTheme();
  useReveal();

  useEffect(() => {
    if (scrollTarget) {
      const timer = setTimeout(() => {
        const el = document.getElementById(scrollTarget);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [scrollTarget]);

  return (
    <div className={`welcome-page w-full max-w-full min-h-screen overflow-x-hidden ${dark ? "dark" : ""}`}>
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
        <AppExperienceSection />
        <BenefitsSection />
        <StackSection />
        <FaqSection />
        <CtaBanner />
        <FeedbackSection />
      </main>
      <Footer />
    </div>
  );
}
