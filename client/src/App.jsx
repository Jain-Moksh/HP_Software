import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import MaterialIn from './pages/Material-In';
import MaterialOut from './pages/Material-Out';
import JobReport from './pages/JobReport';
import JobReportDetail from './pages/JobReportDetail';
import SellerReport from './pages/SellerReport';
import SellerReportDetail from './pages/SellerReportDetail';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedJobber, setSelectedJobber] = useState(null);
  const [selectedSeller, setSelectedSeller] = useState(null);

  const handleNavigate = (page) => {
    setActivePage(page);
    setSelectedJobber(null);
    setSelectedSeller(null);
  };

  const handleViewJobReport = (jobber) => {
    setSelectedJobber(jobber);
    setActivePage('job-report-detail');
  };

  const handleViewSellerReport = (seller) => {
    setSelectedSeller(seller);
    setActivePage('seller-report-detail');
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'materials':
        return <MaterialIn />;
      case 'material-out':
        return <MaterialOut />;
      case 'job-report':
        return <JobReport onViewReport={handleViewJobReport} />;
      case 'job-report-detail':
        return (
          <JobReportDetail 
            jobber={selectedJobber} 
            onBack={() => setActivePage('job-report')} 
          />
        );
      case 'seller-report':
        return <SellerReport onViewReport={handleViewSellerReport} />;
      case 'seller-report-detail':
        return (
          <SellerReportDetail 
            seller={selectedSeller} 
            onBack={() => setActivePage('seller-report')} 
          />
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC] font-sans">
      {/* Left sidebar */}
      <Sidebar activePage={activePage} onNavigate={handleNavigate} />

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {activePage !== 'job-report-detail' && activePage !== 'seller-report-detail' && <Header />}

        {/* Page area */}
        <main className="flex-1 overflow-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
