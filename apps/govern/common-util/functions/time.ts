export const getStartOfNextWeek = () => {
  const date = new Date();
  const dayOfWeek = date.getDay();
  const daysUntilNextWeek = (8 - dayOfWeek) % 7;
  const nextWeekStartDate = new Date(date);
  nextWeekStartDate.setDate(date.getDate() + daysUntilNextWeek);
  nextWeekStartDate.setHours(0, 0, 0, 0);
  return nextWeekStartDate.getTime() / 1000;
};
