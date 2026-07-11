import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Plus, Trash2, ChevronDown, ChevronRight, Edit2, Save, X,
  ClipboardList, CheckCircle2, AlertCircle, GripVertical,
  FileText, Users, UserCheck, Briefcase, User, ToggleLeft, ToggleRight
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
type FormType = "self_regular" | "self_manager" | "peer" | "manager_eval" | "contractor" | "upward_eval";

const FORM_TYPES: {
  type: FormType;
  label: string;
  badge: string;
  description: string;
  who: string;
  color: string;
  icon: React.ReactNode;
}[] = [
  {
    type: "self_regular",
    label: "Self Evaluation",
    badge: "Regular Employee",
    description: "직원이 스스로 작성하는 자기평가 폼",
    who: "Evaluator: Self",
    color: "oklch(0.42 0.18 255)",
    icon: <User size={16} />,
  },
  {
    type: "self_manager",
    label: "Self Evaluation",
    badge: "Manager",
    description: "매니저가 스스로 작성하는 자기평가 폼",
    who: "Evaluator: Self (Manager)",
    color: "oklch(0.38 0.18 145)",
    icon: <UserCheck size={16} />,
  },
  {
    type: "peer",
    label: "Peer Evaluation",
    badge: "Peer",
    description: "동료가 작성하는 피어 평가 폼",
    who: "Evaluator: Peer → Employee",
    color: "oklch(0.52 0.15 65)",
    icon: <Users size={16} />,
  },
  {
    type: "manager_eval",
    label: "Manager Evaluation",
    badge: "Manager → Employee",
    description: "매니저가 직속 부하를 평가하는 폼",
    who: "Evaluator: Manager → Direct Report",
    color: "oklch(0.42 0.15 25)",
    icon: <UserCheck size={16} />,
  },
  {
    type: "contractor",
    label: "Contractor Evaluation",
    badge: "Contractor",
    description: "Contractor를 평가하는 피어 평가 폼 (자기평가 없음)",
    who: "Evaluator: Peer → Contractor",
    color: "oklch(0.42 0.15 300)",
    icon: <Briefcase size={16} />,
  },
  {
    type: "upward_eval",
    label: "Upward Evaluation",
    badge: "Employee → Manager",
    description: "직원이 자신의 매니저를 평가하는 상향 평가 폼",
    who: "Evaluator: Employee → Manager",
    color: "oklch(0.38 0.18 320)",
    icon: <UserCheck size={16} />,
  },
];

const inputCls = "w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-blue-200 transition-all";
const inputStyle = {
  borderColor: "oklch(0.88 0.006 80)",
  background: "white",
  color: "oklch(0.22 0.012 65)",
};

// ─── KPI Row ──────────────────────────────────────────────────────────────────
function KpiRow({
  kpi,
  onUpdate,
  onDelete,
}: {
  kpi: { id: number; kpiName: string; question: string; sortOrder: number };
  onUpdate: (id: number, data: { kpiName?: string; question?: string }) => void;
  onDelete: (id: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(kpi.kpiName);
  const [question, setQuestion] = useState(kpi.question);

  function save() {
    if (!name.trim() || !question.trim()) {
      toast.error("KPI name and question are required");
      return;
    }
    onUpdate(kpi.id, { kpiName: name.trim(), question: question.trim() });
    setEditing(false);
  }

  function cancel() {
    setName(kpi.kpiName);
    setQuestion(kpi.question);
    setEditing(false);
  }

  if (editing) {
    return (
      <div
        className="rounded-lg border p-3 space-y-2"
        style={{ borderColor: "oklch(0.78 0.10 255)", background: "oklch(0.97 0.01 255)" }}
      >
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: "oklch(0.42 0.18 255)" }}>
            KPI Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Honesty & Transparency"
            className={inputCls}
            style={inputStyle}
            autoFocus
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: "oklch(0.42 0.18 255)" }}>
            Question (1–5 scale)
          </label>
          <textarea
            rows={2}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Did you communicate facts accurately and openly share information?"
            className={inputCls}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={save}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
            style={{ background: "oklch(0.42 0.18 255)" }}
          >
            <Save size={12} /> Save
          </button>
          <button
            onClick={cancel}
            className="px-3 py-1.5 rounded-lg text-xs border"
            style={{ borderColor: "oklch(0.88 0.006 80)", color: "oklch(0.55 0.012 65)" }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 py-2 px-3 rounded-lg group hover:bg-slate-50 transition-colors">
      <GripVertical size={14} className="mt-0.5 flex-shrink-0" style={{ color: "oklch(0.78 0.006 80)" }} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold" style={{ color: "oklch(0.30 0.012 65)" }}>
          {kpi.kpiName}
        </p>
        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "oklch(0.55 0.012 65)" }}>
          {kpi.question}
        </p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
        <button
          onClick={() => setEditing(true)}
          className="p-1.5 rounded-lg hover:bg-blue-100 transition-colors"
          title="Edit KPI"
        >
          <Edit2 size={12} style={{ color: "oklch(0.42 0.18 255)" }} />
        </button>
        <button
          onClick={() => onDelete(kpi.id)}
          className="p-1.5 rounded-lg hover:bg-red-100 transition-colors"
          title="Delete KPI"
        >
          <Trash2 size={12} style={{ color: "oklch(0.52 0.18 25)" }} />
        </button>
      </div>
    </div>
  );
}

// ─── New KPI Form ─────────────────────────────────────────────────────────────
function NewKpiForm({
  onAdd,
  onCancel,
  isPending,
}: {
  onAdd: (name: string, question: string) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [name, setName] = useState("");
  const [question, setQuestion] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className="rounded-lg border p-3 space-y-2"
      style={{ borderColor: "oklch(0.82 0.006 80)", background: "oklch(0.985 0.004 80)" }}
    >
      <p className="text-xs font-semibold" style={{ color: "oklch(0.35 0.012 65)" }}>
        New KPI
      </p>
      <input
        ref={nameRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="KPI Name (e.g. Honesty & Transparency)"
        className={inputCls}
        style={inputStyle}
        autoFocus
      />
      <textarea
        rows={2}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Question text shown to evaluators (answered 1–5)"
        className={inputCls}
        style={{ ...inputStyle, resize: "vertical" }}
      />
      <div className="flex gap-2">
        <button
          onClick={() => {
            if (!name.trim() || !question.trim()) {
              toast.error("Both KPI name and question are required");
              return;
            }
            onAdd(name.trim(), question.trim());
          }}
          disabled={isPending}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
          style={{ background: "oklch(0.42 0.18 255)" }}
        >
          <Plus size={12} /> Add KPI
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg text-xs border"
          style={{ borderColor: "oklch(0.88 0.006 80)", color: "oklch(0.55 0.012 65)" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Category Block ───────────────────────────────────────────────────────────
function CategoryBlock({
  cat,
  index,
  formId,
  accentColor,
}: {
  cat: {
    id: number;
    title: string;
    weight: number;
    purpose: string | null;
    definition: string | null;
    kpis: any[];
  };
  index: number;
  formId: number;
  accentColor: string;
}) {
  const [open, setOpen] = useState(true);
  const [editingMeta, setEditingMeta] = useState(false);
  const [addingKpi, setAddingKpi] = useState(false);

  // Edit state
  const [editTitle, setEditTitle] = useState(cat.title);
  const [editWeight, setEditWeight] = useState(cat.weight.toString());
  const [editPurpose, setEditPurpose] = useState(cat.purpose ?? "");
  const [editDefinition, setEditDefinition] = useState(cat.definition ?? "");
  // Toggle for purpose & definition section
  const [showPurposeDef, setShowPurposeDef] = useState(!!(cat.purpose || cat.definition));

  const utils = trpc.useUtils();

  const updateCat = trpc.formCategory.update.useMutation({
    onSuccess: () => {
      utils.evalForm.getWithContent.invalidate();
      setEditingMeta(false);
      toast.success("Category updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteCat = trpc.formCategory.delete.useMutation({
    onSuccess: () => {
      utils.evalForm.getWithContent.invalidate();
      toast.success("Category deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const createKpi = trpc.formKpi.create.useMutation({
    onSuccess: () => {
      utils.evalForm.getWithContent.invalidate();
      setAddingKpi(false);
      toast.success("KPI added");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateKpi = trpc.formKpi.update.useMutation({
    onSuccess: () => {
      utils.evalForm.getWithContent.invalidate();
      toast.success("KPI updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteKpi = trpc.formKpi.delete.useMutation({
    onSuccess: () => {
      utils.evalForm.getWithContent.invalidate();
      toast.success("KPI deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  function saveMeta() {
    const w = parseInt(editWeight) || 0;
    if (!editTitle.trim()) { toast.error("Category title is required"); return; }
    updateCat.mutate({
      id: cat.id,
      title: editTitle.trim(),
      weight: w,
      purpose: editPurpose.trim() || undefined,
      definition: editDefinition.trim() || undefined,
    });
  }

  function cancelMeta() {
    setEditTitle(cat.title);
    setEditWeight(cat.weight.toString());
    setEditPurpose(cat.purpose ?? "");
    setEditDefinition(cat.definition ?? "");
    setEditingMeta(false);
  }

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: "oklch(0.88 0.006 80)" }}
    >
      {/* Category header */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ background: "oklch(0.965 0.006 80)" }}
      >
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex-shrink-0 p-0.5 rounded hover:bg-white/60 transition-colors"
        >
          {open ? (
            <ChevronDown size={15} style={{ color: "oklch(0.55 0.012 65)" }} />
          ) : (
            <ChevronRight size={15} style={{ color: "oklch(0.55 0.012 65)" }} />
          )}
        </button>

        {/* Index badge */}
        <span
          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ background: accentColor }}
        >
          {index + 1}
        </span>

        {editingMeta ? (
          <div className="flex-1 flex items-center gap-2">
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Category title"
              className="flex-1 px-2 py-1 rounded border text-sm"
              style={{ borderColor: "oklch(0.85 0.006 80)", background: "white" }}
              autoFocus
            />
            <input
              type="number"
              min={0}
              max={100}
              value={editWeight}
              onChange={(e) => setEditWeight(e.target.value)}
              placeholder="%"
              className="w-20 px-2 py-1 rounded border text-sm text-center"
              style={{ borderColor: "oklch(0.85 0.006 80)", background: "white" }}
            />
            <span className="text-xs" style={{ color: "oklch(0.55 0.012 65)" }}>%</span>
            <button
              onClick={saveMeta}
              disabled={updateCat.isPending}
              className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
              style={{ background: "oklch(0.38 0.18 145)" }}
            >
              <Save size={11} /> Save
            </button>
            <button
              onClick={cancelMeta}
              className="px-2 py-1 rounded-lg text-xs border"
              style={{ borderColor: "oklch(0.88 0.006 80)", color: "oklch(0.55 0.012 65)" }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <span className="flex-1 text-sm font-semibold" style={{ color: "oklch(0.22 0.012 65)" }}>
              {cat.title}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: `${accentColor}22`, color: accentColor }}
            >
              {cat.weight}%
            </span>
            <span className="text-xs" style={{ color: "oklch(0.65 0.012 65)" }}>
              {cat.kpis.length} KPI{cat.kpis.length !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setEditingMeta(true)}
                className="p-1.5 rounded-lg hover:bg-white transition-colors"
                title="Edit category"
              >
                <Edit2 size={13} style={{ color: "oklch(0.42 0.18 255)" }} />
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete category "${cat.title}" and all its KPIs?`)) {
                    deleteCat.mutate({ id: cat.id });
                  }
                }}
                className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                title="Delete category"
              >
                <Trash2 size={13} style={{ color: "oklch(0.52 0.18 25)" }} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Category body */}
      {open && (
        <div className="p-4 space-y-4">
          {/* Purpose & Definition toggle */}
          {editingMeta ? (
            <div className="space-y-3">
              {/* Toggle button */}
              <button
                type="button"
                onClick={() => {
                  setShowPurposeDef(v => !v);
                  if (showPurposeDef) { setEditPurpose(""); setEditDefinition(""); }
                }}
                className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                style={{
                  background: showPurposeDef ? "oklch(0.92 0.08 255)" : "oklch(0.93 0.006 80)",
                  color: showPurposeDef ? "oklch(0.32 0.18 255)" : "oklch(0.55 0.012 65)",
                  border: `1px solid ${showPurposeDef ? "oklch(0.72 0.18 255)" : "oklch(0.82 0.006 80)"}`,
                }}
              >
                {showPurposeDef
                  ? <ToggleRight size={15} />
                  : <ToggleLeft size={15} />}
                Purpose & Definition
                <span className="ml-1 font-normal" style={{ opacity: 0.7 }}>
                  {showPurposeDef ? "ON" : "OFF"}
                </span>
              </button>

              {/* Fields — only shown when toggle is ON */}
              {showPurposeDef && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>
                      a. Purpose
                    </label>
                    <textarea
                      rows={3}
                      value={editPurpose}
                      onChange={(e) => setEditPurpose(e.target.value)}
                      placeholder="To build trust by ensuring..."
                      className={inputCls}
                      style={{ ...inputStyle, resize: "vertical" }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>
                      b. Definition
                    </label>
                    <textarea
                      rows={3}
                      value={editDefinition}
                      onChange={(e) => setEditDefinition(e.target.value)}
                      placeholder="Acts with honesty, transparency..."
                      className={inputCls}
                      style={{ ...inputStyle, resize: "vertical" }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            (cat.purpose || cat.definition) && (
              <div
                className="grid grid-cols-2 gap-3 p-3 rounded-lg text-xs"
                style={{ background: "oklch(0.975 0.004 80)", color: "oklch(0.45 0.012 65)" }}
              >
                {cat.purpose && (
                  <div>
                    <p className="font-semibold mb-0.5" style={{ color: "oklch(0.35 0.012 65)" }}>
                      a. Purpose
                    </p>
                    <p className="leading-relaxed">{cat.purpose}</p>
                  </div>
                )}
                {cat.definition && (
                  <div>
                    <p className="font-semibold mb-0.5" style={{ color: "oklch(0.35 0.012 65)" }}>
                      b. Definition
                    </p>
                    <p className="leading-relaxed">{cat.definition}</p>
                  </div>
                )}
              </div>
            )
          )}

          {/* KPIs */}
          <div>
            <p
              className="text-xs font-bold uppercase tracking-wider mb-2"
              style={{ color: "oklch(0.55 0.012 65)" }}
            >
              c. KPIs &nbsp;
              <span style={{ color: "oklch(0.72 0.006 80)", fontWeight: 400, textTransform: "none" }}>
                (rated 1–5 by evaluator)
              </span>
            </p>

            {cat.kpis.length === 0 && !addingKpi && (
              <div
                className="text-center py-4 rounded-lg border border-dashed text-xs"
                style={{ borderColor: "oklch(0.88 0.006 80)", color: "oklch(0.72 0.006 80)" }}
              >
                No KPIs yet — add one below
              </div>
            )}

            <div className="space-y-1">
              {cat.kpis.map((kpi) => (
                <KpiRow
                  key={kpi.id}
                  kpi={kpi}
                  onUpdate={(id, data) => updateKpi.mutate({ id, ...data })}
                  onDelete={(id) => {
                    if (confirm("Delete this KPI?")) deleteKpi.mutate({ id });
                  }}
                />
              ))}
            </div>

            {addingKpi ? (
              <div className="mt-2">
                <NewKpiForm
                  isPending={createKpi.isPending}
                  onAdd={(name, question) =>
                    createKpi.mutate({
                      categoryId: cat.id,
                      kpiName: name,
                      question,
                      sortOrder: cat.kpis.length,
                    })
                  }
                  onCancel={() => setAddingKpi(false)}
                />
              </div>
            ) : (
              <button
                onClick={() => setAddingKpi(true)}
                className="mt-2 flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-dashed transition-colors hover:bg-blue-50/50 w-full justify-center"
                style={{ borderColor: "oklch(0.75 0.08 255)", color: "oklch(0.42 0.18 255)" }}
              >
                <Plus size={13} /> Add KPI
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Form Editor (right panel) ────────────────────────────────────────────────
function FormEditor({ formId, accentColor }: { formId: number; accentColor: string }) {
  const [addingCat, setAddingCat] = useState(false);
  const [catTitle, setCatTitle] = useState("");
  const [catWeight, setCatWeight] = useState("");
  const [catPurpose, setCatPurpose] = useState("");
  const [catDefinition, setCatDefinition] = useState("");
  const [showNewPurposeDef, setShowNewPurposeDef] = useState(false);

  const utils = trpc.useUtils();
  const { data: form, isLoading } = trpc.evalForm.getWithContent.useQuery({ formId });

  const createCat = trpc.formCategory.create.useMutation({
    onSuccess: () => {
      utils.evalForm.getWithContent.invalidate();
      setAddingCat(false);
      setCatTitle("");
      setCatWeight("");
      setCatPurpose("");
      setCatDefinition("");
      toast.success("Category added");
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div
          className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: accentColor }}
        />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle size={32} className="mb-3" style={{ color: "oklch(0.72 0.006 80)" }} />
        <p className="font-semibold" style={{ color: "oklch(0.45 0.012 65)" }}>
          Form not found
        </p>
      </div>
    );
  }

  const totalWeight = form.categories.reduce((sum, c) => sum + c.weight, 0);
  const weightOk = totalWeight === 100;

  return (
    <div className="space-y-4">
      {/* Weight indicator */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{
          background: weightOk ? "oklch(0.93 0.07 145)" : totalWeight > 100 ? "oklch(0.93 0.07 25)" : "oklch(0.95 0.05 65)",
        }}
      >
        {weightOk ? (
          <CheckCircle2 size={16} style={{ color: "oklch(0.38 0.18 145)" }} />
        ) : (
          <AlertCircle size={16} style={{ color: totalWeight > 100 ? "oklch(0.52 0.18 25)" : "oklch(0.52 0.12 65)" }} />
        )}
        <div className="flex-1">
          <span
            className="text-sm font-semibold"
            style={{
              color: weightOk ? "oklch(0.28 0.18 145)" : totalWeight > 100 ? "oklch(0.38 0.18 25)" : "oklch(0.38 0.12 65)",
            }}
          >
            Total weight: {totalWeight}%
          </span>
          {!weightOk && (
            <span className="text-xs ml-2" style={{ color: "oklch(0.55 0.012 65)" }}>
              {totalWeight > 100 ? `(${totalWeight - 100}% over)` : `(${100 - totalWeight}% remaining)`}
            </span>
          )}
        </div>
        {/* Weight bar */}
        <div className="w-32 h-2 rounded-full overflow-hidden" style={{ background: "oklch(0.88 0.006 80)" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(totalWeight, 100)}%`,
              background: weightOk ? "oklch(0.52 0.18 145)" : totalWeight > 100 ? "oklch(0.62 0.18 25)" : "oklch(0.62 0.12 65)",
            }}
          />
        </div>
        <span className="text-xs font-mono" style={{ color: "oklch(0.45 0.012 65)" }}>
          {totalWeight}/100
        </span>
      </div>

      {/* Categories */}
      {form.categories.length === 0 && !addingCat && (
        <div
          className="text-center py-12 rounded-xl border-2 border-dashed"
          style={{ borderColor: "oklch(0.88 0.006 80)" }}
        >
          <ClipboardList size={32} className="mx-auto mb-3" style={{ color: "oklch(0.82 0.006 80)" }} />
          <p className="font-semibold" style={{ color: "oklch(0.55 0.012 65)" }}>
            No categories yet
          </p>
          <p className="text-sm mt-1" style={{ color: "oklch(0.72 0.006 80)" }}>
            Add a category (e.g. "1 Integrity (10%)") to get started
          </p>
        </div>
      )}

      {form.categories.map((cat, i) => (
        <CategoryBlock key={cat.id} cat={cat} index={i} formId={formId} accentColor={accentColor} />
      ))}

      {/* Add Category form */}
      {addingCat ? (
        <div
          className="rounded-xl border-2 p-5 space-y-4"
          style={{ borderColor: accentColor + "55", background: "oklch(0.985 0.004 80)" }}
        >
          <p className="text-sm font-bold" style={{ color: "oklch(0.22 0.012 65)" }}>
            New Category
          </p>
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-3">
              <label className="block text-xs font-semibold mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>
                Title *
              </label>
              <input
                value={catTitle}
                onChange={(e) => setCatTitle(e.target.value)}
                placeholder="e.g. 1 Integrity"
                className={inputCls}
                style={inputStyle}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>
                Weight (%) *
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={catWeight}
                onChange={(e) => setCatWeight(e.target.value)}
                placeholder="10"
                className={inputCls}
                style={inputStyle}
              />
            </div>
          </div>
          {/* Purpose & Definition toggle */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                setShowNewPurposeDef(v => !v);
                if (showNewPurposeDef) { setCatPurpose(""); setCatDefinition(""); }
              }}
              className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              style={{
                background: showNewPurposeDef ? "oklch(0.92 0.08 255)" : "oklch(0.93 0.006 80)",
                color: showNewPurposeDef ? "oklch(0.32 0.18 255)" : "oklch(0.55 0.012 65)",
                border: `1px solid ${showNewPurposeDef ? "oklch(0.72 0.18 255)" : "oklch(0.82 0.006 80)"}`,
              }}
            >
              {showNewPurposeDef ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
              Purpose & Definition
              <span className="ml-1 font-normal" style={{ opacity: 0.7 }}>
                {showNewPurposeDef ? "ON" : "OFF"}
              </span>
            </button>
            {showNewPurposeDef && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>
                    a. Purpose
                  </label>
                  <textarea
                    rows={3}
                    value={catPurpose}
                    onChange={(e) => setCatPurpose(e.target.value)}
                    placeholder="To build trust by ensuring that every employee consistently demonstrates..."
                    className={inputCls}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>
                    b. Definition
                  </label>
                  <textarea
                    rows={3}
                    value={catDefinition}
                    onChange={(e) => setCatDefinition(e.target.value)}
                    placeholder="Acts with honesty, transparency, accountability, and professionalism..."
                    className={inputCls}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (!catTitle.trim() || !catWeight) {
                  toast.error("Title and weight are required");
                  return;
                }
                createCat.mutate({
                  formId,
                  title: catTitle.trim(),
                  weight: parseInt(catWeight) || 0,
                  purpose: catPurpose.trim() || undefined,
                  definition: catDefinition.trim() || undefined,
                  sortOrder: form.categories.length,
                });
              }}
              disabled={createCat.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: accentColor }}
            >
              <Plus size={15} /> Add Category
            </button>
            <button
              onClick={() => {
                setAddingCat(false);
                setCatTitle("");
                setCatWeight("");
                setCatPurpose("");
                setCatDefinition("");
              }}
              className="px-4 py-2 rounded-lg text-sm border"
              style={{ borderColor: "oklch(0.88 0.006 80)", color: "oklch(0.45 0.012 65)" }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAddingCat(true)}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-dashed text-sm font-medium transition-colors hover:bg-blue-50/30"
          style={{ borderColor: accentColor + "88", color: accentColor }}
        >
          <Plus size={16} /> Add Category
        </button>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminEvalForms() {
  const [selectedType, setSelectedType] = useState<FormType | null>(null);
  const utils = trpc.useUtils();

  const { data: forms = [], isLoading } = trpc.evalForm.listAll.useQuery();

  const upsertForm = trpc.evalForm.upsert.useMutation({
    onSuccess: () => {
      utils.evalForm.listAll.invalidate();
      toast.success("Form initialized — you can now add categories and KPIs");
    },
    onError: (e) => toast.error(e.message),
  });

  function getFormForType(type: FormType) {
    return forms.find((f) => f.formType === type);
  }

  const selectedForm = selectedType ? getFormForType(selectedType) : null;
  const selectedMeta = FORM_TYPES.find((f) => f.type === selectedType);

  return (
    <div className="flex h-full" style={{ minHeight: 0 }}>
      {/* ── Left panel: form type list ── */}
      <div
        className="w-72 flex-shrink-0 flex flex-col border-r overflow-y-auto"
        style={{ borderColor: "oklch(0.90 0.006 80)", background: "oklch(0.975 0.004 80)" }}
      >
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <FileText size={18} style={{ color: "oklch(0.42 0.18 255)" }} />
            <h2 className="text-base font-bold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
              Evaluation Forms
            </h2>
          </div>
          <p className="text-xs" style={{ color: "oklch(0.60 0.012 65)" }}>
            5 form templates — click to edit
          </p>
        </div>

        <div className="px-3 pb-6 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "oklch(0.62 0.18 255)" }} />
            </div>
          ) : (
            FORM_TYPES.map((ft) => {
              const form = getFormForType(ft.type);
              const isSelected = selectedType === ft.type;
              return (
                <button
                  key={ft.type}
                  onClick={() => setSelectedType(ft.type)}
                  className="w-full text-left rounded-xl border p-3.5 transition-all"
                  style={{
                    borderColor: isSelected ? ft.color : "oklch(0.90 0.006 80)",
                    background: isSelected ? "white" : "white",
                    boxShadow: isSelected ? `0 0 0 2px ${ft.color}44, 0 2px 8px ${ft.color}18` : "0 1px 3px oklch(0.88 0.006 80)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span style={{ color: ft.color }}>{ft.icon}</span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded font-semibold"
                      style={{ background: `${ft.color}18`, color: ft.color, fontSize: "10px" }}
                    >
                      {ft.badge}
                    </span>
                    <span className="ml-auto">
                      {form ? (
                        <CheckCircle2 size={13} style={{ color: "oklch(0.42 0.18 145)" }} />
                      ) : (
                        <AlertCircle size={13} style={{ color: "oklch(0.78 0.006 80)" }} />
                      )}
                    </span>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: "oklch(0.22 0.012 65)" }}>
                    {ft.label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "oklch(0.60 0.012 65)" }}>
                    {ft.description}
                  </p>
                  {form && (
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "oklch(0.93 0.07 145)", color: "oklch(0.32 0.18 145)" }}
                      >
                        Initialized
                      </span>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right panel: editor ── */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        {!selectedType ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "oklch(0.93 0.05 255)" }}
            >
              <ClipboardList size={32} style={{ color: "oklch(0.52 0.18 255)" }} />
            </div>
            <p className="text-base font-semibold" style={{ color: "oklch(0.35 0.012 65)" }}>
              Select a form type
            </p>
            <p className="text-sm mt-1 max-w-xs" style={{ color: "oklch(0.60 0.012 65)" }}>
              Choose one of the 5 evaluation form templates from the left panel to start building
            </p>
          </div>
        ) : !selectedForm ? (
          /* Form not yet initialized */
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: `${selectedMeta?.color}18` }}
            >
              <span style={{ color: selectedMeta?.color }}>{selectedMeta?.icon}</span>
            </div>
            <span
              className="text-xs px-2 py-0.5 rounded font-semibold mb-2"
              style={{ background: `${selectedMeta?.color}18`, color: selectedMeta?.color }}
            >
              {selectedMeta?.badge}
            </span>
            <p className="text-lg font-bold mb-1" style={{ color: "oklch(0.22 0.012 65)" }}>
              {selectedMeta?.label}
            </p>
            <p className="text-sm mb-1" style={{ color: "oklch(0.55 0.012 65)" }}>
              {selectedMeta?.who}
            </p>
            <p className="text-sm mb-6 max-w-sm" style={{ color: "oklch(0.65 0.012 65)" }}>
              This form hasn't been initialized yet. Click below to create it and start adding categories and KPIs.
            </p>
            <button
              onClick={() =>
                upsertForm.mutate({
                  formType: selectedType,
                  title: selectedMeta?.label ?? selectedType,
                  description: selectedMeta?.description,
                  isActive: true,
                })
              }
              disabled={upsertForm.isPending}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
              style={{ background: selectedMeta?.color }}
            >
              <Plus size={16} /> Initialize Form
            </button>
          </div>
        ) : (
          /* Form editor */
          <div className="p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${selectedMeta?.color}18` }}
              >
                <span style={{ color: selectedMeta?.color }}>{selectedMeta?.icon}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className="text-xs px-2 py-0.5 rounded font-semibold"
                    style={{ background: `${selectedMeta?.color}18`, color: selectedMeta?.color }}
                  >
                    {selectedMeta?.badge}
                  </span>
                  <span className="text-xs" style={{ color: "oklch(0.42 0.18 145)" }}>
                    {selectedForm.isActive ? "● Active" : "○ Inactive"}
                  </span>
                </div>
                <h3
                  className="text-xl font-bold"
                  style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}
                >
                  {selectedForm.title}
                </h3>
                <p className="text-xs mt-0.5" style={{ color: "oklch(0.60 0.012 65)" }}>
                  {selectedMeta?.who} · {selectedForm.description}
                </p>
              </div>
            </div>

            <FormEditor formId={selectedForm.id} accentColor={selectedMeta?.color ?? "oklch(0.42 0.18 255)"} />
          </div>
        )}
      </div>
    </div>
  );
}
