import { useState } from "react";
import { createPortal } from "react-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import { MessageCircleIcon, LockIcon, MailIcon, UserIcon, LoaderIcon } from "lucide-react";
import { Link } from "react-router";
import logoLight from "../assets/logo-light.png";
import logoDark from "../assets/logo-dark.png";
import DeveloperFooter from "../components/DeveloperFooter";
import TermsContent from "../components/TermsContent";

function SignUpPage() {
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "" });
  const [isConsentOpen, setIsConsentOpen] = useState(false);
  const [hasAcceptedConsent, setHasAcceptedConsent] = useState(false);
  const [consentDeclined, setConsentDeclined] = useState(false);
  const { signup, isSigningUp } = useAuthStore();
  const { theme } = useThemeStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    setConsentDeclined(false);
    setHasAcceptedConsent(false);
    setIsConsentOpen(true);
  };

  const handleAcceptConsent = async () => {
    if (!hasAcceptedConsent || isSigningUp) return;
    const created = await signup({ ...formData, dataConsent: true });
    if (created) setIsConsentOpen(false);
  };

  const handleDeclineConsent = () => {
    setHasAcceptedConsent(false);
    setConsentDeclined(true);
  };

  return (
    <div className="w-full min-h-[100dvh] flex flex-col items-center justify-between p-2 sm:p-4 bg-base-300 py-3 sm:py-6 gap-2 sm:gap-4">
      <div className="relative w-full max-w-6xl md:h-[800px] min-h-fit my-auto">
        <BorderAnimatedContainer>
          <div className="w-full flex flex-col md:flex-row min-h-fit">
            {/* FORM COLUMN - LEFT SIDE */}
            <div className="w-full md:w-1/2 p-3 sm:p-8 flex items-center justify-center md:border-r border-slate-600/30">
              <div className="w-full max-w-md">
                {/* HEADING TEXT */}
                <div className="text-center mb-3 sm:mb-8">
                  <img src={theme === "dark" ? logoDark : logoLight} alt="Let's Connect Logo" className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-2 sm:mb-4" />
                  <h2 className="text-xl sm:text-2xl font-bold text-base-content mb-1 sm:mb-2">Create Account</h2>
                  <p className="text-xs sm:text-sm text-base-content/60">Sign up for a new account</p>
                </div>

                {/* FORM */}
                <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-6">
                  {/* FULL NAME */}
                  <div>
                    <label className="auth-input-label">Full Name</label>
                    <div className="relative">
                      <UserIcon className="auth-input-icon" />

                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="input"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  {/* EMAIL INPUT */}
                  <div>
                    <label className="auth-input-label">Email</label>
                    <div className="relative">
                      <MailIcon className="auth-input-icon" />

                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="input"
                        placeholder="johndoe@gmail.com"
                      />
                    </div>
                  </div>

                  {/* PASSWORD INPUT */}
                  <div>
                    <label className="auth-input-label">Password</label>
                    <div className="relative">
                      <LockIcon className="auth-input-icon" />

                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="input"
                        placeholder="Enter your password"
                      />
                    </div>
                  </div>

                  {/* SUBMIT BUTTON */}
                  <button className="auth-btn" type="submit" disabled={isSigningUp}>
                    {isSigningUp ? (
                      <LoaderIcon className="w-full h-5 animate-spin text-center" />
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </form>

                <div className="mt-3 sm:mt-6 text-center">
                  <Link to="/login" className="auth-link">
                    Already have an account? Login
                  </Link>
                </div>
              </div>
            </div>

            {/* FORM ILLUSTRATION - RIGHT SIDE */}
            <div className="hidden md:w-1/2 md:flex items-center justify-center p-6 bg-gradient-to-bl from-base-200/50 to-transparent">
              <div>
                <img
                  src={`${import.meta.env.BASE_URL}signup.png`}
                  alt="People using mobile devices"
                  className="w-full h-auto object-contain"
                />
                <div className="mt-6 text-center">
                  <h3 className="text-xl font-medium text-primary">Start Your Journey Today</h3>

                  <div className="mt-4 flex justify-center gap-4">
                    <span className="auth-badge">Free</span>
                    <span className="auth-badge">Easy Setup</span>
                    <span className="auth-badge">Private</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </BorderAnimatedContainer>
      </div>

      {/* DEVELOPER DESCRIPTION & PROJECTS FOOTER */}
      <div className="w-full max-w-6xl shrink-0">
        <DeveloperFooter />
      </div>

      {isConsentOpen && (
        createPortal(
          <div className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-black/70 p-3 sm:p-6">
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="signup-consent-title"
              className="my-auto w-full max-w-2xl max-h-[90dvh] overflow-y-auto rounded-2xl bg-base-100 p-5 text-base-content shadow-2xl sm:p-7"
            >
              <h2 id="signup-consent-title" className="text-xl font-bold text-base-content sm:text-2xl">
                Terms &amp; Data Authorization
              </h2>
              <p className="mt-2 text-sm text-base-content/70">
                Please review and accept before creating your account.
              </p>

              <TermsContent />

              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-base-content/15 p-3">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary mt-0.5"
                  checked={hasAcceptedConsent}
                  onChange={(event) => {
                    setHasAcceptedConsent(event.target.checked);
                    setConsentDeclined(false);
                  }}
                  disabled={isSigningUp}
                />
                <span className="text-sm text-base-content">
                  I have read and agree to these terms, and authorize the data use described above.
                </span>
              </label>

              {consentDeclined && (
                <p className="mt-3 text-sm text-warning" role="status">
                  You declined. Your account was not created and your details were not submitted.
                  This consent screen will remain open.
                </p>
              )}

              <div className="mt-5 flex flex-col-reverse justify-end gap-3 sm:flex-row">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleDeclineConsent}
                  disabled={isSigningUp}
                >
                  Disagree
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAcceptConsent}
                  disabled={!hasAcceptedConsent || isSigningUp}
                >
                  {isSigningUp ? <LoaderIcon className="size-5 animate-spin" /> : "Accept & Create Account"}
                </button>
              </div>
            </section>
          </div>,
          document.body
        )
      )}
    </div>
  );
}
export default SignUpPage;
