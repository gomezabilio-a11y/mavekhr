/**
 * MyAccount.tsx — Account Settings
 * Design: Warm Slate
 */
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock, History, Monitor, Mail, CheckCircle2, Laptop, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function MyAccount() {
  const { user } = useAuth();
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

        <TabsContent value="password">
          <div className="hr-card p-5 max-w-md">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "oklch(0.92 0.08 255)" }}>
                <Lock size={16} style={{ color: "oklch(0.42 0.18 255)" }} />
              </div>
              <h4 className="text-sm font-semibold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
                Change Password
              </h4>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-medium mb-1.5 block" style={{ color: "oklch(0.45 0.012 65)" }}>
                  Current Password
                </Label>
                <Input type="password" placeholder="Enter current password" />
              </div>
              <div>
                <Label className="text-xs font-medium mb-1.5 block" style={{ color: "oklch(0.45 0.012 65)" }}>
                  New Password
                </Label>
                <Input type="password" placeholder="Enter new password" />
              </div>
              <div>
                <Label className="text-xs font-medium mb-1.5 block" style={{ color: "oklch(0.45 0.012 65)" }}>
                  Confirm New Password
                </Label>
                <Input type="password" placeholder="Confirm new password" />
              </div>
              <div className="p-3 rounded-lg text-xs" style={{ background: "oklch(0.94 0.004 80)", color: "oklch(0.55 0.012 65)" }}>
                Password must be at least 8 characters and contain uppercase, lowercase, and numbers.
              </div>
              <Button
                onClick={() => toast.success("Password updated successfully")}
                className="w-full"
                style={{ background: "oklch(0.42 0.18 255)", color: "white" }}
              >
                Update Password
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="hr-card p-5">
            <h4 className="text-sm font-semibold mb-4" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
              Login History
            </h4>
            <div className="space-y-2">
              <p className="text-sm text-center py-8" style={{ color: "oklch(0.65 0.01 65)" }}>
                Login history is not yet tracked.
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="devices">
          <div className="hr-card p-5">
            <h4 className="text-sm font-semibold mb-4" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
              Connected Devices
            </h4>
            <div className="space-y-2">
              {[
                { device: "MacBook Pro", type: "laptop", lastActive: "Active now", trusted: true },
                { device: "iPhone 15", type: "phone", lastActive: "Yesterday at 18:45", trusted: true },
              ].map((d, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg" style={{ border: "1px solid oklch(0.88 0.006 80)" }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "oklch(0.94 0.004 80)" }}>
                    {d.type === "phone" ? <Smartphone size={16} style={{ color: "oklch(0.55 0.012 65)" }} /> : <Laptop size={16} style={{ color: "oklch(0.55 0.012 65)" }} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: "oklch(0.22 0.012 65)" }}>{d.device}</p>
                    <p className="text-xs" style={{ color: "oklch(0.55 0.012 65)" }}>{d.lastActive}</p>
                  </div>
                  <button
                    onClick={() => toast.info("Device management — Coming Soon")}
                    className="text-xs px-2.5 py-1 rounded-md font-medium transition-colors hover:bg-red-50"
                    style={{ color: "oklch(0.52 0.2 27)", border: "1px solid oklch(0.88 0.08 27)" }}
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="email">
          <div className="hr-card p-5 max-w-md">
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
