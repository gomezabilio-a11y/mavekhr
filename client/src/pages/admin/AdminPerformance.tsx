import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, X, BarChart2 } from "lucide-react";

type PerfForm = {
  employeeId: string;
  period: string;
  overallScore: string;
  grade: string;
  managerScore: string;
  peerScore: string;
  selfScore: string;
  managerComment: string;
  peerComment: string;
  selfComment: string;
};

const emptyForm: PerfForm = {
  employeeId: "", period: "", overallScore: "", grade: "",
  managerScore: "", peerScore: "", selfScore: "",
  managerComment: "", peerComment: "", selfComment: "",
};

export default function AdminPerformance() {
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<PerfForm>(emptyForm);

  const utils = trpc.useUtils();
  const { data: employees = [] } = trpc.employee.list.useQuery();
  const { data: results = [], isLoading } = trpc.performance.list.useQuery(
    { employeeId: selectedEmployee! },
    { enabled: selectedEmployee !== null }
  );

  const createMutation = trpc.performance.create.useMutation({
    onSuccess: () => {
      utils.performance.list.invalidate();
      setShowForm(false);
      setForm(emptyForm);
      toast.success("Performance result created");
    },
    onError: (e) => toast.error(e.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate({
      ...form,
      employeeId: parseInt(form.employeeId),
    });
  }

  const selectedEmp = employees.find(e => e.id === selectedEmployee);
  const inputCls = "w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 transition-all";
  const inputStyle = { borderColor: "oklch(0.88 0.006 80)", background: "white", color: "oklch(0.22 0.012 65)" };

  const gradeColor = (grade: string | null) => {
    if (!grade) return { bg: "oklch(0.92 0.006 80)", text: "oklch(0.55 0.012 65)" };
    if (grade === "A" || grade === "A+") return { bg: "oklch(0.92 0.08 145)", text: "oklch(0.32 0.18 145)" };
    if (grade === "B" || grade === "B+") return { bg: "oklch(0.92 0.08 255)", text: "oklch(0.32 0.18 255)" };
    if (grade === "C") return { bg: "oklch(0.92 0.06 65)", text: "oklch(0.42 0.15 65)" };
    return { bg: "oklch(0.92 0.06 25)", text: "oklch(0.42 0.15 25)" };
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
            Performance
          </h2>
          <p className="text-sm" style={{ color: "oklch(0.55 0.012 65)" }}>Manage employee performance results</p>
        </div>
        <button
          onClick={() => { setForm(emptyForm); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: "oklch(0.42 0.18 255)" }}
        >
          <Plus size={14} /> Add Result
        </button>
      </div>

      {/* Employee selector */}
      <div className="bg-white rounded-xl border p-4" style={{ borderColor: "oklch(0.90 0.006 80)" }}>
        <label className="block text-xs font-medium mb-2" style={{ color: "oklch(0.45 0.012 65)" }}>Select Employee</label>
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

      {selectedEmployee !== null && (
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "oklch(0.90 0.006 80)" }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: "oklch(0.90 0.006 80)", background: "oklch(0.97 0.006 80)" }}>
            <p className="text-sm font-medium" style={{ color: "oklch(0.22 0.012 65)" }}>
              {selectedEmp?.firstName} {selectedEmp?.lastName} — Performance History
            </p>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "oklch(0.62 0.18 255)" }} />
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12">
              <BarChart2 size={28} className="mx-auto mb-2" style={{ color: "oklch(0.82 0.006 80)" }} />
              <p className="text-sm" style={{ color: "oklch(0.65 0.012 65)" }}>No performance records yet.</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "oklch(0.94 0.006 80)" }}>
              {results.map(r => {
                const gc = gradeColor(r.grade);
                return (
                  <div key={r.id} className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-medium text-sm flex-1" style={{ color: "oklch(0.22 0.012 65)" }}>{r.period}</p>
                      {r.grade && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold" style={{ background: gc.bg, color: gc.text }}>
                          {r.grade}
                        </span>
                      )}
                      {r.overallScore && (
                        <span className="text-sm font-bold" style={{ color: "oklch(0.22 0.012 65)" }}>{r.overallScore}</span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      {r.managerScore && <div><span style={{ color: "oklch(0.65 0.012 65)" }}>Manager: </span><span style={{ color: "oklch(0.35 0.012 65)" }}>{r.managerScore}</span></div>}
                      {r.peerScore && <div><span style={{ color: "oklch(0.65 0.012 65)" }}>Peer: </span><span style={{ color: "oklch(0.35 0.012 65)" }}>{r.peerScore}</span></div>}
                      {r.selfScore && <div><span style={{ color: "oklch(0.65 0.012 65)" }}>Self: </span><span style={{ color: "oklch(0.35 0.012 65)" }}>{r.selfScore}</span></div>}
                    </div>
                    {r.managerComment && (
                      <p className="text-xs mt-2 italic" style={{ color: "oklch(0.55 0.012 65)" }}>"{r.managerComment}"</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "oklch(0.90 0.006 80)" }}>
              <h3 className="font-semibold" style={{ color: "oklch(0.22 0.012 65)" }}>Add Performance Result</h3>
              <button onClick={() => { setShowForm(false); setForm(emptyForm); }}>
                <X size={18} style={{ color: "oklch(0.55 0.012 65)" }} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Employee *</label>
                <select required value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}
                  className={inputCls} style={inputStyle}>
                  <option value="">— Select employee —</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Period *</label>
                <input required value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))}
                  placeholder="H1 2026 / Q2 2026" className={inputCls} style={inputStyle} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Overall Score</label>
                  <input type="number" step="0.1" min="0" max="100" value={form.overallScore} onChange={e => setForm(f => ({ ...f, overallScore: e.target.value }))}
                    placeholder="91.4" className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Grade</label>
                  <select value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}
                    className={inputCls} style={inputStyle}>
                    <option value="">— None —</option>
                    <option value="A+">A+</option>
                    <option value="A">A</option>
                    <option value="B+">B+</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Manager Score</label>
                  <input type="number" step="0.1" value={form.managerScore} onChange={e => setForm(f => ({ ...f, managerScore: e.target.value }))}
                    placeholder="93.0" className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Peer Score</label>
                  <input type="number" step="0.1" value={form.peerScore} onChange={e => setForm(f => ({ ...f, peerScore: e.target.value }))}
                    placeholder="90.0" className={inputCls} style={inputStyle} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Self Score</label>
                  <input type="number" step="0.1" value={form.selfScore} onChange={e => setForm(f => ({ ...f, selfScore: e.target.value }))}
                    placeholder="88.0" className={inputCls} style={inputStyle} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Manager Comment</label>
                <textarea rows={2} value={form.managerComment} onChange={e => setForm(f => ({ ...f, managerComment: e.target.value }))}
                  placeholder="Excellent performance this period..." className={inputCls} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Peer Comment</label>
                <textarea rows={2} value={form.peerComment} onChange={e => setForm(f => ({ ...f, peerComment: e.target.value }))}
                  className={inputCls} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Self Comment</label>
                <textarea rows={2} value={form.selfComment} onChange={e => setForm(f => ({ ...f, selfComment: e.target.value }))}
                  className={inputCls} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm); }}
                  className="flex-1 py-2.5 rounded-lg text-sm border" style={{ borderColor: "oklch(0.88 0.006 80)", color: "oklch(0.45 0.012 65)" }}>
                  Cancel
                </button>
                <button type="submit" disabled={createMutation.isPending}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                  style={{ background: "oklch(0.42 0.18 255)" }}>
                  {createMutation.isPending ? "Saving..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
