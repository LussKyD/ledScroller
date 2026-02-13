# LED Scroller by DRACOiNC Techs 

A retro-style LED Dot-Matrix Scroller application built with lean, single-file UMD React, HTML, and CSS.

### Features
* Dynamic Text Input
* Adjustable Scrolling Speed
* Multiple LED Color Options
* Blink Effect Toggle
* Dark/Light Mode Theme Toggle
* Splash screen with a smooth fade-out 
* **Performance Fixes:** Uses CSS Custom Properties for animation control to prevent memory leaks from dynamic keyframe injection.

Notes:
- Theme, message, speed, LED color, and blink preference are saved to localStorage (when available).
- If localStorage is unavailable (e.g. private browsing), a notice is shown and preferences are not persisted.
- Splash screen dismisses after 1.2s or on first tap/click.
- The single-file React UMD bundle is designed for fast deployment via GitHub Pages and is a great starting point for a cross-platform application (i.e., via WebView or Capacitor/Cordova for mobile app stores).
