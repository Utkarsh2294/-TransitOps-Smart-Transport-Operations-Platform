import { Loader2, Lock, LogIn, Mail, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { login } from "../../lib/auth";
import type { AuthUser } from "../../lib/auth";
import type { ApiErrorResponse } from "../../lib/api";

type LoginPageProps = {
  onLogin: (user: AuthUser) => void;
};

export const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const user = await login(email, password);
      onLogin(user);
    } catch (err) {
      const apiErr = err as ApiErrorResponse;
      setError(apiErr.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4"
      style={{
        background: isDark
          ? "radial-gradient(ellipse at 20% 0%, rgba(91,127,255,0.15), transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(91,127,255,0.08), transparent 50%), #0b0e14"
          : "radial-gradient(ellipse at 20% 0%, rgba(62,99,221,0.12), transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(62,99,221,0.06), transparent 50%), #f4f6f8",
      }}
    >
      {/* Decorative elements */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: isDark
            ? "radial-gradient(circle at 25% 25%, rgba(91,127,255,0.04) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(91,127,255,0.03) 0%, transparent 50%)"
            : "radial-gradient(circle at 25% 25%, rgba(62,99,221,0.06) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(62,99,221,0.04) 0%, transparent 50%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />

      {/* Theme toggle */}
      <button
        aria-label="Toggle theme"
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-lg border text-foreground transition hover:bg-surface"
        onClick={() => setIsDark((c) => !c)}
        style={{
          borderColor: "var(--border)",
          backgroundColor: isDark ? "rgba(27,32,48,0.6)" : "rgba(251,252,254,0.6)",
          backdropFilter: "blur(12px)",
        }}
        type="button"
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      {/* Login card */}
      <div
        className={`relative z-10 w-full max-w-md transition-all duration-700 ${mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
      >
        <div
          className="rounded-2xl border p-8 shadow-xl sm:p-10"
          style={{
            borderColor: isDark ? "rgba(36,41,56,0.8)" : "rgba(223,228,234,0.8)",
            backgroundColor: isDark ? "rgba(19,23,34,0.75)" : "rgba(251,252,254,0.8)",
            backdropFilter: "blur(20px) saturate(1.4)",
            boxShadow: isDark
              ? "0 20px 70px rgba(91,127,255,0.12), 0 1px 2px rgba(0,0,0,0.3)"
              : "0 20px 70px rgba(62,99,221,0.1), 0 1px 2px rgba(16,24,40,0.06)",
          }}
        >
          {/* Branding */}
          <div className="mb-8 text-center">
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl text-lg font-bold shadow-lg"
              style={{
                background: "linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 70%, #a855f7))",
                color: "#fff",
              }}
            >
              T
            </div>
            <p
              className="mt-4 text-xs font-semibold uppercase tracking-[0.22em]"
              style={{ color: "var(--accent)" }}
            >
              TransitOps
            </p>
            <h1
              className="mt-2 text-2xl font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Welcome back
            </h1>
            <p
              className="mt-1 text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              Sign in to your operations dashboard
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div
              className="mb-5 rounded-lg border px-4 py-3 text-sm"
              style={{
                borderColor: "color-mix(in srgb, var(--status-danger) 30%, transparent)",
                backgroundColor: "color-mix(in srgb, var(--status-danger) 8%, transparent)",
                color: "var(--status-danger)",
                animation: "shake 0.4s ease-in-out",
              }}
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Email */}
              <div>
                <label
                  className="mb-1.5 block text-sm font-medium"
                  htmlFor="login-email"
                  style={{ color: "var(--text-primary)" }}
                >
                  Email
                </label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                    style={{ color: "var(--text-secondary)" }}
                  />
                  <input
                    autoComplete="email"
                    className="h-11 w-full rounded-lg border pl-10 pr-4 text-sm outline-none transition focus:ring-2"
                    id="login-email"
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@transitops.in"
                    required
                    style={{
                      borderColor: "var(--border)",
                      backgroundColor: isDark ? "rgba(11,14,20,0.5)" : "rgba(254,254,254,0.8)",
                      color: "var(--text-primary)",
                      "--tw-ring-color": "var(--accent)",
                    } as React.CSSProperties}
                    type="email"
                    value={email}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  className="mb-1.5 block text-sm font-medium"
                  htmlFor="login-password"
                  style={{ color: "var(--text-primary)" }}
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                    style={{ color: "var(--text-secondary)" }}
                  />
                  <input
                    autoComplete="current-password"
                    className="h-11 w-full rounded-lg border pl-10 pr-4 text-sm outline-none transition focus:ring-2"
                    id="login-password"
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    required
                    style={{
                      borderColor: "var(--border)",
                      backgroundColor: isDark ? "rgba(11,14,20,0.5)" : "rgba(254,254,254,0.8)",
                      color: "var(--text-primary)",
                      "--tw-ring-color": "var(--accent)",
                    } as React.CSSProperties}
                    type="password"
                    value={password}
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-medium text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isLoading}
              style={{
                background: "linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 75%, #a855f7))",
                boxShadow: "0 2px 12px color-mix(in srgb, var(--accent) 35%, transparent)",
              }}
              type="submit"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div
            className="mt-6 rounded-lg border px-4 py-3"
            style={{
              borderColor: "color-mix(in srgb, var(--accent) 20%, transparent)",
              backgroundColor: "var(--accent-subtle)",
            }}
          >
            <p className="mb-2 text-center text-xs font-semibold" style={{ color: "var(--accent)" }}>
              Quick Demo Login
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Fleet Manager", email: "admin@transitops.in" },
                { label: "Driver", email: "driver@transitops.in" },
                { label: "Safety Officer", email: "safety@transitops.in" },
                { label: "Fin. Analyst", email: "finance@transitops.in" },
              ].map((account) => (
                <button
                  className="rounded-md border px-2 py-1.5 text-[11px] font-medium transition hover:brightness-110"
                  key={account.email}
                  onClick={() => {
                    setEmail(account.email);
                    setPassword("TransitOps2026!");
                  }}
                  style={{
                    borderColor: "color-mix(in srgb, var(--accent) 25%, transparent)",
                    color: "var(--text-secondary)",
                  }}
                  type="button"
                >
                  {account.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-center text-[10px]" style={{ color: "var(--text-secondary)" }}>
              Password for all: TransitOps2026!
            </p>
          </div>
        </div>

        {/* Footer */}
        <p
          className="mt-6 text-center text-xs"
          style={{ color: "var(--text-secondary)" }}
        >
          TransitOps Smart Transport Operations Platform
        </p>
      </div>

      {/* Keyframe styles */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
};
