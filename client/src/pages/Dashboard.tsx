import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, FileText } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats } = trpc.statistics.successRate.useQuery();
  const { data: performance } = trpc.statistics.salespersonPerformance.useQuery({});
  const { data: meetings } = trpc.meetings.list.useQuery();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          儀表板
        </h1>
        <p className="text-muted-foreground mt-2">
          歡迎回來，{user?.name || "使用者"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* 總洽談數 - 藍色主題 */}
        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總洽談數</CardTitle>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {stats?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              進行中 {stats?.inProgress || 0} 件
            </p>
          </CardContent>
        </Card>

        {/* 成交率 - 綠色主題 */}
        <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">成交率</CardTitle>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">
              {stats?.successRate.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              成交 {stats?.success || 0} / 失敗 {stats?.failed || 0}
            </p>
          </CardContent>
        </Card>

        {/* 我的洽談數 - 紫色主題 */}
        <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">我的洽談數</CardTitle>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <BarChart3 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
              {performance?.totalMeetings || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              成交率 {performance?.successRate.toFixed(1) || 0}%
            </p>
          </CardContent>
        </Card>

        {/* 平均評分 - 橙色主題 */}
        <Card className="border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均評分</CardTitle>
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Users className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">
              {performance?.avgScore.toFixed(1) || 0}
            </div>
            <p className="text-xs text-muted-foreground">滿分 100 分</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-t-4 border-t-indigo-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            最近洽談記錄
          </CardTitle>
          <CardDescription>最新的 5 筆洽談記錄</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {meetings?.slice(0, 5).map((meeting) => (
              <div
                key={meeting.id}
                className="flex items-center justify-between border-b pb-4 last:border-0 hover:bg-muted/50 p-3 rounded-lg transition-colors"
              >
                <div>
                  <p className="font-medium">{meeting.clientName}</p>
                  <p className="text-sm text-muted-foreground">
                    {meeting.meetingStage === "initial" && "初洽"}
                    {meeting.meetingStage === "second" && "二洽"}
                    {meeting.meetingStage === "third" && "三洽"}
                    {meeting.meetingStage === "design_contract" && "簽設計約"}
                    {meeting.meetingStage === "construction_contract" && "工程約"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm">
                    {new Date(meeting.meetingDate).toLocaleDateString("zh-TW")}
                  </p>
                  <p className="text-xs">
                    {meeting.caseStatus === "in_progress" && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        進行中
                      </span>
                    )}
                    {meeting.caseStatus === "success" && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        已成交
                      </span>
                    )}
                    {meeting.caseStatus === "failed" && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        已失敗
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

