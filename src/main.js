const clock = document.getElementById("clock");
const quranQuote = document.getElementById("quranQuote");
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
let audioContext;

const fallbackQuote = {
    text: "So remember Me; I will remember you.",
    reference: "Qur'an 2:152",
};

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

function setStartPauseButton(isRunning) {
    const icon = startPauseButton.querySelector("i");
    const label = startPauseButton.querySelector(".control-label");
    const nextLabel = isRunning ? "Pause" : "Start";

    startPauseButton.dataset.state = isRunning ? "pause" : "start";
    startPauseButton.title = nextLabel;
    startPauseButton.setAttribute("aria-label", nextLabel);
    icon.className = isRunning ? "fa-solid fa-pause" : "fa-solid fa-play";
    label.textContent = nextLabel;
}

function getAudioContext() {
    audioContext ??= new (window.AudioContext || window.webkitAudioContext)();

    if (audioContext.state === "suspended") {
        audioContext.resume();
    }

    return audioContext;
}

function playToneSequence(notes) {
    const context = getAudioContext();
    const now = context.currentTime;

    notes.forEach(({ frequency, start, duration }) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, now + start);
        gain.gain.setValueAtTime(0.0001, now + start);
        gain.gain.exponentialRampToValueAtTime(0.18, now + start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);

        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(now + start);
        oscillator.stop(now + start + duration + 0.03);
    });
}

function playTaskFinishedSound() {
    playToneSequence([
        { frequency: 523.25, start: 0, duration: 0.14 },
        { frequency: 659.25, start: 0.16, duration: 0.18 },
    ]);
}

function playSessionFinishedSound() {
    playToneSequence([
        { frequency: 523.25, start: 0, duration: 0.14 },
        { frequency: 659.25, start: 0.16, duration: 0.14 },
        { frequency: 783.99, start: 0.32, duration: 0.34 },
    ]);
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
    setStartPauseButton(shouldRun);
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
    setStartPauseButton(true);
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
    setStartPauseButton(false);
}

function completeBlock() {
    pauseTimer();

    if (mode === "focus" && currentTaskIndex < tasks.length - 1) {
        playTaskFinishedSound();
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
    if (tasks.length) {
        playSessionFinishedSound();
    }
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

function updateMinuteInput(input, step = 0) {
    const max = Number.parseInt(input.getAttribute("max"), 10);
    const fallback = input === breakMinutesInput ? 5 : 25;
    const minutes = normalizeMinutes(input.value, fallback, max) + step;
    input.value = String(Math.min(Math.max(minutes, 1), max));

    if (input === breakMinutesInput) {
        breakMinutesLabel.textContent = input.value;
    }
}

async function loadQuranQuote() {
    try {
        const response = await fetch("https://api.alquran.cloud/v1/ayah/random/en.asad");

        if (!response.ok) {
            throw new Error("Quote request failed");
        }

        const { data } = await response.json();
        const reference = `Qur'an ${data.surah.number}:${data.numberInSurah}`;
        quranQuote.textContent = `"${data.text}" - ${reference}`;
    } catch {
        quranQuote.textContent = `"${fallbackQuote.text}" - ${fallbackQuote.reference}`;
    }
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
    getAudioContext();

    if (startPauseButton.dataset.state === "pause") {
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
taskMinutesInput.addEventListener("blur", () => {
    updateMinuteInput(taskMinutesInput);
});
breakToggleButton.addEventListener("click", () => {
    breakControls.classList.toggle("hidden");
});
breakMinutesInput.addEventListener("input", () => {
    updateMinuteInput(breakMinutesInput);
});
breakMinutesInput.addEventListener("blur", () => {
    updateMinuteInput(breakMinutesInput);
});
minimalModeButton.addEventListener("click", () => {
    tasksPanel.classList.toggle("hidden");
    document.body.classList.toggle("minimal-mode", tasksPanel.classList.contains("hidden"));
    minimalModeButton.setAttribute("aria-pressed", String(tasksPanel.classList.contains("hidden")));
});
document.querySelectorAll("[data-minute-target]").forEach((button) => {
    button.addEventListener("click", () => {
        const input = document.getElementById(button.dataset.minuteTarget);
        updateMinuteInput(input, Number.parseInt(button.dataset.minuteStep, 10));
    });
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
setStartPauseButton(false);
loadQuranQuote();
renderTasks();
updateStatus();
