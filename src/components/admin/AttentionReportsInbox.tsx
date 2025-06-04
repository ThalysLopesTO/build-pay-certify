
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Bell, Search, Filter, Download, CheckCircle } from 'lucide-react';
import { useAttentionReports, useMarkReportAsReviewed } from '@/hooks/useAttentionReports';
import { supabase } from '@/integrations/supabase/client';

const AttentionReportsInbox = () => {
  const { data: reports = [], isLoading } = useAttentionReports();
  const markAsReviewed = useMarkReportAsReviewed();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.jobsites?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${report.user_profiles?.first_name} ${report.user_profiles?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const downloadAttachment = async (fileUrl: string, fileName: string) => {
    try {
      const urlParts = fileUrl.split('/');
      const filePath = urlParts.slice(-2).join('/');
      
      const { data, error } = await supabase.storage
        .from('attention-reports')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleMarkAsReviewed = (reportId: string) => {
    markAsReviewed.mutate(reportId);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading attention reports...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Bell className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Attention Reports</h2>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search reports, jobsites, or employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reports</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'No reports match your filters.' 
                : 'No attention reports have been submitted yet.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <Card key={report.id} className={report.status === 'pending' ? 'border-orange-200' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {report.jobsites?.name || 'Unknown Jobsite'}
                    </CardTitle>
                    <p className="text-sm text-gray-500">
                      Submitted by {report.user_profiles?.first_name} {report.user_profiles?.last_name}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={report.status === 'reviewed' ? 'default' : 'secondary'}>
                      {report.status}
                    </Badge>
                    {report.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAsReviewed(report.id)}
                        disabled={markAsReviewed.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mark Reviewed
                      </Button>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {format(new Date(report.report_date), 'PPP')} at{' '}
                  {format(new Date(`2000-01-01T${report.report_time}`), 'h:mm a')}
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-gray-700 mb-4">{report.message}</p>
                
                {report.attachments && report.attachments.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Attachments:</h4>
                    {report.attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm">{attachment.file_name}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadAttachment(attachment.file_url, attachment.file_name)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-xs text-gray-500 mt-4">
                  Submitted on {format(new Date(report.created_at), 'PPP')}
                  {report.reviewed_at && (
                    <span className="block">
                      Reviewed on {format(new Date(report.reviewed_at), 'PPP')}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AttentionReportsInbox;
