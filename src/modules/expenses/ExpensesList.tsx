import React, { useState, useEffect } from 'react';
import { expenseService } from '@/services/expenseService';
import type { DailyExpense, ExpenseCategory } from '@/types';
import {
  Plus,
  Search,
  Filter,
  AlertCircle,
} from 'lucide-react';

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Tea / Coffee',
  'Naasta / Food',
  'Water Can',
  'Travel / Fuel',
  'Misc Site Expenses',
  'Other',
];

export const ExpensesList: React.FC = () => {
  const [expenses, setExpenses] = useState<DailyExpense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<DailyExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | ''>('');
  const [statusFilter, setStatusFilter] = useState<'Pending' | 'Approved' | 'Rejected' | ''>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '' as ExpenseCategory | '',
    amount: '',
    description: '',
    site: '',
    projectId: '',
  });

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const data = await expenseService.getPendingExpenses();
      setExpenses(data);
      applyFilters(data);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (list: DailyExpense[]) => {
    let filtered = list;

    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter(
        e =>
          e.description?.toLowerCase().includes(term) ||
          e.site?.toLowerCase().includes(term)
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter(e => e.category === categoryFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter(e => e.status === statusFilter);
    }

    setFilteredExpenses(filtered);
  };

  useEffect(() => {
    applyFilters(expenses);
  }, [search, categoryFilter, statusFilter, expenses]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.category || !newExpense.amount) {
      alert('Please fill required fields');
      return;
    }

    try {
      await expenseService.addExpense({
        date: new Date(newExpense.date),
        category: newExpense.category as ExpenseCategory,
        amount: parseFloat(newExpense.amount),
        description: newExpense.description,
        site: newExpense.site,
        projectId: newExpense.projectId ? parseInt(newExpense.projectId) : undefined,
        status: 'Pending',
      });

      loadExpenses();
      setShowAddModal(false);
      setNewExpense({
        date: new Date().toISOString().split('T')[0],
        category: '',
        amount: '',
        description: '',
        site: '',
        projectId: '',
      });
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Error adding expense');
    }
  };

  const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Daily Expenses</h1>
          <p className="text-sm text-gray-500 mt-1">Manage operational site expenses</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Total Expenses (This Period)</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">₹ {totalAmount.toLocaleString('en-IN')}</p>
          <p className="text-xs text-gray-500 mt-1">{filteredExpenses.length} entries</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Pending Approval</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">
            {filteredExpenses.filter(e => e.status === 'Pending').length}
          </p>
          <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Approved</p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">
            {filteredExpenses.filter(e => e.status === 'Approved').length}
          </p>
          <p className="text-xs text-gray-500 mt-1">Accepted expenses</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
        <div className="flex items-center gap-2 text-gray-800 font-medium">
          <Filter className="w-4 h-4" />
          Filters
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search site, description"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value as ExpenseCategory | '')}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {EXPENSE_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as 'Pending' | 'Approved' | 'Rejected' | '')}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>

          <button
            onClick={() => {
              setSearch('');
              setCategoryFilter('');
              setStatusFilter('');
            }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-2 text-gray-800 font-semibold">No expenses found</p>
            <p className="text-sm text-gray-500">Try adjusting your filters or add an expense.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Site</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredExpenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(exp.date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      ₹ {exp.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{exp.site || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{exp.description || '-'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          exp.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-700'
                            : exp.status === 'Pending'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {exp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Expense</h3>
            </div>
            <form onSubmit={handleAddExpense} className="space-y-4 px-6 py-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={newExpense.date}
                  onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={newExpense.category}
                  onChange={e => setNewExpense({ ...newExpense, category: e.target.value as ExpenseCategory })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Category</option>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newExpense.amount}
                  onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site / Location</label>
                <input
                  type="text"
                  value={newExpense.site}
                  onChange={e => setNewExpense({ ...newExpense, site: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="Site name or location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newExpense.description}
                  onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes..."
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Add Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
