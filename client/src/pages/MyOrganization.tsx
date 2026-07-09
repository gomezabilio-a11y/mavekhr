/**
 * MyOrganization.tsx — Team/Entity Org Chart + My Team
 * Design: Warm Slate
 * Features:
 *  - Team/legal entity hierarchy (not person-based)
 *  - Current user's team highlighted (amber)
 *  - Path from root to my team highlighted (blue)
 *  - My Team section: all members with manager badge
 */
import { useState } from "react";
import { teamHierarchy, myTeamMembers, currentUser, TeamNode } from "@/lib/mockData";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, Users, ChevronDown, ChevronRight, Layers, Network } from "lucide-react";
import { cn } from "@/lib/utils";

// Icon and color per node type
const typeConfig: Record<string, { label: string; bg: string; border: string; text: string; icon: React.ElementType }> = {
  entity:     { label: "Entity",     bg: "oklch(0.94 0.04 255)", border: "oklch(0.72 0.18 255)", text: "oklch(0.32 0.18 255)", icon: Building2 },
  division:   { label: "Division",   bg: "oklch(0.94 0.04 145)", border: "oklch(0.62 0.18 145)", text: "oklch(0.28 0.18 145)", icon: Layers },
  department: { label: "Dept",       bg: "oklch(0.94 0.04 65)",  border: "oklch(0.72 0.15 65)",  text: "oklch(0.38 0.15 65)",  icon: Network },
  team:       { label: "Team",       bg: "oklch(0.94 0.04 27)",  border: "oklch(0.62 0.2 27)",   text: "oklch(0.38 0.2 27)",   icon: Users },
};

function TeamNodeCard({
  node,
  depth = 0,
}: {
  node: TeamNode;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const cfg = typeConfig[node.type];
  const Icon = cfg.icon;

  const isMyTeam = !!node.isMyTeam;
  const isMyPath = !!node.isMyPath || isMyTeam;

  return (
    <div className="flex flex-col items-center">
      {/* Node card */}
      <div className="relative flex flex-col items-center">
        <div
          className={cn(
            "relative flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border-2 transition-all duration-150 min-w-[110px] max-w-[140px]",
            isMyTeam
              ? "shadow-lg"
              : isMyPath
              ? "shadow-sm"
              : "shadow-sm"
          )}
          style={{
            background: isMyTeam ? "oklch(0.97 0.06 80)" : "white",
            borderColor: isMyTeam
              ? "oklch(0.72 0.15 65)"
              : isMyPath
              ? "oklch(0.62 0.18 255)"
              : "oklch(0.88 0.006 80)",
            boxShadow: isMyTeam
              ? "0 0 0 3px oklch(0.92 0.08 80), 0 4px 12px rgba(0,0,0,0.1)"
              : isMyPath
              ? "0 2px 8px rgba(0,0,0,0.08)"
              : "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          {/* My team badge */}
          {isMyTeam && (
            <div
              className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-white whitespace-nowrap"
              style={{ background: "oklch(0.72 0.15 65)", fontSize: "9px", fontWeight: 700, letterSpacing: "0.05em" }}
            >
              MY TEAM
            </div>
          )}

          {/* Type icon */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: isMyTeam ? "oklch(0.92 0.08 80)" : cfg.bg }}
          >
            <Icon
              size={15}
              style={{ color: isMyTeam ? "oklch(0.52 0.15 65)" : cfg.text }}
            />
          </div>

          {/* Name */}
          <p
            className="text-xs font-semibold text-center leading-tight"
            style={{
              color: isMyTeam ? "oklch(0.38 0.14 65)" : "oklch(0.22 0.012 65)",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {node.name}
          </p>

          {/* Headcount */}
          {node.headCount !== undefined && (
            <div
              className="flex items-center gap-1 text-center"
              style={{ color: "oklch(0.55 0.012 65)", fontSize: "10px" }}
            >
              <Users size={9} />
              <span>{node.headCount}</span>
            </div>
          )}

          {/* Type badge */}
          <span
            className="text-center px-1.5 py-0.5 rounded-full"
            style={{
              background: isMyTeam ? "oklch(0.88 0.08 80)" : cfg.bg,
              color: isMyTeam ? "oklch(0.52 0.15 65)" : cfg.text,
              fontSize: "9px",
              fontWeight: 600,
            }}
          >
            {cfg.label}
          </span>
        </div>

        {/* Expand/collapse button */}
        {hasChildren && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-1 w-5 h-5 rounded-full border flex items-center justify-center transition-colors hover:bg-gray-100"
            style={{ borderColor: "oklch(0.88 0.006 80)", background: "white" }}
          >
            {expanded ? (
              <ChevronDown size={10} style={{ color: "oklch(0.55 0.012 65)" }} />
            ) : (
              <ChevronRight size={10} style={{ color: "oklch(0.55 0.012 65)" }} />
            )}
          </button>
        )}
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div className="flex flex-col items-center">
          {/* Vertical line down from parent */}
          <div
            className="w-px h-4"
            style={{
              background: isMyPath ? "oklch(0.62 0.18 255)" : "oklch(0.82 0.006 80)",
            }}
          />
          {/* Children row */}
          <div className="flex items-start">
            {node.children.map((child, i) => (
              <div key={child.id} className="flex flex-col items-center">
                <div className="flex items-center w-full">
                  {/* Left connector */}
                  {i > 0 && (
                    <div
                      className="h-px"
                      style={{
                        background: child.isMyPath || child.isMyTeam ? "oklch(0.62 0.18 255)" : "oklch(0.82 0.006 80)",
                        minWidth: "20px",
                        flex: 1,
                      }}
                    />
                  )}
                  <div className="flex flex-col items-center">
                    <div
                      className="w-px h-4"
                      style={{
                        background: child.isMyPath || child.isMyTeam ? "oklch(0.62 0.18 255)" : "oklch(0.82 0.006 80)",
                      }}
                    />
                    <TeamNodeCard node={child} depth={depth + 1} />
                  </div>
                  {/* Right connector */}
                  {i < node.children.length - 1 && (
                    <div
                      className="h-px"
                      style={{
                        background:
                          node.children[i + 1].isMyPath || node.children[i + 1].isMyTeam
                            ? "oklch(0.62 0.18 255)"
                            : "oklch(0.82 0.006 80)",
                        minWidth: "20px",
                        flex: 1,
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyOrganization() {
  const [memberFilter, setMemberFilter] = useState<"all" | "manager" | "member">("all");

  const managers = myTeamMembers.filter((m) => m.isManager);
  const filtered =
    memberFilter === "all"
      ? myTeamMembers
      : memberFilter === "manager"
      ? myTeamMembers.filter((m) => m.isManager)
      : myTeamMembers.filter((m) => !m.isManager);

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h2
          className="text-xl font-bold mb-1"
          style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}
        >
          My Organization
        </h2>
        <p className="text-sm" style={{ color: "oklch(0.55 0.012 65)" }}>
          Your team's position within the company structure
        </p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 flex-wrap">
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded border-2"
            style={{ borderColor: "oklch(0.72 0.15 65)", background: "oklch(0.97 0.06 80)" }}
          />
          <span className="text-xs" style={{ color: "oklch(0.55 0.012 65)" }}>My Team</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded border-2"
            style={{ borderColor: "oklch(0.62 0.18 255)", background: "white" }}
          />
          <span className="text-xs" style={{ color: "oklch(0.55 0.012 65)" }}>Reporting line</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded border-2"
            style={{ borderColor: "oklch(0.88 0.006 80)", background: "white" }}
          />
          <span className="text-xs" style={{ color: "oklch(0.55 0.012 65)" }}>Other teams</span>
        </div>
        {/* Type legend */}
        <div className="flex items-center gap-3 ml-auto flex-wrap">
          {Object.entries(typeConfig).map(([type, cfg]) => {
            const Icon = cfg.icon;
            return (
              <div key={type} className="flex items-center gap-1">
                <div
                  className="w-4 h-4 rounded flex items-center justify-center"
                  style={{ background: cfg.bg }}
                >
                  <Icon size={9} style={{ color: cfg.text }} />
                </div>
                <span className="text-xs" style={{ color: "oklch(0.55 0.012 65)" }}>
                  {cfg.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Org Chart */}
      <div className="hr-card p-6 overflow-x-auto">
        <div className="flex justify-center min-w-max pb-4 pt-4">
          <TeamNodeCard node={teamHierarchy} />
        </div>
      </div>

      {/* My Team Section */}
      <div className="hr-card p-5">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Users size={16} style={{ color: "oklch(0.42 0.18 255)" }} />
            <h3
              className="text-sm font-semibold"
              style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}
            >
              My Team
            </h3>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: "oklch(0.92 0.08 255)", color: "oklch(0.42 0.18 255)" }}
            >
              {myTeamMembers.length} members
            </span>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 p-3 rounded-lg transition-colors"
              style={{
                border: `1px solid ${member.isCurrentUser ? "oklch(0.72 0.15 65)" : "oklch(0.88 0.006 80)"}`,
                background: member.isCurrentUser ? "oklch(0.97 0.06 80)" : "white",
              }}
            >
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarImage src={member.photo} alt={member.name} />
                <AvatarFallback
                  className="text-xs font-semibold"
                  style={{
                    background: member.isManager
                      ? "oklch(0.42 0.18 255)"
                      : member.isCurrentUser
                      ? "oklch(0.72 0.15 65)"
                      : "oklch(0.62 0.1 255)",
                    color: "white",
                  }}
                >
                  {member.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: "oklch(0.22 0.012 65)" }}
                  >
                    {member.name}
                  </p>
                  {member.isCurrentUser && (
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
                <p
                  className="text-xs truncate mt-0.5"
                  style={{ color: "oklch(0.55 0.012 65)" }}
                >
                  {member.position}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
