# RAGEBOARD

A static, Elo-based ragebait leaderboard. Players earn Elo by successfully ragebaiting others and lose Elo when they fall for bait. The leaderboard ranks everyone by their current Elo score.

## Elo and ranks

- Every player starts at **0 Elo**.
- A `gain` event adds Elo; a `loss` event subtracts Elo.
- The amount is always a positive number. The event type determines whether it is added or subtracted.
- Every 100 Elo unlocks the next rank:

  `Unranked → LT5 → HT5 → LT4 → HT4 → LT3 → HT3 → LT2 → HT2 → LT1 → HT1`

- Below 100 Elo, the player is Unranked. Negative Elo is allowed.
- A ranked player becomes **Retired** when their most recent Elo gain was more than 30 days ago. The rank gets an `R` prefix, e.g. `RHT2`.
- A new Elo gain resets the 30-day retirement timer.

## Add Elo events

Edit `data/events.json`. It contains example events for **Alex** and **Steve** so you can preview both gains and losses. Replace or remove these examples when adding real results.

```json
[
  {
    "person": "MinecraftName",
    "title": "Successfully baited another player",
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

Entries without a `type` are treated as losses for backwards compatibility. The website calculates each player's current Elo, rank, and retirement status from the event history. A player appears after their first event.

Minecraft heads are loaded from Crafty's skin render service: `https://render.crafty.gg/2d/head/USERNAME?size=128`.

## Hosting

Works as a static website, for example with GitHub Pages. The page must be served over HTTP(S); opening the HTML file directly may block JSON fetching in some browsers.
