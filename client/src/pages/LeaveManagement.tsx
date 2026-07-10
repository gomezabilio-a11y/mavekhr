/**
 * LeaveManagement.tsx — Employee Leave Portal
 * Design: Warm Slate
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, X, Calendar, CheckCircle2, Clock, XCircle, AlertCircle, Loader2, ChevronDown } from "lucide-react";

const statusColors: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  pending:   { bg: "oklch(0.95 0.06 65)",  text: "oklch(0.52 0.16 65)",  icon: <Clock size={12} /> },
  approved:  { bg: "oklch(0.92 0.08 145)", text: "oklch(0.42 0.18 145)", icon: <CheckCircle2 size={12} /> },
  rejected:  { bg: "oklch(0.92 0.06 25)",  text: "oklch(0.42 0.15 25)",  icon: <XCircle size={12} /> },
  cancelled: { bg: "oklch(0.92 0.004 80)", text: "oklch(0.55 0.012 65)", icon: <XCircle size={12} /> },
};

function calcWorkdays(start: string, end: string): number {
  if (!start || !end) return 0;
  let count = 0;
  const cur = new Date(start);
  const last = new Date(end);
  while (cur <= last) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

export default function LeaveManagement() {
  const utils = trpc.useUtils();
  const { data: leaveTypes = [] } = trpc.leave.listTypes.useQuery();
  const { data: balances = [], isLoading: balLoading } = trpc.leave.myBalances.useQuery({});
  const { data: requests = [], isLoading: reqLoading } = trpc.leave.myRequests.useQuery();
  const { data: pendingApprovals = [] } = trpc.leave.pendingForMe.useQuery();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ leaveTypeId: "", startDate: "", endDate: "", reason: "" });
  const [approveModal, setApproveModal] = useState<{ id: number; name: string; approved: boolean } | null>(null);
  const [approveComment, setApproveComment] = useState("");

  const submitMutation = trpc.leave.submit.useMutation({
    onSuccess: () => {
      utils.leave.myRequests.invalidate();
      utils.leave.myBalances.invalidate();
      setShowForm(false);
      setForm({ leaveTypeId: "", startDate: "", endDate: "", reason: "" });
      toast.success("Leave request submitted successfully");
    },
    onError: (e) => toast.error(e.message),
  });

  const cancelMutation = trpc.leave.cancel.useMutation({
    onSuccess: () => { utils.leave.myRequests.invalidate(); utils.leave.myBalances.invalidate(); toast.success("Request cancelled"); },
    onError: (e) => toast.error(e.message),
  });

  const approveMutation = trpc.leave.approve.useMutation({
    onSuccess: () => {
      utils.leave.pendingForMe.invalidate();
      setApproveModal(null);
      setApproveComment("");
      toast.success(approveModal?.approved ? "Request approved" : "Request rejected");
    },
    onError: (e) => toast.error(e.message),
  });

  const totalDays = useMemo(() => calcWorkdays(form.startDate, form.endDate), [form.startDate, form.endDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.leaveTypeId || !form.startDate || !form.endDate) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (totalDays <= 0) {
      toast.error("End date must be after start date");
      return;
    }
    submitMutation.mutate({
      leaveTypeId: parseInt(form.leaveTypeId),
      startDate: form.startDate,
      endDate: form.endDate,
      totalDays,
      reason: form.reason || undefined,
    });
  };

  const inputStyle = { border: "1px solid oklch(0.88 0.006 80)", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", color: "oklch(0.22 0.012 65)", background: "white", width: "100%", outline: "none" };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold mb-1" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
            Leave Management
          </h2>
          <p className="text-sm" style={{ color: "oklch(0.55 0.012 65)" }}>
            Request and track your leave
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: "oklch(0.42 0.18 255)" }}
        >
          <Plus size={15} />
          New Request
        </button>
      </div>

      {/* Leave Balances */}
      <div>
        <h3 className="text-sm font-semibold mb-3" style={{ color: "oklch(0.35 0.012 65)" }}>
          Leave Balances — {new Date().getFullYear()}
        </h3>
        {balLoading ? (
          <div className="flex justify-center py-6"><Loader2 size={22} className="animate-spin" style={{ color: "oklch(0.42 0.18 255)" }} /></div>
        ) : balances.length === 0 ? (
          <div className="hr-card p-5 text-center">
            <AlertCircle size={24} className="mx-auto mb-2" style={{ color: "oklch(0.72 0.006 80)" }} />
            <p className="text-sm" style={{ color: "oklch(0.65 0.012 65)" }}>No leave balances set up yet.</p>
            <p className="text-xs mt-1" style={{ color: "oklch(0.72 0.006 80)" }}>Contact HR to set up your leave entitlements.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {(balances as any[]).map((bal) => {
              const remaining = bal.totalDays - bal.usedDays;
              const pct = bal.totalDays > 0 ? (bal.usedDays / bal.totalDays) * 100 : 0;
              return (
                <div key={bal.id} className="hr-card p-4">
                  <p className="text-xs font-semibold mb-1 truncate" style={{ color: "oklch(0.35 0.012 65)" }}>{bal.leaveTypeName}</p>
                  <div className="flex items-end gap-1 mb-2">
                    <span className="text-2xl font-bold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>{remaining}</span>
                    <span className="text-xs mb-1" style={{ color: "oklch(0.65 0.012 65)" }}>/ {bal.totalDays} days left</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "oklch(0.92 0.004 80)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: pct > 80 ? "oklch(0.52 0.18 25)" : "oklch(0.42 0.18 255)" }} />
                  </div>
                  <p className="text-xs mt-1" style={{ color: "oklch(0.72 0.006 80)" }}>{bal.usedDays} used</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending Approvals (for managers) */}
      {pendingApprovals.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "oklch(0.35 0.012 65)" }}>
            <span className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-white" style={{ background: "oklch(0.52 0.18 25)" }}>{pendingApprovals.length}</span>
            Pending Approvals — Your Team
          </h3>
          <div className="space-y-2">
            {(pendingApprovals as any[]).map((req) => (
              <div key={req.id} className="hr-card p-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-white" style={{ background: "oklch(0.42 0.18 255)" }}>
                  {req.employeeFirstName?.[0]}{req.employeeLastName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "oklch(0.22 0.012 65)" }}>{req.employeeFirstName} {req.employeeLastName}</p>
                  <p className="text-xs" style={{ color: "oklch(0.55 0.012 65)" }}>
                    {req.leaveTypeName} · {new Date(req.startDate).toLocaleDateString("en-SG", { day: "numeric", month: "short" })} – {new Date(req.endDate).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })} · {req.totalDays} day{req.totalDays !== 1 ? "s" : ""}
                  </p>
                  {req.reason && <p className="text-xs mt-0.5 italic" style={{ color: "oklch(0.65 0.012 65)" }}>"{req.reason}"</p>}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => { setApproveModal({ id: req.id, name: `${req.employeeFirstName} ${req.employeeLastName}`, approved: true }); setApproveComment(""); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all hover:opacity-90"
                    style={{ background: "oklch(0.42 0.18 145)" }}
                  >Approve</button>
                  <button
                    onClick={() => { setApproveModal({ id: req.id, name: `${req.employeeFirstName} ${req.employeeLastName}`, approved: false }); setApproveComment(""); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all hover:opacity-90"
                    style={{ background: "oklch(0.52 0.18 25)" }}
                  >Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Leave History */}
      <div>
        <h3 className="text-sm font-semibold mb-3" style={{ color: "oklch(0.35 0.012 65)" }}>My Leave History</h3>
        {reqLoading ? (
          <div className="flex justify-center py-6"><Loader2 size={22} className="animate-spin" style={{ color: "oklch(0.42 0.18 255)" }} /></div>
        ) : requests.length === 0 ? (
          <div className="hr-card p-8 text-center">
            <Calendar size={32} className="mx-auto mb-3" style={{ color: "oklch(0.82 0.006 80)" }} />
            <p className="text-sm" style={{ color: "oklch(0.65 0.012 65)" }}>No leave requests yet.</p>
            <p className="text-xs mt-1" style={{ color: "oklch(0.72 0.006 80)" }}>Click "New Request" to submit your first leave request.</p>
          </div>
        ) : (
          <div className="hr-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "oklch(0.97 0.004 80)", borderBottom: "1px solid oklch(0.90 0.006 80)" }}>
                  <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "oklch(0.55 0.012 65)" }}>Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "oklch(0.55 0.012 65)" }}>Period</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "oklch(0.55 0.012 65)" }}>Days</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "oklch(0.55 0.012 65)" }}>Reason</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "oklch(0.55 0.012 65)" }}>Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {(requests as any[]).map((req) => {
                  const sc = statusColors[req.status] ?? statusColors.pending;
                  return (
                    <tr key={req.id} className="border-b last:border-b-0 hover:bg-gray-50/50 transition-colors" style={{ borderColor: "oklch(0.92 0.004 80)" }}>
                      <td className="px-4 py-3 font-medium text-xs" style={{ color: "oklch(0.35 0.012 65)" }}>{req.leaveTypeName ?? "—"}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "oklch(0.45 0.012 65)" }}>
                        {new Date(req.startDate).toLocaleDateString("en-SG", { day: "numeric", month: "short" })}
                        {" – "}
                        {new Date(req.endDate).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold" style={{ color: "oklch(0.22 0.012 65)" }}>{req.totalDays}</td>
                      <td className="px-4 py-3 text-xs max-w-[160px] truncate" style={{ color: "oklch(0.55 0.012 65)" }}>{req.reason || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: sc.bg, color: sc.text }}>
                          {sc.icon}{req.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {req.status === "pending" && (
                          <button
                            onClick={() => cancelMutation.mutate({ id: req.id })}
                            className="text-xs px-2 py-1 rounded transition-colors hover:bg-red-50"
                            style={{ color: "oklch(0.52 0.18 25)" }}
                          >Cancel</button>
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

      {/* New Request Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "oklch(0.90 0.006 80)" }}>
              <h3 className="font-semibold" style={{ color: "oklch(0.22 0.012 65)" }}>New Leave Request</h3>
              <button onClick={() => setShowForm(false)}><X size={18} style={{ color: "oklch(0.55 0.012 65)" }} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Leave Type *</label>
                <div className="relative">
                  <select
                    required
                    value={form.leaveTypeId}
                    onChange={e => setForm(f => ({ ...f, leaveTypeId: e.target.value }))}
                    style={{ ...inputStyle, appearance: "none", paddingRight: "32px" }}
                  >
                    <option value="">Select leave type...</option>
                    {(leaveTypes as any[]).filter(t => t.isActive).map(t => (
                      <option key={t.id} value={String(t.id)}>{t.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "oklch(0.55 0.012 65)" }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Start Date *</label>
                  <input type="date" required value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>End Date *</label>
                  <input type="date" required value={form.endDate} min={form.startDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} style={inputStyle} />
                </div>
              </div>
              {totalDays > 0 && (
                <div className="px-3 py-2 rounded-lg text-xs font-medium" style={{ background: "oklch(0.92 0.08 255)", color: "oklch(0.42 0.18 255)" }}>
                  <Calendar size={12} className="inline mr-1.5" />
                  {totalDays} working day{totalDays !== 1 ? "s" : ""} requested
                </div>
              )}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Reason (optional)</label>
                <textarea
                  value={form.reason}
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  rows={3}
                  placeholder="Brief reason for leave..."
                  style={{ ...inputStyle, resize: "none" }}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors" style={{ border: "1px solid oklch(0.88 0.006 80)", color: "oklch(0.45 0.012 65)" }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitMutation.isPending} className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90" style={{ background: "oklch(0.42 0.18 255)" }}>
                  {submitMutation.isPending ? "Submitting..." : "Submit Request"}
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
            <h3 className="font-semibold mb-1" style={{ color: "oklch(0.22 0.012 65)" }}>
              {approveModal.approved ? "Approve" : "Reject"} Leave Request
            </h3>
            <p className="text-sm mb-4" style={{ color: "oklch(0.55 0.012 65)" }}>
              {approveModal.approved ? "Approve" : "Reject"} leave request from <strong>{approveModal.name}</strong>?
            </p>
            <div className="mb-4">
              <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Comment {approveModal.approved ? "(optional)" : "*"}</label>
              <textarea
                value={approveComment}
                onChange={e => setApproveComment(e.target.value)}
                rows={3}
                placeholder={approveModal.approved ? "Optional note..." : "Reason for rejection..."}
                style={{ border: "1px solid oklch(0.88 0.006 80)", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", color: "oklch(0.22 0.012 65)", background: "white", width: "100%", outline: "none", resize: "none" }}
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setApproveModal(null)} className="flex-1 py-2.5 rounded-lg text-sm font-medium" style={{ border: "1px solid oklch(0.88 0.006 80)", color: "oklch(0.45 0.012 65)" }}>
                Cancel
              </button>
              <button
                onClick={() => approveMutation.mutate({ id: approveModal.id, approved: approveModal.approved, comment: approveComment || undefined })}
                disabled={approveMutation.isPending || (!approveModal.approved && !approveComment)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
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
