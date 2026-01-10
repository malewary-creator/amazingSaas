/**
 * Professional Solar Quotation Generator
 * Complete 8-section EPC-style quotation with PDF export
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, Send, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { quotationsService } from '@/services/quotationsService';
import { db } from '@/services/database';
import type { QuotationStatus, QuotationItem } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToastStore } from '@/store/toastStore';
import { useAuthStore } from '@/store/authStore';

interface LineItem extends Omit<QuotationItem, 'id' | 'quotationId' | 'itemId'> {
  tempId: string;
  itemId?: number;
}

interface PaymentScheduleRow {
  id: string;
  percentage: number;
  condition: string;
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function ProfessionalQuotationForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error } = useToastStore();
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  // Section 1: Header/Client Block
  const [section1, setSection1] = useState({
    companyName: 'Shine Solar & Electrical',
    clientName: '',
    projectPurpose: '' as 'Residential' | 'Commercial' | 'Industrial' | '',
    systemSize: '',
    phase: '' as '1ph' | '3ph' | '',
    siteLocation: '',
  });

  // Section 2: Site Specification
  const [section2, setSection2] = useState({
    location: '',
    siteState: '',
    roofType: '' as 'Roof' | 'Ground' | 'Tin Shed' | 'RCC' | '',
    latitude: '',
    longitude: '',
    solarRadiation: '',
  });

  // Section 3: Solar System Specification
  const [section3, setSection3] = useState({
    dcCapacity: '',
    moduleTechnology: '',
    inverterType: '',
    mountingStructure: '',
    safetyDevices: 'DC SPD, AC SPD, Earthing Kit',
    powerEvacuation: 'Net Metering',
    projectScheme: 'Non-subsidy',
    panelBrand: '',
    inverterBrand: '',
    systemType: '' as 'On-grid' | 'Off-grid' | 'Hybrid' | '',
  });

  // Section 4: Developer Details
  const [section4, setSection4] = useState({
    developerName: 'Shine Solar & Electrical',
    quotationDate: new Date().toISOString().split('T')[0],
    offerValidityDays: '30',
  });

  // Section 5: Monthly Solar Data (JAN-DEC)
  const [section5, setSection5] = useState<{[key: string]: string}>({
    jan: '4.5', feb: '5.0', mar: '5.5', apr: '6.0',
    may: '6.2', jun: '5.8', jul: '5.2', aug: '5.0',
    sep: '5.3', oct: '5.5', nov: '5.0', dec: '4.8',
  });

  // Section 6: Technical Details (Line Items)
  const [section6, setSection6] = useState<LineItem[]>([]);

  // Section 7: Offer & Pricing
  const [section7, setSection7] = useState({
    plantCapacity: '',
    priceBasis: 'Per KW',
    basePrice: '',
    gstPercent: '18',
    discountPercent: '0',
  });

  // Section 8: Payment Schedule
  const [section8, setSection8] = useState<PaymentScheduleRow[]>([
    { id: '1', percentage: 40, condition: 'On Booking' },
    { id: '2', percentage: 50, condition: 'On Material Delivery' },
    { id: '3', percentage: 10, condition: 'On Commissioning' },
  ]);

  const [formData, setFormData] = useState({
    leadId: '',
    customerId: '',
    termsAndConditions: `1. Prices are valid for specified period
2. GST will be charged as applicable
3. Installation charges included
4. Payment as per schedule
5. Delivery within 7-10 working days from order confirmation`,
  });

  useEffect(() => {
    loadData();
    if (id) {
      loadQuotation();
    } else {
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

      // Load all sections
      setSection1({
        companyName: quotation.companyName || 'Shine Solar & Electrical',
        clientName: quotation.clientName || '',
        projectPurpose: quotation.projectPurpose || '',
        systemSize: quotation.systemSize?.toString() || '',
        phase: quotation.phase || '',
        siteLocation: quotation.siteLocation || '',
      });

      setSection2({
        location: quotation.siteLocation || '',
        siteState: quotation.siteState || '',
        roofType: quotation.roofType || '',
        latitude: quotation.latitude?.toString() || '',
        longitude: quotation.longitude?.toString() || '',
        solarRadiation: quotation.solarRadiation?.toString() || '',
      });

      setSection3({
        dcCapacity: quotation.dcCapacity?.toString() || '',
        moduleTechnology: quotation.moduleTechnology || '',
        inverterType: quotation.inverterType || '',
        mountingStructure: quotation.mountingStructure || '',
        safetyDevices: quotation.safetyDevices || 'DC SPD, AC SPD, Earthing Kit',
        powerEvacuation: quotation.powerEvacuation || 'Net Metering',
        projectScheme: quotation.projectScheme || 'Non-subsidy',
        panelBrand: quotation.panelBrand || '',
        inverterBrand: quotation.inverterBrand || '',
        systemType: quotation.systemType || '',
      });

      setSection4({
        developerName: quotation.developerName || 'Shine Solar & Electrical',
        quotationDate: new Date(quotation.quotationDate).toISOString().split('T')[0],
        offerValidityDays: quotation.offerValidityDays?.toString() || '30',
      });

      if (quotation.monthlySolarData) {
        const monthlyData: {[key: string]: string} = {};
        MONTHS.forEach(month => {
          monthlyData[month] = quotation.monthlySolarData?.[month]?.toString() || '';
        });
        setSection5(monthlyData);
      }

      setSection7({
        plantCapacity: quotation.plantCapacity?.toString() || '',
        priceBasis: quotation.priceBasis || 'Per KW',
        basePrice: quotation.basePrice?.toString() || '',
        gstPercent: quotation.gstPercent?.toString() || '18',
        discountPercent: quotation.discountPercent?.toString() || '0',
      });

      if (quotation.paymentSchedule && quotation.paymentSchedule.length > 0) {
        setSection8(quotation.paymentSchedule.map((row: any, idx: number) => ({
          id: `ps-${idx}`,
          percentage: row.percentage,
          condition: row.condition,
        })));
      }

      setFormData({
        leadId: quotation.leadId?.toString() || '',
        customerId: quotation.customerId?.toString() || '',
        termsAndConditions: quotation.termsAndConditions || '',
      });

      const items = quotation.items || [];
      setSection6(
        items.map((item: any, index: number) => ({
          tempId: `item-${index}`,
          lineNumber: item.lineNumber,
          component: item.component || item.itemName || '',
          specification: item.specification || item.description || '',
          quantity: item.quantity,
          make: item.make || '',
          unit: item.unit,
          hsn: item.hsn || '',
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
      if (lead) {
        const customer = await db.customers.get(lead.customerId);
        setFormData(prev => ({ 
          ...prev, 
          leadId: leadIdNum,
          customerId: lead.customerId.toString(),
        }));
        setSection1(prev => ({
          ...prev,
          clientName: customer?.name || '',
          systemSize: lead.requiredSystemSize?.toString() || prev.systemSize,
          siteLocation: customer?.address ? `${customer.address.city}, ${customer.address.state}` : '',
        }));
        setSection2(prev => ({
          ...prev,
          location: customer?.address ? `${customer.address.city}, ${customer.address.state}` : '',
          siteState: customer?.address?.state || '',
        }));
        setSection3(prev => ({
          ...prev,
          systemType: lead.systemType || prev.systemType,
        }));
      }
    }
  };

  const addLineItem = () => {
    const newItem: LineItem = {
      tempId: `item-${Date.now()}`,
      lineNumber: section6.length + 1,
      component: '',
      specification: '',
      quantity: 1,
      make: '',
      unit: 'Nos',
      unitPrice: 0,
      discount: 0,
      taxableAmount: 0,
      gstRate: 18,
      gstAmount: 0,
      totalAmount: 0,
    };
    setSection6([...section6, newItem]);
  };

  const removeLineItem = (tempId: string) => {
    const updated = section6.filter(item => item.tempId !== tempId);
    updated.forEach((item, index) => {
      item.lineNumber = index + 1;
    });
    setSection6(updated);
  };

  const updateLineItem = (tempId: string, field: keyof LineItem, value: any) => {
    const updated = section6.map(item => {
      if (item.tempId === tempId) {
        const updatedItem = { ...item, [field]: value };
        
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
    
    setSection6(updated);
  };

  const addPaymentRow = () => {
    setSection8([...section8, {
      id: `ps-${Date.now()}`,
      percentage: 0,
      condition: '',
    }]);
  };

  const removePaymentRow = (id: string) => {
    setSection8(section8.filter(row => row.id !== id));
  };

  const updatePaymentRow = (id: string, field: 'percentage' | 'condition', value: any) => {
    setSection8(section8.map(row =>
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const calculateTotals = () => {
    const isIGST = false;
    
    const totals = quotationsService.calculateQuotationTotals(
      section6.map(item => ({
        ...item,
        quotationId: id ? parseInt(id) : 0,
        id: 0,
        itemId: item.itemId || 0,
        itemName: item.component,
        description: item.specification,
      })),
      parseFloat(section7.discountPercent || '0'),
      isIGST
    );
    
    return totals;
  };

  const handleSubmit = async (sendToCustomer: boolean = false) => {
    try {
      if (!formData.leadId || !formData.customerId) {
        error('Please select lead and customer');
        return;
      }
      
      if (section6.length === 0) {
        error('Please add at least one technical component');
        return;
      }
      
      if (section6.some(item => !item.component || item.quantity <= 0 || item.unitPrice <= 0)) {
        error('Please fill in all technical details');
        return;
      }

      setLoading(true);
      
      const totals = calculateTotals();
      const status: QuotationStatus = sendToCustomer ? 'Sent' : 'Draft';
      
      const monthlySolarData: any = {};
      MONTHS.forEach(month => {
        const val = parseFloat(section5[month] || '0');
        if (val > 0) monthlySolarData[month] = val;
      });
      
      const quotationData: any = {
        leadId: parseInt(formData.leadId),
        customerId: parseInt(formData.customerId),
        status,
        quotationDate: new Date(section4.quotationDate),
        validityDate: new Date(new Date(section4.quotationDate).getTime() + parseInt(section4.offerValidityDays) * 24 * 60 * 60 * 1000),
        
        // Section 1
        companyName: section1.companyName,
        clientName: section1.clientName,
        projectPurpose: section1.projectPurpose || undefined,
        systemSize: section1.systemSize ? parseFloat(section1.systemSize) : undefined,
        phase: section1.phase || undefined,
        siteLocation: section1.siteLocation,
        
        // Section 2
        siteState: section2.siteState,
        roofType: section2.roofType || undefined,
        latitude: section2.latitude ? parseFloat(section2.latitude) : undefined,
        longitude: section2.longitude ? parseFloat(section2.longitude) : undefined,
        solarRadiation: section2.solarRadiation ? parseFloat(section2.solarRadiation) : undefined,
        
        // Section 3
        systemType: section3.systemType || undefined,
        dcCapacity: section3.dcCapacity ? parseFloat(section3.dcCapacity) : undefined,
        moduleTechnology: section3.moduleTechnology,
        inverterType: section3.inverterType,
        mountingStructure: section3.mountingStructure,
        safetyDevices: section3.safetyDevices,
        powerEvacuation: section3.powerEvacuation,
        projectScheme: section3.projectScheme,
        panelBrand: section3.panelBrand,
        inverterBrand: section3.inverterBrand,
        
        // Section 4
        developerName: section4.developerName,
        offerValidityDays: parseInt(section4.offerValidityDays),
        
        // Section 5
        monthlySolarData,
        
        // Section 7
        plantCapacity: section7.plantCapacity ? parseFloat(section7.plantCapacity) : undefined,
        priceBasis: section7.priceBasis,
        basePrice: section7.basePrice ? parseFloat(section7.basePrice) : undefined,
        gstPercent: parseFloat(section7.gstPercent),
        subtotal: totals.subtotal,
        discountPercent: parseFloat(section7.discountPercent || '0'),
        discountAmount: totals.discountAmount,
        taxableAmount: totals.taxableAmount,
        cgst: totals.cgst,
        sgst: totals.sgst,
        igst: totals.igst,
        totalGST: totals.totalGST,
        roundOff: totals.roundOff,
        grandTotal: totals.grandTotal,
        
        // Section 8
        paymentSchedule: section8.map(row => ({
          percentage: row.percentage,
          condition: row.condition,
        })),
        
        termsAndConditions: formData.termsAndConditions,
        preparedBy: user?.id,
        sentDate: sendToCustomer ? new Date() : undefined,
      };
      
      const itemsData = section6.map(({ tempId, ...item }) => ({
        ...item,
        itemId: item.itemId || 0,
        itemName: item.component,
        description: item.specification,
      }));
      
      if (id) {
        await quotationsService.updateQuotation(parseInt(id), quotationData, itemsData);
        success(sendToCustomer ? 'Quotation sent' : 'Quotation updated');
      } else {
        await quotationsService.createQuotation(quotationData, itemsData);
        success(sendToCustomer ? 'Quotation created and sent' : 'Quotation created');
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
  const totalPaymentPercent = section8.reduce((sum, row) => sum + row.percentage, 0);

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
              Professional Solar Quotation Generator
            </h1>
            <p className="text-gray-600 mt-1">
              Complete EPC-style quotation with all technical specifications
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
            Save Draft
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

      {/* Lead/Customer Selection */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Lead & Customer</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lead <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.leadId}
              onChange={(e) => handleLeadChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              Customer <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} - {customer.mobile}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* SECTION 1: HEADER / CLIENT BLOCK */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h2 className="text-lg font-semibold text-blue-900 mb-4">1. HEADER / CLIENT BLOCK</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <input
              type="text"
              value={section1.companyName}
              onChange={(e) => setSection1({ ...section1, companyName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
            <input
              type="text"
              value={section1.clientName}
              onChange={(e) => setSection1({ ...section1, clientName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Purpose</label>
            <select
              value={section1.projectPurpose}
              onChange={(e) => setSection1({ ...section1, projectPurpose: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select</option>
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
              <option value="Industrial">Industrial</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">System Size (kW)</label>
            <input
              type="number"
              step="0.1"
              value={section1.systemSize}
              onChange={(e) => setSection1({ ...section1, systemSize: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phase</label>
            <select
              value={section1.phase}
              onChange={(e) => setSection1({ ...section1, phase: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select</option>
              <option value="1ph">1 Phase</option>
              <option value="3ph">3 Phase</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Site Location</label>
            <input
              type="text"
              value={section1.siteLocation}
              onChange={(e) => setSection1({ ...section1, siteLocation: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="City, State"
            />
          </div>
        </div>
      </Card>

      {/* SECTION 2: SITE SPECIFICATION */}
      <Card className="p-6 bg-green-50 border-green-200">
        <h2 className="text-lg font-semibold text-green-900 mb-4">2. SITE SPECIFICATION</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={section2.location}
              onChange={(e) => setSection2({ ...section2, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <input
              type="text"
              value={section2.siteState}
              onChange={(e) => setSection2({ ...section2, siteState: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Roof Type</label>
            <select
              value={section2.roofType}
              onChange={(e) => setSection2({ ...section2, roofType: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select</option>
              <option value="Roof">Roof</option>
              <option value="Ground">Ground</option>
              <option value="Tin Shed">Tin Shed</option>
              <option value="RCC">RCC</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
            <input
              type="number"
              step="0.000001"
              value={section2.latitude}
              onChange={(e) => setSection2({ ...section2, latitude: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="e.g., 19.0760"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
            <input
              type="number"
              step="0.000001"
              value={section2.longitude}
              onChange={(e) => setSection2({ ...section2, longitude: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="e.g., 72.8777"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Solar Radiation (kWh/m²/day)</label>
            <input
              type="number"
              step="0.1"
              value={section2.solarRadiation}
              onChange={(e) => setSection2({ ...section2, solarRadiation: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="e.g., 5.5"
            />
          </div>
        </div>
      </Card>

      {/* SECTION 3: SOLAR SYSTEM SPECIFICATION */}
      <Card className="p-6 bg-purple-50 border-purple-200">
        <h2 className="text-lg font-semibold text-purple-900 mb-4">3. SOLAR SYSTEM SPECIFICATION</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">DC Capacity (kW)</label>
            <input
              type="number"
              step="0.1"
              value={section3.dcCapacity}
              onChange={(e) => setSection3({ ...section3, dcCapacity: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Module Technology</label>
            <input
              type="text"
              value={section3.moduleTechnology}
              onChange={(e) => setSection3({ ...section3, moduleTechnology: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="e.g., Mono PERC"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Inverter Type</label>
            <input
              type="text"
              value={section3.inverterType}
              onChange={(e) => setSection3({ ...section3, inverterType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="e.g., String Inverter"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mounting Structure</label>
            <input
              type="text"
              value={section3.mountingStructure}
              onChange={(e) => setSection3({ ...section3, mountingStructure: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="e.g., Elevated GI"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Safety Devices</label>
            <input
              type="text"
              value={section3.safetyDevices}
              onChange={(e) => setSection3({ ...section3, safetyDevices: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Power Evacuation</label>
            <input
              type="text"
              value={section3.powerEvacuation}
              onChange={(e) => setSection3({ ...section3, powerEvacuation: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Scheme</label>
            <input
              type="text"
              value={section3.projectScheme}
              onChange={(e) => setSection3({ ...section3, projectScheme: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Panel Brand</label>
            <input
              type="text"
              value={section3.panelBrand}
              onChange={(e) => setSection3({ ...section3, panelBrand: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Inverter Brand</label>
            <input
              type="text"
              value={section3.inverterBrand}
              onChange={(e) => setSection3({ ...section3, inverterBrand: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </Card>

      {/* SECTION 4: DEVELOPER DETAILS */}
      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <h2 className="text-lg font-semibold text-yellow-900 mb-4">4. DEVELOPER DETAILS</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Developer Name</label>
            <input
              type="text"
              value={section4.developerName}
              onChange={(e) => setSection4({ ...section4, developerName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Offer Date</label>
            <input
              type="date"
              value={section4.quotationDate}
              onChange={(e) => setSection4({ ...section4, quotationDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Offer Validity (Days)</label>
            <input
              type="number"
              value={section4.offerValidityDays}
              onChange={(e) => setSection4({ ...section4, offerValidityDays: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </Card>

      {/* SECTION 5: MONTHLY SOLAR DATA (JAN-DEC) */}
      <Card className="p-6 bg-orange-50 border-orange-200">
        <h2 className="text-lg font-semibold text-orange-900 mb-4">5. MONTHLY SOLAR DATA (kWh/m²/day)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {MONTHS.map((month, idx) => (
            <div key={month}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{MONTH_NAMES[idx]}</label>
              <input
                type="number"
                step="0.1"
                value={section5[month]}
                onChange={(e) => setSection5({ ...section5, [month]: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          ))}
        </div>
      </Card>

      {/* SECTION 6: TECHNICAL DETAILS TABLE */}
      <Card className="p-6 bg-indigo-50 border-indigo-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-indigo-900">6. TECHNICAL DETAILS (Dynamic Table)</h2>
          <Button
            variant="secondary"
            size="sm"
            onClick={addLineItem}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Component
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-indigo-100">
              <tr>
                <th className="px-3 py-2 text-left border">#</th>
                <th className="px-3 py-2 text-left border">Component</th>
                <th className="px-3 py-2 text-left border">Specification</th>
                <th className="px-3 py-2 text-left border">Quantity</th>
                <th className="px-3 py-2 text-left border">Make/Brand</th>
                <th className="px-3 py-2 text-left border">Unit</th>
                <th className="px-3 py-2 text-left border">Price</th>
                <th className="px-3 py-2 text-left border">GST%</th>
                <th className="px-3 py-2 text-left border">Total</th>
                <th className="px-3 py-2 text-left border"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {section6.map((item) => (
                <tr key={item.tempId} className="hover:bg-indigo-50">
                  <td className="px-3 py-2 border">{item.lineNumber}</td>
                  <td className="px-3 py-2 border">
                    <input
                      type="text"
                      value={item.component}
                      onChange={(e) => updateLineItem(item.tempId, 'component', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      placeholder="e.g., Solar Panel"
                    />
                  </td>
                  <td className="px-3 py-2 border">
                    <input
                      type="text"
                      value={item.specification}
                      onChange={(e) => updateLineItem(item.tempId, 'specification', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      placeholder="e.g., 540W Mono PERC"
                    />
                  </td>
                  <td className="px-3 py-2 border">
                    <input
                      type="number"
                      min="0"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(item.tempId, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-3 py-2 border">
                    <input
                      type="text"
                      value={item.make || ''}
                      onChange={(e) => updateLineItem(item.tempId, 'make', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      placeholder="e.g., Longi"
                    />
                  </td>
                  <td className="px-3 py-2 border">
                    <select
                      value={item.unit}
                      onChange={(e) => updateLineItem(item.tempId, 'unit', e.target.value)}
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                    >
                      <option value="Nos">Nos</option>
                      <option value="Kg">Kg</option>
                      <option value="Mtr">Mtr</option>
                      <option value="Set">Set</option>
                      <option value="Lot">Lot</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 border">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateLineItem(item.tempId, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-3 py-2 border">
                    <select
                      value={item.gstRate}
                      onChange={(e) => updateLineItem(item.tempId, 'gstRate', parseFloat(e.target.value))}
                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                    >
                      <option value="0">0%</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18%</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 border font-medium">
                    ₹{item.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 border">
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

        {section6.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No components added. Click "Add Component" to start.
          </div>
        )}
      </Card>

      {/* SECTION 7: OFFER & PRICING */}
      <Card className="p-6 bg-pink-50 border-pink-200">
        <h2 className="text-lg font-semibold text-pink-900 mb-4">7. OFFER & PRICING</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plant Capacity (kW)</label>
            <input
              type="number"
              step="0.1"
              value={section7.plantCapacity}
              onChange={(e) => setSection7({ ...section7, plantCapacity: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price Basis</label>
            <select
              value={section7.priceBasis}
              onChange={(e) => setSection7({ ...section7, priceBasis: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="Per KW">Per KW</option>
              <option value="Lump Sum">Lump Sum</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (₹)</label>
            <input
              type="number"
              step="0.01"
              value={section7.basePrice}
              onChange={(e) => setSection7({ ...section7, basePrice: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div className="max-w-md ml-auto space-y-3 bg-white p-4 rounded-lg border-2 border-pink-300">
          <div className="flex items-center justify-between pb-3 border-b">
            <label className="text-sm font-medium text-gray-700">Discount (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={section7.discountPercent}
              onChange={(e) => setSection7({ ...section7, discountPercent: e.target.value })}
              className="w-24 px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
            />
          </div>

          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span className="font-medium">₹{totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>

          {parseFloat(section7.discountPercent) > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount ({section7.discountPercent}%):</span>
              <span>- ₹{totals.discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span>Taxable Amount:</span>
            <span className="font-medium">₹{totals.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span>GST ({section7.gstPercent}%):</span>
            <span className="font-medium">₹{totals.totalGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span>Round Off:</span>
            <span className="font-medium">₹{totals.roundOff.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t-2 border-pink-300">
            <span>Grand Total:</span>
            <span>₹{totals.grandTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </Card>

      {/* SECTION 8: PAYMENT SCHEDULE */}
      <Card className="p-6 bg-teal-50 border-teal-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-teal-900">8. PAYMENT SCHEDULE</h2>
            <p className="text-sm text-gray-600 mt-1">
              Total: {totalPaymentPercent}% {totalPaymentPercent !== 100 && <span className="text-red-600">(Should be 100%)</span>}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={addPaymentRow}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Row
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-teal-100">
              <tr>
                <th className="px-3 py-2 text-left border">Percentage (%)</th>
                <th className="px-3 py-2 text-left border">Condition</th>
                <th className="px-3 py-2 text-left border"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {section8.map((row) => (
                <tr key={row.id} className="hover:bg-teal-50">
                  <td className="px-3 py-2 border">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={row.percentage}
                      onChange={(e) => updatePaymentRow(row.id, 'percentage', parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-3 py-2 border">
                    <input
                      type="text"
                      value={row.condition}
                      onChange={(e) => updatePaymentRow(row.id, 'condition', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      placeholder="e.g., On Booking"
                    />
                  </td>
                  <td className="px-3 py-2 border">
                    <button
                      onClick={() => removePaymentRow(row.id)}
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
      </Card>

      {/* Terms & Conditions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">General Terms & Conditions</h2>
        <textarea
          value={formData.termsAndConditions}
          onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Enter general terms and conditions..."
        />
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pb-8">
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
          Save Draft
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
