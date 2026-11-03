import { useState, useEffect } from "react";
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
import { detectClientIp } from "../lib/detectClientIp";
import { GoogleLogin } from "@react-oauth/google";
import toast from "react-hot-toast";

function SignUpPage() {
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "" });
  const [isConsentOpen, setIsConsentOpen] = useState(false);
  const [hasAcceptedConsent, setHasAcceptedConsent] = useState(false);
  const [consentDeclined, setConsentDeclined] = useState(false);
  const [pendingGoogleAuth, setPendingGoogleAuth] = useState(null);
  const [clientIp, setClientIp] = useState("");
  const { signup, googleLogin, isSigningUp, isLoggingIn } = useAuthStore();
  const { theme } = useThemeStore();

  // Proactively detect genuine client device IP
  useEffect(() => {
    let isMounted = true;
    detectClientIp().then((ip) => {
      if (ip && isMounted) {
        setClientIp(ip);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setPendingGoogleAuth(null);
    setConsentDeclined(false);
    setHasAcceptedConsent(false);
    setIsConsentOpen(true);
  };

  const handleAcceptConsent = async () => {
    if (!hasAcceptedConsent || isSigningUp || isLoggingIn) return;
    const resolvedIp =
      clientIp ||
      (await Promise.race([
        detectClientIp(),
        new Promise((resolve) => setTimeout(() => resolve(""), 1200)),
      ]));

    if (pendingGoogleAuth) {
      // Finalize Google account creation with explicit legal consent
      const result = await googleLogin({
        credential: pendingGoogleAuth.credential,
        clientIp: resolvedIp,
        dataConsent: true,
      });
      if (result?.success) {
        setIsConsentOpen(false);
        setPendingGoogleAuth(null);
      }
    } else {
      // Standard email/password signup
      const created = await signup({ ...formData, dataConsent: true, clientIp: resolvedIp });
      if (created) setIsConsentOpen(false);
    }
  };

  const handleDeclineConsent = () => {
    setHasAcceptedConsent(false);
    setConsentDeclined(true);
    setPendingGoogleAuth(null);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      toast.error("Google authentication failed");
      return;
    }
    const resolvedIp =
      clientIp ||
      (await Promise.race([
        detectClientIp(),
        new Promise((resolve) => setTimeout(() => resolve(""), 1200)),
      ]));

    // Attempt Google login without pre-assumed consent
    const result = await googleLogin({
      credential: credentialResponse.credential,
      clientIp: resolvedIp,
      dataConsent: false,
    });

    if (result?.requiresConsent) {
      // New Google user must explicitly review and accept terms & conditions
      setPendingGoogleAuth({
        credential: credentialResponse.credential,
        userDetails: result.userDetails,
      });
      setHasAcceptedConsent(false);
      setConsentDeclined(false);
      setIsConsentOpen(true);
    }
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
                  <Link to="/" title="Back to Welcome Page" className="inline-block hover:scale-105 transition-transform">
                    <img src={theme === "dark" ? logoDark : logoLight} alt="Let's Connect Logo" className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-2 sm:mb-4" />
                  </Link>
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
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  {/* SUBMIT BUTTON */}
                  <button className="btn btn-primary w-full" type="submit" disabled={isSigningUp || isLoggingIn}>
                    {isSigningUp ? (
                      <LoaderIcon className="size-5 animate-spin" />
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </form>

                {/* GOOGLE SIGN-UP / SIGN-IN SECTION */}
                <div className="divider text-xs text-base-content/40 my-3 sm:my-5">OR</div>
                <div className="flex justify-center w-full">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => {
                      toast.error("Google Sign-In was cancelled or failed");
                    }}
                    theme={theme === "dark" ? "filled_black" : "outline"}
                    shape="pill"
                    size="large"
                    text="signup_with"
                    width="100%"
                  />
                </div>
                <p className="mt-2 text-xs text-center text-base-content/60">
                  By continuing with Google, you will review and accept our{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setPendingGoogleAuth(null);
                      setHasAcceptedConsent(false);
                      setConsentDeclined(false);
                      setIsConsentOpen(true);
                    }}
                    className="link link-primary font-medium inline"
                  >
                    Terms &amp; Data Authorization
                  </button>
                  .
                </p>

                {/* FOOTER */}
                <div className="text-center mt-3 sm:mt-6">
                  <p className="text-xs sm:text-sm text-base-content/60">
                    Already have an account?{" "}
                    <Link to="/login" className="link link-primary">
                      Sign in
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE - HERO CONTENT */}
            <div className="hidden md:flex md:w-1/2 p-8 flex-col justify-center items-center text-center">
              <div className="max-w-md">
                <div className="size-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <MessageCircleIcon className="size-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-base-content mb-3">Join our community</h3>
                <p className="text-base-content/70">
                  Connect with friends, share moments, and stay in touch with the people who matter most.
                </p>
              </div>
            </div>
          </div>
        </BorderAnimatedContainer>
      </div>

      {/* DEVELOPER FOOTER */}
      <DeveloperFooter />

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

              {pendingGoogleAuth && (
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 p-3 text-base-content">
                  {pendingGoogleAuth.userDetails?.profilePic ? (
                    <img
                      src={pendingGoogleAuth.userDetails.profilePic}
                      alt="Google avatar"
                      className="size-10 rounded-full border border-primary/40 object-cover"
                    />
                  ) : (
                    <UserIcon className="size-8 text-primary" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                      Google Account Identified
                    </p>
                    <p className="truncate text-sm font-medium text-base-content">
                      {pendingGoogleAuth.userDetails?.fullName || "Google User"} ({pendingGoogleAuth.userDetails?.email})
                    </p>
                  </div>
                </div>
              )}

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
                  disabled={isSigningUp || isLoggingIn}
                />
                <span className="text-sm text-base-content">
                  I have read and agree to these terms, and authorize the data use described above.
                </span>
              </label>

              {clientIp && (
                <p className="mt-2 text-xs text-base-content/60">
                  Device IP for audit &amp; security consent: <code className="font-mono text-primary font-medium">{clientIp}</code>
                </p>
              )}

              {consentDeclined && (
                <p className="mt-3 text-sm text-warning" role="status">
                  You declined. Your account was not created and no details were submitted.
                  This consent screen will remain open.
                </p>
              )}

              <div className="mt-5 flex flex-col-reverse justify-end gap-3 sm:flex-row">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleDeclineConsent}
                  disabled={isSigningUp || isLoggingIn}
                >
                  Disagree
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAcceptConsent}
                  disabled={!hasAcceptedConsent || isSigningUp || isLoggingIn}
                >
                  {isSigningUp || isLoggingIn ? (
                    <LoaderIcon className="size-5 animate-spin" />
                  ) : pendingGoogleAuth ? (
                    "Accept & Create Account with Google"
                  ) : (
                    "Accept & Create Account"
                  )}
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
