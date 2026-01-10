import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsService } from '@/services/projectsService';
import { db } from '@/services/database';
import type { Project, ProjectStatus } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

type ColumnKey = 'Pending' | 'Active' | 'Ongoing';

const columnStatusMap: Record<ColumnKey, ProjectStatus[]> = {
  Pending: ['Planning', 'Material Procurement'],
  Active: ['In Progress'],
  Ongoing: ['Installation', 'Testing'],
};

function getColumnForStatus(status: ProjectStatus): ColumnKey | null {
  for (const [col, statuses] of Object.entries(columnStatusMap) as [ColumnKey, ProjectStatus[]][]) {
    if (statuses.includes(status)) return col;
  }
  return null;
}

export default function ProjectsKanban() {
  const [columns, setColumns] = useState<Record<ColumnKey, any[]>>({ Pending: [], Active: [], Ongoing: [] });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const list = await projectsService.getProjects();
      // Enrich minimal customer info
      const enriched = await Promise.all(list.map(async (p: Project) => {
        const lead = await db.leads.get(p.leadId);
        const customer = lead ? await db.customers.get(lead.customerId) : null;
        const progress = await projectsService.calculateProjectProgress(p.id!);
        const currentStage = await projectsService.getCurrentStage(p.id!);
        return {
          ...p,
          customerName: customer?.name,
          customerMobile: customer?.mobile,
          addressText: customer?.address ? `${customer.address.city}, ${customer.address.state}` : undefined,
          progress,
          currentStageName: currentStage?.stageName || 'Not started',
        };
      }));

      const grouped: Record<ColumnKey, any[]> = { Pending: [], Active: [], Ongoing: [] };
      enriched.forEach(p => {
        const col = getColumnForStatus(p.status);
        if (col) grouped[col].push(p);
      });
      setColumns(grouped);
    } catch (err) {
      console.error('Failed to load projects', err);
    } finally {
      setLoading(false);
    }
  };

  const moveTo = async (projectId: number, targetCol: ColumnKey) => {
    const targetStatuses = columnStatusMap[targetCol];
    // Pick first status of the target column
    const newStatus = targetStatuses[0];
    await projectsService.updateProjectStatus(projectId, newStatus);
    await load();
  };

  const formatCurrency = (n: number | undefined | null) => {
    const val = n || 0;
    if (isNaN(val)) return '₹0';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Loading Kanban...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects Kanban</h1>
          <p className="mt-2 text-gray-600">Drag-less board with quick status transitions</p>
        </div>
        <Button onClick={() => navigate('/projects/new')}>Create Project</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(['Pending','Active','Ongoing'] as ColumnKey[]).map(col => (
          <Card key={col} title={col}>
            <div className="p-4 space-y-4">
              {columns[col].length === 0 ? (
                <div className="text-sm text-gray-500">No projects</div>
              ) : columns[col].map((p) => (
                <div key={p.id} className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{p.projectId}</div>
                      <div className="text-sm text-gray-700">{p.customerName} {p.customerMobile ? `• ${p.customerMobile}` : ''}</div>
                      {p.addressText && <div className="text-xs text-gray-500">{p.addressText}</div>}
                    </div>
                    <button className="text-blue-600 text-sm" onClick={() => navigate(`/projects/${p.id}`)}>View</button>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div className="text-gray-600">{p.systemSize} kW • {p.systemType}</div>
                    <div className="text-gray-600 text-right">{p.caseType || 'Cash'}</div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div className="font-medium text-gray-900">Value: {formatCurrency(p.projectValue)}</div>
                    <div className="text-right text-gray-700">Paid: {formatCurrency(p.totalPaid || 0)}</div>
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
                    <div className="text-orange-700">Balance: {formatCurrency(p.balanceAmount || 0)}</div>
                    <div className="text-right text-gray-600">Stage: {p.currentStageName}</div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    {(['Pending','Active','Ongoing'] as ColumnKey[]).filter(k => k !== col).map(target => (
                      <Button key={target} size="sm" variant="secondary" onClick={() => moveTo(p.id!, target)}>
                        Move to {target}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
