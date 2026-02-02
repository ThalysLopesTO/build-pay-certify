import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ExternalLink, Link, XCircle } from 'lucide-react';
import { DuplicateCandidate, DuplicateDecision } from '@/types/duplicate-detection';
import { formatDateFromDB } from '@/utils/dateUtils';
import { BLOCKING_SCORE_THRESHOLD } from '@/utils/duplicateDetection';

interface DuplicateWarningPanelProps {
  candidates: DuplicateCandidate[];
  onOpenExisting: (id: string) => void;
  onMarkAsDuplicate: (candidateId: string) => void;
  onNotADuplicate: () => void;
  decision: DuplicateDecision | null;
}

export const DuplicateWarningPanel: React.FC<DuplicateWarningPanelProps> = ({
  candidates,
  onOpenExisting,
  onMarkAsDuplicate,
  onNotADuplicate,
  decision
}) => {
  if (candidates.length === 0) return null;

  const hasBlockingCandidate = candidates.some(c => c.score >= BLOCKING_SCORE_THRESHOLD);
  const hasDecision = decision !== null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  return (
    <div className={`rounded-lg border-2 p-4 mb-4 ${
      hasDecision 
        ? 'border-green-200 bg-green-50' 
        : hasBlockingCandidate 
          ? 'border-amber-400 bg-amber-50' 
          : 'border-amber-200 bg-amber-50/50'
    }`}>
      <div className="flex items-start gap-3">
        {hasDecision ? (
          <div className="p-2 rounded-full bg-green-100">
            <XCircle className="h-5 w-5 text-green-600" />
          </div>
        ) : (
          <div className="p-2 rounded-full bg-amber-100">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold ${hasDecision ? 'text-green-800' : 'text-amber-800'}`}>
            {hasDecision 
              ? decision.status === 'confirmed' 
                ? 'Marked as Duplicate' 
                : 'Not a Duplicate'
              : 'Possible Duplicate Detected'
            }
          </h4>
          <p className={`text-sm mt-1 ${hasDecision ? 'text-green-700' : 'text-amber-700'}`}>
            {hasDecision 
              ? decision.status === 'confirmed'
                ? 'This expense will be linked to the existing transaction.'
                : 'This expense will be saved as a new transaction.'
              : 'This receipt may already exist in your records:'
            }
          </p>

          {/* List of candidates */}
          <div className="mt-3 space-y-2">
            {candidates.slice(0, 3).map((candidate) => (
              <div 
                key={candidate.id}
                className={`p-3 rounded-lg border ${
                  decision?.duplicateOfId === candidate.id 
                    ? 'bg-green-100 border-green-300' 
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">
                      {candidate.expense_title}
                    </p>
                    <p className="text-sm text-slate-600">
                      {candidate.vendor_payee} • {formatDateFromDB(candidate.expense_date, 'MMM d, yyyy')}
                    </p>
                    <p className="text-sm font-semibold text-slate-700 mt-1">
                      {formatCurrency(candidate.amount)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Match score: {candidate.score}% 
                      {candidate.score >= BLOCKING_SCORE_THRESHOLD && ' (exact match)'}
                    </p>
                  </div>
                  {decision?.duplicateOfId === candidate.id && (
                    <div className="px-2 py-1 bg-green-200 text-green-800 text-xs font-medium rounded">
                      Linked
                    </div>
                  )}
                </div>

                {!hasDecision && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenExisting(candidate.id)}
                      className="text-xs"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Open
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onMarkAsDuplicate(candidate.id)}
                      className="text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
                    >
                      <Link className="h-3 w-3 mr-1" />
                      Mark as Duplicate
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          {!hasDecision && (
            <div className="mt-4 flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onNotADuplicate}
                className="border-slate-300"
              >
                Not a Duplicate
              </Button>
              {hasBlockingCandidate && (
                <p className="text-xs text-amber-700">
                  ⚠️ Save blocked until you choose an action
                </p>
              )}
            </div>
          )}

          {/* Reset decision link */}
          {hasDecision && (
            <Button
              variant="link"
              size="sm"
              onClick={onNotADuplicate}
              className="mt-2 p-0 h-auto text-slate-600"
            >
              Change decision
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
