/**
 * Survey Form Component
 * Create/Edit survey with measurements and technical details
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Save, X, Calculator } from 'lucide-react';
import { surveysService } from '@/services/surveysService';
import { db } from '@/services/database';
import type { Survey, SurveyStatus } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToastStore } from '@/store/toastStore';
import { useAuthStore } from '@/store/authStore';

export default function SurveyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToastStore();
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [engineers, setEngineers] = useState<any[]>([]);
  
  // Basic fields
  const [leadId, setLeadId] = useState<string>(searchParams.get('leadId') || '');
  const [assignedTo, setAssignedTo] = useState<string>(user?.id?.toString() || '');
  const [status, setStatus] = useState<SurveyStatus>('Pending');
  const [surveyDate, setSurveyDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');

  // Roof measurements
  const [roofLength, setRoofLength] = useState('');
  const [roofWidth, setRoofWidth] = useState('');
  const [usableArea, setUsableArea] = useState('');
  const [roofType, setRoofType] = useState('');
  const [roofCondition, setRoofCondition] = useState('');
  const [buildingHeight, setBuildingHeight] = useState('');

  // Shadow analysis
  const [morningNotes, setMorningNotes] = useState('');
  const [noonNotes, setNoonNotes] = useState('');
  const [eveningNotes, setEveningNotes] = useState('');
  const [nearbyObstructions, setNearbyObstructions] = useState('');

  // Structural
  const [structureType, setStructureType] = useState<'Simple' | 'Elevated' | 'Special'>('Simple');
  const [civilWorkRequired, setCivilWorkRequired] = useState(false);
  const [civilWorkNotes, setCivilWorkNotes] = useState('');

  // Cable routing
  const [panelToInverterDistance, setPanelToInverterDistance] = useState('');
  const [inverterToDBDistance, setInverterToDBDistance] = useState('');
  const [cableRouteNotes, setCableRouteNotes] = useState('');

  // Earthing
  const [existingEarthing, setExistingEarthing] = useState(false);
  const [newEarthingRequired, setNewEarthingRequired] = useState(false);
  const [earthingNotes, setEarthingNotes] = useState('');

  // Safety
  const [ladderAccess, setLadderAccess] = useState(false);
  const [parapetWall, setParapetWall] = useState(false);
  const [safetyNotes, setSafetyNotes] = useState('');

  // General
  const [surveyRemarks, setSurveyRemarks] = useState('');

  useEffect(() => {
    loadLeads();
    loadEngineers();
    if (isEdit) {
      loadSurvey();
    }
  }, [id]);

  // Calculate usable area when dimensions change
  useEffect(() => {
    if (roofLength && roofWidth) {
      const area = surveysService.calculateUsableArea(
        parseFloat(roofLength),
        parseFloat(roofWidth)
      );
      setUsableArea(area.toFixed(2));
    }
  }, [roofLength, roofWidth]);

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

  const loadEngineers = async () => {
    // Get all users (in production, filter by role)
    const users = await db.users.toArray();
    setEngineers(users);
  };

  const loadSurvey = async () => {
    if (!id) return;

    try {
      const survey = await surveysService.getSurveyById(parseInt(id));
      if (!survey) {
        toast.error('Survey not found');
        navigate('/survey');
        return;
      }

      // Populate form fields
      setLeadId(survey.leadId.toString());
      setAssignedTo(survey.assignedTo.toString());
      setStatus(survey.status);
      if (survey.surveyDate) {
        setSurveyDate(new Date(survey.surveyDate).toISOString().split('T')[0]);
      }
      setPreferredTime(survey.preferredTime || '');
      
      setRoofLength(survey.roofLength?.toString() || '');
      setRoofWidth(survey.roofWidth?.toString() || '');
      setUsableArea(survey.usableArea?.toString() || '');
      setRoofType(survey.roofType || '');
      setRoofCondition(survey.roofCondition || '');
      setBuildingHeight(survey.buildingHeight?.toString() || '');
      
      if (survey.shadowAnalysis) {
        setMorningNotes(survey.shadowAnalysis.morningNotes || '');
        setNoonNotes(survey.shadowAnalysis.noonNotes || '');
        setEveningNotes(survey.shadowAnalysis.eveningNotes || '');
        setNearbyObstructions(survey.shadowAnalysis.nearbyObstructions || '');
      }
      
      setStructureType(survey.structureType || 'Simple');
      setCivilWorkRequired(survey.civilWorkRequired || false);
      setCivilWorkNotes(survey.civilWorkNotes || '');
      
      setPanelToInverterDistance(survey.panelToInverterDistance?.toString() || '');
      setInverterToDBDistance(survey.inverterToDBDistance?.toString() || '');
      setCableRouteNotes(survey.cableRouteNotes || '');
      
      setExistingEarthing(survey.existingEarthing || false);
      setNewEarthingRequired(survey.newEarthingRequired || false);
      setEarthingNotes(survey.earthingNotes || '');
      
      setLadderAccess(survey.ladderAccess || false);
      setParapetWall(survey.parapetWall || false);
      setSafetyNotes(survey.safetyNotes || '');
      
      setSurveyRemarks(survey.surveyRemarks || '');
    } catch (error) {
      console.error('Failed to load survey:', error);
      toast.error('Failed to load survey');
    }
  };

  const validateForm = () => {
    if (!leadId || leadId === '0') {
      toast.error('Please select a lead');
      return false;
    }
    if (!assignedTo || assignedTo === '0') {
      toast.error('Please assign an engineer');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const surveyData: Omit<Survey, 'id' | 'createdAt' | 'updatedAt'> = {
        leadId: parseInt(leadId),
        assignedTo: parseInt(assignedTo),
        status,
        surveyDate: surveyDate ? new Date(surveyDate) : undefined,
        preferredTime: preferredTime || undefined,
        roofLength: roofLength ? parseFloat(roofLength) : undefined,
        roofWidth: roofWidth ? parseFloat(roofWidth) : undefined,
        usableArea: usableArea ? parseFloat(usableArea) : undefined,
        roofType: roofType || undefined,
        roofCondition: roofCondition || undefined,
        buildingHeight: buildingHeight ? parseInt(buildingHeight) : undefined,
        shadowAnalysis: (morningNotes || noonNotes || eveningNotes || nearbyObstructions) ? {
          morningNotes: morningNotes || undefined,
          noonNotes: noonNotes || undefined,
          eveningNotes: eveningNotes || undefined,
          nearbyObstructions: nearbyObstructions || undefined,
        } : undefined,
        structureType,
        civilWorkRequired,
        civilWorkNotes: civilWorkNotes || undefined,
        panelToInverterDistance: panelToInverterDistance ? parseFloat(panelToInverterDistance) : undefined,
        inverterToDBDistance: inverterToDBDistance ? parseFloat(inverterToDBDistance) : undefined,
        cableRouteNotes: cableRouteNotes || undefined,
        existingEarthing,
        newEarthingRequired,
        earthingNotes: earthingNotes || undefined,
        ladderAccess,
        parapetWall,
        safetyNotes: safetyNotes || undefined,
        surveyRemarks: surveyRemarks || undefined,
      };

      if (isEdit && id) {
        await surveysService.updateSurvey(parseInt(id), surveyData);
        toast.success('Survey updated successfully');
      } else {
        await surveysService.createSurvey(surveyData);
        toast.success('Survey created successfully');
      }

      navigate('/survey');
    } catch (error) {
      console.error('Failed to save survey:', error);
      toast.error('Failed to save survey');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Edit Survey' : 'Schedule New Survey'}
          </h1>
          <p className="mt-2 text-gray-600">
            {isEdit ? 'Update survey details' : 'Create a new site survey'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            icon={<X className="h-4 w-4" />}
            onClick={() => navigate('/survey')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            icon={<Save className="h-4 w-4" />}
            loading={loading}
          >
            {isEdit ? 'Update Survey' : 'Save Survey'}
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
              Assign To <span className="text-red-500">*</span>
            </label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            >
              <option value="">Select engineer...</option>
              {engineers.map((engineer) => (
                <option key={engineer.id} value={engineer.id}>
                  {engineer.name}
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
              onChange={(e) => setStatus(e.target.value as SurveyStatus)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="Pending">Pending</option>
              <option value="Assigned">Assigned</option>
              <option value="In-progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Revisit Required">Revisit Required</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Survey Date
            </label>
            <input
              type="date"
              value={surveyDate}
              onChange={(e) => setSurveyDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Time
            </label>
            <input
              type="time"
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>
      </Card>

      {/* Roof Measurements */}
      <Card title="Roof Measurements">
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Roof Length (meters)
            </label>
            <input
              type="number"
              step="0.1"
              value={roofLength}
              onChange={(e) => setRoofLength(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="e.g., 15.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Roof Width (meters)
            </label>
            <input
              type="number"
              step="0.1"
              value={roofWidth}
              onChange={(e) => setRoofWidth(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="e.g., 10.5"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              Usable Area (sq m)
              <Calculator className="h-4 w-4 text-gray-400" />
            </label>
            <input
              type="number"
              step="0.01"
              value={usableArea}
              onChange={(e) => setUsableArea(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50"
              placeholder="Auto-calculated"
              readOnly
            />
            {usableArea && (
              <p className="mt-1 text-sm text-gray-500">
                Est. capacity: ~{surveysService.estimateSystemCapacity(parseFloat(usableArea))} kW
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Roof Type
            </label>
            <select
              value={roofType}
              onChange={(e) => setRoofType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Select...</option>
              <option value="RCC">RCC (Concrete)</option>
              <option value="Sheet">Sheet Metal</option>
              <option value="Tile">Tile</option>
              <option value="Asbestos">Asbestos</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Roof Condition
            </label>
            <select
              value={roofCondition}
              onChange={(e) => setRoofCondition(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Select...</option>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor - Needs Repair</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Building Height (Floors)
            </label>
            <input
              type="number"
              value={buildingHeight}
              onChange={(e) => setBuildingHeight(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="e.g., 2"
            />
          </div>
        </div>
      </Card>

      {/* Shadow Analysis */}
      <Card title="Shadow Analysis">
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Morning Shadows
            </label>
            <textarea
              value={morningNotes}
              onChange={(e) => setMorningNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Shadow patterns in the morning..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Noon Shadows
            </label>
            <textarea
              value={noonNotes}
              onChange={(e) => setNoonNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Shadow patterns at noon..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Evening Shadows
            </label>
            <textarea
              value={eveningNotes}
              onChange={(e) => setEveningNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Shadow patterns in the evening..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nearby Obstructions
            </label>
            <textarea
              value={nearbyObstructions}
              onChange={(e) => setNearbyObstructions(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Buildings, trees, poles, water tanks..."
            />
          </div>
        </div>
      </Card>

      {/* Structural & Civil Work */}
      <Card title="Structural & Civil Work">
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Structure Type
            </label>
            <select
              value={structureType}
              onChange={(e) => setStructureType(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="Simple">Simple</option>
              <option value="Elevated">Elevated</option>
              <option value="Special">Special</option>
            </select>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={civilWorkRequired}
                onChange={(e) => setCivilWorkRequired(e.target.checked)}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Civil Work Required</span>
            </label>
          </div>

          {civilWorkRequired && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Civil Work Notes
              </label>
              <textarea
                value={civilWorkNotes}
                onChange={(e) => setCivilWorkNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Details of civil work required..."
              />
            </div>
          )}
        </div>
      </Card>

      {/* Cable Routing & Earthing */}
      <Card title="Cable Routing & Earthing">
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Panel to Inverter Distance (m)
            </label>
            <input
              type="number"
              step="0.1"
              value={panelToInverterDistance}
              onChange={(e) => setPanelToInverterDistance(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="e.g., 25"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Inverter to DB Distance (m)
            </label>
            <input
              type="number"
              step="0.1"
              value={inverterToDBDistance}
              onChange={(e) => setInverterToDBDistance(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="e.g., 15"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cable Route Notes
            </label>
            <textarea
              value={cableRouteNotes}
              onChange={(e) => setCableRouteNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Cable routing path and considerations..."
            />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={existingEarthing}
                onChange={(e) => setExistingEarthing(e.target.checked)}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Existing Earthing</span>
            </label>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newEarthingRequired}
                onChange={(e) => setNewEarthingRequired(e.target.checked)}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 rounded"
              />
              <span className="text-sm font-medium text-gray-700">New Earthing Required</span>
            </label>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Earthing Notes
            </label>
            <textarea
              value={earthingNotes}
              onChange={(e) => setEarthingNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Earthing details and requirements..."
            />
          </div>
        </div>
      </Card>

      {/* Safety & General */}
      <Card title="Safety & General Notes">
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={ladderAccess}
                  onChange={(e) => setLadderAccess(e.target.checked)}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Ladder Access Available</span>
              </label>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={parapetWall}
                  onChange={(e) => setParapetWall(e.target.checked)}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Parapet Wall Present</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Safety Notes
            </label>
            <textarea
              value={safetyNotes}
              onChange={(e) => setSafetyNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Safety concerns, PPE requirements, access restrictions..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              General Survey Remarks
            </label>
            <textarea
              value={surveyRemarks}
              onChange={(e) => setSurveyRemarks(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Any additional observations or recommendations..."
            />
          </div>
        </div>
      </Card>
    </form>
  );
}
