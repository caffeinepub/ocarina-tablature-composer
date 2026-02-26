# Specification

## Summary
**Goal:** Expand preset songs with more popular melodies and a new Reggae genre, fix preset playback to use ocarina audio, add a save/load Sound Presets feature, and enforce a consistent 4-hole 2×2 layout throughout the app.

**Planned changes:**
- Add more preset songs to Folk, Rock, Electronic, and Reggaeton genres (at least 3–4 each) using popular melodies adapted for 4-hole ocarina in the C5–C6 range
- Add a new "Reggae" genre with at least 2 preset songs based on popular reggae melodies (e.g., Bob Marley classics) adapted for ocarina
- Fix preset song playback in the Song Editor to use ocarina audio synthesis (sine/triangle with reverb) instead of piano-style synthesis
- Add backend support to save, list, and delete named sound presets (tone, reverb, pitch offset, optional ocarina image filename)
- Add a Sound Presets UI panel in/alongside Sound Settings: save current settings as a named preset, view all saved presets, load a preset to apply its sound settings and optional image, and delete presets
- Ensure OcarinaVisual SVG and TablatureSymbol consistently render exactly 4 holes in a 2×2 grid (top-left, top-right, bottom-left, bottom-right) with no thumb or extra holes

**User-visible outcome:** Users see more preset songs across all genres plus a new Reggae genre, preset playback sounds like an ocarina, they can save and reload named sound configurations (including custom ocarina images), and all hole diagrams consistently show the 4-hole 2×2 layout.
