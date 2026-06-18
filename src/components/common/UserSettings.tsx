import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, User, Lock, Award, CreditCard } from 'lucide-react';
import ProfileTab from './user-settings/ProfileTab';
import PasswordTab from './user-settings/PasswordTab';
import PlanTab from './user-settings/PlanTab';
import CertificatesTab from './user-settings/CertificatesTab';

const UserSettings = () => {
  const tabs = [
    { value: 'profile', label: 'Profile', icon: User },
    { value: 'password', label: 'Password', icon: Lock },
    { value: 'certificates', label: 'Certs', icon: Award },
    { value: 'plan', label: 'Plan', icon: CreditCard },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
      <header className="flex items-center gap-3 px-1">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-100">
          <Settings className="h-[22px] w-[22px] text-slate-600" />
        </span>
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Account Settings</h1>
          <p className="text-sm text-slate-500">Manage your profile & security</p>
        </div>
      </header>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto gap-1 rounded-xl bg-slate-100 p-1">
          {tabs.map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="flex-col gap-1 rounded-lg py-2 text-[11px] font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Icon className="h-4 w-4" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <ProfileTab />
        </TabsContent>

        <TabsContent value="password" className="mt-4">
          <PasswordTab />
        </TabsContent>

        <TabsContent value="certificates" className="mt-4">
          <CertificatesTab />
        </TabsContent>

        <TabsContent value="plan" className="mt-4">
          <PlanTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserSettings;
