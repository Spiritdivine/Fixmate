import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { PublicNavbar } from './PublicNavbar';
import { EditorialFooter } from '../landing-v2/EditorialFooter';

export const PublicLayout: React.FC = () => {
  const { pathname } = useLocation();

  // Scroll to top automatically on route changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#141A16] font-sans antialiased selection:bg-[#133E2B] selection:text-white flex flex-col justify-between overflow-x-clip">
      <PublicNavbar />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <EditorialFooter />
    </div>
  );
};

export default PublicLayout;
