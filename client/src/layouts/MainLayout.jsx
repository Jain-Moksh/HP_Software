import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { getPageInfo } from '../constants/pageConfig';

export default function MainLayout() {
  const [headerActions, setHeaderActions] = useState(null);
  const location = useLocation();
  const { title, subtitle } = getPageInfo(location.pathname);

  // Check if we should show the global header
  // Detail pages in this app handle their own headers
  const isDetailPage = location.pathname.includes('/job-report/') && location.pathname !== '/job-report' ||
                       location.pathname.includes('/seller-report/') && location.pathname !== '/seller-report';

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC] font-sans">
      {/* Left sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {!isDetailPage && (
          <Header title={title} subtitle={subtitle} actions={headerActions} />
        )}

        {/* Page area */}
        <main className="flex-1 overflow-auto">
          <Outlet context={{ setHeaderActions }} />
        </main>
      </div>
    </div>
  );
}
