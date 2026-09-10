const CAMPUS_TIME_ZONE = "America/New_York";

export type EventFields = {
  title: string;
  subtitle: string;
  eventDate: string;
  eventTime: string;
  location: string;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function isValidDate(value: string) {
  if (!DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

export function parseEventFields(
  formData: FormData,
): { data: EventFields; error: null } | { data: null; error: string } {
  const title = String(formData.get("title") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim();
  const eventDate = String(formData.get("eventDate") ?? "").trim();
  const eventTime = String(formData.get("eventTime") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();

  if (title.length < 2 || title.length > 120) {
    return { data: null, error: "The title must be between 2 and 120 characters." };
  }
  if (subtitle.length < 2 || subtitle.length > 2000) {
    return {
      data: null,
      error: "The post text must be between 2 and 2,000 characters.",
    };
  }
  if (!isValidDate(eventDate)) {
    return { data: null, error: "Choose a valid event date." };
  }
  if (!TIME_PATTERN.test(eventTime)) {
    return { data: null, error: "Choose a valid event time." };
  }
  if (location.length < 2 || location.length > 200) {
    return {
      data: null,
      error: "The location must be between 2 and 200 characters.",
    };
  }

  return {
    data: { title, subtitle, eventDate, eventTime, location },
    error: null,
  };
}

export function formatEventDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}

export function formatCompactEventDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}

export function formatRelativeEventDate(value: string, relativeTo: string) {
  const eventDay = Date.parse(`${value}T00:00:00Z`);
  const currentDay = Date.parse(`${relativeTo}T00:00:00Z`);
  const difference = Math.round((eventDay - currentDay) / 86_400_000);

  if (difference === 0) return "Today";
  if (difference === 1) return "Tomorrow";
  if (difference >= 2 && difference <= 7) return `In ${difference} days`;
  return formatCompactEventDate(value);
}

export function formatEventTime(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2000, 0, 1, hour, minute)));
}

export function campusNow() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CAMPUS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`,
  };
}
