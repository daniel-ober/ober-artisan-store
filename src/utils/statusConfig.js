export const STATUS_SCHEMA = {
  order: {
  new: ['new'],
  inProgress: ['in progress'],
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
  soundlegend: {
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
    'Preparing',
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
  const normalized = String(rawStatus || '').toLowerCase().trim();
  const schema = STATUS_SCHEMA[type];
  if (!schema) return 'new';

  const isInList = (list) =>
    list?.some((status) => status.toLowerCase().trim() === normalized);

  if (isInList(schema.completed)) return 'completed';
  if (isInList(schema.inProgress)) return 'inProgress';
  return 'new';
};

export const getBadgeClass = (status = '') => {
  const lower = String(status).toLowerCase().trim();

  if (lower === 'new') return 'badge-green';

  if (
    lower.includes('closed') ||
    lower === 'fulfilled' ||
    lower === 'resolved' ||
    lower === 'canceled' ||
    lower === 'delivered' ||
    lower === 'shipped'
  ) {
    return 'badge-gray';
  }

  if (
    lower === 'preparing' ||
    lower === 'in progress' ||
    lower === 'in review' ||
    lower === 'awaiting customer' ||
    lower === 'prospecting' ||
    lower.includes('packaged') ||
    lower.includes('production') ||
    lower.includes('back ordered') ||
    lower.includes('ready for shipment') ||
    lower.includes('partially fulfilled') ||
    lower.includes('order started')
  ) {
    return 'badge-yellow';
  }

  return 'badge-blue';
};

export const getOrderStatusFromItems = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) return 'New';

  const statuses = items.map((item) =>
    String(item?.status || 'Preparing').trim().toLowerCase()
  );

  const allIn = (targets) => statuses.every((status) => targets.includes(status));
  const someIn = (targets) => statuses.some((status) => targets.includes(status));

  if (allIn(['canceled'])) return 'Canceled';

  if (allIn(['shipped', 'delivered']) || allIn(['delivered'])) {
    return 'Fulfilled';
  }

  if (
    someIn([
      'preparing',
      'packaged',
      'in production',
      'back ordered',
      'ready for shipment',
      'partially fulfilled',
      'partially fulfilled / back ordered',
      'order started',
      'shipped',
      'delivered',
    ])
  ) {
    return 'In Progress';
  }

  return 'New';
};