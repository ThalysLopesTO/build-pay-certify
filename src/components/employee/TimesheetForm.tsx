
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Clock, DollarSign, MapPin, Briefcase } from 'lucide-react';

const TimesheetForm = () => {
  const { user } = useAuth();
  const [selectedJobSite, setSelectedJobSite] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [hours, setHours] = useState({
    monday: '',
    tuesday: '',
    wednesday: '',
    thursday: '',
    friday: '',
    saturday: '',
    sunday: ''
  });

  const jobSites = [
    'Downtown Office Complex',
    'Riverside Condos',
    'Industrial Park Phase 2',
    'Highway Bridge Project'
  ];

  const projects = [
    'Foundation & Structure',
    'Electrical Installation',
    'Plumbing & HVAC',
    'Finishing Work'
  ];

  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  const handleHourChange = (day: string, value: string) => {
    setHours(prev => ({ ...prev, [day]: value }));
  };

  const getTotalHours = () => {
    return Object.values(hours).reduce((total, hour) => {
      return total + (parseFloat(hour) || 0);
    }, 0);
  };

  const getGrossPay = () => {
    return getTotalHours() * (user?.hourlyRate || 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedJobSite || !selectedProject) {
      toast({
        title: "Missing Information",
        description: "Please select both job site and project",
        variant: "destructive",
      });
      return;
    }

    const totalHours = getTotalHours();
    if (totalHours === 0) {
      toast({
        title: "No Hours Entered",
        description: "Please enter at least one hour for the week",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Timesheet Submitted",
      description: `${totalHours} hours submitted for week ending ${new Date().toLocaleDateString()}`,
    });

    // Reset form
    setSelectedJobSite('');
    setSelectedProject('');
    setHours({
      monday: '',
      tuesday: '',
      wednesday: '',
      thursday: '',
      friday: '',
      saturday: '',
      sunday: ''
    });
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="bg-gradient-to-r from-orange-600 to-orange-700 text-white">
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-6 w-6" />
          <span>Weekly Timesheet</span>
        </CardTitle>
        <p className="text-orange-100">Week ending: {new Date().toLocaleDateString()}</p>
      </CardHeader>
      
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Job Site and Project Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-orange-600" />
                <span>Job Site</span>
              </Label>
              <Select value={selectedJobSite} onValueChange={setSelectedJobSite}>
                <SelectTrigger>
                  <SelectValue placeholder="Select job site" />
                </SelectTrigger>
                <SelectContent>
                  {jobSites.map((site) => (
                    <SelectItem key={site} value={site}>{site}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                <Briefcase className="h-4 w-4 text-orange-600" />
                <span>Project</span>
              </Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project} value={project}>{project}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Daily Hours Input */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Daily Hours</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {daysOfWeek.map((day) => (
                <div key={day.key} className="space-y-2">
                  <Label htmlFor={day.key}>{day.label}</Label>
                  <Input
                    id={day.key}
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    placeholder="0"
                    value={hours[day.key as keyof typeof hours]}
                    onChange={(e) => handleHourChange(day.key, e.target.value)}
                    className="text-center"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-slate-50 p-4 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-slate-600">Total Hours</p>
              <p className="text-2xl font-bold text-blue-600">{getTotalHours().toFixed(1)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-600">Hourly Rate</p>
              <p className="text-2xl font-bold text-green-600">${user?.hourlyRate}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-600">Gross Pay</p>
              <p className="text-2xl font-bold text-orange-600">${getGrossPay().toFixed(2)}</p>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-orange-600 hover:bg-orange-700 text-lg py-3"
          >
            Submit Timesheet
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default TimesheetForm;
