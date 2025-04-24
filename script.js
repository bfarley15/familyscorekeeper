// -----------------------------
// Global state variables
// -----------------------------
let cumulativeScores = {};
let currentRound = 1;
const maxRounds = 5;
let roundHistory = [];
let countdownPlayerCount = 0;
const maxCountdownPlayers = 8;
let wingspanPlayerCount = 2;

// -----------------------------
// Auto-calculate Wingspan totals
// -----------------------------
document.addEventListener("input", function () {
  const table = document.getElementById("score-table");
  const rows = table.querySelectorAll("tbody tr");
  const numPlayers = 5;

  for (let col = 1; col <= numPlayers; col++) {
    let sum = 0;
    for (let row = 0; row < 6; row++) {
      const cell = rows[row].children[col];
      const value = parseInt(cell.textContent.trim()) || 0;
      sum += value;
    }
    rows[6].children[col].textContent = sum;
  }
});

// -----------------------------
// Editable player headers
// -----------------------------
const headerCells = document.querySelectorAll(".editable-header");

headerCells.forEach((cell, index) => {
  const defaultText = cell.dataset.default;

  cell.addEventListener("focus", () => {
    // If cell still has default text, select it for easy overwrite
    if (cell.textContent === defaultText) {
      cell.textContent = "";
    }
    cell.classList.remove("filled");
  });

  cell.addEventListener("blur", () => {
    if (cell.textContent.trim() === "") {
      cell.textContent = defaultText;
      cell.classList.remove("filled");
    } else {
      cell.classList.add("filled");
    }
  });

  // Optional: Remove default placeholder on first keydown
  cell.addEventListener("keydown", (e) => {
    if (cell.textContent === defaultText) {
      cell.textContent = "";
    }
  });
});


window.addEventListener("load", () => {
    headerCells[0].focus();
    showTab("wingspan");
    addCountdownPlayer();
    addCountdownPlayer();
  
    // Load running scoreboard
    document.getElementById("brandon-wins").textContent = localStorage.getItem("brandonWins") || "0";
    document.getElementById("meridian-wins").textContent = localStorage.getItem("meridianWins") || "0";
  });
  

// -----------------------------
// Tab & Sidebar navigation
// -----------------------------
function showTab(tabName) {
  const wingspan = document.getElementById("wingspan-section");
  const countdown = document.getElementById("countdown-section");
  wingspan.style.display = tabName === "wingspan" ? "block" : "none";
  countdown.style.display = tabName === "countdown" ? "block" : "none";
}

function toggleSidebar() {
  document.body.classList.toggle("sidebar-open");
}

function selectGame(tabName) {
  toggleSidebar();
  showTab(tabName);
}

function toggleWingspanMenu() {
  const menu = document.getElementById("wingspan-submenu");
  menu.style.display = menu.style.display === "none" ? "block" : "none";
}

function selectWingspanTab(tabName) {
  showTab("wingspan");
  document.getElementById("wingspan-scorecard-tab").style.display = tabName === "scorecard" ? "block" : "none";
  document.getElementById("wingspan-running-tab").style.display = tabName === "running" ? "block" : "none";
  toggleSidebar();
}

// -----------------------------
// Dynamic Wingspan Player Columns
// -----------------------------
function addWingspanPlayer() {
  if (wingspanPlayerCount >= 5) return;
  wingspanPlayerCount++;
  updateWingspanPlayerColumns();
}

function removeWingspanPlayer() {
  if (wingspanPlayerCount <= 2) return;
  hideWingspanColumn(wingspanPlayerCount);
  wingspanPlayerCount--;
}

function updateWingspanPlayerColumns() {
  for (let i = 3; i <= 5; i++) {
    if (i <= wingspanPlayerCount) {
      showWingspanColumn(i);
    } else {
      hideWingspanColumn(i);
    }
  }
}

function showWingspanColumn(colIndex) {
  const table = document.getElementById("score-table");
  const headerCell = table.querySelector(`thead tr th:nth-child(${colIndex + 1})`);
  if (headerCell) headerCell.style.display = "";

  const rows = table.querySelectorAll("tbody tr");
  rows.forEach(row => {
    const cell = row.children[colIndex];
    if (cell) cell.style.display = "";
  });
}

function hideWingspanColumn(colIndex) {
  const table = document.getElementById("score-table");
  const headerCell = table.querySelector(`thead tr th:nth-child(${colIndex + 1})`);
  if (headerCell) {
    headerCell.style.display = "none";
    headerCell.textContent = headerCell.dataset.default;
  }

  const rows = table.querySelectorAll("tbody tr");
  rows.forEach(row => {
    const cell = row.children[colIndex];
    if (cell) {
      cell.textContent = "";
      cell.style.display = "none";
    }
  });
}

// -----------------------------
// Countdown Game Logic
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
    const ranked = entries.map(p => ({ ...p })).sort((a, b) => a.hand - b.hand);
    let currentRank = 2;
    let lastScore = null;
    let rankCount = 0;

    for (let i = 0; i < ranked.length; i++) {
      const p = ranked[i];
      if (p.name === blastoffPlayer.name) continue;
      if (lastScore === null || p.hand !== lastScore) {
        rankCount++;
        lastScore = p.hand;
      }
      if (rankCount === 1) p.points = 2;
      else if (rankCount === 2) p.points = 1;
    }
  } else {
    const ranked = entries.map(p => ({ ...p })).sort((a, b) => a.hand - b.hand);
    const scoreMap = new Map();
    let rank = 0, lastValue = null, rankCount = 0;

    for (let i = 0; i < ranked.length; i++) {
      const val = ranked[i].hand;
      if (val !== lastValue) {
        rankCount++;
        rank = rankCount;
        lastValue = val;
      }
      if (rank === 1) scoreMap.set(val, 3);
      else if (rank === 2) scoreMap.set(val, 2);
      else if (rank === 3) scoreMap.set(val, 1);
      else scoreMap.set(val, 0);
    }

    entries.forEach(p => p.points = scoreMap.get(p.hand));

    const countdownPlayer = entries.find(p => p.countdown);
    if (countdownPlayer) {
      const minHand = Math.min(...entries.map(p => p.hand));
      if (countdownPlayer.hand > minHand) countdownPlayer.points = 0;
      else if (countdownPlayer.hand === minHand) countdownPlayer.points += 1;
    }
  }

  entries.forEach(player => {
    if (!cumulativeScores[player.name]) cumulativeScores[player.name] = 0;
    cumulativeScores[player.name] += player.points;
  });

  // Sorted display
  const totalList = document.getElementById("total-scores");
  totalList.innerHTML = "";
  const sortedTotals = Object.entries(cumulativeScores).sort((a, b) => b[1] - a[1]);
  sortedTotals.forEach(([name, total]) => {
    const li = document.createElement("li");
    li.textContent = `${name}: ${total} point${total !== 1 ? "s" : ""}`;
    totalList.appendChild(li);
  });

  roundHistory[currentRound - 1] = entries.map(p => ({
    name: p.name,
    hand: p.hand,
    countdown: p.countdown,
    blastoff: p.blastoff,
    points: p.points
  }));
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
// Countdown Player Add/Remove
// -----------------------------
function addCountdownPlayer() {
  if (countdownPlayerCount >= maxCountdownPlayers) {
    alert("Maximum of 8 players reached.");
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
  const tableBody = document.getElementById("countdown-players");
  if (countdownPlayerCount > 0) {
    tableBody.removeChild(tableBody.lastElementChild);
    countdownPlayerCount--;
  } else {
    alert("No players to remove!");
  }
}

function updateBrandonMeridianScoreboard() {
    const headers = document.querySelectorAll(".editable-header");
    const totals = document.querySelectorAll(".total");
  
    // Get visible, non-empty player names
    const players = Array.from(headers)
      .map((cell, index) => ({
        name: cell.textContent.trim().toLowerCase(),
        index: index,
        visible: cell.offsetParent !== null
      }))
      .filter(p => p.visible && p.name);
  
    if (players.length !== 2) {
      alert("Please enter exactly two players.");
      return;
    }
  
    const names = players.map(p => p.name);
    if (!names.includes("brandon") || !names.includes("meridian")) {
      alert("Please make sure only Brandon and Meridian are playing.");
      return;
    }
  
    const brandonIndex = players.find(p => p.name === "brandon").index;
    const meridianIndex = players.find(p => p.name === "meridian").index;
  
    const brandonScore = parseInt(totals[brandonIndex].textContent.trim()) || 0;
    const meridianScore = parseInt(totals[meridianIndex].textContent.trim()) || 0;
  
    let brandonWins = parseInt(localStorage.getItem("brandonWins")) || 0;
    let meridianWins = parseInt(localStorage.getItem("meridianWins")) || 0;
  
    if (brandonScore > meridianScore) {
      brandonWins++;
      alert("Brandon wins this game!");
    } else if (meridianScore > brandonScore) {
      meridianWins++;
      alert("Meridian wins this game!");
    } else {
      alert("It's a tie!");
    }
  
    localStorage.setItem("brandonWins", brandonWins);
    localStorage.setItem("meridianWins", meridianWins);
  
    document.getElementById("brandon-wins").textContent = brandonWins;
    document.getElementById("meridian-wins").textContent = meridianWins;
  }
  
  
  
      // Save back to localStorage
      localStorage.setItem("brandonWins", brandonWins);
      localStorage.setItem("meridianWins", meridianWins);
  
      // Update UI
      document.getElementById("brandon-wins").textContent = brandonWins;
      document.getElementById("meridian-wins").textContent = meridianWins;
    } else {
      alert("Please make sure only Brandon and Meridian are playing.");
    }
  }
  

// -----------------------------
// Register Service Worker (PWA)
// -----------------------------
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").then(() => {
    console.log("✅ Service Worker registered");
  });
}
