import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import Workflow from "./pages/Workflow";
import Configurations from "./pages/Configurations";
import ArdoqConfiguration from "./pages/ArdoqConfiguration";
import AzureDevOpsConfiguration from "./pages/AzureDevOpsConfiguration";
import SyncHistory from "./pages/SyncHistory";
import SyncHistoryDetail from "./pages/SyncHistoryDetail";
import AuditLogs from "./pages/AuditLogs";
import FieldMapping from "./pages/FieldMapping";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/workflow" replace />} />
          <Route element={<DashboardLayout />}>
            <Route path="/workflow" element={<Workflow />} />
            <Route path="/configurations" element={<Configurations />} />
            <Route path="/configurations/ardoq" element={<ArdoqConfiguration />} />
            <Route path="/configurations/azure-devops" element={<AzureDevOpsConfiguration />} />
            <Route path="/sync-history" element={<SyncHistory />} />
            <Route path="/sync-history/:id" element={<SyncHistoryDetail />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="/field-mapping" element={<FieldMapping />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
