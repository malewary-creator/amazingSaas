import { db } from './database';
import type { Item, ItemCategory, StockLedger, Supplier, TransactionType } from '@/types';

export const inventoryService = {
  // ==================== ITEMS ====================
  
  async generateItemCode(): Promise<string> {
    const existing = await db.items.toArray();
    const max = existing.reduce((m, item) => {
      const match = item.itemCode?.match(/ITEM(\d+)/);
      return match ? Math.max(m, parseInt(match[1], 10)) : m;
    }, 0);
    return `ITEM${String(max + 1).padStart(3, '0')}`;
  },

  async createItem(data: Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'itemCode'>): Promise<number> {
    const itemCode = await this.generateItemCode();
    const item: Omit<Item, 'id'> = {
      ...data,
      itemCode,
      currentStock: data.currentStock || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return await db.items.add(item) as number;
  },

  async updateItem(id: number, data: Partial<Item>): Promise<void> {
    await db.items.update(id, { ...data, updatedAt: new Date() });
  },

  async deleteItem(id: number): Promise<void> {
    // Check if item is used in any transactions
    const transactions = await db.stockLedger.where('itemId').equals(id).count();
    if (transactions > 0) {
      throw new Error('Cannot delete item with stock transactions. Archive it instead.');
    }
    await db.items.delete(id);
  },

  async getItems(filters?: { category?: ItemCategory; status?: string }): Promise<Item[]> {
    let items = await db.items.toArray();
    if (filters?.category) items = items.filter(i => i.category === filters.category);
    if (filters?.status) items = items.filter(i => i.status === filters.status);
    return items.sort((a, b) => a.name.localeCompare(b.name));
  },

  async getItemById(id: number): Promise<Item | undefined> {
    return db.items.get(id);
  },

  async getLowStockItems(): Promise<Item[]> {
    const items = await db.items.toArray();
    return items.filter(i => 
      i.reorderLevel && 
      i.currentStock !== undefined && 
      i.currentStock <= i.reorderLevel
    );
  },

  // ==================== STOCK LEDGER ====================

  async recordStockTransaction(data: Omit<StockLedger, 'id' | 'createdAt' | 'updatedAt' | 'balanceQuantity'>): Promise<number> {
    const item = await db.items.get(data.itemId);
    if (!item) throw new Error('Item not found');

    const currentStock = item.currentStock || 0;
    const multiplier = ['Purchase', 'Return from Site', 'Opening Stock', 'Adjustment'].includes(data.transactionType) ? 1 : -1;
    const newStock = currentStock + (data.quantity * multiplier);

    if (newStock < 0) {
      throw new Error(`Insufficient stock. Available: ${currentStock}, Required: ${data.quantity}`);
    }

    const transaction: Omit<StockLedger, 'id'> = {
      ...data,
      balanceQuantity: newStock,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const txnId = await db.stockLedger.add(transaction) as number;

    // Update item stock
    await db.items.update(data.itemId, {
      currentStock: newStock,
      updatedAt: new Date(),
    });

    return txnId;
  },

  async getStockLedger(filters?: { itemId?: number; transactionType?: TransactionType }): Promise<StockLedger[]> {
    let ledger = await db.stockLedger.toArray();
    if (filters?.itemId) ledger = ledger.filter(l => l.itemId === filters.itemId);
    if (filters?.transactionType) ledger = ledger.filter(l => l.transactionType === filters.transactionType);
    return ledger.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
  },

  async getItemStockHistory(itemId: number): Promise<StockLedger[]> {
    return await db.stockLedger.where('itemId').equals(itemId).toArray();
  },

  // ==================== SUPPLIERS ====================

  async generateSupplierCode(): Promise<string> {
    const existing = await db.suppliers.toArray();
    const max = existing.reduce((m, supplier) => {
      const match = supplier.supplierCode?.match(/SUP(\d+)/);
      return match ? Math.max(m, parseInt(match[1], 10)) : m;
    }, 0);
    return `SUP${String(max + 1).padStart(3, '0')}`;
  },

  async createSupplier(data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'supplierCode'>): Promise<number> {
    const supplierCode = await this.generateSupplierCode();
    const supplier: Omit<Supplier, 'id'> = {
      ...data,
      supplierCode,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return await db.suppliers.add(supplier) as number;
  },

  async updateSupplier(id: number, data: Partial<Supplier>): Promise<void> {
    await db.suppliers.update(id, { ...data, updatedAt: new Date() });
  },

  async deleteSupplier(id: number): Promise<void> {
    const transactions = await db.stockLedger.where('supplierId').equals(id).count();
    if (transactions > 0) {
      throw new Error('Cannot delete supplier with stock transactions. Archive it instead.');
    }
    await db.suppliers.delete(id);
  },

  async getSuppliers(): Promise<Supplier[]> {
    const suppliers = await db.suppliers.toArray();
    return suppliers.sort((a, b) => a.name.localeCompare(b.name));
  },

  async getSupplierById(id: number): Promise<Supplier | undefined> {
    return db.suppliers.get(id);
  },

  // ==================== STATS & REPORTS ====================

  async getInventoryStats(): Promise<{
    totalItems: number;
    totalValue: number;
    lowStockItems: number;
    categories: Record<string, number>;
  }> {
    const items = await db.items.toArray();
    const lowStock = await this.getLowStockItems();

    const stats = {
      totalItems: items.filter(i => i.status === 'active').length,
      totalValue: items.reduce((sum, i) => {
        const price = i.purchasePrice || i.sellingPrice || 0;
        return sum + ((i.currentStock || 0) * price);
      }, 0),
      lowStockItems: lowStock.length,
      categories: {} as Record<string, number>,
    };

    items.forEach(i => {
      stats.categories[i.category] = (stats.categories[i.category] || 0) + 1;
    });

    return stats;
  },

  async getStockValue(): Promise<{ category: string; value: number }[]> {
    const items = await db.items.toArray();
    const valueByCategory: Record<string, number> = {};

    items.forEach(i => {
      const price = i.purchasePrice || i.sellingPrice || 0;
      const value = (i.currentStock || 0) * price;
      valueByCategory[i.category] = (valueByCategory[i.category] || 0) + value;
    });

    return Object.entries(valueByCategory).map(([category, value]) => ({ category, value }));
  },
};
