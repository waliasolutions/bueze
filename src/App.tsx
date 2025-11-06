import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { initErrorTracking, generateCorrelationId } from "@/lib/errorTracking";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import HandwerkerOnboarding from "./pages/HandwerkerOnboarding";
import HandwerkerDashboard from "./pages/HandwerkerDashboard";
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
import MajorCategoryLanding from "./pages/MajorCategoryLanding";
import HandwerkerLanding from "./pages/HandwerkerLanding";
import AdminDashboard from "./pages/admin/AdminDashboard";
import HandwerkerApprovals from "./pages/admin/HandwerkerApprovals";
import HandwerkerVerification from "./pages/admin/HandwerkerVerification";
import AGB from "./pages/legal/AGB";
import PricingPage from "./pages/legal/PricingPage";
import MagicLinkHandler from "./pages/MagicLinkHandler";
import OpportunityView from "./pages/OpportunityView";
import ProposalReview from "./pages/ProposalReview";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  
  React.useEffect(() => {
    // If there's a hash, scroll to that element instead of top
    if (hash) {
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 0);
    } else {
      // No hash - scroll to top
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  }, [pathname, hash]);
  
  return null;
};

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
          <ScrollToTop />
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/handwerker-onboarding" element={<HandwerkerOnboarding />} />
            <Route path="/handwerker-dashboard" element={<HandwerkerDashboard />} />
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
          <Route path="/kategorien/:majorCategorySlug" element={<MajorCategoryLanding />} />
          <Route path="/category/:categorySlug" element={<CategoryLanding />} />
            <Route path="/handwerker" element={<HandwerkerLanding />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/approvals" element={<HandwerkerApprovals />} />
            <Route path="/admin/handwerker-verification" element={<HandwerkerVerification />} />
            <Route path="/legal/agb" element={<AGB />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/magic" element={<MagicLinkHandler />} />
            <Route path="/opportunity/:leadId" element={<OpportunityView />} />
            <Route path="/proposals/:proposalId" element={<ProposalReview />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
