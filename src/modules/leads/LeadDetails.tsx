/**
 * Lead Details Component
 * View detailed information about a specific lead
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  User,
  Phone,
  Mail,
  MapPin,
  Zap,
  Home,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
} from 'lucide-react';
import { leadsService } from '@/services/leadsService';
import { db } from '@/services/database';
import type { Lead, Customer } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToastStore } from '@/store/toastStore';

export default function LeadDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToastStore();

  const [loading, setLoading] = useState(true);
  const [lead, setLead] = useState<Lead | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showLostModal, setShowLostModal] = useState(false);

  useEffect(() => {
    loadLeadDetails();
  }, [id]);

  const loadLeadDetails = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await leadsService.getLeadWithCustomer(parseInt(id));
      if (!data) {
        toast.error('Lead not found');
        navigate('/leads');
        return;
      }
      setLead(data.lead);
      setCustomer(data.customer);
    } catch (error) {
      console.error('Failed to load lead:', error);
      toast.error('Failed to load lead details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    try {
      await db.leads.delete(parseInt(id));
      toast.success('Lead deleted successfully');
      navigate('/leads');
    } catch (error) {
      console.error('Failed to delete lead:', error);
      toast.error('Failed to delete lead');
    }
  };

  const handleConvert = async () => {
    if (!id) return;

    try {
      await leadsService.convertLead(parseInt(id));
      toast.success('Lead converted successfully');
      loadLeadDetails();
    } catch (error) {
      console.error('Failed to convert lead:', error);
      toast.error('Failed to convert lead');
    }
  };

  const handleMarkAsLost = async () => {
    if (!id) return;

    try {
      await leadsService.updateLead(parseInt(id), { status: 'Lost' });
      toast.success('Lead marked as lost');
      loadLeadDetails();
    } catch (error) {
      console.error('Failed to update lead:', error);
      toast.error('Failed to update lead status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New':
        return 'bg-blue-100 text-blue-800';
      case 'In-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Converted':
        return 'bg-green-100 text-green-800';
      case 'Lost':
        return 'bg-red-100 text-red-800';
      case 'On-hold':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return 'Not specified';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!lead || !customer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Lead not found</p>
        <Button onClick={() => navigate('/leads')} className="mt-4">
          Back to Leads
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
            onClick={() => navigate('/leads')}
          >
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{lead.leadId}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(lead.status)}`}>
                {lead.status}
              </span>
            </div>
            <p className="mt-2 text-gray-600">
              Created on {formatDate(lead.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          {lead.status !== 'Converted' && lead.status !== 'Lost' && (
            <>
              <Button
                variant="secondary"
                icon={<CheckCircle className="h-4 w-4" />}
                onClick={() => setShowConvertModal(true)}
              >
                Convert
              </Button>
              <Button
                variant="secondary"
                icon={<XCircle className="h-4 w-4" />}
                onClick={() => setShowLostModal(true)}
              >
                Mark Lost
              </Button>
            </>
          )}
          <Button
            variant="secondary"
            icon={<Edit className="h-4 w-4" />}
            onClick={() => navigate(`/leads/${id}/edit`)}
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
          {/* Customer Information */}
          <Card title="Customer Information">
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium text-gray-900">{customer.name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Mobile</p>
                  <p className="font-medium text-gray-900">{customer.mobile}</p>
                </div>
              </div>

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
                    {customer.address.area && `${customer.address.area}, `}
                    {customer.address.city}, {customer.address.state} - {customer.address.pincode}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Lead Information */}
          <Card title="Lead Information">
            <div className="p-6 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Source</p>
                <p className="font-medium text-gray-900">{lead.source}</p>
                {lead.sourceDetails && (
                  <p className="text-sm text-gray-600 mt-1">{lead.sourceDetails}</p>
                )}
              </div>

              {lead.followUpDate && (
                <div>
                  <p className="text-sm text-gray-500">Follow-up Date</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <p className="font-medium text-gray-900">{formatDate(lead.followUpDate)}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Electricity Connection Details */}
          {(lead.discomName || lead.consumerNumber || lead.sanctionedLoad || lead.avgMonthlyBill) && (
            <Card title="Electricity Connection Details">
              <div className="p-6 grid grid-cols-2 gap-4">
                {lead.discomName && (
                  <div>
                    <p className="text-sm text-gray-500">DISCOM</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Zap className="h-4 w-4 text-gray-400" />
                      <p className="font-medium text-gray-900">{lead.discomName}</p>
                    </div>
                  </div>
                )}

                {lead.consumerNumber && (
                  <div>
                    <p className="text-sm text-gray-500">Consumer Number</p>
                    <p className="font-medium text-gray-900">{lead.consumerNumber}</p>
                  </div>
                )}

                {lead.meterType && (
                  <div>
                    <p className="text-sm text-gray-500">Meter Type</p>
                    <p className="font-medium text-gray-900">{lead.meterType}</p>
                  </div>
                )}

                {lead.sanctionedLoad && (
                  <div>
                    <p className="text-sm text-gray-500">Sanctioned Load</p>
                    <p className="font-medium text-gray-900">{lead.sanctionedLoad} kW</p>
                  </div>
                )}

                {lead.avgMonthlyBill && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Average Monthly Bill</p>
                    <p className="font-medium text-gray-900">{formatCurrency(lead.avgMonthlyBill)}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* System Requirements */}
          <Card title="System Requirements">
            <div className="p-6 grid grid-cols-2 gap-4">
              {lead.requiredSystemSize && (
                <div>
                  <p className="text-sm text-gray-500">Required System Size</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Home className="h-4 w-4 text-gray-400" />
                    <p className="font-medium text-gray-900">{lead.requiredSystemSize} kW</p>
                  </div>
                </div>
              )}

              {lead.systemType && (
                <div>
                  <p className="text-sm text-gray-500">System Type</p>
                  <p className="font-medium text-gray-900">{lead.systemType}</p>
                </div>
              )}

              {lead.roofType && (
                <div>
                  <p className="text-sm text-gray-500">Roof Type</p>
                  <p className="font-medium text-gray-900">{lead.roofType}</p>
                </div>
              )}

              {lead.tentativeBudget && (
                <div>
                  <p className="text-sm text-gray-500">Tentative Budget</p>
                  <div className="flex items-center gap-2 mt-1">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <p className="font-medium text-gray-900">{formatCurrency(lead.tentativeBudget)}</p>
                  </div>
                </div>
              )}

              {lead.installationReason && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Installation Reason / Requirements</p>
                  <p className="font-medium text-gray-900 mt-1">{lead.installationReason}</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card title="Timeline">
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Created</p>
                  <p className="text-sm text-gray-500">{formatDate(lead.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Last Updated</p>
                  <p className="text-sm text-gray-500">{formatDate(lead.updatedAt)}</p>
                </div>
              </div>

              {lead.followUpDate && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Calendar className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Next Follow-up</p>
                    <p className="text-sm text-gray-500">{formatDate(lead.followUpDate)}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Action Recommendations */}
          {lead.status === 'New' && (
            <Card>
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Next Steps</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-0.5">•</span>
                    <span>Contact the customer to understand their requirements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-0.5">•</span>
                    <span>Schedule a site visit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-0.5">•</span>
                    <span>Update the lead status to In-progress</span>
                  </li>
                </ul>
              </div>
            </Card>
          )}

          {lead.status === 'In-progress' && (
            <Card>
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Next Steps</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-0.5">•</span>
                    <span>Prepare quotation based on requirements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-0.5">•</span>
                    <span>Follow up on pending items</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-0.5">•</span>
                    <span>Convert to quotation when ready</span>
                  </li>
                </ul>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Lead"
        message={`Are you sure you want to delete lead ${lead.leadId}? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
      />

      {/* Convert Confirmation Modal */}
      <ConfirmModal
        isOpen={showConvertModal}
        onClose={() => setShowConvertModal(false)}
        onConfirm={handleConvert}
        title="Convert Lead"
        message={`Are you sure you want to convert lead ${lead.leadId} to a quotation? This will mark the lead as converted.`}
        confirmText="Convert"
      />

      {/* Mark as Lost Confirmation Modal */}
      <ConfirmModal
        isOpen={showLostModal}
        onClose={() => setShowLostModal(false)}
        onConfirm={handleMarkAsLost}
        title="Mark Lead as Lost"
        message={`Are you sure you want to mark lead ${lead.leadId} as lost?`}
        confirmText="Mark Lost"
        confirmVariant="danger"
      />
    </div>
  );
}
