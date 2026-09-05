const conceptTabs = [...document.querySelectorAll("[data-concept]")];
const conceptPanels = [...document.querySelectorAll("[data-concept-panel]")];
const commandDialog = document.querySelector("#command-dialog");
const commandInput = document.querySelector("#command-input");
const commandItems = [...document.querySelectorAll("[data-command-target]")];
const commandCount = document.querySelector("#command-count");
const liveRegion = document.querySelector("#live-region");
const toast = document.querySelector("#mock-toast");
let toastTimer;
let clockTimer;

function announce(message) {
  liveRegion.textContent = "";
  requestAnimationFrame(() => {
    liveRegion.textContent = message;
  });
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.hidden = false;
  toastTimer = window.setTimeout(() => {
    toast.hidden = true;
  }, 4500);
}

function switchConcept(conceptId, { updateHash = true, focus = false } = {}) {
  const nextPanel = document.getElementById(conceptId);
  if (!nextPanel || !nextPanel.matches("[data-concept-panel]")) return;

  conceptTabs.forEach((tab) => {
    const isActive = tab.dataset.concept === conceptId;
    tab.setAttribute("aria-pressed", String(isActive));
  });

  conceptPanels.forEach((panel) => {
    panel.hidden = panel.id !== conceptId;
  });

  if (updateHash) history.replaceState(null, "", `#${conceptId}`);
  if (focus) {
    nextPanel.querySelector("h2")?.focus({ preventScroll: true });
    nextPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  announce(`${nextPanel.querySelector("h2")?.textContent ?? "Concept"} selected.`);
}

conceptTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => switchConcept(tab.dataset.concept));
  tab.addEventListener("keydown", (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (index + direction + conceptTabs.length) % conceptTabs.length;
    conceptTabs[nextIndex].focus();
    switchConcept(conceptTabs[nextIndex].dataset.concept);
  });
});

function openCommandDialog() {
  commandDialog.showModal();
  commandInput.value = "";
  filterCommands();
  requestAnimationFrame(() => commandInput.focus());
}

document.querySelector("#open-command").addEventListener("click", openCommandDialog);

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    if (!commandDialog.open) openCommandDialog();
  }
});

function filterCommands() {
  const query = commandInput.value.trim().toLowerCase();
  let visibleCount = 0;
  commandItems.forEach((item) => {
    const matches = item.dataset.search.includes(query);
    item.hidden = !matches;
    if (matches) visibleCount += 1;
  });
  commandCount.textContent = `${visibleCount} ${visibleCount === 1 ? "result" : "results"}`;
}

commandInput.addEventListener("input", filterCommands);

commandItems.forEach((item) => {
  item.addEventListener("click", () => {
    commandDialog.close();
    switchConcept(item.dataset.commandTarget, { focus: true });
  });
});

const deskTasks = [...document.querySelectorAll("[data-desk-task]")];
const deskPanels = [...document.querySelectorAll("[data-desk-panel]")];

deskTasks.forEach((task) => {
  task.addEventListener("click", () => {
    const taskId = task.dataset.deskTask;
    deskTasks.forEach((item) => {
      const isActive = item === task;
      item.classList.toggle("task-step--active", isActive);
      item.setAttribute("aria-pressed", String(isActive));
    });
    deskPanels.forEach((panel) => {
      panel.hidden = panel.dataset.deskPanel !== taskId;
    });
    announce(`${task.querySelector("strong").textContent} task selected.`);
  });
});

const questionText = document.querySelector("#question-text");
const questionMarks = document.querySelector("#question-marks");
const canvasBackground = document.querySelector("#canvas-background");
const previewQuestion = document.querySelector("#preview-question");
const previewMarks = document.querySelector("#preview-marks");
const answerSheet = document.querySelector("#answer-sheet");
const saveState = document.querySelector("#save-state");

function markPaperEdited() {
  saveState.textContent = "Unsaved mock change";
  saveState.classList.add("save-state--dirty");
}

questionText.addEventListener("input", () => {
  previewQuestion.textContent = questionText.value || "Question text will appear here.";
  markPaperEdited();
});

questionMarks.addEventListener("input", () => {
  const marks = Math.max(1, Number.parseInt(questionMarks.value, 10) || 1);
  previewMarks.textContent = `[${marks} ${marks === 1 ? "mark" : "marks"}]`;
  markPaperEdited();
});

canvasBackground.addEventListener("change", () => {
  answerSheet.classList.toggle("answer-sheet--ruled", canvasBackground.value === "Ruled");
  answerSheet.classList.toggle("answer-sheet--grid", ["Square grid", "Graph grid"].includes(canvasBackground.value));
  markPaperEdited();
});

document.querySelectorAll("[data-copy]").forEach((button) => {
  const originalLabel = button.textContent;
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
      button.textContent = "Copied";
      window.setTimeout(() => {
        button.textContent = originalLabel;
      }, 2500);
    } catch {
      showToast("The address could not be copied. Select it manually instead.");
    }
  });
});

document.querySelectorAll("[data-mock-action]").forEach((button) => {
  button.addEventListener("click", () => {
    const action = button.textContent.trim().replace(/\s+/g, " ");
    showToast(`${action} is shown for interaction review only; production data was not changed.`);
  });
});

const startButton = document.querySelector("#start-demo");
const demoClock = document.querySelector("#demo-clock");

startButton.addEventListener("click", () => {
  if (startButton.disabled) return;
  startButton.disabled = true;
  startButton.textContent = "Reading in progress";
  let secondsRemaining = 10;
  demoClock.textContent = `Reading 00:${String(secondsRemaining).padStart(2, "0")}`;
  announce("Demo exam started. Ten seconds of reading time has begun.");

  clockTimer = window.setInterval(() => {
    secondsRemaining -= 1;
    if (secondsRemaining > 0) {
      demoClock.textContent = `Reading 00:${String(secondsRemaining).padStart(2, "0")}`;
      return;
    }
    window.clearInterval(clockTimer);
    demoClock.textContent = "Writing 2:30:00";
    startButton.textContent = "Exam running";
    startButton.dataset.state = "success";
    announce("Reading time ended. Writing time has begun.");
  }, 1000);
});

const initialConcept = location.hash.slice(1);
switchConcept(
  conceptPanels.some((panel) => panel.id === initialConcept) ? initialConcept : "control-room",
  { updateHash: false }
);
