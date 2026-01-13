import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, AlertCircle, XCircle, ExternalLink, RefreshCw, AlertTriangle } from 'lucide-react';
import { useCompanySettings, useUpdateSettingsMutation } from '@/hooks/useCompanySettings';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface StripeStatus {
  connected: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  onboarding_complete: boolean;
}

export const PaymentsTab = () => {
  const { settings, isLoading: settingsLoading } = useCompanySettings();
  const updateSettings = useUpdateSettingsMutation();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Check if user is super_admin for live payments toggle
  const isSuperAdmin = user?.role === 'super_admin';

  // Check status on mount and when returning from Stripe
  useEffect(() => {
    checkStripeStatus();
  }, []);

  // Handle return from Stripe onboarding
  useEffect(() => {
    const stripeParam = searchParams.get('stripe');
    
    if (stripeParam === 'return') {
      toast({
        title: "Stripe Setup",
        description: "Checking your account status...",
      });
      checkStripeStatus().then(() => {
        navigate('/admin/dashboard?tab=company-settings', { replace: true });
      });
    } else if (stripeParam === 'refresh') {
      checkStripeStatus().then(() => {
        navigate('/admin/dashboard?tab=company-settings', { replace: true });
      });
    }
  }, [searchParams, navigate]);

  const checkStripeStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-connect-status');
      
      if (error) throw error;
      
      setStripeStatus(data);
      
      if (data.charges_enabled && data.payouts_enabled) {
        toast({
          title: "Stripe Connected",
          description: "Your Stripe account is fully set up and ready to accept payments.",
        });
      }
    } catch (error) {
      console.error('Error checking Stripe status:', error);
      toast({
        title: "Error",
        description: "Failed to check Stripe status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleConnectStripe = async () => {
    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-connect-onboarding', {
        body: { origin: window.location.origin }
      });
      
      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No onboarding URL returned');
      }
    } catch (error) {
      console.error('Error connecting Stripe:', error);
      toast({
        title: "Error",
        description: "Failed to start Stripe setup. Please try again.",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  // Check if Stripe setup needs to be completed
  const needsSetupCompletion = stripeStatus?.connected && (
    !stripeStatus.onboarding_complete ||
    !stripeStatus.payouts_enabled ||
    !stripeStatus.charges_enabled
  );

  const handleTogglePayments = async (enabled: boolean) => {
    if (!settings?.id) return;
    
    try {
      await updateSettings.mutateAsync({
        id: settings.id,
        payments_enabled: enabled,
      });
      
      toast({
        title: enabled ? "Payments Enabled" : "Payments Disabled",
        description: enabled 
          ? "Clients can now pay invoices directly." 
          : "Invoice payments have been disabled.",
      });
    } catch (error) {
      console.error('Error toggling payments:', error);
      toast({
        title: "Error",
        description: "Failed to update payment settings.",
        variant: "destructive",
      });
    }
  };

  // Super-admin only: Toggle live invoice payments
  const handleToggleLivePayments = async (enabled: boolean) => {
    if (!settings?.id || !isSuperAdmin) return;
    
    try {
      await updateSettings.mutateAsync({
        id: settings.id,
        enable_live_invoice_payments: enabled,
      });
      
      toast({
        title: enabled ? "Live Payments Enabled" : "Live Payments Disabled",
        description: enabled 
          ? "⚠️ This company can now process REAL charges." 
          : "Live invoice payments have been disabled for this company.",
        variant: enabled ? "default" : "destructive",
      });
    } catch (error) {
      console.error('Error toggling live payments:', error);
      toast({
        title: "Error",
        description: "Failed to update live payment settings.",
        variant: "destructive",
      });
    }
  };

  const getPaymentStatus = () => {
    if (!stripeStatus?.connected) {
      return { status: 'not_connected', label: 'Not Connected', variant: 'secondary' as const };
    }
    if (!stripeStatus.charges_enabled || !stripeStatus.payouts_enabled) {
      return { status: 'action_required', label: 'Action Required', variant: 'destructive' as const };
    }
    if (settings?.payments_enabled) {
      return { status: 'enabled', label: 'Payments Enabled', variant: 'default' as const };
    }
    return { status: 'ready', label: 'Ready to Enable', variant: 'outline' as const };
  };

  const paymentStatus = getPaymentStatus();
  const canEnablePayments = stripeStatus?.charges_enabled && stripeStatus?.payouts_enabled;

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section 1: Payment Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Payment Status</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={checkStripeStatus}
              disabled={isCheckingStatus}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isCheckingStatus ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {paymentStatus.status === 'not_connected' && (
              <XCircle className="h-8 w-8 text-muted-foreground" />
            )}
            {paymentStatus.status === 'action_required' && (
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            )}
            {(paymentStatus.status === 'enabled' || paymentStatus.status === 'ready') && (
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            )}
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={paymentStatus.variant}>
                  {paymentStatus.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {paymentStatus.status === 'not_connected' && 
                  "Connect your Stripe account to start accepting payments from clients."}
                {paymentStatus.status === 'action_required' && 
                  "Your Stripe account setup is incomplete. Please finish the onboarding process."}
                {paymentStatus.status === 'ready' && 
                  "Your Stripe account is ready. Enable payments to allow clients to pay invoices."}
                {paymentStatus.status === 'enabled' && 
                  "Clients can pay invoices directly through your portal."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Stripe Connection */}
      <Card>
        <CardHeader>
          <CardTitle>Stripe Connection</CardTitle>
          <CardDescription>
            Connect your Stripe account to accept payments from clients directly on invoices.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!stripeStatus?.connected ? (
            <Button 
              onClick={handleConnectStripe} 
              disabled={isConnecting}
              className="w-full sm:w-auto"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Connect Stripe
                </>
              )}
            </Button>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Stripe account connected</span>
              </div>
              
              {!stripeStatus.charges_enabled && (
                <p className="text-sm text-orange-600">
                  Your account cannot accept charges yet. Please complete the Stripe verification process.
                </p>
              )}
              
              {!stripeStatus.payouts_enabled && (
                <p className="text-sm text-orange-600">
                  Payouts are not enabled. Please complete your Stripe account setup to receive funds.
                </p>
              )}
              
              {needsSetupCompletion && (
                <Button 
                  onClick={handleConnectStripe} 
                  disabled={isConnecting}
                  className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Finish Stripe Setup
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Section 3: Enable Payments */}
      <Card>
        <CardHeader>
          <CardTitle>Enable Payments</CardTitle>
          <CardDescription>
            Allow clients to pay invoices directly through the client portal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="payments-toggle" className="text-base">
                Enable invoice payments
              </Label>
              <p className="text-sm text-muted-foreground">
                {canEnablePayments 
                  ? "When enabled, clients can pay invoices directly."
                  : "Complete Stripe setup to enable this feature."}
              </p>
            </div>
            <Switch
              id="payments-toggle"
              checked={settings?.payments_enabled ?? false}
              onCheckedChange={handleTogglePayments}
              disabled={!canEnablePayments || updateSettings.isPending}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Live Payments (Super Admin Only) */}
      {isSuperAdmin && (
        <Card className="border-orange-500/50 bg-orange-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Live Payments (Internal Only)
            </CardTitle>
            <CardDescription>
              Super Admin: Enable REAL payment processing for this company.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="live-payments-toggle" className="text-base">
                  Enable Live Invoice Payments
                </Label>
                <p className="text-sm text-muted-foreground">
                  {settings?.enable_live_invoice_payments
                    ? "⚠️ LIVE: This company will process real charges."
                    : "Currently in TEST mode. No real charges will be made."}
                </p>
              </div>
              <Switch
                id="live-payments-toggle"
                checked={settings?.enable_live_invoice_payments ?? false}
                onCheckedChange={handleToggleLivePayments}
                disabled={!canEnablePayments || updateSettings.isPending}
              />
            </div>
            
            {settings?.enable_live_invoice_payments && (
              <div className="p-3 rounded-md bg-orange-500/20 border border-orange-500/30">
                <p className="text-sm font-medium text-orange-700">
                  ⚠️ Live payments are ENABLED for this company. All invoice payments will result in real charges.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
