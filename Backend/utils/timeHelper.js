/**
 * Checks if the current time in Manila is within the specified schedule.
 * Handles both same-day (e.g., 08:00 - 17:00) and overnight (e.g., 22:00 - 06:00) schedules.
 * 
 * @param {string} scheduleStart - "HH:mm" format
 * @param {string} scheduleEnd - "HH:mm" format
 * @returns {boolean}
 */
function isWithinSchedule(scheduleStart, scheduleEnd) {
  if (!scheduleStart || !scheduleEnd) return true;
  if (scheduleStart === scheduleEnd) return true; // Same times = Always active

  // Get current time in Manila using Intl.DateTimeFormat for robustness
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);

  let h = 0, m = 0;
  for (const part of parts) {
    if (part.type === "hour") h = parseInt(part.value, 10);
    if (part.type === "minute") m = parseInt(part.value, 10);
  }
  
  const cur = h * 60 + m;

  const toMin = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const s = toMin(scheduleStart);
  const e = toMin(scheduleEnd);

  if (s < e) {
    // Same day: 08:00 to 17:00
    return cur >= s && cur < e;
  } else {
    // Overnight: 22:00 to 06:00 (s > e)
    return cur >= s || cur < e;
  }
}

module.exports = { isWithinSchedule };
