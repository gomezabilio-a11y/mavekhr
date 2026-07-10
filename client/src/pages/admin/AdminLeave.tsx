/**
 * AdminLeave.tsx — Admin Leave Management
 * Manage leave types, balances, and all leave requests
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, X, Edit2, Trash2, CheckCircle2, XCircle, Clock, ChevronDown, Loader2, Users, Calendar, Settings } from "lucide-react";

const statusColors: Record<string, { bg: string; text: string }> = {
  pending:   { bg: "oklch(0.95 0.06 65)",  text: "oklch(0.52 0.16 65)" },
  approved:  { bg: "oklch(0.92 0.08 145)", text: "oklch(0.42 0.18 145)" },
  rejected:  { bg: "oklch(0.92 0.06 25)",  text: "oklch(0.42 0.15 25)" },
  cancelled: { bg: "oklch(0.92 0.004 80)", text: "oklch(0.55 0.012 65)" },
};

type Tab = "requests" | "types" | "balances";

export default function AdminLeave() {
  const utils = trpc.useUtils();
  const [tab, setTab] = useState<Tab>("requests");
  const [filterStatus, setFilterStatus] = useState("all");
  const [approveModal, setApproveModal] = useState<{ id: number; name: string; approved: boolean } | null>(null);
  const [approveComment, setApproveComment] = useState("");

  // Leave Types
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [editingType, setEditingType] = useState<any | null>(null);
  const [typeForm, setTypeForm] = useState({ name: "", description: "", defaultDays: "0", isActive: true });

  // Balances
  const [selectedEmpId, setSelectedEmpId] = useState<string>("");
  const [balYear, setBalYear] = useState(String(new Date().getFullYear()));
  const [balForm, setBalForm] = useState({ leaveTypeId: "", totalDays: "" });

  const { data: leaveTypes = [], isLoading: typesLoading } = trpc.leave.listTypes.useQuery();
  const { data: allRequests = [], isLoading: reqLoading } = trpc.leave.allRequests.useQuery();
  const { data: employees = [] } = trpc.employee.list.useQuery();
  const { data: balances = [], isLoading: balLoading } = trpc.leave.getBalances.useQuery(
    { employeeId: parseInt(selectedEmpId), year: parseInt(balYear) },
    { enabled: !!selectedEmpId }
  );

  const createTypeMutation = trpc.leave.createType.useMutation({
    onSuccess: () => { utils.leave.listTypes.invalidate(); setShowTypeForm(false); resetTypeForm(); toast.success("Leave type created"); },
    onError: (e) => toast.error(e.message),
  });
  const updateTypeMutation = trpc.leave.updateType.useMutation({
    onSuccess: () => { utils.leave.listTypes.invalidate(); setEditingType(null); resetTypeForm(); toast.success("Leave type updated"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteTypeMutation = trpc.leave.deleteType.useMutation({
    onSuccess: () => { utils.leave.listTypes.invalidate(); toast.success("Leave type deleted"); },
    onError: (e) => toast.error(e.message),
  });
  const approveMutation = trpc.leave.adminApprove.useMutation({
    onSuccess: () => {
      utils.leave.allRequests.invalidate();
      setApproveModal(null);
      setApproveComment("");
      toast.success(approveModal?.approved ? "Request approved" : "Request rejected");
    },
    onError: (e) => toast.error(e.message),
  });
  const setBalanceMutation = trpc.leave.setBalance.useMutation({
    onSuccess: () => {
      utils.leave.getBalances.invalidate();
      setBalForm({ leaveTypeId: "", totalDays: "" });
      toast.success("Balance updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const resetTypeForm = () => setTypeForm({ name: "", description: "", defaultDays: "0", isActive: true });

  const handleTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { name: typeForm.name, description: typeForm.description || undefined, defaultDays: parseInt(typeForm.defaultDays) || 0, isActive: typeForm.isActive };
    if (editingType) {
      updateTypeMutation.mutate({ id: editingType.id, ...data });
    } else {
      createTypeMutation.mutate(data);
    }
  };

  const handleEditType = (t: any) => {
    setEditingType(t);
    setTypeForm({ name: t.name, description: t.description ?? "", defaultDays: String(t.defaultDays ?? 0), isActive: t.isActive ?? true });
    setShowTypeForm(true);
  };

  const handleSetBalance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId || !balForm.leaveTypeId || !balForm.totalDays) { toast.error("Fill all fields"); return; }
    setBalanceMutation.mutate({ employeeId: parseInt(selectedEmpId), leaveTypeId: parseInt(balForm.leaveTypeId), year: parseInt(balYear), totalDays: parseInt(balForm.totalDays) });
  };

  const filteredRequests = (allRequests as any[]).filter(r => filterStatus === "all" || r.status === filterStatus);

  const inputStyle = { border: "1px solid oklch(0.88 0.006 80)", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", color: "oklch(0.22 0.012 65)", background: "white", width: "100%", outline: "none" };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "requests", label: "All Requests", icon: <Calendar size={14} /> },
    { id: "types",    label: "Leave Types",  icon: <Settings size={14} /> },
    { id: "balances", label: "Balances",     icon: <Users size={14} /> },
  ];

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold mb-1" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>Leave Management</h2>
        <p className="text-sm" style={{ color: "oklch(0.55 0.012 65)" }}>Manage leave types, balances, and requests</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: "oklch(0.92 0.004 80)" }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={tab === t.id
              ? { background: "white", color: "oklch(0.22 0.012 65)", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
              : { color: "oklch(0.55 0.012 65)" }}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── All Requests Tab ── */}
      {tab === "requests" && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium" style={{ color: "oklch(0.55 0.012 65)" }}>Filter:</span>
            {["all", "pending", "approved", "rejected", "cancelled"].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
                style={filterStatus === s
                  ? { background: "oklch(0.42 0.18 255)", color: "white" }
                  : { background: "oklch(0.95 0.004 80)", color: "oklch(0.55 0.012 65)" }}
              >{s}</button>
            ))}
            <span className="ml-auto text-xs" style={{ color: "oklch(0.65 0.012 65)" }}>{filteredRequests.length} records</span>
          </div>

          {reqLoading ? (
            <div className="flex justify-center py-8"><Loader2 size={22} className="animate-spin" style={{ color: "oklch(0.42 0.18 255)" }} /></div>
          ) : filteredRequests.length === 0 ? (
            <div className="hr-card p-8 text-center">
              <Calendar size={32} className="mx-auto mb-3" style={{ color: "oklch(0.82 0.006 80)" }} />
              <p className="text-sm" style={{ color: "oklch(0.65 0.012 65)" }}>No leave requests found.</p>
            </div>
          ) : (
            <div className="hr-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "oklch(0.97 0.004 80)", borderBottom: "1px solid oklch(0.90 0.006 80)" }}>
                    {["Employee", "Type", "Period", "Days", "Reason", "Status", "Actions"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "oklch(0.55 0.012 65)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((req: any) => {
                    const sc = statusColors[req.status] ?? statusColors.pending;
                    return (
                      <tr key={req.id} className="border-b last:border-b-0 hover:bg-gray-50/50" style={{ borderColor: "oklch(0.92 0.004 80)" }}>
                        <td className="px-4 py-3">
                          <p className="text-xs font-semibold" style={{ color: "oklch(0.22 0.012 65)" }}>{req.employeeFirstName} {req.employeeLastName}</p>
                          <p className="text-xs" style={{ color: "oklch(0.65 0.012 65)" }}>{req.employeePosition}</p>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: "oklch(0.35 0.012 65)" }}>{req.leaveTypeName ?? "—"}</td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "oklch(0.45 0.012 65)" }}>
                          {new Date(req.startDate).toLocaleDateString("en-SG", { day: "numeric", month: "short" })}
                          {" – "}
                          {new Date(req.endDate).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold" style={{ color: "oklch(0.22 0.012 65)" }}>{req.totalDays}</td>
                        <td className="px-4 py-3 text-xs max-w-[140px] truncate" style={{ color: "oklch(0.55 0.012 65)" }}>{req.reason || "—"}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize" style={{ background: sc.bg, color: sc.text }}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {req.status === "pending" && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => { setApproveModal({ id: req.id, name: `${req.employeeFirstName} ${req.employeeLastName}`, approved: true }); setApproveComment(""); }}
                                className="p-1.5 rounded-lg transition-colors hover:bg-green-50"
                                title="Approve"
                              ><CheckCircle2 size={14} style={{ color: "oklch(0.42 0.18 145)" }} /></button>
                              <button
                                onClick={() => { setApproveModal({ id: req.id, name: `${req.employeeFirstName} ${req.employeeLastName}`, approved: false }); setApproveComment(""); }}
                                className="p-1.5 rounded-lg transition-colors hover:bg-red-50"
                                title="Reject"
                              ><XCircle size={14} style={{ color: "oklch(0.52 0.18 25)" }} /></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Leave Types Tab ── */}
      {tab === "types" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => { setEditingType(null); resetTypeForm(); setShowTypeForm(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
              style={{ background: "oklch(0.42 0.18 255)" }}
            ><Plus size={14} />Add Leave Type</button>
          </div>

          {typesLoading ? (
            <div className="flex justify-center py-8"><Loader2 size={22} className="animate-spin" style={{ color: "oklch(0.42 0.18 255)" }} /></div>
          ) : (
            <div className="grid gap-3">
              {(leaveTypes as any[]).map((t) => (
                <div key={t.id} className="hr-card p-4 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm" style={{ color: "oklch(0.22 0.012 65)" }}>{t.name}</p>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={t.isActive ? { background: "oklch(0.92 0.08 145)", color: "oklch(0.42 0.18 145)" } : { background: "oklch(0.92 0.004 80)", color: "oklch(0.55 0.012 65)" }}>
                        {t.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    {t.description && <p className="text-xs mt-0.5" style={{ color: "oklch(0.55 0.012 65)" }}>{t.description}</p>}
                    <p className="text-xs mt-1" style={{ color: "oklch(0.65 0.012 65)" }}>Default: <strong>{t.defaultDays}</strong> days/year</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditType(t)} className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors"><Edit2 size={14} style={{ color: "oklch(0.42 0.18 255)" }} /></button>
                    <button onClick={() => { if (confirm(`Delete "${t.name}"?`)) deleteTypeMutation.mutate({ id: t.id }); }} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"><Trash2 size={14} style={{ color: "oklch(0.52 0.18 25)" }} /></button>
                  </div>
                </div>
              ))}
              {(leaveTypes as any[]).length === 0 && (
                <div className="hr-card p-8 text-center">
                  <Settings size={32} className="mx-auto mb-3" style={{ color: "oklch(0.82 0.006 80)" }} />
                  <p className="text-sm" style={{ color: "oklch(0.65 0.012 65)" }}>No leave types yet. Add one to get started.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Balances Tab ── */}
      {tab === "balances" && (
        <div className="space-y-4">
          <div className="hr-card p-5">
            <h3 className="text-sm font-semibold mb-4" style={{ color: "oklch(0.35 0.012 65)" }}>Set / Update Leave Balance</h3>
            <form onSubmit={handleSetBalance} className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Employee *</label>
                <div className="relative">
                  <select value={selectedEmpId} onChange={e => setSelectedEmpId(e.target.value)} style={{ ...inputStyle, appearance: "none", paddingRight: "32px" }} required>
                    <option value="">Select employee...</option>
                    {(employees as any[]).map(e => (
                      <option key={e.id} value={String(e.id)}>{e.firstName} {e.lastName}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "oklch(0.55 0.012 65)" }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Leave Type *</label>
                <div className="relative">
                  <select value={balForm.leaveTypeId} onChange={e => setBalForm(f => ({ ...f, leaveTypeId: e.target.value }))} style={{ ...inputStyle, appearance: "none", paddingRight: "32px" }} required>
                    <option value="">Select type...</option>
                    {(leaveTypes as any[]).map(t => (
                      <option key={t.id} value={String(t.id)}>{t.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "oklch(0.55 0.012 65)" }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Year *</label>
                <input type="number" value={balYear} onChange={e => setBalYear(e.target.value)} min="2020" max="2030" style={inputStyle} required />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Total Days *</label>
                <input type="number" value={balForm.totalDays} onChange={e => setBalForm(f => ({ ...f, totalDays: e.target.value }))} min="0" max="365" style={inputStyle} required />
              </div>
              <div className="col-span-2 md:col-span-4 flex justify-end">
                <button type="submit" disabled={setBalanceMutation.isPending} className="px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90" style={{ background: "oklch(0.42 0.18 255)" }}>
                  {setBalanceMutation.isPending ? "Saving..." : "Save Balance"}
                </button>
              </div>
            </form>
          </div>

          {selectedEmpId && (
            <div>
              <h3 className="text-sm font-semibold mb-3" style={{ color: "oklch(0.35 0.012 65)" }}>
                Current Balances — {(employees as any[]).find(e => String(e.id) === selectedEmpId)?.firstName} {(employees as any[]).find(e => String(e.id) === selectedEmpId)?.lastName} ({balYear})
              </h3>
              {balLoading ? (
                <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin" style={{ color: "oklch(0.42 0.18 255)" }} /></div>
              ) : (balances as any[]).length === 0 ? (
                <p className="text-sm" style={{ color: "oklch(0.65 0.012 65)" }}>No balances set for this employee in {balYear}.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {(balances as any[]).map((b) => (
                    <div key={b.id} className="hr-card p-4">
                      <p className="text-xs font-semibold mb-1" style={{ color: "oklch(0.35 0.012 65)" }}>{b.leaveTypeName}</p>
                      <p className="text-lg font-bold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
                        {b.totalDays - b.usedDays} <span className="text-xs font-normal" style={{ color: "oklch(0.65 0.012 65)" }}>/ {b.totalDays} remaining</span>
                      </p>
                      <p className="text-xs mt-1" style={{ color: "oklch(0.72 0.006 80)" }}>{b.usedDays} days used</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Leave Type Form Modal */}
      {showTypeForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "oklch(0.90 0.006 80)" }}>
              <h3 className="font-semibold" style={{ color: "oklch(0.22 0.012 65)" }}>{editingType ? "Edit Leave Type" : "New Leave Type"}</h3>
              <button onClick={() => { setShowTypeForm(false); setEditingType(null); resetTypeForm(); }}><X size={18} style={{ color: "oklch(0.55 0.012 65)" }} /></button>
            </div>
            <form onSubmit={handleTypeSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Name *</label>
                <input required value={typeForm.name} onChange={e => setTypeForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Annual Leave" style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Description</label>
                <textarea value={typeForm.description} onChange={e => setTypeForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Brief description..." style={{ ...inputStyle, resize: "none" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Default Days / Year</label>
                <input type="number" min="0" value={typeForm.defaultDays} onChange={e => setTypeForm(f => ({ ...f, defaultDays: e.target.value }))} style={inputStyle} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={typeForm.isActive} onChange={e => setTypeForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 rounded" />
                <label htmlFor="isActive" className="text-sm" style={{ color: "oklch(0.35 0.012 65)" }}>Active (visible to employees)</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowTypeForm(false); setEditingType(null); resetTypeForm(); }} className="flex-1 py-2.5 rounded-lg text-sm font-medium" style={{ border: "1px solid oklch(0.88 0.006 80)", color: "oklch(0.45 0.012 65)" }}>Cancel</button>
                <button type="submit" disabled={createTypeMutation.isPending || updateTypeMutation.isPending} className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white hover:opacity-90" style={{ background: "oklch(0.42 0.18 255)" }}>
                  {(createTypeMutation.isPending || updateTypeMutation.isPending) ? "Saving..." : editingType ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approve/Reject Modal */}
      {approveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-semibold mb-1" style={{ color: "oklch(0.22 0.012 65)" }}>{approveModal.approved ? "Approve" : "Reject"} Leave Request</h3>
            <p className="text-sm mb-4" style={{ color: "oklch(0.55 0.012 65)" }}>
              {approveModal.approved ? "Approve" : "Reject"} leave request from <strong>{approveModal.name}</strong>?
            </p>
            <div className="mb-4">
              <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Comment {approveModal.approved ? "(optional)" : "*"}</label>
              <textarea value={approveComment} onChange={e => setApproveComment(e.target.value)} rows={3} placeholder={approveModal.approved ? "Optional note..." : "Reason for rejection..."} style={{ border: "1px solid oklch(0.88 0.006 80)", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", color: "oklch(0.22 0.012 65)", background: "white", width: "100%", outline: "none", resize: "none" }} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setApproveModal(null)} className="flex-1 py-2.5 rounded-lg text-sm font-medium" style={{ border: "1px solid oklch(0.88 0.006 80)", color: "oklch(0.45 0.012 65)" }}>Cancel</button>
              <button
                onClick={() => approveMutation.mutate({ id: approveModal.id, approved: approveModal.approved, comment: approveComment || undefined })}
                disabled={approveMutation.isPending || (!approveModal.approved && !approveComment)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                style={{ background: approveModal.approved ? "oklch(0.42 0.18 145)" : "oklch(0.52 0.18 25)" }}
              >
                {approveMutation.isPending ? "Processing..." : approveModal.approved ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
