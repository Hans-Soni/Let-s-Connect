import { useThemeStore } from "../store/useThemeStore";
import { useChatStore } from "../store/useChatStore";
import emblemGold from "../assets/emblem_gold-sNN9olCf.png";
import emblemSilver from "../assets/emblem_silver-CXs3LN2i.png";
import { Sparkles, MessageSquare, ShieldCheck } from "lucide-react";

const NoChatHistoryPlaceholder = ({ name }) => {
  const { theme } = useThemeStore();
  const { sendMessage } = useChatStore();
  const dark = theme === "dark";

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6 select-none my-auto">
      {/* Dual Theme Lotus Emblem */}
      <div className="relative mb-4">
        <div className="grid h-16 w-16 place-items-center rounded-2xl border border-border bg-card shadow-xs">
          <img
            src={dark ? emblemSilver : emblemGold}
            alt="Samवाद"
            className="h-10 w-10 object-contain"
          />
        </div>
      </div>

      <h3 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-1.5">
        Dialogue with <span className="text-primary">{name}</span>
      </h3>

      <div className="flex flex-col items-center space-y-1.5 max-w-sm mb-6">
        <p className="text-muted-foreground text-xs sm:text-sm">
          This is the beginning of your private P2P dialogue.
        </p>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3 w-3 text-emerald-500" />
          Direct WebRTC · 24h Ephemeral
        </span>
      </div>

      {/* Quick starter chips */}
      <div className="flex flex-wrap gap-2 justify-center max-w-xs">
        {[
          "Namaste! 🌸",
          "Let's connect!",
          "Free for a quick call?",
          "Hey, let's collaborate",
        ].map((starter) => (
          <button
            key={starter}
            type="button"
            onClick={() => sendMessage({ text: starter })}
            className="px-3.5 py-1.5 text-xs font-medium text-foreground bg-secondary/80 border border-border rounded-full hover:border-primary/50 hover:text-primary active:scale-95 transition cursor-pointer"
          >
            {starter}
          </button>
        ))}
      </div>
    </div>
  );
};

export default NoChatHistoryPlaceholder;
