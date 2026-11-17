# GTA VI OBS Overlays Suite (v0.3.2)

A modular OBS Studio browser-source overlay suite inspired by **Grand Theft Auto VI**. Powered by **Streamer.bot WebSockets** for YouTube Live.

Open `setup.html` (or run the local dev server below) to build the OBS browser-source URLs.

## What's new in v0.3.2

- On the live site, add a custom background by pasting a direct https image link. OBS loads that link. The link is stored in the overlay URL and in Import/Export.
- Uploading a file still works only in a local copy running `npm run dev`, because the public site cannot save files.

## What's new in v0.3.1

A modular OBS Studio browser-source overlay suite inspired by **Grand Theft Auto VI**. Powered by **Streamer.bot WebSockets** for YouTube Live and Twitch.

Open `setup.html` (or run the local dev server below) to build the OBS browser-source URLs.

## Twitch support

- **Platform switch (YouTube / Twitch)** at the top of the setup page, next to the language. It adds `platform=youtube` or `platform=twitch` to the overlay URL, and the overlay uses the matching names everywhere. YouTube is the default and looks the same as before.

  The setup page shows only the current platform's panels. On Twitch the YouTube Events panel, the YouTube Member Emotes / Add New Emote / Import JSON panels, the Live Subscriber Count panel and the YouTube goal fields are hidden (Twitch handles its own emotes). On YouTube the Twitch panels are hidden. The two platforms share no alert rows or goal fields.

  Twitch alerts (Alerts tab, Twitch Events):

  | Row | Twitch trigger | Overlay `alertType` | Settings (`al_` on/off, `ac_` color, `ad_` seconds) |
  |---|---|---|---|
  | Subs | Subscription | `twSub` | `twsub` |
  | Re-subs | Resubscription | `twResub` | `twrs` |
  | Gift Subs | Gift Subscription | `twGiftSub` | `twgs` |
  | Sub Bombs | Gift Bomb | `twGiftBomb` | `twgb` |
  | Cheers / Bits | Cheer | `twBits` | `twbits` |
  | New Follower | Follow | `follow` | `fol` |
  | Incoming Raid | Raid | `raid` | `rd` |

  Payloads from an older `GTA_Alert` action (`sub`, `milestone`, `gift`, `giftRec`, `jewels` with the Platform set to Twitch) are still shown, under the matching Twitch row.

  Twitch goal bars (Goals tab, Twitch):

  | Bar | Count / goal globals | Filled by (Twitch import) |
  |---|---|---|
  | Subscriptions | `subCount` / `subGoal` | `GTA_GoalBars_TwitchCounts` (Get Subscriber Count on Follow, Sub, Gift Sub, Stream Online) |
  | Followers | `followerCount` / `followerGoal` | `GTA_GoalBars_TwitchCounts` (Get Follower Count) |
  | Sub Gifts | `subGiftsCount` / `subGiftsGoal` | `GTA_GoalBars_TwitchGifts` (+1 per Gift Sub) |
  | Bits | `bitsCount` / `bitsGoal` | `GTA_GoalBars_TwitchBits` (adds `%bits%` on Cheer) |

  "[Settings] Set Goal Bar Goals (Stream Online)" sets the goals (`subGoal` 100, `followerGoal` 1000, `subGiftsGoal` 100, `bitsGoal` 1000) and resets `subGiftsCount` and `bitsCount`. A config file saved before this change moves its Twitch goal titles and variables into the Twitch fields when you import it.
- **Separate Streamer.bot imports per platform.** The setup page's "Streamer.bot 1.1.0 Alpha" button gives the import that matches the Platform switch:
  - YouTube: `streamerbot/Streamer.Bot-1.1.0-Alpha-ImportCode.txt` (YouTube actions and triggers only, same as before plus the updated scripts).
  - Twitch: `streamerbot/Streamer.Bot-1.1.0-Alpha-Twitch-ImportCode.txt` (Twitch triggers only: alerts, First 5, walk-on, lookup, `!so` / `!highlight` on Twitch chat, Twitch goal bars; no YouTube actions).
  - The 1.0.7 import is YouTube-only, so its button is hidden on Twitch. A combined YouTube + Twitch import is not available yet.
- `GTA_QA_Highlight.cs` finds the Twitch avatar for Twitch highlights.
- Twitch alerts arrive through `streamerbot/GTA_Master_Alerts.cs` (`GTA_Alert`), one action for every Twitch trigger: Follow, Cheer, Subscription, Resubscription, Gift Subscription, Gift Bomb and Raid. It sends the Twitch alert types in the table above. Gift subs that are part of a gift bomb are skipped (the bomb shows as one Sub Bombs alert).
- **Test runs on Twitch use a random follower.** When you test `GTA_Alert` or `GTA_First5` in Streamer.bot (the Test button on a trigger, or the Test trigger), the alert or First 5 shows the name and picture of a random follower of your channel, so you can check the overlay with real pictures before going live. The 100 newest followers are fetched from Twitch at most once every 10 minutes and shown in shuffled order. If Twitch returns no followers (none yet, or the Twitch connection has no follower access) or a picture can't be found, the test uses the stock name and picture and Streamer.bot logs a `[GTA-Test]` warning. Real events never use a random follower. YouTube tests are unchanged.
  - Streamer.bot's own Test trigger does not say which platform it is for. `[Settings] GTA Platform (Twitch)` / `[Settings] GTA Platform (YouTube)` saves the global `gtaPlatform` when Streamer.bot starts. Run it once by hand after importing. Tests from a platform's own triggers (Twitch Follow, YouTube Super Chat, ...) ignore it.
  - Test runs of First 5 skip the 5-per-stream counter, so testing does not use up the real first chatters. Users in the "No First Words" group are still excluded. Test pictures still take a spot in the overlay's row until it clears after the end delay, or until you refresh the browser source before going live.
- Twitch chat now shows in the setup preview, not only in OBS.
- New scripts: `streamerbot/GTA_WalkOnTwitch.cs` (Twitch walk-on card) and `streamerbot/GTA_LookupTwitchUser.cs` (the Test tab uses it when the platform is Twitch). `GTA_Shoutout.cs` resolves Twitch users and replies in Twitch chat.
- **Channel links and Auto Shoutouts on First Words (Twitch).** `streamerbot/GTA_FirstWordsLink.cs` runs in "[Settings] Save user Vars on First Words":
  - A channel link the viewer already has saved (`channelLink` user variable, for example a custom link from your channel link command) is kept. Otherwise it saves `https://twitch.tv/<login>`. Older imports saved the broken `https://twitch.tv/%userName%`; that is replaced the next time the viewer chats.
  - Viewers in the Streamer.bot user group **Auto Shoutouts** get `GTA_Shoutouts` run for them on First Words (chat message, overlay shoutout and the text-to-speech step).
  - `!so` uses `https://twitch.tv/<name>` when the saved link is missing or broken.
- Streamer.bot must have your Twitch account connected.

## What's new in v0.3.1

- Chat Box avatar, badge, caps, shadow, and role-accent toggles update the preview immediately.
- Fill opacity steps by 1.
- Chat Box has a background for the box and a separate background for each message.
- Role Accent paints a moderator, member, or viewer border on that message.
- Upload your own backgrounds on the Settings tab. The overlay URL stores `assets/backgrounds/user/…`, and Export / Import carries the image files.

## What's new in v0.3.0

A modular OBS Studio browser-source overlay suite inspired by **Grand Theft Auto VI**. Powered by **Streamer.bot WebSockets** for YouTube Live.

Open `setup.html` (or run the local dev server below) to build the OBS browser-source URLs.

## What's new in v0.3.0

- Chat Box widget: a stacked chat feed separate from the horizontal chat bar. Themes are Boxes, Bubbles, Lines, and Cards. Also set animation, newest-at top or bottom, left or right, name position, size, colors, background, shadow, and filters.
- Check **8. Chat Box** under Modules to Generate. It is off until you turn it on, so existing sources stay unchanged.

## What's new in v0.2.9

A modular OBS Studio browser-source overlay suite inspired by **Grand Theft Auto VI**. Powered by **Streamer.bot WebSockets** for YouTube Live.

Open `setup.html` (or run the local dev server below) to build the OBS browser-source URLs.

## What's new in v0.2.9

- Chat, alert, and goal text is escaped before it is written into the page. A chat message can no longer inject HTML.

## What's new in v0.2.8

- OBS Connection on the General tab: host, port, and WebSocket password, with a connected/disconnected pill next to Streamer.bot.
- Live tuning goes through that OBS WebSocket into browser sources that use the Live URL. The old same-browser channel could not reach OBS.

## What's new in v0.2.7

- Pin Visible now also shows Walk-On, Alerts, Shoutout, Q&A, First 5, and Goals on live OBS sources (`live=1`). Uncheck it when you are done tuning so those widgets hide again until a real event.

## What's new in v0.2.6

- Frosted Glass is a background choice on the global texture and on every widget background. It uses the card fill color at low opacity with a blur, and no image.
- Custom color palettes. Name the current colors and click Save Palette. They stay in this browser, ride along in Export, and come back on Import. Delete only removes a saved palette, not VI Game or VI Marketing.

## What's new in v0.2.5

- Live OBS mode. Copy the **Live** URL (adds `&live=1`) into a browser source once. On the General tab, connect to the OBS WebSocket (default port 4455, plus your password). While that connection is up and this page stays open, every change appears in the Live sources immediately. OBS must be 28 or newer so browser sources can receive the event.

## What's new in v0.2.4

- Custom goal counts are read from both persisted and non-persisted Streamer.bot globals. A non-persisted count no longer stays at 0 when the goal variable is persisted.
- The General tab has an Installation Video link between Streamer.bot Import and Live Subscriber Count.

## What's new in v0.2.3

- Each YouTube alert on the Events & Accent Colors panel has its own duration. `0` uses the global alert time. Any other number of seconds overrides it. All eight default to `0`.

## What's new in v0.2.2

- Goal bars read money values such as `$0.00` and `$50.00`. The fill uses the number. The label keeps the original text, so that pair shows `$0.00 / $50.00` instead of `0 / 0`.
- The Super Chat and Super Sticker goal defaults to the title `Super Chats/Stickers`.
- Milestone, Super Chat, and Super Sticker alert messages use the same member-emote and back-to-back emoji rendering as chat. Paste the updated `streamerbot/GTA_Master_Alerts.cs` into the alert action so YouTube `%emotes%` and `%parts%` are sent with the message.

## What's new in v0.2.1

- The General tab explains the live subscriber count. Pick Chrome or Firefox, then switch between the instructions and that browser's Tampermonkey script (`tampermonkey/chrome.js` or `tampermonkey/firefox.js`).
- Enable the two Streamer.bot actions for that browser and disable the other pair. Leave `Update Sub Count` on. The Studio window has to stay open and not minimized. The count does not move if Streamer.bot is closed.

## What's new in v0.2.0

- Settings sits right after General. It holds global fonts and the shared background, the palette, and YouTube member emotes. Colors and Emotes are no longer their own tabs.
- Every panel can be collapsed or expanded. The choice is remembered in this browser.
- Panel notes, goal labels, backgrounds, the import window, and the Portuguese (BR) UI are translated. The product name stays “First 5”.

## What's new in v0.1.16

- Chat ignore-groups is gone. `YouTube.Message` and `Twitch.ChatMessage` do not include `userGroups`. That name only exists inside a Streamer.bot action (`%userGroups%`, a comma-separated list), which the chat bar does not run. Command prefixes and ignored user names still filter chat.

## What's new in v0.1.15

- Goal Bars include Membership Gifts (`membershipGiftsCount` / `membershipGiftsGoal`) and Super Chats (`superCount` / `superGoal`). Both are on by default.
- Custom goals can be added on the Goals tab. Each one is a title plus a count global and a goal global.

## What's new in v0.1.14

- The Q&A highlight action now sends YouTube `%emotes%` and `%parts%` with the message. Paste the updated `streamerbot/GTA_QA_Highlight.cs` into the highlight action. The overlay already draws those images.

## What's new in v0.1.13

- Goal Bars have an accent color (teal, pink, purple, yellow). Default is teal. It paints the top edge and the leading color of each bar.
- Shoutouts default to `assets/backgrounds/Palms-Vertical.webp`. Choosing None still keeps a solid fill.
- YouTube member emotes from the Streamer.bot global `memberEmojiMap` render in horizontal chat and Q&A, including codes with no space between them (`:_3stars::_treasure:`).
- Q&A uses the same back-to-back emoji treatment as the chat bar, so the second emoji is not drawn as a link.
- The Emotes tab lists, edits, imports, and saves that map. If `memberEmojiMap` is missing, **Create memberEmojiMap** writes it. Streamer.bot has no WebSocket call to set a global, so the button runs the action `API_SaveEmotes` or `GTA_SetMemberEmojiMap` (`streamerbot/GTA_SetMemberEmojiMap.cs`).

## What's new in v0.1.12

- Ticker mode animates the whole goal card on and off with the existing show and hide animations. During the gap and the repeat delay the card is off screen, not an empty shell.
- Fresh defaults for First 5, Goal Bars, and horizontal chat match the current stream layout (ticker timing, Palms goal background, goal variable names, chat avatars on, ignored group `bots`).

## What's new in v0.1.11

- Goal Bars paint the selected background on the card itself (None stays a solid fill).
- Updating a goal count or target in OBS no longer snaps a ticker back to the inline group.
- Horizontal chat keeps back-to-back emoji and custom emotes as images, including YouTube emotes with no space between them.
- First 5 recenters the avatar group as each person arrives, so OBS matches the centered preview.

## What's new in v0.1.10

All seven widgets now share one interaction contract: drag, corner scale, alignment, and two-way sync with the settings panel.

- Goal Bars stay on screen in OBS (they are a persistent widget, not a toast), fill from Streamer.bot persisted globals, and support inline or ticker playback.
- Dragging or scaling Goal Bars or First 5 writes the same fields the panel edits, including vertical layout.
- First 5 container is positioned from the top-left. Avatar size replaces container scale. Dragging the avatar row moves the group inside the container and does not move the container.
- The palette dropdown (VI Game / VI Marketing) writes the color pickers and updates the live preview, including goal bar fills.
- Vertical layout tabs show that layout's position controls (the vertical fields were previously stuck hidden).
- Test tab includes Goal Bars.

## Run locally

Use a **new folder**. Do not copy an older version over this one.

```text
npm install
npm run dev
```

Then open `http://localhost:5173/setup.html`.

## Streamer.bot

1. On the General tab, click the button that matches your Streamer.bot version (1.0.7 Stable or 1.1.0 Alpha).
2. Import the code, run **[GTA_Initialize Globals]**, and enable the WebSocket server.
3. Copy the generated browser-source URL into OBS.

First 5 plays `assets/sfx/platinum.mp3` when that toggle is on (default volume 57%). Put your sound file at that path if it is not already in the folder. A missing file is ignored.

Goal bar counts use the global names on the Goals tab. Defaults are `likesCount` / `LikesGoal`, `memberCount` / `memberGoal`, `jewelsCount` / `JewelsGoal`, `liveSubCount` / `liveSubGoal`, `membershipGiftsCount` / `membershipGiftsGoal`, and `superCount` / `superGoal`. The goal card accent defaults to teal.

Member emotes live in the persisted global `memberEmojiMap` (an object of codes to image URLs). The Emotes tab reads it when Streamer.bot is connected. To create or update it, add a C# action named `GTA_SetMemberEmojiMap` using `streamerbot/GTA_SetMemberEmojiMap.cs`, or keep an existing action named `API_SaveEmotes` that sets that global from the `emotesJson` argument.

## Folder structure

```text
gta6-obs-overlays/
├── css/overlays.css
├── js/overlays.js
├── assets/backgrounds/
├── assets/sfx/platinum.mp3
├── streamerbot/
├── gta-overlay.html
├── setup.html
└── README.md
```

## Backgrounds

Put image files in `assets/backgrounds/` and list the filenames in `assets/backgrounds/backgrounds.json`. The setup page loads that list into every background dropdown.
