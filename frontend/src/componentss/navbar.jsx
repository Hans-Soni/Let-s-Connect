import { Bell, MoonStar, Plus, Search, Sparkles, SunMedium } from "lucide-react";
import { UseAuthStore } from "../store/UseAuthStore";

const Navbar = ({ theme, onToggleTheme }) => {
  const { authUser } = UseAuthStore();

  return (
    <header className="topbar">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-5 py-4">
        <div className="text-[2rem] font-bold tracking-tight text-[var(--text)]">You & Me</div>

        <div className="flex items-center gap-4 text-sm text-[var(--text-soft)]">
          <div className="badge-pill">
            <Sparkles className="size-4 text-[var(--accent-1)]" />
            <span className="font-semibold">150%</span>
          </div>

          <button className="icon-btn" aria-label="Search">
            <Search className="size-4" />
          </button>

          <button className="icon-btn" aria-label="Add">
            <Plus className="size-4" />
          </button>

          <button className="icon-btn" aria-label="Notifications">
            <Bell className="size-4" />
          </button>

          <button
            type="button"
            className="theme-switch"
            onClick={onToggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            <span className="theme-switch-track">
              <span className="theme-switch-thumb">
                {theme === "dark" ? <MoonStar className="size-3.5" /> : <SunMedium className="size-3.5" />}
              </span>
            </span>
          </button>

          <div className="ml-1 flex size-8 items-center justify-center rounded-full bg-[var(--accent-1)] text-sm font-bold text-white shadow-md">
            {authUser ? authUser.fullName?.charAt(0)?.toUpperCase() : "YM"}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;