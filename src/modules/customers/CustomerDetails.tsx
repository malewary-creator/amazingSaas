/**
 * Customer Details Component
 * View detailed customer information and related records
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Zap,
  CheckCircle,
  Clock,
  Briefcase,
} from 'lucide-react';
import { customersService } from '@/services/customersService';
import type { Customer } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToastStore } from '@/store/toastStore';

export default function CustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToastStore();

  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [relatedData, setRelatedData] = useState<{
    leads: any[];
    surveys: any[];
    quotations: any[];
    projects: any[];
    documents: any[];
  } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadCustomerDetails();
  }, [id]);

  const loadCustomerDetails = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await customersService.getCustomerWithRelatedData(parseInt(id));
      if (!data) {
        toast.error('Customer not found');
        navigate('/customers');
        return;
      }
      setCustomer(data.customer);
      setRelatedData({
        leads: data.leads,
        surveys: data.surveys,
        quotations: data.quotations,
        projects: data.projects,
        documents: data.documents,
      });
    } catch (error) {
      console.error('Failed to load customer:', error);
      toast.error('Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    try {
      const result = await customersService.deleteCustomer(parseInt(id));
      
      if (result.success) {
        toast.success('Customer deleted successfully');
        navigate('/customers');
      } else {
        toast.error(result.message || 'Failed to delete customer');
      }
    } catch (error) {
      console.error('Failed to delete customer:', error);
      toast.error('Failed to delete customer');
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getLeadStatusColor = (status: string) => {
    switch (status) {
      case 'New':
        return 'bg-blue-100 text-blue-800';
      case 'In-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Converted':
        return 'bg-green-100 text-green-800';
      case 'Lost':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Customer not found</p>
        <Button onClick={() => navigate('/customers')} className="mt-4">
          Back to Customers
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button
            variant="secondary"
            icon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate('/customers')}
          >
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{customer.name}</h1>
              {customer.customerId && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {customer.customerId}
                </span>
              )}
            </div>
            <p className="mt-2 text-gray-600">
              Customer since {formatDate(customer.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            icon={<Edit className="h-4 w-4" />}
            onClick={() => navigate(`/customers/${id}/edit`)}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            icon={<Trash2 className="h-4 w-4" />}
            onClick={() => setShowDeleteModal(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <Card title="Contact Information">
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium text-gray-900">{customer.name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Primary Mobile</p>
                  <p className="font-medium text-gray-900">{customer.mobile}</p>
                </div>
              </div>

              {customer.secondaryMobile && (
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Secondary Mobile</p>
                    <p className="font-medium text-gray-900">{customer.secondaryMobile}</p>
                  </div>
                </div>
              )}

              {customer.email && (
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{customer.email}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium text-gray-900">
                    {customer.address.houseNo && `${customer.address.houseNo}, `}
                    {customer.address.area && `${customer.address.area}, `}
                    {customer.address.city}
                    {customer.address.district && `, ${customer.address.district}`}
                    <br />
                    {customer.address.state} - {customer.address.pincode}
                    {customer.address.landmark && (
                      <>
                        <br />
                        <span className="text-gray-600 text-sm">Near: {customer.address.landmark}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Related Leads */}
          {relatedData && relatedData.leads.length > 0 && (
            <Card title={`Leads (${relatedData.leads.length})`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Lead ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Source
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {relatedData.leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {lead.leadId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLeadStatusColor(lead.status)}`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {lead.source}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(lead.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <Link
                            to={`/leads/${lead.id}`}
                            className="text-orange-600 hover:text-orange-900 font-medium"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Related Projects */}
          {relatedData && relatedData.projects.length > 0 && (
            <Card title={`Projects (${relatedData.projects.length})`}>
              <div className="p-6">
                <div className="space-y-3">
                  {relatedData.projects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <Briefcase className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{project.projectId}</p>
                          <p className="text-sm text-gray-500">{project.systemSize} kW System</p>
                        </div>
                      </div>
                      <Link
                        to={`/projects/${project.id}`}
                        className="text-orange-600 hover:text-orange-900 font-medium text-sm"
                      >
                        View Project
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Related Quotations */}
          {relatedData && relatedData.quotations.length > 0 && (
            <Card title={`Quotations (${relatedData.quotations.length})`}>
              <div className="p-6">
                <div className="space-y-3">
                  {relatedData.quotations.map((quotation) => (
                    <div
                      key={quotation.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{quotation.quotationId}</p>
                          <p className="text-sm text-gray-500">{formatDate(quotation.createdAt)}</p>
                        </div>
                      </div>
                      <Link
                        to={`/quotations/${quotation.id}`}
                        className="text-orange-600 hover:text-orange-900 font-medium text-sm"
                      >
                        View Quotation
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card title="Overview">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-600">Leads</span>
                </div>
                <span className="font-semibold text-gray-900">
                  {relatedData?.leads.length || 0}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-gray-600">Surveys</span>
                </div>
                <span className="font-semibold text-gray-900">
                  {relatedData?.surveys.length || 0}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Quotations</span>
                </div>
                <span className="font-semibold text-gray-900">
                  {relatedData?.quotations.length || 0}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-gray-600">Projects</span>
                </div>
                <span className="font-semibold text-gray-900">
                  {relatedData?.projects.length || 0}
                </span>
              </div>
            </div>
          </Card>

          {/* Timeline */}
          <Card title="Timeline">
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Customer Created</p>
                  <p className="text-sm text-gray-500">{formatDate(customer.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Last Updated</p>
                  <p className="text-sm text-gray-500">{formatDate(customer.updatedAt)}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card title="Quick Actions">
            <div className="p-6 space-y-3">
              <Link to={`/leads/new?customerId=${id}`}>
                <Button variant="secondary" className="w-full justify-start">
                  <Zap className="h-4 w-4 mr-2" />
                  Create Lead
                </Button>
              </Link>
              <Link to={`/surveys/new?customerId=${id}`}>
                <Button variant="secondary" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Schedule Survey
                </Button>
              </Link>
              <Link to={`/quotations/new?customerId=${id}`}>
                <Button variant="secondary" className="w-full justify-start">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Create Quotation
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Customer"
        message={`Are you sure you want to delete ${customer.name}? This action can only be performed if there are no associated records (leads, projects, etc.).`}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
}
