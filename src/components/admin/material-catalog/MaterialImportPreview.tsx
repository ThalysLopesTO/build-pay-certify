import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VirtualizedTable } from '@/components/ui/virtualized-table';
import { CheckCircle, AlertTriangle, XCircle, ArrowLeft, Upload, Info } from 'lucide-react';
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
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ok':
        return (
          <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
            Ready
          </Badge>
        );
      case 'warning':
        return (
          <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
            Warning
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300">
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Unknown
          </Badge>
        );
    }
  };

  const columns = [
    {
      header: 'Status',
      accessor: 'status',
      width: 120,
      cell: (item: ValidatedRow) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(item.validation.status)}
          {getStatusBadge(item.validation.status)}
        </div>
      ),
    },
    {
      header: 'Material Name',
      accessor: 'name',
      width: 250,
      cell: (item: ValidatedRow) => (
        <div className="space-y-1">
          <div className="font-medium text-foreground">{item.data.name}</div>
          <div className="text-sm text-muted-foreground">Row #{item.row}</div>
        </div>
      ),
    },
    {
      header: 'Category',
      accessor: 'category',
      width: 180,
      cell: (item: ValidatedRow) => (
        <Badge variant="secondary" className="font-normal">
          {item.data.category}
        </Badge>
      ),
    },
    {
      header: 'SKU',
      accessor: 'sku',
      width: 120,
      cell: (item: ValidatedRow) => (
        item.data.sku ? (
          <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
            {item.data.sku}
          </code>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )
      ),
    },
    {
      header: 'Unit',
      accessor: 'unit',
      width: 100,
      cell: (item: ValidatedRow) => (
        <Badge variant="outline" className="font-normal">
          {item.data.unit}
        </Badge>
      ),
    },
    {
      header: 'Messages',
      accessor: 'messages',
      width: 300,
      cell: (item: ValidatedRow) => (
        item.validation.messages.length > 0 ? (
          <div className="space-y-1">
            {item.validation.messages.map((message, index) => (
              <div
                key={index}
                className={`text-sm ${
                  item.validation.status === 'error'
                    ? 'text-red-600'
                    : item.validation.status === 'warning'
                    ? 'text-amber-600'
                    : 'text-muted-foreground'
                }`}
              >
                {message}
              </div>
            ))}
          </div>
        ) : (
          <span className="text-sm text-green-600">No issues</span>
        )
      ),
    },
  ];

  // Calculate progress percentage
  const progressPercentage = Math.round(
    ((summary.toAdd + summary.toUpdate) / validatedRows.length) * 100
  );

  return (
    <div className="flex flex-col h-full max-h-[calc(90vh-8rem)]">
      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 flex-shrink-0">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{validatedRows.length}</div>
            <div className="text-xs text-muted-foreground mt-1">Ready for review</div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-700">New Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{summary.toAdd}</div>
            <div className="text-xs text-muted-foreground mt-1">Will be added</div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-700">Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">{summary.toUpdate}</div>
            <div className="text-xs text-muted-foreground mt-1">Will be updated</div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-700">Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{summary.skipped}</div>
            <div className="text-xs text-muted-foreground mt-1">Need attention</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Indicator */}
      <Card className="mb-4 flex-shrink-0">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Import Readiness</span>
            <span className="text-sm text-muted-foreground">
              {summary.toAdd + summary.toUpdate} of {validatedRows.length} items ready
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                progressPercentage === 100 ? 'bg-green-500' : 
                progressPercentage >= 80 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Professional Preview Table */}
      <Card className="flex-1 min-h-0 mb-6 flex flex-col">
        <CardHeader className="flex-shrink-0 border-b">
          <CardTitle className="flex items-center justify-between">
            <span>Import Preview</span>
            <span className="text-sm font-normal text-muted-foreground">
              {validatedRows.length} items total
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 min-h-0">
          <VirtualizedTable
            data={validatedRows}
            columns={columns}
            rowHeight={64}
            className="h-full"
          />
        </CardContent>
      </Card>

      {/* Collapsible Error Summary */}
      {summary.errors.length > 0 && (
        <Card className="border-red-200 bg-red-50/50 mb-6 flex-shrink-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-700 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Critical Import Issues ({summary.errors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {summary.errors.map((error, index) => (
                <div key={index} className="text-sm text-red-700 flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">•</span>
                  <span>{error}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Actions */}
      <div className="flex items-center justify-between pt-4 border-t flex-shrink-0">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Upload
        </Button>
        
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={isImporting || summary.toAdd + summary.toUpdate === 0}
            className="flex items-center gap-2 min-w-[140px]"
            size="default"
          >
            <Upload className="h-4 w-4" />
            {isImporting 
              ? 'Importing...' 
              : `Import ${summary.toAdd + summary.toUpdate} Items`
            }
          </Button>
        </div>
      </div>
    </div>
  );
};