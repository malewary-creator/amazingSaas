/**
 * Projects List Component
 * Display and manage all projects with filtering
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Edit2, Trash2 } from 'lucide-react';
import { projectsService } from '@/services/projectsService';
import { db } from '@/services/database';
import type { ProjectStatus } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToastStore } from '@/store/toastStore';

export default function ProjectsList() {
  const navigate = useNavigate();
  const toast = useToastStore();

  const [projects, setProjects] = useState<any[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | ''>('');

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    activeProjects: 0,
    completed: 0,
    totalValue: 0,
  });

  useEffect(() => {
    loadProjects();
    loadStats();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, statusFilter, projects]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const projectsData = await projectsService.getProjects();

      // Enrich with customer and manager data
      const enriched = await Promise.all(
        projectsData.map(async (project) => {
          const lead = await db.leads.get(project.leadId);
          const customer = lead ? await db.customers.get(lead.customerId) : null;
          const manager = project.projectManager 
            ? await db.users.get(project.projectManager)
            : null;

          // Get progress
          const progress = await projectsService.calculateProjectProgress(project.id!);

          return {
            ...project,
            customerName: customer?.name || 'Unknown',
            customerMobile: customer?.mobile,
            managerName: manager?.name || 'Unassigned',
            progress,
          };
        })
      );

      setProjects(enriched);
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statistics = await projectsService.getProjectStats();
      setStats({
        total: statistics.total,
        activeProjects: statistics.activeProjects,
        completed: statistics.completed,
        totalValue: statistics.totalValue,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...projects];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (project) =>
          project.projectId?.toLowerCase().includes(term) ||
          project.customerName?.toLowerCase().includes(term) ||
          project.managerName?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter((project) => project.status === statusFilter);
    }

    setFilteredProjects(filtered);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await projectsService.deleteProject(deleteId);
      toast.success('Project deleted successfully');
      setDeleteId(null);
      loadProjects();
      loadStats();
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast.error('Failed to delete project');
    }
  };

  const getStatusColor = (status: ProjectStatus) => {
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
        <div className="text-gray-500">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="mt-2 text-gray-600">
            Manage solar installation projects and track progress
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate('/projects/kanban')}
          >
            Kanban
          </Button>
          <Button
            icon={<Plus className="h-4 w-4" />}
            onClick={() => navigate('/projects/new')}
          >
            Create Project
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Projects</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">
                  {stats.total}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Projects</p>
                <p className="mt-2 text-3xl font-bold text-orange-600">{stats.activeProjects}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center text-white font-bold">
                  {stats.activeProjects}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="mt-2 text-3xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center text-white font-bold">
                  {stats.completed}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.totalValue)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center text-white text-lg">
                  ₹
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by project ID, customer, or manager..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="w-full md:w-64">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | '')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
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
          </div>
        </div>
      </Card>

      {/* Projects Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  System Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Manager
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    {searchTerm || statusFilter ? 'No projects match your filters' : 'No projects yet'}
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {project.projectId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {project.customerName}
                      </div>
                      {project.customerMobile && (
                        <div className="text-sm text-gray-500">{project.customerMobile}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{project.systemSize} kW</div>
                      <div className="text-sm text-gray-500">{project.systemType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-orange-600 h-2 rounded-full transition-all"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(project.projectValue)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{project.managerName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(project.targetDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/projects/${project.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/projects/${project.id}/edit`)}
                          className="text-orange-600 hover:text-orange-900"
                          title="Edit project"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(project.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete project"
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
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Project"
        message="Are you sure you want to delete this project? This will also delete all associated stages and data. This action cannot be undone."
      />
    </div>
  );
}
