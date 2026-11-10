import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router";
import { ArrowLeft, Clipboard, Clock, Eye, EyeOff, Loader2, Mail, RefreshCw, User, X } from "lucide-react";
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
  const [googleTimeLeft, setGoogleTimeLeft] = useState(null);
  const googleTimerRef = useRef(null);

  // OTP Verification state
  const [step, setStep] = useState("form"); // "form" | "otp"
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpTimeLeft, setOtpTimeLeft] = useState(0);
  const otpTimerRef = useRef(null);
  const otpInputsRef = useRef([]);

  const {
    signup,
    sendSignupOtp,
    isSendingOtp,
    googleLogin,
    isSigningUp,
    isLoggingIn,
    authUser,
  } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const dark = theme === "dark";

  const toggleTheme = () => {
    setTheme(dark ? "light" : "dark");
  };

  const startOtpTimer = (seconds = 60) => {
    if (otpTimerRef.current) clearInterval(otpTimerRef.current);
    setOtpTimeLeft(seconds);
    otpTimerRef.current = setInterval(() => {
      setOtpTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(otpTimerRef.current);
          otpTimerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopGoogleTimer = () => {
    if (googleTimerRef.current) {
      clearInterval(googleTimerRef.current);
      googleTimerRef.current = null;
    }
    setGoogleTimeLeft(null);
  };

  const startGoogleTimer = (initialSeconds = 120) => {
    stopGoogleTimer();
    setGoogleTimeLeft(initialSeconds);

    googleTimerRef.current = setInterval(() => {
      setGoogleTimeLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          if (googleTimerRef.current) {
            clearInterval(googleTimerRef.current);
            googleTimerRef.current = null;
          }
          toast.error("Google authentication session timed out. Refreshing page...", {
            id: "google-auth-timeout",
          });
          setTimeout(() => {
            window.location.reload();
          }, 800);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // If user is already authenticated or completes sign-up, clean up timer
  useEffect(() => {
    if (authUser) {
      stopGoogleTimer();
    }
  }, [authUser]);

  useEffect(() => {
    return () => {
      if (googleTimerRef.current) {
        clearInterval(googleTimerRef.current);
      }
      if (otpTimerRef.current) {
        clearInterval(otpTimerRef.current);
      }
    };
  }, []);

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

  const handleOtpChange = (index, value) => {
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) {
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
      return;
    }

    const digit = cleaned.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (index < 5 && otpInputsRef.current[index + 1]) {
      otpInputsRef.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0 && otpInputsRef.current[index - 1]) {
        otpInputsRef.current[index - 1].focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData?.getData("text") || "").replace(/\D/g, "").slice(0, 6);
    if (pasted.length > 0) {
      const newOtp = ["", "", "", "", "", ""];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pasted[i] || "";
      }
      setOtp(newOtp);
      toast.success("Code pasted from clipboard!");
      const nextIndex = Math.min(pasted.length, 5);
      otpInputsRef.current[nextIndex]?.focus();
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const digits = text.replace(/\D/g, "").slice(0, 6);
      if (!digits) {
        toast.error("No numeric code found in clipboard");
        return;
      }
      const newOtp = ["", "", "", "", "", ""];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = digits[i] || "";
      }
      setOtp(newOtp);
      toast.success("Code pasted from clipboard!");
      const nextIndex = Math.min(digits.length, 5);
      otpInputsRef.current[nextIndex]?.focus();
    } catch {
      toast.error("Please allow clipboard access or paste directly into the box");
    }
  };

  const handleResendOtp = async () => {
    if (otpTimeLeft > 0 || isSendingOtp) return;
    const res = await sendSignupOtp({
      email: formData.email,
      fullName: formData.fullName,
    });
    if (res?.success) {
      startOtpTimer(res.retryAfter || 60);
    }
  };

  const handleVerifyOtpAndSignup = async (e) => {
    if (e) e.preventDefault();
    const otpCode = otp.join("").trim();
    if (otpCode.length !== 6) {
      toast.error("Please enter the complete 6-digit verification code");
      return;
    }

    const resolvedIp =
      clientIp ||
      (await Promise.race([
        detectClientIp(),
        new Promise((resolve) => setTimeout(() => resolve(""), 1200)),
      ]));

    const created = await signup({
      ...formData,
      dataConsent: true,
      clientIp: resolvedIp,
      otp: otpCode,
    });

    if (created) {
      if (otpTimerRef.current) clearInterval(otpTimerRef.current);
    }
  };

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
        stopGoogleTimer();
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
      } else if (result?.success || !result?.requiresConsent) {
        stopGoogleTimer();
      }
    } catch (err) {
      console.error("Google sign up error:", err);
      toast.error("Google sign up failed. Please try again.");
      stopGoogleTimer();
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
      stopGoogleTimer();
    },
  });

  const handleAcceptConsent = async () => {
    if (!hasAcceptedConsent || isSigningUp || isLoggingIn || isSendingOtp) return;
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
        stopGoogleTimer();
        setIsConsentOpen(false);
        setPendingGoogleAuth(null);
      }
    } else {
      // 1. Immediately close the consent modal so the user sees instant progress
      setIsConsentOpen(false);
      // 2. Immediately switch to the OTP putting section so the user is never stuck
      setStep("otp");
      startOtpTimer(60);
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 150);

      // 3. Dispatch the OTP verification email
      const res = await sendSignupOtp({
        email: formData.email,
        fullName: formData.fullName,
      });

      if (res?.retryAfter) {
        startOtpTimer(res.retryAfter);
      }
    }
  };

  const handleDeclineConsent = () => {
    setHasAcceptedConsent(false);
    setConsentDeclined(true);
    setPendingGoogleAuth(null);
    stopGoogleTimer();
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
                  {step === "otp" ? "Verify your email" : "Create account"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {step === "otp"
                    ? "Enter the 6-digit verification code sent to your email."
                    : "Join the conversation in seconds."}
                </p>
              </div>

              {step === "otp" ? (
                /* Step 2: Email OTP Verification Interface */
                <div className="mt-6 sm:mt-7 space-y-5 animate-rise">
                  {/* Email & Edit Badge */}
                  <div className="flex items-center justify-between rounded-2xl border border-border bg-secondary/60 p-3.5">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          {isSendingOtp ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin text-primary" />
                              <span>Sending code...</span>
                            </>
                          ) : (
                            <span>Code sent to</span>
                          )}
                        </p>
                        <p className="truncate text-sm font-semibold text-foreground" title={formData.email}>
                          {formData.email}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setStep("form");
                        setOtp(["", "", "", "", "", ""]);
                      }}
                      className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/10 transition cursor-pointer"
                    >
                      Change
                    </button>
                  </div>

                  {/* 6 Digit Input Boxes */}
                  <div>
                    <div className="flex items-center justify-between mb-2 px-1">
                      <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Enter 6-digit code
                      </label>
                      <button
                        type="button"
                        onClick={handlePasteFromClipboard}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs font-semibold text-primary hover:bg-primary/10 transition cursor-pointer"
                        title="Paste 6-digit code from clipboard"
                      >
                        <Clipboard className="h-3.5 w-3.5" /> Paste code
                      </button>
                    </div>
                    <div className="flex justify-center gap-2 sm:gap-2.5">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => (otpInputsRef.current[index] = el)}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={1}
                          autoComplete="one-time-code"
                          value={digit}
                          onPaste={handleOtpPaste}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          className={`h-12 w-11 sm:h-14 sm:w-12 rounded-xl border text-center text-xl sm:text-2xl font-bold font-mono outline-none transition
                            ${digit ? "border-primary bg-primary/10 text-primary shadow-glow" : "border-border bg-secondary text-foreground"}
                            focus:border-primary focus:ring-4 focus:ring-ring/30`}
                        />
                      ))}
                    </div>
                    <p className="mt-3 text-center text-xs text-muted-foreground">
                      Open the verification email sent to{" "}
                      <strong className="text-foreground">{formData.email}</strong>, copy the 6-digit code, and paste it above.
                    </p>
                  </div>

                  {/* Verify & Create Account Button */}
                  <button
                    type="button"
                    onClick={handleVerifyOtpAndSignup}
                    disabled={isSigningUp || otp.join("").length !== 6}
                    className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-primary font-semibold text-primary-foreground shadow-glow transition hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
                  >
                    <span className="absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-primary-foreground/20 transition-all duration-700 group-hover:left-[120%]" />
                    {isSigningUp ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Verifying &amp; creating account...
                      </span>
                    ) : (
                      <>
                        Verify &amp; Create Account{" "}
                        <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                          →
                        </span>
                      </>
                    )}
                  </button>

                  {/* Resend Code & Back actions */}
                  <div className="flex flex-col items-center justify-center gap-2 text-center text-xs text-muted-foreground pt-1">
                    {otpTimeLeft > 0 ? (
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 animate-spin text-primary" />
                        Resend code in <strong className="font-mono text-foreground">{otpTimeLeft}s</strong>
                      </span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span>Didn&apos;t receive the code?</span>
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={isSendingOtp}
                          className="font-semibold text-primary underline underline-offset-2 hover:opacity-80 transition cursor-pointer disabled:opacity-60"
                        >
                          {isSendingOtp ? "Sending code..." : "Resend Code"}
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setStep("form");
                        setOtp(["", "", "", "", "", ""]);
                      }}
                      className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition cursor-pointer"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Back to edit registration details
                    </button>
                  </div>
                </div>
              ) : (
                /* Step 1: Standard Registration Form */
                <>
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
                      disabled={isSigningUp || isLoggingIn || isSendingOtp}
                      className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-primary font-semibold text-primary-foreground shadow-glow transition hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-70 disabled:pointer-events-none cursor-pointer"
                    >
                      <span className="absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-primary-foreground/20 transition-all duration-700 group-hover:left-[120%]" />
                      {isSendingOtp ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Sending verification code...
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
                      startGoogleTimer(120);
                      triggerGoogleLogin();
                    }}
                    disabled={googleLoading || isSigningUp || isLoggingIn || isSendingOtp}
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
                    <span>{googleLoading ? "Connecting to Google..." : "Sign up with Google"}</span>
                  </button>

                  {/* Google Auth Active Countdown Timer */}
                  {googleTimeLeft !== null && (
                    <div className="mt-3 flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-xs text-primary shadow-sm animate-rise">
                      <span className="flex items-center gap-2 font-medium">
                        <Clock className="h-4 w-4 shrink-0 animate-pulse text-primary" />
                        <span>Google sign-up active · Session expires in:</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs sm:text-sm font-bold tracking-wider rounded-lg bg-card/90 px-2.5 py-1 text-primary border border-primary/20 shadow-inner">
                          {Math.floor(googleTimeLeft / 60)}:{(googleTimeLeft % 60).toString().padStart(2, "0")}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            stopGoogleTimer();
                            setGoogleLoading(false);
                          }}
                          className="text-muted-foreground hover:text-foreground text-[11px] underline cursor-pointer"
                          title="Cancel Google sign-up session"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

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
                </>
              )}
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
                  onClick={() => {
                    setIsConsentOpen(false);
                    setPendingGoogleAuth(null);
                    stopGoogleTimer();
                  }}
                  className="rounded-full p-1 text-muted-foreground transition hover:bg-secondary hover:text-foreground cursor-pointer"
                  aria-label="Close dialog"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Google Auth Timer Banner inside Consent Modal */}
              {googleTimeLeft !== null && (
                <div className="mt-4 flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-xs text-primary shadow-sm animate-pulse">
                  <span className="flex items-center gap-2 font-medium">
                    <Clock className="h-4 w-4 shrink-0 text-primary" />
                    <span>Complete Google account setup within:</span>
                  </span>
                  <span className="font-mono text-xs sm:text-sm font-bold tracking-wider rounded-lg bg-card/90 px-2.5 py-1 text-primary border border-primary/20 shadow-inner">
                    {Math.floor(googleTimeLeft / 60)}:{(googleTimeLeft % 60).toString().padStart(2, "0")}
                  </span>
                </div>
              )}

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
                  disabled={isSigningUp || isLoggingIn || isSendingOtp}
                >
                  Disagree
                </button>
                <button
                  type="button"
                  className="h-11 px-6 rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-glow transition hover:brightness-110 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                  onClick={handleAcceptConsent}
                  disabled={!hasAcceptedConsent || isSigningUp || isLoggingIn || isSendingOtp}
                >
                  {isSigningUp || isLoggingIn || isSendingOtp ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />{" "}
                      {isSendingOtp ? "Sending code..." : "Processing..."}
                    </span>
                  ) : pendingGoogleAuth ? (
                    "Accept & Create Account with Google"
                  ) : (
                    "Accept & Verify Email"
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
