import { useChatStore } from "../store/useChatStore";
import { useThemeStore } from "../store/useThemeStore";
import emblemGold from "../assets/emblem_gold-sNN9olCf.png";
import emblemSilver from "../assets/emblem_silver-CXs3LN2i.png";
import { Users, ArrowRight } from "lucide-react";

function NoChatsFound() {
  const { setActiveTab } = useChatStore();
  const { theme } = useThemeStore();
  const dark = theme === "dark";

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center space-y-3.5 select-none">
      <div className="grid h-14 w-14 place-items-center rounded-2xl border border-border bg-card shadow-xs">
        <img
          src={dark ? emblemSilver : emblemGold}
          alt="Samवाद"
          className="h-8 w-8 object-contain"
        />
      </div>
      <div className="max-w-xs">
        <h4 className="font-semibold text-sm text-foreground">No conversations yet</h4>
        <p className="text-muted-foreground text-xs mt-0.5">
          Choose a contact from the directory to start a private conversation.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setActiveTab("contacts")}
        className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-primary-foreground bg-primary rounded-xl shadow-xs hover:opacity-95 active:scale-95 transition cursor-pointer"
      >
        <span>Open Directory</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
export default NoChatsFound;
