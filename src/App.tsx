import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { initErrorTracking, generateCorrelationId } from "@/lib/errorTracking";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import SubmitLead from "./pages/SubmitLead";
import LeadDetails from "./pages/LeadDetails";
import EditLead from "./pages/EditLead";
import Dashboard from "./pages/Dashboard";
import Messages from "./pages/Messages";
import ConversationsList from "./pages/ConversationsList";
import Profile from "./pages/Profile";
import TestDashboard from "./pages/TestDashboard";
import BrowseLeads from "./pages/BrowseLeads";
import Checkout from "./pages/Checkout";
import CategoryLanding from "./pages/CategoryLanding";
import KategorienLanding from "./pages/KategorienLanding";
import HandwerkerLanding from "./pages/HandwerkerLanding";
import HandwerkerApprovals from "./pages/admin/HandwerkerApprovals";
import AGB from "./pages/legal/AGB";
import PricingPage from "./pages/legal/PricingPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  React.useEffect(() => {
    // Initialize error tracking and correlation ID
    initErrorTracking();
    generateCorrelationId();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/submit-lead" element={<SubmitLead />} />
            <Route path="/lead/:id" element={<LeadDetails />} />
            <Route path="/lead/:id/edit" element={<EditLead />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/conversations" element={<ConversationsList />} />
            <Route path="/messages/:conversationId" element={<Messages />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/test-dashboard" element={<TestDashboard />} />
            <Route path="/search" element={<BrowseLeads />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/kategorien" element={<KategorienLanding />} />
            <Route path="/category/:categorySlug" element={<CategoryLanding />} />
            <Route path="/handwerker" element={<HandwerkerLanding />} />
            <Route path="/admin/approvals" element={<HandwerkerApprovals />} />
            <Route path="/legal/agb" element={<AGB />} />
            <Route path="/legal/pricing" element={<PricingPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
