/**
 * Invoices Module
 * GST-compliant invoice generation and payment tracking
 */

import { Routes, Route } from 'react-router-dom';
import { InvoicesList } from './InvoicesList';
import { InvoiceForm } from './InvoiceForm';
import { InvoiceDetails } from './InvoiceDetails';

function InvoicesModule() {
  return (
    <Routes>
      <Route index element={<InvoicesList />} />
      <Route path="new" element={<InvoiceForm />} />
      <Route path=":id" element={<InvoiceDetails />} />
      <Route path=":id/edit" element={<InvoiceForm />} />
    </Routes>
  );
}

export default InvoicesModule;
