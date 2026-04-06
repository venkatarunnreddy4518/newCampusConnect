import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail, Sparkles, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/database/client";

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        navigate("/", { replace: true });
      }
    };

    checkUser();
  }, [navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: { full_name: form.name },
          },
        });

        if (error) throw error;
        toast.success("Account created! You can now log in.");
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });

        if (error) throw error;
        toast.success("Welcome back!");
        navigate("/");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-[22px] border border-login-border bg-login-input px-4 py-3.5 pl-11 text-sm text-foreground placeholder:text-login-placeholder focus:outline-none focus:ring-2 focus:ring-login-focus transition-all";

  return (
    <div className="min-h-screen bg-login-bg">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative overflow-hidden bg-gradient-hero px-6 py-10 text-primary-foreground sm:px-10 lg:px-14 lg:py-14">
          <div className="absolute inset-0 bg-grid-premium opacity-[0.14]" />
          <div className="absolute -left-20 top-12 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
          <div className="absolute bottom-10 right-0 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />

          <div className="relative flex h-full flex-col">
            <Link to="/" className="inline-flex items-center gap-3 self-start">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12 text-sm font-black tracking-[0.2em] text-primary-foreground">
                CC
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-primary-foreground/55">Campus OS</p>
                <p className="font-display text-lg font-black">CampusConnect</p>
              </div>
            </Link>

            <div className="my-auto max-w-2xl py-12">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-primary-foreground/80">
                <Sparkles className="h-4 w-4 text-accent" />
                <span className="text-xs font-semibold uppercase tracking-[0.22em]">Local SQL auth enabled</span>
              </div>

              <h1 className="mt-6 font-display text-5xl font-black leading-[0.98] md:text-6xl">
                Sign in to the campus platform that finally feels polished.
              </h1>

              <p className="mt-6 max-w-xl text-base leading-8 text-primary-foreground/68">
                Access events, clubs, live scores, and alerts through a stronger product experience inspired by premium editorial landing pages.
              </p>

              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {[
                  "One login for events, clubs, and alerts",
                  "Approval and rejection updates now surface clearly",
                  "Local SQL auth replacing Supabase",
                  "A cleaner student experience across the app",
                ].map((item) => (
                  <div key={item} className="rounded-[24px] border border-white/10 bg-white/8 px-4 py-4 backdrop-blur-sm">
                    <p className="inline-flex items-start gap-3 text-sm leading-7 text-primary-foreground/82">
                      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-accent" />
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative flex items-center justify-center px-6 py-10 sm:px-10 lg:px-14">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(248,193,72,0.14),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(230,123,92,0.10),transparent_28%)]" />

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="relative z-10 w-full max-w-xl rounded-[34px] border border-login-card-border bg-login-card p-7 shadow-login sm:p-8"
          >
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-login-subtitle">Authentication</p>
                <h2 className="mt-3 font-display text-3xl font-black text-foreground">
                  {isSignUp ? "Create your account" : "Welcome back"}
                </h2>
                <p className="mt-2 text-sm leading-7 text-login-subtitle">
                  {isSignUp ? "Join your campus community and start applying to clubs." : "Sign in to continue with events, clubs, scores, and alerts."}
                </p>
              </div>

              <Link to="/" className="rounded-full border border-login-border px-4 py-2 text-xs font-semibold text-login-link transition-colors hover:bg-login-input">
                Home
              </Link>
            </div>

            <div className="mb-6 rounded-[24px] border border-login-border bg-login-input/60 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-login-subtitle">Project setup</p>
              <p className="mt-2 text-sm leading-7 text-login-subtitle">
                Local SQL authentication is active. Use your email and password below to sign in or create a new account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="relative">
                  <User className="absolute left-4 top-4 h-4 w-4 text-login-placeholder" />
                  <input
                    type="text"
                    placeholder="Full name"
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    className={inputClass}
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-4 top-4 h-4 w-4 text-login-placeholder" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  className={inputClass}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-4 h-4 w-4 text-login-placeholder" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4 text-login-placeholder transition-colors hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[22px] bg-login-accent py-3.5 font-display text-sm font-semibold text-login-accent-fg transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {isSignUp ? "Create Account" : "Sign In"}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 rounded-[24px] bg-login-input/55 px-4 py-4">
              <p className="text-sm text-login-subtitle">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="font-semibold text-login-link hover:underline"
                >
                  {isSignUp ? "Sign in" : "Sign up"}
                </button>
              </p>
            </div>

            <p className="mt-6 text-center text-xs leading-6 text-login-placeholder">
              By continuing, you agree to the platform terms and privacy policy.
            </p>
          </motion.div>
        </section>
      </div>
    </div>
  );
};

export default Login;
