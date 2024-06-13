export const getStartOfNextWeekTimestamp = () => {
  const date = new Date();
  const dayOfWeek = date.getDay();
  const daysUntilNextWeek = dayOfWeek === 1 ? 7 : (8 - dayOfWeek) % 7;

  const nextWeekStartDate = new Date(date);
  nextWeekStartDate.setDate(date.getDate() + daysUntilNextWeek);
  nextWeekStartDate.setHours(0, 0, 0, 0);

  return nextWeekStartDate.getTime() / 1000;
};

export const getThisWeekMondayTimestamp = () => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysToMonday = (dayOfWeek + 6) % 7;
  const monday = new Date(now);

  monday.setDate(now.getDate() - daysToMonday);
  monday.setHours(0, 0, 0, 0);

  return monday.getTime() / 1000;
};
