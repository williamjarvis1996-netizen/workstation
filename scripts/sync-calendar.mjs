#!/usr/bin/env node
// Fetch upcoming Google Calendar events and write src/content/sync/calendar.json.
// Requires GOOGLE_CALENDAR_REFRESH_TOKEN, GOOGLE_CALENDAR_CLIENT_ID and
// GOOGLE_CALENDAR_CLIENT_SECRET in the environment.
// Optionally set GOOGLE_CALENDAR_IDS as a comma-separated list of calendar IDs.

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'src', 'content', 'sync');
const OUT_FILE = join(OUT_DIR, 'calendar.json');

const CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN;

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.error('Google Calendar credentials not set — skipping calendar sync.');
  process.exit(0);
}

const CALENDAR_IDS = (process.env.GOOGLE_CALENDAR_IDS || 'primary')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// Calendar ID → our category mapping.
// The user can customise this via GOOGLE_CALENDAR_MAP (JSON object).
let calendarCategoryMap = {};
try {
  calendarCategoryMap = JSON.parse(process.env.GOOGLE_CALENDAR_MAP || '{}');
} catch { /* use empty map */ }

function guessCategory(calendarId, summary) {
  if (calendarCategoryMap[calendarId]) return calendarCategoryMap[calendarId];
  const lower = (summary || '').toLowerCase();
  if (/gym|run|swim|cycle|yoga|exercise|training|fitness/.test(lower)) return 'fitness';
  if (/birthday|dentist|doctor|personal/.test(lower)) return 'personal';
  return 'work';
}

async function getAccessToken() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token refresh failed: ${res.status} ${text}`);
  }
  const { access_token } = await res.json();
  return access_token;
}

async function fetchEvents(accessToken, calendarId, timeMin, timeMax) {
  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '100',
  });
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    console.warn(`Calendar ${calendarId}: ${res.status} — skipping.`);
    return [];
  }
  const { items = [] } = await res.json();
  return items;
}

function toLocalDate(dateStr) {
  // Google returns 'YYYY-MM-DD' for all-day or 'YYYY-MM-DDTHH:MM:SS+ZZ:ZZ' for timed.
  return dateStr.slice(0, 10);
}

function toLocalTime(dateTimeStr) {
  if (!dateTimeStr || dateTimeStr.length <= 10) return undefined;
  // Parse and convert to London time.
  const d = new Date(dateTimeStr);
  return d.toLocaleTimeString('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hour12: false });
}

async function main() {
  const accessToken = await getAccessToken();

  // Fetch a 14-day window.
  const now = new Date();
  const timeMin = new Date(now);
  timeMin.setHours(0, 0, 0, 0);
  const timeMax = new Date(timeMin);
  timeMax.setDate(timeMax.getDate() + 14);

  const allEvents = [];
  for (const calId of CALENDAR_IDS) {
    const events = await fetchEvents(accessToken, calId, timeMin, timeMax);
    for (const ev of events) {
      if (ev.status === 'cancelled') continue;
      // Skip declined events.
      const self = ev.attendees?.find(a => a.self);
      if (self?.responseStatus === 'declined') continue;

      const isAllDay = !!ev.start.date;
      const startDate = isAllDay ? ev.start.date : toLocalDate(ev.start.dateTime);
      const startTime = isAllDay ? undefined : toLocalTime(ev.start.dateTime);
      const endTime = isAllDay ? undefined : toLocalTime(ev.end.dateTime);

      allEvents.push({
        title: ev.summary || '(No title)',
        date: startDate,
        startTime,
        endTime,
        location: ev.location || undefined,
        calendar: guessCategory(calId, ev.summary),
      });
    }
  }

  // Sort by date, then startTime.
  allEvents.sort((a, b) => {
    const dc = a.date.localeCompare(b.date);
    if (dc !== 0) return dc;
    return (a.startTime || '').localeCompare(b.startTime || '');
  });

  // Deduplicate (same title + date + startTime from different calendars).
  const seen = new Set();
  const unique = allEvents.filter(ev => {
    const key = `${ev.title}|${ev.date}|${ev.startTime || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(unique, null, 2) + '\n');
  console.log(`Synced ${unique.length} calendar events (${CALENDAR_IDS.length} calendars, 14-day window) → ${OUT_FILE}`);
}

main().catch(err => {
  console.error('Calendar sync failed:', err.message);
  process.exit(1);
});
