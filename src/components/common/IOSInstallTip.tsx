import React, { useState, useEffect } from 'react';
import { X, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';

const IOSInstallTip = () => {
  const [showTip, setShowTip] = useState(false);

  useEffect(() => {
    // Only show on iOS Safari when not in standalone mode
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = (window.navigator as any).standalone === true;
    const isDismissed = localStorage.getItem('ios-install-tip-dismissed') === 'true';
    
    if (isIOS && !isStandalone && !isDismissed) {
      setShowTip(true);
    }
  }, []);

  const dismissTip = (dontShowAgain = false) => {
    setShowTip(false);
    if (dontShowAgain) {
      localStorage.setItem('ios-install-tip-dismissed', 'true');
    }
  };

  if (!showTip) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-card border rounded-lg shadow-lg p-4">
      <div className="flex items-start gap-3">
        <div className="bg-primary/10 p-2 rounded-full">
          <Share className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">Install StackBuild</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Add StackBuild to your Home Screen: tap Share → Add to Home Screen.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => dismissTip(true)}
              className="text-xs"
            >
              Don't show again
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dismissTip(false)}
              className="text-xs"
            >
              Not now
            </Button>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => dismissTip(false)}
          className="p-1 h-auto"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default IOSInstallTip;