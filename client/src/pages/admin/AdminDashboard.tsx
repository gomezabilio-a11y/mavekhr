import { trpc } from "@/lib/trpc";
import { Users, Building2, Megaphone, BarChart2, Plus, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function AdminDashboard() {
  const { data: employees = [] } = trpc.employee.list.useQuery();
  const { data: orgUnits = [] } = trpc.orgUnit.list.useQuery();
  const { data: announcements = [] } = trpc.announcement.listAll.useQuery();

  const activeEmployees = employees.filter(e => e.status === "active").length;
  const teams = orgUnits.filter(u => u.type === "team").length;

  const stats = [
    { label: "Total Employees", value: employees.length, sub: `${activeEmployees} active`, icon: Users, color: "oklch(0.42 0.18 255)" },
    { label: "Org Units", value: orgUnits.length, sub: `${teams} teams`, icon: Building2, color: "oklch(0.52 0.18 145)" },
    { label: "Announcements", value: announcements.length, sub: "all time", icon: Megaphone, color: "oklch(0.62 0.15 65)" },
  ];

  const quickLinks = [
    { label: "Add Employee", href: "/admin/employees?action=new", icon: Users },
    { label: "Add Org Unit", href: "/admin/org-units?action=new", icon: Building2 },
    { label: "Add Announcement", href: "/admin/announcements?action=new", icon: Megaphone },
    { label: "Add Salary Record", href: "/admin/salary?action=new", icon: BarChart2 },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
          Admin Dashboard
        </h2>
        <p className="text-sm mt-1" style={{ color: "oklch(0.55 0.012 65)" }}>
          Manage employees, org structure, salary, and announcements.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl p-4 border" style={{ borderColor: "oklch(0.90 0.006 80)" }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}22` }}>
                <Icon size={16} style={{ color }} />
              </div>
              <p className="text-xs font-medium" style={{ color: "oklch(0.55 0.012 65)" }}>{label}</p>
            </div>
            <p className="text-2xl font-bold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
              {value}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "oklch(0.65 0.012 65)" }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl border p-5" style={{ borderColor: "oklch(0.90 0.006 80)" }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: "oklch(0.22 0.012 65)" }}>Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickLinks.map(({ label, href, icon: Icon }) => (
            <Link key={label} href={href}>
              <div
                className="flex flex-col items-center gap-2 p-4 rounded-xl border cursor-pointer transition-all hover:shadow-sm"
                style={{ borderColor: "oklch(0.90 0.006 80)", background: "oklch(0.98 0.006 80)" }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "oklch(0.42 0.18 255)22" }}>
                  <Icon size={16} style={{ color: "oklch(0.42 0.18 255)" }} />
                </div>
                <p className="text-xs font-medium text-center" style={{ color: "oklch(0.35 0.012 65)" }}>{label}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent employees */}
      <div className="bg-white rounded-xl border p-5" style={{ borderColor: "oklch(0.90 0.006 80)" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: "oklch(0.22 0.012 65)" }}>Employees</h3>
          <Link href="/admin/employees">
            <span className="text-xs flex items-center gap-1 cursor-pointer" style={{ color: "oklch(0.42 0.18 255)" }}>
              View all <ArrowRight size={12} />
            </span>
          </Link>
        </div>
        {employees.length === 0 ? (
          <div className="text-center py-8">
            <Users size={32} className="mx-auto mb-2" style={{ color: "oklch(0.82 0.006 80)" }} />
            <p className="text-sm" style={{ color: "oklch(0.65 0.012 65)" }}>No employees yet.</p>
            <Link href="/admin/employees?action=new">
              <button
                className="mt-3 px-4 py-2 rounded-lg text-xs font-medium text-white"
                style={{ background: "oklch(0.42 0.18 255)" }}
              >
                Add First Employee
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {employees.slice(0, 5).map(emp => (
              <div key={emp.id} className="flex items-center gap-3 py-2 border-b last:border-0" style={{ borderColor: "oklch(0.94 0.006 80)" }}>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: "oklch(0.52 0.18 255)" }}
                >
                  {emp.firstName[0]}{emp.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "oklch(0.22 0.012 65)" }}>
                    {emp.firstName} {emp.lastName}
                  </p>
                  <p className="text-xs truncate" style={{ color: "oklch(0.55 0.012 65)" }}>{emp.position}</p>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{
                    background: emp.status === "active" ? "oklch(0.92 0.08 145)" : "oklch(0.92 0.04 65)",
                    color: emp.status === "active" ? "oklch(0.42 0.18 145)" : "oklch(0.52 0.12 65)",
                  }}
                >
                  {emp.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
