import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import EmployeeAvatar from '@/components/ui/employee-avatar';
import { Building, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardHeroProps {
  theme?: 'blue' | 'green';
  firstName?: string | null;
  lastName?: string | null;
  photoUrl?: string | null;
  companyName?: string | null;
  trade?: string | null;
  onViewProfile?: () => void;
  statusText?: string;
}

const themeClasses = {
  blue: {
    card: 'bg-gradient-to-br from-white to-slate-50',
    badgeBg: 'bg-green-100',
    badgeText: 'text-green-800',
  },
  green: {
    card: 'bg-gradient-to-br from-white to-emerald-50',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
  },
};

const DashboardHero: React.FC<DashboardHeroProps> = ({
  theme = 'blue',
  firstName,
  lastName,
  photoUrl,
  companyName,
  trade,
  onViewProfile,
  statusText = 'Ready to Work',
}) => {
  const t = themeClasses[theme];
  const fullName = `${firstName || ''} ${lastName || ''}`.trim() || 'User';

  return (
    <Card className={`shadow-lg border-0 ${t.card}`}>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <div className="flex-shrink-0">
            <EmployeeAvatar 
              photoUrl={photoUrl || undefined}
              firstName={firstName || undefined}
              lastName={lastName || undefined}
              size="lg"
              className="shadow-lg"
            />
          </div>

          <div className="flex-1 space-y-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                Welcome back, {firstName || 'User'} 👋
              </h1>
              <p className="text-slate-600 text-base">
                Manage your work efficiently and stay productive
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Badge className={`${t.badgeBg} ${t.badgeText} hover:${t.badgeBg}`}>
                <span className={`w-2 h-2 rounded-full mr-2 animate-pulse ${theme === 'green' ? 'bg-emerald-500' : 'bg-green-500'}`}></span>
                {statusText}
              </Badge>
            </div>

            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <Building className="h-4 w-4" />
              <span>{companyName || 'Not Assigned'}</span>
              <span className="text-slate-400">•</span>
              <span>{trade || 'General'}</span>
            </div>

            {onViewProfile && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onViewProfile}
                className="w-fit"
              >
                <Eye className="h-4 w-4 mr-2" />
                View My Profile
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardHero;
