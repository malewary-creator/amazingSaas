import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { inventoryService } from '@/services/inventoryService';
import type { Item, ItemCategory } from '@/types';
import { Package, AlertTriangle, TrendingDown, DollarSign, Plus, Edit, Trash2, Search } from 'lucide-react';

const CATEGORIES: ItemCategory[] = [
  'Panel', 'Inverter', 'Structure', 'Cable', 'Earthing', 'Protection Device'
];

export const ItemsList: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [stats, setStats] = useState<{
    totalItems: number;
    totalValue: number;
    lowStockItems: number;
    categories: Record<string, number>;
  }>({ totalItems: 0, totalValue: 0, lowStockItems: 0, categories: {} });
  const [filters, setFilters] = useState<{ category: ItemCategory | ''; status: string }>({
    category: '',
    status: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; item: Item | null }>({
    show: false,
    item: null,
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const itemsData = await inventoryService.getItems(
        filters.category ? { category: filters.category } : undefined
      );
      setItems(itemsData);
      const statsData = await inventoryService.getInventoryStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.item) return;
    try {
      await inventoryService.deleteItem(deleteModal.item.id!);
      setDeleteModal({ show: false, item: null });
      loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to delete item');
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = !searchQuery || 
      item.itemCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !filters.status || item.status === filters.status;
    return matchesSearch && matchesStatus;
  });

  const getStockStatusColor = (item: Item): string => {
    if (!item.currentStock) return 'text-red-600';
    if (item.reorderLevel && item.currentStock <= item.reorderLevel) return 'text-orange-600';
    return 'text-green-600';
  };

  const getStockStatusLabel = (item: Item): string => {
    if (!item.currentStock) return 'Out of Stock';
    if (item.reorderLevel && item.currentStock <= item.reorderLevel) return 'Low Stock';
    return 'In Stock';
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium"
            >
              Items
            </button>
            <button
              onClick={() => navigate('/inventory/stock-ledger')}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Stock Ledger
            </button>
          </div>
        </div>
        <button
          onClick={() => navigate('/inventory/items/new')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Item
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
            </div>
            <Package className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Stock Value</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{stats.totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Stock Alerts</p>
              <p className="text-2xl font-bold text-orange-600">{stats.lowStockItems}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-orange-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Categories</p>
              <p className="text-2xl font-bold text-gray-900">
                {Object.keys(stats.categories).length}
              </p>
            </div>
            <TrendingDown className="w-10 h-10 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by code, name, brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value as ItemCategory | '' })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button
            onClick={() => {
              setFilters({ category: '', status: '' });
              setSearchQuery('');
            }}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name / Specification
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purchase Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Selling Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Package className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No items found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by adding your first inventory item.
                    </p>
                    <div className="mt-6">
                      <button
                        onClick={() => navigate('/inventory/items/new')}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Item
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.itemCode}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-500">
                        {item.brand && `${item.brand} - `}
                        {item.specification}
                      </div>
                      {item.category === 'Panel' && item.wattage && (
                        <div className="text-xs text-gray-500">{item.wattage}W</div>
                      )}
                      {item.category === 'Inverter' && item.capacity && (
                        <div className="text-xs text-gray-500">{item.capacity} kW</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-semibold ${getStockStatusColor(item)}`}>
                        {item.currentStock || 0} {item.unit}
                      </div>
                      <div className="text-xs text-gray-500">{getStockStatusLabel(item)}</div>
                      {item.reorderLevel && (
                        <div className="text-xs text-gray-400">Reorder: {item.reorderLevel}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{item.purchasePrice?.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{item.sellingPrice?.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        item.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => navigate(`/inventory/items/${item.id}`)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        title="View Details"
                      >
                        View
                      </button>
                      <button
                        onClick={() => navigate(`/inventory/items/${item.id}/edit`)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => setDeleteModal({ show: true, item })}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Item</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete "{deleteModal.item?.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal({ show: false, item: null })}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
