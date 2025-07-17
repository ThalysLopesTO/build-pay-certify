
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Edit, Plus, FileText, Download, Eye } from 'lucide-react';
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Package className="h-5 w-5 text-primary" />
          <div>
            <h4 className="font-medium">Material Takeoff Notes</h4>
            <p className="text-sm text-muted-foreground">
              {existingNote ? 'Free-form material list and notes' : 'No material notes yet'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {existingNote && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleView}
                className="text-xs px-3 py-1.5 hover:bg-background"
              >
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportTxt}
                className="text-xs px-3 py-1.5 hover:bg-background"
              >
                <Download className="h-3 w-3 mr-1" />
                Export
              </Button>
            </>
          )}
          <Button
            onClick={handleEdit}
            variant="secondary"
            size="sm"
            className="text-xs px-3 py-1.5"
          >
            {existingNote ? (
              <>
                <Edit className="h-3 w-3 mr-1" />
                Edit Notes
              </>
            ) : (
              <>
                <Plus className="h-3 w-3 mr-1" />
                Add Notes
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="rounded-xl bg-slate-50 shadow-inner border p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <div className="text-muted-foreground animate-pulse">Loading material notes...</div>
          </div>
        ) : existingNote ? (
          <div className="bg-background rounded-lg p-4 border shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-medium text-sm">Material Notes Preview</h5>
              <div className="text-xs text-muted-foreground">
                Last updated: {new Date(existingNote.updated_at).toLocaleDateString()}
              </div>
            </div>
            <div className="text-sm font-mono whitespace-pre-wrap max-h-32 overflow-y-auto text-foreground">
              {existingNote.takeoff_notes.substring(0, 500)}
              {existingNote.takeoff_notes.length > 500 && (
                <div className="text-muted-foreground mt-2">
                  ... ({existingNote.takeoff_notes.length - 500} more characters)
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Package className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm italic text-gray-400">No material notes added yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Click "Add Notes" to get started.</p>
          </div>
        )}
      </div>

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
