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
  const [headerActions, setHeaderActions] = useState(null);

  const handleNavigate = (page) => {
    setActivePage(page);
    setSelectedJobber(null);
    setSelectedSeller(null);
    setHeaderActions(null); // Clear actions on navigation
  };

  const handleViewJobReport = (jobber) => {
    setSelectedJobber(jobber);
    setActivePage('job-report-detail');
  };

  const handleViewSellerReport = (seller) => {
    setSelectedSeller(seller);
    setActivePage('seller-report-detail');
  };

  const getPageInfo = () => {
    switch (activePage) {
      case 'dashboard':
        return { title: 'Accounting Dashboard', subtitle: 'Financial Management System' };
      case 'materials':
        return { title: 'Material In Records', subtitle: 'Manage and track all material entries' };
      case 'material-out':
        return { title: 'Material Out Records', subtitle: 'Track and manage material shipments' };
      case 'job-report':
        return { title: 'Jobber Reports', subtitle: 'Overview of all jobbers and stocks' };
      case 'job-report-detail':
        return { 
          title: selectedJobber ? `Job Report: ${selectedJobber.name}` : 'Job Report Detail', 
          subtitle: 'Detailed transaction and stock history' 
        };
      case 'seller-report':
        return { title: 'Seller Reports', subtitle: 'Overview of all sellers and balances' };
      case 'seller-report-detail':
        return { 
          title: selectedSeller ? `Seller Report: ${selectedSeller.name}` : 'Seller Report Detail', 
          subtitle: 'Detailed seller transaction history' 
        };
      default:
        return { title: 'Accounting in Hemant Plast', subtitle: 'Financial Management System' };
    }
  };

  const { title, subtitle } = getPageInfo();

  const renderPage = () => {
    const commonProps = { setHeaderActions };
    switch (activePage) {
      case 'dashboard':
        return <Dashboard {...commonProps} />;
      case 'materials':
        return <MaterialIn {...commonProps} />;
      case 'material-out':
        return <MaterialOut {...commonProps} />;
      case 'job-report':
        return <JobReport onViewReport={handleViewJobReport} {...commonProps} />;
      case 'job-report-detail':
        return (
          <JobReportDetail 
            jobber={selectedJobber} 
            onBack={() => setActivePage('job-report')} 
            {...commonProps}
          />
        );
      case 'seller-report':
        return <SellerReport onViewReport={handleViewSellerReport} {...commonProps} />;
      case 'seller-report-detail':
        return (
          <SellerReportDetail 
            seller={selectedSeller} 
            onBack={() => setActivePage('seller-report')} 
            {...commonProps}
          />
        );
      default:
        return <Dashboard {...commonProps} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC] font-sans">
      {/* Left sidebar */}
      <Sidebar activePage={activePage} onNavigate={handleNavigate} />

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {activePage !== 'job-report-detail' && activePage !== 'seller-report-detail' && (
          <Header title={title} subtitle={subtitle} actions={headerActions} />
        )}

        {/* Page area */}
        <main className="flex-1 overflow-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
