import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { LayoutDashboard, LogOut, PanelLeft, Users, FileText, ClipboardList, TrendingUp, XCircle, Key, PieChart } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import LoginPage from "./LoginPage";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const menuItems = [
  { icon: LayoutDashboard, label: "儀表板", path: "/dashboard", roles: ["admin", "evaluator", "salesperson"] },
  { icon: FileText, label: "洽談記錄", path: "/meetings", roles: ["admin", "evaluator", "salesperson"] },
  { icon: ClipboardList, label: "評分管理", path: "/evaluations", roles: ["admin", "evaluator"] },
  { icon: TrendingUp, label: "統計分析", path: "/statistics", roles: ["admin", "evaluator"] },
  { icon: PieChart, label: "資料分析", path: "/analytics", roles: ["admin", "evaluator"] },
  { icon: XCircle, label: "失敗案件", path: "/failed-cases", roles: ["admin", "evaluator", "salesperson"] },
  { icon: Users, label: "使用者管理", path: "/users", roles: ["admin"] },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();
  const [changePasswordDialog, setChangePasswordDialog] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "" });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent 
        setSidebarWidth={setSidebarWidth}
        changePasswordDialog={changePasswordDialog}
        setChangePasswordDialog={setChangePasswordDialog}
        passwordForm={passwordForm}
        setPasswordForm={setPasswordForm}
      >
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
  changePasswordDialog: boolean;
  setChangePasswordDialog: (open: boolean) => void;
  passwordForm: { oldPassword: string; newPassword: string };
  setPasswordForm: (form: { oldPassword: string; newPassword: string }) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
  changePasswordDialog,
  setChangePasswordDialog,
  passwordForm,
  setPasswordForm,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 pl-2 group-data-[collapsible=icon]:px-0 transition-all w-full">
              {isCollapsed ? (
                <div className="relative h-8 w-8 shrink-0 group">
                  <img
                    src={APP_LOGO}
                    className="h-8 w-8 rounded-md object-cover ring-1 ring-border"
                    alt="Logo"
                  />
                  <button
                    onClick={toggleSidebar}
                    className="absolute inset-0 flex items-center justify-center bg-accent rounded-md ring-1 ring-border opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <PanelLeft className="h-4 w-4 text-foreground" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={APP_LOGO}
                      className="h-8 w-8 rounded-md object-cover ring-1 ring-border shrink-0"
                      alt="Logo"
                    />
                    <span className="font-semibold tracking-tight truncate">
                      {APP_TITLE}
                    </span>
                  </div>
                  <button
                    onClick={toggleSidebar}
                    className="ml-auto h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                  >
                    <PanelLeft className="h-4 w-4 text-muted-foreground" />
                  </button>
                </>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            <SidebarMenu className="px-2 py-1">
              {menuItems
                .filter(item => item.roles.includes(user?.role || "guest"))
                .map(item => {
                  const isActive = location === item.path;
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => setLocation(item.path)}
                        tooltip={item.label}
                        className={`h-10 transition-all font-normal`}
                      >
                        <item.icon
                          className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
                        />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarFallback className="text-xs font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {user?.loginMethod === "password" && (
                  <DropdownMenuItem
                    onClick={() => setChangePasswordDialog(true)}
                    className="cursor-pointer"
                  >
                    <Key className="mr-2 h-4 w-4" />
                    <span>修改密碼</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>登出</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-foreground">
                    {activeMenuItem?.label ?? APP_TITLE}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        <main className="flex-1 p-4">{children}</main>
      </SidebarInset>
      
      {/* 修改密碼對話框 */}
      <ChangePasswordDialog
        open={changePasswordDialog}
        onOpenChange={setChangePasswordDialog}
        passwordForm={passwordForm}
        setPasswordForm={setPasswordForm}
      />
    </>
  );
}

function ChangePasswordDialog({
  open,
  onOpenChange,
  passwordForm,
  setPasswordForm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  passwordForm: { oldPassword: string; newPassword: string };
  setPasswordForm: (form: { oldPassword: string; newPassword: string }) => void;
}) {
  const utils = trpc.useUtils();
  
  const changePasswordMutation = trpc.users.changePassword.useMutation({
    onSuccess: () => {
      toast.success("密碼已修改");
      onOpenChange(false);
      setPasswordForm({ oldPassword: "", newPassword: "" });
    },
    onError: (error) => {
      toast.error("修改失敗：" + error.message);
    },
  });
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>修改密碼</DialogTitle>
          <DialogDescription>
            請輸入舊密碼與新密碼
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="old-password">舊密碼</Label>
            <Input
              id="old-password"
              type="password"
              value={passwordForm.oldPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-password-change">新密碼</Label>
            <Input
              id="new-password-change"
              type="password"
              placeholder="至少 6 位"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setPasswordForm({ oldPassword: "", newPassword: "" });
            }}
          >
            取消
          </Button>
          <Button
            onClick={() => {
              if (passwordForm.newPassword.length < 6) {
                toast.error("密碼至少 6 位");
                return;
              }
              changePasswordMutation.mutate(passwordForm);
            }}
            disabled={changePasswordMutation.isPending}
          >
            {changePasswordMutation.isPending ? "修改中..." : "確認修改"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
