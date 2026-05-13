export type ScoreNotificationTemplate = {
  type: 'score_increased' | 'score_decreased' | 'tier_promoted' | 'tier_demoted';
  title: string;
  body: string;
};

export function scoreIncreasedTemplate(
  pointsDelta: number,
  topMetric: string,
): ScoreNotificationTemplate {
  return {
    type: 'score_increased',
    title: 'Your score improved!',
    body: `+${pointsDelta} points — your ${topMetric} is excellent.`,
  };
}

export function scoreDecreasedTemplate(
  metricName: string,
  metricValue: number,
): ScoreNotificationTemplate {
  return {
    type: 'score_decreased',
    title: 'Your score dropped',
    body: `Your ${metricName} fell to ${metricValue}%. Your next job is a great chance to recover.`,
  };
}

export function tierPromotedTemplate(
  newTierLabel: string,
  newFeePercent: number,
): ScoreNotificationTemplate {
  return {
    type: 'tier_promoted',
    title: `You reached ${newTierLabel}!`,
    body: `Your platform fee drops to ${newFeePercent}% starting now. Keep it up!`,
  };
}

export function tierDropWarningTemplate(
  daysInBand: number,
  daysRemaining: number,
): ScoreNotificationTemplate {
  return {
    type: 'tier_demoted',
    title: 'Tier change warning',
    body: `Your score has been below the threshold for ${daysInBand} days. You have ${daysRemaining} more days before your tier adjusts.`,
  };
}
