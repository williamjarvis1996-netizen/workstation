import { createServer } from 'node:http';

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const isPersonal = process.argv.includes('--personal');

if (!clientId || !clientSecret) {
  console.error('Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.');
  console.error('Usage: GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... node scripts/google-auth-helper.mjs [--personal]');
  console.error('');
  console.error('  (no flag)   → generates GOOGLE_CALENDAR_REFRESH_TOKEN for the work account');
  console.error('  --personal  → generates GOOGLE_CALENDAR_PERSONAL_REFRESH_TOKEN for the personal account');
  process.exit(1);
}

const PORT = 3000;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;
const SCOPE = 'https://www.googleapis.com/auth/calendar.events.readonly';

const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
  client_id: clientId,
  redirect_uri: REDIRECT_URI,
  response_type: 'code',
  scope: SCOPE,
  access_type: 'offline',
  prompt: 'consent',
})}`;

const secretName = isPersonal
  ? 'GOOGLE_CALENDAR_PERSONAL_REFRESH_TOKEN'
  : 'GOOGLE_CALENDAR_REFRESH_TOKEN';
const accountLabel = isPersonal ? 'personal (Gmail)' : 'work';

console.log(`\nGenerating refresh token for ${accountLabel} account.\n`);
console.log('1. Open this URL in your browser:\n');
console.log(`   ${authUrl}\n`);
console.log(`2. Sign in with your ${accountLabel} Google account and grant calendar read access.`);
console.log('3. You will be redirected back here automatically.\n');

if (isPersonal) {
  console.log('Note: If your OAuth app is in "Testing" mode, add your personal Gmail');
  console.log('as a test user in Google Cloud Console → APIs & Services → OAuth consent screen.\n');
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname !== '/callback') {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error || !code) {
    res.writeHead(400, { 'Content-Type': 'text/html' });
    res.end('<h1>Authorization failed</h1><p>Check the terminal for details.</p>');
    console.error(`\nAuthorization failed: ${error || 'no code received'}`);
    server.close();
    process.exit(1);
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const body = await tokenRes.text();
      throw new Error(`Token exchange failed (${tokenRes.status}): ${body}`);
    }

    const tokens = await tokenRes.json();

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>Done!</h1><p>You can close this tab. Check the terminal for your refresh token.</p>');

    if (!tokens.refresh_token) {
      console.error('\nNo refresh_token returned. This usually means:');
      console.error('  - The app already has a grant for this user. Revoke it at https://myaccount.google.com/permissions and try again.');
      console.error('  - Or the "prompt=consent" parameter was not sent.\n');
      server.close();
      process.exit(1);
    }

    console.log('\n--- Refresh token obtained ---\n');
    console.log(`${secretName}=${tokens.refresh_token}\n`);
    console.log('Add this to GitHub Secrets (name must match sync.yml):\n');
    console.log(`  gh secret set ${secretName} --body "${tokens.refresh_token}"`);
    if (!isPersonal) {
      console.log(`  gh secret set GOOGLE_CALENDAR_CLIENT_ID --body "${clientId}"`);
      console.log(`  gh secret set GOOGLE_CALENDAR_CLIENT_SECRET --body "${clientSecret}"`);
    }
    console.log('');
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end('<h1>Error</h1><p>Check the terminal.</p>');
    console.error(`\n${err.message}`);
  }

  server.close();
});

server.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT} for OAuth callback...\n`);
});
