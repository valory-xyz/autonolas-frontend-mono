// Returns the closest Thursday in the future
// which is the start of the next week by Unix time
export const getUnixNextWeekStartTimestamp = () => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilNextThursday = (4 - dayOfWeek + 7) % 7;

  const result = new Date(now);
  result.setDate(now.getDate() + daysUntilNextThursday);
  result.setHours(0, 0, 0, 0);

  return result.getTime() / 1000;
};

// Returns the closest Thursday in the past
// which is the start of the current week by Unix time
export const getUnixWeekStartTimestamp = () => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysSinceThursday = ((dayOfWeek + 2) % 7) + 1;
  const result = new Date(now);

  result.setDate(now.getDate() - daysSinceThursday);
  result.setHours(0, 0, 0, 0);

  return result.getTime() / 1000;
};
