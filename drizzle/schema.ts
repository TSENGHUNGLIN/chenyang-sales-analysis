import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";

/**
 * 使用者表 - 支援多角色權限管理
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  // 角色：admin(管理員), evaluator(評分人員), salesperson(業務人員), guest(訪客)
  role: mysqlEnum("role", ["admin", "evaluator", "salesperson", "guest"]).default("salesperson").notNull(),
  department: varchar("department", { length: 100 }), // 部門
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * 洽談記錄表
 */
export const meetings = mysqlTable("meetings", {
  id: int("id").autoincrement().primaryKey(),
  salespersonId: int("salespersonId").notNull(), // 業務人員 ID
  salespersonName: varchar("salespersonName", { length: 100 }).notNull(),
  clientName: varchar("clientName", { length: 100 }).notNull(), // 客戶姓名
  clientContact: varchar("clientContact", { length: 100 }), // 客戶聯絡方式
  clientBudget: int("clientBudget"), // 客戶預算（元）
  projectType: varchar("projectType", { length: 100 }), // 案件類型（住宅/商業/辦公室等）
  // 洽談階段：initial(初洽), second(二洽), third(三洽), design_contract(簽設計約), construction_contract(工程約)
  meetingStage: mysqlEnum("meetingStage", ["initial", "second", "third", "design_contract", "construction_contract"]).notNull(),
  meetingDate: timestamp("meetingDate").notNull(), // 洽談日期
  // 逐字稿來源：recording(錄音轉檔), upload(文字檔上傳), manual(手動輸入)
  transcriptSource: mysqlEnum("transcriptSource", ["recording", "upload", "manual"]).notNull(),
  transcriptText: text("transcriptText").notNull(), // 洽談內容逐字稿
  audioFileUrl: varchar("audioFileUrl", { length: 500 }), // 錄音檔案 URL（如有）
  // 案件狀態：in_progress(進行中), success(成交), failed(失敗)
  caseStatus: mysqlEnum("caseStatus", ["in_progress", "success", "failed"]).default("in_progress").notNull(),
  notes: text("notes"), // 備註
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Meeting = typeof meetings.$inferSelect;
export type InsertMeeting = typeof meetings.$inferInsert;

/**
 * 評分表 - 20 項評分指標
 */
export const evaluations = mysqlTable("evaluations", {
  id: int("id").autoincrement().primaryKey(),
  meetingId: int("meetingId").notNull(), // 關聯洽談記錄
  evaluatorId: int("evaluatorId").notNull(), // 評分人員 ID
  evaluatorName: varchar("evaluatorName", { length: 100 }).notNull(),
  
  // 一、空間與使用者需求掌握（3項）
  score1: int("score1").notNull(), // 主動詢問並理解客戶的空間用途、家庭成員、生活習慣
  score2: int("score2").notNull(), // 耐心聆聽，針對需求提出追問
  score3: int("score3").notNull(), // 精確詢問客戶重點需求
  
  // 二、設計風格與專業連結（5項）
  score4: int("score4").notNull(), // 引導客戶說明喜歡/不喜歡的風格、顏色、材質
  score5: int("score5").notNull(), // 引導客戶說明指定保留、搬入的家具/家電品牌
  score6: int("score6").notNull(), // 以實例說明設計理念
  score7: int("score7").notNull(), // 展現專業知識
  score8: int("score8").notNull(), // 運用官網資訊說明公司優勢
  
  // 三、預算、時程與現況評估（5項）
  score9: int("score9").notNull(), // 主動詢問預算並協助理解預算分配
  score10: int("score10").notNull(), // 討論設計、施工時程，詢問特殊時程需求
  score11: int("score11").notNull(), // 提到初步規劃尺寸與實際落差需仔細丈量
  score12: int("score12").notNull(), // 詢問客戶後續偏好溝通頻率與方式
  score13: int("score13").notNull(), // 清晰完整說明設計流程、各階段進度、預期提交資料
  
  // 四、專業形象與溝通技巧（7項）
  score14: int("score14").notNull(), // 儀態、表達、眼神交流展現專業形象
  score15: int("score15").notNull(), // 專業且具說服力地解釋疑問
  score16: int("score16").notNull(), // 保持主導地位，有效引導話題
  score17: int("score17").notNull(), // 主動邀請客戶進行下一步
  score18: int("score18").notNull(), // 客戶需求被業務重視
  score19: int("score19").notNull(), // 洽談過程流暢、愉快且具信任感
  score20: int("score20").notNull(), // 委婉且堅定地說明不合理要求
  
  totalScore: int("totalScore").notNull(), // 總分
  // 評分等級：needs_improvement(需加強), basic(基本能力), developing(持續練習), competent(表現正常), excellent(表現良好)
  performanceLevel: mysqlEnum("performanceLevel", ["needs_improvement", "basic", "developing", "competent", "excellent"]).notNull(),
  manualNotes: text("manualNotes"), // 評分備註
  evaluatedAt: timestamp("evaluatedAt").defaultNow().notNull(),
});

export type Evaluation = typeof evaluations.$inferSelect;
export type InsertEvaluation = typeof evaluations.$inferInsert;

/**
 * AI 分析結果表
 */
export const aiAnalysis = mysqlTable("aiAnalysis", {
  id: int("id").autoincrement().primaryKey(),
  meetingId: int("meetingId").notNull().unique(), // 關聯洽談記錄（一對一）
  
  // 基礎分析
  keywords: json("keywords").$type<string[]>().notNull(), // 關鍵字陣列
  sentimentOverall: varchar("sentimentOverall", { length: 20 }).notNull(), // 整體情緒：positive/neutral/negative
  sentimentScore: int("sentimentScore").notNull(), // 情緒分數 (0-100)
  successFactors: json("successFactors").$type<string[]>().notNull(), // 成交要素
  
  // 進階分析 - 對話品質評分
  questionQuality: int("questionQuality").notNull(), // 提問品質 (0-100)
  responseCompleteness: int("responseCompleteness").notNull(), // 回應完整度 (0-100)
  professionalTermUsage: int("professionalTermUsage").notNull(), // 專業術語使用 (0-100)
  controlLevel: int("controlLevel").notNull(), // 主導權掌握度 (0-100)
  
  // 客戶類型分類
  clientType: mysqlEnum("clientType", ["budget", "design", "quality", "timeline", "hesitant"]).notNull(), // 預算型/設計型/品質型/時程型/猶豫型
  clientTypeConfidence: int("clientTypeConfidence").notNull(), // 分類信心度 (0-100)
  
  // 改進建議
  improvementSuggestions: json("improvementSuggestions").$type<string[]>().notNull(),
  
  analyzedAt: timestamp("analyzedAt").defaultNow().notNull(),
});

export type AiAnalysis = typeof aiAnalysis.$inferSelect;
export type InsertAiAnalysis = typeof aiAnalysis.$inferInsert;

/**
 * 失敗案件分析表
 */
export const failedCases = mysqlTable("failedCases", {
  id: int("id").autoincrement().primaryKey(),
  meetingId: int("meetingId").notNull(), // 關聯洽談記錄
  salespersonId: int("salespersonId").notNull(),
  clientName: varchar("clientName", { length: 100 }).notNull(),
  // 失敗階段
  failureStage: mysqlEnum("failureStage", ["initial", "second", "third", "design_contract", "construction_contract"]).notNull(),
  // 失敗原因（可多選）
  failureReasons: json("failureReasons").$type<string[]>().notNull(), // 預算不符/時程不符/風格不合/競爭對手/客戶猶豫/其他
  detailedAnalysis: text("detailedAnalysis").notNull(), // 詳細分析
  lessonsLearned: text("lessonsLearned"), // 經驗教訓
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FailedCase = typeof failedCases.$inferSelect;
export type InsertFailedCase = typeof failedCases.$inferInsert;

