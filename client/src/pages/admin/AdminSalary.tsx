import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, X, DollarSign, Search } from "lucide-react";

type SalaryForm = {
  employeeId: string;
  currency: string;
  amount: string;
  paymentDate: string;
  periodLabel: string;
  status: "paid" | "pending" | "cancelled";
  payslipUrl: string;
};

const emptyForm: SalaryForm = {
  employeeId: "", currency: "SGD", amount: "", paymentDate: "",
  periodLabel: "", status: "paid", payslipUrl: "",
};

export default function AdminSalary() {
  const [location] = useLocation();
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<SalaryForm>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: employees = [] } = trpc.employee.list.useQuery();
  const { data: salaryRecords = [], isLoading } = trpc.salary.list.useQuery(
    { employeeId: selectedEmployee! },
    { enabled: selectedEmployee !== null }
  );

  const createMutation = trpc.salary.create.useMutation({
    onSuccess: () => { utils.salary.list.invalidate(); setShowForm(false); setForm(emptyForm); toast.success("Salary record created"); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.salary.update.useMutation({
    onSuccess: () => { utils.salary.list.invalidate(); setShowForm(false); setEditId(null); setForm(emptyForm); toast.success("Record updated"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.salary.delete.useMutation({
    onSuccess: () => { utils.salary.list.invalidate(); setDeleteConfirm(null); toast.success("Record deleted"); },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (location.includes("action=new")) setShowForm(true);
  }, [location]);

  function handleEdit(rec: typeof salaryRecords[0]) {
    setEditId(rec.id);
    setForm({
      employeeId: rec.employeeId.toString(),
      currency: rec.currency,
      amount: rec.amount,
      paymentDate: rec.paymentDate ? String(rec.paymentDate) : "",
      periodLabel: rec.periodLabel,
      status: rec.status,
      payslipUrl: rec.payslipUrl ?? "",
    });
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editId) {
      updateMutation.mutate({ id: editId, ...form });
    } else {
      createMutation.mutate({ ...form, employeeId: parseInt(form.employeeId) });
    }
  }

  const selectedEmp = employees.find(e => e.id === selectedEmployee);
  const inputCls = "w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 transition-all";
  const inputStyle = { borderColor: "oklch(0.88 0.006 80)", background: "white", color: "oklch(0.22 0.012 65)" };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
            Salary Records
          </h2>
          <p className="text-sm" style={{ color: "oklch(0.55 0.012 65)" }}>Manage employee salary and payslip records</p>
        </div>
        <button
          onClick={() => { setEditId(null); setForm(emptyForm); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: "oklch(0.42 0.18 255)" }}
        >
          <Plus size={14} /> Add Record
        </button>
      </div>

      {/* Employee selector */}
      <div className="bg-white rounded-xl border p-4" style={{ borderColor: "oklch(0.90 0.006 80)" }}>
        <label className="block text-xs font-medium mb-2" style={{ color: "oklch(0.45 0.012 65)" }}>Select Employee to View Records</label>
        <select
          value={selectedEmployee ?? ""}
          onChange={e => setSelectedEmployee(e.target.value ? parseInt(e.target.value) : null)}
          className={inputCls} style={inputStyle}
        >
          <option value="">— Select an employee —</option>
          {employees.map(e => (
            <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeCode})</option>
          ))}
        </select>
      </div>

      {/* Records table */}
      {selectedEmployee !== null && (
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "oklch(0.90 0.006 80)" }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: "oklch(0.90 0.006 80)", background: "oklch(0.97 0.006 80)" }}>
            <p className="text-sm font-medium" style={{ color: "oklch(0.22 0.012 65)" }}>
              {selectedEmp?.firstName} {selectedEmp?.lastName} — Salary History
            </p>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "oklch(0.62 0.18 255)" }} />
            </div>
          ) : salaryRecords.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign size={28} className="mx-auto mb-2" style={{ color: "oklch(0.82 0.006 80)" }} />
              <p className="text-sm" style={{ color: "oklch(0.65 0.012 65)" }}>No salary records for this employee.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "oklch(0.97 0.006 80)", borderBottom: "1px solid oklch(0.90 0.006 80)" }}>
                    {["Period", "Payment Date", "Amount", "Status", "Actions"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "oklch(0.55 0.012 65)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {salaryRecords.map(rec => (
                    <tr key={rec.id} className="border-b last:border-0 hover:bg-gray-50/50" style={{ borderColor: "oklch(0.94 0.006 80)" }}>
                      <td className="px-4 py-3 font-medium" style={{ color: "oklch(0.22 0.012 65)" }}>{rec.periodLabel}</td>
                      <td className="px-4 py-3" style={{ color: "oklch(0.45 0.012 65)" }}>{rec.paymentDate ? String(rec.paymentDate) : "—"}</td>
                      <td className="px-4 py-3 font-semibold" style={{ color: "oklch(0.22 0.012 65)" }}>{rec.currency} {parseFloat(rec.amount).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{
                          background: rec.status === "paid" ? "oklch(0.92 0.08 145)" : rec.status === "cancelled" ? "oklch(0.92 0.06 25)" : "oklch(0.92 0.06 65)",
                          color: rec.status === "paid" ? "oklch(0.42 0.18 145)" : rec.status === "cancelled" ? "oklch(0.42 0.15 25)" : "oklch(0.52 0.12 65)",
                        }}>
                          {rec.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleEdit(rec)} className="p-1.5 rounded hover:bg-blue-50">
                            <Edit2 size={13} style={{ color: "oklch(0.42 0.18 255)" }} />
                          </button>
                          <button onClick={() => setDeleteConfirm(rec.id)} className="p-1.5 rounded hover:bg-red-50">
                            <Trash2 size={13} style={{ color: "oklch(0.52 0.18 25)" }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "oklch(0.90 0.006 80)" }}>
              <h3 className="font-semibold" style={{ color: "oklch(0.22 0.012 65)" }}>
                {editId ? "Edit Salary Record" : "Add Salary Record"}
              </h3>
              <button onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }}>
                <X size={18} style={{ color: "oklch(0.55 0.012 65)" }} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {!editId && (
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Employee *</label>
                  <select required value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}
                    className={inputCls} style={inputStyle}>
                    <option value="">— Select employee —</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Currency</label>
                  <input value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                    placeholder="SGD" className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Amount *</label>
                  <input required type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="18500.00" className={inputCls} style={inputStyle} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Period Label *</label>
                <input required value={form.periodLabel} onChange={e => setForm(f => ({ ...f, periodLabel: e.target.value }))}
                  placeholder="June 2026" className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Payment Date *</label>
                <input required type="date" value={form.paymentDate} onChange={e => setForm(f => ({ ...f, paymentDate: e.target.value }))}
                  className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}
                  className={inputCls} style={inputStyle}>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }}
                  className="flex-1 py-2.5 rounded-lg text-sm border" style={{ borderColor: "oklch(0.88 0.006 80)", color: "oklch(0.45 0.012 65)" }}>
                  Cancel
                </button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                  style={{ background: "oklch(0.42 0.18 255)" }}>
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : editId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
            <Trash2 size={32} className="mx-auto mb-3" style={{ color: "oklch(0.52 0.18 25)" }} />
            <p className="font-semibold mb-1" style={{ color: "oklch(0.22 0.012 65)" }}>Delete Record?</p>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 rounded-lg text-sm border" style={{ borderColor: "oklch(0.88 0.006 80)" }}>Cancel</button>
              <button onClick={() => deleteMutation.mutate({ id: deleteConfirm })} disabled={deleteMutation.isPending}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-white" style={{ background: "oklch(0.52 0.18 25)" }}>
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
