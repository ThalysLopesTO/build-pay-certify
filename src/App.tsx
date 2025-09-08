// src/App.tsx - Build refresh trigger
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { AppProviders } from "@/providers/AppProviders";
import { EmployeeProvider } from "@/contexts/EmployeeContext";
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
import CompanyRegistration from "@/pages/CompanyRegistration";
import CompanyHandbook from "@/pages/CompanyHandbook";
import ResetPassword from "@/pages/ResetPassword";
import LicenseExpired from "@/pages/LicenseExpired";
import InvoicePreview from "@/pages/InvoicePreview";
import MaterialTakeoffPage from "@/pages/admin/MaterialTakeoffPage";
import InventoryIndex from "@/pages/admin/inventory/Index";
import NotFound from "@/pages/NotFound";
import ProtectedRoute from "@/components/common/ProtectedRoute";

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

        <Route path="/company/registration" element={<CompanyRegistration />} />
        <Route path="/company/handbook" element={<CompanyHandbook />} />

        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/license-expired" element={<LicenseExpired />} />
        <Route path="/invoice-preview" element={<InvoicePreview />} />

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
        <EmployeeProvider>
          <AppInner />
          <GlobalToasts />
          <Toaster />
          <SonnerToaster />
          <IOSInstallTip />
          <SpeedInsights />
        </EmployeeProvider>
      </AppProviders>
    </BrowserRouter>
  );
};

export default App;
