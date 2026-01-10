import { Routes, Route, Navigate } from 'react-router-dom';
import { ItemsList } from './ItemsList';
import { ItemForm } from './ItemForm';
import { StockLedgerView } from './StockLedgerView';

function InventoryModule() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="items" replace />} />
      <Route path="items" element={<ItemsList />} />
      <Route path="items/new" element={<ItemForm />} />
      <Route path="items/:id/edit" element={<ItemForm />} />
      <Route path="stock-ledger" element={<StockLedgerView />} />
    </Routes>
  );
}

export default InventoryModule;

