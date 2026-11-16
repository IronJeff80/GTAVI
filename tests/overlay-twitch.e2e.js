// Twitch alert rendering check for gta-overlay.html.
// Run: npm i -D playwright && node tests/overlay-twitch.e2e.js   (starts its own static server)
// Payloads mirror what streamerbot/GTA_Master_Alerts.cs broadcasts for Twitch triggers.
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');

const root = path.resolve(__dirname, '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const file = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

(async () => {
  await new Promise(r => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.route(u => !u.href.startsWith(base), r => r.abort());

  async function fire(payload, query = '') {
    // Twitch names come from the overlay's Platform setting (platform=twitch), not from the payload.
    const plat = payload.platform === 'twitch' ? '&platform=twitch' : '';
    await page.goto(`${base}/gta-overlay.html?modules=alerts&aDur=1${plat}${query}`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.gtaOverlay);
    await page.evaluate((p) => window.postMessage({ type: 'TRIGGER_ALERT_TEST', payload: p }, '*'), payload);
    await page.waitForFunction(() => document.getElementById('alert-container').classList.contains('animate-in'));
    return page.evaluate(() => ({
      cls: document.getElementById('alert-box').className,
      accent: document.getElementById('alert-box').style.getPropertyValue('--alert-accent'),
      title: document.getElementById('alert-event-name').textContent,
      user: document.getElementById('alert-user-name').textContent,
      body: document.getElementById('alert-body').textContent
    }));
  }
  const tw = (extra) => ({ event: 'GTA_Alert', platform: 'twitch', userName: 'Lucia', userProfileUrl: '', ...extra });

  let r = await fire(tw({ alertType: 'follow', triggerName: 'New Follower' }));
  assert.match(r.cls, /alert-follow/); assert.match(r.cls, /platform-twitch/); assert.equal(r.title, 'New Follower');

  r = await fire(tw({ alertType: 'sub', triggerName: 'Sub', levelName: '1' }));
  assert.match(r.cls, /alert-sub/); assert.equal(r.title, 'New Subscriber'); assert.match(r.body, /Tier\s*1/);

  r = await fire(tw({ alertType: 'milestone', triggerName: 'Resub', levelName: '2', months: 14 }));
  assert.equal(r.title, 'Resub'); assert.match(r.body, /14 Months/); assert.match(r.body, /Tier\s*2/);

  r = await fire(tw({ alertType: 'gift', triggerName: 'Gift Subs', count: 5 }));
  assert.match(r.body, /5 Subs/); assert.doesNotMatch(r.body, /Memberships/);

  r = await fire(tw({ alertType: 'giftRec', triggerName: 'Gift Sub Received', gifterUser: 'TommyV' }));
  assert.match(r.body, /TommyV/);

  // Bits are the Twitch equivalent of Jewels: same slot, "Bits" label.
  r = await fire(tw({ alertType: 'jewels', triggerName: 'Bits Cheered', jewelsAmount: 500, message: 'Take my bits!' }));
  assert.match(r.cls, /alert-jewels/); assert.match(r.body, /500 Bits/); assert.doesNotMatch(r.body, /Jewels/);
  assert.match(r.body, /Take my bits!/);

  r = await fire(tw({ alertType: 'raid', triggerName: 'Incoming Raid', userName: 'BigStreamer', count: 42 }));
  assert.match(r.cls, /alert-raid/); assert.equal(r.user, 'BigStreamer'); assert.match(r.body, /42 Viewers/);

  // YouTube Jewels unchanged.
  r = await fire({ alertType: 'jewels', triggerName: 'Jewels Gifted', userName: 'Jason', jewelsAmount: 150 });
  assert.match(r.cls, /platform-youtube/); assert.match(r.body, /150 Jewels/);

  // Toggles: al_fol=0 / al_rd=0 suppress follow/raid; Bits follow al_jwl.
  for (const [q, p] of [['&al_fol=0', tw({ alertType: 'follow' })], ['&al_rd=0', tw({ alertType: 'raid', count: 1 })], ['&al_jwl=0', tw({ alertType: 'jewels', jewelsAmount: 1 })]]) {
    await page.goto(`${base}/gta-overlay.html?modules=alerts&aDur=1&platform=twitch${q}`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.gtaOverlay);
    await page.evaluate((x) => window.postMessage({ type: 'TRIGGER_ALERT_TEST', payload: x }, '*'), p);
    await page.waitForTimeout(400);
    assert.equal(await page.evaluate(() => document.getElementById('alert-container').classList.contains('animate-in')), false, `toggle ${q} should suppress`);
  }

  // Accent colour applied for Twitch-only types.
  r = await fire(tw({ alertType: 'follow' }), '&ac_fol=yellow');
  assert.match(r.accent, /gta-yellow/, 'ac_fol=yellow applied');
  r = await fire(tw({ alertType: 'raid', count: 1 }));
  assert.match(r.accent, /gta-pink/, 'raid defaults to pink');

  console.log('overlay-twitch e2e: all checks passed');
  await browser.close();
  server.close();
})().catch((e) => { console.error(e); process.exit(1); });
