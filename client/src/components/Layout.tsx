/**
 * Layout.tsx — Warm Slate HR Portal Layout
 * Design: Fixed left sidebar (260px) + scrollable main content
 * Sidebar: deep slate background, amber active indicator
 * Main: warm off-white background
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
  ChevronRight,
  Bell,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { currentUser } from "@/lib/mockData";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Shield } from "lucide-react";

interface NavItem {
  id: number;
  label: string;
  icon: React.ElementType;
  path: string;
  comingSoon?: boolean;
  badge?: number;
}

const navItems: NavItem[] = [
  { id: 1, label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { id: 2, label: "My Information", icon: User, path: "/my-information" },
  { id: 3, label: "My Organization", icon: Network, path: "/my-organization" },
  { id: 4, label: "My Account", icon: Settings, path: "/my-account" },
  { id: 5, label: "Financial History", icon: DollarSign, path: "/financial-history" },
  { id: 6, label: "Performance Results", icon: BarChart2, path: "/performance-results" },
  { id: 7, label: "Periodic Evaluation", icon: ClipboardList, path: "/periodic-evaluation", badge: 2 },
  { id: 8, label: "Leave Management", icon: Calendar, path: "/leave-management" },
  { id: 9, label: "Company Documents", icon: FileText, path: "/company-documents", comingSoon: true },
  { id: 10, label: "Training", icon: GraduationCap, path: "/training", comingSoon: true },
  { id: 11, label: "Announcements", icon: Megaphone, path: "/announcements", comingSoon: true },
  { id: 12, label: "Help Desk", icon: HelpCircle, path: "/help-desk", comingSoon: true },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleComingSoon = (label: string) => {
    toast.info(`${label} — Coming Soon`, {
      description: "This feature is currently under development.",
    });
  };

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

      {/* Admin Portal link */}
      <div className="px-3 pb-1">
        <Link href="/admin" asChild>
          <a className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors hover:bg-white/10" style={{ color: "oklch(0.55 0.015 250)" }}>
            <Shield size={13} />
            <span>Admin Portal</span>
          </a>
        </Link>
      </div>

      {/* User Profile at bottom */}
      <div className="p-3 border-t" style={{ borderColor: "oklch(0.28 0.02 250)" }}>
        <div className="flex items-center gap-3 px-2 py-2 rounded-md" style={{ background: "oklch(0.22 0.025 250)" }}>
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarImage src={currentUser.photo} alt={currentUser.name} />
            <AvatarFallback className="text-xs" style={{ background: "oklch(0.42 0.18 255)", color: "white" }}>
              {currentUser.firstName[0]}P
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">{currentUser.name}</div>
            <div className="text-xs truncate" style={{ color: "oklch(0.55 0.015 250)" }}>
              {currentUser.position}
            </div>
          </div>
          <button
            onClick={() => toast.info("Logout — Coming Soon")}
            className="p-1 rounded hover:bg-white/10 transition-colors"
            style={{ color: "oklch(0.55 0.015 250)" }}
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
            <Avatar className="w-8 h-8">
              <AvatarImage src={currentUser.photo} alt={currentUser.name} />
              <AvatarFallback className="text-xs" style={{ background: "oklch(0.42 0.18 255)", color: "white" }}>
                JP
              </AvatarFallback>
            </Avatar>
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
