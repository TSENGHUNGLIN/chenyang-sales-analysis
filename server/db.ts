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

export async function updateUserRole(userId: number, role: "admin" | "evaluator" | "salesperson" | "guest") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
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

export async function getSalespersonPerformance(salespersonId: number) {
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

