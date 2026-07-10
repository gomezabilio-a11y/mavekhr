/**
 * FinancialHistory.tsx — Payroll & Salary History
 * Design: Warm Slate
 * Data: real DB via trpc.salary.list + trpc.salary.components
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { DollarSign, Download, CheckCircle2, TrendingUp, Loader2, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

const statusBadge = (status: string) => {
  if (status === "paid") return "status-badge completed";
  if (status === "pending") return "status-badge pending";
  return "status-badge";
};

// PDF payslip generation using browser print
function generatePayslipPDF(record: any, components: any[], employeeName: string, companyName: string = "MAVEK BCS") {
  const earnings = components.filter(c => c.type === "earning");
  const deductions = components.filter(c => c.type === "deduction");
  const earningsTotal = earnings.reduce((s: number, c: any) => s + parseFloat(c.amount || "0"), 0);
  const deductionsTotal = deductions.reduce((s: number, c: any) => s + parseFloat(c.amount || "0"), 0);
  const netPay = earningsTotal - deductionsTotal;
  const totalAmount = parseFloat(record.amount || "0");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Payslip - ${record.periodLabel}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a1a; background: #fff; }
    .page { max-width: 700px; margin: 0 auto; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #1a1a2e; }
    .company-name { font-size: 20px; font-weight: 700; color: #1a1a2e; }
    .payslip-title { font-size: 14px; font-weight: 600; color: #555; margin-top: 4px; }
    .period-badge { background: #1a1a2e; color: white; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .employee-section { background: #f8f8f8; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px; }
    .employee-section h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 8px; }
    .employee-name { font-size: 16px; font-weight: 700; color: #1a1a2e; }
    .employee-meta { font-size: 11px; color: #666; margin-top: 4px; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 6px 10px; border-radius: 4px; margin-bottom: 8px; }
    .earnings-title { background: #e8f5e9; color: #2e7d32; }
    .deductions-title { background: #fce4ec; color: #c62828; }
    .line-item { display: flex; justify-content: space-between; padding: 6px 10px; border-bottom: 1px solid #f0f0f0; }
    .line-item:last-child { border-bottom: none; }
    .line-label { color: #444; }
    .line-amount { font-weight: 600; font-family: 'Courier New', monospace; }
    .subtotal { display: flex; justify-content: space-between; padding: 8px 10px; font-weight: 700; background: #f5f5f5; border-radius: 4px; margin-top: 4px; }
    .net-pay-section { background: #1a1a2e; color: white; border-radius: 8px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; margin-top: 24px; }
    .net-pay-label { font-size: 13px; font-weight: 600; }
    .net-pay-amount { font-size: 22px; font-weight: 700; font-family: 'Courier New', monospace; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; text-align: center; font-size: 10px; color: #aaa; }
    .meta-row { display: flex; gap: 24px; margin-top: 8px; }
    .meta-item { font-size: 11px; color: #666; }
    .meta-item span { font-weight: 600; color: #333; }
    @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <div class="company-name">${companyName}</div>
      <div class="payslip-title">PAYSLIP</div>
    </div>
    <div class="period-badge">${record.periodLabel}</div>
  </div>

  <div class="employee-section">
    <h3>Employee</h3>
    <div class="employee-name">${employeeName}</div>
    <div class="meta-row">
      <div class="meta-item">Payment Date: <span>${record.paymentDate ? new Date(record.paymentDate).toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" }) : "—"}</span></div>
      <div class="meta-item">Currency: <span>${record.currency}</span></div>
      <div class="meta-item">Status: <span style="text-transform:capitalize">${record.status}</span></div>
    </div>
  </div>

  ${earnings.length > 0 ? `
  <div class="section">
    <div class="section-title earnings-title">Earnings</div>
    ${earnings.map((c: any) => `
    <div class="line-item">
      <span class="line-label">${c.label}</span>
      <span class="line-amount">${record.currency} ${parseFloat(c.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
    </div>`).join("")}
    <div class="subtotal">
      <span>Total Earnings</span>
      <span>${record.currency} ${earningsTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
    </div>
  </div>` : ""}

  ${deductions.length > 0 ? `
  <div class="section">
    <div class="section-title deductions-title">Deductions</div>
    ${deductions.map((c: any) => `
    <div class="line-item">
      <span class="line-label">${c.label}</span>
      <span class="line-amount" style="color:#c62828">- ${record.currency} ${parseFloat(c.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
    </div>`).join("")}
    <div class="subtotal">
      <span>Total Deductions</span>
      <span style="color:#c62828">- ${record.currency} ${deductionsTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
    </div>
  </div>` : ""}

  ${components.length === 0 ? `
  <div class="section">
    <div class="line-item">
      <span class="line-label">Gross Salary</span>
      <span class="line-amount">${record.currency} ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
    </div>
  </div>` : ""}

  <div class="net-pay-section">
    <span class="net-pay-label">NET PAY</span>
    <span class="net-pay-amount">${record.currency} ${(components.length > 0 ? netPay : totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
  </div>

  <div class="footer">
    This payslip is computer generated and does not require a signature. &nbsp;|&nbsp; ${companyName} &nbsp;|&nbsp; Confidential
  </div>
</div>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) { toast.error("Please allow popups to download payslip"); return; }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 500);
}

export default function FinancialHistory() {
  const { user } = useAuth();
  const { data: emp } = trpc.employee.me.useQuery(undefined, { enabled: !!user });
  const { data: salaryRecords = [], isLoading } = trpc.salary.list.useQuery(
    { employeeId: emp?.id ?? 0 },
    { enabled: !!emp?.id }
  );
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const utils = trpc.useUtils();

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

  // Next Payment: prefer nextPaymentDate field on most recent record, fallback to pending
  const recordWithNextDate = sorted
    .filter((s: any) => s.nextPaymentDate != null && String(s.nextPaymentDate).trim() !== "")
    .sort((a: any, b: any) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())[0];
  const nextPending = sorted
    .filter((r: any) => r.status === "pending")
    .sort((a: any, b: any) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime())[0];

  const nextPaymentLabel = recordWithNextDate
    ? new Date(String(recordWithNextDate.nextPaymentDate)).toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" })
    : nextPending
      ? new Date(nextPending.paymentDate).toLocaleDateString("en-SG", { day: "numeric", month: "long" })
      : "N/A";

  const currency = latestPaid?.currency ?? "SGD";
  const employeeName = emp ? `${emp.firstName} ${emp.lastName}` : (user?.name ?? "");

  async function handleDownloadPayslip(record: any) {
    setDownloadingId(record.id);
    try {
      const components = await utils.salary.components.fetch({ salaryRecordId: record.id });
      generatePayslipPDF(record, components as any[], employeeName);
    } catch (e) {
      toast.error("Failed to generate payslip");
    } finally {
      setDownloadingId(null);
    }
  }

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
            {isLoading ? "..." : nextPaymentLabel}
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
                  <>
                    <tr
                      key={row.id}
                      className="border-t hover:bg-gray-50 transition-colors"
                      style={{ borderColor: "oklch(0.92 0.004 80)" }}
                    >
                      <td className="px-5 py-3.5 text-sm font-medium" style={{ color: "oklch(0.22 0.012 65)" }}>
                        <button
                          type="button"
                          className="flex items-center gap-1.5 hover:underline"
                          onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                        >
                          {expandedId === row.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          {row.periodLabel ?? "—"}
                        </button>
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
                        <button
                          onClick={() => handleDownloadPayslip(row)}
                          disabled={downloadingId === row.id}
                          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors hover:bg-blue-50 disabled:opacity-50"
                          style={{ color: "oklch(0.42 0.18 255)", border: "1px solid oklch(0.85 0.08 255)" }}
                        >
                          {downloadingId === row.id
                            ? <Loader2 size={12} className="animate-spin" />
                            : <Download size={12} />}
                          PDF
                        </button>
                      </td>
                    </tr>
                    {/* Expanded components */}
                    {expandedId === row.id && (
                      <ExpandedComponents key={`${row.id}-exp`} recordId={row.id} currency={row.currency} />
                    )}
                  </>
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

function ExpandedComponents({ recordId, currency }: { recordId: number; currency: string }) {
  const { data: components = [], isLoading } = trpc.salary.components.useQuery({ salaryRecordId: recordId });
  const earnings = (components as any[]).filter(c => c.type === "earning");
  const deductions = (components as any[]).filter(c => c.type === "deduction");
  const earningsTotal = earnings.reduce((s, c) => s + parseFloat(c.amount || "0"), 0);
  const deductionsTotal = deductions.reduce((s, c) => s + parseFloat(c.amount || "0"), 0);
  const netPay = earningsTotal - deductionsTotal;

  return (
    <tr style={{ background: "oklch(0.985 0.004 80)" }}>
      <td colSpan={5} className="px-8 py-4">
        {isLoading ? (
          <Loader2 size={14} className="animate-spin" style={{ color: "oklch(0.42 0.18 255)" }} />
        ) : components.length === 0 ? (
          <p className="text-xs" style={{ color: "oklch(0.65 0.012 65)" }}>No salary components recorded for this period.</p>
        ) : (
          <div className="max-w-sm space-y-1">
            {earnings.length > 0 && (
              <p className="text-xs font-semibold mb-1" style={{ color: "oklch(0.42 0.18 145)" }}>Earnings</p>
            )}
            {earnings.map((c: any) => (
              <div key={c.id} className="flex justify-between text-xs">
                <span style={{ color: "oklch(0.45 0.012 65)" }}>{c.label}</span>
                <span className="font-medium" style={{ color: "oklch(0.22 0.012 65)" }}>{currency} {parseFloat(c.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            ))}
            {deductions.length > 0 && (
              <p className="text-xs font-semibold mt-2 mb-1" style={{ color: "oklch(0.52 0.18 25)" }}>Deductions</p>
            )}
            {deductions.map((c: any) => (
              <div key={c.id} className="flex justify-between text-xs">
                <span style={{ color: "oklch(0.45 0.012 65)" }}>{c.label}</span>
                <span className="font-medium" style={{ color: "oklch(0.52 0.18 25)" }}>- {currency} {parseFloat(c.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            ))}
            <div className="flex justify-between text-xs font-bold pt-2 border-t mt-2" style={{ borderColor: "oklch(0.90 0.006 80)" }}>
              <span>Net Pay</span>
              <span>{currency} {netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        )}
      </td>
    </tr>
  );
}
