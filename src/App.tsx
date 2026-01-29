import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { initErrorTracking, generateCorrelationId } from "@/lib/errorTracking";
import { GlobalScriptManager } from "@/components/GlobalScriptManager";
import { CookieBanner } from "@/components/CookieBanner";
import RouteErrorBoundary from "@/components/RouteErrorBoundary";
import PageLoader from "@/components/PageLoader";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import { AdminSuspenseFallback } from "@/components/admin/AdminPageSkeleton";

// Critical routes - loaded immediately
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy-loaded routes - split by user journey
const HandwerkerOnboarding = lazy(() => import("./pages/HandwerkerOnboarding"));
const HandwerkerDashboard = lazy(() => import("./pages/HandwerkerDashboard"));
const HandwerkerProfileEdit = lazy(() => import("./pages/HandwerkerProfileEdit"));
const SubmitLead = lazy(() => import("./pages/SubmitLead"));
const LeadDetails = lazy(() => import("./pages/LeadDetails"));
const EditLead = lazy(() => import("./pages/EditLead"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Messages = lazy(() => import("./pages/Messages"));
const ConversationsList = lazy(() => import("./pages/ConversationsList"));
const Profile = lazy(() => import("./pages/Profile"));
const TestDashboard = lazy(() => import("./pages/TestDashboard"));
const BrowseLeads = lazy(() => import("./pages/BrowseLeads"));
const Checkout = lazy(() => import("./pages/Checkout"));
const CategoryLanding = lazy(() => import("./pages/CategoryLanding"));
const KategorienLanding = lazy(() => import("./pages/KategorienLanding"));
const MajorCategoryLanding = lazy(() => import("./pages/MajorCategoryLanding"));
const HandwerkerLanding = lazy(() => import("./pages/HandwerkerLanding"));
const MagicLinkHandler = lazy(() => import("./pages/MagicLinkHandler"));
const OpportunityView = lazy(() => import("./pages/OpportunityView"));
const ProposalReview = lazy(() => import("./pages/ProposalReview"));
const ProposalsManagement = lazy(() => import("./pages/ProposalsManagement"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Sitemap = lazy(() => import("./pages/Sitemap"));

const LeadSubmissionSuccess = lazy(() => import("./pages/LeadSubmissionSuccess"));
const HandwerkerRegistrationSuccess = lazy(() => import("./pages/HandwerkerRegistrationSuccess"));

// Admin routes - rarely accessed, loaded separately
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const HandwerkerManagement = lazy(() => import("./pages/admin/HandwerkerManagement"));
const ClientManagement = lazy(() => import("./pages/admin/ClientManagement"));
const HandwerkerApprovals = lazy(() => import("./pages/admin/HandwerkerApprovals"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const AdminLeadsManagement = lazy(() => import("./pages/admin/AdminLeadsManagement"));
const ContentManagement = lazy(() => import("./pages/admin/ContentManagement"));
const ContentEditor = lazy(() => import("./pages/admin/ContentEditor"));
const SEOTools = lazy(() => import("./pages/admin/SEOTools"));
const BulkMetaManager = lazy(() => import("./pages/admin/BulkMetaManager"));
const GTMConfiguration = lazy(() => import("./pages/admin/GTMConfiguration"));
const ReviewsManagement = lazy(() => import("./pages/admin/ReviewsManagement"));
const AdminPayments = lazy(() => import("./pages/admin/AdminPayments"));
const DeletionAudit = lazy(() => import("./pages/admin/DeletionAudit"));

// Legal pages - low priority
const AGB = lazy(() => import("./pages/legal/AGB"));
const PricingPage = lazy(() => import("./pages/legal/PricingPage"));
const Impressum = lazy(() => import("./pages/legal/Impressum"));
const Datenschutz = lazy(() => import("./pages/legal/Datenschutz"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data considered fresh for 2 minutes
      staleTime: 2 * 60 * 1000,
      // Cache data kept for 5 minutes after becoming unused
      gcTime: 5 * 60 * 1000,
      // Retry failed requests up to 2 times
      retry: 2,
      // Don't refetch on window focus for better UX
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});

// CRITICAL: Set scroll restoration to manual IMMEDIATELY (before React renders)
// This must happen at module load time, not in useEffect
if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  
  React.useLayoutEffect(() => {
    // Force scroll to top using multiple methods for cross-browser support
    // This covers both window scrolling and body scrolling scenarios
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  React.useEffect(() => {
    // Handle hash navigation separately (smooth scroll to anchors)
    if (hash) {
      const scrollTimer = setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 200);
      return () => clearTimeout(scrollTimer);
    }
  }, [hash]);
  
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
        <GlobalScriptManager />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <ScrollToTop />
          <Toaster />
          <Sonner />
          <CookieBanner />
          <RouteErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Critical routes - no lazy loading */}
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                
                {/* Auth & User routes */}
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/profile" element={<Profile />} />
                
                {/* Handwerker routes */}
                <Route path="/handwerker-onboarding" element={<HandwerkerOnboarding />} />
                <Route path="/handwerker/onboarding" element={<Navigate to="/handwerker-onboarding" replace />} />
                <Route path="/handwerker-dashboard" element={<HandwerkerDashboard />} />
                <Route path="/handwerker-profile/edit" element={<HandwerkerProfileEdit />} />
                <Route path="/handwerker" element={<HandwerkerLanding />} />
                
                
                {/* Lead management routes */}
                <Route path="/submit-lead" element={<SubmitLead />} />
                <Route path="/lead/:id" element={<LeadDetails />} />
                <Route path="/lead/:id/edit" element={<EditLead />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/search" element={<BrowseLeads />} />
                
                {/* Messaging routes */}
                <Route path="/conversations" element={<ConversationsList />} />
                <Route path="/messages/:conversationId" element={<Messages />} />
                
                {/* Proposal routes */}
                <Route path="/opportunity/:leadId" element={<OpportunityView />} />
                <Route path="/proposals/:proposalId" element={<ProposalReview />} />
                <Route path="/proposals" element={<ProposalsManagement />} />
                
                {/* Category routes */}
                <Route path="/kategorien" element={<KategorienLanding />} />
                <Route path="/kategorien/:majorCategorySlug" element={<MajorCategoryLanding />} />
                <Route path="/category/:categorySlug" element={<CategoryLanding />} />
                
                {/* Utility routes */}
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/test-dashboard" element={<TestDashboard />} />
                <Route path="/magic" element={<MagicLinkHandler />} />
                <Route path="/sitemap.xml" element={<Sitemap />} />
                
                {/* Thank you pages (noindex for conversion tracking) */}
                <Route path="/auftrag-erfolgreich" element={<LeadSubmissionSuccess />} />
                <Route path="/handwerker-registrierung-erfolgreich" element={<HandwerkerRegistrationSuccess />} />
                
                {/* Admin routes - wrapped with AdminAuthProvider for single auth check */}
                <Route path="/admin/*" element={
                  <AdminAuthProvider>
                    <Suspense fallback={<AdminSuspenseFallback />}>
                      <Routes>
                        <Route index element={<AdminDashboard />} />
                        <Route path="dashboard" element={<AdminDashboard />} />
                        <Route path="handwerkers" element={<HandwerkerManagement />} />
                        <Route path="clients" element={<ClientManagement />} />
                        <Route path="leads" element={<AdminLeadsManagement />} />
                        <Route path="approvals" element={<HandwerkerApprovals />} />
                        <Route path="users" element={<UserManagement />} />
                        <Route path="content" element={<ContentManagement />} />
                        <Route path="content/edit/:pageKey" element={<ContentEditor />} />
                        <Route path="seo" element={<SEOTools />} />
                        <Route path="seo/bulk-meta" element={<BulkMetaManager />} />
                        <Route path="gtm" element={<GTMConfiguration />} />
                        <Route path="reviews" element={<ReviewsManagement />} />
                        <Route path="payments" element={<AdminPayments />} />
                        <Route path="deletion-audit" element={<DeletionAudit />} />
                      </Routes>
                    </Suspense>
                  </AdminAuthProvider>
                } />
                
                {/* Legal routes */}
                <Route path="/legal/agb" element={<AGB />} />
                <Route path="/impressum" element={<Impressum />} />
                <Route path="/datenschutz" element={<Datenschutz />} />
                <Route path="/pricing" element={<PricingPage />} />
                
                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </RouteErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
