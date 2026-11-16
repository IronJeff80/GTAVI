# GTA VI OBS Overlays Suite (v0.3.1)

A modular OBS Studio browser-source overlay suite inspired by **Grand Theft Auto VI**. Powered by **Streamer.bot WebSockets** for YouTube Live.

Open `setup.html` (or run the local dev server below) to build the OBS browser-source URLs.

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
