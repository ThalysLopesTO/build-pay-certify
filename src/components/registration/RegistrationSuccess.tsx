
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const RegistrationSuccess: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <CardTitle>Registration Submitted</CardTitle>
          <CardDescription>
            Your company registration has been submitted for approval. 
            You will receive an email notification once your account is approved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/login">
            <Button className="w-full">Return to Login</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegistrationSuccess;
