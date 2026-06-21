import { describe, expect, it } from 'vitest';

import { mapCheckrReportState } from './state';

describe('mapCheckrReportState', () => {
  it('completed + clear → clear', () => {
    expect(mapCheckrReportState('report.completed', 'clear')).toBe('clear');
  });

  it('completed + consider → consider (NOT clear — admin review)', () => {
    expect(mapCheckrReportState('report.completed', 'consider')).toBe('consider');
  });

  it('completed with no/unknown result never auto-passes', () => {
    expect(mapCheckrReportState('report.completed', undefined)).toBe('consider');
    expect(mapCheckrReportState('report.completed', 'anything-else')).toBe('consider');
  });

  it('upgraded behaves like completed', () => {
    expect(mapCheckrReportState('report.upgraded', 'clear')).toBe('clear');
    expect(mapCheckrReportState('report.upgraded', 'consider')).toBe('consider');
  });

  it('created/candidate events → pending', () => {
    expect(mapCheckrReportState('report.created', undefined)).toBe('pending');
    expect(mapCheckrReportState('candidate.created', undefined)).toBe('pending');
  });

  it('unknown event types → in_progress', () => {
    expect(mapCheckrReportState('report.disputed', 'clear')).toBe('in_progress');
    expect(mapCheckrReportState(undefined, undefined)).toBe('in_progress');
  });

  it('a non-clear result can never produce a clear state', () => {
    for (const type of ['report.completed', 'report.upgraded', 'report.created', 'x', undefined]) {
      for (const result of ['consider', 'pending', '', undefined]) {
        expect(mapCheckrReportState(type, result)).not.toBe('clear');
      }
    }
  });
});
