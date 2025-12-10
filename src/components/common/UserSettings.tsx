import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, User, Lock, Award, CreditCard } from 'lucide-react';
import ProfileTab from './user-settings/ProfileTab';
import PasswordTab from './user-settings/PasswordTab';
import PlanTab from './user-settings/PlanTab';
import CertificatesTab from './user-settings/CertificatesTab';

const UserSettings = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Account Settings</h1>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="password" className="flex items-center space-x-2">
            <Lock className="h-4 w-4" />
            <span>Password</span>
          </TabsTrigger>
          <TabsTrigger value="certificates" className="flex items-center space-x-2">
            <Award className="h-4 w-4" />
            <span>Certificates</span>
          </TabsTrigger>
          <TabsTrigger value="plan" className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span>Plan</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>

        <TabsContent value="password">
          <PasswordTab />
        </TabsContent>

        <TabsContent value="certificates">
          <CertificatesTab />
        </TabsContent>

        <TabsContent value="plan">
          <PlanTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserSettings;
