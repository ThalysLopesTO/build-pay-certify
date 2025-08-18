import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import PWAInstallModal from './PWAInstallModal';

const PWAInstallButton = () => {
  const { isInstallable, isInstalled, promptInstall } = usePWA();
  const [showModal, setShowModal] = useState(false);

  if (isInstalled || !isInstallable) {
    return null;
  }

  const handleInstallClick = () => {
    setShowModal(true);
  };

  const handleInstall = () => {
    setShowModal(false);
    promptInstall();
  };

  return (
    <>
      <Button
        onClick={handleInstallClick}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        Install app
      </Button>
      
      <PWAInstallModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onInstall={handleInstall}
      />
    </>
  );
};

export default PWAInstallButton;