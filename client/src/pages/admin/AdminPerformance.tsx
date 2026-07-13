/**
 * AdminPerformance.tsx — Admin view of employee performance results
 * Reuses the same computed evaluation logic as PerformanceResults.tsx
 * Flow: Employee selector → Cycle list → Cycle detail
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  BarChart2, User, Loader2, Award, ChevronDown,
  CheckCircle2, Clock, Calendar, ArrowLeft, Users, ClipboardList
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────
function scoreColor(score: number | null) {
  if (score === null) return "oklch(0.72 0.006 80)";
  if (score >= 4.5) return "oklch(0.42 0.18 145)";
  if (score >= 3.5) return "oklch(0.42 0.18 255)";
  if (score >= 2.5) return "oklch(0.52 0.15 65)";
  if (score >= 1.5) return "oklch(0.52 0.18 27)";
  return "oklch(0.48 0.22 20)";
}
function scoreLabel(score: number | null) {
  if (score === null) return "N/A";
  if (score >= 4.5) return "Outstanding";
  if (score >= 3.5) return "Exceeds Expectations";
  if (score >= 2.5) return "Meets Expectations";
  if (score >= 1.5) return "Needs Improvement";
  return "Needs Significant Improvement";
}
function ScoreBar({ score, max = 5 }: { score: number | null; max?: number }) {
  const pct = score !== null ? Math.round((score / max) * 100) : 0;
  return (
    <div className="h-2 rounded-full overflow-hidden" style={{ background: "oklch(0.93 0.006 80)" }}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: scoreColor(score) }} />
    </div>
  );
}

function CategoryTable({ categories, label, icon, color, totalAvg }: {
  categories: Array<{ name: string; avg: number; count: number; weight?: number }>;
  label: string;
  icon: React.ReactNode;
  color: string;
  totalAvg: number | null;
}) {
  const [expanded, setExpanded] = useState(true);
  if (!categories || categories.length === 0) return null;
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "oklch(0.88 0.006 80)" }}>
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        style={{ background: `${color}11` }}
      >
        <span style={{ color }}>{icon}</span>
        <span className="flex-1 text-sm font-semibold" style={{ color: "oklch(0.22 0.012 65)" }}>{label}</span>
        <span className="text-base font-bold mr-2" style={{ color }}>
          {totalAvg !== null ? totalAvg.toFixed(2) : "—"}
        </span>
        <ChevronDown size={14} style={{ color, transform: expanded ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }} />
      </button>
      {expanded && (
        <div className="divide-y" style={{ borderColor: "oklch(0.93 0.006 80)" }}>
          {categories.map((cat) => (
            <div key={cat.name} className="px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm" style={{ color: "oklch(0.35 0.012 65)" }}>
                  {cat.name}
                  {cat.weight !== undefined && (
                    <span className="ml-1.5 text-xs" style={{ color: "oklch(0.65 0.012 65)" }}>({cat.weight}%)</span>
                  )}
                </span>
                <span className="text-sm font-bold" style={{ color: scoreColor(cat.avg) }}>{cat.avg.toFixed(2)}</span>
              </div>
              <ScoreBar score={cat.avg} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Cycle Detail ──────────────────────────────────────────────────────────────
function CycleDetail({ result, onBack, empName }: { result: any; onBack: () => void; empName: string }) {
  const isContractor = result?.isContractor === true;
  const selfScore = result?.self?.totalAvg ?? null;
  const peerScore = result?.peer?.totalAvg ?? null;
  const managerScore = result?.manager?.totalAvg ?? null;
  const contractorScore = result?.contractor?.totalAvg ?? null;
  const finalScore = result?.finalScore ?? null;

  const selfCats: any[] = result?.self?.categoryScores ?? [];
  const peerCats: any[] = result?.peer?.categoryScores ?? [];
  const managerCats: any[] = result?.manager?.categoryScores ?? [];
  const contractorCats: any[] = result?.contractor?.categoryScores ?? [];

  const peerWeight = 3, managerWeight = 5;
  function mergeCategories(peerC: any[], managerC: any[]) {
    if (!peerC.length && !managerC.length) return [];
    const allNames = Array.from(new Set([...peerC.map((c: any) => c.name), ...managerC.map((c: any) => c.name)]));
    return allNames.map(name => {
      const p = peerC.find((c: any) => c.name === name);
      const m = managerC.find((c: any) => c.name === name);
      const totalW = (p ? peerWeight : 0) + (m ? managerWeight : 0);
      const avg = totalW > 0 ? ((p ? p.avg * peerWeight : 0) + (m ? m.avg * managerWeight : 0)) / totalW : 0;
      return { name, avg, count: (p?.count ?? 0) + (m?.count ?? 0), weight: p?.weight ?? m?.weight };
    });
  }
  const mergedPeerManagerCats = mergeCategories(peerCats, managerCats);
  const hasPeerManager = mergedPeerManagerCats.length > 0;
  const peerManagerAvg = (peerScore !== null || managerScore !== null)
    ? (() => {
        const totalW = (peerScore !== null ? peerWeight : 0) + (managerScore !== null ? managerWeight : 0);
        return totalW > 0 ? ((peerScore ?? 0) * (peerScore !== null ? peerWeight : 0) + (managerScore ?? 0) * (managerScore !== null ? managerWeight : 0)) / totalW : null;
      })()
    : null;

  const cardStyle = { background: "white", border: "1px solid oklch(0.88 0.006 80)", borderRadius: "0.75rem" };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm mb-3 hover:opacity-70 transition-opacity" style={{ color: "oklch(0.42 0.18 255)" }}>
          <ArrowLeft size={14} /> Back
        </button>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-xl font-bold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>{result.period}</h2>
            <p className="text-sm mt-0.5" style={{ color: "oklch(0.55 0.012 65)" }}>{empName} — Evaluation breakdown</p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full font-semibold"
            style={result.status === "closed"
              ? { background: "oklch(0.93 0.006 80)", color: "oklch(0.45 0.012 65)" }
              : { background: "oklch(0.93 0.18 255)", color: "oklch(0.42 0.18 255)" }}>
            {result.status === "closed" ? "Closed" : "In Progress"}
          </span>
        </div>
      </div>

      <div className="p-5" style={cardStyle}>
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "oklch(0.55 0.012 65)" }}>Final Weighted Score</p>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-4xl font-bold" style={{ color: finalScore !== null ? scoreColor(finalScore) : "oklch(0.72 0.006 80)" }}>
            {finalScore !== null ? finalScore.toFixed(2) : "—"}
          </span>
          <span className="text-sm" style={{ color: "oklch(0.65 0.012 65)" }}>/ 5.00</span>
        </div>
        <p className="text-sm font-medium mb-4" style={{ color: scoreColor(finalScore) }}>{scoreLabel(finalScore)}</p>

        {isContractor ? (
          <div className="rounded-xl p-4 text-center" style={{ background: "oklch(0.96 0.04 255)", border: "1px solid oklch(0.88 0.12 255)" }}>
            <p className="text-sm font-semibold" style={{ color: "oklch(0.42 0.18 255)" }}>Peer Evaluations Average</p>
            <p className="text-2xl font-bold mt-1" style={{ color: contractorScore !== null ? scoreColor(contractorScore) : "oklch(0.72 0.006 80)" }}>
              {contractorScore !== null ? contractorScore.toFixed(2) : "—"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3 text-center" style={{ background: "oklch(0.96 0.04 255)", border: "1px solid oklch(0.88 0.12 255)" }}>
              <p className="text-xs font-semibold mb-1" style={{ color: "oklch(0.42 0.18 255)" }}>
                <User size={11} className="inline mr-1" />Self (20%)
              </p>
              <p className="text-xl font-bold" style={{ color: selfScore !== null ? scoreColor(selfScore) : "oklch(0.72 0.006 80)" }}>
                {selfScore !== null ? selfScore.toFixed(2) : "—"}
              </p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: "oklch(0.96 0.08 65)", border: "1px solid oklch(0.88 0.12 65)" }}>
              <p className="text-xs font-semibold mb-1" style={{ color: "oklch(0.52 0.15 65)" }}>
                <Users size={11} className="inline mr-1" />Peer & Manager (80%)
              </p>
              <p className="text-xl font-bold" style={{ color: peerManagerAvg !== null ? scoreColor(peerManagerAvg) : "oklch(0.72 0.006 80)" }}>
                {peerManagerAvg !== null ? peerManagerAvg.toFixed(2) : "—"}
              </p>
            </div>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>Category Breakdown</h3>
        <div className="space-y-3">
          {isContractor ? (
            <CategoryTable categories={contractorCats} label="Contractor Evaluations (avg)" icon={<ClipboardList size={15} />} color="oklch(0.42 0.18 255)" totalAvg={contractorScore} />
          ) : (
            <>
              {selfCats.length > 0 && (
                <CategoryTable categories={selfCats} label="Self Evaluation" icon={<User size={15} />} color="oklch(0.42 0.18 255)" totalAvg={selfScore} />
              )}
              {hasPeerManager && (
                <CategoryTable categories={mergedPeerManagerCats} label="Peer & Manager Evaluations (weighted avg)" icon={<Users size={15} />} color="oklch(0.52 0.15 65)" totalAvg={peerManagerAvg} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Cycle List ────────────────────────────────────────────────────────────────
function CycleList({ results, onSelect, empName }: { results: any[]; onSelect: (idx: number) => void; empName: string }) {
  if (results.length === 0) {
    return (
      <div className="rounded-xl border p-10 text-center mt-4" style={{ borderColor: "oklch(0.88 0.006 80)" }}>
        <Award size={32} className="mx-auto mb-3" style={{ color: "oklch(0.82 0.006 80)" }} />
        <p className="font-semibold text-sm" style={{ color: "oklch(0.45 0.012 65)" }}>No evaluation results yet</p>
        <p className="text-xs mt-1" style={{ color: "oklch(0.65 0.012 65)" }}>{empName} has not participated in any evaluation cycles.</p>
      </div>
    );
  }
  return (
    <div className="space-y-3 mt-4">
      {results.map((r: any, i: number) => {
        const isClosed = r.status === "closed";
        const finalScore = r.finalScore ?? null;
        const closeDate = r.closeDate ? new Date(r.closeDate) : null;
        return (
          <button key={r.cycleId} onClick={() => onSelect(i)}
            className="w-full text-left rounded-xl border p-4 transition-all hover:shadow-md hover:-translate-y-0.5"
            style={{ borderColor: "oklch(0.88 0.006 80)", background: "white" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: isClosed ? "oklch(0.93 0.006 80)" : "oklch(0.93 0.18 255)" }}>
                  {isClosed ? <CheckCircle2 size={18} style={{ color: "oklch(0.55 0.012 65)" }} /> : <Clock size={18} style={{ color: "oklch(0.42 0.18 255)" }} />}
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "oklch(0.22 0.012 65)" }}>{r.period}</p>
                  {closeDate && (
                    <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "oklch(0.65 0.012 65)" }}>
                      <Calendar size={11} />{isClosed ? "Closed" : "Closes"} {closeDate.toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {finalScore !== null ? (
                  <div className="text-right">
                    <p className="text-lg font-bold" style={{ color: scoreColor(finalScore) }}>{finalScore.toFixed(2)}</p>
                    <p className="text-xs" style={{ color: "oklch(0.65 0.012 65)" }}>{scoreLabel(finalScore)}</p>
                  </div>
                ) : (
                  <span className="text-xs px-2 py-1 rounded-full" style={{ background: "oklch(0.93 0.18 255)", color: "oklch(0.42 0.18 255)" }}>In Progress</span>
                )}
                <span style={{ color: "oklch(0.72 0.006 80)" }}>›</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminPerformance() {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const { data: employees = [] } = trpc.employee.list.useQuery();
  const { data: results = [], isLoading } = trpc.performance.computedResults.useQuery(
    { employeeId: selectedEmployeeId! },
    { enabled: selectedEmployeeId !== null }
  );

  const selectedEmp = (employees as any[]).find((e: any) => e.id === selectedEmployeeId);
  const empName = selectedEmp ? `${selectedEmp.firstName} ${selectedEmp.lastName}` : "";

  function handleEmployeeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedEmployeeId(e.target.value ? parseInt(e.target.value) : null);
    setSelectedIdx(null);
  }

  if (selectedEmployeeId !== null && selectedIdx !== null) {
    return (
      <div className="p-6">
        <CycleDetail result={(results as any[])[selectedIdx]} onBack={() => setSelectedIdx(null)} empName={empName} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BarChart2 size={20} style={{ color: "oklch(0.42 0.18 255)" }} />
          <h2 className="text-xl font-bold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>Performance Results</h2>
        </div>
        <p className="text-sm" style={{ color: "oklch(0.55 0.012 65)" }}>View evaluation results for any employee</p>
      </div>

      {/* Employee Selector */}
      <div>
        <label className="block text-xs font-semibold mb-2" style={{ color: "oklch(0.45 0.012 65)" }}>Select Employee</label>
        <div className="relative">
          <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "oklch(0.65 0.012 65)" }} />
          <select value={selectedEmployeeId ?? ""} onChange={handleEmployeeChange}
            className="w-full pl-9 pr-8 py-2.5 rounded-xl border text-sm outline-none appearance-none"
            style={{ borderColor: "oklch(0.88 0.006 80)", background: "white", color: selectedEmployeeId ? "oklch(0.22 0.012 65)" : "oklch(0.65 0.012 65)" }}>
            <option value="">— Choose an employee —</option>
            {(employees as any[]).map((emp: any) => (
              <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} · {emp.position ?? emp.employmentType}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "oklch(0.65 0.012 65)" }} />
        </div>
      </div>

      {selectedEmployeeId === null ? (
        <div className="rounded-xl border p-10 text-center" style={{ borderColor: "oklch(0.88 0.006 80)", background: "oklch(0.98 0.004 80)" }}>
          <BarChart2 size={32} className="mx-auto mb-3" style={{ color: "oklch(0.82 0.006 80)" }} />
          <p className="text-sm font-medium" style={{ color: "oklch(0.55 0.012 65)" }}>Select an employee to view their performance results</p>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin" style={{ color: "oklch(0.42 0.18 255)" }} />
        </div>
      ) : (
        <CycleList results={results as any[]} onSelect={setSelectedIdx} empName={empName} />
      )}
    </div>
  );
}
