// -----------------------------
// State
// -----------------------------
let currentPlayer = 0;
let players = new Array(5).fill(null).map((_, i) => ({
  html: '',
  name: `Player ${i + 1}`
}));

// -----------------------------
// On Page Load
// -----------------------------
document.addEventListener('DOMContentLoaded', function () {
  switchPlayer(0); // show first player's board
  updatePlayerTabs();
  setupTabListeners();
  updateHamburgerColor();

  document.addEventListener("click", (event) => {
    const sidebar = document.getElementById("sidebar");
    const hamburger = document.querySelector(".hamburger");
  
    const clickedInsideSidebar = sidebar.contains(event.target);
    const clickedHamburger = hamburger.contains(event.target);
  
    if (document.body.classList.contains("sidebar-open") &&
        !clickedInsideSidebar && !clickedHamburger) {
      document.body.classList.remove("sidebar-open");
    }
  });
  
});

// -----------------------------
// Player Tabs
// -----------------------------
function updatePlayerTabs() {
    const tabs = document.querySelectorAll('.player-tab');
    tabs.forEach((tab, i) => {
      // Only overwrite if not actively editing
      if (document.activeElement !== tab) {
        tab.textContent = players[i].name || `Player ${i + 1}`;
      }
      tab.classList.toggle('active', i === currentPlayer);
    });
  }
  

function setupTabListeners() {
    const tabs = document.querySelectorAll('.player-tab');
  
    tabs.forEach((tab, i) => {
      // Handle switching scorecards
      tab.addEventListener('click', (e) => {
        if (!tab.isContentEditable || document.activeElement !== tab) {
          switchPlayer(i);
        }
      });
  
      // Clear placeholder on focus
      tab.addEventListener('focus', () => {
        const defaultName = `Player ${i + 1}`;
        if (tab.textContent.trim() === defaultName) {
          tab.textContent = '';
        }
      });
  
      // Save name on blur
      tab.addEventListener('blur', () => {
        const newName = tab.textContent.trim();
        players[i].name = newName || `Player ${i + 1}`;
        updatePlayerTabs();
      });
  
      // Pressing Enter should blur instead of inserting line breaks
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
// Generate Scorecard HTML
// -----------------------------
function generateScorecardHTML() {
  return `
    <div class="scorecard">
      <div class="row red">
        <div class="arrow">▶️</div>
        <div class="boxes">${[2,3,4,5,6,7,8,9,10,11,12].map(n => `<div class="box">${n}</div>`).join('')}
          <div class="lock">🔒</div>
        </div>
      </div>
      <div class="row yellow">
        <div class="arrow">▶️</div>
        <div class="boxes">${[2,3,4,5,6,7,8,9,10,11,12].map(n => `<div class="box">${n}</div>`).join('')}
          <div class="lock">🔒</div>
        </div>
      </div>
      <div class="row green">
        <div class="arrow">▶️</div>
        <div class="boxes">${[12,11,10,9,8,7,6,5,4,3,2].map(n => `<div class="box">${n}</div>`).join('')}
          <div class="lock">🔒</div>
        </div>
      </div>
      <div class="row blue">
        <div class="arrow">▶️</div>
        <div class="boxes">${[12,11,10,9,8,7,6,5,4,3,2].map(n => `<div class="box">${n}</div>`).join('')}
          <div class="lock">🔒</div>
        </div>
      </div>
    </div>
  `;
}

// -----------------------------
// Scorecard Interactions
// -----------------------------
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

        checkLockUnlock(row);
      });
    });

    if (lock) {
      lock.addEventListener('click', () => {
        if (lock.classList.contains('unlocked')) {
          lock.classList.add('marked');
          lock.style.backgroundColor = 'black';
          lock.style.color = 'white';
          lock.style.cursor = 'not-allowed';

          boxes.forEach(box => {
            if (!box.classList.contains('marked')) {
              box.classList.add('disabled');
              box.style.backgroundColor = '#888';
              box.style.color = 'white';
              box.style.cursor = 'not-allowed';
            }
          });

          updateScore();
        }
      });
    }
  });

  document.querySelectorAll('.penalty-box').forEach(box => {
    box.addEventListener('click', () => {
      box.classList.toggle('marked');
      box.style.backgroundColor = box.classList.contains('marked') ? 'black' : 'white';
      updateScore();
    });
  });
}

// -----------------------------
// Lock Logic
// -----------------------------
function checkLockUnlock(row) {
  const boxes = row.querySelectorAll('.box');
  const lock = row.querySelector('.lock');
  const markedCount = Array.from(boxes).filter(box => box.classList.contains('marked')).length;

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

// -----------------------------
// Scoring Logic
// -----------------------------
function updateScore() {
  const colors = ['red', 'yellow', 'green', 'blue'];
  const totals = { red: 0, yellow: 0, green: 0, blue: 0 };

  colors.forEach(color => {
    const row = document.querySelector(`.${color}`);
    const markedCount = row.querySelectorAll('.marked').length;
    totals[color] = calculateQwixxScore(markedCount);

    const box = document.querySelector(`.${color}-total`);
    if (box) box.textContent = totals[color];
  });

  const penalties = document.querySelectorAll('.penalty-box.marked').length;
  const penaltyScore = penalties * 5;
  document.querySelectorAll('.penalty-total').forEach(e => e.textContent = `-${penaltyScore}`);

  const total = Object.values(totals).reduce((a, b) => a + b, 0) - penaltyScore;
  const totalBox = document.querySelector('.grand-total');
  if (totalBox) totalBox.textContent = total;
}

function calculateQwixxScore(count) {
  return count <= 1 ? count : (count * (count + 1)) / 2;
}

// -----------------------------
// Reset
// -----------------------------
function resetQwixxGame() {
    // Keep current player names, reset their scorecard HTML
    players.forEach((p, i) => {
      p.html = ''; // clear scorecard content
    });
    currentPlayer = 0;
  
    // Regenerate the first player's scorecard
    document.getElementById("scorecard-container").innerHTML = generateScorecardHTML();
    setupScorecardInteractions();
    updatePlayerTabs();
    updateScore();
  
    // Reset totals
    document.querySelectorAll('.color-total').forEach(cell => cell.textContent = '');
    document.querySelectorAll('.penalty-total').forEach(cell => cell.textContent = '');
    const grand = document.querySelector('.grand-total');
    if (grand) grand.textContent = '';
  
    // Reset penalty boxes
    document.querySelectorAll('.penalty-box').forEach(box => {
      box.classList.remove('marked');
      box.style.backgroundColor = 'white';
    });
  
    alert("Qwixx game reset.");
  }
  
  

// -----------------------------
// Utility
// -----------------------------
function toggleSidebar() {
  document.body.classList.toggle('sidebar-open');
}

function updateHamburgerColor() {
  const header = document.querySelector('.screen-title');
  if (header) {
    const color = getComputedStyle(header).color;
    document.querySelector('.hamburger').style.color = color;
  }
}





// Add modal HTML to page ---- keep at the bottom of q-script.js
document.body.insertAdjacentHTML('beforeend', `<!-- New Game Modal (Initially Hidden) -->
<div id="newGameModal" class="modal">
  <div class="modal-content">
    <h2>Start New Game</h2>
    <form id="playerNameForm">
      <label>Player 1: <input type="text" name="player1" required /></label><br>
      <label>Player 2: <input type="text" name="player2" /></label><br>
      <label>Player 3: <input type="text" name="player3" /></label><br>
      <label>Player 4: <input type="text" name="player4" /></label><br>
      <label>Player 5: <input type="text" name="player5" /></label><br>
      <button type="submit" class="modal-confirm">Start Game</button>
    </form>
    <button class="modal-close">Cancel</button>
  </div>
</div>`);

// Show modal when New Game button is clicked
document.querySelector('.new-game').addEventListener('click', () => {
  document.getElementById('newGameModal').style.display = 'block';
});

// Handle cancel button
document.querySelector('.modal-close').addEventListener('click', () => {
  document.getElementById('newGameModal').style.display = 'none';
});

// Handle form submission
document.getElementById('playerNameForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const form = e.target;
  const names = Array.from(form.elements).slice(0, 5).map(el => el.value.trim()).filter(Boolean);

  if (names.length === 0) {
    alert('Please enter at least one player name.');
    return;
  }

  // Update global state
  players = names.map((name, i) => ({ name, html: '' }));
  while (players.length < 5) {
    players.push({ name: `Player ${players.length + 1}`, html: '' });
  }
  currentPlayer = 0;
  switchPlayer(0);

  // Update player tabs as buttons (not editable)
  const tabContainer = document.querySelector('.player-tabs');
  tabContainer.innerHTML = '';
  players.forEach((player, i) => {
    const tab = document.createElement('div');
    tab.className = 'player-tab';
    tab.textContent = player.name;
    tab.addEventListener('click', () => switchPlayer(i));
    tabContainer.appendChild(tab);
  });

  updatePlayerTabs();
  updateScore();
  document.getElementById('newGameModal').style.display = 'none';
});