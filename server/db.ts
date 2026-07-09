import { eq, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  users, InsertUser,
  employees, InsertEmployee,
  orgUnits, InsertOrgUnit,
  salaryRecords, InsertSalaryRecord,
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
  const result = await db.select().from(employees).where(eq(employees.userId, userId)).limit(1);
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
  await db.delete(salaryRecords).where(eq(salaryRecords.id, id));
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

export async function createEvaluationResponse(
  responseData: typeof evaluationResponses.$inferInsert,
  kpiData: Array<typeof kpiResponses.$inferInsert>
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  // Prevent duplicate submissions: check if a response already exists for this task
  if (responseData.taskId) {
    const existing = await db.select().from(evaluationResponses)
      .where(eq(evaluationResponses.taskId, responseData.taskId)).limit(1);
    if (existing.length > 0) {
      throw new Error("Evaluation for this task has already been submitted.");
    }
  }

  const insertResult = await db.insert(evaluationResponses).values(responseData);
  const responseId = (insertResult as any)[0]?.insertId ?? (insertResult as any).insertId;
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
