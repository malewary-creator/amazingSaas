/**
 * Leads Module
 * Main module for lead management with routing
 */

import { Routes, Route } from 'react-router-dom';
import LeadsList from './LeadsList';
import LeadForm from './LeadForm';
import LeadDetails from './LeadDetails';

export default function LeadsModule() {
  return (
    <Routes>
      <Route index element={<LeadsList />} />
      <Route path="new" element={<LeadForm />} />
      <Route path=":id" element={<LeadDetails />} />
      <Route path=":id/edit" element={<LeadForm />} />
    </Routes>
  );
}

