import { COOKIE_NAME, ONE_HOUR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { analyzeMeetingTranscript, generateEvaluationSuggestion, suggestProjectName } from "./aiAnalysisService";
import bcrypt from "bcrypt";

// 管理員專用程序
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: '需要管理員權限' });
  }
  return next({ ctx });
});

// 評分人員或管理員專用程序
const evaluatorProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'evaluator' && ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: '需要評分人員或管理員權限' });
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
    loginWithPassword: publicProcedure
      .input(z.object({
        username: z.string(),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserByUsername(input.username);
        if (!user || !user.passwordHash) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: '帳號或密碼錯誤' });
        }
        
        const isValid = await bcrypt.compare(input.password, user.passwordHash);
        if (!isValid) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: '帳號或密碼錯誤' });
        }
        
        // 更新最後登入時間
        await db.updateUserLastSignedIn(user.id);
        
        // 建立 Session（使用 username 作為 openId）
        const { sdk } = ctx;
        const sessionToken = await sdk.createSessionToken(`password:${user.username}`, {
          name: user.name || user.username,
          expiresInMs: ONE_HOUR_MS,
        });
        
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_HOUR_MS });
        
        return { success: true, user };
      }),
  }),

  // 使用者管理
  users: router({
    list: adminProcedure.query(async () => {
      return await db.getAllUsers();
    }),
    updateRole: adminProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(["admin", "evaluator", "viewer", "guest"]),
      }))
      .mutation(async ({ input }) => {
        await db.updateUserRole(input.userId, input.role);
        return { success: true };
      }),
    create: adminProcedure
      .input(z.object({
        username: z.string().regex(/^A\d{6}$/, "帳號格式應為 A000001"),
        password: z.string().min(6, "密碼至少 6 位"),
        name: z.string().min(1, "請輸入姓名"),
        email: z.string().email().optional().or(z.literal("")),
        role: z.enum(["admin", "evaluator", "viewer", "guest"]),
        department: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const passwordHash = await bcrypt.hash(input.password, 10);
        const userId = await db.createPasswordUser({
          username: input.username,
          passwordHash,
          name: input.name,
          email: input.email || undefined,
          role: input.role,
          department: input.department,
        });
        return { success: true, userId };
      }),
    delete: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteUser(input.userId);
        return { success: true };
      }),
    changePassword: protectedProcedure
      .input(z.object({
        oldPassword: z.string(),
        newPassword: z.string().min(6, "密碼至少 6 位"),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = ctx.user;
        if (!user || !user.passwordHash) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: '無法修改密碼' });
        }
        
        // 驗證舊密碼
        const isValid = await bcrypt.compare(input.oldPassword, user.passwordHash);
        if (!isValid) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: '舊密碼錯誤' });
        }
        
        // 更新密碼
        const newPasswordHash = await bcrypt.hash(input.newPassword, 10);
        await db.updateUserPassword(user.id, newPasswordHash);
        
        return { success: true };
      }),
    resetPassword: adminProcedure
      .input(z.object({
        userId: z.number(),
        newPassword: z.string().min(6, "密碼至少 6 位"),
      }))
      .mutation(async ({ input }) => {
        const newPasswordHash = await bcrypt.hash(input.newPassword, 10);
        await db.updateUserPassword(input.userId, newPasswordHash);
        return { success: true };
      }),
  }),

  // 洽談記錄管理
  meetings: router({
    create: protectedProcedure
      .input(z.object({
        salesDesigner: z.string().optional(),
        drawingDesigner: z.string().optional(),
        projectName: z.string(),
        clientName: z.string().optional(),
        clientContact: z.string().optional(),
        clientBudget: z.number().optional(),
        projectType: z.string().optional(),
        meetingStage: z.enum(["initial", "second", "third", "design_contract", "construction_contract"]),
        meetingDate: z.date(),
        transcriptSource: z.enum(["recording", "upload", "manual"]),
        transcriptText: z.string(),
        audioFileUrl: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const meetingId = await db.createMeeting({
          salespersonId: ctx.user.id,
          salespersonName: ctx.user.name || "未知",
          ...input,
        });
        
        // 自動執行 AI 分析
        try {
          const analysis = await analyzeMeetingTranscript(
            input.transcriptText,
            input.meetingStage,
            input.clientBudget
          );
          
          await db.createAiAnalysis({
            meetingId,
            ...analysis,
          });
        } catch (error) {
          console.error("AI 分析失敗：", error);
          // 不阻止記錄創建，僅記錄錯誤
        }
        
        return { meetingId };
      }),
    
    list: protectedProcedure.query(async ({ ctx }) => {
      // 業務人員只能看自己的記錄，其他角色可以看全部
      if (ctx.user.role === "viewer" || ctx.user.role === "guest") {
        return await db.getMeetingsBySalesperson(ctx.user.id);
      }
      return await db.getAllMeetings();
    }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getMeeting(input.id);
      }),
    
    suggestProjectName: protectedProcedure
      .input(z.object({ transcriptText: z.string() }))
      .mutation(async ({ input }) => {
        const projectName = await suggestProjectName(input.transcriptText);
        return { projectName };
      }),
    
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["in_progress", "success", "failed"]),
      }))
      .mutation(async ({ input }) => {
        await db.updateMeetingStatus(input.id, input.status);
        return { success: true };
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteMeeting(input.id);
        return { success: true };
      }),
  }),

  // 評分管理
  evaluations: router({
    create: evaluatorProcedure
      .input(z.object({
        meetingId: z.number(),
        scores: z.object({
          score1: z.number().min(1).max(5),
          score2: z.number().min(1).max(5),
          score3: z.number().min(1).max(5),
          score4: z.number().min(1).max(5),
          score5: z.number().min(1).max(5),
          score6: z.number().min(1).max(5),
          score7: z.number().min(1).max(5),
          score8: z.number().min(1).max(5),
          score9: z.number().min(1).max(5),
          score10: z.number().min(1).max(5),
          score11: z.number().min(1).max(5),
          score12: z.number().min(1).max(5),
          score13: z.number().min(1).max(5),
          score14: z.number().min(1).max(5),
          score15: z.number().min(1).max(5),
          score16: z.number().min(1).max(5),
          score17: z.number().min(1).max(5),
          score18: z.number().min(1).max(5),
          score19: z.number().min(1).max(5),
          score20: z.number().min(1).max(5),
        }),
        manualNotes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const totalScore = Object.values(input.scores).reduce((sum, score) => sum + score, 0);
        
        // 計算表現等級
        let performanceLevel: "needs_improvement" | "basic" | "developing" | "competent" | "excellent";
        if (totalScore <= 35) performanceLevel = "needs_improvement";
        else if (totalScore <= 50) performanceLevel = "basic";
        else if (totalScore <= 65) performanceLevel = "developing";
        else if (totalScore <= 80) performanceLevel = "competent";
        else performanceLevel = "excellent";
        
        const evaluationId = await db.createEvaluation({
          meetingId: input.meetingId,
          evaluatorId: ctx.user.id,
          ...input.scores,
          totalScore,
          performanceLevel,
          manualNotes: input.manualNotes,
        });
        
        return { evaluationId, totalScore, performanceLevel };
      }),
    
    getByMeetingId: protectedProcedure
      .input(z.object({ meetingId: z.number() }))
      .query(async ({ input }) => {
        return await db.getEvaluationByMeetingId(input.meetingId);
      }),
    
    list: protectedProcedure.query(async () => {
      return await db.getAllEvaluations();
    }),
    
    // AI 評分建議
    getSuggestion: evaluatorProcedure
      .input(z.object({ meetingId: z.number() }))
      .mutation(async ({ input }) => {
        const meeting = await db.getMeeting(input.meetingId);
        if (!meeting) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '找不到洽談記錄' });
        }
        
        const suggestion = await generateEvaluationSuggestion(
          meeting.transcriptText,
          meeting.meetingStage
        );
        
        return suggestion;
      }),
  }),

  // AI 分析
  aiAnalysis: router({
    getByMeetingId: protectedProcedure
      .input(z.object({ meetingId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAiAnalysisByMeetingId(input.meetingId);
      }),
    
    // 手動觸發 AI 分析
    analyze: protectedProcedure
      .input(z.object({ meetingId: z.number() }))
      .mutation(async ({ input }) => {
        const meeting = await db.getMeeting(input.meetingId);
        if (!meeting) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '找不到洽談記錄' });
        }
        
        const analysis = await analyzeMeetingTranscript(
          meeting.transcriptText,
          meeting.meetingStage,
          meeting.clientBudget || undefined
        );
        
        // 檢查是否已存在分析結果
        const existing = await db.getAiAnalysisByMeetingId(input.meetingId);
        if (existing) {
          throw new TRPCError({ code: 'CONFLICT', message: '該記錄已有 AI 分析結果' });
        }
        
        const analysisId = await db.createAiAnalysis({
          meetingId: input.meetingId,
          ...analysis,
        });
        
        return { analysisId, ...analysis };
      }),
  }),

  // 失敗案件管理
  failedCases: router({
    create: protectedProcedure
      .input(z.object({
        meetingId: z.number(),
        clientName: z.string(),
        failureStage: z.enum(["initial", "second", "third", "design_contract", "construction_contract"]),
        failureReasons: z.array(z.string()),
        detailedAnalysis: z.string(),
        lessonsLearned: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const caseId = await db.createFailedCase({
          salespersonId: ctx.user.id,
          ...input,
        });
        
        // 更新洽談記錄狀態為失敗
        await db.updateMeetingStatus(input.meetingId, "failed");
        
        return { caseId };
      }),
    
    list: protectedProcedure.query(async () => {
      return await db.getAllFailedCases();
    }),
  }),

  // 統計分析
  statistics: router({
    successRate: protectedProcedure.query(async () => {
      return await db.getSuccessRate();
    }),
    
    salespersonPerformance: protectedProcedure
      .input(z.object({ salespersonId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const targetId = input.salespersonId || ctx.user.id;
        return await db.getSalespersonPerformance(targetId);
      }),
    
    clientTypeDistribution: protectedProcedure.query(async () => {
      return await db.getClientTypeDistribution();
    }),
  }),
});

export type AppRouter = typeof appRouter;

