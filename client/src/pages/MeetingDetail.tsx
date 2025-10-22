import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

interface MeetingDetailProps {
  id: number;
}

export default function MeetingDetail({ id }: MeetingDetailProps) {
  const { data: meeting, isLoading } = trpc.meetings.get.useQuery({ id });
  const { data: evaluation } = trpc.evaluations.getByMeetingId.useQuery({ meetingId: id });
  const { data: aiAnalysis } = trpc.aiAnalysis.getByMeetingId.useQuery({ meetingId: id });

  if (isLoading) return <div>載入中...</div>;
  if (!meeting) return <div>找不到記錄</div>;

  const stageLabels = {
    initial: "初洽",
    second: "二洽",
    third: "三洽",
    design_contract: "簽設計約",
    construction_contract: "工程約",
  };

  const statusLabels = {
    in_progress: "進行中",
    success: "已成交",
    failed: "已失敗",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/meetings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{meeting.clientName}</h1>
          <p className="text-muted-foreground mt-1">
            {stageLabels[meeting.meetingStage]} · {statusLabels[meeting.caseStatus]}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>基本資訊</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm text-muted-foreground">業務人員：</span>
              <span className="ml-2">{meeting.salespersonName}</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">洽談日期：</span>
              <span className="ml-2">{new Date(meeting.meetingDate).toLocaleDateString("zh-TW")}</span>
            </div>
            {meeting.clientContact && (
              <div>
                <span className="text-sm text-muted-foreground">聯絡方式：</span>
                <span className="ml-2">{meeting.clientContact}</span>
              </div>
            )}
            {meeting.clientBudget && (
              <div>
                <span className="text-sm text-muted-foreground">預算：</span>
                <span className="ml-2">{meeting.clientBudget.toLocaleString()} 元</span>
              </div>
            )}
            {meeting.projectType && (
              <div>
                <span className="text-sm text-muted-foreground">案件類型：</span>
                <span className="ml-2">{meeting.projectType}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {evaluation && (
          <Card>
            <CardHeader>
              <CardTitle>評分結果</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary">{evaluation.totalScore}</div>
                <div className="text-sm text-muted-foreground mt-1">總分</div>
                <div className="mt-4">
                  <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                    {evaluation.performanceLevel === "excellent" && "表現良好"}
                    {evaluation.performanceLevel === "competent" && "表現正常"}
                    {evaluation.performanceLevel === "developing" && "持續練習"}
                    {evaluation.performanceLevel === "basic" && "基本能力"}
                    {evaluation.performanceLevel === "needs_improvement" && "需要加強"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>洽談內容</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap text-sm">{meeting.transcriptText}</div>
        </CardContent>
      </Card>

      {aiAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle>AI 分析結果</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">客戶類型</h4>
              <span className="inline-block px-3 py-1 rounded-full bg-secondary text-sm">
                {aiAnalysis.clientType === "budget" && "預算型"}
                {aiAnalysis.clientType === "design" && "設計型"}
                {aiAnalysis.clientType === "quality" && "品質型"}
                {aiAnalysis.clientType === "timeline" && "時程型"}
                {aiAnalysis.clientType === "hesitant" && "猶豫型"}
              </span>
            </div>
            <div>
              <h4 className="font-medium mb-2">關鍵字</h4>
              <div className="flex flex-wrap gap-2">
                {aiAnalysis.keywords.map((keyword, i) => (
                  <span key={i} className="px-2 py-1 bg-muted rounded text-sm">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">改進建議</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {aiAnalysis.improvementSuggestions.map((suggestion, i) => (
                  <li key={i}>{suggestion}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {!evaluation && (
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-muted-foreground mb-4">尚未評分</p>
            <Link href={`/evaluations/new/${meeting.id}`}>
              <Button>前往評分</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
