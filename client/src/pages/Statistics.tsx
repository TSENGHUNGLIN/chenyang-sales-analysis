import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Statistics() {
  const { data: successRate } = trpc.statistics.successRate.useQuery();
  const { data: clientTypes } = trpc.statistics.clientTypeDistribution.useQuery();

  const clientTypeLabels = {
    budget: "預算型",
    design: "設計型",
    quality: "品質型",
    timeline: "時程型",
    hesitant: "猶豫型",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">統計分析</h1>
        <p className="text-muted-foreground mt-2">業務表現與客戶分析</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>整體成交率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-5xl font-bold text-primary">
                  {successRate?.successRate.toFixed(1) || 0}%
                </div>
                <p className="text-sm text-muted-foreground mt-2">整體成交率</p>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-semibold">{successRate?.total || 0}</div>
                  <p className="text-xs text-muted-foreground">總洽談數</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-green-600">{successRate?.success || 0}</div>
                  <p className="text-xs text-muted-foreground">成交數</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-red-600">{successRate?.failed || 0}</div>
                  <p className="text-xs text-muted-foreground">失敗數</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>客戶類型分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {clientTypes?.map((type) => (
                <div key={type.clientType} className="flex items-center justify-between">
                  <span className="text-sm">{clientTypeLabels[type.clientType as keyof typeof clientTypeLabels]}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${(type.count / (clientTypes?.reduce((sum, t) => sum + t.count, 0) || 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{type.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
