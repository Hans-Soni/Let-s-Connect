import { LogOutIcon, VolumeOffIcon, Volume2Icon, Sun, Moon, BellIcon, BellOffIcon, Shield, Sparkles } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useThemeStore } from "../store/useThemeStore";

const mouseClickSound = new Audio(`${import.meta.env.BASE_URL}sounds/mouse-click.mp3`);

function ProfileHeader() {
  const { logout, authUser } = useAuthStore();
  const {
    isSoundEnabled,
    toggleSound,
    notificationPermission,
    requestNotificationPermission,
    setViewingProfileUser,
  } = useChatStore();
  const { theme, setTheme } = useThemeStore();
  const dark = theme === "dark";

  if (!authUser) return null;

  return (
    <div className="px-3.5 py-3 border-b border-border/70 bg-card/60 backdrop-blur-md shrink-0 w-full overflow-hidden">
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* USER AVATAR WITH ONLINE BADGE */}
          <div className="relative shrink-0">
            <button
              type="button"
              className="relative h-10 w-10 sm:h-11 sm:w-11 rounded-full overflow-hidden ring-2 ring-primary/30 hover:ring-primary transition-all duration-200 cursor-pointer group"
              onClick={() => setViewingProfileUser(authUser)}
              aria-label="Open your profile settings"
              title="Profile settings"
            >
              <img
                src={authUser.profilePic || `${import.meta.env.BASE_URL}avatar.png`}
                alt={authUser.fullName}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-white text-[10px] font-semibold">Edit</span>
              </div>
            </button>
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-emerald-500 shadow-xs" />
          </div>

          {/* USERNAME & DESIGNATION */}
          <button
            type="button"
            className="text-left min-w-0 flex-1 truncate cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setViewingProfileUser(authUser)}
            title="Open your profile settings"
          >
            <h3 className="text-foreground font-semibold text-sm truncate flex items-center gap-1.5">
              <span>{authUser.fullName}</span>
            </h3>

            <p className="text-muted-foreground text-xs truncate flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span>{authUser.designation || "Active now"}</span>
            </p>
          </button>
        </div>

        {/* QUICK CONTROL ICONS BAR */}
        <div className="flex items-center gap-1 shrink-0">
          {/* THEME TOGGLE BTN WITH ANIMATED ROTATION */}
          <button
            type="button"
            onClick={() => setTheme(dark ? "light" : "dark")}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
            className="relative grid h-8 w-8 place-items-center rounded-full border border-border/70 bg-secondary/70 hover:border-primary/60 text-muted-foreground hover:text-foreground transition cursor-pointer"
          >
            <span className={`absolute transition-all duration-500 ${dark ? "rotate-0 opacity-100" : "-rotate-90 opacity-0"}`}>
              <Sun className="h-3.5 w-3.5" />
            </span>
            <span className={`absolute transition-all duration-500 ${dark ? "rotate-90 opacity-0" : "rotate-0 opacity-100"}`}>
              <Moon className="h-3.5 w-3.5" />
            </span>
          </button>

          {/* SOUND TOGGLE BTN */}
          <button
            type="button"
            className={`grid h-8 w-8 place-items-center rounded-full border border-border/70 bg-secondary/70 hover:border-primary/60 transition cursor-pointer ${
              isSoundEnabled ? "text-primary" : "text-muted-foreground"
            }`}
            onClick={() => {
              mouseClickSound.currentTime = 0;
              mouseClickSound.play().catch((error) => console.log("Audio play failed:", error));
              toggleSound();
            }}
            title={isSoundEnabled ? "Mute sounds" : "Enable sounds"}
            aria-label={isSoundEnabled ? "Mute sounds" : "Enable sounds"}
          >
            {isSoundEnabled ? (
              <Volume2Icon className="h-3.5 w-3.5" />
            ) : (
              <VolumeOffIcon className="h-3.5 w-3.5 opacity-60" />
            )}
          </button>

          {/* NOTIFICATION PERMISSION BTN */}
          <button
            type="button"
            className={`grid h-8 w-8 place-items-center rounded-full border border-border/70 bg-secondary/70 hover:border-primary/60 transition cursor-pointer ${
              notificationPermission === "granted" ? "text-primary" : "text-muted-foreground"
            }`}
            onClick={requestNotificationPermission}
            title={
              notificationPermission === "granted"
                ? "Device notifications enabled"
                : "Enable device notifications"
            }
            aria-label="Toggle notifications"
          >
            {notificationPermission === "granted" ? (
              <BellIcon className="h-3.5 w-3.5" />
            ) : (
              <BellOffIcon className="h-3.5 w-3.5 opacity-60" />
            )}
          </button>

          {/* LOGOUT / SIGNOUT BTN */}
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-full border border-border/70 bg-secondary/70 hover:border-destructive/60 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition cursor-pointer shrink-0"
            onClick={logout}
            title="Sign out of Samवाद"
            aria-label="Sign out"
          >
            <LogOutIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
export default ProfileHeader;
