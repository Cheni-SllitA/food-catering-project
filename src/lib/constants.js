export const ROLES = {
  CUSTOMER: 'customer',
  STAFF: 'staff',
  ADMIN: 'administrator',
  CATERING_MANAGER: 'catering_manager',
}

export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
}

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
}

export const RESERVATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}

export const TASK_STATUS = {
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
}

// inventory_txn_type enum
export const TRANSACTION_TYPE = {
  PURCHASE: 'purchase',
  SALE: 'sale',
  ADJUSTMENT: 'adjustment',
  RETURN: 'return',
}

// products has no low_stock_threshold column; single app-wide threshold instead
export const LOW_STOCK_THRESHOLD = 10

export const ROLE_HOME = {
  [ROLES.CUSTOMER]: '/',
  [ROLES.STAFF]: '/staff',
  [ROLES.ADMIN]: '/admin',
  [ROLES.CATERING_MANAGER]: '/catering-manager',
}
