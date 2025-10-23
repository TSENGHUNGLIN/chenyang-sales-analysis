import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UserPlus, Trash2 } from "lucide-react";

export default function Users() {
  const { data: users, isLoading } = trpc.users.list.useQuery();
  const utils = trpc.useUtils();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    role: "viewer" as "admin" | "evaluator" | "viewer" | "guest",
    department: "",
  });

  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success("角色已更新");
      utils.users.list.invalidate();
    },
    onError: (error) => {
      toast.error("更新失敗：" + error.message);
    },
  });

  const createUserMutation = trpc.users.create.useMutation({
    onSuccess: () => {
      toast.success("人員已新增");
      setIsCreateDialogOpen(false);
      setFormData({
        username: "",
        password: "",
        name: "",
        email: "",
        role: "viewer",
        department: "",
      });
      utils.users.list.invalidate();
    },
    onError: (error) => {
      toast.error("新增失敗：" + error.message);
    },
  });

  const deleteUserMutation = trpc.users.delete.useMutation({
    onSuccess: () => {
      toast.success("人員已刪除");
      utils.users.list.invalidate();
    },
    onError: (error) => {
      toast.error("刪除失敗：" + error.message);
    },
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(formData);
  };

  const roleLabels = {
    admin: "管理員",
    evaluator: "評分人員",
    viewer: "閱讀者",
    guest: "訪客",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">使用者管理</h1>
          <p className="text-muted-foreground mt-2">管理系統使用者與權限</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              新增人員
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleCreateUser}>
              <DialogHeader>
                <DialogTitle>新增人員</DialogTitle>
                <DialogDescription>
                  建立新的系統帳號（帳號格式：A000001）
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">帳號 *</Label>
                  <Input
                    id="username"
                    placeholder="A000001"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">格式：A + 6位數字（如 A000001）</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">密碼 *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="至少 6 位"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">姓名 *</Label>
                  <Input
                    id="name"
                    placeholder="請輸入姓名"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email（選填）</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">角色 *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: any) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">管理員</SelectItem>
                      <SelectItem value="evaluator">評分人員</SelectItem>
                      <SelectItem value="viewer">閱讀者</SelectItem>
                      <SelectItem value="guest">訪客</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="department">部門（選填）</Label>
                  <Input
                    id="department"
                    placeholder="請輸入部門"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending ? "建立中..." : "建立帳號"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div>載入中...</div>
      ) : (
        <div className="grid gap-4">
          {users?.map((user) => (
            <Card key={user.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {user.name || "未命名"}
                      {user.username && (
                        <span className="text-sm font-mono text-muted-foreground">({user.username})</span>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{user.email || "無 Email"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-48">
                      <Select
                        value={user.role}
                        onValueChange={(value: any) => {
                          updateRoleMutation.mutate({
                            userId: user.id,
                            role: value,
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">管理員</SelectItem>
                          <SelectItem value="evaluator">評分人員</SelectItem>
                          <SelectItem value="viewer">閱讀者</SelectItem>
                          <SelectItem value="guest">訪客</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {user.loginMethod === "password" && (
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => {
                          if (confirm(`確定要刪除帳號「${user.username}」嗎？此操作無法復原。`)) {
                            deleteUserMutation.mutate({ userId: user.id });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">角色：</span>
                    <span className="ml-2">{roleLabels[user.role]}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">登入方式：</span>
                    <span className="ml-2">{user.loginMethod === "password" ? "帳號密碼" : "OAuth"}</span>
                  </div>
                  {user.department && (
                    <div>
                      <span className="text-muted-foreground">部門：</span>
                      <span className="ml-2">{user.department}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">註冊時間：</span>
                    <span className="ml-2">{new Date(user.createdAt).toLocaleDateString("zh-TW")}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">最後登入：</span>
                    <span className="ml-2">{new Date(user.lastSignedIn).toLocaleDateString("zh-TW")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

