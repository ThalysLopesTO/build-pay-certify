import React from 'react';
import { Shield, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import EmployeePageHeader from './EmployeePageHeader';

const STATUS = {
  valid:    { label: 'Valid',         dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700', Icon: CheckCircle },
  expiring: { label: 'Expiring soon', dot: 'bg-amber-500',   chip: 'bg-amber-50 text-amber-700',     Icon: AlertTriangle },
  expired:  { label: 'Expired',       dot: 'bg-red-500',      chip: 'bg-red-50 text-red-700',          Icon: XCircle },
} as const;

type CertStatus = keyof typeof STATUS;

const CertificateStatus = () => {
  // Mock certificates data since Supabase auth doesn't have certificates
  const mockCertificates: { id: string; name: string; expiryDate: string; status: CertStatus }[] = [
    { id: '1', name: 'WHMIS', expiryDate: '2024-12-31', status: 'valid' },
    { id: '2', name: '4 Steps', expiryDate: '2024-08-15', status: 'expiring' },
    { id: '3', name: 'Working at Heights', expiryDate: '2024-10-20', status: 'valid' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
      <EmployeePageHeader
        title="Certificates"
        subtitle="Your safety credentials"
        icon={Shield}
        tone="slate"
      />

      {mockCertificates.length === 0 ? (
        <div className="rounded-3xl bg-white border border-slate-200/70 shadow-sm py-12 text-center">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-slate-100">
            <Shield className="h-7 w-7 text-slate-300" />
          </div>
          <p className="font-semibold text-slate-700">No certificates on file</p>
          <p className="mt-1 text-sm text-slate-400">Contact your administrator to upload certificates</p>
        </div>
      ) : (
        <div className="space-y-3">
          {mockCertificates.map((cert) => {
            const s = STATUS[cert.status];
            return (
              <div key={cert.id} className="rounded-2xl bg-white border border-slate-200/70 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-slate-900">{cert.name}</h3>
                  <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.chip}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                    {s.label}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-slate-500">
                  Expires {new Date(cert.expiryDate).toLocaleDateString()}
                </p>
                {cert.status === 'expiring' && (
                  <p className="mt-2 text-sm font-medium text-amber-600">Renewal required within 30 days</p>
                )}
                {cert.status === 'expired' && (
                  <p className="mt-2 text-sm font-medium text-red-600">Expired — contact your admin</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CertificateStatus;
