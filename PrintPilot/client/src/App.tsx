import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import NewJob from "@/pages/new-job";
import OrderHistory from "@/pages/order-history";
import ReceiptView from "@/pages/receipt-view";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminPrices from "@/pages/admin-prices";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={NewJob} />
      <Route path="/orders" component={OrderHistory} />
      <Route path="/receipt/:id" component={ReceiptView} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/prices" component={AdminPrices} />
      <Route path="/admin/customers" component={require('@/pages/admin-customers').default} />
      <Route path="/admin/sales" component={require('@/pages/admin-sales').default} />
      <Route path="/admin/deposits" component={require('@/pages/admin-deposits').default} />
      <Route path="/admin/goodwill" component={require('@/pages/admin-goodwill').default} />
      <Route path="/admin/expenses" component={require('@/pages/admin-expenses').default} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <header className="flex items-center justify-between p-4 border-b bg-background">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <ThemeToggle />
              </header>
              <main className="flex-1 overflow-auto">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
