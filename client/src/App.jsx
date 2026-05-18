import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import MaterialIn from './pages/Material-In';
import MaterialTransfer from './pages/Material-Transfer';
import MaterialOut from './pages/Material-Out';
import JobReport from './pages/JobReport';
import JobReportDetail from './pages/JobReportDetail';
import SellerReport from './pages/SellerReport';
import SellerReportDetail from './pages/SellerReportDetail';
import UtilityDashboard from './pages/UtilityDashboard';
import BackupManagement from './pages/BackupManagement';
import SystemRestore from './pages/SystemRestore';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          {/* Redirect root to material-in */}
          <Route index element={<Navigate to="/material-in" replace />} />
          
          {/* Main Pages */}
          <Route path="material-in" element={<MaterialIn />} />
          <Route path="material-transfer" element={<MaterialTransfer />} />
          <Route path="material-out" element={<MaterialOut />} />
          
          {/* Job Reports */}
          <Route path="job-report" element={<JobReport />} />
          <Route path="job-report/:id" element={<JobReportDetail />} />
          
          {/* Seller Reports */}
          <Route path="seller-report" element={<SellerReport />} />
          <Route path="seller-report/:id" element={<SellerReportDetail />} />

          {/* Utility Tools */}
          <Route path="utility" element={<UtilityDashboard />} />
          <Route path="utility/backup" element={<BackupManagement />} />
          <Route path="utility/restore" element={<SystemRestore />} />
          
          {/* 404 Fallback */}
          <Route path="*" element={
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <h1 className="text-4xl font-bold text-[#1E293B]">404</h1>
              <p className="text-[#64748B]">Page not found</p>
              <Navigate to="/material-in" replace />
            </div>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
