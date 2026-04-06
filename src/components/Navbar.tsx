import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Bell,
  Calendar,
  Calculator,
  ChevronDown,
  Crown,
  Home,
  LogIn,
  LogOut,
  Menu,
  Settings,
  Trophy,
  User,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, isAdmin, isModerator, signOut } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const mainNav = [
    { to: "/", label: "Home", icon: Home },
    { to: "/events", label: "Events", icon: Calendar },
    { to: "/clubs", label: "Clubs", icon: Crown },
    { to: "/live-scores", label: "Live Scores", icon: Trophy },
    { to: "/notifications", label: "Alerts", icon: Bell },
  ];

  const extraNav = [
    ...((isModerator || isAdmin) ? [{ to: "/score-calculator", label: "Scorer", icon: Calculator }] : []),
    ...(isAdmin ? [{ to: "/admin", label: "Admin", icon: Settings }] : []),
  ];

  const allNav = [...mainNav, ...extraNav];
  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    await signOut();
    toast.success("Signed out successfully");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="container flex h-20 items-center justify-between gap-4">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-card">
            <span className="text-sm font-black tracking-[0.2em]">CC</span>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-muted-foreground">Campus OS</p>
            <p className="truncate font-display text-lg font-black">CampusConnect</p>
          </div>
        </Link>

        <div className="hidden items-center gap-1 rounded-full border border-border/70 bg-card/80 p-1.5 shadow-card lg:flex">
          {allNav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                isActive(item.to) ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isActive(item.to) && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 480, damping: 34 }}
                />
              )}
              <item.icon className="relative z-10 h-4 w-4" />
              <span className="relative z-10">{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen((current) => !current)}
                className="flex items-center gap-2 rounded-full border border-border/70 bg-card px-2 py-1.5 shadow-sm transition-colors hover:bg-muted"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <User className="h-4 w-4" />
                </div>
                <div className="hidden text-left sm:block">
                  <p className="max-w-28 truncate text-sm font-semibold">{user.user_metadata?.full_name || user.email || "Account"}</p>
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.16 }}
                    className="absolute right-0 top-full mt-3 w-56 overflow-hidden rounded-3xl border border-border bg-card p-2 shadow-card"
                  >
                    <Link
                      to={`/profile/${user.id}`}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                    >
                      <User className="h-4 w-4" />
                      My Profile
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                    >
                      <Calendar className="h-4 w-4" />
                      My Registrations
                    </Link>
                    <div className="my-2 h-px bg-border" />
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 hover:bg-primary/92 sm:inline-flex"
            >
              <span className="inline-flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Login
              </span>
            </Link>
          )}

          <button
            onClick={() => setMobileOpen((current) => !current)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card lg:hidden"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border/70 bg-background lg:hidden"
          >
            <div className="container space-y-2 py-4">
              {allNav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
                    isActive(item.to) ? "bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}

              {user ? (
                <>
                  <Link
                    to={`/profile/${user.id}`}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl bg-card px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
                >
                  <LogIn className="h-4 w-4" />
                  Login
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
