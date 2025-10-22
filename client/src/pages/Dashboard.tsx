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
        <h1 className="text-3xl font-bold">儀表板</h1>
        <p className="text-muted-foreground mt-2">
          歡迎回來，{user?.name || "使用者"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總洽談數</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              進行中 {stats?.inProgress || 0} 件
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">成交率</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.successRate.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              成交 {stats?.success || 0} / 失敗 {stats?.failed || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">我的洽談數</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performance?.totalMeetings || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              成交率 {performance?.successRate.toFixed(1) || 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均評分</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performance?.avgScore.toFixed(1) || 0}
            </div>
            <p className="text-xs text-muted-foreground">滿分 100 分</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>最近洽談記錄</CardTitle>
          <CardDescription>最新的 5 筆洽談記錄</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {meetings?.slice(0, 5).map((meeting) => (
              <div
                key={meeting.id}
                className="flex items-center justify-between border-b pb-4 last:border-0"
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
                  <p className="text-xs text-muted-foreground">
                    {meeting.caseStatus === "in_progress" && "進行中"}
                    {meeting.caseStatus === "success" && "已成交"}
                    {meeting.caseStatus === "failed" && "已失敗"}
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
