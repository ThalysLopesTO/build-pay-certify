
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, User } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CompanyRegistrationFormProps {
  formData: {
    companyName: string;
    companyEmail: string;
    companyPhone: string;
    companyAddress: string;
    adminFirstName: string;
    adminLastName: string;
    adminEmail: string;
    password: string;
  };
  isLoading: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const CompanyRegistrationForm: React.FC<CompanyRegistrationFormProps> = ({
  formData,
  isLoading,
  onInputChange,
  onSubmit
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Registration</CardTitle>
        <CardDescription>
          Fill out the form below to request access for your construction company
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Company Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Company Information
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={onInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="companyEmail">Company Email *</Label>
                <Input
                  id="companyEmail"
                  name="companyEmail"
                  type="email"
                  value={formData.companyEmail}
                  onChange={onInputChange}
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyPhone">Phone Number</Label>
                <Input
                  id="companyPhone"
                  name="companyPhone"
                  type="tel"
                  value={formData.companyPhone}
                  onChange={onInputChange}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="companyAddress">Company Address</Label>
              <Textarea
                id="companyAddress"
                name="companyAddress"
                value={formData.companyAddress}
                onChange={onInputChange}
                rows={2}
              />
            </div>
          </div>

          {/* Admin User Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
              <User className="h-5 w-5 mr-2" />
              Administrator Account
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="adminFirstName">First Name *</Label>
                <Input
                  id="adminFirstName"
                  name="adminFirstName"
                  value={formData.adminFirstName}
                  onChange={onInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="adminLastName">Last Name *</Label>
                <Input
                  id="adminLastName"
                  name="adminLastName"
                  value={formData.adminLastName}
                  onChange={onInputChange}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="adminEmail">Admin Email (Login) *</Label>
              <Input
                id="adminEmail"
                name="adminEmail"
                type="email"
                value={formData.adminEmail}
                onChange={onInputChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={onInputChange}
                required
                minLength={6}
              />
            </div>
          </div>

          <div className="flex space-x-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Submitting...' : 'Submit Registration'}
            </Button>
            <Link to="/login">
              <Button variant="outline" type="button">
                Back to Login
              </Button>
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CompanyRegistrationForm;
