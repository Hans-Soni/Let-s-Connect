import { ExternalLink, Globe, Sparkles } from "lucide-react";

export default function DeveloperFooter({ variant = "line", className = "" }) {
  return (
    <div
      className={`w-full py-1 text-center flex items-center justify-center flex-wrap gap-x-2 text-[11px] sm:text-xs text-muted-foreground select-none shrink-0 ${className}`}
    >
      <span className="inline-flex items-center gap-1.5 font-normal">
        <Sparkles className="size-3 text-primary shrink-0" />
        <span>
          Created by <strong className="font-medium text-foreground">Hans Soni</strong> — Full-Stack Developer &amp; Cybersecurity Engineer
        </span>
      </span>
      <span className="opacity-40">•</span>
      <a
        href="https://hans-soni.github.io/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 font-medium text-primary hover:underline transition-colors shrink-0"
        title="Visit Hans Soni's Portfolio"
      >
        <Globe className="size-3" />
        <span>Portfolio</span>
        <ExternalLink className="size-2.5 opacity-80" />
      </a>
    </div>
  );
}
