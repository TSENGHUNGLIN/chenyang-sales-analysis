import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";

interface CreateEvaluationProps {
  meetingId: number;
}

const evaluationItems = [
  { id: 1, category: "空間與使用者需求掌握", text: "主動詢問並理解客戶的空間用途、家庭成員、生活習慣" },
  { id: 2, category: "空間與使用者需求掌握", text: "耐心聆聽，針對需求提出追問" },
  { id: 3, category: "空間與使用者需求掌握", text: "精確詢問客戶重點需求" },
  { id: 4, category: "設計風格與專業連結", text: "引導客戶說明喜歡/不喜歡的風格、顏色、材質" },
  { id: 5, category: "設計風格與專業連結", text: "引導客戶說明指定保留、搬入的家具/家電品牌" },
  { id: 6, category: "設計風格與專業連結", text: "以實例說明設計理念（官網、案例、圖片）" },
  { id: 7, category: "設計風格與專業連結", text: "展現專業知識" },
  { id: 8, category: "設計風格與專業連結", text: "運用官網資訊說明公司優勢（ISO9001、放樣驗收、TTQS等）" },
  { id: 9, category: "預算、時程與現況評估", text: "主動詢問預算並協助理解預算分配" },
  { id: 10, category: "預算、時程與現況評估", text: "討論設計、施工時程，詢問特殊時程需求" },
  { id: 11, category: "預算、時程與現況評估", text: "提到初步規劃尺寸與實際落差需仔細丈量" },
  { id: 12, category: "預算、時程與現況評估", text: "詢問客戶後續偏好溝通頻率與方式" },
  { id: 13, category: "預算、時程與現況評估", text: "清晰完整說明設計流程、各階段進度、預期提交資料" },
  { id: 14, category: "專業形象與溝通技巧", text: "儀態、表達、眼神交流展現專業形象" },
  { id: 15, category: "專業形象與溝通技巧", text: "專業且具說服力地解釋疑問，或列為確認追蹤事項" },
  { id: 16, category: "專業形象與溝通技巧", text: "保持主導地位，有效引導話題，掌控洽談節奏" },
  { id: 17, category: "專業形象與溝通技巧", text: "主動邀請客戶進行下一步（現場丈量、再約洽談等）" },
  { id: 18, category: "專業形象與溝通技巧", text: "客戶需求被業務重視" },
  { id: 19, category: "專業形象與溝通技巧", text: "洽談過程流暢、愉快且具信任感" },
  { id: 20, category: "專業形象與溝通技巧", text: "委婉且堅定地說明不合理要求或專業誤解" },
];

export default function CreateEvaluation({ meetingId }: CreateEvaluationProps) {
  const [, setLocation] = useLocation();
  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [aiSuggestionsLoaded, setAiSuggestionsLoaded] = useState(false);

  const { data: meeting } = trpc.meetings.get.useQuery({ id: meetingId });
  
  const getSuggestionMutation = trpc.evaluations.getSuggestion.useMutation({
    onSuccess: (suggestion) => {
      setScores(suggestion);
      setAiSuggestionsLoaded(true);
      toast.success("已載入 AI 評分建議，您可以手動修改");
    },
    onError: (error) => {
      toast.error(`獲取 AI 建議失敗：${error.message}`);
    },
  });
  
  // 自動載入 AI 評分建議
  useEffect(() => {
    if (meetingId && !aiSuggestionsLoaded && !getSuggestionMutation.isPending) {
      getSuggestionMutation.mutate({ meetingId });
    }
  }, [meetingId]);

  const createMutation = trpc.evaluations.create.useMutation({
    onSuccess: () => {
      toast.success("評分已完成");
      setLocation(`/meetings/${meetingId}`);
    },
    onError: (error) => {
      toast.error("評分失敗：" + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const allScored = evaluationItems.every(item => scores[`score${item.id}`]);
    if (!allScored) {
      toast.error("請完成所有項目的評分");
      return;
    }

    createMutation.mutate({
      meetingId,
      scores: {
        score1: scores.score1,
        score2: scores.score2,
        score3: scores.score3,
        score4: scores.score4,
        score5: scores.score5,
        score6: scores.score6,
        score7: scores.score7,
        score8: scores.score8,
        score9: scores.score9,
        score10: scores.score10,
        score11: scores.score11,
        score12: scores.score12,
        score13: scores.score13,
        score14: scores.score14,
        score15: scores.score15,
        score16: scores.score16,
        score17: scores.score17,
        score18: scores.score18,
        score19: scores.score19,
        score20: scores.score20,
      },
      manualNotes: notes,
    });
  };

  const groupedItems = evaluationItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof evaluationItems>);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">評分表單</h1>
          {getSuggestionMutation.isPending && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              正在獲取 AI 建議...
            </div>
          )}
          {aiSuggestionsLoaded && (
            <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
              <Sparkles className="h-4 w-4" />
              AI 建議已載入
            </div>
          )}
        </div>
        {meeting && (
          <p className="text-muted-foreground mt-2">
            專案：{meeting.projectName}{meeting.clientName && ` · 客戶：${meeting.clientName}`}
          </p>
        )}
        {aiSuggestionsLoaded && (
          <p className="text-sm text-muted-foreground mt-1">
            🤖 以下評分為 AI 自動生成的建議，您可以根據實際情況修改任何項目的評分。
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {Object.entries(groupedItems).map(([category, items]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle>{category}</CardTitle>
              <CardDescription>1分：沒做到 · 3分：有做到 · 5分：做得好</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {items.map((item) => (
                <div key={item.id} className="space-y-3">
                  <Label className="text-sm font-normal">{item.id}. {item.text}</Label>
                  <RadioGroup
                    value={scores[`score${item.id}`]?.toString()}
                    onValueChange={(value) => setScores({ ...scores, [`score${item.id}`]: parseInt(value) })}
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="1" id={`${item.id}-1`} />
                      <Label htmlFor={`${item.id}-1`} className="font-normal cursor-pointer">1分</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="3" id={`${item.id}-3`} />
                      <Label htmlFor={`${item.id}-3`} className="font-normal cursor-pointer">3分</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="5" id={`${item.id}-5`} />
                      <Label htmlFor={`${item.id}-5`} className="font-normal cursor-pointer">5分</Label>
                    </div>
                  </RadioGroup>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader>
            <CardTitle>評分備註</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={5}
              placeholder="請輸入評分備註或建議..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "提交中..." : "提交評分"}
          </Button>
          <Button type="button" variant="outline" onClick={() => setLocation(`/meetings/${meetingId}`)}>
            取消
          </Button>
        </div>
      </form>
    </div>
  );
}
