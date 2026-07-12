/**
 * PerformanceResults.tsx — Performance Evaluation Results
 * Two-level navigation:
 *   Level 1: Cycle list (all cycles the employee participated in, with status)
 *   Level 2: Cycle detail (self 20%, peer+manager 80% breakdown)
 */
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import {
  Star, Award, Loader2, User, Users, ChevronDown, ChevronUp,
  ClipboardList, ArrowLeft, Calendar, CheckCircle2, Clock
} from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number | null) {
  if (score === null) return "oklch(0.72 0.006 80)";
  if (score >= 4.5) return "oklch(0.42 0.18 145)";
  if (score >= 3.5) return "oklch(0.42 0.18 255)";
  if (score >= 2.5) return "oklch(0.52 0.15 65)";
  return "oklch(0.52 0.18 27)";
}

function scoreLabel(score: number | null) {
  if (score === null) return "N/A";
  if (score >= 4.5) return "Outstanding";
  if (score >= 3.5) return "Excellent";
  if (score >= 2.5) return "Good";
  if (score >= 1.5) return "Needs Improvement";
  return "Unsatisfactory";
}

function ScoreBar({ score, max = 5 }: { score: number | null; max?: number }) {
  const pct = score !== null ? Math.round((score / max) * 100) : 0;
  return (
    <div className="h-2 rounded-full overflow-hidden" style={{ background: "oklch(0.93 0.006 80)" }}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: scoreColor(score) }}
      />
    </div>
  );
}

function ScoreBadge({ score }: { score: number | null }) {
  return (
    <span
      className="text-xs font-bold px-2 py-0.5 rounded-full"
      style={{
        background: score !== null ? `${scoreColor(score)}22` : "oklch(0.93 0.006 80)",
        color: scoreColor(score),
      }}
    >
      {score !== null ? score.toFixed(2) : "N/A"}
    </span>
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
  const total = totalAvg;

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "oklch(0.88 0.006 80)" }}>
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        style={{ background: `${color}11` }}
      >
        <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color }}>
          {icon}{label}
        </span>
        <ScoreBadge score={total} />
        <span className="ml-auto">{expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
      </button>
      {expanded && (
        <div className="divide-y" style={{ borderColor: "oklch(0.93 0.006 80)" }}>
          {categories.map((cat, i) => (
            <div key={i} className="px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm" style={{ color: "oklch(0.32 0.012 65)" }}>
                  {cat.name}
                  {cat.weight != null && cat.weight > 0 && (
                    <span className="ml-1.5 text-xs" style={{ color: "oklch(0.65 0.012 65)" }}>({cat.weight}%)</span>
                  )}
                </span>
                <ScoreBadge score={cat.avg} />
              </div>
              <ScoreBar score={cat.avg} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function mergeCategories(
  peerCats: Array<{ name: string; avg: number; count: number }>,
  managerCats: Array<{ name: string; avg: number; count: number }>,
  peerWeight: number,
  managerWeight: number
): Array<{ name: string; avg: number; count: number }> {
  const allNames = Array.from(new Set([...peerCats.map(c => c.name), ...managerCats.map(c => c.name)]));
  return allNames.map(name => {
    const p = peerCats.find(c => c.name === name);
    const m = managerCats.find(c => c.name === name);
    if (p && m) {
      const totalW = peerWeight + managerWeight;
      return { name, avg: (p.avg * peerWeight + m.avg * managerWeight) / totalW, count: p.count + m.count };
    }
    return p ? { ...p } : { ...m! };
  });
}

// ── Cycle List ────────────────────────────────────────────────────────────────

function CycleList({
  results,
  onSelect,
}: {
  results: any[];
  onSelect: (idx: number) => void;
}) {
  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold mb-1" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
          Performance Results
        </h2>
        <p className="text-sm" style={{ color: "oklch(0.55 0.012 65)" }}>
          Select an evaluation cycle to view your detailed results
        </p>
      </div>

      <div className="space-y-3">
        {results.map((r: any, i: number) => {
          const isClosed = r.status === "closed";
          const finalScore = r.finalScore ?? null;
          const closeDate = r.closeDate ? new Date(r.closeDate) : null;

          return (
            <button
              key={r.cycleId}
              onClick={() => onSelect(i)}
              className="w-full text-left rounded-xl border p-4 transition-all hover:shadow-md hover:-translate-y-0.5"
              style={{ borderColor: "oklch(0.88 0.006 80)", background: "white" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: isClosed ? "oklch(0.93 0.006 80)" : "oklch(0.93 0.18 255)" }}
                  >
                    {isClosed
                      ? <CheckCircle2 size={18} style={{ color: "oklch(0.55 0.012 65)" }} />
                      : <Clock size={18} style={{ color: "oklch(0.42 0.18 255)" }} />
                    }
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "oklch(0.22 0.012 65)" }}>
                      {r.period}
                    </p>
                    {closeDate && (
                      <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "oklch(0.65 0.012 65)" }}>
                        <Calendar size={11} />
                        {isClosed ? "Closed" : "Closes"} {closeDate.toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {finalScore !== null ? (
                    <div className="text-right">
                      <p className="text-lg font-bold" style={{ color: scoreColor(finalScore) }}>
                        {finalScore.toFixed(2)}
                      </p>
                      <p className="text-xs" style={{ color: "oklch(0.65 0.012 65)" }}>
                        {scoreLabel(finalScore)}
                      </p>
                    </div>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full" style={{ background: "oklch(0.93 0.18 255)", color: "oklch(0.42 0.18 255)" }}>
                      In Progress
                    </span>
                  )}
                  <span style={{ color: "oklch(0.72 0.006 80)" }}>›</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Cycle Detail ──────────────────────────────────────────────────────────────

function CycleDetail({ result, onBack }: { result: any; onBack: () => void }) {
  const selfScore = result?.self?.totalAvg ?? null;
  const peerScore = result?.peer?.totalAvg ?? null;
  const managerScore = result?.manager?.totalAvg ?? null;
  const contractorScore = result?.contractor?.totalAvg ?? null;
  const finalScore = result?.finalScore ?? null;

  const peerManagerScore: number | null = (() => {
    if (peerScore !== null && managerScore !== null) return (peerScore * 3 + managerScore * 5) / 8;
    if (peerScore !== null) return peerScore;
    if (managerScore !== null) return managerScore;
    return null;
  })();

  const peerCats: Array<{ name: string; avg: number; count: number }> = (result?.peer?.categoryScores as any[]) ?? [];
  const managerCats: Array<{ name: string; avg: number; count: number }> = (result?.manager?.categoryScores as any[]) ?? [];
  const combinedCats = mergeCategories(peerCats, managerCats, 3, 5);

  const isClosed = result?.status === "closed";

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Back navigation */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-70"
        style={{ color: "oklch(0.42 0.18 255)" }}
      >
        <ArrowLeft size={15} />
        All Evaluation Cycles
      </button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold mb-0.5" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
            {result.period}
          </h2>
          <p className="text-sm" style={{ color: "oklch(0.55 0.012 65)" }}>
            Evaluation breakdown by self and peer &amp; manager assessments
          </p>
        </div>
        <span
          className="text-xs font-medium px-3 py-1.5 rounded-full"
          style={{
            background: isClosed ? "oklch(0.93 0.006 80)" : "oklch(0.93 0.18 255)",
            color: isClosed ? "oklch(0.45 0.012 65)" : "oklch(0.42 0.18 255)",
          }}
        >
          {isClosed ? "Final" : "In Progress"}
        </span>
      </div>

      {/* Final Score Summary Card */}
      <div className="rounded-xl border p-5" style={{ borderColor: "oklch(0.88 0.006 80)", background: "white" }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-medium mb-1" style={{ color: "oklch(0.55 0.012 65)" }}>
              Final Weighted Score
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold" style={{ color: scoreColor(finalScore), fontFamily: "'DM Sans', sans-serif" }}>
                {finalScore !== null ? finalScore.toFixed(2) : "—"}
              </span>
              <span className="text-sm" style={{ color: "oklch(0.65 0.012 65)" }}>/ 5.00</span>
            </div>
            <p className="text-sm font-semibold mt-1" style={{ color: scoreColor(finalScore) }}>
              {finalScore !== null ? scoreLabel(finalScore) : "Pending"}
            </p>
          </div>
          <Star size={28} style={{ color: scoreColor(finalScore), opacity: 0.4 }} />
        </div>

        {/* Score breakdown: Self 20% | Peer & Manager 80% */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: "oklch(0.93 0.006 80)" }}>
          <div className="text-center p-3 rounded-lg" style={{ background: "oklch(0.97 0.006 255)" }}>
            <div className="flex items-center justify-center gap-1 mb-1">
              <User size={12} style={{ color: "oklch(0.42 0.18 255)" }} />
              <span className="text-xs font-medium" style={{ color: "oklch(0.42 0.18 255)" }}>Self (20%)</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: scoreColor(selfScore) }}>
              {selfScore !== null ? selfScore.toFixed(2) : "—"}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg" style={{ background: "oklch(0.97 0.006 65)" }}>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users size={12} style={{ color: "oklch(0.42 0.15 65)" }} />
              <span className="text-xs font-medium" style={{ color: "oklch(0.42 0.15 65)" }}>Peer &amp; Manager (80%)</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: scoreColor(peerManagerScore) }}>
              {peerManagerScore !== null ? peerManagerScore.toFixed(2) : "—"}
            </p>
            {peerScore !== null && managerScore !== null && (
              <p className="text-xs mt-0.5" style={{ color: "oklch(0.65 0.012 65)" }}>
                Peer {peerScore.toFixed(2)} · Mgr {managerScore.toFixed(2)}
              </p>
            )}
          </div>
        </div>

        {contractorScore !== null && (
          <div className="mt-3 pt-3 border-t flex items-center gap-2" style={{ borderColor: "oklch(0.93 0.006 80)" }}>
            <ClipboardList size={12} style={{ color: "oklch(0.42 0.15 300)" }} />
            <span className="text-xs" style={{ color: "oklch(0.55 0.012 65)" }}>Contractor evaluations avg:</span>
            <ScoreBadge score={contractorScore} />
          </div>
        )}

        <p className="text-xs mt-3 pt-3 border-t" style={{ borderColor: "oklch(0.93 0.006 80)", color: "oklch(0.65 0.012 65)" }}>
          {managerScore !== null
            ? "Final score = Self × 20% + Peer × 30% + Manager × 50%"
            : "Final score = Self × 20% + Peer × 80% (no manager evaluation)"
          }
          {(selfScore === null || peerManagerScore === null) && " (partial — some evaluations pending)"}
        </p>
      </div>

      {/* Per-category breakdown */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold" style={{ color: "oklch(0.32 0.012 65)" }}>Category Breakdown</h3>

        <CategoryTable
          categories={(result.self?.categoryScores as any[]) ?? []}
          label="Self Evaluation"
          icon={<User size={13} />}
          color="oklch(0.42 0.18 255)"
          totalAvg={result.self?.totalAvg ?? null}
        />

        <CategoryTable
          categories={combinedCats}
          label="Peer & Manager Evaluations (weighted avg)"
          icon={<Users size={13} />}
          color="oklch(0.42 0.15 65)"
          totalAvg={peerManagerScore}
        />

        {(result.contractor?.categoryScores as any[])?.length > 0 && (
          <CategoryTable
            categories={(result.contractor?.categoryScores as any[]) ?? []}
            label="Contractor Evaluations (avg)"
            icon={<ClipboardList size={13} />}
            color="oklch(0.42 0.15 300)"
            totalAvg={contractorScore}
          />
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function PerformanceResults() {
  const { user } = useAuth();
  const { data: emp } = trpc.employee.me.useQuery(undefined, { enabled: !!user });
  const { data: results = [], isLoading } = trpc.performance.computedResults.useQuery(
    { employeeId: emp?.id ?? 0 },
    { enabled: !!emp?.id }
  );

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center py-24">
        <Loader2 size={28} className="animate-spin" style={{ color: "oklch(0.42 0.18 255)" }} />
      </div>
    );
  }

  if ((results as any[]).length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-1" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
            Performance Results
          </h2>
          <p className="text-sm" style={{ color: "oklch(0.55 0.012 65)" }}>
            Your evaluation results and performance breakdown
          </p>
        </div>
        <div className="rounded-xl border p-12 text-center" style={{ borderColor: "oklch(0.88 0.006 80)" }}>
          <Award size={36} className="mx-auto mb-3" style={{ color: "oklch(0.82 0.006 80)" }} />
          <p className="font-semibold" style={{ color: "oklch(0.45 0.012 65)" }}>No evaluation results yet</p>
          <p className="text-sm mt-1" style={{ color: "oklch(0.65 0.012 65)" }}>
            Results will appear here once evaluations have been submitted and processed.
          </p>
        </div>
      </div>
    );
  }

  // Show detail if a cycle is selected
  if (selectedIdx !== null) {
    return (
      <CycleDetail
        result={(results as any[])[selectedIdx]}
        onBack={() => setSelectedIdx(null)}
      />
    );
  }

  // Show cycle list
  return (
    <CycleList
      results={results as any[]}
      onSelect={setSelectedIdx}
    />
  );
}
