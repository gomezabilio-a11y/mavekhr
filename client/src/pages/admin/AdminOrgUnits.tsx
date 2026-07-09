import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, X, Building2 } from "lucide-react";

type OrgUnitForm = {
  name: string;
  type: "entity" | "division" | "department" | "team";
  parentId: string;
  headCount: string;
};

const emptyForm: OrgUnitForm = { name: "", type: "team", parentId: "", headCount: "" };

const typeColors: Record<string, { bg: string; text: string }> = {
  entity:     { bg: "oklch(0.92 0.04 255)", text: "oklch(0.32 0.18 255)" },
  division:   { bg: "oklch(0.92 0.06 145)", text: "oklch(0.28 0.18 145)" },
  department: { bg: "oklch(0.92 0.06 65)",  text: "oklch(0.38 0.15 65)" },
  team:       { bg: "oklch(0.92 0.06 27)",  text: "oklch(0.38 0.2 27)" },
};

export default function AdminOrgUnits() {
  const [location] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<OrgUnitForm>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: orgUnits = [], isLoading } = trpc.orgUnit.list.useQuery();

  const createMutation = trpc.orgUnit.create.useMutation({
    onSuccess: () => { utils.orgUnit.list.invalidate(); setShowForm(false); setForm(emptyForm); toast.success("Org unit created"); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.orgUnit.update.useMutation({
    onSuccess: () => { utils.orgUnit.list.invalidate(); setShowForm(false); setEditId(null); setForm(emptyForm); toast.success("Org unit updated"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.orgUnit.delete.useMutation({
    onSuccess: () => { utils.orgUnit.list.invalidate(); setDeleteConfirm(null); toast.success("Org unit deleted"); },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (location.includes("action=new")) setShowForm(true);
  }, [location]);

  function handleEdit(unit: typeof orgUnits[0]) {
    setEditId(unit.id);
    setForm({
      name: unit.name,
      type: unit.type,
      parentId: unit.parentId?.toString() ?? "",
      headCount: unit.headCount?.toString() ?? "",
    });
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      type: form.type,
      parentId: form.parentId ? parseInt(form.parentId) : undefined,
      headCount: form.headCount ? parseInt(form.headCount) : undefined,
    };
    if (editId) {
      updateMutation.mutate({ id: editId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const inputCls = "w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 transition-all";
  const inputStyle = { borderColor: "oklch(0.88 0.006 80)", background: "white", color: "oklch(0.22 0.012 65)" };

  // Build tree for display
  const roots = orgUnits.filter(u => !u.parentId);
  const getChildren = (id: number) => orgUnits.filter(u => u.parentId === id);

  function renderUnit(unit: typeof orgUnits[0], depth = 0): React.ReactNode {
    const children = getChildren(unit.id);
    const tc = typeColors[unit.type];
    return (
      <div key={unit.id}>
        <div
          className="flex items-center gap-3 py-2.5 px-4 border-b hover:bg-gray-50/50 transition-colors"
          style={{ paddingLeft: `${16 + depth * 24}px`, borderColor: "oklch(0.94 0.006 80)" }}
        >
          {depth > 0 && <div className="w-4 h-px flex-shrink-0" style={{ background: "oklch(0.82 0.006 80)" }} />}
          <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: tc.bg, color: tc.text }}>
            {unit.type}
          </span>
          <span className="font-medium text-sm flex-1" style={{ color: "oklch(0.22 0.012 65)" }}>{unit.name}</span>
          {unit.headCount != null && (
            <span className="text-xs" style={{ color: "oklch(0.65 0.012 65)" }}>{unit.headCount} people</span>
          )}
          <div className="flex items-center gap-1 ml-2">
            <button onClick={() => handleEdit(unit)} className="p-1.5 rounded hover:bg-blue-50 transition-colors">
              <Edit2 size={13} style={{ color: "oklch(0.42 0.18 255)" }} />
            </button>
            <button onClick={() => setDeleteConfirm(unit.id)} className="p-1.5 rounded hover:bg-red-50 transition-colors">
              <Trash2 size={13} style={{ color: "oklch(0.52 0.18 25)" }} />
            </button>
          </div>
        </div>
        {children.map(child => renderUnit(child, depth + 1))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
            Org Units
          </h2>
          <p className="text-sm" style={{ color: "oklch(0.55 0.012 65)" }}>Manage legal entities, divisions, departments, and teams</p>
        </div>
        <button
          onClick={() => { setEditId(null); setForm(emptyForm); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: "oklch(0.42 0.18 255)" }}
        >
          <Plus size={14} /> Add Org Unit
        </button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "oklch(0.90 0.006 80)" }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "oklch(0.62 0.18 255)" }} />
          </div>
        ) : orgUnits.length === 0 ? (
          <div className="text-center py-16">
            <Building2 size={32} className="mx-auto mb-2" style={{ color: "oklch(0.82 0.006 80)" }} />
            <p className="text-sm" style={{ color: "oklch(0.65 0.012 65)" }}>No org units yet.</p>
          </div>
        ) : (
          <div>{roots.map(u => renderUnit(u))}</div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "oklch(0.90 0.006 80)" }}>
              <h3 className="font-semibold" style={{ color: "oklch(0.22 0.012 65)" }}>
                {editId ? "Edit Org Unit" : "Add Org Unit"}
              </h3>
              <button onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }}>
                <X size={18} style={{ color: "oklch(0.55 0.012 65)" }} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Name *</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Consulting SG" className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Type *</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}
                  className={inputCls} style={inputStyle}>
                  <option value="entity">Entity</option>
                  <option value="division">Division</option>
                  <option value="department">Department</option>
                  <option value="team">Team</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Parent Unit</label>
                <select value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}
                  className={inputCls} style={inputStyle}>
                  <option value="">— Root (no parent) —</option>
                  {orgUnits.filter(u => u.id !== editId).map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.type})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Head Count</label>
                <input type="number" min="0" value={form.headCount} onChange={e => setForm(f => ({ ...f, headCount: e.target.value }))}
                  placeholder="0" className={inputCls} style={inputStyle} />
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

      {/* Delete confirm */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
            <Trash2 size={32} className="mx-auto mb-3" style={{ color: "oklch(0.52 0.18 25)" }} />
            <p className="font-semibold mb-1" style={{ color: "oklch(0.22 0.012 65)" }}>Delete Org Unit?</p>
            <p className="text-sm mb-4" style={{ color: "oklch(0.55 0.012 65)" }}>This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 rounded-lg text-sm border" style={{ borderColor: "oklch(0.88 0.006 80)" }}>
                Cancel
              </button>
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
