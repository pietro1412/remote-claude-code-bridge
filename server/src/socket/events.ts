// Socket event name constants
export const SERVER_EVENTS = {
  CC_OUTPUT: 'cc:output',
  CC_STATUS: 'cc:status',
  CC_COST: 'cc:cost',
  CC_ERROR: 'cc:error',
  SESSION_LIST: 'session:list',
  SESSION_CREATED: 'session:created',
  SESSION_UPDATED: 'session:updated',
} as const;

export const CLIENT_EVENTS = {
  CC_INPUT: 'cc:input',
  CC_PHOTO: 'cc:photo',
  CC_APPROVE: 'cc:approve',
  CC_REJECT: 'cc:reject',
  CC_INTERRUPT: 'cc:interrupt',
  SESSION_CREATE: 'session:create',
  SESSION_RESUME: 'session:resume',
  SESSION_KILL: 'session:kill',
  SESSION_LIST: 'session:list',
} as const;
