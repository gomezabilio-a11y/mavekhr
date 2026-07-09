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
  getEvaluationCycles, getEvaluationTasksForEmployee,
  getAnnouncements, getAllAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement,
  getEmployeeDocuments, createEmployeeDocument, deleteEmployeeDocument,
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
        contractEndDate: z.string().optional(),
        status: z.enum(["active", "inactive", "terminated"]).default("active"),
        orgUnitId: z.number().optional(),
        managerId: z.number().optional(),
        isManager: z.boolean().default(false),
        userId: z.number().optional(),
        photoUrl: z.string().optional(),
        emergencyContact: z.string().optional(),
      }))
      .mutation(({ input }) => createEmployee(input as any)),
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
      .mutation(({ input }) => { const { id, ...data } = input; return updateEmployee(id, data as any); }),
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
    cycles: publicProcedure.query(() => getEvaluationCycles()),
    myTasks: protectedProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(({ input }) => getEvaluationTasksForEmployee(input.employeeId)),
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
});

export type AppRouter = typeof appRouter;
