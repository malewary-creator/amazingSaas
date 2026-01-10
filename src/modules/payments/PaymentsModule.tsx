import { Routes, Route } from 'react-router-dom';
import { PaymentsList } from '@/modules/payments/PaymentsList';
import { PaymentForm } from '@/modules/payments/PaymentForm';
import { PaymentDetails } from '@/modules/payments/PaymentDetails';

function PaymentsModule() {
  return (
    <Routes>
      <Route index element={<PaymentsList />} />
      <Route path="new" element={<PaymentForm />} />
      <Route path=":id" element={<PaymentDetails />} />
      <Route path=":id/edit" element={<PaymentForm />} />
    </Routes>
  );
}

export default PaymentsModule;
