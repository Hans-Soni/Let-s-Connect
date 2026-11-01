import { LogOutIcon, VolumeOffIcon, Volume2Icon, Sun, Moon, BellIcon, BellOffIcon } from "lucide-react";
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

  if (!authUser) return null;

  return (
    <div className="px-3 sm:px-4 py-3 border-b border-base-100/50 shrink-0 w-full overflow-hidden">
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* AVATAR */}
          <div className="avatar online shrink-0">
            <button
              type="button"
              className="size-11 sm:size-12 rounded-full overflow-hidden relative group ring-2 ring-primary/20 hover:ring-primary/60 transition-all cursor-pointer"
              onClick={() => setViewingProfileUser(authUser)}
              aria-label="Open your profile settings"
              title="Profile settings"
            >
              <img
                src={authUser.profilePic || `${import.meta.env.BASE_URL}avatar.png`}
                alt="User image"
                className="size-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-white text-[10px] font-semibold">Edit</span>
              </div>
            </button>
          </div>

          {/* USERNAME & DESIGNATION / ONLINE TEXT */}
          <button
            type="button"
            className="text-left min-w-0 flex-1 truncate cursor-pointer hover:opacity-85 transition-opacity"
            onClick={() => setViewingProfileUser(authUser)}
            title="Open your profile settings"
          >
            <h3 className="text-base-content font-semibold text-sm truncate">
              {authUser.fullName}
            </h3>

            <p className="text-base-content/60 text-xs truncate">
              {authUser.designation || "Online"}
            </p>
          </button>
        </div>

        {/* BUTTONS BAR - shrink-0 ensures buttons NEVER get pushed out or hidden */}
        <div className="flex gap-1 items-center shrink-0">
          {/* THEME TOGGLE BTN */}
          <button
            type="button"
            className="btn btn-ghost btn-circle btn-sm text-base-content/70 hover:text-base-content"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>

          {/* SOUND TOGGLE BTN */}
          <button
            type="button"
            className="btn btn-ghost btn-circle btn-sm text-base-content/70 hover:text-base-content"
            onClick={() => {
              mouseClickSound.currentTime = 0;
              mouseClickSound.play().catch((error) => console.log("Audio play failed:", error));
              toggleSound();
            }}
            title={isSoundEnabled ? "Mute sounds" : "Enable sounds"}
            aria-label={isSoundEnabled ? "Mute sounds" : "Enable sounds"}
          >
            {isSoundEnabled ? (
              <Volume2Icon className="size-4" />
            ) : (
              <VolumeOffIcon className="size-4" />
            )}
          </button>

          {/* NOTIFICATION PERMISSION BTN */}
          <button
            type="button"
            className="btn btn-ghost btn-circle btn-sm text-base-content/70 hover:text-base-content"
            onClick={requestNotificationPermission}
            title={
              notificationPermission === "granted"
                ? "Device notifications enabled"
                : "Enable device notifications"
            }
            aria-label="Toggle notifications"
          >
            {notificationPermission === "granted" ? (
              <BellIcon className="size-4 text-primary" />
            ) : (
              <BellOffIcon className="size-4 opacity-60" />
            )}
          </button>

          {/* LOGOUT / SIGNOUT BTN - Clearly styled and always visible */}
          <button
            type="button"
            className="btn btn-ghost btn-circle btn-sm text-error/80 hover:text-error hover:bg-error/10 transition-colors shrink-0"
            onClick={logout}
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOutIcon className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
export default ProfileHeader;
