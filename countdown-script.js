let cumulativeScores = {};
let currentRound = 1;
const maxRounds = 5;
let roundHistory = [];
let countdownPlayerCount = 0;
const maxCountdownPlayers = 8;

// -----------------------------
// Countdown: Add / Remove Players
// -----------------------------
function addCountdownPlayer() {
  if (countdownPlayerCount >= maxCountdownPlayers) {
    alert("Max 8 players.");
    return;
  }

  countdownPlayerCount++;
  const row = document.createElement("tr");
  row.innerHTML = `
    <td><input type="text" class="cd-player" placeholder="Player ${countdownPlayerCount}" /></td>
    <td><input type="number" class="cd-hand" /></td>
    <td><input type="checkbox" class="cd-countdown" /></td>
    <td><input type="checkbox" class="cd-blastoff" /></td>
  `;
  document.getElementById("countdown-players").appendChild(row);
}

function removeCountdownPlayer() {
  const table = document.getElementById("countdown-players");
  if (table.children.length > 0) {
    table.removeChild(table.lastElementChild);
    countdownPlayerCount--;
  }
}

// -----------------------------
// Countdown: Game Logic
// -----------------------------
function calculateCountdownScores() {
  const players = Array.from(document.querySelectorAll(".cd-player")).map(input => input.value.trim() || "Player");
  const hands = Array.from(document.querySelectorAll(".cd-hand")).map(input => parseInt(input.value) || 0);
  const countdowns = Array.from(document.querySelectorAll(".cd-countdown")).map(input => input.checked);
  const blastoffs = Array.from(document.querySelectorAll(".cd-blastoff")).map(input => input.checked);

  let entries = players.map((name, i) => ({
    name,
    hand: hands[i],
    countdown: countdowns[i],
    blastoff: blastoffs[i],
    points: 0
  }));

  const resultList = document.getElementById("countdown-results");
  resultList.innerHTML = "";

  const blastoffPlayer = entries.find(p => p.blastoff);

  if (blastoffPlayer) {
    blastoffPlayer.points = 3;
    const ranked = entries.filter(p => p.name !== blastoffPlayer.name).sort((a, b) => a.hand - b.hand);
    if (ranked[0]) ranked[0].points = 2;
    if (ranked[1]) ranked[1].points = 1;
  } else {
    const ranked = entries.map(p => ({ ...p })).sort((a, b) => a.hand - b.hand);
    const scoreMap = new Map();
    let rank = 0, last = null, rankCount = 0;

    for (let i = 0; i < ranked.length; i++) {
      const val = ranked[i].hand;
      if (val !== last) {
        rankCount++;
        rank = rankCount;
        last = val;
      }
      if (rank === 1) scoreMap.set(val, 3);
      else if (rank === 2) scoreMap.set(val, 2);
      else if (rank === 3) scoreMap.set(val, 1);
      else scoreMap.set(val, 0);
    }

    entries.forEach(p => p.points = scoreMap.get(p.hand));

    const countdownPlayer = entries.find(p => p.countdown);
    if (countdownPlayer) {
      const min = Math.min(...entries.map(p => p.hand));
      if (countdownPlayer.hand > min) countdownPlayer.points = 0;
      else if (countdownPlayer.hand === min) countdownPlayer.points += 1;
    }
  }

  entries.forEach(player => {
    if (!cumulativeScores[player.name]) cumulativeScores[player.name] = 0;
    cumulativeScores[player.name] += player.points;
  });

  const sortedTotals = Object.entries(cumulativeScores).sort((a, b) => b[1] - a[1]);
  const totalList = document.getElementById("total-scores");
  totalList.innerHTML = "";
  sortedTotals.forEach(([name, score]) => {
    const li = document.createElement("li");
    li.textContent = `${name}: ${score} point${score !== 1 ? "s" : ""}`;
    totalList.appendChild(li);
  });

  roundHistory[currentRound - 1] = entries;
}

function loadRound(roundNumber) {
  const roundData = roundHistory[roundNumber - 1];
  if (!roundData) return;

  const nameInputs = document.querySelectorAll(".cd-player");
  const handInputs = document.querySelectorAll(".cd-hand");
  const countdownChecks = document.querySelectorAll(".cd-countdown");
  const blastoffChecks = document.querySelectorAll(".cd-blastoff");

  roundData.forEach((p, i) => {
    if (nameInputs[i]) nameInputs[i].value = p.name;
    if (handInputs[i]) handInputs[i].value = p.hand;
    if (countdownChecks[i]) countdownChecks[i].checked = p.countdown;
    if (blastoffChecks[i]) blastoffChecks[i].checked = p.blastoff;
  });

  const resultList = document.getElementById("countdown-results");
  resultList.innerHTML = "";
  roundData.forEach(p => {
    const li = document.createElement("li");
    li.textContent = `${p.name}: ${p.points} point${p.points !== 1 ? "s" : ""}`;
    resultList.appendChild(li);
  });

  document.getElementById("current-round").textContent = roundNumber;
}

function nextRound() {
  if (currentRound >= maxRounds) {
    alert("Game over! You've completed all 5 rounds.");
    return;
  }
  currentRound++;
  document.getElementById("current-round").textContent = currentRound;
  if (roundHistory[currentRound - 1]) loadRound(currentRound);
  else {
    document.querySelectorAll(".cd-hand").forEach(i => i.value = "");
    document.querySelectorAll(".cd-countdown").forEach(b => b.checked = false);
    document.querySelectorAll(".cd-blastoff").forEach(b => b.checked = false);
    document.getElementById("countdown-results").innerHTML = "";
  }
}

function previousRound() {
  if (currentRound <= 1) {
    alert("Already at the first round.");
    return;
  }
  currentRound--;
  loadRound(currentRound);
}

function resetGame() {
  cumulativeScores = {};
  currentRound = 1;
  roundHistory = [];
  document.getElementById("current-round").textContent = currentRound;
  document.getElementById("total-scores").innerHTML = "";
  document.getElementById("countdown-results").innerHTML = "";
  document.querySelectorAll(".cd-hand").forEach(input => input.value = "");
  document.querySelectorAll(".cd-countdown").forEach(box => box.checked = false);
  document.querySelectorAll(".cd-blastoff").forEach(box => box.checked = false);
}

// -----------------------------
// Sidebar & Navigation
// -----------------------------
function toggleSidebar() {
    document.body.classList.toggle("sidebar-open");
  }
  
  function showTab(tabName) {
    document.getElementById("wingspan-section").style.display = tabName === "wingspan" ? "block" : "none";
    document.getElementById("countdown-section").style.display = tabName === "countdown" ? "block" : "none";
    updateHamburgerColor(); // ← add this line
  }
  
  
  function selectGame(tabName) {
    showTab(tabName);
    toggleSidebar();
  }
  
  function toggleWingspanMenu() {
    const menu = document.getElementById("wingspan-submenu");
    menu.style.display = menu.style.display === "none" ? "block" : "none";
  }
  
  function updateHamburgerColor() {
    const activeTitle = document.querySelector('.countdown-title') || document.querySelector('.countdown-title');
    if (activeTitle) {
      const color = window.getComputedStyle(activeTitle).color;
      document.querySelector('.hamburger').style.color = color;
    }
  }
  
  function clearPlayerNames() {
    const nameInputs = document.querySelectorAll(".cd-player");
    nameInputs.forEach((input, i) => {
      input.value = "";
      input.placeholder = `Player ${i + 1}`;
    });
  }
  
  
  