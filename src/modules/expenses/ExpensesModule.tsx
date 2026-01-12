import { Routes, Route } from 'react-router-dom';
import { ExpensesList } from './ExpensesList';

function ExpensesModule() {
  return (
    <Routes>
      <Route path="/" element={<ExpensesList />} />
    </Routes>
  );
}

export default ExpensesModule;
