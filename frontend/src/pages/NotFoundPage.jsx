import { useEffect } from "react";
import { Link, useNavigate } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  Home,
  MessageSquare,
  Shield,
  Clock,
  Users,
  Sun,
  Moon,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";

import logoLight from "../assets/samvaad_logo_light.png";
import logoDark from "../assets/samvaad_logo_dark.png";
import emblemGold from "../assets/emblem_gold-sNN9olCf.png";
import emblemSilver from "../assets/emblem_silver-CXs3LN2i.png";

export default function NotFoundPage() {
  const { authUser } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const navigate = useNavigate();
  const dark = theme === "dark";

  const toggleTheme = () => {
    const next = dark ? "light" : "dark";
    setTheme(next);
  };

  useEffect(() => {
    document.title = "404 · Page Not Found — Samvād";
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-background text-foreground selection:bg-primary/20 selection:text-primary transition-colors duration-300">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-primary/10 dark:bg-primary/15 rounded-full blur-[120px]" />
        <div className="absolute -bottom-32 right-10 w-[400px] h-[300px] bg-primary/5 dark:bg-primary/10 rounded-full blur-[100px]" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link
          to="/"
          title="Back to Samvād home"
          className="flex items-center gap-2.5 transition-transform hover:scale-[1.02]"
        >
          <img
            src={dark ? logoDark : logoLight}
            alt="Samvād"
            className="h-9 sm:h-10 w-auto object-contain"
          />
        </Link>

        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${dark ? "light" : "dark"} mode`}
            title={`Switch to ${dark ? "light" : "dark"} mode`}
            className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground transition cursor-pointer shadow-xs"
          >
            {dark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
          </button>

          {authUser ? (
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs sm:text-sm hover:opacity-90 transition shadow-xs"
            >
              <MessageSquare size={16} />
              <span>Open Chat</span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs sm:text-sm hover:opacity-90 transition shadow-xs"
            >
              <span>Sign In</span>
              <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </header>

      {/* Main 404 Hero Container */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-10 max-w-4xl mx-auto text-center">
        {/* Emblem Badge with Float Animation */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
          <img
            src={dark ? emblemSilver : emblemGold}
            alt="Samvād Emblem"
            className="relative h-24 sm:h-28 w-auto mx-auto object-contain animate-float drop-shadow-md select-none"
          />
        </div>

        {/* Devanagari Touch Subheading */}
        <p className="font-deva text-primary font-normal text-lg sm:text-2xl tracking-wide select-none">
          मार्ग उपलब्ध नहीं · पृष्ठ नहीं मिला
        </p>

        {/* Big Stylized 404 Code */}
        <div className="my-2 flex items-center justify-center gap-2 select-none">
          <span className="font-display text-7xl sm:text-9xl font-bold tracking-tighter text-foreground/20 dark:text-foreground/15">
            4
          </span>
          <span className="font-display text-7xl sm:text-9xl font-bold tracking-tighter text-primary">
            0
          </span>
          <span className="font-display text-7xl sm:text-9xl font-bold tracking-tighter text-foreground/20 dark:text-foreground/15">
            4
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-foreground max-w-2xl leading-tight">
          Lost in the <em className="text-primary not-italic">Silence.</em>
        </h1>

        {/* Description */}
        <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-xl leading-relaxed">
          The link you followed doesn&apos;t exist, was swept by our automated 24-hour ephemeral privacy schedule, or has moved to another frequency.
        </p>

        {/* CTA Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
          >
            <Home size={17} />
            <span>{authUser ? "Return to Conversations" : "Return to Welcome Home"}</span>
            <ArrowRight size={16} />
          </Link>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-border bg-card text-foreground font-medium text-sm hover:bg-secondary transition cursor-pointer shadow-xs"
          >
            <ArrowLeft size={16} />
            <span>Go Back</span>
          </button>
        </div>

        {/* Quick Discovery Cards */}
        <div className="mt-14 w-full grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-left select-none">
          <Link
            to="/"
            className="p-4 rounded-xl border border-border bg-card/60 hover:bg-card hover:border-primary/40 transition group cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-2.5 mb-1.5 text-foreground font-semibold text-sm group-hover:text-primary transition-colors">
              <MessageSquare size={16} className="text-primary shrink-0" />
              <span>Real-Time Chat</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Connect privately with audio messages, video clips, and live typing presence.
            </p>
          </Link>

          <Link
            to="/welcome#features"
            className="p-4 rounded-xl border border-border bg-card/60 hover:bg-card hover:border-primary/40 transition group cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-2.5 mb-1.5 text-foreground font-semibold text-sm group-hover:text-primary transition-colors">
              <Clock size={16} className="text-primary shrink-0" />
              <span>24h Ephemeral</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Messages automatically vanish after 24 hours. No historical logs archived.
            </p>
          </Link>

          <Link
            to={authUser ? "/" : "/signup"}
            className="p-4 rounded-xl border border-border bg-card/60 hover:bg-card hover:border-primary/40 transition group cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-2.5 mb-1.5 text-foreground font-semibold text-sm group-hover:text-primary transition-colors">
              <Users size={16} className="text-primary shrink-0" />
              <span>Private Directory</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Members connect by verified designation with emails 100% hidden and private.
            </p>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-border/60 py-6 px-6 text-center select-none text-xs text-muted-foreground">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="flex items-center justify-center gap-2">
            <span>Samvād · संवाद</span>
            <span>•</span>
            <span>Private Real-Time Chat &amp; HD Calling</span>
          </p>

          <div className="flex items-center justify-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400">
            <Shield size={13} />
            <span>End-to-End TLS · AES-256-GCM · Ephemeral 24H</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
