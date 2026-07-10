/**
 * FinancialHistory.tsx — Payroll & Salary History
 * Design: Warm Slate
 * Data: real DB via trpc.salary.list
 */
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { DollarSign, Download, CheckCircle2, TrendingUp, Loader2 } from "lucide-react";
import { toast } from "sonner";

const statusBadge = (status: string) => {
  if (status === "paid") return "status-badge completed";
  if (status === "pending") return "status-badge pending";
  return "status-badge";
};

export default function FinancialHistory() {
  const { user } = useAuth();
  const { data: emp } = trpc.employee.me.useQuery(undefined, { enabled: !!user });
  const { data: salaryRecords = [], isLoading } = trpc.salary.list.useQuery(
    { employeeId: emp?.id ?? 0 },
    { enabled: !!emp?.id }
  );

  // Sort by payment date descending
  const sorted = [...salaryRecords].sort(
    (a: any, b: any) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
  );

  // Summary calculations
  const paidRecords = sorted.filter((r: any) => r.status === "paid");
  const latestPaid = paidRecords[0];
  const currentYear = new Date().getFullYear();
  const ytdTotal = paidRecords
    .filter((r: any) => new Date(r.paymentDate).getFullYear() === currentYear)
    .reduce((sum: number, r: any) => sum + parseFloat(r.amount || "0"), 0);

  const nextPending = sorted
    .filter((r: any) => r.status === "pending")
    .sort((a: any, b: any) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime())[0];

  const currency = latestPaid?.currency ?? "SGD";

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
          Financial History
        </h2>
        <p className="text-sm" style={{ color: "oklch(0.55 0.012 65)" }}>
          Your salary payments and payslips
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="hr-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "oklch(0.92 0.08 80)" }}>
              <DollarSign size={16} style={{ color: "oklch(0.52 0.15 65)" }} />
            </div>
            <span className="text-xs font-medium" style={{ color: "oklch(0.55 0.012 65)" }}>Latest Salary</span>
          </div>
          <p className="text-xl font-bold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
            {isLoading ? "..." : latestPaid ? `${currency} ${parseFloat(latestPaid.amount).toLocaleString()}` : "—"}
          </p>
        </div>
        <div className="hr-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "oklch(0.92 0.08 145)" }}>
              <CheckCircle2 size={16} style={{ color: "oklch(0.42 0.18 145)" }} />
            </div>
            <span className="text-xs font-medium" style={{ color: "oklch(0.55 0.012 65)" }}>YTD Paid</span>
          </div>
          <p className="text-xl font-bold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
            {isLoading ? "..." : ytdTotal > 0 ? `${currency} ${ytdTotal.toLocaleString()}` : "—"}
          </p>
        </div>
        <div className="hr-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "oklch(0.92 0.08 255)" }}>
              <TrendingUp size={16} style={{ color: "oklch(0.42 0.18 255)" }} />
            </div>
            <span className="text-xs font-medium" style={{ color: "oklch(0.55 0.012 65)" }}>Next Payment</span>
          </div>
          <p className="text-xl font-bold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
            {isLoading ? "..." : nextPending
              ? new Date(nextPending.paymentDate).toLocaleDateString("en-SG", { day: "numeric", month: "long" })
              : "—"}
          </p>
        </div>
      </div>

      {/* Payment Table */}
      <div className="hr-card overflow-hidden">
        <div className="p-5 border-b" style={{ borderColor: "oklch(0.88 0.006 80)" }}>
          <h3 className="text-sm font-semibold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
            Payment History
          </h3>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={24} className="animate-spin" style={{ color: "oklch(0.42 0.18 255)" }} />
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: "oklch(0.65 0.01 65)" }}>No salary records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "oklch(0.975 0.006 80)" }}>
                  {["Period", "Payment Date", "Amount", "Status", "Payslip"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "oklch(0.55 0.012 65)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((row: any) => (
                  <tr
                    key={row.id}
                    className="border-t hover:bg-gray-50 transition-colors"
                    style={{ borderColor: "oklch(0.92 0.004 80)" }}
                  >
                    <td className="px-5 py-3.5 text-sm font-medium" style={{ color: "oklch(0.22 0.012 65)" }}>
                      {row.periodLabel ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: "oklch(0.45 0.012 65)", fontFamily: "'JetBrains Mono', monospace", fontSize: "12px" }}>
                      {new Date(row.paymentDate).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-semibold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'JetBrains Mono', monospace", fontSize: "13px" }}>
                      {row.currency} {parseFloat(row.amount).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={statusBadge(row.status)}>
                        {row.status === "paid" && <CheckCircle2 size={10} className="mr-1" />}
                        {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {row.payslipUrl ? (
                        <a
                          href={row.payslipUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors hover:bg-blue-50"
                          style={{ color: "oklch(0.42 0.18 255)", border: "1px solid oklch(0.85 0.08 255)" }}
                        >
                          <Download size={12} />
                          PDF
                        </a>
                      ) : (
                        <span className="text-xs" style={{ color: "oklch(0.72 0.006 80)" }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Coming Soon */}
      <div className="hr-card p-5">
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "oklch(0.55 0.012 65)" }}>
          Coming Soon
        </p>
        <div className="flex flex-wrap gap-2">
          {["Bonus", "Incentive", "Expense Reimbursement"].map((item) => (
            <span
              key={item}
              className="px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ background: "oklch(0.94 0.004 80)", color: "oklch(0.55 0.012 65)", border: "1px dashed oklch(0.82 0.006 80)" }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
