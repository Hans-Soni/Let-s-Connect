import { useState, useEffect } from "react";
import { Download, Smartphone, X, Check, Share, PlusSquare, Star, ShieldCheck, Zap } from "lucide-react";
import toast from "react-hot-toast";
import emblemSilver from "../assets/emblem_silver-CXs3LN2i.png";

// Detect if app is already running as installed standalone PWA or native app
export function isStandaloneApp() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true ||
    Boolean(window.Capacitor?.isNativePlatform?.()) ||
    document.referrer.includes("android-app://")
  );
}

export default function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed or standalone
    if (isStandaloneApp()) {
      setIsInstalled(true);
      return;
    }

    // Check if user previously dismissed in this session
    const dismissed = sessionStorage.getItem("samvaad_install_dismissed");
    if (dismissed) setIsDismissed(true);

    // Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Capture standard PWA install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      toast.success("Samवाद successfully installed!", { icon: "🎉" });
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  if (isInstalled) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Trigger native browser install dialog
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        toast.success("Installing Samवाद...", { icon: "📲" });
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // Direct APK or instructions fallback
      window.open("https://github.com/Hans-Soni/Let-s-Connect/releases/latest", "_blank");
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem("samvaad_install_dismissed", "true");
  };

  return (
    <>
      {/* Minimized Docked Floating Pill when user minimized the main banner */}
      {isDismissed && (
        <button
          onClick={() => setIsDismissed(false)}
          aria-label="Install Samवाद App"
          className="fixed bottom-4 right-4 z-40 flex items-center gap-2.5 rounded-full border border-primary/40 bg-background/90 px-4 py-2 text-xs font-semibold text-primary shadow-xl backdrop-blur-md transition hover:-translate-y-0.5 hover:border-primary active:scale-95 cursor-pointer"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <Smartphone className="h-3.5 w-3.5" />
          <span>Install App</span>
        </button>
      )}

      {/* Luxury Glassmorphic 1-Click Install Card */}
      {!isDismissed && (
        <aside
          aria-label="Install Samवाद App"
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 animate-pop max-w-md"
        >
          <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-background/95 backdrop-blur-2xl p-5 shadow-2xl transition hover:border-primary/50">
            {/* Background Glow Accent */}
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl pointer-events-none" />

            <button
              onClick={handleDismiss}
              aria-label="Dismiss banner"
              className="absolute top-3 right-3 p-1.5 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header: App Emblem, Title & Rating Badge */}
            <div className="flex items-start gap-3.5 pr-6">
              <div className="relative h-12 w-12 shrink-0 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/40 p-1.5 shadow-inner border border-primary/20">
                <img
                  src={emblemSilver}
                  alt="Samवाद Emblem"
                  className="h-full w-full object-contain filter drop-shadow-sm"
                />
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-success" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="text-sm font-bold text-foreground">
                    Samवाद App
                  </h4>
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                    1-Click Install
                  </span>
                </div>

                <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="flex items-center text-amber-500 font-semibold gap-0.5">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> 4.9
                  </span>
                  <span>·</span>
                  <span>WhatsApp &amp; Insta Style</span>
                  <span>·</span>
                  <span className="text-success font-medium">Free</span>
                </div>
              </div>
            </div>

            {/* Feature Bullets */}
            <div className="mt-3.5 space-y-1.5 border-t border-border/50 pt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                <span><strong>Zero Browser Bar:</strong> Launches in full-screen standalone window</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                <span><strong>E2E Encrypted:</strong> 24h auto-destructing ephemeral messaging</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-primary shrink-0" />
                <span><strong>Fast &amp; Light:</strong> Under 2 MB, zero app store bloatware</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={handleInstallClick}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs sm:text-sm font-semibold text-primary-foreground shadow-elegant hover:-translate-y-0.5 active:translate-y-0 transition cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Install to Home Screen</span>
              </button>

              <a
                href="https://github.com/Hans-Soni/Let-s-Connect/releases/latest"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/60 px-3.5 py-3 text-xs font-semibold text-foreground hover:bg-secondary transition"
                title="Download Android APK"
              >
                <Smartphone className="h-3.5 w-3.5 text-primary" />
                <span>APK</span>
              </a>
            </div>
          </div>
        </aside>
      )}

      {/* Elevated iOS Safari Install Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-background p-6 shadow-2xl animate-pop text-center">
            <div className="mx-auto relative grid h-16 w-16 place-items-center rounded-3xl bg-primary/15 text-primary mb-4 p-2">
              <img src={emblemSilver} alt="Samवाद" className="h-full w-full object-contain" />
            </div>

            <h3 className="text-xl font-bold font-display">Install Samवाद on iPhone</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Experience Samवाद full-screen just like WhatsApp without Safari address bars:
            </p>

            <div className="mt-5 space-y-3 text-left text-xs">
              <div className="flex items-center gap-3.5 rounded-2xl bg-secondary/60 p-3.5 border border-border">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Share className="h-4 w-4" />
                </div>
                <span>
                  1. Tap the <strong>Share</strong> button in Safari's bottom toolbar.
                </span>
              </div>
              <div className="flex items-center gap-3.5 rounded-2xl bg-secondary/60 p-3.5 border border-border">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <PlusSquare className="h-4 w-4" />
                </div>
                <span>
                  2. Scroll down and tap <strong>"Add to Home Screen"</strong>.
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-6 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground cursor-pointer transition hover:opacity-95 active:scale-98"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// Reusable 1-click install button for Headers / Navbars / CTA sections
export function InstallAppButton({ className = "", children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (isStandaloneApp()) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  if (isInstalled) return null;

  const triggerInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        toast.success("Installing Samवाद...", { icon: "📲" });
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      window.open("https://github.com/Hans-Soni/Let-s-Connect/releases/latest", "_blank");
    }
  };

  return (
    <button
      onClick={triggerInstall}
      className={`inline-flex items-center gap-2 cursor-pointer transition ${className}`}
      title="Install Samवाद App"
    >
      {children || (
        <>
          <Download className="h-4 w-4" />
          <span>Install App</span>
        </>
      )}
    </button>
  );
}
