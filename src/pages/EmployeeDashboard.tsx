
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import TimesheetForm from '../components/employee/TimesheetForm';
import AttentionReportForm from '../components/employee/AttentionReportForm';
import MyAttentionReports from '../components/employee/MyAttentionReports';
import CertificateStatus from '../components/employee/CertificateStatus';
import CompanyRules from '../components/common/CompanyRules';
import UserSettings from '../components/common/UserSettings';
import LicenseWarningBanner from '../components/common/LicenseWarningBanner';
import EmployeeDashboardHome from '../components/employee/EmployeeDashboardHome';
import TimeTracker from '../components/employee/TimeTracker';
import EmployeeBottomNav from '../components/employee/EmployeeBottomNav';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePlanDetails } from '@/hooks/usePlanDetails';
import { useToast } from '@/hooks/use-toast';

const EmployeeDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isProcessingStripeRedirect, setIsProcessingStripeRedirect] = useState(false);
  const isMobile = useIsMobile();
  const { refetch: refetchPlanDetails } = usePlanDetails();
  const { toast } = useToast();

  // Handle Stripe redirect on component mount
  useEffect(() => {
    const handleStripeRedirect = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      
      if (sessionId) {
        console.log('🎉 Stripe checkout session detected:', sessionId);
        setIsProcessingStripeRedirect(true);
        
        try {
          // Clean the URL by removing the session_id parameter
          const url = new URL(window.location.href);
          url.searchParams.delete('session_id');
          window.history.replaceState({}, document.title, url.pathname + url.search);
          
          // Wait a moment for any background processes
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Refetch subscription/plan data
          await refetchPlanDetails();
          
          // Show success message
          toast({
            title: "Payment Successful!",
            description: "Your subscription has been activated. Welcome to your new plan!",
            variant: "default",
          });
          
        } catch (error) {
          console.error('Error processing Stripe redirect:', error);
          toast({
            title: "Payment Processed",
            description: "Your payment was successful. If you don't see plan updates, please refresh the page.",
            variant: "default",
          });
        } finally {
          setIsProcessingStripeRedirect(false);
        }
      }
    };

    handleStripeRedirect();
  }, [refetchPlanDetails, toast]);

  const handleNavigateToTab = (tab: string) => {
    setActiveTab(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <EmployeeDashboardHome onNavigateToTab={handleNavigateToTab} />;
      case 'time-tracker':
        return <TimeTracker />;
      case 'timesheet':
        return <TimesheetForm />;
      case 'attention-report':
        return <AttentionReportForm />;
      case 'my-reports':
        return <MyAttentionReports />;
      case 'certificates':
        return <CertificateStatus />;
      case 'company-rules':
        return <CompanyRules />;
      case 'settings':
        return <UserSettings />;
      default:
        return <EmployeeDashboardHome onNavigateToTab={handleNavigateToTab} />;
    }
  };

  // Show loading spinner while processing Stripe redirect
  if (isProcessingStripeRedirect) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <h2 className="text-xl font-semibold text-slate-800">Processing your subscription...</h2>
          <p className="text-slate-600">Please wait while we activate your new plan.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      <Header />
      <div className={`flex-1 ${isMobile ? 'pb-20' : 'pb-6'} transition-all duration-300`}>
        <div className="max-w-4xl mx-auto px-2 py-4">
          <LicenseWarningBanner />
          <div className="space-y-6">
            {renderContent()}
          </div>
        </div>
      </div>
      {isMobile && (
        <EmployeeBottomNav 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />
      )}
    </div>
  );
};

export default EmployeeDashboard;
