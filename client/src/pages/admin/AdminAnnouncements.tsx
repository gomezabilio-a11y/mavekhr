import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, X, Megaphone } from "lucide-react";

type AnnouncementForm = {
  title: string;
  category: string;
  content: string;
  publishDate: string;
  isActive: boolean;
};

const emptyForm: AnnouncementForm = { title: "", category: "", content: "", publishDate: "", isActive: true };

export default function AdminAnnouncements() {
  const [location] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<AnnouncementForm>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: announcements = [], isLoading } = trpc.announcement.listAll.useQuery();

  const createMutation = trpc.announcement.create.useMutation({
    onSuccess: () => { utils.announcement.listAll.invalidate(); setShowForm(false); setForm(emptyForm); toast.success("Announcement created"); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.announcement.update.useMutation({
    onSuccess: () => { utils.announcement.listAll.invalidate(); setShowForm(false); setEditId(null); setForm(emptyForm); toast.success("Announcement updated"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.announcement.delete.useMutation({
    onSuccess: () => { utils.announcement.listAll.invalidate(); setDeleteConfirm(null); toast.success("Announcement deleted"); },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (location.includes("action=new")) setShowForm(true);
  }, [location]);

  function handleEdit(a: typeof announcements[0]) {
    setEditId(a.id);
    setForm({
      title: a.title,
      category: a.category,
      content: a.content ?? "",
      publishDate: a.publishDate ? String(a.publishDate) : "",
      isActive: a.isActive,
    });
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editId) {
      updateMutation.mutate({ id: editId, ...form });
    } else {
      createMutation.mutate(form as any);
    }
  }

  const inputCls = "w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 transition-all";
  const inputStyle = { borderColor: "oklch(0.88 0.006 80)", background: "white", color: "oklch(0.22 0.012 65)" };

  const categoryColors: Record<string, { bg: string; text: string }> = {
    Holiday:    { bg: "oklch(0.92 0.08 145)", text: "oklch(0.42 0.18 145)" },
    Promotion:  { bg: "oklch(0.92 0.08 255)", text: "oklch(0.42 0.18 255)" },
    "New Joiner": { bg: "oklch(0.92 0.08 65)", text: "oklch(0.52 0.15 65)" },
    Policy:     { bg: "oklch(0.92 0.06 25)",  text: "oklch(0.42 0.15 25)" },
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
            Announcements
          </h2>
          <p className="text-sm" style={{ color: "oklch(0.55 0.012 65)" }}>Manage company-wide announcements</p>
        </div>
        <button
          onClick={() => { setEditId(null); setForm(emptyForm); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: "oklch(0.42 0.18 255)" }}
        >
          <Plus size={14} /> Add Announcement
        </button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "oklch(0.62 0.18 255)" }} />
          </div>
        ) : announcements.length === 0 ? (
          <div className="bg-white rounded-xl border text-center py-16" style={{ borderColor: "oklch(0.90 0.006 80)" }}>
            <Megaphone size={32} className="mx-auto mb-2" style={{ color: "oklch(0.82 0.006 80)" }} />
            <p className="text-sm" style={{ color: "oklch(0.65 0.012 65)" }}>No announcements yet.</p>
          </div>
        ) : (
          announcements.map(a => {
            const cc = categoryColors[a.category] ?? { bg: "oklch(0.92 0.006 80)", text: "oklch(0.45 0.012 65)" };
            return (
              <div key={a.id} className="bg-white rounded-xl border p-4" style={{ borderColor: "oklch(0.90 0.006 80)", opacity: a.isActive ? 1 : 0.6 }}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: cc.bg, color: cc.text }}>{a.category}</span>
                      {!a.isActive && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "oklch(0.92 0.006 80)", color: "oklch(0.55 0.012 65)" }}>Inactive</span>
                      )}
                      <span className="text-xs ml-auto" style={{ color: "oklch(0.65 0.012 65)" }}>{a.publishDate ? String(a.publishDate) : ""}</span>
                    </div>
                    <p className="font-semibold text-sm" style={{ color: "oklch(0.22 0.012 65)" }}>{a.title}</p>
                    {a.content && <p className="text-xs mt-1 line-clamp-2" style={{ color: "oklch(0.55 0.012 65)" }}>{a.content}</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => handleEdit(a)} className="p-1.5 rounded hover:bg-blue-50">
                      <Edit2 size={13} style={{ color: "oklch(0.42 0.18 255)" }} />
                    </button>
                    <button onClick={() => setDeleteConfirm(a.id)} className="p-1.5 rounded hover:bg-red-50">
                      <Trash2 size={13} style={{ color: "oklch(0.52 0.18 25)" }} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "oklch(0.90 0.006 80)" }}>
              <h3 className="font-semibold" style={{ color: "oklch(0.22 0.012 65)" }}>
                {editId ? "Edit Announcement" : "Add Announcement"}
              </h3>
              <button onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }}>
                <X size={18} style={{ color: "oklch(0.55 0.012 65)" }} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Title *</label>
                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Public Holiday Notice" className={inputCls} style={inputStyle} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Category *</label>
                  <input required value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    placeholder="Holiday / Promotion / Policy..." className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Publish Date *</label>
                  <input required type="date" value={form.publishDate} onChange={e => setForm(f => ({ ...f, publishDate: e.target.value }))}
                    className={inputCls} style={inputStyle} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.45 0.012 65)" }}>Content</label>
                <textarea rows={4} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="Announcement details..." className={inputCls} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                <label htmlFor="isActive" className="text-xs" style={{ color: "oklch(0.45 0.012 65)" }}>Active (visible to employees)</label>
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
            <p className="font-semibold mb-1" style={{ color: "oklch(0.22 0.012 65)" }}>Delete Announcement?</p>
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
