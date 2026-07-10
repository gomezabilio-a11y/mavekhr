import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import MyInformation from "./pages/MyInformation";
import MyOrganization from "./pages/MyOrganization";
import MyAccount from "./pages/MyAccount";
import FinancialHistory from "./pages/FinancialHistory";
import PerformanceResults from "./pages/PerformanceResults";
import PeriodicEvaluation from "./pages/PeriodicEvaluation";

// Admin pages
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminEmployees from "./pages/admin/AdminEmployees";
import AdminOrgUnits from "./pages/admin/AdminOrgUnits";
import AdminSalary from "./pages/admin/AdminSalary";
import AdminPerformance from "./pages/admin/AdminPerformance";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import AdminEvalForms from "./pages/admin/AdminEvalForms";
import AdminEvalCycles from "./pages/admin/AdminEvalCycles";
import AdminLeave from "./pages/admin/AdminLeave";
import LeaveManagement from "./pages/LeaveManagement";
import Login from "./pages/Login";

function AdminRouter() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/employees" component={AdminEmployees} />
        <Route path="/admin/org-units" component={AdminOrgUnits} />
        <Route path="/admin/salary" component={AdminSalary} />
        <Route path="/admin/performance" component={AdminPerformance} />
        <Route path="/admin/announcements" component={AdminAnnouncements} />
        <Route path="/admin/eval-forms" component={AdminEvalForms} />
        <Route path="/admin/eval-cycles" component={AdminEvalCycles} />
        <Route path="/admin/leave" component={AdminLeave} />
        <Route component={NotFound} />
      </Switch>
    </AdminLayout>
  );
}

function EmployeeRouter() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/my-information" component={MyInformation} />
        <Route path="/my-organization" component={MyOrganization} />
        <Route path="/my-account" component={MyAccount} />
        <Route path="/financial-history" component={FinancialHistory} />
        <Route path="/performance-results" component={PerformanceResults} />
        <Route path="/periodic-evaluation" component={PeriodicEvaluation} />
        <Route path="/leave-management" component={LeaveManagement} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/admin/:rest*" component={AdminRouter} />
      <Route path="/admin" component={AdminRouter} />
      <Route component={EmployeeRouter} />
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
