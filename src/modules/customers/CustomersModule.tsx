/**
 * Customers Module
 * Main module for customer management with routing
 */

import { Routes, Route } from 'react-router-dom';
import CustomersList from './CustomersList';
import CustomerForm from './CustomerForm';
import CustomerDetails from './CustomerDetails';

export default function CustomersModule() {
  return (
    <Routes>
      <Route index element={<CustomersList />} />
      <Route path="new" element={<CustomerForm />} />
      <Route path=":id" element={<CustomerDetails />} />
      <Route path=":id/edit" element={<CustomerForm />} />
    </Routes>
  );
}
