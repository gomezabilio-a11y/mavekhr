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
export const employees = mysqlTable("employees", {
  id: int("id").autoincrement().primaryKey(),
  employeeCode: varchar("employeeCode", { length: 32 }).notNull().unique(),
  firstName: varchar("firstName", { length: 64 }).notNull(),
  lastName: varchar("lastName", { length: 64 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  phone: varchar("phone", { length: 32 }),
  nationality: varchar("nationality", { length: 64 }),
  position: varchar("position", { length: 128 }).notNull(),
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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SalaryRecord = typeof salaryRecords.$inferSelect;
export type InsertSalaryRecord = typeof salaryRecords.$inferInsert;

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
  type: mysqlEnum("type", ["self", "peer", "manager"]).notNull(),
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