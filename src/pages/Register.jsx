import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Briefcase,
  Sparkles,
  CheckCircle2,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import Logo from "../components/Logo";

const roles = [
  {
    id: "student",
    title: "I want to showcase my skills",
    description:
      "Create a profile, showcase your work and discover opportunities.",
    icon: Sparkles,
  },
  {
    id: "client",
    title: "I want to hire talent",
    description:
      "Find talented people and get the right person for your project.",
    icon: Briefcase,
  },
];

export default function Register() {
  const navigate = useNavigate();

  const [role, setRole] = useState("student");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName.trim(),
            username: formData.username.trim().toLowerCase(),
            role,
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (!authData.user) {
        throw new Error("Account could not be created.");
      }

      // Open modal on success and reset form fields
      setIsModalOpen(true);
      setFormData({
        fullName: "",
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Registration error:", error);
      setError(
        error.message || "Something went wrong while creating your account."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleModalRedirect = () => {
    setIsModalOpen(false);
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <Logo />
          </Link>

          <div className="text-sm text-slate-500">
            Already have an account?
            <Link
              to="/login"
              className="ml-2 font-bold text-navy-600 hover:text-navy-700"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="px-5 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 lg:grid-cols-[.85fr_1.15fr]">
            {/* Left Side */}
            <div className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:block">
              <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-navy-600/30 blur-2xl" />
              <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-navy-500/20 blur-2xl" />

              <div className="relative flex h-full flex-col">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-navy-400">
                    Join TCSN Network
                  </p>
                  <h1 className="mt-5 max-w-md font-['Space_Grotesk'] text-4xl font-bold leading-tight tracking-tight">
                    Your skills can take you somewhere.
                  </h1>
                  <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">
                    Build your reputation, showcase your work and connect with
                    people who need exactly what you know how to do.
                  </p>
                </div>

                <div className="mt-auto space-y-5 pt-16">
                  {[
                    "Create a professional profile",
                    "Showcase your best work",
                    "Discover real opportunities",
                    "Build your reputation",
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-navy-600/20 text-navy-400">
                        <Check size={15} />
                      </div>
                      <span className="text-sm text-slate-300">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-12 border-t border-slate-800 pt-7">
                  <p className="text-sm italic leading-6 text-slate-400">
                    "Don't just learn a skill. Build something people are willing to pay for."
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side / Form */}
            <div className="p-6 sm:p-10 lg:p-12">
              <div className="mx-auto max-w-xl">
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-navy-50 px-3 py-1.5 text-xs font-bold text-navy-600 lg:hidden">
                    <Sparkles size={13} />
                    Join TCSN Network
                  </div>
                  <h2 className="font-['Space_Grotesk'] text-3xl font-bold tracking-tight text-slate-950">
                    Create your account
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Start building your presence on TCSN Network.
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {/* Role Selection */}
                <div className="mt-8">
                  <label className="text-sm font-bold text-slate-800">
                    How will you use TCSN Network?
                  </label>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {roles.map((item) => {
                      const Icon = item.icon;
                      const selected = role === item.id;

                      return (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() => setRole(item.id)}
                          className={`relative rounded-2xl border p-4 text-left transition duration-200 ${
                            selected
                              ? "border-navy-500 bg-navy-50 ring-2 ring-navy-500/10"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          {selected && (
                            <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-navy-600 text-white">
                              <Check size={12} />
                            </div>
                          )}

                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                              selected
                                ? "bg-navy-600 text-white"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            <Icon size={19} />
                          </div>

                          <h3 className="mt-4 pr-5 text-sm font-bold text-slate-900">
                            {item.title}
                          </h3>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {item.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                  {/* Full Name */}
                  <div>
                    <label
                      htmlFor="fullName"
                      className="mb-2 block text-sm font-semibold text-slate-800"
                    >
                      Full name
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="e.g. David Johnson"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-navy-500 focus:ring-4 focus:ring-navy-500/10"
                    />
                  </div>

                  {/* Username */}
                  <div>
                    <label
                      htmlFor="username"
                      className="mb-2 block text-sm font-semibold text-slate-800"
                    >
                      Username
                    </label>
                    <div className="flex overflow-hidden rounded-xl border border-slate-200 focus-within:border-navy-500 focus-within:ring-4 focus-within:ring-navy-500/10">
                      <span className="flex items-center bg-slate-50 px-3 text-sm text-slate-400">
                        @
                      </span>
                      <input
                        id="username"
                        name="username"
                        type="text"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="yourusername"
                        required
                        className="min-w-0 flex-1 bg-white px-3 py-3.5 text-sm outline-none placeholder:text-slate-400"
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-slate-400">
                      This will be part of your public profile.
                    </p>
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-semibold text-slate-800"
                    >
                      Email address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-navy-500 focus:ring-4 focus:ring-navy-500/10"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label
                      htmlFor="password"
                      className="mb-2 block text-sm font-semibold text-slate-800"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Create a strong password"
                        required
                        minLength={6}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-navy-500 focus:ring-4 focus:ring-navy-500/10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="mb-2 block text-sm font-semibold text-slate-800"
                    >
                      Confirm password
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Repeat your password"
                        required
                        minLength={6}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-navy-500 focus:ring-4 focus:ring-navy-500/10"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="flex items-start gap-3 pt-1">
                    <input
                      id="terms"
                      type="checkbox"
                      required
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-navy-600 focus:ring-navy-500"
                    />
                    <label
                      htmlFor="terms"
                      className="text-xs leading-5 text-slate-500"
                    >
                      I agree to TCSN Network's{" "}
                      <Link
                        to="#"
                        className="font-semibold text-slate-800 hover:text-navy-600"
                      >
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link
                        to="#"
                        className="font-semibold text-slate-800 hover:text-navy-600"
                      >
                        Privacy Policy
                      </Link>
                      .
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-navy-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-navy-600/20 transition duration-300 hover:bg-navy-700 hover:shadow-navy-600/30 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create my account
                        <ArrowRight
                          size={18}
                          className="transition-transform group-hover:translate-x-1"
                        />
                      </>
                    )}
                  </button>
                </form>

                {/* Login link */}
                <p className="mt-7 text-center text-sm text-slate-500">
                  Already have an account?
                  <Link
                    to="/login"
                    className="ml-1 font-bold text-navy-600 hover:text-navy-700"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer note */}
      <div className="pb-8 text-center text-xs text-slate-400">
        Built for people with skills worth sharing.
      </div>

      {/* Account Created Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            >
              <X size={20} />
            </button>

            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                <CheckCircle2 size={36} />
              </div>

              <h3 className="mt-5 font-['Space_Grotesk'] text-2xl font-bold text-slate-900">
                Account Created!
              </h3>

              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Your account has been registered successfully. Please check your email inbox to verify your email address before signing in.
              </p>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={handleModalRedirect}
                  className="w-full rounded-xl bg-navy-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-navy-600/20 transition hover:bg-navy-700"
                >
                  Proceed to Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}