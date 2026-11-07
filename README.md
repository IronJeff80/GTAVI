# 🌴 GTA VI OBS Overlays Suite (v0.1.6)

A modular, customizable OBS Studio Browser Source overlay suite inspired by **Grand Theft Auto VI**. Powered by **Streamer.bot WebSockets** and built for **YouTube Live** creators.

🔗 **Live Setup & Testing Hub:** [https://2smokinbarrels.com/GTA-VI-WalkOn-Card/setup.html](https://2smokinbarrels.com/GTAVI/setup.html)

---

## ✨ What's New in v0.1.6
* **Streamer.bot Import Section** (General Tab):
  * One-click access to the full Streamer.bot import code + step-by-step setup instructions in a modal.
  * Includes the `[GTA_Initialize Globals]` action that creates the required `viShoutOuts` and `viChatHighlight` global variables.
  * Copy button and Download .txt button for the import code.
* All previous modules (Walk-On Card, Alerts, Shoutout Toast, Chat, Q&A) remain fully supported.

## Streamer.bot Setup (Quick Start)
1. Open the live setup page and go to the **General** tab.
2. Click **Open Import Code & Instructions**.
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
│   └── gta6-bg.webp
├── streamerbot/
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
- Streamer.bot (with WebSocket Server enabled)
- YouTube Live connection in Streamer.bot

## Backgrounds
- Place image files in `assets/backgrounds/`.
- Edit `assets/backgrounds/backgrounds.json` to list the filenames (array of strings).
- The setup page automatically loads the list into the Global Background dropdown and all per-widget override dropdowns.
- Each widget (Walk-On Card, Shoutout, Q&A) can use the global background or choose its own override (or none).
