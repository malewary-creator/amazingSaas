/**
 * Survey Details Component
 * View complete survey information with actions
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Clock,
  User,
} from 'lucide-react';
import { surveysService } from '@/services/surveysService';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToastStore } from '@/store/toastStore';

export default function SurveyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToastStore();

  const [loading, setLoading] = useState(true);
  const [survey, setSurvey] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showRevisitModal, setShowRevisitModal] = useState(false);
  const [revisitReason, setRevisitReason] = useState('');

  useEffect(() => {
    loadSurvey();
  }, [id]);

  const loadSurvey = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const surveyDetailsData = await surveysService.getSurveyWithDetails(parseInt(id));
      
      if (!surveyDetailsData) {
        toast.error('Survey not found');
        navigate('/survey');
        return;
      }

      // Flatten the nested structure
      const flattenedData = {
        ...surveyDetailsData.survey,
        customerName: surveyDetailsData.customer?.name,
        customerMobile: surveyDetailsData.customer?.mobile,
        engineerName: surveyDetailsData.engineer?.name,
        leadId: surveyDetailsData.lead?.leadId,
      };

      setSurvey(flattenedData);
    } catch (error) {
      console.error('Failed to load survey:', error);
      toast.error('Failed to load survey');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    try {
      await surveysService.deleteSurvey(parseInt(id));
      toast.success('Survey deleted successfully');
      navigate('/survey');
    } catch (error) {
      console.error('Failed to delete survey:', error);
      toast.error('Failed to delete survey');
    }
  };

  const handleComplete = async () => {
    if (!id) return;

    try {
      await surveysService.completeSurvey(parseInt(id));
      toast.success('Survey marked as completed');
      setShowCompleteModal(false);
      loadSurvey();
    } catch (error) {
      console.error('Failed to complete survey:', error);
      toast.error('Failed to complete survey');
    }
  };

  const handleMarkForRevisit = async () => {
    if (!id || !revisitReason.trim()) {
      toast.error('Please provide a reason for revisit');
      return;
    }

    try {
      await surveysService.markForRevisit(parseInt(id), revisitReason);
      toast.success('Survey marked for revisit');
      setShowRevisitModal(false);
      setRevisitReason('');
      loadSurvey();
    } catch (error) {
      console.error('Failed to mark for revisit:', error);
      toast.error('Failed to mark for revisit');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In-progress':
        return 'bg-blue-100 text-blue-800';
      case 'Assigned':
        return 'bg-purple-100 text-purple-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Revisit Required':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-IN');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading survey details...</div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Survey not found</div>
      </div>
    );
  }

  const estimatedCapacity = survey.usableArea
    ? surveysService.estimateSystemCapacity(survey.usableArea)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            icon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate('/survey')}
          >
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Survey Details</h1>
            <div className="mt-2 flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(survey.status)}`}>
                {survey.status}
              </span>
              {survey.leadId && (
                <span className="text-gray-600">Lead: {survey.leadId}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          {survey.status !== 'Completed' && (
            <>
              <Button
                variant="secondary"
                icon={<AlertTriangle className="h-4 w-4" />}
                onClick={() => setShowRevisitModal(true)}
              >
                Mark for Revisit
              </Button>
              <Button
                variant="primary"
                icon={<CheckCircle className="h-4 w-4" />}
                onClick={() => setShowCompleteModal(true)}
              >
                Mark Complete
              </Button>
            </>
          )}
          <Button
            variant="secondary"
            icon={<Edit2 className="h-4 w-4" />}
            onClick={() => navigate(`/survey/${survey.id}/edit`)}
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

      {/* Customer & Lead Information */}
      <Card title="Customer & Lead Information">
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600">Customer Name</p>
            <p className="mt-1 font-medium">{survey.customerName || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Customer Mobile</p>
            <p className="mt-1 font-medium">{survey.customerMobile || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Lead ID</p>
            <p className="mt-1 font-medium">{survey.leadId || 'N/A'}</p>
          </div>
        </div>
      </Card>

      {/* Survey Schedule */}
      <Card title="Survey Schedule">
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <User className="h-4 w-4" />
              Assigned To
            </p>
            <p className="mt-1 font-medium">{survey.engineerName || 'Not assigned'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Survey Date
            </p>
            <p className="mt-1 font-medium">{formatDate(survey.surveyDate)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Preferred Time
            </p>
            <p className="mt-1 font-medium">{survey.preferredTime || 'Not specified'}</p>
          </div>
        </div>
      </Card>

      {/* Roof Measurements */}
      {(survey.roofLength || survey.roofWidth || survey.usableArea) && (
        <Card title="Roof Measurements">
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600">Dimensions (L × W)</p>
              <p className="mt-1 font-medium">
                {survey.roofLength || 0} m × {survey.roofWidth || 0} m
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Usable Area</p>
              <p className="mt-1 font-medium">{survey.usableArea || 0} sq m</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Estimated Capacity</p>
              <p className="mt-1 font-medium text-orange-600">
                {estimatedCapacity ? `~${estimatedCapacity} kW` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Roof Type</p>
              <p className="mt-1 font-medium">{survey.roofType || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Roof Condition</p>
              <p className="mt-1 font-medium">{survey.roofCondition || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Building Height</p>
              <p className="mt-1 font-medium">
                {survey.buildingHeight ? `${survey.buildingHeight} floors` : 'Not specified'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Shadow Analysis */}
      {survey.shadowAnalysis && (
        <Card title="Shadow Analysis">
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {survey.shadowAnalysis.morningNotes && (
              <div>
                <p className="text-sm text-gray-600 font-medium">Morning</p>
                <p className="mt-1 text-gray-800">{survey.shadowAnalysis.morningNotes}</p>
              </div>
            )}
            {survey.shadowAnalysis.noonNotes && (
              <div>
                <p className="text-sm text-gray-600 font-medium">Noon</p>
                <p className="mt-1 text-gray-800">{survey.shadowAnalysis.noonNotes}</p>
              </div>
            )}
            {survey.shadowAnalysis.eveningNotes && (
              <div>
                <p className="text-sm text-gray-600 font-medium">Evening</p>
                <p className="mt-1 text-gray-800">{survey.shadowAnalysis.eveningNotes}</p>
              </div>
            )}
            {survey.shadowAnalysis.nearbyObstructions && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600 font-medium">Nearby Obstructions</p>
                <p className="mt-1 text-gray-800">{survey.shadowAnalysis.nearbyObstructions}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Structural Information */}
      <Card title="Structural & Civil Work">
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600">Structure Type</p>
            <p className="mt-1 font-medium">{survey.structureType || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Civil Work Required</p>
            <p className="mt-1 font-medium">{survey.civilWorkRequired ? 'Yes' : 'No'}</p>
          </div>
          {survey.civilWorkNotes && (
            <div className="md:col-span-2">
              <p className="text-sm text-gray-600">Civil Work Notes</p>
              <p className="mt-1 text-gray-800">{survey.civilWorkNotes}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Cable Routing */}
      {(survey.panelToInverterDistance || survey.inverterToDBDistance || survey.cableRouteNotes) && (
        <Card title="Cable Routing">
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600">Panel to Inverter</p>
              <p className="mt-1 font-medium">
                {survey.panelToInverterDistance ? `${survey.panelToInverterDistance} m` : 'Not specified'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Inverter to Distribution Board</p>
              <p className="mt-1 font-medium">
                {survey.inverterToDBDistance ? `${survey.inverterToDBDistance} m` : 'Not specified'}
              </p>
            </div>
            {survey.cableRouteNotes && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">Route Notes</p>
                <p className="mt-1 text-gray-800">{survey.cableRouteNotes}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Earthing */}
      <Card title="Earthing">
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600">Existing Earthing</p>
            <p className="mt-1 font-medium">{survey.existingEarthing ? 'Yes' : 'No'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">New Earthing Required</p>
            <p className="mt-1 font-medium">{survey.newEarthingRequired ? 'Yes' : 'No'}</p>
          </div>
          {survey.earthingNotes && (
            <div className="md:col-span-2">
              <p className="text-sm text-gray-600">Earthing Notes</p>
              <p className="mt-1 text-gray-800">{survey.earthingNotes}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Safety */}
      <Card title="Safety Assessment">
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600">Ladder Access</p>
            <p className="mt-1 font-medium">{survey.ladderAccess ? 'Available' : 'Not available'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Parapet Wall</p>
            <p className="mt-1 font-medium">{survey.parapetWall ? 'Present' : 'Not present'}</p>
          </div>
          {survey.safetyNotes && (
            <div className="md:col-span-2">
              <p className="text-sm text-gray-600">Safety Notes</p>
              <p className="mt-1 text-gray-800">{survey.safetyNotes}</p>
            </div>
          )}
        </div>
      </Card>

      {/* General Remarks */}
      {(survey.surveyRemarks || survey.revisitReason) && (
        <Card title="Remarks & Notes">
          <div className="p-6 space-y-4">
            {survey.surveyRemarks && (
              <div>
                <p className="text-sm text-gray-600 font-medium">Survey Remarks</p>
                <p className="mt-1 text-gray-800">{survey.surveyRemarks}</p>
              </div>
            )}
            {survey.revisitReason && (
              <div>
                <p className="text-sm text-gray-600 font-medium">Revisit Reason</p>
                <p className="mt-1 text-red-600">{survey.revisitReason}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Modals */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Survey"
        message="Are you sure you want to delete this survey? This action cannot be undone."
      />

      <ConfirmModal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        onConfirm={handleComplete}
        title="Mark Survey as Completed"
        message="Are you sure you want to mark this survey as completed?"
      />

      {/* Revisit Modal */}
      {showRevisitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Mark for Revisit
            </h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for requiring a revisit:
            </p>
            <textarea
              value={revisitReason}
              onChange={(e) => setRevisitReason(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter reason for revisit..."
            />
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowRevisitModal(false);
                  setRevisitReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleMarkForRevisit}
                disabled={!revisitReason.trim()}
              >
                Mark for Revisit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
