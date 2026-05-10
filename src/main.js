const clock = document.getElementById("clock");
const timerDisplay = document.getElementById("timerDisplay");
const timerStatus = document.getElementById("timerStatus");
const startPauseButton = document.getElementById("startPauseButton");
const restartButton = document.getElementById("restartButton");
const skipButton = document.getElementById("skipButton");
const tasksPanel = document.getElementById("tasksPanel");
const tasksList = document.getElementById("tasksList");
const taskNameInput = document.getElementById("taskNameInput");
const taskMinutesInput = document.getElementById("taskMinutesInput");
const addTaskButton = document.getElementById("addTaskButton");
const clearTasksButton = document.getElementById("clearTasksButton");
const breakToggleButton = document.getElementById("breakToggleButton");
const breakControls = document.getElementById("breakControls");
const breakMinutesInput = document.getElementById("breakMinutesInput");
const breakMinutesLabel = document.getElementById("breakMinutesLabel");
const minimalModeButton = document.getElementById("minimalModeButton");
const quranButton = document.getElementById("quranButton");
const quranSidebar = document.getElementById("quranSidebar");
const closeQuranButton = document.getElementById("closeQuranButton");
const fullscreenButton = document.getElementById("fullscreenButton");

let tasks = [];
let currentTaskIndex = 0;
let mode = "idle";
let secondsLeft = 0;
let initialSeconds = 0;
let timerId;

function updateClock() {
    const now = new Date();
    clock.textContent = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
}

function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function normalizeMinutes(value, fallback, max) {
    const minutes = Number.parseInt(value, 10);
    if (Number.isNaN(minutes)) {
        return fallback;
    }

    return Math.min(Math.max(minutes, 1), max);
}

function getBreakSeconds() {
    return normalizeMinutes(breakMinutesInput.value, 5, 60) * 60;
}

function renderTasks() {
    tasksList.innerHTML = "";

    if (!tasks.length) {
        const emptyState = document.createElement("p");
        emptyState.className = "rounded-sm border border-(--light) px-4 py-3 text-sm text-(--light)";
        emptyState.textContent = "No tasks yet. Add one gentle focus block.";
        tasksList.append(emptyState);
        return;
    }

    tasks.forEach((task, index) => {
        const taskButton = document.createElement("button");
        const isActive = index === currentTaskIndex && mode !== "idle";
        taskButton.type = "button";
        taskButton.className = `flex w-full items-center justify-between gap-3 rounded-sm border px-4 py-3 text-left text-sm transition duration-75 active:scale-95 ${isActive
                ? "border-(--mid) bg-(--mid) text-(--light)"
                : "border-(--light) bg-(--dark) text-(--light) hover:border-(--mid)"
            }`;

        const taskText = document.createElement("span");
        taskText.className = "flex flex-col gap-1";

        const taskName = document.createElement("span");
        taskName.textContent = task.name;

        const taskTime = document.createElement("span");
        taskTime.className = "text-xs";
        taskTime.textContent = `${task.minutes} min`;

        const taskNumber = document.createElement("span");
        taskNumber.textContent = String(index + 1);

        taskText.append(taskName, taskTime);
        taskButton.append(taskText, taskNumber);
        taskButton.addEventListener("click", () => selectTask(index));
        tasksList.append(taskButton);
    });
}

function setTimer(nextMode, seconds, shouldRun = false) {
    mode = nextMode;
    secondsLeft = seconds;
    initialSeconds = seconds;
    timerDisplay.textContent = formatTime(secondsLeft);
    startPauseButton.textContent = shouldRun ? "Pause" : "Start";
    updateStatus();
    renderTasks();

    if (shouldRun) {
        startTimer();
    }
}

function updateStatus() {
    if (!tasks.length) {
        timerStatus.textContent = "Add a task to begin.";
        return;
    }

    const task = tasks[currentTaskIndex];
    if (mode === "break") {
        timerStatus.textContent = `Break before ${task?.name ?? "the next task"}.`;
        return;
    }

    if (mode === "focus") {
        timerStatus.textContent = `Focused on ${task.name}.`;
        return;
    }

    timerStatus.textContent = `${task.name} is ready.`;
}

function startTimer() {
    if (!tasks.length && mode !== "break") {
        return;
    }

    window.clearInterval(timerId);
    startPauseButton.textContent = "Pause";
    timerId = window.setInterval(() => {
        secondsLeft -= 1;
        timerDisplay.textContent = formatTime(Math.max(secondsLeft, 0));

        if (secondsLeft <= 0) {
            completeBlock();
        }
    }, 1000);
}

function pauseTimer() {
    window.clearInterval(timerId);
    startPauseButton.textContent = "Start";
}

function completeBlock() {
    pauseTimer();

    if (mode === "focus" && currentTaskIndex < tasks.length - 1) {
        currentTaskIndex += 1;
        setTimer("break", getBreakSeconds(), true);
        return;
    }

    if (mode === "break") {
        const task = tasks[currentTaskIndex];
        setTimer("focus", task.minutes * 60, true);
        return;
    }

    mode = "idle";
    secondsLeft = 0;
    initialSeconds = 0;
    timerDisplay.textContent = "00:00";
    timerStatus.textContent = "Session complete.";
    renderTasks();
}

function selectTask(index) {
    pauseTimer();
    currentTaskIndex = index;
    const task = tasks[currentTaskIndex];
    setTimer("focus", task.minutes * 60);
}

function addTask() {
    const name = taskNameInput.value.trim();
    const minutes = normalizeMinutes(taskMinutesInput.value, 25, 240);

    if (!name) {
        taskNameInput.focus();
        return;
    }

    tasks.push({ name, minutes });
    taskNameInput.value = "";
    taskMinutesInput.value = String(minutes);

    if (tasks.length === 1) {
        currentTaskIndex = 0;
        setTimer("focus", minutes * 60);
    } else {
        renderTasks();
        updateStatus();
    }
}

function clearTasks() {
    pauseTimer();
    tasks = [];
    currentTaskIndex = 0;
    mode = "idle";
    secondsLeft = 0;
    initialSeconds = 0;
    timerDisplay.textContent = "00:00";
    updateStatus();
    renderTasks();
}

function restartTimer() {
    if (!initialSeconds) {
        return;
    }

    pauseTimer();
    secondsLeft = initialSeconds;
    timerDisplay.textContent = formatTime(secondsLeft);
    updateStatus();
}

function skipBlock() {
    if (!tasks.length) {
        return;
    }

    completeBlock();
}

function toggleQuranSidebar(forceOpen) {
    const shouldOpen = forceOpen ?? quranSidebar.classList.contains("-translate-x-full");
    quranSidebar.classList.toggle("-translate-x-full", !shouldOpen);
    quranSidebar.setAttribute("aria-hidden", String(!shouldOpen));
}

async function toggleFullscreen() {
    if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        fullscreenButton.innerHTML = '<i class="fa-solid fa-compress"></i>';
        return;
    }

    await document.exitFullscreen();
    fullscreenButton.innerHTML = '<i class="fa-solid fa-expand"></i>';
}

startPauseButton.addEventListener("click", () => {
    if (startPauseButton.textContent === "Pause") {
        pauseTimer();
        return;
    }

    if (!secondsLeft && tasks.length) {
        const task = tasks[currentTaskIndex];
        setTimer("focus", task.minutes * 60, true);
        return;
    }

    startTimer();
});

restartButton.addEventListener("click", restartTimer);
skipButton.addEventListener("click", skipBlock);
addTaskButton.addEventListener("click", addTask);
clearTasksButton.addEventListener("click", clearTasks);
taskNameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        addTask();
    }
});
taskMinutesInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        addTask();
    }
});
breakToggleButton.addEventListener("click", () => {
    breakControls.classList.toggle("hidden");
});
breakMinutesInput.addEventListener("input", () => {
    const minutes = normalizeMinutes(breakMinutesInput.value, 5, 60);
    breakMinutesLabel.textContent = String(minutes);
});
minimalModeButton.addEventListener("click", () => {
    tasksPanel.classList.toggle("hidden");
});
quranButton.addEventListener("click", () => toggleQuranSidebar());
closeQuranButton.addEventListener("click", () => toggleQuranSidebar(false));
fullscreenButton.addEventListener("click", () => {
    toggleFullscreen().catch(() => {
        timerStatus.textContent = "Fullscreen is unavailable in this browser.";
    });
});
document.addEventListener("fullscreenchange", () => {
    fullscreenButton.innerHTML = document.fullscreenElement
        ? '<i class="fa-solid fa-compress"></i>'
        : '<i class="fa-solid fa-expand"></i>';
});
window.addEventListener("beforeunload", (event) => {
    event.preventDefault();
    event.returnValue = "Are you sure?";
});

setInterval(updateClock, 1000);
updateClock();
renderTasks();
updateStatus();
