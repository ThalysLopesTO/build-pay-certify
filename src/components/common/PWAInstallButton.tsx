import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

const PWAInstallButton = () => {
  const { isInstallable, isInstalled, promptInstall } = usePWA();

  if (isInstalled || !isInstallable) {
    return null;
  }

  return (
    <Button
      onClick={promptInstall}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      <Download className="h-4 w-4" />
      Install App
    </Button>
  );
};

export default PWAInstallButton;