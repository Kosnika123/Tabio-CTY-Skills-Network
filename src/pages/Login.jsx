import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Sparkles,
  ShieldCheck,
  Briefcase,
  Palette,
  Code2,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import Logo from "../components/Logo";

export default function Login() {
  const navigate = useNavigate();
  
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      if (signInError) {
        throw signInError;
      }

      if (!data.user) {
        throw new Error("Login failed. Please try again.");
      }

      // Fetch user profile to get role
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        throw profileError;
      }

      // Redirect based on role
      const userRole = profile?.role || "client";
      
      if (userRole === "talent") {
        navigate("/talent");
      } else if (userRole === "client" || userRole === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

const handleGoogleLogin = async () => {
  setError("");
  setLoading(true);

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      throw error;
    }
  } catch (err) {
    console.error("Google login error:", err);
    setError(err.message || "Unable to sign in with Google. Please try again.");
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}

      <header className="border-b border-slate-200 bg-white">

        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">

          {/* Logo */}

          <Link
            to="/"
            className="flex items-center gap-2"
          >
            <Logo />
          </Link>

          {/* Register link */}

          <div className="text-sm text-slate-500">

            Don't have an account?

            <Link
              to="/register"
              className="ml-2 font-bold text-navy-600 transition hover:text-navy-700"
            >
              Create one
            </Link>

          </div>

        </div>

      </header>


      {/* Main */}

      <main className="px-5 py-12 sm:px-6 lg:px-8">

        <div className="mx-auto max-w-6xl">

          <div className="grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 lg:grid-cols-[.9fr_1.1fr]">


            {/* Left panel */}

            <div className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:block">

              {/* Decorative background */}

              <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-navy-600/20 blur-3xl" />

              <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-navy-500/20 blur-3xl" />

              <div className="relative flex h-full flex-col">

                {/* Heading */}

                <div>

                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-navy-400">

                    <Sparkles size={13} />

                    Welcome back

                  </div>

                  <h1 className="mt-6 max-w-md font-['Space_Grotesk'] text-4xl font-bold leading-tight tracking-tight">

                    Great things are waiting for you.

                  </h1>

                  <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">

                    Continue building your reputation, discovering
                    opportunities and connecting with talented people
                    on TCSN Network.

                  </p>

                </div>


                {/* Mini cards */}

                <div className="mt-auto space-y-4 pt-16">

                  <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-600/15 text-navy-400">
                      <Code2 size={20} />
                    </div>

                    <div>

                      <p className="text-sm font-bold">
                        Developers
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Build. Ship. Get discovered.
                      </p>

                    </div>

                  </div>


                  <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-600/15 text-navy-400">
                      <Palette size={20} />
                    </div>

                    <div>

                      <p className="text-sm font-bold">
                        Creatives
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Create. Showcase. Earn.
                      </p>

                    </div>

                  </div>


                  <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-600/15 text-navy-400">
                      <Briefcase size={20} />
                    </div>

                    <div>

                      <p className="text-sm font-bold">
                        Opportunities
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Find people. Find projects.
                      </p>

                    </div>

                  </div>

                </div>


                {/* Security */}

                <div className="mt-8 flex items-center gap-2 border-t border-slate-800 pt-6 text-xs text-slate-500">

                  <ShieldCheck
                    size={15}
                    className="text-green-400"
                  />

                  Your account is protected with secure authentication.

                </div>

              </div>

            </div>


            {/* Login form */}

            <div className="p-6 sm:p-10 lg:p-14">

              <div className="mx-auto max-w-md">

                {/* Mobile badge */}

                <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-navy-50 px-3 py-1.5 text-xs font-bold text-navy-600 lg:hidden">

                  <Sparkles size={13} />

                  Welcome back

                </div>


                {/* Heading */}

                <div>

                  <h2 className="font-['Space_Grotesk'] text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                    Sign in
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Welcome back. Let's get you back to work.
                  </p>

                </div>


                {/* Google */}

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >

                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                  >
                    <path
                      fill="#4285F4"
                      d="M21.35 12.27c0-.68-.06-1.34-.17-1.97H12v3.73h5.22a4.47 4.47 0 0 1-1.94 2.93v2.43h3.14c1.84-1.69 2.93-4.18 2.93-7.12Z"
                    />

                    <path
                      fill="#34A853"
                      d="M12 21.9c2.63 0 4.84-.87 6.45-2.36l-3.14-2.43c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.51A9.75 9.75 0 0 0 12 21.9Z"
                    />

                    <path
                      fill="#FBBC05"
                      d="M6.54 14c-.2-.58-.31-1.2-.31-1.84s.11-1.26.31-1.84V7.81H3.3A9.75 9.75 0 0 0 2.25 12c0 1.58.38 3.07 1.05 4.19L6.54 14Z"
                    />

                    <path
                      fill="#EA4335"
                      d="M12 6.29c1.43 0 2.72.49 3.73 1.45l2.8-2.8C16.83 3.39 14.63 2.1 12 2.1a9.75 9.75 0 0 0-8.7 5.71L6.54 10.3C7.31 7.99 9.46 6.29 12 6.29Z"
                    />
                  </svg>

                  Continue with Google

                </button>


                {/* Divider */}

                <div className="my-7 flex items-center gap-4">

                  <div className="h-px flex-1 bg-slate-200" />

                  <span className="text-xs font-medium text-slate-400">
                    OR CONTINUE WITH EMAIL
                  </span>

                  <div className="h-px flex-1 bg-slate-200" />

                </div>


                {/* Error */}

                {error && (
                  <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

                    <div className="mt-0.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-xs font-bold">
                        !
                      </span>
                    </div>

                    <p>
                      {error}
                    </p>

                  </div>
                )}


                {/* Form */}

                <form
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >

                  {/* Email */}

                  <div>

                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-semibold text-slate-800"
                    >
                      Email address
                    </label>

                    <div className="relative">

                      <Mail
                        size={18}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        required
                        autoComplete="email"
                        className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-navy-500 focus:ring-4 focus:ring-navy-500/10"
                      />

                    </div>

                  </div>


                  {/* Password */}

                  <div>

                    <div className="mb-2 flex items-center justify-between">

                      <label
                        htmlFor="password"
                        className="text-sm font-semibold text-slate-800"
                      >
                        Password
                      </label>

                      <Link
                        to="/forgot-password"
                        className="text-xs font-semibold text-navy-600 transition hover:text-navy-700"
                      >
                        Forgot password?
                      </Link>

                    </div>

                    <div className="relative">

                      <Lock
                        size={18}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        required
                        autoComplete="current-password"
                        className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-navy-500 focus:ring-4 focus:ring-navy-500/10"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(!showPassword)
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                        aria-label={
                          showPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>

                    </div>

                  </div>


                  {/* Remember me */}

                  <div className="flex items-center gap-3 pt-1">

                    <input
                      id="remember"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) =>
                        setRememberMe(e.target.checked)
                      }
                      className="h-4 w-4 rounded border-slate-300 text-navy-600 focus:ring-navy-500"
                    />

                    <label
                      htmlFor="remember"
                      className="text-sm text-slate-500"
                    >
                      Keep me signed in
                    </label>

                  </div>


                  {/* Submit */}

                  <button
                    type="submit"
                    disabled={loading}
                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-navy-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-navy-600/20 transition duration-300 hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >

                    {loading ? (
                      <>
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign in

                        <ArrowRight
                          size={18}
                          className="transition-transform group-hover:translate-x-1"
                        />
                      </>
                    )}

                  </button>

                </form>


                {/* Register */}

                <div className="mt-8 text-center">

                  <p className="text-sm text-slate-500">

                    Don't have a TCSN Network account?

                    <Link
                      to="/register"
                      className="ml-1 font-bold text-navy-600 transition hover:text-navy-700"
                    >
                      Create one
                    </Link>

                  </p>

                </div>


                {/* Back */}

                <Link
                  to="/"
                  className="mx-auto mt-7 flex w-fit items-center gap-2 text-xs font-semibold text-slate-400 transition hover:text-slate-700"
                >
                  <ArrowLeft size={14} />
                  Back to TCSN Network
                </Link>

              </div>

            </div>

          </div>

        </div>

      </main>


      {/* Bottom */}

      <div className="pb-8 text-center text-xs text-slate-400">
        TCSN Network — Turn your skills into opportunities.
      </div>

    </div>
  );
}
