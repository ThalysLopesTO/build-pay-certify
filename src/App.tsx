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
import AdminDashboard from "@/pages/AdminDashboard";
import EmployeeDashboard from "@/pages/EmployeeDashboard";
import ForemanDashboard from "@/pages/ForemanDashboard";
import ManagementDashboard from "@/pages/ManagementDashboard";
import SuperAdminDashboard from "@/pages/SuperAdminDashboard";
import SuperAdminLogin from "@/pages/SuperAdminLogin";
import SuperAdminSetup from "@/pages/setup/SuperAdminSetup";
import CompanyRegistration from "@/pages/CompanyRegistration";
import CompanyHandbook from "@/pages/CompanyHandbook";
import ResetPassword from "@/pages/ResetPassword";
import LicenseExpired from "@/pages/LicenseExpired";
import InvoicePreview from "@/pages/InvoicePreview";
import MaterialTakeoffPage from "@/pages/admin/MaterialTakeoffPage";
import InventoryIndex from "@/pages/admin/inventory/Index";
import PublicQuotePage from "@/pages/PublicQuotePage";
import ClientsPage from "@/pages/admin/ClientsPage";
import NotFound from "@/pages/NotFound";
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


const AppInner: React.FC = () => {
  return (
    <RoleBasedRedirect>
      <Routes>
        <Route path="/" element={<Navigate to="/admin-login" replace />} />

        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/employee-login" element={<EmployeeLogin />} />
        <Route path="/subscription-plan" element={<SubscriptionPlanPage />} />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requireSubscription>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
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

        <Route
          path="/admin/clients"
          element={
            <ProtectedRoute requireSubscription>
              <ClientsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/material-takeoff"
          element={
            <ProtectedRoute requireSubscription>
              <MaterialTakeoffPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/inventory"
          element={
            <ProtectedRoute requireSubscription>
              <InventoryIndex />
            </ProtectedRoute>
          }
        />

        {/* Trial Embed Page */}
        <Route path="/start-trial-embed" element={<StartTrialEmbedPage />} />

        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
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
