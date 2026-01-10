/**
 * Invoice Form Component - Production Ready
 * GST-compliant invoice creation and editing with auto-calculations
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Copy, Save, FileText, AlertCircle, Search, X } from 'lucide-react';
import { invoicesService } from '@/services/invoicesService';
import { db } from '@/services/database';
import type { InvoiceType, InvoiceStatus, GSTType } from '@/types/extended';
import type { Customer, Project, Address } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToastStore } from '@/store/toastStore';

interface FormLineItem {
  tempId: string;
  lineNumber: number;
  itemName: string;
  description: string;
  hsnCode: string;
  sacCode: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  discountPercent: number;
  taxableAmount: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
}

interface InventoryItem {
  id: number;
  itemCode: string;
  name: string;
  unit: string;
  hsn?: string;
  gstRate?: number;
  sellingPrice?: number;
}

export function InvoiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error } = useToastStore();
  
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [itemSearchOpen, setItemSearchOpen] = useState<string | null>(null);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);

  const [formData, setFormData] = useState({
    customerId: 0,
    projectId: 0,
    invoiceType: 'Tax Invoice' as InvoiceType,
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    billingStreet: '',
    billingCity: '',
    billingState: '',
    billingPincode: '',
    shippingStreet: '',
    shippingCity: '',
    shippingState: '',
    shippingPincode: '',
    placeOfSupply: '',
    companyGSTIN: '',
    customerGSTIN: '',
    reverseCharge: false,
    tcsRate: 0,
    paymentTerms: 'Payment due within 30 days',
    termsAndConditions: '',
    notes: '',
  });

  const [lineItems, setLineItems] = useState<FormLineItem[]>([
    {
      tempId: crypto.randomUUID(),
      lineNumber: 1,
      itemName: '',
      description: '',
      hsnCode: '',
      sacCode: '',
      quantity: 1,
      unit: 'Nos',
      unitPrice: 0,
      discount: 0,
      discountPercent: 0,
      taxableAmount: 0,
      gstRate: 18,
      cgst: 0,
      sgst: 0,
      igst: 0,
      totalAmount: 0,
    },
  ]);

  const [totals, setTotals] = useState({
    subtotal: 0,
    totalDiscount: 0,
    taxableAmount: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    totalGST: 0,
    tcsAmount: 0,
    roundOff: 0,
    grandTotal: 0,
    grandTotalInWords: '',
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [customersData, projectsData, itemsData] = await Promise.all([
        db.customers.toArray(),
        db.projects.toArray(),
        db.items.toArray(),
      ]);
      setCustomers(customersData);
      setProjects(projectsData);
      const mappedItems = (itemsData || []).map((item: any) => ({
        id: item.id,
        itemCode: item.itemCode || '',
        name: item.name || '',
        unit: item.unit || 'Nos',
        hsn: item.hsn || item.hsnCode || '',
        gstRate: item.gstRate || 18,
        sellingPrice: item.sellingPrice || 0,
      }));
      setInventoryItems(mappedItems);
      console.log('✅ Loaded items:', mappedItems.length);

      if (id) {
        await loadInvoice();
      }
    } catch (err) {
      console.error('Error loading data:', err);
      error('Failed to load form data');
    }
  };

  useEffect(() => {
    calculateTotals();
  }, [lineItems, formData.tcsRate, formData.companyGSTIN, formData.placeOfSupply]);

  // Search and filter inventory items
  useEffect(() => {
    if (!itemSearchQuery.trim()) {
      // If search is empty, show all items (for initial browse)
      setFilteredItems(inventoryItems.slice(0, 15));
      return;
    }
    const query = itemSearchQuery.toLowerCase();
    const filtered = inventoryItems.filter((item) => {
      const name = (item?.name || '').toLowerCase();
      const code = (item?.itemCode || '').toLowerCase();
      return name.includes(query) || code.includes(query);
    });
    setFilteredItems(filtered.slice(0, 15)); // Limit to 15 results
    if (filtered.length > 0) {
      console.log('🔍 Found items:', filtered.length);
    }
  }, [itemSearchQuery, inventoryItems]);

  const selectInventoryItem = (tempId: string, invItem: InventoryItem) => {
    setLineItems((items) =>
      items.map((item) => {
        if (item.tempId !== tempId) return item;
        return {
          ...item,
          itemName: invItem?.name || '',
          hsnCode: invItem?.hsn || '',
          sacCode: invItem?.hsn || '',
          unit: invItem?.unit || 'Nos',
          unitPrice: invItem?.sellingPrice || 0,
          gstRate: invItem?.gstRate || 18,
        };
      })
    );
    setItemSearchOpen(null);
    setItemSearchQuery('');
  };

  const loadInvoice = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const invoice = await db.invoices.get(Number(id));
      if (!invoice) {
        error('Invoice not found');
        navigate('/invoices');
        return;
      }

      const billing = invoice.billingAddress;
      const shipping = invoice.shippingAddress;

      setFormData({
        customerId: invoice.customerId,
        projectId: invoice.projectId || 0,
        invoiceType: invoice.invoiceType,
        invoiceDate: new Date(invoice.invoiceDate).toISOString().split('T')[0],
        dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
        
        billingStreet: `${billing.houseNo || ''} ${billing.area || ''}`.trim(),
        billingCity: billing.city,
        billingState: billing.state,
        billingPincode: billing.pincode,
        
        shippingStreet: shipping ? `${shipping.houseNo || ''} ${shipping.area || ''}`.trim() : '',
        shippingCity: shipping?.city || '',
        shippingState: shipping?.state || '',
        shippingPincode: shipping?.pincode || '',
        
        placeOfSupply: invoice.placeOfSupply,
        companyGSTIN: invoice.companyGSTIN,
        customerGSTIN: invoice.customerGSTIN || '',
        reverseCharge: invoice.reverseCharge,
        tcsRate: invoice.tcs ? (invoice.tcs / invoice.taxableAmount) * 100 : 0,
        paymentTerms: invoice.paymentTerms || '',
        termsAndConditions: invoice.termsAndConditions || '',
        notes: invoice.notes || '',
      });

      const items = await db.invoiceItems.where('invoiceId').equals(Number(id)).toArray();
      if (items.length > 0) {
        setLineItems(
          items.map((item) => ({
            tempId: crypto.randomUUID(),
            lineNumber: item.lineNumber,
            itemName: item.itemName,
            description: item.description || '',
            hsnCode: item.hsnCode || '',
            sacCode: item.sacCode || '',
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            discount: item.discount || 0,
            discountPercent: item.discountPercent || 0,
            taxableAmount: item.taxableAmount,
            gstRate: item.gstRate,
            cgst: item.cgst || 0,
            sgst: item.sgst || 0,
            igst: item.igst || 0,
            totalAmount: item.totalAmount,
          }))
        );
      }
    } catch (err) {
      console.error('Error loading invoice:', err);
      error('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerChange = async (customerId: number) => {
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      const addr = customer.address;
      setFormData((prev) => ({
        ...prev,
        customerId,
        billingStreet: `${addr.houseNo || ''} ${addr.area || ''}`.trim(),
        billingCity: addr.city,
        billingState: addr.state,
        billingPincode: addr.pincode,
        shippingStreet: `${addr.houseNo || ''} ${addr.area || ''}`.trim(),
        shippingCity: addr.city,
        shippingState: addr.state,
        shippingPincode: addr.pincode,
        placeOfSupply: addr.state,
      }));
    }
  };

  const copyBillingToShipping = () => {
    setFormData((prev) => ({
      ...prev,
      shippingStreet: prev.billingStreet,
      shippingCity: prev.billingCity,
      shippingState: prev.billingState,
      shippingPincode: prev.billingPincode,
    }));
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        tempId: crypto.randomUUID(),
        lineNumber: lineItems.length + 1,
        itemName: '',
        description: '',
        hsnCode: '',
        sacCode: '',
        quantity: 1,
        unit: 'Nos',
        unitPrice: 0,
        discount: 0,
        discountPercent: 0,
        taxableAmount: 0,
        gstRate: 18,
        cgst: 0,
        sgst: 0,
        igst: 0,
        totalAmount: 0,
      },
    ]);
  };

  const removeLineItem = (tempId: string) => {
    if (lineItems.length === 1) {
      error('At least one line item is required');
      return;
    }
    setLineItems(lineItems.filter((item) => item.tempId !== tempId));
  };

  const updateLineItem = (tempId: string, field: keyof FormLineItem, value: any) => {
    setLineItems((items) =>
      items.map((item) => {
        if (item.tempId !== tempId) return item;

        const updated = { ...item, [field]: value };
        const subtotal = updated.quantity * updated.unitPrice;
        
        if (field === 'discountPercent') {
          updated.discount = (subtotal * updated.discountPercent) / 100;
        } else if (field === 'discount') {
          updated.discountPercent = subtotal > 0 ? (updated.discount / subtotal) * 100 : 0;
        }

        updated.taxableAmount = subtotal - updated.discount;

        const companyStateCode = formData.companyGSTIN?.substring(0, 2) || '';
        const placeOfSupplyStateCode = getStateCode(formData.placeOfSupply);
        const isInterstate = companyStateCode && placeOfSupplyStateCode 
          ? companyStateCode !== placeOfSupplyStateCode 
          : false;

        if (isInterstate) {
          updated.igst = (updated.taxableAmount * updated.gstRate) / 100;
          updated.cgst = 0;
          updated.sgst = 0;
        } else {
          updated.cgst = (updated.taxableAmount * updated.gstRate) / 200;
          updated.sgst = (updated.taxableAmount * updated.gstRate) / 200;
          updated.igst = 0;
        }

        updated.totalAmount = updated.taxableAmount + updated.cgst + updated.sgst + updated.igst;
        return updated;
      })
    );
  };

  const getStateCode = (stateName: string): string => {
    const stateMap: Record<string, string> = {
      'Karnataka': '29', 'Maharashtra': '27', 'Tamil Nadu': '33', 'Delhi': '07',
      'Gujarat': '24', 'Rajasthan': '08', 'Uttar Pradesh': '09', 'West Bengal': '19',
      'Andhra Pradesh': '37', 'Telangana': '36', 'Kerala': '32', 'Punjab': '03',
    };
    return stateMap[stateName] || '';
  };

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const totalDiscount = lineItems.reduce((sum, item) => sum + item.discount, 0);
    const taxableAmount = lineItems.reduce((sum, item) => sum + item.taxableAmount, 0);
    const cgst = lineItems.reduce((sum, item) => sum + item.cgst, 0);
    const sgst = lineItems.reduce((sum, item) => sum + item.sgst, 0);
    const igst = lineItems.reduce((sum, item) => sum + item.igst, 0);
    const totalGST = cgst + sgst + igst;

    const tcsAmount = (taxableAmount * formData.tcsRate) / 100;
    const totalBeforeRounding = taxableAmount + totalGST + tcsAmount;
    const grandTotal = Math.round(totalBeforeRounding);
    const roundOff = grandTotal - totalBeforeRounding;
    const grandTotalInWords = invoicesService.convertToWords(grandTotal);

    setTotals({
      subtotal,
      totalDiscount,
      taxableAmount,
      cgst,
      sgst,
      igst,
      totalGST,
      tcsAmount,
      roundOff,
      grandTotal,
      grandTotalInWords,
    });
  };

  const validateForm = (): boolean => {
    if (!formData.customerId) {
      error('Please select a customer');
      return false;
    }
    if (!formData.invoiceDate) {
      error('Please select an invoice date');
      return false;
    }
    if (formData.dueDate && new Date(formData.dueDate) < new Date(formData.invoiceDate)) {
      error('Due date cannot be before invoice date');
      return false;
    }
    if (formData.companyGSTIN && !invoicesService.validateGSTIN(formData.companyGSTIN)) {
      error('Invalid Company GSTIN format');
      return false;
    }
    if (formData.customerGSTIN && !invoicesService.validateGSTIN(formData.customerGSTIN)) {
      error('Invalid Customer GSTIN format');
      return false;
    }
    if (!formData.billingCity || !formData.billingState || !formData.billingPincode) {
      error('Please complete billing address');
      return false;
    }
    if (!formData.placeOfSupply) {
      error('Please specify place of supply');
      return false;
    }
    const invalidItems = lineItems.filter((item) => !item.itemName || item.quantity <= 0 || item.unitPrice < 0);
    if (invalidItems.length > 0) {
      error(`Please complete all line items with valid data (found ${invalidItems.length} invalid item${invalidItems.length > 1 ? 's' : ''})`);
      return false;
    }
    return true;
  };

  const handleSubmit = async (status: InvoiceStatus) => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const billingAddress: Address = {
        houseNo: formData.billingStreet.trim() || '',
        area: '',
        city: formData.billingCity,
        state: formData.billingState,
        pincode: formData.billingPincode,
      };

      const shippingAddress: Address | undefined = formData.shippingCity ? {
        houseNo: formData.shippingStreet.trim() || '',
        area: '',
        city: formData.shippingCity,
        state: formData.shippingState,
        pincode: formData.shippingPincode,
      } : undefined;

      const companyStateCode = formData.companyGSTIN?.substring(0, 2) || '';
      const placeOfSupplyStateCode = getStateCode(formData.placeOfSupply);
      const gstType: GSTType = companyStateCode && placeOfSupplyStateCode && companyStateCode !== placeOfSupplyStateCode
        ? 'Inter-state'
        : 'Intra-state';

      const invoiceData = {
        customerId: formData.customerId,
        projectId: formData.projectId || undefined,
        invoiceType: formData.invoiceType,
        status,
        invoiceDate: new Date(formData.invoiceDate),
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        billingAddress,
        shippingAddress,
        placeOfSupply: formData.placeOfSupply,
        gstType,
        companyGSTIN: formData.companyGSTIN,
        customerGSTIN: formData.customerGSTIN || undefined,
        reverseCharge: formData.reverseCharge,
        subtotal: totals.subtotal,
        discountAmount: totals.totalDiscount,
        taxableAmount: totals.taxableAmount,
        cgst: totals.cgst,
        sgst: totals.sgst,
        igst: totals.igst,
        totalGST: totals.totalGST,
        tcs: totals.tcsAmount,
        roundOff: totals.roundOff,
        grandTotal: totals.grandTotal,
        grandTotalInWords: totals.grandTotalInWords,
        amountPaid: 0,
        balanceAmount: totals.grandTotal,
        paymentTerms: formData.paymentTerms,
        termsAndConditions: formData.termsAndConditions,
        notes: formData.notes,
      };

      const lineItemsData = lineItems.map((item, index) => ({
        lineNumber: index + 1,
        itemName: item.itemName,
        description: item.description,
        hsnCode: item.hsnCode,
        sacCode: item.sacCode,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        discount: item.discount,
        discountPercent: item.discountPercent,
        taxableAmount: item.taxableAmount,
        gstRate: item.gstRate,
        cgst: item.cgst,
        sgst: item.sgst,
        igst: item.igst,
        totalAmount: item.totalAmount,
      }));

      if (id) {
        await invoicesService.updateInvoice(Number(id), invoiceData, lineItemsData);
        success(`Invoice ${status === 'Draft' ? 'saved as draft' : 'generated'} successfully`);
        navigate(`/invoices/${id}`);
      } else {
        const newId = await invoicesService.createInvoice(invoiceData, lineItemsData);
        success(`Invoice ${status === 'Draft' ? 'saved as draft' : 'generated'} successfully`);
        navigate(`/invoices/${newId}`);
      }
    } catch (err) {
      console.error('Error saving invoice:', err);
      error('Failed to save invoice');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (!amount || isNaN(amount)) return '₹0.00';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  };

  if (loading && id) {
    return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Loading...</div></div>;
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{id ? 'Edit Invoice' : 'New Invoice'}</h1>
          <p className="text-gray-600 mt-1">Create GST-compliant invoice</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="secondary" onClick={() => navigate('/invoices')}>Cancel</Button>
          <Button variant="secondary" onClick={() => handleSubmit('Draft')} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />Save Draft
          </Button>
          <Button onClick={() => handleSubmit('Generated')} disabled={loading}>
            <FileText className="w-4 h-4 mr-2" />Generate
          </Button>
        </div>
      </div>

      {/* Invoice Details */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Invoice Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Type *</label>
            <select value={formData.invoiceType} onChange={(e) => setFormData({ ...formData, invoiceType: e.target.value as InvoiceType })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
              <option>Tax Invoice</option><option>Proforma</option><option>Stage Payment</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
            <select value={formData.customerId || ''} onChange={(e) => handleCustomerChange(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="">Select</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
            <select value={formData.projectId || ''} onChange={(e) => setFormData({ ...formData, projectId: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="">Select</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.projectId}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input type="date" value={formData.invoiceDate} onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input type="date" value={formData.dueDate} min={formData.invoiceDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company GSTIN</label>
            <input type="text" value={formData.companyGSTIN} maxLength={15}
              onChange={(e) => setFormData({ ...formData, companyGSTIN: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 uppercase" placeholder="29XXXXX1234X1Z5" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer GSTIN</label>
            <input type="text" value={formData.customerGSTIN} maxLength={15}
              onChange={(e) => setFormData({ ...formData, customerGSTIN: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 uppercase" placeholder="Optional" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Place of Supply *</label>
            <input type="text" value={formData.placeOfSupply}
              onChange={(e) => setFormData({ ...formData, placeOfSupply: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Karnataka" />
          </div>
        </div>
        <div className="mt-4 flex items-center">
          <input type="checkbox" id="rc" checked={formData.reverseCharge}
            onChange={(e) => setFormData({ ...formData, reverseCharge: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded" />
          <label htmlFor="rc" className="ml-2 text-sm text-gray-700">Reverse Charge</label>
        </div>
      </Card>

      {/* Addresses */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Addresses</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Billing *</h3>
            <input type="text" placeholder="Street, Area" value={formData.billingStreet}
              onChange={(e) => setFormData({ ...formData, billingStreet: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg" />
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="City *" value={formData.billingCity}
                onChange={(e) => setFormData({ ...formData, billingCity: e.target.value })}
                className="px-3 py-2 border rounded-lg" />
              <input type="text" placeholder="State *" value={formData.billingState}
                onChange={(e) => setFormData({ ...formData, billingState: e.target.value })}
                className="px-3 py-2 border rounded-lg" />
            </div>
            <input type="text" placeholder="Pincode *" value={formData.billingPincode} maxLength={6}
              onChange={(e) => setFormData({ ...formData, billingPincode: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <h3 className="text-sm font-medium">Shipping</h3>
              <button onClick={copyBillingToShipping} className="text-sm text-blue-600 flex items-center">
                <Copy className="w-3 h-3 mr-1" />Copy
              </button>
            </div>
            <input type="text" placeholder="Street, Area" value={formData.shippingStreet}
              onChange={(e) => setFormData({ ...formData, shippingStreet: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg" />
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="City" value={formData.shippingCity}
                onChange={(e) => setFormData({ ...formData, shippingCity: e.target.value })}
                className="px-3 py-2 border rounded-lg" />
              <input type="text" placeholder="State" value={formData.shippingState}
                onChange={(e) => setFormData({ ...formData, shippingState: e.target.value })}
                className="px-3 py-2 border rounded-lg" />
            </div>
            <input type="text" placeholder="Pincode" value={formData.shippingPincode} maxLength={6}
              onChange={(e) => setFormData({ ...formData, shippingPincode: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg" />
          </div>
        </div>
      </Card>

      {/* Line Items */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Line Items</h2>
          <Button size="sm" onClick={addLineItem}><Plus className="w-4 h-4 mr-2" />Add Item</Button>
        </div>
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">💡 Click Item field to browse inventory • Search by name or code • GST auto-calculated</p>
          </div>
        </div>
        <div className="space-y-4">
          {lineItems.map((item, idx) => (
            <div key={item.tempId} className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full font-semibold text-sm">{idx + 1}</span>
                  <div className="flex-1 min-w-[300px]">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Item Name *</label>
                    <div className="relative">
                      <div className="flex items-center gap-1">
                        <input 
                          type="text" 
                          value={item.itemName} 
                          onChange={(e) => {
                            updateLineItem(item.tempId, 'itemName', e.target.value);
                            setItemSearchOpen(item.tempId);
                            setItemSearchQuery(e.target.value);
                          }}
                          onFocus={() => {
                            setItemSearchOpen(item.tempId);
                            setItemSearchQuery(item.itemName);
                          }}
                          placeholder="Click to search inventory..." 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                        />
                        {itemSearchOpen === item.tempId && (
                          <button 
                            onClick={() => setItemSearchOpen(null)}
                            className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {itemSearchOpen === item.tempId && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl z-[100] max-h-80 overflow-y-auto">
                          {filteredItems.length > 0 ? (
                            filteredItems.map((invItem) => (
                              <button
                                key={invItem.id}
                                onClick={() => selectInventoryItem(item.tempId, invItem)}
                                className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b last:border-b-0 transition-colors"
                              >
                                <div className="font-medium text-gray-900">{invItem?.name || 'Unknown Item'}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  <span className="inline-flex items-center gap-2">
                                    <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{invItem?.itemCode || 'N/A'}</span>
                                    <span>•</span>
                                    <span>{invItem?.unit || 'Nos'}</span>
                                    <span>•</span>
                                    <span className="font-semibold text-green-600">₹{(invItem?.sellingPrice || 0).toFixed(2)}</span>
                                  </span>
                                </div>
                              </button>
                            ))
                          ) : itemSearchQuery.trim() && inventoryItems.length > 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center">No items matching "{itemSearchQuery}"</div>
                          ) : inventoryItems.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center">No items available in inventory</div>
                          ) : (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center">Start typing to search or browse all items...</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => removeLineItem(item.tempId)} 
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                  title="Remove item"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">HSN/SAC</label>
                  <input 
                    type="text" 
                    value={item.hsnCode} 
                    maxLength={8}
                    onChange={(e) => { 
                      updateLineItem(item.tempId, 'hsnCode', e.target.value); 
                      updateLineItem(item.tempId, 'sacCode', e.target.value); 
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Code"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Quantity *</label>
                  <input 
                    type="number" 
                    value={item.quantity} 
                    min="0" 
                    step="1"
                    onChange={(e) => updateLineItem(item.tempId, 'quantity', Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
                  <select 
                    value={item.unit} 
                    onChange={(e) => updateLineItem(item.tempId, 'unit', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option>Nos</option>
                    <option>Kgs</option>
                    <option>Ltrs</option>
                    <option>Mtr</option>
                    <option>Sqft</option>
                    <option>Pcs</option>
                    <option>Set</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Unit Price *</label>
                  <input 
                    type="number" 
                    value={item.unitPrice} 
                    min="0" 
                    step="0.01"
                    onChange={(e) => updateLineItem(item.tempId, 'unitPrice', Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="₹"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Discount %</label>
                  <input 
                    type="number" 
                    value={item.discountPercent} 
                    min="0" 
                    max="100" 
                    step="0.01"
                    onChange={(e) => updateLineItem(item.tempId, 'discountPercent', Math.min(100, Math.max(0, Number(e.target.value))))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="%"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">GST Rate</label>
                  <select 
                    value={item.gstRate} 
                    onChange={(e) => updateLineItem(item.tempId, 'gstRate', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>
                
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Line Total</label>
                  <div className="px-3 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                    <div className="text-lg font-bold text-green-700">{formatCurrency(item.totalAmount)}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Totals */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Summary</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">Subtotal:</span><span className="font-medium">{formatCurrency(totals.subtotal)}</span></div>
            {totals.totalDiscount > 0 && <div className="flex justify-between"><span className="text-gray-600">Discount:</span><span className="font-medium text-red-600">-{formatCurrency(totals.totalDiscount)}</span></div>}
            <div className="flex justify-between border-t pt-2"><span className="text-gray-600">Taxable:</span><span className="font-medium">{formatCurrency(totals.taxableAmount)}</span></div>
            {totals.cgst > 0 && <><div className="flex justify-between"><span>CGST:</span><span>{formatCurrency(totals.cgst)}</span></div><div className="flex justify-between"><span>SGST:</span><span>{formatCurrency(totals.sgst)}</span></div></>}
            {totals.igst > 0 && <div className="flex justify-between"><span>IGST:</span><span>{formatCurrency(totals.igst)}</span></div>}
            <div className="pt-3 border-t">
              <label className="block text-sm font-medium mb-1">TCS Rate (%)</label>
              <input type="number" value={formData.tcsRate} min="0" max="10" step="0.1"
                onChange={(e) => setFormData({ ...formData, tcsRate: Math.max(0, Number(e.target.value)) })}
                className="w-32 px-3 py-2 border rounded-lg" />
              {totals.tcsAmount > 0 && <div className="mt-2 text-sm"><span className="text-gray-600">TCS:</span> <span className="ml-2 font-medium">{formatCurrency(totals.tcsAmount)}</span></div>}
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Round Off:</span><span className="font-medium">{totals.roundOff >= 0 ? '+' : ''}{formatCurrency(totals.roundOff)}</span></div>
              <div className="flex justify-between text-xl font-bold border-t-2 border-blue-300 pt-3">
                <span>Grand Total:</span><span className="text-blue-700">{formatCurrency(totals.grandTotal)}</span>
              </div>
              {totals.grandTotalInWords && (
                <div className="text-sm text-gray-700 italic pt-2 border-t border-blue-200">
                  <p className="font-medium mb-1">In Words:</p><p className="leading-relaxed">{totals.grandTotalInWords}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Additional */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Additional</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Payment Terms</label>
            <textarea value={formData.paymentTerms} rows={2} onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Terms & Conditions</label>
            <textarea value={formData.termsAndConditions} rows={3} onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Internal Notes</label>
            <textarea value={formData.notes} rows={2} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg" />
          </div>
        </div>
      </Card>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-end space-x-3 shadow-lg z-10">
        <Button variant="secondary" onClick={() => navigate('/invoices')}>Cancel</Button>
        <Button variant="secondary" onClick={() => handleSubmit('Draft')} disabled={loading}>
          <Save className="w-4 h-4 mr-2" />Draft
        </Button>
        <Button onClick={() => handleSubmit('Generated')} disabled={loading}>
          <FileText className="w-4 h-4 mr-2" />Generate
        </Button>
      </div>
    </div>
  );
}
