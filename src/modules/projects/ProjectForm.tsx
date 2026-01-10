/**
 * Project Form Component
 * Create/Edit solar installation project
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Save, X } from 'lucide-react';
import { projectsService } from '@/services/projectsService';
import { db } from '@/services/database';
import type { Project, ProjectStatus } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToastStore } from '@/store/toastStore';
import { ProjectPaymentScheduleEditor } from './ProjectPaymentScheduleEditor';
import type { PaymentScheduleValue } from './ProjectPaymentScheduleEditor';

export default function ProjectForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToastStore();
  const [searchParams] = useSearchParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Basic fields
  const [leadId, setLeadId] = useState<string>(searchParams.get('leadId') || '');
  const [quotationId, setQuotationId] = useState<string>('');
  const [status, setStatus] = useState<ProjectStatus>('Planning');
  const [startDate, setStartDate] = useState('');
  const [targetDate, setTargetDate] = useState('');

  // System details
  const [systemSize, setSystemSize] = useState('');
  const [systemType, setSystemType] = useState<'On-grid' | 'Off-grid' | 'Hybrid'>('On-grid');
  const [caseType, setCaseType] = useState<'Cash' | 'Finance'>('Cash');

  // Financial
  const [projectValue, setProjectValue] = useState('');
  const [totalPaid, setTotalPaid] = useState('');
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleValue | undefined>(undefined);

  // Team
  const [projectManager, setProjectManager] = useState<string>('');
  const [installationTeam, setInstallationTeam] = useState<number[]>([]);

  // Other
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    loadLeads();
    loadQuotations();
    loadUsers();
    if (isEdit) {
      loadProject();
    }
  }, [id]);

  const loadLeads = async () => {
    const leadsData = await db.leads.toArray();
    const enriched = await Promise.all(
      leadsData.map(async (lead) => {
        const customer = await db.customers.get(lead.customerId);
        return {
          ...lead,
          customerName: customer?.name,
        };
      })
    );
    setLeads(enriched);
  };

  const loadQuotations = async () => {
    const quotationsData = await db.quotations.toArray();
    setQuotations(quotationsData);
  };

  const loadUsers = async () => {
    const usersData = await db.users.toArray();
    setUsers(usersData);
  };

  const loadProject = async () => {
    if (!id) return;

    try {
      const project = await projectsService.getProjectById(parseInt(id));
      if (!project) {
        toast.error('Project not found');
        navigate('/projects');
        return;
      }

      // Populate form fields
      setLeadId(project.leadId.toString());
      setQuotationId(project.quotationId?.toString() || '');
      setStatus(project.status);
      if (project.startDate) {
        setStartDate(new Date(project.startDate).toISOString().split('T')[0]);
      }
      if (project.targetDate) {
        setTargetDate(new Date(project.targetDate).toISOString().split('T')[0]);
      }
      setSystemSize(project.systemSize.toString());
      setSystemType(project.systemType);
      setProjectValue(project.projectValue.toString());
      setTotalPaid(project.totalPaid?.toString() || '0');
      setPaymentSchedule(project.paymentSchedule as any);
      setProjectManager(project.projectManager?.toString() || '');
      setInstallationTeam(project.installationTeam || []);
      setRemarks(project.remarks || '');
    } catch (error) {
      console.error('Failed to load project:', error);
      toast.error('Failed to load project');
    }
  };

  const validateForm = () => {
    if (!leadId || leadId === '0') {
      toast.error('Please select a lead');
      return false;
    }
    if (!systemSize || parseFloat(systemSize) <= 0) {
      toast.error('Please enter valid system size');
      return false;
    }
    if (!projectValue || parseFloat(projectValue) <= 0) {
      toast.error('Please enter valid project value');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const lead = await db.leads.get(parseInt(leadId));
      if (!lead) {
        toast.error('Lead not found');
        return;
      }

      const balanceAmount = parseFloat(projectValue) - (parseFloat(totalPaid) || 0);

      const projectData: Omit<Project, 'id' | 'projectId' | 'createdAt' | 'updatedAt'> = {
        leadId: parseInt(leadId),
        customerId: lead.customerId,
        quotationId: quotationId ? parseInt(quotationId) : undefined,
        status,
        startDate: startDate ? new Date(startDate) : undefined,
        targetDate: targetDate ? new Date(targetDate) : undefined,
        systemSize: parseFloat(systemSize),
        systemType,
        caseType,
        projectValue: parseFloat(projectValue),
        totalPaid: parseFloat(totalPaid) || 0,
        balanceAmount,
        paymentSchedule: paymentSchedule as any,
        projectManager: projectManager ? parseInt(projectManager) : undefined,
        installationTeam: installationTeam.length > 0 ? installationTeam : undefined,
        remarks: remarks || undefined,
      };

      if (isEdit && id) {
        await projectsService.updateProject(parseInt(id), projectData);
        toast.success('Project updated successfully');
      } else {
        await projectsService.createProject(projectData);
        toast.success('Project created successfully');
      }

      navigate('/projects');
    } catch (error) {
      console.error('Failed to save project:', error);
      toast.error('Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  const handleTeamMemberToggle = (userId: number) => {
    setInstallationTeam((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Edit Project' : 'Create New Project'}
          </h1>
          <p className="mt-2 text-gray-600">
            {isEdit ? 'Update project details' : 'Create a new solar installation project'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            icon={<X className="h-4 w-4" />}
            onClick={() => navigate('/projects')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            icon={<Save className="h-4 w-4" />}
            loading={loading}
          >
            {isEdit ? 'Update Project' : 'Create Project'}
          </Button>
        </div>
      </div>

      {/* Basic Information */}
      <Card title="Basic Information">
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lead <span className="text-red-500">*</span>
            </label>
            <select
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
              disabled={isEdit}
            >
              <option value="">Select a lead...</option>
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.leadId} - {lead.customerName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quotation (Optional)
            </label>
            <select
              value={quotationId}
              onChange={(e) => setQuotationId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Select quotation...</option>
              {quotations.map((quotation) => (
                <option key={quotation.id} value={quotation.id}>
                  {quotation.quotationNumber}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="Planning">Planning</option>
              <option value="Material Procurement">Material Procurement</option>
              <option value="In Progress">In Progress</option>
              <option value="Installation">Installation</option>
              <option value="Testing">Testing</option>
              <option value="Completed">Completed</option>
              <option value="On-hold">On-hold</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Manager
            </label>
            <select
              value={projectManager}
              onChange={(e) => setProjectManager(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Select manager...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Completion Date
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              min={startDate || undefined}
            />
          </div>
        </div>
      </Card>

      {/* System Details */}
      <Card title="System Details">
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              System Size (kW) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.1"
              value={systemSize}
              onChange={(e) => setSystemSize(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="e.g., 5.0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              System Type
            </label>
            <select
              value={systemType}
              onChange={(e) => setSystemType(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="On-grid">On-grid</option>
              <option value="Off-grid">Off-grid</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Case Type
            </label>
            <select
              value={caseType}
              onChange={(e) => setCaseType(e.target.value as 'Cash' | 'Finance')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="Cash">Cash</option>
              <option value="Finance">Finance</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Financial Details */}
      <Card title="Financial Details">
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Value (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={projectValue}
              onChange={(e) => setProjectValue(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="e.g., 500000"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount Paid (₹)
            </label>
            <input
              type="number"
              step="0.01"
              value={totalPaid}
              onChange={(e) => setTotalPaid(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="e.g., 100000"
            />
          </div>

          {projectValue && totalPaid && (
            <div className="md:col-span-2">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Balance Amount:</span>
                  <span className="font-semibold text-gray-900">
                    ₹{(parseFloat(projectValue) - parseFloat(totalPaid)).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min((parseFloat(totalPaid) / parseFloat(projectValue)) * 100, 100)}%`,
                    }}
                  />
                </div>
                <div className="mt-1 text-xs text-gray-600 text-right">
                  {((parseFloat(totalPaid) / parseFloat(projectValue)) * 100).toFixed(1)}% paid
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Payment Schedule Editor */}
      <ProjectPaymentScheduleEditor
        value={paymentSchedule}
        onChange={setPaymentSchedule}
        projectValue={parseFloat(projectValue || '0')}
      />

      {/* Installation Team */}
      <Card title="Installation Team">
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Select team members who will work on this installation
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {users.map((user) => (
              <label
                key={user.id}
                className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={installationTeam.includes(user.id!)}
                  onChange={() => handleTeamMemberToggle(user.id!)}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 rounded"
                />
                <span className="text-sm text-gray-900">{user.name}</span>
              </label>
            ))}
          </div>
          {installationTeam.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-medium">{installationTeam.length}</span> team member(s) selected
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Remarks */}
      <Card title="Remarks">
        <div className="p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Any additional information about the project..."
          />
        </div>
      </Card>
    </form>
  );
}
