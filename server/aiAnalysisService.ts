import { invokeLLM } from "./_core/llm";
import type { Message } from "./_core/llm";

/**
 * AI 分析服務 - 使用 Google Gemini 進行洽談內容分析
 */

/**
 * AI 建議建案名稱
 */
export async function suggestProjectName(transcriptText: string): Promise<string> {
  const systemPrompt = `你是一位專業的室內設計業務助理，擅長根據洽談內容生成簡潔有意義的建案名稱。

命名原則：
1. 優先提取客戶提到的地點（區域、街道、大樓名稱）
2. 結合案件類型（住宅、商業、辦公室、豪宅等）
3. 如果有明顯特徵（如房型、風格）可以加入
4. 保持簡潔，6-15 個中文字
5. 不要加「案」字，直接命名

範例：
- "信義區豪宅"
- "板橋新成屋"
- "內湖三房裝修"
- "南港辦公室"
- "大安區老屋翻新"

請只回傳建案名稱，不要有任何其他說明文字。`;

  const userPrompt = `請根據以下洽談內容，生成一個簡潔的建案名稱：

${transcriptText}`;

  try {
    const messages: Message[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    const response = await invokeLLM({ messages });
    const content = response.choices[0]?.message?.content;
    const projectName = (typeof content === 'string' ? content.trim() : "未命名建案") || "未命名建案";
    
    return projectName;
  } catch (error) {
    console.error("AI 建議建案名稱失敗:", error);
    return "未命名建案";
  }
}

interface AnalysisResult {
  keywords: string[];
  sentimentOverall: "positive" | "neutral" | "negative";
  sentimentScore: number;
  successFactors: string[];
  questionQuality: number;
  responseCompleteness: number;
  professionalTermUsage: number;
  controlLevel: number;
  clientType: "budget" | "design" | "quality" | "timeline" | "hesitant";
  clientTypeConfidence: number;
  improvementSuggestions: string[];
}

/**
 * 分析洽談內容
 */
export async function analyzeMeetingTranscript(
  transcriptText: string,
  meetingStage: string,
  clientBudget?: number
): Promise<AnalysisResult> {
  const systemPrompt = `你是一位專業的室內設計業務分析專家，專門分析業務人員與客戶的洽談內容。
你需要從以下維度進行分析：

1. **關鍵字提取**：識別洽談中的重要詞彙（風格、材質、預算、時程等）
2. **情緒分析**：評估整體對話氛圍（正面/中性/負面）和情緒分數（0-100）
3. **成交要素識別**：找出促成或阻礙成交的關鍵因素
4. **對話品質評分**（各項 0-100 分）：
   - 提問品質：開放式問題的使用、問題的深度
   - 回應完整度：回答是否完整、是否解決客戶疑慮
   - 專業術語使用：專業知識的展現程度
   - 主導權掌握度：是否能有效引導對話方向
5. **客戶類型分類**：
   - 預算型：對價格敏感，經常討論費用
   - 設計型：重視美感與創意，關注設計風格
   - 品質型：重視材料與工法，關注施工品質
   - 時程型：趕工期，關注完工時間
   - 猶豫型：需多次洽談，決策緩慢
6. **改進建議**：針對弱項提供具體可行的改進方法

請以專業、客觀的角度進行分析，提供實用的建議。`;

  const userPrompt = `請分析以下室內設計業務洽談內容：

**洽談階段**：${meetingStage}
${clientBudget ? `**客戶預算**：${clientBudget.toLocaleString()} 元` : ""}

**洽談內容**：
${transcriptText}

請以 JSON 格式返回分析結果。`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "meeting_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              keywords: {
                type: "array",
                items: { type: "string" },
                description: "關鍵字陣列，提取 5-10 個重要詞彙",
              },
              sentimentOverall: {
                type: "string",
                enum: ["positive", "neutral", "negative"],
                description: "整體情緒：positive（正面）、neutral（中性）、negative（負面）",
              },
              sentimentScore: {
                type: "integer",
                description: "情緒分數，0-100，越高越正面",
              },
              successFactors: {
                type: "array",
                items: { type: "string" },
                description: "成交要素陣列，列出促成或阻礙成交的關鍵因素",
              },
              questionQuality: {
                type: "integer",
                description: "提問品質分數，0-100",
              },
              responseCompleteness: {
                type: "integer",
                description: "回應完整度分數，0-100",
              },
              professionalTermUsage: {
                type: "integer",
                description: "專業術語使用分數，0-100",
              },
              controlLevel: {
                type: "integer",
                description: "主導權掌握度分數，0-100",
              },
              clientType: {
                type: "string",
                enum: ["budget", "design", "quality", "timeline", "hesitant"],
                description: "客戶類型：budget（預算型）、design（設計型）、quality（品質型）、timeline（時程型）、hesitant（猶豫型）",
              },
              clientTypeConfidence: {
                type: "integer",
                description: "客戶類型分類的信心度，0-100",
              },
              improvementSuggestions: {
                type: "array",
                items: { type: "string" },
                description: "改進建議陣列，提供 3-5 條具體可行的建議",
              },
            },
            required: [
              "keywords",
              "sentimentOverall",
              "sentimentScore",
              "successFactors",
              "questionQuality",
              "responseCompleteness",
              "professionalTermUsage",
              "controlLevel",
              "clientType",
              "clientTypeConfidence",
              "improvementSuggestions",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    if (!content || typeof content !== "string") {
      throw new Error("AI 分析返回空結果");
    }

    const result: AnalysisResult = JSON.parse(content);
    return result;
  } catch (error) {
    console.error("AI 分析失敗：", error);
    // 返回預設值
    return {
      keywords: ["分析失敗"],
      sentimentOverall: "neutral",
      sentimentScore: 50,
      successFactors: ["AI 分析暫時無法使用"],
      questionQuality: 50,
      responseCompleteness: 50,
      professionalTermUsage: 50,
      controlLevel: 50,
      clientType: "hesitant",
      clientTypeConfidence: 0,
      improvementSuggestions: ["請稍後重試 AI 分析功能"],
    };
  }
}

/**
 * 根據評分結果生成 AI 建議評分
 */
export async function generateEvaluationSuggestion(
  transcriptText: string,
  meetingStage: string
): Promise<Record<string, number>> {
  const systemPrompt = `你是一位專業的室內設計業務評分專家。根據洽談內容，為以下 20 個評分項目提供建議評分（1分：沒做到、3分：有做到、5分：做得好）。

評分項目：
1. 主動詢問並理解客戶的空間用途、家庭成員、生活習慣
2. 耐心聆聽，針對需求提出追問
3. 精確詢問客戶重點需求
4. 引導客戶說明喜歡/不喜歡的風格、顏色、材質
5. 引導客戶說明指定保留、搬入的家具/家電品牌
6. 以實例說明設計理念（官網、案例、圖片）
7. 展現專業知識
8. 運用官網資訊說明公司優勢（ISO9001、放樣驗收、TTQS等）
9. 主動詢問預算並協助理解預算分配
10. 討論設計、施工時程，詢問特殊時程需求
11. 提到初步規劃尺寸與實際落差需仔細丈量
12. 詢問客戶後續偏好溝通頻率與方式
13. 清晰完整說明設計流程、各階段進度、預期提交資料
14. 儀態、表達、眼神交流展現專業形象
15. 專業且具說服力地解釋疑問，或列為確認追蹤事項
16. 保持主導地位，有效引導話題，掌控洽談節奏
17. 主動邀請客戶進行下一步（現場丈量、再約洽談等）
18. 客戶需求被業務重視
19. 洽談過程流暢、愉快且具信任感
20. 委婉且堅定地說明不合理要求或專業誤解

請客觀評分，如果內容中沒有明確體現某項目，應給予較低分數。`;

  const userPrompt = `請為以下洽談內容提供評分建議：

**洽談階段**：${meetingStage}

**洽談內容**：
${transcriptText}

請以 JSON 格式返回評分建議。`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "evaluation_suggestion",
          strict: true,
          schema: {
            type: "object",
            properties: {
              score1: { type: "integer", enum: [1, 3, 5] },
              score2: { type: "integer", enum: [1, 3, 5] },
              score3: { type: "integer", enum: [1, 3, 5] },
              score4: { type: "integer", enum: [1, 3, 5] },
              score5: { type: "integer", enum: [1, 3, 5] },
              score6: { type: "integer", enum: [1, 3, 5] },
              score7: { type: "integer", enum: [1, 3, 5] },
              score8: { type: "integer", enum: [1, 3, 5] },
              score9: { type: "integer", enum: [1, 3, 5] },
              score10: { type: "integer", enum: [1, 3, 5] },
              score11: { type: "integer", enum: [1, 3, 5] },
              score12: { type: "integer", enum: [1, 3, 5] },
              score13: { type: "integer", enum: [1, 3, 5] },
              score14: { type: "integer", enum: [1, 3, 5] },
              score15: { type: "integer", enum: [1, 3, 5] },
              score16: { type: "integer", enum: [1, 3, 5] },
              score17: { type: "integer", enum: [1, 3, 5] },
              score18: { type: "integer", enum: [1, 3, 5] },
              score19: { type: "integer", enum: [1, 3, 5] },
              score20: { type: "integer", enum: [1, 3, 5] },
            },
            required: [
              "score1", "score2", "score3", "score4", "score5",
              "score6", "score7", "score8", "score9", "score10",
              "score11", "score12", "score13", "score14", "score15",
              "score16", "score17", "score18", "score19", "score20",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    if (!content || typeof content !== "string") {
      throw new Error("AI 評分建議返回空結果");
    }

    return JSON.parse(content);
  } catch (error) {
    console.error("AI 評分建議生成失敗：", error);
    // 返回預設值（全部 3 分）
    return {
      score1: 3, score2: 3, score3: 3, score4: 3, score5: 3,
      score6: 3, score7: 3, score8: 3, score9: 3, score10: 3,
      score11: 3, score12: 3, score13: 3, score14: 3, score15: 3,
      score16: 3, score17: 3, score18: 3, score19: 3, score20: 3,
    };
  }
}

