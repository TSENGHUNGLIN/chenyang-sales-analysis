import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { HighlightText } from "@/components/HighlightText";
import { Plus, Search } from "lucide-react";
import { Link } from "wouter";

export default function Meetings() {
  const [searchTerm, setSearchTerm] = useState("");
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

  // 篩選洽談記錄
  const filteredMeetings = meetings?.filter((meeting) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      meeting.clientName.toLowerCase().includes(term) ||
      meeting.transcriptText.toLowerCase().includes(term) ||
      (meeting.salesDesigner && meeting.salesDesigner.toLowerCase().includes(term)) ||
      (meeting.drawingDesigner && meeting.drawingDesigner.toLowerCase().includes(term)) ||
      (meeting.projectType && meeting.projectType.toLowerCase().includes(term)) ||
      meeting.salespersonName.toLowerCase().includes(term)
    );
  });

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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜尋客戶、設計師、案件類型或洽談內容..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div>載入中...</div>
      ) : filteredMeetings && filteredMeetings.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {searchTerm ? "沒有找到符合條件的洽談記錄" : "尚無洽談記錄"}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredMeetings?.map((meeting) => (
            <Link key={meeting.id} href={`/meetings/${meeting.id}`}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>
                        <HighlightText text={meeting.clientName} searchTerm={searchTerm} />
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        業務：<HighlightText text={meeting.salespersonName} searchTerm={searchTerm} />
                        {meeting.salesDesigner && (
                          <> · 業務設計師：<HighlightText text={meeting.salesDesigner} searchTerm={searchTerm} /></>
                        )}
                        {meeting.drawingDesigner && (
                          <> · 繪圖設計師：<HighlightText text={meeting.drawingDesigner} searchTerm={searchTerm} /></>
                        )}
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
                    {meeting.projectType && (
                      <div>
                        <span className="text-muted-foreground">案件類型：</span>
                        <HighlightText text={meeting.projectType} searchTerm={searchTerm} />
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

