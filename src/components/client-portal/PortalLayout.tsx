import { Outlet } from 'react-router-dom';
import { PortalSidebar } from './PortalSidebar';

export function PortalLayout() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <PortalSidebar />
      <main className="flex-1 lg:ml-0">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
