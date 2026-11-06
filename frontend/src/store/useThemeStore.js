import { create } from "zustand";

const initialTheme =
  localStorage.getItem("chat-theme") ||
  localStorage.getItem("samvaad-theme") ||
  localStorage.getItem("samvad-theme") ||
  "dark";

export const useThemeStore = create((set) => ({
  theme: initialTheme,
  setTheme: (theme) => {
    try {
      localStorage.setItem("chat-theme", theme);
      localStorage.setItem("samvaad-theme", theme);
      localStorage.setItem("samvad-theme", theme);
      document.documentElement.classList.toggle("dark", theme === "dark");
      document.documentElement.setAttribute("data-theme", theme);
    } catch (e) {
      console.warn("Theme storage sync error:", e);
    }
    set({ theme });
  },
}));

