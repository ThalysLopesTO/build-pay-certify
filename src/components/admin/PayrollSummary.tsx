
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Users, Search, Filter } from 'lucide-react';

interface TimesheetEntry {
  id: string;
  employeeName: string;
  trade: string;
  position: string;
  jobSite: string;
  project: string;
  totalHours: number;
  hourlyRate: number;
  grossPay: number;
  weekEnding: string;
}

const PayrollSummary = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');
  const [selectedJobSite, setSelectedJobSite] = useState('');
  const [selectedTrade, setSelectedTrade] = useState('');

  // Mock payroll data
  const timesheetEntries: TimesheetEntry[] = [
    {
      id: '1',
      employeeName: 'Mike Johnson',
      trade: 'Electrical',
      position: 'Electrician',
      jobSite: 'Downtown Office Complex',
      project: 'Electrical Installation',
      totalHours: 42.5,
      hourlyRate: 28,
      grossPay: 1190,
      weekEnding: '2024-06-07'
    },
    {
      id: '2',
      employeeName: 'Sarah Williams',
      trade: 'Carpentry',
      position: 'Lead Carpenter',
      jobSite: 'Riverside Condos',
      project: 'Foundation & Structure',
      totalHours: 40,
      hourlyRate: 32,
      grossPay: 1280,
      weekEnding: '2024-06-07'
    },
    {
      id: '3',
      employeeName: 'Robert Chen',
      trade: 'Plumbing',
      position: 'Plumber',
      jobSite: 'Industrial Park Phase 2',
      project: 'Plumbing & HVAC',
      totalHours: 38,
      hourlyRate: 30,
      grossPay: 1140,
      weekEnding: '2024-06-07'
    },
    {
      id: '4',
      employeeName: 'David Rodriguez',
      trade: 'General',
      position: 'Laborer',
      jobSite: 'Highway Bridge Project',
      project: 'Foundation & Structure',
      totalHours: 45,
      hourlyRate: 24,
      grossPay: 1080,
      weekEnding: '2024-06-07'
    }
  ];

  const filteredEntries = timesheetEntries.filter(entry => {
    return (
      (searchTerm === '' || entry.employeeName.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedWeek === '' || entry.weekEnding === selectedWeek) &&
      (selectedJobSite === '' || entry.jobSite === selectedJobSite) &&
      (selectedTrade === '' || entry.trade === selectedTrade)
    );
  });

  const totalPayroll = filteredEntries.reduce((sum, entry) => sum + entry.grossPay, 0);
  const totalHours = filteredEntries.reduce((sum, entry) => sum + entry.totalHours, 0);
  const totalEmployees = filteredEntries.length;

  const weeks = ['2024-06-07', '2024-05-31', '2024-05-24', '2024-05-17'];
  const jobSites = ['Downtown Office Complex', 'Riverside Condos', 'Industrial Park Phase 2', 'Highway Bridge Project'];
  const trades = ['Electrical', 'Carpentry', 'Plumbing', 'General'];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Payroll</p>
                <p className="text-2xl font-bold text-green-600">${totalPayroll.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Active Employees</p>
                <p className="text-2xl font-bold text-blue-600">{totalEmployees}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <DollarSign className="h-8 w-8 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Hours</p>
                <p className="text-2xl font-bold text-orange-600">{totalHours.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Employee</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Employee name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Week Ending</label>
              <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                <SelectTrigger>
                  <SelectValue placeholder="All weeks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All weeks</SelectItem>
                  {weeks.map((week) => (
                    <SelectItem key={week} value={week}>
                      {new Date(week).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Job Site</label>
              <Select value={selectedJobSite} onValueChange={setSelectedJobSite}>
                <SelectTrigger>
                  <SelectValue placeholder="All sites" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All sites</SelectItem>
                  {jobSites.map((site) => (
                    <SelectItem key={site} value={site}>{site}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Trade</label>
              <Select value={selectedTrade} onValueChange={setSelectedTrade}>
                <SelectTrigger>
                  <SelectValue placeholder="All trades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All trades</SelectItem>
                  {trades.map((trade) => (
                    <SelectItem key={trade} value={trade}>{trade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payroll Table */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Payroll Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left p-3 font-semibold">Employee</th>
                  <th className="text-left p-3 font-semibold">Trade/Position</th>
                  <th className="text-left p-3 font-semibold">Job Site</th>
                  <th className="text-left p-3 font-semibold">Project</th>
                  <th className="text-right p-3 font-semibold">Hours</th>
                  <th className="text-right p-3 font-semibold">Rate</th>
                  <th className="text-right p-3 font-semibold">Gross Pay</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="border-b hover:bg-slate-50">
                    <td className="p-3 font-medium">{entry.employeeName}</td>
                    <td className="p-3">
                      <div>
                        <Badge variant="outline" className="mb-1">{entry.trade}</Badge>
                        <p className="text-sm text-slate-600">{entry.position}</p>
                      </div>
                    </td>
                    <td className="p-3 text-sm">{entry.jobSite}</td>
                    <td className="p-3 text-sm">{entry.project}</td>
                    <td className="p-3 text-right font-mono">{entry.totalHours}</td>
                    <td className="p-3 text-right font-mono">${entry.hourlyRate}</td>
                    <td className="p-3 text-right font-mono font-semibold text-green-600">
                      ${entry.grossPay.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredEntries.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <p>No timesheet entries found for the selected filters</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PayrollSummary;
