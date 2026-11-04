import { getLeague, type League } from './leagues';

export const PLUGIN_ID = 'favorite-team';
const BASE = 'https://site.api.espn.com/apis/site/v2/sports';

export interface TeamOption {
  id: string;
  name: string;
  abbr: string;
  logo?: string;
}

export interface Side {
  id: string;
  abbr: string;
  name: string;
  logo?: string;
  score?: string;
  winner?: boolean;
  /** AP / coaches ranking, only when ranked 1-25. */
  rank?: number;
  record?: string;
}

export interface Game {
  id: string;
  /** Start time, epoch ms. */
  date: number;
  timeKnown: boolean;
  state: 'pre' | 'in' | 'post';
  completed: boolean;
  postponed: boolean;
  /** Short live status such as "Q3 4:12" or "Final". */
  statusText: string;
  home: Side;
  away: Side;
  venue?: string;
  /** "City, ST" */
  place?: string;
  neutral: boolean;
  network?: string;
}

export interface TeamHeader {
  name: string;
  abbr: string;
  logo?: string;
  record?: string;
  standing?: string;
}

export interface TeamSchedule {
  header: TeamHeader;
  last?: Game;
  upcoming: Game[];
}

/* ---------------------------------------------------------------- fetch */

async function getJson(url: string, cacheTtlMs: number): Promise<any> {
  const { pluginFetch } = (window as any).__HS_SDK__;
  const res = await pluginFetch(PLUGIN_ID, { url, cacheTtlMs });
  if (!res.ok) throw new Error(`ESPN returned ${res.status}`);
  return res.json();
}

const teamCache = new Map<string, TeamOption[]>();

export async function fetchTeams(leagueId: string): Promise<TeamOption[]> {
  const cached = teamCache.get(leagueId);
  if (cached) return cached;
  const l = getLeague(leagueId);
  const json = await getJson(`${BASE}/${l.sport}/${l.slug}/teams?limit=1000`, 60 * 60 * 1000);
  const raw: any[] = json?.sports?.[0]?.leagues?.[0]?.teams ?? [];
  const teams = raw
    .map((t) => t.team ?? t)
    .filter((t) => t && t.id)
    .map((t) => ({
      id: String(t.id),
      name: String(t.displayName ?? t.name ?? t.id),
      abbr: String(t.abbreviation ?? ''),
      logo: pickLogo(t),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  teamCache.set(leagueId, teams);
  return teams;
}

export async function fetchTeamSchedule(
  leagueId: string,
  teamId: string,
  cacheTtlMs: number,
): Promise<TeamSchedule> {
  const l = getLeague(leagueId);
  const url = `${BASE}/${l.sport}/${l.slug}/teams/${encodeURIComponent(teamId)}/schedule`;

  const main = await getJson(url, cacheTtlMs);
  let events: any[] = main?.events ?? [];

  // Playoffs live under a separate season type; a miss here is not fatal.
  try {
    const post = await getJson(`${url}?seasontype=3`, cacheTtlMs);
    events = events.concat(post?.events ?? []);
  } catch {
    /* ignore */
  }

  // Off-season: nothing left this season, so look at the next one.
  const now = Date.now();
  const hasUpcoming = events.some((e) => Date.parse(e?.date) > now - 6 * 3600 * 1000 && !isFinished(e));
  if (!hasUpcoming) {
    const year = Number(main?.requestedSeason?.year ?? main?.season?.year ?? new Date().getFullYear());
    try {
      const next = await getJson(`${url}?season=${year + 1}`, cacheTtlMs);
      events = events.concat(next?.events ?? []);
    } catch {
      /* ignore */
    }
  }

  const games = parseGames(events);
  await refreshLive(l, games);
  return classify(main?.team, games);
}

/* ------------------------------------------------------------- live scores */

async function getSummary(l: League, eventId: string): Promise<any> {
  const path = `${l.sport}/${l.slug}/summary?event=${encodeURIComponent(eventId)}`;
  try {
    return await getJson(`${BASE}/${path}`, 15000);
  } catch {
    return getJson(`https://site.web.api.espn.com/apis/site/v2/sports/${path}`, 15000);
  }
}

/**
 * The schedule feed can lag during a game, so for any game that should be under way
 * (or has just ended) ask for its live summary and overlay the score and clock.
 */
async function refreshLive(l: League, games: Game[]): Promise<void> {
  const now = Date.now();
  const candidates = games
    .filter((g) => !g.completed && !g.postponed && g.date <= now + 5 * 60000 && g.date > now - 9 * 3600000)
    .slice(-2);
  for (const g of candidates) {
    try {
      applyLive(g, await getSummary(l, g.id));
    } catch {
      /* keep what the schedule said */
    }
  }
}

export function applyLive(g: Game, json: any): void {
  const comp = json?.header?.competitions?.[0];
  if (!comp) return;
  const type = comp.status?.type;
  if (type) {
    g.state = type.state === 'in' || type.state === 'post' ? type.state : 'pre';
    g.completed = !!type.completed;
    g.statusText = String(type.shortDetail ?? type.detail ?? g.statusText);
  }
  for (const c of comp.competitors ?? []) {
    const side = c.homeAway === 'home' ? g.home : c.homeAway === 'away' ? g.away : null;
    if (!side) continue;
    if (c.score != null) {
      const v = typeof c.score === 'object' ? (c.score.displayValue ?? c.score.value) : c.score;
      if (v !== '' && v != null) side.score = String(v);
    }
    if (typeof c.winner === 'boolean') side.winner = c.winner;
  }
}

/* --------------------------------------------------------------- parsing */

function isFinished(ev: any): boolean {
  return !!ev?.competitions?.[0]?.status?.type?.completed;
}

function pickLogo(t: any): string | undefined {
  const logos: any[] = t?.logos ?? [];
  const dark = logos.find((x) => Array.isArray(x?.rel) && x.rel.includes('dark'));
  return (dark ?? logos[0])?.href ?? t?.logo;
}

function parseSide(c: any): Side {
  const t = c?.team ?? {};
  const sc = c?.score;
  let score: string | undefined;
  if (sc != null) {
    score = typeof sc === 'object' ? String(sc.displayValue ?? sc.value ?? '') : String(sc);
    if (score === '') score = undefined;
  }
  const recs = c?.record;
  const rec = Array.isArray(recs)
    ? (recs.find((r: any) => r?.type === 'total') ?? recs[0])?.displayValue
    : recs?.displayValue;
  const rankRaw = Number(c?.curatedRank?.current ?? c?.rank);
  return {
    id: String(t.id ?? c?.id ?? ''),
    abbr: String(t.abbreviation ?? t.shortDisplayName ?? t.displayName ?? '').toUpperCase(),
    name: String(t.displayName ?? t.shortDisplayName ?? ''),
    logo: pickLogo(t),
    score,
    winner: typeof c?.winner === 'boolean' ? c.winner : undefined,
    rank: rankRaw >= 1 && rankRaw <= 25 ? rankRaw : undefined,
    record: rec || undefined,
  };
}

export function parseGame(ev: any): Game | null {
  const comp = ev?.competitions?.[0];
  const comps: any[] = comp?.competitors ?? [];
  const home = comps.find((c) => c.homeAway === 'home');
  const away = comps.find((c) => c.homeAway === 'away');
  if (!comp || !home || !away) return null;

  const type = comp.status?.type ?? {};
  const name = String(type.name ?? '');
  if (/CANCEL/i.test(name)) return null;

  const state: Game['state'] = type.state === 'in' || type.state === 'post' ? type.state : 'pre';
  const detail = String(type.shortDetail ?? type.detail ?? '');
  const addr = comp.venue?.address ?? {};
  const place = [addr.city, addr.state ?? addr.country].filter(Boolean).join(', ');

  const casts: any[] = comp.broadcasts ?? comp.geoBroadcasts ?? [];
  const network = casts
    .map((b) => b?.media?.shortName ?? b?.names?.[0])
    .filter(Boolean)
    .slice(0, 2)
    .join(' / ');

  return {
    id: String(ev.id ?? comp.id),
    date: Date.parse(ev.date ?? comp.date),
    timeKnown: comp.timeValid !== false && !/TBD/i.test(detail),
    state,
    completed: !!type.completed,
    postponed: /POSTPONED/i.test(name),
    statusText: detail,
    home: parseSide(home),
    away: parseSide(away),
    venue: comp.venue?.fullName || undefined,
    place: place || undefined,
    neutral: !!comp.neutralSite,
    network: network || undefined,
  };
}

export function parseGames(events: any[]): Game[] {
  const seen = new Set<string>();
  const games: Game[] = [];
  for (const ev of events) {
    const g = parseGame(ev);
    if (!g || !Number.isFinite(g.date) || seen.has(g.id)) continue;
    seen.add(g.id);
    games.push(g);
  }
  games.sort((a, b) => a.date - b.date);
  return games;
}

export function buildSchedule(team: any, events: any[]): TeamSchedule {
  return classify(team, parseGames(events));
}

export function classify(team: any, games: Game[]): TeamSchedule {
  const finished = games.filter((g) => g.completed);
  const upcoming = games.filter((g) => !g.completed);

  return {
    header: {
      name: String(team?.displayName ?? team?.name ?? ''),
      abbr: String(team?.abbreviation ?? ''),
      logo: pickLogo(team),
      record: team?.recordSummary || undefined,
      standing: team?.standingSummary || undefined,
    },
    last: finished[finished.length - 1],
    upcoming,
  };
}

/* --------------------------------------------------------------- helpers */

export function sideFor(g: Game, teamId: string): { mine: Side; opp: Side; home: boolean } {
  const home = g.home.id === teamId;
  return home ? { mine: g.home, opp: g.away, home: true } : { mine: g.away, opp: g.home, home: false };
}

export function resultFor(g: Game, teamId: string): { letter: 'W' | 'L' | 'T'; score: string } {
  const { mine, opp } = sideFor(g, teamId);
  const a = Number(mine.score);
  const b = Number(opp.score);
  let letter: 'W' | 'L' | 'T';
  if (mine.winner === true) letter = 'W';
  else if (opp.winner === true) letter = 'L';
  else letter = a > b ? 'W' : a < b ? 'L' : 'T';
  // Winner's score first, like a box score.
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  return { letter, score: `${hi}-${lo}` };
}
