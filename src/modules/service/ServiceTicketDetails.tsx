import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { serviceService } from '@/services/serviceService';
import { customersService } from '@/services/customersService';
import { projectsService } from '@/services/projectsService';
import type { ServiceTicket } from '@/types/extended';
import type { Customer, Project } from '@/types';
import { 
  ArrowLeft, Edit, Trash2, Clock, User,
  AlertCircle, CheckCircle, Star, FileText, Package 
} from 'lucide-react';

export const ServiceTicketDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [ticket, setTicket] = useState<ServiceTicket | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [feedback, setFeedback] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    if (id) {
      loadTicket(parseInt(id, 10));
    }
  }, [id]);

  const loadTicket = async (ticketId: number) => {
    try {
      setLoading(true);
      const ticketData = await serviceService.getTicketById(ticketId);
      if (ticketData) {
        setTicket(ticketData);
        
        // Load customer
        const customerData = await customersService.getCustomerById(ticketData.customerId);
        setCustomer(customerData || null);

        // Load project if exists
        if (ticketData.projectId) {
          const projectData = await projectsService.getProjectById(ticketData.projectId);
          setProject(projectData || null);
        }
      }
    } catch (error) {
      console.error('Error loading ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!ticket?.id) return;
    try {
      await serviceService.deleteTicket(ticket.id);
      navigate('/service/tickets');
    } catch (error: any) {
      alert(error.message || 'Failed to delete ticket');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket?.id) return;
    try {
      await serviceService.updateTicket(ticket.id, { status: newStatus as any });
      loadTicket(ticket.id);
    } catch (error: any) {
      alert(error.message || 'Failed to update status');
    }
  };

  const handleSubmitFeedback = async () => {
    if (!ticket?.id) return;
    try {
      await serviceService.submitFeedback(ticket.id, feedback.rating, feedback.comment);
      setFeedbackModal(false);
      loadTicket(ticket.id);
    } catch (error: any) {
      alert(error.message || 'Failed to submit feedback');
    }
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'Open': 'bg-yellow-100 text-yellow-800',
      'Assigned': 'bg-blue-100 text-blue-800',
      'In-progress': 'bg-purple-100 text-purple-800',
      'Resolved': 'bg-green-100 text-green-800',
      'Closed': 'bg-gray-100 text-gray-800',
      'Reopened': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string): string => {
    const colors: Record<string, string> = {
      'Low': 'text-gray-600',
      'Medium': 'text-blue-600',
      'High': 'text-orange-600',
      'Critical': 'text-red-600',
    };
    return colors[priority] || 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Ticket not found</p>
        <button
          onClick={() => navigate('/service/tickets')}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          Back to Tickets
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/service/tickets')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{ticket.ticketNumber}</h1>
            <p className="text-sm text-gray-500">{ticket.issueType}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/service/tickets/${id}/edit`)}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => setDeleteModal(true)}
            className="px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status & Priority */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Status & Priority</h2>
              <div className="flex gap-2">
                <span className={`px-3 py-1 text-sm font-medium rounded ${getStatusColor(ticket.status)}`}>
                  {ticket.status}
                </span>
                <span className={`px-3 py-1 text-sm font-semibold ${getPriorityColor(ticket.priority)}`}>
                  {ticket.priority} Priority
                </span>
              </div>
            </div>

            {/* Quick Status Actions */}
            {ticket.status !== 'Closed' && (
              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 w-full mb-2">Quick Actions:</p>
                {ticket.status === 'Open' && (
                  <button
                    onClick={() => handleStatusChange('Assigned')}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Mark as Assigned
                  </button>
                )}
                {ticket.status === 'Assigned' && (
                  <button
                    onClick={() => handleStatusChange('In-progress')}
                    className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                  >
                    Start Work
                  </button>
                )}
                {ticket.status === 'In-progress' && (
                  <button
                    onClick={() => handleStatusChange('Resolved')}
                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    Mark as Resolved
                  </button>
                )}
                {ticket.status === 'Resolved' && (
                  <>
                    <button
                      onClick={() => handleStatusChange('Closed')}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Close Ticket
                    </button>
                    <button
                      onClick={() => setFeedbackModal(true)}
                      className="px-3 py-1 text-sm bg-amber-100 text-amber-700 rounded hover:bg-amber-200"
                    >
                      Add Feedback
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Issue Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Issue Details
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Issue Type</p>
                <p className="text-base text-gray-900">{ticket.issueType}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Description</p>
                <p className="text-base text-gray-900">{ticket.issueDescription}</p>
              </div>
              {ticket.remarks && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Remarks</p>
                  <p className="text-base text-gray-900">{ticket.remarks}</p>
                </div>
              )}
            </div>
          </div>

          {/* Resolution Details */}
          {(ticket.workDoneReport || ticket.resolutionNotes) && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Resolution Details
              </h2>
              <div className="space-y-3">
                {ticket.workDoneReport && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Work Done</p>
                    <p className="text-base text-gray-900">{ticket.workDoneReport}</p>
                  </div>
                )}
                {ticket.resolutionNotes && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Resolution Notes</p>
                    <p className="text-base text-gray-900">{ticket.resolutionNotes}</p>
                  </div>
                )}
                {ticket.sparesUsed && ticket.sparesUsed.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Spares Used</p>
                    <div className="space-y-1">
                      {ticket.sparesUsed.map((spare, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-900">
                          <Package className="w-4 h-4 text-gray-400" />
                          Item ID: {spare.itemId}, Qty: {spare.quantity}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Customer Feedback */}
          {(ticket.customerRating || ticket.customerFeedback) && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                Customer Feedback
              </h2>
              <div className="space-y-3">
                {ticket.customerRating && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Rating</p>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            className={`w-5 h-5 ${
                              star <= ticket.customerRating! ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-lg font-semibold text-gray-900">
                        {ticket.customerRating.toFixed(1)} / 5.0
                      </span>
                    </div>
                  </div>
                )}
                {ticket.customerFeedback && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Comments</p>
                    <p className="text-base text-gray-900">{ticket.customerFeedback}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Customer
            </h3>
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium text-gray-500">Name</p>
                <p className="text-base text-gray-900">{customer?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Mobile</p>
                <p className="text-base text-gray-900">{customer?.mobile || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Reported By</p>
                <p className="text-base text-gray-900">{ticket.reportedBy || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Project Info */}
          {project && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Project
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-500">Project ID</p>
                  <p className="text-base text-gray-900">{project.projectId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">System Size</p>
                  <p className="text-base text-gray-900">{project.systemSize} kW</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className="text-base text-gray-900">{project.status}</p>
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Timeline
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Reported</p>
                <p className="text-base text-gray-900">
                  {new Date(ticket.reportedDate).toLocaleString('en-IN')}
                </p>
              </div>
              {ticket.assignedDate && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Assigned</p>
                  <p className="text-base text-gray-900">
                    {new Date(ticket.assignedDate).toLocaleString('en-IN')}
                  </p>
                </div>
              )}
              {ticket.visitDate && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Visit Scheduled</p>
                  <p className="text-base text-gray-900">
                    {new Date(ticket.visitDate).toLocaleString('en-IN')}
                  </p>
                </div>
              )}
              {ticket.closedDate && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Closed</p>
                  <p className="text-base text-gray-900">
                    {new Date(ticket.closedDate).toLocaleString('en-IN')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Assignment */}
          {ticket.assignedTo && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment</h3>
              <div>
                <p className="text-sm font-medium text-gray-500">Technician ID</p>
                <p className="text-base text-gray-900">{ticket.assignedTo}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Ticket</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete ticket "{ticket.ticketNumber}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {feedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Feedback</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedback({ ...feedback, rating: star })}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= feedback.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
                <textarea
                  value={feedback.comment}
                  onChange={(e) => setFeedback({ ...feedback, comment: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional feedback..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setFeedbackModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitFeedback}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
