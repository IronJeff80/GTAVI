---
name: gta-widget-skill
description: "Add a new widget to the GTA VI Widget Hub following the exact same patterns as existing widgets. Use when adding a new overlay module, widget, or toast to the setup page and overlay."
type: workflow
lifecycle: active
---

# GTA Widget Skill — Add a New Widget

Use this checklist every time a new widget is added. Do not skip steps. Do not invent new patterns. Copy the closest existing widget (usually Q&A for centered widgets) and adapt.

## Prerequisites

- Start from a clean clone of the current production tag.
- Identify the closest existing widget to copy (Q&A for centered, Shoutout for side-aligned, Chat for bars).
- Choose a short prefix for the new widget (e.g. `f5` for First 5).

## Checklist

### 1. HTML — setup.html

- [ ] Add tab button in `.tab-nav` after the previous widget.
- [ ] Add module checkbox in the "Modules to Generate" section.
- [ ] Add tab content `<div id="tab-{name}" class="tab-content">` with position, scale, alignment, and appearance panels. Use the same `layout-switcher`, `edit-horiz` / `edit-vert`, `grid-3`, and `toggle-strip` structure as other widgets.
- [ ] Add field IDs to `baseInputs` array (both horizontal and vertical variants).
- [ ] If the widget has a width setting, add both `cfg-{prefix}Width` (default 1920) and `cfg-v_{prefix}Width` (default 1080). Apply scale only to the inner content, not the container, so the width stays fixed.
- [ ] Add alignment/boolean fields to `checkboxToggles` array.
- [ ] Add the module to the URL generation logic (`mods.push('{name}')`).
- [ ] Add translation keys for the tab button, module checkbox, and any new labels to the `i18nDict` in setup.html. Use `data-i18n` attributes.
- [ ] If the widget has a test trigger, add a button in the Test tab and wire its click handler to `sendToBoth({ type: 'TRIGGER_{NAME}_TEST' })`.
- [ ] Update `.tab-nav` grid columns if the number of tabs exceeds the current layout.

### 2. HTML — gta-overlay.html

- [ ] Add the container markup with the same structure as other modules (outer container + inner content).
- [ ] Give the container a unique `id` (e.g. `first5-container`).

### 3. CSS — overlays.css

- [ ] Add the container rule with `position: absolute`, CSS variables for position/scale, `pointer-events: none`, and `opacity: 0` by default.
- [ ] Add `.animate-in` rule that sets `opacity: 1` and `pointer-events: auto`.
- [ ] Add the container to the `body.preview-interactive .*-container.animate-in` outline selectors so the dotted preview border appears.
- [ ] Give the container a `min-width` and `min-height` so the drag hit area does not collapse.
- [ ] Add any widget-specific animation keyframes.

### 4. JS — overlays.js (config)

- [ ] Add `enable{Name}` flag from the `modules` URL param.
- [ ] Add the module to the `modules` object in the config.
- [ ] Add config fields using `getPos()`, `getBool()`, and `params.get()` the same way other widgets do.
- [ ] Add DOM references in the constructor.
- [ ] Hide the container if the module is disabled.

### 5. JS — overlays.js (styling)

- [ ] Add a `recalculate{Name}Coords(baseW, baseH)` method that handles alignment and bounds (copy from `recalculateQACoords`).
- [ ] Call it from `applyGlobalStyles()`.
- [ ] Add the module to `updateDomCoords()` so CSS variables (`--{prefix}-x`, `--{prefix}-y`, `--{prefix}-scale`) are set.
- [ ] In `applyGlobalStyles()`, set accent color, size, and other visual CSS variables.

### 6. JS — overlays.js (interactivity)

Do **not** add a new branch inside `setupDraggable` or `broadcastManipulate`. Every widget goes through one spec.

- [ ] Add an entry to `widgetSpec(modType)` with `el`, `label`, `x`, `y`, `scale` (or `null` if the widget resizes a size field instead), `alignH`, `alignV`, `yDir` (`1` if CSS uses `top`, `-1` if CSS uses `bottom`), `centerX` (true only when CSS `left` is the horizontal center), `recalc`, `msg`, and `payload`.
- [ ] `initStudioInteractivity()` already loops the spec list. Add the new id to that list.
- [ ] `setupDraggable` and `broadcastManipulate` stay generic. The corner handle updates `scale`, except First 5 which updates avatar size.
- [ ] Position is the same edge the CSS uses. Do not add a one-off `translate(-50%)` unless `centerX` is true.

### 7. JS — overlays.js (live update)

- [ ] In the `LIVE_CONFIG_UPDATE` handler, parse the new fields from `s` and assign them to `this.config`.
- [ ] After assignment, re-render placeholders if in preview mode so visual changes (size, shape, animation) appear immediately.

### 8. JS — overlays.js (preview & events)

- [ ] In `setPreviewPinned()`, show placeholders or add `animate-in` when pinned; clear them when unpinned.
- [ ] Add a WebSocket event handler for the widget's custom event.
- [ ] Add a `TRIGGER_{NAME}_TEST` message handler that populates mock data.

### 9. JS — setup.html (sync)

- [ ] Add a `{NAME}_MANIPULATED` listener in the `window.addEventListener('message', ...)` block that updates the corresponding `cfg-` fields and alignment checkboxes, then calls `updateGeneratedUrlOnly()`.

### 10. Version & package

- [ ] Bump the version string in `setup.html` and `README.md`.
- [ ] Package as a zip for testing.

## Verification

After packaging, confirm:

- [ ] The tab button appears and switches to the new tab.
- [ ] The module checkbox appears and is included in the generated URL when checked.
- [ ] Pinning the preview shows the widget with a dotted outline and drag pill.
- [ ] Dragging updates the X/Y fields in the settings panel.
- [ ] Scaling from the corner handle updates the Scale field.
- [ ] Changing X/Y/Scale/Size/Shape/Animation in the settings panel updates the preview without a refresh.
- [ ] The test button (if present) triggers the animation.

## Common Failures

| Symptom | Missing Piece |
|---|---|
| Tab/checkbox/test button missing | String replacement failed; insert by line number instead |
| Drag works but settings don't update | Missing `{NAME}_MANIPULATED` in `broadcastManipulate` or missing listener in setup.html |
| Settings change but preview doesn't move | Missing field parsing in `LIVE_CONFIG_UPDATE` or missing call to `recalculate{Name}Coords` / `updateDomCoords` |
| Scale handle does nothing | Missing resize branch or missing `recalculate{Name}Coords` call after scale change |
| No dotted outline / drag pill | Container not added to preview-interactive selectors or missing `min-width`/`min-height` |
| Placeholders don't update on setting change | Missing re-render call after `LIVE_CONFIG_UPDATE` field assignment |

## Prompting Template

See `widgetAdd.txt` for the copy-paste prompt.
