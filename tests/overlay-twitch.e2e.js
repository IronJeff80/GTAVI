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

  // Twitch alert types (GTA_Master_Alerts.cs v0.2.4 Twitch-native).
  r = await fire(tw({ alertType: 'twSub', triggerName: 'Sub', levelName: '1' }));
  assert.match(r.cls, /alert-twSub/); assert.equal(r.title, 'New Subscriber'); assert.match(r.body, /Tier\s*1/);

  r = await fire(tw({ alertType: 'twResub', triggerName: 'Resub', levelName: '2', months: 14 }));
  assert.equal(r.title, 'Resub'); assert.match(r.body, /14 Months/); assert.match(r.body, /Tier\s*2/);

  r = await fire(tw({ alertType: 'twGiftBomb', triggerName: 'Gift Subs', count: 5 }));
  assert.equal(r.title, 'Gift Subs'); assert.match(r.body, /5 Subs/); assert.doesNotMatch(r.body, /Memberships/);

  r = await fire(tw({ alertType: 'twGiftSub', triggerName: 'Gift Sub Received', gifterUser: 'TommyV' }));
  assert.equal(r.title, 'Gift Sub Received'); assert.match(r.body, /TommyV/);

  // Payload text is escaped (v0.2.9): an HTML gifter name renders as text, not markup.
  r = await fire(tw({ alertType: 'twGiftSub', gifterUser: '<img src=x onerror="window.__xss=1">', count: '<b>9</b>' }));
  assert.match(r.body, /<img src=x/, 'gifter name shown as text');
  assert.equal(await page.evaluate(() => document.querySelectorAll('#alert-body img').length + (window.__xss || 0)), 0, 'no injected element');
  r = await fire(tw({ alertType: 'raid', userName: 'R', count: '<i>7</i>' }));
  assert.match(r.body, /<i>7<\/i> Viewers/, 'raid count escaped');

  r = await fire(tw({ alertType: 'twBits', triggerName: 'Bits Cheered', jewelsAmount: 500, message: 'Take my bits!' }));
  assert.match(r.cls, /alert-twBits/); assert.match(r.body, /500 Bits/); assert.doesNotMatch(r.body, /Jewels/);
  assert.match(r.body, /Take my bits!/);

  r = await fire(tw({ alertType: 'raid', triggerName: 'Incoming Raid', userName: 'BigStreamer', count: 42 }));
  assert.match(r.cls, /alert-raid/); assert.equal(r.user, 'BigStreamer'); assert.match(r.body, /42 Viewers/);

  // Payloads from the older GTA_Alert action (YouTube types) still play on Twitch, as the matching Twitch row.
  r = await fire(tw({ alertType: 'jewels', jewelsAmount: 100 }), '&ac_twbits=pink');
  assert.match(r.cls, /alert-twBits/); assert.match(r.body, /100 Bits/); assert.match(r.accent, /gta-pink/, 'legacy jewels uses ac_twbits');
  r = await fire(tw({ alertType: 'milestone', levelName: '1', months: 3 }));
  assert.match(r.cls, /alert-twResub/); assert.equal(r.title, 'Resub');

  // YouTube Jewels unchanged.
  r = await fire({ alertType: 'jewels', triggerName: 'Jewels Gifted', userName: 'Jason', jewelsAmount: 150 });
  assert.match(r.cls, /platform-youtube/); assert.match(r.body, /150 Jewels/);

  async function suppressed(query, payload) {
    await page.goto(`${base}/gta-overlay.html?modules=alerts&aDur=1${query}`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.gtaOverlay);
    await page.evaluate((x) => window.postMessage({ type: 'TRIGGER_ALERT_TEST', payload: x }, '*'), payload);
    await page.waitForTimeout(400);
    return page.evaluate(() => !document.getElementById('alert-container').classList.contains('animate-in'));
  }
  // Twitch toggles are their own; the YouTube Jewels toggle no longer affects Bits.
  for (const [q, p] of [['&al_fol=0', tw({ alertType: 'follow' })], ['&al_rd=0', tw({ alertType: 'raid', count: 1 })],
                        ['&al_twbits=0', tw({ alertType: 'twBits', jewelsAmount: 1 })], ['&al_twsub=0', tw({ alertType: 'twSub' })],
                        ['&al_twrs=0', tw({ alertType: 'twResub', months: 2 })], ['&al_twgs=0', tw({ alertType: 'twGiftSub' })],
                        ['&al_twgb=0', tw({ alertType: 'twGiftBomb', count: 2 })], ['&al_twbits=0', tw({ alertType: 'jewels', jewelsAmount: 1 })]]) {
    assert.equal(await suppressed('&platform=twitch' + q, p), true, `toggle ${q} should suppress ${p.alertType}`);
  }
  assert.equal(await suppressed('&platform=twitch&al_jwl=0', tw({ alertType: 'twBits', jewelsAmount: 1 })), false, 'al_jwl must not hide Twitch Bits');
  // Each platform only plays its own alerts.
  assert.equal(await suppressed('', { alertType: 'twSub', userName: 'X' }), true, 'Twitch alert on YouTube');
  assert.equal(await suppressed('', { alertType: 'follow', userName: 'X' }), true, 'Follow on YouTube');
  assert.equal(await suppressed('&platform=twitch', tw({ alertType: 'superchat', amount: '$5' })), true, 'Super Chat on Twitch');

  // Accent colours: Twitch rows have their own settings and defaults.
  r = await fire(tw({ alertType: 'follow' }), '&ac_fol=yellow');
  assert.match(r.accent, /gta-yellow/, 'ac_fol=yellow applied');
  r = await fire(tw({ alertType: 'raid', count: 1 }));
  assert.match(r.accent, /gta-pink/, 'raid defaults to pink');
  r = await fire(tw({ alertType: 'twSub' }), '&ac_sub=pink');
  assert.match(r.accent, /gta-teal/, 'YouTube ac_sub must not colour Twitch subs');
  r = await fire(tw({ alertType: 'twResub', months: 2 }), '&ac_twrs=yellow');
  assert.match(r.accent, /gta-yellow/, 'ac_twrs applied');

  // Goal bars: Twitch has its own four (Subscriptions, Followers, Sub Gifts, Bits); YouTube keeps its six.
  async function goalTitles(query) {
    await page.goto(`${base}/gta-overlay.html?modules=goals&goalsMode=stack${query}`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.gtaOverlay);
    await page.evaluate(() => window.postMessage({ type: 'TRIGGER_GOALS_TEST' }, '*'));
    await page.waitForFunction(() => document.querySelectorAll('.goal-bar').length > 0);
    return page.evaluate(() => [...document.querySelectorAll('.goal-bar .goal-bar-label span:first-child')].map(e => e.textContent));
  }
  assert.deepEqual(await goalTitles('&platform=twitch'), ['Subscriptions', 'Followers', 'Sub Gifts', 'Bits']);
  assert.deepEqual(await goalTitles('&platform=twitch&twGoalsBits=0&twGoalsFollowersTitle=Follows'), ['Subscriptions', 'Follows', 'Sub Gifts']);
  assert.deepEqual(await goalTitles(''), ['Likes', 'Memberships', 'Jewels', 'Subscribers', 'Membership Gifts', 'Super Chats/Stickers']);
  assert.deepEqual(await goalTitles('&goalsJewels=0&twGoalsBits=0'), ['Likes', 'Memberships', 'Subscribers', 'Membership Gifts', 'Super Chats/Stickers']);

  // Chat Box on Twitch: the message has no picture, so it comes from the saved userProfileUrl and fills in afterwards.
  async function chatBoxAvatars(query) {
    await page.goto(`${base}/gta-overlay.html?modules=chatbox&platform=twitch${query}`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.gtaOverlay);
    return page.evaluate(async () => {
      const o = window.gtaOverlay;
      o.client = {
        getUserGlobals: async () => ({ variables: [{ userId: '42', value: 'https://static-cdn.jtvnw.net/lucia.png' }] }),
        getUserGlobal: async () => ({ status: 'ok', variable: { value: '' } })
      };
      o.handleTwitchChatEvent({ message: { text: 'hello', user: { name: 'Lucia', id: '42', role: 1 }, messageId: 'c1' } });
      await new Promise(r => setTimeout(r, 300));
      return [...document.querySelectorAll('#chatbox-list .cb-avatar')].map(i => i.getAttribute('src'));
    });
  }
  assert.deepEqual(await chatBoxAvatars(''), ['https://static-cdn.jtvnw.net/lucia.png'], 'Chat Box shows the saved Twitch picture');
  assert.deepEqual(await chatBoxAvatars('&chatAv=0'), ['https://static-cdn.jtvnw.net/lucia.png'], 'chat bar avatar setting does not affect Chat Box');
  assert.deepEqual(await chatBoxAvatars('&cbAv=0'), [], 'Chat Box Show Avatars off');

  console.log('overlay-twitch e2e: all checks passed');
  await browser.close();
  server.close();
})().catch((e) => { console.error(e); process.exit(1); });
