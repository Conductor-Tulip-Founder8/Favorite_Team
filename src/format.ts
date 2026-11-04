import type { Game } from './espn';

export interface Clock {
  timeZone?: string;
  locale: string;
}

export function getClock(): Clock {
  const sdk = (window as any).__HS_SDK__ ?? {};
  let timeZone: string | undefined;
  try {
    timeZone = sdk.getHostSettings?.().timezone || undefined;
  } catch {
    timeZone = undefined;
  }
  return { timeZone, locale: sdk.locale || 'en-US' };
}

function fmt(ms: number, clock: Clock, opts: Intl.DateTimeFormatOptions): string {
  try {
    return new Intl.DateTimeFormat(clock.locale, { ...opts, timeZone: clock.timeZone }).format(ms);
  } catch {
    // An unknown time zone name should not blank the module.
    return new Intl.DateTimeFormat('en-US', opts).format(ms);
  }
}

/** "Sat, 11/7" */
export function dayLabel(ms: number, clock: Clock): string {
  return fmt(ms, clock, { weekday: 'short', month: 'numeric', day: 'numeric' });
}

/** "7:30 PM" */
export function timeLabel(ms: number, clock: Clock): string {
  return fmt(ms, clock, { hour: 'numeric', minute: '2-digit' });
}

/** "Sat, 11/7 · 7:30 PM", or "Sat, 11/7 · Time TBD" when the start time is not set yet. */
export function whenLabel(g: Game, clock: Clock): string {
  const day = dayLabel(g.date, clock);
  return `${day} \u00b7 ${g.timeKnown ? timeLabel(g.date, clock) : 'Time TBD'}`;
}

/** "at" for road games, "vs" for home and neutral-site games. */
export function vsWord(isHome: boolean, neutral: boolean): string {
  return !isHome && !neutral ? 'at' : 'vs';
}
