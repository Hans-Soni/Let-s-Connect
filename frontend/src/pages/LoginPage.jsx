import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import { MessageCircleIcon, MailIcon, LoaderIcon, LockIcon, UserIcon } from "lucide-react";
import { Link } from "react-router";
import logoLight from "../assets/logo-light.png";
import logoDark from "../assets/logo-dark.png";
import DeveloperFooter from "../components/DeveloperFooter";
import TermsContent from "../components/TermsContent";
import { GoogleLogin } from "@react-oauth/google";
import { detectClientIp } from "../lib/detectClientIp";
import toast from "react-hot-toast";

function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isConsentOpen, setIsConsentOpen] = useState(false);
  const [hasAcceptedConsent, setHasAcceptedConsent] = useState(false);
  const [consentDeclined, setConsentDeclined] = useState(false);
  const [pendingGoogleAuth, setPendingGoogleAuth] = useState(null);
  const [clientIp, setClientIp] = useState("");
  const { login, googleLogin, isLoggingIn } = useAuthStore();
  const { theme } = useThemeStore();

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
    login(formData);
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

  const handleAcceptConsent = async () => {
    if (!hasAcceptedConsent || isLoggingIn) return;
    const resolvedIp =
      clientIp ||
      (await Promise.race([
        detectClientIp(),
        new Promise((resolve) => setTimeout(() => resolve(""), 1200)),
      ]));

    if (pendingGoogleAuth) {
      const result = await googleLogin({
        credential: pendingGoogleAuth.credential,
        clientIp: resolvedIp,
        dataConsent: true,
      });
      if (result?.success) {
        setIsConsentOpen(false);
        setPendingGoogleAuth(null);
      }
    }
  };

  const handleDeclineConsent = () => {
    setHasAcceptedConsent(false);
    setConsentDeclined(true);
    setPendingGoogleAuth(null);
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
                  <h2 className="text-xl sm:text-2xl font-bold text-base-content mb-1 sm:mb-2">Welcome Back</h2>
                  <p className="text-xs sm:text-sm text-base-content/60">Login to access your account</p>
                </div>

                {/* FORM */}
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-6">
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
                  <button className="auth-btn" type="submit" disabled={isLoggingIn}>
                    {isLoggingIn ? (
                      <LoaderIcon className="w-full h-5 animate-spin text-center" />
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </form>

                {/* GOOGLE SIGN-IN SECTION */}
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
                    text="signin_with"
                    width="100%"
                  />
                </div>
                <p className="mt-2 text-xs text-center text-base-content/60">
                  New users will review and accept our{" "}
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

                <div className="mt-3 sm:mt-6 text-center">
                  <Link to="/signup" className="auth-link">
                    Don't have an account? Sign Up
                  </Link>
                </div>
              </div>
            </div>

            {/* FORM ILLUSTRATION - RIGHT SIDE */}
            <div className="hidden md:w-1/2 md:flex items-center justify-center p-6 bg-gradient-to-bl from-base-200/50 to-transparent">
              <div>
                <img
                  src={`${import.meta.env.BASE_URL}login.png`}
                  alt="People using mobile devices"
                  className="w-full h-auto object-contain"
                />
                <div className="mt-6 text-center">
                  <h3 className="text-xl font-medium text-primary">Connect anytime, anywhere</h3>

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
              aria-labelledby="login-consent-title"
              className="my-auto w-full max-w-2xl max-h-[90dvh] overflow-y-auto rounded-2xl bg-base-100 p-5 text-base-content shadow-2xl sm:p-7"
            >
              <h2 id="login-consent-title" className="text-xl font-bold text-base-content sm:text-2xl">
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
                  disabled={isLoggingIn}
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
                  disabled={isLoggingIn}
                >
                  Disagree
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAcceptConsent}
                  disabled={!hasAcceptedConsent || isLoggingIn}
                >
                  {isLoggingIn ? (
                    <LoaderIcon className="size-5 animate-spin" />
                  ) : pendingGoogleAuth ? (
                    "Accept & Create Account with Google"
                  ) : (
                    "Close"
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
export default LoginPage;
