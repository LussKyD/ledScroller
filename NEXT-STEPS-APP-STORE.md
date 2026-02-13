# Next Steps: Wrap LED Scroller for App Stores (Free Tools)

Your app is **free to build and wrap**. These steps use free, open-source tools only. Store fees (Google $25 once, Apple $99/year) apply only when you **publish** to Play Store or App Store.

---

## Prerequisites (all free)

- **Node.js** (LTS) — [nodejs.org](https://nodejs.org)
- **npm** (comes with Node) or **yarn**
- **Android Studio** — for Android builds ([developer.android.com/studio](https://developer.android.com/studio))
- **Xcode** (Mac only) — for iOS builds ([developer.apple.com/xcode](https://developer.apple.com/xcode))
- **Java JDK 17** — for Android (often bundled with Android Studio)

---

## Option A: Capacitor (recommended — one project, both stores)

Capacitor wraps your existing web app in a native shell. One codebase → Android + iOS.

### 1. Install Capacitor CLI

```bash
npm install -g @capacitor/core @capacitor/cli
```

### 2. Create a new Capacitor app

In a **new folder** (e.g. `ledScrollerApp`):

```bash
npm init -y
npm install @capacitor/core @capacitor/cli
npx cap init "LED Scroller" "com.dracoinc.ledscroller"
```

### 3. Copy your web app into the web folder

- Copy everything from your **ledScroller** project into the app’s **web** folder:
  - `index.html` (as entry)
  - `css/`
  - `js/`
  - `assets/`
  - `manifest.json`
- Fix paths if needed (e.g. ensure `./css/style.css`, `./js/LEDScroller.js`, `./assets/` work from the web root).

### 4. Add platforms and sync

```bash
npm install @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios
npx cap sync
```

### 5. Build and run

- **Android:** `npx cap open android` → open in Android Studio → Run on device/emulator.
- **iOS (Mac only):** `npx cap open ios` → open in Xcode → Run on device/simulator.

### 6. When ready for store submission

- **Android:** In Android Studio: Build → Generate Signed Bundle / APK → follow wizard. Upload the AAB to Google Play Console.
- **iOS:** In Xcode: Product → Archive → Distribute App → App Store Connect.

---

## Option B: Cordova (alternative — one project, both stores)

Cordova is older but still free and widely used. Same idea: wrap your web app.

### 1. Install Cordova CLI

```bash
npm install -g cordova
```

### 2. Create a Cordova project

```bash
cordova create ledScrollerApp com.dracoinc.ledscroller "LED Scroller"
cd ledScrollerApp
```

### 3. Replace the default www with your app

- Delete contents of `www/` (keep the folder).
- Copy into `www/`: `index.html`, `css/`, `js/`, `assets/`, `manifest.json`.
- Set `index.html` as the start page (already default if it’s `www/index.html`).

### 4. Add platforms

```bash
cordova platform add android
cordova platform add ios
```

### 5. Build and run

```bash
cordova build android
cordova run android

cordova build ios
cordova run ios
```

### 6. Store builds

- **Android:** `cordova build android --release` (then sign the APK/AAB for Play Store).
- **iOS:** Open `platforms/ios` in Xcode → Archive → Distribute to App Store.

---

## Option C: TWA / Bubblewrap (Google Play only, PWA-style)

Use this if you only care about **Google Play** and want the app to be your **live PWA URL** in a Trusted Web Activity (no separate web bundle to update in the app).

### 1. Install Bubblewrap

```bash
npm install -g @bubblewrap/cli
```

### 2. Ensure your PWA is online and valid

- Host LED Scroller on **HTTPS** (e.g. GitHub Pages).
- Your `manifest.json` and a service worker (optional but recommended) should be valid.

### 3. Generate TWA project

```bash
bubblewrap init --manifest=https://YOUR-SITE-URL/manifest.json
```

Follow prompts (package name, signing key, etc.). This creates an Android project.

### 4. Build and run

```bash
cd ledscroller-app
./gradlew assembleRelease
```

Sign the release APK/AAB and upload to Google Play Console.

### 5. Limitation

- **Android only.** For Apple App Store you need Capacitor or Cordova (Option A or B).

---

## Quick comparison

| Tool           | Android | iOS | Best for                          |
|----------------|--------|-----|-----------------------------------|
| **Capacitor**  | ✅     | ✅  | One codebase, both stores         |
| **Cordova**    | ✅     | ✅  | Same; alternative to Capacitor    |
| **TWA/Bubblewrap** | ✅  | ❌  | Play Store only, live PWA URL     |

---

## After wrapping (still free until you publish)

- Test on real devices.
- Set app icon and splash in Capacitor/Cordova config.
- Add a **privacy policy** URL (required by both stores).
- When ready: pay **Google $25** (one-time) and/or **Apple $99/year**, then submit.

---

## Summary

- **Making and wrapping the app:** free (Capacitor, Cordova, TWA/Bubblewrap + your LED Scroller).
- **Publishing:** Google Play $25 once; App Store $99/year.
- **Recommended path:** use **Capacitor** (Option A) to target both stores from one project.
