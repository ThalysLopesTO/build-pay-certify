
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, FileText, Download, Trash2, Plus, Eye, AlertCircle } from 'lucide-react';
import { useMaterialTakeoffNotes, MaterialTakeoffNote } from '@/hooks/useMaterialTakeoffNotes';
import { useJobsites } from '@/hooks/useJobsites';
import MaterialTakeoffNotesEditor from './MaterialTakeoffNotesEditor';

const MaterialTakeoffNotesTable: React.FC = () => {
  const { notes, isLoading, deleteNote, error } = useMaterialTakeoffNotes();
  const { data: jobsites = [], isLoading: jobsitesLoading, error: jobsitesError } = useJobsites();
  const [selectedJobsite, setSelectedJobsite] = useState<{ id: string; name: string } | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [viewMode, setViewMode] = useState<'view' | 'edit'>('edit');

  console.log('MaterialTakeoffNotesTable Debug:', {
    notesCount: notes?.length,
    jobsitesCount: jobsites?.length,
    isLoading,
    jobsitesLoading,
    error,
    jobsitesError
  });

  // Get jobsites that don't have takeoff notes yet
  const availableJobsites = jobsites.filter(
    jobsite => !notes.some(note => note.jobsite_id === jobsite.id)
  );

  const handleEdit = (note: MaterialTakeoffNote) => {
    setSelectedJobsite({ id: note.jobsite_id, name: note.jobsite_name });
    setViewMode('edit');
    setShowEditor(true);
  };

  const handleView = (note: MaterialTakeoffNote) => {
    setSelectedJobsite({ id: note.jobsite_id, name: note.jobsite_name });
    setViewMode('view');
    setShowEditor(true);
  };

  const handleAddNew = (jobsite: { id: string; name: string }) => {
    setSelectedJobsite(jobsite);
    setViewMode('edit');
    setShowEditor(true);
  };

  const handleDelete = async (note: MaterialTakeoffNote) => {
    if (confirm(`Are you sure you want to delete the material takeoff notes for "${note.jobsite_name}"?`)) {
      deleteNote.mutate(note.id);
    }
  };

  const handleExportTxt = (note: MaterialTakeoffNote) => {
    const content = `Material Takeoff Notes - ${note.jobsite_name}
Address: ${note.jobsite_address || 'N/A'}
Created: ${new Date(note.created_at).toLocaleDateString()}
Last Updated: ${new Date(note.updated_at).toLocaleDateString()}

${note.takeoff_notes}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.jobsite_name.replace(/[^a-z0-9]/gi, '_')}_material_takeoff.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Error state
  if (error || jobsitesError) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">Error Loading Material Takeoffs</h3>
              <p className="text-muted-foreground mb-4">
                {error?.message || jobsitesError?.message || 'Failed to load material takeoff data'}
              </p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoading || jobsitesLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading material takeoff notes...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add New Section */}
      {availableJobsites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add Material Takeoff Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableJobsites.map(jobsite => (
                <div key={jobsite.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{jobsite.name}</div>
                    {jobsite.address && (
                      <div className="text-sm text-muted-foreground">{jobsite.address}</div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddNew(jobsite)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Notes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Material Takeoff Notes</CardTitle>
        </CardHeader>
        <CardContent>
          {notes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No material takeoff notes yet</h3>
              <p className="text-muted-foreground">
                {jobsites.length === 0 
                  ? 'Create some jobsites first, then you can add material takeoff notes for them.'
                  : 'Start by adding material takeoff notes for your jobsites above.'
                }
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Jobsite</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Notes Preview</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="w-40">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notes.map((note) => (
                    <TableRow key={note.id}>
                      <TableCell className="font-medium">
                        {note.jobsite_name}
                      </TableCell>
                      <TableCell>
                        {note.jobsite_address || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          {note.takeoff_notes ? (
                            <div className="text-sm text-muted-foreground truncate">
                              {note.takeoff_notes.substring(0, 100)}
                              {note.takeoff_notes.length > 100 && '...'}
                            </div>
                          ) : (
                            <Badge variant="secondary">Empty</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(note.updated_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(note)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(note)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExportTxt(note)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(note)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editor Dialog */}
      {selectedJobsite && (
        <MaterialTakeoffNotesEditor
          jobsiteId={selectedJobsite.id}
          jobsiteName={selectedJobsite.name}
          open={showEditor}
          onClose={() => {
            setShowEditor(false);
            setSelectedJobsite(null);
          }}
        />
      )}
    </div>
  );
};

export default MaterialTakeoffNotesTable;
