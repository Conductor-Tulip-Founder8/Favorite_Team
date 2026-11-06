# Favorite Team: a Home Screens plugin

Follow one team on your wall display. Pick a league and a team and the module shows:

- the **next game** in a card with both team logos, date and time, TV network, venue and city
- up to **five upcoming games** (the next game plus up to four more in a compact list)
- the **last result**, always on the bottom row: W/L, score, opponent and date
- the team's record and standing, AP/coaches rankings for college teams, and a sport icon (football, basketball, baseball, hockey, soccer) in the header so college teams are easy to tell apart
- the **live score and game clock** while a game is in progress. The module refreshes every minute during a game and reads ESPN's live game summary, because the schedule feed can lag

Data comes from ESPN's public, unofficial site API, fetched through the Home Screens plugin proxy. No API key is needed.

## Leagues

| Group | Leagues |
| --- | --- |
| North American pro | NFL, CFL, UFL, NBA, WNBA, MLB, NHL, PLL (Premier Lacrosse League) |
| Soccer | MLS, NWSL, Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Liga MX, UEFA Champions League |
| Rugby | Gallagher Premiership, Super Rugby Pacific, Major League Rugby, Six Nations, Rugby World Cup |
| College | Football, men's basketball, women's basketball |

Each league has its own header icon: football (NFL, CFL, UFL, college), basketball, baseball, hockey puck, soccer ball, rugby ball and lacrosse stick.

To add another league, add one entry to `src/leagues.ts`. ESPN names most leagues with a short code (`eng.1`) and rugby competitions with a number.

## Install

Once a release exists and the plugin is listed in the registry: **Plugins > Browse > Favorite Team > Install**.

Before that, from a release tarball: **Plugins > Browse > Install from URL** and paste the HTTPS link to `plugin.tar.gz` from this repo's Releases page.

Then drag **Favorite Team** (group: Sports) onto a screen, click it, and choose a league and team in its settings.

## Settings

| Setting | Default | Notes |
| --- | --- | --- |
| League / Team | College football / none | The team list loads from ESPN for the chosen league. |
| Upcoming games to show | 3 | 1 to 5, counting the next game. |
| Show last game result | on | |
| Show record and standing | on | e.g. `7-1 · 1st in FBS Indep.` |
| Show rankings | on | Only ranked college teams (top 25) show a `#`. |
| Show TV network, venue, city and state | on | |
| Text size | 16 | Everything scales from this. Make the module taller or lower the size if the last-result row is cut off. |
| Refresh every (minutes) | 5 | Drops to 1 minute during a live game. |

A module around 560 × 420 px fits the header, the next-game card, two or three more games and the last result at text size 16.

## Develop

```bash
npm install
npm run typecheck
npm run build        # writes dist/bundle.js (single IIFE, React is the host's global)
npm run dev          # rebuilds on change and serves this folder on http://localhost:5555
```

In the editor, open the **Developer** tab and paste `http://localhost:5555`. Dev plugins only apply in the editor preview; a real kiosk needs an installed copy.

## Release and list it

1. Bump `version` in `manifest.json` (and `package.json`).
2. Commit, then tag and push: `git tag v1.0.0 && git push origin v1.0.0`.
3. The **Release** workflow builds `plugin.tar.gz` (the manifest and `dist/`) and attaches it to a GitHub release. The job summary prints the SHA-256.
4. To list it in the directory, open https://homescreens.dev/plugins/submit, paste this repository's URL and that SHA-256.

## Notes and limits

- ESPN's endpoints are public but undocumented, so they can change without notice.
- The proxy allows 60 requests a minute per plugin. Each refresh makes two or three requests (regular season, playoffs, and next season when nothing is left this season), plus one or two per added competition and one more per game in progress.
- Logos load straight from ESPN's image servers in the display's browser.
- **Several competitions in one module:** for soccer, pick the league (e.g. Premier League) and tick *UEFA Champions League* and/or *Europa League* under "Also show this team's games from". The games are merged into one timeline and each shows a small tag (PL, UCL, ...). For rugby, the Six Nations and Rugby World Cup can be added the same way. This assumes ESPN uses the same team id in each competition; games that do not involve the team are dropped.
- Rugby standings are not available from ESPN, so the record line may be blank.
- Rugby league IDs (e.g. `267979`) are ESPN's own numbers and appear only in `src/leagues.ts`.

## License

MIT
