export function createUI() {
  const ui = {
    instructions: document.getElementById("instructions"),
    energyFill: document.getElementById("energyFill"),
    blueScore: document.getElementById("blueScore"),
    redScore: document.getElementById("redScore"),
    timer: document.getElementById("timer"),
    countdown: document.getElementById("countdown"),
    goalBanner: document.getElementById("goalBanner"),
    teamSelect: document.getElementById("teamSelect"),
    matchEnd: document.getElementById("matchEnd"),
    finalBlueScore: document.getElementById("finalBlueScore"),
    finalRedScore: document.getElementById("finalRedScore"),
    restartMatch: document.getElementById("restartMatch"),
    changeTeam: document.getElementById("changeTeam"),
    shotMeter: document.getElementById("shotMeter"),
    shotGreen: document.getElementById("shotGreen"),
    shotCursor: document.getElementById("shotCursor"),
  };

  function bindHandlers({ onTeamSelect, onRestart, onChangeTeam }) {
    if (ui.teamSelect) {
      ui.teamSelect.querySelectorAll("[data-team]").forEach((button) => {
        button.addEventListener("click", () => {
          const team = button.getAttribute("data-team");
          if (team !== "blue" && team !== "red") {
            return;
          }
          onTeamSelect(team);
        });
      });
    }

    if (ui.restartMatch) {
      ui.restartMatch.addEventListener("click", () => onRestart());
    }

    if (ui.changeTeam) {
      ui.changeTeam.addEventListener("click", () => onChangeTeam());
    }
  }

  function updateEnergy(ratio) {
    if (ui.energyFill) {
      ui.energyFill.style.transform = `scaleX(${ratio})`;
    }
  }

  function updateScore(score) {
    if (ui.blueScore) {
      ui.blueScore.textContent = `${score.blue}`;
    }
    if (ui.redScore) {
      ui.redScore.textContent = `${score.red}`;
    }
  }

  function updateTimer(timeLeft) {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = Math.floor(timeLeft % 60);
    const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    if (ui.timer) {
      ui.timer.textContent = formatted;
      if (timeLeft <= 10) {
        ui.timer.style.color = "#ff5a5a";
      } else if (timeLeft <= 30) {
        ui.timer.style.color = "#f7d154";
      } else {
        ui.timer.style.color = "#f8f4ee";
      }
    }
  }

  function showCountdown(value) {
    if (ui.countdown) {
      ui.countdown.style.display = "block";
      ui.countdown.textContent = `${value}`;
    }
  }

  function hideCountdown() {
    if (ui.countdown) {
      ui.countdown.style.display = "none";
    }
  }

  function showGoal() {
    if (ui.goalBanner) {
      ui.goalBanner.textContent = "BUT !";
      ui.goalBanner.style.display = "block";
    }
  }

  function hideGoal() {
    if (ui.goalBanner) {
      ui.goalBanner.style.display = "none";
    }
  }

  function showMatchEnd(score) {
    if (ui.finalBlueScore) {
      ui.finalBlueScore.textContent = `${score.blue}`;
    }
    if (ui.finalRedScore) {
      ui.finalRedScore.textContent = `${score.red}`;
    }
    if (ui.matchEnd) {
      ui.matchEnd.style.display = "grid";
    }
  }

  function hideMatchEnd() {
    if (ui.matchEnd) {
      ui.matchEnd.style.display = "none";
    }
  }

  function showTeamSelect() {
    if (ui.teamSelect) {
      ui.teamSelect.style.display = "grid";
    }
  }

  function hideTeamSelect() {
    if (ui.teamSelect) {
      ui.teamSelect.style.display = "none";
    }
  }

  function updateShotMeter(progress, greenStart, greenWidth) {
    if (ui.shotMeter) {
      ui.shotMeter.style.display = "flex";
    }
    if (ui.shotGreen) {
      if (greenWidth > 0) {
        ui.shotGreen.style.display = "block";
        ui.shotGreen.style.left = `${greenStart * 100}%`;
        ui.shotGreen.style.width = `${greenWidth * 100}%`;
      } else {
        ui.shotGreen.style.display = "none";
      }
    }
    if (ui.shotCursor) {
      ui.shotCursor.style.left = `${progress * 100}%`;
    }
  }

  function hideShotMeter() {
    if (ui.shotMeter) {
      ui.shotMeter.style.display = "none";
    }
  }

  return {
    ...ui,
    bindHandlers,
    updateEnergy,
    updateScore,
    updateTimer,
    showCountdown,
    hideCountdown,
    showGoal,
    hideGoal,
    showMatchEnd,
    hideMatchEnd,
    showTeamSelect,
    hideTeamSelect,
    updateShotMeter,
    hideShotMeter,
  };
}
