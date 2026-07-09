/**
 * MyInformation.tsx — Employee Information
 * Design: Warm Slate
 */
import { currentUser, documents } from "@/lib/mockData";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileText, User, Briefcase } from "lucide-react";
import { toast } from "sonner";

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-start py-3 border-b last:border-b-0" style={{ borderColor: "oklch(0.92 0.004 80)" }}>
      <span className="text-xs font-medium w-40 flex-shrink-0 pt-0.5" style={{ color: "oklch(0.55 0.012 65)" }}>
        {label}
      </span>
      <span className="text-sm font-medium" style={{ color: value ? "oklch(0.22 0.012 65)" : "oklch(0.65 0.01 65)" }}>
        {value || "—"}
      </span>
    </div>
  );
}

export default function MyInformation() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
          My Information
        </h2>
        <p className="text-sm" style={{ color: "oklch(0.55 0.012 65)" }}>
          Your personal and employment details
        </p>
      </div>

      {/* Profile Header */}
      <div className="hr-card p-6 flex items-center gap-5">
        <Avatar className="w-20 h-20">
          <AvatarImage src={currentUser.photo} alt={currentUser.name} />
          <AvatarFallback className="text-xl font-semibold" style={{ background: "oklch(0.42 0.18 255)", color: "white" }}>
            JP
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-xl font-bold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
            {currentUser.name}
          </h3>
          <p className="text-sm font-medium mt-0.5" style={{ color: "oklch(0.42 0.18 255)" }}>
            {currentUser.position}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "oklch(0.92 0.08 255)", color: "oklch(0.42 0.18 255)" }}>
              {currentUser.department}
            </span>
            <span className="text-xs" style={{ color: "oklch(0.55 0.012 65)", fontFamily: "'JetBrains Mono', monospace" }}>
              {currentUser.id}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="personal">
        <TabsList className="mb-4">
          <TabsTrigger value="personal" className="flex items-center gap-1.5">
            <User size={14} />
            Personal
          </TabsTrigger>
          <TabsTrigger value="employment" className="flex items-center gap-1.5">
            <Briefcase size={14} />
            Employment
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-1.5">
            <FileText size={14} />
            Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <div className="hr-card p-5">
            <h4 className="text-sm font-semibold mb-3" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
              Personal Information
            </h4>
            <InfoRow label="Full Name" value={currentUser.name} />
            <InfoRow label="Employee ID" value={currentUser.id} />
            <InfoRow label="Email" value={currentUser.email} />
            <InfoRow label="Phone" value={currentUser.phone} />
            <InfoRow label="Nationality" value={currentUser.nationality} />
            <InfoRow label="Emergency Contact" value={currentUser.emergencyContact} />
          </div>
        </TabsContent>

        <TabsContent value="employment">
          <div className="hr-card p-5">
            <h4 className="text-sm font-semibold mb-3" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
              Employment Information
            </h4>
            <InfoRow label="Employment Type" value={currentUser.employmentType} />
            <InfoRow label="Start Date" value={new Date(currentUser.startDate).toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" })} />
            <InfoRow label="Contract End" value={currentUser.contractEndDate || "Permanent"} />
            <InfoRow label="Position" value={currentUser.position} />
            <InfoRow label="Role" value={currentUser.role} />
            <InfoRow label="Department" value={currentUser.department} />
            <InfoRow label="Manager" value={currentUser.managerName} />
            <InfoRow label="Work Location" value={currentUser.workLocation} />
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <div className="hr-card p-5">
            <h4 className="text-sm font-semibold mb-3" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
              My Documents
            </h4>
            <div className="space-y-2">
              {documents.map((doc, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  style={{ border: "1px solid oklch(0.88 0.006 80)" }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "oklch(0.95 0.06 27)" }}
                  >
                    <FileText size={16} style={{ color: "oklch(0.52 0.2 27)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: "oklch(0.22 0.012 65)" }}>
                      {doc.name}
                    </p>
                    <p className="text-xs" style={{ color: "oklch(0.55 0.012 65)" }}>
                      {new Date(doc.date).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })} · {doc.type}
                    </p>
                  </div>
                  <button
                    onClick={() => toast.success(`Downloading ${doc.name}...`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors hover:bg-blue-50"
                    style={{ color: "oklch(0.42 0.18 255)", border: "1px solid oklch(0.85 0.08 255)" }}
                  >
                    <Download size={12} />
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
