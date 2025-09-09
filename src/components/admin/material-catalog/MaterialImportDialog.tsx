import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MaterialImportPreview } from './MaterialImportPreview';
import { parseFile, generateTemplate, mapColumns, ValidatedRow } from '@/utils/materialImportUtils';
import { useMaterialCategoriesOptions } from '@/hooks/useMaterialCatalog';

interface MaterialImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingItems: any[];
}

export const MaterialImportDialog: React.FC<MaterialImportDialogProps> = ({
  open,
  onOpenChange,
  existingItems,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [validatedRows, setValidatedRows] = useState<ValidatedRow[]>([]);
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const categories = useMaterialCategoriesOptions();
  const { toast } = useToast();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    if (!allowedTypes.includes(selectedFile.type) && 
        !selectedFile.name.endsWith('.xlsx') && 
        !selectedFile.name.endsWith('.xls') && 
        !selectedFile.name.endsWith('.csv')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an Excel (.xlsx, .xls) or CSV file.",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);

    try {
      const data = await parseFile(selectedFile);
      if (data.length < 2) {
        throw new Error('File must contain at least a header row and one data row');
      }

      const headers = data[0].map(h => String(h).trim());
      const mappedData = mapColumns(headers, data, categories);
      
      setValidatedRows(mappedData);
      setStep('preview');
    } catch (error: any) {
      toast({
        title: "File Parse Error",
        description: error.message || "Failed to parse the uploaded file.",
        variant: "destructive",
      });
    }
  };

  const downloadTemplate = (format: 'excel' | 'csv') => {
    const blob = generateTemplate(format);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `material-catalog-template.${format === 'excel' ? 'xlsx' : 'csv'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setFile(null);
    setValidatedRows([]);
    setStep('upload');
    onOpenChange(false);
  };

  const handleBackToUpload = () => {
    setStep('upload');
    setValidatedRows([]);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {step === 'upload' ? 'Import Materials' : 'Preview Import'}
          </DialogTitle>
        </DialogHeader>

        {step === 'upload' ? (
          <div className="space-y-6">
            {/* Template Download */}
            <div className="space-y-3">
              <Label className="text-base font-medium">1. Download Template</Label>
              <p className="text-sm text-muted-foreground">
                Start with our template to ensure correct formatting:
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => downloadTemplate('excel')}
                  className="flex items-center gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Download Excel Template
                </Button>
                <Button
                  variant="outline"
                  onClick={() => downloadTemplate('csv')}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Download CSV Template
                </Button>
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-3">
              <Label className="text-base font-medium">2. Upload Your File</Label>
              <p className="text-sm text-muted-foreground">
                Upload your completed Excel (.xlsx) or CSV file:
              </p>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                </div>
                {file && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Upload className="h-4 w-4" />
                    {file.name}
                  </div>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="rounded-lg border p-4 bg-muted/50">
              <h4 className="font-medium mb-2">Import Guidelines:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Name</strong> and <strong>Category</strong> are required fields</li>
                <li>• Include size/specs in the Name field (e.g., "Drywall 5/8" x 9'")</li>
                <li>• Unit must be from our predefined list (pcs, box, bundle, etc.)</li>
                <li>• SKU is optional but helps with duplicate detection</li>
                <li>• Active can be true/false, yes/no, or 1/0</li>
                <li>• Existing items will be updated based on SKU or Name+Category+Unit match</li>
              </ul>
            </div>
          </div>
        ) : (
          <MaterialImportPreview
            validatedRows={validatedRows}
            existingItems={existingItems}
            onBack={handleBackToUpload}
            onClose={handleClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};