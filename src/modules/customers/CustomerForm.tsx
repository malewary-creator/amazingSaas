/**
 * Customer Form Component
 * Create/Edit customer information
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, X } from 'lucide-react';
import { customersService } from '@/services/customersService';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToastStore } from '@/store/toastStore';

export default function CustomerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToastStore();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [secondaryMobile, setSecondaryMobile] = useState('');
  const [email, setEmail] = useState('');
  
  const [address, setAddress] = useState({
    houseNo: '',
    area: '',
    city: '',
    district: '',
    state: '',
    pincode: '',
    landmark: '',
  });

  useEffect(() => {
    if (isEdit) {
      loadCustomer();
    }
  }, [id]);

  const loadCustomer = async () => {
    if (!id) return;

    try {
      const customer = await customersService.getCustomerById(parseInt(id));
      if (!customer) {
        toast.error('Customer not found');
        navigate('/customers');
        return;
      }

      setName(customer.name);
      setMobile(customer.mobile);
      setSecondaryMobile(customer.secondaryMobile || '');
      setEmail(customer.email || '');
      setAddress({
        houseNo: customer.address.houseNo || '',
        area: customer.address.area || '',
        city: customer.address.city,
        district: customer.address.district || '',
        state: customer.address.state,
        pincode: customer.address.pincode,
        landmark: customer.address.landmark || '',
      });
    } catch (error) {
      console.error('Failed to load customer:', error);
      toast.error('Failed to load customer');
    }
  };

  const validateForm = async () => {
    if (!name.trim()) {
      toast.error('Customer name is required');
      return false;
    }
    
    if (!mobile.trim() || mobile.length !== 10) {
      toast.error('Valid 10-digit mobile number is required');
      return false;
    }

    // Check if mobile is already registered
    const mobileExists = await customersService.isMobileRegistered(
      mobile,
      isEdit ? parseInt(id!) : undefined
    );
    if (mobileExists) {
      toast.error('Mobile number is already registered');
      return false;
    }

    if (secondaryMobile && secondaryMobile.length !== 10) {
      toast.error('Secondary mobile must be 10 digits');
      return false;
    }

    if (!address.city || !address.state || !address.pincode) {
      toast.error('City, State, and Pincode are required');
      return false;
    }

    if (address.pincode.length !== 6) {
      toast.error('Pincode must be 6 digits');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!(await validateForm())) return;

    setLoading(true);

    try {
      const customerData = {
        name: name.trim(),
        mobile,
        secondaryMobile: secondaryMobile || undefined,
        email: email || undefined,
        address: {
          houseNo: address.houseNo || undefined,
          area: address.area || undefined,
          city: address.city,
          district: address.district || undefined,
          state: address.state,
          pincode: address.pincode,
          landmark: address.landmark || undefined,
        },
      };

      if (isEdit && id) {
        await customersService.updateCustomer(parseInt(id), customerData);
        toast.success('Customer updated successfully');
      } else {
        await customersService.createCustomer(customerData);
        toast.success('Customer created successfully');
      }

      navigate('/customers');
    } catch (error) {
      console.error('Failed to save customer:', error);
      toast.error('Failed to save customer');
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
            {isEdit ? 'Edit Customer' : 'Add New Customer'}
          </h1>
          <p className="mt-2 text-gray-600">
            {isEdit ? 'Update customer information' : 'Create a new customer profile'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            icon={<X className="h-4 w-4" />}
            onClick={() => navigate('/customers')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            icon={<Save className="h-4 w-4" />}
            loading={loading}
          >
            {isEdit ? 'Update Customer' : 'Save Customer'}
          </Button>
        </div>
      </div>

      {/* Basic Information */}
      <Card title="Basic Information">
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter customer name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="10-digit mobile number"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Secondary Mobile
            </label>
            <input
              type="tel"
              value={secondaryMobile}
              onChange={(e) => setSecondaryMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Optional secondary number"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="customer@example.com"
            />
          </div>
        </div>
      </Card>

      {/* Address Information */}
      <Card title="Address Information">
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              House/Plot Number
            </label>
            <input
              type="text"
              value={address.houseNo}
              onChange={(e) => setAddress({ ...address, houseNo: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="e.g., A-101, Plot 45"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Area/Locality
            </label>
            <input
              type="text"
              value={address.area}
              onChange={(e) => setAddress({ ...address, area: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="e.g., Andheri West, Sector 21"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={address.city}
              onChange={(e) => setAddress({ ...address, city: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter city"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              District
            </label>
            <input
              type="text"
              value={address.district}
              onChange={(e) => setAddress({ ...address, district: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter district"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={address.state}
              onChange={(e) => setAddress({ ...address, state: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter state"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pincode <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={address.pincode}
              onChange={(e) => setAddress({ ...address, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="6-digit pincode"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Landmark
            </label>
            <input
              type="text"
              value={address.landmark}
              onChange={(e) => setAddress({ ...address, landmark: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Near famous location or building"
            />
          </div>
        </div>
      </Card>
    </form>
  );
}
