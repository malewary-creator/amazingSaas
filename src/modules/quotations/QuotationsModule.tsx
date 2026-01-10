/**
 * Quotations Module
 * Handles quotation generation, pricing, and management
 */

import { Routes, Route } from 'react-router-dom';
import { QuotationsList } from './QuotationsList';
import { ProfessionalQuotationForm } from './ProfessionalQuotationForm';
import { QuotationDetails } from './QuotationDetails';

function QuotationsModule() {
  return (
    <Routes>
      <Route index element={<QuotationsList />} />
      <Route path="new" element={<ProfessionalQuotationForm />} />
      <Route path=":id" element={<QuotationDetails />} />
      <Route path=":id/edit" element={<ProfessionalQuotationForm />} />
    </Routes>
  );
}

export default QuotationsModule;
