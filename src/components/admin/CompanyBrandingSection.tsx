
import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import { Upload, X, Image } from 'lucide-react';

const CompanyBrandingSection = () => {
  const {
    logoUrl,
    isLoading,
    uploadLogo,
    isUploading,
    removeLogo,
    isRemoving
  } = useCompanyLogo();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a PNG or JPG file.');
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB.');
        return;
      }

      uploadLogo(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveLogo = () => {
    if (window.confirm('Are you sure you want to remove the company logo?')) {
      removeLogo();
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Image className="h-5 w-5" />
            <span>Company Branding</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-medium text-foreground mb-2 block">Company Logo</Label>
        <p className="text-sm text-muted-foreground mb-6">
          Upload your company logo to display in the header and on invoice PDFs. 
          <br />
          <span className="font-medium">Recommended:</span> 400px × 70px • Max size: 2MB • Formats: PNG, JPG, JPEG
        </p>

        {logoUrl ? (
          <div className="space-y-6">
            {/* Logo Preview */}
            <div className="border border-border rounded-xl p-6 bg-muted/30">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <img
                    src={logoUrl}
                    alt="Company Logo"
                    className="h-16 w-auto object-contain rounded-lg border border-border bg-background p-2"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-foreground mb-1">Current Company Logo</h4>
                  <p className="text-xs text-muted-foreground">
                    This logo appears in the application header and on all generated invoice PDFs.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleUploadClick}
                disabled={isUploading}
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Replace Logo'}
              </Button>
              <Button
                onClick={handleRemoveLogo}
                disabled={isRemoving}
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none"
              >
                <X className="h-4 w-4 mr-2" />
                {isRemoving ? 'Removing...' : 'Remove Logo'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-12 text-center bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="max-w-sm mx-auto space-y-4">
              <div className="p-4 bg-muted rounded-full w-fit mx-auto">
                <Image className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">No logo uploaded</h4>
                <p className="text-xs text-muted-foreground">
                  Upload your company logo to enhance your brand presence
                </p>
              </div>
              <Button
                onClick={handleUploadClick}
                disabled={isUploading}
                size="sm"
                className="mt-4"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Upload Company Logo'}
              </Button>
            </div>
          </div>
        )}

        {/* Hidden File Input */}
        <Input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default CompanyBrandingSection;
