import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { FileText, Upload, Trash2, X, Plus, Download, Loader2 } from "lucide-react";

type Props = {
  employee: { id: number; firstName: string; lastName: string };
  onClose: () => void;
};

const DOC_TYPES = ["CV / Resume", "Employment Contract", "NDA", "ID Copy", "Work Permit", "Certificate", "Other"];

export default function AdminEmployeeDocuments({ employee, onClose }: Props) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState("CV / Resume");
  const [issueDate, setIssueDate] = useState("");
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [downloadingDocId, setDownloadingDocId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const { data: documents = [], isLoading } = trpc.document.list.useQuery({ employeeId: employee.id });

  const createMutation = trpc.document.create.useMutation({
    onSuccess: () => {
      utils.document.list.invalidate({ employeeId: employee.id });
      setShowAddForm(false);
      resetForm();
      toast.success("Document added");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.document.delete.useMutation({
    onSuccess: () => {
      utils.document.list.invalidate({ employeeId: employee.id });
      toast.success("Document deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  function resetForm() {
    setDocName("");
    setDocType("CV / Resume");
    setIssueDate("");
    setFileUrl("");
    setFileName("");
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) { toast.error("File must be under 20MB"); return; }
    setUploading(true);
    setFileName(file.name);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const dataUrl = ev.target?.result as string;
        const base64 = dataUrl.split(",")[1];
        const resp = await fetch("/api/upload/document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ base64, mimeType: file.type, fileName: file.name }),
        });
        if (!resp.ok) throw new Error(await resp.text());
        const { url } = await resp.json() as { url: string };
        setFileUrl(url);
        if (!docName) setDocName(file.name.replace(/\.[^.]+$/, ""));
        toast.success("File uploaded — click Save to confirm");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
      setUploading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fileUrl && !docName) { toast.error("Please upload a file or enter a document name"); return; }
    createMutation.mutate({
      employeeId: employee.id,
      name: docName || fileName,
      fileUrl: fileUrl || undefined,
      fileType: docType,
      issueDate: issueDate || undefined,
    });
  }

  const inputCls = "w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-400";
  const inputStyle = { borderColor: "oklch(0.88 0.006 80)", background: "oklch(0.97 0.006 80)", color: "oklch(0.22 0.012 65)" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "oklch(0.90 0.006 80)" }}>
          <div>
            <h3 className="font-semibold text-slate-800">Documents</h3>
            <p className="text-xs text-slate-500 mt-0.5">{employee.firstName} {employee.lastName}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        {/* Document list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-slate-400" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-10">
              <FileText size={36} className="mx-auto mb-3 text-slate-300" />
              <p className="text-sm text-slate-400">No documents yet</p>
            </div>
          ) : (
            documents.map((doc: any) => (
              <div key={doc.id}
                className="flex items-center gap-3 p-3 rounded-xl border"
                style={{ borderColor: "oklch(0.90 0.006 80)", background: "oklch(0.98 0.003 80)" }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "oklch(0.93 0.02 255)" }}>
                  <FileText size={16} style={{ color: "oklch(0.42 0.18 255)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{doc.name}</p>
                  <p className="text-xs text-slate-500">
                    {doc.fileType}
                    {doc.issueDate && ` · ${new Date(doc.issueDate).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {doc.fileUrl && (
                    <a
                      href={doc.fileUrl.startsWith("/manus-storage/")
                        ? doc.fileUrl.replace("/manus-storage/", "/api/download/")
                        : doc.fileUrl.startsWith("/api/download/")
                          ? doc.fileUrl
                          : `/api/download/${doc.fileUrl.replace(/^.*\/manus-storage\//, "")}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg hover:bg-slate-100 inline-flex items-center" title="Download">
                      <Download size={14} className="text-slate-500" />
                    </a>
                  )}
                  <button
                    onClick={() => { if (confirm("Delete this document?")) deleteMutation.mutate({ id: doc.id }); }}
                    className="p-1.5 rounded-lg hover:bg-red-50" title="Delete">
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add document form */}
        {showAddForm ? (
          <div className="border-t p-5 space-y-3" style={{ borderColor: "oklch(0.90 0.006 80)" }}>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1 text-slate-600">Document Name *</label>
                  <input value={docName} onChange={e => setDocName(e.target.value)}
                    placeholder="e.g. Employment Contract 2024" className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-slate-600">Document Type</label>
                  <select value={docType} onChange={e => setDocType(e.target.value)} className={inputCls} style={inputStyle}>
                    {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-slate-600">Issue Date</label>
                  <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} className={inputCls} style={inputStyle} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1 text-slate-600">File Upload</label>
                  <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden" onChange={handleFileSelect} />
                  <button type="button" disabled={uploading} onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium w-full justify-center disabled:opacity-50"
                    style={{ borderColor: "oklch(0.88 0.006 80)", color: "oklch(0.42 0.18 255)" }}>
                    {uploading ? <><Loader2 size={12} className="animate-spin" /> Uploading...</> : <><Upload size={12} /> {fileName || "Choose file (PDF, DOC, Image — max 20MB)"}</>}
                  </button>
                  {fileUrl && <p className="text-xs text-green-600 mt-1">✓ File uploaded successfully</p>}
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setShowAddForm(false); resetForm(); }}
                  className="flex-1 py-2 rounded-lg text-sm border text-slate-600"
                  style={{ borderColor: "oklch(0.88 0.006 80)" }}>Cancel</button>
                <button type="submit" disabled={createMutation.isPending || uploading}
                  className="flex-1 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                  style={{ background: "oklch(0.42 0.18 255)" }}>
                  {createMutation.isPending ? "Saving..." : "Save Document"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="border-t p-4" style={{ borderColor: "oklch(0.90 0.006 80)" }}>
            <button onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 w-full justify-center py-2.5 rounded-xl border text-sm font-medium"
              style={{ borderColor: "oklch(0.88 0.006 80)", color: "oklch(0.42 0.18 255)", borderStyle: "dashed" }}>
              <Plus size={14} />
              Add Document
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
