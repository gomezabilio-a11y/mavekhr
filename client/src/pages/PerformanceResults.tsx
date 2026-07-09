/**
 * PerformanceResults.tsx — Performance Evaluation Results
 * Design: Warm Slate
 * Features: Overall score, grade, radar chart, breakdown table, source weights, comments, history
 */
import { performanceData } from "@/lib/mockData";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Star, MessageSquare, Clock, TrendingUp, User, Users, Award } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const gradeColor: Record<string, { bg: string; text: string; border: string }> = {
  Outstanding: { bg: "oklch(0.92 0.08 80)", text: "oklch(0.45 0.14 65)", border: "oklch(0.82 0.12 65)" },
  Excellent: { bg: "oklch(0.92 0.08 145)", text: "oklch(0.35 0.16 145)", border: "oklch(0.78 0.14 145)" },
  Good: { bg: "oklch(0.92 0.08 255)", text: "oklch(0.42 0.18 255)", border: "oklch(0.82 0.12 255)" },
};

export default function PerformanceResults() {
  const [selectedPeriod, setSelectedPeriod] = useState("July 2026");
  const grade = gradeColor[performanceData.grade] || gradeColor.Good;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold mb-1" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
            Performance Results
          </h2>
          <p className="text-sm" style={{ color: "oklch(0.55 0.012 65)" }}>
            Your evaluation results and performance breakdown
          </p>
        </div>
        {/* Period Selector */}
        <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: "oklch(0.94 0.004 80)" }}>
          {performanceData.history.map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150",
                selectedPeriod === period
                  ? "bg-white shadow-sm"
                  : "hover:bg-white/50"
              )}
              style={{
                color: selectedPeriod === period ? "oklch(0.22 0.012 65)" : "oklch(0.55 0.012 65)",
              }}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Top Row: Score + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Card */}
        <div className="hr-card p-6 flex flex-col items-center justify-center text-center">
          <div
            className="w-24 h-24 rounded-full flex flex-col items-center justify-center mb-4"
            style={{
              background: `conic-gradient(oklch(0.72 0.15 65) ${performanceData.overallScore * 3.6}deg, oklch(0.92 0.004 80) 0deg)`,
            }}
          >
            <div
              className="w-20 h-20 rounded-full flex flex-col items-center justify-center bg-white"
            >
              <span className="text-2xl font-bold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif", lineHeight: 1 }}>
                {performanceData.overallScore}
              </span>
              <span className="text-xs" style={{ color: "oklch(0.55 0.012 65)" }}>/100</span>
            </div>
          </div>
          <p className="text-xs font-medium mb-2" style={{ color: "oklch(0.55 0.012 65)" }}>
            Overall Score
          </p>
          <span
            className="px-3 py-1 rounded-full text-sm font-semibold"
            style={{ background: grade.bg, color: grade.text, border: `1px solid ${grade.border}` }}
          >
            {performanceData.grade}
          </span>
        </div>

        {/* Radar Chart */}
        <div className="hr-card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold mb-3" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
            Competency Radar
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={performanceData.radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
              <PolarGrid stroke="oklch(0.88 0.006 80)" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fontSize: 11, fill: "oklch(0.55 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}
              />
              <Radar
                name="Score"
                dataKey="score"
                stroke="oklch(0.42 0.18 255)"
                fill="oklch(0.42 0.18 255)"
                fillOpacity={0.15}
                strokeWidth={2}
              />
              <Tooltip
                contentStyle={{
                  background: "white",
                  border: "1px solid oklch(0.88 0.006 80)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Breakdown + Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Breakdown Table */}
        <div className="hr-card overflow-hidden lg:col-span-2">
          <div className="p-5 border-b" style={{ borderColor: "oklch(0.88 0.006 80)" }}>
            <h3 className="text-sm font-semibold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
              Evaluation Breakdown
            </h3>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ background: "oklch(0.975 0.006 80)" }}>
                {["Category", "Weight", "Score"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "oklch(0.55 0.012 65)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {performanceData.breakdown.map((row, i) => (
                <tr key={i} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: "oklch(0.92 0.004 80)" }}>
                  <td className="px-5 py-3 text-sm" style={{ color: "oklch(0.22 0.012 65)" }}>
                    {row.category}
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "oklch(0.92 0.004 80)", color: "oklch(0.45 0.012 65)" }}>
                      {row.weight}%
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 max-w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "oklch(0.92 0.004 80)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${row.score}%`,
                            background: row.score >= 90 ? "oklch(0.52 0.18 145)" : row.score >= 80 ? "oklch(0.42 0.18 255)" : "oklch(0.72 0.15 65)",
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'JetBrains Mono', monospace", fontSize: "13px" }}>
                        {row.score}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Evaluation Sources */}
        <div className="hr-card p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
            Evaluation Sources
          </h3>
          <div className="space-y-3">
            {performanceData.sources.map((src, i) => {
              const icons = [User, Users, TrendingUp];
              const Icon = icons[i];
              const colors = [
                { bg: "oklch(0.92 0.08 255)", icon: "oklch(0.42 0.18 255)" },
                { bg: "oklch(0.92 0.08 145)", icon: "oklch(0.42 0.18 145)" },
                { bg: "oklch(0.92 0.08 80)", icon: "oklch(0.52 0.15 65)" },
              ];
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg" style={{ border: "1px solid oklch(0.88 0.006 80)" }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: colors[i].bg }}>
                    <Icon size={15} style={{ color: colors[i].icon }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium" style={{ color: "oklch(0.35 0.012 65)" }}>{src.label}</span>
                      <span className="text-xs font-bold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'JetBrains Mono', monospace" }}>
                        {src.score}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "oklch(0.92 0.004 80)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${src.weight}%`, background: colors[i].icon }}
                      />
                    </div>
                    <span className="text-xs mt-0.5 block" style={{ color: "oklch(0.65 0.01 65)" }}>
                      {src.weight}% weight
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Comments */}
      <div className="hr-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare size={16} style={{ color: "oklch(0.42 0.18 255)" }} />
          <h3 className="text-sm font-semibold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
            Comments
          </h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[
            { label: "Manager Comment", text: performanceData.comments.manager, color: "oklch(0.92 0.08 255)", border: "oklch(0.82 0.1 255)" },
            { label: "Peer Summary", text: performanceData.comments.peer, color: "oklch(0.92 0.08 145)", border: "oklch(0.78 0.12 145)" },
            { label: "Self Reflection", text: performanceData.comments.self, color: "oklch(0.92 0.08 80)", border: "oklch(0.82 0.1 65)" },
          ].map((c, i) => (
            <div key={i} className="p-4 rounded-lg" style={{ background: c.color, border: `1px solid ${c.border}` }}>
              <p className="text-xs font-semibold mb-2" style={{ color: "oklch(0.35 0.012 65)" }}>
                {c.label}
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "oklch(0.28 0.012 65)" }}>
                {c.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
