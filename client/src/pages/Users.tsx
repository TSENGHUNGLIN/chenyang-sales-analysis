import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function Users() {
  const { data: users, isLoading } = trpc.users.list.useQuery();
  const utils = trpc.useUtils();

  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success("角色已更新");
      utils.users.list.invalidate();
    },
    onError: (error) => {
      toast.error("更新失敗：" + error.message);
    },
  });

  const roleLabels = {
    admin: "管理員",
    evaluator: "評分人員",
    salesperson: "業務人員",
    guest: "訪客",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">使用者管理</h1>
        <p className="text-muted-foreground mt-2">管理系統使用者與權限</p>
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
                    <CardTitle>{user.name || "未命名"}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
                  </div>
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
                        <SelectItem value="salesperson">業務人員</SelectItem>
                        <SelectItem value="guest">訪客</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">角色：</span>
                    <span className="ml-2">{roleLabels[user.role]}</span>
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
