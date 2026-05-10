function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    document.getElementById('clock').innerHTML = timeString;
}
setInterval(updateClock, 1000);
updateClock();