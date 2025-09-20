
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Package, Edit, Plus, FileText, Download, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { useMaterialTakeoffNotes } from '@/hooks/useMaterialTakeoffNotes';
import MaterialTakeoffNotesEditor from '../material-takeoff/MaterialTakeoffNotesEditor';

interface JobsiteMaterialTakeoffProps {
  jobsiteId: string;
  jobsiteName: string;
}

const JobsiteMaterialTakeoff: React.FC<JobsiteMaterialTakeoffProps> = ({
  jobsiteId,
  jobsiteName,
}) => {
  const { getNoteByJobsite, isLoading } = useMaterialTakeoffNotes();
  const [showEditor, setShowEditor] = useState(false);
  const [viewMode, setViewMode] = useState<'view' | 'edit'>('edit');
  const [isExpanded, setIsExpanded] = useState(false);

  const existingNote = getNoteByJobsite(jobsiteId);

  const handleEdit = () => {
    setViewMode('edit');
    setShowEditor(true);
  };

  const handleView = () => {
    setViewMode('view');
    setShowEditor(true);
  };

  const handleExportTxt = () => {
    if (!existingNote) return;
    
    const content = `Material Takeoff Notes - ${jobsiteName}
Created: ${new Date(existingNote.created_at).toLocaleDateString()}
Last Updated: ${new Date(existingNote.updated_at).toLocaleDateString()}

${existingNote.takeoff_notes}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${jobsiteName.replace(/[^a-z0-9]/gi, '_')}_material_takeoff.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSummaryText = () => {
    if (isLoading) return "Loading...";
    if (!existingNote) return "No material notes added yet";
    
    const lineCount = existingNote.takeoff_notes.split('\n').filter(line => line.trim()).length;
    const charCount = existingNote.takeoff_notes.length;
    return `${lineCount} lines, ${charCount} characters`;
  };

  return (
    <div className="space-y-2">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border hover:bg-muted/50 transition-colors">
          <CollapsibleTrigger className="flex items-center space-x-3 flex-1 text-left">
            <Package className="h-4 w-4 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm">Material Takeoff Notes</h4>
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
            {existingNote && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleView}
                  className="text-xs px-2 py-1 h-7 hover:bg-background"
                >
                  <Eye className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExportTxt}
                  className="text-xs px-2 py-1 h-7 hover:bg-background"
                >
                  <Download className="h-3 w-3" />
                </Button>
              </>
            )}
            <Button
              onClick={handleEdit}
              variant="secondary"
              size="sm"
              className="text-xs px-2 py-1 h-7"
            >
              {existingNote ? <Edit className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        <CollapsibleContent className="mt-2">
          <div className="rounded-lg bg-muted/20 border p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-16">
                <div className="text-muted-foreground animate-pulse text-sm">Loading material notes...</div>
              </div>
            ) : existingNote ? (
              <div className="bg-background rounded-md p-3 border">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-sm">Material Notes</h5>
                  <div className="text-xs text-muted-foreground">
                    Last updated: {new Date(existingNote.updated_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-sm font-mono whitespace-pre-wrap max-h-40 overflow-y-auto text-foreground">
                  {existingNote.takeoff_notes}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Package className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">No material notes added yet.</p>
                <p className="text-xs text-muted-foreground mt-1">Click the + button to get started.</p>
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
