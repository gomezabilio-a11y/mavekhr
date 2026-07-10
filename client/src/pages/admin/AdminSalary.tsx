import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, X, DollarSign, CalendarClock, ChevronDown, ChevronUp, PlusCircle, MinusCircle } from "lucide-react";

type ComponentItem = {
  type: "earning" | "deduction";
  label: string;
  amount: string;
};

type SalaryForm = {
  employeeId: string;
  currency: string;
  amount: string;
  paymentDate: string;
  periodLabel: string;
  status: "paid" | "pending" | "cancelled";
  payslipUrl: string;
  nextPaymentDate: string;
  nextPaymentIsNA: boolean;
  components: ComponentItem[];
};

const emptyForm: SalaryForm = {
  employeeId: "", currency: "SGD", amount: "", paymentDate: "",
  periodLabel: "", status: "paid", payslipUrl: "",
  nextPaymentDate: "", nextPaymentIsNA: true,
  components: [],
};

function ComponentsEditor({ components, onChange }: {
  components: ComponentItem[];
  onChange: (items: ComponentItem[]) => void;
}) {
  function addItem(type: "earning" | "deduction") {
    onChange([...components, { type, label: "", amount: "" }]);
  }
  function removeItem(idx: number) {
    onChange(components.filter((_, i) => i !== idx));
  }
  function updateItem(idx: number, field: keyof ComponentItem, value: string) {
    onChange(components.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  }

  const earnings = components.filter(c => c.type === "earning");
  const deductions = components.filter(c => c.type === "deduction");
  const earningsTotal = earnings.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);
  const deductionsTotal = deductions.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);
  const netPay = earningsTotal - deductionsTotal;

  const inputCls = "flex-1 px-2 py-1.5 rounded border text-xs outline-none focus:ring-1 transition-all";
  const inputStyle = { borderColor: "oklch(0.88 0.006 80)", background: "white", color: "oklch(0.22 0.012 65)" };

  return (
    <div className="space-y-3">
      {/* Earnings */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold" style={{ color: "oklch(0.42 0.18 145)" }}>Earnings</span>
          <button type="button" onClick={() => addItem("earning")}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-md"
            style={{ color: "oklch(0.42 0.18 145)", background: "oklch(0.94 0.06 145)" }}>
            <PlusCircle size={11} /> Add
          </button>
        </div>
        {earnings.length === 0 && (
          <p className="text-xs py-2 text-center" style={{ color: "oklch(0.72 0.006 80)" }}>No earnings added</p>
        )}
        {components.map((c, idx) => c.type !== "earning" ? null : (
          <div key={idx} className="flex items-center gap-2 mb-1.5">
            <input
              value={c.label}
              onChange={e => updateItem(idx, "label", e.target.value)}
              placeholder="e.g. Basic Salary"
              className={inputCls} style={inputStyle}
            />
            <input
              type="number" step="0.01"
              value={c.amount}
              onChange={e => updateItem(idx, "amount", e.target.value)}
              placeholder="0.00"
              className="w-28 px-2 py-1.5 rounded border text-xs outline-none focus:ring-1 text-right"
              style={inputStyle}
            />
            <button type="button" onClick={() => removeItem(idx)}>
              <MinusCircle size={14} style={{ color: "oklch(0.52 0.18 25)" }} />
            </button>
          </div>
        ))}
        {earnings.length > 0 && (
          <div className="flex justify-end pr-6 pt-1">
            <span className="text-xs font-semibold" style={{ color: "oklch(0.42 0.18 145)" }}>
              Subtotal: {earningsTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </div>

      {/* Deductions */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold" style={{ color: "oklch(0.52 0.18 25)" }}>Deductions</span>
          <button type="button" onClick={() => addItem("deduction")}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-md"
            style={{ color: "oklch(0.52 0.18 25)", background: "oklch(0.95 0.04 25)" }}>
            <PlusCircle size={11} /> Add
          </button>
        </div>
        {deductions.length === 0 && (
          <p className="text-xs py-2 text-center" style={{ color: "oklch(0.72 0.006 80)" }}>No deductions added</p>
        )}
        {components.map((c, idx) => c.type !== "deduction" ? null : (
          <div key={idx} className="flex items-center gap-2 mb-1.5">
            <input
              value={c.label}
              onChange={e => updateItem(idx, "label", e.target.value)}
              placeholder="e.g. CPF Employee"
              className={inputCls} style={inputStyle}
            />
            <input
              type="number" step="0.01"
              value={c.amount}
              onChange={e => updateItem(idx, "amount", e.target.value)}
              placeholder="0.00"
              className="w-28 px-2 py-1.5 rounded border text-xs outline-none focus:ring-1 text-right"
              style={inputStyle}
            />
            <button type="button" onClick={() => removeItem(idx)}>
              <MinusCircle size={14} style={{ color: "oklch(0.52 0.18 25)" }} />
            </button>
          </div>
        ))}
        {deductions.length > 0 && (
          <div className="flex justify-end pr-6 pt-1">
            <span className="text-xs font-semibold" style={{ color: "oklch(0.52 0.18 25)" }}>
              Subtotal: {deductionsTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </div>

      {/* Net Pay */}
      {components.length > 0 && (
        <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: "oklch(0.90 0.006 80)" }}>
          <span className="text-xs font-bold" style={{ color: "oklch(0.22 0.012 65)" }}>Net Pay</span>
          <span className="text-sm font-bold" style={{ color: "oklch(0.22 0.012 65)" }}>
            {netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      )}
    </div>
  );
}

export default function AdminSalary() {
  const [location] = useLocation();
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<SalaryForm>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [expandedRecord, setExpandedRecord] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: employees = [] } = trpc.employee.list.useQuery();
  const { data: salaryRecords = [], isLoading } = trpc.salary.list.useQuery(
    { employeeId: selectedEmployee! },
    { enabled: selectedEmployee !== null }
  );
  // Load components for expanded record
  const { data: expandedComponents = [] } = trpc.salary.components.useQuery(
    { salaryRecordId: expandedRecord! },
    { enabled: expandedRecord !== null }
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

  async function handleEdit(rec: typeof salaryRecords[0]) {
    setEditId(rec.id);
    const hasNextDate = rec.nextPaymentDate != null && String(rec.nextPaymentDate).trim() !== "";
    // Load components for this record
    const comps = await utils.salary.components.fetch({ salaryRecordId: rec.id });
    setForm({
      employeeId: rec.employeeId.toString(),
      currency: rec.currency,
      amount: rec.amount,
      paymentDate: rec.paymentDate ? String(rec.paymentDate) : "",
      periodLabel: rec.periodLabel,
      status: rec.status,
      payslipUrl: rec.payslipUrl ?? "",
      nextPaymentDate: hasNextDate ? String(rec.nextPaymentDate) : "",
      nextPaymentIsNA: !hasNextDate,
      components: (comps as any[]).map(c => ({ type: c.type as "earning" | "deduction", label: c.label, amount: c.amount })),
    });
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextPaymentDate = form.nextPaymentIsNA ? null : (form.nextPaymentDate || null);
    const validComponents = form.components.filter(c => c.label.trim() && c.amount);
    if (editId) {
      updateMutation.mutate({ id: editId, ...form, nextPaymentDate, components: validComponents });
    } else {
      createMutation.mutate({ ...form, employeeId: parseInt(form.employeeId), nextPaymentDate, components: validComponents });
    }
  }

  function formatNextPayment(rec: typeof salaryRecords[0]) {
    if (!rec.nextPaymentDate) return "N/A";
    const s = String(rec.nextPaymentDate);
    if (!s || s.trim() === "") return "N/A";
    return s;
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
                    {["Period", "Payment Date", "Next Payment Date", "Amount", "Status", "Actions"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "oklch(0.55 0.012 65)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {salaryRecords.map(rec => (
                    <>
                      <tr key={rec.id} className="border-b hover:bg-gray-50/50" style={{ borderColor: "oklch(0.94 0.006 80)" }}>
                        <td className="px-4 py-3 font-medium" style={{ color: "oklch(0.22 0.012 65)" }}>
                          <button
                            type="button"
                            className="flex items-center gap-1.5 hover:underline"
                            onClick={() => setExpandedRecord(expandedRecord === rec.id ? null : rec.id)}
                          >
                            {expandedRecord === rec.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            {rec.periodLabel}
                          </button>
                        </td>
                        <td className="px-4 py-3" style={{ color: "oklch(0.45 0.012 65)" }}>{rec.paymentDate ? String(rec.paymentDate) : "—"}</td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1.5">
                            <CalendarClock size={13} style={{ color: formatNextPayment(rec) === "N/A" ? "oklch(0.65 0.012 65)" : "oklch(0.42 0.18 255)" }} />
                            <span style={{ color: formatNextPayment(rec) === "N/A" ? "oklch(0.65 0.012 65)" : "oklch(0.22 0.012 65)" }}>
                              {formatNextPayment(rec)}
                            </span>
                          </span>
                        </td>
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
                      {/* Expanded components row */}
                      {expandedRecord === rec.id && (
                        <tr key={`${rec.id}-components`} style={{ background: "oklch(0.985 0.004 80)" }}>
                          <td colSpan={6} className="px-6 py-4">
                            {expandedComponents.length === 0 ? (
                              <p className="text-xs" style={{ color: "oklch(0.65 0.012 65)" }}>No salary components added for this record. Edit the record to add earnings and deductions.</p>
                            ) : (
                              <div className="max-w-sm space-y-1">
                                {expandedComponents.filter((c: any) => c.type === "earning").length > 0 && (
                                  <p className="text-xs font-semibold mb-1" style={{ color: "oklch(0.42 0.18 145)" }}>Earnings</p>
                                )}
                                {expandedComponents.filter((c: any) => c.type === "earning").map((c: any) => (
                                  <div key={c.id} className="flex justify-between text-xs">
                                    <span style={{ color: "oklch(0.45 0.012 65)" }}>{c.label}</span>
                                    <span className="font-medium" style={{ color: "oklch(0.22 0.012 65)" }}>{parseFloat(c.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                  </div>
                                ))}
                                {expandedComponents.filter((c: any) => c.type === "deduction").length > 0 && (
                                  <p className="text-xs font-semibold mt-2 mb-1" style={{ color: "oklch(0.52 0.18 25)" }}>Deductions</p>
                                )}
                                {expandedComponents.filter((c: any) => c.type === "deduction").map((c: any) => (
                                  <div key={c.id} className="flex justify-between text-xs">
                                    <span style={{ color: "oklch(0.45 0.012 65)" }}>{c.label}</span>
                                    <span className="font-medium" style={{ color: "oklch(0.52 0.18 25)" }}>-{parseFloat(c.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                  </div>
                                ))}
                                <div className="flex justify-between text-xs font-bold pt-2 border-t mt-2" style={{ borderColor: "oklch(0.90 0.006 80)" }}>
                                  <span>Net Pay</span>
                                  <span>{(
                                    expandedComponents.filter((c: any) => c.type === "earning").reduce((s: number, c: any) => s + parseFloat(c.amount || "0"), 0) -
                                    expandedComponents.filter((c: any) => c.type === "deduction").reduce((s: number, c: any) => s + parseFloat(c.amount || "0"), 0)
                                  ).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
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
                  <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Total Amount *</label>
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

              {/* Next Payment Date */}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Next Payment Date</label>
                <div className="flex items-center gap-2 mb-2">
                  <button type="button" onClick={() => setForm(f => ({ ...f, nextPaymentIsNA: true, nextPaymentDate: "" }))}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                    style={{ background: form.nextPaymentIsNA ? "oklch(0.42 0.18 255)" : "white", color: form.nextPaymentIsNA ? "white" : "oklch(0.45 0.012 65)", borderColor: form.nextPaymentIsNA ? "oklch(0.42 0.18 255)" : "oklch(0.88 0.006 80)" }}>
                    N/A
                  </button>
                  <button type="button" onClick={() => setForm(f => ({ ...f, nextPaymentIsNA: false }))}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                    style={{ background: !form.nextPaymentIsNA ? "oklch(0.42 0.18 255)" : "white", color: !form.nextPaymentIsNA ? "white" : "oklch(0.45 0.012 65)", borderColor: !form.nextPaymentIsNA ? "oklch(0.42 0.18 255)" : "oklch(0.88 0.006 80)" }}>
                    Set Date
                  </button>
                </div>
                {!form.nextPaymentIsNA && (
                  <input type="date" value={form.nextPaymentDate} onChange={e => setForm(f => ({ ...f, nextPaymentDate: e.target.value }))}
                    className={inputCls} style={inputStyle} />
                )}
                {form.nextPaymentIsNA && (
                  <p className="text-xs" style={{ color: "oklch(0.65 0.012 65)" }}>Next payment date is not yet confirmed (will show as N/A)</p>
                )}
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

              {/* Salary Components */}
              <div className="border rounded-xl p-4" style={{ borderColor: "oklch(0.88 0.006 80)", background: "oklch(0.985 0.004 80)" }}>
                <p className="text-xs font-semibold mb-3" style={{ color: "oklch(0.22 0.012 65)" }}>Salary Components (optional)</p>
                <ComponentsEditor
                  components={form.components}
                  onChange={items => setForm(f => ({ ...f, components: items }))}
                />
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
            <p className="text-xs mb-4" style={{ color: "oklch(0.55 0.012 65)" }}>This will also delete all salary components for this record.</p>
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
