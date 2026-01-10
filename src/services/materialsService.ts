import { db } from './database';
import { inventoryService } from './inventoryService';
import type { ProjectMaterial, TransactionType } from '@/types';

export const materialsService = {
  async assignToProject(data: Omit<ProjectMaterial, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    // Record project material assignment and deduct stock via stock ledger
    const item = await db.items.get(data.itemId);
    if (!item) throw new Error('Item not found');

    const assignment: Omit<ProjectMaterial, 'id'> = {
      ...data,
      brand: data.brand ?? item.brand,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const txnType: TransactionType = 'Transfer to Site';

    return await db.transaction('rw', [db.projectMaterials, db.stockLedger, db.items], async () => {
      const id = await db.projectMaterials.add(assignment) as number;

      await inventoryService.recordStockTransaction({
        itemId: data.itemId,
        transactionType: txnType,
        quantity: data.quantity,
        unit: data.unit,
        projectId: data.projectId,
        referenceNumber: data.referenceNumber,
        transactionDate: data.date,
        rate: item.purchasePrice,
        amount: (item.purchasePrice || 0) * data.quantity,
        branchId: undefined,
        remarks: 'Project material assignment',
      });

      return id;
    });
  },

  async updateStatus(id: number, status: ProjectMaterial['status']): Promise<void> {
    const pm = await db.projectMaterials.get(id);
    if (!pm) throw new Error('Assignment not found');

    // If returned, add return-to-stock transaction
    if (status === 'Returned') {
      const item = await db.items.get(pm.itemId);
      if (item) {
        await inventoryService.recordStockTransaction({
          itemId: pm.itemId,
          transactionType: 'Return from Site',
          quantity: pm.quantity,
          unit: pm.unit,
          projectId: pm.projectId,
          referenceNumber: pm.referenceNumber,
          transactionDate: new Date(),
          rate: item.purchasePrice,
          amount: (item.purchasePrice || 0) * pm.quantity,
          branchId: undefined,
          remarks: 'Material returned from site',
        });
      }
    }

    await db.projectMaterials.update(id, { status, updatedAt: new Date() });
  },

  async getByProject(projectId: number): Promise<ProjectMaterial[]> {
    const rows = await db.projectMaterials.where('projectId').equals(projectId).toArray();
    return rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async getSummary(projectId: number): Promise<{ totalQuantity: number; byItem: Record<number, number> }> {
    const rows = await this.getByProject(projectId);
    const byItem: Record<number, number> = {};
    let totalQuantity = 0;
    rows.forEach(r => {
      totalQuantity += r.quantity;
      byItem[r.itemId] = (byItem[r.itemId] || 0) + r.quantity;
    });
    return { totalQuantity, byItem };
  },
};
