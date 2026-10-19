import { ExternalLink, Globe, Sparkles } from "lucide-react";

export default function DeveloperFooter({ variant = "line", className = "" }) {
  if (variant === "sidebar") {
    return (
      <div
        className={`px-3 py-2 border-t border-base-100/50 bg-base-200/70 backdrop-blur-sm text-[11px] sm:text-xs text-center flex items-center justify-center gap-1.5 text-base-content/80 shrink-0 ${className}`}
      >
        <Sparkles className="size-3 text-primary shrink-0" />
        <span>
          By <strong className="text-primary font-semibold">Hans Soni</strong>
        </span>
        <span className="text-base-content/40">•</span>
        <a
          href="https://hans-soni.github.io/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary font-bold hover:underline"
          title="Visit Hans Soni's Portfolio"
        >
          <Globe className="size-3" />
          <span>Portfolio</span>
          <ExternalLink className="size-2.5 opacity-80" />
        </a>
      </div>
    );
  }

  return (
    <div
      className={`w-full py-1.5 sm:py-2 px-2.5 sm:px-4 rounded-xl bg-base-200/70 backdrop-blur-md border border-base-100/50 text-center flex items-center justify-center flex-wrap gap-x-1.5 sm:gap-x-2 gap-y-0.5 sm:gap-y-1 text-[11px] sm:text-xs text-base-content/80 shadow-sm shrink-0 ${className}`}
    >
      <span className="inline-flex items-center gap-1 sm:gap-1.5 font-medium text-base-content/90">
        <Sparkles className="size-3 sm:size-3.5 text-primary shrink-0" />
        <span>
          Created by <strong className="font-semibold text-primary">Hans Soni</strong> — Full-Stack Software Developer and Cybersecurity Engineer
        </span>
      </span>
      <span className="text-base-content/40">•</span>
      <a
        href="https://hans-soni.github.io/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 font-bold text-primary hover:underline hover:text-primary-focus transition-colors shrink-0"
        title="Visit Hans Soni's Portfolio"
      >
        <Globe className="size-3 sm:size-3.5" />
        <span>Portfolio</span>
        <ExternalLink className="size-2.5 sm:size-3 opacity-80" />
      </a>
    </div>
  );
}
