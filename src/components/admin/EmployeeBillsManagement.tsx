import React, { useEffect, useMemo, useState } from 'react';
import { TableCard } from '@/components/ui/table-card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { BadgeWithDot, type BadgeColor } from '@/components/base/badges/badges';
import EmployeeAvatar from '@/components/ui/employee-avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  MoreVertical,
  ExternalLink,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  useEmployeeBills,
  getBillPhotoUrl,
  EmployeeBillWithDetails,
} from '@/hooks/useEmployeeBills';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

type StatusFilter = 'all' | 'pending' | 'approved' | 'declined';

const statusConfig: Record<string, { label: string; color: BadgeColor; pulse?: boolean }> = {
  approved: { label: 'Approved', color: 'success' },
  declined: { label: 'Declined', color: 'error' },
  pending: { label: 'Pending', color: 'warning', pulse: true },
};

const StatusBadge: React.FC<{ status: string; size?: 'sm' | 'md' }> = ({ status, size = 'sm' }) => {
  const cfg = statusConfig[status] ?? statusConfig.pending;
  return (
    <BadgeWithDot color={cfg.color} type="pill-color" size={size} pulse={cfg.pulse}>
      {cfg.label}
    </BadgeWithDot>
  );
};

const formatAmount = (amount: number | null) =>
  amount == null ? '—' : `$${amount.toFixed(2)}`;

const EmployeeBillsManagement: React.FC = () => {
  const { bills, isLoading, reviewBill, isReviewing, deleteBill, isDeleting } = useEmployeeBills();
  const isMobile = useIsMobile();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [previewBill, setPreviewBill] = useState<EmployeeBillWithDetails | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [billToDelete, setBillToDelete] = useState<EmployeeBillWithDetails | null>(null);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return bills;
    return bills.filter((b) => b.status === statusFilter);
  }, [bills, statusFilter]);

  const counts = useMemo(
    () => ({
      all: bills.length,
      pending: bills.filter((b) => b.status === 'pending').length,
      approved: bills.filter((b) => b.status === 'approved').length,
      declined: bills.filter((b) => b.status === 'declined').length,
    }),
    [bills]
  );

  const openPreview = (bill: EmployeeBillWithDetails, index = 0) => {
    if (bill.photos.length === 0) return;
    setPreviewBill(bill);
    setPreviewIndex(index);
  };

  const previewPhotos = previewBill?.photos ?? [];
  const currentPhoto = previewPhotos[previewIndex];

  const goPrev = () => setPreviewIndex((i) => (i - 1 + previewPhotos.length) % previewPhotos.length);
  const goNext = () => setPreviewIndex((i) => (i + 1) % previewPhotos.length);

  // Keyboard navigation in the lightbox
  useEffect(() => {
    if (!previewBill || previewPhotos.length <= 1) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewBill, previewPhotos.length]);

  const filterPills: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'pending', label: 'Pending', count: counts.pending },
    { key: 'approved', label: 'Approved', count: counts.approved },
    { key: 'declined', label: 'Declined', count: counts.declined },
  ];

  /* ------------------------------ Thumbnail ------------------------------ */
  const Thumbnail: React.FC<{ bill: EmployeeBillWithDetails; size?: number }> = ({
    bill,
    size = 64,
  }) => {
    const firstPhoto = bill.photos[0];
    return (
      <button
        type="button"
        onClick={() => openPreview(bill)}
        disabled={bill.photos.length === 0}
        style={{ width: size, height: size }}
        className={cn(
          'relative flex-shrink-0 overflow-hidden rounded-xl border bg-muted shadow-sm',
          bill.photos.length > 0
            ? 'cursor-pointer transition hover:ring-2 hover:ring-primary/40'
            : 'cursor-default'
        )}
        aria-label={bill.photos.length > 0 ? 'Preview receipt photos' : 'No receipt photo'}
      >
        {firstPhoto ? (
          <img
            src={getBillPhotoUrl(firstPhoto.file_path)}
            alt="Receipt"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageIcon className="h-6 w-6" />
          </span>
        )}
        {bill.photos.length > 1 && (
          <span className="absolute bottom-0 right-0 rounded-tl-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            +{bill.photos.length - 1}
          </span>
        )}
      </button>
    );
  };

  /* ------------------------------ Mobile card ------------------------------ */
  const BillCard: React.FC<{ bill: EmployeeBillWithDetails }> = ({ bill }) => (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <Thumbnail bill={bill} size={72} />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <EmployeeAvatar
                photoUrl={bill.employee_photo_url || undefined}
                firstName={bill.employee_first_name || undefined}
                lastName={bill.employee_last_name || undefined}
                size="sm"
              />
              <span className="truncate font-semibold">{bill.employee_name}</span>
            </div>
            <StatusBadge status={bill.status} />
          </div>
          <div className="text-lg font-bold">{formatAmount(bill.amount)}</div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(bill.created_at), 'MMM d, yyyy')}
            </span>
            {bill.jobsite_name && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {bill.jobsite_name}
              </span>
            )}
          </div>
        </div>
      </div>

      {bill.description && (
        <p className="text-sm text-muted-foreground line-clamp-2">{bill.description}</p>
      )}

      <div className="flex items-center gap-2 pt-1">
        {bill.status !== 'approved' && (
          <Button
            variant="outline"
            className="h-11 flex-1 gap-1.5 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
            disabled={isReviewing}
            onClick={() => reviewBill({ billId: bill.id, status: 'approved' })}
          >
            <Check className="h-4 w-4" /> Approve
          </Button>
        )}
        {bill.status !== 'declined' && (
          <Button
            variant="outline"
            className="h-11 flex-1 gap-1.5 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
            disabled={isReviewing}
            onClick={() => reviewBill({ billId: bill.id, status: 'declined' })}
          >
            <X className="h-4 w-4" /> Decline
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 text-muted-foreground hover:text-destructive"
          onClick={() => setBillToDelete(bill)}
          aria-label="Delete bill"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Receipt className="h-6 w-6 text-primary" />
          Employee Bills
        </h1>
        <p className="text-sm text-muted-foreground">
          Reimbursement receipts submitted by employees at punch-out.
        </p>
      </div>

      {/* Quick filter pills */}
      <div className="flex flex-wrap gap-2">
        {filterPills.map((pill) => {
          const active = statusFilter === pill.key;
          return (
            <button
              key={pill.key}
              type="button"
              onClick={() => setStatusFilter(pill.key)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition',
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted'
              )}
            >
              {pill.label}
              <span
                className={cn(
                  'rounded-full px-1.5 text-xs font-semibold',
                  active ? 'bg-primary-foreground/20' : 'bg-muted-foreground/15'
                )}
              >
                {pill.count}
              </span>
            </button>
          );
        })}
      </div>

      <TableCard.Root>
        <TableCard.Header
          title="Submitted Bills"
          badge={filtered.length}
          description={
            counts.pending > 0 ? `${counts.pending} pending review` : 'All caught up'
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
        ) : isMobile ? (
          /* ---------------------------- Mobile list ---------------------------- */
          <div className="flex flex-col gap-3 border-t p-3">
            {filtered.map((bill) => (
              <BillCard key={bill.id} bill={bill} />
            ))}
          </div>
        ) : (
          /* ---------------------------- Desktop table ---------------------------- */
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
                {filtered.map((bill) => (
                  <tr key={bill.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-6 py-4">
                      <Thumbnail bill={bill} size={64} />
                    </td>

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

                    <td className="px-6 py-4 font-semibold">{formatAmount(bill.amount)}</td>

                    <td className="px-6 py-4 max-w-[220px]">
                      <span className="line-clamp-2 text-muted-foreground">
                        {bill.description || '—'}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                      {format(new Date(bill.created_at), 'MMM d, yyyy')}
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={bill.status} size="md" />
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {bill.status !== 'approved' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                            disabled={isReviewing}
                            onClick={() => reviewBill({ billId: bill.id, status: 'approved' })}
                          >
                            <Check className="h-4 w-4" /> Approve
                          </Button>
                        )}
                        {bill.status !== 'declined' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                            disabled={isReviewing}
                            onClick={() => reviewBill({ billId: bill.id, status: 'declined' })}
                          >
                            <X className="h-4 w-4" /> Decline
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground"
                              aria-label="More actions"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-background z-50">
                            {bill.photos.length > 0 && (
                              <DropdownMenuItem onClick={() => openPreview(bill)}>
                                <ImageIcon className="mr-2 h-4 w-4" /> View receipts
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setBillToDelete(bill)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TableCard.Root>

      {/* Photo gallery lightbox */}
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
                  className="max-h-[55vh] w-auto rounded-md object-contain"
                />
                {previewPhotos.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={goPrev}
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
                      aria-label="Previous photo"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={goNext}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
                      aria-label="Next photo"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <span className="absolute bottom-3 right-3 rounded-full bg-black/70 px-2 py-0.5 text-xs font-medium text-white">
                      {previewIndex + 1} / {previewPhotos.length}
                    </span>
                  </>
                )}
              </div>

              {/* Thumbnail strip */}
              {previewPhotos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {previewPhotos.map((photo, i) => (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => setPreviewIndex(i)}
                      className={cn(
                        'h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border-2 transition',
                        i === previewIndex
                          ? 'border-primary'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      )}
                      aria-label={`View photo ${i + 1}`}
                    >
                      <img
                        src={getBillPhotoUrl(photo.file_path)}
                        alt={photo.file_name}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                <span className="line-clamp-2">
                  {previewBill?.description || 'No description'}
                </span>
                <a
                  href={getBillPhotoUrl(currentPhoto.file_path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-shrink-0 items-center gap-1 font-medium text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Open full image
                </a>
              </div>
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
        isLoading={isDeleting}
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
