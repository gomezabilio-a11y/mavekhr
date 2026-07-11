import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Plus, Edit2, Trash2, X, ChevronRight, ChevronDown,
  Users, Calendar, CheckCircle2, Clock, AlertCircle,
  UserPlus, RefreshCw, Eye
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type CycleStatus = "open" | "closed" | "upcoming";
type TaskType = "self" | "peer" | "manager" | "contractor" | "upward";

type CycleForm = {
  period: string;
  status: CycleStatus;
  openDate: string;
  closeDate: string;
};

const emptyCycleForm: CycleForm = {
  period: "",
  status: "upcoming",
  openDate: "",
  closeDate: "",
};

const STATUS_COLORS: Record<CycleStatus, { bg: string; text: string; label: string }> = {
  upcoming: { bg: "oklch(0.93 0.04 65)", text: "oklch(0.52 0.12 65)", label: "Upcoming" },
  open:     { bg: "oklch(0.92 0.08 145)", text: "oklch(0.42 0.18 145)", label: "Open" },
  closed:   { bg: "oklch(0.92 0.04 220)", text: "oklch(0.42 0.12 220)", label: "Closed" },
};

const TASK_TYPE_LABELS: Record<TaskType, string> = {
  self: "Self",
  peer: "Peer",
  manager: "Manager",
  contractor: "Contractor",
  upward: "Upward",
};

const TASK_TYPE_COLORS: Record<TaskType, { bg: string; text: string }> = {
  self:       { bg: "oklch(0.92 0.08 255)", text: "oklch(0.42 0.18 255)" },
  peer:       { bg: "oklch(0.92 0.08 145)", text: "oklch(0.42 0.18 145)" },
  manager:    { bg: "oklch(0.93 0.06 30)", text: "oklch(0.45 0.15 30)" },
  contractor: { bg: "oklch(0.93 0.04 65)", text: "oklch(0.52 0.12 65)" },
  upward:     { bg: "oklch(0.92 0.08 320)", text: "oklch(0.42 0.18 320)" },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function AdminEvalCycles() {
  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);
  const [showCycleForm, setShowCycleForm] = useState(false);
  const [editCycleId, setEditCycleId] = useState<number | null>(null);
  const [cycleForm, setCycleForm] = useState<CycleForm>(emptyCycleForm);
  const [deleteCycleConfirm, setDeleteCycleConfirm] = useState<number | null>(null);

  // Assignment panel state
  const [showAssignPanel, setShowAssignPanel] = useState(false);
  const [assignStep, setAssignStep] = useState<"select_evaluatee" | "select_evaluators">("select_evaluatee");
  const [selectedEvaluateeId, setSelectedEvaluateeId] = useState<number | null>(null);
  const [selectedPeerIds, setSelectedPeerIds] = useState<number[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState<number | null>(null);
  const [includeUpward, setIncludeUpward] = useState(false);
  const [deleteTaskConfirm, setDeleteTaskConfirm] = useState<number | null>(null);

  const utils = trpc.useUtils();

  // Queries
  const { data: cycles = [], isLoading: cyclesLoading } = trpc.evaluation.cycles.useQuery();
  const { data: employees = [] } = trpc.employee.list.useQuery();
  const { data: tasks = [], isLoading: tasksLoading } = trpc.evaluation.tasksByCycle.useQuery(
    { cycleId: selectedCycleId! },
    { enabled: selectedCycleId !== null }
  );

  // Mutations
  const createCycleMut = trpc.evaluation.createCycle.useMutation({
    onSuccess: () => { utils.evaluation.cycles.invalidate(); setShowCycleForm(false); setCycleForm(emptyCycleForm); toast.success("Evaluation cycle created"); },
    onError: (e) => toast.error(e.message),
  });
  const updateCycleMut = trpc.evaluation.updateCycle.useMutation({
    onSuccess: () => { utils.evaluation.cycles.invalidate(); setShowCycleForm(false); setEditCycleId(null); setCycleForm(emptyCycleForm); toast.success("Cycle updated"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteCycleMut = trpc.evaluation.deleteCycle.useMutation({
    onSuccess: () => {
      utils.evaluation.cycles.invalidate();
      setDeleteCycleConfirm(null);
      if (selectedCycleId === deleteCycleConfirm) setSelectedCycleId(null);
      toast.success("Cycle deleted");
    },
    onError: (e) => toast.error(e.message),
  });
  const bulkCreateTasksMut = trpc.evaluation.bulkCreateTasks.useMutation({
    onSuccess: () => {
      utils.evaluation.tasksByCycle.invalidate({ cycleId: selectedCycleId! });
      setShowAssignPanel(false);
      resetAssignState();
      toast.success("Evaluation tasks assigned successfully");
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteTaskMut = trpc.evaluation.deleteTask.useMutation({
    onSuccess: () => {
      utils.evaluation.tasksByCycle.invalidate({ cycleId: selectedCycleId! });
      setDeleteTaskConfirm(null);
      toast.success("Task removed");
    },
    onError: (e) => toast.error(e.message),
  });

  // Helpers
  const selectedCycle = cycles.find(c => c.id === selectedCycleId);
  const empMap = useMemo(() => Object.fromEntries(employees.map(e => [e.id, e])), [employees]);

  // Group tasks by evaluatee
  const tasksByEvaluatee = useMemo(() => {
    const map: Record<number, typeof tasks> = {};
    for (const t of tasks) {
      if (!map[t.evaluateeId]) map[t.evaluateeId] = [];
      map[t.evaluateeId].push(t);
    }
    return map;
  }, [tasks]);

  // Evaluatees already in this cycle
  const assignedEvaluateeIds = useMemo(() => new Set(tasks.map(t => t.evaluateeId)), [tasks]);

  function resetAssignState() {
    setAssignStep("select_evaluatee");
    setSelectedEvaluateeId(null);
    setSelectedPeerIds([]);
    setSelectedManagerId(null);
    setIncludeUpward(false);
  }

  function handleEditCycle(cycle: typeof cycles[0]) {
    setEditCycleId(cycle.id);
    setCycleForm({
      period: cycle.period,
      status: cycle.status,
      openDate: cycle.openDate ? String(cycle.openDate) : "",
      closeDate: cycle.closeDate ? String(cycle.closeDate) : "",
    });
    setShowCycleForm(true);
  }

  function handleCycleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...cycleForm,
      openDate: cycleForm.openDate || undefined,
      closeDate: cycleForm.closeDate || undefined,
    };
    if (editCycleId) {
      updateCycleMut.mutate({ id: editCycleId, ...payload });
    } else {
      createCycleMut.mutate(payload);
    }
  }

  function handleAssignConfirm() {
    if (!selectedCycleId || !selectedEvaluateeId) return;
    const evaluatee = empMap[selectedEvaluateeId];
    if (!evaluatee) return;

    const tasks: Array<{ evaluatorId: number; evaluateeId: number; type: TaskType }> = [];

    // Self evaluation (only for regular employees)
    if (evaluatee.employeeRole !== "contractor") {
      const selfFormType = evaluatee.isManager ? "self_manager" : "self_regular";
      tasks.push({ evaluatorId: selectedEvaluateeId, evaluateeId: selectedEvaluateeId, type: "self" });
    }

    // Peer evaluations
    for (const peerId of selectedPeerIds) {
      const peer = empMap[peerId];
      if (!peer) continue;
      // If evaluatee is contractor, peer uses "contractor" form type
      const type: TaskType = evaluatee.employeeRole === "contractor" ? "contractor" : "peer";
      tasks.push({ evaluatorId: peerId, evaluateeId: selectedEvaluateeId, type });
    }

    // Manager evaluation
    if (selectedManagerId) {
      tasks.push({ evaluatorId: selectedManagerId, evaluateeId: selectedEvaluateeId, type: "manager" });
    }

    // Upward evaluation: evaluatee evaluates their manager
    if (includeUpward && selectedManagerId) {
      tasks.push({ evaluatorId: selectedEvaluateeId, evaluateeId: selectedManagerId, type: "upward" });
    }

    bulkCreateTasksMut.mutate({ cycleId: selectedCycleId, tasks });
  }

  const inputCls = "w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 transition-all";
  const inputStyle = { borderColor: "oklch(0.88 0.006 80)", background: "white", color: "oklch(0.22 0.012 65)" };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
            Evaluation Cycles
          </h2>
          <p className="text-sm" style={{ color: "oklch(0.55 0.012 65)" }}>
            Create evaluation periods and assign participants
          </p>
        </div>
        <button
          onClick={() => { setEditCycleId(null); setCycleForm(emptyCycleForm); setShowCycleForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: "oklch(0.42 0.18 255)" }}
        >
          <Plus size={14} /> New Cycle
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left: Cycle List ─────────────────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "oklch(0.65 0.012 65)" }}>
            All Cycles ({cycles.length})
          </p>
          {cyclesLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "oklch(0.62 0.18 255)" }} />
            </div>
          ) : cycles.length === 0 ? (
            <div className="text-center py-10 rounded-xl border border-dashed" style={{ borderColor: "oklch(0.88 0.006 80)" }}>
              <Calendar size={28} className="mx-auto mb-2" style={{ color: "oklch(0.82 0.006 80)" }} />
              <p className="text-sm" style={{ color: "oklch(0.65 0.012 65)" }}>No cycles yet</p>
            </div>
          ) : (
            cycles.map(cycle => {
              const sc = STATUS_COLORS[cycle.status];
              const isSelected = selectedCycleId === cycle.id;
              const taskCount = tasks.filter(t => t.cycleId === cycle.id).length;
              return (
                <div
                  key={cycle.id}
                  onClick={() => setSelectedCycleId(isSelected ? null : cycle.id)}
                  className="rounded-xl border p-4 cursor-pointer transition-all"
                  style={{
                    borderColor: isSelected ? "oklch(0.62 0.18 255)" : "oklch(0.90 0.006 80)",
                    background: isSelected ? "oklch(0.97 0.04 255)" : "white",
                    boxShadow: isSelected ? "0 0 0 2px oklch(0.62 0.18 255 / 0.2)" : undefined,
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: "oklch(0.22 0.012 65)" }}>
                        {cycle.period}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: sc.bg, color: sc.text }}>
                          {sc.label}
                        </span>
                        {cycle.openDate && (
                          <span className="text-xs" style={{ color: "oklch(0.65 0.012 65)" }}>
                            {String(cycle.openDate).slice(0, 10)} ~ {cycle.closeDate ? String(cycle.closeDate).slice(0, 10) : "—"}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={e => { e.stopPropagation(); handleEditCycle(cycle); }}
                        className="p-1.5 rounded hover:bg-blue-50 transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={12} style={{ color: "oklch(0.42 0.18 255)" }} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); setDeleteCycleConfirm(cycle.id); }}
                        className="p-1.5 rounded hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={12} style={{ color: "oklch(0.52 0.18 25)" }} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Right: Cycle Detail / Task Management ────────────────────────── */}
        <div className="lg:col-span-2">
          {!selectedCycle ? (
            <div className="flex flex-col items-center justify-center h-64 rounded-xl border border-dashed" style={{ borderColor: "oklch(0.88 0.006 80)" }}>
              <Eye size={32} className="mb-3" style={{ color: "oklch(0.82 0.006 80)" }} />
              <p className="text-sm font-medium" style={{ color: "oklch(0.55 0.012 65)" }}>Select a cycle to manage participants</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Cycle header */}
              <div className="rounded-xl border p-4 flex items-center justify-between gap-3 flex-wrap" style={{ borderColor: "oklch(0.90 0.006 80)", background: "white" }}>
                <div>
                  <h3 className="font-bold text-base" style={{ color: "oklch(0.22 0.012 65)" }}>{selectedCycle.period}</h3>
                  <p className="text-xs mt-0.5" style={{ color: "oklch(0.65 0.012 65)" }}>
                    {Object.values(tasksByEvaluatee).length} evaluatees · {tasks.length} total tasks
                  </p>
                </div>
                <button
                  onClick={() => { resetAssignState(); setShowAssignPanel(true); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white"
                  style={{ background: "oklch(0.42 0.18 145)" }}
                >
                  <UserPlus size={14} /> Add Participant
                </button>
              </div>

              {/* Task list grouped by evaluatee */}
              {tasksLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "oklch(0.62 0.18 255)" }} />
                </div>
              ) : Object.keys(tasksByEvaluatee).length === 0 ? (
                <div className="text-center py-10 rounded-xl border border-dashed" style={{ borderColor: "oklch(0.88 0.006 80)" }}>
                  <Users size={28} className="mx-auto mb-2" style={{ color: "oklch(0.82 0.006 80)" }} />
                  <p className="text-sm" style={{ color: "oklch(0.65 0.012 65)" }}>No participants yet. Click "Add Participant" to assign evaluations.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(tasksByEvaluatee).map(([evaluateeIdStr, evalTasks]) => {
                    const evaluateeId = parseInt(evaluateeIdStr);
                    const evaluatee = empMap[evaluateeId];
                    const completedCount = evalTasks.filter(t => t.status === "completed").length;
                    return (
                      <div key={evaluateeId} className="rounded-xl border overflow-hidden" style={{ borderColor: "oklch(0.90 0.006 80)", background: "white" }}>
                        {/* Evaluatee header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "oklch(0.94 0.006 80)", background: "oklch(0.98 0.006 80)" }}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                              style={{ background: "oklch(0.52 0.18 255)" }}>
                              {evaluatee ? `${evaluatee.firstName[0]}${evaluatee.lastName[0]}` : "?"}
                            </div>
                            <div>
                              <p className="font-semibold text-sm" style={{ color: "oklch(0.22 0.012 65)" }}>
                                {evaluatee ? `${evaluatee.firstName} ${evaluatee.lastName}` : `Employee #${evaluateeId}`}
                              </p>
                              <p className="text-xs" style={{ color: "oklch(0.65 0.012 65)" }}>
                                {evaluatee?.position ?? ""} · {evaluatee?.employeeRole === "contractor" ? "Contractor" : "Regular"} · {completedCount}/{evalTasks.length} completed
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{
                              background: completedCount === evalTasks.length ? "oklch(0.92 0.08 145)" : "oklch(0.93 0.04 65)",
                              color: completedCount === evalTasks.length ? "oklch(0.42 0.18 145)" : "oklch(0.52 0.12 65)",
                            }}>
                              {completedCount === evalTasks.length ? "All Done" : `${evalTasks.length - completedCount} pending`}
                            </span>
                          </div>
                        </div>

                        {/* Task rows */}
                        <div className="divide-y" style={{ borderColor: "oklch(0.94 0.006 80)" }}>
                          {evalTasks.map(task => {
                            const evaluator = empMap[task.evaluatorId];
                            const tc = TASK_TYPE_COLORS[task.type as TaskType];
                            return (
                              <div key={task.id} className="flex items-center justify-between px-4 py-2.5 gap-3">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0" style={{ background: tc.bg, color: tc.text }}>
                                    {TASK_TYPE_LABELS[task.type as TaskType]}
                                  </span>
                                  <span className="text-sm truncate" style={{ color: "oklch(0.35 0.012 65)" }}>
                                    {evaluator ? `${evaluator.firstName} ${evaluator.lastName}` : `Employee #${task.evaluatorId}`}
                                    {task.evaluatorId === evaluateeId && <span className="ml-1 text-xs" style={{ color: "oklch(0.65 0.012 65)" }}>(self)</span>}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {task.status === "completed" ? (
                                    <CheckCircle2 size={14} style={{ color: "oklch(0.52 0.18 145)" }} />
                                  ) : task.status === "in-progress" ? (
                                    <Clock size={14} style={{ color: "oklch(0.52 0.12 65)" }} />
                                  ) : (
                                    <AlertCircle size={14} style={{ color: "oklch(0.72 0.006 80)" }} />
                                  )}
                                  <span className="text-xs" style={{ color: "oklch(0.65 0.012 65)" }}>{task.status}</span>
                                  {task.status !== "completed" && (
                                    <button
                                      onClick={() => setDeleteTaskConfirm(task.id)}
                                      className="p-1 rounded hover:bg-red-50 transition-colors"
                                      title="Remove task"
                                    >
                                      <X size={12} style={{ color: "oklch(0.62 0.18 25)" }} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Cycle Create/Edit Modal ─────────────────────────────────────────── */}
      {showCycleForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "oklch(0.90 0.006 80)" }}>
              <h3 className="font-semibold" style={{ color: "oklch(0.22 0.012 65)" }}>
                {editCycleId ? "Edit Cycle" : "New Evaluation Cycle"}
              </h3>
              <button onClick={() => { setShowCycleForm(false); setEditCycleId(null); setCycleForm(emptyCycleForm); }}>
                <X size={18} style={{ color: "oklch(0.55 0.012 65)" }} />
              </button>
            </div>
            <form onSubmit={handleCycleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>
                  Period Label *
                </label>
                <input
                  required
                  value={cycleForm.period}
                  onChange={e => setCycleForm(f => ({ ...f, period: e.target.value }))}
                  placeholder="e.g. H1 2025, Q3 2025, FY2025"
                  className={inputCls} style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Status</label>
                <select
                  value={cycleForm.status}
                  onChange={e => setCycleForm(f => ({ ...f, status: e.target.value as CycleStatus }))}
                  className={inputCls} style={inputStyle}
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Open Date</label>
                  <input
                    type="date"
                    value={cycleForm.openDate}
                    onChange={e => setCycleForm(f => ({ ...f, openDate: e.target.value }))}
                    className={inputCls} style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Close Date</label>
                  <input
                    type="date"
                    value={cycleForm.closeDate}
                    onChange={e => setCycleForm(f => ({ ...f, closeDate: e.target.value }))}
                    className={inputCls} style={inputStyle}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowCycleForm(false); setEditCycleId(null); setCycleForm(emptyCycleForm); }}
                  className="flex-1 py-2.5 rounded-lg text-sm border"
                  style={{ borderColor: "oklch(0.88 0.006 80)", color: "oklch(0.45 0.012 65)" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createCycleMut.isPending || updateCycleMut.isPending}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                  style={{ background: "oklch(0.42 0.18 255)" }}
                >
                  {createCycleMut.isPending || updateCycleMut.isPending ? "Saving..." : editCycleId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Assign Participant Panel ────────────────────────────────────────── */}
      {showAssignPanel && selectedCycle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b flex-shrink-0" style={{ borderColor: "oklch(0.90 0.006 80)" }}>
              <div>
                <h3 className="font-semibold" style={{ color: "oklch(0.22 0.012 65)" }}>Add Participant</h3>
                <p className="text-xs mt-0.5" style={{ color: "oklch(0.65 0.012 65)" }}>{selectedCycle.period}</p>
              </div>
              <button onClick={() => { setShowAssignPanel(false); resetAssignState(); }}>
                <X size={18} style={{ color: "oklch(0.55 0.012 65)" }} />
              </button>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2 px-5 py-3 border-b flex-shrink-0" style={{ borderColor: "oklch(0.94 0.006 80)" }}>
              {(["select_evaluatee", "select_evaluators"] as const).map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  {i > 0 && <ChevronRight size={14} style={{ color: "oklch(0.72 0.006 80)" }} />}
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{
                        background: assignStep === step ? "oklch(0.42 0.18 255)" : assignStep === "select_evaluators" && step === "select_evaluatee" ? "oklch(0.42 0.18 145)" : "oklch(0.90 0.006 80)",
                        color: assignStep === step || (assignStep === "select_evaluators" && step === "select_evaluatee") ? "white" : "oklch(0.55 0.012 65)",
                      }}>
                      {i + 1}
                    </div>
                    <span className="text-xs font-medium" style={{ color: assignStep === step ? "oklch(0.22 0.012 65)" : "oklch(0.65 0.012 65)" }}>
                      {step === "select_evaluatee" ? "Select Evaluatee" : "Assign Evaluators"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Step content */}
            <div className="flex-1 overflow-y-auto p-5">
              {assignStep === "select_evaluatee" && (
                <div className="space-y-2">
                  <p className="text-xs font-medium mb-3" style={{ color: "oklch(0.45 0.012 65)" }}>
                    Choose the employee to be evaluated:
                  </p>
                  {employees.filter(e => e.status === "active").map(emp => {
                    const alreadyAssigned = assignedEvaluateeIds.has(emp.id);
                    const isSelected = selectedEvaluateeId === emp.id;
                    return (
                      <button
                        key={emp.id}
                        disabled={alreadyAssigned}
                        onClick={() => setSelectedEvaluateeId(emp.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                          borderColor: isSelected ? "oklch(0.62 0.18 255)" : "oklch(0.90 0.006 80)",
                          background: isSelected ? "oklch(0.97 0.04 255)" : "white",
                        }}
                      >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: "oklch(0.52 0.18 255)" }}>
                          {emp.firstName[0]}{emp.lastName[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: "oklch(0.22 0.012 65)" }}>
                            {emp.firstName} {emp.lastName}
                          </p>
                          <p className="text-xs truncate" style={{ color: "oklch(0.65 0.012 65)" }}>
                            {emp.position} · {emp.employeeRole === "contractor" ? "Contractor" : "Regular"}
                          </p>
                        </div>
                        {alreadyAssigned && (
                          <span className="text-xs flex-shrink-0" style={{ color: "oklch(0.52 0.18 145)" }}>Already added</span>
                        )}
                        {isSelected && <CheckCircle2 size={16} style={{ color: "oklch(0.52 0.18 255)" }} />}
                      </button>
                    );
                  })}
                </div>
              )}

              {assignStep === "select_evaluators" && selectedEvaluateeId && (() => {
                const evaluatee = empMap[selectedEvaluateeId];
                const isContractor = evaluatee?.employeeRole === "contractor";
                const otherEmployees = employees.filter(e => e.id !== selectedEvaluateeId && e.status === "active");
                const managers = employees.filter(e => e.isManager && e.id !== selectedEvaluateeId && e.status === "active");

                return (
                  <div className="space-y-5">
                    {/* Evaluatee summary */}
                    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "oklch(0.97 0.04 255)" }}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                        style={{ background: "oklch(0.52 0.18 255)" }}>
                        {evaluatee?.firstName[0]}{evaluatee?.lastName[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: "oklch(0.22 0.012 65)" }}>
                          {evaluatee?.firstName} {evaluatee?.lastName}
                        </p>
                        <p className="text-xs" style={{ color: "oklch(0.55 0.012 65)" }}>
                          {isContractor ? "Contractor — No self-evaluation" : evaluatee?.isManager ? "Manager — Self (Manager form)" : "Regular — Self evaluation"}
                        </p>
                      </div>
                    </div>

                    {/* Peer evaluators */}
                    <div>
                      <p className="text-xs font-semibold mb-2" style={{ color: "oklch(0.45 0.012 65)" }}>
                        {isContractor ? "Peer Evaluators (Contractor form)" : "Peer Evaluators"} — select multiple
                      </p>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {otherEmployees.map(emp => {
                          const isSelected = selectedPeerIds.includes(emp.id);
                          return (
                            <button
                              key={emp.id}
                              onClick={() => setSelectedPeerIds(prev =>
                                isSelected ? prev.filter(id => id !== emp.id) : [...prev, emp.id]
                              )}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-all"
                              style={{
                                borderColor: isSelected ? "oklch(0.62 0.18 145)" : "oklch(0.90 0.006 80)",
                                background: isSelected ? "oklch(0.97 0.04 145)" : "white",
                              }}
                            >
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                style={{ background: "oklch(0.62 0.18 145)" }}>
                                {emp.firstName[0]}{emp.lastName[0]}
                              </div>
                              <span className="text-sm flex-1 truncate" style={{ color: "oklch(0.22 0.012 65)" }}>
                                {emp.firstName} {emp.lastName}
                              </span>
                              <span className="text-xs flex-shrink-0" style={{ color: "oklch(0.65 0.012 65)" }}>{emp.position}</span>
                              {isSelected && <CheckCircle2 size={14} style={{ color: "oklch(0.52 0.18 145)" }} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Manager evaluator */}
                    {!isContractor && (
                      <div>
                        <p className="text-xs font-semibold mb-2" style={{ color: "oklch(0.45 0.012 65)" }}>
                          Manager Evaluator — select one (optional)
                        </p>
                        <div className="space-y-1.5">
                          <button
                            onClick={() => setSelectedManagerId(null)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-all"
                            style={{
                              borderColor: selectedManagerId === null ? "oklch(0.62 0.18 30)" : "oklch(0.90 0.006 80)",
                              background: selectedManagerId === null ? "oklch(0.97 0.04 30)" : "white",
                            }}
                          >
                            <span className="text-sm" style={{ color: "oklch(0.55 0.012 65)" }}>— None —</span>
                          </button>
                          {managers.map(mgr => {
                            const isSelected = selectedManagerId === mgr.id;
                            return (
                              <button
                                key={mgr.id}
                                onClick={() => setSelectedManagerId(mgr.id)}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-all"
                                style={{
                                  borderColor: isSelected ? "oklch(0.62 0.18 30)" : "oklch(0.90 0.006 80)",
                                  background: isSelected ? "oklch(0.97 0.04 30)" : "white",
                                }}
                              >
                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                  style={{ background: "oklch(0.52 0.15 30)" }}>
                                  {mgr.firstName[0]}{mgr.lastName[0]}
                                </div>
                                <span className="text-sm flex-1 truncate" style={{ color: "oklch(0.22 0.012 65)" }}>
                                  {mgr.firstName} {mgr.lastName}
                                </span>
                                <span className="text-xs flex-shrink-0" style={{ color: "oklch(0.65 0.012 65)" }}>{mgr.position}</span>
                                {isSelected && <CheckCircle2 size={14} style={{ color: "oklch(0.52 0.15 30)" }} />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Upward Evaluation toggle */}
                    {!isContractor && selectedManagerId && (
                      <div>
                        <p className="text-xs font-semibold mb-2" style={{ color: "oklch(0.45 0.012 65)" }}>
                          Upward Evaluation (optional)
                        </p>
                        <button
                          onClick={() => setIncludeUpward(v => !v)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all"
                          style={{
                            borderColor: includeUpward ? "oklch(0.62 0.18 320)" : "oklch(0.90 0.006 80)",
                            background: includeUpward ? "oklch(0.97 0.04 320)" : "white",
                          }}
                        >
                          <div className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0"
                            style={{ borderColor: includeUpward ? "oklch(0.52 0.18 320)" : "oklch(0.75 0.012 65)", background: includeUpward ? "oklch(0.52 0.18 320)" : "white" }}>
                            {includeUpward && <span className="text-white text-xs font-bold">✓</span>}
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ color: "oklch(0.22 0.012 65)" }}>Include Upward Evaluation</p>
                            <p className="text-xs" style={{ color: "oklch(0.55 0.012 65)" }}>Employee evaluates their manager</p>
                          </div>
                        </button>
                      </div>
                    )}

                    {/* Summary */}
                    <div className="rounded-xl p-3 text-xs space-y-1" style={{ background: "oklch(0.97 0.006 80)" }}>
                      <p className="font-semibold" style={{ color: "oklch(0.35 0.012 65)" }}>Tasks to be created:</p>
                      {!isContractor && <p style={{ color: "oklch(0.55 0.012 65)" }}>• 1 Self evaluation</p>}
                      {selectedPeerIds.length > 0 && <p style={{ color: "oklch(0.55 0.012 65)" }}>• {selectedPeerIds.length} {isContractor ? "Contractor" : "Peer"} evaluation(s)</p>}
                      {selectedManagerId && <p style={{ color: "oklch(0.55 0.012 65)" }}>• 1 Manager evaluation</p>}
                      {includeUpward && selectedManagerId && <p style={{ color: "oklch(0.42 0.18 320)" }}>• 1 Upward evaluation (employee → manager)</p>}
                      {isContractor && selectedPeerIds.length === 0 && <p style={{ color: "oklch(0.72 0.12 25)" }}>⚠ Select at least one peer evaluator</p>}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer buttons */}
            <div className="flex gap-3 p-5 border-t flex-shrink-0" style={{ borderColor: "oklch(0.90 0.006 80)" }}>
              {assignStep === "select_evaluatee" ? (
                <>
                  <button
                    onClick={() => { setShowAssignPanel(false); resetAssignState(); }}
                    className="flex-1 py-2.5 rounded-lg text-sm border"
                    style={{ borderColor: "oklch(0.88 0.006 80)", color: "oklch(0.45 0.012 65)" }}
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!selectedEvaluateeId}
                    onClick={() => setAssignStep("select_evaluators")}
                    className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-40"
                    style={{ background: "oklch(0.42 0.18 255)" }}
                  >
                    Next →
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setAssignStep("select_evaluatee")}
                    className="flex-1 py-2.5 rounded-lg text-sm border"
                    style={{ borderColor: "oklch(0.88 0.006 80)", color: "oklch(0.45 0.012 65)" }}
                  >
                    ← Back
                  </button>
                  <button
                    disabled={bulkCreateTasksMut.isPending || (empMap[selectedEvaluateeId!]?.employeeRole === "contractor" && selectedPeerIds.length === 0)}
                    onClick={handleAssignConfirm}
                    className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-40"
                    style={{ background: "oklch(0.42 0.18 145)" }}
                  >
                    {bulkCreateTasksMut.isPending ? "Assigning..." : "Confirm & Assign"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Cycle Confirm ────────────────────────────────────────────── */}
      {deleteCycleConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
            <Trash2 size={32} className="mx-auto mb-3" style={{ color: "oklch(0.52 0.18 25)" }} />
            <p className="font-semibold mb-1" style={{ color: "oklch(0.22 0.012 65)" }}>Delete Cycle?</p>
            <p className="text-sm mb-4" style={{ color: "oklch(0.55 0.012 65)" }}>
              All evaluation tasks in this cycle will also be deleted. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteCycleConfirm(null)} className="flex-1 py-2 rounded-lg text-sm border" style={{ borderColor: "oklch(0.88 0.006 80)" }}>
                Cancel
              </button>
              <button
                onClick={() => deleteCycleMut.mutate({ id: deleteCycleConfirm })}
                disabled={deleteCycleMut.isPending}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-white"
                style={{ background: "oklch(0.52 0.18 25)" }}
              >
                {deleteCycleMut.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Task Confirm ─────────────────────────────────────────────── */}
      {deleteTaskConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
            <X size={32} className="mx-auto mb-3" style={{ color: "oklch(0.52 0.18 25)" }} />
            <p className="font-semibold mb-1" style={{ color: "oklch(0.22 0.012 65)" }}>Remove Task?</p>
            <p className="text-sm mb-4" style={{ color: "oklch(0.55 0.012 65)" }}>This evaluation task will be removed from the cycle.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTaskConfirm(null)} className="flex-1 py-2 rounded-lg text-sm border" style={{ borderColor: "oklch(0.88 0.006 80)" }}>
                Cancel
              </button>
              <button
                onClick={() => deleteTaskMut.mutate({ id: deleteTaskConfirm })}
                disabled={deleteTaskMut.isPending}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-white"
                style={{ background: "oklch(0.52 0.18 25)" }}
              >
                {deleteTaskMut.isPending ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
