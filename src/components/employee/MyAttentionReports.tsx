
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { AlertTriangle, FileText, Download } from 'lucide-react';
import { useMyAttentionReports } from '@/hooks/useAttentionReports';
import { supabase } from '@/integrations/supabase/client';

const MyAttentionReports = () => {
  const { data: reports = [], isLoading } = useMyAttentionReports();

  const downloadAttachment = async (fileUrl: string, fileName: string) => {
    try {
      // Extract the file path from the URL
      const urlParts = fileUrl.split('/');
      const filePath = urlParts.slice(-2).join('/'); // Get last two parts (folder/filename)
      
      const { data, error } = await supabase.storage
        .from('attention-reports')
        .download(filePath);

      if (error) throw error;

      // Create download link
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

  if (isLoading) {
    return <div className="text-center py-8">Loading your reports...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <FileText className="h-6 w-6" />
        <h2 className="text-2xl font-bold">My Attention Reports</h2>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">You haven't submitted any attention reports yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {report.jobsites?.name || 'Unknown Jobsite'}
                  </CardTitle>
                  <Badge variant={report.status === 'reviewed' ? 'default' : 'secondary'}>
                    {report.status}
                  </Badge>
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

export default MyAttentionReports;
