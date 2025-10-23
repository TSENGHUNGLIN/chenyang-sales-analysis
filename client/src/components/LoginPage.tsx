import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  const loginMutation = trpc.auth.loginWithPassword.useMutation({
    onSuccess: () => {
      toast.success("登入成功");
      // 重新載入頁面以更新認證狀態
      window.location.reload();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ username, password });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
        <div className="flex flex-col items-center gap-6">
          <div className="relative group">
            <div className="relative">
              <img
                src={APP_LOGO}
                alt={APP_TITLE}
                className="h-20 w-20 rounded-xl object-cover shadow"
              />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">{APP_TITLE}</h1>
            <p className="text-sm text-muted-foreground">
              請選擇登入方式
            </p>
          </div>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>登入</CardTitle>
            <CardDescription>使用帳號密碼或 OAuth 登入系統</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="password" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="password">帳號密碼</TabsTrigger>
                <TabsTrigger value="oauth">OAuth</TabsTrigger>
              </TabsList>
              
              <TabsContent value="password">
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">帳號</Label>
                    <Input
                      id="username"
                      placeholder="A000001"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">密碼</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="請輸入密碼"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "登入中..." : "登入"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="oauth">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center">
                    使用 Manus OAuth 登入
                  </p>
                  <Button
                    onClick={() => {
                      window.location.href = getLoginUrl();
                    }}
                    className="w-full"
                  >
                    使用 OAuth 登入
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

