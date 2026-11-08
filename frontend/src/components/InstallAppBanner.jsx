import { useState, useEffect } from "react";
import { Download, Smartphone, X, CheckCircle, Share, PlusSquare } from "lucide-react";
import toast from "react-hot-toast";

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

    // Detect iOS
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

  if (isInstalled || isDismissed) return null;

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
      {/* Sleek Floating Install Prompt (Bottom Right on Desktop, Bottom Center on Mobile) */}
      <aside
        aria-label="Install Samवाद App"
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 animate-pop max-w-md"
      >
        <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-background/95 backdrop-blur-xl p-4 shadow-2xl transition hover:border-primary/50">
          <button
            onClick={handleDismiss}
            aria-label="Dismiss banner"
            className="absolute top-2.5 right-2.5 p-1 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3.5 pr-6">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/40 text-primary shadow-inner">
              <Smartphone className="h-6 w-6" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-semibold text-foreground truncate">
                  Install Samवाद App
                </h4>
                <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                  1-Click
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                Use like WhatsApp / Instagram with zero address bar.
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground shadow-elegant hover:-translate-y-0.5 active:translate-y-0 transition cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Install to Home Screen</span>
            </button>

            <a
              href="https://github.com/Hans-Soni/Let-s-Connect/releases/latest"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/50 px-3 py-2.5 text-xs font-medium text-foreground hover:bg-secondary transition"
              title="Download Android APK"
            >
              <span>Get APK</span>
            </a>
          </div>
        </div>
      </aside>

      {/* iOS Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-background p-6 shadow-2xl animate-pop text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary mb-4">
              <Smartphone className="h-7 w-7" />
            </div>

            <h3 className="text-lg font-bold">Install Samवाद on iPhone</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Add Samवाद to your Home Screen in 2 simple taps:
            </p>

            <div className="mt-5 space-y-3 text-left text-xs">
              <div className="flex items-center gap-3 rounded-xl bg-secondary/50 p-3">
                <Share className="h-5 w-5 text-primary shrink-0" />
                <span>
                  1. Tap the <strong>Share</strong> button in Safari's bottom toolbar.
                </span>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-secondary/50 p-3">
                <PlusSquare className="h-5 w-5 text-primary shrink-0" />
                <span>
                  2. Scroll down and tap <strong>"Add to Home Screen"</strong>.
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-6 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground cursor-pointer transition hover:opacity-90"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// Reusable 1-click install button for Headers / Navbars / Buttons
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
      // If iOS or unsupported browser, open latest release or trigger installation guide
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
