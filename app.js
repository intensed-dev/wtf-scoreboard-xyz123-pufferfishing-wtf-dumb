const START_ELO = 100;
const DATA_URL = "./data/losses.json";
const headUrl = (player, size = 96) => `https://render.crafty.gg/2d/head/${encodeURIComponent(player)}?size=${size}`;

function calculateLeaderboard(losses) {
  const players = new Map();
  for (const loss of losses) {
    if (!loss.person || !Number.isFinite(Number(loss.amount))) continue;
    const name = String(loss.person).trim();
    if (!name) continue;
    if (!players.has(name.toLowerCase())) players.set(name.toLowerCase(), { name, elo: START_ELO, losses: 0, totalLost: 0 });
    const player = players.get(name.toLowerCase());
    const amount = Math.max(0, Number(loss.amount));
    player.elo -= amount;
    player.totalLost += amount;
    player.losses += 1;
  }
  return [...players.values()].sort((a, b) => b.elo - a.elo || a.name.localeCompare(b.name));
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "Unbekanntes Datum";
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function renderPodium(players) {
  const podium = document.querySelector("#podium");
  if (!players.length) {
    podium.innerHTML = '<div class="empty-state">Noch keine Verluste eingetragen.<br><span>Die Ruhe vor dem Rage.</span></div>';
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
      <strong class="podium-elo">${formatNumber(player.elo)} ELO</strong>
      <span class="podium-losses">${player.losses} ABZÜGE</span>
    </article>`;
  }).join("");
}

function renderRanking(players) {
  const root = document.querySelector("#ranking-list");
  if (!players.length) {
    root.innerHTML = '<div class="list-empty">Das Ranking erscheint hier, sobald Spieler in losses.json eingetragen sind.</div>';
    return;
  }
  root.innerHTML = players.map((player, index) => `<div class="rank-row">
    <span class="rank-number">${String(index + 1).padStart(2, "0")}</span>
    <span class="rank-player"><img src="${headUrl(player.name, 64)}" alt="" loading="lazy"><span>${escapeHtml(player.name)}</span></span>
    <span class="rank-losses">${player.losses}× VERLUST</span>
    <strong class="rank-elo">${formatNumber(player.elo)}</strong>
  </div>`).join("");
}

function renderHistory(losses) {
  const root = document.querySelector("#history");
  const recent = [...losses].sort((a, b) => new Date(b.date) - new Date(a.date));
  document.querySelector("#history-count").textContent = `${recent.length} EINTRÄGE`;
  if (!recent.length) {
    root.innerHTML = '<div class="list-empty">Noch ist niemand ausgerastet. Verdächtig.</div>';
    return;
  }
  root.innerHTML = recent.map(loss => `<article class="history-item">
    <div class="history-main">
      <img class="history-avatar" src="${headUrl(loss.person, 64)}" alt="" loading="lazy">
      <div><div class="history-title">${escapeHtml(loss.title || "Elo-Abzug")}</div><div class="history-person">${escapeHtml(loss.person || "Unbekannt")}</div></div>
    </div>
    <time class="history-date" datetime="${escapeHtml(loss.date || "")}">${escapeHtml(formatDate(loss.date))}</time>
    <strong class="history-amount">−${formatNumber(Number(loss.amount) || 0)} ELO</strong>
  </article>`).join("");
}

function formatNumber(value) {
  return new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 }).format(value);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

async function init() {
  try {
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const losses = Array.isArray(data) ? data : data.losses;
    if (!Array.isArray(losses)) throw new Error("losses.json muss ein Array oder ein Objekt mit losses-Array sein.");
    const players = calculateLeaderboard(losses);
    document.querySelector("#player-count").textContent = formatNumber(players.length);
    document.querySelector("#elo-lost").textContent = formatNumber(losses.reduce((sum, loss) => sum + Math.max(0, Number(loss.amount) || 0), 0));
    document.querySelector("#loss-count").textContent = formatNumber(losses.length);
    renderPodium(players);
    renderRanking(players);
    renderHistory(losses);
  } catch (error) {
    console.error("Rageboard konnte nicht geladen werden:", error);
    document.querySelector("#podium").innerHTML = '<div class="empty-state">Leaderboard konnte nicht geladen werden.<br><span>Prüfe data/losses.json und starte die Seite über einen Webserver.</span></div>';
  }
}

init();