export type CheckrState = 'pending' | 'in_progress' | 'clear' | 'consider';

/**
 * Map a Checkr webhook event to a background_check state.
 *
 * Safety-critical: a completed report is only `clear` when Checkr's result is
 * literally `'clear'`. Any other result (notably `'consider'`, meaning a record
 * was found) maps to `consider` for admin review — never auto-pass a check.
 */
export const mapCheckrReportState = (
  type: string | undefined,
  result: string | undefined,
): CheckrState => {
  if (type === 'report.completed' || type === 'report.upgraded') {
    return result === 'clear' ? 'clear' : 'consider';
  }
  if (type === 'report.created' || type === 'candidate.created') {
    return 'pending';
  }
  return 'in_progress';
};
