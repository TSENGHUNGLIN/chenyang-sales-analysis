import { eq, desc, and, sql, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  meetings, InsertMeeting, Meeting,
  evaluations, InsertEvaluation, Evaluation,
  aiAnalysis, InsertAiAnalysis, AiAnalysis,
  failedCases, InsertFailedCase, FailedCase
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

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

// ==================== 使用者相關 ====================

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

    const textFields = ["name", "email", "loginMethod", "department"] as const;
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
    } else if (user.openId === ENV.ownerId) {
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

export async function getUser(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(userId: number, role: "admin" | "evaluator" | "viewer" | "guest") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function createPasswordUser(data: {
  username: string;
  passwordHash: string;
  name: string;
  email?: string;
  role: "admin" | "evaluator" | "viewer" | "guest";
  department?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // 檢查帳號是否已存在
  const existing = await db.select().from(users).where(eq(users.username, data.username)).limit(1);
  if (existing.length > 0) {
    throw new Error("帳號已存在");
  }
  
  const result = await db.insert(users).values({
    username: data.username,
    passwordHash: data.passwordHash,
    name: data.name,
    email: data.email,
    role: data.role,
    department: data.department,
    loginMethod: "password",
  });
  
  return result[0].insertId;
}

export async function getUserByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function deleteUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(users).where(eq(users.id, userId));
}

export async function updateUserLastSignedIn(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, userId));
}

export async function updateUserPassword(userId: number, newPasswordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ passwordHash: newPasswordHash }).where(eq(users.id, userId));
}

export async function convertToPasswordLogin(userId: number, username: string, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // 檢查帳號是否已存在
  const existing = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (existing.length > 0 && existing[0].id !== userId) {
    throw new Error("帳號已存在");
  }
  
  // 更新使用者為帳號密碼登入
  await db.update(users).set({
    username,
    passwordHash,
    loginMethod: "password",
  }).where(eq(users.id, userId));
}

// ==================== 統計分析相關 ====================

export async function getStatistics() {
  const db = await getDb();
  if (!db) return null;
  
  // 案件狀態統計
  const caseStatusStats = await db.select({
    status: meetings.caseStatus,
    count: sql<number>`count(*)`
  })
  .from(meetings)
  .groupBy(meetings.caseStatus);
  
  // 洽談階段統計
  const meetingStageStats = await db.select({
    stage: meetings.meetingStage,
    count: sql<number>`count(*)`
  })
  .from(meetings)
  .groupBy(meetings.meetingStage);
  
  // 評分統計（平均分）
  const evaluationStats = await db.select({
    avgScore: sql<number>`avg((
      q1_score + q2_score + q3_score + q4_score + q5_score + 
      q6_score + q7_score + q8_score + q9_score + q10_score + 
      q11_score + q12_score + q13_score + q14_score + q15_score + 
      q16_score + q17_score + q18_score + q19_score + q20_score
    ) / 20)`,
    count: sql<number>`count(*)`
  })
  .from(evaluations);
  
  // 總案件數
  const totalMeetings = await db.select({ count: sql<number>`count(*)` }).from(meetings);
  
  return {
    caseStatusStats,
    meetingStageStats,
    evaluationStats: evaluationStats[0] || { avgScore: 0, count: 0 },
    totalMeetings: totalMeetings[0]?.count || 0,
  };
}

export async function getSalespersonPerformance() {
  const db = await getDb();
  if (!db) return [];
  
  const performance = await db.select({
    salespersonId: meetings.salespersonId,
    salespersonName: meetings.salespersonName,
    totalCases: sql<number>`count(*)`,
    successCases: sql<number>`sum(case when ${meetings.caseStatus} = 'success' then 1 else 0 end)`,
    failedCases: sql<number>`sum(case when ${meetings.caseStatus} = 'failed' then 1 else 0 end)`,
    inProgressCases: sql<number>`sum(case when ${meetings.caseStatus} = 'in_progress' then 1 else 0 end)`,
  })
  .from(meetings)
  .groupBy(meetings.salespersonId, meetings.salespersonName);
  
  return performance;
}

export async function getMonthlyTrend() {
  const db = await getDb();
  if (!db) return [];
  
  const trend = await db.select({
    month: sql<string>`DATE_FORMAT(${meetings.meetingDate}, '%Y-%m')`,
    count: sql<number>`count(*)`,
    successCount: sql<number>`sum(case when ${meetings.caseStatus} = 'success' then 1 else 0 end)`,
  })
  .from(meetings)
  .groupBy(sql`DATE_FORMAT(${meetings.meetingDate}, '%Y-%m')`)
  .orderBy(sql`DATE_FORMAT(${meetings.meetingDate}, '%Y-%m')`);
  
  return trend;
}

// ==================== 洽談記錄相關 ====================

export async function createMeeting(meeting: InsertMeeting) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(meetings).values(meeting);
  return result[0].insertId;
}

export async function getMeeting(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(meetings).where(eq(meetings.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllMeetings() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(meetings).orderBy(desc(meetings.meetingDate));
}

export async function getMeetingsBySalesperson(salespersonId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(meetings)
    .where(eq(meetings.salespersonId, salespersonId))
    .orderBy(desc(meetings.meetingDate));
}

export async function updateMeetingStatus(id: number, status: "in_progress" | "success" | "failed") {
  const db = await getDb();
  if (!db) return;
  await db.update(meetings).set({ caseStatus: status }).where(eq(meetings.id, id));
}

export async function deleteMeeting(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // 級聯刪除：先刪除相關的評分、AI 分析和失敗案件記錄
  await db.delete(evaluations).where(eq(evaluations.meetingId, id));
  await db.delete(aiAnalysis).where(eq(aiAnalysis.meetingId, id));
  await db.delete(failedCases).where(eq(failedCases.meetingId, id));
  
  // 最後刪除洽談記錄本身
  await db.delete(meetings).where(eq(meetings.id, id));
}

// ==================== 評分相關 ====================

export async function createEvaluation(evaluation: InsertEvaluation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(evaluations).values(evaluation);
  return result[0].insertId;
}

export async function getEvaluationByMeetingId(meetingId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(evaluations)
    .where(eq(evaluations.meetingId, meetingId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllEvaluations() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(evaluations).orderBy(desc(evaluations.evaluatedAt));
}

// ==================== AI 分析相關 ====================

export async function createAiAnalysis(analysis: InsertAiAnalysis) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(aiAnalysis).values(analysis);
  return result[0].insertId;
}

export async function getAiAnalysisByMeetingId(meetingId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(aiAnalysis)
    .where(eq(aiAnalysis.meetingId, meetingId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ==================== 失敗案件相關 ====================

export async function createFailedCase(failedCase: InsertFailedCase) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(failedCases).values(failedCase);
  return result[0].insertId;
}

export async function getAllFailedCases() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(failedCases).orderBy(desc(failedCases.createdAt));
}

// ==================== 統計分析相關 ====================

export async function getSuccessRate() {
  const db = await getDb();
  if (!db) return { total: 0, success: 0, failed: 0, inProgress: 0, successRate: 0 };
  
  const [totalResult] = await db.select({ count: count() }).from(meetings);
  const [successResult] = await db.select({ count: count() }).from(meetings).where(eq(meetings.caseStatus, "success"));
  const [failedResult] = await db.select({ count: count() }).from(meetings).where(eq(meetings.caseStatus, "failed"));
  const [inProgressResult] = await db.select({ count: count() }).from(meetings).where(eq(meetings.caseStatus, "in_progress"));
  
  const total = totalResult.count;
  const success = successResult.count;
  const failed = failedResult.count;
  const inProgress = inProgressResult.count;
  const successRate = total > 0 ? (success / total) * 100 : 0;
  
  return { total, success, failed, inProgress, successRate };
}

export async function getSalespersonDetailPerformance(salespersonId: number) {
  const db = await getDb();
  if (!db) return { totalMeetings: 0, successCount: 0, failedCount: 0, successRate: 0, avgScore: 0 };
  
  const meetingsData = await db.select().from(meetings)
    .where(eq(meetings.salespersonId, salespersonId));
  
  const totalMeetings = meetingsData.length;
  const successCount = meetingsData.filter(m => m.caseStatus === "success").length;
  const failedCount = meetingsData.filter(m => m.caseStatus === "failed").length;
  const successRate = totalMeetings > 0 ? (successCount / totalMeetings) * 100 : 0;
  
  // 計算平均評分
  const evaluationsData = await db.select().from(evaluations)
    .innerJoin(meetings, eq(evaluations.meetingId, meetings.id))
    .where(eq(meetings.salespersonId, salespersonId));
  
  const avgScore = evaluationsData.length > 0
    ? evaluationsData.reduce((sum, e) => sum + e.evaluations.totalScore, 0) / evaluationsData.length
    : 0;
  
  return { totalMeetings, successCount, failedCount, successRate, avgScore };
}

export async function getClientTypeDistribution() {
  const db = await getDb();
  if (!db) return [];
  
  const distribution = await db
    .select({
      clientType: aiAnalysis.clientType,
      count: count(),
    })
    .from(aiAnalysis)
    .groupBy(aiAnalysis.clientType);
  
  return distribution;
}

