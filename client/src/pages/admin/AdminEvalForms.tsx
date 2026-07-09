import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Plus, Trash2, X, ChevronDown, ChevronRight, Edit2, Save,
  GripVertical, ClipboardList, CheckCircle2, AlertCircle
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type FormType = "self_regular" | "self_manager" | "peer" | "manager_eval" | "contractor";

const FORM_TYPES: { type: FormType; label: string; badge: string; description: string; color: string }[] = [
  { type: "self_regular", label: "Self Evaluation", badge: "Regular Employee", description: "Self-assessment form for regular employees", color: "oklch(0.42 0.18 255)" },
  { type: "self_manager", label: "Self Evaluation", badge: "Manager", description: "Self-assessment form for managers", color: "oklch(0.42 0.18 145)" },
  { type: "peer", label: "Peer Evaluation", badge: "Peer", description: "Evaluation of a colleague by peers", color: "oklch(0.52 0.15 65)" },
  { type: "manager_eval", label: "Manager Evaluation", badge: "Manager → Employee", description: "Manager evaluating a direct report", color: "oklch(0.42 0.15 25)" },
  { type: "contractor", label: "Contractor Evaluation", badge: "Contractor", description: "Peer evaluation of a contractor (no self-eval)", color: "oklch(0.42 0.15 300)" },
];

const inputCls = "w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 transition-all";
const inputStyle = { borderColor: "oklch(0.88 0.006 80)", background: "white", color: "oklch(0.22 0.012 65)" };

// ─── KPI Row Editor ───────────────────────────────────────────────────────────
function KpiRow({ kpi, onUpdate, onDelete }: {
  kpi: { id: number; kpiName: string; question: string; sortOrder: number };
  onUpdate: (id: number, data: { kpiName?: string; question?: string }) => void;
  onDelete: (id: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(kpi.kpiName);
  const [question, setQuestion] = useState(kpi.question);

  function save() {
    onUpdate(kpi.id, { kpiName: name, question });
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="rounded-lg border p-3 space-y-2" style={{ borderColor: "oklch(0.82 0.006 80)", background: "oklch(0.98 0.004 80)" }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="KPI Name (e.g. Honesty & Transparency)"
          className={inputCls} style={inputStyle} />
        <textarea rows={2} value={question} onChange={e => setQuestion(e.target.value)} placeholder="Question text..."
          className={inputCls} style={{ ...inputStyle, resize: "vertical" }} />
        <div className="flex gap-2">
          <button onClick={save} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{ background: "oklch(0.42 0.18 145)" }}>
            <Save size={12} /> Save
          </button>
          <button onClick={() => setEditing(false)} className="px-3 py-1.5 rounded-lg text-xs border" style={{ borderColor: "oklch(0.88 0.006 80)", color: "oklch(0.55 0.012 65)" }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 py-2 px-3 rounded-lg group hover:bg-gray-50/60">
      <GripVertical size={14} className="mt-0.5 flex-shrink-0" style={{ color: "oklch(0.75 0.006 80)" }} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold" style={{ color: "oklch(0.35 0.012 65)" }}>{kpi.kpiName}</p>
        <p className="text-xs mt-0.5" style={{ color: "oklch(0.55 0.012 65)" }}>{kpi.question}</p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button onClick={() => setEditing(true)} className="p-1 rounded hover:bg-blue-50">
          <Edit2 size={12} style={{ color: "oklch(0.42 0.18 255)" }} />
        </button>
        <button onClick={() => onDelete(kpi.id)} className="p-1 rounded hover:bg-red-50">
          <Trash2 size={12} style={{ color: "oklch(0.52 0.18 25)" }} />
        </button>
      </div>
    </div>
  );
}

// ─── Category Block ───────────────────────────────────────────────────────────
function CategoryBlock({ cat, formId, onCategoryDeleted }: {
  cat: { id: number; title: string; weight: number; purpose: string | null; definition: string | null; kpis: any[] };
  formId: number;
  onCategoryDeleted: () => void;
}) {
  const [open, setOpen] = useState(true);
  const [editingMeta, setEditingMeta] = useState(false);
  const [title, setTitle] = useState(cat.title);
  const [weight, setWeight] = useState(cat.weight.toString());
  const [purpose, setPurpose] = useState(cat.purpose ?? "");
  const [definition, setDefinition] = useState(cat.definition ?? "");
  const [addingKpi, setAddingKpi] = useState(false);
  const [newKpiName, setNewKpiName] = useState("");
  const [newKpiQuestion, setNewKpiQuestion] = useState("");

  const utils = trpc.useUtils();

  const updateCat = trpc.formCategory.update.useMutation({
    onSuccess: () => { utils.evalForm.getWithContent.invalidate(); setEditingMeta(false); toast.success("Category updated"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteCat = trpc.formCategory.delete.useMutation({
    onSuccess: () => { utils.evalForm.getWithContent.invalidate(); onCategoryDeleted(); toast.success("Category deleted"); },
    onError: (e) => toast.error(e.message),
  });
  const createKpi = trpc.formKpi.create.useMutation({
    onSuccess: () => { utils.evalForm.getWithContent.invalidate(); setAddingKpi(false); setNewKpiName(""); setNewKpiQuestion(""); toast.success("KPI added"); },
    onError: (e) => toast.error(e.message),
  });
  const updateKpi = trpc.formKpi.update.useMutation({
    onSuccess: () => { utils.evalForm.getWithContent.invalidate(); toast.success("KPI updated"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteKpi = trpc.formKpi.delete.useMutation({
    onSuccess: () => { utils.evalForm.getWithContent.invalidate(); toast.success("KPI deleted"); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "oklch(0.88 0.006 80)" }}>
      {/* Category header */}
      <div className="flex items-center gap-2 px-4 py-3" style={{ background: "oklch(0.96 0.008 80)" }}>
        <button onClick={() => setOpen(o => !o)} className="flex items-center gap-1">
          {open ? <ChevronDown size={14} style={{ color: "oklch(0.55 0.012 65)" }} /> : <ChevronRight size={14} style={{ color: "oklch(0.55 0.012 65)" }} />}
        </button>
        {editingMeta ? (
          <div className="flex-1 grid grid-cols-3 gap-2">
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Category title" className={inputCls} style={inputStyle} />
            <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="Weight %" className={inputCls} style={inputStyle} />
            <div className="flex gap-1">
              <button onClick={() => updateCat.mutate({ id: cat.id, title, weight: parseInt(weight) || 0, purpose: purpose || undefined, definition: definition || undefined })}
                className="flex items-center gap-1 px-2 py-1.5 rounded text-xs text-white" style={{ background: "oklch(0.42 0.18 145)" }}>
                <Save size={11} /> Save
              </button>
              <button onClick={() => setEditingMeta(false)} className="px-2 py-1.5 rounded text-xs border" style={{ borderColor: "oklch(0.88 0.006 80)" }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <span className="flex-1 text-sm font-semibold" style={{ color: "oklch(0.22 0.012 65)" }}>{cat.title}</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "oklch(0.92 0.08 255)", color: "oklch(0.32 0.18 255)" }}>{cat.weight}%</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setEditingMeta(true)} className="p-1 rounded hover:bg-white">
                <Edit2 size={12} style={{ color: "oklch(0.42 0.18 255)" }} />
              </button>
              <button onClick={() => deleteCat.mutate({ id: cat.id })} className="p-1 rounded hover:bg-red-50">
                <Trash2 size={12} style={{ color: "oklch(0.52 0.18 25)" }} />
              </button>
            </div>
          </>
        )}
      </div>

      {open && (
        <div className="p-4 space-y-3">
          {/* Purpose & Definition */}
          {editingMeta && (
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>a. Purpose</label>
                <textarea rows={2} value={purpose} onChange={e => setPurpose(e.target.value)} className={inputCls} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>b. Definition</label>
                <textarea rows={2} value={definition} onChange={e => setDefinition(e.target.value)} className={inputCls} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
            </div>
          )}
          {!editingMeta && (cat.purpose || cat.definition) && (
            <div className="space-y-1 text-xs" style={{ color: "oklch(0.55 0.012 65)" }}>
              {cat.purpose && <p><span className="font-medium">Purpose:</span> {cat.purpose}</p>}
              {cat.definition && <p><span className="font-medium">Definition:</span> {cat.definition}</p>}
            </div>
          )}

          {/* KPI list */}
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "oklch(0.55 0.012 65)" }}>c. KPIs</p>
            {cat.kpis.length === 0 && (
              <p className="text-xs italic" style={{ color: "oklch(0.72 0.006 80)" }}>No KPIs yet. Add one below.</p>
            )}
            {cat.kpis.map(kpi => (
              <KpiRow key={kpi.id} kpi={kpi}
                onUpdate={(id, data) => updateKpi.mutate({ id, ...data })}
                onDelete={(id) => deleteKpi.mutate({ id })}
              />
            ))}
          </div>

          {/* Add KPI */}
          {addingKpi ? (
            <div className="rounded-lg border p-3 space-y-2" style={{ borderColor: "oklch(0.82 0.006 80)", background: "oklch(0.98 0.004 80)" }}>
              <input value={newKpiName} onChange={e => setNewKpiName(e.target.value)} placeholder="KPI Name (e.g. Honesty & Transparency)"
                className={inputCls} style={inputStyle} />
              <textarea rows={2} value={newKpiQuestion} onChange={e => setNewKpiQuestion(e.target.value)} placeholder="Question text..."
                className={inputCls} style={{ ...inputStyle, resize: "vertical" }} />
              <div className="flex gap-2">
                <button
                  onClick={() => createKpi.mutate({ categoryId: cat.id, kpiName: newKpiName, question: newKpiQuestion, sortOrder: cat.kpis.length })}
                  disabled={!newKpiName || !newKpiQuestion || createKpi.isPending}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50"
                  style={{ background: "oklch(0.42 0.18 255)" }}>
                  <Plus size={12} /> Add KPI
                </button>
                <button onClick={() => { setAddingKpi(false); setNewKpiName(""); setNewKpiQuestion(""); }}
                  className="px-3 py-1.5 rounded-lg text-xs border" style={{ borderColor: "oklch(0.88 0.006 80)", color: "oklch(0.55 0.012 65)" }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingKpi(true)}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-dashed transition-colors hover:bg-blue-50/50"
              style={{ borderColor: "oklch(0.75 0.08 255)", color: "oklch(0.42 0.18 255)" }}>
              <Plus size={12} /> Add KPI
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Form Editor ──────────────────────────────────────────────────────────────
function FormEditor({ formId, formType }: { formId: number; formType: FormType }) {
  const [addingCat, setAddingCat] = useState(false);
  const [catTitle, setCatTitle] = useState("");
  const [catWeight, setCatWeight] = useState("");
  const [catPurpose, setCatPurpose] = useState("");
  const [catDefinition, setCatDefinition] = useState("");

  const utils = trpc.useUtils();
  const { data: form, isLoading } = trpc.evalForm.getWithContent.useQuery({ formId });

  const createCat = trpc.formCategory.create.useMutation({
    onSuccess: () => {
      utils.evalForm.getWithContent.invalidate();
      setAddingCat(false);
      setCatTitle(""); setCatWeight(""); setCatPurpose(""); setCatDefinition("");
      toast.success("Category added");
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
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
        <p className="text-sm" style={{ color: "oklch(0.65 0.012 65)" }}>Form not found. It may not have been initialized yet.</p>
      </div>
    );
  }

  const totalWeight = form.categories.reduce((sum, c) => sum + c.weight, 0);

  return (
    <div className="space-y-4">
      {/* Weight summary */}
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg" style={{ background: totalWeight === 100 ? "oklch(0.92 0.08 145)" : "oklch(0.92 0.06 65)" }}>
        {totalWeight === 100
          ? <CheckCircle2 size={14} style={{ color: "oklch(0.42 0.18 145)" }} />
          : <AlertCircle size={14} style={{ color: "oklch(0.52 0.12 65)" }} />
        }
        <span className="text-xs font-medium" style={{ color: totalWeight === 100 ? "oklch(0.32 0.18 145)" : "oklch(0.42 0.12 65)" }}>
          Total weight: {totalWeight}% {totalWeight !== 100 && `(should be 100%)`}
        </span>
      </div>

      {/* Categories */}
      {form.categories.length === 0 && (
        <div className="text-center py-8 rounded-xl border border-dashed" style={{ borderColor: "oklch(0.85 0.006 80)" }}>
          <ClipboardList size={28} className="mx-auto mb-2" style={{ color: "oklch(0.82 0.006 80)" }} />
          <p className="text-sm" style={{ color: "oklch(0.65 0.012 65)" }}>No categories yet. Add a category to get started.</p>
        </div>
      )}
      {form.categories.map(cat => (
        <CategoryBlock key={cat.id} cat={cat} formId={formId} onCategoryDeleted={() => {}} />
      ))}

      {/* Add Category */}
      {addingCat ? (
        <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: "oklch(0.82 0.006 80)", background: "oklch(0.98 0.004 80)" }}>
          <p className="text-sm font-semibold" style={{ color: "oklch(0.22 0.012 65)" }}>New Category</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Title *</label>
              <input value={catTitle} onChange={e => setCatTitle(e.target.value)} placeholder="e.g. 1 Integrity"
                className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Weight (%) *</label>
              <input type="number" min="0" max="100" value={catWeight} onChange={e => setCatWeight(e.target.value)} placeholder="10"
                className={inputCls} style={inputStyle} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>a. Purpose</label>
            <textarea rows={2} value={catPurpose} onChange={e => setCatPurpose(e.target.value)} placeholder="To build trust by ensuring..."
              className={inputCls} style={{ ...inputStyle, resize: "vertical" }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>b. Definition</label>
            <textarea rows={2} value={catDefinition} onChange={e => setCatDefinition(e.target.value)} placeholder="Acts with honesty, transparency..."
              className={inputCls} style={{ ...inputStyle, resize: "vertical" }} />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => createCat.mutate({
                formId, title: catTitle, weight: parseInt(catWeight) || 0,
                purpose: catPurpose || undefined, definition: catDefinition || undefined,
                sortOrder: form.categories.length,
              })}
              disabled={!catTitle || !catWeight || createCat.isPending}
              className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
              style={{ background: "oklch(0.42 0.18 255)" }}>
              <Plus size={14} /> Add Category
            </button>
            <button onClick={() => { setAddingCat(false); setCatTitle(""); setCatWeight(""); setCatPurpose(""); setCatDefinition(""); }}
              className="px-4 py-2 rounded-lg text-sm border" style={{ borderColor: "oklch(0.88 0.006 80)", color: "oklch(0.45 0.012 65)" }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAddingCat(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed text-sm transition-colors hover:bg-blue-50/30"
          style={{ borderColor: "oklch(0.75 0.08 255)", color: "oklch(0.42 0.18 255)" }}>
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
    onSuccess: () => { utils.evalForm.listAll.invalidate(); toast.success("Form initialized"); },
    onError: (e) => toast.error(e.message),
  });

  function getFormForType(type: FormType) {
    return forms.find(f => f.formType === type);
  }

  const selectedForm = selectedType ? getFormForType(selectedType) : null;
  const selectedMeta = FORM_TYPES.find(f => f.type === selectedType);

  return (
    <div className="p-6 flex gap-6 h-full">
      {/* Left panel: form type list */}
      <div className="w-72 flex-shrink-0 space-y-2">
        <div className="mb-4">
          <h2 className="text-xl font-bold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
            Evaluation Forms
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "oklch(0.55 0.012 65)" }}>Build and manage evaluation questionnaires</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "oklch(0.62 0.18 255)" }} />
          </div>
        ) : (
          FORM_TYPES.map(ft => {
            const form = getFormForType(ft.type);
            const isSelected = selectedType === ft.type;
            return (
              <button
                key={ft.type}
                onClick={() => setSelectedType(ft.type)}
                className="w-full text-left rounded-xl border p-3 transition-all"
                style={{
                  borderColor: isSelected ? ft.color : "oklch(0.90 0.006 80)",
                  background: isSelected ? "white" : "oklch(0.98 0.004 80)",
                  boxShadow: isSelected ? `0 0 0 2px ${ft.color}22` : "none",
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${ft.color}22`, color: ft.color, fontSize: "10px", fontWeight: 600 }}>
                    {ft.badge}
                  </span>
                  {form ? (
                    <CheckCircle2 size={12} style={{ color: "oklch(0.42 0.18 145)" }} />
                  ) : (
                    <AlertCircle size={12} style={{ color: "oklch(0.72 0.006 80)" }} />
                  )}
                </div>
                <p className="text-sm font-semibold" style={{ color: "oklch(0.22 0.012 65)" }}>{ft.label}</p>
                <p className="text-xs mt-0.5" style={{ color: "oklch(0.65 0.012 65)" }}>{ft.description}</p>
                {form && (
                  <p className="text-xs mt-1" style={{ color: "oklch(0.55 0.012 65)" }}>
                    {(form as any)._categoryCount ?? "—"} categories
                  </p>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Right panel: form editor */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        {!selectedType ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <ClipboardList size={40} className="mb-3" style={{ color: "oklch(0.82 0.006 80)" }} />
            <p className="font-semibold" style={{ color: "oklch(0.45 0.012 65)" }}>Select a form type to edit</p>
            <p className="text-sm mt-1" style={{ color: "oklch(0.65 0.012 65)" }}>Choose one of the 5 evaluation forms from the left panel</p>
          </div>
        ) : !selectedForm ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <AlertCircle size={36} className="mb-3" style={{ color: "oklch(0.72 0.006 80)" }} />
            <p className="font-semibold" style={{ color: "oklch(0.45 0.012 65)" }}>Form not initialized</p>
            <p className="text-sm mt-1 mb-4" style={{ color: "oklch(0.65 0.012 65)" }}>
              This form template hasn't been created yet. Click below to initialize it.
            </p>
            <button
              onClick={() => upsertForm.mutate({
                formType: selectedType,
                title: selectedMeta?.label ?? selectedType,
                description: selectedMeta?.description,
                isActive: true,
              })}
              disabled={upsertForm.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50"
              style={{ background: "oklch(0.42 0.18 255)" }}
            >
              <Plus size={16} /> Initialize Form
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Form header */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${selectedMeta?.color}22`, color: selectedMeta?.color, fontWeight: 600 }}>
                    {selectedMeta?.badge}
                  </span>
                  <span className="text-xs" style={{ color: selectedForm.isActive ? "oklch(0.42 0.18 145)" : "oklch(0.55 0.012 65)" }}>
                    {selectedForm.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <h3 className="text-lg font-bold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
                  {selectedForm.title}
                </h3>
                {selectedForm.description && (
                  <p className="text-xs" style={{ color: "oklch(0.55 0.012 65)" }}>{selectedForm.description}</p>
                )}
              </div>
            </div>

            <FormEditor formId={selectedForm.id} formType={selectedType} />
          </div>
        )}
      </div>
    </div>
  );
}
