import { useThemeStore } from "../store/useThemeStore";
import { useChatStore } from "../store/useChatStore";
import emblemGold from "../assets/emblem_gold-sNN9olCf.png";
import emblemSilver from "../assets/emblem_silver-CXs3LN2i.png";
import { ShieldCheck, MessageSquare, Zap, Clock, ArrowRight } from "lucide-react";

const NoConversationPlaceholder = () => {
  const { theme } = useThemeStore();
  const { setActiveTab } = useChatStore();
  const dark = theme === "dark";

  return (
    <div className="relative flex flex-col items-center justify-center h-full w-full text-center p-6 sm:p-10 select-none overflow-y-auto">
      <div className="relative z-10 flex flex-col items-center max-w-md mx-auto">
        {/* Dual-Theme Lotus Emblem */}
        <div className="relative mb-6 animate-float">
          <div className="grid h-20 w-20 sm:h-24 sm:w-24 place-items-center rounded-3xl border border-border bg-card/80 shadow-glow backdrop-blur-xl">
            <img
              src={dark ? emblemSilver : emblemGold}
              alt="Lotus Emblem"
              className="h-14 w-14 sm:h-16 sm:w-16 object-contain"
            />
          </div>
        </div>

        {/* Headline */}
        <h3 className="font-display text-3xl sm:text-4xl font-bold leading-tight text-foreground">
          Every conversation, <br />
          <em className="text-gradient italic">beautifully private.</em>
        </h3>

        <p className="mt-2.5 font-deva text-lg sm:text-xl text-muted-foreground">
          Samवाद — where dialogue feels human again.
        </p>

        {/* Minimalist Feature Pills */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/80 px-3 py-1 text-xs font-medium text-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            P2P Direct
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/80 px-3 py-1 text-xs font-medium text-foreground">
            <Clock className="h-3.5 w-3.5 text-primary" />
            24h Ephemeral
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/80 px-3 py-1 text-xs font-medium text-foreground">
            <Zap className="h-3.5 w-3.5 text-primary" />
            HD Calling
          </span>
        </div>

        {/* Action Prompt Button matching the high-end card CTA */}
        <button
          type="button"
          onClick={() => setActiveTab("contacts")}
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-95 active:scale-95 cursor-pointer"
        >
          <span>Start a conversation</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default NoConversationPlaceholder;
