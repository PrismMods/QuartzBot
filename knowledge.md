# Quartz Mod — Knowledge Base

> The bot reads this file to answer questions. Facts pulled from the Quartz source.
> Current version: v2.0.0 (alpha). Repo: https://github.com/QuartzTeam/Quartz
> Discord: https://discord.gg/mAzAghu5Xq

## Overview

**Q: What is Quartz?**
A: An all-in-one mod for the rhythm game *A Dance of Fire and Ice* (ADOFAI). It bundles many gameplay, visual, overlay/HUD, and editor features into one mod with its own in-game settings menu.

**Q: Who made Quartz?**
A: koren and sbrothers7 (and more contributors). It's a v2 rewrite of koren's original "KorenResourcePack".

**Q: What version is it / is it stable?**
A: v2.0.0, currently in alpha (alpha 63 at time of writing. but do not use this build number dependently. ask the user.). Expect bugs and changes.

**Q: Where do I download it?**
A: GitHub releases: https://github.com/QuartzTeam/Quartz/releases/latest

**Q: Is it free?**
A: Yes. It's open source on GitHub with the GPL-3.0 license.

**Q: Where do I get support / report bugs?**
A: The Discord server: https://discord.gg/mAzAghu5Xq, or GitHub issues.

## Install / Setup

**Q: How do I install Quartz?**
A: Two builds ship each release. `Quartz.zip` is the MelonLoader build (recommended). `QuartzUmm.zip` is the UnityModManager build (only if you already use UMM). Both use the same in-game menu.

**Q: How do I install the MelonLoader build (recommended)?**
A: 1) Download the modlist.org app and Quartz. 2) If you don't have MelonLoader, install it via the modlist.org app. 3) In the app press "Install Mod From File" and pick `Quartz.zip`. Done. (Manual alternative: drop `Quartz.zip` contents into your ADOFAI folder.)

**Q: How do I install on Mac?**
A: There's an auto installer (UMMInstall) for convenience. If not using the auto installer, use the modlist app. Make sure to use the "Copy Native Launch Options" button on the Installed tab and paste it into your Steam launch arguments if you're using the modlist app.
WARNING: If installing manually, clicking replace replaces the whole folder instead of adding files — drag the files in manually to be safe.

**Q: How do I install the UnityModManager build?**
A: Set up UMM for ADOFAI first, then in the UMM installer use "Install mod" and pick `QuartzUmm.zip` (or extract the `Quartz` folder into your UMM mods dir). Open settings with the mod's in-game keybind — the UMM IMGUI panel is NOT used. So do not ask about it. As instructed at the bottom of the screen, use "Alt+K" if on Windows or use "Option+K" if on mac.

**Q: How do I open the Quartz menu?**
A: Press the toggle keybind (default: Alt/Option+K). It's rebindable in settings ("Toggle Menu Keybind").

## Settings / General

**Q: What general settings does Quartz have?**
A: Language, UI Scale, Window Opacity, Accent Color, Fonts (including a separate Settings Window Font), "Show Quartz Settings at Startup", and the menu toggle keybind.

**Q: Does it support multiple languages?**
A: Yes — there's a Language setting. English and Korean are both supported (the README ships in both).

**Q: What are Profiles?**
A: Saveable named setting profiles you can switch between (create, rename, delete; middle-click to set a default).

**Q: Does it update itself?**
A: It has a built-in updater — Check for Updates, view notes, Install, Skip, or Undo an update from the Updates section. But this may break time to time so check the discord for more accurate updates.

**Q: Can I import settings?**
A: Yes, there's an Import option (Interop) for bringing in settings.

## Features — Gameplay

**Q: What is the Key Limiter?**
A: Only counts your allowed keys as gameplay hits (mouse buttons always allowed). Only enforced during play, so menu/editor typing is unaffected.

**Q: What is the Chatter Blocker?**
A: A keyboard chatter blocker. If a key re-fires within a configurable millisecond threshold (a switch "chattering"), the repeat is dropped. Repeats within ~5ms pass through (those are the engine double-reporting, not chatter).

**Q: What is Judgement Restriction / Death Limit?**
A: Restriction fails your run the instant a hit breaks a chosen rule (accuracy floor, Perfect-only, a custom allowed set, or no Too-Early). Death Limit fails the run once misses/overloads exceed a configured cap (useful since those don't end a no-fail run on their own). The fail message is customizable.

**Q: What is Auto Deafen?**
A: Auto-deafens you in Discord once a run passes a configured progress %, and undeafens on death/finish/leave. Works through Discord's local RPC using your own Discord OAuth app (client id + token, set up in the Gameplay tab). There's a setup tutorial video.

**Q: What are the Tweaks?**
A: Small gameplay/visual toggles: Remove All Checkpoints, Remove Ball Core Particles, Disable Tile Hit Glow, Remove Planet Glow, Disable Auto Pause (auto-play won't pause on focus loss), Block Mouse Wheel Scroll While Playing, and Hide selected Detailed Results rows.

**Q: What is the Optimizer?**
A: Engine/runtime performance toggles the game doesn't expose itself — GC scheduling, OS process priority, background execution. It doesn't change how levels look (that's the Effect Remover). Engine defaults are restored when toggled off.

**Q: What is the Effect Remover?**
A: Strips visual/audio effect events (filters, decorations, camera moves, etc.) from a level as it loads, so heavy charts play clean. While it's on, the editor's Save buttons are disabled (so you don't overwrite the original chart) unless you re-enable saving.

## Features — Overlays / HUD

**Q: What are Panels?**
A: User-composed HUD panels — named, draggable boxes showing the stat lines you choose, with per-panel appearance. Replaces the old fixed Left/Right Status HUD. Use Reorganize mode to drag/position them.

**Q: What stats can overlays show?**
A: Live stats like Accuracy, Attempts, KPS (Auto KPS), Checkpoints, Holds, BPM, and more.

**Q: What is the Combo overlay?**
A: Counts consecutive Perfect (optionally Auto) hits, resetting on any non-Perfect hit, with a center-screen pulse animation.

**Q: What is the Judgement overlay?**
A: Per-judgement hit counters for the run across nine slots: Overload, Too Early, Very Early, Early Perfect, Perfect (+Auto), Late Perfect, Very Late, Too Late, Miss.

**Q: What is the Key Viewer?**
A: An on-screen key viewer overlay. It supports DM Note-style custom CSS (gradients, :before/:after layers, @font-face fonts, transform, filter, transition, blend modes, backdrop-filter) for fully custom key visuals.

**Q: What is the Progress Bar?**
A: A top-of-screen progress bar HUD. Partial/checkpoint runs fill from the checkpoint anchor, not 0%. Rounding/radius is adjustable; draggable in Reorganize mode.

**Q: What is the Song Title overlay?**
A: A customizable in-game song-title overlay that replaces the game's own title label. Uses a `{artist}`/`{title}` format with custom font, size, color, drop shadow, and drag placement.

**Q: What is the UI Hider?**
A: Hides parts of the game's own HUD/UI. Two profiles (Playing / Recording) with independent flag sets, and a rebindable shortcut to flip between them for a clean capture layout.

**Q: What does "Enable Overlays" do?**
A: A master switch that turns the HUD overlays (Combo, Judgement, Song Title, etc.) on or off together.

## Features — Visual / Cosmetic

**Q: What are Planet Colors?**
A: Custom planet (ball) colors. Each of the three planet slots gets its own ball color/opacity and tail color/opacity; special planet skins are disabled while active.

**Q: What is the Otto Icon feature?**
A: Replaces the editor's Otto (auto-play) icon with the mod's own recolored/repositioned sprite.

**Q: What is Nostalgia / Back To The Past?**
A: A faithful port of tjwogud's BackToThePast mod. Reverts modern ADOFAI behavior/visuals/sounds to older versions: legacy result/flash/twirl, hide difficulty/no-fail, old practice mode, SFX mutes, old editor buttons, old menu background, the alpha-warning skip, and the OldXO secret-level easter egg.

**Q: What does the Status / BPM feature track?**
A: BPM math: TBPM (chart bpm × song pitch × system speed) and CBPM (the real current bpm including BPM-change tiles × song pitch).

**Q: What is Play Count?**
A: Per-map tracking: lifetime Total Attempts, Best Progress (highest % ever reached), and a per-session attempt counter. Persisted to `UserData/Quartz/PlayCount.json`.

## Features — Editor

**Q: What editor tweaks are there?**
A: "Horizontal Properties" renders each inspector property as "label [field]" on one row instead of label-above-field, and a selected-tile readout drawing total angle/beats/count/duration of the selection on a tile.

## Troubleshooting

**Q: On Mac the mod replaced my whole folder / files are missing.**
A: Known Mac behavior — the install can replace the folder instead of merging. Reinstall and drag the mod files in manually.

**Q: Should I use the MelonLoader or UMM build?**
A: MelonLoader (`Quartz.zip`) is recommended for everyone. Only use `QuartzUmm.zip` if you already run UnityModManager.

**Q: Auto Deafen isn't working.**
A: It needs your own Discord OAuth app — set the client id + token in the Gameplay tab. Follow the setup tutorial video, and make sure Discord is running locally.

**Q: Something's broken / I found a bug.**
A: It's alpha software. Report it in the Discord (https://discord.gg/mAzAghu5Xq) or on GitHub issues.

**Q: I can't reposition ___.**
A: It's probably in the "Reorganize" menu. In the "Overlay" tab above on top.
