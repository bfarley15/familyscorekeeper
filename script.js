
// -----------------------------
// Global State
// -----------------------------
let cumulativeScores = {};
let currentRound = 1;
const maxRounds = 5;
let roundHistory = [];
let countdownPlayerCount = 0;
const maxCountdownPlayers = 8;
let wingspanPlayerCount = 2;

// -----------------------------
// DOM Ready Logic
// -----------------------------
window.addEventListener("load", () => {
  showTab("wingspan");
  updateRunningScoreboard();
  const headerCells = document.querySelectorAll(".editable-header");
  if (headerCells[0]) headerCells[0].focus();
});

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
  const activeHeader = document.querySelector('#wingspan-section').style.display !== "none"
    ? document.querySelector('#wingspan-section .screen-title')
    : document.querySelector('#countdown-section .screen-title');

  const color = window.getComputedStyle(activeHeader).color;
  document.querySelector(".hamburger").style.color = color;
}


// -----------------------------
// Editable Headers
// -----------------------------
document.querySelectorAll(".editable-header").forEach(cell => {
  const defaultText = cell.dataset.default;

  cell.addEventListener("focus", () => {
    if (cell.textContent.trim() === defaultText) {
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

  // Use input event instead of keydown for better typing feedback
  cell.addEventListener("input", () => {
    if (cell.textContent.trim() !== "" && cell.textContent !== defaultText) {
      cell.classList.add("filled");
    }
  });
});


// -----------------------------
// Wingspan Player Controls
// -----------------------------
function addWingspanPlayer() {
  if (wingspanPlayerCount < 5) {
    wingspanPlayerCount++;
    updateWingspanPlayerColumns();
  }
}

function removeWingspanPlayer() {
  if (wingspanPlayerCount > 2) {
    hideWingspanColumn(wingspanPlayerCount);
    wingspanPlayerCount--;
  }
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


function showWingspanColumn(i) {
  // Adjust because i = 3 is actually the 4th column in the DOM (nth-child is 1-based)
  const th = document.querySelector(`thead tr th:nth-child(${i + 1})`);
  if (th) th.style.display = "";

  document.querySelectorAll("tbody tr").forEach(row => {
    const cell = row.children[i];
    if (cell) cell.style.display = "";
  });
}

function hideWingspanColumn(i) {
  const th = document.querySelector(`thead tr th:nth-child(${i + 1})`);
  if (th) {
    th.style.display = "none";
    th.textContent = th.dataset.default;
  }

  document.querySelectorAll("tbody tr").forEach(row => {
    const cell = row.children[i];
    if (cell) {
      cell.style.display = "none";
      if (cell.querySelector("input")) cell.querySelector("input").value = "";
    }
  });
}


function showWingspanTab(tab) {
  document.getElementById("wingspan-scorecard-tab").style.display = tab === "scorecard" ? "block" : "none";
  document.getElementById("wingspan-running-tab").style.display = tab === "running" ? "block" : "none";

  // Optional: visual indicator for selected tab
  document.getElementById("scorecard-tab-btn").classList.toggle("active", tab === "scorecard");
  document.getElementById("running-tab-btn").classList.toggle("active", tab === "running");

  if (tab === "running") {
    drawWinHistoryChart();
  }
}

function selectWingspanSubTab(tabName) {
  document.getElementById("wingspan-scorecard-tab").style.display = tabName === "scorecard" ? "block" : "none";
  document.getElementById("wingspan-running-tab").style.display = tabName === "running" ? "block" : "none";
}



// -----------------------------
// Wingspan Auto-Scoring
// -----------------------------
document.addEventListener("input", () => {
  const table = document.getElementById("score-table");
  const rows = table.querySelectorAll("tbody tr");
  const numPlayers = 5;

  for (let col = 1; col <= numPlayers; col++) {
    let sum = 0;

    // Loop through first 6 rows (each scoring category)
    for (let row = 0; row < 6; row++) {
      const input = rows[row].children[col]?.querySelector("input");
      const value = parseInt(input?.value) || 0;
      sum += value;
    }

    // Update the total in row 7 (index 6)
    const totalCell = rows[6].children[col];
    if (totalCell) {
      totalCell.textContent = sum;
    }
  }
});







function selectWingspanTab(tabName) {
  showTab("wingspan");
  document.getElementById("wingspan-scorecard-tab").style.display = tabName === "scorecard" ? "block" : "none";
  document.getElementById("wingspan-running-tab").style.display = tabName === "running" ? "block" : "none";

  // Highlight the active tab
  document.getElementById("tab-scorecard").classList.toggle("active", tabName === "scorecard");
  document.getElementById("tab-running").classList.toggle("active", tabName === "running");

  // Only draw chart if switching to running tab
  if (tabName === "running") {
    drawWinHistoryChart();
  }
}


function updateRunningScoreboard() {
  document.getElementById("brandon-wins").textContent = localStorage.getItem("brandonWins") || "0";
  document.getElementById("meridian-wins").textContent = localStorage.getItem("meridianWins") || "0";
}


// Create chart after DOM is loaded
function drawWinHistoryChart() {
  const data = getCurrentMonthWinHistory();
  const labels = data.map(entry => entry.date.slice(0, 10));
  const brandon = data.map(e => e.winner === "Brandon" ? 1 : 0);
  const meridian = data.map(e => e.winner === "Meridian" ? 1 : 0);

  const canvas = document.getElementById("winHistoryChart");
  if (!canvas) return; // safeguard
  const ctx = canvas.getContext("2d");

  if (window.winChart) window.winChart.destroy(); // Clear previous chart

  window.winChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: "Brandon", data: brandon, borderColor: "blue", fill: false, tension: 0.1 },
        { label: "Meridian", data: meridian, borderColor: "green", fill: false, tension: 0.1 }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top" }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 }
        }
      }
    }
  });
}





function updateBrandonMeridianScoreboard() {
  const headers = document.querySelectorAll(".editable-header");
  const totals = document.querySelectorAll(".total");

  const players = Array.from(headers).map((cell, i) => ({
    name: cell.textContent.trim().toLowerCase(),
    index: i,
    visible: cell.offsetParent !== null
  })).filter(p => p.visible && p.name);

  if (players.length !== 2) {
    alert("Please enter exactly two players.");
    return;
  }

  const names = players.map(p => p.name);
  if (!names.includes("brandon") || !names.includes("meridian")) {
    alert("Only Brandon and Meridian can be logged.");
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
    logWinToHistory("Brandon");
  } else if (meridianScore > brandonScore) {
    meridianWins++;
    alert("Meridian wins this game!");
    logWinToHistory("Meridian");
  }
  

  localStorage.setItem("brandonWins", brandonWins);
  localStorage.setItem("meridianWins", meridianWins);
  updateRunningScoreboard();

    // Save scores to an array in localStorage
    const brandonHistory = JSON.parse(localStorage.getItem("brandonScores") || "[]");
    const meridianHistory = JSON.parse(localStorage.getItem("meridianScores") || "[]");
  
    brandonHistory.push(brandonScore);
    meridianHistory.push(meridianScore);
  
    localStorage.setItem("brandonScores", JSON.stringify(brandonHistory));
    localStorage.setItem("meridianScores", JSON.stringify(meridianHistory));
  
    // Calculate and display averages
    const brandonAvg = Math.round(brandonHistory.reduce((a, b) => a + b, 0) / brandonHistory.length);
    const meridianAvg = Math.round(meridianHistory.reduce((a, b) => a + b, 0) / meridianHistory.length);
  
    document.getElementById("brandon-avg").textContent = brandonAvg || 0;
    document.getElementById("meridian-avg").textContent = meridianAvg || 0;
  
}

function logWinToHistory(winner) {
  const history = JSON.parse(localStorage.getItem("winHistory") || "[]");
  history.push({ winner, date: new Date().toISOString() });
  localStorage.setItem("winHistory", JSON.stringify(history));
}

function getCurrentMonthWinHistory() {
  const history = JSON.parse(localStorage.getItem("winHistory") || "[]");
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  return history.filter(entry => {
    const date = new Date(entry.date);
    return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
  });
}

function drawWinHistoryChart() {
  const data = getCurrentMonthWinHistory();
  const labels = data.map(entry => entry.date.slice(0, 10));
  const brandon = data.map(e => e.winner === "Brandon" ? 1 : 0);
  const meridian = data.map(e => e.winner === "Meridian" ? 1 : 0);

  const ctx = document.getElementById("winHistoryChart").getContext("2d");
  if (window.winChart) window.winChart.destroy(); // Clear previous chart

  window.winChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: "Brandon", data: brandon, borderColor: "green", fill: false, tension: 0.1 },
        { label: "Meridian", data: meridian, borderColor: "blue", fill: false, tension: 0.1 }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top" }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
}

function resetBrandonMeridianScoreboard() {
  if (confirm("Are you sure you want to reset all Brandon vs. Meridian data?")) {
    localStorage.removeItem("brandonWins");
    localStorage.removeItem("meridianWins");
    localStorage.removeItem("brandonScores");
    localStorage.removeItem("meridianScores");
    localStorage.removeItem("winHistory");

    updateRunningScoreboard();
    drawWinHistoryChart();
    alert("Scoreboard reset!");
  }
}




// -----------------------------
// PWA Service Worker
// -----------------------------
// if ("serviceWorker" in navigator) {
//  navigator.serviceWorker.register("sw.js").then(() => {
//    console.log("✅ Service Worker Registered");
//  });
// }

