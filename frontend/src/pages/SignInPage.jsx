import { useState } from "react";
import { UseAuthStore } from "../store/UseAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import { MessageCircleIcon, MailIcon, LoaderIcon, LockIcon } from "lucide-react";
import { Link } from "react-router-dom";

function SigninPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const { signin, IsSigningIn } = UseAuthStore();
  const { theme } = useThemeStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    signin(formData);
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <div className="relative h-[650px] w-full max-w-6xl md:h-[800px]">
        <BorderAnimatedContainer>
          <div className="flex w-full flex-col md:flex-row">
            <div className="flex items-center justify-center p-8 md:w-1/2 md:border-r md:border-[#3d2a20]/10">
              <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                  <img src={theme === "dark" ? "/logo-dark.svg" : "/logo-light.svg"} alt="Logo" className="mx-auto mb-4 h-12 w-12" />
                  <h2 className="mb-2 text-2xl font-bold text-[#3d2a20]">Welcome Back</h2>
                  <p className="text-[#5f4a3b]">Login to access your account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
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

                  <button className="auth-btn" type="submit" disabled={IsSigningIn}>
                    {IsSigningIn ? (
                      <LoaderIcon className="h-5 w-full animate-spin text-center" />
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <Link to="/SignUp" className="auth-link">
                    Don&apos;t have an account? Sign Up
                  </Link>
                </div>
              </div>
            </div>

            <div className="hidden items-center justify-center bg-gradient-to-bl from-[#aebf92]/25 via-[#f5ead8]/20 to-transparent p-6 md:flex md:w-1/2">
              <div>
                <img
                  src="./login.png"
                  alt="People using mobile devices"
                  className="h-auto w-full object-contain"
                />
                <div className="mt-6 text-center">
                  <h3 className="text-xl font-semibold text-[#5f4a3b]">Connect anytime, anywhere</h3>

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
    </div>
  );
}
export default SigninPage;