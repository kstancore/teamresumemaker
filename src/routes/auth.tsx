import { DoodleBackground } from "@/components/doodle-background";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Users, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";

const searchSchema = z.object({ mode: z.enum(["signin", "signup"]).optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Log in or sign up — Team Resume Maker" },
      {
        name: "description",
        content:
          "Log in with email or Google to build, edit and download AI-merged team resumes in your Team Resume Maker workspace.",
      },
      { property: "og:title", content: "Log in or sign up — Team Resume Maker" },
      {
        property: "og:description",
        content:
          "Log in with email or Google to build, edit and download AI-merged team resumes in your Team Resume Maker workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function friendlyError(message: string) {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "That email and password don't match an account. If you joined with Google, use \"Continue with Google\" below.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "You already have an account with this email. Try signing in instead.";
  if (m.includes("email not confirmed"))
    return "Please confirm your email first — check your inbox for the link.";
  if (m.includes("password should be"))
    return "Your password needs at least 6 characters.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Too many tries. Please wait a minute and try again.";
  return message;
}

function AuthPage() {
  const { mode: initialMode } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(initialMode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) navigate({ to: "/workspace", replace: true });
      else setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) navigate({ to: "/workspace", replace: true });
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setNotice(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setNotice("Check your inbox — we sent you a link to choose a new password.");
        return;
      }

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth` },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Account created! Let's set up your profile.");
          navigate({ to: "/profile", replace: true });
          return;
        }
        setNotice("Account created! Check your email to confirm, then sign in here.");
        setMode("signin");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      toast.success("Welcome back!");
      navigate({ to: "/workspace", replace: true });
    } catch (err) {
      setError(friendlyError(err instanceof Error ? err.message : "Something went wrong"));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/auth`,
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
      navigate({ to: "/workspace", replace: true });
    } catch (err) {
      setError(friendlyError(err instanceof Error ? err.message : "Google sign-in failed"));
    } finally {
      setLoading(false);
    }
  }


  const title =
    mode === "signup" ? "Create your account" : mode === "forgot" ? "Reset your password" : "Welcome back";
  const subtitle =
    mode === "signup"
      ? "Start merging resumes in minutes."
      : mode === "forgot"
        ? "We'll email you a link to set a new password."
        : "Sign in to your workspace.";

  return (
    <div className="paper isolate flex min-h-screen items-center justify-center px-4 py-10">
      <DoodleBackground />
      <div className="w-full max-w-md">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/" })} className="mb-4">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Users className="h-4 w-4" />
          </div>
          <span className="font-serif text-lg font-semibold">Team Resume Maker</span>
        </Link>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          {mode !== "forgot" && (
            <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted/40 p-1">
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className={`rounded-md py-2 text-sm font-medium transition-colors ${
                  mode === "signin"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className={`rounded-md py-2 text-sm font-medium transition-colors ${
                  mode === "signup"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign up
              </button>
            </div>
          )}

          <h1 className="font-serif text-2xl">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>

          {mode !== "forgot" && (
            <>
              <Button
                type="button"
                variant="outline"
                className="mt-6 w-full"
                onClick={handleGoogle}
                disabled={loading}
              >
                <GoogleIcon /> Continue with Google
              </Button>
              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  or use email
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
            </>
          )}

          {error && (
            <div
              role="alert"
              className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            >
              {error}
            </div>
          )}
          {notice && (
            <div className="mb-4 rounded-md border border-border bg-muted/50 p-3 text-sm text-foreground">
              {notice}
            </div>
          )}

          <form onSubmit={handleSubmit} className={mode === "forgot" ? "mt-6 space-y-4" : "space-y-4"}>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
              />
            </div>

            {mode !== "forgot" && (
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                      onClick={() => switchMode("forgot")}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {mode === "signup" && (
                  <p className="mt-1 text-xs text-muted-foreground">At least 6 characters.</p>
                )}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Log in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "forgot" ? (
              <button
                type="button"
                className="font-medium text-foreground underline-offset-4 hover:underline"
                onClick={() => switchMode("signin")}
              >
                Back to log in
              </button>
            ) : mode === "signup" ? (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                  onClick={() => switchMode("signin")}
                >
                  Log in
                </button>
              </>
            ) : (
              <>
                New here?{" "}
                <button
                  type="button"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                  onClick={() => switchMode("signup")}
                >
                  Create an account
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
