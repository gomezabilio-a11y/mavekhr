/**
 * MyOrganization.tsx — Org Chart + My Team
 * Design: Warm Slate
 * Features:
 *  - Full org hierarchy from CEO down to leaf nodes
 *  - Current user highlighted
 *  - Path from CEO to current user highlighted (ancestry path)
 *  - Click on any node → profile card popup
 *  - My Team section showing direct reports + manager
 */
import { useState } from "react";
import { orgHierarchy, myTeam, currentUser } from "@/lib/mockData";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail, Users, ChevronDown, ChevronRight, Building2, Crown, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrgNode {
  id: string;
  name: string;
  position: string;
  department: string;
  email: string;
  photo: string;
  isCurrentUser?: boolean;
  children: OrgNode[];
}

interface ProfileCard {
  node: OrgNode;
}

// Find ancestry path to current user
function findPath(node: OrgNode, targetId: string, path: string[] = []): string[] | null {
  const currentPath = [...path, node.id];
  if (node.id === targetId) return currentPath;
  for (const child of node.children) {
    const result = findPath(child, targetId, currentPath);
    if (result) return result;
  }
  return null;
}

const ancestryPath = findPath(orgHierarchy, currentUser.id) || [];

function OrgNodeCard({
  node,
  onSelect,
  depth = 0,
}: {
  node: OrgNode;
  onSelect: (node: OrgNode) => void;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const isInPath = ancestryPath.includes(node.id);
  const isCurrentUser = node.id === currentUser.id;
  const hasChildren = node.children.length > 0;

  return (
    <div className="flex flex-col items-center">
      {/* Node */}
      <div className="relative flex flex-col items-center">
        <button
          onClick={() => onSelect(node)}
          className={cn(
            "relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-150 w-28 hover:shadow-md",
            isCurrentUser
              ? "border-amber-400 shadow-md"
              : isInPath
              ? "border-blue-400"
              : "border-transparent hover:border-gray-200",
            "bg-white"
          )}
          style={{
            boxShadow: isCurrentUser
              ? "0 0 0 3px oklch(0.92 0.08 80), 0 4px 12px rgba(0,0,0,0.1)"
              : isInPath
              ? "0 2px 8px rgba(0,0,0,0.08)"
              : "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          {isCurrentUser && (
            <div
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center z-10"
              style={{ background: "oklch(0.72 0.15 65)" }}
            >
              <Star size={10} fill="white" color="white" />
            </div>
          )}
          <Avatar className="w-10 h-10">
            <AvatarImage src={node.photo} alt={node.name} />
            <AvatarFallback
              className="text-xs font-semibold"
              style={{
                background: isCurrentUser ? "oklch(0.72 0.15 65)" : "oklch(0.42 0.18 255)",
                color: "white",
              }}
            >
              {node.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <p
              className="text-xs font-semibold leading-tight"
              style={{
                color: isCurrentUser ? "oklch(0.45 0.14 65)" : "oklch(0.22 0.012 65)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {node.name.split(" ")[0]}
            </p>
            <p
              className="text-xs leading-tight mt-0.5"
              style={{ color: "oklch(0.55 0.012 65)", fontSize: "10px" }}
            >
              {node.position.length > 14 ? node.position.slice(0, 13) + "…" : node.position}
            </p>
          </div>
        </button>

        {/* Expand/Collapse button */}
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
          {/* Vertical line down */}
          <div
            className="w-px h-4"
            style={{ background: isInPath ? "oklch(0.42 0.18 255)" : "oklch(0.82 0.006 80)" }}
          />
          {/* Horizontal line spanning children */}
          <div className="flex items-start gap-0">
            {node.children.map((child, i) => (
              <div key={child.id} className="flex flex-col items-center relative">
                {/* Connector lines */}
                <div className="flex items-center w-full">
                  {/* Left horizontal */}
                  {i > 0 && (
                    <div
                      className="h-px flex-1"
                      style={{
                        background: ancestryPath.includes(child.id)
                          ? "oklch(0.42 0.18 255)"
                          : "oklch(0.82 0.006 80)",
                        minWidth: "20px",
                      }}
                    />
                  )}
                  {/* Vertical down to child */}
                  <div className="flex flex-col items-center">
                    <div
                      className="w-px h-4"
                      style={{
                        background: ancestryPath.includes(child.id)
                          ? "oklch(0.42 0.18 255)"
                          : "oklch(0.82 0.006 80)",
                      }}
                    />
                    <OrgNodeCard node={child} onSelect={onSelect} depth={depth + 1} />
                  </div>
                  {/* Right horizontal */}
                  {i < node.children.length - 1 && (
                    <div
                      className="h-px flex-1"
                      style={{
                        background: ancestryPath.includes(node.children[i + 1].id)
                          ? "oklch(0.42 0.18 255)"
                          : "oklch(0.82 0.006 80)",
                        minWidth: "20px",
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
  const [selectedNode, setSelectedNode] = useState<OrgNode | null>(null);

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
          View your team's position within the company hierarchy
        </p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-amber-400" style={{ background: "white" }} />
          <span className="text-xs" style={{ color: "oklch(0.55 0.012 65)" }}>You</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-blue-400" style={{ background: "white" }} />
          <span className="text-xs" style={{ color: "oklch(0.55 0.012 65)" }}>Your reporting line</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-gray-200" style={{ background: "white" }} />
          <span className="text-xs" style={{ color: "oklch(0.55 0.012 65)" }}>Other members</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs" style={{ color: "oklch(0.55 0.012 65)" }}>
            Click any card to view profile
          </span>
        </div>
      </div>

      {/* Org Chart */}
      <div className="hr-card p-6 overflow-x-auto">
        <div className="flex justify-center min-w-max pb-4">
          <OrgNodeCard node={orgHierarchy} onSelect={setSelectedNode} />
        </div>
      </div>

      {/* My Team Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Manager */}
        <div className="hr-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Crown size={16} style={{ color: "oklch(0.72 0.15 65)" }} />
            <h3
              className="text-sm font-semibold"
              style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}
            >
              My Manager
            </h3>
          </div>
          {currentUser.manager === null ? (
            <div
              className="flex items-center gap-3 p-4 rounded-lg"
              style={{ background: "oklch(0.94 0.004 80)" }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "oklch(0.88 0.006 80)" }}
              >
                <Crown size={16} style={{ color: "oklch(0.55 0.012 65)" }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: "oklch(0.22 0.012 65)" }}>
                  N/A
                </p>
                <p className="text-xs" style={{ color: "oklch(0.55 0.012 65)" }}>
                  You are at the top of your reporting line
                </p>
              </div>
            </div>
          ) : (
            <div
              className="flex items-center gap-3 p-4 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              style={{ border: "1px solid oklch(0.88 0.006 80)" }}
            >
              <Avatar className="w-10 h-10">
                <AvatarFallback style={{ background: "oklch(0.42 0.18 255)", color: "white" }}>
                  M
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium" style={{ color: "oklch(0.22 0.012 65)" }}>
                  {currentUser.managerName}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* My Direct Reports */}
        <div className="hr-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} style={{ color: "oklch(0.42 0.18 255)" }} />
            <h3
              className="text-sm font-semibold"
              style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}
            >
              My Direct Reports
            </h3>
            <span
              className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: "oklch(0.92 0.08 255)", color: "oklch(0.42 0.18 255)" }}
            >
              {myTeam.length} members
            </span>
          </div>
          <div className="space-y-2">
            {myTeam.map((member) => (
              <button
                key={member.id}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                style={{ border: "1px solid oklch(0.88 0.006 80)" }}
                onClick={() => {
                  // Find in orgHierarchy and show
                  const findNode = (node: OrgNode): OrgNode | null => {
                    if (node.id === member.id) return node;
                    for (const c of node.children) {
                      const r = findNode(c);
                      if (r) return r;
                    }
                    return null;
                  };
                  const node = findNode(orgHierarchy);
                  if (node) setSelectedNode(node);
                }}
              >
                <Avatar className="w-9 h-9 flex-shrink-0">
                  <AvatarImage src={member.photo} alt={member.name} />
                  <AvatarFallback
                    className="text-xs font-semibold"
                    style={{ background: "oklch(0.42 0.18 255)", color: "white" }}
                  >
                    {member.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "oklch(0.22 0.012 65)" }}>
                    {member.name}
                  </p>
                  <p className="text-xs truncate" style={{ color: "oklch(0.55 0.012 65)" }}>
                    {member.position}
                  </p>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: "oklch(0.92 0.08 145)", color: "oklch(0.35 0.16 145)" }}
                >
                  {member.department}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Profile Dialog */}
      <Dialog open={!!selectedNode} onOpenChange={() => setSelectedNode(null)}>
        <DialogContent className="max-w-sm">
          {selectedNode && (
            <>
              <DialogHeader>
                <DialogTitle className="sr-only">Employee Profile</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center gap-4 pt-2">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={selectedNode.photo} alt={selectedNode.name} />
                  <AvatarFallback
                    className="text-xl font-semibold"
                    style={{ background: selectedNode.isCurrentUser ? "oklch(0.72 0.15 65)" : "oklch(0.42 0.18 255)", color: "white" }}
                  >
                    {selectedNode.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                {selectedNode.isCurrentUser && (
                  <span
                    className="text-xs px-3 py-1 rounded-full font-medium -mt-2"
                    style={{ background: "oklch(0.92 0.08 80)", color: "oklch(0.45 0.14 65)" }}
                  >
                    ⭐ That's you!
                  </span>
                )}
                <div className="text-center">
                  <h3
                    className="text-lg font-bold"
                    style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {selectedNode.name}
                  </h3>
                  <p className="text-sm font-medium mt-0.5" style={{ color: "oklch(0.42 0.18 255)" }}>
                    {selectedNode.position}
                  </p>
                </div>
                <div className="w-full space-y-2">
                  <div
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ background: "oklch(0.94 0.004 80)" }}
                  >
                    <Building2 size={14} style={{ color: "oklch(0.55 0.012 65)" }} />
                    <div>
                      <p className="text-xs" style={{ color: "oklch(0.55 0.012 65)" }}>Department</p>
                      <p className="text-sm font-medium" style={{ color: "oklch(0.22 0.012 65)" }}>
                        {selectedNode.department}
                      </p>
                    </div>
                  </div>
                  <div
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ background: "oklch(0.94 0.004 80)" }}
                  >
                    <Mail size={14} style={{ color: "oklch(0.55 0.012 65)" }} />
                    <div className="min-w-0">
                      <p className="text-xs" style={{ color: "oklch(0.55 0.012 65)" }}>Email</p>
                      <p className="text-sm font-medium truncate" style={{ color: "oklch(0.22 0.012 65)" }}>
                        {selectedNode.email}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
