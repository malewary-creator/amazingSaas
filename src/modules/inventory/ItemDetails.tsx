import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { inventoryService } from '@/services/inventoryService';
import type { Item } from '@/types';
import { 
  ArrowLeft, 
  Edit2, 
  Trash2, 
  Package, 
  DollarSign, 
  AlertTriangle,
  Tag,
  Layers,
  Zap,
  Gauge,
  Building2
} from 'lucide-react';

export const ItemDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadItem();
  }, [id]);

  const loadItem = async () => {
    if (!id) {
      setError('No item ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const itemData = await inventoryService.getItemById(parseInt(id, 10));
      if (itemData) {
        setItem(itemData);
      } else {
        setError('Item not found');
      }
    } catch (err) {
      console.error('Error loading item:', err);
      setError('Failed to load item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!item?.id) return;
    try {
      setDeleting(true);
      await inventoryService.deleteItem(item.id);
      navigate('/inventory/items', { replace: true });
    } catch (err) {
      alert('Failed to delete item');
      setDeleting(false);
    }
  };

  const getStockStatusColor = (item: Item): string => {
    if (!item.currentStock) return 'text-red-600 bg-red-50';
    if (item.reorderLevel && item.currentStock <= item.reorderLevel) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  const getStockStatusLabel = (item: Item): string => {
    if (!item.currentStock) return 'Out of Stock';
    if (item.reorderLevel && item.currentStock <= item.reorderLevel) return 'Low Stock';
    return 'In Stock';
  };

  const getStatusBadgeColor = (status: string): string => {
    if (status === 'active') return 'bg-green-100 text-green-800';
    if (status === 'inactive') return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Loading item details...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/inventory/items')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Inventory
        </button>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-red-900 mb-2">Item Not Found</h2>
          <p className="text-red-700 mb-4">{error || 'The item you are looking for does not exist.'}</p>
          <button
            onClick={() => navigate('/inventory/items')}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Return to Inventory
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/inventory/items')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Inventory
        </button>

        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/inventory/items/${item.id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            <Edit2 className="w-5 h-5" />
            Edit Item
          </button>
          <button
            onClick={() => setDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
          >
            <Trash2 className="w-5 h-5" />
            Delete
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 rounded-lg">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Item?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <span className="font-semibold">{item.name}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{item.name}</h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-gray-600">
                    {item.category} {item.brand && `• ${item.brand}`} {item.model && `• ${item.model}`}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(item.status || 'active')}`}>
                    {(item.status || 'active').charAt(0).toUpperCase() + (item.status || 'active').slice(1)}
                  </span>
                </div>
              </div>
              <div className={`text-center px-4 py-3 rounded-lg ${getStockStatusColor(item)}`}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1">Stock Status</p>
                <p className="text-2xl font-bold">{getStockStatusLabel(item)}</p>
              </div>
            </div>

            {item.itemCode && (
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Item Code:</span> {item.itemCode}
              </p>
            )}
          </div>

          {/* Specifications */}
          {(item.specification || item.wattage || item.capacity) && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                Specifications
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {item.specification && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 font-semibold uppercase mb-1">Specification</p>
                    <p className="text-gray-900">{item.specification}</p>
                  </div>
                )}
                {item.wattage && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 font-semibold uppercase mb-1 flex items-center gap-1">
                      <Zap className="w-4 h-4" /> Wattage
                    </p>
                    <p className="text-gray-900">{item.wattage} W</p>
                  </div>
                )}
                {item.capacity && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 font-semibold uppercase mb-1 flex items-center gap-1">
                      <Gauge className="w-4 h-4" /> Capacity
                    </p>
                    <p className="text-gray-900">{item.capacity}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pricing Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Pricing
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-600 font-semibold uppercase mb-1">Purchase Price</p>
                <p className="text-2xl font-bold text-blue-900">
                  ₹{item.purchasePrice?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || 'N/A'}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs text-green-600 font-semibold uppercase mb-1">Selling Price</p>
                <p className="text-2xl font-bold text-green-900">
                  ₹{item.sellingPrice?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || 'N/A'}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-xs text-purple-600 font-semibold uppercase mb-1">MRP</p>
                <p className="text-2xl font-bold text-purple-900">
                  ₹{item.mrp?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || 'N/A'}
                </p>
              </div>
            </div>

            {item.purchasePrice && item.sellingPrice && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Margin:</span> {' '}
                  <span className="font-bold text-green-600">
                    ₹{(item.sellingPrice - item.purchasePrice).toLocaleString('en-IN', { maximumFractionDigits: 2 })} 
                    ({(((item.sellingPrice - item.purchasePrice) / item.purchasePrice) * 100).toFixed(2)}%)
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Tax Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-gray-600" />
              Tax & Compliance
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {item.hsn && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 font-semibold uppercase mb-1">HSN Code</p>
                  <p className="text-gray-900 font-mono">{item.hsn}</p>
                </div>
              )}
              {item.gstRate && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 font-semibold uppercase mb-1">GST Rate</p>
                  <p className="text-gray-900">{item.gstRate}%</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Stock & Units */}
        <div className="space-y-6">
          {/* Stock Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Stock Information
            </h2>
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-600 font-semibold uppercase mb-1">Current Stock</p>
                <p className="text-3xl font-bold text-blue-900">{item.currentStock || 0}</p>
                <p className="text-xs text-blue-600 mt-1">{item.unit || 'Nos'}</p>
              </div>

              {item.reorderLevel && (
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-xs text-orange-600 font-semibold uppercase mb-1">Reorder Level</p>
                  <p className="text-2xl font-bold text-orange-900">{item.reorderLevel} {item.unit || 'Nos'}</p>
                </div>
              )}

              {item.currentStock !== undefined && item.reorderLevel && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        item.currentStock <= item.reorderLevel ? 'bg-red-600' : 'bg-green-600'
                      }`}
                      style={{
                        width: `${Math.min((item.currentStock / (item.reorderLevel * 2)) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-600">
                    {item.currentStock <= item.reorderLevel
                      ? `Below reorder level by ${item.reorderLevel - item.currentStock}`
                      : `${item.currentStock - item.reorderLevel} units above reorder level`}
                  </p>
                </div>
              )}

              {item.currentStock !== undefined && (
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs text-purple-600 font-semibold uppercase mb-1">Stock Value</p>
                  <p className="text-xl font-bold text-purple-900">
                    ₹{((item.currentStock || 0) * (item.purchasePrice || 0)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Unit Information */}
          {item.unit && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-gray-600" />
                Unit
              </h2>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{item.unit}</p>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">Quick Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Total SKUs:</span>
                <span className="font-semibold text-blue-900">1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Category:</span>
                <span className="font-semibold text-blue-900">{item.category}</span>
              </div>
              {item.brand && (
                <div className="flex justify-between">
                  <span className="text-blue-700">Brand:</span>
                  <span className="font-semibold text-blue-900">{item.brand}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetails;
