import React, { useMemo, useState } from 'react';
import { TableCard } from '@/components/ui/table-card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { BadgeWithDot } from '@/components/base/badges/badges';
import EmployeeAvatar from '@/components/ui/employee-avatar';
import {
  Receipt,
  Check,
  X,
  Trash2,
  MapPin,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  Inbox,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  useEmployeeBills,
  getBillPhotoUrl,
  EmployeeBillWithDetails,
} from '@/hooks/useEmployeeBills';
import { cn } from '@/lib/utils';

type StatusFilter = 'all' | 'pending' | 'approved' | 'declined';

const statusBadge = (status: string) => {
  switch (status) {
    case 'approved':
      return <BadgeWithDot type="solid" customColor="#16a34a">Approved</BadgeWithDot>;
    case 'declined':
      return <BadgeWithDot type="solid" customColor="#dc2626">Declined</BadgeWithDot>;
    default:
      return <BadgeWithDot type="solid" customColor="#d97706">Pending</BadgeWithDot>;
  }
};

const formatAmount = (amount: number | null) =>
  amount == null ? '—' : `$${amount.toFixed(2)}`;

const EmployeeBillsManagement: React.FC = () => {
  const { bills, isLoading, reviewBill, isReviewing, deleteBill, isDeleting } = useEmployeeBills();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [previewBill, setPreviewBill] = useState<EmployeeBillWithDetails | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [billToDelete, setBillToDelete] = useState<EmployeeBillWithDetails | null>(null);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return bills;
    return bills.filter((b) => b.status === statusFilter);
  }, [bills, statusFilter]);

  const pendingCount = useMemo(() => bills.filter((b) => b.status === 'pending').length, [bills]);

  const openPreview = (bill: EmployeeBillWithDetails, index = 0) => {
    if (bill.photos.length === 0) return;
    setPreviewBill(bill);
    setPreviewIndex(index);
  };

  const previewPhotos = previewBill?.photos ?? [];
  const currentPhoto = previewPhotos[previewIndex];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Receipt className="h-6 w-6 text-primary" />
          Employee Bills
        </h1>
        <p className="text-sm text-muted-foreground">
          Reimbursement receipts submitted by employees at punch-out.
        </p>
      </div>

      <TableCard.Root>
        <TableCard.Header
          title="Submitted Bills"
          badge={filtered.length}
          description={pendingCount > 0 ? `${pendingCount} pending review` : 'All caught up'}
          trailing={
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
              </SelectContent>
            </Select>
          }
        />

        {isLoading ? (
          <div className="px-6 py-16 text-center text-muted-foreground">Loading bills…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-16 text-center text-muted-foreground">
            <Inbox className="h-8 w-8" />
            <p className="font-medium">No bills to show</p>
            <p className="text-sm">Submitted reimbursement bills will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border-t">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Receipt</th>
                  <th className="px-6 py-3 font-medium">Employee</th>
                  <th className="px-6 py-3 font-medium">Project</th>
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Description</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((bill) => {
                  const firstPhoto = bill.photos[0];
                  return (
                    <tr key={bill.id} className="border-b last:border-0 hover:bg-muted/30">
                      {/* Receipt thumbnail */}
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => openPreview(bill)}
                          disabled={bill.photos.length === 0}
                          className={cn(
                            'relative h-12 w-12 overflow-hidden rounded-lg border bg-muted',
                            bill.photos.length > 0 ? 'cursor-pointer hover:ring-2 hover:ring-primary/40' : 'cursor-default'
                          )}
                          aria-label="Preview receipt"
                        >
                          {firstPhoto ? (
                            <img
                              src={getBillPhotoUrl(firstPhoto.file_path)}
                              alt="Receipt"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-muted-foreground">
                              <ImageIcon className="h-5 w-5" />
                            </span>
                          )}
                          {bill.photos.length > 1 && (
                            <span className="absolute bottom-0 right-0 rounded-tl bg-black/70 px-1 text-[10px] font-medium text-white">
                              +{bill.photos.length - 1}
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Employee */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <EmployeeAvatar
                            photoUrl={bill.employee_photo_url || undefined}
                            firstName={bill.employee_first_name || undefined}
                            lastName={bill.employee_last_name || undefined}
                            size="sm"
                          />
                          <span className="font-medium">{bill.employee_name}</span>
                        </div>
                      </td>

                      {/* Project */}
                      <td className="px-6 py-4">
                        {bill.jobsite_name ? (
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            {bill.jobsite_name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4 font-semibold">{formatAmount(bill.amount)}</td>

                      {/* Description */}
                      <td className="px-6 py-4 max-w-[220px]">
                        <span className="line-clamp-2 text-muted-foreground">
                          {bill.description || '—'}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {format(new Date(bill.created_at), 'MMM d, yyyy')}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">{statusBadge(bill.status)}</td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {bill.status !== 'approved' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-600 hover:bg-green-50 hover:text-green-700"
                              disabled={isReviewing}
                              onClick={() => reviewBill({ billId: bill.id, status: 'approved' })}
                              title="Approve"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          {bill.status !== 'declined' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                              disabled={isReviewing}
                              onClick={() => reviewBill({ billId: bill.id, status: 'declined' })}
                              title="Decline"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-destructive"
                            onClick={() => setBillToDelete(bill)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </TableCard.Root>

      {/* Photo preview dialog */}
      <Dialog open={!!previewBill} onOpenChange={(open) => !open && setPreviewBill(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              {previewBill?.employee_name} — {formatAmount(previewBill?.amount ?? null)}
            </DialogTitle>
          </DialogHeader>
          {currentPhoto && (
            <div className="space-y-3">
              <div className="relative flex items-center justify-center rounded-lg bg-muted/40 p-2">
                <img
                  src={getBillPhotoUrl(currentPhoto.file_path)}
                  alt={currentPhoto.file_name}
                  className="max-h-[60vh] w-auto rounded-md object-contain"
                />
                {previewPhotos.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setPreviewIndex((i) => (i - 1 + previewPhotos.length) % previewPhotos.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
                      aria-label="Previous photo"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewIndex((i) => (i + 1) % previewPhotos.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
                      aria-label="Next photo"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{previewBill?.description || 'No description'}</span>
                {previewPhotos.length > 1 && (
                  <span>{previewIndex + 1} / {previewPhotos.length}</span>
                )}
              </div>
              <a
                href={currentPhoto ? getBillPhotoUrl(currentPhoto.file_path) : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary hover:underline"
              >
                Open full image
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!billToDelete}
        onOpenChange={(open) => !open && setBillToDelete(null)}
        title="Delete this bill?"
        description="This permanently removes the bill and its photos. This cannot be undone."
        confirmText="Delete"
        variant="destructive"
        loading={isDeleting}
        onConfirm={() => {
          if (billToDelete) {
            deleteBill(billToDelete);
            setBillToDelete(null);
          }
        }}
      />
    </div>
  );
};

export default EmployeeBillsManagement;
