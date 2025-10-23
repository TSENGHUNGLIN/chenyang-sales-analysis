import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, Users, FileText, Award } from "lucide-react";

const COLORS = ['#10b981', '#3b82f6', '#ef4444', '#f59e0b'];

const statusLabels: Record<string, string> = {
  in_progress: "進行中",
  success: "成交",
  failed: "失敗",
};

const stageLabels: Record<string, string> = {
  initial: "初洽",
  second: "二洽",
  third: "三洽",
  design_contract: "簽設計約",
  construction_contract: "工程約",
};

export default function Analytics() {
  const { data: stats, isLoading: statsLoading } = trpc.analytics.getStatistics.useQuery();
  const { data: performance, isLoading: performanceLoading } = trpc.analytics.getSalespersonPerformance.useQuery();
  const { data: trend, isLoading: trendLoading } = trpc.analytics.getMonthlyTrend.useQuery();

  if (statsLoading || performanceLoading || trendLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">載入中...</div>
      </div>
    );
  }

  // 案件狀態圓餅圖資料
  const caseStatusData = stats?.caseStatusStats.map(item => ({
    name: statusLabels[item.status] || item.status,
    value: Number(item.count),
  })) || [];

  // 業務績效長條圖資料
  const performanceData = performance?.map(item => ({
    name: item.salespersonName,
    成交: Number(item.successCases),
    失敗: Number(item.failedCases),
    進行中: Number(item.inProgressCases),
  })) || [];

  // 每月趨勢折線圖資料
  const trendData = trend?.map(item => ({
    month: item.month,
    總案件數: Number(item.count),
    成交數: Number(item.successCount),
  })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">統計分析</h1>
        <p className="text-muted-foreground mt-2">
          查看系統整體數據與業務績效分析
        </p>
      </div>

      {/* 統計卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總案件數</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMeetings || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              所有洽談記錄
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">成交案件</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.caseStatusStats.find(s => s.status === 'success')?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              成功簽約案件
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均評分</CardTitle>
            <Award className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats?.evaluationStats.avgScore ? Number(stats.evaluationStats.avgScore).toFixed(1) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.evaluationStats.count || 0} 筆評分記錄
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">業務人員</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performance?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              活躍業務人員
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 圖表區域 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 案件狀態圓餅圖 */}
        <Card>
          <CardHeader>
            <CardTitle>案件狀態分布</CardTitle>
            <CardDescription>各狀態案件數量占比</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={caseStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {caseStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 業務績效長條圖 */}
        <Card>
          <CardHeader>
            <CardTitle>業務績效</CardTitle>
            <CardDescription>各業務人員案件統計</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="成交" fill="#10b981" />
                <Bar dataKey="進行中" fill="#3b82f6" />
                <Bar dataKey="失敗" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 每月趨勢折線圖 */}
      <Card>
        <CardHeader>
          <CardTitle>每月案件趨勢</CardTitle>
          <CardDescription>案件數量與成交數隨時間變化</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="總案件數" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="成交數" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

