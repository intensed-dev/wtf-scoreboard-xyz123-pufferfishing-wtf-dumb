const START_ELO = 0;
const DATA_URL = "./data/events.json";
const RANKS = ["LT5", "HT5", "LT4", "HT4", "LT3", "HT3", "LT2", "HT2", "LT1", "HT1"];
const RETIRE_AFTER_DAYS = 30;
const headUrl = (player, size = 96) => `https://render.crafty.gg/2d/head/${encodeURIComponent(player)}?size=${size}`;

function calculateLeaderboard(events) {
  const players = new Map();
  for (const event of events) {
    if (!event.person || !Number.isFinite(Number(event.amount))) continue;
    const name = String(event.person).trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (!players.has(key)) players.set(key, {
      name, elo: START_ELO, losses: 0, gains: 0, totalLost: 0, totalGained: 0, lastGain: null
    });
    const player = players.get(key);
    const amount = Math.abs(Number(event.amount));
    const type = event.type === "gain" ? "gain" : "loss";
    if (type === "gain") {
      player.elo += amount;
      player.gains += 1;
      player.totalGained += amount;
      const gainDate = new Date(event.date);
      if (!Number.isNaN(gainDate.getTime()) && (!player.lastGain || gainDate > player.lastGain)) {
        player.lastGain = gainDate;
      }
    } else {
      player.elo -= amount;
      player.losses += 1;
      player.totalLost += amount;
    }
  }

  return [...players.values()].map(player => {
    const rawRankIndex = Math.floor(player.elo / 100) - 1;
    const hasRank = rawRankIndex >= 0;
    const rank = hasRank ? RANKS[Math.min(rawRankIndex, RANKS.length - 1)] : "Unranked";
    const retired = hasRank && player.lastGain !== null &&
      (Date.now() - player.lastGain.getTime()) > RETIRE_AFTER_DAYS * 24 * 60 * 60 * 1000;
    return { ...player, rank: retired ? `R${rank}` : rank, retired };
  }).sort((a, b) => b.elo - a.elo || a.name.localeCompare(b.name));
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "Unknown date";
  return new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function rankMarkup(rank) {
  const retired = rank.startsWith("R") && rank !== "Unranked";
  return `<span class="rank-badge${retired ? " retired" : ""}">${escapeHtml(rank)}</span>`;
}

function renderPodium(players) {
  const podium = document.querySelector("#podium");
  if (!players.length) {
    podium.innerHTML = '<div class="empty-state">No Elo events have been recorded yet.<br><span>The calm before the rage.</span></div>';
    return;
  }
  const slots = [players[1], players[0], players[2]];
  const classes = ["second", "first", "third"];
  const labels = ["#2", "#1", "#3"];
  podium.innerHTML = slots.map((player, index) => {
    if (!player) return '<div class="podium-card" aria-hidden="true"></div>';
    return `<article class="podium-card ${classes[index]}">
      <span class="podium-rank">${labels[index]}</span>
      <img class="player-head" src="${headUrl(player.name, 128)}" alt="" loading="lazy">
      <span class="podium-name">${escapeHtml(player.name)}</span>
      ${rankMarkup(player.rank)}
      <strong class="podium-elo">${formatNumber(player.elo)} ELO</strong>
      <span class="podium-losses">${player.gains + player.losses} EVENTS</span>
    </article>`;
  }).join("");
}

function renderRanking(players) {
  const root = document.querySelector("#ranking-list");
  if (!players.length) {
    root.innerHTML = '<div class="list-empty">The leaderboard will appear here once players are added to events.json.</div>';
    return;
  }
  root.innerHTML = players.map((player, index) => `<div class="rank-row">
    <span class="rank-number">${String(index + 1).padStart(2, "0")}</span>
    <span class="rank-player"><img src="${headUrl(player.name, 64)}" alt="" loading="lazy"><span>${escapeHtml(player.name)}</span></span>
    <span class="rank-losses">${player.losses}× EVENTS</span>
    <span class="rank-result">${rankMarkup(player.rank)}<strong class="rank-elo">${formatNumber(player.elo)}</strong></span>
  </div>`).join("");
}

function renderHistory(events) {
  const root = document.querySelector("#history");
  const recent = [...events].sort((a, b) => new Date(b.date) - new Date(a.date));
  document.querySelector("#history-count").textContent = `${recent.length} ENTRIES`;
  if (!recent.length) {
    root.innerHTML = '<div class="list-empty">No Elo changes yet. The leaderboard is waiting.</div>';
    return;
  }
  root.innerHTML = recent.map(event => {
    const isGain = event.type === "gain";
    const amount = Math.abs(Number(event.amount) || 0);
    return `<article class="history-item">
      <div class="history-main">
        <img class="history-avatar" src="${headUrl(event.person || "", 64)}" alt="" loading="lazy">
        <div><div class="history-title">${escapeHtml(event.title || (isGain ? "Elo gained" : "Elo lost"))}</div><div class="history-person">${escapeHtml(event.person || "Unknown")}</div></div>
      </div>
      <time class="history-date" datetime="${escapeHtml(event.date || "")}">${escapeHtml(formatDate(event.date))}</time>
      <strong class="history-amount ${isGain ? "gain" : ""}">${isGain ? "+" : "−"}${formatNumber(amount)} ELO</strong>
    </article>`;
  }).join("");
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

async function init() {
  try {
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const events = Array.isArray(data) ? data : data.events || data.losses;
    if (!Array.isArray(events)) throw new Error("events.json must be an array or an object containing an events array.");
    const players = calculateLeaderboard(events);
    const gains = events.filter(event => event.type === "gain");
    document.querySelector("#player-count").textContent = formatNumber(players.length);
    document.querySelector("#elo-earned").textContent = formatNumber(gains.reduce((sum, event) => sum + Math.abs(Number(event.amount) || 0), 0));
    document.querySelector("#event-count").textContent = formatNumber(events.length);
    renderPodium(players);
    renderRanking(players);
    renderHistory(events);
  } catch (error) {
    console.error("Could not load Rageboard:", error);
    document.querySelector("#podium").innerHTML = '<div class="empty-state">Could not load the leaderboard.<br><span>Check data/events.json and serve the page over HTTP.</span></div>';
  }
}

init();