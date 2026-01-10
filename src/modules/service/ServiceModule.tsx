import { Routes, Route, Navigate } from 'react-router-dom';
import { ServiceTicketsList } from './ServiceTicketsList';
import { ServiceTicketForm } from './ServiceTicketForm';
import { ServiceTicketDetails } from './ServiceTicketDetails';

function ServiceModule() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="tickets" replace />} />
      <Route path="tickets" element={<ServiceTicketsList />} />
      <Route path="tickets/new" element={<ServiceTicketForm />} />
      <Route path="tickets/:id" element={<ServiceTicketDetails />} />
      <Route path="tickets/:id/edit" element={<ServiceTicketForm />} />
    </Routes>
  );
}

export default ServiceModule;
