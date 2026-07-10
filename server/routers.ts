import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  getAllOrgUnits, createOrgUnit, updateOrgUnit, deleteOrgUnit,
  getAllEmployees, getEmployeeById, getEmployeeByUserId, searchEmployees,
  createEmployee, updateEmployee, deleteEmployee, getTeamMembers,
  getSalaryRecords, createSalaryRecord, updateSalaryRecord, deleteSalaryRecord,
  getPerformanceResults, getPerformanceCategoryScores, createPerformanceResult,
  getEvaluationCycles, getEvaluationCycleById, createEvaluationCycle, updateEvaluationCycle, deleteEvaluationCycle,
  getEvaluationTasksForEmployee, getEvaluationTasksByCycle,
  createEvaluationTask, bulkCreateEvaluationTasks, deleteEvaluationTask, deleteEvaluationTasksByCycleAndEvaluatee,
  getAnnouncements, getAllAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement,
  getEmployeeDocuments, createEmployeeDocument, deleteEmployeeDocument,
  getAllEvaluationForms, getEvaluationFormById, getEvaluationFormByType, updateEvaluationForm, upsertEvaluationForm,
  getCategoriesByFormId, createFormCategory, updateFormCategory, deleteFormCategory,
  getKpisByCategoryId, createFormKpi, updateFormKpi, deleteFormKpi,
  getResponseByTaskId, createEvaluationResponse, getKpiResponsesByResponseId,
} from "./db";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  orgUnit: router({
    list: publicProcedure.query(() => getAllOrgUnits()),
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        type: z.enum(["entity", "division", "department", "team"]),
        parentId: z.number().nullable().optional(),
        headCount: z.number().optional(),
      }))
      .mutation(({ input }) => createOrgUnit(input as any)),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        type: z.enum(["entity", "division", "department", "team"]).optional(),
        parentId: z.number().nullable().optional(),
        headCount: z.number().optional(),
      }))
      .mutation(({ input }) => { const { id, ...data } = input; return updateOrgUnit(id, data as any); }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteOrgUnit(input.id)),
  }),

  employee: router({
    list: protectedProcedure.query(() => getAllEmployees()),
    search: protectedProcedure
      .input(z.object({ query: z.string() }))
      .query(({ input }) => searchEmployees(input.query)),
    byId: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getEmployeeById(input.id)),
    me: protectedProcedure.query(({ ctx }) => getEmployeeByUserId(ctx.user.id)),
    teamMembers: protectedProcedure
      .input(z.object({ orgUnitId: z.number() }))
      .query(({ input }) => getTeamMembers(input.orgUnitId)),
    create: adminProcedure
      .input(z.object({
        employeeCode: z.string().min(1),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        nationality: z.string().optional(),
        position: z.string().min(1),
        employmentType: z.enum(["full-time", "part-time", "contract", "intern"]).default("full-time"),
        workLocation: z.string().optional(),
        startDate: z.string(),
        contractEndDate: z.string().nullable().optional(),
        status: z.enum(["active", "inactive", "terminated"]).default("active"),
        orgUnitId: z.number().optional(),
        managerId: z.number().optional(),
        isManager: z.boolean().default(false),
        userId: z.number().optional(),
        photoUrl: z.string().optional(),
        emergencyContact: z.string().optional(),
      }))
      .mutation(({ input }) => {
        const toMysqlDate = (v: string | null | undefined) => {
          if (!v || v.trim() === "") return undefined;
          const d = new Date(v);
          if (isNaN(d.getTime())) return undefined;
          return d.toISOString().slice(0, 10);
        };
        const data = {
          ...input,
          startDate: toMysqlDate(input.startDate) ?? input.startDate,
          contractEndDate: toMysqlDate(input.contractEndDate),
          managerId: input.managerId ?? undefined,
        };
        return createEmployee(data as any);
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        employeeCode: z.string().optional(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        nationality: z.string().optional(),
        position: z.string().optional(),
        employmentType: z.enum(["full-time", "part-time", "contract", "intern"]).optional(),
        workLocation: z.string().optional(),
        startDate: z.string().optional(),
        contractEndDate: z.string().nullable().optional(),
        status: z.enum(["active", "inactive", "terminated"]).optional(),
        orgUnitId: z.number().nullable().optional(),
        managerId: z.number().nullable().optional(),
        isManager: z.boolean().optional(),
        userId: z.number().nullable().optional(),
        photoUrl: z.string().optional(),
        emergencyContact: z.string().optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        // Normalize date strings to YYYY-MM-DD for MySQL date columns
        const toMysqlDate = (v: string | null | undefined) => {
          if (!v) return v;
          const d = new Date(v);
          if (isNaN(d.getTime())) return v;
          return d.toISOString().slice(0, 10);
        };
        if (data.startDate) data.startDate = toMysqlDate(data.startDate) ?? data.startDate;
        if (data.contractEndDate) data.contractEndDate = toMysqlDate(data.contractEndDate);
        return updateEmployee(id, data as any);
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteEmployee(input.id)),
  }),

  salary: router({
    list: protectedProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(({ input }) => getSalaryRecords(input.employeeId)),
    create: adminProcedure
      .input(z.object({
        employeeId: z.number(),
        currency: z.string().default("SGD"),
        amount: z.string(),
        paymentDate: z.string(),
        periodLabel: z.string(),
        status: z.enum(["paid", "pending", "cancelled"]).default("paid"),
        payslipUrl: z.string().optional(),
      }))
      .mutation(({ input }) => createSalaryRecord(input as any)),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        currency: z.string().optional(),
        amount: z.string().optional(),
        paymentDate: z.string().optional(),
        periodLabel: z.string().optional(),
        status: z.enum(["paid", "pending", "cancelled"]).optional(),
        payslipUrl: z.string().optional(),
      }))
      .mutation(({ input }) => { const { id, ...data } = input; return updateSalaryRecord(id, data as any); }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteSalaryRecord(input.id)),
  }),

  performance: router({
    list: protectedProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(({ input }) => getPerformanceResults(input.employeeId)),
    categoryScores: protectedProcedure
      .input(z.object({ resultId: z.number() }))
      .query(({ input }) => getPerformanceCategoryScores(input.resultId)),
    create: adminProcedure
      .input(z.object({
        employeeId: z.number(),
        period: z.string(),
        overallScore: z.string().optional(),
        grade: z.string().optional(),
        managerScore: z.string().optional(),
        peerScore: z.string().optional(),
        selfScore: z.string().optional(),
        managerComment: z.string().optional(),
        peerComment: z.string().optional(),
        selfComment: z.string().optional(),
      }))
      .mutation(({ input }) => createPerformanceResult(input as any)),
  }),

  evaluation: router({
    // ── Cycles ──────────────────────────────────────────────────────────────
    cycles: publicProcedure.query(() => getEvaluationCycles()),
    cycleById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getEvaluationCycleById(input.id)),
    createCycle: adminProcedure
      .input(z.object({
        period: z.string().min(1),
        status: z.enum(["open", "closed", "upcoming"]).default("upcoming"),
        openDate: z.string().optional(),
        closeDate: z.string().optional(),
      }))
      .mutation(({ input }) => createEvaluationCycle(input as any)),
    updateCycle: adminProcedure
      .input(z.object({
        id: z.number(),
        period: z.string().optional(),
        status: z.enum(["open", "closed", "upcoming"]).optional(),
        openDate: z.string().nullable().optional(),
        closeDate: z.string().nullable().optional(),
      }))
      .mutation(({ input }) => { const { id, ...data } = input; return updateEvaluationCycle(id, data as any); }),
    deleteCycle: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteEvaluationCycle(input.id)),

    // ── Tasks ───────────────────────────────────────────────────────────────
    myTasks: protectedProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(({ input }) => getEvaluationTasksForEmployee(input.employeeId)),
    tasksByCycle: adminProcedure
      .input(z.object({ cycleId: z.number() }))
      .query(({ input }) => getEvaluationTasksByCycle(input.cycleId)),
    createTask: adminProcedure
      .input(z.object({
        cycleId: z.number(),
        evaluatorId: z.number(),
        evaluateeId: z.number(),
        type: z.enum(["self", "peer", "manager", "contractor"]),
        status: z.enum(["pending", "in-progress", "completed"]).default("pending"),
      }))
      .mutation(({ input }) => createEvaluationTask(input as any)),
    bulkCreateTasks: adminProcedure
      .input(z.object({
        cycleId: z.number(),
        tasks: z.array(z.object({
          evaluatorId: z.number(),
          evaluateeId: z.number(),
          type: z.enum(["self", "peer", "manager", "contractor"]),
        })),
      }))
      .mutation(({ input }) => {
        const tasks = input.tasks.map(t => ({
          ...t,
          cycleId: input.cycleId,
          status: "pending" as const,
        }));
        return bulkCreateEvaluationTasks(tasks as any);
      }),
    deleteTask: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteEvaluationTask(input.id)),
    removeEvaluateeFromCycle: adminProcedure
      .input(z.object({ cycleId: z.number(), evaluateeId: z.number() }))
      .mutation(({ input }) => deleteEvaluationTasksByCycleAndEvaluatee(input.cycleId, input.evaluateeId)),
  }),

  announcement: router({
    list: publicProcedure.query(() => getAnnouncements()),
    listAll: adminProcedure.query(() => getAllAnnouncements()),
    create: adminProcedure
      .input(z.object({
        title: z.string().min(1),
        category: z.string().min(1),
        content: z.string().optional(),
        publishDate: z.string(),
        isActive: z.boolean().default(true),
      }))
      .mutation(({ input }) => createAnnouncement(input as any)),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        category: z.string().optional(),
        content: z.string().optional(),
        publishDate: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(({ input }) => { const { id, ...data } = input; return updateAnnouncement(id, data as any); }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteAnnouncement(input.id)),
  }),

  document: router({
    list: protectedProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(({ input }) => getEmployeeDocuments(input.employeeId)),
    create: adminProcedure
      .input(z.object({
        employeeId: z.number(),
        name: z.string().min(1),
        fileUrl: z.string().optional(),
        fileType: z.string().default("PDF"),
        issueDate: z.string().optional(),
      }))
      .mutation(({ input }) => createEmployeeDocument(input as any)),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteEmployeeDocument(input.id)),
  }),

  // ─── Evaluation Form Builder ───────────────────────────────────────────────
  evalForm: router({
    // List all 5 form templates
    listAll: protectedProcedure.query(() => getAllEvaluationForms()),
    // Get a single form with its categories and KPIs
    getWithContent: protectedProcedure
      .input(z.object({ formId: z.number() }))
      .query(async ({ input }) => {
        const form = await getEvaluationFormById(input.formId);
        if (!form) return null;
        const categories = await getCategoriesByFormId(input.formId);
        const categoriesWithKpis = await Promise.all(
          categories.map(async (cat) => {
            const kpis = await getKpisByCategoryId(cat.id);
            return { ...cat, kpis };
          })
        );
        return { ...form, categories: categoriesWithKpis };
      }),
    // Get form by type (for employee portal)
    getByType: publicProcedure
      .input(z.object({ formType: z.string() }))
      .query(async ({ input }) => {
        const form = await getEvaluationFormByType(input.formType);
        if (!form) return null;
        const categories = await getCategoriesByFormId(form.id);
        const categoriesWithKpis = await Promise.all(
          categories.map(async (cat) => {
            const kpis = await getKpisByCategoryId(cat.id);
            return { ...cat, kpis };
          })
        );
        return { ...form, categories: categoriesWithKpis };
      }),
    // Upsert form metadata (admin)
    upsert: adminProcedure
      .input(z.object({
        formType: z.enum(["self_regular", "self_manager", "peer", "manager_eval", "contractor"]),
        title: z.string().min(1),
        description: z.string().optional(),
        isActive: z.boolean().default(true),
      }))
      .mutation(({ input }) => upsertEvaluationForm(input as any)),
    updateMeta: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(({ input }) => { const { id, ...data } = input; return updateEvaluationForm(id, data); }),
  }),

  // ─── Form Categories ───────────────────────────────────────────────────────
  formCategory: router({
    listByForm: protectedProcedure
      .input(z.object({ formId: z.number() }))
      .query(({ input }) => getCategoriesByFormId(input.formId)),
    create: adminProcedure
      .input(z.object({
        formId: z.number(),
        title: z.string().min(1),
        weight: z.number().min(0).max(100).default(0),
        purpose: z.string().optional(),
        definition: z.string().optional(),
        sortOrder: z.number().default(0),
      }))
      .mutation(({ input }) => createFormCategory(input as any)),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        weight: z.number().min(0).max(100).optional(),
        purpose: z.string().optional(),
        definition: z.string().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(({ input }) => { const { id, ...data } = input; return updateFormCategory(id, data as any); }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteFormCategory(input.id)),
  }),

  // ─── Form KPIs ─────────────────────────────────────────────────────────────
  formKpi: router({
    listByCategory: protectedProcedure
      .input(z.object({ categoryId: z.number() }))
      .query(({ input }) => getKpisByCategoryId(input.categoryId)),
    create: adminProcedure
      .input(z.object({
        categoryId: z.number(),
        kpiName: z.string().min(1),
        question: z.string().min(1),
        sortOrder: z.number().default(0),
      }))
      .mutation(({ input }) => createFormKpi(input as any)),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        kpiName: z.string().optional(),
        question: z.string().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(({ input }) => { const { id, ...data } = input; return updateFormKpi(id, data as any); }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteFormKpi(input.id)),
  }),

  // ─── Evaluation Responses ──────────────────────────────────────────────────
  evalResponse: router({
    getByTask: protectedProcedure
      .input(z.object({ taskId: z.number() }))
      .query(({ input }) => getResponseByTaskId(input.taskId)),
    submit: protectedProcedure
      .input(z.object({
        taskId: z.number(),
        formId: z.number(),
        evaluatorId: z.number(),
        evaluateeId: z.number(),
        overallComment: z.string().optional(),
        kpiScores: z.array(z.object({
          kpiId: z.number(),
          score: z.number().min(1).max(5),
          comment: z.string().optional(),
        })),
      }))
      .mutation(async ({ input }) => {
        const { kpiScores, ...responseData } = input;
        return createEvaluationResponse(
          { ...responseData, submittedAt: new Date(), createdAt: new Date() },
          kpiScores.map(k => ({ ...k, responseId: 0 }))
        );
      }),
    kpiAnswers: protectedProcedure
      .input(z.object({ responseId: z.number() }))
      .query(({ input }) => getKpiResponsesByResponseId(input.responseId)),
  }),
});

export type AppRouter = typeof appRouter;
