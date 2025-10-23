import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";

export default function Evaluations() {
  const { data: evaluations, isLoading } = trpc.evaluations.list.useQuery();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">評分管理</h1>
        <p className="text-muted-foreground mt-2">查看所有評分記錄</p>
      </div>

      {isLoading ? (
        <div>載入中...</div>
      ) : (
        <div className="grid gap-4">
          {evaluations?.map((evaluation) => (
            <Card key={evaluation.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>評分 #{evaluation.id}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      評分人員：ID {evaluation.evaluatorId}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{evaluation.totalScore}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {evaluation.performanceLevel === "excellent" && "表現良好"}
                      {evaluation.performanceLevel === "competent" && "表現正常"}
                      {evaluation.performanceLevel === "developing" && "持續練習"}
                      {evaluation.performanceLevel === "basic" && "基本能力"}
                      {evaluation.performanceLevel === "needs_improvement" && "需要加強"}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  評分時間：{new Date(evaluation.evaluatedAt).toLocaleString("zh-TW")}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
