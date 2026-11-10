# RAGEBOARD

A static ragebait leaderboard. Every player starts at **0 Elo**. Player scores are calculated from the event history in `data/losses.json`; no separate player balances are stored.

## Elo and ranks

- Every player starts at 0 Elo.
- A loss subtracts Elo; a gain adds Elo.
- Every 100 Elo unlocks the next rank:

  `Unranked → LT5 → HT5 → LT4 → HT4 → LT3 → HT3 → LT2 → HT2 → LT1 → HT1`

- Below 100 Elo, the player is Unranked. Negative Elo is allowed.
- A ranked player becomes **Retired** when their most recent Elo gain was more than 30 days ago. The rank gets an `R` prefix, e.g. `RHT2`.
- A new Elo gain resets the 30-day retirement timer.

## Add events

Edit only `data/losses.json`. Each event has a player, title, amount, date, and event type.

```json
[
  {
    "person": "MinecraftName",
    "title": "Got baited",
    "amount": 120,
    "date": "2026-11-10",
    "type": "gain"
  },
  {
    "person": "MinecraftName",
    "title": "Fell for the bait",
    "amount": 25,
    "date": "2026-11-10",
    "type": "loss"
  }
]
```

- `person`: Minecraft username
- `title`: reason for the Elo change
- `amount`: positive number of Elo points
- `date`: date in `YYYY-MM-DD` format
- `type`: `gain` or `loss`

For backwards compatibility, entries without `type` are treated as losses. The website calculates each player's Elo, rank, and retirement status from the event history. A player appears after their first event.

Minecraft heads are loaded from Crafty's skin render service: `https://render.crafty.gg/2d/head/USERNAME?size=128`.

## Hosting

Works as a static website, for example with GitHub Pages. The page must be served over HTTP(S); opening the HTML file directly may block JSON fetching in some browsers.
