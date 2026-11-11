import { test } from 'node:test';
import assert from 'node:assert/strict';
import { durationSeconds, spotifyPlaylistId } from '../src/lib/mixtape.mjs';

test('mixtape durations support minutes and seconds and reject malformed entries', () => {
  assert.equal(durationSeconds('4:05'), 245);
  assert.equal(durationSeconds('240:00'), 14400);
  for (const input of ['0:00', '1:60', '1:2', '-1:10', '1.5']) {
    assert.equal(durationSeconds(input), 0);
  }
});

test('the player accepts only Spotify playlist URLs and ignores tracking parameters', () => {
  const id = '12345678901234567890ab';
  assert.equal(spotifyPlaylistId(`https://open.spotify.com/playlist/${id}?si=example`), id);
  for (const input of [
    `https://open.spotify.com.example.com/playlist/${id}`,
    `https://open.spotify.com@evil.example/playlist/${id}`,
    `https://open.spotify.com/track/${id}`,
    `http://open.spotify.com/playlist/${id}`,
  ]) assert.equal(spotifyPlaylistId(input), '');
});
