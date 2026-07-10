/**
 * Dashboard.tsx — HR Portal Home
 * Design: Warm Slate — welcome card, stat cards, announcements, quick links
 * Data: real auth + real DB (employee.me, announcement.list)
 */
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DollarSign,
  ClipboardList,
  ChevronRight,
  Megaphone,
  TrendingUp,
  User,
  Network,
  BarChart2,
  Loader2,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

const categoryColor: Record<string, string> = {
  Holiday: "bg-blue-50 text-blue-700",
  Promotion: "bg-amber-50 text-amber-700",
  "New Joiner": "bg-green-50 text-green-700",
  "Policy Update": "bg-purple-50 text-purple-700",
};

export default function Dashboard() {
  const { user } = useAuth();
  const { data: emp, isLoading: empLoading } = trpc.employee.me.useQuery(undefined, { enabled: !!user });
  const { data: announcements = [], isLoading: annLoading } = trpc.announcement.list.useQuery();

  const today = new Date();
  const greeting =
    today.getHours() < 12
      ? "Good morning"
      : today.getHours() < 17
      ? "Good afternoon"
      : "Good evening";

  const displayName = emp ? `${emp.firstName}` : (user?.name?.split(" ")[0] ?? "");
  const fullName = emp ? `${emp.firstName} ${emp.lastName}` : (user?.name ?? "");
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Next salary: find the nearest upcoming pending salary record
  const { data: salaryRecords = [] } = trpc.salary.list.useQuery(
    { employeeId: emp?.id ?? 0 },
    { enabled: !!emp?.id }
  );
  const nextSalary = salaryRecords
    .filter((s: any) => s.status === "pending")
    .sort((a: any, b: any) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime())[0];

  const nextSalaryLabel = nextSalary
    ? new Date(nextSalary.paymentDate).toLocaleDateString("en-SG", { day: "numeric", month: "long" })
    : "—";

  // Pending evaluation tasks
  const { data: evalTasks = [] } = trpc.evaluation.myTasks.useQuery(
    { employeeId: emp?.id ?? 0 },
    { enabled: !!emp?.id }
  );
  const pendingEvalTasks = evalTasks.filter((t: any) => t.status === "pending");

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Banner */}
      <div
        className="rounded-xl p-6 flex items-center justify-between overflow-hidden relative"
        style={{
          background: "linear-gradient(135deg, oklch(0.42 0.18 255) 0%, oklch(0.32 0.2 265) 100%)",
        }}
      >
        <div className="relative z-10">
          <p className="text-sm font-medium mb-1" style={{ color: "oklch(0.75 0.08 255)" }}>
            {greeting},
          </p>
          <h2
            className="text-2xl font-bold text-white mb-1"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {empLoading ? "..." : displayName} 👋
          </h2>
          <p className="text-sm" style={{ color: "oklch(0.78 0.06 255)" }}>
            {emp ? `${emp.position ?? "—"} · ${(emp as any).orgUnit?.name ?? "—"}` : user?.role === "admin" ? "Administrator" : "—"}
          </p>
        </div>
        <Avatar className="w-16 h-16 border-2 border-white/30 hidden sm:block">
          {emp?.photoUrl && <AvatarImage src={emp.photoUrl} alt={fullName} />}
          <AvatarFallback style={{ background: "oklch(0.55 0.15 255)", color: "white" }}>
            {initials || "?"}
          </AvatarFallback>
        </Avatar>
        {/* Decorative circles */}
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-10" style={{ background: "white" }} />
        <div className="absolute -right-4 -bottom-12 w-40 h-40 rounded-full opacity-10" style={{ background: "white" }} />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Position */}
        <div className="hr-card p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "oklch(0.92 0.08 255)" }}>
              <User size={16} style={{ color: "oklch(0.42 0.18 255)" }} />
            </div>
          </div>
          <p className="text-xs font-medium mb-0.5" style={{ color: "oklch(0.55 0.012 65)" }}>Position</p>
          <p className="text-sm font-semibold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
            {empLoading ? <Loader2 size={14} className="animate-spin inline" /> : (emp?.position ?? "—")}
          </p>
        </div>

        {/* Department */}
        <div className="hr-card p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "oklch(0.92 0.08 145)" }}>
              <Network size={16} style={{ color: "oklch(0.42 0.18 145)" }} />
            </div>
          </div>
          <p className="text-xs font-medium mb-0.5" style={{ color: "oklch(0.55 0.012 65)" }}>Department</p>
          <p className="text-sm font-semibold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
            {empLoading ? <Loader2 size={14} className="animate-spin inline" /> : ((emp as any)?.orgUnit?.name ?? "—")}
          </p>
        </div>

        {/* Next Salary */}
        <div className="hr-card p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "oklch(0.92 0.08 80)" }}>
              <DollarSign size={16} style={{ color: "oklch(0.52 0.15 65)" }} />
            </div>
          </div>
          <p className="text-xs font-medium mb-0.5" style={{ color: "oklch(0.55 0.012 65)" }}>Next Salary</p>
          <p className="text-sm font-semibold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
            {empLoading ? <Loader2 size={14} className="animate-spin inline" /> : nextSalaryLabel}
          </p>
        </div>

        {/* Evaluation */}
        <div className="hr-card p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "oklch(0.95 0.06 27)" }}>
              <BarChart2 size={16} style={{ color: "oklch(0.52 0.2 27)" }} />
            </div>
          </div>
          <p className="text-xs font-medium mb-0.5" style={{ color: "oklch(0.55 0.012 65)" }}>Evaluation</p>
          <p className="text-sm font-semibold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
            {pendingEvalTasks.length > 0 ? `${pendingEvalTasks.length} pending` : "Up to date"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Tasks */}
        <div className="hr-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
              Pending Tasks
            </h3>
            {pendingEvalTasks.length > 0 && (
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: "oklch(0.72 0.15 65)", color: "oklch(0.18 0.022 250)" }}
              >
                {pendingEvalTasks.length}
              </span>
            )}
          </div>
          <div className="space-y-2">
            {pendingEvalTasks.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: "oklch(0.65 0.01 65)" }}>
                No pending tasks
              </p>
            ) : (
              pendingEvalTasks.slice(0, 5).map((task: any) => (
                <Link key={task.id} href="/periodic-evaluation">
                  <div
                    className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    style={{ border: "1px solid oklch(0.88 0.006 80)" }}
                  >
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "oklch(0.72 0.15 65)" }} />
                    <span className="text-sm flex-1" style={{ color: "oklch(0.35 0.012 65)" }}>
                      {task.title ?? "Complete Evaluation"}
                    </span>
                    <ChevronRight size={14} style={{ color: "oklch(0.65 0.01 65)" }} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Announcements */}
        <div className="hr-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
              Recent Announcements
            </h3>
            <button
              className="text-xs font-medium hover:underline"
              style={{ color: "oklch(0.42 0.18 255)" }}
              onClick={() => toast.info("Announcements — Coming Soon")}
            >
              View all
            </button>
          </div>
          {annLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={20} className="animate-spin" style={{ color: "oklch(0.42 0.18 255)" }} />
            </div>
          ) : announcements.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: "oklch(0.65 0.01 65)" }}>
              No announcements yet
            </p>
          ) : (
            <div className="space-y-3">
              {announcements.slice(0, 3).map((a: any) => (
                <div
                  key={a.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  style={{ border: "1px solid oklch(0.88 0.006 80)" }}
                  onClick={() => toast.info(a.title)}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "oklch(0.94 0.004 80)" }}
                  >
                    <Megaphone size={14} style={{ color: "oklch(0.42 0.18 255)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColor[a.category] || "bg-gray-100 text-gray-600"}`}>
                        {a.category}
                      </span>
                      <span className="text-xs" style={{ color: "oklch(0.65 0.01 65)" }}>
                        {new Date(a.publishDate).toLocaleDateString("en-SG", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    <p className="text-sm font-medium truncate" style={{ color: "oklch(0.22 0.012 65)" }}>
                      {a.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="hr-card p-5">
        <h3 className="text-sm font-semibold mb-4" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
          Quick Links
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "My Information", icon: User, path: "/my-information", color: "oklch(0.92 0.08 255)", iconColor: "oklch(0.42 0.18 255)" },
            { label: "Financial History", icon: DollarSign, path: "/financial-history", color: "oklch(0.92 0.08 80)", iconColor: "oklch(0.52 0.15 65)" },
            { label: "Performance", icon: TrendingUp, path: "/performance-results", color: "oklch(0.92 0.08 145)", iconColor: "oklch(0.42 0.18 145)" },
            { label: "Evaluation", icon: ClipboardList, path: "/periodic-evaluation", color: "oklch(0.95 0.06 27)", iconColor: "oklch(0.52 0.2 27)" },
          ].map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.path} href={link.path} className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 transition-all duration-150 border border-transparent hover:border-gray-200 text-center">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: link.color }}>
                  <Icon size={18} style={{ color: link.iconColor }} />
                </div>
                <span className="text-xs font-medium" style={{ color: "oklch(0.35 0.012 65)" }}>
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
