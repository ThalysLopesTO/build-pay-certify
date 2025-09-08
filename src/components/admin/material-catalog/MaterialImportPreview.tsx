import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, XCircle, ArrowLeft, Upload } from 'lucide-react';
import { ValidatedRow, generateImportSummary } from '@/utils/materialImportUtils';
import { useMaterialImport } from '@/hooks/useMaterialImport';

interface MaterialImportPreviewProps {
  validatedRows: ValidatedRow[];
  existingItems: any[];
  onBack: () => void;
  onClose: () => void;
}

export const MaterialImportPreview: React.FC<MaterialImportPreviewProps> = ({
  validatedRows,
  existingItems,
  onBack,
  onClose,
}) => {
  const { importMaterials, isImporting } = useMaterialImport();

  const summary = useMemo(() => 
    generateImportSummary(validatedRows, existingItems), 
    [validatedRows, existingItems]
  );

  const previewRows = validatedRows.slice(0, 20); // Show first 20 rows
  const hasMoreRows = validatedRows.length > 20;

  const handleImport = () => {
    const validMaterials = validatedRows
      .filter(row => row.validation.status !== 'error')
      .map(row => row.data);

    importMaterials(
      { materials: validMaterials, existingItems },
      {
        onSuccess: () => {
          onClose();
        }
      }
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ok':
        return <Badge variant="outline" className="text-green-600 border-green-600">OK</Badge>;
      case 'warning':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Warning</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 flex-1 overflow-hidden">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Rows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{validatedRows.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-600">To Add</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.toAdd}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-600">To Update</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{summary.toUpdate}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-600">Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.skipped}</div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Table */}
      <Card className="flex-1 overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Preview{hasMoreRows && ` (First 20 of ${validatedRows.length} rows)`}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <div className="space-y-2 p-4">
              {previewRows.map((row) => (
                <div
                  key={row.row}
                  className="flex items-center gap-4 p-3 border rounded-lg bg-background"
                >
                  <div className="flex items-center gap-2 min-w-[60px]">
                    {getStatusIcon(row.validation.status)}
                    <span className="text-sm text-muted-foreground">#{row.row}</span>
                  </div>
                  
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <div className="font-medium">{row.data.name}</div>
                      <div className="text-muted-foreground">{row.data.category}</div>
                    </div>
                    <div>
                      <Badge variant="outline">{row.data.unit}</Badge>
                    </div>
                    <div>
                      {row.data.sku && (
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {row.data.sku}
                        </code>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(row.validation.status)}
                      {row.validation.messages.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {row.validation.messages[0]}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Upload
        </Button>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={isImporting || summary.toAdd + summary.toUpdate === 0}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {isImporting ? 'Importing...' : `Import ${summary.toAdd + summary.toUpdate} Items`}
          </Button>
        </div>
      </div>

      {/* Error Summary */}
      {summary.errors.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Import Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-32">
              <ul className="text-sm space-y-1">
                {summary.errors.map((error, index) => (
                  <li key={index} className="text-red-600">• {error}</li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};