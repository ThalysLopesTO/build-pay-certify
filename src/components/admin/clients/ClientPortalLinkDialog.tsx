import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { Client } from '@/hooks/useClients';

interface ClientPortalLinkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
}

export function ClientPortalLinkDialog({ isOpen, onClose, client }: ClientPortalLinkDialogProps) {
  const [copied, setCopied] = useState(false);
  const portalUrl = `${window.location.origin}/client/${client.portal_token}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenPortal = () => {
    window.open(portalUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Client Portal Link</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Share this link with {client.client_name} to give them access to their quotes and invoices.
            </p>
            <p className="text-sm text-muted-foreground">
              No login required - the link is unique and secure.
            </p>
          </div>

          <div className="flex gap-2">
            <Input value={portalUrl} readOnly />
            <Button onClick={handleCopy} variant="outline">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleOpenPortal} variant="outline" className="flex-1">
              <ExternalLink className="w-4 h-4 mr-2" />
              Preview Portal
            </Button>
            <Button onClick={onClose} className="flex-1">
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
