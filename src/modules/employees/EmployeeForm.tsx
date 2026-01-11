import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { employeeService } from '@/services/employeeService';
import type { Employee, EmployeeCategory } from '@/types';
import { Save, X, AlertCircle } from 'lucide-react';

const EMPLOYEE_CATEGORIES: EmployeeCategory[] = [
  'Computer Operator',
  'Welder',
  'Labour',
  'Temporary Hiring',
  'Supervisor',
];

const ID_PROOF_TYPES = ['Aadhaar', 'PAN', 'Passport', 'Driving License', 'Voter ID'];

interface EmployeeFormData {
  name: string;
  category: EmployeeCategory | '';
  phone: string;
  email: string;
  city: string;
  state: string;
  pincode: string;
  idProofType: string;
  idProofNumber: string;
  joiningDate: string;
  status: 'active' | 'inactive';
  emergencyContactName: string;
  emergencyContactPhone: string;
  bankAccountNumber: string;
  ifscCode: string;
}

export const EmployeeForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;

  const [formData, setFormData] = useState<EmployeeFormData>({
    name: '',
    category: '',
    phone: '',
    email: '',
    city: '',
    state: '',
    pincode: '',
    idProofType: 'Aadhaar',
    idProofNumber: '',
    joiningDate: new Date().toISOString().split('T')[0],
    status: 'active',
    emergencyContactName: '',
    emergencyContactPhone: '',
    bankAccountNumber: '',
    ifscCode: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEdit && id) {
      loadEmployee(parseInt(id));
    }
  }, [id, isEdit]);

  const loadEmployee = async (employeeId: number) => {
    try {
      const employee = await employeeService.getEmployeeById(employeeId);
      if (employee) {
        setFormData({
          name: employee.name,
          category: employee.category,
          phone: employee.phone || '',
          email: employee.email || '',
          city: employee.address?.city || '',
          state: employee.address?.state || '',
          pincode: employee.address?.pincode || '',
          idProofType: employee.idProofType || 'Aadhaar',
          idProofNumber: employee.idProofNumber || '',
          joiningDate: new Date(employee.joiningDate).toISOString().split('T')[0],
          status: employee.status as 'active' | 'inactive',
          emergencyContactName: employee.emergencyContactName || '',
          emergencyContactPhone: employee.emergencyContactPhone || '',
          bankAccountNumber: employee.bankAccountNumber || '',
          ifscCode: employee.ifscCode || '',
        });
      }
    } catch (error) {
      console.error('Error loading employee:', error);
      setErrors({ submit: 'Error loading employee details' });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Valid 10-digit phone required';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Valid email required';
    }
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.pincode.trim()) newErrors.pincode = 'Pincode is required';
    if (!formData.idProofNumber.trim()) newErrors.idProofNumber = 'ID Proof Number is required';
    if (!formData.joiningDate) newErrors.joiningDate = 'Joining date is required';
    if (!formData.emergencyContactName.trim()) newErrors.emergencyContactName = 'Emergency contact name is required';
    if (!formData.emergencyContactPhone.trim()) newErrors.emergencyContactPhone = 'Emergency phone is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const employeeData: Omit<Employee, 'id' | 'employeeId' | 'createdAt' | 'updatedAt'> = {
        name: formData.name.trim(),
        category: formData.category as EmployeeCategory,
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        address: {
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
        },
        idProofType: formData.idProofType as 'Aadhaar' | 'PAN' | 'Driving License' | 'Passport' | 'Voter ID',
        idProofNumber: formData.idProofNumber.trim(),
        joiningDate: new Date(formData.joiningDate),
        status: formData.status,
        emergencyContactName: formData.emergencyContactName.trim(),
        emergencyContactPhone: formData.emergencyContactPhone.trim(),
        bankAccountNumber: formData.bankAccountNumber.trim() || undefined,
        ifscCode: formData.ifscCode.trim().toUpperCase() || undefined,
      };

      if (isEdit && id) {
        await employeeService.updateEmployee(parseInt(id), employeeData);
      } else {
        await employeeService.createEmployee(employeeData);
      }

      navigate('/employees');
    } catch (error) {
      console.error('Error saving employee:', error);
      setErrors({ submit: 'Error saving employee. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Edit Employee' : 'Add New Employee'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isEdit ? 'Update employee information' : 'Create a new employee record'}
          </p>
        </div>
        <button
          onClick={() => navigate('/employees')}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {errors.submit && (
          <div className="border-b border-gray-200 bg-red-50 px-6 py-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{errors.submit}</p>
          </div>
        )}

        <div className="px-6 py-6 space-y-8">
          {/* Personal Information Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-600 rounded-full" />
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Employee name"
                />
                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value as EmployeeCategory })}
                  className={`w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.category ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Category</option>
                  {EMPLOYEE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {errors.category && <p className="text-xs text-red-600 mt-1">{errors.category}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="10-digit phone number"
                />
                {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="email@example.com"
                />
                {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.city ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="City"
                />
                {errors.city && <p className="text-xs text-red-600 mt-1">{errors.city}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={e => setFormData({ ...formData, state: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.state ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="State"
                />
                {errors.state && <p className="text-xs text-red-600 mt-1">{errors.state}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pincode <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.pincode ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Pincode"
                />
                {errors.pincode && <p className="text-xs text-red-600 mt-1">{errors.pincode}</p>}
              </div>
            </div>
          </div>

          {/* Identity & Employment Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-600 rounded-full" />
              Identity & Employment
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID Proof Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.idProofType}
                  onChange={e => setFormData({ ...formData, idProofType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {ID_PROOF_TYPES.map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID Proof Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.idProofNumber}
                  onChange={e => setFormData({ ...formData, idProofNumber: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.idProofNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="ID number"
                />
                {errors.idProofNumber && <p className="text-xs text-red-600 mt-1">{errors.idProofNumber}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Joining Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.joiningDate}
                  onChange={e => setFormData({ ...formData, joiningDate: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.joiningDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.joiningDate && <p className="text-xs text-red-600 mt-1">{errors.joiningDate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Emergency Contact Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-600 rounded-full" />
              Emergency Contact
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.emergencyContactName}
                  onChange={e => setFormData({ ...formData, emergencyContactName: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.emergencyContactName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Emergency contact name"
                />
                {errors.emergencyContactName && (
                  <p className="text-xs text-red-600 mt-1">{errors.emergencyContactName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.emergencyContactPhone}
                  onChange={e => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.emergencyContactPhone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="10-digit phone number"
                />
                {errors.emergencyContactPhone && <p className="text-xs text-red-600 mt-1">{errors.emergencyContactPhone}</p>}
              </div>
            </div>
          </div>

          {/* Bank Details Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-600 rounded-full" />
              Bank Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account Number</label>
                <input
                  type="text"
                  value={formData.bankAccountNumber}
                  onChange={e => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Account number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={formData.ifscCode}
                  onChange={e => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="IFSC code"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/employees')}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {submitting ? 'Saving...' : 'Save Employee'}
          </button>
        </div>
      </form>
    </div>
  );
};
