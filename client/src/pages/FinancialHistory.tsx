/**
 * FinancialHistory.tsx — Payroll & Salary History
 * Design: Warm Slate
 */
import { financialHistory } from "@/lib/mockData";
import { DollarSign, Download, CheckCircle2, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function FinancialHistory() {
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
            <span className="text-xs font-medium" style={{ color: "oklch(0.55 0.012 65)" }}>Monthly Salary</span>
          </div>
          <p className="text-xl font-bold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'DM Sans', sans-serif" }}>
            SGD 18,500
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
            SGD 111,000
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
            31 July
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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: "oklch(0.975 0.006 80)" }}>
                {["Month", "Payment Date", "Amount", "Status", "Payslip"].map((h) => (
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
              {financialHistory.map((row, i) => (
                <tr
                  key={i}
                  className="border-t hover:bg-gray-50 transition-colors"
                  style={{ borderColor: "oklch(0.92 0.004 80)" }}
                >
                  <td className="px-5 py-3.5 text-sm font-medium" style={{ color: "oklch(0.22 0.012 65)" }}>
                    {row.month}
                  </td>
                  <td className="px-5 py-3.5 text-sm" style={{ color: "oklch(0.45 0.012 65)", fontFamily: "'JetBrains Mono', monospace", fontSize: "12px" }}>
                    {row.paymentDate}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-semibold" style={{ color: "oklch(0.22 0.012 65)", fontFamily: "'JetBrains Mono', monospace", fontSize: "13px" }}>
                    {row.amount}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="status-badge completed">
                      <CheckCircle2 size={10} className="mr-1" />
                      {row.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => toast.success(`Downloading payslip for ${row.month}...`)}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors hover:bg-blue-50"
                      style={{ color: "oklch(0.42 0.18 255)", border: "1px solid oklch(0.85 0.08 255)" }}
                    >
                      <Download size={12} />
                      PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
