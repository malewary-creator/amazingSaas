import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { serviceService } from '@/services/serviceService';
import { customersService } from '@/services/customersService';
import { projectsService } from '@/services/projectsService';
import type { ServiceTicket, IssueType, Priority, TicketStatus } from '@/types/extended';
import type { Customer, Project } from '@/types';
import { ArrowLeft } from 'lucide-react';

const ISSUE_TYPES: IssueType[] = [
  'Inverter Error', 'Low Generation', 'Panel Cleaning', 'Wiring Issue',
  'Earthing Problem', 'MCB Trip', 'Display Issue', 'Other'
];

const PRIORITIES: Priority[] = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES: TicketStatus[] = ['Open', 'Assigned', 'In-progress', 'Resolved', 'Closed', 'Reopened'];

export const ServiceTicketForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedCustomerProjects, setSelectedCustomerProjects] = useState<Project[]>([]);

  const [formData, setFormData] = useState({
    customerId: '',
    projectId: '',
    issueType: '' as IssueType | '',
    issueDescription: '',
    priority: 'Medium' as Priority,
    status: 'Open' as TicketStatus,
    reportedBy: '',
    reportedDate: new Date().toISOString().split('T')[0],
    assignedTo: '',
    visitDate: '',
    workDoneReport: '',
    resolutionNotes: '',
    remarks: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadCustomersAndProjects();
    if (isEditMode && id) {
      loadTicket(parseInt(id, 10));
    }
  }, [id, isEditMode]);

  useEffect(() => {
    if (formData.customerId) {
      const customerProjects = projects.filter(
        p => p.customerId === parseInt(formData.customerId, 10)
      );
      setSelectedCustomerProjects(customerProjects);
    } else {
      setSelectedCustomerProjects([]);
    }
  }, [formData.customerId, projects]);

  const loadCustomersAndProjects = async () => {
    try {
      const [customersData, projectsData] = await Promise.all([
        customersService.getCustomers(),
        projectsService.getProjects(),
      ]);
      setCustomers(customersData);
      setProjects(projectsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadTicket = async (ticketId: number) => {
    try {
      const ticket = await serviceService.getTicketById(ticketId);
      if (ticket) {
        setFormData({
          customerId: ticket.customerId.toString(),
          projectId: ticket.projectId?.toString() || '',
          issueType: ticket.issueType,
          issueDescription: ticket.issueDescription,
          priority: ticket.priority,
          status: ticket.status,
          reportedBy: ticket.reportedBy || '',
          reportedDate: new Date(ticket.reportedDate).toISOString().split('T')[0],
          assignedTo: ticket.assignedTo?.toString() || '',
          visitDate: ticket.visitDate ? new Date(ticket.visitDate).toISOString().split('T')[0] : '',
          workDoneReport: ticket.workDoneReport || '',
          resolutionNotes: ticket.resolutionNotes || '',
          remarks: ticket.remarks || '',
        });
      }
    } catch (error) {
      console.error('Error loading ticket:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerId) newErrors.customerId = 'Customer is required';
    if (!formData.issueType) newErrors.issueType = 'Issue type is required';
    if (!formData.issueDescription.trim()) newErrors.issueDescription = 'Issue description is required';
    if (!formData.reportedBy.trim()) newErrors.reportedBy = 'Reported by is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);

      const ticketData: Omit<ServiceTicket, 'id' | 'createdAt' | 'updatedAt' | 'ticketNumber'> = {
        customerId: parseInt(formData.customerId, 10),
        projectId: formData.projectId ? parseInt(formData.projectId, 10) : undefined,
        issueType: formData.issueType as IssueType,
        issueDescription: formData.issueDescription.trim(),
        priority: formData.priority,
        status: formData.status,
        reportedBy: formData.reportedBy.trim(),
        reportedDate: new Date(formData.reportedDate),
        assignedTo: formData.assignedTo ? parseInt(formData.assignedTo, 10) : undefined,
        visitDate: formData.visitDate ? new Date(formData.visitDate) : undefined,
        workDoneReport: formData.workDoneReport.trim() || undefined,
        resolutionNotes: formData.resolutionNotes.trim() || undefined,
        remarks: formData.remarks.trim() || undefined,
      };

      if (isEditMode && id) {
        await serviceService.updateTicket(parseInt(id, 10), ticketData);
      } else {
        await serviceService.createTicket(ticketData);
      }

      navigate('/service/tickets');
    } catch (error: any) {
      alert(error.message || 'Failed to save ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/service/tickets')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? 'Edit Service Ticket' : 'Create Service Ticket'}
        </h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Customer & Project */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value, projectId: '' })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.customerId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Customer</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.mobile}
                  </option>
                ))}
              </select>
              {errors.customerId && <p className="mt-1 text-sm text-red-600">{errors.customerId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project (Optional)</label>
              <select
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!formData.customerId}
              >
                <option value="">No Project</option>
                {selectedCustomerProjects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.projectId} ({project.systemSize} kW)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reported By <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.reportedBy}
                onChange={(e) => setFormData({ ...formData, reportedBy: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.reportedBy ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Customer name or contact person"
              />
              {errors.reportedBy && <p className="mt-1 text-sm text-red-600">{errors.reportedBy}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reported Date</label>
              <input
                type="date"
                value={formData.reportedDate}
                onChange={(e) => setFormData({ ...formData, reportedDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Issue Details */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Issue Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Issue Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.issueType}
                onChange={(e) => setFormData({ ...formData, issueType: e.target.value as IssueType })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.issueType ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Issue Type</option>
                {ISSUE_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors.issueType && <p className="mt-1 text-sm text-red-600">{errors.issueType}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {PRIORITIES.map(priority => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Issue Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.issueDescription}
                onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.issueDescription ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Detailed description of the issue..."
              />
              {errors.issueDescription && <p className="mt-1 text-sm text-red-600">{errors.issueDescription}</p>}
            </div>
          </div>
        </div>

        {/* Assignment & Scheduling */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Assignment & Scheduling</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TicketStatus })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {STATUSES.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Visit Date</label>
              <input
                type="date"
                value={formData.visitDate}
                onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To (User ID)</label>
              <input
                type="number"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Technician user ID"
              />
              <p className="mt-1 text-xs text-gray-500">Enter the technician's user ID for assignment</p>
            </div>
          </div>
        </div>

        {/* Resolution (Edit Mode Only) */}
        {isEditMode && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resolution Details</h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Work Done Report</label>
                <textarea
                  value={formData.workDoneReport}
                  onChange={(e) => setFormData({ ...formData, workDoneReport: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe the work performed..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resolution Notes</label>
                <textarea
                  value={formData.resolutionNotes}
                  onChange={(e) => setFormData({ ...formData, resolutionNotes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional resolution notes..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Remarks */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
          <textarea
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Additional notes..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/service/tickets')}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : isEditMode ? 'Update Ticket' : 'Create Ticket'}
          </button>
        </div>
      </form>
    </div>
  );
};
