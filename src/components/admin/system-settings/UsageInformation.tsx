
import React from 'react';

export const UsageInformation: React.FC = () => {
  return (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
      <h4 className="font-medium text-blue-900 mb-2">Usage Information</h4>
      <p className="text-sm text-blue-700">
        These settings automatically appear in invoice PDFs, outgoing emails, and dashboard header branding. 
        Fields marked with * are required for generating professional invoices. The week ending day determines 
        when your company's work week ends for timesheet submissions.
      </p>
    </div>
  );
};
