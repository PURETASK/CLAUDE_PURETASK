export type MatchScoreInput = {
  current_tier: 'rising_pro' | 'proven_specialist' | 'top_performer' | 'all_star_expert';
  average_rating: number | null;
  current_score: number;
  review_count: number;
  is_veteran: boolean;
  zip_covered: boolean;
};

export type MatchScoreBreakdown = {
  total: number;
  tier: number;
  rating: number;
  reliability: number;
  zipCoverage: number;
  experience: number;
  veteran: number;
};

const TIER_POINTS: Record<MatchScoreInput['current_tier'], number> = {
  rising_pro: 5,
  proven_specialist: 12,
  top_performer: 20,
  all_star_expert: 25,
};

export const computeMatchScore = (
  input: MatchScoreInput,
  hasZipFilter: boolean,
): MatchScoreBreakdown => {
  const tier = TIER_POINTS[input.current_tier];
  const rating = input.average_rating != null ? Math.round((input.average_rating / 5) * 25) : 0;
  const reliability = Math.round((input.current_score / 100) * 20);
  const zipCoverage = hasZipFilter ? (input.zip_covered ? 15 : 0) : 15;
  const experience = Math.round((Math.min(input.review_count, 20) / 20) * 10);
  const veteran = input.is_veteran ? 5 : 0;

  return {
    tier,
    rating,
    reliability,
    zipCoverage,
    experience,
    veteran,
    total: tier + rating + reliability + zipCoverage + experience + veteran,
  };
};

export const TIER_LABELS: Record<MatchScoreInput['current_tier'], string> = {
  rising_pro: 'Rising Pro',
  proven_specialist: 'Proven Specialist',
  top_performer: 'Top Performer',
  all_star_expert: 'All-Star Expert',
};

export const TIER_COLORS: Record<MatchScoreInput['current_tier'], { bg: string; text: string }> = {
  rising_pro: { bg: 'bg-zinc-100', text: 'text-zinc-700' },
  proven_specialist: { bg: 'bg-blue-50', text: 'text-blue-700' },
  top_performer: { bg: 'bg-amber-50', text: 'text-amber-700' },
  all_star_expert: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
};
