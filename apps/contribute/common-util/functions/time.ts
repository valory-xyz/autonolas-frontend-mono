/**
 *
 * @param ms timestamp in ms
 * @returns time in format "12 days ago" or "5 hours ago"
 */
export const getTimeAgo = (ms: number, showPostfix = true) => {
  const differenceInMs = Date.now() - ms;
  return formatTimeDifference(differenceInMs, showPostfix ? 'ago' : '');
};

export const formatTimeDifference = (differenceInMs: number, postfix?: string) => {
  // Calculate time differences
  const differenceInMinutes = Math.floor(differenceInMs / (1000 * 60));
  const differenceInHours = Math.floor(differenceInMinutes / 60);
  const differenceInDays = Math.floor(differenceInHours / 24);
  const differenceInMonths = Math.floor(differenceInDays / 30); // Approximate months

  const postfixWithSpace = postfix ? ` ${postfix}` : '';

  if (differenceInMonths > 0) {
    return `${differenceInMonths} month${differenceInMonths > 1 ? 's' : ''}${postfixWithSpace}`;
  } else if (differenceInDays > 0) {
    return `${differenceInDays} day${differenceInDays > 1 ? 's' : ''}${postfixWithSpace}`;
  } else if (differenceInHours > 0) {
    return `${differenceInHours} hour${differenceInHours > 1 ? 's' : ''}${postfixWithSpace}`;
  } else {
    return `${differenceInMinutes} minute${differenceInMinutes > 1 ? 's' : ''}${postfixWithSpace}`;
  }
};

const ONE_HOUR_IN_MS = 3600 * 1000;

// Considering provided time format is en-US
const getHourAndPeriod = (time: string) => {
  const [hour] = time.split(':').map(Number);
  const period = time.includes('PM') ? 'pm' : 'am';
  return { hour, period };
};

/**
 *
 * @param {*} epochEndTimestamp
 * @returns returns formatted time range of current hour and next hour
 * Possible results:
 * 8-9am, 14/11/24
 * 11am-12pm, 14/11/24 (next time is in the next period AM to PM)
 * 11pm-12am, 14/11/24-15/11/24 (next time is on the next day)
 */
export const formatDynamicTimeRange = (timestamp: number, timeOffsetMs = ONE_HOUR_IN_MS) => {
  const timestampInMs = timestamp * 1000;

  // Get current date and time in the format: "17/11/2024" and "13:39:07"
  const [currentDate, currentTime] = new Date(timestampInMs).toLocaleString('en-US').split(', ');

  // Get next date and time
  const [nextDate, nextTime] = new Date(timestampInMs + timeOffsetMs)
    .toLocaleString('en-US')
    .split(', ');

  const { hour: currentHour, period: currentPeriod } = getHourAndPeriod(currentTime);
  const { hour: nextHour, period: nextPeriod } = getHourAndPeriod(nextTime);

  let timeRange;
  if (currentPeriod === nextPeriod && currentHour < nextHour) {
    // makes a time range of the form "10-11am"
    timeRange = `${currentHour}-${nextHour}${currentPeriod}`;
  } else {
    // makes a time range of the form "11pm-12am"
    timeRange = `${currentHour}${currentPeriod}-${nextHour}${nextPeriod}`;
  }

  // If the dates are the same, display the time range and date
  // otherwise, show both dates
  if (currentDate === nextDate) {
    return `${timeRange}, ${currentDate}`;
  } else {
    return `${timeRange}, ${currentDate} - ${nextDate}`;
  }
};

/**
 *
 * @param timeInMs - time in milliseconds
 * @returns formatted date string
 * @example formatDate(number) => Jan 11, 2025, 10:17:13 PM GMT+5:30
 */
export const formatDate = (timeInMs: number) => {
  if (timeInMs === 0) return null;

  return Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'long',
  }).format(new Date(timeInMs));
};

export const getNowTimestamp = () => Math.round(Date.now() / 1000);
export const getTimestamp = (date: string) => Math.round(new Date(date).getTime() / 1000);
