import { useThemeStore } from "../store/useThemeStore";
import { useChatStore } from "../store/useChatStore";
import logoLight from "../assets/samvaad_logo_light.png";
import logoDark from "../assets/samvaad_logo_dark.png";
import emblemGold from "../assets/emblem_gold-sNN9olCf.png";
import emblemSilver from "../assets/emblem_silver-CXs3LN2i.png";
import DeveloperFooter from "./DeveloperFooter";
import { Sparkles, MessageSquare, Video, ShieldCheck, ArrowLeft } from "lucide-react";

const HIGHLIGHT_TAGS = [
  "WebRTC P2P Direct",
  "HD Voice & Video",
  "Screen Sharing",
  "24h Ephemeral",
  "Zero Tracking",
  "Zero Ads",
];

const NoConversationPlaceholder = () => {
  const { theme } = useThemeStore();
  const { setActiveTab } = useChatStore();
  const dark = theme === "dark";

  return (
    <div className="relative flex flex-col items-center justify-between h-full w-full text-center p-4 sm:p-8 overflow-y-auto select-none bg-gradient-to-b from-card/30 via-card/70 to-card/90">
      {/* Ambient Orbit Graphic Behind Centerpiece */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[340px] w-[340px] sm:h-[420px] sm:w-[420px] rounded-full border border-primary/20 opacity-40 shadow-glow" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[260px] w-[260px] sm:h-[320px] sm:w-[320px] orbit animate-orbit opacity-60">
        <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-primary shadow-glow" />
        <span className="absolute bottom-4 right-8 h-2 w-2 rounded-full bg-primary-glow" />
      </div>

      <div className="my-auto relative z-10 flex flex-col items-center max-w-lg mx-auto py-6">
        {/* Floating Dual-Theme Lotus Emblem */}
        <div className="relative mb-4 sm:mb-6 animate-float">
          <div className="absolute inset-0 rounded-full bg-primary/25 blur-2xl animate-pulse" />
          <div className="relative grid h-24 w-24 sm:h-28 sm:w-28 place-items-center rounded-3xl border border-border bg-card/80 shadow-glow backdrop-blur-xl">
            <img
              src={dark ? emblemSilver : emblemGold}
              alt="Lotus Emblem"
              className="h-16 w-16 sm:h-20 sm:w-20 object-contain transition-transform duration-500 hover:scale-110"
            />
          </div>
        </div>

        {/* Brand Logo & Headline */}
        <div className="flex items-center justify-center mb-3">
          <img
            src={dark ? logoDark : logoLight}
            alt="Samवाद"
            className="h-9 sm:h-11 w-auto object-contain"
          />
        </div>

        <h3 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight text-foreground">
          Every conversation, <br />
          <em className="text-gradient italic">beautifully private.</em>
        </h3>

        <p className="mt-2.5 font-deva text-base sm:text-lg text-muted-foreground">
          Samवाद — where dialogue feels human again.
        </p>

        {/* Feature Ticker Pills */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 max-w-md">
          {HIGHLIGHT_TAGS.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/80 px-2.5 py-1 text-[11px] font-medium text-foreground/80 shadow-xs backdrop-blur-sm"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {tag}
            </span>
          ))}
        </div>

        {/* Action Prompt */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-2.5">
          <button
            type="button"
            onClick={() => setActiveTab("contacts")}
            className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground hover:shadow-glow cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Pick a contact from sidebar
          </button>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            End-to-End direct P2P
          </span>
        </div>
      </div>

      {/* DEVELOPER PROFILE FOOTER */}
      <div className="relative z-10 w-full max-w-md mt-4">
        <DeveloperFooter variant="compact" />
      </div>
    </div>
  );
};

export default NoConversationPlaceholder;
