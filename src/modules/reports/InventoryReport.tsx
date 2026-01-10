import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Download, Package, AlertTriangle, 
  TrendingDown, DollarSign, BarChart3
} from 'lucide-react';
import { reportsService } from '../../services/reportsService';

interface InventoryData {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStock: number;
  categoryBreakdown: Array<{ category: string; count: number; value: number }>;
  topValueItems: Array<{ name: string; value: number }>;
}

const InventoryReport: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [inventoryData, setInventoryData] = useState<InventoryData | null>(null);

  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = async () => {
    try {
      setLoading(true);
      const data = await reportsService.getInventoryReport();
      setInventoryData(data);
    } catch (error) {
      console.error('Error loading inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    alert('PDF export functionality will be implemented with a library like jsPDF');
  };

  const exportToExcel = () => {
    alert('Excel export functionality will be implemented with a library like xlsx');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading inventory data...</div>
      </div>
    );
  }

  if (!inventoryData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">No data available</div>
      </div>
    );
  }

  const maxCategoryValue = Math.max(...inventoryData.categoryBreakdown.map(c => c.value), 1);
  const totalItems = inventoryData.categoryBreakdown.reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/reports')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory Report</h1>
            <p className="text-sm text-gray-500 mt-1">Stock analysis and inventory valuation</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={exportToPDF}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>PDF</span>
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Package className="h-8 w-8 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">{inventoryData.totalItems}</div>
          <div className="text-blue-100 text-sm">Total Items</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-8 w-8 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">₹{inventoryData.totalValue.toLocaleString()}</div>
          <div className="text-green-100 text-sm">Total Value</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <TrendingDown className="h-8 w-8 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">{inventoryData.lowStockItems}</div>
          <div className="text-yellow-100 text-sm">Low Stock Items</div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="h-8 w-8 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">{inventoryData.outOfStock}</div>
          <div className="text-red-100 text-sm">Out of Stock</div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Inventory by Category</h2>
          <BarChart3 className="h-5 w-5 text-gray-400" />
        </div>
        <div className="space-y-5">
          {inventoryData.categoryBreakdown.map((category, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{category.category}</span>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-gray-900">₹{category.value.toLocaleString()}</span>
                      <span className="text-xs text-gray-500 ml-2">({category.count} items)</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Dual Progress Bars */}
              <div className="space-y-1">
                {/* Value Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-gradient-to-r from-green-500 to-green-600 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${(category.value / maxCategoryValue) * 100}%` }}
                  />
                </div>
                {/* Count Bar */}
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-gradient-to-r from-blue-400 to-blue-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${(category.count / totalItems) * 100}%` }}
                  />
                </div>
              </div>
              
              <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                <span>{((category.value / inventoryData.totalValue) * 100).toFixed(1)}% of total value</span>
                <span>{((category.count / totalItems) * 100).toFixed(1)}% of total items</span>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Row */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-semibold">{inventoryData.categoryBreakdown.length}</span> categories
            </div>
            <div className="text-sm text-gray-900 font-semibold">
              Total: ₹{inventoryData.totalValue.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Value Items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Top Value Items</h2>
          <div className="space-y-3">
            {inventoryData.topValueItems.slice(0, 8).map((item, index) => {
              const colors = [
                'bg-yellow-500',
                'bg-gray-400',
                'bg-orange-500',
                'bg-blue-500',
                'bg-green-500',
                'bg-purple-500',
                'bg-pink-500',
                'bg-indigo-500',
              ];
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 ${colors[index]} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                      {index + 1}
                    </div>
                    <div className="font-medium text-gray-900 text-sm">{item.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">₹{item.value.toLocaleString()}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stock Alerts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Stock Alerts & Summary</h2>
          
          <div className="space-y-4">
            {/* Out of Stock Alert */}
            <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-1">Out of Stock</h3>
                  <p className="text-sm text-red-700">
                    <span className="font-bold text-lg">{inventoryData.outOfStock}</span> items are completely out of stock
                  </p>
                  <p className="text-xs text-red-600 mt-1">Immediate action required!</p>
                </div>
              </div>
            </div>

            {/* Low Stock Warning */}
            <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
              <div className="flex items-start">
                <TrendingDown className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-900 mb-1">Low Stock Warning</h3>
                  <p className="text-sm text-yellow-700">
                    <span className="font-bold text-lg">{inventoryData.lowStockItems}</span> items are running low
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">Consider reordering soon</p>
                </div>
              </div>
            </div>

            {/* Healthy Stock */}
            <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
              <div className="flex items-start">
                <Package className="h-5 w-5 text-green-600 mt-0.5 mr-3" />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 mb-1">Healthy Stock</h3>
                  <p className="text-sm text-green-700">
                    <span className="font-bold text-lg">
                      {inventoryData.totalItems - inventoryData.lowStockItems - inventoryData.outOfStock}
                    </span> items have adequate stock
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {(((inventoryData.totalItems - inventoryData.lowStockItems - inventoryData.outOfStock) / inventoryData.totalItems) * 100).toFixed(1)}% of inventory
                  </p>
                </div>
              </div>
            </div>

            {/* Inventory Value */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-blue-700 mb-1">Total Inventory Value</div>
                  <div className="text-2xl font-bold text-blue-900">
                    ₹{inventoryData.totalValue.toLocaleString()}
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-blue-700" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryReport;
