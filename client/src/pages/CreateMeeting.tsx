import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function CreateMeeting() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
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

  const createMutation = trpc.meetings.create.useMutation({
    onSuccess: () => {
      toast.success("洽談記錄已建立");
      setLocation("/meetings");
    },
    onError: (error) => {
      toast.error("建立失敗：" + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
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

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>基本資訊</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">客戶姓名 *</Label>
                <Input
                  id="clientName"
                  required
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
