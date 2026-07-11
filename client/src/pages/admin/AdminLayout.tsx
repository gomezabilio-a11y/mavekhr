/**
 * AdminLayout.tsx — Admin portal shell
 * Separate sidebar from employee portal, darker tone
 */
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Users, Building2, DollarSign, BarChart2, Megaphone,
  FileText, LogOut, ChevronLeft, LayoutDashboard, Menu, X,
  Shield, ClipboardList, RefreshCw, CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const navItems = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/employees", label: "Employees", icon: Users },
  { path: "/admin/org-units", label: "Org Units", icon: Building2 },
  { path: "/admin/salary", label: "Salary Records", icon: DollarSign },
  { path: "/admin/performance", label: "Performance", icon: BarChart2 },
  { path: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { path: "/admin/eval-forms", label: "Evaluation Forms", icon: ClipboardList },
  { path: "/admin/eval-cycles", label: "Eval Cycles", icon: RefreshCw },
  { path: "/admin/leave", label: "Leave Management", icon: CalendarDays },
  { path: "/admin/users", label: "User Management", icon: Shield },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, isAuthenticated, loading } = useAuth();
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.replace("/login"); },
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.97 0.006 80)" }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "oklch(0.62 0.18 255)" }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = "/admin/login";
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.18 0.02 255)" }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "oklch(0.62 0.18 255)" }} />
      </div>
    );
  }

  if (user?.role !== "admin") {
    window.location.replace("/admin/login");
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "oklch(0.96 0.006 80)" }}>
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col flex-shrink-0 transition-all duration-200 h-full overflow-y-auto",
          sidebarOpen ? "w-56" : "w-14"
        )}
        style={{ background: "oklch(0.16 0.022 250)", borderRight: "1px solid oklch(0.22 0.022 250)" }}
      >
        {/* Logo area */}
        <div className="flex items-center gap-2 px-3 py-4 border-b" style={{ borderColor: "oklch(0.22 0.022 250)" }}>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "oklch(0.42 0.18 255)" }}
          >
            <Shield size={14} className="text-white" />
          </div>
          {sidebarOpen && (
            <div>
              <p className="text-xs font-bold text-white leading-tight">Admin Portal</p>
              <p className="text-xs" style={{ color: "oklch(0.55 0.022 250)", fontSize: "10px" }}>Mavek HR</p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto p-1 rounded hover:bg-white/10 transition-colors"
          >
            {sidebarOpen
              ? <ChevronLeft size={14} className="text-white/60" />
              : <Menu size={14} className="text-white/60" />
            }
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 space-y-0.5 px-2">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location === path || (path !== "/admin" && location.startsWith(path));
            return (
              <Link key={path} href={path}>
                <div
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors",
                    sidebarOpen ? "" : "justify-center"
                  )}
                  style={{
                    background: active ? "oklch(0.42 0.18 255)" : "transparent",
                    color: active ? "white" : "oklch(0.72 0.022 250)",
                  }}
                  title={!sidebarOpen ? label : undefined}
                >
                  <Icon size={15} className="flex-shrink-0" />
                  {sidebarOpen && <span className="text-xs font-medium">{label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom: back to portal + logout */}
        <div className="p-2 border-t space-y-1" style={{ borderColor: "oklch(0.22 0.022 250)" }}>
          <Link href="/">
            <div
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors hover:bg-white/10",
                sidebarOpen ? "" : "justify-center"
              )}
              style={{ color: "oklch(0.62 0.022 250)" }}
              title={!sidebarOpen ? "Employee Portal" : undefined}
            >
              <ChevronLeft size={14} />
              {sidebarOpen && <span className="text-xs">Employee Portal</span>}
            </div>
          </Link>
          <button
            onClick={() => logout.mutate()}
            className={cn(
              "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors hover:bg-white/10",
              sidebarOpen ? "" : "justify-center"
            )}
            style={{ color: "oklch(0.62 0.022 250)" }}
            title={!sidebarOpen ? "Logout" : undefined}
          >
            <LogOut size={14} />
            {sidebarOpen && <span className="text-xs">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
