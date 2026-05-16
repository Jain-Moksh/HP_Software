import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import MaterialIn from './pages/Material-In';
import MaterialOut from './pages/Material-Out';
import JobReport from './pages/JobReport';
import JobReportDetail from './pages/JobReportDetail';
import SellerReport from './pages/SellerReport';
import SellerReportDetail from './pages/SellerReportDetail';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          {/* Redirect root to dashboard */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          {/* Main Pages */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="material-in" element={<MaterialIn />} />
          <Route path="material-out" element={<MaterialOut />} />
          
          {/* Job Reports */}
          <Route path="job-report" element={<JobReport />} />
          <Route path="job-report/:id" element={<JobReportDetail />} />
          
          {/* Seller Reports */}
          <Route path="seller-report" element={<SellerReport />} />
          <Route path="seller-report/:id" element={<SellerReportDetail />} />
          
          {/* 404 Fallback */}
          <Route path="*" element={
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <h1 className="text-4xl font-bold text-[#1E293B]">404</h1>
              <p className="text-[#64748B]">Page not found</p>
              <Navigate to="/dashboard" replace />
            </div>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
