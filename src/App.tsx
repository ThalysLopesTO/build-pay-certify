// src/App.tsx - Build refresh trigger
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";
import { AppProviders } from "@/providers/AppProviders";
import { GlobalToasts } from "@/components/common/GlobalToasts";
import IOSInstallTip from "@/components/common/IOSInstallTip";
import RoleBasedRedirect from "@/components/auth/RoleBasedRedirect";

// Pages
import HomePage from "@/pages/HomePage";
import AdminLogin from "@/pages/AdminLogin";
import EmployeeLogin from "@/pages/EmployeeLogin";
import SubscriptionPlanPage from "@/pages/SubscriptionPlanPage";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminTabRoutes, AdminDashboardWithLegacyRedirect } from "@/components/admin/adminTabRoutes";
import SuperAdminLogin from "@/pages/SuperAdminLogin";
import ResetPassword from "@/pages/ResetPassword";
import LicenseExpired from "@/pages/LicenseExpired";
import NotFound from "@/pages/NotFound";

// Heavy role dashboards and secondary pages load on demand to keep the
// initial bundle small (each becomes its own chunk).
const AttentionReportDetails = React.lazy(() => import("@/components/admin/AttentionReportDetails"));
const EmployeeDashboard = React.lazy(() => import("@/pages/EmployeeDashboard"));
const ForemanDashboard = React.lazy(() => import("@/pages/ForemanDashboard"));
const ManagementDashboard = React.lazy(() => import("@/pages/ManagementDashboard"));
const SuperAdminDashboard = React.lazy(() => import("@/pages/SuperAdminDashboard"));
const SuperAdminSetup = React.lazy(() => import("@/pages/setup/SuperAdminSetup"));
const CompanyRegistration = React.lazy(() => import("@/pages/CompanyRegistration"));
const CompanyHandbook = React.lazy(() => import("@/pages/CompanyHandbook"));
const InvoicePreview = React.lazy(() => import("@/pages/InvoicePreview"));
const PublicQuotePage = React.lazy(() => import("@/pages/PublicQuotePage"));
import ProtectedRoute from "@/components/common/ProtectedRoute";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { ClientPortalProvider } from "@/contexts/ClientPortalContext";
import { PortalLayout } from "@/components/client-portal/PortalLayout";
import PortalDashboard from "@/pages/client-portal/PortalDashboard";
import PortalQuotesPage from "@/pages/client-portal/PortalQuotesPage";
import PortalQuoteDetailPage from "@/pages/client-portal/PortalQuoteDetailPage";
import PortalInvoicesPage from "@/pages/client-portal/PortalInvoicesPage";
import PortalInvoiceDetailPage from "@/pages/client-portal/PortalInvoiceDetailPage";
import PortalContactPage from "@/pages/client-portal/PortalContactPage";
import StartTrialEmbedPage from "@/pages/StartTrialEmbedPage";


const routeLoadingFallback = (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const AppInner: React.FC = () => {
  return (
    <RoleBasedRedirect>
      <React.Suspense fallback={routeLoadingFallback}>
      <Routes>
        <Route path="/" element={<Navigate to="/admin-login" replace />} />

        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/employee-login" element={<EmployeeLogin />} />
        <Route path="/subscription-plan" element={<SubscriptionPlanPage />} />

        {/* Admin — nested routes with shared layout (sidebar + header).
            Legacy /admin/dashboard?tab=<slug> links redirect to /admin/<slug>. */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireSubscription>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardWithLegacyRedirect />} />
          {adminTabRoutes
            .filter((r) => r.slug !== "dashboard")
            .map((r) => (
              <Route key={r.slug} path={r.slug} element={r.element} />
            ))}
          <Route path="attention-reports/:reportId" element={<AttentionReportDetails />} />
        </Route>
        <Route
          path="/employee/dashboard"
          element={
            <ProtectedRoute requireSubscription>
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/foreman/dashboard"
          element={
            <ProtectedRoute requireSubscription>
              <ForemanDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/management/dashboard"
          element={
            <ProtectedRoute requireSubscription>
              <ManagementDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
        <Route path="/super-admin/login" element={<SuperAdminLogin />} />
        <Route path="/setup/super-admin" element={<SuperAdminSetup />} />

        <Route path="/company/registration" element={<CompanyRegistration />} />
        <Route path="/company/handbook" element={<CompanyHandbook />} />

        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/license-expired" element={<LicenseExpired />} />
        <Route path="/invoice-preview" element={<InvoicePreview />} />
        
        {/* Public Quote Viewing */}
        <Route path="/public/quote/:token" element={<PublicQuotePage />} />
        
        {/* Client Portal - Nested Routes */}
        <Route path="/client/:token" element={<ClientPortalProvider><PortalLayout /></ClientPortalProvider>}>
          <Route index element={<PortalDashboard />} />
          <Route path="quotes" element={<PortalQuotesPage />} />
          <Route path="quotes/:quoteId" element={<PortalQuoteDetailPage />} />
          <Route path="invoices" element={<PortalInvoicesPage />} />
          <Route path="invoices/:invoiceId" element={<PortalInvoiceDetailPage />} />
          <Route path="contact" element={<PortalContactPage />} />
        </Route>

        {/* Trial Embed Page */}
        <Route path="/start-trial-embed" element={<StartTrialEmbedPage />} />

        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
      </React.Suspense>
    </RoleBasedRedirect>
  );
};

const App: React.FC = () => {
  if (import.meta.env.DEV) console.log("🚀 App component rendering");

  return (
    <BrowserRouter>
      <AppProviders>
        <ErrorBoundary>
          <AppInner />
        </ErrorBoundary>
        <GlobalToasts />
        <Toaster />
        <SonnerToaster />
        <IOSInstallTip />
        <SpeedInsights />
        <Analytics />
      </AppProviders>
    </BrowserRouter>
  );
};

export default App;
