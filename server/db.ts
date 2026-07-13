import { eq, desc, sql, and, asc, ne, inArray, getTableColumns } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  users, InsertUser,
  employees, InsertEmployee,
  orgUnits, InsertOrgUnit,
  salaryRecords, InsertSalaryRecord,
  salaryComponents, InsertSalaryComponent,
  performanceResults, InsertPerformanceResult,
  performanceCategoryScores,
  evaluationCycles,
  evaluationTasks,
  announcements, InsertAnnouncement,
  employeeDocuments,
  evaluationForms, InsertEvaluationForm,
  formCategories, InsertFormCategory,
  formKpis, InsertFormKpi,
  evaluationResponses,
  kpiResponses,
  leaveTypes, InsertLeaveType,
  leaveBalances, InsertLeaveBalance,
  leaveRequests, InsertLeaveRequest,
  bankInfo, InsertBankInfo, BankInfo,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ─── Org Units ────────────────────────────────────────────────────────────────
export async function getAllOrgUnits() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orgUnits).orderBy(orgUnits.id);
}

export async function createOrgUnit(data: InsertOrgUnit) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(orgUnits).values(data);
}

export async function updateOrgUnit(id: number, data: Partial<InsertOrgUnit>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(orgUnits).set(data).where(eq(orgUnits.id, id));
}

export async function deleteOrgUnit(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(orgUnits).where(eq(orgUnits.id, id));
}

// ─── Employees ────────────────────────────────────────────────────────────────
export async function getAllEmployees() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(employees).orderBy(employees.employeeCode);
}

export async function getEmployeeById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
  return result[0];
}

export async function getEmployeeByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select({
    ...getTableColumns(employees),
    orgUnit: {
      id: orgUnits.id,
      name: orgUnits.name,
      type: orgUnits.type,
    },
  })
    .from(employees)
    .leftJoin(orgUnits, eq(employees.orgUnitId, orgUnits.id))
    .where(eq(employees.userId, userId))
    .limit(1);
  return result[0];
}

export async function searchEmployees(query: string) {
  const db = await getDb();
  if (!db) return [];
  const q = `%${query}%`;
  return db.select().from(employees).where(
    sql`${employees.firstName} LIKE ${q} OR ${employees.lastName} LIKE ${q} OR ${employees.email} LIKE ${q} OR ${employees.employeeCode} LIKE ${q}`
  );
}

export async function createEmployee(data: InsertEmployee) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(employees).values(data);
}

export async function updateEmployee(id: number, data: Partial<InsertEmployee>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(employees).set({ ...data, updatedAt: new Date() }).where(eq(employees.id, id));
}

export async function deleteEmployee(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(employees).where(eq(employees.id, id));
}

export async function getTeamMembers(orgUnitId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(employees).where(eq(employees.orgUnitId, orgUnitId));
}

// ─── Salary Records ───────────────────────────────────────────────────────────
export async function getSalaryRecords(employeeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(salaryRecords)
    .where(eq(salaryRecords.employeeId, employeeId))
    .orderBy(desc(salaryRecords.paymentDate));
}

export async function createSalaryRecord(data: InsertSalaryRecord) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(salaryRecords).values(data);
}

export async function updateSalaryRecord(id: number, data: Partial<InsertSalaryRecord>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(salaryRecords).set(data).where(eq(salaryRecords.id, id));
}

export async function deleteSalaryRecord(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(salaryComponents).where(eq(salaryComponents.salaryRecordId, id));
  await db.delete(salaryRecords).where(eq(salaryRecords.id, id));
}

// ─── Salary Components ──────────────────────────────────────────────────────
export async function getSalaryComponents(salaryRecordId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(salaryComponents)
    .where(eq(salaryComponents.salaryRecordId, salaryRecordId))
    .orderBy(salaryComponents.type, salaryComponents.id);
}

export async function setSalaryComponents(salaryRecordId: number, items: Array<{ type: 'earning' | 'deduction'; label: string; amount: string }>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Replace all components for this record
  await db.delete(salaryComponents).where(eq(salaryComponents.salaryRecordId, salaryRecordId));
  if (items.length > 0) {
    await db.insert(salaryComponents).values(
      items.map(item => ({ salaryRecordId, ...item }))
    );
  }
}

// ─── Performance Results ──────────────────────────────────────────────────────
export async function getPerformanceResults(employeeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(performanceResults)
    .where(eq(performanceResults.employeeId, employeeId))
    .orderBy(desc(performanceResults.createdAt));
}

export async function getPerformanceCategoryScores(resultId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(performanceCategoryScores)
    .where(eq(performanceCategoryScores.resultId, resultId));
}

export async function createPerformanceResult(data: InsertPerformanceResult) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(performanceResults).values(data);
}

// ─── Evaluation Cycles & Tasks ────────────────────────────────────────────────
export async function getEvaluationCycles() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(evaluationCycles).orderBy(desc(evaluationCycles.createdAt));
}

export async function getEvaluationCycleById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(evaluationCycles).where(eq(evaluationCycles.id, id)).limit(1);
  return result[0];
}

export async function createEvaluationCycle(data: typeof evaluationCycles.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(evaluationCycles).values(data);
  return (result as any)[0]?.insertId ?? (result as any).insertId;
}

export async function updateEvaluationCycle(id: number, data: Partial<typeof evaluationCycles.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(evaluationCycles).set(data).where(eq(evaluationCycles.id, id));
}

export async function deleteEvaluationCycle(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Delete all tasks in this cycle first
  await db.delete(evaluationTasks).where(eq(evaluationTasks.cycleId, id));
  await db.delete(evaluationCycles).where(eq(evaluationCycles.id, id));
}

export async function getEvaluationTasksForEmployee(employeeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(evaluationTasks)
    .where(eq(evaluationTasks.evaluatorId, employeeId));
}

export async function getEvaluationTasksByCycle(cycleId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(evaluationTasks)
    .where(eq(evaluationTasks.cycleId, cycleId))
    .orderBy(evaluationTasks.evaluateeId, evaluationTasks.type);
}

export async function createEvaluationTask(data: typeof evaluationTasks.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(evaluationTasks).values(data);
}

export async function bulkCreateEvaluationTasks(tasks: Array<typeof evaluationTasks.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  if (tasks.length === 0) return;
  await db.insert(evaluationTasks).values(tasks);
}

export async function deleteEvaluationTask(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Delete associated kpi_responses first (via evaluation_responses), then the task itself
  const responses = await db.select({ id: evaluationResponses.id })
    .from(evaluationResponses)
    .where(eq(evaluationResponses.taskId, id));
  if (responses.length > 0) {
    const responseIds = responses.map(r => r.id);
    await db.delete(kpiResponses).where(inArray(kpiResponses.responseId, responseIds));
    await db.delete(evaluationResponses).where(inArray(evaluationResponses.id, responseIds));
  }
  await db.delete(evaluationTasks).where(eq(evaluationTasks.id, id));
}

export async function deleteEvaluationTasksByCycleAndEvaluatee(cycleId: number, evaluateeId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(evaluationTasks)
    .where(sql`${evaluationTasks.cycleId} = ${cycleId} AND ${evaluationTasks.evaluateeId} = ${evaluateeId}`);
}

// ─── Announcements ────────────────────────────────────────────────────────────
export async function getAnnouncements() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(announcements)
    .where(eq(announcements.isActive, true))
    .orderBy(desc(announcements.publishDate));
}

export async function getAllAnnouncements() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(announcements).orderBy(desc(announcements.publishDate));
}

export async function createAnnouncement(data: InsertAnnouncement) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(announcements).values(data);
}

export async function updateAnnouncement(id: number, data: Partial<InsertAnnouncement>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(announcements).set({ ...data, updatedAt: new Date() }).where(eq(announcements.id, id));
}

export async function deleteAnnouncement(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(announcements).where(eq(announcements.id, id));
}

// ─── Employee Documents ───────────────────────────────────────────────────────
export async function getEmployeeDocuments(employeeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(employeeDocuments)
    .where(eq(employeeDocuments.employeeId, employeeId))
    .orderBy(desc(employeeDocuments.createdAt));
}

export async function createEmployeeDocument(data: typeof employeeDocuments.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(employeeDocuments).values(data);
}

export async function deleteEmployeeDocument(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(employeeDocuments).where(eq(employeeDocuments.id, id));
}

// ─── Evaluation Forms ─────────────────────────────────────────────────────────
export async function getAllEvaluationForms() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(evaluationForms).orderBy(evaluationForms.formType);
}

export async function getEvaluationFormByType(formType: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(evaluationForms)
    .where(eq(evaluationForms.formType, formType as any)).limit(1);
  return result[0];
}

export async function getEvaluationFormById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(evaluationForms).where(eq(evaluationForms.id, id)).limit(1);
  return result[0];
}

export async function upsertEvaluationForm(data: InsertEvaluationForm) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(evaluationForms).values(data).onDuplicateKeyUpdate({
    set: { title: data.title, description: data.description, isActive: data.isActive, updatedAt: new Date() },
  });
}

export async function updateEvaluationForm(id: number, data: Partial<InsertEvaluationForm>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(evaluationForms).set({ ...data, updatedAt: new Date() }).where(eq(evaluationForms.id, id));
}

// ─── Form Categories ──────────────────────────────────────────────────────────
export async function getCategoriesByFormId(formId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(formCategories)
    .where(eq(formCategories.formId, formId))
    .orderBy(formCategories.sortOrder);
}

export async function createFormCategory(data: InsertFormCategory) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(formCategories).values(data);
  return result;
}

export async function updateFormCategory(id: number, data: Partial<InsertFormCategory>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(formCategories).set({ ...data, updatedAt: new Date() }).where(eq(formCategories.id, id));
}

export async function deleteFormCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Delete KPIs first
  await db.delete(formKpis).where(eq(formKpis.categoryId, id));
  await db.delete(formCategories).where(eq(formCategories.id, id));
}

// ─── Form KPIs ────────────────────────────────────────────────────────────────
export async function getKpisByCategoryId(categoryId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(formKpis)
    .where(eq(formKpis.categoryId, categoryId))
    .orderBy(formKpis.sortOrder);
}

export async function getKpisByFormId(formId: number) {
  const db = await getDb();
  if (!db) return [];
  // Join through categories
  const cats = await getCategoriesByFormId(formId);
  if (cats.length === 0) return [];
  const catIds = cats.map(c => c.id);
  return db.select().from(formKpis)
    .where(sql`${formKpis.categoryId} IN (${sql.join(catIds.map(id => sql`${id}`), sql`, `)})`)
    .orderBy(formKpis.categoryId, formKpis.sortOrder);
}

export async function createFormKpi(data: InsertFormKpi) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(formKpis).values(data);
}

export async function updateFormKpi(id: number, data: Partial<InsertFormKpi>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(formKpis).set({ ...data, updatedAt: new Date() }).where(eq(formKpis.id, id));
}

export async function deleteFormKpi(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(formKpis).where(eq(formKpis.id, id));
}

// ─── Evaluation Responses ─────────────────────────────────────────────────────
export async function getResponseByTaskId(taskId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(evaluationResponses)
    .where(eq(evaluationResponses.taskId, taskId)).limit(1);
  return result[0];
}

export async function upsertEvaluationResponse(
  responseData: typeof evaluationResponses.$inferInsert,
  kpiData: Array<typeof kpiResponses.$inferInsert>
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  let responseId: number;

  if (responseData.taskId) {
    const existing = await db.select().from(evaluationResponses)
      .where(eq(evaluationResponses.taskId, responseData.taskId)).limit(1);

    if (existing.length > 0) {
      // Update existing response
      responseId = existing[0].id;
      await db.update(evaluationResponses)
        .set({ overallComment: responseData.overallComment, submittedAt: new Date() })
        .where(eq(evaluationResponses.id, responseId));
      // Delete old KPI responses and re-insert
      await db.delete(kpiResponses).where(eq(kpiResponses.responseId, responseId));
    } else {
      // Insert new response
      const insertResult = await db.insert(evaluationResponses).values(responseData);
      responseId = (insertResult as any)[0]?.insertId ?? (insertResult as any).insertId;
    }
  } else {
    const insertResult = await db.insert(evaluationResponses).values(responseData);
    responseId = (insertResult as any)[0]?.insertId ?? (insertResult as any).insertId;
  }

  if (kpiData.length > 0) {
    await db.insert(kpiResponses).values(kpiData.map(k => ({ ...k, responseId })));
  }

  // Mark the evaluation task as completed
  if (responseData.taskId) {
    await db.update(evaluationTasks)
      .set({ status: "completed", submittedAt: new Date() })
      .where(eq(evaluationTasks.id, responseData.taskId));
  }

  return responseId;
}

export async function getKpiResponsesByResponseId(responseId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(kpiResponses).where(eq(kpiResponses.responseId, responseId));
}

// ─── Leave Management ─────────────────────────────────────────────────────────

export async function getAllLeaveTypes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leaveTypes).orderBy(asc(leaveTypes.name));
}

export async function createLeaveType(data: InsertLeaveType) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(leaveTypes).values(data);
}

export async function updateLeaveType(id: number, data: Partial<InsertLeaveType>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(leaveTypes).set(data).where(eq(leaveTypes.id, id));
}

export async function deleteLeaveType(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(leaveTypes).where(eq(leaveTypes.id, id));
}

export async function getLeaveBalances(employeeId: number, year: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: leaveBalances.id,
      employeeId: leaveBalances.employeeId,
      leaveTypeId: leaveBalances.leaveTypeId,
      year: leaveBalances.year,
      totalDays: leaveBalances.totalDays,
      usedDays: leaveBalances.usedDays,
      leaveTypeName: leaveTypes.name,
      leaveTypeDescription: leaveTypes.description,
    })
    .from(leaveBalances)
    .leftJoin(leaveTypes, eq(leaveBalances.leaveTypeId, leaveTypes.id))
    .where(and(eq(leaveBalances.employeeId, employeeId), eq(leaveBalances.year, year)));
  return rows;
}

export async function upsertLeaveBalance(employeeId: number, leaveTypeId: number, year: number, totalDays: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db.select().from(leaveBalances)
    .where(and(eq(leaveBalances.employeeId, employeeId), eq(leaveBalances.leaveTypeId, leaveTypeId), eq(leaveBalances.year, year)))
    .limit(1);
  if (existing.length > 0) {
    await db.update(leaveBalances).set({ totalDays }).where(eq(leaveBalances.id, existing[0].id));
  } else {
    await db.insert(leaveBalances).values({ employeeId, leaveTypeId, year, totalDays, usedDays: 0 });
  }
}

export async function getLeaveRequests(employeeId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: leaveRequests.id,
      employeeId: leaveRequests.employeeId,
      leaveTypeId: leaveRequests.leaveTypeId,
      startDate: leaveRequests.startDate,
      endDate: leaveRequests.endDate,
      totalDays: leaveRequests.totalDays,
      reason: leaveRequests.reason,
      status: leaveRequests.status,
      approverId: leaveRequests.approverId,
      approverComment: leaveRequests.approverComment,
      approvedAt: leaveRequests.approvedAt,
      createdAt: leaveRequests.createdAt,
      leaveTypeName: leaveTypes.name,
    })
    .from(leaveRequests)
    .leftJoin(leaveTypes, eq(leaveRequests.leaveTypeId, leaveTypes.id))
    .where(eq(leaveRequests.employeeId, employeeId))
    .orderBy(desc(leaveRequests.createdAt));
  return rows;
}

export async function getPendingLeaveRequestsForManager(managerId: number) {
  const db = await getDb();
  if (!db) return [];
  // Get all employees whose managerId = this manager's employee id
  const directReports = await db.select({ id: employees.id, firstName: employees.firstName, lastName: employees.lastName })
    .from(employees).where(eq(employees.managerId, managerId));
  if (directReports.length === 0) return [];
  const reportIds = directReports.map(e => e.id);

  const rows = await db
    .select({
      id: leaveRequests.id,
      employeeId: leaveRequests.employeeId,
      leaveTypeId: leaveRequests.leaveTypeId,
      startDate: leaveRequests.startDate,
      endDate: leaveRequests.endDate,
      totalDays: leaveRequests.totalDays,
      reason: leaveRequests.reason,
      status: leaveRequests.status,
      approverId: leaveRequests.approverId,
      approverComment: leaveRequests.approverComment,
      approvedAt: leaveRequests.approvedAt,
      createdAt: leaveRequests.createdAt,
      leaveTypeName: leaveTypes.name,
      employeeFirstName: employees.firstName,
      employeeLastName: employees.lastName,
      employeePosition: employees.position,
      employeePhotoUrl: employees.photoUrl,
    })
    .from(leaveRequests)
    .leftJoin(leaveTypes, eq(leaveRequests.leaveTypeId, leaveTypes.id))
    .leftJoin(employees, eq(leaveRequests.employeeId, employees.id))
    .where(and(
      sql`${leaveRequests.employeeId} IN (${sql.join(reportIds.map(id => sql`${id}`), sql`, `)})`,
      eq(leaveRequests.status, "pending")
    ))
    .orderBy(asc(leaveRequests.startDate));
  return rows;
}

export async function getAllLeaveRequestsAdmin() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: leaveRequests.id,
      employeeId: leaveRequests.employeeId,
      leaveTypeId: leaveRequests.leaveTypeId,
      startDate: leaveRequests.startDate,
      endDate: leaveRequests.endDate,
      totalDays: leaveRequests.totalDays,
      reason: leaveRequests.reason,
      status: leaveRequests.status,
      approverId: leaveRequests.approverId,
      approverComment: leaveRequests.approverComment,
      approvedAt: leaveRequests.approvedAt,
      createdAt: leaveRequests.createdAt,
      leaveTypeName: leaveTypes.name,
      employeeFirstName: employees.firstName,
      employeeLastName: employees.lastName,
      employeePosition: employees.position,
    })
    .from(leaveRequests)
    .leftJoin(leaveTypes, eq(leaveRequests.leaveTypeId, leaveTypes.id))
    .leftJoin(employees, eq(leaveRequests.employeeId, employees.id))
    .orderBy(desc(leaveRequests.createdAt));
  return rows;
}

export async function createLeaveRequest(data: InsertLeaveRequest) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(leaveRequests).values({ ...data, status: "pending", createdAt: new Date(), updatedAt: new Date() });
  return (result as any)[0]?.insertId ?? (result as any).insertId;
}

export async function approveLeaveRequest(id: number, approverId: number, approved: boolean, comment?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const status = approved ? "approved" : "rejected";
  await db.update(leaveRequests).set({
    status,
    approverId,
    approverComment: comment ?? null,
    approvedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(leaveRequests.id, id));

  // If approved, increment usedDays in leaveBalances
  if (approved) {
    const reqRows = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id)).limit(1);
    const req = reqRows[0];
    if (req) {
      const year = new Date(req.startDate).getFullYear();
      const balRows = await db.select().from(leaveBalances)
        .where(and(eq(leaveBalances.employeeId, req.employeeId), eq(leaveBalances.leaveTypeId, req.leaveTypeId), eq(leaveBalances.year, year)))
        .limit(1);
      if (balRows.length > 0) {
        await db.update(leaveBalances)
          .set({ usedDays: sql`${leaveBalances.usedDays} + ${req.totalDays}` })
          .where(eq(leaveBalances.id, balRows[0].id));
      }
    }
  }
}

export async function cancelLeaveRequest(id: number, employeeId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Only pending requests can be cancelled
  await db.update(leaveRequests)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(and(eq(leaveRequests.id, id), eq(leaveRequests.employeeId, employeeId), eq(leaveRequests.status, "pending")));
}

// ─── Bank / Recipient Information ─────────────────────────────────────────────
export async function getBankInfoByEmployeeId(employeeId: number): Promise<BankInfo | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(bankInfo).where(eq(bankInfo.employeeId, employeeId)).limit(1);
  return result[0] ?? null;
}

export async function upsertBankInfo(data: InsertBankInfo): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(bankInfo).values(data).onDuplicateKeyUpdate({
    set: {
      recipientName: data.recipientName,
      recipientAddress: data.recipientAddress,
      recipientEmail: data.recipientEmail,
      recipientPhone: data.recipientPhone,
      bankName: data.bankName,
      swiftBic: data.swiftBic,
      branchName: data.branchName,
      bankAddress: data.bankAddress,
      accountNumber: data.accountNumber,
      ifsc: data.ifsc,
      updatedAt: new Date(),
    },
  });
}

// ─── Employee Self-Update (Personal Info) ─────────────────────────────────────
export async function updateEmployeePersonalInfo(
  employeeId: number,
  data: {
    phone?: string | null;
    nationality?: string | null;
    workLocation?: string | null;
    emergencyContact?: string | null;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(employees).set({ ...data, updatedAt: new Date() }).where(eq(employees.id, employeeId));
}

// ─── Org Path (root → my team) ────────────────────────────────────────────────
// Returns the chain of org units from the root down to the given orgUnitId.
// e.g. [Entity, Division, Department, Team]
export async function getOrgPath(orgUnitId: number): Promise<typeof orgUnits.$inferSelect[]> {
  const db = await getDb();
  if (!db) return [];
  const all = await db.select().from(orgUnits);
  const map = new Map(all.map((u) => [u.id, u]));

  const path: typeof orgUnits.$inferSelect[] = [];
  let current = map.get(orgUnitId);
  while (current) {
    path.unshift(current);
    current = current.parentId ? map.get(current.parentId) : undefined;
  }
  return path;
}

// ─── Computed Evaluation Results ──────────────────────────────────────────────
// Returns per-cycle evaluation results for an employee, computing scores from
// submitted evaluation_responses and kpi_responses.
// Weights: self 20%, peer 30%, manager 50% (final score)
// Peer+manager combined: peer 40%, manager 60%
export async function getComputedEvaluationResults(employeeId: number) {
  const db = await getDb();
  if (!db) return [];

  // Get all cycles that have tasks where this employee is the evaluatee
  // Exclude upward evaluations (type=manager = employee evaluating their manager)
  const tasks = await db.select().from(evaluationTasks)
    .where(eq(evaluationTasks.evaluateeId, employeeId));

  if (tasks.length === 0) return [];

  // Determine if this employee is a contractor (employmentType === 'contract')
  const employeeRow = await db.select().from(employees)
    .where(eq(employees.id, employeeId)).limit(1);
  const isContractor = employeeRow[0]?.employmentType === 'contract';

  const cycleIds = Array.from(new Set(tasks.map(t => t.cycleId)));
  const cycles = await db.select().from(evaluationCycles)
    .where(inArray(evaluationCycles.id, cycleIds));

  const results = [];

  for (const cycle of cycles) {
    const cycleTasks = tasks.filter(t => t.cycleId === cycle.id);

    // Self: evaluator == evaluatee
    const selfTasks = cycleTasks.filter(t => t.type === "self" && t.status === "completed");
    // Manager group: type="downward" (manager evaluating direct report)
    const managerTasks = cycleTasks.filter(t => t.type === "downward" && t.status === "completed");
    // Peer group: type="peer" | "manager" (upward eval counts as peer for the evaluatee/manager)
    const peerTasks = cycleTasks.filter(t => (t.type === "peer" || t.type === "manager") && t.status === "completed");
    // Contractor: type === contractor (evaluated by peers, no self-eval)
    const contractorTasks = cycleTasks.filter(t => t.type === "contractor" && t.status === "completed");

    // Helper: compute average KPI scores per category for a list of tasks
    // totalAvg uses category weight (portion %) from formCategories.weight — NOT flat KPI average
    const computeScoresForTasks = async (taskList: typeof cycleTasks) => {
      if (taskList.length === 0) return { categoryScores: [] as Array<{ name: string; avg: number; count: number }>, totalAvg: null };
      const categoryScores: Record<string, { name: string; scores: number[]; weight: number }> = {};

      for (const task of taskList) {
        const response = await db!.select().from(evaluationResponses)
          .where(eq(evaluationResponses.taskId, task.id)).limit(1);
        if (response.length === 0) continue;
        const kpis = await db!.select().from(kpiResponses)
          .where(eq(kpiResponses.responseId, response[0].id));

        // Get category info for each KPI via formKpis → formCategories
        for (const kpi of kpis) {
          const kpiRow = await db!.select().from(formKpis)
            .where(eq(formKpis.id, kpi.kpiId)).limit(1);
          if (kpiRow.length === 0) continue;
          const catRow = await db!.select().from(formCategories)
            .where(eq(formCategories.id, kpiRow[0].categoryId)).limit(1);
          const catName = catRow[0]?.title ?? "Unknown";
          const catWeight = catRow[0]?.weight ?? 0; // e.g. 10 means 10%
          if (!categoryScores[catName]) categoryScores[catName] = { name: catName, scores: [], weight: catWeight };
          categoryScores[catName].scores.push(kpi.score);
        }
      }

      const categoryAvgs = Object.entries(categoryScores).map(([name, { scores, weight }]) => ({
        name,
        avg: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
        count: scores.length,
        weight,
      }));

      // Compute totalAvg using category weights (portions)
      // If weights sum to >0, use weighted average; otherwise fall back to simple average
      const totalWeight = categoryAvgs.reduce((sum, c) => sum + c.weight, 0);
      let totalAvg: number | null = null;
      if (categoryAvgs.length > 0) {
        if (totalWeight > 0) {
          // Weighted average: sum(categoryAvg * weight) / totalWeight
          totalAvg = categoryAvgs.reduce((sum, c) => sum + c.avg * c.weight, 0) / totalWeight;
        } else {
          // Fallback: simple average of category averages
          totalAvg = categoryAvgs.reduce((sum, c) => sum + c.avg, 0) / categoryAvgs.length;
        }
      }
      return { categoryScores: categoryAvgs, totalAvg };
    };

    const selfResult = await computeScoresForTasks(selfTasks);
    const peerResult = await computeScoresForTasks(peerTasks);
    const managerResult = await computeScoresForTasks(managerTasks);
    const contractorResult = await computeScoresForTasks(contractorTasks);

    // Final score calculation:
    //   Contractor: finalScore = simple average of all contractor evaluations (no self)
    //   Regular employee:
    //     - Self always 20% when present
    //     - External fills remaining 80%:
    //         • Both peer AND manager → peer 30%, manager 50%
    //         • Only peer (no downward eval) → peer 80%
    //         • Only manager → manager 80%
    let finalScore: number | null = null;
    const hasSelf = selfResult.totalAvg !== null;
    const hasPeer = peerResult.totalAvg !== null;
    const hasManager = managerResult.totalAvg !== null;
    const hasContractor = contractorResult.totalAvg !== null;

    if (isContractor) {
      // Contractor: final score is simply the average of all contractor evaluations
      finalScore = hasContractor ? contractorResult.totalAvg : null;
    } else if (hasSelf || hasPeer || hasManager) {
      let weightedSum = 0;
      // Self: fixed 20% when present
      const selfW = hasSelf ? 0.2 : 0;
      if (hasSelf) weightedSum += selfResult.totalAvg! * selfW;
      // External: fills remaining (1 - selfW) = 0.8 (or 1.0 if no self)
      const externalTotal = 1 - selfW;
      if (hasPeer && hasManager) {
        weightedSum += peerResult.totalAvg!    * externalTotal * (3 / 8);
        weightedSum += managerResult.totalAvg! * externalTotal * (5 / 8);
      } else if (hasPeer) {
        weightedSum += peerResult.totalAvg! * externalTotal;
      } else if (hasManager) {
        weightedSum += managerResult.totalAvg! * externalTotal;
      }
      finalScore = weightedSum;
    }

    results.push({
      cycleId: cycle.id,
      period: cycle.period,
      status: cycle.status,
      closeDate: cycle.closeDate,
      isContractor,
      self: selfResult,
      peer: peerResult,
      manager: managerResult,
      contractor: contractorResult,
      finalScore,
      weights: { self: 0.2, peer: 0.3, manager: 0.5 },
    });
  }

  return results.sort((a, b) => b.cycleId - a.cycleId);
}
