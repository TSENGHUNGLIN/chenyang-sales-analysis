import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EditableSelect } from "@/components/EditableSelect";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";

// 預設設計師名單
const SALES_DESIGNERS = ["楊總監", "林淑娟", "李亮華", "徐秀雲", "徐淑芬", "黃資文", "昀真", "紫郁", "桂玲"];
const DRAWING_DESIGNERS = ["奕彰", "珮瑜", "允柔", "仁杰", "玟瑾", "宜庭", "馥瑄", "姵姍", "資蘋", "學彰"];

export default function CreateMeeting() {
  const [, setLocation] = useLocation();
  const [salesDesigner, setSalesDesigner] = useState("");
  const [drawingDesigner, setDrawingDesigner] = useState("");
  const [isGeneratingName, setIsGeneratingName] = useState(false);
  const [formData, setFormData] = useState({
    projectName: "",
    clientName: "",
    clientContact: "",
    clientBudget: "",
    projectType: "",
    meetingStage: "initial" as const,
    meetingDate: new Date().toISOString().split("T")[0],
    transcriptSource: "manual" as const,
    transcriptText: "",
    notes: "",
  });

  const suggestNameMutation = trpc.meetings.suggestProjectName.useMutation({
    onSuccess: ({ projectName }) => {
      setFormData({ ...formData, projectName });
      toast.success(`AI 建議：${projectName}`);
      setIsGeneratingName(false);
    },
    onError: (error) => {
      toast.error("生成失敗：" + error.message);
      setIsGeneratingName(false);
    },
  });

  const createMutation = trpc.meetings.create.useMutation({
    onSuccess: ({ meetingId }) => {
      toast.success("洽談記錄已建立，AI 分析進行中...");
      setLocation(`/meetings/${meetingId}`);
    },
    onError: (error) => {
      toast.error("建立失敗：" + error.message);
    },
  });

  const handleAISuggest = () => {
    if (!formData.transcriptText.trim()) {
      toast.error("請先填寫洽談內容");
      return;
    }
    setIsGeneratingName(true);
    suggestNameMutation.mutate({ transcriptText: formData.transcriptText });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      salesDesigner: salesDesigner || undefined,
      drawingDesigner: drawingDesigner || undefined,
      ...formData,
      clientBudget: formData.clientBudget ? parseInt(formData.clientBudget) : undefined,
      meetingDate: new Date(formData.meetingDate),
    });
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">新增洽談記錄</h1>
        <p className="text-muted-foreground mt-2">記錄與客戶的洽談內容</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>設計師資訊</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>業務設計師</Label>
                <EditableSelect
                  value={salesDesigner}
                  onChange={setSalesDesigner}
                  options={SALES_DESIGNERS}
                  placeholder="選擇或輸入業務設計師"
                  emptyText="按 Enter 新增設計師"
                />
              </div>
              <div className="space-y-2">
                <Label>繪圖設計師</Label>
                <EditableSelect
                  value={drawingDesigner}
                  onChange={setDrawingDesigner}
                  options={DRAWING_DESIGNERS}
                  placeholder="選擇或輸入繪圖設計師"
                  emptyText="按 Enter 新增設計師"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>客戶資訊</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="projectName">建案名稱 *</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAISuggest}
                    disabled={isGeneratingName || !formData.transcriptText.trim()}
                    className="h-7 text-xs"
                  >
                    {isGeneratingName ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI 建議
                      </>
                    )}
                  </Button>
                </div>
                <Input
                  id="projectName"
                  required
                  placeholder="例：信義區豪宅、板橋新成屋"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientName">客戶姓名</Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientContact">聯絡方式</Label>
                <Input
                  id="clientContact"
                  value={formData.clientContact}
                  onChange={(e) => setFormData({ ...formData, clientContact: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientBudget">預算（元）</Label>
                <Input
                  id="clientBudget"
                  type="number"
                  value={formData.clientBudget}
                  onChange={(e) => setFormData({ ...formData, clientBudget: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectType">案件類型</Label>
                <Input
                  id="projectType"
                  placeholder="例：住宅、商業、辦公室"
                  value={formData.projectType}
                  onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="meetingStage">洽談階段 *</Label>
                <Select
                  value={formData.meetingStage}
                  onValueChange={(value: any) => setFormData({ ...formData, meetingStage: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="initial">初洽</SelectItem>
                    <SelectItem value="second">二洽</SelectItem>
                    <SelectItem value="third">三洽</SelectItem>
                    <SelectItem value="design_contract">簽設計約</SelectItem>
                    <SelectItem value="construction_contract">工程約</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="meetingDate">洽談日期 *</Label>
                <Input
                  id="meetingDate"
                  type="date"
                  required
                  value={formData.meetingDate}
                  onChange={(e) => setFormData({ ...formData, meetingDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transcriptText">洽談內容 *</Label>
              <Textarea
                id="transcriptText"
                required
                rows={10}
                placeholder="請輸入洽談內容逐字稿或摘要..."
                value={formData.transcriptText}
                onChange={(e) => setFormData({ ...formData, transcriptText: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">備註</Label>
              <Textarea
                id="notes"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "建立中..." : "建立記錄"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setLocation("/meetings")}>
                取消
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
