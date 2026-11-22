
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Package, Edit, Plus, Download, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { useMaterialTakeoffNotes } from '@/hooks/useMaterialTakeoffNotes';
import { useMaterialTakeoffItems } from '@/hooks/useMaterialTakeoffItems';
import { formatQuantity, takeoffText } from '@/utils/takeoffItems';
import MaterialTakeoffNotesEditor from '../material-takeoff/MaterialTakeoffNotesEditor';

interface JobsiteMaterialTakeoffProps {
  jobsiteId: string;
  jobsiteName: string;
}

const downloadTakeoffTxt = (jobsiteName: string, content: string) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${jobsiteName.replace(/[^a-z0-9]/gi, '_')}_material_takeoff.txt`;
  a.click();
  URL.revokeObjectURL(url);
};

const JobsiteMaterialTakeoff: React.FC<JobsiteMaterialTakeoffProps> = ({
  jobsiteId,
  jobsiteName,
}) => {
  const { getNoteByJobsite, isLoading } = useMaterialTakeoffNotes();
  const { getItemsByJobsite, isLoading: itemsLoading } = useMaterialTakeoffItems();
  const [showEditor, setShowEditor] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const existingNote = getNoteByJobsite(jobsiteId);
  const items = getItemsByJobsite(jobsiteId);
  const noteText = existingNote?.takeoff_notes || '';
  const hasTakeoff = !!existingNote || items.length > 0;

  const handleExportTxt = () => {
    if (!hasTakeoff) return;
    downloadTakeoffTxt(
      jobsiteName,
      takeoffText(jobsiteName, items, noteText, existingNote && {
        created: new Date(existingNote.created_at).toLocaleDateString(),
        updated: new Date(existingNote.updated_at).toLocaleDateString(),
      }),
    );
  };

  const getSummaryText = () => {
    if (isLoading || itemsLoading) return 'Loading...';
    if (!hasTakeoff) return 'No materials added yet';
    const parts: string[] = [];
    if (items.length > 0) parts.push(`${items.length} material${items.length === 1 ? '' : 's'}`);
    const lineCount = noteText.split('\n').filter(line => line.trim()).length;
    if (lineCount > 0) parts.push(`${lineCount} note line${lineCount === 1 ? '' : 's'}`);
    return parts.join(' · ') || 'Empty';
  };

  return (
    <div className="space-y-2">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border hover:bg-muted/50 transition-colors">
          <CollapsibleTrigger className="flex items-center space-x-3 flex-1 text-left">
            <Package className="h-4 w-4 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm">Material Takeoff</h4>
              <p className="text-xs text-muted-foreground truncate">
                {getSummaryText()}
              </p>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}
          </CollapsibleTrigger>

          <div className="flex items-center gap-1 ml-2">
            {hasTakeoff && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(v => !v)}
                  className="text-xs px-2 py-1 h-7 hover:bg-background"
                  aria-label="View material takeoff"
                >
                  <Eye className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExportTxt}
                  className="text-xs px-2 py-1 h-7 hover:bg-background"
                  aria-label="Download material takeoff"
                >
                  <Download className="h-3 w-3" />
                </Button>
              </>
            )}
            <Button
              onClick={() => setShowEditor(true)}
              variant="secondary"
              size="sm"
              className="text-xs px-2 py-1 h-7"
              aria-label={hasTakeoff ? 'Edit material takeoff' : 'Add material takeoff'}
            >
              {hasTakeoff ? <Edit className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        <CollapsibleContent className="mt-2">
          <div className="rounded-lg bg-muted/20 border p-4 space-y-3">
            {isLoading || itemsLoading ? (
              <div className="flex items-center justify-center h-16">
                <div className="text-muted-foreground animate-pulse text-sm">Loading material takeoff...</div>
              </div>
            ) : hasTakeoff ? (
              <>
                {items.length > 0 && (
                  <div className="bg-background rounded-md border">
                    <div className="flex items-center justify-between px-3 py-2 border-b">
                      <h5 className="font-medium text-sm">Materials ({items.length})</h5>
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y">
                      {items.map(item => (
                        <div key={item.id} className="flex items-start justify-between gap-3 px-3 py-1.5 text-sm">
                          <div className="min-w-0">
                            <div className="truncate">
                              {item.name}
                              {item.spec_size && <span className="text-muted-foreground"> ({item.spec_size})</span>}
                            </div>
                            {item.notes && <div className="text-xs text-muted-foreground truncate">{item.notes}</div>}
                          </div>
                          <div className="whitespace-nowrap font-medium tabular-nums">
                            {formatQuantity(item.quantity)} <span className="text-muted-foreground font-normal">{item.unit}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {noteText.trim() && (
                  <div className="bg-background rounded-md p-3 border">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-sm">Notes</h5>
                      {existingNote && (
                        <div className="text-xs text-muted-foreground">
                          Last updated: {new Date(existingNote.updated_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <div className="text-sm font-mono whitespace-pre-wrap max-h-40 overflow-y-auto text-foreground">
                      {noteText}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-6">
                <Package className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">No materials added yet.</p>
                <p className="text-xs text-muted-foreground mt-1">Click the + button to pick materials from the catalog.</p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <MaterialTakeoffNotesEditor
        jobsiteId={jobsiteId}
        jobsiteName={jobsiteName}
        open={showEditor}
        onClose={() => setShowEditor(false)}
      />
    </div>
  );
};

export default JobsiteMaterialTakeoff;
