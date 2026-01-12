import { db } from './database';

export const auditService = {
  async logEvent(
    module: string,
    action: 'Create' | 'Update' | 'Delete' | 'Login' | 'Logout' | 'Export' | 'Approve' | 'Reject' | 'Error',
    details?: {
      recordId?: number;
      entity?: string;
      entityId?: number;
      reason?: string;
      oldValue?: any;
      newValue?: any;
      error?: any;
      userId?: number;
      branchId?: number;
    }
  ) {
    const entry = {
      userId: details?.userId,
      module,
      action,
      recordId: details?.recordId,
      entity: details?.entity,
      entityId: details?.entityId,
      reason: details?.reason,
      oldValue: details?.oldValue ? JSON.stringify(details.oldValue) : undefined,
      newValue: details?.newValue ? JSON.stringify(details.newValue) : undefined,
      ipAddress: undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      timestamp: new Date(),
      branchId: details?.branchId,
    };
    await db.auditLogs.add(entry as any);
  },

  async logError(module: string, error: any, userId?: number) {
    await this.logEvent(module, 'Error', { error, userId, newValue: { message: String(error?.message || error), stack: error?.stack } });
  },
};
