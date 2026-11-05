import { LogOutIcon, VolumeOffIcon, Volume2Icon } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const mouseClickSound = new Audio(`${import.meta.env.BASE_URL}sounds/mouse-click.mp3`);

function ProfileHeader() {
  const { logout, authUser } = useAuthStore();
  const { isSoundEnabled, toggleSound, setViewingProfileUser } = useChatStore();

  if (!authUser) return null;

  return (
    <div className="px-4 py-3 border-b border-border bg-card/40 backdrop-blur-sm shrink-0 w-full select-none">
      <div className="flex items-center justify-between gap-3 min-w-0">
        {/* User Card */}
        <button
          type="button"
          onClick={() => setViewingProfileUser(authUser)}
          className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer group"
          title="Open your profile settings"
        >
          <div className="relative shrink-0">
            <div className="h-10 w-10 rounded-full overflow-hidden ring-1 ring-border group-hover:ring-2 group-hover:ring-primary/60 transition-all">
              <img
                src={authUser.profilePic || `${import.meta.env.BASE_URL}avatar.png`}
                alt={authUser.fullName}
                className="h-full w-full object-cover"
              />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-online" />
          </div>

          <div className="min-w-0 flex-1 truncate">
            <h3 className="text-foreground font-semibold text-sm truncate group-hover:text-primary transition-colors">
              {authUser.fullName}
            </h3>
            <p className="text-muted-foreground text-xs truncate">
              {authUser.designation || "Available"}
            </p>
          </div>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            className={`grid h-8 w-8 place-items-center rounded-full transition-colors cursor-pointer ${
              isSoundEnabled
                ? "text-primary hover:bg-primary/10"
                : "text-muted-foreground hover:bg-secondary"
            }`}
            onClick={() => {
              mouseClickSound.currentTime = 0;
              mouseClickSound.play().catch(() => {});
              toggleSound();
            }}
            title={isSoundEnabled ? "Mute sounds" : "Enable sounds"}
            aria-label={isSoundEnabled ? "Mute sounds" : "Enable sounds"}
          >
            {isSoundEnabled ? <Volume2Icon className="h-4 w-4" /> : <VolumeOffIcon className="h-4 w-4" />}
          </button>

          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            onClick={logout}
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOutIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
export default ProfileHeader;
