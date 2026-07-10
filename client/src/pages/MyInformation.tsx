/**
 * MyInformation.tsx — Employee Information (DB-connected)
 * Design: Warm Slate
 */
import { trpc } from "@/lib/trpc";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileText, User, Briefcase, Loader2 } from "lucide-react";

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start py-3 border-b last:border-b-0" style={{ borderColor: "oklch(0.92 0.004 80)" }}>
      <span className="text-xs font-medium w-44 flex-shrink-0 pt-0.5" style={{ color: "oklch(0.55 0.012 65)" }}>
        {label}
      </span>
      <span className="text-sm font-medium" style={{ color: value ? "oklch(0.22 0.012 65)" : "oklch(0.65 0.01 65)" }}>
        {value || "—"}
      </span>
    </div>
  );
}

export default function MyInformation() {
  const { data: me } = trpc.auth.me.useQuery();
  const { data: emp, isLoading: empLoading } = trpc.employee.me.useQuery(undefined, { enabled: !!me });
  const { data: documents = [], isLoading: docsLoading } = trpc.document.list.useQuery(
    { employeeId: emp?.id ?? 0 },
    { enabled: !!emp?.id }
  );

  const initials = emp ? `${emp.firstName[0]}${emp.lastName[0]}` : "??";
  const fullName = emp ? `${emp.firstName} ${emp.lastName}` : "—";

  if (empLoading) {
    return (
      <div className="p-6 flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin" style={{ color: "oklch(0.42 0.18 255)" }} />
      </div>
    );
  }

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
          {emp?.photoUrl && <AvatarImage src={emp.photoUrl} alt={fullName} />}
          <AvatarFallback className="text-xl font-semibold" style={{ background: "oklch(0.42 0.18 255)", color: "white" }}>
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-xl font-bold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
            {fullName}
          </h3>
          <p className="text-sm font-medium mt-0.5" style={{ color: "oklch(0.42 0.18 255)" }}>
            {emp?.position ?? "—"}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "oklch(0.92 0.08 255)", color: "oklch(0.42 0.18 255)" }}>
              {(emp as any)?.orgUnit?.name ?? "—"}
            </span>
            <span className="text-xs" style={{ color: "oklch(0.55 0.012 65)", fontFamily: "'JetBrains Mono', monospace" }}>
              {emp?.employeeCode ?? "—"}
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
            <InfoRow label="Full Name" value={fullName} />
            <InfoRow label="Employee Code" value={emp?.employeeCode} />
            <InfoRow label="Email" value={emp?.email} />
            <InfoRow label="Phone" value={emp?.phone} />
            <InfoRow label="Nationality" value={emp?.nationality} />
            <InfoRow label="Emergency Contact" value={emp?.emergencyContact} />
          </div>
        </TabsContent>

        <TabsContent value="employment">
          <div className="hr-card p-5">
            <h4 className="text-sm font-semibold mb-3" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
              Employment Information
            </h4>
            <InfoRow label="Employment Type" value={emp?.employmentType} />
            <InfoRow label="Employee Role" value={(emp as any)?.employeeRole} />
            <InfoRow label="Start Date" value={emp?.startDate ? new Date(emp.startDate).toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" }) : undefined} />
            <InfoRow label="Contract End" value={emp?.contractEndDate ? new Date(emp.contractEndDate).toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" }) : "Permanent"} />
            <InfoRow label="Position" value={emp?.position} />
            <InfoRow label="Team / Org Unit" value={(emp as any)?.orgUnit?.name} />
            <InfoRow label="Work Location" value={emp?.workLocation} />
            <InfoRow label="Status" value={emp?.status} />
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <div className="hr-card p-5">
            <h4 className="text-sm font-semibold mb-3" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
              My Documents
            </h4>
            {docsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 size={22} className="animate-spin" style={{ color: "oklch(0.42 0.18 255)" }} />
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-10">
                <FileText size={32} className="mx-auto mb-3" style={{ color: "oklch(0.82 0.006 80)" }} />
                <p className="text-sm" style={{ color: "oklch(0.65 0.012 65)" }}>No documents on file yet.</p>
                <p className="text-xs mt-1" style={{ color: "oklch(0.72 0.006 80)" }}>Contact HR to upload your CV or contract.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(documents as any[]).map((doc) => (
                  <div
                    key={doc.id}
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
                        {doc.fileType}
                        {doc.issueDate && ` · ${new Date(doc.issueDate).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}`}
                      </p>
                    </div>
                    {doc.fileUrl ? (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors hover:bg-blue-50"
                        style={{ color: "oklch(0.42 0.18 255)", border: "1px solid oklch(0.85 0.08 255)" }}
                      >
                        <Download size={12} />
                        Download
                      </a>
                    ) : (
                      <span className="text-xs px-3 py-1.5 rounded-md" style={{ color: "oklch(0.72 0.006 80)", border: "1px solid oklch(0.90 0.006 80)" }}>
                        No file
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
