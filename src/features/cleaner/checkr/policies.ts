export const routeBackgroundCheckDecision = (status: 'clear' | 'consider' | 'failed') => {
  if (status === 'consider') return 'admin_review';
  if (status === 'failed') return 'admin_review';
  return 'pass';
};
