/**
 * MyOrganization.tsx — Direct Hierarchy Path + My Team
 * Design: Warm Slate
 *
 * Shows only the employee's direct reporting chain:
 *   e.g. MAVEK BCS HK → MAVEK BCS Seoul → LOB → A Team  (MY TEAM)
 * Plus the My Team section listing all members in the same org unit.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, Users, Layers, Network, ChevronDown, Loader2 } from "lucide-react";

// ─── Type config ───────────────────────────────────────────────────────────────
const typeConfig: Record<string, { label: string; bg: string; border: string; text: string; icon: React.ElementType }> = {
  entity:     { label: "Entity",     bg: "oklch(0.94 0.04 255)", border: "oklch(0.72 0.18 255)", text: "oklch(0.32 0.18 255)", icon: Building2 },
  division:   { label: "Division",   bg: "oklch(0.94 0.04 145)", border: "oklch(0.62 0.18 145)", text: "oklch(0.28 0.18 145)", icon: Layers },
  department: { label: "Dept",       bg: "oklch(0.94 0.04 65)",  border: "oklch(0.72 0.15 65)",  text: "oklch(0.38 0.15 65)",  icon: Network },
  team:       { label: "Team",       bg: "oklch(0.94 0.04 27)",  border: "oklch(0.62 0.2 27)",   text: "oklch(0.38 0.2 27)",   icon: Users },
};

export default function MyOrganization() {
  const [memberFilter, setMemberFilter] = useState<"all" | "manager" | "member">("all");

  const { data: me } = trpc.auth.me.useQuery();
  const { data: emp, isLoading: empLoading } = trpc.employee.me.useQuery(undefined, { enabled: !!me });

  // Direct hierarchy path: root → my team
  const { data: orgPath = [], isLoading: pathLoading } = trpc.orgUnit.myPath.useQuery(undefined, {
    enabled: !!emp,
  });

  // My team members (same org unit)
  const { data: teamMembers = [], isLoading: teamLoading } = trpc.employee.teamMembers.useQuery(
    { orgUnitId: emp?.orgUnitId ?? 0 },
    { enabled: !!emp?.orgUnitId }
  );

  // My manager (by managerId — can be in a different team)
  const { data: manager } = trpc.employee.byId.useQuery(
    { id: emp?.managerId ?? 0 },
    { enabled: !!emp?.managerId }
  );

  const isLoading = empLoading || pathLoading;

  const filtered =
    memberFilter === "all"
      ? teamMembers
      : memberFilter === "manager"
      ? teamMembers.filter((m: any) => m.isManager)
      : teamMembers.filter((m: any) => !m.isManager);

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold mb-1" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
          My Organization
        </h2>
        <p className="text-sm" style={{ color: "oklch(0.55 0.012 65)" }}>
          Your position within the company structure
        </p>
      </div>

      {/* Hierarchy Path */}
      <div className="hr-card p-6">
        <h4 className="text-sm font-semibold mb-5" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
          Reporting Structure
        </h4>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={24} className="animate-spin" style={{ color: "oklch(0.42 0.18 255)" }} />
          </div>
        ) : !emp ? (
          <div className="text-center py-10">
            <Building2 size={32} className="mx-auto mb-3" style={{ color: "oklch(0.82 0.006 80)" }} />
            <p className="text-sm" style={{ color: "oklch(0.65 0.012 65)" }}>No employee profile linked to your account.</p>
          </div>
        ) : orgPath.length === 0 ? (
          <div className="text-center py-10">
            <Building2 size={32} className="mx-auto mb-3" style={{ color: "oklch(0.82 0.006 80)" }} />
            <p className="text-sm" style={{ color: "oklch(0.65 0.012 65)" }}>No org unit assigned yet.</p>
            <p className="text-xs mt-1" style={{ color: "oklch(0.72 0.006 80)" }}>Contact HR to assign your team.</p>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-0">
            {orgPath.map((unit, index) => {
              const isLast = index === orgPath.length - 1;
              const cfg = typeConfig[unit.type] ?? typeConfig.team;
              const Icon = cfg.icon;

              return (
                <div key={unit.id} className="flex flex-col items-start">
                  {/* Node */}
                  <div
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all"
                    style={{
                      background: isLast ? "oklch(0.97 0.06 80)" : "white",
                      borderColor: isLast ? "oklch(0.72 0.15 65)" : cfg.border,
                      boxShadow: isLast
                        ? "0 0 0 3px oklch(0.92 0.08 80), 0 4px 12px rgba(0,0,0,0.08)"
                        : "0 1px 4px rgba(0,0,0,0.06)",
                      minWidth: "220px",
                    }}
                  >
                    {/* Icon */}
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: isLast ? "oklch(0.92 0.08 80)" : cfg.bg }}
                    >
                      <Icon size={16} style={{ color: isLast ? "oklch(0.52 0.15 65)" : cfg.text }} />
                    </div>

                    {/* Name + type */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: isLast ? "oklch(0.38 0.14 65)" : "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
                        {unit.name}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "oklch(0.55 0.012 65)" }}>
                        {cfg.label}
                        {unit.headCount ? ` · ${unit.headCount} people` : ""}
                      </p>
                    </div>

                    {/* MY TEAM badge */}
                    {isLast && (
                      <span
                        className="px-2 py-0.5 rounded-full text-white flex-shrink-0"
                        style={{ background: "oklch(0.72 0.15 65)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.04em" }}
                      >
                        MY TEAM
                      </span>
                    )}
                  </div>

                  {/* Connector arrow to next node */}
                  {!isLast && (
                    <div className="flex flex-col items-start ml-[22px] gap-0">
                      <div className="w-px h-3" style={{ background: "oklch(0.78 0.006 80)" }} />
                      <ChevronDown size={14} style={{ color: "oklch(0.72 0.006 80)", marginLeft: "-7px" }} />
                      <div className="w-px h-3" style={{ background: "oklch(0.78 0.006 80)" }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* My Manager */}
      {emp && (
        <div className="hr-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} style={{ color: "oklch(0.42 0.18 255)" }} />
            <h3 className="text-sm font-semibold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
              My Manager
            </h3>
          </div>
          {!emp.managerId ? (
            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ border: "1px solid oklch(0.88 0.006 80)", background: "oklch(0.97 0.006 80)" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "oklch(0.90 0.006 80)" }}>
                <Users size={16} style={{ color: "oklch(0.65 0.012 65)" }} />
              </div>
              <p className="text-sm" style={{ color: "oklch(0.65 0.012 65)" }}>No manager assigned</p>
            </div>
          ) : !manager ? (
            <div className="flex justify-center py-4">
              <Loader2 size={18} className="animate-spin" style={{ color: "oklch(0.42 0.18 255)" }} />
            </div>
          ) : (
            <div
              className="flex items-center gap-3 p-4 rounded-xl"
              style={{ border: "2px solid oklch(0.82 0.12 255)", background: "oklch(0.97 0.04 255)" }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden text-sm font-bold text-white"
                style={{ background: manager.photoUrl ? undefined : "oklch(0.42 0.18 255)" }}
              >
                {manager.photoUrl
                  ? <img src={manager.photoUrl} alt={manager.firstName} className="w-full h-full object-cover" />
                  : <>{manager.firstName?.[0]}{manager.lastName?.[0]}</>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
                    {manager.firstName} {manager.lastName}
                  </p>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: "oklch(0.88 0.12 255)", color: "oklch(0.32 0.18 255)", fontSize: "10px" }}
                  >
                    Manager
                  </span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: "oklch(0.55 0.012 65)" }}>{manager.position}</p>
                {manager.email && (
                  <p className="text-xs mt-0.5" style={{ color: "oklch(0.62 0.12 255)" }}>{manager.email}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* My Team Members */}
      {emp?.orgUnitId && (
        <div className="hr-card p-5">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Users size={16} style={{ color: "oklch(0.42 0.18 255)" }} />
              <h3 className="text-sm font-semibold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
                My Team
              </h3>
              {!teamLoading && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: "oklch(0.92 0.08 255)", color: "oklch(0.42 0.18 255)" }}
                >
                  {teamMembers.length} members
                </span>
              )}
            </div>

            {/* Filter tabs */}
            <div
              className="ml-auto flex rounded-lg overflow-hidden border text-xs"
              style={{ borderColor: "oklch(0.88 0.006 80)" }}
            >
              {(["all", "manager", "member"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setMemberFilter(f)}
                  className="px-3 py-1.5 transition-colors capitalize"
                  style={{
                    background: memberFilter === f ? "oklch(0.22 0.022 250)" : "white",
                    color: memberFilter === f ? "white" : "oklch(0.45 0.012 65)",
                    fontWeight: memberFilter === f ? 600 : 400,
                  }}
                >
                  {f === "all" ? "All" : f === "manager" ? "Manager" : "Members"}
                </button>
              ))}
            </div>
          </div>

          {teamLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={20} className="animate-spin" style={{ color: "oklch(0.42 0.18 255)" }} />
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users size={28} className="mx-auto mb-2" style={{ color: "oklch(0.82 0.006 80)" }} />
              <p className="text-sm" style={{ color: "oklch(0.65 0.012 65)" }}>No team members found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(filtered as any[]).map((member) => {
                const isMe = member.id === emp?.id;
                const initials = `${member.firstName?.[0] ?? ""}${member.lastName?.[0] ?? ""}`;
                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 rounded-lg transition-colors"
                    style={{
                      border: `1px solid ${isMe ? "oklch(0.72 0.15 65)" : "oklch(0.88 0.006 80)"}`,
                      background: isMe ? "oklch(0.97 0.06 80)" : "white",
                    }}
                  >
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      {member.photoUrl && <AvatarFallback style={{ background: "oklch(0.42 0.18 255)", color: "white" }}>{initials}</AvatarFallback>}
                      <AvatarFallback
                        className="text-xs font-semibold"
                        style={{
                          background: member.isManager
                            ? "oklch(0.42 0.18 255)"
                            : isMe
                            ? "oklch(0.72 0.15 65)"
                            : "oklch(0.62 0.1 255)",
                          color: "white",
                        }}
                      >
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-medium truncate" style={{ color: "oklch(0.22 0.012 65)" }}>
                          {member.firstName} {member.lastName}
                        </p>
                        {isMe && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: "oklch(0.92 0.08 80)", color: "oklch(0.52 0.15 65)", fontSize: "10px", fontWeight: 600 }}
                          >
                            You
                          </span>
                        )}
                        {member.isManager && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: "oklch(0.92 0.08 255)", color: "oklch(0.42 0.18 255)", fontSize: "10px", fontWeight: 600 }}
                          >
                            Manager
                          </span>
                        )}
                      </div>
                      <p className="text-xs truncate mt-0.5" style={{ color: "oklch(0.55 0.012 65)" }}>
                        {member.position}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
