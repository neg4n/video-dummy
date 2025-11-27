<!-- Drop your demo video/gif embed here -->

# video-dummy

A retro-styled, browser-native FFmpeg sandbox that spits out dummy clips for QA/SDET workflows. Everything renders on your machine - zero uploads, zero backend.

## Highlights
- 🎥 Generate MP4/WebM clips with custom resolution (up to 7680x4320), background color, and animated edge-bouncing text.
- 🧪 Built for QA/SDET: predictable frames (6 fps), easy aspect labels, repeatable renders for player/CDN/UI regression tests.
- 🛡️ Fully local: FFmpeg ships as WebAssembly and loads during idle time; renders never leave the browser.
- 🧭 Guided tour + retro UI: @zag-js tour, tactile controls, instant aspect + validation via RHF + Zod.
- ⚡ Zero setup: no system ffmpeg, no server; works offline after the first core download.

## Why FFmpeg in the browser?
- Moving FFmpeg from servers/CI into the tab kills queues, API limits, and data exfiltration risk.
- QA can A/B player behavior on real devices with production-like codecs without provisioning infra.
- Latency drops to zero: iterate by typing - rendering - playing, all inside the browser.

## Using the tool
- **Video Settings:** width/height, text, hex background, choose MP4 (H.264) or WebM (VP8).
- **Generate:** button switches to “Regenerate Video” after the first render.
- **Preview:** aspect-ratio-safe canvas; playback stays in-page.
- **Download:** name your file and save locally.
- **Tour & info:** “?” restarts the tour; “i” explains the local-only pipeline.

## How it works
- `@ffmpeg/ffmpeg` + `@ffmpeg/util` load the wasm core via `toBlobURL`, cached in-memory.
- Renders are pure FFmpeg CLI: lavfi color source + `drawtext` animation along all four edges.
- Validation by `react-hook-form` + Zod; retro controls built with @zag-js primitives and Tailwind.

## License
MIT © Igor Klepacki / neg4n
