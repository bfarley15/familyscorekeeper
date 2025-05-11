let timerInterval;
let totalTime = 0;
let timeRemaining = 0;

const progressRing = document.getElementById("progress-ring");
const radius = 90;
const circumference = 2 * Math.PI * radius;

// Set initial circle state
progressRing.style.strokeDasharray = circumference;
progressRing.style.strokeDashoffset = 0;

function startTimer() {
  const minutes = parseInt(document.getElementById("minutes-input").value) || 0;
  const seconds = parseInt(document.getElementById("seconds-input").value) || 0;

  totalTime = minutes * 60 + seconds;
  timeRemaining = totalTime;

  if (totalTime <= 0) {
    alert("Please set a valid time.");
    return;
  }

  // Reset visuals
  document.querySelector('.page-container').style.backgroundColor = "#d0f0c0"; // Green background
  updateDisplay();
  updateCircle();

  clearInterval(timerInterval);
  timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
  if (timeRemaining > 0) {
    timeRemaining--;
    updateDisplay();
    updateCircle();
  }

  if (timeRemaining === 0) {
    document.querySelector('.page-container').style.backgroundColor = "#ff6666"; // Turn background red
    clearInterval(timerInterval);
  }
}

function resetTimer() {
  clearInterval(timerInterval);
  timeRemaining = 0;
  updateDisplay();
  progressRing.style.strokeDashoffset = 0; // Full circle
  document.querySelector('.page-container').style.backgroundColor = "#d0f0c0"; // Reset to green
}

function updateDisplay() {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  document.getElementById("timer-display").textContent =
    `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function updateCircle() {
  if (totalTime === 0) {
    progressRing.style.strokeDashoffset = 0;
    return;
  }
  const progress = 1 - (timeRemaining / totalTime);
  progressRing.style.strokeDashoffset = circumference * progress;
}

function toggleSidebar() {
    document.body.classList.toggle("sidebar-open");
  }
  
  function showTab(tabName) {
    document.getElementById("wingspan-section").style.display = tabName === "wingspan" ? "block" : "none";
    document.getElementById("countdown-section").style.display = tabName === "countdown" ? "block" : "none";
    updateHamburgerColor(); // ← add this line
  }
  
  document.addEventListener("focusin", e => {
    const el = e.target;
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  });
  
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
  