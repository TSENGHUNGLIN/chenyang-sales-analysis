import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Meetings from "./pages/Meetings";
import MeetingDetail from "./pages/MeetingDetail";
import CreateMeeting from "./pages/CreateMeeting";
import Evaluations from "./pages/Evaluations";
import CreateEvaluation from "./pages/CreateEvaluation";
import Statistics from "./pages/Statistics";
import FailedCases from "./pages/FailedCases";
import Users from "./pages/Users";

function Router() {
  return (
    <Switch>
      <Route path="/dashboard">
        <DashboardLayout>
          <Dashboard />
        </DashboardLayout>
      </Route>
      
      <Route path="/meetings">
        <DashboardLayout>
          <Meetings />
        </DashboardLayout>
      </Route>
      
      <Route path="/meetings/new">
        <DashboardLayout>
          <CreateMeeting />
        </DashboardLayout>
      </Route>
      
      <Route path="/meetings/:id">
        {(params) => (
          <DashboardLayout>
            <MeetingDetail id={parseInt(params.id)} />
          </DashboardLayout>
        )}
      </Route>
      
      <Route path="/evaluations">
        <DashboardLayout>
          <Evaluations />
        </DashboardLayout>
      </Route>
      
      <Route path="/evaluations/new/:meetingId">
        {(params) => (
          <DashboardLayout>
            <CreateEvaluation meetingId={parseInt(params.meetingId)} />
          </DashboardLayout>
        )}
      </Route>
      
      <Route path="/statistics">
        <DashboardLayout>
          <Statistics />
        </DashboardLayout>
      </Route>
      
      <Route path="/failed-cases">
        <DashboardLayout>
          <FailedCases />
        </DashboardLayout>
      </Route>
      
      <Route path="/users">
        <DashboardLayout>
          <Users />
        </DashboardLayout>
      </Route>
      
      <Route path="/">
        <DashboardLayout>
          <Dashboard />
        </DashboardLayout>
      </Route>
      
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

