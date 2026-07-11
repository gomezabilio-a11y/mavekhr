/**
 * PeriodicEvaluation.tsx — Periodic Evaluation Tasks
 * Design: Warm Slate — connected to real DB via tRPC
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ClipboardList, CheckCircle2, Clock, AlertCircle,
  ChevronDown, ChevronRight, Send, Lock, User, Users, Briefcase,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type FormType = "self_regular" | "self_manager" | "peer" | "upward_eval" | "contractor";

interface KpiScore {
  kpiId: number;
  score: number;
  comment?: string;
}

// ─── Score Buttons (1~5) ──────────────────────────────────────────────────────
function ScoreButtons({ value, onChange, disabled }: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const labels = ["", "Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"];
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          disabled={disabled}
          onClick={() => onChange(n)}
          title={labels[n]}
          className="w-9 h-9 rounded-lg text-sm font-semibold border transition-all disabled:cursor-not-allowed"
          style={{
            borderColor: value === n ? "oklch(0.52 0.18 255)" : "oklch(0.88 0.006 80)",
            background: value === n ? "oklch(0.42 0.18 255)" : "white",
            color: value === n ? "white" : "oklch(0.45 0.012 65)",
            transform: value === n ? "scale(1.1)" : "scale(1)",
          }}
        >
          {n}
        </button>
      ))}
      {value > 0 && (
        <span className="text-xs ml-1" style={{ color: "oklch(0.55 0.012 65)" }}>
          {labels[value]}
        </span>
      )}
    </div>
  );
}

// ─── KPI Question Row ─────────────────────────────────────────────────────────
function KpiQuestion({ kpi, score, onScore, onComment, disabled }: {
  kpi: { id: number; kpiName: string; question: string };
  score: KpiScore | undefined;
  onScore: (kpiId: number, score: number) => void;
  onComment: (kpiId: number, comment: string) => void;
  disabled?: boolean;
}) {
  const [showComment, setShowComment] = useState(false);

  return (
    <div className="py-3 border-b last:border-0" style={{ borderColor: "oklch(0.93 0.006 80)" }}>
      <div className="flex items-start gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: "oklch(0.93 0.006 80)", color: "oklch(0.45 0.012 65)" }}>
              {kpi.kpiName}
            </span>
            {score?.score ? (
              <CheckCircle2 size={12} style={{ color: "oklch(0.42 0.18 145)" }} />
            ) : (
              <AlertCircle size={12} style={{ color: "oklch(0.72 0.006 80)" }} />
            )}
          </div>
          <p className="text-sm" style={{ color: "oklch(0.32 0.012 65)" }}>{kpi.question}</p>
        </div>
      </div>
      <ScoreButtons value={score?.score ?? 0} onChange={(v) => onScore(kpi.id, v)} disabled={disabled} />
      {!disabled && (
        <button
          onClick={() => setShowComment(s => !s)}
          className="mt-1.5 text-xs flex items-center gap-1"
          style={{ color: "oklch(0.55 0.012 65)" }}
        >
          {showComment ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          Add comment (optional)
        </button>
      )}
      {showComment && !disabled && (
        <textarea
          rows={2}
          value={score?.comment ?? ""}
          onChange={e => onComment(kpi.id, e.target.value)}
          placeholder="Optional comment..."
          className="mt-1.5 w-full px-3 py-2 rounded-lg border text-xs outline-none focus:ring-1"
          style={{ borderColor: "oklch(0.88 0.006 80)", resize: "vertical", color: "oklch(0.32 0.012 65)" }}
        />
      )}
      {disabled && score?.comment && (
        <p className="mt-1 text-xs italic" style={{ color: "oklch(0.55 0.012 65)" }}>{score.comment}</p>
      )}
    </div>
  );
}

// ─── Category Section ─────────────────────────────────────────────────────────
function CategorySection({ cat, scores, onScore, onComment, disabled }: {
  cat: { id: number; title: string; weight: number; purpose: string | null; definition: string | null; kpis: any[] };
  scores: KpiScore[];
  onScore: (kpiId: number, score: number) => void;
  onComment: (kpiId: number, comment: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const answered = cat.kpis.filter(k => scores.find(s => s.kpiId === k.id && s.score > 0)).length;
  const total = cat.kpis.length;

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "oklch(0.88 0.006 80)" }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        style={{ background: "oklch(0.96 0.008 80)" }}
      >
        {open ? <ChevronDown size={14} style={{ color: "oklch(0.55 0.012 65)" }} /> : <ChevronRight size={14} style={{ color: "oklch(0.55 0.012 65)" }} />}
        <span className="flex-1 text-sm font-semibold" style={{ color: "oklch(0.22 0.012 65)" }}>{cat.title}</span>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "oklch(0.92 0.08 255)", color: "oklch(0.32 0.18 255)" }}>
          {cat.weight}%
        </span>
        <span className="text-xs ml-2" style={{ color: answered === total ? "oklch(0.42 0.18 145)" : "oklch(0.65 0.012 65)" }}>
          {answered}/{total}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-2">
          {(cat.purpose || cat.definition) && (
            <div className="py-2 text-xs space-y-1 border-b mb-2" style={{ borderColor: "oklch(0.93 0.006 80)", color: "oklch(0.55 0.012 65)" }}>
              {cat.purpose && <p><span className="font-medium">Purpose:</span> {cat.purpose}</p>}
              {cat.definition && <p><span className="font-medium">Definition:</span> {cat.definition}</p>}
            </div>
          )}
          {cat.kpis.map(kpi => (
            <KpiQuestion
              key={kpi.id}
              kpi={kpi}
              score={scores.find(s => s.kpiId === kpi.id)}
              onScore={onScore}
              onComment={onComment}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Evaluation Form ──────────────────────────────────────────────────────────
function EvaluationForm({ task, formType, evaluateeLabel, cycleCloseDate }: {
  task: { id: number; evaluatorId: number; evaluateeId: number; type: string; status: string };
  formType: FormType;
  evaluateeLabel: string;
  cycleCloseDate?: string | null;
}) {
  const [scores, setScores] = useState<KpiScore[]>([]);
  const [overallComment, setOverallComment] = useState("");
  const [prefilled, setPrefilled] = useState(false);

  // Cycle still open = closeDate is in the future (or not set)
  const cycleIsOpen = !cycleCloseDate || new Date(cycleCloseDate) >= new Date(new Date().toDateString());
  const wasSubmitted = task.status === "completed";
  // Locked = submitted AND cycle is closed
  const isLocked = wasSubmitted && !cycleIsOpen;

  const utils = trpc.useUtils();
  const { data: form, isLoading: formLoading } = trpc.evalForm.getByType.useQuery({ formType });
  // Load existing answers for prefilling (if already submitted)
  const { data: existingResponse, isLoading: responseLoading } = trpc.evalResponse.getWithKpi.useQuery(
    { taskId: task.id },
    { enabled: wasSubmitted }
  );

  // Prefill scores from existing response
  useMemo(() => {
    if (existingResponse && !prefilled) {
      setScores((existingResponse.kpiAnswers as any[]).map((a: any) => ({
        kpiId: a.kpiId,
        score: a.score,
        comment: a.comment ?? undefined,
      })));
      setOverallComment(existingResponse.overallComment ?? "");
      setPrefilled(true);
    }
  }, [existingResponse, prefilled]);

  const submitMutation = trpc.evalResponse.submit.useMutation({
    onSuccess: () => {
      utils.evaluation.myTasks.invalidate();
      toast.success(wasSubmitted ? "Evaluation updated successfully!" : "Evaluation submitted successfully!");
    },
    onError: (e) => toast.error(e.message),
  });

  function handleScore(kpiId: number, score: number) {
    setScores(prev => {
      const existing = prev.find(s => s.kpiId === kpiId);
      if (existing) return prev.map(s => s.kpiId === kpiId ? { ...s, score } : s);
      return [...prev, { kpiId, score }];
    });
  }

  function handleComment(kpiId: number, comment: string) {
    setScores(prev => {
      const existing = prev.find(s => s.kpiId === kpiId);
      if (existing) return prev.map(s => s.kpiId === kpiId ? { ...s, comment } : s);
      return [...prev, { kpiId, score: 0, comment }];
    });
  }

  const allKpis = useMemo(() => {
    if (!form) return [];
    return (form as any).categories.flatMap((c: any) => c.kpis);
  }, [form]);

  const answeredCount = scores.filter(s => s.score > 0).length;
  const totalCount = allKpis.length;
  const isComplete = answeredCount === totalCount && totalCount > 0;
  const progress = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

  function handleSubmit() {
    if (!form || !isComplete) return;
    submitMutation.mutate({
      taskId: task.id,
      formId: (form as any).id,
      evaluatorId: task.evaluatorId,
      evaluateeId: task.evaluateeId,
      overallComment: overallComment || undefined,
      kpiScores: scores.filter(s => s.score > 0),
    });
  }

  if (formLoading || (wasSubmitted && responseLoading)) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "oklch(0.62 0.18 255)" }} />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="text-center py-12">
        <AlertCircle size={28} className="mx-auto mb-2" style={{ color: "oklch(0.72 0.006 80)" }} />
        <p className="text-sm" style={{ color: "oklch(0.55 0.012 65)" }}>
          This evaluation form has not been set up yet. Please contact your HR admin.
        </p>
      </div>
    );
  }

  // Locked: submitted and cycle is closed — read-only view
  if (isLocked) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: "oklch(0.88 0.006 80)", background: "oklch(0.96 0.008 145)" }}>
          <Lock size={14} style={{ color: "oklch(0.42 0.18 145)" }} />
          <p className="text-xs" style={{ color: "oklch(0.42 0.18 145)" }}>
            This evaluation is locked — the evaluation period has ended.
          </p>
        </div>
        {(form as any).categories.map((cat: any) => (
          <CategorySection key={cat.id} cat={cat} scores={scores} onScore={() => {}} onComment={() => {}} disabled={true} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status banner for re-editing */}
      {wasSubmitted && cycleIsOpen && (
        <div className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: "oklch(0.88 0.006 255)", background: "oklch(0.96 0.008 255)" }}>
          <CheckCircle2 size={14} style={{ color: "oklch(0.42 0.18 255)" }} />
          <p className="text-xs" style={{ color: "oklch(0.42 0.18 255)" }}>
            Previously submitted — you can update your answers until the evaluation period ends{cycleCloseDate ? ` (${new Date(cycleCloseDate).toLocaleDateString()})` : ""}.
          </p>
        </div>
      )}

      {/* Progress bar */}
      <div className="rounded-xl p-4 border" style={{ borderColor: "oklch(0.88 0.006 80)", background: "white" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium" style={{ color: "oklch(0.32 0.012 65)" }}>Progress</span>
          <span className="text-sm font-semibold" style={{ color: "oklch(0.42 0.18 255)" }}>{answeredCount}/{totalCount} answered</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "oklch(0.93 0.006 80)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: isComplete ? "oklch(0.52 0.18 145)" : "oklch(0.52 0.18 255)" }}
          />
        </div>
        <p className="text-xs mt-1.5" style={{ color: "oklch(0.65 0.012 65)" }}>
          {isComplete ? "All questions answered — ready to submit!" : `${totalCount - answeredCount} questions remaining`}
        </p>
      </div>

      {/* Category sections */}
      {(form as any).categories.map((cat: any) => (
        <CategorySection
          key={cat.id}
          cat={cat}
          scores={scores}
          onScore={handleScore}
          onComment={handleComment}
          disabled={false}
        />
      ))}

      {/* Overall comment */}
      <div className="rounded-xl border p-4" style={{ borderColor: "oklch(0.88 0.006 80)" }}>
        <label className="block text-sm font-semibold mb-2" style={{ color: "oklch(0.32 0.012 65)" }}>
          Overall Comment (optional)
        </label>
        <textarea
          rows={3}
          value={overallComment}
          onChange={e => setOverallComment(e.target.value)}
          placeholder="Any additional comments or feedback..."
          className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-1"
          style={{ borderColor: "oklch(0.88 0.006 80)", resize: "vertical", color: "oklch(0.32 0.012 65)" }}
        />
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ borderColor: "oklch(0.88 0.006 80)", background: "oklch(0.98 0.004 80)" }}>
        <AlertCircle size={14} style={{ color: "oklch(0.52 0.12 65)" }} />
        <p className="text-xs flex-1" style={{ color: "oklch(0.55 0.012 65)" }}>
          {wasSubmitted
            ? "You can update your answers until the evaluation period ends."
            : "Please review your answers before submitting."}
        </p>
        <button
          onClick={handleSubmit}
          disabled={!isComplete || submitMutation.isPending}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-all"
          style={{ background: isComplete ? "oklch(0.42 0.18 255)" : "oklch(0.72 0.006 80)" }}
        >
          <Send size={14} />
          {submitMutation.isPending ? "Saving..." : wasSubmitted ? "Update Evaluation" : "Submit Evaluation"}
        </button>
      </div>
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────
function TaskCard({ task, employees, onSelect, isSelected }: {
  task: any;
  employees: any[];
  onSelect: () => void;
  isSelected: boolean;
}) {
  const evaluatee = employees.find((e: any) => e.id === task.evaluateeId);
  const typeLabels: Record<string, string> = {
    self: "Self Evaluation",
    peer: "Peer Evaluation",
    manager: "Manager Evaluation",
    contractor: "Contractor Evaluation",
    upward: "Upward Evaluation",
  };
  const typeColors: Record<string, string> = {
    self: "oklch(0.42 0.18 255)",
    peer: "oklch(0.52 0.15 65)",
    manager: "oklch(0.42 0.15 25)",
    contractor: "oklch(0.42 0.15 300)",
    upward: "oklch(0.42 0.18 320)",
  };
  const typeIcons: Record<string, React.ReactNode> = {
    self: <User size={13} />,
    peer: <Users size={13} />,
    manager: <Briefcase size={13} />,
    contractor: <ClipboardList size={13} />,
    upward: <Users size={13} />,
  };
  const color = typeColors[task.type] ?? "oklch(0.55 0.012 65)";

  return (
    <button
      onClick={onSelect}
      className="w-full text-left rounded-xl border p-3 transition-all"
      style={{
        borderColor: isSelected ? color : "oklch(0.90 0.006 80)",
        background: isSelected ? "white" : "oklch(0.98 0.004 80)",
        boxShadow: isSelected ? `0 0 0 2px ${color}22` : "none",
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded font-semibold" style={{ background: `${color}22`, color }}>
          {typeIcons[task.type]}
          {typeLabels[task.type] ?? task.type}
        </span>
        {task.status === "completed" ? (
          <CheckCircle2 size={12} style={{ color: "oklch(0.42 0.18 145)" }} />
        ) : (
          <Clock size={12} style={{ color: "oklch(0.52 0.12 65)" }} />
        )}
      </div>
      <p className="text-sm font-semibold" style={{ color: "oklch(0.22 0.012 65)" }}>
        {task.type === "self" ? "Myself" : task.type === "upward" ? (evaluatee ? `${evaluatee.firstName} ${evaluatee.lastName} (Manager)` : `Employee #${task.evaluateeId}`) : evaluatee ? `${evaluatee.firstName} ${evaluatee.lastName}` : `Employee #${task.evaluateeId}`}
      </p>
      <p className="text-xs mt-0.5" style={{ color: "oklch(0.65 0.012 65)" }}>
        {task.status === "completed" ? "Submitted" : task.status === "in-progress" ? "In Progress" : "Pending"}
      </p>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PeriodicEvaluation() {
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  const { data: myEmployee } = trpc.employee.me.useQuery();
  const { data: allEmployees = [] } = trpc.employee.list.useQuery();
  const { data: cycles = [] } = trpc.evaluation.cycles.useQuery();
  const { data: myTasks = [], isLoading: tasksLoading } = trpc.evaluation.myTasks.useQuery(
    { employeeId: myEmployee?.id ?? 0 },
    { enabled: !!myEmployee?.id }
  );

  const activeCycle = (cycles as any[]).find(c => c.status === "open");
  const selectedTask = (myTasks as any[]).find((t: any) => t.id === selectedTaskId);

  function getFormType(task: any): FormType {
    if (task.type === "self") return myEmployee?.isManager ? "self_manager" : "self_regular";
    if (task.type === "peer") return "peer";
    if (task.type === "manager") return "peer"; // manager eval uses peer form
    if (task.type === "contractor") return "contractor";
    if (task.type === "upward") return "upward_eval" as FormType; // upward eval has its own form
    return "peer";
  }

  function getEvaluateeLabel(task: any) {
    if (task.type === "self") return "myself";
    const emp = (allEmployees as any[]).find((e: any) => e.id === task.evaluateeId);
    const name = emp ? `${emp.firstName} ${emp.lastName}` : `Employee #${task.evaluateeId}`;
    return task.type === "upward" ? `${name} (Manager)` : name;
  }

  const pendingCount = (myTasks as any[]).filter((t: any) => t.status !== "completed").length;
  const completedCount = (myTasks as any[]).filter((t: any) => t.status === "completed").length;

  // No employee profile linked yet
  if (!myEmployee && !tasksLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
            Periodic Evaluation
          </h1>
          <p className="text-sm mt-1" style={{ color: "oklch(0.55 0.012 65)" }}>Complete your assigned evaluations</p>
        </div>
        <div className="rounded-xl border p-10 text-center" style={{ borderColor: "oklch(0.88 0.006 80)" }}>
          <ClipboardList size={36} className="mx-auto mb-3" style={{ color: "oklch(0.82 0.006 80)" }} />
          <p className="font-semibold" style={{ color: "oklch(0.45 0.012 65)" }}>No employee profile linked</p>
          <p className="text-sm mt-1" style={{ color: "oklch(0.65 0.012 65)" }}>
            Your account hasn't been linked to an employee record yet. Please contact your HR administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 flex gap-6 h-full">
      {/* Left: task list */}
      <div className="w-72 flex-shrink-0 space-y-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
            Periodic Evaluation
          </h1>
          {activeCycle ? (
            <p className="text-xs mt-0.5" style={{ color: "oklch(0.55 0.012 65)" }}>
              Period: <strong>{activeCycle.period}</strong>
            </p>
          ) : (
            <p className="text-xs mt-0.5" style={{ color: "oklch(0.65 0.012 65)" }}>No active evaluation cycle</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl p-3 border" style={{ borderColor: "oklch(0.88 0.006 80)", background: "white" }}>
            <p className="text-2xl font-bold" style={{ color: "oklch(0.52 0.12 65)" }}>{pendingCount}</p>
            <p className="text-xs" style={{ color: "oklch(0.65 0.012 65)" }}>Pending</p>
          </div>
          <div className="rounded-xl p-3 border" style={{ borderColor: "oklch(0.88 0.006 80)", background: "white" }}>
            <p className="text-2xl font-bold" style={{ color: "oklch(0.42 0.18 145)" }}>{completedCount}</p>
            <p className="text-xs" style={{ color: "oklch(0.65 0.012 65)" }}>Completed</p>
          </div>
        </div>

        {/* Task list */}
        {tasksLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "oklch(0.62 0.18 255)" }} />
          </div>
        ) : (myTasks as any[]).length === 0 ? (
          <div className="text-center py-8 rounded-xl border border-dashed" style={{ borderColor: "oklch(0.85 0.006 80)" }}>
            <CheckCircle2 size={24} className="mx-auto mb-2" style={{ color: "oklch(0.82 0.006 80)" }} />
            <p className="text-xs" style={{ color: "oklch(0.65 0.012 65)" }}>No evaluations assigned yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(myTasks as any[]).map((task: any) => (
              <TaskCard
                key={task.id}
                task={task}
                employees={allEmployees as any[]}
                onSelect={() => setSelectedTaskId(task.id)}
                isSelected={selectedTaskId === task.id}
              />
            ))}
          </div>
        )}

        {/* Contractor note */}
        {myEmployee?.employmentType === "contract" && (
          <div className="rounded-xl p-3 border" style={{ borderColor: "oklch(0.88 0.006 80)", background: "oklch(0.96 0.008 300)" }}>
            <p className="text-xs font-semibold" style={{ color: "oklch(0.42 0.15 300)" }}>Contractor Account</p>
            <p className="text-xs mt-0.5" style={{ color: "oklch(0.55 0.012 65)" }}>
              As a contractor, you are evaluated by peers only. Self-evaluation is not required.
            </p>
          </div>
        )}
      </div>

      {/* Right: form */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        {!selectedTask ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <ClipboardList size={40} className="mb-3" style={{ color: "oklch(0.82 0.006 80)" }} />
            <p className="font-semibold" style={{ color: "oklch(0.45 0.012 65)" }}>Select an evaluation to begin</p>
            <p className="text-sm mt-1" style={{ color: "oklch(0.65 0.012 65)" }}>
              Choose a task from the left panel to start filling out the evaluation form.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3 pb-3 border-b" style={{ borderColor: "oklch(0.90 0.006 80)" }}>
              <div className="flex-1">
                <p className="text-xs" style={{ color: "oklch(0.55 0.012 65)" }}>Evaluating</p>
                <h2 className="text-lg font-bold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
                  {getEvaluateeLabel(selectedTask)}
                </h2>
              </div>
              {selectedTask.status === "completed" && (() => {
                const closeDate = (selectedTask as any).cycleCloseDate;
                const cycleOpen = !closeDate || new Date(closeDate) >= new Date(new Date().toDateString());
                return (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: cycleOpen ? "oklch(0.92 0.08 255)" : "oklch(0.92 0.08 145)" }}>
                    {cycleOpen ? <CheckCircle2 size={12} style={{ color: "oklch(0.42 0.18 255)" }} /> : <Lock size={12} style={{ color: "oklch(0.42 0.18 145)" }} />}
                    <span className="text-xs font-medium" style={{ color: cycleOpen ? "oklch(0.32 0.18 255)" : "oklch(0.32 0.18 145)" }}>
                      {cycleOpen ? "Submitted (editable)" : "Submitted"}
                    </span>
                  </div>
                );
              })()}
            </div>

            <EvaluationForm
              task={selectedTask}
              formType={getFormType(selectedTask)}
              evaluateeLabel={getEvaluateeLabel(selectedTask)}
              cycleCloseDate={(selectedTask as any).cycleCloseDate}
            />
          </div>
        )}
      </div>
    </div>
  );
}
