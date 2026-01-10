import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { inventoryService } from '@/services/inventoryService';
import { projectsService } from '@/services/projectsService';
import type { StockLedger, TransactionType, Item, Project } from '@/types';
import { Package, TrendingUp, TrendingDown, Calendar, Filter, Download } from 'lucide-react';

const TRANSACTION_TYPES: TransactionType[] = [
  'Purchase', 'Sale', 'Transfer to Site', 'Return from Site', 
  'Damage', 'Adjustment', 'Opening Stock'
];

export const StockLedgerView: React.FC = () => {
  const navigate = useNavigate();
  const [ledger, setLedger] = useState<StockLedger[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [filters, setFilters] = useState<{ itemId: string; transactionType: TransactionType | ''; projectId: string }>({
    itemId: '',
    transactionType: '',
    projectId: '',
  });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    itemId: '',
    transactionType: '' as TransactionType | '',
    quantity: '',
    rate: '',
    transactionDate: new Date().toISOString().split('T')[0],
    referenceNumber: '',
    projectId: '',
    supplierId: '',
    remarks: '',
  });
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const itemsData = await inventoryService.getItems();
      setItems(itemsData);
      const projectsData = await projectsService.getProjects();
      setProjects(projectsData);

      let ledgerData = await inventoryService.getStockLedger({
        itemId: filters.itemId ? parseInt(filters.itemId, 10) : undefined,
        transactionType: filters.transactionType || undefined,
      });
      if (filters.projectId) {
        ledgerData = ledgerData.filter(l => l.projectId === parseInt(filters.projectId, 10));
      }
      setLedger(ledgerData);
    } catch (error) {
      console.error('Error loading stock ledger:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.itemId || !addForm.transactionType || !addForm.quantity) {
      alert('Please fill all required fields');
      return;
    }

    try {
      await inventoryService.recordStockTransaction({
        itemId: parseInt(addForm.itemId, 10),
        transactionType: addForm.transactionType as TransactionType,
        quantity: parseFloat(addForm.quantity),
        rate: addForm.rate ? parseFloat(addForm.rate) : undefined,
        amount: addForm.rate ? parseFloat(addForm.rate) * parseFloat(addForm.quantity) : undefined,
        transactionDate: new Date(addForm.transactionDate),
        referenceNumber: addForm.referenceNumber || undefined,
        projectId: addForm.projectId ? parseInt(addForm.projectId, 10) : undefined,
        supplierId: addForm.supplierId ? parseInt(addForm.supplierId, 10) : undefined,
        remarks: addForm.remarks || undefined,
        unit: items.find(i => i.id === parseInt(addForm.itemId, 10))?.unit || 'Nos',
      });

      setShowAddModal(false);
      setAddForm({
        itemId: '',
        transactionType: '',
        quantity: '',
        rate: '',
        transactionDate: new Date().toISOString().split('T')[0],
        referenceNumber: '',
        projectId: '',
        supplierId: '',
        remarks: '',
      });
      loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to add transaction');
    }
  };

  const getItemName = (itemId: number): string => {
    const item = items.find(i => i.id === itemId);
    return item ? `${item.itemCode} - ${item.name}` : 'Unknown Item';
  };

  const getTransactionIcon = (type: TransactionType) => {
    const inbound = ['Purchase', 'Return from Site', 'Opening Stock', 'Adjustment'];
    return inbound.includes(type) ? (
      <TrendingUp className="w-5 h-5 text-green-600" />
    ) : (
      <TrendingDown className="w-5 h-5 text-red-600" />
    );
  };

  const getTransactionColor = (type: TransactionType): string => {
    const inbound = ['Purchase', 'Return from Site', 'Opening Stock', 'Adjustment'];
    return inbound.includes(type) ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/inventory/items')}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Items
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium"
            >
              Stock Ledger
            </button>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => alert('Export functionality coming soon')}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Export
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Package className="w-5 h-5" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="font-medium text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={filters.itemId}
            onChange={(e) => setFilters({ ...filters, itemId: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Items</option>
            {items.map(item => (
              <option key={item.id} value={item.id}>
                {item.itemCode} - {item.name}
              </option>
            ))}
          </select>

          <select
            value={filters.transactionType}
            onChange={(e) => setFilters({ ...filters, transactionType: e.target.value as TransactionType | '' })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Transaction Types</option>
            {TRANSACTION_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select
            value={filters.projectId}
            onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id?.toString() || ''}>{p.projectId} • {p.systemSize}kW</option>
            ))}
          </select>

          <button
            onClick={() => setFilters({ itemId: '', transactionType: '', projectId: '' })}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ledger.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Start recording stock movements to track inventory.
                    </p>
                  </td>
                </tr>
              ) : (
                ledger.map(entry => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(entry.transactionDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {getItemName(entry.itemId)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(entry.transactionType)}
                        <span className={`text-sm font-medium ${getTransactionColor(entry.transactionType)}`}>
                          {entry.transactionType}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-semibold ${getTransactionColor(entry.transactionType)}`}>
                        {entry.quantity} {entry.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.rate ? `₹${entry.rate.toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.amount ? `₹${entry.amount.toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-blue-600">
                        {entry.balanceQuantity} {entry.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {entry.referenceNumber || entry.remarks || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Stock Transaction</h3>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={addForm.itemId}
                    onChange={(e) => setAddForm({ ...addForm, itemId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Item</option>
                    {items.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.itemCode} - {item.name} (Current: {item.currentStock} {item.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transaction Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={addForm.transactionType}
                    onChange={(e) => setAddForm({ ...addForm, transactionType: e.target.value as TransactionType })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Type</option>
                    {TRANSACTION_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={addForm.transactionDate}
                    onChange={(e) => setAddForm({ ...addForm, transactionDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={addForm.quantity}
                    onChange={(e) => setAddForm({ ...addForm, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rate (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={addForm.rate}
                    onChange={(e) => setAddForm({ ...addForm, rate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
                  <input
                    type="text"
                    value={addForm.referenceNumber}
                    onChange={(e) => setAddForm({ ...addForm, referenceNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="PO/Invoice/Challan number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                  <select
                    value={addForm.projectId}
                    onChange={(e) => setAddForm({ ...addForm, projectId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">None</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id?.toString() || ''}>{p.projectId} • {p.systemSize}kW</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                  <textarea
                    value={addForm.remarks}
                    onChange={(e) => setAddForm({ ...addForm, remarks: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
