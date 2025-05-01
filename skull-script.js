let lootAwaitingPlayer = null;
let activeLootCard = null;
let pendingScoreEntry = null;
let haltScoring = false;

document.addEventListener("DOMContentLoaded", () => {
    const newGameBtn = document.querySelector(".nav-buttons button:first-child");
    const modal = createModal();
    document.body.appendChild(modal);
  
    // Load saved state from localStorage
    let currentRound = parseInt(localStorage.getItem("skullCurrentRound")) || 1;
    const totalRounds = 10;
    let roundData = JSON.parse(localStorage.getItem("skullRoundData") || "{}");
    let currentPlayerNames = JSON.parse(localStorage.getItem("skullPlayerNames") || "[]");
  
    // If there's saved game data, regenerate scorecards
    if (currentPlayerNames.length > 0) {
      generateScorecards();
    }
  
    newGameBtn.addEventListener("click", () => {
      // Clear stored data
      localStorage.removeItem("skullRoundData");
      localStorage.removeItem("skullPlayerNames");
      localStorage.removeItem("skullCurrentRound");
  
      // Reset in-memory state too
      roundData = {};
      currentPlayerNames = [];
      currentRound = 1;
  
      modal.style.display = "flex";
    });
  
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
      
    document.getElementById("cancelNewGame").addEventListener("click", () => {
      modal.style.display = "none";
    });
  
    document.getElementById("startGame").addEventListener("click", () => {
      const inputs = document.querySelectorAll(".player-input");
      const names = Array.from(inputs).map(input => input.value.trim()).filter(Boolean);
  
      if (names.length < 2) {
        alert("Please enter at least 2 player names.");
        return;
      }
  
      currentPlayerNames = names;
      currentRound = 1;
      modal.style.display = "none";
      generateScorecards();
    });
  
    function createModal() {
      const modal = document.createElement("div");
      modal.id = "newGameModal";
      modal.innerHTML = `
        <div class="modal-content">
          <h2>Enter Player Names</h2>
          <div id="playerInputs">
            ${[...Array(8)].map((_, i) =>
              `<input class="player-input" type="text" placeholder="Player ${i + 1}" />`).join("")}
          </div>
          <div class="modal-buttons">
            <button id="cancelNewGame">Cancel</button>
            <button id="startGame">Start Game</button>
          </div>
        </div>
      `;
      modal.style = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.5); display: none; align-items: center; justify-content: center;
        z-index: 1000;
      `;
      return modal;
    }
  
    function saveRoundData() {
      const cards = document.querySelectorAll(".player-card");
      const roundEntries = [];
  
      cards.forEach(card => {
        const inputs = card.querySelectorAll("input");
        const dotFields = card.querySelectorAll(".dot");
        roundEntries.push({
          name: card.querySelector(".player-name").textContent,
          bid: parseInt(inputs[0].value) || 0,
          won: parseInt(inputs[1].value) || 0,
          fourteens: parseInt(inputs[2].value) || 0,
          black14: dotFields[0]?.classList.contains("active") || false,
          loot: dotFields[1]?.classList.contains("active") || false,
          wager: parseInt(inputs[3].value) || 0,
          mermaids: parseInt(inputs[4].value) || 0,
          skullKing: parseInt(inputs[5].value) || 0,
          pirates: parseInt(inputs[6].value) || 0,
          roundScore: roundData[currentRound]?.find(p => p.name === card.querySelector(".player-name").textContent)?.roundScore || 0
        });
      });
  
      roundData[currentRound] = roundEntries;
    }
  
    function calculateSkullScores() {
        const cards = document.querySelectorAll(".player-card");
        const scoresThisRound = [];
      
        cards.forEach(card => {
          const inputs = card.querySelectorAll("input");
          const bid = parseInt(inputs[0].value) || 0;
          const won = parseInt(inputs[1].value) || 0;
          const fourteens = parseInt(inputs[2].value) || 0;
          const wager = parseInt(inputs[3].value) || 0;
          const mermaids = parseInt(inputs[4].value) || 0;
          const skullKing = parseInt(inputs[5].value) || 0;
          const pirates = parseInt(inputs[6].value) || 0;
      
          const black14 = card.querySelector(".dot-field:nth-child(4) .dot")?.classList.contains("active");
          const loot = card.querySelector(".dot-field:nth-child(5) .dot")?.classList.contains("active");
      
          let score = 0;
          const bidEqualsWon = bid === won;
      
          // Base scoring
          if (bid === 0 && won === 0) {
            score += 10 * currentRound;
          } else if (bid === 0 && won > 0) {
            score -= 10 * currentRound;
          } else if (bidEqualsWon) {
            score += 20 * won;
          } else {
            score -= 10 * Math.abs(bid - won);
          }
      
          // Bonuses
          if (bidEqualsWon) {
            score += 10 * fourteens;
            if (black14) score += 20;
      
            if (bidEqualsWon && loot) {
                lootAwaitingPlayer = card.querySelector(".player-name").textContent;
                activeLootCard = card;
                document.getElementById("lootInput").value = "";
                document.getElementById("lootModalTitle").textContent = `How many loot cards succeeded for ${lootAwaitingPlayer}?`;
                document.getElementById("lootModal").style.display = "flex";
                pendingScoreEntry = {
                    name: card.querySelector(".player-name").textContent,
                    score: score
                  };  
                haltScoring = true;
              }

      
            score += mermaids * 20 + skullKing * 40 + pirates * 30;
          }
      
          // Wager
          if (wager > 0) {
            score += bidEqualsWon ? wager : -wager;
          }
      
          scoresThisRound.push({
            name: card.querySelector(".player-name").textContent,
            score,
            card
          });
        });
      
        // Save to roundData
        roundData[currentRound] = scoresThisRound.map(entry => {
          const inputs = entry.card.querySelectorAll("input");
          return {
            name: entry.name,
            bid: parseInt(inputs[0].value) || 0,
            won: parseInt(inputs[1].value) || 0,
            fourteens: parseInt(inputs[2].value) || 0,
            wager: parseInt(inputs[3].value) || 0,
            mermaids: parseInt(inputs[4].value) || 0,
            skullKing: parseInt(inputs[5].value) || 0,
            pirates: parseInt(inputs[6].value) || 0,
            black14: entry.card.querySelector(".dot-field:nth-child(4) .dot")?.classList.contains("active"),
            loot: entry.card.querySelector(".dot-field:nth-child(5) .dot")?.classList.contains("active"),
            roundScore: entry.score
          };
        });
      
        // ✅ Save to localStorage for chart screen
        localStorage.setItem("skullRoundData", JSON.stringify(roundData));
        localStorage.setItem("skullPlayerNames", JSON.stringify(currentPlayerNames));
      
        generateScorecards(); // Re-render the UI

        localStorage.setItem("skullRoundData", JSON.stringify(roundData));
localStorage.setItem("skullPlayerNames", JSON.stringify(currentPlayerNames));
localStorage.setItem("skullCurrentRound", currentRound);

      }
      
      document.getElementById("lootSubmit").addEventListener("click", () => {
        const success = parseInt(document.getElementById("lootInput").value) || 0;
      
        if (pendingScoreEntry && activeLootCard) {
          pendingScoreEntry.score += 20 * success;
      
          // Update roundData directly
          const name = activeLootCard.querySelector(".player-name").textContent;
          const playerEntry = roundData[currentRound].find(p => p.name === name);
          if (playerEntry) {
            playerEntry.roundScore = pendingScoreEntry.score;
          }
      
          // Clear modal and flags before triggering render
          haltScoring = false;
          pendingScoreEntry = null;
          activeLootCard = null;
          lootAwaitingPlayer = null;
      
          calculateSkullScores();
      
          // Hide modal *after* rendering
          setTimeout(() => {
            document.getElementById("lootModal").style.display = "none";
          }, 50); // slight delay to ensure DOM isn't re-cleared before this executes
        }
      });
  
    function generateScorecards() {
      const container = document.querySelector(".player-cards");
      container.innerHTML = "";
      document.getElementById("currentRound").textContent = currentRound;
  
      const totalScores = {};
      currentPlayerNames.forEach(name => totalScores[name] = 0);
  
      for (let r = 1; r <= totalRounds; r++) {
        if (!roundData[r]) continue;
        roundData[r].forEach(entry => {
          if (entry.name in totalScores) {
            totalScores[entry.name] += entry.roundScore || 0;
          }
        });
      }
  
      currentPlayerNames.forEach(name => {
        const card = document.createElement("div");
        card.className = "player-card";
        card.innerHTML = `
          <div class="player-header">
            <span class="player-name">${name}</span>
            <span class="player-score">${totalScores[name]}</span>
            <span class="player-ranking">0</span>
          </div>
          <div class="player-row">
            <div class="field"><input type="text" inputmode="numeric" pattern="[0-9]*" /><label>Bid</label></div>
            <div class="field"><input type="text" inputmode="numeric" pattern="[0-9]*" /><label># Won</label></div>
            <div class="field"><input type="text" inputmode="numeric" pattern="[0-9]*" /><label>14s?</label></div>
            <div class="dot-field"><div class="dot"></div><label>Black<br>14</label></div>
            <div class="dot-field"><div class="dot"></div><label>Loot</label></div>
            <div class="field"><input type="text" inputmode="numeric" pattern="[0-9]*" /><label>Wager?</label></div>
            <div class="field"><input type="text" inputmode="numeric" pattern="[0-9]*" /><label>🧜‍♀️?</label></div>
            <div class="field"><input type="text" inputmode="numeric" pattern="[0-9]*" /><label>💀👑?</label></div>
            <div class="field"><input type="text" inputmode="numeric" pattern="[0-9]*" /><label>🏴‍☠️?</label></div>
          </div>
        `;

        container.appendChild(card);
      });
  
      if (roundData[currentRound]) {
        const cards = document.querySelectorAll(".player-card");
        roundData[currentRound].forEach((entry, i) => {
          const inputs = cards[i].querySelectorAll("input");
          inputs[0].value = entry.bid;
          inputs[1].value = entry.won;
          inputs[2].value = entry.fourteens;
          inputs[3].value = entry.wager;
          inputs[4].value = entry.mermaids;
          inputs[5].value = entry.skullKing;
          inputs[6].value = entry.pirates;
  
          const dots = cards[i].querySelectorAll(".dot");
          if (entry.black14) dots[0].classList.add("active");
          if (entry.loot) dots[1].classList.add("active");
        });
      }
  
      const sorted = Object.entries(totalScores).sort((a, b) => b[1] - a[1]);
      sorted.forEach(([name], i) => {
        const card = [...document.querySelectorAll(".player-card")]
          .find(card => card.querySelector(".player-name").textContent === name);
        if (card) {
          const suffix = getOrdinalSuffix(i + 1);
          card.querySelector(".player-ranking").textContent = `${i + 1}${suffix}`;
        }
      });
  
      function getOrdinalSuffix(n) {
        if (n % 100 >= 11 && n % 100 <= 13) return "th";
        switch (n % 10) {
          case 1: return "st";
          case 2: return "nd";
          case 3: return "rd";
          default: return "th";
        }
      }
    }
  
    // Navigation
    window.calculateSkullScores = calculateSkullScores;
    window.nextRound = () => {
      if (currentRound < totalRounds) {
        saveRoundData();
        currentRound++;
        localStorage.setItem("skullCurrentRound", currentRound); // ✅ Add this
        generateScorecards();
        localStorage.setItem("skullRoundData", JSON.stringify(roundData));
localStorage.setItem("skullCurrentRound", currentRound);

      }
    };
  
    window.previousRound = () => {
      if (currentRound > 1) {
        saveRoundData();
        currentRound--;
        localStorage.setItem("skullCurrentRound", currentRound); // ✅ Add this
        generateScorecards();
        localStorage.setItem("skullRoundData", JSON.stringify(roundData));
localStorage.setItem("skullCurrentRound", currentRound);

      }
    };
  
    window.toggleSidebar = () => {
      document.body.classList.toggle("sidebar-open");
    };

    document.addEventListener("click", function (e) {
        if (e.target.classList.contains("dot")) {
          e.target.classList.toggle("active");
        }
      });
      
  });
  
  
  
  document.getElementById("lootCancel").addEventListener("click", () => {
    document.getElementById("lootModal").style.display = "none";
    haltScoring = false;
  });
  

  window.startNewGame = function () {
    document.querySelector(".nav-buttons button.new-game").click();
  };
  