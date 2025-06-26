
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, User, Lock, X, CreditCard } from 'lucide-react';
import ProfileTab from './user-settings/ProfileTab';
import PasswordTab from './user-settings/PasswordTab';
import PlanTab from './user-settings/PlanTab';
import BillingTab from './user-settings/BillingTab';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const UserSettings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const { user, isCompanyAdmin } = useAuth();

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'password', label: 'Password', icon: Lock },
    ...(isCompanyAdmin ? [{ id: 'billing', label: 'Billing & Plan', icon: CreditCard }] : []),
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileTab />;
      case 'password':
        return <PasswordTab />;
      case 'billing':
        return isCompanyAdmin ? <BillingTab /> : null;
      default:
        return <ProfileTab />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-slate-600">Manage your account settings and preferences</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="py-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default UserSettings;
