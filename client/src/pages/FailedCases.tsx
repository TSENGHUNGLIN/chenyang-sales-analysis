import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FailedCases() {
  const { data: failedCases, isLoading } = trpc.failedCases.list.useQuery();

  const stageLabels = {
    initial: "初洽",
    second: "二洽",
    third: "三洽",
    design_contract: "簽設計約",
    construction_contract: "工程約",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">失敗案件分析</h1>
        <p className="text-muted-foreground mt-2">檢討失敗案件，累積經驗</p>
      </div>

      {isLoading ? (
        <div>載入中...</div>
      ) : (
        <div className="grid gap-4">
          {failedCases?.map((failedCase) => (
            <Card key={failedCase.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{failedCase.clientName}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      失敗階段：{stageLabels[failedCase.failureStage]}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(failedCase.createdAt).toLocaleDateString("zh-TW")}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-2">失敗原因</h4>
                  <div className="flex flex-wrap gap-2">
                    {failedCase.failureReasons.map((reason, i) => (
                      <span key={i} className="px-2 py-1 bg-destructive/10 text-destructive rounded text-xs">
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-2">詳細分析</h4>
                  <p className="text-sm text-muted-foreground">{failedCase.detailedAnalysis}</p>
                </div>
                {failedCase.lessonsLearned && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">經驗教訓</h4>
                    <p className="text-sm text-muted-foreground">{failedCase.lessonsLearned}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
