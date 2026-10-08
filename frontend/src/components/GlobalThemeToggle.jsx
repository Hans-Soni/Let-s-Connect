import { Sun, Moon } from "lucide-react";
import { useThemeStore } from "../store/useThemeStore";

function GlobalThemeToggle() {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="absolute top-4 right-4 z-50">
      <button
        className="btn btn-circle btn-ghost bg-base-200/50 backdrop-blur-sm border border-base-content/10 text-base-content/70 hover:text-base-content transition-all shadow-sm"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        title="Toggle Theme"
      >
        {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
      </button>
    </div>
  );
}
export default GlobalThemeToggle;
