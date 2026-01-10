import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { serviceService } from '@/services/serviceService';
import type { ServiceTicket, IssueType, Priority, TicketStatus } from '@/types/extended';
import { Wrench, AlertCircle, Clock, CheckCircle, Plus, Search, Filter } from 'lucide-react';

const ISSUE_TYPES: IssueType[] = [
  'Inverter Error', 'Low Generation', 'Panel Cleaning', 'Wiring Issue',
  'Earthing Problem', 'MCB Trip', 'Display Issue', 'Other'
];

const PRIORITIES: Priority[] = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES: TicketStatus[] = ['Open', 'Assigned', 'In-progress', 'Resolved', 'Closed', 'Reopened'];

export const ServiceTicketsList: React.FC = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    open: number;
    assigned: number;
    inProgress: number;
    resolved: number;
    closed: number;
    reopened: number;
    avgResolutionTime: number;
    byPriority: Record<Priority, number>;
    byIssueType: Record<string, number>;
    avgRating: number;
  }>({
    total: 0,
    open: 0,
    assigned: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    reopened: 0,
    avgResolutionTime: 0,
    byPriority: {} as Record<Priority, number>,
    byIssueType: {},
    avgRating: 0,
  });
  const [filters, setFilters] = useState<{
    status: TicketStatus | '';
    priority: Priority | '';
    issueType: IssueType | '';
  }>({
    status: '',
    priority: '',
    issueType: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const ticketsData = await serviceService.getTickets({
        status: filters.status || undefined,
        priority: filters.priority || undefined,
        issueType: filters.issueType || undefined,
      });
      setTickets(ticketsData);
      const statsData = await serviceService.getTicketStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = !searchQuery ||
      ticket.ticketNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.issueDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.reportedBy?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getStatusColor = (status: TicketStatus): string => {
    const colors: Record<TicketStatus, string> = {
      'Open': 'bg-yellow-100 text-yellow-800',
      'Assigned': 'bg-blue-100 text-blue-800',
      'In-progress': 'bg-purple-100 text-purple-800',
      'Resolved': 'bg-green-100 text-green-800',
      'Closed': 'bg-gray-100 text-gray-800',
      'Reopened': 'bg-red-100 text-red-800',
    };
    return colors[status];
  };

  const getPriorityColor = (priority: Priority): string => {
    const colors: Record<Priority, string> = {
      'Low': 'text-gray-600',
      'Medium': 'text-blue-600',
      'High': 'text-orange-600',
      'Critical': 'text-red-600',
    };
    return colors[priority];
  };

  const getPriorityIcon = (priority: Priority) => {
    if (priority === 'Critical' || priority === 'High') {
      return <AlertCircle className="w-4 h-4" />;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Service Tickets</h1>
        <button
          onClick={() => navigate('/service/tickets/new')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Ticket
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Open</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.open}</p>
            </div>
            <AlertCircle className="w-10 h-10 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-purple-600">{stats.inProgress}</p>
            </div>
            <Clock className="w-10 h-10 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Resolution</p>
              <p className="text-2xl font-bold text-blue-600">{stats.avgResolutionTime}h</p>
            </div>
            <Clock className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Rating</p>
              <p className="text-2xl font-bold text-amber-600">
                {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : 'N/A'}
              </p>
            </div>
            <Wrench className="w-10 h-10 text-amber-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="font-medium text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value as TicketStatus | '' })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            {STATUSES.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value as Priority | '' })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Priorities</option>
            {PRIORITIES.map(priority => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>

          <select
            value={filters.issueType}
            onChange={(e) => setFilters({ ...filters, issueType: e.target.value as IssueType | '' })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Issue Types</option>
            {ISSUE_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <button
            onClick={() => {
              setFilters({ status: '', priority: '', issueType: '' });
              setSearchQuery('');
            }}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ticket #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reported
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Visit Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Wrench className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No tickets found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by creating a new service ticket.
                    </p>
                    <div className="mt-6">
                      <button
                        onClick={() => navigate('/service/tickets/new')}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Create Ticket
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTickets.map(ticket => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-600">
                        {ticket.ticketNumber}
                      </div>
                      <div className="text-xs text-gray-500">{ticket.reportedBy}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{ticket.issueType}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {ticket.issueDescription}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`flex items-center gap-1 text-sm font-semibold ${getPriorityColor(ticket.priority)}`}>
                        {getPriorityIcon(ticket.priority)}
                        {ticket.priority}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(ticket.reportedDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ticket.visitDate ? new Date(ticket.visitDate).toLocaleDateString('en-IN') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ticket.customerRating ? (
                        <div className="flex items-center gap-1">
                          <span className="text-amber-500">★</span>
                          <span>{ticket.customerRating.toFixed(1)}</span>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => navigate(`/service/tickets/${ticket.id}`)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
