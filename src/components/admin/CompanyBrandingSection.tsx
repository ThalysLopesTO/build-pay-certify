
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Image className="h-5 w-5" />
          <span>Company Branding</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-sm font-medium">Company Logo</Label>
          <p className="text-sm text-muted-foreground mb-4">
            Upload your company logo to appear in the header across all user roles and on invoice PDFs. 
            Max size: 2MB. Supported formats: PNG, JPG. 
            <span className="font-medium text-orange-600">Admin access only.</span>
          </p>

          {logoUrl ? (
            <div className="space-y-4">
              {/* Logo Preview */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center space-x-4">
                  <img
                    src={logoUrl}
                    alt="Company Logo"
                    className="h-12 w-auto object-contain rounded"
                  />
                  <div>
                    <p className="text-sm font-medium">Current Logo</p>
                    <p className="text-xs text-muted-foreground">
                      This logo appears in the header for all users and on invoice PDFs
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Button
                  onClick={handleUploadClick}
                  disabled={isUploading}
                  variant="outline"
                  size="sm"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? 'Uploading...' : 'Replace Logo'}
                </Button>
                <Button
                  onClick={handleRemoveLogo}
                  disabled={isRemoving}
                  variant="outline"
                  size="sm"
                >
                  <X className="h-4 w-4 mr-2" />
                  {isRemoving ? 'Removing...' : 'Remove Logo'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600 mb-4">No logo uploaded</p>
              <Button
                onClick={handleUploadClick}
                disabled={isUploading}
                className="w-full sm:w-auto"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Upload Company Logo'}
              </Button>
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
      </CardContent>
    </Card>
  );
};

export default CompanyBrandingSection;
