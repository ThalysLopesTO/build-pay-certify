import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Phone, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PhoneContact {
  id: string;
  name: string;
  phone_number: string;
  extension: string;
  category: string;
  notes: string;
}

interface PhoneContactCardProps {
  contact: PhoneContact;
  canManage: boolean;
  onEdit: (contact: PhoneContact) => void;
  onDelete: (contact: PhoneContact) => void;
}

const PhoneContactCard: React.FC<PhoneContactCardProps> = ({
  contact,
  canManage,
  onEdit,
  onDelete,
}) => {
  const { toast } = useToast();

  const getCategoryBadge = (category: string) => {
    const configs: Record<string, string> = {
      Employee: 'bg-blue-100 text-blue-800 border-blue-200',
      Foreman: 'bg-orange-100 text-orange-800 border-orange-200',
      Admin: 'bg-purple-100 text-purple-800 border-purple-200',
      Management: 'bg-purple-100 text-purple-800 border-purple-200',
      Sales: 'bg-green-100 text-green-800 border-green-200',
      Client: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      Supplier: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      Emergency: 'bg-red-100 text-red-800 border-red-200',
    };
    
    const config = configs[category] || 'bg-gray-100 text-gray-800 border-gray-200';
    
    return (
      <Badge variant="outline" className={`${config} border text-xs`}>
        {category}
      </Badge>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleCall = () => {
    const phoneNumber = contact.phone_number.replace(/\D/g, '');
    window.location.href = `tel:${phoneNumber}${contact.extension ? `,${contact.extension}` : ''}`;
  };

  const handleCopy = async () => {
    const phoneText = contact.extension 
      ? `${contact.phone_number} ext. ${contact.extension}`
      : contact.phone_number;
    
    await navigator.clipboard.writeText(phoneText);
    toast({
      title: "Copied to clipboard",
      description: phoneText,
    });
  };

  const formatPhoneNumber = () => {
    if (contact.extension) {
      return `${contact.phone_number} ext. ${contact.extension}`;
    }
    return contact.phone_number;
  };

  return (
    <Card className="shadow-sm hover:shadow-md transition-all">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with Avatar and Name */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-semibold text-sm">
                {getInitials(contact.name)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base line-clamp-1">
                {contact.name}
              </h3>
              <div className="mt-1">
                {getCategoryBadge(contact.category)}
              </div>
            </div>
          </div>

          {/* Phone Number with Actions */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <a
                href={`tel:${contact.phone_number.replace(/\D/g, '')}${contact.extension ? `,${contact.extension}` : ''}`}
                className="flex-1 text-sm font-medium text-primary hover:underline"
              >
                {formatPhoneNumber()}
              </a>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-8 w-8 p-0"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Notes */}
            {contact.notes && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {contact.notes}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="default"
              size="sm"
              onClick={handleCall}
              className="flex-1 h-8"
            >
              <Phone className="h-3.5 w-3.5 mr-1" />
              Call
            </Button>
            {canManage && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(contact)}
                  className="h-8 px-3"
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(contact)}
                  className="h-8 px-3 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PhoneContactCard;
