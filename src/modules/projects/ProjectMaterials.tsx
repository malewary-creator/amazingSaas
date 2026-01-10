import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { materialsService } from '@/services/materialsService';
import { inventoryService } from '@/services/inventoryService';
import { projectsService } from '@/services/projectsService';
import type { Item, Project, ProjectMaterial } from '@/types';
import { Package, Plus, ArrowLeft, CheckCircle2, Truck, Wrench, RotateCcw } from 'lucide-react';

export const ProjectMaterials: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const projectId = id ? parseInt(id, 10) : undefined;

  const [project, setProject] = useState<Project | undefined>();
  const [items, setItems] = useState<Item[]>([]);
  const [list, setList] = useState<ProjectMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    itemId: '',
    quantity: '',
    unit: 'Nos',
    date: new Date().toISOString().split('T')[0],
    referenceNumber: '',
    remarks: '',
  });

  useEffect(() => {
    if (!projectId) return;
    (async () => {
      setLoading(true);
      const p = await projectsService.getProjectById(projectId);
      setProject(p || undefined);
      const itemsData = await inventoryService.getItems();
      setItems(itemsData);
      const materials = await materialsService.getByProject(projectId);
      setList(materials);
      setLoading(false);
    })();
  }, [projectId]);

  const getItemName = (itemId: number) => {
    const item = items.find(i => i.id === itemId);
    return item ? `${item.itemCode} - ${item.name}` : 'Unknown Item';
  };

  const addAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !form.itemId || !form.quantity) return;
    try {
      const item = items.find(i => i.id === parseInt(form.itemId, 10));
      await materialsService.assignToProject({
        projectId,
        itemId: parseInt(form.itemId, 10),
        quantity: parseFloat(form.quantity),
        unit: item?.unit || form.unit,
        date: new Date(form.date),
        status: 'Sent',
        brand: item?.brand,
        referenceNumber: form.referenceNumber || undefined,
        remarks: form.remarks || undefined,
      });
      setShowAdd(false);
      setForm({ itemId: '', quantity: '', unit: 'Nos', date: new Date().toISOString().split('T')[0], referenceNumber: '', remarks: '' });
      const materials = await materialsService.getByProject(projectId);
      setList(materials);
    } catch (err: any) {
      alert(err.message || 'Failed to assign material');
    }
  };

  const updateStatus = async (pmId: number, status: ProjectMaterial['status']) => {
    await materialsService.updateStatus(pmId, status);
    if (projectId) {
      const materials = await materialsService.getByProject(projectId);
      setList(materials);
    }
  };

  if (!projectId) {
    return <div className="p-6">Invalid project.</div>;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Project Materials</h1>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Assign Material
        </button>
      </div>

      {/* Project header */}
      {project && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="text-gray-900 font-semibold">{project.projectId} • {project.systemSize} kW • {project.systemType}</div>
              <div className="text-sm text-gray-600">Customer ID: {project.customerId}</div>
            </div>
            <div className="text-sm">
              <span className="px-2 py-1 rounded bg-gray-100 text-gray-700">Status: {project.status}</span>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-600">
                    No materials assigned yet.
                  </td>
                </tr>
              ) : (
                list.map(row => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(row.date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{getItemName(row.itemId)}</div>
                      <div className="text-xs text-gray-600">Brand: {row.brand || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.quantity} {row.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-sm font-medium">
                        {row.status === 'Sent' && <Truck className="w-4 h-4 text-blue-600" />}
                        {row.status === 'Installed' && <Wrench className="w-4 h-4 text-green-600" />}
                        {row.status === 'Returned' && <RotateCcw className="w-4 h-4 text-orange-600" />}
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{row.referenceNumber || row.remarks || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateStatus(row.id!, 'Installed')}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
                          title="Mark Installed"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Installed
                        </button>
                        <button
                          onClick={() => updateStatus(row.id!, 'Returned')}
                          className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700"
                          title="Mark Returned"
                        >
                          Return
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-xl w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign Material to Project</h3>
            <form onSubmit={addAssignment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
                <select
                  value={form.itemId}
                  onChange={(e) => setForm({ ...form, itemId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Item</option>
                  {items.map(item => (
                    <option key={item.id} value={item.id!.toString()}>
                      {item.itemCode} - {item.name} (Current: {item.currentStock} {item.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
                  <input
                    type="text"
                    value={form.referenceNumber}
                    onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Challan/Delivery note"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                  <input
                    type="text"
                    value={form.remarks}
                    onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Package className="w-5 h-5" /> Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
