import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { Link } from "wouter";

export default function Meetings() {
  const { data: meetings, isLoading } = trpc.meetings.list.useQuery();

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">洽談記錄</h1>
          <p className="text-muted-foreground mt-2">管理所有業務洽談記錄</p>
        </div>
        <Link href="/meetings/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            新增洽談記錄
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div>載入中...</div>
      ) : (
        <div className="grid gap-4">
          {meetings?.map((meeting) => (
            <Link key={meeting.id} href={`/meetings/${meeting.id}`}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{meeting.clientName}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        業務：{meeting.salespersonName}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                        {stageLabels[meeting.meetingStage]}
                      </span>
                      <p className="text-xs text-muted-foreground mt-2">
                        {statusLabels[meeting.caseStatus]}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">洽談日期：</span>
                      {new Date(meeting.meetingDate).toLocaleDateString("zh-TW")}
                    </div>
                    {meeting.clientBudget && (
                      <div>
                        <span className="text-muted-foreground">預算：</span>
                        {meeting.clientBudget.toLocaleString()} 元
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
