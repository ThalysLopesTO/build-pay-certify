
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <div>
              <CardTitle>Material Takeoff Notes</CardTitle>
              <p className="text-sm text-muted-foreground">
                {existingNote ? 'Free-form material list and notes' : 'No material notes yet'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {existingNote && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleView}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportTxt}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </>
            )}
            <Button
              onClick={handleEdit}
              size="sm"
            >
              {existingNote ? (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Notes
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Notes
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading material notes...</div>
          </div>
        ) : existingNote ? (
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Material Notes Preview</h4>
                <div className="text-sm text-muted-foreground">
                  Last updated: {new Date(existingNote.updated_at).toLocaleDateString()}
                </div>
              </div>
              <div className="text-sm font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                {existingNote.takeoff_notes.substring(0, 500)}
                {existingNote.takeoff_notes.length > 500 && (
                  <div className="text-muted-foreground mt-2">
                    ... ({existingNote.takeoff_notes.length - 500} more characters)
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No material notes yet</h3>
            <p className="text-muted-foreground mb-4">
              Start by adding material takeoff notes for this jobsite.
            </p>
            <Button onClick={handleEdit}>
              <Plus className="h-4 w-4 mr-2" />
              Add Material Notes
            </Button>
          </div>
        )}
      </CardContent>

      <MaterialTakeoffNotesEditor
        jobsiteId={jobsiteId}
        jobsiteName={jobsiteName}
        open={showEditor}
        onClose={() => setShowEditor(false)}
      />
    </Card>
  );
};

export default JobsiteMaterialTakeoff;
