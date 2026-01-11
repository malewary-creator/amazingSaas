import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { inventoryService } from '@/services/inventoryService';
import { projectsService } from '@/services/projectsService';
import type { Item, Project, StockLedger, TransactionType } from '@/types';
import {
  ArrowLeft,
  Calendar,
  Download,
  Filter,
  Package,
  RefreshCcw,
  Search,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

const TRANSACTION_TYPES: TransactionType[] = [
  'Purchase',
  'Sale',
  'Transfer to Site',
  'Return from Site',
  'Damage',
  'Adjustment',
  'Opening Stock',
];

const INBOUND_TYPES: TransactionType[] = ['Purchase', 'Return from Site', 'Opening Stock', 'Adjustment'];

export const StockLedgerView: React.FC = () => {
  const navigate = useNavigate();
  const [ledger, setLedger] = useState<StockLedger[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filters, setFilters] = useState<{
    itemId: string;
    transactionType: TransactionType | '';
    projectId: string;
    search: string;
    startDate: string;
    endDate: string;
  }>({
    itemId: '',
    transactionType: '',
    projectId: '',
    search: '',
    startDate: '',
    endDate: '',
  });

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

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const itemsData = await inventoryService.getItems();
      setItems(itemsData);
      const projectsData = await projectsService.getProjects();
      setProjects(projectsData);

      let ledgerData = await inventoryService.getStockLedger({
        itemId: filters.itemId ? parseInt(filters.itemId, 10) : undefined,
        transactionType: filters.transactionType || undefined,
      });

      if (filters.startDate) {
        const start = new Date(filters.startDate).getTime();
        ledgerData = ledgerData.filter(l => new Date(l.transactionDate).getTime() >= start);
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate).getTime();
        ledgerData = ledgerData.filter(l => new Date(l.transactionDate).getTime() <= end + 86400000 - 1);
      }
      if (filters.projectId) {
        ledgerData = ledgerData.filter(l => l.projectId === parseInt(filters.projectId, 10));
      }
      if (filters.search.trim()) {
        const term = filters.search.toLowerCase();
        ledgerData = ledgerData.filter(l => {
          const itemName = getItemName(l.itemId).toLowerCase();
          const ref = (l.referenceNumber || '').toLowerCase();
          const remarks = (l.remarks || '').toLowerCase();
          return itemName.includes(term) || ref.includes(term) || remarks.includes(term);
        });
      }

      setLedger(ledgerData);
    } catch (err) {
      console.error('Error loading stock ledger:', err);
      setError('Unable to load stock ledger. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.itemId || !addForm.transactionType || !addForm.quantity) {
      setError('Please fill all required fields.');
      return;
    }

    if (parseFloat(addForm.quantity) <= 0) {
      setError('Quantity must be greater than zero.');
      return;
    }

    try {
      setSubmitting(true);
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

      handleModalClose();
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to add transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setSubmitting(false);
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
  };

  const getItemName = (itemId: number): string => {
    const item = items.find(i => i.id === itemId);
    return item ? `${item.itemCode} - ${item.name}` : 'Unknown Item';
  };

  const getTransactionIcon = (type: TransactionType) => {
    return INBOUND_TYPES.includes(type) ? (
      <TrendingUp className="w-5 h-5 text-emerald-600" />
    ) : (
      <TrendingDown className="w-5 h-5 text-rose-600" />
    );
  };

  const getTransactionColor = (type: TransactionType): string => {
    return INBOUND_TYPES.includes(type) ? 'text-emerald-600' : 'text-rose-600';
  };

  const summary = useMemo(() => {
    const totals = ledger.reduce(
      (acc, entry) => {
        const isInbound = INBOUND_TYPES.includes(entry.transactionType);
        const qty = entry.quantity || 0;
        const amt = entry.amount || 0;
        if (isInbound) {
          acc.inboundQty += qty;
          acc.inboundValue += amt;
        } else {
          acc.outboundQty += qty;
          acc.outboundValue += amt;
        }
        acc.netQty = acc.inboundQty - acc.outboundQty;
        acc.netValue = acc.inboundValue - acc.outboundValue;
        return acc;
      },
      { inboundQty: 0, outboundQty: 0, netQty: 0, inboundValue: 0, outboundValue: 0, netValue: 0 }
    );

    const topItemId = ledger
      .reduce<Record<number, number>>((map, entry) => {
        map[entry.itemId] = (map[entry.itemId] || 0) + entry.quantity;
        return map;
      }, {});

    const topItem = Object.entries(topItemId)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .map(([id]) => parseInt(id, 10))[0];

    return {
      ...totals,
      topItemName: topItem ? getItemName(topItem) : 'No data',
      totalTransactions: ledger.length,
    };
  }, [ledger]);

  const exportCsv = () => {
    const headers = [
      'Date',
      'Item',
      'Transaction Type',
      'Quantity',
      'Unit',
      'Rate',
      'Amount',
      'Balance',
      'Reference',
      'Remarks',
    ];

    const rows = ledger.map(entry => [
      new Date(entry.transactionDate).toLocaleDateString('en-IN'),
      getItemName(entry.itemId),
      entry.transactionType,
      entry.quantity,
      entry.unit,
      entry.rate ?? '',
      entry.amount ?? '',
      entry.balanceQuantity,
      entry.referenceNumber ?? '',
      entry.remarks ?? '',
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'stock-ledger.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-80">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div>
            <p className="text-sm text-gray-500">Inventory</p>
            <h1 className="text-2xl font-bold text-gray-900">Stock Ledger</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => loadData()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            <RefreshCcw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={exportCsv}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            <Package className="w-4 h-4" />
            Add Transaction
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Inbound Quantity</p>
          <div className="mt-1 flex items-end gap-2">
            <p className="text-2xl font-semibold text-emerald-600">{summary.inboundQty.toFixed(2)}</p>
            <span className="text-xs text-gray-500">units</span>
          </div>
          <p className="text-xs text-emerald-600 mt-1">₹ {summary.inboundValue.toLocaleString('en-IN')}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Outbound Quantity</p>
          <div className="mt-1 flex items-end gap-2">
            <p className="text-2xl font-semibold text-rose-600">{summary.outboundQty.toFixed(2)}</p>
            <span className="text-xs text-gray-500">units</span>
          </div>
          <p className="text-xs text-rose-600 mt-1">₹ {summary.outboundValue.toLocaleString('en-IN')}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Net Movement</p>
          <div className="mt-1 flex items-end gap-2">
            <p className="text-2xl font-semibold text-blue-600">{summary.netQty.toFixed(2)}</p>
            <span className="text-xs text-gray-500">units</span>
          </div>
          <p className="text-xs text-blue-600 mt-1">₹ {summary.netValue.toLocaleString('en-IN')}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Top Moving Item</p>
          <p className="mt-1 text-base font-semibold text-gray-900 leading-tight">{summary.topItemName}</p>
          <p className="text-xs text-gray-500 mt-1">Transactions: {summary.totalTransactions}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-gray-800 font-medium">
          <Filter className="w-4 h-4 text-gray-500" />
          Filters
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search item, reference, remarks"
              className="w-full bg-transparent text-sm text-gray-700 outline-none"
            />
          </div>

          <select
            value={filters.itemId}
            onChange={(e) => setFilters({ ...filters, itemId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Items</option>
            {items.map(item => (
              <option key={item.id} value={item.id}>{item.itemCode} - {item.name}</option>
            ))}
          </select>

          <select
            value={filters.transactionType}
            onChange={(e) => setFilters({ ...filters, transactionType: e.target.value as TransactionType | '' })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Transaction Types</option>
            {TRANSACTION_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select
            value={filters.projectId}
            onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id?.toString() || ''}>{p.projectId} • {p.systemSize}kW</option>
            ))}
          </select>

          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            placeholder="Start date"
          />

          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            placeholder="End date"
          />

          <div className="flex gap-2">
            <button
              onClick={() => setFilters({ itemId: '', transactionType: '', projectId: '', search: '', startDate: '', endDate: '' })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Qty</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rate</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {ledger.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <Calendar className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-2 text-sm font-semibold text-gray-800">No transactions found</p>
                    <p className="text-xs text-gray-500">Adjust filters or add a transaction.</p>
                  </td>
                </tr>
              ) : (
                ledger.map(entry => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {new Date(entry.transactionDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-900">{getItemName(entry.itemId)}</p>
                      {entry.projectId && (
                        <p className="text-xs text-gray-500">Project #{entry.projectId}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-sm font-medium">
                        {getTransactionIcon(entry.transactionType)}
                        <span className={getTransactionColor(entry.transactionType)}>{entry.transactionType}</span>
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
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                      {entry.referenceNumber || entry.remarks || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Quick action</p>
                <h3 className="text-lg font-semibold text-gray-900">Add Stock Transaction</h3>
              </div>
              <button
                onClick={handleModalClose}
                className="rounded-lg px-3 py-1 text-sm text-gray-500 hover:bg-gray-100"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleAddTransaction} className="space-y-4 px-6 py-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item <span className="text-red-500">*</span></label>
                  <select
                    value={addForm.itemId}
                    onChange={(e) => setAddForm({ ...addForm, itemId: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Item</option>
                    {items.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.itemCode} - {item.name} (Stock: {item.currentStock ?? 0} {item.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type <span className="text-red-500">*</span></label>
                  <select
                    value={addForm.transactionType}
                    onChange={(e) => setAddForm({ ...addForm, transactionType: e.target.value as TransactionType })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Type</option>
                    {TRANSACTION_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={addForm.transactionDate}
                    onChange={(e) => setAddForm({ ...addForm, transactionDate: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={addForm.quantity}
                    onChange={(e) => setAddForm({ ...addForm, quantity: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rate (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={addForm.rate}
                    onChange={(e) => setAddForm({ ...addForm, rate: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
                  <input
                    type="text"
                    value={addForm.referenceNumber}
                    onChange={(e) => setAddForm({ ...addForm, referenceNumber: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="PO / Invoice / Challan"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                  <select
                    value={addForm.projectId}
                    onChange={(e) => setAddForm({ ...addForm, projectId: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Add Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
