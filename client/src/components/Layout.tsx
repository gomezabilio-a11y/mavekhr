/**
 * Layout.tsx — Warm Slate HR Portal Layout
 * Design: Fixed left sidebar (260px) + scrollable main content
 * Auth: redirects to /login if not authenticated
 */
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import {
  LayoutDashboard,
  User,
  Network,
  Settings,
  DollarSign,
  BarChart2,
  ClipboardList,
  Calendar,
  FileText,
  GraduationCap,
  Megaphone,
  HelpCircle,
  Bell,
  LogOut,
  Menu,
  Shield,
} from "lucide-react";
import EmployeePhoto from "@/components/EmployeePhoto";
import { cn } from "@/lib/utils";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

interface NavItem {
  id: number;
  label: string;
  icon: React.ElementType;
  path: string;
  comingSoon?: boolean;
  badge?: number;
}

const baseNavItems: NavItem[] = [
  { id: 1, label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { id: 2, label: "My Information", icon: User, path: "/my-information" },
  { id: 3, label: "My Organization", icon: Network, path: "/my-organization" },
  { id: 4, label: "My Account", icon: Settings, path: "/my-account" },
  { id: 5, label: "Financial History", icon: DollarSign, path: "/financial-history" },
  { id: 6, label: "Performance Results", icon: BarChart2, path: "/performance-results" },
  { id: 7, label: "Periodic Evaluation", icon: ClipboardList, path: "/periodic-evaluation" },
  { id: 8, label: "Leave Management", icon: Calendar, path: "/leave-management", comingSoon: true },
  { id: 9, label: "Company Documents", icon: FileText, path: "/company-documents", comingSoon: true },
  { id: 10, label: "Training", icon: GraduationCap, path: "/training", comingSoon: true },
  { id: 11, label: "Announcements", icon: Megaphone, path: "/announcements", comingSoon: true },
  { id: 12, label: "Help Desk", icon: HelpCircle, path: "/help-desk", comingSoon: true },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location, setLocation] = useLocation();
  const navigate = setLocation;
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading, isAuthenticated } = useAuth();
  const { data: emp } = trpc.employee.me.useQuery(undefined, { enabled: isAuthenticated });

  // Fetch pending evaluation tasks count for badge
  const { data: evalTasks = [] } = trpc.evaluation.myTasks.useQuery(
    { employeeId: emp?.id ?? 0 },
    { enabled: !!emp?.id }
  );
  const pendingEvalCount = (evalTasks as any[]).filter((t: any) => t.status === "pending" || t.status === "in-progress").length;

  const navItems: NavItem[] = baseNavItems.map(item =>
    item.id === 7 && pendingEvalCount > 0
      ? { ...item, badge: pendingEvalCount }
      : item
  );

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      navigate("/login");
    },
    onError: () => {
      navigate("/login");
    },
  });

  // Show nothing while checking auth to prevent flash
  if (loading) return null;

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    window.location.replace("/login");
    return null;
  }

  // Admin accounts can also use the Employee Portal (they are employees too)

  const handleComingSoon = (label: string) => {
    toast.info(`This feature is not available`, {
      description: `${label} is not currently available in this portal.`,
    });
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const displayName = user?.name ?? "—";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: "oklch(0.28 0.02 250)" }}>
        <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-white/10 flex items-center justify-center">
          <img
            src="/manus-storage/mavek-logo_f9492875.png"
            alt="Mavek"
            className="w-6 h-6 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
        <div>
          <div className="text-sm font-semibold text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Mavek
          </div>
          <div className="text-xs" style={{ color: "oklch(0.55 0.015 250)" }}>
            Employee Portal
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        <div className="px-2 pb-2">
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "oklch(0.45 0.015 250)" }}>
            Menu
          </span>
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));

          if (item.comingSoon) {
            return (
              <button
                key={item.id}
                onClick={() => handleComingSoon(item.label)}
                className="sidebar-nav-item coming-soon w-full text-left"
              >
                <Icon size={16} className="flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "oklch(0.28 0.02 250)", color: "oklch(0.55 0.015 250)", fontSize: "10px" }}>
                  Soon
                </span>
              </button>
            );
          }

          return (
            <Link key={item.id} href={item.path} asChild>
              <a
                className={cn("sidebar-nav-item w-full", isActive && "active")}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={16} className="flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold"
                    style={{ background: "oklch(0.72 0.15 65)", color: "oklch(0.18 0.022 250)" }}
                  >
                    {item.badge}
                  </span>
                )}
              </a>
            </Link>
          );
        })}
      </nav>

      {/* Admin Portal link — only for admins */}
      {user?.role === "admin" && (
        <div className="px-3 pb-1">
          <Link href="/admin" asChild>
            <a className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors hover:bg-white/10" style={{ color: "oklch(0.55 0.015 250)" }}>
              <Shield size={13} />
              <span>Admin Portal</span>
            </a>
          </Link>
        </div>
      )}

      {/* User Profile at bottom */}
      <div className="p-3 border-t" style={{ borderColor: "oklch(0.28 0.02 250)" }}>
        <div className="flex items-center gap-3 px-2 py-2 rounded-md" style={{ background: "oklch(0.22 0.025 250)" }}>
          <EmployeePhoto
            photoUrl={emp?.photoUrl}
            initials={initials}
            size="sm"
            bgColor="oklch(0.42 0.18 255)"
          />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">{displayName}</div>
            <div className="text-xs truncate" style={{ color: "oklch(0.55 0.015 250)" }}>
              {user?.role === "admin" ? "Administrator" : "Employee"}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1 rounded hover:bg-white/10 transition-colors"
            style={{ color: "oklch(0.55 0.015 250)" }}
            title="Logout"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "oklch(0.975 0.006 80)" }}>
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex flex-col w-64 flex-shrink-0 h-screen"
        style={{ background: "oklch(0.18 0.022 250)" }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className="relative flex flex-col w-64 h-full z-10"
            style={{ background: "oklch(0.18 0.022 250)" }}
          >
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header
          className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-b bg-white"
          style={{ borderColor: "oklch(0.88 0.006 80)" }}
        >
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={18} />
            </button>
            <div>
              <h1 className="text-sm font-semibold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
                {navItems.find((n) => n.path === location || (n.path !== "/" && location.startsWith(n.path)))?.label || "Dashboard"}
              </h1>
              <p className="text-xs" style={{ color: "oklch(0.55 0.012 65)" }}>
                Mavek Employee Portal
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="relative p-2 rounded-md hover:bg-gray-100 transition-colors"
              onClick={() => toast.info("Notifications — Coming Soon")}
            >
              <Bell size={18} style={{ color: "oklch(0.45 0.012 65)" }} />
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                style={{ background: "oklch(0.72 0.15 65)" }}
              />
            </button>
            <EmployeePhoto
              photoUrl={emp?.photoUrl}
              initials={initials}
              size="sm"
              bgColor="oklch(0.42 0.18 255)"
            />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
