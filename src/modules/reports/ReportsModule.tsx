import { Routes, Route } from 'react-router-dom';
import { ReportsDashboard } from './ReportsDashboard';
import SalesRevenueReport from './SalesRevenueReport';
import PaymentCollectionReport from './PaymentCollectionReport';
import InventoryReport from './InventoryReport';
import ServiceReport from './ServiceReport';
import LeadConversionReport from './LeadConversionReport';
import ProjectReport from './ProjectReport';
import { SystemLogs } from './SystemLogs';

function ReportsModule() {
  return (
    <Routes>
      <Route path="/" element={<ReportsDashboard />} />
      <Route path="sales" element={<SalesRevenueReport />} />
      <Route path="payments" element={<PaymentCollectionReport />} />
      <Route path="inventory" element={<InventoryReport />} />
      <Route path="service" element={<ServiceReport />} />
      <Route path="leads" element={<LeadConversionReport />} />
      <Route path="projects" element={<ProjectReport />} />
      <Route path="logs" element={<SystemLogs />} />
    </Routes>
  );
}

export default ReportsModule;
