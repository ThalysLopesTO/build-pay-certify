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
import ProtectedRoute from "@/components/common/ProtectedRoute";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { ClientPortalProvider } from "@/contexts/ClientPortalContext";
import { PortalLayout } from "@/components/client-portal/PortalLayout";

// Static imports — small, needed for every session
import AdminLogin from "@/pages/AdminLogin";
import EmployeeLogin from "@/pages/EmployeeLogin";
import SuperAdminLogin from "@/pages/SuperAdminLogin";
import ResetPassword from "@/pages/ResetPassword";
import LicenseExpired from "@/pages/LicenseExpired";
import NotFound from "@/pages/NotFound";

// Layouts + route registries — load on demand
import AdminLayout from "@/components/admin/AdminLayout";
import { adminTabRoutes, AdminDashboardWithLegacyRedirect } from "@/components/admin/adminTabRoutes";
import ForemanLayout from "@/components/foreman/ForemanLayout";
import { foremanTabRoutes, ForemanDashboardWithLegacyRedirect } from "@/components/foreman/foremanTabRoutes";
import ManagementLayout from "@/components/management/ManagementLayout";
import { managementTabRoutes, ManagementDashboardWithLegacyRedirect } from "@/components/management/managementTabRoutes";
import EmployeeLayout from "@/components/employee/EmployeeLayout";
import { employeeTabRoutes, EmployeeDashboardWithLegacyRedirect } from "@/components/employee/employeeTabRoutes";

// Lazy-loaded pages
const AttentionReportDetails = React.lazy(() => import("@/components/admin/AttentionReportDetails"));
const SuperAdminDashboard = React.lazy(() => import("@/pages/SuperAdminDashboard"));
const SuperAdminSetup = React.lazy(() => import("@/pages/setup/SuperAdminSetup"));
const CompanyRegistration = React.lazy(() => import("@/pages/CompanyRegistration"));
const CompanyHandbook = React.lazy(() => import("@/pages/CompanyHandbook"));
const InvoicePreview = React.lazy(() => import("@/pages/InvoicePreview"));
const PublicQuotePage = React.lazy(() => import("@/pages/PublicQuotePage"));
const SubscriptionPlanPage = React.lazy(() => import("@/pages/SubscriptionPlanPage"));
const StartTrialEmbedPage = React.lazy(() => import("@/pages/StartTrialEmbedPage"));
const PortalDashboard = React.lazy(() => import("@/pages/client-portal/PortalDashboard"));
const PortalQuotesPage = React.lazy(() => import("@/pages/client-portal/PortalQuotesPage"));
const PortalQuoteDetailPage = React.lazy(() => import("@/pages/client-portal/PortalQuoteDetailPage"));
const PortalInvoicesPage = React.lazy(() => import("@/pages/client-portal/PortalInvoicesPage"));
const PortalInvoiceDetailPage = React.lazy(() => import("@/pages/client-portal/PortalInvoiceDetailPage"));
const PortalContactPage = React.lazy(() => import("@/pages/client-portal/PortalContactPage"));

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

          {/* ── Admin ── */}
          <Route
            path="/admin"
            element={<ProtectedRoute requireSubscription><AdminLayout /></ProtectedRoute>}
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardWithLegacyRedirect />} />
            {adminTabRoutes
              .filter((r) => r.slug !== "dashboard")
              .map((r) => <Route key={r.slug} path={r.slug} element={r.element} />)}
            <Route path="attention-reports/:reportId" element={<AttentionReportDetails />} />
          </Route>

          {/* ── Foreman ── */}
          <Route
            path="/foreman"
            element={<ProtectedRoute requireSubscription><ForemanLayout /></ProtectedRoute>}
          >
            <Route index element={<Navigate to="/foreman/dashboard" replace />} />
            <Route path="dashboard" element={<ForemanDashboardWithLegacyRedirect />} />
            {foremanTabRoutes
              .filter((r) => r.slug !== "dashboard")
              .map((r) => <Route key={r.slug} path={r.slug} element={r.element} />)}
          </Route>

          {/* ── Management ── */}
          <Route
            path="/management"
            element={<ProtectedRoute requireSubscription><ManagementLayout /></ProtectedRoute>}
          >
            <Route index element={<Navigate to="/management/dashboard" replace />} />
            <Route path="dashboard" element={<ManagementDashboardWithLegacyRedirect />} />
            {managementTabRoutes
              .filter((r) => r.slug !== "dashboard")
              .map((r) => <Route key={r.slug} path={r.slug} element={r.element} />)}
          </Route>

          {/* ── Employee ── */}
          <Route
            path="/employee"
            element={<ProtectedRoute requireSubscription><EmployeeLayout /></ProtectedRoute>}
          >
            <Route index element={<Navigate to="/employee/dashboard" replace />} />
            <Route path="dashboard" element={<EmployeeDashboardWithLegacyRedirect />} />
            {employeeTabRoutes
              .filter((r) => r.slug !== "dashboard")
              .map((r) => <Route key={r.slug} path={r.slug} element={r.element} />)}
          </Route>

          {/* ── Super Admin ── */}
          <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
          <Route path="/super-admin/login" element={<SuperAdminLogin />} />
          <Route path="/setup/super-admin" element={<SuperAdminSetup />} />

          {/* ── Public / Misc ── */}
          <Route path="/company/registration" element={<CompanyRegistration />} />
          <Route path="/company/handbook" element={<CompanyHandbook />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/license-expired" element={<LicenseExpired />} />
          <Route path="/invoice-preview" element={<InvoicePreview />} />
          <Route path="/public/quote/:token" element={<PublicQuotePage />} />
          <Route path="/start-trial-embed" element={<StartTrialEmbedPage />} />

          {/* ── Client Portal ── */}
          <Route path="/client/:token" element={<ClientPortalProvider><PortalLayout /></ClientPortalProvider>}>
            <Route index element={<PortalDashboard />} />
            <Route path="quotes" element={<PortalQuotesPage />} />
            <Route path="quotes/:quoteId" element={<PortalQuoteDetailPage />} />
            <Route path="invoices" element={<PortalInvoicesPage />} />
            <Route path="invoices/:invoiceId" element={<PortalInvoiceDetailPage />} />
            <Route path="contact" element={<PortalContactPage />} />
          </Route>

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
