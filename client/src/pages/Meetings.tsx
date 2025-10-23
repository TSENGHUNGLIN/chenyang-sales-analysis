import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HighlightText } from "@/components/HighlightText";
import { Plus, X } from "lucide-react";
import { Link } from "wouter";

export default function Meetings() {
  const [selectedClient, setSelectedClient] = useState<string>("__all__");
  const [selectedSalesDesigner, setSelectedSalesDesigner] = useState<string>("__all__");
  const [selectedDrawingDesigner, setSelectedDrawingDesigner] = useState<string>("__all__");
  
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

  // 提取所有唯一的建案名稱、業務設計師、繪圖設計師
  const filterOptions = useMemo(() => {
    if (!meetings) return { clients: [], salesDesigners: [], drawingDesigners: [] };
    
    const clients = Array.from(new Set(meetings.map(m => m.projectName).filter(Boolean))).sort();
    const salesDesigners = Array.from(
      new Set(meetings.map(m => m.salesDesigner).filter(Boolean))
    ).sort() as string[];
    const drawingDesigners = Array.from(
      new Set(meetings.map(m => m.drawingDesigner).filter(Boolean))
    ).sort() as string[];
    
    return { clients, salesDesigners, drawingDesigners };
  }, [meetings]);

  // 篩選洽談記錄
  const filteredMeetings = useMemo(() => {
    if (!meetings) return [];
    
    return meetings.filter((meeting) => {
      const matchClient = selectedClient === "__all__" || meeting.clientName === selectedClient;
      const matchSalesDesigner = selectedSalesDesigner === "__all__" || meeting.salesDesigner === selectedSalesDesigner;
      const matchDrawingDesigner = selectedDrawingDesigner === "__all__" || meeting.drawingDesigner === selectedDrawingDesigner;
      
      return matchClient && matchSalesDesigner && matchDrawingDesigner;
    });
  }, [meetings, selectedClient, selectedSalesDesigner, selectedDrawingDesigner]);

  // 清除所有篩選
  const clearFilters = () => {
    setSelectedClient("__all__");
    setSelectedSalesDesigner("__all__");
    setSelectedDrawingDesigner("__all__");
  };

  const hasActiveFilters = selectedClient !== "__all__" || selectedSalesDesigner !== "__all__" || selectedDrawingDesigner !== "__all__";

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

      {/* 篩選器 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">篩選條件</CardTitle>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                清除篩選
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">專案名稱（客戶）</label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder="全部建案" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">全部建案</SelectItem>
                  {filterOptions.clients.map((client) => (
                    <SelectItem key={client} value={client}>
                      {client}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">業務設計師</label>
              <Select value={selectedSalesDesigner} onValueChange={setSelectedSalesDesigner}>
                <SelectTrigger>
                  <SelectValue placeholder="全部業務設計師" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">全部業務設計師</SelectItem>
                  {filterOptions.salesDesigners.map((designer) => (
                    <SelectItem key={designer} value={designer}>
                      {designer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
               <label className="text-sm font-medium">建案名稱</label>
              <Select value={selectedDrawingDesigner} onValueChange={setSelectedDrawingDesigner}>
                <SelectTrigger>
                  <SelectValue placeholder="全部繪圖設計師" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">全部繪圖設計師</SelectItem>
                  {filterOptions.drawingDesigners.map((designer) => (
                    <SelectItem key={designer} value={designer}>
                      {designer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 篩選結果統計 */}
      {hasActiveFilters && (
        <div className="text-sm text-muted-foreground">
          找到 {filteredMeetings.length} 筆符合條件的記錄
        </div>
      )}

      {/* 洽談記錄列表 */}
      {isLoading ? (
        <div>載入中...</div>
      ) : filteredMeetings.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {hasActiveFilters ? "沒有找到符合條件的洽談記錄" : "尚無洽談記錄"}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredMeetings.map((meeting) => (
            <Link key={meeting.id} href={`/meetings/${meeting.id}`}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>
                        <HighlightText text={meeting.projectName} searchTerm={selectedClient} />
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {meeting.clientName && `客戶：${meeting.clientName} · `}
                        業務：{meeting.salespersonName}
                        {meeting.salesDesigner && (
                          <>
                            {" · 業務設計師："}
                            <HighlightText text={meeting.salesDesigner} searchTerm={selectedSalesDesigner} />
                          </>
                        )}
                        {meeting.drawingDesigner && (
                          <>
                            {" · 繪圖設計師："}
                            <HighlightText text={meeting.drawingDesigner} searchTerm={selectedDrawingDesigner} />
                          </>
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
                        {meeting.projectType}
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

