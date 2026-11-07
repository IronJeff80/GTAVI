# 🌴 GTA VI OBS Overlays Suite (v0.1.7)

A modular, customizable OBS Studio Browser Source overlay suite inspired by **Grand Theft Auto VI**. Powered by **Streamer.bot WebSockets** and built for **YouTube Live** creators.

🔗 **Live Setup & Testing Hub:** [https://2smokinbarrels.com/GTA-VI-WalkOn-Card/setup.html](https://2smokinbarrels.com/GTA-VI-WalkOn-Card/setup.html)

---

## ✨ What's New in v0.1.7
* **Streamer.bot 1.0.7 Stable support** — separate import button and code for users on Streamer.bot 1.0.7.
* **Streamer.bot 1.1.0 Alpha support** — separate import button and code for users on Streamer.bot 1.1.0 Alpha.
* Import codes live in the `streamerbot/` folder.
* 1.0.7 imports do not work on 1.1.0 Alpha and vice versa — choose the button that matches your Streamer.bot version.

## Streamer.bot Setup (Quick Start)
1. Open the setup page and go to the **General** tab.
2. Click the button that matches your Streamer.bot version (**1.0.7 Stable** or **1.1.0 Alpha**).
3. Follow the numbered steps in the modal (Import → Run Initialize action → Enable WebSocket → Add Browser Source in OBS).
4. Test using the buttons on the Test tab.

---

## 📁 Project Folder Structure

```text
gta6-obs-overlays/
├── css/
│   └── overlays.css
├── js/
│   └── overlays.js
├── assets/
│   └── backgrounds/
│       └── backgrounds.json
├── streamerbot/
│   ├── Streamer.Bot-1.0.7-ImportCode.txt
│   ├── Streamer.Bot-1.1.0-Alpha-ImportCode.txt
│   ├── GTA_Master_Alerts.cs
│   ├── GTA_Shoutout.cs
│   ├── GTA_LookupYouTubeUser.cs
│   └── GTA_QA_Highlight.cs
├── gta-overlay.html
├── setup.html
└── README.md
```

## Requirements
- OBS Studio
- Streamer.bot 1.0.7 or 1.1.0 Alpha (with WebSocket Server enabled)
- YouTube Live connection in Streamer.bot

## Backgrounds
- Place image files in `assets/backgrounds/`.
- Edit `assets/backgrounds/backgrounds.json` to list the filenames (array of strings).
- The setup page automatically loads the list into the Global Background dropdown and all per-widget background dropdowns.
- Each widget can use the global background or choose its own (or None for solid fill).
