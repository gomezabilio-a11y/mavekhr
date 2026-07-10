/**
 * MyInformation.tsx — Employee Information (DB-connected)
 * Design: Warm Slate
 * Features:
 *   - Personal tab: editable phone/nationality/workLocation/emergencyContact (full name read-only)
 *   - Employment tab: read-only employment info
 *   - Bank Information tab: recipient info + bank info (fully editable)
 *   - Documents tab: list of uploaded documents with download links
 */
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, FileText, User, Briefcase, Loader2, Pencil, X, Check, Landmark } from "lucide-react";
import { toast } from "sonner";

// ─── Read-only info row ────────────────────────────────────────────────────────
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

// ─── Editable field row ────────────────────────────────────────────────────────
function EditableRow({
  label,
  value,
  editing,
  fieldKey,
  editValues,
  onChange,
}: {
  label: string;
  value: string | null | undefined;
  editing: boolean;
  fieldKey: string;
  editValues: Record<string, string>;
  onChange: (key: string, val: string) => void;
}) {
  if (!editing) {
    return <InfoRow label={label} value={value} />;
  }
  return (
    <div className="flex items-center py-3 border-b last:border-b-0 gap-4" style={{ borderColor: "oklch(0.92 0.004 80)" }}>
      <span className="text-xs font-medium w-44 flex-shrink-0" style={{ color: "oklch(0.55 0.012 65)" }}>
        {label}
      </span>
      <Input
        value={editValues[fieldKey] ?? ""}
        onChange={(e) => onChange(fieldKey, e.target.value)}
        className="h-8 text-sm max-w-xs"
        placeholder={`Enter ${label.toLowerCase()}`}
      />
    </div>
  );
}

// ─── Bank info field ────────────────────────────────────────────────────────────
function BankField({ label, value, fieldKey, values, onChange }: {
  label: string;
  value?: string | null;
  fieldKey: string;
  values: Record<string, string>;
  onChange: (key: string, val: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium" style={{ color: "oklch(0.55 0.012 65)" }}>{label}</Label>
      <Input
        value={values[fieldKey] ?? ""}
        onChange={(e) => onChange(fieldKey, e.target.value)}
        placeholder={`Enter ${label.toLowerCase()}`}
        className="h-9 text-sm"
      />
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function MyInformation() {
  const utils = trpc.useUtils();

  const { data: me } = trpc.auth.me.useQuery();
  const { data: emp, isLoading: empLoading } = trpc.employee.me.useQuery(undefined, { enabled: !!me });
  const { data: documents = [], isLoading: docsLoading } = trpc.document.list.useQuery(
    { employeeId: emp?.id ?? 0 },
    { enabled: !!emp?.id }
  );
  const { data: bankData, isLoading: bankLoading } = trpc.bankInfo.get.useQuery(undefined, { enabled: !!emp?.id });

  // ── Personal editing state ──────────────────────────────────────────────────
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [personalValues, setPersonalValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (emp) {
      setPersonalValues({
        phone: emp.phone ?? "",
        nationality: emp.nationality ?? "",
        workLocation: emp.workLocation ?? "",
        emergencyContact: emp.emergencyContact ?? "",
      });
    }
  }, [emp]);

  const updatePersonalMutation = trpc.employee.updatePersonal.useMutation({
    onSuccess: () => {
      toast.success("Personal information updated");
      setEditingPersonal(false);
      utils.employee.me.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSavePersonal = () => {
    updatePersonalMutation.mutate({
      phone: personalValues.phone || undefined,
      nationality: personalValues.nationality || undefined,
      workLocation: personalValues.workLocation || undefined,
      emergencyContact: personalValues.emergencyContact || undefined,
    });
  };

  // ── Bank info state ─────────────────────────────────────────────────────────
  const [bankValues, setBankValues] = useState<Record<string, string>>({});
  const [bankDirty, setBankDirty] = useState(false);

  useEffect(() => {
    if (bankData) {
      setBankValues({
        recipientName: bankData.recipientName ?? "",
        recipientAddress: bankData.recipientAddress ?? "",
        recipientEmail: bankData.recipientEmail ?? "",
        recipientPhone: bankData.recipientPhone ?? "",
        bankName: bankData.bankName ?? "",
        swiftBic: bankData.swiftBic ?? "",
        branchName: bankData.branchName ?? "",
        bankAddress: bankData.bankAddress ?? "",
        accountNumber: bankData.accountNumber ?? "",
        ifsc: bankData.ifsc ?? "",
      });
    }
  }, [bankData]);

  const upsertBankMutation = trpc.bankInfo.upsert.useMutation({
    onSuccess: () => {
      toast.success("Bank information saved");
      setBankDirty(false);
      utils.bankInfo.get.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleBankChange = (key: string, val: string) => {
    setBankValues((prev) => ({ ...prev, [key]: val }));
    setBankDirty(true);
  };

  const handleSaveBank = () => {
    upsertBankMutation.mutate({
      recipientName: bankValues.recipientName || undefined,
      recipientAddress: bankValues.recipientAddress || undefined,
      recipientEmail: bankValues.recipientEmail || undefined,
      recipientPhone: bankValues.recipientPhone || undefined,
      bankName: bankValues.bankName || undefined,
      swiftBic: bankValues.swiftBic || undefined,
      branchName: bankValues.branchName || undefined,
      bankAddress: bankValues.bankAddress || undefined,
      accountNumber: bankValues.accountNumber || undefined,
      ifsc: bankValues.ifsc || undefined,
    });
  };

  // ── Derived ─────────────────────────────────────────────────────────────────
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
        <TabsList className="mb-4 gap-2 p-1.5">
          <TabsTrigger value="personal" className="flex items-center gap-2 px-4 py-2">
            <User size={14} />
            Personal
          </TabsTrigger>
          <TabsTrigger value="employment" className="flex items-center gap-2 px-4 py-2">
            <Briefcase size={14} />
            Employment
          </TabsTrigger>
          <TabsTrigger value="bank" className="flex items-center gap-2 px-4 py-2">
            <Landmark size={14} />
            Bank Information
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2 px-4 py-2">
            <FileText size={14} />
            Documents
          </TabsTrigger>
        </TabsList>

        {/* ── Personal Tab ── */}
        <TabsContent value="personal">
          <div className="hr-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
                Personal Information
              </h4>
              {!editingPersonal ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => setEditingPersonal(true)}
                >
                  <Pencil size={12} />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    onClick={() => {
                      setEditingPersonal(false);
                      setPersonalValues({
                        phone: emp?.phone ?? "",
                        nationality: emp?.nationality ?? "",
                        workLocation: emp?.workLocation ?? "",
                        emergencyContact: emp?.emergencyContact ?? "",
                      });
                    }}
                  >
                    <X size={12} />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    onClick={handleSavePersonal}
                    disabled={updatePersonalMutation.isPending}
                    style={{ background: "oklch(0.42 0.18 255)", color: "white" }}
                  >
                    {updatePersonalMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                    Save
                  </Button>
                </div>
              )}
            </div>

            {/* Full name is always read-only */}
            <InfoRow label="Full Name" value={fullName} />
            <InfoRow label="Employee Code" value={emp?.employeeCode} />
            <InfoRow label="Email" value={emp?.email} />

            <EditableRow
              label="Phone"
              value={emp?.phone}
              editing={editingPersonal}
              fieldKey="phone"
              editValues={personalValues}
              onChange={(k, v) => setPersonalValues((prev) => ({ ...prev, [k]: v }))}
            />
            <EditableRow
              label="Nationality"
              value={emp?.nationality}
              editing={editingPersonal}
              fieldKey="nationality"
              editValues={personalValues}
              onChange={(k, v) => setPersonalValues((prev) => ({ ...prev, [k]: v }))}
            />
            <EditableRow
              label="Work Location"
              value={emp?.workLocation}
              editing={editingPersonal}
              fieldKey="workLocation"
              editValues={personalValues}
              onChange={(k, v) => setPersonalValues((prev) => ({ ...prev, [k]: v }))}
            />
            <EditableRow
              label="Emergency Contact"
              value={emp?.emergencyContact}
              editing={editingPersonal}
              fieldKey="emergencyContact"
              editValues={personalValues}
              onChange={(k, v) => setPersonalValues((prev) => ({ ...prev, [k]: v }))}
            />

            {editingPersonal && (
              <p className="text-xs mt-3 pt-3 border-t" style={{ color: "oklch(0.65 0.012 65)", borderColor: "oklch(0.92 0.004 80)" }}>
                Full Name and Employee Code can only be changed by HR Admin.
              </p>
            )}
          </div>
        </TabsContent>

        {/* ── Employment Tab ── */}
        <TabsContent value="employment">
          <div className="hr-card p-5">
            <h4 className="text-sm font-semibold mb-3" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
              Employment Information
            </h4>
            <InfoRow label="Employment Type" value={emp?.employmentType} />
            <InfoRow label="Employee Role" value={(emp as any)?.employeeRole} />
            <InfoRow
              label="Start Date"
              value={emp?.startDate ? new Date(emp.startDate).toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" }) : undefined}
            />
            <InfoRow
              label="Contract End"
              value={emp?.contractEndDate ? new Date(emp.contractEndDate).toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" }) : "Permanent"}
            />
            <InfoRow label="Position" value={emp?.position} />
            <InfoRow label="Team / Org Unit" value={(emp as any)?.orgUnit?.name} />
            <InfoRow label="Work Location" value={emp?.workLocation} />
            <InfoRow label="Status" value={emp?.status} />
          </div>
        </TabsContent>

        {/* ── Bank Information Tab ── */}
        <TabsContent value="bank">
          {bankLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={22} className="animate-spin" style={{ color: "oklch(0.42 0.18 255)" }} />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Recipient Information */}
              <div className="hr-card p-5">
                <h4 className="text-sm font-semibold mb-4" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
                  Recipient Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <BankField label="Recipient Name" fieldKey="recipientName" values={bankValues} onChange={handleBankChange} />
                  <BankField label="Email" fieldKey="recipientEmail" values={bankValues} onChange={handleBankChange} />
                  <BankField label="Phone Number" fieldKey="recipientPhone" values={bankValues} onChange={handleBankChange} />
                  <div className="md:col-span-2">
                    <BankField label="Address" fieldKey="recipientAddress" values={bankValues} onChange={handleBankChange} />
                  </div>
                </div>
              </div>

              {/* Bank Information */}
              <div className="hr-card p-5">
                <h4 className="text-sm font-semibold mb-4" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
                  Bank Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <BankField label="Bank Name" fieldKey="bankName" values={bankValues} onChange={handleBankChange} />
                  <BankField label="SWIFT / BIC Code" fieldKey="swiftBic" values={bankValues} onChange={handleBankChange} />
                  <BankField label="Branch Name" fieldKey="branchName" values={bankValues} onChange={handleBankChange} />
                  <BankField label="Account Number" fieldKey="accountNumber" values={bankValues} onChange={handleBankChange} />
                  <BankField label="IFSC" fieldKey="ifsc" values={bankValues} onChange={handleBankChange} />
                  <div className="md:col-span-2">
                    <BankField label="Bank Address" fieldKey="bankAddress" values={bankValues} onChange={handleBankChange} />
                  </div>
                </div>
              </div>

              {/* Save button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveBank}
                  disabled={!bankDirty || upsertBankMutation.isPending}
                  className="gap-2"
                  style={{ background: "oklch(0.42 0.18 255)", color: "white" }}
                >
                  {upsertBankMutation.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                  Save Bank Information
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── Documents Tab ── */}
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
