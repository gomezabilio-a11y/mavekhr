/**
 * AdminUsers.tsx — User Management (Admin Portal)
 * Lists all registered users and allows admins to promote/demote roles
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Shield, ShieldOff, User, Key, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const utils = trpc.useUtils();

  const { data: userList, isLoading } = trpc.auth.listUsers.useQuery();

  const setRoleMutation = trpc.auth.setRole.useMutation({
    onSuccess: () => {
      toast.success("User role updated successfully");
      utils.auth.listUsers.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update role");
    },
  });

  const setPasswordMutation = trpc.auth.setPassword.useMutation({
    onSuccess: () => {
      toast.success("Password updated successfully");
      setPasswordDialog(null);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update password");
    },
  });

  const [passwordDialog, setPasswordDialog] = useState<{ userId: number; name: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const handleRoleToggle = (userId: number, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    const action = newRole === "admin" ? "promote to Admin" : "demote to Employee";
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    setRoleMutation.mutate({ userId, role: newRole as "admin" | "user" });
  };

  const handleSetPassword = () => {
    if (!passwordDialog || newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setPasswordMutation.mutate({ userId: passwordDialog.userId, newPassword });
    setNewPassword("");
  };

  const formatDate = (d: Date | string | null | undefined) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
          User Management
        </h1>
        <p className="text-sm mt-1" style={{ color: "oklch(0.55 0.012 65)" }}>
          Manage user accounts and admin access rights
        </p>
      </div>

      {/* Users Table */}
      <div className="hr-card overflow-hidden">
        <div className="px-4 py-3 border-b" style={{ borderColor: "oklch(0.92 0.004 80)", background: "oklch(0.97 0.006 80)" }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "oklch(0.55 0.012 65)" }}>
            {isLoading ? "Loading..." : `${userList?.length ?? 0} total users`}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "oklch(0.62 0.18 255)" }} />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: "oklch(0.92 0.004 80)" }}>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "oklch(0.55 0.012 65)" }}>Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "oklch(0.55 0.012 65)" }}>Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "oklch(0.55 0.012 65)" }}>Login Method</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "oklch(0.55 0.012 65)" }}>Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "oklch(0.55 0.012 65)" }}>Last Sign In</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "oklch(0.55 0.012 65)" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {userList?.map(u => {
                const isSelf = u.id === currentUser?.id;
                return (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors" style={{ borderColor: "oklch(0.94 0.006 80)" }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: u.role === "admin" ? "oklch(0.52 0.18 255)" : "oklch(0.62 0.012 65)" }}>
                          {u.name ? u.name.split(" ").map(n => n[0]).slice(0, 2).join("") : <User size={12} />}
                        </div>
                        <span className="font-medium text-sm" style={{ color: "oklch(0.22 0.012 65)" }}>
                          {u.name || "—"}
                          {isSelf && <span className="ml-1 text-xs" style={{ color: "oklch(0.55 0.012 65)" }}>(you)</span>}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "oklch(0.45 0.012 65)" }}>{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ background: "oklch(0.94 0.006 80)", color: "oklch(0.45 0.012 65)" }}>
                        {u.loginMethod || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className="text-xs"
                        style={u.role === "admin"
                          ? { background: "oklch(0.92 0.08 255)", color: "oklch(0.42 0.18 255)", border: "none" }
                          : { background: "oklch(0.94 0.006 80)", color: "oklch(0.55 0.012 65)", border: "none" }
                        }
                      >
                        {u.role === "admin" ? "Admin" : "Employee"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "oklch(0.55 0.012 65)" }}>
                      {formatDate(u.lastSignedIn)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {/* Role toggle — disabled for self */}
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isSelf || setRoleMutation.isPending}
                          onClick={() => handleRoleToggle(u.id, u.role)}
                          className="h-7 px-2 text-xs gap-1"
                          title={isSelf ? "Cannot change your own role" : u.role === "admin" ? "Demote to Employee" : "Promote to Admin"}
                        >
                          {u.role === "admin"
                            ? <><ShieldOff size={12} /> Demote</>
                            : <><Shield size={12} /> Make Admin</>
                          }
                        </Button>
                        {/* Reset password — only for email/password users */}
                        {u.loginMethod === "password" || u.loginMethod === "email" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setPasswordDialog({ userId: u.id, name: u.name || u.email || "User" }); setNewPassword(""); }}
                            className="h-7 px-2 text-xs gap-1"
                            title="Reset Password"
                          >
                            <Key size={12} /> Reset PW
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Reset Password Dialog */}
      <Dialog open={!!passwordDialog} onOpenChange={(open) => { if (!open) setPasswordDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm mb-4" style={{ color: "oklch(0.45 0.012 65)" }}>
              Set a new password for <strong>{passwordDialog?.name}</strong>.
            </p>
            <Label htmlFor="new-password" className="text-xs font-medium">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="mt-1"
              onKeyDown={(e) => { if (e.key === "Enter") handleSetPassword(); }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialog(null)}>Cancel</Button>
            <Button
              onClick={handleSetPassword}
              disabled={newPassword.length < 8 || setPasswordMutation.isPending}
            >
              {setPasswordMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
