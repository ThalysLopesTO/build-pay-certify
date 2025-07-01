
import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, MapPin, User, MessageSquare, Image } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface AttentionReportDetailsProps {
  reportId?: string;
  showBackButton?: boolean;
}

const AttentionReportDetails: React.FC<AttentionReportDetailsProps> = ({ 
  reportId: propReportId, 
  showBackButton = true 
}) => {
  const { reportId: paramReportId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const reportId = propReportId || paramReportId;

  const { data: report, isLoading, error } = useQuery({
    queryKey: ['attention-report', reportId],
    queryFn: async () => {
      if (!reportId) throw new Error('No report ID provided');
      
      const { data, error } = await supabase
        .from('attention_reports')
        .select(`
          *,
          jobsites(name, address)
        `)
        .eq('id', reportId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!reportId
  });

  // Separate query for user profile information
  const { data: submittedByProfile } = useQuery({
    queryKey: ['user-profile', report?.submitted_by],
    queryFn: async () => {
      if (!report?.submitted_by) return null;
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('first_name, last_name')
        .eq('user_id', report.submitted_by)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!report?.submitted_by
  });

  const { data: attachments } = useQuery({
    queryKey: ['attention-report-attachments', reportId],
    queryFn: async () => {
      if (!reportId) return [];
      
      const { data, error } = await supabase
        .from('attention_report_attachments')
        .select('*')
        .eq('report_id', reportId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!reportId
  });

  // Check if user has access to this report
  const hasAccess = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'foreman';

  if (!hasAccess) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            You don't have permission to view this attention report.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Report not found or no longer available. It may have been deleted or you don't have access to it.
          </AlertDescription>
        </Alert>
        {showBackButton && (
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin/attention-reports')} 
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Attention Reports
          </Button>
        )}
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending Review</Badge>;
      case 'reviewed':
        return <Badge variant="outline">Reviewed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {showBackButton && (
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Link 
            to="/admin/attention-reports" 
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Back to All Reports
          </Link>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Attention Report Details</span>
              </CardTitle>
              <CardDescription>
                Report submitted on {format(new Date(report.created_at), 'PPP')}
              </CardDescription>
            </div>
            {getStatusBadge(report.status)}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Employee Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <User className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Submitted by</p>
                <p className="text-sm text-gray-600">
                  {submittedByProfile?.first_name} {submittedByProfile?.last_name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Date & Time</p>
                <p className="text-sm text-gray-600">
                  {format(new Date(report.report_date), 'PPP')} at {report.report_time}
                </p>
              </div>
            </div>
          </div>

          {/* Jobsite Information */}
          <div className="flex items-start space-x-3">
            <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Jobsite</p>
              <p className="text-sm text-gray-600">{report.jobsites?.name}</p>
              {report.jobsites?.address && (
                <p className="text-xs text-gray-500">{report.jobsites.address}</p>
              )}
            </div>
          </div>

          {/* Report Message */}
          <div>
            <p className="text-sm font-medium mb-2">Report Details</p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{report.message}</p>
            </div>
          </div>

          {/* Attachments */}
          {attachments && attachments.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2 flex items-center">
                <Image className="h-4 w-4 mr-2" />
                Attachments ({attachments.length})
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="border rounded-lg p-2">
                    {attachment.mime_type?.startsWith('image/') ? (
                      <img
                        src={attachment.file_url}
                        alt={attachment.file_name}
                        className="w-full h-32 object-cover rounded"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center">
                        <p className="text-xs text-gray-500 text-center p-2">
                          {attachment.file_name}
                        </p>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => window.open(attachment.file_url, '_blank')}
                    >
                      View File
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Review Information */}
          {report.reviewed_at && (
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-green-800">Report Reviewed</p>
              <p className="text-sm text-green-600">
                Reviewed on {format(new Date(report.reviewed_at), 'PPP')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AttentionReportDetails;
