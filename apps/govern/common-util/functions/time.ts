import { NA } from 'libs/util-constants/src';

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

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Get formatted date from milliseconds
 * example, 1678320000000 => Mar 09 '23
 */
export function getFormattedDate(ms: number): string {
  if (ms == 0) return NA;

  const date = new Date(ms);
  const month = MONTHS[date.getMonth()];
  const day = date.getUTCDate();
  const year = date.getUTCFullYear() % 100; // Get last two digits of year

  return (
    month +
    ' ' +
    (day < 10 ? '0' : '') +
    day.toString() +
    " '" +
    (year < 10 ? '0' : '') +
    year.toString()
  );
}

/**
 * Get formatted date from milliseconds including time
 * example, 1678320000000 => Mar 09 '2023 16:00
 */
export function getFullFormattedDate(ms: number): string {
  if (ms == 0) return NA;

  const date = new Date(ms);
  const month = MONTHS[date.getMonth()];
  const day = date.getUTCDate();
  const year = date.getUTCFullYear();
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();

  return (
    month +
    ' ' +
    (day < 10 ? '0' : '') +
    day.toString() +
    ' ' +
    year.toString() +
    ', ' +
    (hours < 10 ? '0' : '') +
    hours.toString() +
    ':' +
    (minutes < 10 ? '0' : '') +
    minutes.toString()
  );
}

export const dateInMs = (time: number) => {
  if (!time) return 0;
  return Math.round(new Date(time).getTime());
};

/*
 * Returns the remaining time in seconds between unlockTime and the current time.
 * Steps:
 * 1. Convert unlockTime to a timestamp
 * 2. Get the current time as a timestamp
 * 3. Calculate the difference between the future timestamp and the current timestamp, convert to seconds.
 */
export const getRemainingTimeInSeconds = (unlockTime?: number) => {
  if (!unlockTime) return 0;

  const futureDateInTimeStamp = new Date(unlockTime).getTime();
  const todayDateInTimeStamp = new Date().getTime();
  return Math.round((futureDateInTimeStamp - todayDateInTimeStamp) / 1000);
};
