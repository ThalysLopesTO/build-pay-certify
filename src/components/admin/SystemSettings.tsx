import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompanySettingsTab } from './system-settings/CompanySettingsTab';
import { CompanyRulesTab } from './system-settings/CompanyRulesTab';
import { UserRolesTab } from './system-settings/UserRolesTab';
import { FinancialDefaultsTab } from './system-settings/FinancialDefaultsTab';
import { AdvancedControlsTab } from './system-settings/AdvancedControlsTab';
import { AnalyticsControlTab } from './system-settings/AnalyticsControlTab';
import { ReminderLogsTab } from './system-settings/ReminderLogsTab';
import { PaymentsTab } from './system-settings/PaymentsTab';
import MaterialCatalogManagement from './material-catalog/MaterialCatalogManagement';
import { Building2, Users, DollarSign, Settings, BarChart3, Bell, Package, CreditCard } from 'lucide-react';
const SystemSettings = () => {
  const [activeTab, setActiveTab] = useState('company');
  return <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <Settings className="h-8 w-8 text-orange-600" />
        <div>
          <h1 className="text-3xl font-bold text-slate-900">System Settings</h1>
          <p className="text-slate-600">Comprehensive control center for your construction management system</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="company" className="flex items-center space-x-2">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Company</span>
              </TabsTrigger>
              
              <TabsTrigger value="roles" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Roles</span>
              </TabsTrigger>
              <TabsTrigger value="materials" className="flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Materials</span>
              </TabsTrigger>
              <TabsTrigger value="financial" className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline">Financial</span>
              </TabsTrigger>
              
              <TabsTrigger value="payments" className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Payments</span>
              </TabsTrigger>
              
              <TabsTrigger value="analytics" className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
              
              <TabsTrigger value="reminders" className="flex items-center space-x-2">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Reminders</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="company" className="mt-6">
              <CompanySettingsTab />
            </TabsContent>

            <TabsContent value="rules" className="mt-6">
              <CompanyRulesTab />
            </TabsContent>

            <TabsContent value="roles" className="mt-6">
              <UserRolesTab />
            </TabsContent>

            <TabsContent value="materials" className="mt-6">
              <MaterialCatalogManagement />
            </TabsContent>

            <TabsContent value="financial" className="mt-6">
              <FinancialDefaultsTab />
            </TabsContent>

            <TabsContent value="payments" className="mt-6">
              <PaymentsTab />
            </TabsContent>

            <TabsContent value="advanced" className="mt-6">
              <AdvancedControlsTab />
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <AnalyticsControlTab />
            </TabsContent>

            <TabsContent value="reminders" className="mt-6">
              <ReminderLogsTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>;
};
export default SystemSettings;