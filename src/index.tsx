import { LEAGUES, getLeague } from './leagues';
import {
  fetchTeamSchedule,
  fetchTeams,
  resultFor,
  sideFor,
  type Game,
  type Side,
  type TeamOption,
  type TeamSchedule,
} from './espn';
import { dayLabel, getClock, vsWord, whenLabel, type Clock } from './format';

// React is provided by the host as a global, so it is not bundled.
const React: any = (window as any).React;
const { useEffect, useMemo, useState } = React;

const sdk = () => (window as any).__HS_SDK__;

const DIM = 'rgba(255,255,255,0.55)';
const CARD = 'rgba(255,255,255,0.07)';
const RULE = 'rgba(255,255,255,0.14)';
const COLORS: Record<string, string> = { W: '#4ade80', L: '#f87171', T: '#a3a3a3' };

const ellipsis: any = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };

/* ------------------------------------------------------------------ pieces */

function Logo({ src, size }: { src?: string; size: string }) {
  if (!src) return <div style={{ width: size, height: size, flex: 'none' }} />;
  return (
    <img
      src={src}
      alt=""
      style={{ width: size, height: size, objectFit: 'contain', flex: 'none' }}
    />
  );
}

function TeamRow({ side, showRank, showScore }: { side: Side; showRank: boolean; showScore: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em', minWidth: 0 }}>
      <Logo src={side.logo} size="2.1em" />
      {showRank && side.rank ? (
        <span style={{ color: DIM, fontSize: '0.8em', fontWeight: 600 }}>#{side.rank}</span>
      ) : null}
      <span style={{ fontSize: '1.45em', fontWeight: 700, lineHeight: 1.1, ...ellipsis }}>{side.abbr}</span>
      {showScore ? (
        <span style={{ marginLeft: 'auto', fontSize: '1.45em', fontWeight: 700 }}>{side.score ?? '\u2013'}</span>
      ) : null}
    </div>
  );
}

function NextGameCard({ g, cfg, clock }: { g: Game; cfg: any; clock: Clock }) {
  const live = g.state === 'in';
  const headline = g.postponed ? 'Postponed' : live ? `\u25CF ${g.statusText}` : whenLabel(g, clock);
  return (
    <div
      style={{
        background: CARD,
        borderRadius: '1em',
        padding: '0.9em 1.1em',
        display: 'flex',
        alignItems: 'center',
        gap: '1em',
        flex: 'none',
      }}
    >
      <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.55em' }}>
        <TeamRow side={g.away} showRank={cfg.showRank} showScore={live} />
        <TeamRow side={g.home} showRank={cfg.showRank} showScore={live} />
      </div>
      <div style={{ width: 1, alignSelf: 'stretch', background: RULE }} />
      <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.2em' }}>
        <div style={{ fontWeight: 700, fontSize: '1.1em', color: live ? '#4ade80' : undefined }}>{headline}</div>
        {live ? <div style={{ fontSize: '0.8em', color: DIM }}>{dayLabel(g.date, clock)}</div> : null}
        {cfg.showNetwork && g.network ? <div style={{ fontSize: '0.8em', color: DIM }}>{g.network}</div> : null}
        {cfg.showVenue && g.venue ? <div style={{ fontSize: '0.8em', color: DIM, ...ellipsis }}>{g.venue}</div> : null}
        {cfg.showLocation && g.place ? <div style={{ fontSize: '0.8em', color: DIM, ...ellipsis }}>{g.place}</div> : null}
      </div>
    </div>
  );
}

function UpcomingRow({ g, teamId, cfg, clock }: { g: Game; teamId: string; cfg: any; clock: Clock }) {
  const { opp, home } = sideFor(g, teamId);
  const where = [cfg.showNetwork ? g.network : '', cfg.showVenue ? g.venue : '', cfg.showLocation ? g.place : '']
    .filter(Boolean)
    .join(' \u00b7 ');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6em', padding: '0.35em 0', minWidth: 0 }}>
      <span style={{ width: '12.5em', flex: 'none', fontSize: '0.85em', color: DIM, whiteSpace: 'nowrap' }}>
        {g.postponed ? `${dayLabel(g.date, clock)} \u00b7 Postponed` : whenLabel(g, clock)}
      </span>
      <Logo src={opp.logo} size="1.5em" />
      <span style={{ fontWeight: 600, flex: 'none' }}>
        {vsWord(home, g.neutral)} {cfg.showRank && opp.rank ? `#${opp.rank} ` : ''}
        {opp.abbr}
      </span>
      <span style={{ marginLeft: 'auto', fontSize: '0.75em', color: DIM, minWidth: 0, ...ellipsis }}>{where}</span>
    </div>
  );
}

function LastGameRow({ g, teamId, clock }: { g: Game; teamId: string; clock: Clock }) {
  const { opp, home } = sideFor(g, teamId);
  const r = resultFor(g, teamId);
  return (
    <div
      style={{
        background: CARD,
        borderRadius: '0.9em',
        padding: '0.6em 1em',
        display: 'flex',
        alignItems: 'center',
        gap: '0.7em',
        flex: 'none',
        minWidth: 0,
      }}
    >
      <span style={{ color: DIM, fontSize: '0.85em' }}>Last</span>
      <span style={{ color: COLORS[r.letter], fontWeight: 800, fontSize: '1.2em' }}>{r.letter}</span>
      <span style={{ fontWeight: 700, fontSize: '1.2em' }}>{r.score}</span>
      <Logo src={opp.logo} size="1.6em" />
      <span style={{ fontWeight: 600, ...ellipsis }}>
        {vsWord(home, g.neutral)} {opp.abbr}
      </span>
      <span style={{ marginLeft: 'auto', color: DIM, fontSize: '0.8em', flex: 'none' }}>{dayLabel(g.date, clock)}</span>
    </div>
  );
}

function SportIcon({ sport, size }: { sport: string; size: string }) {
  const common: any = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
  let body: any;
  switch (sport) {
    case 'basketball':
      body = (
        <g {...common}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2v20M2 12h20M5 4.6c3.4 3.3 3.4 11.5 0 14.8M19 4.6c-3.4 3.3-3.4 11.5 0 14.8" />
        </g>
      );
      break;
    case 'baseball':
      body = (
        <g {...common}>
          <circle cx="12" cy="12" r="10" />
          <path d="M5.5 5.5c2.5 3 2.5 10 0 13M18.5 5.5c-2.5 3-2.5 10 0 13M7.6 8.2l1.6.6M7.8 11.6l1.7.1M7.8 14.9l1.6-.5M16.4 8.2l-1.6.6M16.2 11.6l-1.7.1M16.2 14.9l-1.6-.5" />
        </g>
      );
      break;
    case 'hockey':
      body = (
        <g {...common}>
          <ellipse cx="12" cy="8.5" rx="8" ry="3.5" />
          <path d="M4 8.5v6.5c0 1.9 3.6 3.5 8 3.5s8-1.6 8-3.5V8.5" />
        </g>
      );
      break;
    case 'soccer':
      body = (
        <g {...common}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8.5l3.2 2.3-1.2 3.7h-4l-1.2-3.7zM12 8.5V2.3M15.2 10.8l5.6-1.8M14 14.5l3.5 4.7M10 14.5l-3.5 4.7M8.8 10.8L3.2 9" />
        </g>
      );
      break;
    default:
      // American football
      body = (
        <g {...common}>
          <path d="M3.5 20.5C3.5 11.5 11.5 3.5 20.5 3.5c0 9-8 17-17 17z" />
          <path d="M9 15l6-6M11.6 10.4l2 2M9.4 12.6l2 2M13.8 8.2l2 2" />
        </g>
      );
  }
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ flex: 'none', color: 'rgba(255,255,255,0.7)' }} role="img" aria-label={sport}>
      {body}
    </svg>
  );
}

function Header({ s, cfg }: { s: TeamSchedule; cfg: any }) {
  const sub = [cfg.showRecord ? s.header.record : '', cfg.showRecord ? s.header.standing : '']
    .filter(Boolean)
    .join(' \u00b7 ');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8em', flex: 'none', minWidth: 0 }}>
      <Logo src={s.header.logo} size="2.8em" />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '1.6em', fontWeight: 700, lineHeight: 1.1, ...ellipsis }}>{s.header.name || cfg.teamName}</div>
        {sub ? <div style={{ fontSize: '0.8em', color: DIM, marginTop: '0.15em' }}>{sub}</div> : null}
      </div>
      <div style={{ marginLeft: 'auto', paddingLeft: '0.4em' }}>
        <SportIcon sport={getLeague(cfg.league).sport} size="1.9em" />
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- component */

export default function FavoriteTeam({ config }: { config: any }) {
  const { ModuleLoadingState } = sdk();
  const cfg = { ...DEFAULTS, ...(config ?? {}) };
  const league = cfg.league;
  const teamId = String(cfg.teamId ?? '');
  const refreshMinutes = Math.max(1, Number(cfg.refreshMinutes) || 5);

  const [sched, setSched] = useState(null as TeamSchedule | null);
  const [error, setError] = useState(undefined as string | undefined);

  useEffect(() => {
    if (!teamId) {
      setSched(null);
      setError(undefined);
      return;
    }
    let alive = true;
    let timer: any;
    const intervalMs = refreshMinutes * 60000;
    let ttl = Math.max(15000, intervalMs - 5000);

    const run = async () => {
      let wait = intervalMs;
      try {
        const s = await fetchTeamSchedule(league, teamId, ttl);
        if (!alive) return;
        setSched(s);
        setError(undefined);
        // Poll faster while a game is in progress.
        const live = s.upcoming.some((g) => g.state === 'in');
        wait = live ? 60000 : intervalMs;
        ttl = live ? 30000 : Math.max(15000, intervalMs - 5000);
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : String(e));
        wait = Math.min(intervalMs, 60000);
      }
      if (alive) timer = setTimeout(run, wait);
    };

    setSched(null);
    run();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [league, teamId, refreshMinutes]);

  const clock = useMemo(() => getClock(), [sched]);
  const count = Math.min(5, Math.max(1, Number(cfg.gamesToShow) || 1));

  const rootStyle: any = {
    boxSizing: 'border-box',
    width: '100%',
    height: '100%',
    padding: '0.6em',
    fontSize: `${Number(cfg.textSize) || 16}px`,
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.7em',
    overflow: 'hidden',
  };

  if (!teamId) {
    return (
      <div style={{ ...rootStyle, alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: DIM }}>
        Choose a team in this module&rsquo;s settings.
      </div>
    );
  }

  const upcoming = sched ? sched.upcoming.slice(0, count) : [];
  const next = upcoming[0];
  const later = upcoming.slice(1);

  return (
    <ModuleLoadingState loading={!sched && !error} error={sched ? undefined : error}>
      {sched ? (
        <div style={rootStyle}>
          <Header s={sched} cfg={cfg} />
          {next ? (
            <NextGameCard g={next} cfg={cfg} clock={clock} />
          ) : (
            <div style={{ background: CARD, borderRadius: '1em', padding: '0.9em 1.1em', color: DIM }}>
              No upcoming games scheduled.
            </div>
          )}
          {later.length > 0 ? (
            <div style={{ flex: '1 1 0', minHeight: 0, overflow: 'hidden', padding: '0 0.4em' }}>
              {later.map((g, i) => (
                <div key={g.id} style={{ borderTop: i === 0 ? 'none' : `1px solid ${RULE}` }}>
                  <UpcomingRow g={g} teamId={teamId} cfg={cfg} clock={clock} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ flex: '1 1 0' }} />
          )}
          {cfg.showLast && sched.last ? <LastGameRow g={sched.last} teamId={teamId} clock={clock} /> : null}
        </div>
      ) : (
        <div />
      )}
    </ModuleLoadingState>
  );
}

const DEFAULTS = {
  league: 'ncaaf',
  teamId: '',
  teamName: '',
  gamesToShow: 3,
  showLast: true,
  showRecord: true,
  showRank: true,
  showNetwork: true,
  showVenue: true,
  showLocation: true,
  textSize: 16,
  refreshMinutes: 5,
};

/* ----------------------------------------------------------- editor panel */

function Check({ label, field, config, onChange }: any) {
  return (
    <label className="flex items-center gap-2 text-xs text-neutral-300 mb-2">
      <input
        type="checkbox"
        checked={config[field] ?? (DEFAULTS as any)[field]}
        onChange={(e: any) => onChange({ [field]: e.target.checked })}
      />
      {label}
    </label>
  );
}

function Range({ label, field, min, max, step, config, onChange }: any) {
  const value = Number(config[field] ?? (DEFAULTS as any)[field]);
  return (
    <div className="mb-3">
      <label className="block text-xs text-neutral-400 mb-1">
        {label}: {value}
      </label>
      <input
        type="range"
        className="w-full"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e: any) => onChange({ [field]: Number(e.target.value) })}
      />
    </div>
  );
}

export function ConfigSection({ config, onChange }: { config: any; onChange: (u: any) => void }) {
  const { AccordionSection, INPUT_CLASS } = sdk();
  const Wrap = AccordionSection ?? ((p: any) => <div>{p.children}</div>);

  const league = config.league ?? DEFAULTS.league;
  const [teams, setTeams] = useState(null as TeamOption[] | null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let alive = true;
    setTeams(null);
    setError('');
    fetchTeams(league)
      .then((t) => alive && setTeams(t))
      .catch((e) => alive && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      alive = false;
    };
  }, [league]);

  const visible = useMemo(() => {
    if (!teams) return [] as TeamOption[];
    const q = query.trim().toLowerCase();
    const list = q ? teams.filter((t) => t.name.toLowerCase().includes(q) || t.abbr.toLowerCase() === q) : teams;
    const chosen = teams.find((t) => t.id === String(config.teamId ?? ''));
    return chosen && !list.includes(chosen) ? [chosen, ...list] : list;
  }, [teams, query, config.teamId]);

  const pro = LEAGUES.filter((l) => l.group === 'Pro');
  const college = LEAGUES.filter((l) => l.group === 'College');

  return (
    <Wrap title="Favorite team" defaultOpen>
      <label className="block text-xs text-neutral-400 mb-1">League</label>
      <select
        className={`${INPUT_CLASS} mb-3`}
        value={getLeague(league).id}
        onChange={(e: any) => onChange({ league: e.target.value, teamId: '', teamName: '' })}
      >
        <optgroup label="Professional">
          {pro.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </optgroup>
        <optgroup label="College">
          {college.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </optgroup>
      </select>

      <label className="block text-xs text-neutral-400 mb-1">Team</label>
      {error ? (
        <div className="text-xs text-red-400 mb-3">Could not load teams ({error}).</div>
      ) : !teams ? (
        <div className="text-xs text-neutral-400 mb-3">Loading teams&hellip;</div>
      ) : (
        <>
          <input
            className={`${INPUT_CLASS} mb-2`}
            placeholder="Search teams"
            value={query}
            onChange={(e: any) => setQuery(e.target.value)}
          />
          <select
            className={`${INPUT_CLASS} mb-3`}
            value={String(config.teamId ?? '')}
            onChange={(e: any) => {
              const t = teams.find((x) => x.id === e.target.value);
              onChange({ teamId: t ? t.id : '', teamName: t ? t.name : '' });
            }}
          >
            <option value="">Choose a team&hellip;</option>
            {visible.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </>
      )}

      <Range label="Upcoming games to show" field="gamesToShow" min={1} max={5} step={1} config={config} onChange={onChange} />
      <Check label="Show last game result" field="showLast" config={config} onChange={onChange} />
      <Check label="Show record and standing" field="showRecord" config={config} onChange={onChange} />
      <Check label="Show rankings (college)" field="showRank" config={config} onChange={onChange} />
      <Check label="Show TV network" field="showNetwork" config={config} onChange={onChange} />
      <Check label="Show venue" field="showVenue" config={config} onChange={onChange} />
      <Check label="Show city and state" field="showLocation" config={config} onChange={onChange} />
      <Range label="Text size" field="textSize" min={10} max={40} step={1} config={config} onChange={onChange} />
      <Range label="Refresh every (minutes)" field="refreshMinutes" min={1} max={60} step={1} config={config} onChange={onChange} />
    </Wrap>
  );
}
