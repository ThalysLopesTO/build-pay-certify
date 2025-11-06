import React from 'react';
import PullToRefresh from 'react-simple-pull-to-refresh';
import PhoneContactCard from './PhoneContactCard';
import { Card, CardContent } from '@/components/ui/card';
import { Phone } from 'lucide-react';

interface PhoneContact {
  id: string;
  name: string;
  phone_number: string;
  extension: string;
  category: string;
  notes: string;
}

interface PhoneMobileListProps {
  contacts: PhoneContact[];
  canManage: boolean;
  onEdit: (contact: PhoneContact) => void;
  onDelete: (contact: PhoneContact) => void;
  onRefresh: () => Promise<void>;
  isLoading: boolean;
}

const PhoneMobileList: React.FC<PhoneMobileListProps> = ({
  contacts,
  canManage,
  onEdit,
  onDelete,
  onRefresh,
  isLoading,
}) => {
  // Group contacts by category
  const groupedContacts = React.useMemo(() => {
    const groups: Record<string, PhoneContact[]> = {};
    
    contacts.forEach((contact) => {
      if (!groups[contact.category]) {
        groups[contact.category] = [];
      }
      groups[contact.category].push(contact);
    });
    
    // Sort contacts within each category alphabetically
    Object.keys(groups).forEach((category) => {
      groups[category].sort((a, b) => a.name.localeCompare(b.name));
    });
    
    return groups;
  }, [contacts]);

  const sortedCategories = Object.keys(groupedContacts).sort();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-8 text-center">
          <Phone className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
          <p className="text-muted-foreground">No contacts found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your filters or add new contacts
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <PullToRefresh onRefresh={onRefresh} pullingContent="">
      <div className="space-y-4 pb-20">
        {sortedCategories.map((category) => (
          <div key={category} className="space-y-3">
            {/* Category Header */}
            <div className="flex items-center justify-between sticky top-0 bg-background py-2 z-10">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {category}
              </h3>
              <span className="text-xs text-muted-foreground">
                {groupedContacts[category].length}
              </span>
            </div>
            
            {/* Contacts in Category */}
            <div className="space-y-3">
              {groupedContacts[category].map((contact) => (
                <PhoneContactCard
                  key={contact.id}
                  contact={contact}
                  canManage={canManage}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </PullToRefresh>
  );
};

export default PhoneMobileList;
