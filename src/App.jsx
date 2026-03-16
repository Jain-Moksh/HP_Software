import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import MaterialIn from './pages/Material-In';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');

  const Page = activePage === 'materials' ? MaterialIn : Dashboard;

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC] font-sans">
      {/* Left sidebar */}
      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />

        {/* Page area */}
        <main className="flex-1 overflow-auto">
          <Page />
        </main>
      </div>
    </div>
  );
}
