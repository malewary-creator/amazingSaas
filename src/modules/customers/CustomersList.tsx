/**
 * Customers List Component
 * Display and manage all customers
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Users,
  UserCheck,
  Briefcase,
} from 'lucide-react';
import { customersService } from '@/services/customersService';
import type { Customer } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToastStore } from '@/store/toastStore';

export default function CustomersList() {
  const navigate = useNavigate();
  const toast = useToastStore();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  
  const [stats, setStats] = useState({
    total: 0,
    withLeads: 0,
    withProjects: 0,
  });

  const [cities, setCities] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);

  useEffect(() => {
    loadCustomers();
    loadStats();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, cityFilter, stateFilter, customers]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await customersService.getCustomers();
      setCustomers(data);

      // Extract unique cities and states
      const uniqueCities = [...new Set(data.map(c => c.address.city))].sort();
      const uniqueStates = [...new Set(data.map(c => c.address.state))].sort();
      setCities(uniqueCities);
      setStates(uniqueStates);
    } catch (error) {
      console.error('Failed to load customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await customersService.getCustomerStats();
      setStats({
        total: statsData.total,
        withLeads: statsData.withLeads,
        withProjects: statsData.withProjects,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...customers];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        c =>
          c.customerId?.toLowerCase().includes(term) ||
          c.name.toLowerCase().includes(term) ||
          c.mobile.includes(term) ||
          c.email?.toLowerCase().includes(term)
      );
    }

    // City filter
    if (cityFilter) {
      filtered = filtered.filter(c => c.address.city === cityFilter);
    }

    // State filter
    if (stateFilter) {
      filtered = filtered.filter(c => c.address.state === stateFilter);
    }

    setFilteredCustomers(filtered);
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return;

    try {
      const result = await customersService.deleteCustomer(selectedCustomer);
      
      if (result.success) {
        toast.success('Customer deleted successfully');
        loadCustomers();
        loadStats();
      } else {
        toast.error(result.message || 'Failed to delete customer');
      }
    } catch (error) {
      console.error('Failed to delete customer:', error);
      toast.error('Failed to delete customer');
    } finally {
      setShowDeleteModal(false);
      setSelectedCustomer(null);
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="mt-2 text-gray-600">Manage your customer database</p>
        </div>
        <Link to="/customers/new">
          <Button icon={<Plus className="h-4 w-4" />}>Add New Customer</Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">With Leads</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.withLeads}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <UserCheck className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">With Projects</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.withProjects}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Briefcase className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card title="Filters">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by ID, name, mobile, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* City Filter */}
            <div>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">All Cities</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* State Filter */}
            <div>
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">All States</option>
                {states.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Customers Table */}
      <Card title={`Customers (${filteredCustomers.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name & Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    {searchTerm || cityFilter || stateFilter
                      ? 'No customers found matching your filters'
                      : 'No customers yet. Create your first customer!'}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {customer.customerId}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {customer.mobile}
                        </div>
                        {customer.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {customer.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-1 text-sm text-gray-900">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span>
                          {customer.address.city}, {customer.address.state}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(customer.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/customers/${customer.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/customers/${customer.id}/edit`)}
                          className="text-orange-600 hover:text-orange-900"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCustomer(customer.id!);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedCustomer(null);
        }}
        onConfirm={handleDelete}
        title="Delete Customer"
        message="Are you sure you want to delete this customer? This action cannot be undone if there are no associated records (leads, projects, etc.)."
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
      />
    </div>
  );
}
