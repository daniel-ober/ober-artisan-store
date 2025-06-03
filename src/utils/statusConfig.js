// src/utils/statusConfig.js

export const STATUS_SCHEMA = {
  order: {
    new: ['new'],
    inProgress: [
      'packaged',
      'in production',
      'back ordered',
      'ready for shipment',
    ],
    completed: ['fulfilled', 'shipped', 'delivered', 'canceled'],
  },
  inquiry: {
    new: ['new'],
    inProgress: ['in progress', 'awaiting customer', 'internal review'],
    completed: ['closed', 'converted to sl request', 'site improvement logged'],
  },
  submission: {
    new: ['new'],
    inProgress: ['prospecting'],
    completed: [
      'closed - won',
      'closed - lost',
      'closed - no response',
      'closed - incomplete form',
      'closed - duplicate/spam',
    ],
  },
  risk: {
    new: ['new'],
    inProgress: ['in review', 'in progress'],
    completed: ['resolved', 'dismissed'],
  },
};

export const STATUS_OPTIONS = {
  order: [
    'New',
    'Packaged',
    'In Production',
    'Back Ordered',
    'Ready for Shipment',
    'Fulfilled',
    'Canceled',
  ],
  inquiry: [
    'New',
    'In Progress - Awaiting Customer',
    'In Progress - Awaiting Support',
    'Converted to SL Request',
    'Closed',
  ],
  soundlegend: [
    'New',
    'Prospecting',
    'Closed - Won',
    'Closed - Lost',
    'Closed - No Response',
    'Closed - Incomplete Form',
    'Closed - Duplicate/Spam',
  ],
  submission: [
    'New',
    'Prospecting',
    'Closed - Won',
    'Closed - Lost',
    'Closed - No Response',
    'Closed - Incomplete Form',
    'Closed - Duplicate/Spam',
  ],
  risk: ['New', 'In Review', 'In Progress', 'Resolved', 'Dismissed'],
};

export const getOverviewStatus = (type, rawStatus) => {
  const normalized = rawStatus?.toLowerCase().trim();
  const schema = STATUS_SCHEMA[type];
  if (!schema) return 'new';

  if (schema.completed.includes(normalized)) return 'completed';
  if (schema.inProgress.includes(normalized)) return 'inProgress';
  return 'new';
};

export const getBadgeClass = (status = '') => {
  const lower = status.toLowerCase();
  if (lower.includes('closed') || lower === 'fulfilled' || lower === 'resolved')
    return 'badge-gray';
  if (
    lower === 'in progress' ||
    lower === 'in review' ||
    lower === 'awaiting customer' ||
    lower === 'prospecting' ||
    lower.includes('packaged') ||
    lower.includes('production')
  )
    return 'badge-yellow';
  return 'badge-green';
};

export const getOrderStatusFromItems = (items) => {
  const statuses = items.map((item) => item.status || 'Preparing');

  if (statuses.length === 0) return 'No Items';

  const allIn = (targets) => statuses.every((s) => targets.includes(s));
  const some = (target) => statuses.includes(target);

  if (allIn(['Shipped', 'Delivered'])) return 'Fulfilled';
  if (statuses.every((s) => s === 'Canceled')) return 'Canceled';
  if (some('Shipped') || some('Delivered')) return 'Partially Fulfilled';
  if (some('Back Ordered')) return 'Partially Fulfilled / Back Ordered';
  if (some('Ready for Shipment')) return 'Ready for Shipment';
  if (some('Packaged')) return 'Order Started';

  return 'Order Started';
};
