// -----------------------------
// State
// -----------------------------
let currentPlayer = 0;
let players = new Array(5).fill(null).map((_, i) => ({
  html: '',
  name: `Player ${i + 1}`
}));

const moveHistory = {
  player0: [],
  player1: [],
  player2: [],
  player3: [],
  player4: []
};

// -----------------------------
// On Page Load
// -----------------------------
document.addEventListener('DOMContentLoaded', function () {
  switchPlayer(0);
  updatePlayerTabs();
  setupTabListeners();
  updateHamburgerColor();

  // Open modal when "New Game" is clicked
  document.querySelector('.new-game').addEventListener('click', newQwixxGame);

  // Close modal when "Cancel" button is clicked
  document.querySelector('.modal-close').addEventListener('click', () => {
    document.getElementById('newGameModal').classList.remove('open');
  });

  // Handle form submission
  document.getElementById('playerNameForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    for (let i = 0; i < 5; i++) {
      const name = formData.get(`player${i + 1}`)?.trim();
      players[i].name = name || `Player ${i + 1}`;
      players[i].html = '';
      moveHistory[`player${i}`] = [];
    }

    document.getElementById('newGameModal').classList.remove('open');
    resetQwixxGame();
    updatePlayerTabs();
  });

  // Sidebar close on click outside
  document.addEventListener("click", (event) => {
    const sidebar = document.getElementById("sidebar");
    const hamburger = document.querySelector(".hamburger");
    if (!sidebar.contains(event.target) && !hamburger.contains(event.target)) {
      document.body.classList.remove("sidebar-open");
    }
  });
});

// -----------------------------
// New Game Modal Trigger
// -----------------------------
function newQwixxGame() {
  document.getElementById('newGameModal').classList.add('open');
}

// -----------------------------
// Player Tabs
// -----------------------------
function updatePlayerTabs() {
  const tabs = document.querySelectorAll('.player-tab');
  tabs.forEach((tab, i) => {
    if (document.activeElement !== tab) {
      tab.textContent = players[i].name || `Player ${i + 1}`;
    }
    tab.classList.toggle('active', i === currentPlayer);
  });
}

function setupTabListeners() {
  const tabs = document.querySelectorAll('.player-tab');
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => switchPlayer(i));
    tab.addEventListener('focus', () => {
      if (tab.textContent.trim() === `Player ${i + 1}`) tab.textContent = '';
    });
    tab.addEventListener('blur', () => {
      players[i].name = tab.textContent.trim() || `Player ${i + 1}`;
      updatePlayerTabs();
    });
    tab.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        tab.blur();
      }
    });
  });
}

// -----------------------------
// Switch Player
// -----------------------------
function switchPlayer(index) {
  players[currentPlayer].html = document.getElementById("scorecard-container").innerHTML;
  currentPlayer = index;
  document.getElementById("scorecard-container").innerHTML =
    players[currentPlayer].html || generateScorecardHTML();

  setupScorecardInteractions();
  updateScore();
  updatePlayerTabs();
}

// -----------------------------
// Scorecard & Interactions
// -----------------------------
function generateScorecardHTML() {
  return `
    <div class="scorecard">
      ${['red', 'yellow', 'green', 'blue'].map(color => {
        const numbers = (color === 'red' || color === 'yellow')
          ? [2,3,4,5,6,7,8,9,10,11,12]
          : [12,11,10,9,8,7,6,5,4,3,2];
        return `
          <div class="row ${color}">
            <div class="arrow">▶️</div>
            <div class="boxes">
              ${numbers.map(n => `<div class="box">${n}</div>`).join('')}
              <div class="lock">🔒</div>
            </div>
          </div>
        `;
      }).join('')}

      <!-- Move penalty section inside scorecard -->
      <div class="penalty-section-inline">
        <div class="penalty-header-inline">
          <span class="penalty-icon">❌🎲</span>
          <span class="penalty-text">= -5</span>
        </div>
        <div class="penalty-boxes">
          <div class="penalty-box"></div>
          <div class="penalty-box"></div>
          <div class="penalty-box"></div>
          <div class="penalty-box"></div>
        </div>
      </div>
    </div>
  `;
}


function setupScorecardInteractions() {
  const rows = document.querySelectorAll('.row');
  rows.forEach(row => {
    const boxes = row.querySelectorAll('.box');
    const lock = row.querySelector('.lock');

    boxes.forEach((box, idx) => {
      box.addEventListener('click', () => {
        if (box.classList.contains('marked')) return;

        box.classList.add('marked');
        box.style.backgroundColor = 'black';
        box.style.color = 'white';

        for (let i = 0; i < idx; i++) {
          if (!boxes[i].classList.contains('marked')) {
            boxes[i].classList.add('disabled');
            boxes[i].style.backgroundColor = '#888';
            boxes[i].style.color = 'white';
            boxes[i].style.cursor = 'not-allowed';
          }
        }

        moveHistory[`player${currentPlayer}`].push({
          row: row.classList[1],
          index: idx,
          type: 'mark'
        });

        checkLockUnlock(row);
      });
    });

    if (lock) {
      lock.addEventListener('click', () => {
        if (lock.classList.contains('unlocked')) {
          lock.classList.add('marked');
          lock.style.backgroundColor = 'black';
          lock.style.color = 'white';

          boxes.forEach(box => {
            if (!box.classList.contains('marked')) {
              box.classList.add('disabled');
              box.style.backgroundColor = '#888';
              box.style.color = 'white';
              box.style.cursor = 'not-allowed';
            }
          });

          moveHistory[`player${currentPlayer}`].push({
            row: row.classList[1],
            type: 'lock'
          });

          updateScore();
        }
      });
    }
  });

  document.querySelectorAll('.penalty-box').forEach((box, index) => {
    box.addEventListener('click', () => {
      const isNowMarked = !box.classList.contains('marked');
      box.classList.toggle('marked', isNowMarked);
      box.style.backgroundColor = isNowMarked ? 'black' : 'white';

      moveHistory[`player${currentPlayer}`].push({
        type: 'penalty',
        index
      });

      updateScore();
    });
  });
}

function undoMove() {
  const history = moveHistory[`player${currentPlayer}`];
  if (!history.length) return;

  const lastMove = history.pop();
  const scorecard = document.getElementById("scorecard-container");

  if (lastMove.type === 'mark') {
    const row = scorecard.querySelector(`.${lastMove.row}`);
    const boxes = row.querySelectorAll('.box');

    boxes[lastMove.index].classList.remove('marked');
    boxes[lastMove.index].removeAttribute('style');

    for (let i = 0; i < boxes.length; i++) {
      if (i < lastMove.index && !boxes[i].classList.contains('marked')) {
        boxes[i].classList.remove('disabled');
        boxes[i].removeAttribute('style');
      }
    }

    checkLockUnlock(row);
  } else if (lastMove.type === 'lock') {
    const row = scorecard.querySelector(`.${lastMove.row}`);
    const lock = row.querySelector('.lock');
    lock.classList.remove('marked');
    lock.removeAttribute('style');
    row.querySelectorAll('.box').forEach(box => {
      if (!box.classList.contains('marked')) {
        box.classList.remove('disabled');
        box.removeAttribute('style');
      }
    });

    checkLockUnlock(row);
  } else if (lastMove.type === 'penalty') {
    const box = document.querySelectorAll('.penalty-box')[lastMove.index];
    box.classList.remove('marked');
    box.style.backgroundColor = 'white';
  }

  updateScore();
}

function resetQwixxGame() {
  for (let i = 0; i < 5; i++) {
    moveHistory[`player${i}`] = [];
    players[i].html = ''; // Clear scorecard content
  }

  // Regenerate the visible scorecard for the current player
  document.getElementById("scorecard-container").innerHTML = generateScorecardHTML();
  setupScorecardInteractions();
  updateScore();
  updatePlayerTabs();
}


// -----------------------------
// Logic Helpers
// -----------------------------
function checkLockUnlock(row) {
  const boxes = row.querySelectorAll('.box');
  const lock = row.querySelector('.lock');
  const markedCount = [...boxes].filter(b => b.classList.contains('marked')).length;

  if (markedCount >= 5) {
    lock.classList.add('unlocked');
    lock.style.cursor = 'pointer';
    lock.style.opacity = '1';
  } else {
    lock.classList.remove('unlocked');
    lock.style.cursor = 'not-allowed';
    lock.style.opacity = '0.5';
  }

  updateScore();
}

function updateScore() {
  const colors = ['red', 'yellow', 'green', 'blue'];
  const totals = {};

  colors.forEach(color => {
    const row = document.querySelector(`.${color}`);
    const count = row.querySelectorAll('.marked').length;
    totals[color] = count <= 1 ? count : (count * (count + 1)) / 2;
    const box = document.querySelector(`.${color}-total`);
    if (box) box.textContent = totals[color];
  });

  const penaltyBoxes = document.querySelector('#scorecard-container .penalty-boxes');
const penaltyCount = penaltyBoxes
  ? penaltyBoxes.querySelectorAll('.penalty-box.marked').length
  : 0;

  const penaltyScore = penaltyCount * 5;
  document.querySelectorAll('.penalty-total').forEach(el => el.textContent = `-${penaltyScore}`);

  const total = Object.values(totals).reduce((a, b) => a + b, 0) - penaltyScore;
  document.querySelector('.grand-total').textContent = total;
}

// -----------------------------
// UI Utility
// -----------------------------
function toggleSidebar() {
  document.body.classList.toggle("sidebar-open");
}

function updateHamburgerColor() {
  const header = document.querySelector('.screen-title');
  if (header) {
    const color = getComputedStyle(header).color;
    document.querySelector('.hamburger').style.color = color;
  }
}
