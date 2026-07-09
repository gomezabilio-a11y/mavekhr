/**
 * PeriodicEvaluation.tsx — Periodic Evaluation Tasks
 * Design: Warm Slate
 */
import { evaluationData } from "@/lib/mockData";
import { ClipboardList, CheckCircle2, Clock, ChevronRight, Lock, User, Users, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  Pending: { label: "Pending", bg: "oklch(0.92 0.08 80)", text: "oklch(0.45 0.14 65)" },
  Completed: { label: "Completed", bg: "oklch(0.92 0.08 145)", text: "oklch(0.35 0.16 145)" },
  Mixed: { label: "In Progress", bg: "oklch(0.92 0.08 255)", text: "oklch(0.42 0.18 255)" },
};

export default function PeriodicEvaluation() {
  const isOpen = evaluationData.status === "Open";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold mb-1" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
            Periodic Evaluation
          </h2>
          <p className="text-sm" style={{ color: "oklch(0.55 0.012 65)" }}>
            Complete your evaluations for the current period
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{
              background: isOpen ? "oklch(0.92 0.08 145)" : "oklch(0.94 0.004 80)",
              color: isOpen ? "oklch(0.35 0.16 145)" : "oklch(0.55 0.012 65)",
            }}
          >
            {isOpen ? "🟢 Open" : "🔒 Closed"}
          </span>
          <span className="text-sm font-semibold" style={{ color: "oklch(0.22 0.012 65)" }}>
            {evaluationData.period}
          </span>
        </div>
      </div>

      {!isOpen ? (
        <div className="hr-card p-12 flex flex-col items-center justify-center text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ background: "oklch(0.94 0.004 80)" }}
          >
            <Lock size={24} style={{ color: "oklch(0.65 0.01 65)" }} />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
            Evaluation Closed
          </h3>
          <p className="text-sm max-w-sm" style={{ color: "oklch(0.55 0.012 65)" }}>
            The evaluation period is not currently active. You will be notified when the next evaluation opens.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Progress Overview */}
          <div className="hr-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
                Overall Progress
              </h3>
              <span className="text-xs" style={{ color: "oklch(0.55 0.012 65)" }}>2 of 5 completed</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "oklch(0.92 0.004 80)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: "40%", background: "oklch(0.42 0.18 255)" }}
              />
            </div>
          </div>

          {/* Self Evaluation */}
          <div className="hr-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "oklch(0.92 0.08 255)" }}>
                <User size={16} style={{ color: "oklch(0.42 0.18 255)" }} />
              </div>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
                  Self Evaluation
                </h3>
                <p className="text-xs" style={{ color: "oklch(0.55 0.012 65)" }}>Evaluate your own performance</p>
              </div>
              <span
                className="ml-auto text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: statusConfig.Pending.bg, color: statusConfig.Pending.text }}
              >
                Pending
              </span>
            </div>
            <button
              onClick={() => toast.info("Self Evaluation form — Coming Soon")}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
              style={{ background: "oklch(0.42 0.18 255)", color: "white" }}
            >
              <ClipboardList size={14} />
              Start Self Evaluation
            </button>
          </div>

          {/* Peer Evaluations */}
          <div className="hr-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "oklch(0.92 0.08 145)" }}>
                <Users size={16} style={{ color: "oklch(0.42 0.18 145)" }} />
              </div>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
                  Peer Evaluations
                </h3>
                <p className="text-xs" style={{ color: "oklch(0.55 0.012 65)" }}>Evaluate your colleagues</p>
              </div>
              <span
                className="ml-auto text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: statusConfig.Mixed.bg, color: statusConfig.Mixed.text }}
              >
                In Progress
              </span>
            </div>
            <div className="space-y-2">
              {evaluationData.tasks[1].peers?.map((peer, i) => (
                <button
                  key={i}
                  onClick={() =>
                    peer.status === "Completed"
                      ? toast.info(`${peer.name}'s evaluation already submitted`)
                      : toast.info(`Opening evaluation for ${peer.name}...`)
                  }
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors hover:bg-gray-50"
                  style={{ border: "1px solid oklch(0.88 0.006 80)" }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                    style={{ background: "oklch(0.42 0.18 255)", color: "white" }}
                  >
                    {peer.name[0]}
                  </div>
                  <span className="flex-1 text-sm font-medium" style={{ color: "oklch(0.22 0.012 65)" }}>
                    {peer.name}
                  </span>
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{
                      background: peer.status === "Completed" ? statusConfig.Completed.bg : statusConfig.Pending.bg,
                      color: peer.status === "Completed" ? statusConfig.Completed.text : statusConfig.Pending.text,
                    }}
                  >
                    {peer.status === "Completed" ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 size={10} />
                        Done
                      </span>
                    ) : (
                      "Pending"
                    )}
                  </span>
                  {peer.status !== "Completed" && (
                    <ChevronRight size={14} style={{ color: "oklch(0.65 0.01 65)" }} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Manager Evaluation */}
          <div className="hr-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "oklch(0.92 0.08 80)" }}>
                <Briefcase size={16} style={{ color: "oklch(0.52 0.15 65)" }} />
              </div>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
                  Manager Evaluation
                </h3>
                <p className="text-xs" style={{ color: "oklch(0.55 0.012 65)" }}>Evaluate your direct reports</p>
              </div>
              <span
                className="ml-auto text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: statusConfig.Pending.bg, color: statusConfig.Pending.text }}
              >
                Pending
              </span>
            </div>
            <button
              onClick={() => toast.info("Manager Evaluation form — Coming Soon")}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
              style={{ background: "oklch(0.52 0.15 65)", color: "white" }}
            >
              <ClipboardList size={14} />
              Start Manager Evaluation
            </button>
          </div>

          {/* Submit Notice */}
          <div
            className="p-4 rounded-lg flex items-start gap-3 text-sm"
            style={{ background: "oklch(0.95 0.06 27)", border: "1px solid oklch(0.88 0.1 27)" }}
          >
            <Lock size={14} className="mt-0.5 flex-shrink-0" style={{ color: "oklch(0.52 0.2 27)" }} />
            <p style={{ color: "oklch(0.38 0.18 27)" }}>
              Once submitted, evaluations <strong>cannot be modified</strong>. Please review carefully before submitting.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
