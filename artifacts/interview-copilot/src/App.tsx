import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import { Home } from "@/pages/home";
import { NewSession } from "@/pages/new-session";
import { ActiveSession } from "@/pages/active-session";
import { ReviewSession } from "@/pages/review-session";
import { Dashboard } from "@/pages/dashboard";
import { Playbook } from "@/pages/playbook";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/session/new" component={NewSession} />
        <Route path="/session/:id" component={ActiveSession} />
        <Route path="/session/:id/review" component={ReviewSession} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/playbook" component={Playbook} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
