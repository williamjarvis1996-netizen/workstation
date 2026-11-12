const storageKey = 'workstation-after-hours-v1';
const tapeLimit = 4 * 60 * 60;
let state;

function load() {
  try { return JSON.parse(localStorage.getItem(storageKey)) || {}; }
  catch { return {}; }
}

function save() {
  try { localStorage.setItem(storageKey, JSON.stringify(state)); return true; }
  catch { return false; }
}

export function durationSeconds(value) {
  const match = /^(\d{1,3}):([0-5]\d)$/.exec(value);
  return match ? Number(match[1]) * 60 + Number(match[2]) : 0;
}

export function spotifyPlaylistId(value) {
  try {
    const url = new URL(value);
    if (url.origin !== 'https://open.spotify.com' || url.username || url.password) return '';
    return /^\/playlist\/([A-Za-z0-9]{22})\/?$/.exec(url.pathname)?.[1] || '';
  } catch { return ''; }
}

function timecode(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = String(seconds % 60).padStart(2, '0');
  return minutes < 60 ? `${minutes}:${rest}`
    : `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}:${rest}`;
}

if (typeof document !== 'undefined') document.addEventListener('astro:page-load', () => {
  const root = document.getElementById('marathon-mixtape');
  if (!root) return;
  state ??= load();
  const find = selector => root.querySelector(selector);
  const tape = find('#mixtape-queue');
  const playerForm = find('#mixtape-player');
  function renderTape() {
    const items = state.tape || [];
    const total = items.reduce((sum, item) => sum + item.seconds, 0);
    find('[data-runtime]').textContent = timecode(total);
    find('[data-tape-progress]').value = Math.min(total, tapeLimit);
    find('[data-tape-balance]').textContent = total > tapeLimit
      ? `${timecode(total - tapeLimit)} over the listening window`
      : `${timecode(tapeLimit - total)} left to fill`;
    find('[data-queue-count]').textContent = `(${items.length})`;
    find('[data-tape-items]').replaceChildren(...items.map((item, index) => {
      const row = document.createElement('li');
      row.textContent = `${item.title} · ${timecode(item.seconds)} `;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Remove';
      remove.setAttribute('aria-label', `Remove ${item.title}`);
      remove.addEventListener('click', () => {
        items.splice(index, 1);
        find('[data-tape-status]').textContent = save() ? 'Removed from the tape.' : 'Removed for this visit only.';
        renderTape();
        (find('[data-tape-items] button') || find('.widget details summary')).focus();
      });
      row.append(remove);
      return row;
    }));
  }

  tape.addEventListener('submit', event => {
    event.preventDefault();
    const title = tape.elements.namedItem('title').value.trim();
    const seconds = durationSeconds(tape.elements.namedItem('duration').value.trim());
    if (!title || !seconds) {
      find('[data-tape-status]').textContent = 'Enter a title and a duration greater than 0:00.';
      return;
    }
    (state.tape ??= []).push({ title, seconds });
    find('[data-tape-status]').textContent = save() ? 'Added to the tape.' : 'Added for this visit only.';
    tape.reset();
    renderTape();
  });
  playerForm.elements.namedItem('playlist').value = state.playlist || '';
  playerForm.addEventListener('submit', event => {
    event.preventDefault();
    const id = spotifyPlaylistId(playerForm.elements.namedItem('playlist').value.trim());
    if (!id) {
      find('[data-tape-status]').textContent = 'Use a playlist link from open.spotify.com.';
      return;
    }
    state.playlist = 'https://open.spotify.com/playlist/' + id;
    playerForm.elements.namedItem('playlist').value = state.playlist;
    const player = document.createElement('iframe');
    player.src = 'https://open.spotify.com/embed/playlist/' + id;
    player.title = 'Spotify playlist';
    player.height = '152';
    player.allow = 'encrypted-media; fullscreen; picture-in-picture';
    find('[data-player]').replaceChildren(player);
    find('[data-tape-status]').textContent = save() ? 'Spotify player loaded.' : 'Spotify player loaded for this visit.';
  });
  renderTape();
});
