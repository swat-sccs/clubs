// @ts-expect-error Bun provides this module at test runtime; the app does not
// ship Bun's ambient types to production.
import { describe, expect, test } from "bun:test";
import { parseEventFields } from "./events";

function eventForm(date: string, time = "19:30") {
  const form = new FormData();
  form.set("title", "Weekly meeting");
  form.set("subtitle", "Come meet the club and learn what we do.");
  form.set("eventDate", date);
  form.set("eventTime", time);
  form.set("location", "Kohlberg 116");
  return form;
}

describe("event validation", () => {
  test("accepts a real calendar date and 24-hour time", () => {
    expect(parseEventFields(eventForm("2026-09-30")).error).toBeNull();
  });

  test("rejects normalized or impossible dates and times", () => {
    expect(parseEventFields(eventForm("2026-02-31")).data).toBeNull();
    expect(parseEventFields(eventForm("2026-09-30", "24:00")).data).toBeNull();
  });
});
