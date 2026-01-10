/**
 * Project Details Component
 * View project with 10-stage progress tracker
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  CheckCircle,
  Play,
  X,
  User,
  Calendar,
  DollarSign,
  Package,
} from 'lucide-react';
import { projectsService } from '@/services/projectsService';
import type { ProjectStage, StageStatus } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToastStore } from '@/store/toastStore';
import { useAuthStore } from '@/store/authStore';

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToastStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any>(null);
  const [stages, setStages] = useState<ProjectStage[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState<ProjectStage | null>(null);
  const [stageAction, setStageAction] = useState<'start' | 'complete' | 'skip' | null>(null);

  useEffect(() => {
    loadProject();
  }, [id]);

  const loadProject = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const projectData = await projectsService.getProjectWithDetails(parseInt(id));

      if (!projectData) {
        toast.error('Project not found');
        navigate('/projects');
        return;
      }

      setProject(projectData);
      setStages(projectData.stages || []);
    } catch (error) {
      console.error('Failed to load project:', error);
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    try {
      await projectsService.deleteProject(parseInt(id));
      toast.success('Project deleted successfully');
      navigate('/projects');
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast.error('Failed to delete project');
    }
  };

  const handleStageAction = async () => {
    if (!selectedStage || !stageAction) return;

    try {
      if (stageAction === 'start') {
        await projectsService.startStage(selectedStage.id!);
        toast.success('Stage started');
      } else if (stageAction === 'complete') {
        await projectsService.completeStage(selectedStage.id!, user?.id || 0);
        toast.success('Stage completed');
      }

      setSelectedStage(null);
      setStageAction(null);
      loadProject();
    } catch (error) {
      console.error('Failed to update stage:', error);
      toast.error('Failed to update stage');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
      case 'Installation':
        return 'bg-blue-100 text-blue-800';
      case 'Testing':
        return 'bg-purple-100 text-purple-800';
      case 'Material Procurement':
        return 'bg-orange-100 text-orange-800';
      case 'Planning':
        return 'bg-yellow-100 text-yellow-800';
      case 'On-hold':
        return 'bg-gray-100 text-gray-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStageStatusColor = (status: StageStatus) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-500';
      case 'In-progress':
        return 'bg-blue-500';
      case 'Pending':
        return 'bg-gray-300';
      case 'Skipped':
        return 'bg-gray-400';
      default:
        return 'bg-gray-300';
    }
  };

  const getStageStatusIcon = (status: StageStatus) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="h-5 w-5 text-white" />;
      case 'In-progress':
        return <Play className="h-5 w-5 text-white" />;
      case 'Skipped':
        return <X className="h-5 w-5 text-white" />;
      default:
        return <div className="h-5 w-5" />;
    }
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (!amount || isNaN(amount)) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-IN');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading project details...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Project not found</div>
      </div>
    );
  }

  const progress = project.progress || 0;
  const paymentSummary = {
    projectValue: project.projectValue || 0,
    totalPaid: project.totalPaid || 0,
    balanceAmount: project.balanceAmount || 0,
    paymentPercentage: project.projectValue > 0 
      ? Math.round((project.totalPaid / project.projectValue) * 100)
      : 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            icon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate('/projects')}
          >
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.projectId}</h1>
            <div className="mt-2 flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                {project.status}
              </span>
              <span className="text-gray-600">
                {project.systemSize} kW {project.systemType}
              </span>
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                {project.caseType || 'Cash'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="primary"
            icon={<Package className="h-4 w-4" />}
            onClick={() => navigate(`/projects/${project.id}/materials`)}
          >
            Materials
          </Button>
          <Button
            variant="secondary"
            icon={<Edit2 className="h-4 w-4" />}
            onClick={() => navigate(`/projects/${project.id}/edit`)}
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

      {/* Progress Overview */}
      <Card title="Overall Progress">
        <div className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Project Completion</span>
            <span className="text-2xl font-bold text-gray-900">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-gradient-to-r from-orange-500 to-orange-600 h-4 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-4 grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-xl font-bold text-green-600">
                {stages.filter(s => s.status === 'Completed').length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-xl font-bold text-blue-600">
                {stages.filter(s => s.status === 'In-progress').length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-xl font-bold text-gray-600">
                {stages.filter(s => s.status === 'Pending').length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Skipped</p>
              <p className="text-xl font-bold text-gray-400">
                {stages.filter(s => s.status === 'Skipped').length}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Project Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Customer Information">
          <div className="p-6 space-y-4">
            <div>
              <p className="text-sm text-gray-600">Customer Name</p>
              <p className="mt-1 font-medium text-gray-900">{project.customerName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Mobile</p>
              <p className="mt-1 font-medium text-gray-900">{project.customerMobile || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Address</p>
              <p className="mt-1 font-medium text-gray-900">{project.customerAddress || 'N/A'}</p>
            </div>
          </div>
        </Card>

        <Card title="Project Timeline">
          <div className="p-6 space-y-4">
            <div>
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Start Date
              </p>
              <p className="mt-1 font-medium text-gray-900">{formatDate(project.startDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Target Date
              </p>
              <p className="mt-1 font-medium text-gray-900">{formatDate(project.targetDate)}</p>
            </div>
            {project.completionDate && (
              <div>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Completed On
                </p>
                <p className="mt-1 font-medium text-green-600">{formatDate(project.completionDate)}</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Financial Summary */}
      <Card title="Financial Summary">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Project Value
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {formatCurrency(paymentSummary.projectValue)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Amount Paid
              </p>
              <p className="mt-1 text-2xl font-bold text-green-600">
                {formatCurrency(paymentSummary.totalPaid)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Balance
              </p>
              <p className="mt-1 text-2xl font-bold text-orange-600">
                {formatCurrency(paymentSummary.balanceAmount)}
              </p>
            </div>
          </div>
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Payment Progress</span>
              <span className="text-sm font-medium text-gray-900">{paymentSummary.paymentPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all"
                style={{ width: `${paymentSummary.paymentPercentage}%` }}
              />
            </div>
          </div>

          {/* Payment Schedule */}
          {project.paymentSchedule?.stages && project.paymentSchedule.stages.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Payment Schedule{project.paymentSchedule.termsName ? ` - ${project.paymentSchedule.termsName}` : ''}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-2 text-left text-gray-600">Stage</th>
                      <th className="px-3 py-2 text-right text-gray-600">Percent</th>
                      <th className="px-3 py-2 text-right text-gray-600">Amount</th>
                      <th className="px-3 py-2 text-left text-gray-600">Due Date</th>
                      <th className="px-3 py-2 text-left text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {project.paymentSchedule.stages.map((s: any, idx: number) => (
                      <tr key={idx}>
                        <td className="px-3 py-2">{s.stage}</td>
                        <td className="px-3 py-2 text-right">{s.percentage ? `${s.percentage}%` : '—'}</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(s.amount || 0)}</td>
                        <td className="px-3 py-2">{s.dueDate ? formatDate(s.dueDate) : '—'}</td>
                        <td className="px-3 py-2">
                          <span className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs">{s.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Team Information */}
      <Card title="Project Team">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <User className="h-4 w-4" />
                Project Manager
              </p>
              <p className="mt-1 font-medium text-gray-900">{project.projectManagerName || 'Not assigned'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <User className="h-4 w-4" />
                Installation Team
              </p>
              <div className="mt-1">
                {project.teamMemberNames && project.teamMemberNames.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {project.teamMemberNames.map((name: string, index: number) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No team assigned</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Installation Stages */}
      <Card title="Installation Stages">
        <div className="p-6">
          <div className="space-y-4">
            {stages.map((stage, index) => (
              <div
                key={stage.id}
                className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                {/* Stage indicator */}
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full ${getStageStatusColor(stage.status)} flex items-center justify-center`}>
                    {getStageStatusIcon(stage.status)}
                  </div>
                  {index < stages.length - 1 && (
                    <div className="w-0.5 h-8 bg-gray-300 my-1" />
                  )}
                </div>

                {/* Stage content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{stage.stageName}</h4>
                      <p className="text-sm text-gray-500">
                        Status: <span className="font-medium">{stage.status}</span>
                      </p>
                      {stage.startDate && (
                        <p className="text-sm text-gray-500">
                          Started: {formatDate(stage.startDate)}
                        </p>
                      )}
                      {stage.endDate && (
                        <p className="text-sm text-gray-500">
                          Completed: {formatDate(stage.endDate)}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {stage.status === 'Pending' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={<Play className="h-3 w-3" />}
                          onClick={() => {
                            setSelectedStage(stage);
                            setStageAction('start');
                          }}
                        >
                          Start
                        </Button>
                      )}
                      {stage.status === 'In-progress' && (
                        <Button
                          size="sm"
                          variant="primary"
                          icon={<CheckCircle className="h-3 w-3" />}
                          onClick={() => {
                            setSelectedStage(stage);
                            setStageAction('complete');
                          }}
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                  {stage.comments && (
                    <p className="mt-2 text-sm text-gray-600 bg-gray-100 p-2 rounded">
                      {stage.comments}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Remarks */}
      {project.remarks && (
        <Card title="Project Remarks">
          <div className="p-6">
            <p className="text-gray-800">{project.remarks}</p>
          </div>
        </Card>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Project"
        message="Are you sure you want to delete this project? This will delete all stages and cannot be undone."
      />

      {/* Stage Action Confirmation */}
      <ConfirmModal
        isOpen={selectedStage !== null && stageAction !== null}
        onClose={() => {
          setSelectedStage(null);
          setStageAction(null);
        }}
        onConfirm={handleStageAction}
        title={`${stageAction === 'start' ? 'Start' : 'Complete'} Stage`}
        message={`Are you sure you want to ${stageAction} "${selectedStage?.stageName}"?`}
      />
    </div>
  );
}
