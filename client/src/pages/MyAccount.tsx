/**
 * MyAccount.tsx — Account Settings
 * Design: Warm Slate
 */
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock, History, Monitor, Mail, CheckCircle2, AlertCircle, Clock, LogIn } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export default function MyAccount() {
  const { user } = useAuth();

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState("");

  const changePasswordMutation = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPwError("");
    },
    onError: (err) => {
      if (err.message.includes("incorrect")) {
        setPwError("Current password is incorrect.");
      } else if (err.message.includes("No password")) {
        setPwError("Your account uses Google/SSO login. Password change is not available.");
      } else {
        setPwError(err.message);
      }
    },
  });

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    if (newPassword.length < 8) {
      setPwError("New password must be at least 8 characters.");
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setPwError("Password must contain uppercase, lowercase, and numbers.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("New passwords do not match.");
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  }

  const isGoogleUser = user?.loginMethod === "google" || !user?.passwordHash;

  const cardStyle = {
    background: "white",
    border: "1px solid oklch(0.88 0.006 80)",
    borderRadius: "12px",
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
          My Account
        </h2>
        <p className="text-sm" style={{ color: "oklch(0.55 0.012 65)" }}>
          Manage your account security and settings
        </p>
      </div>

      <Tabs defaultValue="password">
        <TabsList className="mb-4">
          <TabsTrigger value="password" className="flex items-center gap-1.5">
            <Lock size={14} />
            Password
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1.5">
            <History size={14} />
            Login History
          </TabsTrigger>
          <TabsTrigger value="devices" className="flex items-center gap-1.5">
            <Monitor size={14} />
            Devices
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-1.5">
            <Mail size={14} />
            Email
          </TabsTrigger>
        </TabsList>

        {/* Password Tab */}
        <TabsContent value="password">
          <div className="p-5 max-w-md" style={cardStyle}>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "oklch(0.92 0.08 255)" }}>
                <Lock size={16} style={{ color: "oklch(0.42 0.18 255)" }} />
              </div>
              <h4 className="text-sm font-semibold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
                Change Password
              </h4>
            </div>

            {isGoogleUser ? (
              <div className="p-4 rounded-lg flex items-start gap-3" style={{ background: "oklch(0.96 0.01 80)", border: "1px solid oklch(0.88 0.006 80)" }}>
                <AlertCircle size={16} style={{ color: "oklch(0.55 0.012 65)", marginTop: 2, flexShrink: 0 }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: "oklch(0.35 0.012 65)" }}>Google / SSO Account</p>
                  <p className="text-xs mt-0.5" style={{ color: "oklch(0.55 0.012 65)" }}>
                    Your account is linked to Google login. Password management is handled by your identity provider.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <Label className="text-xs font-medium mb-1.5 block" style={{ color: "oklch(0.45 0.012 65)" }}>
                    Current Password
                  </Label>
                  <Input
                    type="password"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium mb-1.5 block" style={{ color: "oklch(0.45 0.012 65)" }}>
                    New Password
                  </Label>
                  <Input
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium mb-1.5 block" style={{ color: "oklch(0.45 0.012 65)" }}>
                    Confirm New Password
                  </Label>
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                {pwError && (
                  <div className="p-3 rounded-lg flex items-start gap-2" style={{ background: "oklch(0.96 0.05 27)", border: "1px solid oklch(0.88 0.08 27)" }}>
                    <AlertCircle size={14} style={{ color: "oklch(0.52 0.2 27)", marginTop: 1, flexShrink: 0 }} />
                    <p className="text-xs" style={{ color: "oklch(0.45 0.18 27)" }}>{pwError}</p>
                  </div>
                )}
                <div className="p-3 rounded-lg text-xs" style={{ background: "oklch(0.94 0.004 80)", color: "oklch(0.55 0.012 65)" }}>
                  Password must be at least 8 characters and contain uppercase, lowercase, and numbers.
                </div>
                <Button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  className="w-full"
                  style={{ background: "oklch(0.42 0.18 255)", color: "white" }}
                >
                  {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
                </Button>
              </form>
            )}
          </div>
        </TabsContent>

        {/* Login History Tab */}
        <TabsContent value="history">
          <div className="p-5" style={cardStyle}>
            <h4 className="text-sm font-semibold mb-4" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
              Login History
            </h4>
            <div className="space-y-2">
              {user?.lastSignedIn ? (
                <>
                  <div className="flex items-center gap-3 p-3 rounded-lg" style={{ border: "1px solid oklch(0.88 0.006 80)" }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "oklch(0.92 0.08 145)" }}>
                      <LogIn size={16} style={{ color: "oklch(0.42 0.18 145)" }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: "oklch(0.22 0.012 65)" }}>
                        {user.loginMethod === "google" ? "Google Sign-In" : "Email & Password"}
                      </p>
                      <p className="text-xs" style={{ color: "oklch(0.55 0.012 65)" }}>
                        {new Date(user.lastSignedIn).toLocaleString("en-SG", {
                          day: "numeric", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "oklch(0.92 0.08 145)", color: "oklch(0.42 0.18 145)" }}>
                      Most Recent
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-3 p-3 rounded-lg" style={{ background: "oklch(0.96 0.004 80)" }}>
                    <Clock size={13} style={{ color: "oklch(0.65 0.01 65)", flexShrink: 0 }} />
                    <p className="text-xs" style={{ color: "oklch(0.65 0.01 65)" }}>
                      Account created on {new Date(user.createdAt).toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" })}.
                      Full login history tracking is not yet available.
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-center py-8" style={{ color: "oklch(0.65 0.01 65)" }}>
                  No login history available.
                </p>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Devices Tab */}
        <TabsContent value="devices">
          <div className="p-5" style={cardStyle}>
            <h4 className="text-sm font-semibold mb-4" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
              Connected Devices
            </h4>
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "oklch(0.94 0.004 80)" }}>
                <Monitor size={22} style={{ color: "oklch(0.65 0.01 65)" }} />
              </div>
              <p className="text-sm font-medium" style={{ color: "oklch(0.45 0.012 65)" }}>Device tracking not available</p>
              <p className="text-xs text-center max-w-xs" style={{ color: "oklch(0.65 0.01 65)" }}>
                Session and device management will be available in a future update.
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email">
          <div className="p-5 max-w-md" style={cardStyle}>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "oklch(0.92 0.08 145)" }}>
                <Mail size={16} style={{ color: "oklch(0.42 0.18 145)" }} />
              </div>
              <h4 className="text-sm font-semibold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
                Email Verification
              </h4>
            </div>
            <div className="p-4 rounded-lg flex items-center gap-3 mb-4" style={{ background: "oklch(0.92 0.08 145)" }}>
              <CheckCircle2 size={18} style={{ color: "oklch(0.42 0.18 145)" }} />
              <div>
                <p className="text-sm font-medium" style={{ color: "oklch(0.35 0.16 145)" }}>Email Verified</p>
                <p className="text-xs" style={{ color: "oklch(0.45 0.14 145)" }}>{user?.email ?? "—"}</p>
              </div>
            </div>
            <div className="p-3 rounded-lg text-xs" style={{ background: "oklch(0.94 0.004 80)", color: "oklch(0.55 0.012 65)" }}>
              <strong>Allowed domains:</strong> @mavekbcs.com and @mavekinc.com only
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
