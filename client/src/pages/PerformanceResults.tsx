/**
 * PerformanceResults.tsx — Performance Evaluation Results
 * Design: Warm Slate
 * Data: real DB via trpc.performance.list
 */
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { Star, Award, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const gradeColor: Record<string, { bg: string; text: string; border: string }> = {
  Outstanding: { bg: "oklch(0.92 0.08 80)", text: "oklch(0.45 0.14 65)", border: "oklch(0.82 0.12 65)" },
  Excellent: { bg: "oklch(0.92 0.08 145)", text: "oklch(0.35 0.16 145)", border: "oklch(0.78 0.14 145)" },
  Good: { bg: "oklch(0.92 0.08 255)", text: "oklch(0.42 0.18 255)", border: "oklch(0.82 0.12 255)" },
  "Needs Improvement": { bg: "oklch(0.95 0.06 27)", text: "oklch(0.45 0.2 27)", border: "oklch(0.85 0.1 27)" },
};

export default function PerformanceResults() {
  const { user } = useAuth();
  const { data: emp } = trpc.employee.me.useQuery(undefined, { enabled: !!user });
  const { data: results = [], isLoading } = trpc.performance.list.useQuery(
    { employeeId: emp?.id ?? 0 },
    { enabled: !!emp?.id }
  );

  const [selectedIdx, setSelectedIdx] = useState(0);
  const selected = results[selectedIdx] as any;
  const grade = selected ? (gradeColor[selected.grade] || gradeColor.Good) : gradeColor.Good;

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center py-24">
        <Loader2 size={28} className="animate-spin" style={{ color: "oklch(0.42 0.18 255)" }} />
      </div>
    );
  }

  if (results.length === 0) {
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
        <div className="hr-card p-12 text-center">
          <Award size={40} className="mx-auto mb-3" style={{ color: "oklch(0.72 0.006 80)" }} />
          <p className="text-sm font-medium" style={{ color: "oklch(0.45 0.012 65)" }}>No performance results yet</p>
          <p className="text-xs mt-1" style={{ color: "oklch(0.65 0.01 65)" }}>Results will appear here after evaluations are completed</p>
        </div>
      </div>
    );
  }

  const overallScore = selected?.overallScore ?? 0;
  const scoreAngle = overallScore * 3.6;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold mb-1" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
            Performance Results
          </h2>
          <p className="text-sm" style={{ color: "oklch(0.55 0.012 65)" }}>
            Your evaluation results and performance breakdown
          </p>
        </div>
        {/* Period Selector */}
        {results.length > 1 && (
          <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: "oklch(0.94 0.004 80)" }}>
            {results.map((r: any, i: number) => (
              <button
                key={r.id}
                onClick={() => setSelectedIdx(i)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150",
                  selectedIdx === i ? "bg-white shadow-sm" : "hover:bg-white/50"
                )}
                style={{ color: selectedIdx === i ? "oklch(0.22 0.012 65)" : "oklch(0.55 0.012 65)" }}
              >
                {r.periodLabel ?? `Period ${i + 1}`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Score Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="hr-card p-6 flex flex-col items-center justify-center text-center">
          <div
            className="w-24 h-24 rounded-full flex flex-col items-center justify-center mb-4"
            style={{
              background: `conic-gradient(oklch(0.72 0.15 65) ${scoreAngle}deg, oklch(0.92 0.004 80) 0deg)`,
            }}
          >
            <div className="w-20 h-20 rounded-full flex flex-col items-center justify-center bg-white">
              <span className="text-2xl font-bold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif", lineHeight: 1 }}>
                {overallScore}
              </span>
              <span className="text-xs" style={{ color: "oklch(0.55 0.012 65)" }}>/100</span>
            </div>
          </div>
          <p className="text-xs font-medium mb-2" style={{ color: "oklch(0.55 0.012 65)" }}>Overall Score</p>
          {selected?.grade && (
            <span
              className="px-3 py-1 rounded-full text-sm font-semibold"
              style={{ background: grade.bg, color: grade.text, border: `1px solid ${grade.border}` }}
            >
              {selected.grade}
            </span>
          )}
          {selected?.periodLabel && (
            <p className="text-xs mt-3" style={{ color: "oklch(0.65 0.01 65)" }}>
              {selected.periodLabel}
            </p>
          )}
        </div>

        {/* KPI Breakdown */}
        <div className="hr-card overflow-hidden lg:col-span-2">
          <div className="p-5 border-b" style={{ borderColor: "oklch(0.88 0.006 80)" }}>
            <h3 className="text-sm font-semibold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
              KPI Breakdown
            </h3>
          </div>
          {selected?.kpiScores && selected.kpiScores.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr style={{ background: "oklch(0.975 0.006 80)" }}>
                  {["KPI", "Weight", "Score"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "oklch(0.55 0.012 65)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selected.kpiScores.map((row: any, i: number) => (
                  <tr key={i} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: "oklch(0.92 0.004 80)" }}>
                    <td className="px-5 py-3 text-sm" style={{ color: "oklch(0.22 0.012 65)" }}>{row.kpiName}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "oklch(0.92 0.004 80)", color: "oklch(0.45 0.012 65)" }}>
                        {row.weight ?? "—"}%
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 max-w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "oklch(0.92 0.004 80)" }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${row.score ?? 0}%`,
                              background: (row.score ?? 0) >= 90 ? "oklch(0.52 0.18 145)" : (row.score ?? 0) >= 80 ? "oklch(0.42 0.18 255)" : "oklch(0.72 0.15 65)",
                            }}
                          />
                        </div>
                        <span className="text-sm font-semibold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'JetBrains Mono', monospace", fontSize: "13px" }}>
                          {row.score ?? "—"}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-10">
              <p className="text-sm" style={{ color: "oklch(0.65 0.01 65)" }}>No KPI breakdown available</p>
            </div>
          )}
        </div>
      </div>

      {/* Comments */}
      {selected?.comments && (
        <div className="hr-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Star size={16} style={{ color: "oklch(0.42 0.18 255)" }} />
            <h3 className="text-sm font-semibold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
              Comments
            </h3>
          </div>
          <p className="text-sm leading-relaxed p-4 rounded-lg" style={{ background: "oklch(0.975 0.006 80)", color: "oklch(0.28 0.012 65)" }}>
            {selected.comments}
          </p>
        </div>
      )}
    </div>
  );
}
