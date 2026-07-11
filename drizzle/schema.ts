import {
  boolean,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  date,
} from "drizzle-orm/mysql-core";

// ─── Auth / System Users ──────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  passwordHash: varchar("passwordHash", { length: 256 }),  // bcrypt hash for email+password login
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Legal Entities / Org Units ───────────────────────────────────────────────
export const orgUnits = mysqlTable("org_units", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  type: mysqlEnum("type", ["entity", "division", "department", "team"]).notNull(),
  parentId: int("parentId"),
  headCount: int("headCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OrgUnit = typeof orgUnits.$inferSelect;
export type InsertOrgUnit = typeof orgUnits.$inferInsert;

// ─── Employees ────────────────────────────────────────────────────────────────
// employeeRole: "regular" = full employee (self + peer + manager eval)
//               "contractor" = contractor (peer eval only, no self-eval)
export const employees = mysqlTable("employees", {
  id: int("id").autoincrement().primaryKey(),
  employeeCode: varchar("employeeCode", { length: 32 }).notNull().unique(),
  firstName: varchar("firstName", { length: 64 }).notNull(),
  lastName: varchar("lastName", { length: 64 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  phone: varchar("phone", { length: 32 }),
  nationality: varchar("nationality", { length: 64 }),
  position: varchar("position", { length: 128 }).notNull(),
  employeeRole: mysqlEnum("employeeRole", ["regular", "contractor"]).default("regular").notNull(),
  employmentType: mysqlEnum("employmentType", ["full-time", "part-time", "contract", "intern"]).default("full-time").notNull(),
  workLocation: varchar("workLocation", { length: 128 }),
  startDate: date("startDate").notNull(),
  contractEndDate: date("contractEndDate"),
  status: mysqlEnum("status", ["active", "inactive", "terminated"]).default("active").notNull(),
  orgUnitId: int("orgUnitId"),
  managerId: int("managerId"),
  isManager: boolean("isManager").default(false).notNull(),
  userId: int("userId"),
  photoUrl: text("photoUrl"),
  emergencyContact: varchar("emergencyContact", { length: 256 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;

// ─── Salary / Financial History ───────────────────────────────────────────────
export const salaryRecords = mysqlTable("salary_records", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  currency: varchar("currency", { length: 8 }).default("SGD").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  paymentDate: date("paymentDate").notNull(),
  periodLabel: varchar("periodLabel", { length: 32 }).notNull(),
  status: mysqlEnum("status", ["paid", "pending", "cancelled"]).default("paid").notNull(),
  payslipUrl: text("payslipUrl"),
  nextPaymentDate: date("nextPaymentDate"),  // null = N/A
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SalaryRecord = typeof salaryRecords.$inferSelect;
export type InsertSalaryRecord = typeof salaryRecords.$inferInsert;

// ─── Salary Components (line items per salary record) ────────────────────────
export const salaryComponents = mysqlTable("salary_components", {
  id: int("id").autoincrement().primaryKey(),
  salaryRecordId: int("salaryRecordId").notNull(),
  type: mysqlEnum("type", ["earning", "deduction"]).default("earning").notNull(),
  label: varchar("label", { length: 128 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SalaryComponent = typeof salaryComponents.$inferSelect;
export type InsertSalaryComponent = typeof salaryComponents.$inferInsert;

// ─── Performance Results ──────────────────────────────────────────────────────
export const performanceResults = mysqlTable("performance_results", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  period: varchar("period", { length: 32 }).notNull(),
  overallScore: decimal("overallScore", { precision: 5, scale: 2 }),
  grade: varchar("grade", { length: 32 }),
  managerScore: decimal("managerScore", { precision: 5, scale: 2 }),
  peerScore: decimal("peerScore", { precision: 5, scale: 2 }),
  selfScore: decimal("selfScore", { precision: 5, scale: 2 }),
  managerComment: text("managerComment"),
  peerComment: text("peerComment"),
  selfComment: text("selfComment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PerformanceResult = typeof performanceResults.$inferSelect;
export type InsertPerformanceResult = typeof performanceResults.$inferInsert;

// ─── Performance Category Scores ─────────────────────────────────────────────
export const performanceCategoryScores = mysqlTable("performance_category_scores", {
  id: int("id").autoincrement().primaryKey(),
  resultId: int("resultId").notNull(),
  category: varchar("category", { length: 128 }).notNull(),
  weight: int("weight").notNull(),
  score: decimal("score", { precision: 5, scale: 2 }).notNull(),
});

export type PerformanceCategoryScore = typeof performanceCategoryScores.$inferSelect;

// ─── Periodic Evaluation Cycles ───────────────────────────────────────────────
export const evaluationCycles = mysqlTable("evaluation_cycles", {
  id: int("id").autoincrement().primaryKey(),
  period: varchar("period", { length: 32 }).notNull(),
  status: mysqlEnum("status", ["open", "closed", "upcoming"]).default("upcoming").notNull(),
  openDate: date("openDate"),
  closeDate: date("closeDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EvaluationCycle = typeof evaluationCycles.$inferSelect;

// ─── Evaluation Tasks ─────────────────────────────────────────────────────────
export const evaluationTasks = mysqlTable("evaluation_tasks", {
  id: int("id").autoincrement().primaryKey(),
  cycleId: int("cycleId").notNull(),
  evaluatorId: int("evaluatorId").notNull(),
  evaluateeId: int("evaluateeId").notNull(),
  type: mysqlEnum("type", ["self", "peer", "manager", "contractor", "upward"]).notNull(),
  status: mysqlEnum("status", ["pending", "in-progress", "completed"]).default("pending").notNull(),
  submittedAt: timestamp("submittedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EvaluationTask = typeof evaluationTasks.$inferSelect;

// ─── Announcements ────────────────────────────────────────────────────────────
export const announcements = mysqlTable("announcements", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  content: text("content"),
  publishDate: date("publishDate").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;

// ─── Employee Documents ───────────────────────────────────────────────────────
export const employeeDocuments = mysqlTable("employee_documents", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  fileUrl: text("fileUrl"),
  fileType: varchar("fileType", { length: 16 }).default("PDF"),
  issueDate: date("issueDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmployeeDocument = typeof employeeDocuments.$inferSelect;

// ─── Evaluation Form Templates ────────────────────────────────────────────────
// formType:
//   "self_regular"   = Self Evaluation for Regular Employees
//   "self_manager"   = Self Evaluation for Managers
//   "peer"           = Peer Evaluation (evaluating a colleague)
//   "manager_eval"   = Manager Evaluation (manager evaluating a direct report)
//   "contractor"     = Contractor Evaluation (peer evaluating a contractor)
//   "upward_eval"    = Upward Evaluation (employee evaluating their manager)
export const evaluationForms = mysqlTable("evaluation_forms", {
  id: int("id").autoincrement().primaryKey(),
  formType: mysqlEnum("formType", [
    "self_regular",
    "self_manager",
    "peer",
    "manager_eval",
    "contractor",
    "upward_eval",
  ]).notNull().unique(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EvaluationForm = typeof evaluationForms.$inferSelect;
export type InsertEvaluationForm = typeof evaluationForms.$inferInsert;

// ─── Form Categories (대분류) ──────────────────────────────────────────────────
export const formCategories = mysqlTable("form_categories", {
  id: int("id").autoincrement().primaryKey(),
  formId: int("formId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),     // e.g. "1 Integrity (10%)"
  weight: int("weight").notNull().default(0),              // e.g. 10 (%)
  purpose: text("purpose"),                                // a. Purpose
  definition: text("definition"),                          // b. Definition
  sortOrder: int("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FormCategory = typeof formCategories.$inferSelect;
export type InsertFormCategory = typeof formCategories.$inferInsert;

// ─── Form KPIs (개별 질문) ─────────────────────────────────────────────────────
export const formKpis = mysqlTable("form_kpis", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId").notNull(),
  kpiName: varchar("kpiName", { length: 256 }).notNull(),   // e.g. "Honesty & Transparency"
  question: text("question").notNull(),                      // Full question text
  sortOrder: int("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FormKpi = typeof formKpis.$inferSelect;
export type InsertFormKpi = typeof formKpis.$inferInsert;

// ─── Evaluation Responses (제출된 평가지) ─────────────────────────────────────
export const evaluationResponses = mysqlTable("evaluation_responses", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull(),
  formId: int("formId").notNull(),
  evaluatorId: int("evaluatorId").notNull(),
  evaluateeId: int("evaluateeId").notNull(),
  overallComment: text("overallComment"),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EvaluationResponse = typeof evaluationResponses.$inferSelect;

// ─── KPI Responses (개별 질문 응답) ───────────────────────────────────────────
export const kpiResponses = mysqlTable("kpi_responses", {
  id: int("id").autoincrement().primaryKey(),
  responseId: int("responseId").notNull(),
  kpiId: int("kpiId").notNull(),
  score: int("score").notNull(),   // 1 ~ 5
  comment: text("comment"),
});

export type KpiResponse = typeof kpiResponses.$inferSelect;

// ─── Leave Types ──────────────────────────────────────────────────────────────
export const leaveTypes = mysqlTable("leave_types", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 64 }).notNull(),          // e.g. "Annual Leave", "Sick Leave"
  description: text("description"),
  defaultDays: int("defaultDays").default(0).notNull(),     // default allocation per year
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LeaveType = typeof leaveTypes.$inferSelect;
export type InsertLeaveType = typeof leaveTypes.$inferInsert;

// ─── Leave Balances ───────────────────────────────────────────────────────────
export const leaveBalances = mysqlTable("leave_balances", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  leaveTypeId: int("leaveTypeId").notNull(),
  year: int("year").notNull(),
  totalDays: int("totalDays").notNull(),
  usedDays: int("usedDays").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LeaveBalance = typeof leaveBalances.$inferSelect;
export type InsertLeaveBalance = typeof leaveBalances.$inferInsert;

// ─── Leave Requests ───────────────────────────────────────────────────────────
export const leaveRequests = mysqlTable("leave_requests", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  leaveTypeId: int("leaveTypeId").notNull(),
  startDate: date("startDate").notNull(),
  endDate: date("endDate").notNull(),
  totalDays: int("totalDays").notNull(),
  reason: text("reason"),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "cancelled"]).default("pending").notNull(),
  approverId: int("approverId"),          // manager who approved/rejected
  approverComment: text("approverComment"),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type InsertLeaveRequest = typeof leaveRequests.$inferInsert;

// ─── Bank / Recipient Information ─────────────────────────────────────────────
export const bankInfo = mysqlTable("bank_info", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull().unique(),
  // Recipient Information
  recipientName: varchar("recipientName", { length: 256 }),
  recipientAddress: text("recipientAddress"),
  recipientEmail: varchar("recipientEmail", { length: 320 }),
  recipientPhone: varchar("recipientPhone", { length: 32 }),
  // Bank Information
  bankName: varchar("bankName", { length: 256 }),
  swiftBic: varchar("swiftBic", { length: 32 }),
  branchName: varchar("branchName", { length: 256 }),
  bankAddress: text("bankAddress"),
  accountNumber: varchar("accountNumber", { length: 64 }),
  ifsc: varchar("ifsc", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BankInfo = typeof bankInfo.$inferSelect;
export type InsertBankInfo = typeof bankInfo.$inferInsert;
