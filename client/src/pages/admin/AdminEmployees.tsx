import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Search, Edit2, Trash2, X, Users, Upload, Camera, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import AdminEmployeeDocuments from "./AdminEmployeeDocuments";

type EmployeeForm = {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationality: string;
  position: string;
  employmentType: "full-time" | "part-time" | "contract" | "intern";
  employeeRole: "regular" | "contractor";
  workLocation: string;
  startDate: string;
  contractEndDate: string;
  status: "active" | "inactive" | "terminated";
  orgUnitId: string;
  managerId: string;
  isManager: boolean;
  photoUrl: string;
  emergencyContact: string;
  password: string;
};

// Normalize any date value to YYYY-MM-DD string for <input type="date">
function toDateInput(val: unknown): string {
  if (!val) return "";
  const d = new Date(val as string | number | Date);
  if (isNaN(d.getTime())) return String(val);
  return d.toISOString().slice(0, 10);
}

const emptyForm: EmployeeForm = {
  employeeCode: "", firstName: "", lastName: "", email: "",
  phone: "", nationality: "", position: "",
  employmentType: "full-time", employeeRole: "regular", workLocation: "", startDate: "",
  contractEndDate: "", status: "active", orgUnitId: "", managerId: "",
  isManager: false, photoUrl: "", emergencyContact: "", password: "",
};

function ResetPasswordSection({ employeeId, employees }: { employeeId: number; employees: any[] }) {
  const [newPw, setNewPw] = useState("");
  const [show, setShow] = useState(false);
  const resetMutation = trpc.auth.setPassword.useMutation({
    onSuccess: () => { setNewPw(""); setShow(false); toast.success("Password reset successfully"); },
    onError: (e) => toast.error(e.message),
  });
  const emp = employees.find(e => e.id === employeeId);
  if (!emp?.userId) return (
    <p className="text-xs" style={{ color: "oklch(0.72 0.006 80)" }}>No user account linked to this employee.</p>
  );
  return (
    <div>
      <button type="button" onClick={() => setShow(s => !s)}
        className="text-xs underline" style={{ color: "oklch(0.42 0.18 255)" }}>
        {show ? "Cancel password reset" : "Reset password"}
      </button>
      {show && (
        <div className="mt-2 flex gap-2">
          <input
            type="password"
            value={newPw}
            onChange={e => setNewPw(e.target.value)}
            placeholder="New password (min. 8 chars)"
            minLength={8}
            className="flex-1 px-3 py-2 rounded-lg border text-xs"
            style={{ borderColor: "oklch(0.88 0.006 80)", background: "oklch(0.97 0.006 80)" }}
          />
          <button type="button"
            disabled={newPw.length < 8 || resetMutation.isPending}
            onClick={() => resetMutation.mutate({ userId: emp.userId!, newPassword: newPw })}
            className="px-3 py-2 rounded-lg text-xs font-medium text-white disabled:opacity-50"
            style={{ background: "oklch(0.42 0.18 255)" }}>
            {resetMutation.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminEmployees() {
  const [location] = useLocation();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<EmployeeForm>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [docEmployee, setDocEmployee] = useState<{ id: number; firstName: string; lastName: string } | null>(null);

  const utils = trpc.useUtils();
  const { data: employees = [], isLoading } = trpc.employee.list.useQuery();
  const { data: orgUnits = [] } = trpc.orgUnit.list.useQuery();

  const createMutation = trpc.employee.create.useMutation({
    onSuccess: () => { utils.employee.list.invalidate(); setShowForm(false); setForm(emptyForm); toast.success("Employee created"); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.employee.update.useMutation({
    onSuccess: () => { utils.employee.list.invalidate(); setShowForm(false); setEditId(null); setForm(emptyForm); toast.success("Employee updated"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.employee.delete.useMutation({
    onSuccess: () => { utils.employee.list.invalidate(); setDeleteConfirm(null); toast.success("Employee deleted"); },
    onError: (e) => toast.error(e.message),
  });

  // Auto-open form if ?action=new
  useEffect(() => {
    if (location.includes("action=new")) setShowForm(true);
  }, [location]);

  const filtered = employees.filter(e => {
    const q = search.toLowerCase();
    return !q || `${e.firstName} ${e.lastName} ${e.email} ${e.employeeCode} ${e.position}`.toLowerCase().includes(q);
  });

  function handleEdit(emp: typeof employees[0]) {
    setEditId(emp.id);
    setForm({
      employeeCode: emp.employeeCode,
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      phone: emp.phone ?? "",
      nationality: emp.nationality ?? "",
      position: emp.position,
      employmentType: emp.employmentType,
      workLocation: emp.workLocation ?? "",
      startDate: emp.startDate ? toDateInput(emp.startDate) : "",
      contractEndDate: emp.contractEndDate ? toDateInput(emp.contractEndDate) : "",
      status: emp.status,
      orgUnitId: emp.orgUnitId?.toString() ?? "",
      managerId: emp.managerId?.toString() ?? "",
      isManager: emp.isManager,
      employeeRole: (emp as any).employeeRole ?? "regular",
      photoUrl: emp.photoUrl ?? "",
      emergencyContact: emp.emergencyContact ?? "",
      password: "", // don't pre-fill password on edit
    });
    setPhotoPreview("");
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const rawManagerId = form.managerId ? parseInt(form.managerId, 10) : undefined;
    const managerId = rawManagerId && !isNaN(rawManagerId) ? rawManagerId : undefined;
    const rawOrgUnitId = form.orgUnitId ? parseInt(form.orgUnitId, 10) : undefined;
    const orgUnitId = rawOrgUnitId && !isNaN(rawOrgUnitId) ? rawOrgUnitId : undefined;
    const contractEndDate = form.contractEndDate && form.contractEndDate.trim() !== ""
      ? toDateInput(form.contractEndDate)
      : undefined;
    const { password, ...formWithoutPassword } = form;
    const payload = {
      ...formWithoutPassword,
      startDate: toDateInput(form.startDate),
      contractEndDate,
      orgUnitId,
      managerId,
    };
    if (editId) {
      updateMutation.mutate({ id: editId, ...payload });
    } else {
      createMutation.mutate({ ...payload, password: password || undefined } as any);
    }
  }

  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setPhotoUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const dataUrl = ev.target?.result as string;
        const base64 = dataUrl.split(",")[1];
        const resp = await fetch("/api/upload/photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64, mimeType: file.type, fileName: file.name }),
          credentials: "include",
        });
        if (!resp.ok) throw new Error(await resp.text());
        const { url } = await resp.json() as { url: string };
        setForm(f => ({ ...f, photoUrl: url }));
        setPhotoPreview(dataUrl);
        toast.success("Photo uploaded");
        setPhotoUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
      setPhotoUploading(false);
    }
  }

  const inputCls = "w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 transition-all";
  const inputStyle = { borderColor: "oklch(0.88 0.006 80)", background: "white", color: "oklch(0.22 0.012 65)" };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
            Employees
          </h2>
          <p className="text-sm" style={{ color: "oklch(0.55 0.012 65)" }}>{employees.length} total employees</p>
        </div>
        <button
          onClick={() => { setEditId(null); setForm(emptyForm); setPhotoPreview(""); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: "oklch(0.42 0.18 255)" }}
        >
          <Plus size={14} /> Add Employee
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "oklch(0.65 0.012 65)" }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, code, position..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
          style={{ borderColor: "oklch(0.88 0.006 80)", background: "white", color: "oklch(0.22 0.012 65)" }}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "oklch(0.90 0.006 80)" }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "oklch(0.62 0.18 255)" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users size={32} className="mx-auto mb-2" style={{ color: "oklch(0.82 0.006 80)" }} />
            <p className="text-sm" style={{ color: "oklch(0.65 0.012 65)" }}>
              {search ? "No employees match your search." : "No employees yet. Add your first employee."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "oklch(0.97 0.006 80)", borderBottom: "1px solid oklch(0.90 0.006 80)" }}>
                  {["Code", "Name", "Position", "Team", "Employment", "Status", "Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "oklch(0.55 0.012 65)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(emp => {
                  const orgUnit = orgUnits.find(u => u.id === emp.orgUnitId);
                  return (
                    <tr key={emp.id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors" style={{ borderColor: "oklch(0.94 0.006 80)" }}>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: "oklch(0.55 0.012 65)" }}>{emp.employeeCode}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ background: "oklch(0.52 0.18 255)" }}>
                            {emp.firstName[0]}{emp.lastName[0]}
                          </div>
                          <div>
                            <p className="font-medium" style={{ color: "oklch(0.22 0.012 65)" }}>{emp.firstName} {emp.lastName}</p>
                            <p className="text-xs" style={{ color: "oklch(0.65 0.012 65)" }}>{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3" style={{ color: "oklch(0.35 0.012 65)" }}>{emp.position}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "oklch(0.55 0.012 65)" }}>{orgUnit?.name ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "oklch(0.94 0.006 80)", color: "oklch(0.45 0.012 65)" }}>
                          {emp.employmentType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{
                          background: emp.status === "active" ? "oklch(0.92 0.08 145)" : emp.status === "terminated" ? "oklch(0.92 0.06 25)" : "oklch(0.92 0.04 65)",
                          color: emp.status === "active" ? "oklch(0.42 0.18 145)" : emp.status === "terminated" ? "oklch(0.42 0.15 25)" : "oklch(0.52 0.12 65)",
                        }}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleEdit(emp)} className="p-1.5 rounded hover:bg-blue-50 transition-colors" title="Edit">
                            <Edit2 size={13} style={{ color: "oklch(0.42 0.18 255)" }} />
                          </button>
                          <button onClick={() => setDocEmployee({ id: emp.id, firstName: emp.firstName, lastName: emp.lastName })} className="p-1.5 rounded hover:bg-green-50 transition-colors" title="Documents">
                            <FileText size={13} style={{ color: "oklch(0.42 0.18 145)" }} />
                          </button>
                          <button onClick={() => setDeleteConfirm(emp.id)} className="p-1.5 rounded hover:bg-red-50 transition-colors" title="Delete">
                            <Trash2 size={13} style={{ color: "oklch(0.52 0.18 25)" }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "oklch(0.90 0.006 80)" }}>
              <h3 className="font-semibold" style={{ color: "oklch(0.22 0.012 65)" }}>
                {editId ? "Edit Employee" : "Add Employee"}
              </h3>
              <button onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }}>
                <X size={18} style={{ color: "oklch(0.55 0.012 65)" }} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Employee Code *</label>
                  <input required value={form.employeeCode} onChange={e => setForm(f => ({ ...f, employeeCode: e.target.value }))}
                    placeholder="EMP-0001" className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}
                    className={inputCls} style={inputStyle}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>First Name *</label>
                  <input required value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                    placeholder="John" className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Last Name *</label>
                  <input required value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                    placeholder="Doe" className={inputCls} style={inputStyle} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Email *</label>
                  <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="john.doe@company.com" className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Phone</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+65 9123 4567" className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Nationality</label>
                  <input value={form.nationality} onChange={e => setForm(f => ({ ...f, nationality: e.target.value }))}
                    placeholder="Singaporean" className={inputCls} style={inputStyle} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Position *</label>
                  <input required value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
                    placeholder="Senior Consultant" className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Employment Type</label>
                  <select value={form.employmentType} onChange={e => setForm(f => ({ ...f, employmentType: e.target.value as any }))}
                    className={inputCls} style={inputStyle}>
                    <option value="full-time">Full-Time</option>
                    <option value="part-time">Part-Time</option>
                    <option value="contract">Contract</option>
                    <option value="intern">Intern</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Employee Role</label>
                  <select value={form.employeeRole} onChange={e => setForm(f => ({ ...f, employeeRole: e.target.value as any }))}
                    className={inputCls} style={inputStyle}>
                    <option value="regular">Regular Employee</option>
                    <option value="contractor">Contractor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Work Location</label>
                  <input value={form.workLocation} onChange={e => setForm(f => ({ ...f, workLocation: e.target.value }))}
                    placeholder="Singapore HQ" className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Start Date *</label>
                  <input required type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Contract End Date</label>
                  <input type="date" value={form.contractEndDate} onChange={e => setForm(f => ({ ...f, contractEndDate: e.target.value }))}
                    className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Team / Org Unit</label>
                  <select value={form.orgUnitId} onChange={e => setForm(f => ({ ...f, orgUnitId: e.target.value }))}
                    className={inputCls} style={inputStyle}>
                    <option value="">— None —</option>
                    {orgUnits.map(u => (
                      <option key={u.id} value={String(u.id)}>{u.name} ({u.type})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Manager</label>
                  <select value={form.managerId} onChange={e => setForm(f => ({ ...f, managerId: e.target.value }))}
                    className={inputCls} style={inputStyle}>
                    <option value="">— None —</option>
                    {employees
                      .filter(e => e.id !== (editId ?? -1) && e.status === "active")
                      .map(e => (
                        <option key={e.id} value={String(e.id)}>
                          {e.firstName} {e.lastName}{e.isManager ? " ★" : ""}
                        </option>
                      ))}
                  </select>
                  <p className="text-xs mt-1" style={{ color: "oklch(0.72 0.006 80)" }}>★ = marked as manager</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Profile Photo</label>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-full flex-shrink-0 overflow-hidden border flex items-center justify-center"
                      style={{ borderColor: "oklch(0.88 0.006 80)", background: "oklch(0.95 0.006 80)" }}>
                      {(photoPreview || form.photoUrl) ? (
                        <img src={photoPreview || form.photoUrl} alt="preview" className="w-full h-full object-cover" />
                      ) : (
                        <Camera size={20} style={{ color: "oklch(0.72 0.006 80)" }} />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
                      <button type="button" disabled={photoUploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium disabled:opacity-50"
                        style={{ borderColor: "oklch(0.88 0.006 80)", color: "oklch(0.42 0.18 255)" }}>
                        <Upload size={12} />
                        {photoUploading ? "Uploading..." : "Upload Photo"}
                      </button>
                      <input value={form.photoUrl} onChange={e => { setForm(f => ({ ...f, photoUrl: e.target.value })); setPhotoPreview(""); }}
                        placeholder="Or paste image URL..." className={inputCls} style={{ ...inputStyle, fontSize: "11px" }} />
                    </div>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Emergency Contact</label>
                  <input value={form.emergencyContact} onChange={e => setForm(f => ({ ...f, emergencyContact: e.target.value }))}
                    placeholder="Jane Doe (+65 9876 5432)" className={inputCls} style={inputStyle} />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <input type="checkbox" id="isManager" checked={form.isManager}
                    onChange={e => setForm(f => ({ ...f, isManager: e.target.checked }))} />
                  <label htmlFor="isManager" className="text-xs" style={{ color: "oklch(0.45 0.012 65)" }}>
                    This employee is a manager
                  </label>
                </div>
                {/* Password field — only shown when creating a new employee */}
                {!editId && (
                  <div className="col-span-2">
                    <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>
                      Initial Password
                      <span className="ml-1 font-normal" style={{ color: "oklch(0.72 0.006 80)" }}>(min. 8 characters — share with employee)</span>
                    </label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="Set a temporary password"
                      minLength={8}
                      className={inputCls}
                      style={inputStyle}
                    />
                  </div>
                )}
                {/* Reset password button — only shown when editing */}
                {editId && (
                  <div className="col-span-2">
                    <ResetPasswordSection employeeId={editId} employees={employees} />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }}
                  className="flex-1 py-2.5 rounded-lg text-sm border" style={{ borderColor: "oklch(0.88 0.006 80)", color: "oklch(0.45 0.012 65)" }}>
                  Cancel
                </button>
                <button type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                  style={{ background: "oklch(0.42 0.18 255)" }}>
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : editId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
            <Trash2 size={32} className="mx-auto mb-3" style={{ color: "oklch(0.52 0.18 25)" }} />
            <p className="font-semibold mb-1" style={{ color: "oklch(0.22 0.012 65)" }}>Delete Employee?</p>
            <p className="text-sm mb-4" style={{ color: "oklch(0.55 0.012 65)" }}>This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 rounded-lg text-sm border" style={{ borderColor: "oklch(0.88 0.006 80)" }}>
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate({ id: deleteConfirm })}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-white"
                style={{ background: "oklch(0.52 0.18 25)" }}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Documents Modal */}
      {docEmployee && (
        <AdminEmployeeDocuments
          employee={docEmployee}
          onClose={() => setDocEmployee(null)}
        />
      )}
    </div>
  );
}
