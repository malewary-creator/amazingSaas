import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { inventoryService } from '@/services/inventoryService';
import type { Item, ItemCategory } from '@/types';
import { ArrowLeft } from 'lucide-react';

const CATEGORIES: ItemCategory[] = [
  'Panel', 'Inverter', 'Structure', 'Cable', 'Earthing', 'Protection Device'
];

const UNITS = ['Nos', 'Meter', 'Set', 'Kg', 'Liter', 'Box'];

export const ItemForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    category: '' as ItemCategory | '',
    brand: '',
    model: '',
    specification: '',
    wattage: '',
    capacity: '',
    purchasePrice: '',
    sellingPrice: '',
    mrp: '',
    currentStock: '',
    reorderLevel: '',
    unit: 'Nos',
    hsn: '',
    gstRate: '',
    status: 'active' as 'active' | 'inactive' | 'deleted',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEditMode && id) {
      loadItem(parseInt(id, 10));
    }
  }, [id, isEditMode]);

  const loadItem = async (itemId: number) => {
    try {
      const item = await inventoryService.getItemById(itemId);
      if (item) {
        setFormData({
          name: item.name,
          category: item.category,
          brand: item.brand || '',
          model: item.model || '',
          specification: item.specification || '',
          wattage: item.wattage?.toString() || '',
          capacity: item.capacity?.toString() || '',
          purchasePrice: item.purchasePrice?.toString() || '',
          sellingPrice: item.sellingPrice?.toString() || '',
          mrp: item.mrp?.toString() || '',
          currentStock: item.currentStock?.toString() || '',
          reorderLevel: item.reorderLevel?.toString() || '',
          unit: item.unit || 'Nos',
          hsn: item.hsn || '',
          gstRate: item.gstRate?.toString() || '',
          status: item.status || 'active',
        });
      }
    } catch (error) {
      console.error('Error loading item:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.specification) newErrors.specification = 'Specification is required';
    
    if (formData.purchasePrice && isNaN(parseFloat(formData.purchasePrice))) {
      newErrors.purchasePrice = 'Invalid purchase price';
    }
    if (formData.sellingPrice && isNaN(parseFloat(formData.sellingPrice))) {
      newErrors.sellingPrice = 'Invalid selling price';
    }
    if (formData.gstRate && (isNaN(parseFloat(formData.gstRate)) || parseFloat(formData.gstRate) < 0 || parseFloat(formData.gstRate) > 100)) {
      newErrors.gstRate = 'GST rate must be between 0-100';
    }

    // Category-specific validations
    if (formData.category === 'Panel' && !formData.wattage) {
      newErrors.wattage = 'Wattage is required for panels';
    }
    if (formData.category === 'Inverter' && !formData.capacity) {
      newErrors.capacity = 'Capacity is required for inverters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);

      const itemData: Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'itemCode'> = {
        name: formData.name.trim(),
        category: formData.category as ItemCategory,
        brand: formData.brand.trim() || undefined,
        model: formData.model.trim() || undefined,
        specification: formData.specification.trim() || undefined,
        wattage: formData.wattage ? parseFloat(formData.wattage) : undefined,
        capacity: formData.capacity ? parseFloat(formData.capacity) : undefined,
        purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
        sellingPrice: formData.sellingPrice ? parseFloat(formData.sellingPrice) : undefined,
        mrp: formData.mrp ? parseFloat(formData.mrp) : undefined,
        currentStock: formData.currentStock ? parseFloat(formData.currentStock) : 0,
        reorderLevel: formData.reorderLevel ? parseFloat(formData.reorderLevel) : undefined,
        unit: formData.unit,
        hsn: formData.hsn.trim() || undefined,
        gstRate: formData.gstRate ? parseFloat(formData.gstRate) : undefined,
        status: formData.status,
      };

      if (isEditMode && id) {
        await inventoryService.updateItem(parseInt(id, 10), itemData);
      } else {
        await inventoryService.createItem(itemData);
      }

      navigate('/inventory/items');
    } catch (error: any) {
      alert(error.message || 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/inventory/items')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? 'Edit Item' : 'Add New Item'}
        </h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Basic Information */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Longi Hi-MO 6 Explorer"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as ItemCategory })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Category</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Longi, Growatt"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., LR5-72HIH-585M"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Specification <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.specification}
                onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
                rows={2}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.specification ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Detailed specifications..."
              />
              {errors.specification && <p className="mt-1 text-sm text-red-600">{errors.specification}</p>}
            </div>
          </div>
        </div>

        {/* Category-Specific Fields */}
        {formData.category && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Category Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.category === 'Panel' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wattage (W) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.wattage}
                    onChange={(e) => setFormData({ ...formData, wattage: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.wattage ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., 585"
                  />
                  {errors.wattage && <p className="mt-1 text-sm text-red-600">{errors.wattage}</p>}
                </div>
              )}

              {formData.category === 'Inverter' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity (kW) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.capacity ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., 5.5"
                  />
                  {errors.capacity && <p className="mt-1 text-sm text-red-600">{errors.capacity}</p>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pricing */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price (₹)</label>
              <input
                type="number"
                step="0.01"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.purchasePrice ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.purchasePrice && <p className="mt-1 text-sm text-red-600">{errors.purchasePrice}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (₹)</label>
              <input
                type="number"
                step="0.01"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.sellingPrice ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.sellingPrice && <p className="mt-1 text-sm text-red-600">{errors.sellingPrice}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">MRP (₹)</label>
              <input
                type="number"
                step="0.01"
                value={formData.mrp}
                onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Stock & Unit */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Stock Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
              <input
                type="number"
                step="0.01"
                value={formData.currentStock}
                onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
                disabled={isEditMode}
              />
              {isEditMode && (
                <p className="mt-1 text-xs text-gray-500">Use stock transactions to update stock</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
              <input
                type="number"
                step="0.01"
                value={formData.reorderLevel}
                onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {UNITS.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tax Information */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tax Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">HSN Code</label>
              <input
                type="text"
                value={formData.hsn}
                onChange={(e) => setFormData({ ...formData, hsn: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 8541"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GST Rate (%)</label>
              <input
                type="number"
                step="0.01"
                value={formData.gstRate}
                onChange={(e) => setFormData({ ...formData, gstRate: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.gstRate ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., 12"
              />
              {errors.gstRate && <p className="mt-1 text-sm text-red-600">{errors.gstRate}</p>}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/inventory/items')}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : isEditMode ? 'Update Item' : 'Create Item'}
          </button>
        </div>
      </form>
    </div>
  );
};
