import { useState, useRef } from "react";
import { LogOutIcon, VolumeOffIcon, Volume2Icon, Sun, Moon } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useThemeStore } from "../store/useThemeStore";

const mouseClickSound = new Audio(`${import.meta.env.BASE_URL}sounds/mouse-click.mp3`);

function ProfileHeader() {
  const { logout, authUser, updateProfile } = useAuthStore();
  const { isSoundEnabled, toggleSound } = useChatStore();
  const { theme, setTheme } = useThemeStore();
  const [selectedImg, setSelectedImg] = useState(null);

  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onloadend = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  if (!authUser) return null;

  return (
    <div className="p-3.5 sm:p-5 border-b border-base-100/50 shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* AVATAR */}
          <div className="avatar online">
            <button
              className="size-14 rounded-full overflow-hidden relative group"
              onClick={() => fileInputRef.current.click()}
            >
              <img
                src={selectedImg || authUser.profilePic || `${import.meta.env.BASE_URL}avatar.png`}
                alt="User image"
                className="size-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-white text-xs">Change</span>
              </div>
            </button>

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* USERNAME & ONLINE TEXT */}
          <div>
            <h3 className="text-base-content font-medium text-base max-w-[180px] truncate">
              {authUser.fullName}
            </h3>

            <p className="text-base-content/60 text-xs">Online</p>
          </div>
        </div>

        {/* BUTTONS */}
        <div className="flex gap-2.5 sm:gap-3 items-center">
          {/* THEME TOGGLE BTN */}
          <button
            className="btn btn-ghost btn-circle btn-sm text-base-content/70 hover:text-base-content"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
          </button>

          {/* SOUND TOGGLE BTN */}
          <button
            className="btn btn-ghost btn-circle btn-sm text-base-content/70 hover:text-base-content"
            onClick={() => {
              mouseClickSound.currentTime = 0;
              mouseClickSound.play().catch((error) => console.log("Audio play failed:", error));
              toggleSound();
            }}
            title={isSoundEnabled ? "Mute sounds" : "Enable sounds"}
          >
            {isSoundEnabled ? (
              <Volume2Icon className="size-4.5" />
            ) : (
              <VolumeOffIcon className="size-4.5" />
            )}
          </button>

          {/* LOGOUT BTN */}
          <button
            className="btn btn-ghost btn-circle btn-sm text-base-content/70 hover:text-error transition-colors"
            onClick={logout}
            title="Log out"
          >
            <LogOutIcon className="size-4.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
export default ProfileHeader;
