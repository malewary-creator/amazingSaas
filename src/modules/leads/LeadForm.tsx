/**
 * Lead Form Component
 * Create/Edit lead with customer details
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, X } from 'lucide-react';
import { leadsService } from '@/services/leadsService';
import { db } from '@/services/database';
import type { Lead, Customer, LeadSource, LeadStatus } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToastStore } from '@/store/toastStore';
import { useAuthStore } from '@/store/authStore';

export default function LeadForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToastStore();
  const { user } = useAuthStore();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isNewCustomer, setIsNewCustomer] = useState(true);

  // Customer fields
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState({
    city: '',
    state: '',
    pincode: '',
    area: '' as string | undefined,
  });
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  // Lead fields
  const [source, setSource] = useState<LeadSource>('Referral');
  const [sourceDetails, setSourceDetails] = useState('');
  const [status, setStatus] = useState<LeadStatus>('New');
  const [assignedTo, setAssignedTo] = useState<number | undefined>(user?.id);
  
  // Electricity details
  const [discomName, setDiscomName] = useState('');
  const [consumerNumber, setConsumerNumber] = useState('');
  const [meterType, setMeterType] = useState<'Single Phase' | 'Three Phase'>('Single Phase');
  const [sanctionedLoad, setSanctionedLoad] = useState('');
  const [avgMonthlyBill, setAvgMonthlyBill] = useState('');
  
  // Requirements
  const [requiredSystemSize, setRequiredSystemSize] = useState('');
  const [systemType, setSystemType] = useState<'On-grid' | 'Off-grid' | 'Hybrid'>('On-grid');
  const [roofType, setRoofType] = useState<'RCC' | 'Sheet' | 'Tile' | 'Ground'>('RCC');
  const [tentativeBudget, setTentativeBudget] = useState('');
  const [installationReason, setInstallationReason] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  useEffect(() => {
    loadCustomers();
    if (isEdit) {
      loadLead();
    }
  }, [id]);

  const loadCustomers = async () => {
    const customersData = await db.customers.toArray();
    setCustomers(customersData);
  };

  const loadLead = async () => {
    if (!id) return;

    try {
      const leadData = await leadsService.getLeadWithCustomer(parseInt(id));
      if (!leadData) {
        toast.error('Lead not found');
        navigate('/leads');
        return;
      }

      const { lead, customer } = leadData;

      // Set customer data
      setIsNewCustomer(false);
      setSelectedCustomerId(customer.id!);
      setCustomerName(customer.name);
      setCustomerMobile(customer.mobile);
      setCustomerEmail(customer.email || '');
      setCustomerAddress({
        city: customer.address.city,
        state: customer.address.state,
        pincode: customer.address.pincode,
        area: customer.address.area,
      });

      // Set lead data
      setSource(lead.source);
      setSourceDetails(lead.sourceDetails || '');
      setStatus(lead.status);
      setAssignedTo(lead.assignedTo);
      setDiscomName(lead.discomName || '');
      setConsumerNumber(lead.consumerNumber || '');
      setMeterType(lead.meterType || 'Single Phase');
      setSanctionedLoad(lead.sanctionedLoad?.toString() || '');
      setAvgMonthlyBill(lead.avgMonthlyBill?.toString() || '');
      setRequiredSystemSize(lead.requiredSystemSize?.toString() || '');
      setSystemType(lead.systemType || 'On-grid');
      setRoofType(lead.roofType || 'RCC');
      setTentativeBudget(lead.tentativeBudget?.toString() || '');
      setInstallationReason(lead.installationReason || '');
      if (lead.followUpDate) {
        setFollowUpDate(new Date(lead.followUpDate).toISOString().split('T')[0]);
      }
    } catch (error) {
      console.error('Failed to load lead:', error);
      toast.error('Failed to load lead');
    }
  };

  const handleCustomerSelect = async (customerId: number) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setSelectedCustomerId(customer.id!);
      setCustomerName(customer.name);
      setCustomerMobile(customer.mobile);
      setCustomerEmail(customer.email || '');
      setCustomerAddress({
        city: customer.address.city,
        state: customer.address.state,
        pincode: customer.address.pincode,
        area: customer.address.area,
      });
    }
  };

  const validateForm = (): boolean => {
    if (!customerName.trim()) {
      toast.error('Customer name is required');
      return false;
    }
    if (!customerMobile.trim() || customerMobile.length !== 10) {
      toast.error('Valid 10-digit mobile number is required');
      return false;
    }
    if (!customerAddress.city || !customerAddress.state || !customerAddress.pincode) {
      toast.error('Customer address (city, state, pincode) is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      let customerId = selectedCustomerId;

      // Create customer if new
      if (isNewCustomer || !customerId) {
        const newCustomerId = await db.customers.add({
          name: customerName,
          mobile: customerMobile,
          email: customerEmail || undefined,
          address: customerAddress,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        customerId = newCustomerId as number;
      } else {
        // Update existing customer
        await db.customers.update(customerId, {
          name: customerName,
          mobile: customerMobile,
          email: customerEmail || undefined,
          address: customerAddress,
          updatedAt: new Date(),
        });
      }

      // Prepare lead data
      const leadData: Omit<Lead, 'id' | 'leadId' | 'createdAt' | 'updatedAt'> = {
        customerId,
        source,
        sourceDetails: sourceDetails || undefined,
        status,
        assignedTo,
        discomName: discomName || undefined,
        consumerNumber: consumerNumber || undefined,
        meterType,
        sanctionedLoad: sanctionedLoad ? parseFloat(sanctionedLoad) : undefined,
        avgMonthlyBill: avgMonthlyBill ? parseFloat(avgMonthlyBill) : undefined,
        requiredSystemSize: requiredSystemSize ? parseFloat(requiredSystemSize) : undefined,
        systemType,
        roofType,
        tentativeBudget: tentativeBudget ? parseFloat(tentativeBudget) : undefined,
        installationReason: installationReason || undefined,
        followUpDate: followUpDate ? new Date(followUpDate) : undefined,
      };

      if (isEdit && id) {
        // Update lead
        await leadsService.updateLead(parseInt(id), leadData);
        toast.success('Lead updated successfully');
      } else {
        // Create lead
        await leadsService.createLead(leadData);
        toast.success('Lead created successfully');
      }

      navigate('/leads');
    } catch (error) {
      console.error('Failed to save lead:', error);
      toast.error('Failed to save lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Edit Lead' : 'Add New Lead'}
          </h1>
          <p className="mt-2 text-gray-600">
            {isEdit ? 'Update lead information' : 'Create a new solar lead'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            icon={<X className="h-4 w-4" />}
            onClick={() => navigate('/leads')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            icon={<Save className="h-4 w-4" />}
            loading={loading}
          >
            {isEdit ? 'Update Lead' : 'Save Lead'}
          </Button>
        </div>
      </div>

      {/* Customer Selection */}
      {!isEdit && (
        <Card title="Select Customer">
          <div className="p-6 space-y-4">
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={isNewCustomer}
                  onChange={() => setIsNewCustomer(true)}
                  className="text-orange-600 focus:ring-orange-500"
                />
                <span className="text-sm font-medium text-gray-700">New Customer</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={!isNewCustomer}
                  onChange={() => setIsNewCustomer(false)}
                  className="text-orange-600 focus:ring-orange-500"
                />
                <span className="text-sm font-medium text-gray-700">Existing Customer</span>
              </label>
            </div>

            {!isNewCustomer && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Existing Customer
                </label>
                <select
                  value={selectedCustomerId || ''}
                  onChange={(e) => handleCustomerSelect(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required={!isNewCustomer}
                >
                  <option value="">Choose a customer...</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} - {customer.mobile}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Customer Details */}
      <Card title="Customer Information">
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter customer name"
              required
              disabled={!isNewCustomer && !isEdit}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={customerMobile}
              onChange={(e) => setCustomerMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="10-digit mobile number"
              required
              disabled={!isNewCustomer && !isEdit}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="customer@example.com"
              disabled={!isNewCustomer && !isEdit}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={customerAddress.city}
              onChange={(e) => setCustomerAddress({ ...customerAddress, city: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter city"
              required
              disabled={!isNewCustomer && !isEdit}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={customerAddress.state}
              onChange={(e) => setCustomerAddress({ ...customerAddress, state: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter state"
              required
              disabled={!isNewCustomer && !isEdit}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pincode <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={customerAddress.pincode}
              onChange={(e) => setCustomerAddress({ ...customerAddress, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="6-digit pincode"
              required
              disabled={!isNewCustomer && !isEdit}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Area/Locality
            </label>
            <input
              type="text"
              value={customerAddress.area}
              onChange={(e) => setCustomerAddress({ ...customerAddress, area: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter area or locality"
              disabled={!isNewCustomer && !isEdit}
            />
          </div>
        </div>
      </Card>

      {/* Lead Details */}
      <Card title="Lead Information">
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lead Source <span className="text-red-500">*</span>
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as LeadSource)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            >
              <option value="Referral">Referral</option>
              <option value="Walk-in">Walk-in</option>
              <option value="Social Media">Social Media</option>
              <option value="Website">Website</option>
              <option value="Advertisement">Advertisement</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Source Details
            </label>
            <input
              type="text"
              value={sourceDetails}
              onChange={(e) => setSourceDetails(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Referral name or campaign details"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as LeadStatus)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            >
              <option value="New">New</option>
              <option value="In-progress">In Progress</option>
              <option value="Converted">Converted</option>
              <option value="Lost">Lost</option>
              <option value="On-hold">On Hold</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Follow-up Date
            </label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>
      </Card>

      {/* Electricity Connection Details */}
      <Card title="Electricity Connection Details">
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              DISCOM Name
            </label>
            <input
              type="text"
              value={discomName}
              onChange={(e) => setDiscomName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="e.g., MSEDCL, BEST, Torrent Power"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Consumer Number
            </label>
            <input
              type="text"
              value={consumerNumber}
              onChange={(e) => setConsumerNumber(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter consumer number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meter Type
            </label>
            <select
              value={meterType}
              onChange={(e) => setMeterType(e.target.value as 'Single Phase' | 'Three Phase')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="Single Phase">Single Phase</option>
              <option value="Three Phase">Three Phase</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sanctioned Load (kW)
            </label>
            <input
              type="number"
              step="0.1"
              value={sanctionedLoad}
              onChange={(e) => setSanctionedLoad(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="e.g., 5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Avg. Monthly Bill (₹)
            </label>
            <input
              type="number"
              value={avgMonthlyBill}
              onChange={(e) => setAvgMonthlyBill(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="e.g., 5000"
            />
          </div>
        </div>
      </Card>

      {/* System Requirements */}
      <Card title="System Requirements">
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Required System Size (kW)
            </label>
            <input
              type="number"
              step="0.1"
              value={requiredSystemSize}
              onChange={(e) => setRequiredSystemSize(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="e.g., 3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              System Type
            </label>
            <select
              value={systemType}
              onChange={(e) => setSystemType(e.target.value as 'On-grid' | 'Off-grid' | 'Hybrid')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="On-grid">On-grid</option>
              <option value="Off-grid">Off-grid</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Roof Type
            </label>
            <select
              value={roofType}
              onChange={(e) => setRoofType(e.target.value as 'RCC' | 'Sheet' | 'Tile' | 'Ground')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="RCC">RCC (Concrete)</option>
              <option value="Sheet">Sheet Metal</option>
              <option value="Tile">Tile</option>
              <option value="Ground">Ground Mounted</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tentative Budget (₹)
            </label>
            <input
              type="number"
              value={tentativeBudget}
              onChange={(e) => setTentativeBudget(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="e.g., 150000"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Installation Reason / Requirements
            </label>
            <textarea
              value={installationReason}
              onChange={(e) => setInstallationReason(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Why does the customer want to install solar? What are their specific requirements?"
            />
          </div>
        </div>
      </Card>
    </form>
  );
}
