/**
 * Quotation Form Component
 * Create/Edit quotation with dynamic line items and GST calculations
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, Send, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { quotationsService } from '@/services/quotationsService';
import { db } from '@/services/database';
import type { QuotationStatus, QuotationItem } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToastStore } from '@/store/toastStore';
import { useAuthStore } from '@/store/authStore';

interface LineItem extends Omit<QuotationItem, 'id' | 'quotationId' | 'itemId'> {
  tempId: string;
  itemId?: number;
}

export function QuotationForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error } = useToastStore();
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    leadId: '',
    customerId: '',
    quotationDate: new Date().toISOString().split('T')[0],
    validityDate: '',
    
    // System details
    systemSize: '',
    systemType: '',
    solarPanelBrand: '',
    inverterBrand: '',
    
    // Pricing
    discountPercent: '0',
    
    // Terms
    paymentTerms: '',
    deliveryTerms: '',
    warrantyTerms: '',
    termsAndConditions: `1. Prices are valid for ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
2. GST will be charged as applicable
3. Installation charges included
4. Payment terms: 50% advance, 50% on completion
5. Delivery within 7-10 working days from order confirmation`,
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  useEffect(() => {
    loadData();
    if (id) {
      loadQuotation();
    } else {
      // Add default line item
      addLineItem();
    }
  }, [id]);

  const loadData = async () => {
    try {
      const [leadsData, customersData] = await Promise.all([
        db.leads.toArray(),
        db.customers.toArray(),
      ]);
      
      setLeads(leadsData.sort((a, b) => a.leadId.localeCompare(b.leadId)));
      setCustomers(customersData.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
    } catch (err) {
      console.error('Error loading data:', err);
      error('Failed to load data');
    }
  };

  const loadQuotation = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const quotation = await quotationsService.getQuotationWithDetails(parseInt(id));
      if (!quotation) {
        error('Quotation not found');
        navigate('/quotations');
        return;
      }

      setFormData({
        leadId: quotation.leadId?.toString() || '',
        customerId: quotation.customerId?.toString() || '',
        quotationDate: new Date(quotation.quotationDate).toISOString().split('T')[0],
        validityDate: quotation.validityDate 
          ? new Date(quotation.validityDate).toISOString().split('T')[0]
          : '',
        systemSize: quotation.systemSize?.toString() || '',
        systemType: quotation.systemType || '',
        solarPanelBrand: quotation.panelBrand || '',
        inverterBrand: quotation.inverterBrand || '',
        discountPercent: quotation.discountPercent?.toString() || '0',
        paymentTerms: quotation.paymentTerms || '',
        deliveryTerms: quotation.deliveryTerms || '',
        warrantyTerms: quotation.warrantyTerms || '',
        termsAndConditions: quotation.termsAndConditions || '',
      });

      // Load line items
      const items = quotation.items || [];
      setLineItems(
        items.map((item: any, index: number) => ({
          tempId: `item-${index}`,
          lineNumber: item.lineNumber,
          itemName: item.itemName,
          description: item.description || '',
          hsnCode: item.hsnCode || '',
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
          taxableAmount: item.taxableAmount,
          gstRate: item.gstRate,
          gstAmount: item.gstAmount,
          totalAmount: item.totalAmount,
        }))
      );
    } catch (err) {
      console.error('Error loading quotation:', err);
      error('Failed to load quotation');
    } finally {
      setLoading(false);
    }
  };

  const handleLeadChange = async (leadIdNum: string) => {
    setFormData({ ...formData, leadId: leadIdNum });
    
    if (leadIdNum) {
      const lead = leads.find(l => l.id === parseInt(leadIdNum));
      if (lead?.customerId) {
        setFormData(prev => ({ 
          ...prev, 
          leadId: leadIdNum,
          customerId: lead.customerId.toString(),
          systemSize: lead.requiredSystemSize?.toString() || prev.systemSize,
          systemType: lead.systemType || prev.systemType,
        }));
      }
    }
  };

  const addLineItem = () => {
    const newItem: LineItem = {
      tempId: `item-${Date.now()}`,
      lineNumber: lineItems.length + 1,
      itemName: '',
      description: '',
      hsn: '',
      quantity: 1,
      unit: 'Nos',
      unitPrice: 0,
      discount: 0,
      taxableAmount: 0,
      gstRate: 18,
      gstAmount: 0,
      totalAmount: 0,
      itemId: undefined,
    };
    setLineItems([...lineItems, newItem]);
  };

  const removeLineItem = (tempId: string) => {
    const updated = lineItems.filter(item => item.tempId !== tempId);
    // Renumber items
    updated.forEach((item, index) => {
      item.lineNumber = index + 1;
    });
    setLineItems(updated);
  };

  const updateLineItem = (tempId: string, field: keyof LineItem, value: any) => {
    const updated = lineItems.map(item => {
      if (item.tempId === tempId) {
        const updatedItem = { ...item, [field]: value };
        
        // Recalculate amounts if quantity, price, discount, or GST rate changes
        if (['quantity', 'unitPrice', 'discount', 'gstRate'].includes(field)) {
          const calculations = quotationsService.calculateLineItemAmounts(
            parseFloat(updatedItem.quantity?.toString() || '0'),
            parseFloat(updatedItem.unitPrice?.toString() || '0'),
            parseFloat(updatedItem.discount?.toString() || '0'),
            parseFloat(updatedItem.gstRate?.toString() || '18')
          );
          
          return {
            ...updatedItem,
            taxableAmount: calculations.taxableAmount,
            gstAmount: calculations.gstAmount,
            totalAmount: calculations.totalAmount,
          };
        }
        
        return updatedItem;
      }
      return item;
    });
    
    setLineItems(updated);
  };

  const calculateTotals = () => {
    const isIGST = false; // TODO: Determine based on customer state
    
    const totals = quotationsService.calculateQuotationTotals(
      lineItems.map(item => ({
        ...item,
        quotationId: id ? parseInt(id) : 0,
        id: 0,
        itemId: item.itemId || 0,
      })),
      parseFloat(formData.discountPercent || '0'),
      isIGST
    );
    
    return totals;
  };

  const handleSubmit = async (sendToCustomer: boolean = false) => {
    try {
      // Validation
      if (!formData.leadId) {
        error('Please select a lead');
        return;
      }
      
      if (!formData.customerId) {
        error('Please select a customer');
        return;
      }
      
      if (lineItems.length === 0) {
        error('Please add at least one line item');
        return;
      }
      
      if (lineItems.some(item => !item.itemName || item.quantity <= 0 || item.unitPrice <= 0)) {
        error('Please fill in all line item details');
        return;
      }

      setLoading(true);
      
      const totals = calculateTotals();
      const status: QuotationStatus = sendToCustomer ? 'Sent' : 'Draft';
      
      const quotationData: any = {
        leadId: parseInt(formData.leadId),
        customerId: parseInt(formData.customerId),
        status,
        quotationDate: new Date(formData.quotationDate),
        validityDate: formData.validityDate ? new Date(formData.validityDate) : new Date(new Date(formData.quotationDate).getTime() + 30 * 24 * 60 * 60 * 1000),
        
        // System details
        systemSize: formData.systemSize ? parseFloat(formData.systemSize) : undefined,
        systemType: formData.systemType ? (formData.systemType as 'On-grid' | 'Off-grid' | 'Hybrid') : undefined,
        panelBrand: formData.solarPanelBrand || undefined,
        inverterBrand: formData.inverterBrand || undefined,
        
        // Pricing
        subtotal: totals.subtotal,
        discountPercent: parseFloat(formData.discountPercent || '0'),
        discountAmount: totals.discountAmount,
        taxableAmount: totals.taxableAmount,
        cgst: totals.cgst,
        sgst: totals.sgst,
        igst: totals.igst,
        totalGST: totals.totalGST,
        roundOff: totals.roundOff,
        grandTotal: totals.grandTotal,
        
        // Terms
        paymentTerms: formData.paymentTerms || undefined,
        deliveryTerms: formData.deliveryTerms || undefined,
        warrantyTerms: formData.warrantyTerms || undefined,
        termsAndConditions: formData.termsAndConditions || undefined,
        
        // Tracking
        preparedBy: user?.id,
        sentDate: sendToCustomer ? new Date() : undefined,
      };
      
      const itemsData = lineItems.map(({ tempId, itemId, ...item }) => ({
        ...item,
        itemId: itemId || 0,
      }));
      
      if (id) {
        await quotationsService.updateQuotation(parseInt(id), quotationData, itemsData);
        success(sendToCustomer ? 'Quotation sent to customer' : 'Quotation updated successfully');
      } else {
        await quotationsService.createQuotation(quotationData, itemsData);
        success(sendToCustomer ? 'Quotation created and sent' : 'Quotation created successfully');
      }
      
      navigate('/quotations');
    } catch (err) {
      console.error('Error saving quotation:', err);
      error('Failed to save quotation');
    } finally {
      setLoading(false);
    }
  };

  if (loading && id) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading quotation...</div>
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/quotations')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {id ? 'Edit Quotation' : 'New Quotation'}
            </h1>
            <p className="text-gray-600 mt-1">
              {id ? 'Update quotation details' : 'Create a new quotation for customer'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={() => handleSubmit(false)}
            disabled={loading}
          >
            <Save className="w-4 h-4 mr-2" />
            Save as Draft
          </Button>
          <Button
            onClick={() => handleSubmit(true)}
            disabled={loading}
          >
            <Send className="w-4 h-4 mr-2" />
            Save & Send
          </Button>
        </div>
      </div>

      {/* Basic Information */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lead <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.leadId}
              onChange={(e) => handleLeadChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Lead</option>
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.leadId} - {lead.source}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer
            </label>
            <select
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} - {customer.mobile}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quotation Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.quotationDate}
              onChange={(e) => setFormData({ ...formData, quotationDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valid Until
            </label>
            <input
              type="date"
              value={formData.validityDate}
              onChange={(e) => setFormData({ ...formData, validityDate: e.target.value })}
              min={formData.quotationDate}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </Card>

      {/* System Details */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              System Size (kW)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.systemSize}
              onChange={(e) => setFormData({ ...formData, systemSize: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              System Type
            </label>
            <select
              value={formData.systemType}
              onChange={(e) => setFormData({ ...formData, systemType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Type</option>
              <option value="On-grid">On-grid</option>
              <option value="Off-grid">Off-grid</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Solar Panel Brand
            </label>
            <input
              type="text"
              value={formData.solarPanelBrand}
              onChange={(e) => setFormData({ ...formData, solarPanelBrand: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Inverter Brand
            </label>
            <input
              type="text"
              value={formData.inverterBrand}
              onChange={(e) => setFormData({ ...formData, inverterBrand: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </Card>

      {/* Line Items */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Line Items</h2>
          <Button
            variant="secondary"
            size="sm"
            onClick={addLineItem}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">#</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Item Name</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Description</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">HSN</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Qty</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Unit</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Price</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Disc%</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Taxable</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">GST%</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">GST Amt</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Total</th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {lineItems.map((item) => (
                <tr key={item.tempId} className="hover:bg-gray-50">
                  <td className="px-2 py-2">{item.lineNumber}</td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={item.itemName}
                      onChange={(e) => updateLineItem(item.tempId, 'itemName', e.target.value)}
                      className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      placeholder="Item name"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateLineItem(item.tempId, 'description', e.target.value)}
                      className="w-40 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      placeholder="Description"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={item.hsn || ''}
                      onChange={(e) => updateLineItem(item.tempId, 'hsn', e.target.value)}
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      placeholder="HSN"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(item.tempId, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <select
                      value={item.unit}
                      onChange={(e) => updateLineItem(item.tempId, 'unit', e.target.value)}
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Nos">Nos</option>
                      <option value="Kg">Kg</option>
                      <option value="Mtr">Mtr</option>
                      <option value="Set">Set</option>
                      <option value="Lot">Lot</option>
                    </select>
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateLineItem(item.tempId, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={item.discount}
                      onChange={(e) => updateLineItem(item.tempId, 'discount', parseFloat(e.target.value) || 0)}
                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-2 py-2 text-gray-700">
                    ₹{item.taxableAmount.toFixed(2)}
                  </td>
                  <td className="px-2 py-2">
                    <select
                      value={item.gstRate}
                      onChange={(e) => updateLineItem(item.tempId, 'gstRate', parseFloat(e.target.value))}
                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="0">0%</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18%</option>
                      <option value="28">28%</option>
                    </select>
                  </td>
                  <td className="px-2 py-2 text-gray-700">
                    ₹{item.gstAmount.toFixed(2)}
                  </td>
                  <td className="px-2 py-2 font-medium text-gray-900">
                    ₹{item.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-2 py-2">
                    <button
                      onClick={() => removeLineItem(item.tempId)}
                      className="text-red-600 hover:text-red-900"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {lineItems.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No line items. Click "Add Item" to add your first item.
          </div>
        )}
      </Card>

      {/* Pricing Summary */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing Summary</h2>
        
        <div className="max-w-md ml-auto space-y-3">
          {/* Overall Discount */}
          <div className="flex items-center justify-between pb-3 border-b">
            <label className="text-sm font-medium text-gray-700">
              Overall Discount (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.discountPercent}
              onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })}
              className="w-24 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Calculations */}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">₹{totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>

          {parseFloat(formData.discountPercent) > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount ({formData.discountPercent}%):</span>
              <span>- ₹{totals.discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Taxable Amount:</span>
            <span className="font-medium">₹{totals.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>

          {totals.igst > 0 ? (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">IGST:</span>
              <span className="font-medium">₹{totals.igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">CGST:</span>
                <span className="font-medium">₹{totals.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">SGST:</span>
                <span className="font-medium">₹{totals.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total GST:</span>
            <span className="font-medium">₹{totals.totalGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Round Off:</span>
            <span className="font-medium">₹{totals.roundOff.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t-2">
            <span>Grand Total:</span>
            <span>₹{totals.grandTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </Card>

      {/* Terms & Conditions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Terms & Conditions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Terms
            </label>
            <textarea
              value={formData.paymentTerms}
              onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 50% advance, 50% on completion"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Delivery Terms
            </label>
            <textarea
              value={formData.deliveryTerms}
              onChange={(e) => setFormData({ ...formData, deliveryTerms: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 7-10 working days"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Warranty Terms
            </label>
            <textarea
              value={formData.warrantyTerms}
              onChange={(e) => setFormData({ ...formData, warrantyTerms: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 25 years on panels, 5 years on inverter"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            General Terms & Conditions
          </label>
          <textarea
            value={formData.termsAndConditions}
            onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter general terms and conditions..."
          />
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <Button
          variant="secondary"
          onClick={() => navigate('/quotations')}
        >
          Cancel
        </Button>
        <Button
          variant="secondary"
          onClick={() => handleSubmit(false)}
          disabled={loading}
        >
          <Save className="w-4 h-4 mr-2" />
          Save as Draft
        </Button>
        <Button
          onClick={() => handleSubmit(true)}
          disabled={loading}
        >
          <Send className="w-4 h-4 mr-2" />
          {loading ? 'Saving...' : 'Save & Send'}
        </Button>
      </div>
    </div>
  );
}
