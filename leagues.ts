export const GROUPS = ['North American pro', 'Soccer', 'Rugby', 'College'] as const;
export type Group = (typeof GROUPS)[number];

export interface League {
  id: string;
  label: string;
  /** ESPN sport path segment, e.g. "football". Also picks the header icon. */
  sport: string;
  /** ESPN league path segment, e.g. "college-football". Rugby uses numeric ids. */
  slug: string;
  group: Group;
  /** Short tag shown on games when several competitions are merged. */
  short?: string;
  /** Can be merged into another competition's module (cups, internationals). */
  addon?: boolean;
}

const NA: Group = 'North American pro';

export const LEAGUES: League[] = [
  // North American pro
  { id: 'nfl', label: 'NFL', sport: 'football', slug: 'nfl', group: NA },
  { id: 'cfl', label: 'CFL', sport: 'football', slug: 'cfl', group: NA },
  { id: 'ufl', label: 'UFL', sport: 'football', slug: 'ufl', group: NA },
  { id: 'nba', label: 'NBA', sport: 'basketball', slug: 'nba', group: NA },
  { id: 'wnba', label: 'WNBA', sport: 'basketball', slug: 'wnba', group: NA },
  { id: 'mlb', label: 'MLB', sport: 'baseball', slug: 'mlb', group: NA },
  { id: 'nhl', label: 'NHL', sport: 'hockey', slug: 'nhl', group: NA },
  { id: 'pll', label: 'PLL (Premier Lacrosse League)', sport: 'lacrosse', slug: 'pll', group: NA },

  // Soccer
  { id: 'mls', label: 'MLS', sport: 'soccer', slug: 'usa.1', group: 'Soccer', short: 'MLS' },
  { id: 'nwsl', label: 'NWSL', sport: 'soccer', slug: 'usa.nwsl', group: 'Soccer', short: 'NWSL' },
  { id: 'epl', label: 'Premier League', sport: 'soccer', slug: 'eng.1', group: 'Soccer', short: 'PL' },
  { id: 'laliga', label: 'La Liga', sport: 'soccer', slug: 'esp.1', group: 'Soccer', short: 'Liga' },
  { id: 'bundesliga', label: 'Bundesliga', sport: 'soccer', slug: 'ger.1', group: 'Soccer', short: 'BL' },
  { id: 'seriea', label: 'Serie A', sport: 'soccer', slug: 'ita.1', group: 'Soccer', short: 'Serie A' },
  { id: 'ligue1', label: 'Ligue 1', sport: 'soccer', slug: 'fra.1', group: 'Soccer', short: 'L1' },
  { id: 'ligamx', label: 'Liga MX', sport: 'soccer', slug: 'mex.1', group: 'Soccer', short: 'Liga MX' },
  { id: 'ucl', label: 'UEFA Champions League', sport: 'soccer', slug: 'uefa.champions', group: 'Soccer', short: 'UCL', addon: true },
  { id: 'uel', label: 'UEFA Europa League', sport: 'soccer', slug: 'uefa.europa', group: 'Soccer', short: 'UEL', addon: true },

  // Rugby union (ESPN identifies these competitions by number)
  { id: 'premiership', label: 'Gallagher Premiership', sport: 'rugby', slug: '267979', group: 'Rugby', short: 'Prem' },
  { id: 'superrugby', label: 'Super Rugby Pacific', sport: 'rugby', slug: '242041', group: 'Rugby', short: 'SRP' },
  { id: 'mlr', label: 'Major League Rugby', sport: 'rugby', slug: '289262', group: 'Rugby', short: 'MLR' },
  { id: 'sixnations', label: 'Six Nations', sport: 'rugby', slug: '180659', group: 'Rugby', short: '6N', addon: true },
  { id: 'rwc', label: 'Rugby World Cup', sport: 'rugby', slug: '164205', group: 'Rugby', short: 'RWC', addon: true },

  // College
  { id: 'ncaaf', label: 'College football', sport: 'football', slug: 'college-football', group: 'College' },
  { id: 'ncaam', label: "College basketball (men's)", sport: 'basketball', slug: 'mens-college-basketball', group: 'College' },
  { id: 'ncaaw', label: "College basketball (women's)", sport: 'basketball', slug: 'womens-college-basketball', group: 'College' },
];

export function getLeague(id: string | undefined): League {
  return LEAGUES.find((l) => l.id === id) ?? LEAGUES.find((l) => l.id === 'ncaaf')!;
}

/** Competitions that can be merged into the given league's module. */
export function addonsFor(leagueId: string): League[] {
  const base = getLeague(leagueId);
  if (base.group !== 'Soccer' && base.group !== 'Rugby') return [];
  return LEAGUES.filter((l) => l.addon && l.group === base.group && l.id !== base.id);
}

/** Extra competitions are stored as a plain comma-separated string ("ucl,uel"); older builds stored an array. */
export function parseExtras(value: unknown): string[] {
  const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
  return raw.map((x) => String(x).trim()).filter(Boolean);
}
