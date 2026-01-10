/**
 * Surveys List Component
 * Display and manage all surveys
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  Calendar,
  User,
  MapPin,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { surveysService } from '@/services/surveysService';
import { db } from '@/services/database';
import type { Survey, SurveyStatus } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToastStore } from '@/store/toastStore';

interface SurveyWithDetails extends Survey {
  customerName?: string;
  customerMobile?: string;
  engineerName?: string;
  leadId_display?: string;
}

export default function SurveysList() {
  const navigate = useNavigate();
  const toast = useToastStore();

  const [surveys, setSurveys] = useState<SurveyWithDetails[]>([]);
  const [filteredSurveys, setFilteredSurveys] = useState<SurveyWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<number | null>(null);
  
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    assigned: 0,
    inProgress: 0,
    completed: 0,
    revisitRequired: 0,
    todaysSurveys: 0,
  });

  useEffect(() => {
    loadSurveys();
    loadStats();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, statusFilter, surveys]);

  const loadSurveys = async () => {
    try {
      setLoading(true);
      const data = await surveysService.getSurveys();
      
      // Enrich with customer and engineer details
      const enriched = await Promise.all(
        data.map(async (survey) => {
          const lead = await db.leads.get(survey.leadId);
          const customer = lead ? await db.customers.get(lead.customerId) : null;
          const engineer = await db.users.get(survey.assignedTo);
          
          return {
            ...survey,
            customerName: customer?.name,
            customerMobile: customer?.mobile,
            engineerName: engineer?.name,
            leadId_display: lead?.leadId,
          };
        })
      );
      
      setSurveys(enriched);
    } catch (error) {
      console.error('Failed to load surveys:', error);
      toast.error('Failed to load surveys');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await surveysService.getSurveyStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...surveys];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        s =>
          s.customerName?.toLowerCase().includes(term) ||
          s.customerMobile?.includes(term) ||
          s.engineerName?.toLowerCase().includes(term) ||
          s.leadId_display?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    setFilteredSurveys(filtered);
  };

  const handleDelete = async () => {
    if (!selectedSurvey) return;

    try {
      await surveysService.deleteSurvey(selectedSurvey);
      toast.success('Survey deleted successfully');
      loadSurveys();
      loadStats();
    } catch (error) {
      console.error('Failed to delete survey:', error);
      toast.error('Failed to delete survey');
    } finally {
      setShowDeleteModal(false);
      setSelectedSurvey(null);
    }
  };

  const getStatusColor = (status: SurveyStatus) => {
    switch (status) {
      case 'Pending':
        return 'bg-gray-100 text-gray-800';
      case 'Assigned':
        return 'bg-blue-100 text-blue-800';
      case 'In-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Revisit Required':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Not scheduled';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (time: string | undefined) => {
    if (!time) return '';
    return time;
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
          <h1 className="text-3xl font-bold text-gray-900">Site Surveys</h1>
          <p className="mt-2 text-gray-600">Manage solar installation surveys</p>
        </div>
        <Link to="/survey/new">
          <Button icon={<Plus className="h-4 w-4" />}>Schedule Survey</Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Surveys</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <MapPin className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Surveys</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.todaysSurveys}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Calendar className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.inProgress}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.completed}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card title="Filters">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by customer, engineer, or lead ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Assigned">Assigned</option>
                <option value="In-progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Revisit Required">Revisit Required</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Surveys Table */}
      <Card title={`Surveys (${filteredSurveys.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer & Lead
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Survey Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usable Area
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSurveys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {searchTerm || statusFilter
                      ? 'No surveys found matching your filters'
                      : 'No surveys yet. Schedule your first survey!'}
                  </td>
                </tr>
              ) : (
                filteredSurveys.map((survey) => (
                  <tr key={survey.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {survey.customerName || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-500">
                        Lead: {survey.leadId_display || `#${survey.leadId}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(survey.surveyDate)}</div>
                      {survey.preferredTime && (
                        <div className="text-sm text-gray-500">{formatTime(survey.preferredTime)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-900">
                        <User className="h-4 w-4 text-gray-400" />
                        {survey.engineerName || 'Unassigned'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(survey.status)}`}>
                        {survey.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {survey.usableArea ? `${survey.usableArea} sq m` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/survey/${survey.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/survey/${survey.id}/edit`)}
                          className="text-orange-600 hover:text-orange-900"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSurvey(survey.id!);
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
          setSelectedSurvey(null);
        }}
        onConfirm={handleDelete}
        title="Delete Survey"
        message="Are you sure you want to delete this survey? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
      />
    </div>
  );
}
