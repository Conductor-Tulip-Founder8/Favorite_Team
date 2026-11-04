export interface League {
  id: string;
  label: string;
  /** ESPN sport path segment, e.g. "football". */
  sport: string;
  /** ESPN league path segment, e.g. "college-football". */
  slug: string;
  group: 'Pro' | 'College';
}

export const LEAGUES: League[] = [
  { id: 'nfl', label: 'NFL', sport: 'football', slug: 'nfl', group: 'Pro' },
  { id: 'nba', label: 'NBA', sport: 'basketball', slug: 'nba', group: 'Pro' },
  { id: 'mlb', label: 'MLB', sport: 'baseball', slug: 'mlb', group: 'Pro' },
  { id: 'nhl', label: 'NHL', sport: 'hockey', slug: 'nhl', group: 'Pro' },
  { id: 'wnba', label: 'WNBA', sport: 'basketball', slug: 'wnba', group: 'Pro' },
  { id: 'mls', label: 'MLS', sport: 'soccer', slug: 'usa.1', group: 'Pro' },
  { id: 'ncaaf', label: 'College football', sport: 'football', slug: 'college-football', group: 'College' },
  { id: 'ncaam', label: "College basketball (men's)", sport: 'basketball', slug: 'mens-college-basketball', group: 'College' },
  { id: 'ncaaw', label: "College basketball (women's)", sport: 'basketball', slug: 'womens-college-basketball', group: 'College' },
];

export function getLeague(id: string | undefined): League {
  return LEAGUES.find((l) => l.id === id) ?? LEAGUES.find((l) => l.id === 'ncaaf')!;
}
