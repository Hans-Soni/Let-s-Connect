import { TERMS_SECTIONS } from "../lib/terms";

function TermsContent() {
  return (
    <div className="space-y-4 text-sm leading-relaxed text-base-content/80">
      {TERMS_SECTIONS.map((section) => (
        <section key={section.title}>
          <h3 className="font-semibold text-base-content">{section.title}</h3>
          <p>{section.text}</p>
        </section>
      ))}
    </div>
  );
}

export default TermsContent;
