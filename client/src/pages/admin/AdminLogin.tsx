import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function AdminLogin() {
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If already logged in as admin, redirect to admin portal
  if (!authLoading && user) {
    if (user.role === "admin") {
      window.location.replace("/admin");
    } else {
      // Logged in but not admin — show error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }
      if (data.role !== "admin") {
        setError("Access denied. This portal is for administrators only.");
        return;
      }
      window.location.replace("/admin");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.18 0.02 255)" }}>
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-lg" style={{ background: "oklch(0.62 0.18 255)" }}>
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">MAVEK HR Admin</h1>
          <p className="text-slate-400 text-sm mt-1">Administrator Portal</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl shadow-2xl p-8 border" style={{ background: "oklch(0.22 0.02 255)", borderColor: "oklch(0.30 0.03 255)" }}>
          {!authLoading && user && user.role !== "admin" && (
            <div className="mb-4 p-3 rounded-xl bg-red-900/40 border border-red-700 text-red-300 text-sm">
              You are logged in as a regular user. Please log out first to access the admin portal.
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="admin@mavekbcs.com"
                className="w-full px-4 py-2.5 rounded-xl border text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition"
                style={{ background: "oklch(0.28 0.02 255)", borderColor: "oklch(0.35 0.03 255)" }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition"
                style={{ background: "oklch(0.28 0.02 255)", borderColor: "oklch(0.35 0.03 255)" }}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-900/40 border border-red-700 text-red-300 text-sm">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              style={{ background: "oklch(0.62 0.18 255)" }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : "Sign In to Admin Portal"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          For employee access, go to the{" "}
          <a href="/login" className="text-slate-400 hover:text-white underline transition">
            Employee Portal
          </a>
        </p>
      </div>
    </div>
  );
}
