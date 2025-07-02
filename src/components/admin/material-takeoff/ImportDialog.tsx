import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import Papa from 'papaparse';
import { CreateMaterialTakeoff } from '@/hooks/useMaterialTakeoffsEnhanced';

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (data: CreateMaterialTakeoff[]) => void;
  jobsites: Array<{ id: string; name: string }>;
  companyId: string;
  userId: string;
}

interface ParsedRow {
  material_name: string;
  unit: string;
  total_qty_estimated: number;
  unit_price: number;
  vendor?: string;
  category?: string;
  priority?: number;
  isValid: boolean;
  errors: string[];
}

const ImportDialog: React.FC<ImportDialogProps> = ({
  open,
  onClose,
  onImport,
  jobsites,
  companyId,
  userId,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [selectedJobsite, setSelectedJobsite] = useState<string>('');
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [step, setStep] = useState<'upload' | 'preview' | 'mapping'>('upload');
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [headers, setHeaders] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  const parseFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const data = results.data as any[];
        const headers = Object.keys(data[0] || {});
        setHeaders(headers);
        
        // Auto-detect column mappings
        const autoMapping: Record<string, string> = {};
        headers.forEach(header => {
          const lowerHeader = header.toLowerCase();
          if (lowerHeader.includes('material') || lowerHeader.includes('name')) {
            autoMapping.material_name = header;
          } else if (lowerHeader.includes('unit') && !lowerHeader.includes('price')) {
            autoMapping.unit = header;
          } else if (lowerHeader.includes('qty') || lowerHeader.includes('quantity')) {
            autoMapping.total_qty_estimated = header;
          } else if (lowerHeader.includes('price') || lowerHeader.includes('cost')) {
            autoMapping.unit_price = header;
          } else if (lowerHeader.includes('vendor') || lowerHeader.includes('supplier')) {
            autoMapping.vendor = header;
          } else if (lowerHeader.includes('category') || lowerHeader.includes('type')) {
            autoMapping.category = header;
          } else if (lowerHeader.includes('priority')) {
            autoMapping.priority = header;
          }
        });
        
        setColumnMapping(autoMapping);
        setStep('mapping');
      },
      error: (error) => {
        console.error('Parse error:', error);
      }
    });
  };

  const validateAndPreview = () => {
    if (!file) return;
    
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const data = results.data as any[];
        const validated: ParsedRow[] = data.map((row, index) => {
          const errors: string[] = [];
          
          const material_name = row[columnMapping.material_name];
          const unit = row[columnMapping.unit];
          const total_qty_estimated = parseFloat(row[columnMapping.total_qty_estimated]);
          const unit_price = parseFloat(row[columnMapping.unit_price]);
          const vendor = row[columnMapping.vendor];
          const category = row[columnMapping.category];
          const priority = parseInt(row[columnMapping.priority]) || 1;
          
          if (!material_name) errors.push('Material name is required');
          if (!unit) errors.push('Unit is required');
          if (isNaN(total_qty_estimated) || total_qty_estimated < 0) errors.push('Valid quantity is required');
          if (isNaN(unit_price) || unit_price < 0) errors.push('Valid unit price is required');
          
          return {
            material_name,
            unit,
            total_qty_estimated,
            unit_price,
            vendor,
            category,
            priority,
            isValid: errors.length === 0,
            errors,
          };
        }).filter(row => row.material_name); // Remove empty rows
        
        setParsedData(validated);
        setStep('preview');
      }
    });
  };

  const handleImport = () => {
    if (!selectedJobsite) {
      alert('Please select a jobsite');
      return;
    }
    
    const validData = parsedData.filter(row => row.isValid);
    const importData: CreateMaterialTakeoff[] = validData.map(row => ({
      jobsite_id: selectedJobsite,
      company_id: companyId,
      material_name: row.material_name,
      unit: row.unit,
      total_qty_estimated: row.total_qty_estimated,
      unit_price: row.unit_price,
      vendor: row.vendor,
      category: row.category,
      priority: row.priority,
      created_by: userId,
    }));
    
    onImport(importData);
    handleClose();
  };

  const handleClose = () => {
    setFile(null);
    setParsedData([]);
    setStep('upload');
    setColumnMapping({});
    setHeaders([]);
    setSelectedJobsite('');
    onClose();
  };

  const validRows = parsedData.filter(row => row.isValid).length;
  const invalidRows = parsedData.length - validRows;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Material Takeoffs</DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="file">Select CSV File</Label>
              <Input
                id="file"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="mt-1"
              />
            </div>
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Expected columns: Material Name, Unit, Quantity, Unit Price, Vendor (optional), Category (optional), Priority (optional)
              </AlertDescription>
            </Alert>
          </div>
        )}

        {step === 'mapping' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Map Columns</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Material Name *</Label>
                <Select value={columnMapping.material_name} onValueChange={(value) => setColumnMapping(prev => ({...prev, material_name: value}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map(header => (
                      <SelectItem key={header} value={header}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Unit *</Label>
                <Select value={columnMapping.unit} onValueChange={(value) => setColumnMapping(prev => ({...prev, unit: value}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map(header => (
                      <SelectItem key={header} value={header}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Quantity *</Label>
                <Select value={columnMapping.total_qty_estimated} onValueChange={(value) => setColumnMapping(prev => ({...prev, total_qty_estimated: value}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map(header => (
                      <SelectItem key={header} value={header}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Unit Price *</Label>
                <Select value={columnMapping.unit_price} onValueChange={(value) => setColumnMapping(prev => ({...prev, unit_price: value}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map(header => (
                      <SelectItem key={header} value={header}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Vendor (Optional)</Label>
                <Select value={columnMapping.vendor} onValueChange={(value) => setColumnMapping(prev => ({...prev, vendor: value}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {headers.map(header => (
                      <SelectItem key={header} value={header}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category (Optional)</Label>
                <Select value={columnMapping.category} onValueChange={(value) => setColumnMapping(prev => ({...prev, category: value}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {headers.map(header => (
                      <SelectItem key={header} value={header}>{header}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep('upload')}>Back</Button>
              <Button onClick={validateAndPreview}>Preview Data</Button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Preview Import Data</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{validRows} valid</span>
                </div>
                {invalidRows > 0 && (
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm">{invalidRows} invalid</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label>Target Jobsite *</Label>
              <Select value={selectedJobsite} onValueChange={setSelectedJobsite}>
                <SelectTrigger>
                  <SelectValue placeholder="Select jobsite" />
                </SelectTrigger>
                <SelectContent>
                  {jobsites.map(jobsite => (
                    <SelectItem key={jobsite.id} value={jobsite.id}>{jobsite.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="max-h-64 overflow-y-auto border rounded">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Errors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.slice(0, 50).map((row, index) => (
                    <TableRow key={index} className={!row.isValid ? 'bg-red-50' : ''}>
                      <TableCell>
                        {row.isValid ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell>{row.material_name}</TableCell>
                      <TableCell>{row.unit}</TableCell>
                      <TableCell>{row.total_qty_estimated}</TableCell>
                      <TableCell>${row.unit_price}</TableCell>
                      <TableCell>{row.vendor || '-'}</TableCell>
                      <TableCell>{row.category || '-'}</TableCell>
                      <TableCell>
                        {row.errors.length > 0 && (
                          <div className="text-xs text-red-600">
                            {row.errors.join(', ')}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {parsedData.length > 50 && (
                <div className="p-2 text-center text-sm text-muted-foreground">
                  Showing first 50 rows of {parsedData.length} total rows
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep('mapping')}>Back</Button>
              <Button onClick={handleImport} disabled={validRows === 0 || !selectedJobsite}>
                Import {validRows} Items
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImportDialog;