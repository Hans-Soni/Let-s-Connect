import { TERMS_SECTIONS, CURRENT_TERMS_VERSION, TERMS_LAST_UPDATED } from "../lib/terms";
import { ShieldCheck } from "lucide-react";

function TermsContent() {
  return (
    <div className="space-y-4 text-sm leading-relaxed text-base-content/80">
      {/* Header Badge & Version Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-base-content/10 pb-3 text-xs text-base-content/60">
        <span className="flex items-center gap-1.5 font-medium text-primary">
          <ShieldCheck className="size-4" />
          Terms of Service &amp; Privacy Policy
        </span>
        <span className="badge badge-sm badge-outline">
          Version {CURRENT_TERMS_VERSION} • {TERMS_LAST_UPDATED}
        </span>
      </div>

      {TERMS_SECTIONS.map((section) => (
        <section
          key={section.id || section.title}
          className="rounded-xl border border-base-content/10 bg-base-200/40 p-4 transition-all hover:bg-base-200/60"
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <h3 className="font-semibold text-base-content text-sm sm:text-base">
              {section.title}
            </h3>
            {section.badge && (
              <span className="badge badge-xs sm:badge-sm badge-primary badge-outline shrink-0">
                {section.badge}
              </span>
            )}
          </div>

          {section.summary && (
            <p className="text-xs font-medium text-primary/90 mb-2 italic">
              {section.summary}
            </p>
          )}

          {section.paragraphs ? (
            <div className="space-y-2">
              {section.paragraphs.map((p, idx) => (
                <p key={idx} className="text-xs sm:text-sm text-base-content/80 leading-relaxed">
                  {p}
                </p>
              ))}
            </div>
          ) : section.text ? (
            <p className="text-xs sm:text-sm text-base-content/80 leading-relaxed">{section.text}</p>
          ) : null}

          {section.bullets && section.bullets.length > 0 && (
            <ul className="mt-2.5 space-y-1.5 pl-4 text-xs sm:text-sm text-base-content/75 list-disc marker:text-primary">
              {section.bullets.map((bullet, idx) => (
                <li key={idx} className="leading-relaxed">
                  {bullet}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

export default TermsContent;
