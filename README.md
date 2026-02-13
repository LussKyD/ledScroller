# LED Scroller by DRACOiNC Techs

A retro-style LED dot-matrix marquee app: type a message, pick a color, and display a scrolling or static sign. Built with lean, single-file UMD React, HTML, and CSS — no build step.

### Features
* **Dynamic text** — Any message; quick presets (Welcome, We're Open, Back in 5, Sale).
* **Scroll or static** — Scrolling marquee or centered static display.
* **LED color** — Presets (red, green, blue, yellow, white) plus custom hex input.
* **Adjustable speed** — Scroll speed 1–10 (when in scroll mode).
* **Blink effect** — Optional blink toggle (respects `prefers-reduced-motion`).
* **Dark / light theme** — Toggle with persistence.
* **Shareable links** — “Copy link” builds a URL that restores message, color, speed, blink, and mode; open in another device or share your sign.
* **Keyboard** — Escape exits the scroller view.
* **PWA-friendly** — `manifest.json` and meta tags for “Add to Home Screen” and rich previews.
* **Accessibility** — Focus styles, reduced-motion support, semantic markup.

Notes:
* Theme, message, speed, color, blink, and display mode are saved to localStorage when available.
* If localStorage is unavailable (e.g. private browsing), a notice is shown and preferences are not persisted.
* Splash dismisses after 1.2s or on first tap/click.
* Designed for GitHub Pages and as a base for WebView/Capacitor/Cordova apps.
