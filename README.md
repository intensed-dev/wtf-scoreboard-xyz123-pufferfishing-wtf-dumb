# RAGEBOARD

Eine statische Ragebait-Leaderboard-Website. Jeder Spieler startet automatisch mit **100 Elo**. Jeder Eintrag in `data/losses.json` zieht dem angegebenen Spieler den Betrag ab.

## Daten eintragen

Bearbeite ausschließlich `data/losses.json`. Jeder Eintrag hat diese Felder:

```json
[
  {
    "person": "MinecraftName",
    "title": "Hat sich baiten lassen",
    "amount": 12,
    "date": "2026-11-10"
  }
]
```

- `person`: Minecraft-Spielername
- `title`: Grund für den Abzug
- `amount`: abzuziehende Elo-Punkte
- `date`: Datum im Format `YYYY-MM-DD`

Die Website berechnet das Ranking automatisch aus allen Einträgen. Es werden keine separaten Spielerstände gespeichert. Spieler erscheinen, sobald sie mindestens einen Eintrag haben. Der aktuelle Stand ist immer **100 minus alle Abzüge**.

Minecraft-Köpfe werden über den Crafty Skin Render Service geladen: `https://render.crafty.gg/2d/head/USERNAME?size=128`.

## Hosting

Funktioniert als statische Website, z. B. mit GitHub Pages. Die Seite muss über HTTP(S) geladen werden; direktes Öffnen der HTML-Datei blockiert den JSON-Fetch in vielen Browsern.
