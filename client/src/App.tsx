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

function Router() {
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
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
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
