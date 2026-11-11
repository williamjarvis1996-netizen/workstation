import { addDays, londonDay, londonTime } from './time.mjs';
import { safeUrl } from './storage.mjs';

const scope = 'https://www.googleapis.com/auth/calendar.events.readonly';
let loadingIdentity;

export function prepareIdentity() {
  if (window.google?.accounts?.oauth2) return Promise.resolve(window.google.accounts.oauth2);
  if (loadingIdentity) return loadingIdentity;
  loadingIdentity = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => window.google?.accounts?.oauth2
      ? resolve(window.google.accounts.oauth2)
      : reject(new Error('Google sign-in is unavailable.'));
    script.onerror = () => reject(new Error('Google sign-in could not load.'));
    document.head.append(script);
  }).catch(error => {
    loadingIdentity = undefined;
    throw error;
  });
  return loadingIdentity;
}

export function authorize(identity, clientId) {
  return new Promise((resolve, reject) => {
    const client = identity.initTokenClient({
      client_id: clientId,
      scope,
      callback: response => {
        if (!response.access_token || !identity.hasGrantedAllScopes(response, scope)) {
          reject(new Error('Google Calendar read access was not granted.'));
        } else {
          resolve({ value: response.access_token, expires: Date.now() + Number(response.expires_in || 3600) * 1000 });
        }
      },
      error_callback: () => reject(new Error('Google sign-in was closed or could not open.')),
    });
    client.requestAccessToken();
  });
}

function toEvent(item, calendar) {
  if (item.status === 'cancelled' || item.eventType === 'workingLocation') return null;
  const self = item.attendees?.find(person => person.self);
  if (self?.responseStatus === 'declined') return null;
  const allDay = Boolean(item.start?.date);
  if (!item.start || !item.end) return null;
  const start = allDay ? londonTime(item.start.date) : Date.parse(item.start.dateTime);
  const end = allDay ? londonTime(item.end.date) : Date.parse(item.end.dateTime);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  return {
    id: `${calendar}:${item.id}`, uid: item.iCalUID, start, end, allDay,
    title: item.summary || 'Busy', busy: item.transparency !== 'transparent',
    location: item.location || '', url: safeUrl(item.htmlLink),
  };
}

export async function fetchCalendar(token, ids, now, signal) {
  const day = londonDay(now);
  const params = {
    timeMin: new Date(londonTime(day)).toISOString(),
    timeMax: new Date(londonTime(addDays(day, 8))).toISOString(),
    timeZone: 'Europe/London', singleEvents: 'true', orderBy: 'startTime',
    maxResults: '250',
    fields: 'nextPageToken,items(id,iCalUID,summary,start,end,location,status,transparency,eventType,htmlLink,attendees(self,responseStatus))',
  };
  const pages = await Promise.all(ids.map(async id => {
    const events = [];
    const query = new URLSearchParams(params);
    do {
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(id)}/events?${query}`,
        { headers: { Authorization: `Bearer ${token}` }, signal, cache: 'no-store' });
      if (!response.ok) {
        const error = new Error(`Calendar refresh failed (Google returned ${response.status}).`);
        error.status = response.status;
        throw error;
      }
      const page = await response.json();
      for (const item of page.items || []) {
        const event = toEvent(item, id);
        if (event) events.push(event);
      }
      if (!page.nextPageToken) break;
      query.set('pageToken', page.nextPageToken);
    } while (true);
    return events;
  }));
  const seen = new Set();
  return pages.flat().filter(event => {
    const key = event.uid ? `${event.uid}:${event.start}` : event.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
