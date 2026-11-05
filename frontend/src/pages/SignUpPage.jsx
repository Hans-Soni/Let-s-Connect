import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router";
import { Eye, EyeOff, Loader2, User, X } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import toast from "react-hot-toast";

import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import { detectClientIp } from "../lib/detectClientIp";
import TermsContent from "../components/TermsContent";

import logoLight from "../assets/samvaad_logo_light.png";
import logoDark from "../assets/samvaad_logo_dark.png";
import emblemGold from "../assets/emblem_gold-sNN9olCf.png";
import emblemSilver from "../assets/emblem_silver-CXs3LN2i.png";

import "../auth.css";

// Ticker items matching the Lovable design
const TICKER_ITEMS = [
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

// Dual-theme lotus emblem component (gold in light mode, silver in dark mode)
function LotusEmblem({ dark, className = "" }) {
  return (
    <img
      src={dark ? emblemSilver : emblemGold}
      alt="Lotus flower"
      className={`transition-all duration-300 ${className}`}
    />
  );
}

// Brand logo link to welcome page (high-contrast symbol for each mode)
function LogoLink({ dark }) {
  return (
    <Link to="/" title="Back to welcome page" className="block transition hover:scale-[1.03]">
      <img
        src={dark ? logoDark : logoLight}
        alt="Samवाद"
        className="h-10 w-auto transition-opacity duration-300"
      />
    </Link>
  );
}

// Animated theme toggle button
function ThemeToggle({ dark, toggle }) {
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="group relative grid h-10 w-10 place-items-center overflow-hidden rounded-full border border-border bg-card/70 backdrop-blur transition hover:border-primary/60 cursor-pointer"
    >
      <span
        className={`absolute transition-all duration-500 ${dark ? "rotate-0 opacity-100" : "-rotate-90 opacity-0"
          }`}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      </span>
      <span
        className={`absolute transition-all duration-500 ${dark ? "rotate-90 opacity-0" : "rotate-0 opacity-100"
          }`}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      </span>
    </button>
  );
}

function SignUpPage() {
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isConsentOpen, setIsConsentOpen] = useState(false);
  const [hasAcceptedConsent, setHasAcceptedConsent] = useState(false);
  const [consentDeclined, setConsentDeclined] = useState(false);
  const [pendingGoogleAuth, setPendingGoogleAuth] = useState(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [clientIp, setClientIp] = useState("");

  const { signup, googleLogin, isSigningUp, isLoggingIn } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const dark = theme === "dark";

  // Sync theme with HTML class and localStorage
  useEffect(() => {
    const saved = localStorage.getItem("samvad-theme");
    if (saved === "light" || saved === "dark") {
      if (saved !== theme) setTheme(saved);
      document.documentElement.classList.toggle("dark", saved === "dark");
    } else {
      document.documentElement.classList.toggle("dark", dark);
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !dark;
    const nextTheme = nextDark ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("samvad-theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextDark);
  };

  // Detect genuine client device IP proactively
  useEffect(() => {
    let isMounted = true;
    detectClientIp().then((ip) => {
      if (ip && isMounted) {
        setClientIp(ip);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    setPendingGoogleAuth(null);
    setConsentDeclined(false);
    setHasAcceptedConsent(false);
    setIsConsentOpen(true);
  };

  const handleGoogleTokenSuccess = async (tokenResponse) => {
    try {
      setGoogleLoading(true);
      const accessToken = tokenResponse?.access_token;
      if (!accessToken) {
        toast.error("Failed to retrieve Google token");
        return;
      }
      const resolvedIp =
        clientIp ||
        (await Promise.race([
          detectClientIp(),
          new Promise((resolve) => setTimeout(() => resolve(""), 1200)),
        ]));

      const result = await googleLogin({
        accessToken,
        clientIp: resolvedIp,
        dataConsent: false,
      });

      if (result?.requiresConsent) {
        setPendingGoogleAuth({
          accessToken,
          userDetails: result.userDetails,
        });
        setHasAcceptedConsent(false);
        setConsentDeclined(false);
        setIsConsentOpen(true);
      }
    } catch (err) {
      console.error("Google sign up error:", err);
      toast.error("Google sign up failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const triggerGoogleLogin = useGoogleLogin({
    onSuccess: handleGoogleTokenSuccess,
    onError: (err) => {
      console.error("Google signup prompt error:", err);
      toast.error("Google Sign-In was cancelled or failed");
      setGoogleLoading(false);
    },
  });

  const handleAcceptConsent = async () => {
    if (!hasAcceptedConsent || isSigningUp || isLoggingIn) return;
    const resolvedIp =
      clientIp ||
      (await Promise.race([
        detectClientIp(),
        new Promise((resolve) => setTimeout(() => resolve(""), 1200)),
      ]));

    if (pendingGoogleAuth) {
      const result = await googleLogin({
        credential: pendingGoogleAuth.credential,
        accessToken: pendingGoogleAuth.accessToken,
        clientIp: resolvedIp,
        dataConsent: true,
      });
      if (result?.success) {
        setIsConsentOpen(false);
        setPendingGoogleAuth(null);
      }
    } else {
      const created = await signup({ ...formData, dataConsent: true, clientIp: resolvedIp });
      if (created) setIsConsentOpen(false);
    }
  };

  const handleDeclineConsent = () => {
    setHasAcceptedConsent(false);
    setConsentDeclined(true);
    setPendingGoogleAuth(null);
  };

  return (
    <div className="auth-page relative flex min-h-screen flex-col justify-between overflow-hidden bg-background text-foreground">
      {/* Ambient Gradient Blobs */}
      <div className="pointer-events-none absolute -left-32 top-20 h-96 w-96 rounded-full bg-primary/20 blur-3xl animate-blob" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-[28rem] w-[28rem] rounded-full bg-primary-glow/20 blur-3xl animate-blob [animation-delay:-7s]" />

      {/* Orbit Rings with Satellites */}
      <div className="pointer-events-none absolute -top-72 left-1/2 h-[640px] w-[640px] orbit animate-orbit">
        <span className="absolute bottom-6 left-1/2 h-3 w-3 rounded-full bg-primary shadow-glow" />
        <span className="absolute right-10 top-1/2 h-2 w-2 rounded-full bg-primary-glow" />
      </div>
      <div className="pointer-events-none absolute -top-48 left-1/2 h-[460px] w-[460px] -translate-x-1/2 rounded-full border border-primary/25 shadow-glow" />

      {/* Floating Lotus Emblems */}
      <LotusEmblem dark={dark} className="pointer-events-none absolute left-1/2 top-[-30px] w-44 -translate-x-1/2 opacity-80 animate-float" />
      <LotusEmblem dark={dark} className="pointer-events-none absolute -bottom-6 -left-14 w-52 rotate-12 opacity-40 animate-float [animation-delay:-3s]" />
      <LotusEmblem dark={dark} className="pointer-events-none absolute right-6 top-1/3 w-20 -rotate-12 opacity-25 animate-float [animation-delay:-5s]" />

      {/* Top Header */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4">
        <LogoLink dark={dark} />
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            ← Back to home
          </Link>
          <ThemeToggle dark={dark} toggle={toggleTheme} />
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-8 lg:gap-12 px-4 sm:px-6 py-3 sm:py-6 lg:grid-cols-2">
        {/* Left Column (Aside Preview) */}
        <section className="order-2 animate-rise lg:order-1">
          <div>
            {/* Kicker badge */}
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 rounded-full bg-primary animate-ping-soft" />
                <span className="relative h-2 w-2 rounded-full bg-primary" />
              </span>
              New · HD calling with screen sharing
            </span>

            {/* Headline */}
            <h1 className="mt-3 sm:mt-5 font-display text-4xl sm:text-5xl lg:text-[3.25rem] font-bold leading-[1.08] text-foreground">
              Every conversation, <br />
              <em className="text-gradient italic">beautifully private.</em>
            </h1>

            {/* Hindi Subtitle */}
            <p className="mt-2.5 sm:mt-3 font-deva text-xl sm:text-2xl text-muted-foreground">
              Samवाद — where dialogue feels human again.
            </p>

            {/* Chat Preview Card */}
            <div className="relative mt-6 sm:mt-8 max-w-md rounded-3xl border border-border bg-card/80 shadow-glow backdrop-blur-xl">
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-border px-5 py-4">
                <div className="relative grid h-10 w-10 place-items-center rounded-full bg-primary font-display font-bold text-primary-foreground">
                  AJ
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-online" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Aarav Joshi</p>
                  <p className="text-xs text-primary">Lead Designer · online</p>
                </div>
                <span className="relative grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-primary">
                  <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping-soft" />
                  <svg
                    viewBox="0 0 24 24"
                    className="relative h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="m22 8-6 4 6 4V8Z" />
                    <rect x="2" y="6" width="14" height="12" rx="2" />
                  </svg>
                </span>
              </div>

              {/* Chat Message Bubbles */}
              <div className="space-y-3 p-5">
                <div
                  style={{ animationDelay: "0.5s" }}
                  className="w-fit max-w-[85%] animate-rise rounded-2xl rounded-bl-sm bg-secondary px-4 py-2.5 text-sm text-foreground"
                >
                  Welcome to Samवाद 🌸 Who should we call first?
                </div>
                <div
                  style={{ animationDelay: "1.1s" }}
                  className="ml-auto w-fit max-w-[85%] animate-rise rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground"
                >
                  My whole team — no emails shown, right?
                </div>
                <div
                  style={{ animationDelay: "1.7s" }}
                  className="w-fit max-w-[85%] animate-rise rounded-2xl rounded-bl-sm bg-secondary px-4 py-2.5 text-sm text-foreground"
                >
                  Only designations. Messages vanish in 24h.
                </div>
                {/* Typing indicator */}
                <div className="flex w-fit gap-1 rounded-2xl bg-secondary px-4 py-3">
                  <span
                    style={{ animationDelay: "0s" }}
                    className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-typing"
                  />
                  <span
                    style={{ animationDelay: "0.15s" }}
                    className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-typing"
                  />
                  <span
                    style={{ animationDelay: "0.3s" }}
                    className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-typing"
                  />
                </div>
              </div>

              {/* Voice Call Footer */}
              <div className="flex items-center justify-between border-t border-border px-5 py-3 font-mono text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-online" /> Voice call · 04:18
                </span>
                <span className="flex h-4 items-end gap-0.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      style={{ animationDelay: `${i * 0.12}s` }}
                      className="h-4 w-1 rounded-full bg-primary animate-eq"
                    />
                  ))}
                </span>
              </div>
            </div>

            {/* Aside Feature Badges */}
            <div className="mt-5 sm:mt-6 flex flex-wrap gap-2">
              {["Free forever", "No ads", "No tracking", "Designation privacy"].map((badge) => (
                <span
                  key={badge}
                  className="flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {badge}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Right Column (Sign Up Form Card) */}
        <section className="order-1 animate-rise [animation-delay:.15s] lg:order-2">
          <div className="relative mx-auto w-full max-w-md">
            {/* Outer Glow Border */}
            <div className="card-glow-border absolute -inset-px rounded-3xl opacity-70" />

            {/* Auth Form Card */}
            <div className="relative rounded-3xl bg-card/90 p-6 sm:p-7 lg:p-8 shadow-glow backdrop-blur-xl">
              {/* Card Header with Floating Lotus */}
              <div className="text-center">
                <LotusEmblem dark={dark} className="mx-auto h-12 w-auto animate-float" />
                <h2 className="mt-3 font-display text-3xl font-semibold text-foreground">
                  Create account
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Join the conversation in seconds.
                </p>
              </div>

              {/* Sign Up Form */}
              <form className="mt-6 sm:mt-7 space-y-4" onSubmit={handleSubmit}>
                {/* Full Name */}
                <label className="group block space-y-2">
                  <span className="text-sm font-medium text-foreground">Full name</span>
                  <span className="relative block">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="8" r="4" />
                        <path d="M4 21a8 8 0 0 1 16 0" />
                      </svg>
                    </span>
                    <input
                      required
                      name="fullName"
                      type="text"
                      placeholder="Aarav Joshi"
                      autoComplete="name"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="h-12 w-full rounded-xl border border-border bg-secondary pl-11 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-ring/30"
                    />
                  </span>
                </label>

                {/* Email */}
                <label className="group block space-y-2">
                  <span className="text-sm font-medium text-foreground">Email</span>
                  <span className="relative block">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect x="3" y="5" width="18" height="14" rx="2" />
                        <path d="m3 7 9 6 9-6" />
                      </svg>
                    </span>
                    <input
                      required
                      name="email"
                      type="email"
                      placeholder="johndoe@gmail.com"
                      autoComplete="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="h-12 w-full rounded-xl border border-border bg-secondary pl-11 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-ring/30"
                    />
                  </span>
                </label>

                {/* Password with Eye Toggle */}
                <label className="group block space-y-2">
                  <span className="text-sm font-medium text-foreground">Password</span>
                  <span className="relative block">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect x="4" y="11" width="16" height="10" rx="2" />
                        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                      </svg>
                    </span>
                    <input
                      required
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      autoComplete="new-password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="h-12 w-full rounded-xl border border-border bg-secondary pl-11 pr-11 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-ring/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground cursor-pointer"
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </span>
                </label>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSigningUp || isLoggingIn}
                  className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-primary font-semibold text-primary-foreground shadow-glow transition hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-70 disabled:pointer-events-none cursor-pointer"
                >
                  <span className="absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-primary-foreground/20 transition-all duration-700 group-hover:left-[120%]" />
                  {isSigningUp ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Creating account...
                    </span>
                  ) : (
                    <>
                      Start chatting free{" "}
                      <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </>
                  )}
                </button>
              </form>

              {/* Or Divider */}
              <div className="my-4 sm:my-5 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                or
                <span className="h-px flex-1 bg-border" />
              </div>

              {/* Google Sign-Up Button */}
              <button
                type="button"
                onClick={() => {
                  setGoogleLoading(true);
                  triggerGoogleLogin();
                }}
                disabled={googleLoading || isSigningUp || isLoggingIn}
                className="flex h-11 sm:h-12 w-full items-center justify-center gap-3 rounded-full border border-border bg-secondary text-sm font-semibold text-foreground transition hover:-translate-y-0.5 hover:border-primary/60 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {googleLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : (
                  <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
                    <path
                      fill="#FFC107"
                      d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
                    />
                    <path
                      fill="#FF3D00"
                      d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
                    />
                    <path
                      fill="#4CAF50"
                      d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
                    />
                    <path
                      fill="#1976D2"
                      d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
                    />
                  </svg>
                )}
                <span>{googleLoading ? "Signing up..." : "Sign up with Google"}</span>
              </button>

              {/* Terms and Privacy Notice */}
              <p className="mt-3 text-center text-xs text-muted-foreground">
                By continuing, you review and accept our{" "}
                <button
                  type="button"
                  onClick={() => {
                    setPendingGoogleAuth(null);
                    setHasAcceptedConsent(false);
                    setConsentDeclined(false);
                    setIsConsentOpen(true);
                  }}
                  className="text-primary underline underline-offset-2 hover:opacity-80 transition cursor-pointer"
                >
                  Terms &amp; Data Authorization
                </button>
                .
              </p>

              {/* Already have an account link */}
              <p className="mt-4 sm:mt-5 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="font-semibold text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Marquee Ticker Strip */}
      <div className="relative z-10 overflow-hidden border-y border-border bg-card/40 py-2.5 sm:py-3 backdrop-blur">
        <div className="flex w-max animate-marquee gap-10 font-display text-lg italic text-muted-foreground">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, index) => (
            <span key={index} className="flex items-center gap-10">
              {item} <span className="text-primary not-italic">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-3 sm:py-4 text-center text-xs text-muted-foreground">
        Created by <span className="font-semibold text-primary">Hans Soni</span> — Full-Stack
        Software Developer and Cybersecurity Engineer ·{" "}
        <a
          href="https://hans-soni.github.io/"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-primary hover:underline"
        >
          Portfolio
        </a>
      </footer>

      {/* Terms & Conditions Modal Portal */}
      {isConsentOpen &&
        createPortal(
          <div className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:p-6">
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="signup-consent-title"
              className="my-auto w-full max-w-2xl max-h-[90dvh] overflow-y-auto rounded-3xl border border-border bg-card p-6 text-foreground shadow-2xl backdrop-blur-xl sm:p-8"
            >
              <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
                <div>
                  <h2
                    id="signup-consent-title"
                    className="font-display text-2xl font-bold text-foreground"
                  >
                    Terms &amp; Data Authorization
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Please review and accept before creating your account.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsConsentOpen(false)}
                  className="rounded-full p-1 text-muted-foreground transition hover:bg-secondary hover:text-foreground cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {pendingGoogleAuth && (
                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-3.5 text-foreground">
                  {pendingGoogleAuth.userDetails?.profilePic ? (
                    <img
                      src={pendingGoogleAuth.userDetails.profilePic}
                      alt="Google avatar"
                      className="h-10 w-10 rounded-full border border-primary/40 object-cover"
                    />
                  ) : (
                    <User className="h-8 w-8 text-primary" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                      Google Account Identified
                    </p>
                    <p className="truncate text-sm font-medium text-foreground">
                      {pendingGoogleAuth.userDetails?.fullName || "Google User"} (
                      {pendingGoogleAuth.userDetails?.email})
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-4 max-h-[45vh] overflow-y-auto pr-2 rounded-xl border border-border bg-secondary/50 p-4">
                <TermsContent />
              </div>

              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-secondary/60 p-4 transition hover:border-primary/50">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary"
                  checked={hasAcceptedConsent}
                  onChange={(event) => {
                    setHasAcceptedConsent(event.target.checked);
                    setConsentDeclined(false);
                  }}
                  disabled={isSigningUp || isLoggingIn}
                />
                <span className="text-sm text-foreground">
                  I have read and agree to these terms, and authorize the data use described above.
                </span>
              </label>

              {clientIp && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Device IP for audit &amp; security consent:{" "}
                  <code className="font-mono text-primary font-medium">{clientIp}</code>
                </p>
              )}

              {consentDeclined && (
                <p className="mt-3 text-sm text-amber-500" role="status">
                  You declined. Your account was not created and no details were submitted. This
                  consent screen will remain open.
                </p>
              )}

              <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row">
                <button
                  type="button"
                  className="h-11 px-5 rounded-full border border-border bg-secondary text-sm font-semibold text-foreground transition hover:bg-secondary/80 cursor-pointer"
                  onClick={handleDeclineConsent}
                  disabled={isSigningUp || isLoggingIn}
                >
                  Disagree
                </button>
                <button
                  type="button"
                  className="h-11 px-6 rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-glow transition hover:brightness-110 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                  onClick={handleAcceptConsent}
                  disabled={!hasAcceptedConsent || isSigningUp || isLoggingIn}
                >
                  {isSigningUp || isLoggingIn ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                    </span>
                  ) : pendingGoogleAuth ? (
                    "Accept & Create Account with Google"
                  ) : (
                    "Accept & Create Account"
                  )}
                </button>
              </div>
            </section>
          </div>,
          document.body
        )}
    </div>
  );
}

export default SignUpPage;
