
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Plus,
  MapPin,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Building2,
  Search,
  ArrowUpDown,
  ListChecks,
} from 'lucide-react';
import { useJobsites } from '@/hooks/useJobsites';
import { useIsMobile } from '@/hooks/use-mobile';
import JobsiteForm from './jobsite/JobsiteForm';
import JobsiteDetailedCard from './jobsite/JobsiteDetailedCard';
import { JobsiteTaskTab } from './tasks/JobsiteTaskTab';
import { TaskStatisticsCards } from './tasks/TaskStatisticsCards';

type StatusTab = 'active' | 'overdue' | 'completed' | 'tasks';
type SortKey = 'due_date' | 'name' | 'starting_date';

const JobsiteManagement = () => {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<StatusTab>('active');
  const [sortBy, setSortBy] = useState<SortKey>('due_date');

  const isMobile = useIsMobile();
  const { data: allJobsites = [], isLoading } = useJobsites();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const in7Days = useMemo(() => new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), [today]);

  const activeJobsites   = useMemo(() => allJobsites.filter(j => j.status === 'active'),   [allJobsites]);
  const overdueJobsites  = useMemo(() => activeJobsites.filter(j => j.due_date && new Date(j.due_date) < today), [activeJobsites, today]);
  const dueSoonJobsites  = useMemo(() => activeJobsites.filter(j => j.due_date && new Date(j.due_date) >= today && new Date(j.due_date) <= in7Days), [activeJobsites, today, in7Days]);
  const completedJobsites = useMemo(() => allJobsites.filter(j => j.status === 'completed'), [allJobsites]);

  const filteredJobsites = useMemo(() => {
    let base: typeof allJobsites = [];
    if (activeTab === 'active')    base = activeJobsites;
    if (activeTab === 'overdue')   base = overdueJobsites;
    if (activeTab === 'completed') base = completedJobsites;
    if (activeTab === 'tasks')     return [];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      base = base.filter(j =>
        j.name.toLowerCase().includes(q) ||
        j.address.toLowerCase().includes(q)
      );
    }

    return [...base].sort((a, b) => {
      if (sortBy === 'due_date') {
        const aD = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const bD = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        return aD - bD;
      }
      if (sortBy === 'starting_date') {
        const aD = a.starting_date ? new Date(a.starting_date).getTime() : 0;
        const bD = b.starting_date ? new Date(b.starting_date).getTime() : 0;
        return aD - bD;
      }
      return a.name.localeCompare(b.name);
    });
  }, [allJobsites, activeTab, activeJobsites, overdueJobsites, completedJobsites, searchTerm, sortBy]);

  const kpis = [
    {
      label: 'Active Sites',
      value: activeJobsites.length,
      icon: Building2,
      bg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      border: 'border-blue-100',
      valueColor: 'text-blue-900',
      labelColor: 'text-blue-600',
    },
    {
      label: overdueJobsites.length > 0 ? `${overdueJobsites.length} Overdue!` : 'Overdue',
      value: overdueJobsites.length,
      icon: AlertTriangle,
      bg: overdueJobsites.length > 0 ? 'bg-red-50' : 'bg-slate-50',
      iconColor: overdueJobsites.length > 0 ? 'text-red-500' : 'text-slate-400',
      border: overdueJobsites.length > 0 ? 'border-red-200' : 'border-slate-100',
      valueColor: overdueJobsites.length > 0 ? 'text-red-700' : 'text-slate-600',
      labelColor: overdueJobsites.length > 0 ? 'text-red-500' : 'text-slate-400',
      ring: overdueJobsites.length > 0,
    },
    {
      label: 'Due This Week',
      value: dueSoonJobsites.length,
      icon: Clock,
      bg: dueSoonJobsites.length > 0 ? 'bg-amber-50' : 'bg-slate-50',
      iconColor: dueSoonJobsites.length > 0 ? 'text-amber-600' : 'text-slate-400',
      border: dueSoonJobsites.length > 0 ? 'border-amber-200' : 'border-slate-100',
      valueColor: dueSoonJobsites.length > 0 ? 'text-amber-700' : 'text-slate-600',
      labelColor: dueSoonJobsites.length > 0 ? 'text-amber-600' : 'text-slate-400',
    },
    {
      label: 'Completed',
      value: completedJobsites.length,
      icon: CheckCircle2,
      bg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      border: 'border-emerald-100',
      valueColor: 'text-emerald-900',
      labelColor: 'text-emerald-600',
    },
  ];

  const tabs: { id: StatusTab; label: string; count?: number; urgent?: boolean }[] = [
    { id: 'active',    label: 'Active',    count: activeJobsites.length },
    { id: 'overdue',   label: 'Overdue',   count: overdueJobsites.length,  urgent: overdueJobsites.length > 0 },
    { id: 'completed', label: 'Completed', count: completedJobsites.length },
    { id: 'tasks',     label: 'All Tasks' },
  ];

  const emptyMessage = () => {
    if (searchTerm) return { title: 'No results', body: 'Try adjusting your search.' };
    if (activeTab === 'overdue') return { title: 'No overdue sites', body: "All your active sites are on track — nice work!" };
    if (activeTab === 'completed') return { title: 'No completed sites yet', body: 'Completed jobsites will appear here.' };
    return { title: 'No active jobsites', body: 'Add your first jobsite to get started.' };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-100">
            <MapPin className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Jobsite Management</h1>
            <p className="text-sm text-slate-500">
              {isLoading ? 'Loading…' : `${allJobsites.length} total sites · ${activeJobsites.length} active`}
            </p>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex-shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          Add Jobsite
        </Button>
      </div>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={`flex items-center gap-3 px-4 py-4 rounded-2xl border ${kpi.bg} ${kpi.border} ${kpi.ring ? 'ring-1 ring-red-300 shadow-red-100 shadow-md' : ''}`}
          >
            <div className="p-2 rounded-xl bg-white/80 shadow-sm flex-shrink-0">
              <kpi.icon className={`h-5 w-5 ${kpi.iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className={`text-2xl font-bold leading-tight ${kpi.valueColor}`}>
                {isLoading ? '—' : kpi.value}
              </p>
              <p className={`text-xs font-medium truncate ${kpi.labelColor}`}>
                {kpi.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Status tabs ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? tab.urgent
                    ? 'bg-red-600 text-white shadow-sm shadow-red-200'
                    : tab.id === 'tasks'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-orange-600 text-white shadow-sm shadow-orange-200'
                  : tab.urgent
                  ? 'text-red-700 bg-red-50 border border-red-200 hover:bg-red-100'
                  : tab.id === 'tasks'
                  ? 'text-purple-700 bg-purple-50 hover:bg-purple-100'
                  : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
              }`}
            >
              {tab.id === 'tasks' && <ListChecks className="h-3.5 w-3.5" />}
              {tab.id === 'overdue' && tab.urgent && <AlertTriangle className="h-3.5 w-3.5" />}
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs leading-none ${
                    isActive
                      ? 'bg-white/25 text-white'
                      : tab.urgent
                      ? 'bg-red-200 text-red-800'
                      : 'bg-white text-slate-600 shadow-sm'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Add-jobsite form ── */}
      {showForm && <JobsiteForm onCancel={() => setShowForm(false)} />}

      {/* ── Tasks view ── */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          <TaskStatisticsCards jobsites={activeJobsites} />
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 rounded-2xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : activeJobsites.length === 0 ? (
            <div className="text-center py-16">
              <ListChecks className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500">No active jobsites to show tasks for.</p>
            </div>
          ) : (
            activeJobsites.map((jobsite) => (
              <Card key={jobsite.id} className="rounded-2xl shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-slate-800">{jobsite.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <JobsiteTaskTab jobsiteId={jobsite.id} isAdmin={true} hideStats={true} compact={true} />
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* ── Jobsite cards view ── */}
      {activeTab !== 'tasks' && (
        <>
          {/* Search + Sort bar */}
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                placeholder="Search by name or address…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
              <SelectTrigger className="w-40 flex-shrink-0">
                <ArrowUpDown className="h-3.5 w-3.5 mr-2 text-slate-400" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="due_date">Due Date</SelectItem>
                <SelectItem value="name">Name A–Z</SelectItem>
                <SelectItem value="starting_date">Start Date</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cards */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 rounded-2xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : filteredJobsites.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 rounded-full bg-slate-100 w-fit mx-auto mb-4">
                <Building2 className="h-12 w-12 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">{emptyMessage().title}</h3>
              <p className="text-slate-500 mb-6">{emptyMessage().body}</p>
              {!searchTerm && activeTab === 'active' && (
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Jobsite
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredJobsites.map((jobsite) => (
                <JobsiteDetailedCard key={jobsite.id} jobsite={jobsite} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default JobsiteManagement;
