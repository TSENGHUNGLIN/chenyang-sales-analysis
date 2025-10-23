import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UserPlus, Trash2, Key, RefreshCw } from "lucide-react";

export default function Users() {
  const { data: users, isLoading } = trpc.users.list.useQuery();
  const utils = trpc.useUtils();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "test",
    name: "",
    email: "",
    role: "viewer" as "admin" | "evaluator" | "viewer" | "guest",
    department: "",
  });
  
  const [resetPasswordDialog, setResetPasswordDialog] = useState<{ open: boolean; userId: number | null; username: string }>({ open: false, userId: null, username: "" });
  const [newPassword, setNewPassword] = useState("");
  
  const [convertDialog, setConvertDialog] = useState<{ open: boolean; userId: number | null; name: string }>({ open: false, userId: null, name: "" });
  const [convertForm, setConvertForm] = useState({ username: "", password: "" });

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
        password: "test",
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
  
  const resetPasswordMutation = trpc.users.resetPassword.useMutation({
    onSuccess: () => {
      toast.success("密碼已重設");
      setResetPasswordDialog({ open: false, userId: null, username: "" });
      setNewPassword("");
    },
    onError: (error) => {
      toast.error("重設失敗：" + error.message);
    },
  });
  
  const convertMutation = trpc.users.convertToPasswordLogin.useMutation({
    onSuccess: () => {
      toast.success("已轉換為帳號密碼登入");
      setConvertDialog({ open: false, userId: null, name: "" });
      setConvertForm({ username: "", password: "" });
      utils.users.list.invalidate();
    },
    onError: (error) => {
      toast.error("轉換失敗：" + error.message);
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
                    placeholder="預設：test"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">預設密碼為 "test"，使用者登入後可自行修改</p>
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
                    {user.loginMethod === "password" ? (
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setResetPasswordDialog({ open: true, userId: user.id, username: user.username || "" });
                          }}
                        >
                          <Key className="h-4 w-4" />
                        </Button>
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
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setConvertDialog({ open: true, userId: user.id, name: user.name });
                          setConvertForm({ username: "", password: "" });
                        }}
                        title="轉換為帳號密碼登入"
                      >
                        <RefreshCw className="h-4 w-4" />
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
      
      {/* 重設密碼對話框 */}
      <Dialog open={resetPasswordDialog.open} onOpenChange={(open) => {
        if (!open) {
          setResetPasswordDialog({ open: false, userId: null, username: "" });
          setNewPassword("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重設密碼</DialogTitle>
            <DialogDescription>
              為帳號「{resetPasswordDialog.username}」設定新密碼
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-password">新密碼</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="至少 6 位"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResetPasswordDialog({ open: false, userId: null, username: "" });
                setNewPassword("");
              }}
            >
              取消
            </Button>
            <Button
              onClick={() => {
                if (resetPasswordDialog.userId && newPassword.length >= 6) {
                  resetPasswordMutation.mutate({
                    userId: resetPasswordDialog.userId,
                    newPassword,
                  });
                } else {
                  toast.error("密碼至少 6 位");
                }
              }}
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? "重設中..." : "確認重設"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 轉換為密碼登入對話框 */}
      <Dialog open={convertDialog.open} onOpenChange={(open) => {
        if (!open) {
          setConvertDialog({ open: false, userId: null, name: "" });
          setConvertForm({ username: "", password: "" });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>轉換為帳號密碼登入</DialogTitle>
            <DialogDescription>
              將「{convertDialog.name}」轉換為帳號密碼登入方式
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (convertDialog.userId && convertForm.username && convertForm.password.length >= 6) {
              convertMutation.mutate({
                userId: convertDialog.userId,
                username: convertForm.username,
                password: convertForm.password,
              });
            } else {
              toast.error("請填寫完整資料，密碼至少 6 位");
            }
          }}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="convert-username">帳號 *</Label>
                <Input
                  id="convert-username"
                  placeholder="A000001"
                  value={convertForm.username}
                  onChange={(e) => setConvertForm({ ...convertForm, username: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">格式：A + 6位數字（如 A000001）</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="convert-password">密碼 *</Label>
                <Input
                  id="convert-password"
                  type="password"
                  placeholder="至少 6 位"
                  value={convertForm.password}
                  onChange={(e) => setConvertForm({ ...convertForm, password: e.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setConvertDialog({ open: false, userId: null, name: "" });
                  setConvertForm({ username: "", password: "" });
                }}
              >
                取消
              </Button>
              <Button type="submit" disabled={convertMutation.isPending}>
                {convertMutation.isPending ? "轉換中..." : "確認轉換"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

