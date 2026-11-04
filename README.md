# Favorite Team: a Home Screens plugin

Follow one team on your wall display. Pick a team from the NFL, NBA, MLB, NHL, WNBA, MLS, college football or college basketball and the module shows:

- the **next game** in a card with both team logos, date and time, TV network, venue and city
- up to **five upcoming games** (the next game plus up to four more in a compact list)
- the **last result**, always on the bottom row: W/L, score, opponent and date
- the team's record and standing, and AP/coaches rankings for college teams
- live score and clock while a game is in progress (the module refreshes every minute during a game)

Data comes from ESPN's public, unofficial site API, fetched through the Home Screens plugin proxy. No API key is needed.

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
- The proxy allows 60 requests a minute per plugin. Each refresh makes two or three requests (regular season, playoffs, and next season when nothing is left this season).
- Logos load straight from ESPN's image servers in the display's browser.
- Soccer support is MLS only.

## License

MIT
